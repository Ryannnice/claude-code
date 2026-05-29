// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../../services/analytics/metadata.js'
// 类型依赖 { AssistantMessage, Message } 来自 ../../types/message.js，用于校准权限判定的数据契约。
import type { AssistantMessage, Message } from '../../types/message.js'
// 引入 getGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getMainLoopModel，将 ../model/model.js 中已经封装好的能力接到本文件流程里。
import { getMainLoopModel } from '../model/model.js'
// 引入 sideQuery，将 ../sideQuery.js 中已经封装好的能力接到本文件流程里。
import { sideQuery } from '../sideQuery.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'

// RiskLevel 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

// Map risk levels to numeric values for analytics
// RISK_LEVEL_NUMERIC 集中保存权限工具 permission Explainer要一起传递的字段。
const RISK_LEVEL_NUMERIC: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

// Error type codes for analytics
// ERROR_TYPE_PARSE 错误信息保存`1`，供后续判断或组装使用。
const ERROR_TYPE_PARSE = 1
// ERROR_TYPE_NETWORK 错误信息保存`2`，供权限判定权限工具 permission Explainer后续判断或输出使用。
const ERROR_TYPE_NETWORK = 2
// ERROR_TYPE_UNKNOWN 错误信息保存`3`，供后续判断或组装使用。
const ERROR_TYPE_UNKNOWN = 3

// PermissionExplanation 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionExplanation = {
  riskLevel: RiskLevel
  explanation: string
  reasoning: string
  risk: string
}

// GenerateExplanationParams 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
type GenerateExplanationParams = {
  toolName: string
  toolInput: unknown
  toolDescription?: string
  messages?: Message[]
  signal: AbortSignal
}

// SYSTEM_PROMPT保存``Analyze shell commands and explain what they do, why you...`，作为后续固定文本处理的输入。
const SYSTEM_PROMPT = `Analyze shell commands and explain what they do, why you're running them, and potential risks.`

// Tool definition for forced structured output (no beta required)
// EXPLAIN_COMMAND_TOOL 命令数据 集中保存权限判定权限工具 permission Explainer要一起传递的字段。
const EXPLAIN_COMMAND_TOOL = {
  name: 'explain_command',
  description: 'Provide an explanation of a shell command',
  input_schema: {
    type: 'object' as const,
    properties: {
      explanation: {
        type: 'string',
        description: 'What this command does (1-2 sentences)',
      },
      reasoning: {
        type: 'string',
        description:
          'Why YOU are running this command. Start with "I" - e.g. "I need to check the file contents"',
      },
      risk: {
        type: 'string',
        description: 'What could go wrong, under 15 words',
      },
      riskLevel: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        description:
          'LOW (safe dev workflows), MEDIUM (recoverable changes), HIGH (dangerous/irreversible)',
      },
    },
    required: ['explanation', 'reasoning', 'risk', 'riskLevel'],
  },
}

// Zod schema for parsing and validating the response
// RiskAssessmentSchema保存`lazySchema`，供权限判定后续处理使用。
const RiskAssessmentSchema = lazySchema(() =>
  z.object({
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    explanation: z.string(),
    reasoning: z.string(),
    risk: z.string(),
  }),
)

// formatToolInput 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatToolInput(input: unknown): string {
  // 当 `typeof input` 匹配 `'string'` 时，权限判定执行对应分支。
  if (typeof input === 'string') {
    // 返回 `input`，作为权限判定这次计算的结果。
    return input
  }
  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `jsonStringify(input, null, 2)`，作为权限判定这次计算的结果。
    return jsonStringify(input, null, 2)
  } catch {
    // 返回 `String(input)`，作为权限判定这次计算的结果。
    return String(input)
  }
}

/**
 * Extract recent conversation context from messages for the explainer.
 * Returns a summary of recent assistant messages to provide context
 * for "why" this command is being run.
 */
// extractConversationContext 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractConversationContext(
  messages: Message[],
  maxChars = 1000,
): string {
  // Get recent assistant messages (they contain Claude's reasoning)
  // assistantMessages 消息数据保存`messages`，供后续判断或组装使用。
  const assistantMessages = messages
    // 链式调用 filter，继续加工上一行在权限判定中产生的数据。
    .filter((m): m is AssistantMessage => m.type === 'assistant')
    .slice(-3) // Last 3 assistant messages

  // contextParts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const contextParts: string[] = []
  // totalChars 集合保存`0`，供权限判定权限工具 permission Explainer后续判断或输出使用。
  let totalChars = 0

  // 逐项读取 `assistantMessages.reverse()` 中的消息，按输入顺序推进权限判定。
  for (const msg of assistantMessages.reverse()) {
    // Extract text content from assistant message
    // textBlocks 集合 命名 `msg.message.content`，让后续代码直接表达这个值的用途。
    const textBlocks = msg.message.content
      // 链式调用 filter，继续加工上一行在权限判定中产生的数据。
      .filter(c => c.type === 'text')
      // 链式调用 map，继续加工上一行在权限判定中产生的数据。
      .map(c => ('text' in c ? c.text : ''))
      .join(' ')

    // 只有 `textBlocks && totalChars < maxChars` 满足时，权限判定才执行该分支。
    if (textBlocks && totalChars < maxChars) {
      // remaining保存`maxChars - totalChars`，供后续判断或组装使用。
      const remaining = maxChars - totalChars
      // truncated 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const truncated =
        textBlocks.length > remaining
          ? textBlocks.slice(0, remaining) + '...'
          : textBlocks
      // 调用 contextParts.unshift，触发权限判定此处需要的副作用。
      contextParts.unshift(truncated)
      // 权限工具 permission Explainer在这里处理 `totalChars += truncated.length`，完成这一小步状态转换。
      totalChars += truncated.length
    }
  }

  // 返回 `contextParts.join('\n\n')`，作为权限判定这次计算的结果。
  return contextParts.join('\n\n')
}

