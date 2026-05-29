// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准服务层 micro Compact的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准服务层 micro Compact的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准服务层 micro Compact的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../../tools/FileWriteTool/prompt.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from '../../tools/GlobTool/prompt.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from '../../tools/GrepTool/prompt.js'
// 接入 WEB_FETCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_FETCH_TOOL_NAME } from '../../tools/WebFetchTool/prompt.js'
// 接入 WEB_SEARCH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WEB_SEARCH_TOOL_NAME } from '../../tools/WebSearchTool/prompt.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准服务层 micro Compact的数据契约。
import type { Message } from '../../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 getMainLoopModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getMainLoopModel } from '../../utils/model/model.js'
// 复用 SHELL_TOOL_NAMES 工具函数，把通用处理留在 ../../utils/shell/shellToolUtils.js 中维护。
import { SHELL_TOOL_NAMES } from '../../utils/shell/shellToolUtils.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让服务层 micro Compact后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 引入 notifyCacheDeletion，将 ../api/promptCacheBreakDetection.js 中已经封装好的能力接到本文件流程里。
import { notifyCacheDeletion } from '../api/promptCacheBreakDetection.js'
// 引入 roughTokenCountEstimation，将 ../tokenEstimation.js 中已经封装好的能力接到本文件流程里。
import { roughTokenCountEstimation } from '../tokenEstimation.js'
// 整理这一组导入，让服务层 micro Compact后续逻辑可以直接复用这些外部能力。
import {
  clearCompactWarningSuppression,
  suppressCompactWarning,
} from './compactWarningState.js'
// 整理这一组导入，让服务层 micro Compact后续逻辑可以直接复用这些外部能力。
import {
  getTimeBasedMCConfig,
  type TimeBasedMCConfig,
} from './timeBasedMCConfig.js'

// Inline from utils/toolResultStorage.ts — importing that file pulls in
// sessionStorage → utils/messages → services/api/errors, completing a
// circular-deps loop back through this file via promptCacheBreakDetection.
// Drift is caught by a test asserting equality with the source-of-truth.
// TIME_BASED_MC_CLEARED_MESSAGE 消息数据固定为 `'[Old tool result content cleared]'`，作为服务层 micro Compact后续展示或比较的基准。
export const TIME_BASED_MC_CLEARED_MESSAGE = '[Old tool result content cleared]'

// IMAGE_MAX_TOKEN_SIZE保存`2000`，供后续判断或组装使用。
const IMAGE_MAX_TOKEN_SIZE = 2000

// Only compact these tools
// COMPACTABLE_TOOLS 集合构建`new Set<string>([`，供后续判断或组装使用。
const COMPACTABLE_TOOLS = new Set<string>([
  FILE_READ_TOOL_NAME,
  ...SHELL_TOOL_NAMES,
  GREP_TOOL_NAME,
  GLOB_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
  WEB_FETCH_TOOL_NAME,
  FILE_EDIT_TOOL_NAME,
  FILE_WRITE_TOOL_NAME,
])

// --- Cached microcompact state (ant-only, gated by feature('CACHED_MICROCOMPACT')) ---

// Lazy-initialized cached MC module and state to avoid importing in external builds.
// The imports and state live inside feature() checks for dead code elimination.
// cachedMCModule 缓存初始化为空值，后续分支会在有数据时补齐。
let cachedMCModule: typeof import('./cachedMicrocompact.js') | null = null
// cachedMCState 状态 命名 `null`，让后续代码直接表达这个值的用途。
let cachedMCState: import('./cachedMicrocompact.js').CachedMCState | null = null
// 服务层 micro Compact先整理这一处局部数据，后续分支可以直接读取。
let pendingCacheEdits:
  | import('./cachedMicrocompact.js').CacheEditsBlock
  | null = null

// getCachedMCModule 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getCachedMCModule(): Promise<
  typeof import('./cachedMicrocompact.js')
> {
  // cachedMCModule 缓存缺失时提前走兜底路径，避免服务层 micro Compact继续依赖无效输入。
  if (!cachedMCModule) {
    // cachedMCModule 缓存更新为 `await import('./cachedMicrocompact.js')`，确保服务层后续读取最新状态。
    cachedMCModule = await import('./cachedMicrocompact.js')
  }
  // 返回 `cachedMCModule`，作为服务层 micro Compact这次计算的结果。
  return cachedMCModule
}

