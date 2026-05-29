// 类型依赖 { BetaUsage as Usage } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaUsage as Usage } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 接入 roughTokenCountEstimationForMessages 服务层能力，把外部通信或共享状态交给 ../services/tokenEstimation.js 处理。
import { roughTokenCountEstimationForMessages } from '../services/tokenEstimation.js'
// 类型依赖 { AssistantMessage, Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { AssistantMessage, Message } from '../types/message.js'
// 引入 SYNTHETIC_MESSAGES、SYNTHETIC_MODEL，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { SYNTHETIC_MESSAGES, SYNTHETIC_MODEL } from './messages.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// getTokenUsage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTokenUsage(message: Message): Usage | undefined {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    message?.type === 'assistant' &&
    'usage' in message.message &&
    !(
      message.message.content[0]?.type === 'text' &&
      SYNTHETIC_MESSAGES.has(message.message.content[0].text)
    ) &&
    message.message.model !== SYNTHETIC_MODEL
  ) {
    // 返回 `message.message.usage`，作为共享工具这次计算的结果。
    return message.message.usage
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Get the API response id for an assistant message with real (non-synthetic) usage.
 * Used to identify split assistant records that came from the same API response —
 * when parallel tool calls are streamed, each content block becomes a separate
 * AssistantMessage record, but they all share the same message.id.
 */
// getAssistantMessageId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAssistantMessageId(message: Message): string | undefined {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    message?.type === 'assistant' &&
    'id' in message.message &&
    message.message.model !== SYNTHETIC_MODEL
  ) {
    // 返回 `message.message.id`，作为共享工具这次计算的结果。
    return message.message.id
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Calculate total context window tokens from an API response's usage data.
 * Includes input_tokens + cache tokens + output_tokens.
 *
 * This represents the full context size at the time of that API call.
 * Use tokenCountWithEstimation() when you need context size from messages.
 */
// getTokenCountFromUsage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTokenCountFromUsage(usage: Usage): number {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    usage.input_tokens +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0) +
    usage.output_tokens
  )
}

// tokenCountFromLastAPIResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tokenCountFromLastAPIResponse(messages: Message[]): number {
  // i保存 `messages.length - 1` 的判断结果，供共享工具 tokens后续分支直接复用。
  let i = messages.length - 1
  // while 使用 i >= 0 完成共享工具里的对应操作。
  while (i >= 0) {
    // 消息保存`messages[i]`，供共享工具 tokens后续判断或输出使用。
    const message = messages[i]
    // usage读取`getTokenUsage`，供共享工具后续处理使用。
    const usage = message ? getTokenUsage(message) : undefined
    // 满足 `usage` 时，共享工具执行该分支。
    if (usage) {
      // 返回 `getTokenCountFromUsage(usage)`，作为共享工具这次计算的结果。
      return getTokenCountFromUsage(usage)
    }
    // 共享工具 tokens在这里处理 `i--`，完成这一小步状态转换。
    i--
  }
  // 返回 `0`，作为共享工具这次计算的结果。
  return 0
}

/**
 * Final context window size from the last API response's usage.iterations[-1].
 * Used for task_budget.remaining computation across compaction boundaries —
 * the server's budget countdown is context-based, so remaining decrements by
 * the pre-compact final window, not billing spend. See monorepo
 * api/api/sampling/prompt/renderer.py:292 for the server-side computation.
 *
 * Falls back to top-level input_tokens + output_tokens when iterations is
 * absent (no server-side tool loops, so top-level usage IS the final window).
 * Both paths exclude cache tokens to match #304930's formula.
 */
// finalContextTokensFromLastResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function finalContextTokensFromLastResponse(
  messages: Message[],
): number {
  // i保存 `messages.length - 1` 的判断结果，供共享工具 tokens后续分支直接复用。
  let i = messages.length - 1
  // while 使用 i >= 0 完成共享工具里的对应操作。
  while (i >= 0) {
    // 消息保存`messages[i]`，供共享工具 tokens后续判断或输出使用。
    const message = messages[i]
    // usage读取`getTokenUsage`，供共享工具后续处理使用。
    const usage = message ? getTokenUsage(message) : undefined
    // 满足 `usage` 时，共享工具执行该分支。
    if (usage) {
      // Stainless types don't include iterations yet — cast like advisor.ts:43
      // iterations 集合 命名 `(`，让后续代码直接表达这个值的用途。
      const iterations = (
        usage as {
          iterations?: Array<{
            input_tokens: number
            output_tokens: number
          }> | null
        }
      ).iterations
      // 只有 `iterations && iterations.length > 0` 满足时，共享工具才执行该分支。
      if (iterations && iterations.length > 0) {
        // last保存`iterations.at`，供共享工具后续处理使用。
        const last = iterations.at(-1)!
        // 返回 `last.input_tokens + last.output_tokens`，作为共享工具这次计算的结果。
        return last.input_tokens + last.output_tokens
      }
      // No iterations → no server tool loop → top-level usage IS the final
      // window. Match the iterations path's formula (input + output, no cache)
      // rather than getTokenCountFromUsage — #304930 defines final window as
      // non-cache input + output. Whether the server's budget countdown
      // (renderer.py:292 calculate_context_tokens) counts cache the same way
      // is an open question; aligning with the iterations path keeps the two
      // branches consistent until that's resolved.
      // 返回 `usage.input_tokens + usage.output_tokens`，作为共享工具这次计算的结果。
      return usage.input_tokens + usage.output_tokens
    }
    // 共享工具 tokens在这里处理 `i--`，完成这一小步状态转换。
    i--
  }
  // 返回 `0`，作为共享工具这次计算的结果。
  return 0
}

