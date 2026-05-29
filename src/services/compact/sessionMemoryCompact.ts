/**
 * EXPERIMENT: Session memory compaction
 */

// 类型依赖 { AgentId } 来自 ../../types/ids.js，用于校准服务层 session Memory Compact的数据契约。
import type { AgentId } from '../../types/ids.js'
// 类型依赖 { HookResultMessage, Message } 来自 ../../types/message.js，用于校准服务层 session Memory Compact的数据契约。
import type { HookResultMessage, Message } from '../../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 整理这一组导入，让服务层 session Memory Compact后续逻辑可以直接复用这些外部能力。
import {
  createCompactBoundaryMessage,
  createUserMessage,
  isCompactBoundaryMessage,
} from '../../utils/messages.js'
// 复用 getMainLoopModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getMainLoopModel } from '../../utils/model/model.js'
// 复用 getSessionMemoryPath 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { getSessionMemoryPath } from '../../utils/permissions/filesystem.js'
// 复用 processSessionStartHooks 工具函数，把通用处理留在 ../../utils/sessionStart.js 中维护。
import { processSessionStartHooks } from '../../utils/sessionStart.js'
// 复用 getTranscriptPath 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { getTranscriptPath } from '../../utils/sessionStorage.js'
// 复用 tokenCountFromLastAPIResponse 工具函数，把通用处理留在 ../../utils/tokens.js 中维护。
import { tokenCountFromLastAPIResponse } from '../../utils/tokens.js'
// 复用 extractDiscoveredToolNames 工具函数，把通用处理留在 ../../utils/toolSearch.js 中维护。
import { extractDiscoveredToolNames } from '../../utils/toolSearch.js'
// 整理这一组导入，让服务层 session Memory Compact后续逻辑可以直接复用这些外部能力。
import {
  getDynamicConfig_BLOCKS_ON_INIT,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from '../analytics/growthbook.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 整理这一组导入，让服务层 session Memory Compact后续逻辑可以直接复用这些外部能力。
import {
  isSessionMemoryEmpty,
  truncateSessionMemoryForCompact,
} from '../SessionMemory/prompts.js'
// 整理这一组导入，让服务层 session Memory Compact后续逻辑可以直接复用这些外部能力。
import {
  getLastSummarizedMessageId,
  getSessionMemoryContent,
  waitForSessionMemoryExtraction,
} from '../SessionMemory/sessionMemoryUtils.js'
// 整理这一组导入，让服务层 session Memory Compact后续逻辑可以直接复用这些外部能力。
import {
  annotateBoundaryWithPreservedSegment,
  buildPostCompactMessages,
  type CompactionResult,
  createPlanAttachmentIfNeeded,
} from './compact.js'
// 引入 estimateMessageTokens，将 ./microCompact.js 中已经封装好的能力接到本文件流程里。
import { estimateMessageTokens } from './microCompact.js'
// 引入 getCompactUserSummaryMessage，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getCompactUserSummaryMessage } from './prompt.js'

/**
 * Configuration for session memory compaction thresholds
 */
// SessionMemoryCompactConfig 固化服务层 session Memory Compact里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionMemoryCompactConfig = {
  /** Minimum tokens to preserve after compaction */
  minTokens: number
  /** Minimum number of messages with text blocks to keep */
  minTextBlockMessages: number
  /** Maximum tokens to preserve after compaction (hard cap) */
  maxTokens: number
}

// Default configuration values (exported for use in tests)
// DEFAULT_SM_COMPACT_CONFIG 配置 集中保存服务层 session Memory Compact要一起传递的字段。
export const DEFAULT_SM_COMPACT_CONFIG: SessionMemoryCompactConfig = {
  minTokens: 10_000,
  minTextBlockMessages: 5,
  maxTokens: 40_000,
}

// Current configuration (starts with defaults)
// smCompactConfig 配置 集中保存服务层 session Memory Compact要一起传递的字段。
let smCompactConfig: SessionMemoryCompactConfig = {
  ...DEFAULT_SM_COMPACT_CONFIG,
}

// Track whether config has been initialized from remote
// configInitialized 配置标记服务层 session Memory Compact是否启用对应路径。
let configInitialized = false

/**
 * Set the session memory compact configuration
 */
// setSessionMemoryCompactConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionMemoryCompactConfig(
  config: Partial<SessionMemoryCompactConfig>,
): void {
  // smCompactConfig 配置更新为 `{`，确保服务层后续读取最新状态。
  smCompactConfig = {
    ...smCompactConfig,
    ...config,
  }
}

/**
 * Get the current session memory compact configuration
 */
// getSessionMemoryCompactConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionMemoryCompactConfig(): SessionMemoryCompactConfig {
  // 返回结构化结果，集中表达服务层 session Memory Compact已经整理出的状态。
  return { ...smCompactConfig }
}

