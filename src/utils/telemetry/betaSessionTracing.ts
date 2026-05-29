/**
 * Beta Session Tracing for Claude Code
 *
 * This module contains beta tracing features enabled when
 * ENABLE_BETA_TRACING_DETAILED=1 and BETA_TRACING_ENDPOINT are set.
 *
 * For external users, tracing is enabled in SDK/headless mode, or in
 * interactive mode when the org is allowlisted via the
 * tengu_trace_lantern GrowthBook gate.
 * For ant users, tracing is enabled in all modes.
 *
 * Visibility Rules:
 * | Content          | External | Ant  |
 * |------------------|----------|------|
 * | System prompts   | ✅                  | ✅   |
 * | Model output     | ✅                  | ✅   |
 * | Thinking output  | ❌                  | ✅   |
 * | Tools            | ✅                  | ✅   |
 * | new_context      | ✅                  | ✅   |
 *
 * Features:
 * - Per-agent message tracking with hash-based deduplication
 * - System prompt logging (once per unique hash)
 * - Hook execution spans
 * - Detailed new_context attributes for LLM requests
 */

// 类型依赖 { Span } 来自 @opentelemetry/api，用于校准共享工具的数据契约。
import type { Span } from '@opentelemetry/api'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../../services/analytics/metadata.js'
// 类型依赖 { AssistantMessage, UserMessage } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { AssistantMessage, UserMessage } from '../../types/message.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 logOTelEvent，将 ./events.js 中已经封装好的能力接到本文件流程里。
import { logOTelEvent } from './events.js'

// Message type for API calls (UserMessage or AssistantMessage)
// APIMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type APIMessage = UserMessage | AssistantMessage

/**
 * Track hashes we've already logged this session (system prompts, tools, etc).
 *
 * WHY: System prompts and tool schemas are large and rarely change within a session.
 * Sending full content on every request would be wasteful. Instead, we hash and
 * only log the full content once per unique hash.
 */
// seenHashes 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
const seenHashes = new Set<string>()

/**
 * Track the last reported message hash per querySource (agent) for incremental context.
 *
 * WHY: When debugging traces, we want to see what NEW information was added each turn,
 * not the entire conversation history (which can be huge). By tracking the last message
 * we reported per agent, we can compute and send only the delta (new messages since
 * the last request). This is tracked per-agent (querySource) because different agents
 * (main thread, subagents, warmup requests) have independent conversation contexts.
 */
// lastReportedMessageHash 消息数据构建`new Map<string, string>()` 整理出中间结果，供共享工具 beta Session Tracing后续步骤使用。
const lastReportedMessageHash = new Map<string, string>()

/**
 * Clear tracking state after compaction.
 * Old hashes are irrelevant once messages have been replaced.
 */
// clearBetaTracingState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearBetaTracingState(): void {
  // 调用 seenHashes.clear，触发共享工具此处需要的副作用。
  seenHashes.clear()
  // 调用 lastReportedMessageHash.clear，触发共享工具此处需要的副作用。
  lastReportedMessageHash.clear()
}

// MAX_CONTENT_SIZE保存`KB`，供共享工具后续处理使用。
const MAX_CONTENT_SIZE = 60 * 1024 // 60KB (Honeycomb limit is 64KB, staying safe)

/**
 * Check if beta detailed tracing is enabled.
 * - Requires ENABLE_BETA_TRACING_DETAILED=1 and BETA_TRACING_ENDPOINT
 * - For external users, enabled in SDK/headless mode OR when org is
 *   allowlisted via the tengu_trace_lantern GrowthBook gate
 */
// isBetaTracingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBetaTracingEnabled(): boolean {
  // baseEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseEnabled =
    isEnvTruthy(process.env.ENABLE_BETA_TRACING_DETAILED) &&
    Boolean(process.env.BETA_TRACING_ENDPOINT)

  // baseEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!baseEnabled) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // For external users, enable in SDK/headless mode OR when org is allowlisted.
  // Gate reads from disk cache, so first run after allowlisting returns false;
  // works from second run onward (same behavior as enhanced_telemetry_beta).
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      getIsNonInteractiveSession() ||
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_trace_lantern', false)
    )
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Truncate content to fit within Honeycomb limits.
 */
// truncateContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateContent(
  content: string,
  maxSize: number = MAX_CONTENT_SIZE,
): { content: string; truncated: boolean } {
  // 满足 `content.length <= maxSize` 时，共享工具执行该分支。
  if (content.length <= maxSize) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content, truncated: false }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    content:
      content.slice(0, maxSize) +
      '\n\n[TRUNCATED - Content exceeds 60KB limit]',
    truncated: true,
  }
}

/**
 * Generate a short hash (first 12 hex chars of SHA-256).
 */
// shortHash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shortHash(content: string): string {
  // 返回 `createHash('sha256').update(content).digest('hex').slice(0, 12)`，作为共享工具这次计算的结果。
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}

/**
 * Generate a hash for a system prompt.
 */
// hashSystemPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashSystemPrompt(systemPrompt: string): string {
  // 返回 ``sp_${shortHash(systemPrompt)}``，作为共享工具这次计算的结果。
  return `sp_${shortHash(systemPrompt)}`
}

/**
 * Generate a hash for a message based on its content.
 */
// hashMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashMessage(message: APIMessage): string {
  // 文本内容保存`jsonStringify`，供共享工具后续处理使用。
  const content = jsonStringify(message.message.content)
  // 返回 ``msg_${shortHash(content)}``，作为共享工具这次计算的结果。
  return `msg_${shortHash(content)}`
}

// Regex to detect content wrapped in <system-reminder> tags
// SYSTEM_REMINDER_REGEX 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SYSTEM_REMINDER_REGEX =
  /^<system-reminder>\n?([\s\S]*?)\n?<\/system-reminder>$/

/**
 * Check if text is entirely a system reminder (wrapped in <system-reminder> tags).
 * Returns the inner content if it is, null otherwise.
 */
// extractSystemReminderContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractSystemReminderContent(text: string): string | null {
  // match格式化`text.trim`，供共享工具后续处理使用。
  const match = text.trim().match(SYSTEM_REMINDER_REGEX)
  // 返回 `match && match[1] ? match[1].trim() : null`，作为共享工具这次计算的结果。
  return match && match[1] ? match[1].trim() : null
}

/**
 * Result of formatting messages - separates regular content from system reminders.
 */
// FormattedMessages 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface FormattedMessages {
  contextParts: string[]
  systemReminders: string[]
}

/**
 * Format user messages for new_context display, separating system reminders.
 * Only handles user messages (assistant messages are filtered out before this is called).
 */
// formatMessagesForContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatMessagesForContext(messages: UserMessage[]): FormattedMessages {
  // contextParts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const contextParts: string[] = []
  // systemReminders 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const systemReminders: string[] = []

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // 文本内容 命名 `message.message.content`，让后续代码直接表达这个值的用途。
    const content = message.message.content
    // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof content === 'string') {
      // reminderContent保存`extractSystemReminderContent`，供共享工具后续处理使用。
      const reminderContent = extractSystemReminderContent(content)
      // 满足 `reminderContent` 时，共享工具执行该分支。
      if (reminderContent) {
        // systemReminders 集合追加新条目，保持收集顺序与输入顺序一致。
        systemReminders.push(reminderContent)
      } else {
        // contextParts 集合追加新条目，保持收集顺序与输入顺序一致。
        contextParts.push(`[USER]\n${content}`)
      }
    // 共享工具 beta Session Tracing在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
    } else if (Array.isArray(content)) {
      // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
      for (const block of content) {
        // 当 `block.type` 匹配 `'text'` 时，共享工具执行对应分支。
        if (block.type === 'text') {
          // reminderContent保存`extractSystemReminderContent`，供共享工具后续处理使用。
          const reminderContent = extractSystemReminderContent(block.text)
          // 满足 `reminderContent` 时，共享工具执行该分支。
          if (reminderContent) {
            // systemReminders 集合追加新条目，保持收集顺序与输入顺序一致。
            systemReminders.push(reminderContent)
          } else {
            // contextParts 集合追加新条目，保持收集顺序与输入顺序一致。
            contextParts.push(`[USER]\n${block.text}`)
          }
        // 共享工具 beta Session Tracing在这里处理 `} else if (block.type === 'tool_result') {`，完成这一小步状态转换。
        } else if (block.type === 'tool_result') {
          // resultContent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const resultContent =
            typeof block.content === 'string'
              ? block.content
              : jsonStringify(block.content)
          // Tool results can also contain system reminders (e.g., malware warning)
          // reminderContent保存`extractSystemReminderContent`，供共享工具后续处理使用。
          const reminderContent = extractSystemReminderContent(resultContent)
          // 满足 `reminderContent` 时，共享工具执行该分支。
          if (reminderContent) {
            // systemReminders 集合追加新条目，保持收集顺序与输入顺序一致。
            systemReminders.push(reminderContent)
          } else {
            // contextParts 集合追加新条目，保持收集顺序与输入顺序一致。
            contextParts.push(
              `[TOOL RESULT: ${block.tool_use_id}]\n${resultContent}`,
            )
          }
        }
      }
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { contextParts, systemReminders }
}

