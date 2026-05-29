/**
 * Session Memory automatically maintains a markdown file with notes about the current conversation.
 * It runs periodically in the background using a forked subagent to extract key information
 * without interrupting the main conversation flow.
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { writeFile } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 引入 getSystemPrompt，将 ../../constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { getSystemPrompt } from '../../constants/prompts.js'
// 引入 getSystemContext、getUserContext，将 ../../context.js 中已经封装好的能力接到本文件流程里。
import { getSystemContext, getUserContext } from '../../context.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准服务层 session Memory的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 类型依赖 { Tool, ToolUseContext } 来自 ../../Tool.js，用于校准服务层 session Memory的数据契约。
import type { Tool, ToolUseContext } from '../../Tool.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  FileReadTool,
  type Output as FileReadToolOutput,
} from '../../tools/FileReadTool/FileReadTool.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准服务层 session Memory的数据契约。
import type { Message } from '../../types/message.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  createCacheSafeParams,
  createSubagentContext,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  type REPLHookContext,
  registerPostSamplingHook,
} from '../../utils/hooks/postSamplingHooks.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  hasToolCallsInLastAssistantTurn,
} from '../../utils/messages.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  getSessionMemoryDir,
  getSessionMemoryPath,
} from '../../utils/permissions/filesystem.js'
// 复用 sequential 工具函数，把通用处理留在 ../../utils/sequential.js 中维护。
import { sequential } from '../../utils/sequential.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js'
// 复用 getTokenUsage、tokenCountWithEstimation 工具函数，把通用处理留在 ../../utils/tokens.js 中维护。
import { getTokenUsage, tokenCountWithEstimation } from '../../utils/tokens.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 引入 isAutoCompactEnabled，将 ../compact/autoCompact.js 中已经封装好的能力接到本文件流程里。
import { isAutoCompactEnabled } from '../compact/autoCompact.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  buildSessionMemoryUpdatePrompt,
  loadSessionMemoryTemplate,
} from './prompts.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  DEFAULT_SESSION_MEMORY_CONFIG,
  getSessionMemoryConfig,
  getToolCallsBetweenUpdates,
  hasMetInitializationThreshold,
  hasMetUpdateThreshold,
  isSessionMemoryInitialized,
  markExtractionCompleted,
  markExtractionStarted,
  markSessionMemoryInitialized,
  recordExtractionTokenCount,
  type SessionMemoryConfig,
  setLastSummarizedMessageId,
  setSessionMemoryConfig,
} from './sessionMemoryUtils.js'

// ============================================================================
// Feature Gate and Config (Cached - Non-blocking)
// ============================================================================
// These functions return cached values from disk immediately without blocking
// on GrowthBook initialization. Values may be stale but are updated in background.

// 复用 errorMessage、getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage, getErrnoCode } from '../../utils/errors.js'
// 整理这一组导入，让服务层 session Memory后续逻辑可以直接复用这些外部能力。
import {
  getDynamicConfig_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from '../analytics/growthbook.js'

/**
 * Check if session memory feature is enabled.
 * Uses cached gate value - returns immediately without blocking.
 */
// isSessionMemoryGateEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSessionMemoryGateEnabled(): boolean {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_session_memory', false)`，作为服务层 session Memory这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_session_memory', false)
}

/**
 * Get session memory config from cache.
 * Returns immediately without blocking - value may be stale.
 */
// getSessionMemoryRemoteConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSessionMemoryRemoteConfig(): Partial<SessionMemoryConfig> {
  // 返回 `getDynamicConfig_CACHED_MAY_BE_STALE<Partial<SessionMemoryConfig>>(`，作为服务层 session Memory这次计算的结果。
  return getDynamicConfig_CACHED_MAY_BE_STALE<Partial<SessionMemoryConfig>>(
    'tengu_sm_config',
    {},
  )
}

// ============================================================================
// Module State
// ============================================================================