/**
 * Reset config state (useful for testing)
 */
// resetSessionMemoryCompactConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSessionMemoryCompactConfig(): void {
  // smCompactConfig 配置更新为 `{ ...DEFAULT_SM_COMPACT_CONFIG }`，确保服务层后续读取最新状态。
  smCompactConfig = { ...DEFAULT_SM_COMPACT_CONFIG }
  // configInitialized 配置更新为 `false`，确保服务层后续读取最新状态。
  configInitialized = false
}

/**
 * Initialize configuration from remote config (GrowthBook).
 * Only fetches once per session - subsequent calls return immediately.
 */
// initSessionMemoryCompactConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function initSessionMemoryCompactConfig(): Promise<void> {
  // 满足 `configInitialized` 时，服务层 session Memory Compact执行该分支。
  if (configInitialized) {
    // 服务层 session Memory Compact在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // configInitialized 配置更新为 `true`，确保服务层后续读取最新状态。
  configInitialized = true

  // Load config from GrowthBook, merging with defaults
  // remoteConfig 配置 等待 `getDynamicConfig_BLOCKS_ON_INIT<`，确保继续执行前已有结果。
  const remoteConfig = await getDynamicConfig_BLOCKS_ON_INIT<
    Partial<SessionMemoryCompactConfig>
  >('tengu_sm_compact_config', {})

  // Only use remote values if they are explicitly set (positive numbers)
  // This ensures sensible defaults aren't overridden by zero values
  // 配置 集中保存服务层 session Memory Compact要一起传递的字段。
  const config: SessionMemoryCompactConfig = {
    minTokens:
      remoteConfig.minTokens && remoteConfig.minTokens > 0
        ? remoteConfig.minTokens
        : DEFAULT_SM_COMPACT_CONFIG.minTokens,
    minTextBlockMessages:
      remoteConfig.minTextBlockMessages && remoteConfig.minTextBlockMessages > 0
        ? remoteConfig.minTextBlockMessages
        : DEFAULT_SM_COMPACT_CONFIG.minTextBlockMessages,
    maxTokens:
      remoteConfig.maxTokens && remoteConfig.maxTokens > 0
        ? remoteConfig.maxTokens
        : DEFAULT_SM_COMPACT_CONFIG.maxTokens,
  }
  // setSessionMemoryCompactConfig 写入新的状态值，使服务层 session Memory Compact后续读取保持一致。
  setSessionMemoryCompactConfig(config)
}

/**
 * Check if a message contains text blocks (text content for user/assistant interaction)
 */
// hasTextBlocks 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasTextBlocks(message: Message): boolean {
  // 当 `message.type` 匹配 `'assistant'` 时，服务层 session Memory Compact执行对应分支。
  if (message.type === 'assistant') {
    // 文本内容保存`message.message.content`，供服务层 session Memory Compact后续判断或输出使用。
    const content = message.message.content
    // 返回 `content.some(block => block.type === 'text')`，作为服务层 session Memory Compact这次计算的结果。
    return content.some(block => block.type === 'text')
  }
  // 当 `message.type` 匹配 `'user'` 时，服务层 session Memory Compact执行对应分支。
  if (message.type === 'user') {
    // 文本内容保存`message.message.content`，供服务层 session Memory Compact后续判断或输出使用。
    const content = message.message.content
    // 当 `typeof content` 匹配 `'string'` 时，服务层 session Memory Compact执行对应分支。
    if (typeof content === 'string') {
      // 返回 `content.length > 0`，作为服务层 session Memory Compact这次计算的结果。
      return content.length > 0
    }
    // 满足 `Array.isArray(content)` 时，服务层 session Memory Compact执行该分支。
    if (Array.isArray(content)) {
      // 返回 `content.some(block => block.type === 'text')`，作为服务层 session Memory Compact这次计算的结果。
      return content.some(block => block.type === 'text')
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a message contains tool_result blocks and return their tool_use_ids
 */
// getToolResultIds 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolResultIds(message: Message): string[] {
  // `message.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'user') {
    // 返回列表结果，保留服务层 session Memory Compact已经排好的条目顺序。
    return []
  }
  // 文本内容保存`message.message.content`，供服务层 session Memory Compact后续判断或输出使用。
  const content = message.message.content
  // 满足 `!Array.isArray(content)` 时，服务层 session Memory Compact执行该分支。
  if (!Array.isArray(content)) {
    // 返回列表结果，保留服务层 session Memory Compact已经排好的条目顺序。
    return []
  }
  // ids 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const ids: string[] = []
  // 按顺序遍历 `content` 中的block，逐个交给服务层 session Memory Compact处理。
  for (const block of content) {
    // 当 `block.type` 匹配 `'tool_result'` 时，服务层 session Memory Compact执行对应分支。
    if (block.type === 'tool_result') {
      // ids 集合追加新条目，保持收集顺序与输入顺序一致。
      ids.push(block.tool_use_id)
    }
  }
  // 返回 `ids`，作为服务层 session Memory Compact这次计算的结果。
  return ids
}

