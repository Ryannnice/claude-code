/**
 * Extracts durable memories from the current session transcript
 * and writes them to the auto-memory directory (~/.claude/projects/<path>/memory/).
 *
 * It runs once at the end of each complete query loop (when the model produces
 * a final response with no tool calls) via handleStopHooks in stopHooks.ts.
 *
 * Uses the forked agent pattern (runForkedAgent) — a perfect fork of the main
 * conversation that shares the parent's prompt cache.
 *
 * State is closure-scoped inside initExtractMemories() rather than module-level,
 * following the same pattern as confidenceRating.ts. Tests call
 * initExtractMemories() in beforeEach to get a fresh closure.
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准服务层 extract Memories的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 引入 ENTRYPOINT_NAME，将 ../../memdir/memdir.js 中已经封装好的能力接到本文件流程里。
import { ENTRYPOINT_NAME } from '../../memdir/memdir.js'
// 整理这一组导入，让服务层 extract Memories后续逻辑可以直接复用这些外部能力。
import {
  formatMemoryManifest,
  scanMemoryFiles,
} from '../../memdir/memoryScan.js'
// 整理这一组导入，让服务层 extract Memories后续逻辑可以直接复用这些外部能力。
import {
  getAutoMemPath,
  isAutoMemoryEnabled,
  isAutoMemPath,
} from '../../memdir/paths.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准服务层 extract Memories的数据契约。
import type { Tool } from '../../Tool.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
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
// 接入 REPL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { REPL_TOOL_NAME } from '../../tools/REPLTool/constants.js'
// 整理这一组导入，让服务层 extract Memories后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  SystemLocalCommandMessage,
  SystemMessage,
} from '../../types/message.js'
// 复用 createAbortController 工具函数，把通用处理留在 ../../utils/abortController.js 中维护。
import { createAbortController } from '../../utils/abortController.js'
// 复用 count、uniq 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count, uniq } from '../../utils/array.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让服务层 extract Memories后续逻辑可以直接复用这些外部能力。
import {
  createCacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
// 类型依赖 { REPLHookContext } 来自 ../../utils/hooks/postSamplingHooks.js，用于校准服务层 extract Memories的数据契约。
import type { REPLHookContext } from '../../utils/hooks/postSamplingHooks.js'
// 整理这一组导入，让服务层 extract Memories后续逻辑可以直接复用这些外部能力。
import {
  createMemorySavedMessage,
  createUserMessage,
} from '../../utils/messages.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 引入 sanitizeToolNameForAnalytics，将 ../analytics/metadata.js 中已经封装好的能力接到本文件流程里。
import { sanitizeToolNameForAnalytics } from '../analytics/metadata.js'
// 整理这一组导入，让服务层 extract Memories后续逻辑可以直接复用这些外部能力。
import {
  buildExtractAutoOnlyPrompt,
  buildExtractCombinedPrompt,
} from './prompts.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPaths 路径数据保存`feature`，供服务层 extract Memories后续处理使用。
const teamMemPaths = feature('TEAMMEM')
  ? (require('../../memdir/teamMemPaths.js') as typeof import('../../memdir/teamMemPaths.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns true if a message is visible to the model (sent in API calls).
 * Excludes progress, system, and attachment messages.
 */
// isModelVisibleMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isModelVisibleMessage(message: Message): boolean {
  // 返回 `message.type === 'user' || message.type === 'assistant'`，作为服务层 extract Memories这次计算的结果。
  return message.type === 'user' || message.type === 'assistant'
}

