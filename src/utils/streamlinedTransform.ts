/**
 * Transforms SDK messages for streamlined output mode.
 *
 * Streamlined mode is a "distillation-resistant" output format that:
 * - Keeps text messages intact
 * - Summarizes tool calls with cumulative counts (resets when text appears)
 * - Omits thinking content
 * - Strips tool list and model info from init messages
 */

// 类型依赖 { SDKAssistantMessage } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { SDKAssistantMessage } from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { StdoutMessage } 来自 src/entrypoints/sdk/controlTypes.js，用于校准共享工具的数据契约。
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
// 接入 LIST_MCP_RESOURCES_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { LIST_MCP_RESOURCES_TOOL_NAME } from 'src/tools/ListMcpResourcesTool/prompt.js'
// 接入 LSP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { LSP_TOOL_NAME } from 'src/tools/LSPTool/prompt.js'
// 接入 NOTEBOOK_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NOTEBOOK_EDIT_TOOL_NAME } from 'src/tools/NotebookEditTool/constants.js'
// 接入 TASK_STOP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_STOP_TOOL_NAME } from 'src/tools/TaskStopTool/prompt.js'
// 接入 WEB_SEARCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_SEARCH_TOOL_NAME } from 'src/tools/WebSearchTool/prompt.js'
// 复用 extractTextContent 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { extractTextContent } from 'src/utils/messages.js'
// 复用 SHELL_TOOL_NAMES 工具函数，把通用处理留在 src/utils/shell/shellToolUtils.js 中维护。
import { SHELL_TOOL_NAMES } from 'src/utils/shell/shellToolUtils.js'
// 复用 capitalize 工具函数，把通用处理留在 src/utils/stringUtils.js 中维护。
import { capitalize } from 'src/utils/stringUtils.js'

// ToolCounts 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolCounts = {
  searches: number
  reads: number
  writes: number
  commands: number
  other: number
}

/**
 * Tool categories for summarization.
 */
// SEARCH_TOOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SEARCH_TOOLS = [
  GREP_TOOL_NAME,
  GLOB_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
  LSP_TOOL_NAME,
]
// READ_TOOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const READ_TOOLS = [FILE_READ_TOOL_NAME, LIST_MCP_RESOURCES_TOOL_NAME]
// WRITE_TOOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const WRITE_TOOLS = [
  FILE_WRITE_TOOL_NAME,
  FILE_EDIT_TOOL_NAME,
  NOTEBOOK_EDIT_TOOL_NAME,
]
// COMMAND_TOOLS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const COMMAND_TOOLS = [...SHELL_TOOL_NAMES, 'Tmux', TASK_STOP_TOOL_NAME]

// categorizeToolName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function categorizeToolName(toolName: string): keyof ToolCounts {
  // 满足 `SEARCH_TOOLS.some(t => toolName.startsWith(t))` 时，共享工具执行该分支。
  if (SEARCH_TOOLS.some(t => toolName.startsWith(t))) return 'searches'
  // 满足 `READ_TOOLS.some(t => toolName.startsWith(t))` 时，共享工具执行该分支。
  if (READ_TOOLS.some(t => toolName.startsWith(t))) return 'reads'
  // 满足 `WRITE_TOOLS.some(t => toolName.startsWith(t))` 时，共享工具执行该分支。
  if (WRITE_TOOLS.some(t => toolName.startsWith(t))) return 'writes'
  // 满足 `COMMAND_TOOLS.some(t => toolName.startsWith(t))` 时，共享工具执行该分支。
  if (COMMAND_TOOLS.some(t => toolName.startsWith(t))) return 'commands'
  // 返回 `'other'`，作为共享工具这次计算的结果。
  return 'other'
}

// createEmptyToolCounts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createEmptyToolCounts(): ToolCounts {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    searches: 0,
    reads: 0,
    writes: 0,
    commands: 0,
    other: 0,
  }
}

/**
 * Generate a summary text for tool counts.
 */
