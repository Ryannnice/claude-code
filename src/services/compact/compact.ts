// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { UUID } 来自 crypto，用于校准服务层 compact的数据契约。
import type { UUID } from 'crypto'
// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// sessionTranscriptModule 会话数据保存`feature`，供服务层 compact后续处理使用。
const sessionTranscriptModule = feature('KAIROS')
  ? (require('../sessionTranscript/sessionTranscript.js') as typeof import('../sessionTranscript/sessionTranscript.js'))
  : null

// 引入 APIUserAbortError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIUserAbortError } from '@anthropic-ai/sdk'
// 引入 markPostCompaction，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { markPostCompaction } from 'src/bootstrap/state.js'
// 引入 getInvokedSkillsForAgent，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getInvokedSkillsForAgent } from '../../bootstrap/state.js'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准服务层 compact的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准服务层 compact的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 类型依赖 { Tool, ToolUseContext } 来自 ../../Tool.js，用于校准服务层 compact的数据契约。
import type { Tool, ToolUseContext } from '../../Tool.js'
// 类型依赖 { LocalAgentTaskState } 来自 ../../tasks/LocalAgentTask/LocalAgentTask.js，用于校准服务层 compact的数据契约。
import type { LocalAgentTaskState } from '../../tasks/LocalAgentTask/LocalAgentTask.js'
// 接入 FileReadTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileReadTool } from '../../tools/FileReadTool/FileReadTool.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  FILE_READ_TOOL_NAME,
  FILE_UNCHANGED_STUB,
} from '../../tools/FileReadTool/prompt.js'
// 接入 ToolSearchTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ToolSearchTool } from '../../tools/ToolSearchTool/ToolSearchTool.js'
// 类型依赖 { AgentId } 来自 ../../types/ids.js，用于校准服务层 compact的数据契约。
import type { AgentId } from '../../types/ids.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  HookResultMessage,
  Message,
  PartialCompactDirection,
  SystemCompactBoundaryMessage,
  SystemMessage,
  UserMessage,
} from '../../types/message.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  createAttachmentMessage,
  generateFileAttachment,
  getAgentListingDeltaAttachment,
  getDeferredToolsDeltaAttachment,
  getMcpInstructionsDeltaAttachment,
} from '../../utils/attachments.js'
// 复用 getMemoryPath 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getMemoryPath } from '../../utils/config.js'
// 复用 COMPACT_MAX_OUTPUT_TOKENS 工具函数，把通用处理留在 ../../utils/context.js 中维护。
import { COMPACT_MAX_OUTPUT_TOKENS } from '../../utils/context.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  analyzeContext,
  tokenStatsToStatsigMetrics,
} from '../../utils/contextAnalysis.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 hasExactErrorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { hasExactErrorMessage } from '../../utils/errors.js'
// 复用 cacheToObject 工具函数，把通用处理留在 ../../utils/fileStateCache.js 中维护。
import { cacheToObject } from '../../utils/fileStateCache.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  type CacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  executePostCompactHooks,
  executePreCompactHooks,
} from '../../utils/hooks.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 MEMORY_TYPE_VALUES 工具函数，把通用处理留在 ../../utils/memory/types.js 中维护。
import { MEMORY_TYPE_VALUES } from '../../utils/memory/types.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  createCompactBoundaryMessage,
  createUserMessage,
  getAssistantMessageText,
  getLastAssistantMessage,
  getMessagesAfterCompactBoundary,
  isCompactBoundaryMessage,
  normalizeMessagesForAPI,
} from '../../utils/messages.js'
// 复用 expandPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath } from '../../utils/path.js'
// 复用 getPlan、getPlanFilePath 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlan, getPlanFilePath } from '../../utils/plans.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  isSessionActivityTrackingActive,
  sendSessionActivitySignal,
} from '../../utils/sessionActivity.js'
// 复用 processSessionStartHooks 工具函数，把通用处理留在 ../../utils/sessionStart.js 中维护。
import { processSessionStartHooks } from '../../utils/sessionStart.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  getTranscriptPath,
  reAppendSessionMetadata,
} from '../../utils/sessionStorage.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js'
// 复用 getTaskOutputPath 工具函数，把通用处理留在 ../../utils/task/diskOutput.js 中维护。
import { getTaskOutputPath } from '../../utils/task/diskOutput.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  getTokenUsage,
  tokenCountFromLastAPIResponse,
  tokenCountWithEstimation,
} from '../../utils/tokens.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  extractDiscoveredToolNames,
  isToolSearchEnabled,
} from '../../utils/toolSearch.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  getMaxOutputTokensForModel,
  queryModelWithStreaming,
} from '../api/claude.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  getPromptTooLongTokenGap,
  PROMPT_TOO_LONG_ERROR_MESSAGE,
  startsWithApiErrorPrefix,
} from '../api/errors.js'
// 引入 notifyCompaction，将 ../api/promptCacheBreakDetection.js 中已经封装好的能力接到本文件流程里。
import { notifyCompaction } from '../api/promptCacheBreakDetection.js'
// 引入 getRetryDelay，将 ../api/withRetry.js 中已经封装好的能力接到本文件流程里。
import { getRetryDelay } from '../api/withRetry.js'
// 引入 logPermissionContextForAnts，将 ../internalLogging.js 中已经封装好的能力接到本文件流程里。
import { logPermissionContextForAnts } from '../internalLogging.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  roughTokenCountEstimation,
  roughTokenCountEstimationForMessages,
} from '../tokenEstimation.js'
// 引入 groupMessagesByApiRound，将 ./grouping.js 中已经封装好的能力接到本文件流程里。
import { groupMessagesByApiRound } from './grouping.js'
// 整理这一组导入，让服务层 compact后续逻辑可以直接复用这些外部能力。
import {
  getCompactPrompt,
  getCompactUserSummaryMessage,
  getPartialCompactPrompt,
} from './prompt.js'

// POST_COMPACT_MAX_FILES_TO_RESTORE 文件数据 命名 `5`，让后续代码直接表达这个值的用途。
export const POST_COMPACT_MAX_FILES_TO_RESTORE = 5
// POST_COMPACT_TOKEN_BUDGET保存`50_000`，供后续判断或组装使用。
export const POST_COMPACT_TOKEN_BUDGET = 50_000
// POST_COMPACT_MAX_TOKENS_PER_FILE 文件数据保存`5_000`，供服务层 compact后续判断或输出使用。
export const POST_COMPACT_MAX_TOKENS_PER_FILE = 5_000
// Skills can be large (verify=18.7KB, claude-api=20.1KB). Previously re-injected
// unbounded on every compact → 5-10K tok/compact. Per-skill truncation beats
// dropping — instructions at the top of a skill file are usually the critical
// part. Budget sized to hold ~5 skills at the per-skill cap.
// POST_COMPACT_MAX_TOKENS_PER_SKILL 命名 `5_000`，让后续代码直接表达这个值的用途。
export const POST_COMPACT_MAX_TOKENS_PER_SKILL = 5_000
// POST_COMPACT_SKILLS_TOKEN_BUDGET保存`25_000`，供后续判断或组装使用。
export const POST_COMPACT_SKILLS_TOKEN_BUDGET = 25_000
// MAX_COMPACT_STREAMING_RETRIES 集合保存`2`，供后续判断或组装使用。
const MAX_COMPACT_STREAMING_RETRIES = 2

/**
 * Strip image blocks from user messages before sending for compaction.
 * Images are not needed for generating a conversation summary and can
 * cause the compaction API call itself to hit the prompt-too-long limit,
 * especially in CCD sessions where users frequently attach images.
 * Replaces image blocks with a text marker so the summary still notes
 * that an image was shared.
 *
 * Note: Only user messages contain images (either directly attached or within
 * tool_result content from tools). Assistant messages contain text, tool_use,
 * and thinking blocks but not images.
 */
// stripImagesFromMessages 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripImagesFromMessages(messages: Message[]): Message[] {
  // 返回 `messages.map(message => {`，作为服务层 compact这次计算的结果。
  return messages.map(message => {
    // `message.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'user') {
      // 返回 `message`，作为服务层 compact这次计算的结果。
      return message
    }

    // 文本内容 命名 `message.message.content`，让后续代码直接表达这个值的用途。
    const content = message.message.content
    // 满足 `!Array.isArray(content)` 时，服务层 compact执行该分支。
    if (!Array.isArray(content)) {
      // 返回 `message`，作为服务层 compact这次计算的结果。
      return message
    }

    // hasMediaBlock标记服务层 compact是否启用对应路径。
    let hasMediaBlock = false
    // 新内容派生`content.flatMap`，供服务层 compact后续处理使用。
    const newContent = content.flatMap(block => {
      // 当 `block.type` 匹配 `'image'` 时，服务层 compact执行对应分支。
      if (block.type === 'image') {
        // hasMediaBlock更新为 `true`，确保服务层后续读取最新状态。
        hasMediaBlock = true
        // 返回列表结果，保留服务层 compact已经排好的条目顺序。
        return [{ type: 'text' as const, text: '[image]' }]
      }
      // 当 `block.type` 匹配 `'document'` 时，服务层 compact执行对应分支。
      if (block.type === 'document') {
        // hasMediaBlock更新为 `true`，确保服务层后续读取最新状态。
        hasMediaBlock = true
        // 返回列表结果，保留服务层 compact已经排好的条目顺序。
        return [{ type: 'text' as const, text: '[document]' }]
      }
      // Also strip images/documents nested inside tool_result content arrays
      // 组合条件 `block.type === 'tool_result' && Array.isArray(block.content)` 成立时，服务层 compact才启用这条专门路径。
      if (block.type === 'tool_result' && Array.isArray(block.content)) {
        // toolHasMedia标记服务层 compact是否启用对应路径。
        let toolHasMedia = false
        // newToolContent派生`content.map`，供服务层 compact后续处理使用。
        const newToolContent = block.content.map(item => {
          // 当 `item.type` 匹配 `'image'` 时，服务层 compact执行对应分支。
          if (item.type === 'image') {
            // toolHasMedia更新为 `true`，确保服务层后续读取最新状态。
            toolHasMedia = true
            // 返回结构化结果，集中表达服务层 compact已经整理出的状态。
            return { type: 'text' as const, text: '[image]' }
          }
          // 当 `item.type` 匹配 `'document'` 时，服务层 compact执行对应分支。
          if (item.type === 'document') {
            // toolHasMedia更新为 `true`，确保服务层后续读取最新状态。
            toolHasMedia = true
            // 返回结构化结果，集中表达服务层 compact已经整理出的状态。
            return { type: 'text' as const, text: '[document]' }
          }
          // 返回 `item`，作为服务层 compact这次计算的结果。
          return item
        })
        // 满足 `toolHasMedia` 时，服务层 compact执行该分支。
        if (toolHasMedia) {
          // hasMediaBlock更新为 `true`，确保服务层后续读取最新状态。
          hasMediaBlock = true
          // 返回列表结果，保留服务层 compact已经排好的条目顺序。
          return [{ ...block, content: newToolContent }]
        }
      }
      // 返回列表结果，保留服务层 compact已经排好的条目顺序。
      return [block]
    })

    // hasMediaBlock缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
    if (!hasMediaBlock) {
      // 返回 `message`，作为服务层 compact这次计算的结果。
      return message
    }

    // 返回结构化结果，集中表达服务层 compact已经整理出的状态。
    return {
      ...message,
      message: {
        ...message.message,
        content: newContent,
      },
    } as typeof message
  })
}