// ensureCachedMCState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ensureCachedMCState(): import('./cachedMicrocompact.js').CachedMCState {
  // 组合条件 `!cachedMCState && cachedMCModule` 成立时，服务层 micro Compact才启用这条专门路径。
  if (!cachedMCState && cachedMCModule) {
    // cachedMCState 状态更新为 `cachedMCModule.createCachedMCState()`，确保服务层后续读取最新状态。
    cachedMCState = cachedMCModule.createCachedMCState()
  }
  // cachedMCState 状态缺失时提前走兜底路径，避免服务层 micro Compact继续依赖无效输入。
  if (!cachedMCState) {
    // 抛出 new Error(，阻止服务层 micro Compact在无效状态下继续运行。
    throw new Error(
      'cachedMCState not initialized — getCachedMCModule() must be called first',
    )
  }
  // 返回 `cachedMCState`，作为服务层 micro Compact这次计算的结果。
  return cachedMCState
}

/**
 * Get new pending cache edits to be included in the next API request.
 * Returns null if there are no new pending edits.
 * Clears the pending state (caller must pin them after insertion).
 */
// consumePendingCacheEdits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function consumePendingCacheEdits():
  | import('./cachedMicrocompact.js').CacheEditsBlock
  | null {
  // edits 集合 命名 `pendingCacheEdits`，让后续代码直接表达这个值的用途。
  const edits = pendingCacheEdits
  // pendingCacheEdits 缓存更新为 `null`，确保服务层后续读取最新状态。
  pendingCacheEdits = null
  // 返回 `edits`，作为服务层 micro Compact这次计算的结果。
  return edits
}

/**
 * Get all previously-pinned cache edits that must be re-sent at their
 * original positions for cache hits.
 */
// getPinnedCacheEdits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPinnedCacheEdits(): import('./cachedMicrocompact.js').PinnedCacheEdits[] {
  // cachedMCState 状态缺失时提前走兜底路径，避免服务层 micro Compact继续依赖无效输入。
  if (!cachedMCState) {
    // 返回列表结果，保留服务层 micro Compact已经排好的条目顺序。
    return []
  }
  // 返回 `cachedMCState.pinnedEdits`，作为服务层 micro Compact这次计算的结果。
  return cachedMCState.pinnedEdits
}

/**
 * Pin a new cache_edits block to a specific user message position.
 * Called after inserting new edits so they are re-sent in subsequent calls.
 */
// pinCacheEdits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pinCacheEdits(
  userMessageIndex: number,
  block: import('./cachedMicrocompact.js').CacheEditsBlock,
): void {
  // 满足 `cachedMCState` 时，服务层 micro Compact执行该分支。
  if (cachedMCState) {
    // pinnedEdits 集合追加新条目，保持收集顺序与输入顺序一致。
    cachedMCState.pinnedEdits.push({ userMessageIndex, block })
  }
}

/**
 * Marks all registered tools as sent to the API.
 * Called after a successful API response.
 */
// markToolsSentToAPIState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markToolsSentToAPIState(): void {
  // 组合条件 `cachedMCState && cachedMCModule` 成立时，服务层 micro Compact才启用这条专门路径。
  if (cachedMCState && cachedMCModule) {
    // 调用 cachedMCModule.markToolsSentToAPI，触发服务层 micro Compact此处需要的副作用。
    cachedMCModule.markToolsSentToAPI(cachedMCState)
  }
}

// resetMicrocompactState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetMicrocompactState(): void {
  // 组合条件 `cachedMCState && cachedMCModule` 成立时，服务层 micro Compact才启用这条专门路径。
  if (cachedMCState && cachedMCModule) {
    // 调用 cachedMCModule.resetCachedMCState，触发服务层 micro Compact此处需要的副作用。
    cachedMCModule.resetCachedMCState(cachedMCState)
  }
  // pendingCacheEdits 缓存更新为 `null`，确保服务层后续读取最新状态。
  pendingCacheEdits = null
}