/**
 * Check if a message contains tool_use blocks with any of the given ids
 */
// hasToolUseWithIds 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasToolUseWithIds(message: Message, toolUseIds: Set<string>): boolean {
  // `message.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'assistant') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 文本内容保存`message.message.content`，供服务层 session Memory Compact后续判断或输出使用。
  const content = message.message.content
  // 满足 `!Array.isArray(content)` 时，服务层 session Memory Compact执行该分支。
  if (!Array.isArray(content)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `content.some(`，作为服务层 session Memory Compact这次计算的结果。
  return content.some(
    // block更新为 `> block.type === 'tool_use' && toolUseIds.has(block.id)`，确保服务层后续读取最新状态。
    block => block.type === 'tool_use' && toolUseIds.has(block.id),
  )
}

/**
 * Adjust the start index to ensure we don't split tool_use/tool_result pairs
 * or thinking blocks that share the same message.id with kept assistant messages.
 *
 * If ANY message we're keeping contains tool_result blocks, we need to
 * include the preceding assistant message(s) that contain the matching tool_use blocks.
 *
 * Additionally, if ANY assistant message in the kept range has the same message.id
 * as a preceding assistant message (which may contain thinking blocks), we need to
 * include those messages so they can be properly merged by normalizeMessagesForAPI.
 *
 * This handles the case where streaming yields separate messages per content block
 * (thinking, tool_use, etc.) with the same message.id but different uuids. If the
 * startIndex lands on one of these streaming messages, we need to look at ALL kept
 * messages for tool_results, not just the first one.
 *
 * Example bug scenarios this fixes:
 *
 * Tool pair scenario:
 *   Session storage (before compaction):
 *     Index N:   assistant, message.id: X, content: [thinking]
 *     Index N+1: assistant, message.id: X, content: [tool_use: ORPHAN_ID]
 *     Index N+2: assistant, message.id: X, content: [tool_use: VALID_ID]
 *     Index N+3: user, content: [tool_result: ORPHAN_ID, tool_result: VALID_ID]
 *
 *   If startIndex = N+2:
 *     - Old code: checked only message N+2 for tool_results, found none, returned N+2
 *     - After slicing and normalizeMessagesForAPI merging by message.id:
 *       msg[1]: assistant with [tool_use: VALID_ID]  (ORPHAN tool_use was excluded!)
 *       msg[2]: user with [tool_result: ORPHAN_ID, tool_result: VALID_ID]
 *     - API error: orphan tool_result references non-existent tool_use
 *
 * Thinking block scenario:
 *   Session storage (before compaction):
 *     Index N:   assistant, message.id: X, content: [thinking]
 *     Index N+1: assistant, message.id: X, content: [tool_use: ID]
 *     Index N+2: user, content: [tool_result: ID]
 *
 *   If startIndex = N+1:
 *     - Without this fix: thinking block at N is excluded
 *     - After normalizeMessagesForAPI: thinking block is lost (no message to merge with)
 *
 *   Fixed code: detects that message N+1 has same message.id as N, adjusts to N.
 */
