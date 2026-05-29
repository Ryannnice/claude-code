// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from '@anthropic-ai/sdk'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import type {
  BetaMessage,
  BetaStopReason,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 引入 AFK_MODE_BETA_HEADER，将 src/constants/betas.js 中已经封装好的能力接到本文件流程里。
import { AFK_MODE_BETA_HEADER } from 'src/constants/betas.js'
// 类型依赖 { SDKAssistantMessageError } 来自 src/entrypoints/agentSdkTypes.js，用于校准API 服务 errors的数据契约。
import type { SDKAssistantMessageError } from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  UserMessage,
} from 'src/types/message.js'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import {
  getAnthropicApiKeyWithSource,
  getClaudeAIOAuthTokens,
  getOauthAccountInfo,
  isClaudeAISubscriber,
} from 'src/utils/auth.js'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import {
  createAssistantAPIErrorMessage,
  NO_RESPONSE_REQUESTED,
} from 'src/utils/messages.js'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import {
  getDefaultMainLoopModelSetting,
  isNonCustomOpusModel,
} from 'src/utils/model/model.js'
// 复用 getModelStrings 工具函数，把通用处理留在 src/utils/model/modelStrings.js 中维护。
import { getModelStrings } from 'src/utils/model/modelStrings.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 src/utils/model/providers.js 中维护。
import { getAPIProvider } from 'src/utils/model/providers.js'
// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import {
  API_PDF_MAX_PAGES,
  PDF_TARGET_RAW_SIZE,
} from '../../constants/apiLimits.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 formatFileSize 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatFileSize } from '../../utils/format.js'
// 复用 ImageResizeError 工具函数，把通用处理留在 ../../utils/imageResizer.js 中维护。
import { ImageResizeError } from '../../utils/imageResizer.js'
// 复用 ImageSizeError 工具函数，把通用处理留在 ../../utils/imageValidation.js 中维护。
import { ImageSizeError } from '../../utils/imageValidation.js'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让API 服务 errors后续逻辑可以直接复用这些外部能力。
import {
  type ClaudeAILimits,
  getRateLimitErrorMessage,
  type OverageDisabledReason,
} from '../claudeAiLimits.js'
// 引入 shouldProcessRateLimits，将 ../rateLimitMocking.js 中已经封装好的能力接到本文件流程里。
import { shouldProcessRateLimits } from '../rateLimitMocking.js' // Used for /mock-limits command
// 引入 extractConnectionErrorDetails、formatAPIError，将 ./errorUtils.js 中已经封装好的能力接到本文件流程里。
import { extractConnectionErrorDetails, formatAPIError } from './errorUtils.js'

// API_ERROR_MESSAGE_PREFIX 消息数据保存`'API Error'`，作为后续固定文本处理的输入。
export const API_ERROR_MESSAGE_PREFIX = 'API Error'

// startsWithApiErrorPrefix 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startsWithApiErrorPrefix(text: string): boolean {
  // 返回 `(`，作为API 服务 errors这次计算的结果。
  return (
    text.startsWith(API_ERROR_MESSAGE_PREFIX) ||
    text.startsWith(`Please run /login · ${API_ERROR_MESSAGE_PREFIX}`)
  )
}
// PROMPT_TOO_LONG_ERROR_MESSAGE 消息数据 命名 `'Prompt is too long'`，让后续代码直接表达这个值的用途。
export const PROMPT_TOO_LONG_ERROR_MESSAGE = 'Prompt is too long'

// isPromptTooLongMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPromptTooLongMessage(msg: AssistantMessage): boolean {
  // msg.isApiErrorMessage 消息数据缺失时提前走兜底路径，避免API 服务 errors继续依赖无效输入。
  if (!msg.isApiErrorMessage) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 文本内容保存`msg.message.content`，供后续判断或组装使用。
  const content = msg.message.content
  // 满足 `!Array.isArray(content)` 时，API 服务 errors执行该分支。
  if (!Array.isArray(content)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `content.some(`，作为API 服务 errors这次计算的结果。
  return content.some(
    // block更新为 `>`，确保API 服务后续读取最新状态。
    block =>
      block.type === 'text' &&
      block.text.startsWith(PROMPT_TOO_LONG_ERROR_MESSAGE),
  )
}

/**
 * Parse actual/limit token counts from a raw prompt-too-long API error
 * message like "prompt is too long: 137500 tokens > 135000 maximum".
 * The raw string may be wrapped in SDK prefixes or JSON envelopes, or
 * have different casing (Vertex), so this is intentionally lenient.
 */
// parsePromptTooLongTokenCounts 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parsePromptTooLongTokenCounts(rawMessage: string): {
  actualTokens: number | undefined
  limitTokens: number | undefined
} {
  // match匹配`rawMessage.match`，供API 服务 errors后续处理使用。
  const match = rawMessage.match(
    /prompt is too long[^0-9]*(\d+)\s*tokens?\s*>\s*(\d+)/i,
  )
  // 返回结构化结果，集中表达API 服务 errors已经整理出的状态。
  return {
    actualTokens: match ? parseInt(match[1]!, 10) : undefined,
    limitTokens: match ? parseInt(match[2]!, 10) : undefined,
  }
}

/**
 * Returns how many tokens over the limit a prompt-too-long error reports,
 * or undefined if the message isn't PTL or its errorDetails are unparseable.
 * Reactive compact uses this gap to jump past multiple groups in one retry
 * instead of peeling one-at-a-time.
 */
// getPromptTooLongTokenGap 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPromptTooLongTokenGap(
  msg: AssistantMessage,
): number | undefined {
  // 组合条件 `!isPromptTooLongMessage(msg) || !msg.errorDetails` 成立时，API 服务 errors才启用这条专门路径。
  if (!isPromptTooLongMessage(msg) || !msg.errorDetails) {
    // 返回 `undefined`，作为API 服务 errors这次计算的结果。
    return undefined
  }
  // 从 `parsePromptTooLongTokenCounts(` 解构 actualTokens、limitTokens，减少API 服务 errors对同一对象的重复访问。
  const { actualTokens, limitTokens } = parsePromptTooLongTokenCounts(
    msg.errorDetails,
  )
  // 组合条件 `actualTokens === undefined || limitTokens === und` 成立时，API 服务 errors才启用这条专门路径。
  if (actualTokens === undefined || limitTokens === undefined) {
    // 返回 `undefined`，作为API 服务 errors这次计算的结果。
    return undefined
  }
  // gap保存`actualTokens - limitTokens`，供API 服务 errors后续判断或输出使用。
  const gap = actualTokens - limitTokens
  // 返回 `gap > 0 ? gap : undefined`，作为API 服务 errors这次计算的结果。
  return gap > 0 ? gap : undefined
}

/**
 * Is this raw API error text a media-size rejection that stripImagesFromMessages
 * can fix? Reactive compact's summarize retry uses this to decide whether to
 * strip and retry (media error) or bail (anything else).
 *
 * Patterns MUST stay in sync with the getAssistantMessageFromError branches
 * that populate errorDetails (~L523 PDF, ~L560 image, ~L573 many-image) and
 * the classifyAPIError branches (~L929-946). The closed loop: errorDetails is
 * only set after those branches already matched these same substrings, so
 * isMediaSizeError(errorDetails) is tautologically true for that path. API
 * wording drift causes graceful degradation (errorDetails stays undefined,
 * caller short-circuits), not a false negative.
 */