// Helper to calculate tool result tokens
// calculateToolResultTokens 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function calculateToolResultTokens(block: ToolResultBlockParam): number {
  // block.content缺失时提前走兜底路径，避免服务层 micro Compact继续依赖无效输入。
  if (!block.content) {
    // 返回 `0`，作为服务层 micro Compact这次计算的结果。
    return 0
  }

  // 当 `typeof block.content` 匹配 `'string'` 时，服务层 micro Compact执行对应分支。
  if (typeof block.content === 'string') {
    // 返回 `roughTokenCountEstimation(block.content)`，作为服务层 micro Compact这次计算的结果。
    return roughTokenCountEstimation(block.content)
  }

  // Array of TextBlockParam | ImageBlockParam | DocumentBlockParam
  // 返回 `block.content.reduce((sum, item) => {`，作为服务层 micro Compact这次计算的结果。
  return block.content.reduce((sum, item) => {
    // 当 `item.type` 匹配 `'text'` 时，服务层 micro Compact执行对应分支。
    if (item.type === 'text') {
      // 返回 `sum + roughTokenCountEstimation(item.text)`，作为服务层 micro Compact这次计算的结果。
      return sum + roughTokenCountEstimation(item.text)
    // 服务层 micro Compact在这里处理 `} else if (item.type === 'image' || item.type === 'document') {`，完成这一小步状态转换。
    } else if (item.type === 'image' || item.type === 'document') {
      // Images/documents are approximately 2000 tokens regardless of format
      // 返回 `sum + IMAGE_MAX_TOKEN_SIZE`，作为服务层 micro Compact这次计算的结果。
      return sum + IMAGE_MAX_TOKEN_SIZE
    }
    // 返回 `sum`，作为服务层 micro Compact这次计算的结果。
    return sum
  }, 0)
}

/**
 * Estimate token count for messages by extracting text content
 * Used for rough token estimation when we don't have accurate API counts
 * Pads estimate by 4/3 to be conservative since we're approximating
 */
// estimateMessageTokens 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function estimateMessageTokens(messages: Message[]): number {
  // totalTokens 集合保存`0`，供后续判断或组装使用。
  let totalTokens = 0

  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 micro Compact处理。
  for (const message of messages) {
    // `message.type` 与 `'user' && message.type !== 'assi` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'user' && message.type !== 'assistant') {
      // 跳过当前项，继续处理服务层 micro Compact中的下一轮循环。
      continue
    }

    // 满足 `!Array.isArray(message.message.content)` 时，服务层 micro Compact执行该分支。
    if (!Array.isArray(message.message.content)) {
      // 跳过当前项，继续处理服务层 micro Compact中的下一轮循环。
      continue
    }

    // 按顺序遍历 `message.message.content` 中的block，逐个交给服务层 micro Compact处理。
    for (const block of message.message.content) {
      // 当 `block.type` 匹配 `'text'` 时，服务层 micro Compact执行对应分支。
      if (block.type === 'text') {
        // 服务层 micro Compact在这里处理 `totalTokens += roughTokenCountEstimation(block.text)`，完成这一小步状态转换。
        totalTokens += roughTokenCountEstimation(block.text)
      // 服务层 micro Compact在这里处理 `} else if (block.type === 'tool_result') {`，完成这一小步状态转换。
      } else if (block.type === 'tool_result') {
        // 服务层 micro Compact在这里处理 `totalTokens += calculateToolResultTokens(block)`，完成这一小步状态转换。
        totalTokens += calculateToolResultTokens(block)
      // 服务层 micro Compact在这里处理 `} else if (block.type === 'image' || block.type === 'document') {`，完成这一小步状态转换。
      } else if (block.type === 'image' || block.type === 'document') {
        // 服务层 micro Compact在这里处理 `totalTokens += IMAGE_MAX_TOKEN_SIZE`，完成这一小步状态转换。
        totalTokens += IMAGE_MAX_TOKEN_SIZE
      // 服务层 micro Compact在这里处理 `} else if (block.type === 'thinking') {`，完成这一小步状态转换。
      } else if (block.type === 'thinking') {
        // Match roughTokenCountEstimationForBlock: count only the thinking
        // text, not the JSON wrapper or signature (signature is metadata,
        // not model-tokenized content).
        // 服务层 micro Compact在这里处理 `totalTokens += roughTokenCountEstimation(block.thinking)`，完成这一小步状态转换。
        totalTokens += roughTokenCountEstimation(block.thinking)
      // 服务层 micro Compact在这里处理 `} else if (block.type === 'redacted_thinking') {`，完成这一小步状态转换。
      } else if (block.type === 'redacted_thinking') {
        // 服务层 micro Compact在这里处理 `totalTokens += roughTokenCountEstimation(block.data)`，完成这一小步状态转换。
        totalTokens += roughTokenCountEstimation(block.data)
      // 服务层 micro Compact在这里处理 `} else if (block.type === 'tool_use') {`，完成这一小步状态转换。
      } else if (block.type === 'tool_use') {
        // Match roughTokenCountEstimationForBlock: count name + input,
        // not the JSON wrapper or id field.
        // 服务层 micro Compact在这里处理 `totalTokens += roughTokenCountEstimation(`，完成这一小步状态转换。
        totalTokens += roughTokenCountEstimation(
          block.name + jsonStringify(block.input ?? {}),
        )
      } else {
        // server_tool_use, web_search_tool_result, etc.
        // 服务层 micro Compact在这里处理 `totalTokens += roughTokenCountEstimation(jsonStringify(block))`，完成这一小步状态转换。
        totalTokens += roughTokenCountEstimation(jsonStringify(block))
      }
    }
  }

  // Pad estimate by 4/3 to be conservative since we're approximating
  // 返回 `Math.ceil(totalTokens * (4 / 3))`，作为服务层 micro Compact这次计算的结果。
  return Math.ceil(totalTokens * (4 / 3))
}