// countModelVisibleMessagesSince 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countModelVisibleMessagesSince(
  messages: Message[],
  sinceUuid: string | undefined,
): number {
  // 组合条件 `sinceUuid === null || sinceUuid === undefined` 成立时，服务层 extract Memories才启用这条专门路径。
  if (sinceUuid === null || sinceUuid === undefined) {
    // 返回 `count(messages, isModelVisibleMessage)`，作为服务层 extract Memories这次计算的结果。
    return count(messages, isModelVisibleMessage)
  }

  // foundStart标记服务层 extract Memories是否启用对应路径。
  let foundStart = false
  // n 命名 `0`，让后续代码直接表达这个值的用途。
  let n = 0
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 extract Memories处理。
  for (const message of messages) {
    // foundStart缺失时提前走兜底路径，避免服务层 extract Memories继续依赖无效输入。
    if (!foundStart) {
      // 满足 `message.uuid === sinceUuid` 时，服务层 extract Memories执行该分支。
      if (message.uuid === sinceUuid) {
        // foundStart更新为 `true`，确保服务层后续读取最新状态。
        foundStart = true
      }
      // 跳过当前项，继续处理服务层 extract Memories中的下一轮循环。
      continue
    }
    // 满足 `isModelVisibleMessage(message)` 时，服务层 extract Memories执行该分支。
    if (isModelVisibleMessage(message)) {
      // 服务层 extract Memories在这里处理 `n++`，完成这一小步状态转换。
      n++
    }
  }
  // If sinceUuid was not found (e.g., removed by context compaction),
  // fall back to counting all model-visible messages rather than returning 0
  // which would permanently disable extraction for the rest of the session.
  // foundStart缺失时提前走兜底路径，避免服务层 extract Memories继续依赖无效输入。
  if (!foundStart) {
    // 返回 `count(messages, isModelVisibleMessage)`，作为服务层 extract Memories这次计算的结果。
    return count(messages, isModelVisibleMessage)
  }
  // 返回 `n`，作为服务层 extract Memories这次计算的结果。
  return n
}

/**
 * Returns true if any assistant message after the cursor UUID contains a
 * Write/Edit tool_use block targeting an auto-memory path.
 *
 * The main agent's prompt has full save instructions — when it writes
 * memories, the forked extraction is redundant. runExtraction skips the
 * agent and advances the cursor past this range, making the main agent
 * and the background agent mutually exclusive per turn.
 */
// hasMemoryWritesSince 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasMemoryWritesSince(
  messages: Message[],
  sinceUuid: string | undefined,
): boolean {
  // foundStart标记服务层 extract Memories是否启用对应路径。
  let foundStart = sinceUuid === undefined
  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 extract Memories处理。
  for (const message of messages) {
    // foundStart缺失时提前走兜底路径，避免服务层 extract Memories继续依赖无效输入。
    if (!foundStart) {
      // 满足 `message.uuid === sinceUuid` 时，服务层 extract Memories执行该分支。
      if (message.uuid === sinceUuid) {
        // foundStart更新为 `true`，确保服务层后续读取最新状态。
        foundStart = true
      }
      // 跳过当前项，继续处理服务层 extract Memories中的下一轮循环。
      continue
    }
    // `message.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'assistant') {
      // 跳过当前项，继续处理服务层 extract Memories中的下一轮循环。
      continue
    }
    // 文本内容 命名 `(message as AssistantMessage).message.content`，让后续代码直接表达这个值的用途。
    const content = (message as AssistantMessage).message.content
    // 满足 `!Array.isArray(content)` 时，服务层 extract Memories执行该分支。
    if (!Array.isArray(content)) {
      // 跳过当前项，继续处理服务层 extract Memories中的下一轮循环。
      continue
    }
    // 按顺序遍历 `content` 中的block，逐个交给服务层 extract Memories处理。
    for (const block of content) {
      // 文件路径读取`getWrittenFilePath`，供服务层 extract Memories后续处理使用。
      const filePath = getWrittenFilePath(block)
      // `filePath` 与 `undefined && isAutoMemPath(file...` 不一致时刷新派生状态，避免使用过期结果。
      if (filePath !== undefined && isAutoMemPath(filePath)) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// ============================================================================
// Tool Permissions
// ============================================================================

// denyAutoMemTool 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function denyAutoMemTool(tool: Tool, reason: string) {
  // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[autoMem] denied ${tool.name}: ${reason}`)
  // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_auto_mem_tool_denied', {
    tool_name: sanitizeToolNameForAnalytics(tool.name),
  })
  // 返回结构化结果，集中表达服务层 extract Memories已经整理出的状态。
  return {
    behavior: 'deny' as const,
    message: reason,
    decisionReason: { type: 'other' as const, reason },
  }
}

/**
 * Creates a canUseTool function that allows Read/Grep/Glob (unrestricted),
 * read-only Bash commands, and Edit/Write only for paths within the
 * auto-memory directory. Shared by extractMemories and autoDream.
 */