// isMediaSizeError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMediaSizeError(raw: string): boolean {
  // 返回 `(`，作为API 服务 errors这次计算的结果。
  return (
    (raw.includes('image exceeds') && raw.includes('maximum')) ||
    (raw.includes('image dimensions exceed') && raw.includes('many-image')) ||
    /maximum of \d+ PDF pages/.test(raw)
  )
}

/**
 * Message-level predicate: is this assistant message a media-size rejection?
 * Parallel to isPromptTooLongMessage. Checks errorDetails (the raw API error
 * string populated by the getAssistantMessageFromError branches at ~L523/560/573)
 * rather than content text, since media errors have per-variant content strings.
 */
// isMediaSizeErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMediaSizeErrorMessage(msg: AssistantMessage): boolean {
  // 返回 `(`，作为API 服务 errors这次计算的结果。
  return (
    msg.isApiErrorMessage === true &&
    msg.errorDetails !== undefined &&
    isMediaSizeError(msg.errorDetails)
  )
}
// CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE 消息数据 命名 `'Credit balance is too low'`，让后续代码直接表达这个值的用途。
export const CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE = 'Credit balance is too low'
// INVALID_API_KEY_ERROR_MESSAGE 消息数据保存`'Not logged in · Please run /login'`，作为后续固定文本处理的输入。
export const INVALID_API_KEY_ERROR_MESSAGE = 'Not logged in · Please run /login'
// INVALID_API_KEY_ERROR_MESSAGE_EXTERNAL 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const INVALID_API_KEY_ERROR_MESSAGE_EXTERNAL =
  'Invalid API key · Fix external API key'
// ORG_DISABLED_ERROR_MESSAGE_ENV_KEY_WITH_OAUTH 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const ORG_DISABLED_ERROR_MESSAGE_ENV_KEY_WITH_OAUTH =
  'Your ANTHROPIC_API_KEY belongs to a disabled organization · Unset the environment variable to use your subscription instead'
// ORG_DISABLED_ERROR_MESSAGE_ENV_KEY 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const ORG_DISABLED_ERROR_MESSAGE_ENV_KEY =
  'Your ANTHROPIC_API_KEY belongs to a disabled organization · Update or unset the environment variable'
// TOKEN_REVOKED_ERROR_MESSAGE 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const TOKEN_REVOKED_ERROR_MESSAGE =
  'OAuth token revoked · Please run /login'
// CCR_AUTH_ERROR_MESSAGE 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const CCR_AUTH_ERROR_MESSAGE =
  'Authentication error · This may be a temporary network issue, please try again'
// REPEATED_529_ERROR_MESSAGE 消息数据读取`'Repeated 529 Overloaded errors'`，作为后续固定文本处理的输入。
export const REPEATED_529_ERROR_MESSAGE = 'Repeated 529 Overloaded errors'
// CUSTOM_OFF_SWITCH_MESSAGE 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const CUSTOM_OFF_SWITCH_MESSAGE =
  'Opus is experiencing high load, please use /model to switch to Sonnet'
// API_TIMEOUT_ERROR_MESSAGE 消息数据保存`'Request timed out'`，作为后续固定文本处理的输入。
export const API_TIMEOUT_ERROR_MESSAGE = 'Request timed out'
// getPdfTooLargeErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPdfTooLargeErrorMessage(): string {
  // limits 集合格式化`formatFileSize`，供API 服务 errors后续处理使用。
  const limits = `max ${API_PDF_MAX_PAGES} pages, ${formatFileSize(PDF_TARGET_RAW_SIZE)}`
  // 返回 `getIsNonInteractiveSession()`，作为API 服务 errors这次计算的结果。
  return getIsNonInteractiveSession()
    ? `PDF too large (${limits}). Try reading the file a different way (e.g., extract text with pdftotext).`
    : `PDF too large (${limits}). Double press esc to go back and try again, or use pdftotext to convert to text first.`
}
// getPdfPasswordProtectedErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPdfPasswordProtectedErrorMessage(): string {
  // 返回 `getIsNonInteractiveSession()`，作为API 服务 errors这次计算的结果。
  return getIsNonInteractiveSession()
    ? 'PDF is password protected. Try using a CLI tool to extract or convert the PDF.'
    : 'PDF is password protected. Please double press esc to edit your message and try again.'
}
// getPdfInvalidErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPdfInvalidErrorMessage(): string {
  // 返回 `getIsNonInteractiveSession()`，作为API 服务 errors这次计算的结果。
  return getIsNonInteractiveSession()
    ? 'The PDF file was not valid. Try converting it to text first (e.g., pdftotext).'
    : 'The PDF file was not valid. Double press esc to go back and try again with a different file.'
}
// getImageTooLargeErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getImageTooLargeErrorMessage(): string {
  // 返回 `getIsNonInteractiveSession()`，作为API 服务 errors这次计算的结果。
  return getIsNonInteractiveSession()
    ? 'Image was too large. Try resizing the image or using a different approach.'
    : 'Image was too large. Double press esc to go back and try again with a smaller image.'
}
// getRequestTooLargeErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRequestTooLargeErrorMessage(): string {
  // limits 集合格式化`formatFileSize`，供API 服务 errors后续处理使用。
  const limits = `max ${formatFileSize(PDF_TARGET_RAW_SIZE)}`
  // 返回 `getIsNonInteractiveSession()`，作为API 服务 errors这次计算的结果。
  return getIsNonInteractiveSession()
    ? `Request too large (${limits}). Try with a smaller file.`
    : `Request too large (${limits}). Double press esc to go back and try with a smaller file.`
}
// OAUTH_ORG_NOT_ALLOWED_ERROR_MESSAGE 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const OAUTH_ORG_NOT_ALLOWED_ERROR_MESSAGE =
  'Your account does not have access to Claude Code. Please run /login.'

// getTokenRevokedErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTokenRevokedErrorMessage(): string {
  // 返回 `getIsNonInteractiveSession()`，作为API 服务 errors这次计算的结果。
  return getIsNonInteractiveSession()
    ? 'Your account does not have access to Claude. Please login again or contact your administrator.'
    : TOKEN_REVOKED_ERROR_MESSAGE
}

// getOauthOrgNotAllowedErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOauthOrgNotAllowedErrorMessage(): string {
  // 返回 `getIsNonInteractiveSession()`，作为API 服务 errors这次计算的结果。
  return getIsNonInteractiveSession()
    ? 'Your organization does not have access to Claude. Please login again or contact your administrator.'
    : OAUTH_ORG_NOT_ALLOWED_ERROR_MESSAGE
}

/**
 * Check if we're in CCR (Claude Code Remote) mode.
 * In CCR mode, auth is handled via JWTs provided by the infrastructure,
 * not via /login. Transient auth errors should suggest retrying, not logging in.
 */