/**
 * Get only the output_tokens from the last API response.
 * This excludes input context (system prompt, tools, prior messages).
 *
 * WARNING: Do NOT use this for threshold comparisons (autocompact, session memory).
 * Use tokenCountWithEstimation() instead, which measures full context size.
 * This function is only useful for measuring how many tokens Claude generated
 * in a single response, not how full the context window is.
 */
// messageTokenCountFromLastAPIResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function messageTokenCountFromLastAPIResponse(
  messages: Message[],
): number {
  // i保存 `messages.length - 1` 的判断结果，供共享工具 tokens后续分支直接复用。
  let i = messages.length - 1
  // while 使用 i >= 0 完成共享工具里的对应操作。
  while (i >= 0) {
    // 消息保存`messages[i]`，供共享工具 tokens后续判断或输出使用。
    const message = messages[i]
    // usage读取`getTokenUsage`，供共享工具后续处理使用。
    const usage = message ? getTokenUsage(message) : undefined
    // 满足 `usage` 时，共享工具执行该分支。
    if (usage) {
      // 返回 `usage.output_tokens`，作为共享工具这次计算的结果。
      return usage.output_tokens
    }
    // 共享工具 tokens在这里处理 `i--`，完成这一小步状态转换。
    i--
  }
  // 返回 `0`，作为共享工具这次计算的结果。
  return 0
}

// getCurrentUsage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentUsage(messages: Message[]): {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
} | null {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息保存`messages[i]`，供共享工具 tokens后续判断或输出使用。
    const message = messages[i]
    // usage读取`getTokenUsage`，供共享工具后续处理使用。
    const usage = message ? getTokenUsage(message) : undefined
    // 满足 `usage` 时，共享工具执行该分支。
    if (usage) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
      }
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// doesMostRecentAssistantMessageExceed200k 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function doesMostRecentAssistantMessageExceed200k(
  messages: Message[],
): boolean {
  // THRESHOLD 命名 `200_000`，让后续代码直接表达这个值的用途。
  const THRESHOLD = 200_000

  // lastAsst筛选`messages.findLast`，供共享工具后续处理使用。
  const lastAsst = messages.findLast(m => m.type === 'assistant')
  // lastAsst缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastAsst) return false
  // usage读取`getTokenUsage`，供共享工具后续处理使用。
  const usage = getTokenUsage(lastAsst)
  // 返回 `usage ? getTokenCountFromUsage(usage) > THRESHOLD : false`，作为共享工具这次计算的结果。
  return usage ? getTokenCountFromUsage(usage) > THRESHOLD : false
}

/**
 * Calculate the character content length of an assistant message.
 * Used for spinner token estimation (characters / 4 ≈ tokens).
 * This is used when subagent streaming events are filtered out and we
 * need to count content from completed messages instead.
 *
 * Counts the same content that handleMessageFromStream would count via deltas:
 * - text (text_delta)
 * - thinking (thinking_delta)
 * - redacted_thinking data
 * - tool_use input (input_json_delta)
 * Note: signature_delta is excluded from streaming counts (not model output).
 */