// LLMRequestNewContext 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface LLMRequestNewContext {
  /** System prompt (typically only on first request or if changed) */
  systemPrompt?: string
  /** Query source identifying the agent/purpose (e.g., 'repl_main_thread', 'agent:builtin') */
  querySource?: string
  /** Tool schemas sent with the request */
  tools?: string
}

/**
 * Add beta attributes to an interaction span.
 * Adds new_context with the user prompt.
 */
// addBetaInteractionAttributes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addBetaInteractionAttributes(
  span: Span,
  userPrompt: string,
): void {
  // 满足 `!isBetaTracingEnabled()` 时，共享工具执行该分支。
  if (!isBetaTracingEnabled()) {
    // 共享工具 beta Session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 从 `truncateContent(` 解构 content、truncated，减少共享工具 beta Session Tracing对同一对象的重复访问。
  const { content: truncatedPrompt, truncated } = truncateContent(
    `[USER PROMPT]\n${userPrompt}`,
  )
  // span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  span.setAttributes({
    new_context: truncatedPrompt,
    ...(truncated && {
      new_context_truncated: true,
      new_context_original_length: userPrompt.length,
    }),
  })
}

/**
 * Add beta attributes to an LLM request span.
 * Handles system prompt logging and new_context computation.
 */
// addBetaLLMRequestAttributes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addBetaLLMRequestAttributes(
  span: Span,
  newContext?: LLMRequestNewContext,
  messagesForAPI?: APIMessage[],
): void {
  // 满足 `!isBetaTracingEnabled()` 时，共享工具执行该分支。
  if (!isBetaTracingEnabled()) {
    // 共享工具 beta Session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Add system prompt info to the span
  // 满足 `newContext?.systemPrompt` 时，共享工具执行该分支。
  if (newContext?.systemPrompt) {
    // promptHash保存`hashSystemPrompt`，供共享工具后续处理使用。
    const promptHash = hashSystemPrompt(newContext.systemPrompt)
    // preview格式化`systemPrompt.slice`，供共享工具后续处理使用。
    const preview = newContext.systemPrompt.slice(0, 500)

    // Always add hash, preview, and length to the span
    // span.setAttribute 写入新的状态值，使共享工具后续读取保持一致。
    span.setAttribute('system_prompt_hash', promptHash)
    // span.setAttribute 写入新的状态值，使共享工具后续读取保持一致。
    span.setAttribute('system_prompt_preview', preview)
    // span.setAttribute 写入新的状态值，使共享工具后续读取保持一致。
    span.setAttribute('system_prompt_length', newContext.systemPrompt.length)

    // Log the full system prompt only once per unique hash this session
    // 满足 `!seenHashes.has(promptHash)` 时，共享工具执行该分支。
    if (!seenHashes.has(promptHash)) {
      // 调用 seenHashes.add，触发共享工具此处需要的副作用。
      seenHashes.add(promptHash)

      // Truncate for the log if needed
      // 从 `truncateContent(` 解构 content、truncated，减少共享工具 beta Session Tracing对同一对象的重复访问。
      const { content: truncatedPrompt, truncated } = truncateContent(
        newContext.systemPrompt,
      )

      // 显式忽略 `logOTelEvent('system_prompt', {` 的返回值，只保留它触发的副作用。
      void logOTelEvent('system_prompt', {
        system_prompt_hash: promptHash,
        system_prompt: truncatedPrompt,
        system_prompt_length: String(newContext.systemPrompt.length),
        ...(truncated && { system_prompt_truncated: 'true' }),
      })
    }
  }

  // Add tools info to the span
  // 满足 `newContext?.tools` 时，共享工具执行该分支。
  if (newContext?.tools) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // toolsArray解析`jsonParse`，供共享工具后续处理使用。
      const toolsArray = jsonParse(newContext.tools) as Record<
        string,
        unknown
      >[]

      // Build array of {name, hash} for each tool
      // toolsWithHashes 集合派生`toolsArray.map`，供共享工具后续处理使用。
      const toolsWithHashes = toolsArray.map(tool => {
        // toolJson保存`jsonStringify`，供共享工具后续处理使用。
        const toolJson = jsonStringify(tool)
        // toolHash保存`shortHash`，供共享工具后续处理使用。
        const toolHash = shortHash(toolJson)
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          name: typeof tool.name === 'string' ? tool.name : 'unknown',
          hash: toolHash,
          json: toolJson,
        }
      })

      // Set span attribute with array of name/hash pairs
      // span.setAttribute 写入新的状态值，使共享工具后续读取保持一致。
      span.setAttribute(
        'tools',
        jsonStringify(
          // 调用 toolsWithHashes.map，触发共享工具此处需要的副作用。
          toolsWithHashes.map(({ name, hash }) => ({ name, hash })),
        ),
      )
      // span.setAttribute 写入新的状态值，使共享工具后续读取保持一致。
      span.setAttribute('tools_count', toolsWithHashes.length)

      // Log each tool's full description once per unique hash
      // 循环处理 `const { name, hash, json } of toolsWithHashes`，让共享工具逐项把同类条目按顺序走完。
      for (const { name, hash, json } of toolsWithHashes) {
        // 满足 `!seenHashes.has(`tool_${hash}`)` 时，共享工具执行该分支。
        if (!seenHashes.has(`tool_${hash}`)) {
          // 调用 seenHashes.add，触发共享工具此处需要的副作用。
          seenHashes.add(`tool_${hash}`)

          // 从 `truncateContent(json)` 解构 content、truncated，减少共享工具 beta Session Tracing对同一对象的重复访问。
          const { content: truncatedTool, truncated } = truncateContent(json)

          // 显式忽略 `logOTelEvent('tool', {` 的返回值，只保留它触发的副作用。
          void logOTelEvent('tool', {
            tool_name: sanitizeToolNameForAnalytics(name),
            tool_hash: hash,
            tool: truncatedTool,
            ...(truncated && { tool_truncated: 'true' }),
          })
        }
      }
    } catch {
      // If parsing fails, log the raw tools string
      // span.setAttribute 写入新的状态值，使共享工具后续读取保持一致。
      span.setAttribute('tools_parse_error', true)
    }
  }

  // Add new_context using hash-based tracking (visible to all users)
  // 只有 `messagesForAPI && messagesForAPI.length > 0 && ne` 满足时，共享工具才执行该分支。
  if (messagesForAPI && messagesForAPI.length > 0 && newContext?.querySource) {
    // querySource保存`newContext.querySource`，供共享工具 beta Session Tracing后续判断或输出使用。
    const querySource = newContext.querySource
    // lastHash读取`lastReportedMessageHash.get`，供共享工具后续处理使用。
    const lastHash = lastReportedMessageHash.get(querySource)

    // Find where the last reported message is in the array
    // startIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
    let startIndex = 0
    // 满足 `lastHash` 时，共享工具执行该分支。
    if (lastHash) {
      // 按索引扫描 `messagesForAPI.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < messagesForAPI.length; i++) {
        // 消息读取 `messagesForAPI[i]` 对应条目，后续围绕该成员继续处理。
        const msg = messagesForAPI[i]
        // 只有 `msg && hashMessage(msg) === lastHash` 满足时，共享工具才执行该分支。
        if (msg && hashMessage(msg) === lastHash) {
          // startIndex 索引更新为 `i + 1 // Start after the last reported message`，确保共享工具后续读取最新状态。
          startIndex = i + 1 // Start after the last reported message
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
      }
      // If lastHash not found, startIndex stays 0 (send everything)
    }

    // Get new messages (filter out assistant messages - we only want user input/tool results)
    // newMessages 消息数据保存`messagesForAPI`，供共享工具 beta Session Tracing后续判断或输出使用。
    const newMessages = messagesForAPI
      .slice(startIndex)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((m): m is UserMessage => m.type === 'user')

    // 满足 `newMessages.length > 0` 时，共享工具执行该分支。
    if (newMessages.length > 0) {
      // Format new messages, separating system reminders from regular content
      // 共享工具 beta Session Tracing先整理这一处局部数据，后续分支可以直接读取。
      const { contextParts, systemReminders } =
        formatMessagesForContext(newMessages)

      // Set new_context (regular user content and tool results)
      // 满足 `contextParts.length > 0` 时，共享工具执行该分支。
      if (contextParts.length > 0) {
        // fullContext格式化`contextParts.join`，供共享工具后续处理使用。
        const fullContext = contextParts.join('\n\n---\n\n')
        // 共享工具 beta Session Tracing先整理这一处局部数据，后续分支可以直接读取。
        const { content: truncatedContext, truncated } =
          truncateContent(fullContext)

        // span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
        span.setAttributes({
          new_context: truncatedContext,
          new_context_message_count: newMessages.length,
          ...(truncated && {
            new_context_truncated: true,
            new_context_original_length: fullContext.length,
          }),
        })
      }

      // Set system_reminders as a separate attribute
      // 满足 `systemReminders.length > 0` 时，共享工具执行该分支。
      if (systemReminders.length > 0) {
        // fullReminders 集合格式化`systemReminders.join`，供共享工具后续处理使用。
        const fullReminders = systemReminders.join('\n\n---\n\n')
        // 共享工具 beta Session Tracing先整理这一处局部数据，后续分支可以直接读取。
        const { content: truncatedReminders, truncated: remindersTruncated } =
          truncateContent(fullReminders)

        // span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
        span.setAttributes({
          system_reminders: truncatedReminders,
          system_reminders_count: systemReminders.length,
          ...(remindersTruncated && {
            system_reminders_truncated: true,
            system_reminders_original_length: fullReminders.length,
          }),
        })
      }

      // Update last reported hash to the last message in the array
      // lastMessage 消息数据 命名 `messagesForAPI[messagesForAPI.length - 1]`，让后续代码直接表达这个值的用途。
      const lastMessage = messagesForAPI[messagesForAPI.length - 1]
      // 满足 `lastMessage` 时，共享工具执行该分支。
      if (lastMessage) {
        // lastReportedMessageHash.set 写入新的状态值，使共享工具后续读取保持一致。
        lastReportedMessageHash.set(querySource, hashMessage(lastMessage))
      }
    }
  }
}