/**
 * Check if the permission explainer feature is enabled.
 * Enabled by default; users can opt out via config.
 */
// isPermissionExplainerEnabled 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPermissionExplainerEnabled(): boolean {
  // 返回 `getGlobalConfig().permissionExplainerEnabled !== false`，作为权限判定这次计算的结果。
  return getGlobalConfig().permissionExplainerEnabled !== false
}

/**
 * Generate a permission explanation using Haiku with structured output.
 * Returns null if the feature is disabled, request is aborted, or an error occurs.
 */
// generatePermissionExplanation 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generatePermissionExplanation({
  toolName,
  toolInput,
  toolDescription,
  messages,
  signal,
}: GenerateExplanationParams): Promise<PermissionExplanation | null> {
  // Check if feature is enabled
  // 满足 `!isPermissionExplainerEnabled()` 时，权限判定执行该分支。
  if (!isPermissionExplainerEnabled()) {
    // 返回 `null`，作为权限判定这次计算的结果。
    return null
  }

  // startTime记录时间`Date.now`，供权限判定后续处理使用。
  const startTime = Date.now()

  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // formattedInput格式化`formatToolInput`，供权限判定后续处理使用。
    const formattedInput = formatToolInput(toolInput)
    // conversationContext记录 `messages?.length` 是否成立，下一步按该结果分支。
    const conversationContext = messages?.length
      ? extractConversationContext(messages)
      : ''

    // userPrompt保存``Tool: ${toolName}`，作为后续固定文本处理的输入。
    const userPrompt = `Tool: ${toolName}
${toolDescription ? `Description: ${toolDescription}\n` : ''}
Input:
${formattedInput}
${conversationContext ? `\nRecent conversation context:\n${conversationContext}` : ''}

Explain this command in context.`

    // 模型名称读取`getMainLoopModel`，供权限判定后续处理使用。
    const model = getMainLoopModel()

    // Use sideQuery with forced tool choice for guaranteed structured output
    // 接口响应保存`sideQuery`，供权限判定后续处理使用。
    const response = await sideQuery({
      model,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [EXPLAIN_COMMAND_TOOL],
      tool_choice: { type: 'tool', name: 'explain_command' },
      signal,
      querySource: 'permission_explainer',
    })

    // latencyMs 集合记录时间`Date.now`，供权限判定后续处理使用。
    const latencyMs = Date.now() - startTime
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Permission explainer: API returned in ${latencyMs}ms, stop_reason=${response.stop_reason}`,
    )

    // Extract structured data from tool use block
    // toolUseBlock筛选`content.find`，供权限判定后续处理使用。
    const toolUseBlock = response.content.find(c => c.type === 'tool_use')
    // 当 `toolUseBlock && toolUseBlock.type` 匹配 `'tool_use'` 时，权限判定执行对应分支。
    if (toolUseBlock && toolUseBlock.type === 'tool_use') {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Permission explainer: tool input: ${jsonStringify(toolUseBlock.input).slice(0, 500)}`,
      )
      // 结果保存`RiskAssessmentSchema`，供权限判定后续处理使用。
      const result = RiskAssessmentSchema().safeParse(toolUseBlock.input)

      // 满足 `result.success` 时，权限判定执行该分支。
      if (result.success) {
        // explanation 集中保存权限工具 permission Explainer要一起传递的字段。
        const explanation: PermissionExplanation = {
          riskLevel: result.data.riskLevel,
          explanation: result.data.explanation,
          reasoning: result.data.reasoning,
          risk: result.data.risk,
        }

        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_permission_explainer_generated', {
          tool_name: sanitizeToolNameForAnalytics(toolName),
          risk_level: RISK_LEVEL_NUMERIC[explanation.riskLevel],
          latency_ms: latencyMs,
        })
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Permission explainer: ${explanation.riskLevel} risk for ${toolName} (${latencyMs}ms)`,
        )
        // 返回 `explanation`，作为权限判定这次计算的结果。
        return explanation
      }
    }

    // No valid JSON in response
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_permission_explainer_error', {
      tool_name: sanitizeToolNameForAnalytics(toolName),
      error_type: ERROR_TYPE_PARSE,
      latency_ms: latencyMs,
    })
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Permission explainer: no parsed output in response`)
    // 返回 `null`，作为权限判定这次计算的结果。
    return null
  } catch (error) {
    // latencyMs 集合记录时间`Date.now`，供权限判定后续处理使用。
    const latencyMs = Date.now() - startTime

    // Don't log aborted requests as errors
    // 满足 `signal.aborted` 时，权限判定执行该分支。
    if (signal.aborted) {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Permission explainer: request aborted for ${toolName}`)
      // 返回 `null`，作为权限判定这次计算的结果。
      return null
    }

    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Permission explainer error: ${errorMessage(error)}`)
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_permission_explainer_error', {
      tool_name: sanitizeToolNameForAnalytics(toolName),
      error_type:
        error instanceof Error && error.name === 'AbortError'
          ? ERROR_TYPE_NETWORK
          : ERROR_TYPE_UNKNOWN,
      latency_ms: latencyMs,
    })
    // 返回 `null`，作为权限判定这次计算的结果。
    return null
  }
}