// isCCRMode 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCCRMode(): boolean {
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)`，作为API 服务 errors这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)
}

// Temp helper to log tool_use/tool_result mismatch errors
// logToolUseToolResultMismatch 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logToolUseToolResultMismatch(
  toolUseId: string,
  messages: Message[],
  messagesForAPI: (UserMessage | AssistantMessage)[],
): void {
  // 保护这一段可能失败的API 服务 errors操作，确保异常能进入相邻错误处理。
  try {
    // Find tool_use in normalized messages
    // normalizedIndex 索引保存`-1`，供后续判断或组装使用。
    let normalizedIndex = -1
    // 按索引扫描 `messagesForAPI.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < messagesForAPI.length; i++) {
      // 消息保存`messagesForAPI[i]`，供API 服务 errors后续判断或输出使用。
      const msg = messagesForAPI[i]
      // 消息缺失时提前走兜底路径，避免API 服务 errors继续依赖无效输入。
      if (!msg) continue
      // 文本内容保存`msg.message.content`，供后续判断或组装使用。
      const content = msg.message.content
      // 满足 `Array.isArray(content)` 时，API 服务 errors执行该分支。
      if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给API 服务 errors处理。
        for (const block of content) {
          // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
          if (
            block.type === 'tool_use' &&
            'id' in block &&
            block.id === toolUseId
          ) {
            // normalizedIndex 索引更新为 `i`，确保API 服务后续读取最新状态。
            normalizedIndex = i
            // 结束这个分支或循环，避免API 服务 errors继续落入后续路径。
            break
          }
        }
      }
      // `normalizedIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
      if (normalizedIndex !== -1) break
    }

    // Find tool_use in original messages
    // originalIndex 索引保存`-1`，供后续判断或组装使用。
    let originalIndex = -1
    // 按索引扫描 `messages.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < messages.length; i++) {
      // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
      const msg = messages[i]
      // 消息缺失时提前走兜底路径，避免API 服务 errors继续依赖无效输入。
      if (!msg) continue
      // 组合条件 `msg.type === 'assistant' && 'message' in msg` 成立时，API 服务 errors才启用这条专门路径。
      if (msg.type === 'assistant' && 'message' in msg) {
        // 文本内容保存`msg.message.content`，供后续判断或组装使用。
        const content = msg.message.content
        // 满足 `Array.isArray(content)` 时，API 服务 errors执行该分支。
        if (Array.isArray(content)) {
          // 按顺序遍历 `content` 中的block，逐个交给API 服务 errors处理。
          for (const block of content) {
            // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
            if (
              block.type === 'tool_use' &&
              'id' in block &&
              block.id === toolUseId
            ) {
              // originalIndex 索引更新为 `i`，确保API 服务后续读取最新状态。
              originalIndex = i
              // 结束这个分支或循环，避免API 服务 errors继续落入后续路径。
              break
            }
          }
        }
      }
      // `originalIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
      if (originalIndex !== -1) break
    }

    // Build normalized sequence
    // normalizedSeq 从空数组开始收集，后续循环会按处理顺序追加条目。
    const normalizedSeq: string[] = []
    // 循环处理 `let i = normalizedIndex + 1; i < messagesForAPI.l`，让API 服务 errors逐项把同类条目按顺序走完。
    for (let i = normalizedIndex + 1; i < messagesForAPI.length; i++) {
      // 消息保存`messagesForAPI[i]`，供API 服务 errors后续判断或输出使用。
      const msg = messagesForAPI[i]
      // 消息缺失时提前走兜底路径，避免API 服务 errors继续依赖无效输入。
      if (!msg) continue
      // 文本内容保存`msg.message.content`，供后续判断或组装使用。
      const content = msg.message.content
      // 满足 `Array.isArray(content)` 时，API 服务 errors执行该分支。
      if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给API 服务 errors处理。
        for (const block of content) {
          // role保存`msg.message.role`，供后续判断或组装使用。
          const role = msg.message.role
          // 组合条件 `block.type === 'tool_use' && 'id' in block` 成立时，API 服务 errors才启用这条专门路径。
          if (block.type === 'tool_use' && 'id' in block) {
            // normalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            normalizedSeq.push(`${role}:tool_use:${block.id}`)
          // API 服务 errors在这里处理 `} else if (block.type === 'tool_result' && 'tool_use_id' in block) {`，完成这一小步状态转换。
          } else if (block.type === 'tool_result' && 'tool_use_id' in block) {
            // normalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            normalizedSeq.push(`${role}:tool_result:${block.tool_use_id}`)
          // API 服务 errors在这里处理 `} else if (block.type === 'text') {`，完成这一小步状态转换。
          } else if (block.type === 'text') {
            // normalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            normalizedSeq.push(`${role}:text`)
          // API 服务 errors在这里处理 `} else if (block.type === 'thinking') {`，完成这一小步状态转换。
          } else if (block.type === 'thinking') {
            // normalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            normalizedSeq.push(`${role}:thinking`)
          // API 服务 errors在这里处理 `} else if (block.type === 'image') {`，完成这一小步状态转换。
          } else if (block.type === 'image') {
            // normalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            normalizedSeq.push(`${role}:image`)
          } else {
            // normalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            normalizedSeq.push(`${role}:${block.type}`)
          }
        }
      // API 服务 errors在这里处理 `} else if (typeof content === 'string') {`，完成这一小步状态转换。
      } else if (typeof content === 'string') {
        // normalizedSeq追加新条目，保持收集顺序与输入顺序一致。
        normalizedSeq.push(`${msg.message.role}:string_content`)
      }
    }

    // Build pre-normalized sequence
    // preNormalizedSeq 从空数组开始收集，后续循环会按处理顺序追加条目。
    const preNormalizedSeq: string[] = []
    // 循环处理 `let i = originalIndex + 1; i < messages.length; i`，让API 服务 errors逐项把同类条目按顺序走完。
    for (let i = originalIndex + 1; i < messages.length; i++) {
      // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
      const msg = messages[i]
      // 消息缺失时提前走兜底路径，避免API 服务 errors继续依赖无效输入。
      if (!msg) continue

      // 按照 msg.type 的取值选择API 服务 errors的具体处理分支。
      switch (msg.type) {
        case 'user':
        case 'assistant': {
          // 满足 `'message' in msg` 时，API 服务 errors执行该分支。
          if ('message' in msg) {
            // 文本内容保存`msg.message.content`，供后续判断或组装使用。
            const content = msg.message.content
            // 满足 `Array.isArray(content)` 时，API 服务 errors执行该分支。
            if (Array.isArray(content)) {
              // 按顺序遍历 `content` 中的block，逐个交给API 服务 errors处理。
              for (const block of content) {
                // role保存`msg.message.role`，供后续判断或组装使用。
                const role = msg.message.role
                // 组合条件 `block.type === 'tool_use' && 'id' in block` 成立时，API 服务 errors才启用这条专门路径。
                if (block.type === 'tool_use' && 'id' in block) {
                  // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
                  preNormalizedSeq.push(`${role}:tool_use:${block.id}`)
                // API 服务 errors在这里处理 `} else if (`，完成这一小步状态转换。
                } else if (
                  block.type === 'tool_result' &&
                  'tool_use_id' in block
                ) {
                  // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
                  preNormalizedSeq.push(
                    `${role}:tool_result:${block.tool_use_id}`,
                  )
                // API 服务 errors在这里处理 `} else if (block.type === 'text') {`，完成这一小步状态转换。
                } else if (block.type === 'text') {
                  // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
                  preNormalizedSeq.push(`${role}:text`)
                // API 服务 errors在这里处理 `} else if (block.type === 'thinking') {`，完成这一小步状态转换。
                } else if (block.type === 'thinking') {
                  // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
                  preNormalizedSeq.push(`${role}:thinking`)
                // API 服务 errors在这里处理 `} else if (block.type === 'image') {`，完成这一小步状态转换。
                } else if (block.type === 'image') {
                  // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
                  preNormalizedSeq.push(`${role}:image`)
                } else {
                  // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
                  preNormalizedSeq.push(`${role}:${block.type}`)
                }
              }
            // API 服务 errors在这里处理 `} else if (typeof content === 'string') {`，完成这一小步状态转换。
            } else if (typeof content === 'string') {
              // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
              preNormalizedSeq.push(`${msg.message.role}:string_content`)
            }
          }
          // 结束这个分支或循环，避免API 服务 errors继续落入后续路径。
          break
        }
        case 'attachment':
          // 满足 `'attachment' in msg` 时，API 服务 errors执行该分支。
          if ('attachment' in msg) {
            // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            preNormalizedSeq.push(`attachment:${msg.attachment.type}`)
          }
          // 结束这个分支或循环，避免API 服务 errors继续落入后续路径。
          break
        case 'system':
          // 满足 `'subtype' in msg` 时，API 服务 errors执行该分支。
          if ('subtype' in msg) {
            // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            preNormalizedSeq.push(`system:${msg.subtype}`)
          }
          // 结束这个分支或循环，避免API 服务 errors继续落入后续路径。
          break
        case 'progress':
          // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
          if (
            'progress' in msg &&
            msg.progress &&
            typeof msg.progress === 'object' &&
            'type' in msg.progress
          ) {
            // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            preNormalizedSeq.push(`progress:${msg.progress.type ?? 'unknown'}`)
          } else {
            // preNormalizedSeq追加新条目，保持收集顺序与输入顺序一致。
            preNormalizedSeq.push('progress:unknown')
          }
          // 结束这个分支或循环，避免API 服务 errors继续落入后续路径。
          break
      }
    }

    // Log to Statsig
    // 记录API 服务 errors运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_use_tool_result_mismatch_error', {
      toolUseId:
        toolUseId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      normalizedSequence: normalizedSeq.join(
        ', ',
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      preNormalizedSequence: preNormalizedSeq.join(
        ', ',
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      normalizedMessageCount: messagesForAPI.length,
      originalMessageCount: messages.length,
      normalizedToolUseIndex: normalizedIndex,
      originalToolUseIndex: originalIndex,
    })
  } catch (_) {
    // Ignore errors in debug logging
  }
}

