// 类型依赖 { Anthropic } 来自 @anthropic-ai/sdk，用于校准服务层 token Estimation的数据契约。
import type { Anthropic } from '@anthropic-ai/sdk'
// 类型依赖 { BetaMessageParam as MessageParam } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准服务层 token Estimation的数据契约。
import type { BetaMessageParam as MessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// @aws-sdk/client-bedrock-runtime is imported dynamically in countTokensWithBedrock()
// to defer ~279KB of AWS SDK code until a Bedrock call is actually made
// 类型依赖 { CountTokensCommandInput } 来自 @aws-sdk/client-bedrock-runtime，用于校准服务层 token Estimation的数据契约。
import type { CountTokensCommandInput } from '@aws-sdk/client-bedrock-runtime'
// 复用 getAPIProvider 工具函数，把通用处理留在 src/utils/model/providers.js 中维护。
import { getAPIProvider } from 'src/utils/model/providers.js'
// 引入 VERTEX_COUNT_TOKENS_ALLOWED_BETAS，将 ../constants/betas.js 中已经封装好的能力接到本文件流程里。
import { VERTEX_COUNT_TOKENS_ALLOWED_BETAS } from '../constants/betas.js'
// 类型依赖 { Attachment } 来自 ../utils/attachments.js，用于校准服务层 token Estimation的数据契约。
import type { Attachment } from '../utils/attachments.js'
// 复用 getModelBetas 工具函数，把通用处理留在 ../utils/betas.js 中维护。
import { getModelBetas } from '../utils/betas.js'
// 复用 getVertexRegionForModel、isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { getVertexRegionForModel, isEnvTruthy } from '../utils/envUtils.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 normalizeAttachmentForAPI 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { normalizeAttachmentForAPI } from '../utils/messages.js'
// 整理这一组导入，让服务层 token Estimation后续逻辑可以直接复用这些外部能力。
import {
  createBedrockRuntimeClient,
  getInferenceProfileBackingModel,
  isFoundationModel,
} from '../utils/model/bedrock.js'
// 整理这一组导入，让服务层 token Estimation后续逻辑可以直接复用这些外部能力。
import {
  getDefaultSonnetModel,
  getMainLoopModel,
  getSmallFastModel,
  normalizeModelStringForAPI,
} from '../utils/model/model.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 复用 isToolReferenceBlock 工具函数，把通用处理留在 ../utils/toolSearch.js 中维护。
import { isToolReferenceBlock } from '../utils/toolSearch.js'
// 引入 getAPIMetadata、getExtraBodyParams，将 ./api/claude.js 中已经封装好的能力接到本文件流程里。
import { getAPIMetadata, getExtraBodyParams } from './api/claude.js'
// 引入 getAnthropicClient，将 ./api/client.js 中已经封装好的能力接到本文件流程里。
import { getAnthropicClient } from './api/client.js'
// 引入 withTokenCountVCR，将 ./vcr.js 中已经封装好的能力接到本文件流程里。
import { withTokenCountVCR } from './vcr.js'

// Minimal values for token counting with thinking enabled
// API constraint: max_tokens must be greater than thinking.budget_tokens
// TOKEN_COUNT_THINKING_BUDGET 数量 命名 `1024`，让后续代码直接表达这个值的用途。
const TOKEN_COUNT_THINKING_BUDGET = 1024
// TOKEN_COUNT_MAX_TOKENS 数量 命名 `2048`，让后续代码直接表达这个值的用途。
const TOKEN_COUNT_MAX_TOKENS = 2048

/**
 * Check if messages contain thinking blocks
 */
// hasThinkingBlocks 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasThinkingBlocks(
  messages: Anthropic.Beta.Messages.BetaMessageParam[],
): boolean {
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 token Estimation处理。
  for (const message of messages) {
    // 组合条件 `message.role === 'assistant' && Array.isArray(message.content)` 成立时，服务层 token Estimation才启用这条专门路径。
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      // 按顺序遍历 `message.content` 中的block，逐个交给服务层 token Estimation处理。
      for (const block of message.content) {
        // 服务层 token Estimation在这里进入条件判断，后续代码按实际状态分流。
        if (
          typeof block === 'object' &&
          block !== null &&
          'type' in block &&
          (block.type === 'thinking' || block.type === 'redacted_thinking')
        ) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Strip tool search-specific fields from messages before sending for token counting.
 * This removes 'caller' from tool_use blocks and 'tool_reference' from tool_result content.
 * These fields are only valid with the tool search beta and will cause errors otherwise.
 *
 * Note: We use 'as unknown as' casts because the SDK types don't include tool search beta fields,
 * but at runtime these fields may exist from API responses when tool search was enabled.
 */
// stripToolSearchFieldsFromMessages 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripToolSearchFieldsFromMessages(
  messages: Anthropic.Beta.Messages.BetaMessageParam[],
): Anthropic.Beta.Messages.BetaMessageParam[] {
  // 返回 `messages.map(message => {`，作为服务层 token Estimation这次计算的结果。
  return messages.map(message => {
    // 满足 `!Array.isArray(message.content)` 时，服务层 token Estimation执行该分支。
    if (!Array.isArray(message.content)) {
      // 返回 `message`，作为服务层 token Estimation这次计算的结果。
      return message
    }

    // normalizedContent派生`content.map`，供服务层 token Estimation后续处理使用。
    const normalizedContent = message.content.map(block => {
      // Strip 'caller' from tool_use blocks (assistant messages)
      // 当 `block.type` 匹配 `'tool_use'` 时，服务层 token Estimation执行对应分支。
      if (block.type === 'tool_use') {
        // Destructure to exclude any extra fields like 'caller'
        // toolUse 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const toolUse =
          block as Anthropic.Beta.Messages.BetaToolUseBlockParam & {
            caller?: unknown
          }
        // 返回结构化结果，集中表达服务层 token Estimation已经整理出的状态。
        return {
          type: 'tool_use' as const,
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input,
        }
      }

      // Strip tool_reference blocks from tool_result content (user messages)
      // 当 `block.type` 匹配 `'tool_result'` 时，服务层 token Estimation执行对应分支。
      if (block.type === 'tool_result') {
        // toolResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const toolResult =
          block as Anthropic.Beta.Messages.BetaToolResultBlockParam
        // 满足 `Array.isArray(toolResult.content)` 时，服务层 token Estimation执行该分支。
        if (Array.isArray(toolResult.content)) {
          // filteredContent筛选`filter`，供服务层 token Estimation后续处理使用。
          const filteredContent = (toolResult.content as unknown[]).filter(
            // c更新为 `> !isToolReferenceBlock(c)`，确保服务层后续读取最新状态。
            c => !isToolReferenceBlock(c),
          ) as typeof toolResult.content

          // filteredContent为空时立即返回或跳过，避免服务层 token Estimation把空集合当成可处理内容。
          if (filteredContent.length === 0) {
            // 返回结构化结果，集中表达服务层 token Estimation已经整理出的状态。
            return {
              ...toolResult,
              content: [{ type: 'text' as const, text: '[tool references]' }],
            }
          }
          // `filteredContent.length` 与 `toolResult.content.len` 不一致时刷新派生状态，避免使用过期结果。
          if (filteredContent.length !== toolResult.content.length) {
            // 返回结构化结果，集中表达服务层 token Estimation已经整理出的状态。
            return {
              ...toolResult,
              content: filteredContent,
            }
          }
        }
      }

      // 返回 `block`，作为服务层 token Estimation这次计算的结果。
      return block
    })

    // 返回结构化结果，集中表达服务层 token Estimation已经整理出的状态。
    return {
      ...message,
      content: normalizedContent,
    }
  })
}

// countTokensWithAPI 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function countTokensWithAPI(
  content: string,
): Promise<number | null> {
  // Special case for empty content - API doesn't accept empty messages
  // 文本内容缺失时提前走兜底路径，避免服务层 token Estimation继续依赖无效输入。
  if (!content) {
    // 返回 `0`，作为服务层 token Estimation这次计算的结果。
    return 0
  }

  // 消息 集中保存服务层 token Estimation要一起传递的字段。
  const message: Anthropic.Beta.Messages.BetaMessageParam = {
    role: 'user',
    content: content,
  }

  // 返回 `countMessagesTokensWithAPI([message], [])`，作为服务层 token Estimation这次计算的结果。
  return countMessagesTokensWithAPI([message], [])
}

// countMessagesTokensWithAPI 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function countMessagesTokensWithAPI(
  messages: Anthropic.Beta.Messages.BetaMessageParam[],
  tools: Anthropic.Beta.Messages.BetaToolUnion[],
): Promise<number | null> {
  // 返回 `withTokenCountVCR(messages, tools, async () => {`，作为服务层 token Estimation这次计算的结果。
  return withTokenCountVCR(messages, tools, async () => {
    // 保护这一段可能失败的服务层 token Estimation操作，确保异常能进入相邻错误处理。
    try {
      // 模型名称读取`getMainLoopModel`，供服务层 token Estimation后续处理使用。
      const model = getMainLoopModel()
      // betas 集合读取`getModelBetas`，供服务层 token Estimation后续处理使用。
      const betas = getModelBetas(model)
      // containsThinking保存`hasThinkingBlocks`，供服务层 token Estimation后续处理使用。
      const containsThinking = hasThinkingBlocks(messages)

      // 当 `getAPIProvider()` 匹配 `'bedrock'` 时，服务层 token Estimation执行对应分支。
      if (getAPIProvider() === 'bedrock') {
        // @anthropic-sdk/bedrock-sdk doesn't support countTokens currently
        // 返回 `countTokensWithBedrock({`，作为服务层 token Estimation这次计算的结果。
        return countTokensWithBedrock({
          model: normalizeModelStringForAPI(model),
          messages,
          tools,
          betas,
          containsThinking,
        })
      }

      // anthropic读取`getAnthropicClient`，供服务层 token Estimation后续处理使用。
      const anthropic = await getAnthropicClient({
        maxRetries: 1,
        model,
        source: 'count_tokens',
      })

      // filteredBetas 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const filteredBetas =
        getAPIProvider() === 'vertex'
          // 这个回调绑定到 ? betas.filter(b => VERTEX_COUNT_TOKENS_ALLOWED_BETAS.has(b))，负责服务层 token Estimation在该局部场景下的响应。
          ? betas.filter(b => VERTEX_COUNT_TOKENS_ALLOWED_BETAS.has(b))
          : betas

      // 接口响应统计`messages.countTokens`，供服务层 token Estimation后续处理使用。
      const response = await anthropic.beta.messages.countTokens({
        model: normalizeModelStringForAPI(model),
        messages:
          // When we pass tools and no messages, we need to pass a dummy message
          // to get an accurate tool token count.
          messages.length > 0 ? messages : [{ role: 'user', content: 'foo' }],
        tools,
        ...(filteredBetas.length > 0 && { betas: filteredBetas }),
        // Enable thinking if messages contain thinking blocks
        ...(containsThinking && {
          thinking: {
            type: 'enabled',
            budget_tokens: TOKEN_COUNT_THINKING_BUDGET,
          },
        }),
      })

      // `typeof response.input_tokens` 与 `'number'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof response.input_tokens !== 'number') {
        // Vertex client throws
        // Bedrock client succeeds with { Output: { __type: 'com.amazon.coral.service#UnknownOperationException' }, Version: '1.0' }
        // 返回 `null`，作为服务层 token Estimation这次计算的结果。
        return null
      }

      // 返回 `response.input_tokens`，作为服务层 token Estimation这次计算的结果。
      return response.input_tokens
    } catch (error) {
      // 记录服务层 token Estimation运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 返回 `null`，作为服务层 token Estimation这次计算的结果。
      return null
    }
  })
}

