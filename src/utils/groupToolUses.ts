// 类型依赖 { BetaToolUseBlock } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaToolUseBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/messages/messages.mjs，用于校准共享工具的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages/messages.mjs'
// 类型依赖 { Tools } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { Tools } from '../Tool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  GroupedToolUseMessage,
  NormalizedAssistantMessage,
  NormalizedMessage,
  NormalizedUserMessage,
  ProgressMessage,
  RenderableMessage,
} from '../types/message.js'

// MessageWithoutProgress 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MessageWithoutProgress = Exclude<NormalizedMessage, ProgressMessage>

// GroupingResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GroupingResult = {
  messages: RenderableMessage[]
}

// Cache the set of tool names that support grouped rendering, keyed by the
// tools array reference. The tools array is stable across renders (only
// replaced on MCP connect/disconnect), so this avoids rebuilding the set on
// every call. WeakMap lets old entries be GC'd when the array is replaced.
// GROUPING_CACHE 缓存构建`new WeakMap<Tools, Set<string>>()`，供后续判断或组装使用。
const GROUPING_CACHE = new WeakMap<Tools, Set<string>>()

// getToolsWithGrouping 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolsWithGrouping(tools: Tools): Set<string> {
  // cached 缓存读取`GROUPING_CACHE.get`，供共享工具后续处理使用。
  let cached = GROUPING_CACHE.get(tools)
  // cached 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cached) {
    // cached 缓存更新为 `new Set(tools.filter(t => t.renderGroupedToolUse).map(t =...`，确保共享工具后续读取最新状态。
    cached = new Set(tools.filter(t => t.renderGroupedToolUse).map(t => t.name))
    // GROUPING_CACHE.set 写入新的状态值，使共享工具后续读取保持一致。
    GROUPING_CACHE.set(tools, cached)
  }
  // 返回 `cached`，作为共享工具这次计算的结果。
  return cached
}

// getToolUseInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolUseInfo(
  msg: MessageWithoutProgress,
): { messageId: string; toolUseId: string; toolName: string } | null {
  // 只有 `msg.type === 'assistant' && msg.message.content[0` 满足时，共享工具才执行该分支。
  if (msg.type === 'assistant' && msg.message.content[0]?.type === 'tool_use') {
    // 文本内容 命名 `msg.message.content[0]`，让后续代码直接表达这个值的用途。
    const content = msg.message.content[0]
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      messageId: msg.message.id,
      toolUseId: content.id,
      toolName: content.name,
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Groups tool uses by message.id (same API response) if the tool supports grouped rendering.
 * Only groups 2+ tools of the same type from the same message.
 * Also collects corresponding tool_results and attaches them to the grouped message.
 * When verbose is true, skips grouping so messages render at original positions.
 */
// applyGrouping 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyGrouping(
  messages: MessageWithoutProgress[],
  tools: Tools,
  verbose: boolean = false,
): GroupingResult {
  // In verbose mode, don't group - each message renders at its original position
  // 满足 `verbose` 时，共享工具执行该分支。
  if (verbose) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      messages: messages,
    }
  }
  // toolsWithGrouping读取`getToolsWithGrouping`，供共享工具后续处理使用。
  const toolsWithGrouping = getToolsWithGrouping(tools)

  // First pass: group tool uses by message.id + tool name
  // groups 集合构建`new Map<`，供后续判断或组装使用。
  const groups = new Map<
    string,
    NormalizedAssistantMessage<BetaToolUseBlock>[]
  >()

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // info读取`getToolUseInfo`，供共享工具后续处理使用。
    const info = getToolUseInfo(msg)
    // 只有 `info && toolsWithGrouping.has(info.toolName)` 满足时，共享工具才执行该分支。
    if (info && toolsWithGrouping.has(info.toolName)) {
      // key固定为 ``${info.messageId}:${info.toolName}``，作为共享工具 group Tool Uses后续展示或比较的基准。
      const key = `${info.messageId}:${info.toolName}`
      // group读取`groups.get`，供共享工具后续处理使用。
      const group = groups.get(key) ?? []
      // group追加新条目，保持收集顺序与输入顺序一致。
      group.push(msg as NormalizedAssistantMessage<BetaToolUseBlock>)
      // groups.set 写入新的状态值，使共享工具后续读取保持一致。
      groups.set(key, group)
    }
  }

  // Identify valid groups (2+ items) and collect their tool use IDs
  // validGroups 集合 命名 `new Map<`，让后续代码直接表达这个值的用途。
  const validGroups = new Map<
    string,
    NormalizedAssistantMessage<BetaToolUseBlock>[]
  >()
  // groupedToolUseIds 集合构建`new Set<string>()` 整理出中间结果，供共享工具 group Tool Uses后续步骤使用。
  const groupedToolUseIds = new Set<string>()

  // 循环处理 `const [key, group] of groups`，让共享工具逐项把同类条目按顺序走完。
  for (const [key, group] of groups) {
    // 满足 `group.length >= 2` 时，共享工具执行该分支。
    if (group.length >= 2) {
      // validGroups.set 写入新的状态值，使共享工具后续读取保持一致。
      validGroups.set(key, group)
      // 按顺序遍历 `group` 中的消息，逐个交给共享工具处理。
      for (const msg of group) {
        // info读取`getToolUseInfo`，供共享工具后续处理使用。
        const info = getToolUseInfo(msg)
        // 满足 `info` 时，共享工具执行该分支。
        if (info) {
          // 调用 groupedToolUseIds.add，触发共享工具此处需要的副作用。
          groupedToolUseIds.add(info.toolUseId)
        }
      }
    }
  }

  // Collect result messages for grouped tool_uses
  // Map from tool_use_id to the user message containing that result
  // resultsByToolUseId构建`new Map<string, NormalizedUserMessage>()` 整理出中间结果，供共享工具 group Tool Uses后续步骤使用。
  const resultsByToolUseId = new Map<string, NormalizedUserMessage>()

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // 当 `msg.type` 匹配 `'user'` 时，共享工具执行对应分支。
    if (msg.type === 'user') {
      // 按顺序遍历 `msg.message.content` 中的文本内容，逐个交给共享工具处理。
      for (const content of msg.message.content) {
        // 共享工具在这里按实际状态进入对应分支。
        if (
          content.type === 'tool_result' &&
          groupedToolUseIds.has(content.tool_use_id)
        ) {
          // resultsByToolUseId.set 写入新的状态值，使共享工具后续读取保持一致。
          resultsByToolUseId.set(content.tool_use_id, msg)
        }
      }
    }
  }

  // Second pass: build output, emitting each group only once
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: RenderableMessage[] = []
  // emittedGroups 集合构建`new Set<string>()` 整理出中间结果，供共享工具 group Tool Uses后续步骤使用。
  const emittedGroups = new Set<string>()

  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // info读取`getToolUseInfo`，供共享工具后续处理使用。
    const info = getToolUseInfo(msg)

    // 满足 `info` 时，共享工具执行该分支。
    if (info) {
      // key固定为 ``${info.messageId}:${info.toolName}``，作为共享工具 group Tool Uses后续展示或比较的基准。
      const key = `${info.messageId}:${info.toolName}`
      // group读取`validGroups.get`，供共享工具后续处理使用。
      const group = validGroups.get(key)

      // 满足 `group` 时，共享工具执行该分支。
      if (group) {
        // 满足 `!emittedGroups.has(key)` 时，共享工具执行该分支。
        if (!emittedGroups.has(key)) {
          // 调用 emittedGroups.add，触发共享工具此处需要的副作用。
          emittedGroups.add(key)
          // firstMsg 命名 `group[0]!`，让后续代码直接表达这个值的用途。
          const firstMsg = group[0]!

          // Collect results for this group
          // 结果列表 从空数组开始收集，后续循环会按处理顺序追加条目。
          const results: NormalizedUserMessage[] = []
          // 按顺序遍历 `group` 中的assistantMsg，逐个交给共享工具处理。
          for (const assistantMsg of group) {
            // toolUseId保存`(`，供后续判断或组装使用。
            const toolUseId = (
              assistantMsg.message.content[0] as { id: string }
            ).id
            // resultMsg读取`resultsByToolUseId.get`，供共享工具后续处理使用。
            const resultMsg = resultsByToolUseId.get(toolUseId)
            // 满足 `resultMsg` 时，共享工具执行该分支。
            if (resultMsg) {
              // 结果列表追加新条目，保持收集顺序与输入顺序一致。
              results.push(resultMsg)
            }
          }

          // groupedMessage 消息数据 集中保存共享工具 group Tool Uses要一起传递的字段。
          const groupedMessage: GroupedToolUseMessage = {
            type: 'grouped_tool_use',
            toolName: info.toolName,
            messages: group,
            results,
            displayMessage: firstMsg,
            uuid: `grouped-${firstMsg.uuid}`,
            timestamp: firstMsg.timestamp,
            messageId: info.messageId,
          }
          // 结果追加新条目，保持收集顺序与输入顺序一致。
          result.push(groupedMessage)
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
    }

    // Skip user messages whose tool_results are all grouped
    // 当 `msg.type` 匹配 `'user'` 时，共享工具执行对应分支。
    if (msg.type === 'user') {
      // toolResults 集合筛选`content.filter`，供共享工具后续处理使用。
      const toolResults = msg.message.content.filter(
        // 这个回调绑定到 (c): c is ToolResultBlockParam => c.type === 'tool_result',，负责共享工具在该局部场景下的响应。
        (c): c is ToolResultBlockParam => c.type === 'tool_result',
      )
      // 满足 `toolResults.length > 0` 时，共享工具执行该分支。
      if (toolResults.length > 0) {
        // allGrouped筛选`toolResults.every`，供共享工具后续处理使用。
        const allGrouped = toolResults.every(tr =>
          groupedToolUseIds.has(tr.tool_use_id),
        )
        // 满足 `allGrouped` 时，共享工具执行该分支。
        if (allGrouped) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
      }
    }

    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(msg)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { messages: result }
}