/**
 * Strip attachment types that are re-injected post-compaction anyway.
 * skill_discovery/skill_listing are re-surfaced by resetSentSkillNames()
 * + the next turn's discovery signal, so feeding them to the summarizer
 * wastes tokens and pollutes the summary with stale skill suggestions.
 *
 * No-op when EXPERIMENTAL_SKILL_SEARCH is off (the attachment types
 * don't exist on external builds).
 */
// stripReinjectedAttachments 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripReinjectedAttachments(messages: Message[]): Message[] {
  // 满足 `feature('EXPERIMENTAL_SKILL_SEARCH')` 时，服务层 compact执行该分支。
  if (feature('EXPERIMENTAL_SKILL_SEARCH')) {
    // 返回 `messages.filter(`，作为服务层 compact这次计算的结果。
    return messages.filter(
      m =>
        !(
          m.type === 'attachment' &&
          (m.attachment.type === 'skill_discovery' ||
            m.attachment.type === 'skill_listing')
        ),
    )
  }
  // 返回 `messages`，作为服务层 compact这次计算的结果。
  return messages
}

// ERROR_MESSAGE_NOT_ENOUGH_MESSAGES 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const ERROR_MESSAGE_NOT_ENOUGH_MESSAGES =
  'Not enough messages to compact.'
// MAX_PTL_RETRIES 集合 命名 `3`，让后续代码直接表达这个值的用途。
const MAX_PTL_RETRIES = 3
// PTL_RETRY_MARKER读取 `'[earlier conversation truncated for compaction retry]'` 对应条目，后续围绕该成员继续处理。
const PTL_RETRY_MARKER = '[earlier conversation truncated for compaction retry]'

/**
 * Drops the oldest API-round groups from messages until tokenGap is covered.
 * Falls back to dropping 20% of groups when the gap is unparseable (some
 * Vertex/Bedrock error formats). Returns null when nothing can be dropped
 * without leaving an empty summarize set.
 *
 * This is the last-resort escape hatch for CC-1180 — when the compact request
 * itself hits prompt-too-long, the user is otherwise stuck. Dropping the
 * oldest context is lossy but unblocks them. The reactive-compact path
 * (compactMessages.ts) has the proper retry loop that peels from the tail;
 * this helper is the dumb-but-safe fallback for the proactive/manual path
 * that wasn't migrated in bfdb472f's unification.
 */
// truncateHeadForPTLRetry 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateHeadForPTLRetry(
  messages: Message[],
  ptlResponse: AssistantMessage,
): Message[] | null {
  // Strip our own synthetic marker from a previous retry before grouping.
  // Otherwise it becomes its own group 0 and the 20% fallback stalls
  // (drops only the marker, re-adds it, zero progress on retry 2+).
  // input 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const input =
    messages[0]?.type === 'user' &&
    messages[0].isMeta &&
    messages[0].message.content === PTL_RETRY_MARKER
      ? messages.slice(1)
      : messages

  // groups 集合保存`groupMessagesByApiRound`，供服务层 compact后续处理使用。
  const groups = groupMessagesByApiRound(input)
  // 满足 `groups.length < 2` 时，服务层 compact执行该分支。
  if (groups.length < 2) return null

  // tokenGap读取`getPromptTooLongTokenGap`，供服务层 compact后续处理使用。
  const tokenGap = getPromptTooLongTokenGap(ptlResponse)
  // dropCount 数量 先占位，稍后的条件分支会根据实际输入补齐它。
  let dropCount: number
  // `tokenGap` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (tokenGap !== undefined) {
    // acc保存`0`，供服务层 compact后续判断或输出使用。
    let acc = 0
    // dropCount 数量更新为 `0`，确保服务层后续读取最新状态。
    dropCount = 0
    // 按顺序遍历 `groups` 中的g，逐个交给服务层 compact处理。
    for (const g of groups) {
      // 服务层 compact在这里处理 `acc += roughTokenCountEstimationForMessages(g)`，完成这一小步状态转换。
      acc += roughTokenCountEstimationForMessages(g)
      // 服务层 compact在这里处理 `dropCount++`，完成这一小步状态转换。
      dropCount++
      // 满足 `acc >= tokenGap` 时，服务层 compact执行该分支。
      if (acc >= tokenGap) break
    }
  } else {
    // dropCount 数量更新为 `Math.max(1, Math.floor(groups.length * 0.2))`，确保服务层后续读取最新状态。
    dropCount = Math.max(1, Math.floor(groups.length * 0.2))
  }

  // Keep at least one group so there's something to summarize.
  // dropCount 数量更新为 `Math.min(dropCount, groups.length - 1)`，确保服务层后续读取最新状态。
  dropCount = Math.min(dropCount, groups.length - 1)
  // 满足 `dropCount < 1` 时，服务层 compact执行该分支。
  if (dropCount < 1) return null

  // sliced格式化`groups.slice`，供服务层 compact后续处理使用。
  const sliced = groups.slice(dropCount).flat()
  // groupMessagesByApiRound puts the preamble in group 0 and starts every
  // subsequent group with an assistant message. Dropping group 0 leaves an
  // assistant-first sequence which the API rejects (first message must be
  // role=user). Prepend a synthetic user marker — ensureToolResultPairing
  // already handles any orphaned tool_results this creates.
  // 当 `sliced[0]?.type` 匹配 `'assistant'` 时，服务层 compact执行对应分支。
  if (sliced[0]?.type === 'assistant') {
    // 返回列表结果，保留服务层 compact已经排好的条目顺序。
    return [
      createUserMessage({ content: PTL_RETRY_MARKER, isMeta: true }),
      ...sliced,
    ]
  }
  // 返回 `sliced`，作为服务层 compact这次计算的结果。
  return sliced
}

// ERROR_MESSAGE_PROMPT_TOO_LONG 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const ERROR_MESSAGE_PROMPT_TOO_LONG =
  'Conversation too long. Press esc twice to go up a few messages and try again.'
// ERROR_MESSAGE_USER_ABORT 消息数据固定为 `'API Error: Request was aborted.'`，作为服务层 compact后续展示或比较的基准。
export const ERROR_MESSAGE_USER_ABORT = 'API Error: Request was aborted.'
// ERROR_MESSAGE_INCOMPLETE_RESPONSE 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const ERROR_MESSAGE_INCOMPLETE_RESPONSE =
  'Compaction interrupted · This may be due to network issues — please try again.'

// CompactionResult 描述服务层 compact需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface CompactionResult {
  boundaryMarker: SystemMessage
  summaryMessages: UserMessage[]
  attachments: AttachmentMessage[]
  hookResults: HookResultMessage[]
  messagesToKeep?: Message[]
  userDisplayMessage?: string
  preCompactTokenCount?: number
  postCompactTokenCount?: number
  truePostCompactTokenCount?: number
  compactionUsage?: ReturnType<typeof getTokenUsage>
}

/**
 * Diagnosis context passed from autoCompactIfNeeded into compactConversation.
 * Lets the tengu_compact event disambiguate same-chain loops (H2) from
 * cross-agent (H1/H5) and manual-vs-auto (H3) compactions without joins.
 */
// RecompactionInfo 固化服务层 compact里传递的数据形状，帮助调用方按同一结构读写字段。
export type RecompactionInfo = {
  isRecompactionInChain: boolean
  turnsSincePreviousCompact: number
  previousCompactTurnId?: string
  autoCompactThreshold: number
  querySource?: QuerySource
}

/**
 * Build the base post-compact messages array from a CompactionResult.
 * This ensures consistent ordering across all compaction paths.
 * Order: boundaryMarker, summaryMessages, messagesToKeep, attachments, hookResults
 */
// buildPostCompactMessages 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildPostCompactMessages(result: CompactionResult): Message[] {
  // 返回列表结果，保留服务层 compact已经排好的条目顺序。
  return [
    result.boundaryMarker,
    ...result.summaryMessages,
    ...(result.messagesToKeep ?? []),
    ...result.attachments,
    ...result.hookResults,
  ]
}

/**
 * Annotate a compact boundary with relink metadata for messagesToKeep.
 * Preserved messages keep their original parentUuids on disk (dedup-skipped);
 * the loader uses this to patch head→anchor and anchor's-other-children→tail.
 *
 * `anchorUuid` = what sits immediately before keep[0] in the desired chain:
 *   - suffix-preserving (reactive/session-memory): last summary message
 *   - prefix-preserving (partial compact): the boundary itself
 */
// annotateBoundaryWithPreservedSegment 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function annotateBoundaryWithPreservedSegment(
  boundary: SystemCompactBoundaryMessage,
  anchorUuid: UUID,
  messagesToKeep: readonly Message[] | undefined,
): SystemCompactBoundaryMessage {
  // keep保存`messagesToKeep ?? []`，供服务层 compact后续判断或输出使用。
  const keep = messagesToKeep ?? []
  // keep为空时立即返回或跳过，避免服务层 compact把空集合当成可处理内容。
  if (keep.length === 0) return boundary
  // 返回结构化结果，集中表达服务层 compact已经整理出的状态。
  return {
    ...boundary,
    compactMetadata: {
      ...boundary.compactMetadata,
      preservedSegment: {
        headUuid: keep[0]!.uuid,
        anchorUuid,
        tailUuid: keep.at(-1)!.uuid,
      },
    },
  }
}

/**
 * Merges user-supplied custom instructions with hook-provided instructions.
 * User instructions come first; hook instructions are appended.
 * Empty strings normalize to undefined.
 */
// mergeHookInstructions 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mergeHookInstructions(
  userInstructions: string | undefined,
  hookInstructions: string | undefined,
): string | undefined {
  // hookInstructions 集合缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
  if (!hookInstructions) return userInstructions || undefined
  // userInstructions 集合缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
  if (!userInstructions) return hookInstructions
  // 返回 ``${userInstructions}\n\n${hookInstructions}``，作为服务层 compact这次计算的结果。
  return `${userInstructions}\n\n${hookInstructions}`
}

/**
 * Creates a compact version of a conversation by summarizing older messages
 * and preserving recent conversation history.
 */