// roughTokenCountEstimation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function roughTokenCountEstimation(
  content: string,
  bytesPerToken: number = 4,
): number {
  // 返回 `Math.round(content.length / bytesPerToken)`，作为服务层 token Estimation这次计算的结果。
  return Math.round(content.length / bytesPerToken)
}

/**
 * Returns an estimated bytes-per-token ratio for a given file extension.
 * Dense JSON has many single-character tokens (`{`, `}`, `:`, `,`, `"`)
 * which makes the real ratio closer to 2 rather than the default 4.
 */
// bytesPerTokenForFileType 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function bytesPerTokenForFileType(fileExtension: string): number {
  // 按照 fileExtension 的取值选择服务层 token Estimation的具体处理分支。
  switch (fileExtension) {
    case 'json':
    case 'jsonl':
    case 'jsonc':
      // 返回 `2`，作为服务层 token Estimation这次计算的结果。
      return 2
    default:
      // 返回 `4`，作为服务层 token Estimation这次计算的结果。
      return 4
  }
}

/**
 * Like {@link roughTokenCountEstimation} but uses a more accurate
 * bytes-per-token ratio when the file type is known.
 *
 * This matters when the API-based token count is unavailable (e.g. on
 * Bedrock) and we fall back to the rough estimate — an underestimate can
 * let an oversized tool result slip into the conversation.
 */