// adjustIndexToPreserveAPIInvariants 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function adjustIndexToPreserveAPIInvariants(
  messages: Message[],
  startIndex: number,
): number {
  // 组合条件 `startIndex <= 0 || startIndex >= messages.length` 成立时，服务层 session Memory Compact才启用这条专门路径。
  if (startIndex <= 0 || startIndex >= messages.length) {
    // 返回 `startIndex`，作为服务层 session Memory Compact这次计算的结果。
    return startIndex
  }

  // adjustedIndex 索引 命名 `startIndex`，让后续代码直接表达这个值的用途。
  let adjustedIndex = startIndex

  // Step 1: Handle tool_use/tool_result pairs
  // Collect tool_result IDs from ALL messages in the kept range
  // allToolResultIds 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allToolResultIds: string[] = []
  // 循环处理 `let i = startIndex; i < messages.length; i++`，让服务层 session Memory Compact逐项把同类条目按顺序走完。
  for (let i = startIndex; i < messages.length; i++) {
    // allToolResultIds 集合追加新条目，保持收集顺序与输入顺序一致。
    allToolResultIds.push(...getToolResultIds(messages[i]!))
  }

  // 满足 `allToolResultIds.length > 0` 时，服务层 session Memory Compact执行该分支。
  if (allToolResultIds.length > 0) {
    // Collect tool_use IDs already in the kept range
    // toolUseIdsInKeptRange 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
    const toolUseIdsInKeptRange = new Set<string>()
    // 循环处理 `let i = adjustedIndex; i < messages.length; i++`，让服务层 session Memory Compact逐项把同类条目按顺序走完。
    for (let i = adjustedIndex; i < messages.length; i++) {
      // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
      const msg = messages[i]!
      // 组合条件 `msg.type === 'assistant' && Array.isArray(msg.message.content)` 成立时，服务层 session Memory Compact才启用这条专门路径。
      if (msg.type === 'assistant' && Array.isArray(msg.message.content)) {
        // 按顺序遍历 `msg.message.content` 中的block，逐个交给服务层 session Memory Compact处理。
        for (const block of msg.message.content) {
          // 当 `block.type` 匹配 `'tool_use'` 时，服务层 session Memory Compact执行对应分支。
          if (block.type === 'tool_use') {
            // 调用 toolUseIdsInKeptRange.add，触发服务层 session Memory Compact此处需要的副作用。
            toolUseIdsInKeptRange.add(block.id)
          }
        }
      }
    }

    // Only look for tool_uses that are NOT already in the kept range
    // neededToolUseIds 集合保存`Set`，供服务层 session Memory Compact后续处理使用。
    const neededToolUseIds = new Set(
      // 调用 allToolResultIds.filter，触发服务层 session Memory Compact此处需要的副作用。
      allToolResultIds.filter(id => !toolUseIdsInKeptRange.has(id)),
    )

    // Find the assistant message(s) with matching tool_use blocks
    // 循环处理 `let i = adjustedIndex - 1; i >= 0 && neededToolUs`，让服务层 session Memory Compact逐项把同类条目按顺序走完。
    for (let i = adjustedIndex - 1; i >= 0 && neededToolUseIds.size > 0; i--) {
      // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
      const message = messages[i]!
      // 满足 `hasToolUseWithIds(message, neededToolUseIds)` 时，服务层 session Memory Compact执行该分支。
      if (hasToolUseWithIds(message, neededToolUseIds)) {
        // adjustedIndex 索引更新为 `i`，确保服务层后续读取最新状态。
        adjustedIndex = i
        // Remove found tool_use_ids from the set
        // 服务层 session Memory Compact在这里进入条件判断，后续代码按实际状态分流。
        if (
          message.type === 'assistant' &&
          Array.isArray(message.message.content)
        ) {
          // 按顺序遍历 `message.message.content` 中的block，逐个交给服务层 session Memory Compact处理。
          for (const block of message.message.content) {
            // 组合条件 `block.type === 'tool_use' && neededToolUseIds.has(block.id)` 成立时，服务层 session Memory Compact才启用这条专门路径。
            if (block.type === 'tool_use' && neededToolUseIds.has(block.id)) {
              // 调用 neededToolUseIds.delete，触发服务层 session Memory Compact此处需要的副作用。
              neededToolUseIds.delete(block.id)
            }
          }
        }
      }
    }
  }

  // Step 2: Handle thinking blocks that share message.id with kept assistant messages
  // Collect all message.ids from assistant messages in the kept range
  // messageIdsInKeptRange 消息数据构建`new Set<string>()`，供后续判断或组装使用。
  const messageIdsInKeptRange = new Set<string>()
  // 循环处理 `let i = adjustedIndex; i < messages.length; i++`，让服务层 session Memory Compact逐项把同类条目按顺序走完。
  for (let i = adjustedIndex; i < messages.length; i++) {
    // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const msg = messages[i]!
    // 组合条件 `msg.type === 'assistant' && msg.message.id` 成立时，服务层 session Memory Compact才启用这条专门路径。
    if (msg.type === 'assistant' && msg.message.id) {
      // 调用 messageIdsInKeptRange.add，触发服务层 session Memory Compact此处需要的副作用。
      messageIdsInKeptRange.add(msg.message.id)
    }
  }

  // Look backwards for assistant messages with the same message.id that are not in the kept range
  // These may contain thinking blocks that need to be merged by normalizeMessagesForAPI
  // 循环处理 `let i = adjustedIndex - 1; i >= 0; i--`，让服务层 session Memory Compact逐项把同类条目按顺序走完。
  for (let i = adjustedIndex - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const message = messages[i]!
    // 服务层 session Memory Compact在这里进入条件判断，后续代码按实际状态分流。
    if (
      message.type === 'assistant' &&
      message.message.id &&
      messageIdsInKeptRange.has(message.message.id)
    ) {
      // This message has the same message.id as one in the kept range
      // Include it so thinking blocks can be properly merged
      // adjustedIndex 索引更新为 `i`，确保服务层后续读取最新状态。
      adjustedIndex = i
    }
  }

  // 返回 `adjustedIndex`，作为服务层 session Memory Compact这次计算的结果。
  return adjustedIndex
}