// PendingCacheEdits 固化服务层 micro Compact里传递的数据形状，帮助调用方按同一结构读写字段。
export type PendingCacheEdits = {
  trigger: 'auto'
  deletedToolIds: string[]
  // Baseline cumulative cache_deleted_input_tokens from the previous API response,
  // used to compute the per-operation delta (the API value is sticky/cumulative)
  baselineCacheDeletedTokens: number
}

// MicrocompactResult 固化服务层 micro Compact里传递的数据形状，帮助调用方按同一结构读写字段。
export type MicrocompactResult = {
  messages: Message[]
  compactionInfo?: {
    pendingCacheEdits?: PendingCacheEdits
  }
}

/**
 * Walk messages and collect tool_use IDs whose tool name is in
 * COMPACTABLE_TOOLS, in encounter order. Shared by both microcompact paths.
 */
// collectCompactableToolIds 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectCompactableToolIds(messages: Message[]): string[] {
  // ids 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const ids: string[] = []
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 micro Compact处理。
  for (const message of messages) {
    // 服务层 micro Compact在这里进入条件判断，后续代码按实际状态分流。
    if (
      message.type === 'assistant' &&
      Array.isArray(message.message.content)
    ) {
      // 按顺序遍历 `message.message.content` 中的block，逐个交给服务层 micro Compact处理。
      for (const block of message.message.content) {
        // 组合条件 `block.type === 'tool_use' && COMPACTABLE_TOOLS.has(block.name)` 成立时，服务层 micro Compact才启用这条专门路径。
        if (block.type === 'tool_use' && COMPACTABLE_TOOLS.has(block.name)) {
          // ids 集合追加新条目，保持收集顺序与输入顺序一致。
          ids.push(block.id)
        }
      }
    }
  }
  // 返回 `ids`，作为服务层 micro Compact这次计算的结果。
  return ids
}

// Prefix-match because promptCategory.ts sets the querySource to
// 'repl_main_thread:outputStyle:<style>' when a non-default output style
// is active. The bare 'repl_main_thread' is only used for the default style.
// query.ts:350/1451 use the same startsWith pattern; the pre-existing
// cached-MC `=== 'repl_main_thread'` check was a latent bug — users with a
// non-default output style were silently excluded from cached MC.
// isMainThreadSource 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMainThreadSource(querySource: QuerySource | undefined): boolean {
  // 返回 `!querySource || querySource.startsWith('repl_main_thread')`，作为服务层 micro Compact这次计算的结果。
  return !querySource || querySource.startsWith('repl_main_thread')
}