/**
 * Type guard to check if a value is a valid Message response from the API
 */
// isValidAPIMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isValidAPIMessage(value: unknown): value is BetaMessage {
  // 返回 `(`，作为API 服务 errors这次计算的结果。
  return (
    typeof value === 'object' &&
    value !== null &&
    'content' in value &&
    'model' in value &&
    'usage' in value &&
    Array.isArray((value as BetaMessage).content) &&
    typeof (value as BetaMessage).model === 'string' &&
    typeof (value as BetaMessage).usage === 'object'
  )
}

/** Lower-level error that AWS can return. */
// AmazonError 固化API 服务 errors里传递的数据形状，帮助调用方按同一结构读写字段。
type AmazonError = {
  Output?: {
    __type?: string
  }
  Version?: string
}

/**
 * Given a response that doesn't look quite right, see if it contains any known error types we can extract.
 */
// extractUnknownErrorFormat 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractUnknownErrorFormat(value: unknown): string | undefined {
  // Check if value is a valid object first
  // `!value || typeof value` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!value || typeof value !== 'object') {
    // 返回 `undefined`，作为API 服务 errors这次计算的结果。
    return undefined
  }

  // Amazon Bedrock routing errors
  // 满足 `(value as AmazonError).Output?.__type` 时，API 服务 errors执行该分支。
  if ((value as AmazonError).Output?.__type) {
    // 返回 `(value as AmazonError).Output!.__type`，作为API 服务 errors这次计算的结果。
    return (value as AmazonError).Output!.__type
  }

  // 返回 `undefined`，作为API 服务 errors这次计算的结果。
  return undefined
}

