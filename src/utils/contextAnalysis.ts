// 类型依赖 { BetaContentBlock } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaContentBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ContentBlock,
  ContentBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 接入 roughTokenCountEstimation as countTokens 服务层能力，把外部通信或共享状态交给 ../services/tokenEstimation.js 处理。
import { roughTokenCountEstimation as countTokens } from '../services/tokenEstimation.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  UserMessage,
} from '../types/message.js'
// 引入 normalizeMessagesForAPI，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { normalizeMessagesForAPI } from './messages.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// TokenStats 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TokenStats = {
  toolRequests: Map<string, number>
  toolResults: Map<string, number>
  humanMessages: number
  assistantMessages: number
  localCommandOutputs: number
  other: number
  attachments: Map<string, number>
  duplicateFileReads: Map<string, { count: number; tokens: number }>
  total: number
}

// analyzeContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function analyzeContext(messages: Message[]): TokenStats {
  // stats 集合 集中保存共享工具 context Analysis要一起传递的字段。
  const stats: TokenStats = {
    toolRequests: new Map(),
    toolResults: new Map(),
    humanMessages: 0,
    assistantMessages: 0,
    localCommandOutputs: 0,
    other: 0,
    attachments: new Map(),
    duplicateFileReads: new Map(),
    total: 0,
  }

  // toolIdsToToolNames 集合 命名 `new Map<string, string>()`，让后续代码直接表达这个值的用途。
  const toolIdsToToolNames = new Map<string, string>()
  // readToolIdToFilePath 路径数据构建`new Map<string, string>()` 整理出中间结果，供共享工具 context Analysis后续步骤使用。
  const readToolIdToFilePath = new Map<string, string>()
  // fileReadStats 文件数据 命名 `new Map<`，让后续代码直接表达这个值的用途。
  const fileReadStats = new Map<
    string,
    { count: number; totalTokens: number }
  >()

  // 调用 messages.forEach，触发共享工具此处需要的副作用。
  messages.forEach(msg => {
    // 当 `msg.type` 匹配 `'attachment'` 时，共享工具执行对应分支。
    if (msg.type === 'attachment') {
      // type标记共享工具 context Analysis是否启用对应路径。
      const type = msg.attachment.type || 'unknown'
      // stats.attachments.set 写入新的状态值，使共享工具后续读取保持一致。
      stats.attachments.set(type, (stats.attachments.get(type) || 0) + 1)
    }
  })

  // normalizedMessages 消息数据保存`normalizeMessagesForAPI`，供共享工具后续处理使用。
  const normalizedMessages = normalizeMessagesForAPI(messages)
  // 调用 normalizedMessages.forEach，触发共享工具此处需要的副作用。
  normalizedMessages.forEach(msg => {
    // 从 `msg.message` 解构 content，减少共享工具 context Analysis对同一对象的重复访问。
    const { content } = msg.message

    // Not sure if this path is still used, but adding as a fallback
    // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof content === 'string') {
      // token 列表统计`countTokens`，供共享工具后续处理使用。
      const tokens = countTokens(content)
      // 共享工具 context Analysis在这里处理 `stats.total += tokens`，完成这一小步状态转换。
      stats.total += tokens
      // Check if this is a local command output
      // 只有 `msg.type === 'user' && content.includes('local-command-stdout')` 满足时，共享工具才执行该分支。
      if (msg.type === 'user' && content.includes('local-command-stdout')) {
        // 共享工具 context Analysis在这里处理 `stats.localCommandOutputs += tokens`，完成这一小步状态转换。
        stats.localCommandOutputs += tokens
      } else {
        // 共享工具 context Analysis在这里处理 `stats[msg.type === 'user' ? 'humanMessages' : 'assistantMessages'] +=`，完成这一小步状态转换。
        stats[msg.type === 'user' ? 'humanMessages' : 'assistantMessages'] +=
          tokens
      }
    } else {
      // 调用 content.forEach，触发共享工具此处需要的副作用。
      content.forEach(block =>
        processBlock(
          block,
          msg,
          stats,
          toolIdsToToolNames,
          readToolIdToFilePath,
          fileReadStats,
        ),
      )
    }
  })

  // Calculate duplicate file reads
  // 调用 fileReadStats.forEach，触发共享工具此处需要的副作用。
  fileReadStats.forEach((data, path) => {
    // 满足 `data.count > 1` 时，共享工具执行该分支。
    if (data.count > 1) {
      // averageTokensPerRead保存`Math.floor`，供共享工具后续处理使用。
      const averageTokensPerRead = Math.floor(data.totalTokens / data.count)
      // duplicateTokens 集合 命名 `averageTokensPerRead * (data.count - 1)`，让后续代码直接表达这个值的用途。
      const duplicateTokens = averageTokensPerRead * (data.count - 1)

      // stats.duplicateFileReads.set 写入新的状态值，使共享工具后续读取保持一致。
      stats.duplicateFileReads.set(path, {
        count: data.count,
        tokens: duplicateTokens,
      })
    }
  })

  // 返回 `stats`，作为共享工具这次计算的结果。
  return stats
}

// processBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processBlock(
  block: ContentBlockParam | ContentBlock | BetaContentBlock,
  message: UserMessage | AssistantMessage,
  stats: TokenStats,
  toolIds: Map<string, string>,
  readToolPaths: Map<string, string>,
  fileReads: Map<string, { count: number; totalTokens: number }>,
): void {
  // token 列表统计`countTokens`，供共享工具后续处理使用。
  const tokens = countTokens(jsonStringify(block))
  // 共享工具 context Analysis在这里处理 `stats.total += tokens`，完成这一小步状态转换。
  stats.total += tokens

  // 按照 block.type 的取值选择共享工具的具体处理分支。
  switch (block.type) {
    case 'text':
      // Check if this is a local command output
      // 共享工具在这里按实际状态进入对应分支。
      if (
        message.type === 'user' &&
        'text' in block &&
        block.text.includes('local-command-stdout')
      ) {
        // 共享工具 context Analysis在这里处理 `stats.localCommandOutputs += tokens`，完成这一小步状态转换。
        stats.localCommandOutputs += tokens
      } else {
        // 共享工具 context Analysis在这里处理 `stats[`，完成这一小步状态转换。
        stats[
          message.type === 'user' ? 'humanMessages' : 'assistantMessages'
        ] += tokens
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break

    case 'tool_use': {
      // 只有 `'name' in block && 'id' in block` 满足时，共享工具才执行该分支。
      if ('name' in block && 'id' in block) {
        // toolName标记共享工具 context Analysis是否启用对应路径。
        const toolName = block.name || 'unknown'
        // 调用 increment，触发共享工具此处需要的副作用。
        increment(stats.toolRequests, toolName, tokens)
        // toolIds.set 写入新的状态值，使共享工具后续读取保持一致。
        toolIds.set(block.id, toolName)

        // Track Read tool file paths
        // 共享工具在这里按实际状态进入对应分支。
        if (
          toolName === 'Read' &&
          'input' in block &&
          block.input &&
          typeof block.input === 'object' &&
          'file_path' in block.input
        ) {
          // 路径保存`String`，供共享工具后续处理使用。
          const path = String(
            (block.input as Record<string, unknown>).file_path,
          )
          // readToolPaths.set 写入新的状态值，使共享工具后续读取保持一致。
          readToolPaths.set(block.id, path)
        }
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    case 'tool_result': {
      // 满足 `'tool_use_id' in block` 时，共享工具执行该分支。
      if ('tool_use_id' in block) {
        // toolName读取`toolIds.get`，供共享工具后续处理使用。
        const toolName = toolIds.get(block.tool_use_id) || 'unknown'
        // 调用 increment，触发共享工具此处需要的副作用。
        increment(stats.toolResults, toolName, tokens)

        // Track file read tokens
        // 当 `toolName` 匹配 `'Read'` 时，共享工具执行对应分支。
        if (toolName === 'Read') {
          // 路径读取`readToolPaths.get`，供共享工具后续处理使用。
          const path = readToolPaths.get(block.tool_use_id)
          // 满足 `path` 时，共享工具执行该分支。
          if (path) {
            // current读取`fileReads.get`，供共享工具后续处理使用。
            const current = fileReads.get(path) || { count: 0, totalTokens: 0 }
            // fileReads.set 写入新的状态值，使共享工具后续读取保持一致。
            fileReads.set(path, {
              count: current.count + 1,
              totalTokens: current.totalTokens + tokens,
            })
          }
        }
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    case 'image':
    case 'server_tool_use':
    case 'web_search_tool_result':
    case 'search_result':
    case 'document':
    case 'thinking':
    case 'redacted_thinking':
    case 'code_execution_tool_result':
    case 'mcp_tool_use':
    case 'mcp_tool_result':
    case 'container_upload':
    case 'web_fetch_tool_result':
    case 'bash_code_execution_tool_result':
    case 'text_editor_code_execution_tool_result':
    case 'tool_search_tool_result':
    case 'compaction':
      // Don't care about these for now..
      // 共享工具 context Analysis在这里处理 `stats['other'] += tokens`，完成这一小步状态转换。
      stats['other'] += tokens
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
  }
}

// increment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function increment(map: Map<string, number>, key: string, value: number): void {
  // map.set 写入新的状态值，使共享工具后续读取保持一致。
  map.set(key, (map.get(key) || 0) + value)
}

// tokenStatsToStatsigMetrics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tokenStatsToStatsigMetrics(
  stats: TokenStats,
): Record<string, number> {
  // metrics 集合 集中保存共享工具 context Analysis要一起传递的字段。
  const metrics: Record<string, number> = {
    total_tokens: stats.total,
    human_message_tokens: stats.humanMessages,
    assistant_message_tokens: stats.assistantMessages,
    local_command_output_tokens: stats.localCommandOutputs,
    other_tokens: stats.other,
  }

  // 调用 stats.attachments.forEach，触发共享工具此处需要的副作用。
  stats.attachments.forEach((count, type) => {
    // metrics[`attachment_${type}_count` 数量更新为 `count`，确保共享工具 context Analysis后续读取最新状态。
    metrics[`attachment_${type}_count`] = count
  })

  // 调用 stats.toolRequests.forEach，触发共享工具此处需要的副作用。
  stats.toolRequests.forEach((tokens, tool) => {
    // metrics[`tool_request_${tool}_tokens` 请求数据更新为 `tokens`，确保共享工具 context Analysis后续读取最新状态。
    metrics[`tool_request_${tool}_tokens`] = tokens
  })

  // 调用 stats.toolResults.forEach，触发共享工具此处需要的副作用。
  stats.toolResults.forEach((tokens, tool) => {
    // metrics[`tool_result_${tool}_tokens`更新为 `tokens`，确保共享工具 context Analysis后续读取最新状态。
    metrics[`tool_result_${tool}_tokens`] = tokens
  })

  // duplicateTotal保存`duplicateFileReads.values`，供共享工具后续处理使用。
  const duplicateTotal = [...stats.duplicateFileReads.values()].reduce(
    // 这个回调绑定到 (sum, d) => sum + d.tokens,，负责共享工具在该局部场景下的响应。
    (sum, d) => sum + d.tokens,
    0,
  )

  // duplicate_read_tokens 集合更新为 `duplicateTotal`，确保共享工具后续读取最新状态。
  metrics.duplicate_read_tokens = duplicateTotal
  // duplicate_read_file_count 文件数据更新为 `stats.duplicateFileReads.size`，确保共享工具后续读取最新状态。
  metrics.duplicate_read_file_count = stats.duplicateFileReads.size

  // 满足 `stats.total > 0` 时，共享工具执行该分支。
  if (stats.total > 0) {
    // human_message_percent 消息数据更新为 `Math.round(`，确保共享工具后续读取最新状态。
    metrics.human_message_percent = Math.round(
      (stats.humanMessages / stats.total) * 100,
    )
    // assistant_message_percent 消息数据更新为 `Math.round(`，确保共享工具后续读取最新状态。
    metrics.assistant_message_percent = Math.round(
      (stats.assistantMessages / stats.total) * 100,
    )
    // local_command_output_percent 命令数据更新为 `Math.round(`，确保共享工具后续读取最新状态。
    metrics.local_command_output_percent = Math.round(
      (stats.localCommandOutputs / stats.total) * 100,
    )
    // duplicate_read_percent更新为 `Math.round(`，确保共享工具后续读取最新状态。
    metrics.duplicate_read_percent = Math.round(
      (duplicateTotal / stats.total) * 100,
    )

    // toolRequestTotal 请求数据保存`toolRequests.values`，供共享工具后续处理使用。
    const toolRequestTotal = [...stats.toolRequests.values()].reduce(
      // 这个回调绑定到 (sum, v) => sum + v,，负责共享工具在该局部场景下的响应。
      (sum, v) => sum + v,
      0,
    )
    // toolResultTotal保存`toolResults.values`，供共享工具后续处理使用。
    const toolResultTotal = [...stats.toolResults.values()].reduce(
      // 这个回调绑定到 (sum, v) => sum + v,，负责共享工具在该局部场景下的响应。
      (sum, v) => sum + v,
      0,
    )

    // tool_request_percent 请求数据更新为 `Math.round(`，确保共享工具后续读取最新状态。
    metrics.tool_request_percent = Math.round(
      (toolRequestTotal / stats.total) * 100,
    )
    // tool_result_percent更新为 `Math.round(`，确保共享工具后续读取最新状态。
    metrics.tool_result_percent = Math.round(
      (toolResultTotal / stats.total) * 100,
    )

    // Add individual tool request percentages
    // 调用 stats.toolRequests.forEach，触发共享工具此处需要的副作用。
    stats.toolRequests.forEach((tokens, tool) => {
      // metrics[`tool_request_${tool}_percent` 请求数据更新为 `Math.round(`，确保共享工具 context Analysis后续读取最新状态。
      metrics[`tool_request_${tool}_percent`] = Math.round(
        (tokens / stats.total) * 100,
      )
    })

    // Add individual tool result percentages
    // 调用 stats.toolResults.forEach，触发共享工具此处需要的副作用。
    stats.toolResults.forEach((tokens, tool) => {
      // metrics[`tool_result_${tool}_percent`更新为 `Math.round(`，确保共享工具 context Analysis后续读取最新状态。
      metrics[`tool_result_${tool}_percent`] = Math.round(
        (tokens / stats.total) * 100,
      )
    })
  }

  // 返回 `metrics`，作为共享工具这次计算的结果。
  return metrics
}
