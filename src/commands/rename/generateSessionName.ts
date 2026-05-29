// 接入 queryHaiku 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryHaiku } from '../../services/api/claude.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准命令处理的数据契约。
import type { Message } from '../../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 safeParseJSON 工具函数，把通用处理留在 ../../utils/json.js 中维护。
import { safeParseJSON } from '../../utils/json.js'
// 复用 extractTextContent 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTextContent } from '../../utils/messages.js'
// 复用 extractConversationText 工具函数，把通用处理留在 ../../utils/sessionTitle.js 中维护。
import { extractConversationText } from '../../utils/sessionTitle.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js'

// generateSessionName 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateSessionName(
  messages: Message[],
  signal: AbortSignal,
): Promise<string | null> {
  // conversationText保存`extractConversationText`，供命令处理后续处理使用。
  const conversationText = extractConversationText(messages)
  // conversationText缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!conversationText) {
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`queryHaiku`，供命令处理后续处理使用。
    const result = await queryHaiku({
      systemPrompt: asSystemPrompt([
        'Generate a short kebab-case name (2-4 words) that captures the main topic of this conversation. Use lowercase words separated by hyphens. Examples: "fix-login-bug", "add-auth-feature", "refactor-api-client", "debug-test-failures". Return JSON with a "name" field.',
      ]),
      userPrompt: conversationText,
      outputFormat: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
          additionalProperties: false,
        },
      },
      signal,
      options: {
        querySource: 'rename_generate_name',
        agents: [],
        isNonInteractiveSession: false,
        hasAppendSystemPrompt: false,
        mcpTools: [],
      },
    })

    // 文本内容保存`extractTextContent`，供命令处理后续处理使用。
    const content = extractTextContent(result.message.content)

    // 接口响应保存`safeParseJSON`，供命令处理后续处理使用。
    const response = safeParseJSON(content)
    // 命令处理在这里按实际状态进入对应分支。
    if (
      response &&
      typeof response === 'object' &&
      'name' in response &&
      typeof (response as { name: unknown }).name === 'string'
    ) {
      // 返回 `(response as { name: string }).name`，作为命令处理这次计算的结果。
      return (response as { name: string }).name
    }
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  } catch (error) {
    // Haiku timeout/rate-limit/network are expected operational failures —
    // logForDebugging, not logError. Called automatically on every 3rd bridge
    // message (initReplBridge.ts), so errors here would flood the error file.
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`generateSessionName failed: ${errorMessage(error)}`, {
      level: 'error',
    })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }
}