// getAssistantMessageFromError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAssistantMessageFromError(
  error: unknown,
  model: string,
  options?: {
    messages?: Message[]
    messagesForAPI?: (UserMessage | AssistantMessage)[]
  },
): AssistantMessage {
  // Check for SDK timeout errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIConnectionTimeoutError ||
    (error instanceof APIConnectionError &&
      error.message.toLowerCase().includes('timeout'))
  ) {
    // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
    return createAssistantAPIErrorMessage({
      content: API_TIMEOUT_ERROR_MESSAGE,
      error: 'unknown',
    })
  }

  // Check for image size/resize errors (thrown before API call during validation)
  // Use getImageTooLargeErrorMessage() to show "esc esc" hint for CLI users
  // but a generic message for SDK users (non-interactive mode)
  // 组合条件 `error instanceof ImageSizeError || error instance` 成立时，API 服务 errors才启用这条专门路径。
  if (error instanceof ImageSizeError || error instanceof ImageResizeError) {
    // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
    return createAssistantAPIErrorMessage({
      content: getImageTooLargeErrorMessage(),
    })
  }

  // Check for emergency capacity off switch for Opus PAYG users
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.includes(CUSTOM_OFF_SWITCH_MESSAGE)
  ) {
    // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
    return createAssistantAPIErrorMessage({
      content: CUSTOM_OFF_SWITCH_MESSAGE,
      error: 'rate_limit',
    })
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 429 &&
    shouldProcessRateLimits(isClaudeAISubscriber())
  ) {
    // Check if this is the new API with multiple rate limit headers
    // rateLimitType读取`error.headers?.get?.(` 整理出中间结果，供API 服务 errors后续步骤使用。
    const rateLimitType = error.headers?.get?.(
      'anthropic-ratelimit-unified-representative-claim',
    ) as 'five_hour' | 'seven_day' | 'seven_day_opus' | null

    // overageStatus 集合读取`error.headers?.get?.(`，供后续判断或组装使用。
    const overageStatus = error.headers?.get?.(
      'anthropic-ratelimit-unified-overage-status',
    ) as 'allowed' | 'allowed_warning' | 'rejected' | null

    // If we have the new headers, use the new message generation
    // 组合条件 `rateLimitType || overageStatus` 成立时，API 服务 errors才启用这条专门路径。
    if (rateLimitType || overageStatus) {
      // Build limits object from error headers to determine the appropriate message
      // limits 集合 集中保存API 服务 errors要一起传递的字段。
      const limits: ClaudeAILimits = {
        status: 'rejected',
        unifiedRateLimitFallbackAvailable: false,
        isUsingOverage: false,
      }

      // Extract rate limit information from headers
      // resetHeader读取`error.headers?.get?.(` 整理出中间结果，供API 服务 errors后续步骤使用。
      const resetHeader = error.headers?.get?.(
        'anthropic-ratelimit-unified-reset',
      )
      // 满足 `resetHeader` 时，API 服务 errors执行该分支。
      if (resetHeader) {
        // resetsAt更新为 `Number(resetHeader)`，确保API 服务后续读取最新状态。
        limits.resetsAt = Number(resetHeader)
      }

      // 满足 `rateLimitType` 时，API 服务 errors执行该分支。
      if (rateLimitType) {
        // rateLimitType更新为 `rateLimitType`，确保API 服务后续读取最新状态。
        limits.rateLimitType = rateLimitType
      }

      // 满足 `overageStatus` 时，API 服务 errors执行该分支。
      if (overageStatus) {
        // overageStatus 集合更新为 `overageStatus`，确保API 服务后续读取最新状态。
        limits.overageStatus = overageStatus
      }

      // overageResetHeader 命名 `error.headers?.get?.(`，让后续代码直接表达这个值的用途。
      const overageResetHeader = error.headers?.get?.(
        'anthropic-ratelimit-unified-overage-reset',
      )
      // 满足 `overageResetHeader` 时，API 服务 errors执行该分支。
      if (overageResetHeader) {
        // overageResetsAt更新为 `Number(overageResetHeader)`，确保API 服务后续读取最新状态。
        limits.overageResetsAt = Number(overageResetHeader)
      }

      // overageDisabledReason读取`error.headers?.get?.(`，供后续判断或组装使用。
      const overageDisabledReason = error.headers?.get?.(
        'anthropic-ratelimit-unified-overage-disabled-reason',
      ) as OverageDisabledReason | null
      // 满足 `overageDisabledReason` 时，API 服务 errors执行该分支。
      if (overageDisabledReason) {
        // overageDisabledReason更新为 `overageDisabledReason`，确保API 服务后续读取最新状态。
        limits.overageDisabledReason = overageDisabledReason
      }

      // Use the new message format for all new API rate limits
      // specificErrorMessage 消息数据读取`getRateLimitErrorMessage`，供API 服务 errors后续处理使用。
      const specificErrorMessage = getRateLimitErrorMessage(limits, model)
      // 满足 `specificErrorMessage` 时，API 服务 errors执行该分支。
      if (specificErrorMessage) {
        // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
        return createAssistantAPIErrorMessage({
          content: specificErrorMessage,
          error: 'rate_limit',
        })
      }

      // If getRateLimitErrorMessage returned null, it means the fallback mechanism
      // will handle this silently (e.g., Opus -> Sonnet fallback for eligible users).
      // Return NO_RESPONSE_REQUESTED so no error is shown to the user, but the
      // message is still recorded in conversation history for Claude to see.
      // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
      return createAssistantAPIErrorMessage({
        content: NO_RESPONSE_REQUESTED,
        error: 'rate_limit',
      })
    }

    // No quota headers — this is NOT a quota limit. Surface what the API actually
    // said instead of a generic "Rate limit reached". Entitlement rejections
    // (e.g. 1M context without Extra Usage) and infra capacity 429s land here.
    // 满足 `error.message.includes('Extra usage is required for long context')` 时，API 服务 errors执行该分支。
    if (error.message.includes('Extra usage is required for long context')) {
      // hint读取`getIsNonInteractiveSession`，供API 服务 errors后续处理使用。
      const hint = getIsNonInteractiveSession()
        ? 'enable extra usage at claude.ai/settings/usage, or use --model to switch to standard context'
        : 'run /extra-usage to enable, or /model to switch to standard context'
      // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
      return createAssistantAPIErrorMessage({
        content: `${API_ERROR_MESSAGE_PREFIX}: Extra usage is required for 1M context · ${hint}`,
        error: 'rate_limit',
      })
    }
    // SDK's APIError.makeMessage prepends "429 " and JSON-stringifies the body
    // when there's no top-level .message — extract the inner error.message.
    // stripped格式化`message.replace`，供API 服务 errors后续处理使用。
    const stripped = error.message.replace(/^429\s+/, '')
    // innerMessage 消息数据匹配`stripped.match`，供API 服务 errors后续处理使用。
    const innerMessage = stripped.match(/"message"\s*:\s*"([^"]*)"/)?.[1]
    // detail记录当前扫描状态，API 服务 errors随后按该状态分支。
    const detail = innerMessage || stripped
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: `${API_ERROR_MESSAGE_PREFIX}: Request rejected (429) · ${detail || 'this may be a temporary capacity issue — check status.anthropic.com'}`,
      error: 'rate_limit',
    })
  }

  // Handle prompt too long errors (Vertex returns 413, direct API returns 400)
  // Use case-insensitive check since Vertex returns "Prompt is too long" (capitalized)
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes('prompt is too long')
  ) {
    // Content stays generic (UI matches on exact string). The raw error with
    // token counts goes into errorDetails — reactive compact's retry loop
    // parses the gap from there via getPromptTooLongTokenGap.
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: PROMPT_TOO_LONG_ERROR_MESSAGE,
      error: 'invalid_request',
      errorDetails: error.message,
    })
  }

  // Check for PDF page limit errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    /maximum of \d+ PDF pages/.test(error.message)
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: getPdfTooLargeErrorMessage(),
      error: 'invalid_request',
      errorDetails: error.message,
    })
  }

  // Check for password-protected PDF errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.includes('The PDF specified is password protected')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: getPdfPasswordProtectedErrorMessage(),
      error: 'invalid_request',
    })
  }

  // Check for invalid PDF errors (e.g., HTML file renamed to .pdf)
  // Without this handler, invalid PDF document blocks persist in conversation
  // context and cause every subsequent API call to fail with 400.
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.includes('The PDF specified was not valid')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: getPdfInvalidErrorMessage(),
      error: 'invalid_request',
    })
  }

  // Check for image size errors (e.g., "image exceeds 5 MB maximum: 5316852 bytes > 5242880 bytes")
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('image exceeds') &&
    error.message.includes('maximum')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: getImageTooLargeErrorMessage(),
      errorDetails: error.message,
    })
  }

  // Check for many-image dimension errors (API enforces stricter 2000px limit for many-image requests)
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('image dimensions exceed') &&
    error.message.includes('many-image')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: getIsNonInteractiveSession()
        ? 'An image in the conversation exceeds the dimension limit for many-image requests (2000px). Start a new session with fewer images.'
        : 'An image in the conversation exceeds the dimension limit for many-image requests (2000px). Run /compact to remove old images from context, or start a new session.',
      error: 'invalid_request',
      errorDetails: error.message,
    })
  }

  // Server rejected the afk-mode beta header (plan does not include auto
  // mode). AFK_MODE_BETA_HEADER is '' in non-TRANSCRIPT_CLASSIFIER builds,
  // so the truthy guard keeps this inert there.
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    AFK_MODE_BETA_HEADER &&
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes(AFK_MODE_BETA_HEADER) &&
    error.message.includes('anthropic-beta')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: 'Auto mode is unavailable for your plan',
      error: 'invalid_request',
    })
  }

  // Check for request too large errors (413 status)
  // This typically happens when a large PDF + conversation context exceeds the 32MB API limit
  // 组合条件 `error instanceof APIError && error.status === 413` 成立时，API 服务 errors才启用这条专门路径。
  if (error instanceof APIError && error.status === 413) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: getRequestTooLargeErrorMessage(),
      error: 'invalid_request',
    })
  }

  // Check for tool_use/tool_result concurrency error
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes(
      '`tool_use` ids were found without `tool_result` blocks immediately after',
    )
  ) {
    // Log to Statsig if we have the message context
    // 组合条件 `options?.messages && options?.messagesForAPI` 成立时，API 服务 errors才启用这条专门路径。
    if (options?.messages && options?.messagesForAPI) {
      // toolUseIdMatch匹配`message.match`，供API 服务 errors后续处理使用。
      const toolUseIdMatch = error.message.match(/toolu_[a-zA-Z0-9]+/)
      // toolUseId保存`toolUseIdMatch ? toolUseIdMatch[0] : null`，供API 服务 errors后续步骤使用。
      const toolUseId = toolUseIdMatch ? toolUseIdMatch[0] : null
      // 满足 `toolUseId` 时，API 服务 errors执行该分支。
      if (toolUseId) {
        // logToolUseToolResultMismatch执行API 服务 errors在此处需要的副作用或外部交互。
        logToolUseToolResultMismatch(
          toolUseId,
          options.messages,
          options.messagesForAPI,
        )
      }
    }

    // `process.env.USER_TYPE` 命中特定值 `'ant'` 时，进入API 服务 errors对应处理。
    if (process.env.USER_TYPE === 'ant') {
      // baseMessage保存``API Error: 400 ${error.message}\n\nRun /share and post t...`，供API 服务 errors后续步骤使用。
      const baseMessage = `API Error: 400 ${error.message}\n\nRun /share and post the JSON file to ${MACRO.FEEDBACK_CHANNEL}.`
      // rewindInstruction读取`getIsNonInteractiveSession`，供API 服务 errors后续处理使用。
      const rewindInstruction = getIsNonInteractiveSession()
        ? ''
        : ' Then, use /rewind to recover the conversation.'
      // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
      return createAssistantAPIErrorMessage({
        content: baseMessage + rewindInstruction,
        error: 'invalid_request',
      })
    } else {
      // baseMessage保存`'API Error: 400 due to tool use concurrency issues.'`，供API 服务 errors后续步骤使用。
      const baseMessage = 'API Error: 400 due to tool use concurrency issues.'
      // rewindInstruction读取`getIsNonInteractiveSession`，供API 服务 errors后续处理使用。
      const rewindInstruction = getIsNonInteractiveSession()
        ? ''
        : ' Run /rewind to recover the conversation.'
      // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
      return createAssistantAPIErrorMessage({
        content: baseMessage + rewindInstruction,
        error: 'invalid_request',
      })
    }
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('unexpected `tool_use_id` found in `tool_result`')
  ) {
    // 记录API 服务 errors运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_unexpected_tool_result', {})
  }

  // Duplicate tool_use IDs (CC-1212). ensureToolResultPairing strips these
  // before send, so hitting this means a new corruption path slipped through.
  // Log for root-causing, and give users a recovery path instead of deadlock.
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('`tool_use` ids must be unique')
  ) {
    // 记录API 服务 errors运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_duplicate_tool_use_id', {})
    // rewindInstruction读取`getIsNonInteractiveSession`，供API 服务 errors后续处理使用。
    const rewindInstruction = getIsNonInteractiveSession()
      ? ''
      : ' Run /rewind to recover the conversation.'
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: `API Error: 400 duplicate tool_use ID in conversation history.${rewindInstruction}`,
      error: 'invalid_request',
      errorDetails: error.message,
    })
  }

  // Check for invalid model name error for subscription users trying to use Opus
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    isClaudeAISubscriber() &&
    error instanceof APIError &&
    error.status === 400 &&
    error.message.toLowerCase().includes('invalid model name') &&
    (isNonCustomOpusModel(model) || model === 'opus')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content:
        'Claude Opus is not available with the Claude Pro plan. If you have updated your subscription plan recently, run /logout and /login for the plan to take effect.',
      error: 'invalid_request',
    })
  }

  // Check for invalid model name error for Ant users. Claude Code may be
  // defaulting to a custom internal-only model for Ants, and there might be
  // Ants using new or unknown org IDs that haven't been gated in.
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    process.env.USER_TYPE === 'ant' &&
    !process.env.ANTHROPIC_MODEL &&
    error instanceof Error &&
    error.message.toLowerCase().includes('invalid model name')
  ) {
    // Get organization ID from config - only use OAuth account data when actively using OAuth
    // orgId读取`getOauthAccountInfo`，供API 服务 errors后续处理使用。
    const orgId = getOauthAccountInfo()?.organizationUuid
    // baseMsg读取`getDefaultMainLoopModelSetting`，供API 服务 errors后续处理使用。
    const baseMsg = `[ANT-ONLY] Your org isn't gated into the \`${model}\` model. Either run \`claude\` with \`ANTHROPIC_MODEL=${getDefaultMainLoopModelSetting()}\``
    // 提示消息保存`orgId`，供API 服务 errors后续步骤使用。
    const msg = orgId
      ? `${baseMsg} or share your orgId (${orgId}) in ${MACRO.FEEDBACK_CHANNEL} for help getting access.`
      : `${baseMsg} or reach out in ${MACRO.FEEDBACK_CHANNEL} for help getting access.`

    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: msg,
      error: 'invalid_request',
    })
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.includes('Your credit balance is too low')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      content: CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE,
      error: 'billing_error',
    })
  }
  // "Organization has been disabled" — commonly a stale ANTHROPIC_API_KEY
  // from a previous employer/project overriding subscription auth. Only handle
  // the env-var case; apiKeyHelper and /login-managed keys mean the active
  // auth's org is genuinely disabled with no dormant fallback to point at.
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.toLowerCase().includes('organization has been disabled')
  ) {
    // 从 `getAnthropicApiKeyWithSource()` 解构 source，减少API 服务 errors对同一对象的重复访问。
    const { source } = getAnthropicApiKeyWithSource()
    // getAnthropicApiKeyWithSource conflates the env var with FD-passed keys
    // under the same source value, and in CCR mode OAuth stays active despite
    // the env var. The three guards ensure we only blame the env var when it's
    // actually set and actually on the wire.
    // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
    if (
      source === 'ANTHROPIC_API_KEY' &&
      process.env.ANTHROPIC_API_KEY &&
      !isClaudeAISubscriber()
    ) {
      // hasStoredOAuth读取`getClaudeAIOAuthTokens`，供API 服务 errors后续处理使用。
      const hasStoredOAuth = getClaudeAIOAuthTokens()?.accessToken != null
      // Not 'authentication_failed' — that triggers VS Code's showLogin(), but
      // login can't fix this (approved env var keeps overriding OAuth). The fix
      // is configuration-based (unset the var), so invalid_request is correct.
      // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
      return createAssistantAPIErrorMessage({
        error: 'invalid_request',
        content: hasStoredOAuth
          ? ORG_DISABLED_ERROR_MESSAGE_ENV_KEY_WITH_OAUTH
          : ORG_DISABLED_ERROR_MESSAGE_ENV_KEY,
      })
    }
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes('x-api-key')
  ) {
    // In CCR mode, auth is via JWTs - this is likely a transient network issue
    // 判断 isCCRMode()，将API 服务 errors分流到只适用于该条件的处理路径。
    if (isCCRMode()) {
      // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
      return createAssistantAPIErrorMessage({
        error: 'authentication_failed',
        content: CCR_AUTH_ERROR_MESSAGE,
      })
    }

    // Check if the API key is from an external source
    // 从 `getAnthropicApiKeyWithSource()` 解构 source，减少API 服务 errors对同一对象的重复访问。
    const { source } = getAnthropicApiKeyWithSource()
    // isExternalSource 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isExternalSource =
      source === 'ANTHROPIC_API_KEY' || source === 'apiKeyHelper'

    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      error: 'authentication_failed',
      content: isExternalSource
        ? INVALID_API_KEY_ERROR_MESSAGE_EXTERNAL
        : INVALID_API_KEY_ERROR_MESSAGE,
    })
  }

  // Check for OAuth token revocation error
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 403 &&
    error.message.includes('OAuth token has been revoked')
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      error: 'authentication_failed',
      content: getTokenRevokedErrorMessage(),
    })
  }

  // Check for OAuth organization not allowed error
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    (error.status === 401 || error.status === 403) &&
    error.message.includes(
      'OAuth authentication is currently not allowed for this organization',
    )
  ) {
    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      error: 'authentication_failed',
      content: getOauthOrgNotAllowedErrorMessage(),
    })
  }

  // Generic handler for other 401/403 authentication errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    (error.status === 401 || error.status === 403)
  ) {
    // In CCR mode, auth is via JWTs - this is likely a transient network issue
    // 判断 isCCRMode()，将API 服务 errors分流到只适用于该条件的处理路径。
    if (isCCRMode()) {
      // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
      return createAssistantAPIErrorMessage({
        error: 'authentication_failed',
        content: CCR_AUTH_ERROR_MESSAGE,
      })
    }

    // 返回 createAssistantAPIErrorMessage({，把API 服务 errors这个分支的结果交还调用方。
    return createAssistantAPIErrorMessage({
      error: 'authentication_failed',
      content: getIsNonInteractiveSession()
        ? `Failed to authenticate. ${API_ERROR_MESSAGE_PREFIX}: ${error.message}`
        : `Please run /login · ${API_ERROR_MESSAGE_PREFIX}: ${error.message}`,
    })
  }

  // Bedrock errors like "403 You don't have access to the model with the specified model ID."
  // don't contain the actual model ID
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) &&
    error instanceof Error &&
    error.message.toLowerCase().includes('model id')
  ) {
    // switchCmd 命令数据读取`getIsNonInteractiveSession`，供API 服务 errors后续处理使用。
    const switchCmd = getIsNonInteractiveSession() ? '--model' : '/model'
    // fallbackSuggestion读取`get3PModelFallbackSuggestion`，供API 服务 errors后续处理使用。
    const fallbackSuggestion = get3PModelFallbackSuggestion(model)
    // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
    return createAssistantAPIErrorMessage({
      content: fallbackSuggestion
        ? `${API_ERROR_MESSAGE_PREFIX} (${model}): ${error.message}. Try ${switchCmd} to switch to ${fallbackSuggestion}.`
        : `${API_ERROR_MESSAGE_PREFIX} (${model}): ${error.message}. Run ${switchCmd} to pick a different model.`,
      error: 'invalid_request',
    })
  }

  // 404 Not Found — usually means the selected model doesn't exist or isn't
  // available. Guide the user to /model so they can pick a valid one.
  // For 3P users, suggest a specific fallback model they can try.
  // 组合条件 `error instanceof APIError && error.status === 404` 成立时，API 服务 errors才启用这条专门路径。
  if (error instanceof APIError && error.status === 404) {
    // switchCmd 命令数据读取`getIsNonInteractiveSession`，供API 服务 errors后续处理使用。
    const switchCmd = getIsNonInteractiveSession() ? '--model' : '/model'
    // fallbackSuggestion读取`get3PModelFallbackSuggestion`，供API 服务 errors后续处理使用。
    const fallbackSuggestion = get3PModelFallbackSuggestion(model)
    // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
    return createAssistantAPIErrorMessage({
      content: fallbackSuggestion
        ? `The model ${model} is not available on your ${getAPIProvider()} deployment. Try ${switchCmd} to switch to ${fallbackSuggestion}, or ask your admin to enable this model.`
        : `There's an issue with the selected model (${model}). It may not exist or you may not have access to it. Run ${switchCmd} to pick a different model.`,
      error: 'invalid_request',
    })
  }

  // Connection errors (non-timeout) — use formatAPIError for detailed messages
  // 满足 `error instanceof APIConnectionError` 时，API 服务 errors执行该分支。
  if (error instanceof APIConnectionError) {
    // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
    return createAssistantAPIErrorMessage({
      content: `${API_ERROR_MESSAGE_PREFIX}: ${formatAPIError(error)}`,
      error: 'unknown',
    })
  }

  // 满足 `error instanceof Error` 时，API 服务 errors执行该分支。
  if (error instanceof Error) {
    // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
    return createAssistantAPIErrorMessage({
      content: `${API_ERROR_MESSAGE_PREFIX}: ${error.message}`,
      error: 'unknown',
    })
  }
  // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
  return createAssistantAPIErrorMessage({
    content: API_ERROR_MESSAGE_PREFIX,
    error: 'unknown',
  })
}