// microcompactMessages 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function microcompactMessages(
  messages: Message[],
  toolUseContext?: ToolUseContext,
  querySource?: QuerySource,
): Promise<MicrocompactResult> {
  // Clear suppression flag at start of new microcompact attempt
  // 调用 clearCompactWarningSuppression，触发服务层 micro Compact此处需要的副作用。
  clearCompactWarningSuppression()

  // Time-based trigger runs first and short-circuits. If the gap since the
  // last assistant message exceeds the threshold, the server cache has expired
  // and the full prefix will be rewritten regardless — so content-clear old
  // tool results now, before the request, to shrink what gets rewritten.
  // Cached MC (cache-editing) is skipped when this fires: editing assumes a
  // warm cache, and we just established it's cold.
  // timeBasedResult保存`maybeTimeBasedMicrocompact`，供服务层 micro Compact后续处理使用。
  const timeBasedResult = maybeTimeBasedMicrocompact(messages, querySource)
  // 满足 `timeBasedResult` 时，服务层 micro Compact执行该分支。
  if (timeBasedResult) {
    // 返回 `timeBasedResult`，作为服务层 micro Compact这次计算的结果。
    return timeBasedResult
  }

  // Only run cached MC for the main thread to prevent forked agents
  // (session_memory, prompt_suggestion, etc.) from registering their
  // tool_results in the global cachedMCState, which would cause the main
  // thread to try deleting tools that don't exist in its own conversation.
  // 满足 `feature('CACHED_MICROCOMPACT')` 时，服务层 micro Compact执行该分支。
  if (feature('CACHED_MICROCOMPACT')) {
    // mod读取`getCachedMCModule`，供服务层 micro Compact后续处理使用。
    const mod = await getCachedMCModule()
    // 模型名称读取`getMainLoopModel`，供服务层 micro Compact后续处理使用。
    const model = toolUseContext?.options.mainLoopModel ?? getMainLoopModel()
    // 服务层 micro Compact在这里进入条件判断，后续代码按实际状态分流。
    if (
      mod.isCachedMicrocompactEnabled() &&
      mod.isModelSupportedForCacheEditing(model) &&
      isMainThreadSource(querySource)
    ) {
      // 等待并返回 `cachedMicrocompactPath(messages, querySource)`，调用方直接接收异步结果。
      return await cachedMicrocompactPath(messages, querySource)
    }
  }

  // Legacy microcompact path removed — tengu_cache_plum_violet is always true.
  // For contexts where cached microcompact is not available (external builds,
  // non-ant users, unsupported models, sub-agents), no compaction happens here;
  // autocompact handles context pressure instead.
  // 返回结构化结果，集中表达服务层 micro Compact已经整理出的状态。
  return { messages }
}

/**
 * Cached microcompact path - uses cache editing API to remove tool results
 * without invalidating the cached prefix.
 *
 * Key differences from regular microcompact:
 * - Does NOT modify local message content (cache_reference and cache_edits are added at API layer)
 * - Uses count-based trigger/keep thresholds from GrowthBook config
 * - Takes precedence over regular microcompact (no disk persistence)
 * - Tracks tool results and queues cache edits for the API layer
 */
