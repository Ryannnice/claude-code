// 引入 APIUserAbortError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIUserAbortError } from '@anthropic-ai/sdk'
// 引入 getEmptyToolPermissionContext，将 ../Tool.js 中已经封装好的能力接到本文件流程里。
import { getEmptyToolPermissionContext } from '../Tool.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准服务层 away Summary的数据契约。
import type { Message } from '../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 整理这一组导入，让服务层 away Summary后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  getAssistantMessageText,
} from '../utils/messages.js'
// 复用 getSmallFastModel 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { getSmallFastModel } from '../utils/model/model.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../utils/systemPromptType.js'
// 引入 queryModelWithoutStreaming，将 ./api/claude.js 中已经封装好的能力接到本文件流程里。
import { queryModelWithoutStreaming } from './api/claude.js'
// 引入 getSessionMemoryContent，将 ./SessionMemory/sessionMemoryUtils.js 中已经封装好的能力接到本文件流程里。
import { getSessionMemoryContent } from './SessionMemory/sessionMemoryUtils.js'

// Recap only needs recent context — truncate to avoid "prompt too long" on
// large sessions. 30 messages ≈ ~15 exchanges, plenty for "where we left off."
// RECENT_MESSAGE_WINDOW 消息数据保存`30`，供后续判断或组装使用。
const RECENT_MESSAGE_WINDOW = 30

// buildAwaySummaryPrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildAwaySummaryPrompt(memory: string | null): string {
  // memoryBlock 命名 `memory`，让后续代码直接表达这个值的用途。
  const memoryBlock = memory
    ? `Session memory (broader context):\n${memory}\n\n`
    : ''
  // 返回 ``${memoryBlock}The user stepped away and is coming back. Write exactly ...`，作为服务层 away Summary这次计算的结果。
  return `${memoryBlock}The user stepped away and is coming back. Write exactly 1-3 short sentences. Start by stating the high-level task — what they are building or debugging, not implementation details. Next: the concrete next step. Skip status reports and commit recaps.`
}

/**
 * Generates a short session recap for the "while you were away" card.
 * Returns null on abort, empty transcript, or error.
 */
// generateAwaySummary 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateAwaySummary(
  messages: readonly Message[],
  signal: AbortSignal,
): Promise<string | null> {
  // 对话消息为空时立即返回或跳过，避免服务层 away Summary把空集合当成可处理内容。
  if (messages.length === 0) {
    // 返回 `null`，作为服务层 away Summary这次计算的结果。
    return null
  }

  // 保护这一段可能失败的服务层 away Summary操作，确保异常能进入相邻错误处理。
  try {
    // memory读取`getSessionMemoryContent`，供服务层 away Summary后续处理使用。
    const memory = await getSessionMemoryContent()
    // recent格式化`messages.slice`，供服务层 away Summary后续处理使用。
    const recent = messages.slice(-RECENT_MESSAGE_WINDOW)
    // recent追加新条目，保持收集顺序与输入顺序一致。
    recent.push(createUserMessage({ content: buildAwaySummaryPrompt(memory) }))
    // 接口响应保存`queryModelWithoutStreaming`，供服务层 away Summary后续处理使用。
    const response = await queryModelWithoutStreaming({
      messages: recent,
      systemPrompt: asSystemPrompt([]),
      thinkingConfig: { type: 'disabled' },
      tools: [],
      signal,
      options: {
        // 这个回调绑定到 getToolPermissionContext: async () => getEmptyToolPermissionContext(),，负责服务层 away Summary在该局部场景下的响应。
        getToolPermissionContext: async () => getEmptyToolPermissionContext(),
        model: getSmallFastModel(),
        toolChoice: undefined,
        isNonInteractiveSession: false,
        hasAppendSystemPrompt: false,
        agents: [],
        querySource: 'away_summary',
        mcpTools: [],
        skipCacheWrite: true,
      },
    })

    // 满足 `response.isApiErrorMessage` 时，服务层 away Summary执行该分支。
    if (response.isApiErrorMessage) {
      // 记录服务层 away Summary运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[awaySummary] API error: ${getAssistantMessageText(response)}`,
      )
      // 返回 `null`，作为服务层 away Summary这次计算的结果。
      return null
    }
    // 返回 `getAssistantMessageText(response)`，作为服务层 away Summary这次计算的结果。
    return getAssistantMessageText(response)
  } catch (err) {
    // 组合条件 `err instanceof APIUserAbortError || signal.aborted` 成立时，服务层 away Summary才启用这条专门路径。
    if (err instanceof APIUserAbortError || signal.aborted) {
      // 返回 `null`，作为服务层 away Summary这次计算的结果。
      return null
    }
    // 记录服务层 away Summary运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[awaySummary] generation failed: ${err}`)
    // 返回 `null`，作为服务层 away Summary这次计算的结果。
    return null
  }
}
