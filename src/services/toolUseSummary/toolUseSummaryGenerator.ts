/**
 * Tool Use Summary Generator
 *
 * Generates human-readable summaries of completed tool batches using Haiku.
 * Used by the SDK to provide high-level progress updates to clients.
 */

// 引入 E_TOOL_USE_SUMMARY_GENERATION_FAILED，将 ../../constants/errorIds.js 中已经封装好的能力接到本文件流程里。
import { E_TOOL_USE_SUMMARY_GENERATION_FAILED } from '../../constants/errorIds.js'
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js'
// 引入 queryHaiku，将 ../api/claude.js 中已经封装好的能力接到本文件流程里。
import { queryHaiku } from '../api/claude.js'

// TOOL_USE_SUMMARY_SYSTEM_PROMPT固定为 ``Write a short summary label describing what these tool c...`，作为服务层 tool Use Summary Generator后续展示或比较的基准。
const TOOL_USE_SUMMARY_SYSTEM_PROMPT = `Write a short summary label describing what these tool calls accomplished. It appears as a single-line row in a mobile app and truncates around 30 characters, so think git-commit-subject, not sentence.

Keep the verb in past tense and the most distinctive noun. Drop articles, connectors, and long location context first.

Examples:
- Searched in auth/
- Fixed NPE in UserService
- Created signup endpoint
- Read config.json
- Ran failing tests`

// ToolInfo 固化服务层 tool Use Summary Generator里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolInfo = {
  name: string
  input: unknown
  output: unknown
}

// GenerateToolUseSummaryParams 固化服务层 tool Use Summary Generator里传递的数据形状，帮助调用方按同一结构读写字段。
export type GenerateToolUseSummaryParams = {
  tools: ToolInfo[]
  signal: AbortSignal
  isNonInteractiveSession: boolean
  lastAssistantText?: string
}

/**
 * Generates a human-readable summary of completed tools.
 *
 * @param params - Parameters including tools executed and their results
 * @returns A brief summary string, or null if generation fails
 */
// generateToolUseSummary 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateToolUseSummary({
  tools,
  signal,
  isNonInteractiveSession,
  lastAssistantText,
}: GenerateToolUseSummaryParams): Promise<string | null> {
  // tools 集合为空时立即返回或跳过，避免服务层 tool Use Summary Generator把空集合当成可处理内容。
  if (tools.length === 0) {
    // 返回 `null`，作为服务层 tool Use Summary Generator这次计算的结果。
    return null
  }

  // 保护这一段可能失败的服务层 tool Use Summary Generator操作，确保异常能进入相邻错误处理。
  try {
    // Build a concise representation of what tools did
    // toolSummaries 集合保存`tools`，供服务层 tool Use Summary Generator后续判断或输出使用。
    const toolSummaries = tools
      // 链式调用 map，继续加工上一行在服务层 tool Use Summary Generator中产生的数据。
      .map(tool => {
        // inputStr保存`truncateJson`，供服务层 tool Use Summary Generator后续处理使用。
        const inputStr = truncateJson(tool.input, 300)
        // outputStr保存`truncateJson`，供服务层 tool Use Summary Generator后续处理使用。
        const outputStr = truncateJson(tool.output, 300)
        // 返回 ``Tool: ${tool.name}\nInput: ${inputStr}\nOutput: ${outputStr}``，作为服务层 tool Use Summary Generator这次计算的结果。
        return `Tool: ${tool.name}\nInput: ${inputStr}\nOutput: ${outputStr}`
      })
      .join('\n\n')

    // contextPrefix 命名 `lastAssistantText`，让后续代码直接表达这个值的用途。
    const contextPrefix = lastAssistantText
      ? `User's intent (from assistant's last message): ${lastAssistantText.slice(0, 200)}\n\n`
      : ''

    // 接口响应保存`queryHaiku`，供服务层 tool Use Summary Generator后续处理使用。
    const response = await queryHaiku({
      systemPrompt: asSystemPrompt([TOOL_USE_SUMMARY_SYSTEM_PROMPT]),
      userPrompt: `${contextPrefix}Tools completed:\n\n${toolSummaries}\n\nLabel:`,
      signal,
      options: {
        querySource: 'tool_use_summary_generation',
        enablePromptCaching: true,
        agents: [],
        isNonInteractiveSession,
        hasAppendSystemPrompt: false,
        mcpTools: [],
      },
    })

    // summary保存`response.message.content`，供后续判断或组装使用。
    const summary = response.message.content
      // 链式调用 filter，继续加工上一行在服务层 tool Use Summary Generator中产生的数据。
      .filter(block => block.type === 'text')
      // 链式调用 map，继续加工上一行在服务层 tool Use Summary Generator中产生的数据。
      .map(block => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim()

    // 返回 `summary || null`，作为服务层 tool Use Summary Generator这次计算的结果。
    return summary || null
  } catch (error) {
    // Log but don't fail - summaries are non-critical
    // err保存`toError`，供服务层 tool Use Summary Generator后续处理使用。
    const err = toError(error)
    // cause更新为 `{ errorId: E_TOOL_USE_SUMMARY_GENERATION_FAILED }`，确保服务层后续读取最新状态。
    err.cause = { errorId: E_TOOL_USE_SUMMARY_GENERATION_FAILED }
    // 记录服务层 tool Use Summary Generator运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 返回 `null`，作为服务层 tool Use Summary Generator这次计算的结果。
    return null
  }
}

/**
 * Truncates a JSON value to a maximum length for the prompt.
 */
// truncateJson 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateJson(value: unknown, maxLength: number): string {
  // 保护这一段可能失败的服务层 tool Use Summary Generator操作，确保异常能进入相邻错误处理。
  try {
    // str保存`jsonStringify`，供服务层 tool Use Summary Generator后续处理使用。
    const str = jsonStringify(value)
    // 满足 `str.length <= maxLength` 时，服务层 tool Use Summary Generator执行该分支。
    if (str.length <= maxLength) {
      // 返回 `str`，作为服务层 tool Use Summary Generator这次计算的结果。
      return str
    }
    // 返回 `str.slice(0, maxLength - 3) + '...'`，作为服务层 tool Use Summary Generator这次计算的结果。
    return str.slice(0, maxLength - 3) + '...'
  } catch {
    // 返回 `'[unable to serialize]'`，作为服务层 tool Use Summary Generator这次计算的结果。
    return '[unable to serialize]'
  }
}