/**
 * Add beta attributes to endLLMRequestSpan.
 * Handles model_output and thinking_output truncation.
 */
// addBetaLLMResponseAttributes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addBetaLLMResponseAttributes(
  endAttributes: Record<string, string | number | boolean>,
  metadata?: {
    modelOutput?: string
    thinkingOutput?: string
  },
): void {
  // 只有 `!isBetaTracingEnabled() || !metadata` 满足时，共享工具才执行该分支。
  if (!isBetaTracingEnabled() || !metadata) {
    // 共享工具 beta Session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Add model_output (text content) - visible to all users
  // `metadata.modelOutput` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (metadata.modelOutput !== undefined) {
    // 共享工具 beta Session Tracing先整理这一处局部数据，后续分支可以直接读取。
    const { content: modelOutput, truncated: outputTruncated } =
      truncateContent(metadata.modelOutput)
    // model_output'更新为 `modelOutput`，确保共享工具 beta Session Tracing后续读取最新状态。
    endAttributes['response.model_output'] = modelOutput
    // 满足 `outputTruncated` 时，共享工具执行该分支。
    if (outputTruncated) {
      // model_output_truncated'更新为 `true`，确保共享工具 beta Session Tracing后续读取最新状态。
      endAttributes['response.model_output_truncated'] = true
      // 共享工具 beta Session Tracing在这里处理 `endAttributes['response.model_output_original_length'] =`，完成这一小步状态转换。
      endAttributes['response.model_output_original_length'] =
        metadata.modelOutput.length
    }
  }

  // Add thinking_output - ant-only
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.USER_TYPE === 'ant' &&
    metadata.thinkingOutput !== undefined
  ) {
    // 共享工具 beta Session Tracing先整理这一处局部数据，后续分支可以直接读取。
    const { content: thinkingOutput, truncated: thinkingTruncated } =
      truncateContent(metadata.thinkingOutput)
    // thinking_output'更新为 `thinkingOutput`，确保共享工具 beta Session Tracing后续读取最新状态。
    endAttributes['response.thinking_output'] = thinkingOutput
    // 满足 `thinkingTruncated` 时，共享工具执行该分支。
    if (thinkingTruncated) {
      // 更新为 `true`，确保共享工具 beta Session Tracing后续读取最新状态。
      endAttributes['response.thinking_output_truncated'] = true
      // 共享工具 beta Session Tracing在这里处理 `endAttributes['response.thinking_output_original_length'] =`，完成这一小步状态转换。
      endAttributes['response.thinking_output_original_length'] =
        metadata.thinkingOutput.length
    }
  }
}