// roughTokenCountEstimationForFileType 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function roughTokenCountEstimationForFileType(
  content: string,
  fileExtension: string,
): number {
  // 返回 `roughTokenCountEstimation(`，作为服务层 token Estimation这次计算的结果。
  return roughTokenCountEstimation(
    content,
    bytesPerTokenForFileType(fileExtension),
  )
}

/**
 * Estimates token count for a Message object by extracting and analyzing its text content.
 * This provides a more reliable estimate than getTokenUsage for messages that may have been compacted.
 * Uses Haiku for token counting (Haiku 4.5 supports thinking blocks), except:
 * - Vertex global region: uses Sonnet (Haiku not available)
 * - Bedrock with thinking blocks: uses Sonnet (Haiku 3.5 doesn't support thinking)
 */
// countTokensViaHaikuFallback 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function countTokensViaHaikuFallback(
  messages: Anthropic.Beta.Messages.BetaMessageParam[],
  tools: Anthropic.Beta.Messages.BetaToolUnion[],
): Promise<number | null> {
  // Check if messages contain thinking blocks
  // containsThinking保存`hasThinkingBlocks`，供服务层 token Estimation后续处理使用。
  const containsThinking = hasThinkingBlocks(messages)

  // If we're on Vertex and using global region, always use Sonnet since Haiku is not available there.
  // isVertexGlobalEndpoint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isVertexGlobalEndpoint =
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) &&
    getVertexRegionForModel(getSmallFastModel()) === 'global'
  // If we're on Bedrock with thinking blocks, use Sonnet since Haiku 3.5 doesn't support thinking
  // isBedrockWithThinking 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isBedrockWithThinking =
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) && containsThinking
  // If we're on Vertex with thinking blocks, use Sonnet since Haiku 3.5 doesn't support thinking
  // isVertexWithThinking 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isVertexWithThinking =
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) && containsThinking
  // Otherwise always use Haiku - Haiku 4.5 supports thinking blocks.
  // WARNING: if you change this to use a non-Haiku model, this request will fail in 1P unless it uses getCLISyspromptPrefix.
  // Note: We don't need Sonnet for tool_reference blocks because we strip them via
  // stripToolSearchFieldsFromMessages() before sending.
  // Use getSmallFastModel() to respect ANTHROPIC_SMALL_FAST_MODEL env var for Bedrock users
  // with global inference profiles (see issue #10883).
  // model 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const model =
    isVertexGlobalEndpoint || isBedrockWithThinking || isVertexWithThinking
      ? getDefaultSonnetModel()
      : getSmallFastModel()
  // anthropic读取`getAnthropicClient`，供服务层 token Estimation后续处理使用。
  const anthropic = await getAnthropicClient({
    maxRetries: 1,
    model,
    source: 'count_tokens',
  })

  // Strip tool search-specific fields (caller, tool_reference) before sending
  // These fields are only valid with the tool search beta header
  // normalizedMessages 消息数据保存`stripToolSearchFieldsFromMessages`，供服务层 token Estimation后续处理使用。
  const normalizedMessages = stripToolSearchFieldsFromMessages(messages)

  // messagesToSend 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  const messagesToSend: MessageParam[] =
    normalizedMessages.length > 0
      ? (normalizedMessages as MessageParam[])
      : [{ role: 'user', content: 'count' }]

  // betas 集合读取`getModelBetas`，供服务层 token Estimation后续处理使用。
  const betas = getModelBetas(model)
  // Filter betas for Vertex - some betas (like web-search) cause 400 errors
  // on certain Vertex endpoints. See issue #10789.
  // filteredBetas 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const filteredBetas =
    getAPIProvider() === 'vertex'
      // 这个回调绑定到 ? betas.filter(b => VERTEX_COUNT_TOKENS_ALLOWED_BETAS.has(b))，负责服务层 token Estimation在该局部场景下的响应。
      ? betas.filter(b => VERTEX_COUNT_TOKENS_ALLOWED_BETAS.has(b))
      : betas

  // biome-ignore lint/plugin: token counting needs specialized parameters (thinking, betas) that sideQuery doesn't support
  // 接口响应构建`messages.create`，供服务层 token Estimation后续处理使用。
  const response = await anthropic.beta.messages.create({
    model: normalizeModelStringForAPI(model),
    max_tokens: containsThinking ? TOKEN_COUNT_MAX_TOKENS : 1,
    messages: messagesToSend,
    tools: tools.length > 0 ? tools : undefined,
    ...(filteredBetas.length > 0 && { betas: filteredBetas }),
    metadata: getAPIMetadata(),
    ...getExtraBodyParams(),
    // Enable thinking if messages contain thinking blocks
    ...(containsThinking && {
      thinking: {
        type: 'enabled',
        budget_tokens: TOKEN_COUNT_THINKING_BUDGET,
      },
    }),
  })

  // usage 命名 `response.usage`，让后续代码直接表达这个值的用途。
  const usage = response.usage
  // inputTokens 集合 命名 `usage.input_tokens`，让后续代码直接表达这个值的用途。
  const inputTokens = usage.input_tokens
  // cacheCreationTokens 缓存标记服务层 token Estimation是否启用对应路径。
  const cacheCreationTokens = usage.cache_creation_input_tokens || 0
  // cacheReadTokens 缓存标记服务层 token Estimation是否启用对应路径。
  const cacheReadTokens = usage.cache_read_input_tokens || 0

  // 返回 `inputTokens + cacheCreationTokens + cacheReadTokens`，作为服务层 token Estimation这次计算的结果。
  return inputTokens + cacheCreationTokens + cacheReadTokens
}