/**
 * Calculate the starting index for messages to keep after compaction.
 * Starts from lastSummarizedMessageId, then expands backwards to meet minimums:
 * - At least config.minTokens tokens
 * - At least config.minTextBlockMessages messages with text blocks
 * Stops expanding if config.maxTokens is reached.
 * Also ensures tool_use/tool_result pairs are not split.
 */
// calculateMessagesToKeepIndex 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateMessagesToKeepIndex(
  messages: Message[],
  lastSummarizedIndex: number,
): number {
  // 对话消息为空时立即返回或跳过，避免服务层 session Memory Compact把空集合当成可处理内容。
  if (messages.length === 0) {
    // 返回 `0`，作为服务层 session Memory Compact这次计算的结果。
    return 0
  }

  // 配置读取`getSessionMemoryCompactConfig`，供服务层 session Memory Compact后续处理使用。
  const config = getSessionMemoryCompactConfig()

  // Start from the message after lastSummarizedIndex
  // If lastSummarizedIndex is -1 (not found) or messages.length (no summarized id),
  // we start with no messages kept
  // startIndex 索引 先占位，稍后的条件分支会根据实际输入补齐它。
  let startIndex =
    lastSummarizedIndex >= 0 ? lastSummarizedIndex + 1 : messages.length

  // Calculate current tokens and text-block message count from startIndex to end
  // totalTokens 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let totalTokens = 0
  // textBlockMessageCount 消息数据保存`0`，供后续判断或组装使用。
  let textBlockMessageCount = 0
  // 循环处理 `let i = startIndex; i < messages.length; i++`，让服务层 session Memory Compact逐项把同类条目按顺序走完。
  for (let i = startIndex; i < messages.length; i++) {
    // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const msg = messages[i]!
    // 服务层 session Memory Compact在这里处理 `totalTokens += estimateMessageTokens([msg])`，完成这一小步状态转换。
    totalTokens += estimateMessageTokens([msg])
    // 满足 `hasTextBlocks(msg)` 时，服务层 session Memory Compact执行该分支。
    if (hasTextBlocks(msg)) {
      // 服务层 session Memory Compact在这里处理 `textBlockMessageCount++`，完成这一小步状态转换。
      textBlockMessageCount++
    }
  }

  // Check if we already hit the max cap
  // 满足 `totalTokens >= config.maxTokens` 时，服务层 session Memory Compact执行该分支。
  if (totalTokens >= config.maxTokens) {
    // 返回 `adjustIndexToPreserveAPIInvariants(messages, startIndex)`，作为服务层 session Memory Compact这次计算的结果。
    return adjustIndexToPreserveAPIInvariants(messages, startIndex)
  }

  // Check if we already meet both minimums
  // 服务层 session Memory Compact在这里进入条件判断，后续代码按实际状态分流。
  if (
    totalTokens >= config.minTokens &&
    textBlockMessageCount >= config.minTextBlockMessages
  ) {
    // 返回 `adjustIndexToPreserveAPIInvariants(messages, startIndex)`，作为服务层 session Memory Compact这次计算的结果。
    return adjustIndexToPreserveAPIInvariants(messages, startIndex)
  }

  // Expand backwards until we meet both minimums or hit max cap.
  // Floor at the last boundary: the preserved-segment chain has a disk
  // discontinuity there (att[0]→summary shortcut from dedup-skip), which
  // would let the loader's tail→head walk bypass inner preserved messages
  // and then prune them. Reactive compact already slices at the boundary
  // via getMessagesAfterCompactBoundary; this is the same invariant.
  // idx筛选`messages.findLastIndex`，供服务层 session Memory Compact后续处理使用。
  const idx = messages.findLastIndex(m => isCompactBoundaryMessage(m))
  // floor标记服务层 session Memory Compact是否启用对应路径。
  const floor = idx === -1 ? 0 : idx + 1
  // 循环处理 `let i = startIndex - 1; i >= floor; i--`，让服务层 session Memory Compact逐项把同类条目按顺序走完。
  for (let i = startIndex - 1; i >= floor; i--) {
    // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const msg = messages[i]!
    // msgTokens 集合保存`estimateMessageTokens`，供服务层 session Memory Compact后续处理使用。
    const msgTokens = estimateMessageTokens([msg])
    // 服务层 session Memory Compact在这里处理 `totalTokens += msgTokens`，完成这一小步状态转换。
    totalTokens += msgTokens
    // 满足 `hasTextBlocks(msg)` 时，服务层 session Memory Compact执行该分支。
    if (hasTextBlocks(msg)) {
      // 服务层 session Memory Compact在这里处理 `textBlockMessageCount++`，完成这一小步状态转换。
      textBlockMessageCount++
    }
    // startIndex 索引更新为 `i`，确保服务层后续读取最新状态。
    startIndex = i

    // Stop if we hit the max cap
    // 满足 `totalTokens >= config.maxTokens` 时，服务层 session Memory Compact执行该分支。
    if (totalTokens >= config.maxTokens) {
      // 结束这个分支或循环，避免服务层 session Memory Compact继续落入后续路径。
      break
    }

    // Stop if we meet both minimums
    // 服务层 session Memory Compact在这里进入条件判断，后续代码按实际状态分流。
    if (
      totalTokens >= config.minTokens &&
      textBlockMessageCount >= config.minTextBlockMessages
    ) {
      // 结束这个分支或循环，避免服务层 session Memory Compact继续落入后续路径。
      break
    }
  }

  // Adjust for tool pairs
  // 返回 `adjustIndexToPreserveAPIInvariants(messages, startIndex)`，作为服务层 session Memory Compact这次计算的结果。
  return adjustIndexToPreserveAPIInvariants(messages, startIndex)
}