// lastMemoryMessageUuid 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
let lastMemoryMessageUuid: string | undefined

/**
 * Reset the last memory message UUID (for testing)
 */
// resetLastMemoryMessageUuid 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetLastMemoryMessageUuid(): void {
  // lastMemoryMessageUuid 消息数据更新为 `undefined`，确保服务层后续读取最新状态。
  lastMemoryMessageUuid = undefined
}

// countToolCallsSince 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countToolCallsSince(
  messages: Message[],
  sinceUuid: string | undefined,
): number {
  // toolCallCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let toolCallCount = 0
  // foundStart标记服务层 session Memory是否启用对应路径。
  let foundStart = sinceUuid === null || sinceUuid === undefined

  // 按顺序遍历 `messages` 中的消息，逐个交给服务层 session Memory处理。
  for (const message of messages) {
    // foundStart缺失时提前走兜底路径，避免服务层 session Memory继续依赖无效输入。
    if (!foundStart) {
      // 满足 `message.uuid === sinceUuid` 时，服务层 session Memory执行该分支。
      if (message.uuid === sinceUuid) {
        // foundStart更新为 `true`，确保服务层后续读取最新状态。
        foundStart = true
      }
      // 跳过当前项，继续处理服务层 session Memory中的下一轮循环。
      continue
    }

    // 当 `message.type` 匹配 `'assistant'` 时，服务层 session Memory执行对应分支。
    if (message.type === 'assistant') {
      // 文本内容保存`message.message.content`，供后续判断或组装使用。
      const content = message.message.content
      // 满足 `Array.isArray(content)` 时，服务层 session Memory执行该分支。
      if (Array.isArray(content)) {
        // 这个回调绑定到 toolCallCount += count(content, block => block.type === 'tool_use')，负责服务层 session Memory在该局部场景下的响应。
        toolCallCount += count(content, block => block.type === 'tool_use')
      }
    }
  }

  // 返回 `toolCallCount`，作为服务层 session Memory这次计算的结果。
  return toolCallCount
}

// shouldExtractMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldExtractMemory(messages: Message[]): boolean {
  // Check if we've met the initialization threshold
  // Uses total context window tokens (same as autocompact) for consistent behavior
  // currentTokenCount 数量保存`tokenCountWithEstimation`，供服务层 session Memory后续处理使用。
  const currentTokenCount = tokenCountWithEstimation(messages)
  // 满足 `!isSessionMemoryInitialized()` 时，服务层 session Memory执行该分支。
  if (!isSessionMemoryInitialized()) {
    // 满足 `!hasMetInitializationThreshold(currentTokenCount)` 时，服务层 session Memory执行该分支。
    if (!hasMetInitializationThreshold(currentTokenCount)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 调用 markSessionMemoryInitialized，触发服务层 session Memory此处需要的副作用。
    markSessionMemoryInitialized()
  }

  // Check if we've met the minimum tokens between updates threshold
  // Uses context window growth since last extraction (same metric as init threshold)
  // hasMetTokenThreshold记录 `hasMetUpdateThreshold` 是否成立，服务层 session Memory随后按该结果分支。
  const hasMetTokenThreshold = hasMetUpdateThreshold(currentTokenCount)

  // Check if we've met the tool calls threshold
  // toolCallsSinceLastUpdate统计`countToolCallsSince`，供服务层 session Memory后续处理使用。
  const toolCallsSinceLastUpdate = countToolCallsSince(
    messages,
    lastMemoryMessageUuid,
  )
  // hasMetToolCallThreshold 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasMetToolCallThreshold =
    toolCallsSinceLastUpdate >= getToolCallsBetweenUpdates()

  // Check if the last assistant turn has no tool calls (safe to extract)
  // hasToolCallsInLastTurn记录 `hasToolCallsInLastAssistantTurn` 是否成立，服务层 session Memory随后按该结果分支。
  const hasToolCallsInLastTurn = hasToolCallsInLastAssistantTurn(messages)

  // Trigger extraction when:
  // 1. Both thresholds are met (tokens AND tool calls), OR
  // 2. No tool calls in last turn AND token threshold is met
  //    (to ensure we extract at natural conversation breaks)
  //
  // IMPORTANT: The token threshold (minimumTokensBetweenUpdate) is ALWAYS required.
  // Even if the tool call threshold is met, extraction won't happen until the
  // token threshold is also satisfied. This prevents excessive extractions.
  // shouldExtract 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldExtract =
    (hasMetTokenThreshold && hasMetToolCallThreshold) ||
    (hasMetTokenThreshold && !hasToolCallsInLastTurn)

  // 满足 `shouldExtract` 时，服务层 session Memory执行该分支。
  if (shouldExtract) {
    // lastMessage 消息数据 命名 `messages[messages.length - 1]`，让后续代码直接表达这个值的用途。
    const lastMessage = messages[messages.length - 1]
    // 满足 `lastMessage?.uuid` 时，服务层 session Memory执行该分支。
    if (lastMessage?.uuid) {
      // lastMemoryMessageUuid 消息数据更新为 `lastMessage.uuid`，确保服务层后续读取最新状态。
      lastMemoryMessageUuid = lastMessage.uuid
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// setupSessionMemoryFile 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function setupSessionMemoryFile(
  toolUseContext: ToolUseContext,
): Promise<{ memoryPath: string; currentMemory: string }> {
  // fs 集合读取`getFsImplementation`，供服务层 session Memory后续处理使用。
  const fs = getFsImplementation()

  // Set up directory and file
  // sessionMemoryDir 会话数据读取`getSessionMemoryDir`，供服务层 session Memory后续处理使用。
  const sessionMemoryDir = getSessionMemoryDir()
  // 等待 `fs.mkdir(sessionMemoryDir, { mode: 0o700 })` 完成，再继续服务层 session Memory的异步流程。
  await fs.mkdir(sessionMemoryDir, { mode: 0o700 })

  // memoryPath 路径数据读取`getSessionMemoryPath`，供服务层 session Memory后续处理使用。
  const memoryPath = getSessionMemoryPath()

  // Create the memory file if it doesn't exist (wx = O_CREAT|O_EXCL)
  // 保护这一段可能失败的服务层 session Memory操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(memoryPath, '', {` 完成，再继续服务层 session Memory的异步流程。
    await writeFile(memoryPath, '', {
      encoding: 'utf-8',
      mode: 0o600,
      flag: 'wx',
    })
    // Only load template if file was just created
    // template读取`loadSessionMemoryTemplate`，供服务层 session Memory后续处理使用。
    const template = await loadSessionMemoryTemplate()
    // 等待 `writeFile(memoryPath, template, {` 完成，再继续服务层 session Memory的异步流程。
    await writeFile(memoryPath, template, {
      encoding: 'utf-8',
      mode: 0o600,
    })
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供服务层 session Memory后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'EEXIST') {
      // 抛出 e，阻止服务层 session Memory在无效状态下继续运行。
      throw e
    }
  }

  // Drop any cached entry so FileReadTool's dedup doesn't return a
  // file_unchanged stub — we need the actual content. The Read repopulates it.
  // 调用 toolUseContext.readFileState.delete，触发服务层 session Memory此处需要的副作用。
  toolUseContext.readFileState.delete(memoryPath)
  // 结果保存`FileReadTool.call`，供服务层 session Memory后续处理使用。
  const result = await FileReadTool.call(
    { file_path: memoryPath },
    toolUseContext,
  )
  // currentMemory 命名 `''`，让后续代码直接表达这个值的用途。
  let currentMemory = ''

  // output 命名 `result.data as FileReadToolOutput`，让后续代码直接表达这个值的用途。
  const output = result.data as FileReadToolOutput
  // 当 `output.type` 匹配 `'text'` 时，服务层 session Memory执行对应分支。
  if (output.type === 'text') {
    // currentMemory更新为 `output.file.content`，确保服务层后续读取最新状态。
    currentMemory = output.file.content
  }

  // 记录服务层 session Memory运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_session_memory_file_read', {
    content_length: currentMemory.length,
  })

  // 返回结构化结果，集中表达服务层 session Memory已经整理出的状态。
  return { memoryPath, currentMemory }
}