// getToolSummaryText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolSummaryText(counts: ToolCounts): string | undefined {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []

  // Use similar phrasing to collapseReadSearch.ts
  // 满足 `counts.searches > 0` 时，共享工具执行该分支。
  if (counts.searches > 0) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `searched ${counts.searches} ${counts.searches === 1 ? 'pattern' : 'patterns'}`,
    )
  }
  // 满足 `counts.reads > 0` 时，共享工具执行该分支。
  if (counts.reads > 0) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`read ${counts.reads} ${counts.reads === 1 ? 'file' : 'files'}`)
  }
  // 满足 `counts.writes > 0` 时，共享工具执行该分支。
  if (counts.writes > 0) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `wrote ${counts.writes} ${counts.writes === 1 ? 'file' : 'files'}`,
    )
  }
  // 满足 `counts.commands > 0` 时，共享工具执行该分支。
  if (counts.commands > 0) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `ran ${counts.commands} ${counts.commands === 1 ? 'command' : 'commands'}`,
    )
  }
  // 满足 `counts.other > 0` 时，共享工具执行该分支。
  if (counts.other > 0) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`${counts.other} other ${counts.other === 1 ? 'tool' : 'tools'}`)
  }

  // 片段列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (parts.length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 返回 `capitalize(parts.join(', '))`，作为共享工具这次计算的结果。
  return capitalize(parts.join(', '))
}

/**
 * Count tool uses in an assistant message and add to existing counts.
 */
// accumulateToolUses 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function accumulateToolUses(
  message: SDKAssistantMessage,
  counts: ToolCounts,
): void {
  // 文本内容 命名 `message.message.content`，让后续代码直接表达这个值的用途。
  const content = message.message.content
  // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
  if (!Array.isArray(content)) {
    // 共享工具 streamlined Transform在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
  for (const block of content) {
    // 只有 `block.type === 'tool_use' && 'name' in block` 满足时，共享工具才执行该分支。
    if (block.type === 'tool_use' && 'name' in block) {
      // category保存`categorizeToolName`，供共享工具后续处理使用。
      const category = categorizeToolName(block.name as string)
      // 共享工具 streamlined Transform在这里处理 `counts[category]++`，完成这一小步状态转换。
      counts[category]++
    }
  }
}

/**
 * Create a stateful transformer that accumulates tool counts between text messages.
 * Tool counts reset when a message with text content is encountered.
 */
// createStreamlinedTransformer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createStreamlinedTransformer(): (
  message: StdoutMessage,
) => StdoutMessage | null {
  // cumulativeCounts 数量构建`createEmptyToolCounts`，供共享工具后续处理使用。
  let cumulativeCounts = createEmptyToolCounts()

  // 返回 `function transformToStreamlined(`，作为共享工具这次计算的结果。
  return function transformToStreamlined(
    message: StdoutMessage,
  ): StdoutMessage | null {
    // 按照 message.type 的取值选择共享工具的具体处理分支。
    switch (message.type) {
      case 'assistant': {
        // 文本内容 命名 `message.message.content`，让后续代码直接表达这个值的用途。
        const content = message.message.content
        // 文本保存`Array.isArray`，供共享工具后续处理使用。
        const text = Array.isArray(content)
          ? extractTextContent(content, '\n').trim()
          : ''

        // Accumulate tool counts from this message
        // 调用 accumulateToolUses，触发共享工具此处需要的副作用。
        accumulateToolUses(message, cumulativeCounts)

        // 满足 `text.length > 0` 时，共享工具执行该分支。
        if (text.length > 0) {
          // Text message: emit text only, reset counts
          // cumulativeCounts 数量更新为 `createEmptyToolCounts()`，确保共享工具后续读取最新状态。
          cumulativeCounts = createEmptyToolCounts()
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            type: 'streamlined_text',
            text,
            session_id: message.session_id,
            uuid: message.uuid,
          }
        }

        // Tool-only message: emit cumulative tool summary
        // toolSummary读取`getToolSummaryText`，供共享工具后续处理使用。
        const toolSummary = getToolSummaryText(cumulativeCounts)
        // toolSummary缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!toolSummary) {
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          type: 'streamlined_tool_use_summary',
          tool_summary: toolSummary,
          session_id: message.session_id,
          uuid: message.uuid,
        }
      }

      case 'result':
        // Keep result messages as-is (they have structured_output, permission_denials)
        // 返回 `message`，作为共享工具这次计算的结果。
        return message

      case 'system':
      case 'user':
      case 'stream_event':
      case 'tool_progress':
      case 'auth_status':
      case 'rate_limit_event':
      case 'control_response':
      case 'control_request':
      case 'control_cancel_request':
      case 'keep_alive':
        // 返回 `null`，作为共享工具这次计算的结果。
        return null

      default:
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
    }
  }
}

/**
 * Check if a message should be included in streamlined output.
 * Useful for filtering before transformation.
 */
// shouldIncludeInStreamlined 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldIncludeInStreamlined(message: StdoutMessage): boolean {
  // 返回 `message.type === 'assistant' || message.type === 'result'`，作为共享工具这次计算的结果。
  return message.type === 'assistant' || message.type === 'result'
}