// createAutoMemCanUseTool 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createAutoMemCanUseTool(memoryDir: string): CanUseToolFn {
  // 返回 `async (tool: Tool, input: Record<string, unknown>) => {`，作为服务层 extract Memories这次计算的结果。
  return async (tool: Tool, input: Record<string, unknown>) => {
    // Allow REPL — when REPL mode is enabled (ant-default), primitive tools
    // are hidden from the tool list so the forked agent calls REPL instead.
    // REPL's VM context re-invokes this canUseTool for each inner primitive
    // (toolWrappers.ts createToolWrapper), so the Read/Bash/Edit/Write checks
    // below still gate the actual file and shell operations. Giving the fork a
    // different tool list would break prompt cache sharing (tools are part of
    // the cache key — see CacheSafeParams in forkedAgent.ts).
    // 满足 `tool.name === REPL_TOOL_NAME` 时，服务层 extract Memories执行该分支。
    if (tool.name === REPL_TOOL_NAME) {
      // 返回结构化结果，集中表达服务层 extract Memories已经整理出的状态。
      return { behavior: 'allow' as const, updatedInput: input }
    }

    // Allow Read/Grep/Glob unrestricted — all inherently read-only
    // 服务层 extract Memories在这里进入条件判断，后续代码按实际状态分流。
    if (
      tool.name === FILE_READ_TOOL_NAME ||
      tool.name === GREP_TOOL_NAME ||
      tool.name === GLOB_TOOL_NAME
    ) {
      // 返回结构化结果，集中表达服务层 extract Memories已经整理出的状态。
      return { behavior: 'allow' as const, updatedInput: input }
    }

    // Allow Bash only for commands that pass BashTool.isReadOnly.
    // `tool` IS BashTool here — no static import needed.
    // 满足 `tool.name === BASH_TOOL_NAME` 时，服务层 extract Memories执行该分支。
    if (tool.name === BASH_TOOL_NAME) {
      // 解析结果保存`inputSchema.safeParse`，供服务层 extract Memories后续处理使用。
      const parsed = tool.inputSchema.safeParse(input)
      // 组合条件 `parsed.success && tool.isReadOnly(parsed.data)` 成立时，服务层 extract Memories才启用这条专门路径。
      if (parsed.success && tool.isReadOnly(parsed.data)) {
        // 返回结构化结果，集中表达服务层 extract Memories已经整理出的状态。
        return { behavior: 'allow' as const, updatedInput: input }
      }
      // 返回 `denyAutoMemTool(`，作为服务层 extract Memories这次计算的结果。
      return denyAutoMemTool(
        tool,
        'Only read-only shell commands are permitted in this context (ls, find, grep, cat, stat, wc, head, tail, and similar)',
      )
    }

    // 服务层 extract Memories在这里进入条件判断，后续代码按实际状态分流。
    if (
      (tool.name === FILE_EDIT_TOOL_NAME ||
        tool.name === FILE_WRITE_TOOL_NAME) &&
      'file_path' in input
    ) {
      // 文件路径 命名 `input.file_path`，让后续代码直接表达这个值的用途。
      const filePath = input.file_path
      // 组合条件 `typeof filePath === 'string' && isAutoMemPath(filePath)` 成立时，服务层 extract Memories才启用这条专门路径。
      if (typeof filePath === 'string' && isAutoMemPath(filePath)) {
        // 返回结构化结果，集中表达服务层 extract Memories已经整理出的状态。
        return { behavior: 'allow' as const, updatedInput: input }
      }
    }

    // 返回 `denyAutoMemTool(`，作为服务层 extract Memories这次计算的结果。
    return denyAutoMemTool(
      tool,
      `only ${FILE_READ_TOOL_NAME}, ${GREP_TOOL_NAME}, ${GLOB_TOOL_NAME}, read-only ${BASH_TOOL_NAME}, and ${FILE_EDIT_TOOL_NAME}/${FILE_WRITE_TOOL_NAME} within ${memoryDir} are allowed`,
    )
  }
}

// ============================================================================
// Extract file paths from agent output
// ============================================================================

/**
 * Extract file_path from a tool_use block's input, if present.
 * Returns undefined when the block is not an Edit/Write tool use or has no file_path.
 */