/**
 * Initialize session memory config from remote config (lazy initialization).
 * Memoized - only runs once per session, subsequent calls return immediately.
 * Uses cached config values - non-blocking.
 */
// initSessionMemoryConfigIfNeeded 会话数据保存`memoize`，供服务层 session Memory后续处理使用。
const initSessionMemoryConfigIfNeeded = memoize((): void => {
  // Load config from cache (non-blocking, may be stale)
  // remoteConfig 配置读取`getSessionMemoryRemoteConfig`，供服务层 session Memory后续处理使用。
  const remoteConfig = getSessionMemoryRemoteConfig()

  // Only use remote values if they are explicitly set (non-zero positive numbers)
  // This ensures sensible defaults aren't overridden by zero values
  // 配置 集中保存服务层 session Memory要一起传递的字段。
  const config: SessionMemoryConfig = {
    minimumMessageTokensToInit:
      remoteConfig.minimumMessageTokensToInit &&
      remoteConfig.minimumMessageTokensToInit > 0
        ? remoteConfig.minimumMessageTokensToInit
        : DEFAULT_SESSION_MEMORY_CONFIG.minimumMessageTokensToInit,
    minimumTokensBetweenUpdate:
      remoteConfig.minimumTokensBetweenUpdate &&
      remoteConfig.minimumTokensBetweenUpdate > 0
        ? remoteConfig.minimumTokensBetweenUpdate
        : DEFAULT_SESSION_MEMORY_CONFIG.minimumTokensBetweenUpdate,
    toolCallsBetweenUpdates:
      remoteConfig.toolCallsBetweenUpdates &&
      remoteConfig.toolCallsBetweenUpdates > 0
        ? remoteConfig.toolCallsBetweenUpdates
        : DEFAULT_SESSION_MEMORY_CONFIG.toolCallsBetweenUpdates,
  }
  // setSessionMemoryConfig 写入新的状态值，使服务层 session Memory后续读取保持一致。
  setSessionMemoryConfig(config)
})

/**
 * Session memory post-sampling hook that extracts and updates session notes
 */
// Track if we've logged the gate check failure this session (to avoid spam)
// hasLoggedGateFailure标记服务层 session Memory是否启用对应路径。
let hasLoggedGateFailure = false