// getAssistantMessageContentLength 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAssistantMessageContentLength(
  message: AssistantMessage,
): number {
  // contentLength 数量保存`0`，供后续判断或组装使用。
  let contentLength = 0
  // 按顺序遍历 `message.message.content` 中的block，逐个交给共享工具处理。
  for (const block of message.message.content) {
    // 当 `block.type` 匹配 `'text'` 时，共享工具执行对应分支。
    if (block.type === 'text') {
      // 共享工具 tokens在这里处理 `contentLength += block.text.length`，完成这一小步状态转换。
      contentLength += block.text.length
    // 共享工具 tokens在这里处理 `} else if (block.type === 'thinking') {`，完成这一小步状态转换。
    } else if (block.type === 'thinking') {
      // 共享工具 tokens在这里处理 `contentLength += block.thinking.length`，完成这一小步状态转换。
      contentLength += block.thinking.length
    // 共享工具 tokens在这里处理 `} else if (block.type === 'redacted_thinking') {`，完成这一小步状态转换。
    } else if (block.type === 'redacted_thinking') {
      // 共享工具 tokens在这里处理 `contentLength += block.data.length`，完成这一小步状态转换。
      contentLength += block.data.length
    // 共享工具 tokens在这里处理 `} else if (block.type === 'tool_use') {`，完成这一小步状态转换。
    } else if (block.type === 'tool_use') {
      // 共享工具 tokens在这里处理 `contentLength += jsonStringify(block.input).length`，完成这一小步状态转换。
      contentLength += jsonStringify(block.input).length
    }
  }
  // 返回 `contentLength`，作为共享工具这次计算的结果。
  return contentLength
}

/**
 * Get the current context window size in tokens.
 *
 * This is the CANONICAL function for measuring context size when checking
 * thresholds (autocompact, session memory init, etc.). Uses the last API
 * response's token count (input + output + cache) plus estimates for any
 * messages added since.
 *
 * Always use this instead of:
 * - Cumulative token counting (which double-counts as context grows)
 * - messageTokenCountFromLastAPIResponse (which only counts output_tokens)
 * - tokenCountFromLastAPIResponse (which doesn't estimate new messages)
 *
 * Implementation note on parallel tool calls: when the model makes multiple
 * tool calls in one response, the streaming code emits a SEPARATE assistant
 * record per content block (all sharing the same message.id and usage), and
 * the query loop interleaves each tool_result immediately after its tool_use.
 * So the messages array looks like:
 *   [..., assistant(id=A), user(result), assistant(id=A), user(result), ...]
 * If we stop at the LAST assistant record, we only estimate the one tool_result
 * after it and miss all the earlier interleaved tool_results — which will ALL
 * be in the next API request. To avoid undercounting, after finding a usage-
 * bearing record we walk back to the FIRST sibling with the same message.id
 * so every interleaved tool_result is included in the rough estimate.
 */
// tokenCountWithEstimation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tokenCountWithEstimation(messages: readonly Message[]): number {
  // i保存 `messages.length - 1` 的判断结果，供共享工具 tokens后续分支直接复用。
  let i = messages.length - 1
  // while 使用 i >= 0 完成共享工具里的对应操作。
  while (i >= 0) {
    // 消息保存`messages[i]`，供共享工具 tokens后续判断或输出使用。
    const message = messages[i]
    // usage读取`getTokenUsage`，供共享工具后续处理使用。
    const usage = message ? getTokenUsage(message) : undefined
    // 只有 `message && usage` 满足时，共享工具才执行该分支。
    if (message && usage) {
      // Walk back past any earlier sibling records split from the same API
      // response (same message.id) so interleaved tool_results between them
      // are included in the estimation slice.
      // responseId 响应数据读取`getAssistantMessageId`，供共享工具后续处理使用。
      const responseId = getAssistantMessageId(message)
      // 满足 `responseId` 时，共享工具执行该分支。
      if (responseId) {
        // j保存`i - 1`，供共享工具 tokens后续判断或输出使用。
        let j = i - 1
        // while 使用 j >= 0 完成共享工具里的对应操作。
        while (j >= 0) {
          // prior 命名 `messages[j]`，让后续代码直接表达这个值的用途。
          const prior = messages[j]
          // priorId读取`getAssistantMessageId`，供共享工具后续处理使用。
          const priorId = prior ? getAssistantMessageId(prior) : undefined
          // 满足 `priorId === responseId` 时，共享工具执行该分支。
          if (priorId === responseId) {
            // Earlier split of the same API response — anchor here instead.
            // i更新为 `j`，确保共享工具后续读取最新状态。
            i = j
          // 共享工具 tokens在这里处理 `} else if (priorId !== undefined) {`，完成这一小步状态转换。
          } else if (priorId !== undefined) {
            // Hit a different API response — stop walking.
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
          // priorId === undefined: a user/tool_result/attachment message,
          // possibly interleaved between splits — keep walking.
          // 共享工具 tokens在这里处理 `j--`，完成这一小步状态转换。
          j--
        }
      }
      // 返回 `(`，作为共享工具这次计算的结果。
      return (
        getTokenCountFromUsage(usage) +
        roughTokenCountEstimationForMessages(messages.slice(i + 1))
      )
    }
    // 共享工具 tokens在这里处理 `i--`，完成这一小步状态转换。
    i--
  }
  // 返回 `roughTokenCountEstimationForMessages(messages)`，作为共享工具这次计算的结果。
  return roughTokenCountEstimationForMessages(messages)
}