// getWrittenFilePath 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getWrittenFilePath(block: {
  type: string
  name?: string
  input?: unknown
}): string | undefined {
  // 服务层 extract Memories在这里进入条件判断，后续代码按实际状态分流。
  if (
    block.type !== 'tool_use' ||
    (block.name !== FILE_EDIT_TOOL_NAME && block.name !== FILE_WRITE_TOOL_NAME)
  ) {
    // 返回 `undefined`，作为服务层 extract Memories这次计算的结果。
    return undefined
  }
  // 用户输入保存`block.input`，供后续判断或组装使用。
  const input = block.input
  // `typeof input === 'object' && input` 与 `null && 'f` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof input === 'object' && input !== null && 'file_path' in input) {
    // fp保存`(input as { file_path: unknown }).file_path`，供后续判断或组装使用。
    const fp = (input as { file_path: unknown }).file_path
    // 返回 `typeof fp === 'string' ? fp : undefined`，作为服务层 extract Memories这次计算的结果。
    return typeof fp === 'string' ? fp : undefined
  }
  // 返回 `undefined`，作为服务层 extract Memories这次计算的结果。
  return undefined
}

// extractWrittenPaths 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractWrittenPaths(agentMessages: Message[]): string[] {
  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: string[] = []
  // 按顺序遍历 `agentMessages` 中的消息，逐个交给服务层 extract Memories处理。
  for (const message of agentMessages) {
    // `message.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'assistant') {
      // 跳过当前项，继续处理服务层 extract Memories中的下一轮循环。
      continue
    }
    // 文本内容 命名 `(message as AssistantMessage).message.content`，让后续代码直接表达这个值的用途。
    const content = (message as AssistantMessage).message.content
    // 满足 `!Array.isArray(content)` 时，服务层 extract Memories执行该分支。
    if (!Array.isArray(content)) {
      // 跳过当前项，继续处理服务层 extract Memories中的下一轮循环。
      continue
    }
    // 按顺序遍历 `content` 中的block，逐个交给服务层 extract Memories处理。
    for (const block of content) {
      // 文件路径读取`getWrittenFilePath`，供服务层 extract Memories后续处理使用。
      const filePath = getWrittenFilePath(block)
      // `filePath` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (filePath !== undefined) {
        // 路径列表追加新条目，保持收集顺序与输入顺序一致。
        paths.push(filePath)
      }
    }
  }
  // 返回 `uniq(paths)`，作为服务层 extract Memories这次计算的结果。
  return uniq(paths)
}

// ============================================================================
// Initialization & Closure-scoped State
// ============================================================================

// AppendSystemMessageFn 固化服务层 extract Memories里传递的数据形状，帮助调用方按同一结构读写字段。
type AppendSystemMessageFn = (
  msg: Exclude<SystemMessage, SystemLocalCommandMessage>,
) => void

/** The active extractor function, set by initExtractMemories(). */
// 服务层 extract Memories先整理这一处局部数据，后续分支可以直接读取。
let extractor:
  // 服务层 extract Memories在这里处理 `| ((`，完成这一小步状态转换。
  | ((
      context: REPLHookContext,
      appendSystemMessage?: AppendSystemMessageFn,
    ) => Promise<void>)
  | null = null

/** The active drain function, set by initExtractMemories(). No-op until init. */
// 这个回调绑定到 let drainer: (timeoutMs?: number) => Promise<void> = async () => {}，负责服务层 extract Memories在该局部场景下的响应。
let drainer: (timeoutMs?: number) => Promise<void> = async () => {}

/**
 * Initialize the memory extraction system.
 * Creates a fresh closure that captures all mutable state (cursor position,
 * overlap guard, pending context). Call once at startup alongside
 * initConfidenceRating/initPromptCoaching, or per-test in beforeEach.
 */