// extractSessionMemory 会话数据保存`sequential`，供服务层 session Memory后续处理使用。
const extractSessionMemory = sequential(async function (
  context: REPLHookContext,
): Promise<void> {
  // 从 `context` 解构 messages、toolUseContext、querySource，减少服务层 session Memory对同一对象的重复访问。
  const { messages, toolUseContext, querySource } = context

  // Only run session memory on main REPL thread
  // `querySource` 与 `'repl_main_thread'` 不一致时刷新派生状态，避免使用过期结果。
  if (querySource !== 'repl_main_thread') {
    // Don't log this - it's expected for subagents, teammates, etc.
    // 服务层 session Memory在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check gate lazily when hook runs (cached, non-blocking)
  // 满足 `!isSessionMemoryGateEnabled()` 时，服务层 session Memory执行该分支。
  if (!isSessionMemoryGateEnabled()) {
    // Log gate failure once per session (ant-only)
    // 组合条件 `process.env.USER_TYPE === 'ant' && !hasLoggedGate` 成立时，服务层 session Memory才启用这条专门路径。
    if (process.env.USER_TYPE === 'ant' && !hasLoggedGateFailure) {
      // hasLoggedGateFailure更新为 `true`，确保服务层后续读取最新状态。
      hasLoggedGateFailure = true
      // 记录服务层 session Memory运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_session_memory_gate_disabled', {})
    }
    // 服务层 session Memory在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Initialize config from remote (lazy, only once)
  // 调用 initSessionMemoryConfigIfNeeded，触发服务层 session Memory此处需要的副作用。
  initSessionMemoryConfigIfNeeded()

  // 满足 `!shouldExtractMemory(messages)` 时，服务层 session Memory执行该分支。
  if (!shouldExtractMemory(messages)) {
    // 服务层 session Memory在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 markExtractionStarted，触发服务层 session Memory此处需要的副作用。
  markExtractionStarted()

  // Create isolated context for setup to avoid polluting parent's cache
  // setupContext构建`createSubagentContext`，供服务层 session Memory后续处理使用。
  const setupContext = createSubagentContext(toolUseContext)

  // Set up file system and read current state with isolated context
  // 服务层 session Memory先整理这一处局部数据，后续分支可以直接读取。
  const { memoryPath, currentMemory } =
    await setupSessionMemoryFile(setupContext)

  // Create extraction message
  // userPrompt构建`buildSessionMemoryUpdatePrompt`，供服务层 session Memory后续处理使用。
  const userPrompt = await buildSessionMemoryUpdatePrompt(
    currentMemory,
    memoryPath,
  )

  // Run session memory extraction using runForkedAgent for prompt caching
  // runForkedAgent creates an isolated context to prevent mutation of parent state
  // Pass setupContext.readFileState so the forked agent can edit the memory file
  // 等待 `runForkedAgent({` 完成，再继续服务层 session Memory的异步流程。
  await runForkedAgent({
    promptMessages: [createUserMessage({ content: userPrompt })],
    cacheSafeParams: createCacheSafeParams(context),
    canUseTool: createMemoryFileCanUseTool(memoryPath),
    querySource: 'session_memory',
    forkLabel: 'session_memory',
    overrides: { readFileState: setupContext.readFileState },
  })

  // Log extraction event for tracking frequency
  // Use the token usage from the last message in the conversation
  // lastMessage 消息数据 命名 `messages[messages.length - 1]`，让后续代码直接表达这个值的用途。
  const lastMessage = messages[messages.length - 1]
  // usage读取`getTokenUsage`，供服务层 session Memory后续处理使用。
  const usage = lastMessage ? getTokenUsage(lastMessage) : undefined
  // 配置读取`getSessionMemoryConfig`，供服务层 session Memory后续处理使用。
  const config = getSessionMemoryConfig()
  // 记录服务层 session Memory运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_session_memory_extraction', {
    input_tokens: usage?.input_tokens,
    output_tokens: usage?.output_tokens,
    cache_read_input_tokens: usage?.cache_read_input_tokens ?? undefined,
    cache_creation_input_tokens:
      usage?.cache_creation_input_tokens ?? undefined,
    config_min_message_tokens_to_init: config.minimumMessageTokensToInit,
    config_min_tokens_between_update: config.minimumTokensBetweenUpdate,
    config_tool_calls_between_updates: config.toolCallsBetweenUpdates,
  })

  // Record the context size at extraction for tracking minimumTokensBetweenUpdate
  // 调用 recordExtractionTokenCount，触发服务层 session Memory此处需要的副作用。
  recordExtractionTokenCount(tokenCountWithEstimation(messages))

  // Update lastSummarizedMessageId after successful completion
  // 调用 updateLastSummarizedMessageIdIfSafe，触发服务层 session Memory此处需要的副作用。
  updateLastSummarizedMessageIdIfSafe(messages)

  // 调用 markExtractionCompleted，触发服务层 session Memory此处需要的副作用。
  markExtractionCompleted()
})

/**
 * Initialize session memory by registering the post-sampling hook.
 * This is synchronous to avoid race conditions during startup.
 * The gate check and config loading happen lazily when the hook runs.
 */
// initSessionMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initSessionMemory(): void {
  // 满足 `getIsRemoteMode()` 时，服务层 session Memory执行该分支。
  if (getIsRemoteMode()) return
  // Session memory is used for compaction, so respect auto-compact settings
  // autoCompactEnabled保存`isAutoCompactEnabled`，供服务层 session Memory后续处理使用。
  const autoCompactEnabled = isAutoCompactEnabled()

  // Log initialization state (ant-only to avoid noise in external logs)
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 session Memory执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 记录服务层 session Memory运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_session_memory_init', {
      auto_compact_enabled: autoCompactEnabled,
    })
  }

  // autoCompactEnabled缺失时提前走兜底路径，避免服务层 session Memory继续依赖无效输入。
  if (!autoCompactEnabled) {
    // 服务层 session Memory在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Register hook unconditionally - gate check happens lazily when hook runs
  // 调用 registerPostSamplingHook，触发服务层 session Memory此处需要的副作用。
  registerPostSamplingHook(extractSessionMemory)
}