// roughTokenCountEstimationForMessages 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function roughTokenCountEstimationForMessages(
  messages: readonly {
    type: string
    message?: { content?: unknown }
    attachment?: Attachment
  }[],
): number {
  // totalTokens 集合保存`0`，供后续判断或组装使用。
  let totalTokens = 0
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 token Estimation处理。
  for (const message of messages) {
    // 服务层 token Estimation在这里处理 `totalTokens += roughTokenCountEstimationForMessage(message)`，完成这一小步状态转换。
    totalTokens += roughTokenCountEstimationForMessage(message)
  }
  // 返回 `totalTokens`，作为服务层 token Estimation这次计算的结果。
  return totalTokens
}

// roughTokenCountEstimationForMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function roughTokenCountEstimationForMessage(message: {
  type: string
  message?: { content?: unknown }
  attachment?: Attachment
}): number {
  // 服务层 token Estimation在这里进入条件判断，后续代码按实际状态分流。
  if (
    (message.type === 'assistant' || message.type === 'user') &&
    message.message?.content
  ) {
    // 返回 `roughTokenCountEstimationForContent(`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimationForContent(
      message.message?.content as
        | string
        | Array<Anthropic.ContentBlock>
        | Array<Anthropic.ContentBlockParam>
        | undefined,
    )
  }

  // 组合条件 `message.type === 'attachment' && message.attachme` 成立时，服务层 token Estimation才启用这条专门路径。
  if (message.type === 'attachment' && message.attachment) {
    // userMessages 消息数据保存`normalizeAttachmentForAPI`，供服务层 token Estimation后续处理使用。
    const userMessages = normalizeAttachmentForAPI(message.attachment)
    // total 命名 `0`，让后续代码直接表达这个值的用途。
    let total = 0
    // 按顺序遍历 `userMessages` 中的userMsg，逐个交给服务层 token Estimation处理。
    for (const userMsg of userMessages) {
      // 服务层 token Estimation在这里处理 `total += roughTokenCountEstimationForContent(userMsg.message.content)`，完成这一小步状态转换。
      total += roughTokenCountEstimationForContent(userMsg.message.content)
    }
    // 返回 `total`，作为服务层 token Estimation这次计算的结果。
    return total
  }

  // 返回 `0`，作为服务层 token Estimation这次计算的结果。
  return 0
}