// compactConversation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function compactConversation(
  messages: Message[],
  context: ToolUseContext,
  cacheSafeParams: CacheSafeParams,
  suppressFollowUpQuestions: boolean,
  customInstructions?: string,
  isAutoCompact: boolean = false,
  recompactionInfo?: RecompactionInfo,
): Promise<CompactionResult> {
  // 保护这一段可能失败的服务层 compact操作，确保异常能进入相邻错误处理。
  try {
    // 对话消息为空时立即返回或跳过，避免服务层 compact把空集合当成可处理内容。
    if (messages.length === 0) {
      // 抛出 new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)，阻止服务层 compact在无效状态下继续运行。
      throw new Error(ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)
    }

    // preCompactTokenCount 数量保存`tokenCountWithEstimation`，供服务层 compact后续处理使用。
    const preCompactTokenCount = tokenCountWithEstimation(messages)

    // appState 状态读取`context.getAppState`，供服务层 compact后续处理使用。
    const appState = context.getAppState()
    // 显式忽略 `logPermissionContextForAnts(appState.toolPermissionContext, 'su...` 的返回值，只保留它触发的副作用。
    void logPermissionContextForAnts(appState.toolPermissionContext, 'summary')

    // 调用 context.onCompactProgress?.({，完成这一处局部操作。
    context.onCompactProgress?.({
      type: 'hooks_start',
      hookType: 'pre_compact',
    })

    // Execute PreCompact hooks
    // 调用 context.setSDKStatus?.('compacting')，完成这一处局部操作。
    context.setSDKStatus?.('compacting')
    // hookResult保存`executePreCompactHooks`，供服务层 compact后续处理使用。
    const hookResult = await executePreCompactHooks(
      {
        trigger: isAutoCompact ? 'auto' : 'manual',
        customInstructions: customInstructions ?? null,
      },
      context.abortController.signal,
    )
    // customInstructions 集合更新为 `mergeHookInstructions(`，确保服务层后续读取最新状态。
    customInstructions = mergeHookInstructions(
      customInstructions,
      hookResult.newCustomInstructions,
    )
    // userDisplayMessage 消息数据保存`hookResult.userDisplayMessage`，供服务层 compact后续判断或输出使用。
    const userDisplayMessage = hookResult.userDisplayMessage

    // Show requesting mode with up arrow and custom message
    // 调用 context.setStreamMode?.('requesting')，完成这一处局部操作。
    context.setStreamMode?.('requesting')
    // 这个回调绑定到 context.setResponseLength?.(() => 0)，负责服务层 compact在该局部场景下的响应。
    context.setResponseLength?.(() => 0)
    // 调用 context.onCompactProgress?.({ type: 'compact_start' })，完成这一处局部操作。
    context.onCompactProgress?.({ type: 'compact_start' })

    // 3P default: true — forked-agent path reuses main conversation's prompt cache.
    // Experiment (Jan 2026) confirmed: false path is 98% cache miss, costs ~0.76% of
    // fleet cache_creation (~38B tok/day), concentrated in ephemeral envs (CCR/GHA/SDK)
    // with cold GB cache and 3P providers where GB is disabled. GB gate kept as kill-switch.
    // promptCacheSharingEnabled 缓存读取`getFeatureValue_CACHED_MAY_BE_STALE`，供服务层 compact后续处理使用。
    const promptCacheSharingEnabled = getFeatureValue_CACHED_MAY_BE_STALE(
      'tengu_compact_cache_prefix',
      true,
    )

    // compactPrompt读取`getCompactPrompt`，供服务层 compact后续处理使用。
    const compactPrompt = getCompactPrompt(customInstructions)
    // summaryRequest 请求数据构建`createUserMessage`，供服务层 compact后续处理使用。
    const summaryRequest = createUserMessage({
      content: compactPrompt,
    })

    // messagesToSummarize 消息数据保存`messages`，供服务层 compact后续判断或输出使用。
    let messagesToSummarize = messages
    // retryCacheSafeParams 缓存 命名 `cacheSafeParams`，让后续代码直接表达这个值的用途。
    let retryCacheSafeParams = cacheSafeParams
    // summaryResponse 响应数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let summaryResponse: AssistantMessage
    // summary 先占位，稍后的条件分支会根据实际输入补齐它。
    let summary: string | null
    // ptlAttempts 集合保存`0`，供服务层 compact后续判断或输出使用。
    let ptlAttempts = 0
    // 循环处理 ``，让服务层 compact逐项把同类条目按顺序走完。
    for (;;) {
      // summaryResponse 响应数据更新为 `await streamCompactSummary({`，确保服务层后续读取最新状态。
      summaryResponse = await streamCompactSummary({
        messages: messagesToSummarize,
        summaryRequest,
        appState,
        context,
        preCompactTokenCount,
        cacheSafeParams: retryCacheSafeParams,
      })
      // summary更新为 `getAssistantMessageText(summaryResponse)`，确保服务层后续读取最新状态。
      summary = getAssistantMessageText(summaryResponse)
      // 满足 `!summary?.startsWith(PROMPT_TOO_LONG_ERROR_MESSAGE)` 时，服务层 compact执行该分支。
      if (!summary?.startsWith(PROMPT_TOO_LONG_ERROR_MESSAGE)) break

      // CC-1180: compact request itself hit prompt-too-long. Truncate the
      // oldest API-round groups and retry rather than leaving the user stuck.
      // 服务层 compact在这里处理 `ptlAttempts++`，完成这一小步状态转换。
      ptlAttempts++
      // truncated 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const truncated =
        ptlAttempts <= MAX_PTL_RETRIES
          ? truncateHeadForPTLRetry(messagesToSummarize, summaryResponse)
          : null
      // truncated缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
      if (!truncated) {
        // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_compact_failed', {
          reason:
            'prompt_too_long' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          preCompactTokenCount,
          promptCacheSharingEnabled,
          ptlAttempts,
        })
        // 抛出 new Error(ERROR_MESSAGE_PROMPT_TOO_LONG)，阻止服务层 compact在无效状态下继续运行。
        throw new Error(ERROR_MESSAGE_PROMPT_TOO_LONG)
      }
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_compact_ptl_retry', {
        attempt: ptlAttempts,
        droppedMessages: messagesToSummarize.length - truncated.length,
        remainingMessages: truncated.length,
      })
      // messagesToSummarize 消息数据更新为 `truncated`，确保服务层后续读取最新状态。
      messagesToSummarize = truncated
      // The forked-agent path reads from cacheSafeParams.forkContextMessages,
      // not the messages param — thread the truncated set through both paths.
      // retryCacheSafeParams 缓存更新为 `{`，确保服务层后续读取最新状态。
      retryCacheSafeParams = {
        ...retryCacheSafeParams,
        forkContextMessages: truncated,
      }
    }

    // summary缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
    if (!summary) {
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Compact failed: no summary text in response. Response: ${jsonStringify(summaryResponse)}`,
        { level: 'error' },
      )
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_compact_failed', {
        reason:
          'no_summary' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        preCompactTokenCount,
        promptCacheSharingEnabled,
      })
      // 抛出 new Error(，阻止服务层 compact在无效状态下继续运行。
      throw new Error(
        `Failed to generate conversation summary - response did not contain valid text content`,
      )
    // 服务层 compact在这里处理 `} else if (startsWithApiErrorPrefix(summary)) {`，完成这一小步状态转换。
    } else if (startsWithApiErrorPrefix(summary)) {
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_compact_failed', {
        reason:
          'api_error' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        preCompactTokenCount,
        promptCacheSharingEnabled,
      })
      // 抛出 new Error(summary)，阻止服务层 compact在无效状态下继续运行。
      throw new Error(summary)
    }

    // Store the current file state before clearing
    // preCompactReadFileState 文件数据保存`cacheToObject`，供服务层 compact后续处理使用。
    const preCompactReadFileState = cacheToObject(context.readFileState)

    // Clear the cache
    // 调用 context.readFileState.clear，触发服务层 compact此处需要的副作用。
    context.readFileState.clear()
    // 调用 context.loadedNestedMemoryPaths?.clear()，完成这一处局部操作。
    context.loadedNestedMemoryPaths?.clear()

    // Intentionally NOT resetting sentSkillNames: re-injecting the full
    // skill_listing (~4K tokens) post-compact is pure cache_creation with
    // marginal benefit. The model still has SkillTool in its schema and
    // invoked_skills attachment (below) preserves used-skill content. Ants
    // with EXPERIMENTAL_SKILL_SEARCH already skip re-injection via the
    // early-return in getSkillListingAttachments.

    // Run async attachment generation in parallel
    // 并行获取 fileAttachments、asyncAgentAttachments，缩短服务层 compact等待多个独立异步任务的时间。
    const [fileAttachments, asyncAgentAttachments] = await Promise.all([
      createPostCompactFileAttachments(
        preCompactReadFileState,
        context,
        POST_COMPACT_MAX_FILES_TO_RESTORE,
      ),
      createAsyncAgentAttachmentsIfNeeded(context),
    ])

    // postCompactFileAttachments 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
    const postCompactFileAttachments: AttachmentMessage[] = [
      ...fileAttachments,
      ...asyncAgentAttachments,
    ]
    // planAttachment构建`createPlanAttachmentIfNeeded`，供服务层 compact后续处理使用。
    const planAttachment = createPlanAttachmentIfNeeded(context.agentId)
    // 满足 `planAttachment` 时，服务层 compact执行该分支。
    if (planAttachment) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(planAttachment)
    }

    // Add plan mode instructions if currently in plan mode, so the model
    // continues operating in plan mode after compaction
    // planModeAttachment构建`createPlanModeAttachmentIfNeeded`，供服务层 compact后续处理使用。
    const planModeAttachment = await createPlanModeAttachmentIfNeeded(context)
    // 满足 `planModeAttachment` 时，服务层 compact执行该分支。
    if (planModeAttachment) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(planModeAttachment)
    }

    // Add skill attachment if skills were invoked in this session
    // skillAttachment构建`createSkillAttachmentIfNeeded`，供服务层 compact后续处理使用。
    const skillAttachment = createSkillAttachmentIfNeeded(context.agentId)
    // 满足 `skillAttachment` 时，服务层 compact执行该分支。
    if (skillAttachment) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(skillAttachment)
    }

    // Compaction ate prior delta attachments. Re-announce from the current
    // state so the model has tool/instruction context on the first
    // post-compact turn. Empty message history → diff against nothing →
    // announces the full set.
    // 调用 for，触发服务层 compact此处需要的副作用。
    for (const att of getDeferredToolsDeltaAttachment(
      context.options.tools,
      context.options.mainLoopModel,
      [],
      { callSite: 'compact_full' },
    )) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(createAttachmentMessage(att))
    }
    // 逐项读取 `getAgentListingDeltaAttachment(context, [])` 中的att，按输入顺序推进服务层 compact。
    for (const att of getAgentListingDeltaAttachment(context, [])) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(createAttachmentMessage(att))
    }
    // 调用 for，触发服务层 compact此处需要的副作用。
    for (const att of getMcpInstructionsDeltaAttachment(
      context.options.mcpClients,
      context.options.tools,
      context.options.mainLoopModel,
      [],
    )) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(createAttachmentMessage(att))
    }

    // 调用 context.onCompactProgress?.({，完成这一处局部操作。
    context.onCompactProgress?.({
      type: 'hooks_start',
      hookType: 'session_start',
    })
    // Execute SessionStart hooks after successful compaction
    // hookMessages 消息数据保存`processSessionStartHooks`，供服务层 compact后续处理使用。
    const hookMessages = await processSessionStartHooks('compact', {
      model: context.options.mainLoopModel,
    })

    // Create the compact boundary marker and summary messages before the
    // event so we can compute the true resulting-context size.
    // boundaryMarker构建`createCompactBoundaryMessage`，供服务层 compact后续处理使用。
    const boundaryMarker = createCompactBoundaryMessage(
      isAutoCompact ? 'auto' : 'manual',
      preCompactTokenCount ?? 0,
      messages.at(-1)?.uuid,
    )
    // Carry loaded-tool state — the summary doesn't preserve tool_reference
    // blocks, so the post-compact schema filter needs this to keep sending
    // already-loaded deferred tool schemas to the API.
    // preCompactDiscovered保存`extractDiscoveredToolNames`，供服务层 compact后续处理使用。
    const preCompactDiscovered = extractDiscoveredToolNames(messages)
    // 满足 `preCompactDiscovered.size > 0` 时，服务层 compact执行该分支。
    if (preCompactDiscovered.size > 0) {
      // 更新为 `[`，确保服务层后续读取最新状态。
      boundaryMarker.compactMetadata.preCompactDiscoveredTools = [
        ...preCompactDiscovered,
      ].sort()
    }

    // transcriptPath 路径数据读取`getTranscriptPath`，供服务层 compact后续处理使用。
    const transcriptPath = getTranscriptPath()
    // summaryMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
    const summaryMessages: UserMessage[] = [
      createUserMessage({
        content: getCompactUserSummaryMessage(
          summary,
          suppressFollowUpQuestions,
          transcriptPath,
        ),
        isCompactSummary: true,
        isVisibleInTranscriptOnly: true,
      }),
    ]

    // Previously "postCompactTokenCount" — renamed because this is the
    // compact API call's total usage (input_tokens ≈ preCompactTokenCount),
    // NOT the size of the resulting context. Kept for event-field continuity.
    // compactionCallTotalTokens 集合保存`tokenCountFromLastAPIResponse`，供服务层 compact后续处理使用。
    const compactionCallTotalTokens = tokenCountFromLastAPIResponse([
      summaryResponse,
    ])

    // Message-payload estimate of the resulting context. The next iteration's
    // shouldAutoCompact will see this PLUS ~20-40K for system prompt + tools +
    // userContext (via API usage.input_tokens). So `willRetriggerNextTurn: true`
    // is a strong signal; `false` may still retrigger when this is close to threshold.
    // truePostCompactTokenCount 数量保存`roughTokenCountEstimationForMessages`，供服务层 compact后续处理使用。
    const truePostCompactTokenCount = roughTokenCountEstimationForMessages([
      boundaryMarker,
      ...summaryMessages,
      ...postCompactFileAttachments,
      ...hookMessages,
    ])

    // Extract compaction API usage metrics
    // compactionUsage读取`getTokenUsage`，供服务层 compact后续处理使用。
    const compactionUsage = getTokenUsage(summaryResponse)

    // querySourceForEvent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const querySourceForEvent =
      recompactionInfo?.querySource ?? context.options.querySource ?? 'unknown'

    // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_compact', {
      preCompactTokenCount,
      // Kept for continuity — semantically the compact API call's total usage
      postCompactTokenCount: compactionCallTotalTokens,
      truePostCompactTokenCount,
      autoCompactThreshold: recompactionInfo?.autoCompactThreshold ?? -1,
      willRetriggerNextTurn:
        recompactionInfo !== undefined &&
        truePostCompactTokenCount >= recompactionInfo.autoCompactThreshold,
      isAutoCompact,
      querySource:
        querySourceForEvent as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryChainId: (context.queryTracking?.chainId ??
        '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryDepth: context.queryTracking?.depth ?? -1,
      isRecompactionInChain: recompactionInfo?.isRecompactionInChain ?? false,
      turnsSincePreviousCompact:
        recompactionInfo?.turnsSincePreviousCompact ?? -1,
      previousCompactTurnId: (recompactionInfo?.previousCompactTurnId ??
        '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      compactionInputTokens: compactionUsage?.input_tokens,
      compactionOutputTokens: compactionUsage?.output_tokens,
      compactionCacheReadTokens: compactionUsage?.cache_read_input_tokens ?? 0,
      compactionCacheCreationTokens:
        compactionUsage?.cache_creation_input_tokens ?? 0,
      compactionTotalTokens: compactionUsage
        ? compactionUsage.input_tokens +
          (compactionUsage.cache_creation_input_tokens ?? 0) +
          (compactionUsage.cache_read_input_tokens ?? 0) +
          compactionUsage.output_tokens
        : 0,
      promptCacheSharingEnabled,
      // analyzeContext walks every content block (~11ms on a 4.5K-message
      // session) purely for this telemetry breakdown. Computed here, past
      // the compaction-API await, so the sync walk doesn't starve the
      // render loop before compaction even starts. Same deferral pattern
      // as reactiveCompact.ts.
      // 链式调用 链式方法，继续加工上一行在服务层 compact中产生的数据。
      ...(() => {
        // 保护这一段可能失败的服务层 compact操作，确保异常能进入相邻错误处理。
        try {
          // 返回 `tokenStatsToStatsigMetrics(analyzeContext(messages))`，作为服务层 compact这次计算的结果。
          return tokenStatsToStatsigMetrics(analyzeContext(messages))
        } catch (error) {
          // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
          logError(error as Error)
          // 返回结构化结果，集中表达服务层 compact已经整理出的状态。
          return {}
        }
      })(),
    })

    // Reset cache read baseline so the post-compact drop isn't flagged as a break
    // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，服务层 compact执行该分支。
    if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
      // 调用 notifyCompaction，触发服务层 compact此处需要的副作用。
      notifyCompaction(
        context.options.querySource ?? 'compact',
        context.agentId,
      )
    }
    // 调用 markPostCompaction，触发服务层 compact此处需要的副作用。
    markPostCompaction()

    // Re-append session metadata (custom title, tag) so it stays within
    // the 16KB tail window that readLiteMetadata reads for --resume display.
    // Without this, enough post-compaction messages push the metadata entry
    // out of the window, causing --resume to show the auto-generated title
    // instead of the user-set session name.
    // 调用 reAppendSessionMetadata，触发服务层 compact此处需要的副作用。
    reAppendSessionMetadata()

    // Write a reduced transcript segment for the pre-compaction messages
    // (assistant mode only). Fire-and-forget — errors are logged internally.
    // 满足 `feature('KAIROS')` 时，服务层 compact执行该分支。
    if (feature('KAIROS')) {
      // 显式忽略 `sessionTranscriptModule?.writeSessionTranscriptSegment(messages)` 的返回值，只保留它触发的副作用。
      void sessionTranscriptModule?.writeSessionTranscriptSegment(messages)
    }

    // 调用 context.onCompactProgress?.({，完成这一处局部操作。
    context.onCompactProgress?.({
      type: 'hooks_start',
      hookType: 'post_compact',
    })
    // postCompactHookResult保存`executePostCompactHooks`，供服务层 compact后续处理使用。
    const postCompactHookResult = await executePostCompactHooks(
      {
        trigger: isAutoCompact ? 'auto' : 'manual',
        compactSummary: summary,
      },
      context.abortController.signal,
    )

    // combinedUserDisplayMessage 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
    const combinedUserDisplayMessage = [
      userDisplayMessage,
      postCompactHookResult.userDisplayMessage,
    ]
      .filter(Boolean)
      .join('\n')

    // 返回结构化结果，集中表达服务层 compact已经整理出的状态。
    return {
      boundaryMarker,
      summaryMessages,
      attachments: postCompactFileAttachments,
      hookResults: hookMessages,
      userDisplayMessage: combinedUserDisplayMessage || undefined,
      preCompactTokenCount,
      postCompactTokenCount: compactionCallTotalTokens,
      truePostCompactTokenCount,
      compactionUsage,
    }
  } catch (error) {
    // Only show the error notification for manual /compact.
    // Auto-compact failures are retried on the next turn and the
    // notification is confusing when compaction eventually succeeds.
    // isAutoCompact缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
    if (!isAutoCompact) {
      // 调用 addErrorNotificationIfNeeded，触发服务层 compact此处需要的副作用。
      addErrorNotificationIfNeeded(error, context)
    }
    // 抛出 error，阻止服务层 compact在无效状态下继续运行。
    throw error
  } finally {
    // 调用 context.setStreamMode?.('requesting')，完成这一处局部操作。
    context.setStreamMode?.('requesting')
    // 这个回调绑定到 context.setResponseLength?.(() => 0)，负责服务层 compact在该局部场景下的响应。
    context.setResponseLength?.(() => 0)
    // 调用 context.onCompactProgress?.({ type: 'compact_end' })，完成这一处局部操作。
    context.onCompactProgress?.({ type: 'compact_end' })
    // 调用 context.setSDKStatus?.(null)，完成这一处局部操作。
    context.setSDKStatus?.(null)
  }
}

/**
 * Performs a partial compaction around the selected message index.
 * Direction 'from': summarizes messages after the index, keeps earlier ones.
 *   Prompt cache for kept (earlier) messages is preserved.
 * Direction 'up_to': summarizes messages before the index, keeps later ones.
 *   Prompt cache is invalidated since the summary precedes the kept messages.
 */
// partialCompactConversation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function partialCompactConversation(
  allMessages: Message[],
  pivotIndex: number,
  context: ToolUseContext,
  cacheSafeParams: CacheSafeParams,
  userFeedback?: string,
  direction: PartialCompactDirection = 'from',
): Promise<CompactionResult> {
  // 保护这一段可能失败的服务层 compact操作，确保异常能进入相邻错误处理。
  try {
    // messagesToSummarize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const messagesToSummarize =
      direction === 'up_to'
        ? allMessages.slice(0, pivotIndex)
        : allMessages.slice(pivotIndex)
    // 'up_to' must strip old compact boundaries/summaries: for 'up_to',
    // summary_B sits BEFORE kept, so a stale boundary_A in kept wins
    // findLastCompactBoundaryIndex's backward scan and drops summary_B.
    // 'from' keeps them: summary_B sits AFTER kept (backward scan still
    // works), and removing an old summary would lose its covered history.
    // messagesToKeep 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const messagesToKeep =
      direction === 'up_to'
        ? allMessages
            .slice(pivotIndex)
            .filter(
              // m更新为 `>`，确保服务层后续读取最新状态。
              m =>
                m.type !== 'progress' &&
                !isCompactBoundaryMessage(m) &&
                !(m.type === 'user' && m.isCompactSummary),
            )
        // 这个回调绑定到 : allMessages.slice(0, pivotIndex).filter(m => m.type !== 'progress')，负责服务层 compact在该局部场景下的响应。
        : allMessages.slice(0, pivotIndex).filter(m => m.type !== 'progress')

    // messagesToSummarize 消息数据为空时立即返回或跳过，避免服务层 compact把空集合当成可处理内容。
    if (messagesToSummarize.length === 0) {
      // 抛出 new Error(，阻止服务层 compact在无效状态下继续运行。
      throw new Error(
        direction === 'up_to'
          ? 'Nothing to summarize before the selected message.'
          : 'Nothing to summarize after the selected message.',
      )
    }

    // preCompactTokenCount 数量保存`tokenCountWithEstimation`，供服务层 compact后续处理使用。
    const preCompactTokenCount = tokenCountWithEstimation(allMessages)

    // 调用 context.onCompactProgress?.({，完成这一处局部操作。
    context.onCompactProgress?.({
      type: 'hooks_start',
      hookType: 'pre_compact',
    })

    // 调用 context.setSDKStatus?.('compacting')，完成这一处局部操作。
    context.setSDKStatus?.('compacting')
    // hookResult保存`executePreCompactHooks`，供服务层 compact后续处理使用。
    const hookResult = await executePreCompactHooks(
      {
        trigger: 'manual',
        customInstructions: null,
      },
      context.abortController.signal,
    )

    // Merge hook instructions with user feedback
    // customInstructions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let customInstructions: string | undefined
    // 组合条件 `hookResult.newCustomInstructions && userFeedback` 成立时，服务层 compact才启用这条专门路径。
    if (hookResult.newCustomInstructions && userFeedback) {
      // customInstructions 集合更新为 ``${hookResult.newCustomInstructions}\n\nUser context: ${u...`，确保服务层后续读取最新状态。
      customInstructions = `${hookResult.newCustomInstructions}\n\nUser context: ${userFeedback}`
    // 服务层 compact在这里处理 `} else if (hookResult.newCustomInstructions) {`，完成这一小步状态转换。
    } else if (hookResult.newCustomInstructions) {
      // customInstructions 集合更新为 `hookResult.newCustomInstructions`，确保服务层后续读取最新状态。
      customInstructions = hookResult.newCustomInstructions
    // 服务层 compact在这里处理 `} else if (userFeedback) {`，完成这一小步状态转换。
    } else if (userFeedback) {
      // customInstructions 集合更新为 ``User context: ${userFeedback}``，确保服务层后续读取最新状态。
      customInstructions = `User context: ${userFeedback}`
    }

    // 调用 context.setStreamMode?.('requesting')，完成这一处局部操作。
    context.setStreamMode?.('requesting')
    // 这个回调绑定到 context.setResponseLength?.(() => 0)，负责服务层 compact在该局部场景下的响应。
    context.setResponseLength?.(() => 0)
    // 调用 context.onCompactProgress?.({ type: 'compact_start' })，完成这一处局部操作。
    context.onCompactProgress?.({ type: 'compact_start' })

    // compactPrompt读取`getPartialCompactPrompt`，供服务层 compact后续处理使用。
    const compactPrompt = getPartialCompactPrompt(customInstructions, direction)
    // summaryRequest 请求数据构建`createUserMessage`，供服务层 compact后续处理使用。
    const summaryRequest = createUserMessage({
      content: compactPrompt,
    })

    // failureMetadata 集中保存服务层 compact要一起传递的字段。
    const failureMetadata = {
      preCompactTokenCount,
      direction:
        direction as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      messagesSummarized: messagesToSummarize.length,
    }

    // 'up_to' prefix hits cache directly; 'from' sends all (tail wouldn't cache).
    // PTL retry breaks the cache prefix but unblocks the user (CC-1180).
    // apiMessages 消息数据标记服务层 compact是否启用对应路径。
    let apiMessages = direction === 'up_to' ? messagesToSummarize : allMessages
    // retryCacheSafeParams 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
    let retryCacheSafeParams =
      direction === 'up_to'
        ? { ...cacheSafeParams, forkContextMessages: messagesToSummarize }
        : cacheSafeParams
    // summaryResponse 响应数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let summaryResponse: AssistantMessage
    // summary 先占位，稍后的条件分支会根据实际输入补齐它。
    let summary: string | null
    // ptlAttempts 集合保存`0`，供服务层 compact后续判断或输出使用。
    let ptlAttempts = 0
    // 循环处理 ``，让服务层 compact逐项把同类条目按顺序走完。
    for (;;) {
      // summaryResponse 响应数据更新为 `await streamCompactSummary({`，确保服务层后续读取最新状态。
      summaryResponse = await streamCompactSummary({
        messages: apiMessages,
        summaryRequest,
        appState: context.getAppState(),
        context,
        preCompactTokenCount,
        cacheSafeParams: retryCacheSafeParams,
      })
      // summary更新为 `getAssistantMessageText(summaryResponse)`，确保服务层后续读取最新状态。
      summary = getAssistantMessageText(summaryResponse)
      // 满足 `!summary?.startsWith(PROMPT_TOO_LONG_ERROR_MESSAGE)` 时，服务层 compact执行该分支。
      if (!summary?.startsWith(PROMPT_TOO_LONG_ERROR_MESSAGE)) break

      // 服务层 compact在这里处理 `ptlAttempts++`，完成这一小步状态转换。
      ptlAttempts++
      // truncated 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const truncated =
        ptlAttempts <= MAX_PTL_RETRIES
          ? truncateHeadForPTLRetry(apiMessages, summaryResponse)
          : null
      // truncated缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
      if (!truncated) {
        // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_partial_compact_failed', {
          reason:
            'prompt_too_long' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          ...failureMetadata,
          ptlAttempts,
        })
        // 抛出 new Error(ERROR_MESSAGE_PROMPT_TOO_LONG)，阻止服务层 compact在无效状态下继续运行。
        throw new Error(ERROR_MESSAGE_PROMPT_TOO_LONG)
      }
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_compact_ptl_retry', {
        attempt: ptlAttempts,
        droppedMessages: apiMessages.length - truncated.length,
        remainingMessages: truncated.length,
        path: 'partial' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // apiMessages 消息数据更新为 `truncated`，确保服务层后续读取最新状态。
      apiMessages = truncated
      // retryCacheSafeParams 缓存更新为 `{`，确保服务层后续读取最新状态。
      retryCacheSafeParams = {
        ...retryCacheSafeParams,
        forkContextMessages: truncated,
      }
    }
    // summary缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
    if (!summary) {
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_partial_compact_failed', {
        reason:
          'no_summary' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...failureMetadata,
      })
      // 抛出 new Error(，阻止服务层 compact在无效状态下继续运行。
      throw new Error(
        'Failed to generate conversation summary - response did not contain valid text content',
      )
    // 服务层 compact在这里处理 `} else if (startsWithApiErrorPrefix(summary)) {`，完成这一小步状态转换。
    } else if (startsWithApiErrorPrefix(summary)) {
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_partial_compact_failed', {
        reason:
          'api_error' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...failureMetadata,
      })
      // 抛出 new Error(summary)，阻止服务层 compact在无效状态下继续运行。
      throw new Error(summary)
    }

    // Store the current file state before clearing
    // preCompactReadFileState 文件数据保存`cacheToObject`，供服务层 compact后续处理使用。
    const preCompactReadFileState = cacheToObject(context.readFileState)
    // 调用 context.readFileState.clear，触发服务层 compact此处需要的副作用。
    context.readFileState.clear()
    // 调用 context.loadedNestedMemoryPaths?.clear()，完成这一处局部操作。
    context.loadedNestedMemoryPaths?.clear()
    // Intentionally NOT resetting sentSkillNames — see compactConversation()
    // for rationale (~4K tokens saved per compact event).

    // 并行获取 fileAttachments、asyncAgentAttachments，缩短服务层 compact等待多个独立异步任务的时间。
    const [fileAttachments, asyncAgentAttachments] = await Promise.all([
      createPostCompactFileAttachments(
        preCompactReadFileState,
        context,
        POST_COMPACT_MAX_FILES_TO_RESTORE,
        messagesToKeep,
      ),
      createAsyncAgentAttachmentsIfNeeded(context),
    ])

    // postCompactFileAttachments 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
    const postCompactFileAttachments: AttachmentMessage[] = [
      ...fileAttachments,
      ...asyncAgentAttachments,
    ]
    // planAttachment构建`createPlanAttachmentIfNeeded`，供服务层 compact后续处理使用。
    const planAttachment = createPlanAttachmentIfNeeded(context.agentId)
    // 满足 `planAttachment` 时，服务层 compact执行该分支。
    if (planAttachment) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(planAttachment)
    }

    // Add plan mode instructions if currently in plan mode
    // planModeAttachment构建`createPlanModeAttachmentIfNeeded`，供服务层 compact后续处理使用。
    const planModeAttachment = await createPlanModeAttachmentIfNeeded(context)
    // 满足 `planModeAttachment` 时，服务层 compact执行该分支。
    if (planModeAttachment) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(planModeAttachment)
    }

    // skillAttachment构建`createSkillAttachmentIfNeeded`，供服务层 compact后续处理使用。
    const skillAttachment = createSkillAttachmentIfNeeded(context.agentId)
    // 满足 `skillAttachment` 时，服务层 compact执行该分支。
    if (skillAttachment) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(skillAttachment)
    }

    // Re-announce only what was in the summarized portion — messagesToKeep
    // is scanned, so anything already announced there is skipped.
    // 调用 for，触发服务层 compact此处需要的副作用。
    for (const att of getDeferredToolsDeltaAttachment(
      context.options.tools,
      context.options.mainLoopModel,
      messagesToKeep,
      { callSite: 'compact_partial' },
    )) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(createAttachmentMessage(att))
    }
    // 逐项读取 `getAgentListingDeltaAttachment(context, message...` 中的att，按输入顺序推进服务层 compact。
    for (const att of getAgentListingDeltaAttachment(context, messagesToKeep)) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(createAttachmentMessage(att))
    }
    // 调用 for，触发服务层 compact此处需要的副作用。
    for (const att of getMcpInstructionsDeltaAttachment(
      context.options.mcpClients,
      context.options.tools,
      context.options.mainLoopModel,
      messagesToKeep,
    )) {
      // postCompactFileAttachments 文件数据追加新条目，保持收集顺序与输入顺序一致。
      postCompactFileAttachments.push(createAttachmentMessage(att))
    }

    // 调用 context.onCompactProgress?.({，完成这一处局部操作。
    context.onCompactProgress?.({
      type: 'hooks_start',
      hookType: 'session_start',
    })
    // hookMessages 消息数据保存`processSessionStartHooks`，供服务层 compact后续处理使用。
    const hookMessages = await processSessionStartHooks('compact', {
      model: context.options.mainLoopModel,
    })

    // postCompactTokenCount 数量保存`tokenCountFromLastAPIResponse`，供服务层 compact后续处理使用。
    const postCompactTokenCount = tokenCountFromLastAPIResponse([
      summaryResponse,
    ])
    // compactionUsage读取`getTokenUsage`，供服务层 compact后续处理使用。
    const compactionUsage = getTokenUsage(summaryResponse)

    // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_partial_compact', {
      preCompactTokenCount,
      postCompactTokenCount,
      messagesKept: messagesToKeep.length,
      messagesSummarized: messagesToSummarize.length,
      direction:
        direction as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      hasUserFeedback: !!userFeedback,
      trigger:
        'message_selector' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      compactionInputTokens: compactionUsage?.input_tokens,
      compactionOutputTokens: compactionUsage?.output_tokens,
      compactionCacheReadTokens: compactionUsage?.cache_read_input_tokens ?? 0,
      compactionCacheCreationTokens:
        compactionUsage?.cache_creation_input_tokens ?? 0,
    })

    // Progress messages aren't loggable, so forkSessionImpl would null out
    // a logicalParentUuid pointing at one. Both directions skip them.
    // lastPreCompactUuid 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const lastPreCompactUuid =
      direction === 'up_to'
        // 这个回调绑定到 ? allMessages.slice(0, pivotIndex).findLast(m => m.type !== 'progress')，负责服务层 compact在该局部场景下的响应。
        ? allMessages.slice(0, pivotIndex).findLast(m => m.type !== 'progress')
            ?.uuid
        : messagesToKeep.at(-1)?.uuid
    // boundaryMarker构建`createCompactBoundaryMessage`，供服务层 compact后续处理使用。
    const boundaryMarker = createCompactBoundaryMessage(
      'manual',
      preCompactTokenCount ?? 0,
      lastPreCompactUuid,
      userFeedback,
      messagesToSummarize.length,
    )
    // allMessages not just messagesToSummarize — set union is idempotent,
    // simpler than tracking which half each tool lived in.
    // preCompactDiscovered保存`extractDiscoveredToolNames`，供服务层 compact后续处理使用。
    const preCompactDiscovered = extractDiscoveredToolNames(allMessages)
    // 满足 `preCompactDiscovered.size > 0` 时，服务层 compact执行该分支。
    if (preCompactDiscovered.size > 0) {
      // 更新为 `[`，确保服务层后续读取最新状态。
      boundaryMarker.compactMetadata.preCompactDiscoveredTools = [
        ...preCompactDiscovered,
      ].sort()
    }

    // transcriptPath 路径数据读取`getTranscriptPath`，供服务层 compact后续处理使用。
    const transcriptPath = getTranscriptPath()
    // summaryMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
    const summaryMessages: UserMessage[] = [
      createUserMessage({
        content: getCompactUserSummaryMessage(summary, false, transcriptPath),
        isCompactSummary: true,
        ...(messagesToKeep.length > 0
          ? {
              summarizeMetadata: {
                messagesSummarized: messagesToSummarize.length,
                userContext: userFeedback,
                direction,
              },
            }
          : { isVisibleInTranscriptOnly: true as const }),
      }),
    ]

    // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，服务层 compact执行该分支。
    if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
      // 调用 notifyCompaction，触发服务层 compact此处需要的副作用。
      notifyCompaction(
        context.options.querySource ?? 'compact',
        context.agentId,
      )
    }
    // 调用 markPostCompaction，触发服务层 compact此处需要的副作用。
    markPostCompaction()

    // Re-append session metadata (custom title, tag) so it stays within
    // the 16KB tail window that readLiteMetadata reads for --resume display.
    // 调用 reAppendSessionMetadata，触发服务层 compact此处需要的副作用。
    reAppendSessionMetadata()

    // 满足 `feature('KAIROS')` 时，服务层 compact执行该分支。
    if (feature('KAIROS')) {
      // 显式忽略 `sessionTranscriptModule?.writeSessionTranscriptSegment(` 的返回值，只保留它触发的副作用。
      void sessionTranscriptModule?.writeSessionTranscriptSegment(
        messagesToSummarize,
      )
    }

    // 调用 context.onCompactProgress?.({，完成这一处局部操作。
    context.onCompactProgress?.({
      type: 'hooks_start',
      hookType: 'post_compact',
    })
    // postCompactHookResult保存`executePostCompactHooks`，供服务层 compact后续处理使用。
    const postCompactHookResult = await executePostCompactHooks(
      {
        trigger: 'manual',
        compactSummary: summary,
      },
      context.abortController.signal,
    )

    // 'from': prefix-preserving → boundary; 'up_to': suffix → last summary
    // anchorUuid 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const anchorUuid =
      direction === 'up_to'
        ? (summaryMessages.at(-1)?.uuid ?? boundaryMarker.uuid)
        : boundaryMarker.uuid
    // 返回结构化结果，集中表达服务层 compact已经整理出的状态。
    return {
      boundaryMarker: annotateBoundaryWithPreservedSegment(
        boundaryMarker,
        anchorUuid,
        messagesToKeep,
      ),
      summaryMessages,
      messagesToKeep,
      attachments: postCompactFileAttachments,
      hookResults: hookMessages,
      userDisplayMessage: postCompactHookResult.userDisplayMessage,
      preCompactTokenCount,
      postCompactTokenCount,
      compactionUsage,
    }
  } catch (error) {
    // 调用 addErrorNotificationIfNeeded，触发服务层 compact此处需要的副作用。
    addErrorNotificationIfNeeded(error, context)
    // 抛出 error，阻止服务层 compact在无效状态下继续运行。
    throw error
  } finally {
    // 调用 context.setStreamMode?.('requesting')，完成这一处局部操作。
    context.setStreamMode?.('requesting')
    // 这个回调绑定到 context.setResponseLength?.(() => 0)，负责服务层 compact在该局部场景下的响应。
    context.setResponseLength?.(() => 0)
    // 调用 context.onCompactProgress?.({ type: 'compact_end' })，完成这一处局部操作。
    context.onCompactProgress?.({ type: 'compact_end' })
    // 调用 context.setSDKStatus?.(null)，完成这一处局部操作。
    context.setSDKStatus?.(null)
  }
}