// cachedMicrocompactPath 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function cachedMicrocompactPath(
  messages: Message[],
  querySource: QuerySource | undefined,
): Promise<MicrocompactResult> {
  // mod读取`getCachedMCModule`，供服务层 micro Compact后续处理使用。
  const mod = await getCachedMCModule()
  // 状态保存`ensureCachedMCState`，供服务层 micro Compact后续处理使用。
  const state = ensureCachedMCState()
  // 配置读取`mod.getCachedMCConfig`，供服务层 micro Compact后续处理使用。
  const config = mod.getCachedMCConfig()

  // compactableToolIds 集合保存`Set`，供服务层 micro Compact后续处理使用。
  const compactableToolIds = new Set(collectCompactableToolIds(messages))
  // Second pass: register tool results grouped by user message
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 micro Compact处理。
  for (const message of messages) {
    // 组合条件 `message.type === 'user' && Array.isArray(message.message.content)` 成立时，服务层 micro Compact才启用这条专门路径。
    if (message.type === 'user' && Array.isArray(message.message.content)) {
      // groupIds 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const groupIds: string[] = []
      // 按顺序遍历 `message.message.content` 中的block，逐个交给服务层 micro Compact处理。
      for (const block of message.message.content) {
        // 服务层 micro Compact在这里进入条件判断，后续代码按实际状态分流。
        if (
          block.type === 'tool_result' &&
          compactableToolIds.has(block.tool_use_id) &&
          !state.registeredTools.has(block.tool_use_id)
        ) {
          // 调用 mod.registerToolResult，触发服务层 micro Compact此处需要的副作用。
          mod.registerToolResult(state, block.tool_use_id)
          // groupIds 集合追加新条目，保持收集顺序与输入顺序一致。
          groupIds.push(block.tool_use_id)
        }
      }
      // 调用 mod.registerToolMessage，触发服务层 micro Compact此处需要的副作用。
      mod.registerToolMessage(state, groupIds)
    }
  }

  // toolsToDelete读取`mod.getToolResultsToDelete`，供服务层 micro Compact后续处理使用。
  const toolsToDelete = mod.getToolResultsToDelete(state)

  // 满足 `toolsToDelete.length > 0` 时，服务层 micro Compact执行该分支。
  if (toolsToDelete.length > 0) {
    // Create and queue the cache_edits block for the API layer
    // cacheEdits 缓存构建`mod.createCacheEditsBlock`，供服务层 micro Compact后续处理使用。
    const cacheEdits = mod.createCacheEditsBlock(state, toolsToDelete)
    // 满足 `cacheEdits` 时，服务层 micro Compact执行该分支。
    if (cacheEdits) {
      // pendingCacheEdits 缓存更新为 `cacheEdits`，确保服务层后续读取最新状态。
      pendingCacheEdits = cacheEdits
    }

    // 记录服务层 micro Compact运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cached MC deleting ${toolsToDelete.length} tool(s): ${toolsToDelete.join(', ')}`,
    )

    // Log the event
    // 记录服务层 micro Compact运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_cached_microcompact', {
      toolsDeleted: toolsToDelete.length,
      deletedToolIds: toolsToDelete.join(
        ',',
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      activeToolCount: state.toolOrder.length - state.deletedRefs.size,
      triggerType:
        'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      threshold: config.triggerThreshold,
      keepRecent: config.keepRecent,
    })

    // Suppress warning after successful compaction
    // 调用 suppressCompactWarning，触发服务层 micro Compact此处需要的副作用。
    suppressCompactWarning()

    // Notify cache break detection that cache reads will legitimately drop
    // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，服务层 micro Compact执行该分支。
    if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
      // Pass the actual querySource — isMainThreadSource now prefix-matches
      // so output-style variants enter here, and getTrackingKey keys on the
      // full source string, not the 'repl_main_thread' prefix.
      // 调用 notifyCacheDeletion，触发服务层 micro Compact此处需要的副作用。
      notifyCacheDeletion(querySource ?? 'repl_main_thread')
    }

    // Return messages unchanged - cache_reference and cache_edits are added at API layer
    // Boundary message is deferred until after API response so we can use
    // actual cache_deleted_input_tokens from the API instead of client-side estimates
    // Capture the baseline cumulative cache_deleted_input_tokens from the last
    // assistant message so we can compute a per-operation delta after the API call
    // lastAsst筛选`messages.findLast`，供服务层 micro Compact后续处理使用。
    const lastAsst = messages.findLast(m => m.type === 'assistant')
    // baseline 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const baseline =
      lastAsst?.type === 'assistant'
        ? ((
            lastAsst.message.usage as unknown as Record<
              string,
              number | undefined
            >
          )?.cache_deleted_input_tokens ?? 0)
        : 0

    // 返回结构化结果，集中表达服务层 micro Compact已经整理出的状态。
    return {
      messages,
      compactionInfo: {
        pendingCacheEdits: {
          trigger: 'auto',
          deletedToolIds: toolsToDelete,
          baselineCacheDeletedTokens: baseline,
        },
      },
    }
  }

  // No compaction needed, return messages unchanged
  // 返回结构化结果，集中表达服务层 micro Compact已经整理出的状态。
  return { messages }
}

/**
 * Time-based microcompact: when the gap since the last main-loop assistant
 * message exceeds the configured threshold, content-clear all but the most
 * recent N compactable tool results.
 *
 * Returns null when the trigger doesn't fire (disabled, wrong source, gap
 * under threshold, nothing to clear) — caller falls through to other paths.
 *
 * Unlike cached MC, this mutates message content directly. The cache is cold,
 * so there's no cached prefix to preserve via cache_edits.
 */