/**
 * For 3P users, suggest a fallback model when the selected model is unavailable.
 * Returns a model name suggestion, or undefined if no suggestion is applicable.
 */
// get3PModelFallbackSuggestion 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function get3PModelFallbackSuggestion(model: string): string | undefined {
  // 当 `getAPIProvider()` 匹配 `'firstParty'` 时，API 服务 errors执行对应分支。
  if (getAPIProvider() === 'firstParty') {
    // 返回 `undefined`，作为API 服务 errors这次计算的结果。
    return undefined
  }
  // @[MODEL LAUNCH]: Add a fallback suggestion chain for the new model → previous version for 3P
  // m保存`model.toLowerCase`，供API 服务 errors后续处理使用。
  const m = model.toLowerCase()
  // If the failing model looks like an Opus 4.6 variant, suggest the default Opus (4.1 for 3P)
  // 组合条件 `m.includes('opus-4-6') || m.includes('opus_4_6')` 成立时，API 服务 errors才启用这条专门路径。
  if (m.includes('opus-4-6') || m.includes('opus_4_6')) {
    // 返回 `getModelStrings().opus41`，作为API 服务 errors这次计算的结果。
    return getModelStrings().opus41
  }
  // If the failing model looks like a Sonnet 4.6 variant, suggest Sonnet 4.5
  // 组合条件 `m.includes('sonnet-4-6') || m.includes('sonnet_4_6')` 成立时，API 服务 errors才启用这条专门路径。
  if (m.includes('sonnet-4-6') || m.includes('sonnet_4_6')) {
    // 返回 `getModelStrings().sonnet45`，作为API 服务 errors这次计算的结果。
    return getModelStrings().sonnet45
  }
  // If the failing model looks like a Sonnet 4.5 variant, suggest Sonnet 4
  // 组合条件 `m.includes('sonnet-4-5') || m.includes('sonnet_4_5')` 成立时，API 服务 errors才启用这条专门路径。
  if (m.includes('sonnet-4-5') || m.includes('sonnet_4_5')) {
    // 返回 `getModelStrings().sonnet40`，作为API 服务 errors这次计算的结果。
    return getModelStrings().sonnet40
  }
  // 返回 `undefined`，作为API 服务 errors这次计算的结果。
  return undefined
}