/**
 * Check if we should use session memory for compaction
 * Uses cached gate values to avoid blocking on Statsig initialization
 */
// shouldUseSessionMemoryCompaction 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldUseSessionMemoryCompaction(): boolean {
  // Allow env var override for eval runs and testing
  // 满足 `isEnvTruthy(process.env.ENABLE_CLAUDE_CODE_SM_COMPACT)` 时，服务层 session Memory Compact执行该分支。
  if (isEnvTruthy(process.env.ENABLE_CLAUDE_CODE_SM_COMPACT)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `isEnvTruthy(process.env.DISABLE_CLAUDE_CODE_SM_COMPACT)` 时，服务层 session Memory Compact执行该分支。
  if (isEnvTruthy(process.env.DISABLE_CLAUDE_CODE_SM_COMPACT)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // sessionMemoryFlag 会话数据读取`getFeatureValue_CACHED_MAY_BE_STALE`，供服务层 session Memory Compact后续处理使用。
  const sessionMemoryFlag = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_session_memory',
    false,
  )
  // smCompactFlag读取`getFeatureValue_CACHED_MAY_BE_STALE`，供服务层 session Memory Compact后续处理使用。
  const smCompactFlag = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_sm_compact',
    false,
  )
  // shouldUse标记服务层 session Memory Compact是否启用对应路径。
  const shouldUse = sessionMemoryFlag && smCompactFlag

  // Log flag states for debugging (ant-only to avoid noise in external logs)
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 session Memory Compact执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_sm_compact_flag_check', {
      tengu_session_memory: sessionMemoryFlag,
      tengu_sm_compact: smCompactFlag,
      should_use: shouldUse,
    })
  }

  // 返回 `shouldUse`，作为服务层 session Memory Compact这次计算的结果。
  return shouldUse
}

/**
 * Create a CompactionResult from session memory
 */
// createCompactionResultFromSessionMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createCompactionResultFromSessionMemory(
  messages: Message[],
  sessionMemory: string,
  messagesToKeep: Message[],
  hookResults: HookResultMessage[],
  transcriptPath: string,
  agentId?: AgentId,
): CompactionResult {
  // preCompactTokenCount 数量保存`tokenCountFromLastAPIResponse`，供服务层 session Memory Compact后续处理使用。
  const preCompactTokenCount = tokenCountFromLastAPIResponse(messages)

  // boundaryMarker构建`createCompactBoundaryMessage`，供服务层 session Memory Compact后续处理使用。
  const boundaryMarker = createCompactBoundaryMessage(
    'auto',
    preCompactTokenCount ?? 0,
    messages[messages.length - 1]?.uuid,
  )
  // preCompactDiscovered保存`extractDiscoveredToolNames`，供服务层 session Memory Compact后续处理使用。
  const preCompactDiscovered = extractDiscoveredToolNames(messages)
  // 满足 `preCompactDiscovered.size > 0` 时，服务层 session Memory Compact执行该分支。
  if (preCompactDiscovered.size > 0) {
    // 更新为 `[`，确保服务层后续读取最新状态。
    boundaryMarker.compactMetadata.preCompactDiscoveredTools = [
      ...preCompactDiscovered,
    ].sort()
  }

  // Truncate oversized sections to prevent session memory from consuming
  // the entire post-compact token budget
  // 服务层 session Memory Compact先整理这一处局部数据，后续分支可以直接读取。
  const { truncatedContent, wasTruncated } =
    truncateSessionMemoryForCompact(sessionMemory)

  // summaryContent读取`getCompactUserSummaryMessage`，供服务层 session Memory Compact后续处理使用。
  let summaryContent = getCompactUserSummaryMessage(
    truncatedContent,
    true,
    transcriptPath,
    true,
  )

  // 满足 `wasTruncated` 时，服务层 session Memory Compact执行该分支。
  if (wasTruncated) {
    // memoryPath 路径数据读取`getSessionMemoryPath`，供服务层 session Memory Compact后续处理使用。
    const memoryPath = getSessionMemoryPath()
    // 服务层 session Memory Compact在这里处理 `summaryContent += `\n\nSome session memory sections were truncated for ...`，完成这一小步状态转换。
    summaryContent += `\n\nSome session memory sections were truncated for length. The full session memory can be viewed at: ${memoryPath}`
  }

  // summaryMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
  const summaryMessages = [
    createUserMessage({
      content: summaryContent,
      isCompactSummary: true,
      isVisibleInTranscriptOnly: true,
    }),
  ]

  // planAttachment构建`createPlanAttachmentIfNeeded`，供服务层 session Memory Compact后续处理使用。
  const planAttachment = createPlanAttachmentIfNeeded(agentId)
  // attachments 集合读取 `planAttachment ? [planAttachment] : []` 对应条目，后续围绕该成员继续处理。
  const attachments = planAttachment ? [planAttachment] : []

  // 返回结构化结果，集中表达服务层 session Memory Compact已经整理出的状态。
  return {
    boundaryMarker: annotateBoundaryWithPreservedSegment(
      boundaryMarker,
      summaryMessages[summaryMessages.length - 1]!.uuid,
      messagesToKeep,
    ),
    summaryMessages,
    attachments,
    hookResults,
    messagesToKeep,
    preCompactTokenCount,
    // SM-compact has no compact-API-call, so postCompactTokenCount (kept for
    // event continuity) and truePostCompactTokenCount converge to the same value.
    postCompactTokenCount: estimateMessageTokens(summaryMessages),
    truePostCompactTokenCount: estimateMessageTokens(summaryMessages),
  }
}

/**
 * Try to use session memory for compaction instead of traditional compaction.
 * Returns null if session memory compaction cannot be used.
 *
 * Handles two scenarios:
 * 1. Normal case: lastSummarizedMessageId is set, keep only messages after that ID
 * 2. Resumed session: lastSummarizedMessageId is not set but session memory has content,
 *    keep all messages but use session memory as the summary
 */