/**
 * Add beta attributes to startToolSpan.
 * Adds tool_input with the serialized tool input.
 */
// addBetaToolInputAttributes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addBetaToolInputAttributes(
  span: Span,
  toolName: string,
  toolInput: string,
): void {
  // 满足 `!isBetaTracingEnabled()` 时，共享工具执行该分支。
  if (!isBetaTracingEnabled()) {
    // 共享工具 beta Session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 从 `truncateContent(` 解构 content、truncated，减少共享工具 beta Session Tracing对同一对象的重复访问。
  const { content: truncatedInput, truncated } = truncateContent(
    `[TOOL INPUT: ${toolName}]\n${toolInput}`,
  )
  // span.setAttributes 写入新的状态值，使共享工具后续读取保持一致。
  span.setAttributes({
    tool_input: truncatedInput,
    ...(truncated && {
      tool_input_truncated: true,
      tool_input_original_length: toolInput.length,
    }),
  })
}

/**
 * Add beta attributes to endToolSpan.
 * Adds new_context with the tool result.
 */
// addBetaToolResultAttributes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addBetaToolResultAttributes(
  endAttributes: Record<string, string | number | boolean>,
  toolName: string | number | boolean,
  toolResult: string,
): void {
  // 满足 `!isBetaTracingEnabled()` 时，共享工具执行该分支。
  if (!isBetaTracingEnabled()) {
    // 共享工具 beta Session Tracing在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 从 `truncateContent(` 解构 content、truncated，减少共享工具 beta Session Tracing对同一对象的重复访问。
  const { content: truncatedResult, truncated } = truncateContent(
    `[TOOL RESULT: ${toolName}]\n${toolResult}`,
  )
  // endAttributes['new_context'更新为 `truncatedResult`，确保共享工具 beta Session Tracing后续读取最新状态。
  endAttributes['new_context'] = truncatedResult
  // 满足 `truncated` 时，共享工具执行该分支。
  if (truncated) {
    // endAttributes['new_context_truncated'更新为 `true`，确保共享工具 beta Session Tracing后续读取最新状态。
    endAttributes['new_context_truncated'] = true
    // endAttributes['new_context_original_length' 数量更新为 `toolResult.length`，确保共享工具 beta Session Tracing后续读取最新状态。
    endAttributes['new_context_original_length'] = toolResult.length
  }
}