/**
 * Check whether the time-based trigger should fire for this request.
 *
 * Returns the measured gap (minutes since last assistant message) when the
 * trigger fires, or null when it doesn't (disabled, wrong source, under
 * threshold, no prior assistant, unparseable timestamp).
 *
 * Extracted so other pre-request paths (e.g. snip force-apply) can consult
 * the same predicate without coupling to the tool-result clearing action.
 */
// evaluateTimeBasedTrigger 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function evaluateTimeBasedTrigger(
  messages: Message[],
  querySource: QuerySource | undefined,
): { gapMinutes: number; config: TimeBasedMCConfig } | null {
  // 配置读取`getTimeBasedMCConfig`，供服务层 micro Compact后续处理使用。
  const config = getTimeBasedMCConfig()
  // Require an explicit main-thread querySource. isMainThreadSource treats
  // undefined as main-thread (for cached-MC backward-compat), but several
  // callers (/context, /compact, analyzeContext) invoke microcompactMessages
  // without a source for analysis-only purposes — they should not trigger.
  // 组合条件 `!config.enabled || !querySource || !isMainThreadSource(querySource)` 成立时，服务层 micro Compact才启用这条专门路径。
  if (!config.enabled || !querySource || !isMainThreadSource(querySource)) {
    // 返回 `null`，作为服务层 micro Compact这次计算的结果。
    return null
  }
  // lastAssistant筛选`messages.findLast`，供服务层 micro Compact后续处理使用。
  const lastAssistant = messages.findLast(m => m.type === 'assistant')
  // lastAssistant缺失时提前走兜底路径，避免服务层 micro Compact继续依赖无效输入。
  if (!lastAssistant) {
    // 返回 `null`，作为服务层 micro Compact这次计算的结果。
    return null
  }
  // gapMinutes 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const gapMinutes =
    (Date.now() - new Date(lastAssistant.timestamp).getTime()) / 60_000
  // 组合条件 `!Number.isFinite(gapMinutes) || gapMinutes < config.gapThresholdMinutes` 成立时，服务层 micro Compact才启用这条专门路径。
  if (!Number.isFinite(gapMinutes) || gapMinutes < config.gapThresholdMinutes) {
    // 返回 `null`，作为服务层 micro Compact这次计算的结果。
    return null
  }
  // 返回结构化结果，集中表达服务层 micro Compact已经整理出的状态。
  return { gapMinutes, config }
}