// initExtractMemories 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initExtractMemories(): void {
  // --- Closure-scoped mutable state ---

  /** Every promise handed out by the extractor that hasn't settled yet.
   *  Coalesced calls that stash-and-return add fast-resolving promises
   *  (harmless); the call that starts real work adds a promise covering the
   *  full trailing-run chain via runExtraction's recursive finally. */
  // inFlightExtractions 集合 命名 `new Set<Promise<void>>()`，让后续代码直接表达这个值的用途。
  const inFlightExtractions = new Set<Promise<void>>()

  /** UUID of the last message processed — cursor so each run only
   *  considers messages added since the previous extraction. */
  // lastMemoryMessageUuid 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastMemoryMessageUuid: string | undefined

  /** One-shot flag: once we log that the gate is disabled, don't repeat. */
  // hasLoggedGateFailure标记服务层 extract Memories是否启用对应路径。
  let hasLoggedGateFailure = false

  /** True while runExtraction is executing — prevents overlapping runs. */
  // inProgress 集合标记服务层 extract Memories是否启用对应路径。
  let inProgress = false

  /** Counts eligible turns since the last extraction run. Resets to 0 after each run. */
  // turnsSinceLastExtraction保存`0`，供服务层 extract Memories后续判断或输出使用。
  let turnsSinceLastExtraction = 0

  /** When a call arrives during an in-progress run, we stash the context here
   *  and run one trailing extraction after the current one finishes. */
  // 服务层 extract Memories先整理这一处局部数据，后续分支可以直接读取。
  let pendingContext:
    | {
        context: REPLHookContext
        appendSystemMessage?: AppendSystemMessageFn
      }
    | undefined

  // --- Inner extraction logic ---

  // runExtraction 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function runExtraction({
    context,
    appendSystemMessage,
    isTrailingRun,
  }: {
    context: REPLHookContext
    appendSystemMessage?: AppendSystemMessageFn
    isTrailingRun?: boolean
  }): Promise<void> {
    // 从 `context` 解构 messages，减少服务层 extract Memories对同一对象的重复访问。
    const { messages } = context
    // memoryDir读取`getAutoMemPath`，供服务层 extract Memories后续处理使用。
    const memoryDir = getAutoMemPath()
    // newMessageCount 消息数据统计`countModelVisibleMessagesSince`，供服务层 extract Memories后续处理使用。
    const newMessageCount = countModelVisibleMessagesSince(
      messages,
      lastMemoryMessageUuid,
    )

    // Mutual exclusion: when the main agent wrote memories, skip the
    // forked agent and advance the cursor past this range so the next
    // extraction only considers messages after the main agent's write.
    // 满足 `hasMemoryWritesSince(messages, lastMemoryMessageUuid)` 时，服务层 extract Memories执行该分支。
    if (hasMemoryWritesSince(messages, lastMemoryMessageUuid)) {
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[extractMemories] skipping — conversation already wrote to memory files',
      )
      // lastMessage 消息数据保存`messages.at`，供服务层 extract Memories后续处理使用。
      const lastMessage = messages.at(-1)
      // 满足 `lastMessage?.uuid` 时，服务层 extract Memories执行该分支。
      if (lastMessage?.uuid) {
        // lastMemoryMessageUuid 消息数据更新为 `lastMessage.uuid`，确保服务层后续读取最新状态。
        lastMemoryMessageUuid = lastMessage.uuid
      }
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_extract_memories_skipped_direct_write', {
        message_count: newMessageCount,
      })
      // 服务层 extract Memories在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // teamMemoryEnabled保存`feature`，供服务层 extract Memories后续处理使用。
    const teamMemoryEnabled = feature('TEAMMEM')
      ? teamMemPaths!.isTeamMemoryEnabled()
      : false

    // skipIndex 索引读取`getFeatureValue_CACHED_MAY_BE_STALE`，供服务层 extract Memories后续处理使用。
    const skipIndex = getFeatureValue_CACHED_MAY_BE_STALE(
      'tengu_moth_copse',
      false,
    )

    // canUseTool记录 `createAutoMemCanUseTool` 是否成立，服务层 extract Memories随后按该结果分支。
    const canUseTool = createAutoMemCanUseTool(memoryDir)
    // cacheSafeParams 缓存构建`createCacheSafeParams`，供服务层 extract Memories后续处理使用。
    const cacheSafeParams = createCacheSafeParams(context)

    // Only run extraction every N eligible turns (tengu_bramble_lintel, default 1).
    // Trailing extractions (from stashed contexts) skip this check since they
    // process already-committed work that should not be throttled.
    // isTrailingRun缺失时提前走兜底路径，避免服务层 extract Memories继续依赖无效输入。
    if (!isTrailingRun) {
      // 服务层 extract Memories在这里处理 `turnsSinceLastExtraction++`，完成这一小步状态转换。
      turnsSinceLastExtraction++
      // 服务层 extract Memories在这里进入条件判断，后续代码按实际状态分流。
      if (
        turnsSinceLastExtraction <
        (getFeatureValue_CACHED_MAY_BE_STALE('tengu_bramble_lintel', null) ?? 1)
      ) {
        // 服务层 extract Memories在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }
    // turnsSinceLastExtraction更新为 `0`，确保服务层后续读取最新状态。
    turnsSinceLastExtraction = 0

    // inProgress 集合更新为 `true`，确保服务层后续读取最新状态。
    inProgress = true
    // startTime记录时间`Date.now`，供服务层 extract Memories后续处理使用。
    const startTime = Date.now()
    // 保护这一段可能失败的服务层 extract Memories操作，确保异常能进入相邻错误处理。
    try {
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[extractMemories] starting — ${newMessageCount} new messages, memoryDir=${memoryDir}`,
      )

      // Pre-inject the memory directory manifest so the agent doesn't spend
      // a turn on `ls`. Reuses findRelevantMemories' frontmatter scan.
      // Placed after the throttle gate so skipped turns don't pay the scan cost.
      // existingMemories 集合格式化`formatMemoryManifest`，供服务层 extract Memories后续处理使用。
      const existingMemories = formatMemoryManifest(
        await scanMemoryFiles(memoryDir, createAbortController().signal),
      )

      // userPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const userPrompt =
        feature('TEAMMEM') && teamMemoryEnabled
          ? buildExtractCombinedPrompt(
              newMessageCount,
              existingMemories,
              skipIndex,
            )
          : buildExtractAutoOnlyPrompt(
              newMessageCount,
              existingMemories,
              skipIndex,
            )

      // 结果保存`runForkedAgent`，供服务层 extract Memories后续处理使用。
      const result = await runForkedAgent({
        promptMessages: [createUserMessage({ content: userPrompt })],
        cacheSafeParams,
        canUseTool,
        querySource: 'extract_memories',
        forkLabel: 'extract_memories',
        // The extractMemories subagent does not need to record to transcript.
        // Doing so can create race conditions with the main thread.
        skipTranscript: true,
        // Well-behaved extractions complete in 2-4 turns (read → write).
        // A hard cap prevents verification rabbit-holes from burning turns.
        maxTurns: 5,
      })

      // Advance the cursor only after a successful run. If the agent errors
      // out (caught below), the cursor stays put so those messages are
      // reconsidered on the next extraction.
      // lastMessage 消息数据保存`messages.at`，供服务层 extract Memories后续处理使用。
      const lastMessage = messages.at(-1)
      // 满足 `lastMessage?.uuid` 时，服务层 extract Memories执行该分支。
      if (lastMessage?.uuid) {
        // lastMemoryMessageUuid 消息数据更新为 `lastMessage.uuid`，确保服务层后续读取最新状态。
        lastMemoryMessageUuid = lastMessage.uuid
      }

      // writtenPaths 路径数据保存`extractWrittenPaths`，供服务层 extract Memories后续处理使用。
      const writtenPaths = extractWrittenPaths(result.messages)
      // turnCount 数量统计`count`，供服务层 extract Memories后续处理使用。
      const turnCount = count(result.messages, m => m.type === 'assistant')

      // totalInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const totalInput =
        result.totalUsage.input_tokens +
        result.totalUsage.cache_creation_input_tokens +
        result.totalUsage.cache_read_input_tokens
      // hitPct 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const hitPct =
        totalInput > 0
          ? (
              (result.totalUsage.cache_read_input_tokens / totalInput) *
              100
            ).toFixed(1)
          : '0.0'
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[extractMemories] finished — ${writtenPaths.length} files written, cache: read=${result.totalUsage.cache_read_input_tokens} create=${result.totalUsage.cache_creation_input_tokens} input=${result.totalUsage.input_tokens} (${hitPct}% hit)`,
      )

      // 满足 `writtenPaths.length > 0` 时，服务层 extract Memories执行该分支。
      if (writtenPaths.length > 0) {
        // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[extractMemories] memories saved: ${writtenPaths.join(', ')}`,
        )
      } else {
        // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[extractMemories] no memories saved this run')
      }

      // Index file updates are mechanical — the agent touches MEMORY.md to add
      // a topic link, but the user-visible "memory" is the topic file itself.
      // memoryPaths 路径数据筛选`writtenPaths.filter`，供服务层 extract Memories后续处理使用。
      const memoryPaths = writtenPaths.filter(
        // p更新为 `> basename(p) !== ENTRYPOINT_NAME`，确保服务层后续读取最新状态。
        p => basename(p) !== ENTRYPOINT_NAME,
      )
      // teamCount 数量保存`feature`，供服务层 extract Memories后续处理使用。
      const teamCount = feature('TEAMMEM')
        ? count(memoryPaths, teamMemPaths!.isTeamMemPath)
        : 0

      // Log extraction event with usage from the forked agent
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_extract_memories_extraction', {
        input_tokens: result.totalUsage.input_tokens,
        output_tokens: result.totalUsage.output_tokens,
        cache_read_input_tokens: result.totalUsage.cache_read_input_tokens,
        cache_creation_input_tokens:
          result.totalUsage.cache_creation_input_tokens,
        message_count: newMessageCount,
        turn_count: turnCount,
        files_written: writtenPaths.length,
        memories_saved: memoryPaths.length,
        team_memories_saved: teamCount,
        duration_ms: Date.now() - startTime,
      })

      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[extractMemories] writtenPaths=${writtenPaths.length} memoryPaths=${memoryPaths.length} appendSystemMessage defined=${appendSystemMessage != null}`,
      )
      // 满足 `memoryPaths.length > 0` 时，服务层 extract Memories执行该分支。
      if (memoryPaths.length > 0) {
        // 消息构建`createMemorySavedMessage`，供服务层 extract Memories后续处理使用。
        const msg = createMemorySavedMessage(memoryPaths)
        // 满足 `feature('TEAMMEM')` 时，服务层 extract Memories执行该分支。
        if (feature('TEAMMEM')) {
          // teamCount 数量更新为 `teamCount`，确保服务层后续读取最新状态。
          msg.teamCount = teamCount
        }
        // 调用 appendSystemMessage?.(msg)，完成这一处局部操作。
        appendSystemMessage?.(msg)
      }
    } catch (error) {
      // Extraction is best-effort — log but don't notify on error
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[extractMemories] error: ${error}`)
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_extract_memories_error', {
        duration_ms: Date.now() - startTime,
      })
    } finally {
      // inProgress 集合更新为 `false`，确保服务层后续读取最新状态。
      inProgress = false

      // If a call arrived while we were running, run a trailing extraction
      // with the latest stashed context. The trailing run will compute its
      // newMessageCount relative to the cursor we just advanced — so it only
      // picks up messages added between the two calls, not the full history.
      // trailing保存`pendingContext`，供服务层 extract Memories后续判断或输出使用。
      const trailing = pendingContext
      // pendingContext更新为 `undefined`，确保服务层后续读取最新状态。
      pendingContext = undefined
      // 满足 `trailing` 时，服务层 extract Memories执行该分支。
      if (trailing) {
        // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[extractMemories] running trailing extraction for stashed context',
        )
        // 等待 `runExtraction({` 完成，再继续服务层 extract Memories的异步流程。
        await runExtraction({
          context: trailing.context,
          appendSystemMessage: trailing.appendSystemMessage,
          isTrailingRun: true,
        })
      }
    }
  }

  // --- Public entry point (captured by extractor) ---

  // executeExtractMemoriesImpl 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function executeExtractMemoriesImpl(
    context: REPLHookContext,
    appendSystemMessage?: AppendSystemMessageFn,
  ): Promise<void> {
    // Only run for the main agent, not subagents
    // 满足 `context.toolUseContext.agentId` 时，服务层 extract Memories执行该分支。
    if (context.toolUseContext.agentId) {
      // 服务层 extract Memories在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_passport_quail', false)` 时，服务层 extract Memories执行该分支。
    if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_passport_quail', false)) {
      // 组合条件 `process.env.USER_TYPE === 'ant' && !hasLoggedGate` 成立时，服务层 extract Memories才启用这条专门路径。
      if (process.env.USER_TYPE === 'ant' && !hasLoggedGateFailure) {
        // hasLoggedGateFailure更新为 `true`，确保服务层后续读取最新状态。
        hasLoggedGateFailure = true
        // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_extract_memories_gate_disabled', {})
      }
      // 服务层 extract Memories在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check auto-memory is enabled
    // 满足 `!isAutoMemoryEnabled()` 时，服务层 extract Memories执行该分支。
    if (!isAutoMemoryEnabled()) {
      // 服务层 extract Memories在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Skip in remote mode
    // 满足 `getIsRemoteMode()` 时，服务层 extract Memories执行该分支。
    if (getIsRemoteMode()) {
      // 服务层 extract Memories在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // If an extraction is already in progress, stash this context for a
    // trailing run (overwrites any previously stashed context — only the
    // latest matters since it has the most messages).
    // 满足 `inProgress` 时，服务层 extract Memories执行该分支。
    if (inProgress) {
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[extractMemories] extraction in progress — stashing for trailing run',
      )
      // 记录服务层 extract Memories运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_extract_memories_coalesced', {})
      // pendingContext更新为 `{ context, appendSystemMessage }`，确保服务层后续读取最新状态。
      pendingContext = { context, appendSystemMessage }
      // 服务层 extract Memories在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 等待 `runExtraction({ context, appendSystemMessage })` 完成，再继续服务层 extract Memories的异步流程。
    await runExtraction({ context, appendSystemMessage })
  }

  // extractor更新为 `async (context, appendSystemMessage) => {`，确保服务层后续读取最新状态。
  extractor = async (context, appendSystemMessage) => {
    // p保存`executeExtractMemoriesImpl`，供服务层 extract Memories后续处理使用。
    const p = executeExtractMemoriesImpl(context, appendSystemMessage)
    // 调用 inFlightExtractions.add，触发服务层 extract Memories此处需要的副作用。
    inFlightExtractions.add(p)
    // 保护这一段可能失败的服务层 extract Memories操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `p` 完成，再继续服务层 extract Memories的异步流程。
      await p
    } finally {
      // 调用 inFlightExtractions.delete，触发服务层 extract Memories此处需要的副作用。
      inFlightExtractions.delete(p)
    }
  }

  // drainer更新为 `async (timeoutMs = 60_000) => {`，确保服务层后续读取最新状态。
  drainer = async (timeoutMs = 60_000) => {
    // 满足 `inFlightExtractions.size === 0` 时，服务层 extract Memories执行该分支。
    if (inFlightExtractions.size === 0) return
    // 等待 `Promise.race([` 完成，再继续服务层 extract Memories的异步流程。
    await Promise.race([
      // 调用 Promise.all，触发服务层 extract Memories此处需要的副作用。
      Promise.all(inFlightExtractions).catch(() => {}),
      // eslint-disable-next-line no-restricted-syntax -- sleep() has no .unref(); timer must not block exit
      // 这个回调绑定到 new Promise<void>(r => setTimeout(r, timeoutMs).unref()),，负责服务层 extract Memories在该局部场景下的响应。
      new Promise<void>(r => setTimeout(r, timeoutMs).unref()),
    ])
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Run memory extraction at the end of a query loop.
 * Called fire-and-forget from handleStopHooks, alongside prompt suggestion/coaching.
 * No-ops until initExtractMemories() has been called.
 */
// executeExtractMemories 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function executeExtractMemories(
  context: REPLHookContext,
  appendSystemMessage?: AppendSystemMessageFn,
): Promise<void> {
  // 等待 `extractor?.(context, appendSystemMessage)` 完成，再继续服务层 extract Memories的异步流程。
  await extractor?.(context, appendSystemMessage)
}

/**
 * Awaits all in-flight extractions (including trailing stashed runs) with a
 * soft timeout. Called by print.ts after the response is flushed but before
 * gracefulShutdownSync, so the forked agent completes before the 5s shutdown
 * failsafe kills it. No-op until initExtractMemories() has been called.
 */
// drainPendingExtraction 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function drainPendingExtraction(
  timeoutMs?: number,
): Promise<void> {
  // 等待 `drainer(timeoutMs)` 完成，再继续服务层 extract Memories的异步流程。
  await drainer(timeoutMs)
}