/**
 * Classifies an API error into a specific error type for analytics tracking.
 * Returns a standardized error type string suitable for Datadog tagging.
 */
// classifyAPIError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyAPIError(error: unknown): string {
  // Aborted requests
  // 组合条件 `error instanceof Error && error.message === 'Requ` 成立时，API 服务 errors才启用这条专门路径。
  if (error instanceof Error && error.message === 'Request was aborted.') {
    // 返回 `'aborted'`，作为API 服务 errors这次计算的结果。
    return 'aborted'
  }

  // Timeout errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIConnectionTimeoutError ||
    (error instanceof APIConnectionError &&
      error.message.toLowerCase().includes('timeout'))
  ) {
    // 返回 `'api_timeout'`，作为API 服务 errors这次计算的结果。
    return 'api_timeout'
  }

  // Check for repeated 529 errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.includes(REPEATED_529_ERROR_MESSAGE)
  ) {
    // 返回 `'repeated_529'`，作为API 服务 errors这次计算的结果。
    return 'repeated_529'
  }

  // Check for emergency capacity off switch
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.includes(CUSTOM_OFF_SWITCH_MESSAGE)
  ) {
    // 返回 `'capacity_off_switch'`，作为API 服务 errors这次计算的结果。
    return 'capacity_off_switch'
  }

  // Rate limiting
  // 组合条件 `error instanceof APIError && error.status === 429` 成立时，API 服务 errors才启用这条专门路径。
  if (error instanceof APIError && error.status === 429) {
    // 返回 `'rate_limit'`，作为API 服务 errors这次计算的结果。
    return 'rate_limit'
  }

  // Server overload (529)
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    (error.status === 529 ||
      error.message?.includes('"type":"overloaded_error"'))
  ) {
    // 返回 `'server_overload'`，作为API 服务 errors这次计算的结果。
    return 'server_overload'
  }

  // Prompt/content size errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message
      .toLowerCase()
      .includes(PROMPT_TOO_LONG_ERROR_MESSAGE.toLowerCase())
  ) {
    // 返回 `'prompt_too_long'`，作为API 服务 errors这次计算的结果。
    return 'prompt_too_long'
  }

  // PDF errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    /maximum of \d+ PDF pages/.test(error.message)
  ) {
    // 返回 `'pdf_too_large'`，作为API 服务 errors这次计算的结果。
    return 'pdf_too_large'
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.includes('The PDF specified is password protected')
  ) {
    // 返回 `'pdf_password_protected'`，作为API 服务 errors这次计算的结果。
    return 'pdf_password_protected'
  }

  // Image size errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('image exceeds') &&
    error.message.includes('maximum')
  ) {
    // 返回 `'image_too_large'`，作为API 服务 errors这次计算的结果。
    return 'image_too_large'
  }

  // Many-image dimension errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('image dimensions exceed') &&
    error.message.includes('many-image')
  ) {
    // 返回 `'image_too_large'`，作为API 服务 errors这次计算的结果。
    return 'image_too_large'
  }

  // Tool use errors (400)
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes(
      '`tool_use` ids were found without `tool_result` blocks immediately after',
    )
  ) {
    // 返回 `'tool_use_mismatch'`，作为API 服务 errors这次计算的结果。
    return 'tool_use_mismatch'
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('unexpected `tool_use_id` found in `tool_result`')
  ) {
    // 返回 `'unexpected_tool_result'`，作为API 服务 errors这次计算的结果。
    return 'unexpected_tool_result'
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.includes('`tool_use` ids must be unique')
  ) {
    // 返回 `'duplicate_tool_use_id'`，作为API 服务 errors这次计算的结果。
    return 'duplicate_tool_use_id'
  }

  // Invalid model errors (400)
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 400 &&
    error.message.toLowerCase().includes('invalid model name')
  ) {
    // 返回 `'invalid_model'`，作为API 服务 errors这次计算的结果。
    return 'invalid_model'
  }

  // Credit/billing errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message
      .toLowerCase()
      .includes(CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE.toLowerCase())
  ) {
    // 返回 `'credit_balance_low'`，作为API 服务 errors这次计算的结果。
    return 'credit_balance_low'
  }

  // Authentication errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes('x-api-key')
  ) {
    // 返回 `'invalid_api_key'`，作为API 服务 errors这次计算的结果。
    return 'invalid_api_key'
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    error.status === 403 &&
    error.message.includes('OAuth token has been revoked')
  ) {
    // 返回 `'token_revoked'`，作为API 服务 errors这次计算的结果。
    return 'token_revoked'
  }

  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    (error.status === 401 || error.status === 403) &&
    error.message.includes(
      'OAuth authentication is currently not allowed for this organization',
    )
  ) {
    // 返回 `'oauth_org_not_allowed'`，作为API 服务 errors这次计算的结果。
    return 'oauth_org_not_allowed'
  }

  // Generic auth errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error instanceof APIError &&
    (error.status === 401 || error.status === 403)
  ) {
    // 返回 `'auth_error'`，作为API 服务 errors这次计算的结果。
    return 'auth_error'
  }

  // Bedrock-specific errors
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) &&
    error instanceof Error &&
    error.message.toLowerCase().includes('model id')
  ) {
    // 返回 `'bedrock_model_access'`，作为API 服务 errors这次计算的结果。
    return 'bedrock_model_access'
  }

  // Status code based fallbacks
  // 满足 `error instanceof APIError` 时，API 服务 errors执行该分支。
  if (error instanceof APIError) {
    // status 集合保存`error.status`，供API 服务 errors后续判断或输出使用。
    const status = error.status
    // 满足 `status >= 500` 时，API 服务 errors执行该分支。
    if (status >= 500) return 'server_error'
    // 满足 `status >= 400` 时，API 服务 errors执行该分支。
    if (status >= 400) return 'client_error'
  }

  // Connection errors - check for SSL/TLS issues first
  // 满足 `error instanceof APIConnectionError` 时，API 服务 errors执行该分支。
  if (error instanceof APIConnectionError) {
    // connectionDetails 集合保存`extractConnectionErrorDetails`，供API 服务 errors后续处理使用。
    const connectionDetails = extractConnectionErrorDetails(error)
    // 满足 `connectionDetails?.isSSLError` 时，API 服务 errors执行该分支。
    if (connectionDetails?.isSSLError) {
      // 返回 `'ssl_cert_error'`，作为API 服务 errors这次计算的结果。
      return 'ssl_cert_error'
    }
    // 返回 `'connection_error'`，作为API 服务 errors这次计算的结果。
    return 'connection_error'
  }

  // 返回 `'unknown'`，作为API 服务 errors这次计算的结果。
  return 'unknown'
}

