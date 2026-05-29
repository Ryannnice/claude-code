/**
 * Side Question ("/btw") feature - allows asking quick questions without
 * interrupting the main agent context.
 *
 * Uses runForkedAgent to leverage prompt caching from the parent context
 * while keeping the side question response separate from main conversation.
 */

// 接入 formatAPIError 服务层能力，把外部通信或共享状态交给 ../services/api/errorUtils.js 处理。
import { formatAPIError } from '../services/api/errorUtils.js'
// 类型依赖 { NonNullableUsage } 来自 ../services/api/logging.js，用于校准共享工具的数据契约。
import type { NonNullableUsage } from '../services/api/logging.js'
// 类型依赖 { Message, SystemAPIErrorMessage } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message, SystemAPIErrorMessage } from '../types/message.js'
// 引入 CacheSafeParams、runForkedAgent，将 ./forkedAgent.js 中已经封装好的能力接到本文件流程里。
import { type CacheSafeParams, runForkedAgent } from './forkedAgent.js'
// 引入 createUserMessage、extractTextContent，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { createUserMessage, extractTextContent } from './messages.js'

// Pattern to detect "/btw" at start of input (case-insensitive, word boundary)
// BTW_PATTERN保存`/^\/btw\b/gi`，供共享工具 side Question后续判断或输出使用。
const BTW_PATTERN = /^\/btw\b/gi

/**
 * Find positions of "/btw" keyword at the start of text for highlighting.
 * Similar to findThinkingTriggerPositions in thinking.ts.
 */
// findBtwTriggerPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findBtwTriggerPositions(text: string): Array<{
  word: string
  start: number
  end: number
}> {
  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: Array<{ word: string; start: number; end: number }> = []
  // matches 集合保存`text.matchAll`，供共享工具后续处理使用。
  const matches = text.matchAll(BTW_PATTERN)

  // 按顺序遍历 `matches` 中的match，逐个交给共享工具处理。
  for (const match of matches) {
    // `match.index` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (match.index !== undefined) {
      // positions 集合追加新条目，保持收集顺序与输入顺序一致。
      positions.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      })
    }
  }

  // 返回 `positions`，作为共享工具这次计算的结果。
  return positions
}

// SideQuestionResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SideQuestionResult = {
  response: string | null
  usage: NonNullableUsage
}

/**
 * Run a side question using a forked agent.
 * Shares the parent's prompt cache — no thinking override, no cache write.
 * All tools are blocked and we cap at 1 turn.
 */