// ManualExtractionResult 固化服务层 session Memory里传递的数据形状，帮助调用方按同一结构读写字段。
export type ManualExtractionResult = {
  success: boolean
  memoryPath?: string
  error?: string
}

/**
 * Manually trigger session memory extraction, bypassing threshold checks.
 * Used by the /summary command.
 */
// manuallyExtractSessionMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function manuallyExtractSessionMemory(
  messages: Message[],
  toolUseContext: ToolUseContext,
): Promise<ManualExtractionResult> {
  // 对话消息为空时立即返回或跳过，避免服务层 session Memory把空集合当成可处理内容。
  if (messages.length === 0) {
    // 返回结构化结果，集中表达服务层 session Memory已经整理出的状态。
    return { success: false, error: 'No messages to summarize' }
  }
  // 调用 markExtractionStarted，触发服务层 session Memory此处需要的副作用。
  markExtractionStarted()

  // 保护这一段可能失败的服务层 session Memory操作，确保异常能进入相邻错误处理。
  try {
    // Create isolated context for setup to avoid polluting parent's cache
    // setupContext构建`createSubagentContext`，供服务层 session Memory后续处理使用。
    const setupContext = createSubagentContext(toolUseContext)

    // Set up file system and read current state with isolated context
    // 服务层 session Memory先整理这一处局部数据，后续分支可以直接读取。
    const { memoryPath, currentMemory } =
      await setupSessionMemoryFile(setupContext)

    // Create extraction message
    // userPrompt构建`buildSessionMemoryUpdatePrompt`，供服务层 session Memory后续处理使用。
    const userPrompt = await buildSessionMemoryUpdatePrompt(
      currentMemory,
      memoryPath,
    )

    // Get system prompt for cache-safe params
    // 从 `toolUseContext.options` 解构 tools、mainLoopModel，减少服务层 session Memory对同一对象的重复访问。
    const { tools, mainLoopModel } = toolUseContext.options
    // 并行获取 rawSystemPrompt、userContext、systemContext，缩短服务层 session Memory等待多个独立异步任务的时间。
    const [rawSystemPrompt, userContext, systemContext] = await Promise.all([
      getSystemPrompt(tools, mainLoopModel),
      getUserContext(),
      getSystemContext(),
    ])
    // 系统提示词保存`asSystemPrompt`，供服务层 session Memory后续处理使用。
    const systemPrompt = asSystemPrompt(rawSystemPrompt)

    // Run session memory extraction using runForkedAgent
    // 等待 `runForkedAgent({` 完成，再继续服务层 session Memory的异步流程。
    await runForkedAgent({
      promptMessages: [createUserMessage({ content: userPrompt })],
      cacheSafeParams: {
        systemPrompt,
        userContext,
        systemContext,
        toolUseContext: setupContext,
        forkContextMessages: messages,
      },
      canUseTool: createMemoryFileCanUseTool(memoryPath),
      querySource: 'session_memory',
      forkLabel: 'session_memory_manual',
      overrides: { readFileState: setupContext.readFileState },
    })

    // Log manual extraction event
    // 记录服务层 session Memory运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_session_memory_manual_extraction', {})

    // Record the context size at extraction for tracking minimumTokensBetweenUpdate
    // 调用 recordExtractionTokenCount，触发服务层 session Memory此处需要的副作用。
    recordExtractionTokenCount(tokenCountWithEstimation(messages))

    // Update lastSummarizedMessageId after successful completion
    // 调用 updateLastSummarizedMessageIdIfSafe，触发服务层 session Memory此处需要的副作用。
    updateLastSummarizedMessageIdIfSafe(messages)

    // 返回结构化结果，集中表达服务层 session Memory已经整理出的状态。
    return { success: true, memoryPath }
  } catch (error) {
    // 返回结构化结果，集中表达服务层 session Memory已经整理出的状态。
    return {
      success: false,
      error: errorMessage(error),
    }
  } finally {
    // 调用 markExtractionCompleted，触发服务层 session Memory此处需要的副作用。
    markExtractionCompleted()
  }
}