// addErrorNotificationIfNeeded 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addErrorNotificationIfNeeded(
  error: unknown,
  context: Pick<ToolUseContext, 'addNotification'>,
) {
  // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
  if (
    !hasExactErrorMessage(error, ERROR_MESSAGE_USER_ABORT) &&
    !hasExactErrorMessage(error, ERROR_MESSAGE_NOT_ENOUGH_MESSAGES)
  ) {
    // 调用 context.addNotification?.({，完成这一处局部操作。
    context.addNotification?.({
      key: 'error-compacting-conversation',
      text: 'Error compacting conversation',
      priority: 'immediate',
      color: 'error',
    })
  }
}

// createCompactCanUseTool 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCompactCanUseTool(): CanUseToolFn {
  // 返回 `async () => ({`，作为服务层 compact这次计算的结果。
  return async () => ({
    behavior: 'deny' as const,
    message: 'Tool use is not allowed during compaction',
    decisionReason: {
      type: 'other' as const,
      reason: 'compaction agent should only produce text summary',
    },
  })
}

// streamCompactSummary 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function streamCompactSummary({
  messages,
  summaryRequest,
  appState,
  context,
  preCompactTokenCount,
  cacheSafeParams,
}: {
  messages: Message[]
  summaryRequest: UserMessage
  appState: Awaited<ReturnType<ToolUseContext['getAppState']>>
  context: ToolUseContext
  preCompactTokenCount: number
  cacheSafeParams: CacheSafeParams
}): Promise<AssistantMessage> {
  // When prompt cache sharing is enabled, use forked agent to reuse the
  // main conversation's cached prefix (system prompt, tools, context messages).
  // Falls back to regular streaming path on failure.
  // 3P default: true — see comment at the other tengu_compact_cache_prefix read above.
  // promptCacheSharingEnabled 缓存读取`getFeatureValue_CACHED_MAY_BE_STALE`，供服务层 compact后续处理使用。
  const promptCacheSharingEnabled = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_compact_cache_prefix',
    true,
  )
  // Send keep-alive signals during compaction to prevent remote session
  // WebSocket idle timeouts from dropping bridge connections. Compaction
  // API calls can take 5-10+ seconds, during which no other messages
  // flow through the transport — without keep-alives, the server may
  // close the WebSocket for inactivity.
  // Two signals: (1) PUT /worker heartbeat via sessionActivity, and
  // (2) re-emit 'compacting' status so the SDK event stream stays active
  // and the server doesn't consider the session stale.
  // activityInterval保存`isSessionActivityTrackingActive`，供服务层 compact后续处理使用。
  const activityInterval = isSessionActivityTrackingActive()
    ? setInterval(
        // 这个回调绑定到 (statusSetter?: (status: 'compacting' | null) => void) => {，负责服务层 compact在该局部场景下的响应。
        (statusSetter?: (status: 'compacting' | null) => void) => {
          // 调用 sendSessionActivitySignal，触发服务层 compact此处需要的副作用。
          sendSessionActivitySignal()
          // 调用 statusSetter?.('compacting')，完成这一处局部操作。
          statusSetter?.('compacting')
        },
        30_000,
        context.setSDKStatus,
      )
    : undefined

  // 保护这一段可能失败的服务层 compact操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `promptCacheSharingEnabled` 时，服务层 compact执行该分支。
    if (promptCacheSharingEnabled) {
      // 保护这一段可能失败的服务层 compact操作，确保异常能进入相邻错误处理。
      try {
        // DO NOT set maxOutputTokens here. The fork piggybacks on the main thread's
        // prompt cache by sending identical cache-key params (system, tools, model,
        // messages prefix, thinking config). Setting maxOutputTokens would clamp
        // budget_tokens via Math.min(budget, maxOutputTokens-1) in claude.ts,
        // creating a thinking config mismatch that invalidates the cache.
        // The streaming fallback path (below) can safely set maxOutputTokensOverride
        // since it doesn't share cache with the main thread.
        // 结果保存`runForkedAgent`，供服务层 compact后续处理使用。
        const result = await runForkedAgent({
          promptMessages: [summaryRequest],
          cacheSafeParams,
          canUseTool: createCompactCanUseTool(),
          querySource: 'compact',
          forkLabel: 'compact',
          maxTurns: 1,
          skipCacheWrite: true,
          // Pass the compact context's abortController so user Esc aborts the
          // fork — same signal the streaming fallback uses at
          // `signal: context.abortController.signal` below.
          overrides: { abortController: context.abortController },
        })
        // assistantMsg读取`getLastAssistantMessage`，供服务层 compact后续处理使用。
        const assistantMsg = getLastAssistantMessage(result.messages)
        // assistantText保存`assistantMsg`，供后续判断或组装使用。
        const assistantText = assistantMsg
          ? getAssistantMessageText(assistantMsg)
          : null
        // Guard isApiErrorMessage: query() catches API errors (including
        // APIUserAbortError on ESC) and yields them as synthetic assistant
        // messages. Without this check, an aborted compact "succeeds" with
        // "Request was aborted." as the summary — the text doesn't start with
        // "API Error" so the caller's startsWithApiErrorPrefix guard misses it.
        // 组合条件 `assistantMsg && assistantText && !assistantMsg.is` 成立时，服务层 compact才启用这条专门路径。
        if (assistantMsg && assistantText && !assistantMsg.isApiErrorMessage) {
          // Skip success logging for PTL error text — it's returned so the
          // caller's retry loop catches it, but it's not a successful summary.
          // 满足 `!assistantText.startsWith(PROMPT_TOO_LONG_ERROR_MESSAGE)` 时，服务层 compact执行该分支。
          if (!assistantText.startsWith(PROMPT_TOO_LONG_ERROR_MESSAGE)) {
            // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_compact_cache_sharing_success', {
              preCompactTokenCount,
              outputTokens: result.totalUsage.output_tokens,
              cacheReadInputTokens: result.totalUsage.cache_read_input_tokens,
              cacheCreationInputTokens:
                result.totalUsage.cache_creation_input_tokens,
              cacheHitRate:
                result.totalUsage.cache_read_input_tokens > 0
                  ? result.totalUsage.cache_read_input_tokens /
                    (result.totalUsage.cache_read_input_tokens +
                      result.totalUsage.cache_creation_input_tokens +
                      result.totalUsage.input_tokens)
                  : 0,
            })
          }
          // 返回 `assistantMsg`，作为服务层 compact这次计算的结果。
          return assistantMsg
        }
        // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Compact cache sharing: no text in response, falling back. Response: ${jsonStringify(assistantMsg)}`,
          { level: 'warn' },
        )
        // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_compact_cache_sharing_fallback', {
          reason:
            'no_text_response' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          preCompactTokenCount,
        })
      } catch (error) {
        // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_compact_cache_sharing_fallback', {
          reason:
            'error' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          preCompactTokenCount,
        })
      }
    }

    // Regular streaming path (fallback when cache sharing fails or is disabled)
    // retryEnabled读取`getFeatureValue_CACHED_MAY_BE_STALE`，供服务层 compact后续处理使用。
    const retryEnabled = getFeatureValue_CACHED_MAY_BE_STALE(
      'tengu_compact_streaming_retry',
      false,
    )
    // maxAttempts 集合保存`retryEnabled ? MAX_COMPACT_STREAMING_RETRIES : 1`，供服务层 compact后续判断或输出使用。
    const maxAttempts = retryEnabled ? MAX_COMPACT_STREAMING_RETRIES : 1

    // 循环处理 `let attempt = 1; attempt <= maxAttempts; attempt++`，让服务层 compact逐项把同类条目按顺序走完。
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Reset state for retry
      // hasStartedStreaming标记服务层 compact是否启用对应路径。
      let hasStartedStreaming = false
      // 接口响应 先占位，稍后的条件分支会根据实际输入补齐它。
      let response: AssistantMessage | undefined
      // 这个回调绑定到 context.setResponseLength?.(() => 0)，负责服务层 compact在该局部场景下的响应。
      context.setResponseLength?.(() => 0)

      // Check if tool search is enabled using the main loop's tools list.
      // context.options.tools includes MCP tools merged via useMergedTools.
      // useToolSearch保存`isToolSearchEnabled`，供服务层 compact后续处理使用。
      const useToolSearch = await isToolSearchEnabled(
        context.options.mainLoopModel,
        context.options.tools,
        // 调用 async，触发服务层 compact此处需要的副作用。
        async () => appState.toolPermissionContext,
        context.options.agentDefinitions.activeAgents,
        'compact',
      )

      // When tool search is enabled, include ToolSearchTool and MCP tools. They get
      // defer_loading: true and don't count against context - the API filters them out
      // of system_prompt_tools before token counting (see api/token_count_api/counting.py:188
      // and api/public_api/messages/handler.py:324).
      // Filter MCP tools from context.options.tools (not appState.mcp.tools) so we
      // get the permission-filtered set from useMergedTools — same source used for
      // isToolSearchEnabled above and normalizeMessagesForAPI below.
      // Deduplicate by name to avoid API errors when MCP tools share names with built-in tools.
      // tools 集合读取 hook 状态，供服务层 compact本轮渲染使用。
      const tools: Tool[] = useToolSearch
        ? uniqBy(
            [
              FileReadTool,
              ToolSearchTool,
              // 链式调用 链式方法，继续加工上一行在服务层 compact中产生的数据。
              ...context.options.tools.filter(t => t.isMcp),
            ],
            'name',
          )
        : [FileReadTool]

      // streamingGen保存`queryModelWithStreaming`，供服务层 compact后续处理使用。
      const streamingGen = queryModelWithStreaming({
        messages: normalizeMessagesForAPI(
          stripImagesFromMessages(
            stripReinjectedAttachments([
              ...getMessagesAfterCompactBoundary(messages),
              summaryRequest,
            ]),
          ),
          context.options.tools,
        ),
        systemPrompt: asSystemPrompt([
          'You are a helpful AI assistant tasked with summarizing conversations.',
        ]),
        thinkingConfig: { type: 'disabled' as const },
        tools,
        signal: context.abortController.signal,
        options: {
          // getToolPermissionContext不依赖额外参数，直接计算服务层 compact需要的结果。
          async getToolPermissionContext() {
            // appState 状态读取`context.getAppState`，供服务层 compact后续处理使用。
            const appState = context.getAppState()
            // 返回 `appState.toolPermissionContext`，作为服务层 compact这次计算的结果。
            return appState.toolPermissionContext
          },
          model: context.options.mainLoopModel,
          toolChoice: undefined,
          isNonInteractiveSession: context.options.isNonInteractiveSession,
          hasAppendSystemPrompt: !!context.options.appendSystemPrompt,
          maxOutputTokensOverride: Math.min(
            COMPACT_MAX_OUTPUT_TOKENS,
            getMaxOutputTokensForModel(context.options.mainLoopModel),
          ),
          querySource: 'compact',
          agents: context.options.agentDefinitions.activeAgents,
          mcpTools: [],
          effortValue: appState.effortValue,
        },
      })
      // streamIter读取 `streamingGen[Symbol.asyncIterator]()` 对应条目，后续围绕该成员继续处理。
      const streamIter = streamingGen[Symbol.asyncIterator]()
      // next保存`streamIter.next`，供服务层 compact后续处理使用。
      let next = await streamIter.next()

      // while 使用 !next.done 完成服务层 compact里的对应操作。
      while (!next.done) {
        // event 命名 `next.value`，让后续代码直接表达这个值的用途。
        const event = next.value

        // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
        if (
          !hasStartedStreaming &&
          event.type === 'stream_event' &&
          event.event.type === 'content_block_start' &&
          event.event.content_block.type === 'text'
        ) {
          // hasStartedStreaming更新为 `true`，确保服务层后续读取最新状态。
          hasStartedStreaming = true
          // 调用 context.setStreamMode?.('responding')，完成这一处局部操作。
          context.setStreamMode?.('responding')
        }

        // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
        if (
          event.type === 'stream_event' &&
          event.event.type === 'content_block_delta' &&
          event.event.delta.type === 'text_delta'
        ) {
          // charactersStreamed保存 `event.event.delta.text.length` 的判断结果，供服务层 compact后续分支直接复用。
          const charactersStreamed = event.event.delta.text.length
          // 这个回调绑定到 context.setResponseLength?.(length => length + charactersStreamed)，负责服务层 compact在该局部场景下的响应。
          context.setResponseLength?.(length => length + charactersStreamed)
        }

        // 当 `event.type` 匹配 `'assistant'` 时，服务层 compact执行对应分支。
        if (event.type === 'assistant') {
          // 接口响应更新为 `event`，确保服务层后续读取最新状态。
          response = event
        }

        // next更新为 `await streamIter.next()`，确保服务层后续读取最新状态。
        next = await streamIter.next()
      }

      // 满足 `response` 时，服务层 compact执行该分支。
      if (response) {
        // 返回 `response`，作为服务层 compact这次计算的结果。
        return response
      }

      // 满足 `attempt < maxAttempts` 时，服务层 compact执行该分支。
      if (attempt < maxAttempts) {
        // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_compact_streaming_retry', {
          attempt,
          preCompactTokenCount,
          hasStartedStreaming,
        })
        // 等待 `sleep(getRetryDelay(attempt), context.abortController.signal, {` 完成，再继续服务层 compact的异步流程。
        await sleep(getRetryDelay(attempt), context.abortController.signal, {
          // 这个回调绑定到 abortError: () => new APIUserAbortError(),，负责服务层 compact在该局部场景下的响应。
          abortError: () => new APIUserAbortError(),
        })
        // 跳过当前项，继续处理服务层 compact中的下一轮循环。
        continue
      }

      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Compact streaming failed after ${attempt} attempts. hasStartedStreaming=${hasStartedStreaming}`,
        { level: 'error' },
      )
      // 记录服务层 compact运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_compact_failed', {
        reason:
          'no_streaming_response' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        preCompactTokenCount,
        hasStartedStreaming,
        retryEnabled,
        attempts: attempt,
        promptCacheSharingEnabled,
      })
      // 抛出 new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)，阻止服务层 compact在无效状态下继续运行。
      throw new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)
    }

    // This should never be reached due to the throw above, but TypeScript needs it
    // 抛出 new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)，阻止服务层 compact在无效状态下继续运行。
    throw new Error(ERROR_MESSAGE_INCOMPLETE_RESPONSE)
  } finally {
    // 调用 clearInterval，触发服务层 compact此处需要的副作用。
    clearInterval(activityInterval)
  }
}

/**
 * Creates attachment messages for recently accessed files to restore them after compaction.
 * This prevents the model from having to re-read files that were recently accessed.
 * Re-reads files using FileReadTool to get fresh content with proper validation.
 * Files are selected based on recency, but constrained by both file count and token budget limits.
 *
 * Files already present as Read tool results in preservedMessages are skipped —
 * re-injecting identical content the model can already see in the preserved tail
 * is pure waste (up to 25K tok/compact). Mirrors the diff-against-preserved
 * pattern that getDeferredToolsDeltaAttachment uses at the same call sites.
 *
 * @param readFileState The current file state tracking recently read files
 * @param toolUseContext The tool use context for calling FileReadTool
 * @param maxFiles Maximum number of files to restore (default: 5)
 * @param preservedMessages Messages kept post-compact; Read results here are skipped
 * @returns Array of attachment messages for the most recently accessed files that fit within token budget
 */
// createPostCompactFileAttachments 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createPostCompactFileAttachments(
  readFileState: Record<string, { content: string; timestamp: number }>,
  toolUseContext: ToolUseContext,
  maxFiles: number,
  preservedMessages: Message[] = [],
): Promise<AttachmentMessage[]> {
  // preservedReadPaths 路径数据保存`collectReadToolFilePaths`，供服务层 compact后续处理使用。
  const preservedReadPaths = collectReadToolFilePaths(preservedMessages)
  // recentFiles 文件数据派生`Object.entries`，供服务层 compact后续处理使用。
  const recentFiles = Object.entries(readFileState)
    // 链式调用 map，继续加工上一行在服务层 compact中产生的数据。
    .map(([filename, state]) => ({ filename, ...state }))
    .filter(
      // file 文件数据更新为 `>`，确保服务层后续读取最新状态。
      file =>
        !shouldExcludeFromPostCompactRestore(
          file.filename,
          toolUseContext.agentId,
        ) && !preservedReadPaths.has(expandPath(file.filename)),
    )
    // 链式调用 sort，继续加工上一行在服务层 compact中产生的数据。
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxFiles)

  // 结果列表保存`Promise.all`，供服务层 compact后续处理使用。
  const results = await Promise.all(
    // 调用 recentFiles.map，触发服务层 compact此处需要的副作用。
    recentFiles.map(async file => {
      // attachment保存`generateFileAttachment`，供服务层 compact后续处理使用。
      const attachment = await generateFileAttachment(
        file.filename,
        {
          ...toolUseContext,
          fileReadingLimits: {
            maxTokens: POST_COMPACT_MAX_TOKENS_PER_FILE,
          },
        },
        'tengu_post_compact_file_restore_success',
        'tengu_post_compact_file_restore_error',
        'compact',
      )
      // 返回 `attachment ? createAttachmentMessage(attachment) : null`，作为服务层 compact这次计算的结果。
      return attachment ? createAttachmentMessage(attachment) : null
    }),
  )

  // usedTokens 集合保存`0`，供服务层 compact后续判断或输出使用。
  let usedTokens = 0
  // 返回 `results.filter((result): result is AttachmentMessage => {`，作为服务层 compact这次计算的结果。
  return results.filter((result): result is AttachmentMessage => {
    // 满足 `result === null` 时，服务层 compact执行该分支。
    if (result === null) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // attachmentTokens 集合保存`roughTokenCountEstimation`，供服务层 compact后续处理使用。
    const attachmentTokens = roughTokenCountEstimation(jsonStringify(result))
    // 满足 `usedTokens + attachmentTokens <= POST_COMPACT_TOK` 时，服务层 compact执行该分支。
    if (usedTokens + attachmentTokens <= POST_COMPACT_TOKEN_BUDGET) {
      // 服务层 compact在这里处理 `usedTokens += attachmentTokens`，完成这一小步状态转换。
      usedTokens += attachmentTokens
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  })
}

/**
 * Creates a plan file attachment if a plan file exists for the current session.
 * This ensures the plan is preserved after compaction.
 */
// createPlanAttachmentIfNeeded 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPlanAttachmentIfNeeded(
  agentId?: AgentId,
): AttachmentMessage | null {
  // planContent读取`getPlan`，供服务层 compact后续处理使用。
  const planContent = getPlan(agentId)

  // planContent缺失时提前走兜底路径，避免服务层 compact继续依赖无效输入。
  if (!planContent) {
    // 返回 `null`，作为服务层 compact这次计算的结果。
    return null
  }

  // planFilePath 路径数据读取`getPlanFilePath`，供服务层 compact后续处理使用。
  const planFilePath = getPlanFilePath(agentId)

  // 返回 `createAttachmentMessage({`，作为服务层 compact这次计算的结果。
  return createAttachmentMessage({
    type: 'plan_file_reference',
    planFilePath,
    planContent,
  })
}

/**
 * Creates an attachment for invoked skills to preserve their content across compaction.
 * Only includes skills scoped to the given agent (or main session when agentId is null/undefined).
 * This ensures skill guidelines remain available after the conversation is summarized
 * without leaking skills from other agent contexts.
 */
// createSkillAttachmentIfNeeded 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSkillAttachmentIfNeeded(
  agentId?: string,
): AttachmentMessage | null {
  // invokedSkills 集合读取`getInvokedSkillsForAgent`，供服务层 compact后续处理使用。
  const invokedSkills = getInvokedSkillsForAgent(agentId)

  // 满足 `invokedSkills.size === 0` 时，服务层 compact执行该分支。
  if (invokedSkills.size === 0) {
    // 返回 `null`，作为服务层 compact这次计算的结果。
    return null
  }

  // Sorted most-recent-first so budget pressure drops the least-relevant skills.
  // Per-skill truncation keeps the head of each file (where setup/usage
  // instructions typically live) rather than dropping whole skills.
  // usedTokens 集合保存`0`，供服务层 compact后续判断或输出使用。
  let usedTokens = 0
  // skills 集合保存`Array.from`，供服务层 compact后续处理使用。
  const skills = Array.from(invokedSkills.values())
    // 链式调用 sort，继续加工上一行在服务层 compact中产生的数据。
    .sort((a, b) => b.invokedAt - a.invokedAt)
    // 链式调用 map，继续加工上一行在服务层 compact中产生的数据。
    .map(skill => ({
      name: skill.skillName,
      path: skill.skillPath,
      content: truncateToTokens(
        skill.content,
        POST_COMPACT_MAX_TOKENS_PER_SKILL,
      ),
    }))
    // 链式调用 filter，继续加工上一行在服务层 compact中产生的数据。
    .filter(skill => {
      // token 列表保存`roughTokenCountEstimation`，供服务层 compact后续处理使用。
      const tokens = roughTokenCountEstimation(skill.content)
      // 满足 `usedTokens + tokens > POST_COMPACT_SKILLS_TOKEN_B` 时，服务层 compact执行该分支。
      if (usedTokens + tokens > POST_COMPACT_SKILLS_TOKEN_BUDGET) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 服务层 compact在这里处理 `usedTokens += tokens`，完成这一小步状态转换。
      usedTokens += tokens
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    })

  // skills 集合为空时立即返回或跳过，避免服务层 compact把空集合当成可处理内容。
  if (skills.length === 0) {
    // 返回 `null`，作为服务层 compact这次计算的结果。
    return null
  }

  // 返回 `createAttachmentMessage({`，作为服务层 compact这次计算的结果。
  return createAttachmentMessage({
    type: 'invoked_skills',
    skills,
  })
}

/**
 * Creates a plan_mode attachment if the user is currently in plan mode.
 * This ensures the model continues to operate in plan mode after compaction
 * (otherwise it would lose the plan mode instructions since those are
 * normally only injected on tool-use turns via getAttachmentMessages).
 */
// createPlanModeAttachmentIfNeeded 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createPlanModeAttachmentIfNeeded(
  context: ToolUseContext,
): Promise<AttachmentMessage | null> {
  // appState 状态读取`context.getAppState`，供服务层 compact后续处理使用。
  const appState = context.getAppState()
  // `appState.toolPermissionContext.mode` 与 `'plan'` 不一致时刷新派生状态，避免使用过期结果。
  if (appState.toolPermissionContext.mode !== 'plan') {
    // 返回 `null`，作为服务层 compact这次计算的结果。
    return null
  }

  // planFilePath 路径数据读取`getPlanFilePath`，供服务层 compact后续处理使用。
  const planFilePath = getPlanFilePath(context.agentId)
  // planExists 集合读取`getPlan`，供服务层 compact后续处理使用。
  const planExists = getPlan(context.agentId) !== null

  // 返回 `createAttachmentMessage({`，作为服务层 compact这次计算的结果。
  return createAttachmentMessage({
    type: 'plan_mode',
    reminderType: 'full',
    isSubAgent: !!context.agentId,
    planFilePath,
    planExists,
  })
}

/**
 * Creates attachments for async agents so the model knows about them after
 * compaction. Covers both agents still running in the background (so the model
 * doesn't spawn a duplicate) and agents that have finished but whose results
 * haven't been retrieved yet.
 */
// createAsyncAgentAttachmentsIfNeeded 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createAsyncAgentAttachmentsIfNeeded(
  context: ToolUseContext,
): Promise<AttachmentMessage[]> {
  // appState 状态读取`context.getAppState`，供服务层 compact后续处理使用。
  const appState = context.getAppState()
  // asyncAgents 集合派生`Object.values`，供服务层 compact后续处理使用。
  const asyncAgents = Object.values(appState.tasks).filter(
    // 这个回调绑定到 (task): task is LocalAgentTaskState => task.type === 'local_agent',，负责服务层 compact在该局部场景下的响应。
    (task): task is LocalAgentTaskState => task.type === 'local_agent',
  )

  // 返回 `asyncAgents.flatMap(agent => {`，作为服务层 compact这次计算的结果。
  return asyncAgents.flatMap(agent => {
    // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
    if (
      agent.retrieved ||
      agent.status === 'pending' ||
      agent.agentId === context.agentId
    ) {
      // 返回列表结果，保留服务层 compact已经排好的条目顺序。
      return []
    }
    // 返回列表结果，保留服务层 compact已经排好的条目顺序。
    return [
      createAttachmentMessage({
        type: 'task_status',
        taskId: agent.agentId,
        taskType: 'local_agent',
        description: agent.description,
        status: agent.status,
        deltaSummary:
          agent.status === 'running'
            ? (agent.progress?.summary ?? null)
            : (agent.error ?? null),
        outputFilePath: getTaskOutputPath(agent.agentId),
      }),
    ]
  })
}

/**
 * Scan messages for Read tool_use blocks and collect their file_path inputs
 * (normalized via expandPath). Used to dedup post-compact file restoration
 * against what's already visible in the preserved tail.
 *
 * Skips Reads whose tool_result is a dedup stub — the stub points at an
 * earlier full Read that may have been compacted away, so we want
 * createPostCompactFileAttachments to re-inject the real content.
 */
// collectReadToolFilePaths 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectReadToolFilePaths(messages: Message[]): Set<string> {
  // stubIds 集合构建`new Set<string>()` 整理出中间结果，供服务层 compact后续步骤使用。
  const stubIds = new Set<string>()
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 compact处理。
  for (const message of messages) {
    // `message.type` 与 `'user' || !Array.isArray(messag...` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'user' || !Array.isArray(message.message.content)) {
      // 跳过当前项，继续处理服务层 compact中的下一轮循环。
      continue
    }
    // 按顺序遍历 `message.message.content` 中的block，逐个交给服务层 compact处理。
    for (const block of message.message.content) {
      // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
      if (
        block.type === 'tool_result' &&
        typeof block.content === 'string' &&
        block.content.startsWith(FILE_UNCHANGED_STUB)
      ) {
        // 调用 stubIds.add，触发服务层 compact此处需要的副作用。
        stubIds.add(block.tool_use_id)
      }
    }
  }

  // 路径列表构建`new Set<string>()`，供后续判断或组装使用。
  const paths = new Set<string>()
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 compact处理。
  for (const message of messages) {
    // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
    if (
      message.type !== 'assistant' ||
      !Array.isArray(message.message.content)
    ) {
      // 跳过当前项，继续处理服务层 compact中的下一轮循环。
      continue
    }
    // 按顺序遍历 `message.message.content` 中的block，逐个交给服务层 compact处理。
    for (const block of message.message.content) {
      // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
      if (
        block.type !== 'tool_use' ||
        block.name !== FILE_READ_TOOL_NAME ||
        stubIds.has(block.id)
      ) {
        // 跳过当前项，继续处理服务层 compact中的下一轮循环。
        continue
      }
      // 用户输入 命名 `block.input`，让后续代码直接表达这个值的用途。
      const input = block.input
      // 服务层 compact在这里进入条件判断，后续代码按实际状态分流。
      if (
        input &&
        typeof input === 'object' &&
        'file_path' in input &&
        typeof input.file_path === 'string'
      ) {
        // 调用 paths.add，触发服务层 compact此处需要的副作用。
        paths.add(expandPath(input.file_path))
      }
    }
  }
  // 返回 `paths`，作为服务层 compact这次计算的结果。
  return paths
}

// SKILL_TRUNCATION_MARKER 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SKILL_TRUNCATION_MARKER =
  '\n\n[... skill content truncated for compaction; use Read on the skill path if you need the full text]'

/**
 * Truncate content to roughly maxTokens, keeping the head. roughTokenCountEstimation
 * uses ~4 chars/token (its default bytesPerToken), so char budget = maxTokens * 4
 * minus the marker so the result stays within budget. Marker tells the model it
 * can Read the full file if needed.
 */
// truncateToTokens 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateToTokens(content: string, maxTokens: number): string {
  // 满足 `roughTokenCountEstimation(content) <= maxTokens` 时，服务层 compact执行该分支。
  if (roughTokenCountEstimation(content) <= maxTokens) {
    // 返回 `content`，作为服务层 compact这次计算的结果。
    return content
  }
  // charBudget记录 `maxTokens * 4 - SKILL_TRUNCATION_MARKER.length` 是否成立，下一步按该结果分支。
  const charBudget = maxTokens * 4 - SKILL_TRUNCATION_MARKER.length
  // 返回 `content.slice(0, charBudget) + SKILL_TRUNCATION_MARKER`，作为服务层 compact这次计算的结果。
  return content.slice(0, charBudget) + SKILL_TRUNCATION_MARKER
}

// shouldExcludeFromPostCompactRestore 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldExcludeFromPostCompactRestore(
  filename: string,
  agentId?: AgentId,
): boolean {
  // normalizedFilename 文件数据保存`expandPath`，供服务层 compact后续处理使用。
  const normalizedFilename = expandPath(filename)
  // Exclude plan files
  // 保护这一段可能失败的服务层 compact操作，确保异常能进入相邻错误处理。
  try {
    // planFilePath 路径数据保存`expandPath`，供服务层 compact后续处理使用。
    const planFilePath = expandPath(getPlanFilePath(agentId))
    // 满足 `normalizedFilename === planFilePath` 时，服务层 compact执行该分支。
    if (normalizedFilename === planFilePath) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  } catch {
    // If we can't get plan file path, continue with other checks
  }

  // Exclude all types of claude.md files
  // TODO: Refactor to use isMemoryFilePath() from claudemd.ts for consistency
  // and to also match child directory memory files (.claude/rules/*.md, etc.)
  // 保护这一段可能失败的服务层 compact操作，确保异常能进入相邻错误处理。
  try {
    // normalizedMemoryPaths 路径数据保存`Set`，供服务层 compact后续处理使用。
    const normalizedMemoryPaths = new Set(
      // 调用 MEMORY_TYPE_VALUES.map，触发服务层 compact此处需要的副作用。
      MEMORY_TYPE_VALUES.map(type => expandPath(getMemoryPath(type))),
    )

    // 满足 `normalizedMemoryPaths.has(normalizedFilename)` 时，服务层 compact执行该分支。
    if (normalizedMemoryPaths.has(normalizedFilename)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  } catch {
    // If we can't get memory paths, continue
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
