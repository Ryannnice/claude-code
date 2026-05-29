/**
 * Session title generation via Haiku.
 *
 * Standalone module with minimal dependencies so it can be imported from
 * print.ts (SDK control request handler) without pulling in the React/chalk/
 * git dependency chain that teleport.tsx carries.
 *
 * This is the single source of truth for AI-generated session titles across
 * all surfaces. Previously there were separate Haiku title generators:
 * - teleport.tsx generateTitleAndBranch (6-word title + branch for CCR)
 * - rename/generateSessionName.ts (kebab-case name for /rename)
 * Each remains for backwards compat; new callers should use this module.
 */

// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getIsNonInteractiveSession，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../bootstrap/state.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 接入 queryHaiku 服务层能力，把外部通信或共享状态交给 ../services/api/claude.js 处理。
import { queryHaiku } from '../services/api/claude.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 safeParseJSON，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from './json.js'
// 引入 lazySchema，将 ./lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from './lazySchema.js'
// 引入 extractTextContent，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { extractTextContent } from './messages.js'
// 引入 asSystemPrompt，将 ./systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from './systemPromptType.js'

// MAX_CONVERSATION_TEXT 命名 `1000`，让后续代码直接表达这个值的用途。
const MAX_CONVERSATION_TEXT = 1000

/**
 * Flatten a message array into a single text string for Haiku title input.
 * Skips meta/non-human messages. Tail-slices to the last 1000 chars so
 * recent context wins when the conversation is long.
 */
// extractConversationText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractConversationText(messages: Message[]): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // `msg.type` 与 `'user' && msg.type !== 'assista...` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'user' && msg.type !== 'assistant') continue
    // 只有 `'isMeta' in msg && msg.isMeta` 满足时，共享工具才执行该分支。
    if ('isMeta' in msg && msg.isMeta) continue
    // `'origin' in msg && msg.origin && msg.origin...` 与 `'human'` 不一致时刷新派生状态，避免使用过期结果。
    if ('origin' in msg && msg.origin && msg.origin.kind !== 'human') continue
    // 文本内容保存`msg.message.content`，供共享工具 session Title后续判断或输出使用。
    const content = msg.message.content
    // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof content === 'string') {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(content)
    // 共享工具 session Title在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
    } else if (Array.isArray(content)) {
      // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
      for (const block of content) {
        // 只有 `'type' in block && block.type === 'text' && 'text` 满足时，共享工具才执行该分支。
        if ('type' in block && block.type === 'text' && 'text' in block) {
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(block.text as string)
        }
      }
    }
  }
  // 文本格式化`parts.join`，供共享工具后续处理使用。
  const text = parts.join('\n')
  // 返回 `text.length > MAX_CONVERSATION_TEXT`，作为共享工具这次计算的结果。
  return text.length > MAX_CONVERSATION_TEXT
    ? text.slice(-MAX_CONVERSATION_TEXT)
    : text
}

// SESSION_TITLE_PROMPT 会话数据保存`title`，供共享工具后续处理使用。
const SESSION_TITLE_PROMPT = `Generate a concise, sentence-case title (3-7 words) that captures the main topic or goal of this coding session. The title should be clear enough that the user recognizes the session in a list. Use sentence case: capitalize only the first word and proper nouns.

Return JSON with a single "title" field.

Good examples:
{"title": "Fix login button on mobile"}
{"title": "Add OAuth authentication"}
{"title": "Debug failing CI tests"}
{"title": "Refactor API client error handling"}

Bad (too vague): {"title": "Code changes"}
Bad (too long): {"title": "Investigate and fix the issue where the login button does not respond on mobile devices"}
Bad (wrong case): {"title": "Fix Login Button On Mobile"}`

// titleSchema 标题保存`lazySchema`，供共享工具后续处理使用。
const titleSchema = lazySchema(() => z.object({ title: z.string() }))

/**
 * Generate a sentence-case session title from a description or first message.
 * Returns null on error or if Haiku returns an unparseable response.
 *
 * @param description - The user's first message or a description of the session
 * @param signal - Abort signal for cancellation
 */
// generateSessionTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateSessionTitle(
  description: string,
  signal: AbortSignal,
): Promise<string | null> {
  // trimmed格式化`description.trim`，供共享工具后续处理使用。
  const trimmed = description.trim()
  // trimmed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trimmed) return null

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`queryHaiku`，供共享工具后续处理使用。
    const result = await queryHaiku({
      systemPrompt: asSystemPrompt([SESSION_TITLE_PROMPT]),
      userPrompt: trimmed,
      outputFormat: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
          },
          required: ['title'],
          additionalProperties: false,
        },
      },
      signal,
      options: {
        querySource: 'generate_session_title',
        agents: [],
        // Reflect the actual session mode — this module is called from
        // both the SDK print path (non-interactive) and the CCR remote
        // session path via useRemoteSession (interactive).
        isNonInteractiveSession: getIsNonInteractiveSession(),
        hasAppendSystemPrompt: false,
        mcpTools: [],
      },
    })

    // 文本保存`extractTextContent`，供共享工具后续处理使用。
    const text = extractTextContent(result.message.content)

    // 解析结果保存`titleSchema`，供共享工具后续处理使用。
    const parsed = titleSchema().safeParse(safeParseJSON(text))
    // title 标题格式化`title.trim`，供共享工具后续处理使用。
    const title = parsed.success ? parsed.data.title.trim() || null : null

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_session_title_generated', { success: title !== null })

    // 返回 `title`，作为共享工具这次计算的结果。
    return title
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`generateSessionTitle failed: ${error}`, {
      level: 'error',
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_session_title_generated', { success: false })
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}