// roughTokenCountEstimationForContent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function roughTokenCountEstimationForContent(
  content:
    | string
    | Array<Anthropic.ContentBlock>
    | Array<Anthropic.ContentBlockParam>
    | undefined,
): number {
  // 文本内容缺失时提前走兜底路径，避免服务层 token Estimation继续依赖无效输入。
  if (!content) {
    // 返回 `0`，作为服务层 token Estimation这次计算的结果。
    return 0
  }
  // 当 `typeof content` 匹配 `'string'` 时，服务层 token Estimation执行对应分支。
  if (typeof content === 'string') {
    // 返回 `roughTokenCountEstimation(content)`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimation(content)
  }
  // totalTokens 集合保存`0`，供后续判断或组装使用。
  let totalTokens = 0
  // 按顺序遍历 `content` 中的block，逐个交给服务层 token Estimation处理。
  for (const block of content) {
    // 服务层 token Estimation在这里处理 `totalTokens += roughTokenCountEstimationForBlock(block)`，完成这一小步状态转换。
    totalTokens += roughTokenCountEstimationForBlock(block)
  }
  // 返回 `totalTokens`，作为服务层 token Estimation这次计算的结果。
  return totalTokens
}

// roughTokenCountEstimationForBlock 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function roughTokenCountEstimationForBlock(
  block: string | Anthropic.ContentBlock | Anthropic.ContentBlockParam,
): number {
  // 当 `typeof block` 匹配 `'string'` 时，服务层 token Estimation执行对应分支。
  if (typeof block === 'string') {
    // 返回 `roughTokenCountEstimation(block)`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimation(block)
  }
  // 当 `block.type` 匹配 `'text'` 时，服务层 token Estimation执行对应分支。
  if (block.type === 'text') {
    // 返回 `roughTokenCountEstimation(block.text)`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimation(block.text)
  }
  // 组合条件 `block.type === 'image' || block.type === 'documen` 成立时，服务层 token Estimation才启用这条专门路径。
  if (block.type === 'image' || block.type === 'document') {
    // https://platform.claude.com/docs/en/build-with-claude/vision#calculate-image-costs
    // tokens = (width px * height px)/750
    // Images are resized to max 2000x2000 (5333 tokens). Use a conservative
    // estimate that matches microCompact's IMAGE_MAX_TOKEN_SIZE to avoid
    // underestimating and triggering auto-compact too late.
    //
    // document: base64 PDF in source.data.  Must NOT reach the
    // jsonStringify catch-all — a 1MB PDF is ~1.33M base64 chars →
    // ~325k estimated tokens, vs the ~2000 the API actually charges.
    // Same constant as microCompact's calculateToolResultTokens.
    // 返回 `2000`，作为服务层 token Estimation这次计算的结果。
    return 2000
  }
  // 当 `block.type` 匹配 `'tool_result'` 时，服务层 token Estimation执行对应分支。
  if (block.type === 'tool_result') {
    // 返回 `roughTokenCountEstimationForContent(block.content)`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimationForContent(block.content)
  }
  // 当 `block.type` 匹配 `'tool_use'` 时，服务层 token Estimation执行对应分支。
  if (block.type === 'tool_use') {
    // input is the JSON the model generated — arbitrarily large (bash
    // commands, Edit diffs, file contents).  Stringify once for the
    // char count; the API re-serializes anyway so this is what it sees.
    // 返回 `roughTokenCountEstimation(`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimation(
      block.name + jsonStringify(block.input ?? {}),
    )
  }
  // 当 `block.type` 匹配 `'thinking'` 时，服务层 token Estimation执行对应分支。
  if (block.type === 'thinking') {
    // 返回 `roughTokenCountEstimation(block.thinking)`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimation(block.thinking)
  }
  // 当 `block.type` 匹配 `'redacted_thinking'` 时，服务层 token Estimation执行对应分支。
  if (block.type === 'redacted_thinking') {
    // 返回 `roughTokenCountEstimation(block.data)`，作为服务层 token Estimation这次计算的结果。
    return roughTokenCountEstimation(block.data)
  }
  // server_tool_use, web_search_tool_result, mcp_tool_use, etc. —
  // text-like payloads (tool inputs, search results, no base64).
  // Stringify-length tracks the serialized form the API sees; the
  // key/bracket overhead is single-digit percent on real blocks.
  // 返回 `roughTokenCountEstimation(jsonStringify(block))`，作为服务层 token Estimation这次计算的结果。
  return roughTokenCountEstimation(jsonStringify(block))
}