// maybeTimeBasedMicrocompact 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maybeTimeBasedMicrocompact(
  messages: Message[],
  querySource: QuerySource | undefined,
): MicrocompactResult | null {
  // trigger保存`evaluateTimeBasedTrigger`，供服务层 micro Compact后续处理使用。
  const trigger = evaluateTimeBasedTrigger(messages, querySource)
  // trigger缺失时提前走兜底路径，避免服务层 micro Compact继续依赖无效输入。
  if (!trigger) {
    // 返回 `null`，作为服务层 micro Compact这次计算的结果。
    return null
  }
  // 从 `trigger` 解构 gapMinutes、config，减少服务层 micro Compact对同一对象的重复访问。
  const { gapMinutes, config } = trigger

  // compactableIds 集合保存`collectCompactableToolIds`，供服务层 micro Compact后续处理使用。
  const compactableIds = collectCompactableToolIds(messages)

  // Floor at 1: slice(-0) returns the full array (paradoxically keeps
  // everything), and clearing ALL results leaves the model with zero working
  // context. Neither degenerate is sensible — always keep at least the last.
  // keepRecent保存`Math.max`，供服务层 micro Compact后续处理使用。
  const keepRecent = Math.max(1, config.keepRecent)
  // keepSet保存`Set`，供服务层 micro Compact后续处理使用。
  const keepSet = new Set(compactableIds.slice(-keepRecent))
  // clearSet保存`Set`，供服务层 micro Compact后续处理使用。
  const clearSet = new Set(compactableIds.filter(id => !keepSet.has(id)))

  // 满足 `clearSet.size === 0` 时，服务层 micro Compact执行该分支。
  if (clearSet.size === 0) {
    // 返回 `null`，作为服务层 micro Compact这次计算的结果。
    return null
  }

  // tokensSaved保存`0`，供服务层 micro Compact后续判断或输出使用。
  let tokensSaved = 0
  // 这个回调绑定到 const result: Message[] = messages.map(message => {，负责服务层 micro Compact在该局部场景下的响应。
  const result: Message[] = messages.map(message => {
    // `message.type` 与 `'user' || !Array.isArray(messag...` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'user' || !Array.isArray(message.message.content)) {
      // 返回 `message`，作为服务层 micro Compact这次计算的结果。
      return message
    }
    // touched标记服务层 micro Compact是否启用对应路径。
    let touched = false
    // 新内容派生`content.map`，供服务层 micro Compact后续处理使用。
    const newContent = message.message.content.map(block => {
      // 服务层 micro Compact在这里进入条件判断，后续代码按实际状态分流。
      if (
        block.type === 'tool_result' &&
        clearSet.has(block.tool_use_id) &&
        block.content !== TIME_BASED_MC_CLEARED_MESSAGE
      ) {
        // 服务层 micro Compact在这里处理 `tokensSaved += calculateToolResultTokens(block)`，完成这一小步状态转换。
        tokensSaved += calculateToolResultTokens(block)
        // touched更新为 `true`，确保服务层后续读取最新状态。
        touched = true
        // 返回结构化结果，集中表达服务层 micro Compact已经整理出的状态。
        return { ...block, content: TIME_BASED_MC_CLEARED_MESSAGE }
      }
      // 返回 `block`，作为服务层 micro Compact这次计算的结果。
      return block
    })
    // touched缺失时提前走兜底路径，避免服务层 micro Compact继续依赖无效输入。
    if (!touched) return message
    // 返回结构化结果，集中表达服务层 micro Compact已经整理出的状态。
    return {
      ...message,
      message: { ...message.message, content: newContent },
    }
  })

  // 满足 `tokensSaved === 0` 时，服务层 micro Compact执行该分支。
  if (tokensSaved === 0) {
    // 返回 `null`，作为服务层 micro Compact这次计算的结果。
    return null
  }

  // 记录服务层 micro Compact运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_time_based_microcompact', {
    gapMinutes: Math.round(gapMinutes),
    gapThresholdMinutes: config.gapThresholdMinutes,
    toolsCleared: clearSet.size,
    toolsKept: keepSet.size,
    keepRecent: config.keepRecent,
    tokensSaved,
  })

  // 记录服务层 micro Compact运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TIME-BASED MC] gap ${Math.round(gapMinutes)}min > ${config.gapThresholdMinutes}min, cleared ${clearSet.size} tool results (~${tokensSaved} tokens), kept last ${keepSet.size}`,
  )

  // 调用 suppressCompactWarning，触发服务层 micro Compact此处需要的副作用。
  suppressCompactWarning()
  // Cached-MC state (module-level) holds tool IDs registered on prior turns.
  // We just content-cleared some of those tools AND invalidated the server
  // cache by changing prompt content. If cached-MC runs next turn with the
  // stale state, it would try to cache_edit tools whose server-side entries
  // no longer exist. Reset it.
  // 调用 resetMicrocompactState，触发服务层 micro Compact此处需要的副作用。
  resetMicrocompactState()
  // We just changed the prompt content — the next response's cache read will
  // be low, but that's us, not a break. Tell the detector to expect a drop.
  // notifyCacheDeletion (not notifyCompaction) because it's already imported
  // here and achieves the same false-positive suppression — adding the second
  // symbol to the import was flagged by the circular-deps check.
  // Pass the actual querySource: getTrackingKey returns the full source string
  // (e.g. 'repl_main_thread:outputStyle:custom'), not just the prefix.
  // 组合条件 `feature('PROMPT_CACHE_BREAK_DETECTION') && querySource` 成立时，服务层 micro Compact才启用这条专门路径。
  if (feature('PROMPT_CACHE_BREAK_DETECTION') && querySource) {
    // 调用 notifyCacheDeletion，触发服务层 micro Compact此处需要的副作用。
    notifyCacheDeletion(querySource)
  }

  // 返回结构化结果，集中表达服务层 micro Compact已经整理出的状态。
  return { messages: result }
}
