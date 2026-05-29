// 接入 queryHaiku 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryHaiku } from '../../services/api/claude.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 extractTextContent，将 ../messages.js 中已经封装好的能力接到本文件流程里。
import { extractTextContent } from '../messages.js'
// 引入 asSystemPrompt，将 ../systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from '../systemPromptType.js'

// DateTimeParseResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DateTimeParseResult =
  | { success: true; value: string }
  | { success: false; error: string }

/**
 * Parse natural language date/time input into ISO 8601 format using Haiku.
 *
 * Examples:
 * - "tomorrow at 3pm" → "2025-10-15T15:00:00-07:00"
 * - "next Monday" → "2025-10-20"
 * - "in 2 hours" → "2025-10-14T12:30:00-07:00"
 *
 * @param input The natural language date/time string from the user
 * @param format Whether to parse as 'date' (YYYY-MM-DD) or 'date-time' (full ISO 8601 with time)
 * @param signal AbortSignal for cancellation
 * @returns Parsed ISO 8601 string or error message
 */
// parseNaturalLanguageDateTime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function parseNaturalLanguageDateTime(
  input: string,
  format: 'date' | 'date-time',
  signal: AbortSignal,
): Promise<DateTimeParseResult> {
  // Get current datetime with timezone for context
  // now记录时间`Date`，供共享工具后续处理使用。
  const now = new Date()
  // currentDateTime保存`now.toISOString`，供共享工具后续处理使用。
  const currentDateTime = now.toISOString()
  // timezoneOffset读取`now.getTimezoneOffset`，供共享工具后续处理使用。
  const timezoneOffset = -now.getTimezoneOffset() // minutes, inverted sign
  // tzHours 集合保存`Math.floor`，供共享工具后续处理使用。
  const tzHours = Math.floor(Math.abs(timezoneOffset) / 60)
  // tzMinutes 集合保存`Math.abs`，供共享工具后续处理使用。
  const tzMinutes = Math.abs(timezoneOffset) % 60
  // tzSign保存`timezoneOffset >= 0 ? '+' : '-'`，供共享工具 date Time Parser后续判断或输出使用。
  const tzSign = timezoneOffset >= 0 ? '+' : '-'
  // timezone保存`String`，供共享工具后续处理使用。
  const timezone = `${tzSign}${String(tzHours).padStart(2, '0')}:${String(tzMinutes).padStart(2, '0')}`
  // dayOfWeek记录时间`now.toLocaleDateString`，供共享工具后续处理使用。
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })

  // Build system prompt with context
  // 系统提示词保存`asSystemPrompt`，供共享工具后续处理使用。
  const systemPrompt = asSystemPrompt([
    'You are a date/time parser that converts natural language into ISO 8601 format.',
    'You MUST respond with ONLY the ISO 8601 formatted string, with no explanation or additional text.',
    'If the input is ambiguous, prefer future dates over past dates.',
    "For times without dates, use today's date.",
    'For dates without times, do not include a time component.',
    'If the input is incomplete or you cannot confidently parse it into a valid date, respond with exactly "INVALID" (nothing else).',
    'Examples of INVALID input: partial dates like "2025-01-", lone numbers like "13", gibberish.',
    'Examples of valid natural language: "tomorrow", "next Monday", "jan 1st 2025", "in 2 hours", "yesterday".',
  ])

  // Build user prompt with rich context
  // formatDescription 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const formatDescription =
    format === 'date'
      ? 'YYYY-MM-DD (date only, no time)'
      : `YYYY-MM-DDTHH:MM:SS${timezone} (full date-time with timezone)`

  // userPrompt 命名 ``Current context:`，让后续代码直接表达这个值的用途。
  const userPrompt = `Current context:
- Current date and time: ${currentDateTime} (UTC)
- Local timezone: ${timezone}
- Day of week: ${dayOfWeek}

User input: "${input}"

Output format: ${formatDescription}

Parse the user's input into ISO 8601 format. Return ONLY the formatted string, or "INVALID" if the input is incomplete or unparseable.`

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`queryHaiku`，供共享工具后续处理使用。
    const result = await queryHaiku({
      systemPrompt,
      userPrompt,
      signal,
      options: {
        querySource: 'mcp_datetime_parse',
        agents: [],
        isNonInteractiveSession: false,
        hasAppendSystemPrompt: false,
        mcpTools: [],
        enablePromptCaching: false,
      },
    })

    // Extract text from result
    // parsedText保存`extractTextContent`，供共享工具后续处理使用。
    const parsedText = extractTextContent(result.message.content).trim()

    // Validate that we got something usable
    // 当 `!parsedText || parsedText` 匹配 `'INVALID'` 时，共享工具执行对应分支。
    if (!parsedText || parsedText === 'INVALID') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: 'Unable to parse date/time from input',
      }
    }

    // Basic sanity check - should start with a digit (year)
    // 满足 `!/^\d{4}/.test(parsedText)` 时，共享工具执行该分支。
    if (!/^\d{4}/.test(parsedText)) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: 'Unable to parse date/time from input',
      }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, value: parsedText }
  } catch (error) {
    // Log error but don't expose details to user
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error:
        'Unable to parse date/time. Please enter in ISO 8601 format manually.',
    }
  }
}

/**
 * Check if a string looks like it might be an ISO 8601 date/time.
 * Used to decide whether to attempt NL parsing.
 */
// looksLikeISO8601 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function looksLikeISO8601(input: string): boolean {
  // ISO 8601 date: YYYY-MM-DD
  // ISO 8601 datetime: YYYY-MM-DDTHH:MM:SS...
  // 返回 `/^\d{4}-\d{2}-\d{2}(T|$)/.test(input.trim())`，作为共享工具这次计算的结果。
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(input.trim())
}