// Helper functions

/**
 * Creates a canUseTool function that only allows Edit for the exact memory file.
 */
// createMemoryFileCanUseTool 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createMemoryFileCanUseTool(memoryPath: string): CanUseToolFn {
  // 返回 `async (tool: Tool, input: unknown) => {`，作为服务层 session Memory这次计算的结果。
  return async (tool: Tool, input: unknown) => {
    // 服务层 session Memory在这里进入条件判断，后续代码按实际状态分流。
    if (
      tool.name === FILE_EDIT_TOOL_NAME &&
      typeof input === 'object' &&
      input !== null &&
      'file_path' in input
    ) {
      // 文件路径 命名 `input.file_path`，让后续代码直接表达这个值的用途。
      const filePath = input.file_path
      // 组合条件 `typeof filePath === 'string' && filePath === memo` 成立时，服务层 session Memory才启用这条专门路径。
      if (typeof filePath === 'string' && filePath === memoryPath) {
        // 返回结构化结果，集中表达服务层 session Memory已经整理出的状态。
        return { behavior: 'allow' as const, updatedInput: input }
      }
    }
    // 返回结构化结果，集中表达服务层 session Memory已经整理出的状态。
    return {
      behavior: 'deny' as const,
      message: `only ${FILE_EDIT_TOOL_NAME} on ${memoryPath} is allowed`,
      decisionReason: {
        type: 'other' as const,
        reason: `only ${FILE_EDIT_TOOL_NAME} on ${memoryPath} is allowed`,
      },
    }
  }
}

/**
 * Updates lastSummarizedMessageId after successful extraction.
 * Only sets it if the last message doesn't have tool calls (to avoid orphaned tool_results).
 */
// updateLastSummarizedMessageIdIfSafe 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function updateLastSummarizedMessageIdIfSafe(messages: Message[]): void {
  // 满足 `!hasToolCallsInLastAssistantTurn(messages)` 时，服务层 session Memory执行该分支。
  if (!hasToolCallsInLastAssistantTurn(messages)) {
    // lastMessage 消息数据 命名 `messages[messages.length - 1]`，让后续代码直接表达这个值的用途。
    const lastMessage = messages[messages.length - 1]
    // 满足 `lastMessage?.uuid` 时，服务层 session Memory执行该分支。
    if (lastMessage?.uuid) {
      // setLastSummarizedMessageId 写入新的状态值，使服务层 session Memory后续读取保持一致。
      setLastSummarizedMessageId(lastMessage.uuid)
    }
  }
}