// trySessionMemoryCompaction 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function trySessionMemoryCompaction(
  messages: Message[],
  agentId?: AgentId,
  autoCompactThreshold?: number,
): Promise<CompactionResult | null> {
  // 满足 `!shouldUseSessionMemoryCompaction()` 时，服务层 session Memory Compact执行该分支。
  if (!shouldUseSessionMemoryCompaction()) {
    // 返回 `null`，作为服务层 session Memory Compact这次计算的结果。
    return null
  }

  // Initialize config from remote (only fetches once)
  // 等待 `initSessionMemoryCompactConfig()` 完成，再继续服务层 session Memory Compact的异步流程。
  await initSessionMemoryCompactConfig()

  // Wait for any in-progress session memory extraction to complete (with timeout)
  // 等待 `waitForSessionMemoryExtraction()` 完成，再继续服务层 session Memory Compact的异步流程。
  await waitForSessionMemoryExtraction()

  // lastSummarizedMessageId 消息数据读取`getLastSummarizedMessageId`，供服务层 session Memory Compact后续处理使用。
  const lastSummarizedMessageId = getLastSummarizedMessageId()
  // sessionMemory 会话数据读取`getSessionMemoryContent`，供服务层 session Memory Compact后续处理使用。
  const sessionMemory = await getSessionMemoryContent()

  // No session memory file exists at all
  // sessionMemory 会话数据缺失时提前走兜底路径，避免服务层 session Memory Compact继续依赖无效输入。
  if (!sessionMemory) {
    // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_sm_compact_no_session_memory', {})
    // 返回 `null`，作为服务层 session Memory Compact这次计算的结果。
    return null
  }

  // Session memory exists but matches the template (no actual content extracted)
  // Fall back to legacy compact behavior
  // 满足 `await isSessionMemoryEmpty(sessionMemory)` 时，服务层 session Memory Compact执行该分支。
  if (await isSessionMemoryEmpty(sessionMemory)) {
    // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_sm_compact_empty_template', {})
    // 返回 `null`，作为服务层 session Memory Compact这次计算的结果。
    return null
  }

  // 保护这一段可能失败的服务层 session Memory Compact操作，确保异常能进入相邻错误处理。
  try {
    // lastSummarizedIndex 索引 先占位，稍后的条件分支会根据实际输入补齐它。
    let lastSummarizedIndex: number

    // 满足 `lastSummarizedMessageId` 时，服务层 session Memory Compact执行该分支。
    if (lastSummarizedMessageId) {
      // Normal case: we know exactly which messages have been summarized
      // lastSummarizedIndex 索引更新为 `messages.findIndex(`，确保服务层后续读取最新状态。
      lastSummarizedIndex = messages.findIndex(
        // 消息更新为 `> msg.uuid === lastSummarizedMessageId`，确保服务层后续读取最新状态。
        msg => msg.uuid === lastSummarizedMessageId,
      )

      // 满足 `lastSummarizedIndex === -1` 时，服务层 session Memory Compact执行该分支。
      if (lastSummarizedIndex === -1) {
        // The summarized message ID doesn't exist in current messages
        // This can happen if messages were modified - fall back to legacy compact
        // since we can't determine the boundary between summarized and unsummarized messages
        // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_sm_compact_summarized_id_not_found', {})
        // 返回 `null`，作为服务层 session Memory Compact这次计算的结果。
        return null
      }
    } else {
      // Resumed session case: session memory has content but we don't know the boundary
      // Set lastSummarizedIndex to last message so startIndex becomes messages.length (no messages kept initially)
      // lastSummarizedIndex 索引更新为 `messages.length - 1`，确保服务层后续读取最新状态。
      lastSummarizedIndex = messages.length - 1
      // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_sm_compact_resumed_session', {})
    }

    // Calculate the starting index for messages to keep
    // This starts from lastSummarizedIndex, expands to meet minimums,
    // and adjusts to not split tool_use/tool_result pairs
    // startIndex 索引保存`calculateMessagesToKeepIndex`，供服务层 session Memory Compact后续处理使用。
    const startIndex = calculateMessagesToKeepIndex(
      messages,
      lastSummarizedIndex,
    )
    // Filter out old compact boundary messages from messagesToKeep.
    // After REPL pruning, old boundaries re-yielded from messagesToKeep would
    // trigger an unwanted second prune (isCompactBoundaryMessage returns true),
    // discarding the new boundary and summary.
    // messagesToKeep 消息数据保存`messages`，供后续判断或组装使用。
    const messagesToKeep = messages
      .slice(startIndex)
      // 链式调用 filter，继续加工上一行在服务层 session Memory Compact中产生的数据。
      .filter(m => !isCompactBoundaryMessage(m))

    // Run session start hooks to restore CLAUDE.md and other context
    // hookResults 集合保存`processSessionStartHooks`，供服务层 session Memory Compact后续处理使用。
    const hookResults = await processSessionStartHooks('compact', {
      model: getMainLoopModel(),
    })

    // Get transcript path for the summary message
    // transcriptPath 路径数据读取`getTranscriptPath`，供服务层 session Memory Compact后续处理使用。
    const transcriptPath = getTranscriptPath()

    // compactionResult构建`createCompactionResultFromSessionMemory`，供服务层 session Memory Compact后续处理使用。
    const compactionResult = createCompactionResultFromSessionMemory(
      messages,
      sessionMemory,
      messagesToKeep,
      hookResults,
      transcriptPath,
      agentId,
    )

    // postCompactMessages 消息数据构建`buildPostCompactMessages`，供服务层 session Memory Compact后续处理使用。
    const postCompactMessages = buildPostCompactMessages(compactionResult)

    // postCompactTokenCount 数量保存`estimateMessageTokens`，供服务层 session Memory Compact后续处理使用。
    const postCompactTokenCount = estimateMessageTokens(postCompactMessages)

    // Only check threshold if one was provided (for autocompact)
    // 服务层 session Memory Compact在这里进入条件判断，后续代码按实际状态分流。
    if (
      autoCompactThreshold !== undefined &&
      postCompactTokenCount >= autoCompactThreshold
    ) {
      // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_sm_compact_threshold_exceeded', {
        postCompactTokenCount,
        autoCompactThreshold,
      })
      // 返回 `null`，作为服务层 session Memory Compact这次计算的结果。
      return null
    }

    // 返回结构化结果，集中表达服务层 session Memory Compact已经整理出的状态。
    return {
      ...compactionResult,
      postCompactTokenCount,
      truePostCompactTokenCount: postCompactTokenCount,
    }
  } catch (error) {
    // Use logEvent instead of logError since errors here are expected
    // (e.g., file not found, path issues) and shouldn't go to error logs
    // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_sm_compact_error', {})
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 session Memory Compact执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 session Memory Compact运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Session memory compaction error: ${errorMessage(error)}`)
    }
    // 返回 `null`，作为服务层 session Memory Compact这次计算的结果。
    return null
  }
}