// categorizeRetryableAPIError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function categorizeRetryableAPIError(
  error: APIError,
): SDKAssistantMessageError {
  // API 服务 errors在这里进入条件判断，后续代码按实际状态分流。
  if (
    error.status === 529 ||
    error.message?.includes('"type":"overloaded_error"')
  ) {
    // 返回 `'rate_limit'`，作为API 服务 errors这次计算的结果。
    return 'rate_limit'
  }
  // 满足 `error.status === 429` 时，API 服务 errors执行该分支。
  if (error.status === 429) {
    // 返回 `'rate_limit'`，作为API 服务 errors这次计算的结果。
    return 'rate_limit'
  }
  // 组合条件 `error.status === 401 || error.status === 403` 成立时，API 服务 errors才启用这条专门路径。
  if (error.status === 401 || error.status === 403) {
    // 返回 `'authentication_failed'`，作为API 服务 errors这次计算的结果。
    return 'authentication_failed'
  }
  // `error.status` 与 `undefined && error.status >= 408` 不一致时刷新派生状态，避免使用过期结果。
  if (error.status !== undefined && error.status >= 408) {
    // 返回 `'server_error'`，作为API 服务 errors这次计算的结果。
    return 'server_error'
  }
  // 返回 `'unknown'`，作为API 服务 errors这次计算的结果。
  return 'unknown'
}

// getErrorMessageIfRefusal 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getErrorMessageIfRefusal(
  stopReason: BetaStopReason | null,
  model: string,
): AssistantMessage | undefined {
  // `stopReason` 与 `'refusal'` 不一致时刷新派生状态，避免使用过期结果。
  if (stopReason !== 'refusal') {
    // API 服务 errors在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录API 服务 errors运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_refusal_api_response', {})

  // baseMessage 消息数据读取`getIsNonInteractiveSession`，供API 服务 errors后续处理使用。
  const baseMessage = getIsNonInteractiveSession()
    ? `${API_ERROR_MESSAGE_PREFIX}: Claude Code is unable to respond to this request, which appears to violate our Usage Policy (https://www.anthropic.com/legal/aup). Try rephrasing the request or attempting a different approach.`
    : `${API_ERROR_MESSAGE_PREFIX}: Claude Code is unable to respond to this request, which appears to violate our Usage Policy (https://www.anthropic.com/legal/aup). Please double press esc to edit your last message or start a new session for Claude Code to assist with a different task.`

  // modelSuggestion 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const modelSuggestion =
    model !== 'claude-sonnet-4-20250514'
      ? ' If you are seeing this refusal repeatedly, try running /model claude-sonnet-4-20250514 to switch models.'
      : ''

  // 返回 `createAssistantAPIErrorMessage({`，作为API 服务 errors这次计算的结果。
  return createAssistantAPIErrorMessage({
    content: baseMessage + modelSuggestion,
    error: 'invalid_request',
  })
}