// runSideQuestion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runSideQuestion({
  question,
  cacheSafeParams,
}: {
  question: string
  cacheSafeParams: CacheSafeParams
}): Promise<SideQuestionResult> {
  // Wrap the question with instructions to answer without tools
  // wrappedQuestion固定为 ``<system-reminder>This is a side question from the user. ...`，作为共享工具 side Question后续展示或比较的基准。
  const wrappedQuestion = `<system-reminder>This is a side question from the user. You must answer this question directly in a single response.

IMPORTANT CONTEXT:
- You are a separate, lightweight agent spawned to answer this one question
- The main agent is NOT interrupted - it continues working independently in the background
- You share the conversation context but are a completely separate instance
- Do NOT reference being interrupted or what you were "previously doing" - that framing is incorrect

CRITICAL CONSTRAINTS:
- You have NO tools available - you cannot read files, run commands, search, or take any actions
- This is a one-off response - there will be no follow-up turns
- You can ONLY provide information based on what you already know from the conversation context
- NEVER say things like "Let me try...", "I'll now...", "Let me check...", or promise to take any action
- If you don't know the answer, say so - do not offer to look it up or investigate

Simply answer the question with the information you have.</system-reminder>

${question}`

  // agentResult保存`runForkedAgent`，供共享工具后续处理使用。
  const agentResult = await runForkedAgent({
    promptMessages: [createUserMessage({ content: wrappedQuestion })],
    // Do NOT override thinkingConfig — thinking is part of the API cache key,
    // and diverging from the main thread's config busts the prompt cache.
    // Adaptive thinking on a quick Q&A has negligible overhead.
    cacheSafeParams,
    // 这个回调绑定到 canUseTool: async () => ({，负责共享工具在该局部场景下的响应。
    canUseTool: async () => ({
      behavior: 'deny' as const,
      message: 'Side questions cannot use tools',
      decisionReason: { type: 'other' as const, reason: 'side_question' },
    }),
    querySource: 'side_question',
    forkLabel: 'side_question',
    maxTurns: 1, // Single turn only - no tool use loops
    // No future request shares this suffix; skip writing cache entries.
    skipCacheWrite: true,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    response: extractSideQuestionResponse(agentResult.messages),
    usage: agentResult.totalUsage,
  }
}

/**
 * Extract a display string from forked agent messages.
 *
 * IMPORTANT: claude.ts yields one AssistantMessage PER CONTENT BLOCK, not one
 * per API response. With adaptive thinking enabled (inherited from the main
 * thread to preserve the cache key), a thinking response arrives as:
 *   messages[0] = assistant { content: [thinking_block] }
 *   messages[1] = assistant { content: [text_block] }
 *
 * The old code used `.find(m => m.type === 'assistant')` which grabbed the
 * first (thinking-only) message, found no text block, and returned null →
 * "No response received". Repos with large context (many skills, big CLAUDE.md)
 * trigger thinking more often, which is why this reproduced in the monorepo
 * but not here.
 *
 * Secondary failure modes also surfaced as "No response received":
 *   - Model attempts tool_use → content = [thinking, tool_use], no text.
 *     Rare — the system-reminder usually prevents this, but handled here.
 *   - API error exhausts retries → query yields system api_error + user
 *     interruption, no assistant message at all.
 */
// extractSideQuestionResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractSideQuestionResponse(messages: Message[]): string | null {
  // Flatten all assistant content blocks across the per-block messages.
  // assistantBlocks 集合派生`messages.flatMap`，供共享工具后续处理使用。
  const assistantBlocks = messages.flatMap(m =>
    m.type === 'assistant' ? m.message.content : [],
  )

  // 满足 `assistantBlocks.length > 0` 时，共享工具执行该分支。
  if (assistantBlocks.length > 0) {
    // Concatenate all text blocks (there's normally at most one, but be safe).
    // 文本保存`extractTextContent`，供共享工具后续处理使用。
    const text = extractTextContent(assistantBlocks, '\n\n').trim()
    // 满足 `text` 时，共享工具执行该分支。
    if (text) return text

    // No text — check if the model tried to call a tool despite instructions.
    // toolUse筛选`assistantBlocks.find`，供共享工具后续处理使用。
    const toolUse = assistantBlocks.find(b => b.type === 'tool_use')
    // 满足 `toolUse` 时，共享工具执行该分支。
    if (toolUse) {
      // toolName 命名 `'name' in toolUse ? toolUse.name : 'a tool'`，让后续代码直接表达这个值的用途。
      const toolName = 'name' in toolUse ? toolUse.name : 'a tool'
      // 返回 ``(The model tried to call ${toolName} instead of answering directly. Tr...`，作为共享工具这次计算的结果。
      return `(The model tried to call ${toolName} instead of answering directly. Try rephrasing or ask in the main conversation.)`
    }
  }

  // No assistant content — likely API error exhausted retries. Surface the
  // first system api_error message so the user sees what happened.
  // apiErr筛选`messages.find`，供共享工具后续处理使用。
  const apiErr = messages.find(
    // 这个回调绑定到 (m): m is SystemAPIErrorMessage =>，负责共享工具在该局部场景下的响应。
    (m): m is SystemAPIErrorMessage =>
      m.type === 'system' && 'subtype' in m && m.subtype === 'api_error',
  )
  // 满足 `apiErr` 时，共享工具执行该分支。
  if (apiErr) {
    // 返回 ``(API error: ${formatAPIError(apiErr.error)})``，作为共享工具这次计算的结果。
    return `(API error: ${formatAPIError(apiErr.error)})`
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}