// countTokensWithBedrock 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function countTokensWithBedrock({
  model,
  messages,
  tools,
  betas,
  containsThinking,
}: {
  model: string
  messages: Anthropic.Beta.Messages.BetaMessageParam[]
  tools: Anthropic.Beta.Messages.BetaToolUnion[]
  betas: string[]
  containsThinking: boolean
}): Promise<number | null> {
  // 保护这一段可能失败的服务层 token Estimation操作，确保异常能进入相邻错误处理。
  try {
    // API 客户端构建`createBedrockRuntimeClient`，供服务层 token Estimation后续处理使用。
    const client = await createBedrockRuntimeClient()
    // Bedrock CountTokens requires a model ID, not an inference profile / ARN
    // modelId保存`isFoundationModel`，供服务层 token Estimation后续处理使用。
    const modelId = isFoundationModel(model)
      ? model
      : await getInferenceProfileBackingModel(model)
    // modelId缺失时提前走兜底路径，避免服务层 token Estimation继续依赖无效输入。
    if (!modelId) {
      // 返回 `null`，作为服务层 token Estimation这次计算的结果。
      return null
    }

    // requestBody 请求数据 集中保存服务层 token Estimation要一起传递的字段。
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      // When we pass tools and no messages, we need to pass a dummy message
      // to get an accurate tool token count.
      messages:
        messages.length > 0 ? messages : [{ role: 'user', content: 'foo' }],
      max_tokens: containsThinking ? TOKEN_COUNT_MAX_TOKENS : 1,
      ...(tools.length > 0 && { tools }),
      ...(betas.length > 0 && { anthropic_beta: betas }),
      ...(containsThinking && {
        thinking: {
          type: 'enabled',
          budget_tokens: TOKEN_COUNT_THINKING_BUDGET,
        },
      }),
    }

    // 从 `await import(` 解构 CountTokensCommand，减少服务层 token Estimation对同一对象的重复访问。
    const { CountTokensCommand } = await import(
      '@aws-sdk/client-bedrock-runtime'
    )
    // 用户输入 集中保存服务层 token Estimation要一起传递的字段。
    const input: CountTokensCommandInput = {
      modelId,
      input: {
        invokeModel: {
          body: new TextEncoder().encode(jsonStringify(requestBody)),
        },
      },
    }
    // 接口响应保存`client.send`，供服务层 token Estimation后续处理使用。
    const response = await client.send(new CountTokensCommand(input))
    // tokenCount 数量 命名 `response.inputTokens ?? null`，让后续代码直接表达这个值的用途。
    const tokenCount = response.inputTokens ?? null
    // 返回 `tokenCount`，作为服务层 token Estimation这次计算的结果。
    return tokenCount
  } catch (error) {
    // 记录服务层 token Estimation运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为服务层 token Estimation这次计算的结果。
    return null
  }
}
