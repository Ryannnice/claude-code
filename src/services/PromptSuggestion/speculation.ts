// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { rm } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { appendFile, copyFile, mkdir } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, isAbsolute, join, relative } from 'path'
// 引入 getCwdState，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getCwdState } from '../../bootstrap/state.js'
// 类型依赖 { CompletionBoundary } 来自 ../../state/AppStateStore.js，用于校准服务层 speculation的数据契约。
import type { CompletionBoundary } from '../../state/AppStateStore.js'
// 整理这一组导入，让服务层 speculation后续逻辑可以直接复用这些外部能力。
import {
  type AppState,
  IDLE_SPECULATION_STATE,
  type SpeculationResult,
  type SpeculationState,
} from '../../state/AppStateStore.js'
// 接入 commandHasAnyCd 工具实现，后续工具池会按权限和开关决定是否暴露。
import { commandHasAnyCd } from '../../tools/BashTool/bashPermissions.js'
// 接入 checkReadOnlyConstraints 工具实现，后续工具池会按权限和开关决定是否暴露。
import { checkReadOnlyConstraints } from '../../tools/BashTool/readOnlyValidation.js'
// 类型依赖 { SpeculationAcceptMessage } 来自 ../../types/logs.js，用于校准服务层 speculation的数据契约。
import type { SpeculationAcceptMessage } from '../../types/logs.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准服务层 speculation的数据契约。
import type { Message } from '../../types/message.js'
// 复用 createChildAbortController 工具函数，把通用处理留在 ../../utils/abortController.js 中维护。
import { createChildAbortController } from '../../utils/abortController.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 整理这一组导入，让服务层 speculation后续逻辑可以直接复用这些外部能力。
import {
  type FileStateCache,
  mergeFileStateCaches,
  READ_FILE_STATE_CACHE_SIZE,
} from '../../utils/fileStateCache.js'
// 整理这一组导入，让服务层 speculation后续逻辑可以直接复用这些外部能力。
import {
  type CacheSafeParams,
  createCacheSafeParams,
  runForkedAgent,
} from '../../utils/forkedAgent.js'
// 复用 formatDuration、formatNumber 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatDuration, formatNumber } from '../../utils/format.js'
// 类型依赖 { REPLHookContext } 来自 ../../utils/hooks/postSamplingHooks.js，用于校准服务层 speculation的数据契约。
import type { REPLHookContext } from '../../utils/hooks/postSamplingHooks.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 类型依赖 { SetAppState } 来自 ../../utils/messageQueueManager.js，用于校准服务层 speculation的数据契约。
import type { SetAppState } from '../../utils/messageQueueManager.js'
// 整理这一组导入，让服务层 speculation后续逻辑可以直接复用这些外部能力。
import {
  createSystemMessage,
  createUserMessage,
  INTERRUPT_MESSAGE,
  INTERRUPT_MESSAGE_FOR_TOOL_USE,
} from '../../utils/messages.js'
// 复用 getClaudeTempDir 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { getClaudeTempDir } from '../../utils/permissions/filesystem.js'
// 复用 extractReadFilesFromMessages 工具函数，把通用处理留在 ../../utils/queryHelpers.js 中维护。
import { extractReadFilesFromMessages } from '../../utils/queryHelpers.js'
// 复用 getTranscriptPath 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { getTranscriptPath } from '../../utils/sessionStorage.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让服务层 speculation后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让服务层 speculation后续逻辑可以直接复用这些外部能力。
import {
  generateSuggestion,
  getPromptVariant,
  getSuggestionSuppressReason,
  logSuggestionSuppressed,
  shouldFilterSuggestion,
} from './promptSuggestion.js'

// MAX_SPECULATION_TURNS 集合 命名 `20`，让后续代码直接表达这个值的用途。
const MAX_SPECULATION_TURNS = 20
// MAX_SPECULATION_MESSAGES 消息数据保存`100`，供服务层 speculation后续判断或输出使用。
const MAX_SPECULATION_MESSAGES = 100

// WRITE_TOOLS 集合保存`Set`，供服务层 speculation后续处理使用。
const WRITE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])
// SAFE_READ_ONLY_TOOLS 集合保存`Set`，供服务层 speculation后续处理使用。
const SAFE_READ_ONLY_TOOLS = new Set([
  'Read',
  'Glob',
  'Grep',
  'ToolSearch',
  'LSP',
  'TaskGet',
  'TaskList',
])

// safeRemoveOverlay 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function safeRemoveOverlay(overlayPath: string): void {
  // 调用 rm，触发服务层 speculation此处需要的副作用。
  rm(
    overlayPath,
    { recursive: true, force: true, maxRetries: 3, retryDelay: 100 },
    () => {},
  )
}

// getOverlayPath 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOverlayPath(id: string): string {
  // 返回 `join(getClaudeTempDir(), 'speculation', String(process.pid), id)`，作为服务层 speculation这次计算的结果。
  return join(getClaudeTempDir(), 'speculation', String(process.pid), id)
}

// denySpeculation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function denySpeculation(
  message: string,
  reason: string,
): {
  behavior: 'deny'
  message: string
  decisionReason: { type: 'other'; reason: string }
} {
  // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
  return {
    behavior: 'deny',
    message,
    decisionReason: { type: 'other', reason },
  }
}

// copyOverlayToMain 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function copyOverlayToMain(
  overlayPath: string,
  writtenPaths: Set<string>,
  cwd: string,
): Promise<boolean> {
  // allCopied标记服务层 speculation是否启用对应路径。
  let allCopied = true
  // 按顺序遍历 `writtenPaths` 中的rel，逐个交给服务层 speculation处理。
  for (const rel of writtenPaths) {
    // src格式化`join`，供服务层 speculation后续处理使用。
    const src = join(overlayPath, rel)
    // dest格式化`join`，供服务层 speculation后续处理使用。
    const dest = join(cwd, rel)
    // 保护这一段可能失败的服务层 speculation操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `mkdir(dirname(dest), { recursive: true })` 完成，再继续服务层 speculation的异步流程。
      await mkdir(dirname(dest), { recursive: true })
      // 等待 `copyFile(src, dest)` 完成，再继续服务层 speculation的异步流程。
      await copyFile(src, dest)
    } catch {
      // allCopied更新为 `false`，确保服务层后续读取最新状态。
      allCopied = false
      // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[Speculation] Failed to copy ${rel} to main`)
    }
  }
  // 返回 `allCopied`，作为服务层 speculation这次计算的结果。
  return allCopied
}

// ActiveSpeculationState 固化服务层 speculation里传递的数据形状，帮助调用方按同一结构读写字段。
export type ActiveSpeculationState = Extract<
  SpeculationState,
  { status: 'active' }
>

// logSpeculation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logSpeculation(
  id: string,
  outcome: 'accepted' | 'aborted' | 'error',
  startTime: number,
  suggestionLength: number,
  messages: Message[],
  boundary: CompletionBoundary | null,
  extras?: Record<string, string | number | boolean | undefined>,
): void {
  // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_speculation', {
    speculation_id:
      id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    outcome:
      outcome as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    duration_ms: Date.now() - startTime,
    suggestion_length: suggestionLength,
    tools_executed: countToolsInMessages(messages),
    completed: boundary !== null,
    boundary_type: boundary?.type as
      | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      | undefined,
    boundary_tool: getBoundaryTool(boundary) as
      | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      | undefined,
    boundary_detail: getBoundaryDetail(boundary) as
      | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      | undefined,
    ...extras,
  })
}

// countToolsInMessages 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countToolsInMessages(messages: Message[]): number {
  // blocks 集合保存`messages`，供后续判断或组装使用。
  const blocks = messages
    .filter(isUserMessageWithArrayContent)
    .flatMap(m => m.message.content)
    .filter(
      // 这个回调绑定到 (b): b is { type: string; is_error?: boolean } =>，负责服务层 speculation在该局部场景下的响应。
      (b): b is { type: string; is_error?: boolean } =>
        typeof b === 'object' && b !== null && 'type' in b,
    )
  // 返回 `count(blocks, b => b.type === 'tool_result' && !b.is_error)`，作为服务层 speculation这次计算的结果。
  return count(blocks, b => b.type === 'tool_result' && !b.is_error)
}

// getBoundaryTool 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBoundaryTool(
  boundary: CompletionBoundary | null,
): string | undefined {
  // boundary缺失时提前走兜底路径，避免服务层 speculation继续依赖无效输入。
  if (!boundary) return undefined
  // 按照 boundary.type 的取值选择服务层 speculation的具体处理分支。
  switch (boundary.type) {
    case 'bash':
      // 返回 `'Bash'`，作为服务层 speculation这次计算的结果。
      return 'Bash'
    case 'edit':
    case 'denied_tool':
      // 返回 `boundary.toolName`，作为服务层 speculation这次计算的结果。
      return boundary.toolName
    case 'complete':
      // 返回 `undefined`，作为服务层 speculation这次计算的结果。
      return undefined
  }
}

// getBoundaryDetail 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBoundaryDetail(
  boundary: CompletionBoundary | null,
): string | undefined {
  // boundary缺失时提前走兜底路径，避免服务层 speculation继续依赖无效输入。
  if (!boundary) return undefined
  // 按照 boundary.type 的取值选择服务层 speculation的具体处理分支。
  switch (boundary.type) {
    case 'bash':
      // 返回 `boundary.command.slice(0, 200)`，作为服务层 speculation这次计算的结果。
      return boundary.command.slice(0, 200)
    case 'edit':
      // 返回 `boundary.filePath`，作为服务层 speculation这次计算的结果。
      return boundary.filePath
    case 'denied_tool':
      // 返回 `boundary.detail`，作为服务层 speculation这次计算的结果。
      return boundary.detail
    case 'complete':
      // 返回 `undefined`，作为服务层 speculation这次计算的结果。
      return undefined
  }
}

// isUserMessageWithArrayContent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUserMessageWithArrayContent(
  m: Message,
): m is Message & { message: { content: unknown[] } } {
  // 返回 `m.type === 'user' && 'message' in m && Array.isArray(m.message.content)`，作为服务层 speculation这次计算的结果。
  return m.type === 'user' && 'message' in m && Array.isArray(m.message.content)
}

// prepareMessagesForInjection 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prepareMessagesForInjection(messages: Message[]): Message[] {
  // Find tool_use IDs that have SUCCESSFUL results (not errors/interruptions)
  // Pending tool_use blocks (no result) and interrupted ones will be stripped
  // ToolResult 固化服务层 speculation里传递的数据形状，帮助调用方按同一结构读写字段。
  type ToolResult = {
    type: 'tool_result'
    tool_use_id: string
    is_error?: boolean
    content?: unknown
  }
  // isToolResult封装成回调，供服务层 speculation在事件触发或异步步骤中调用。
  const isToolResult = (b: unknown): b is ToolResult =>
    typeof b === 'object' &&
    b !== null &&
    (b as ToolResult).type === 'tool_result' &&
    typeof (b as ToolResult).tool_use_id === 'string'
  // isSuccessful封装成回调，供服务层 speculation在事件触发或异步步骤中调用。
  const isSuccessful = (b: ToolResult) =>
    !b.is_error &&
    !(
      typeof b.content === 'string' &&
      b.content.includes(INTERRUPT_MESSAGE_FOR_TOOL_USE)
    )

  // toolIdsWithSuccessfulResults 集合保存`Set`，供服务层 speculation后续处理使用。
  const toolIdsWithSuccessfulResults = new Set(
    messages
      .filter(isUserMessageWithArrayContent)
      // 链式调用 flatMap，继续加工上一行在服务层 speculation中产生的数据。
      .flatMap(m => m.message.content)
      .filter(isToolResult)
      .filter(isSuccessful)
      // 链式调用 map，继续加工上一行在服务层 speculation中产生的数据。
      .map(b => b.tool_use_id),
  )

  // keep 命名 `(b: {`，让后续代码直接表达这个值的用途。
  const keep = (b: {
    type: string
    id?: string
    tool_use_id?: string
    text?: string
  }) =>
    b.type !== 'thinking' &&
    b.type !== 'redacted_thinking' &&
    !(b.type === 'tool_use' && !toolIdsWithSuccessfulResults.has(b.id!)) &&
    !(
      b.type === 'tool_result' &&
      !toolIdsWithSuccessfulResults.has(b.tool_use_id!)
    ) &&
    // Abort during speculation yields a standalone interrupt user message
    // (query.ts createUserInterruptionMessage). Strip it so it isn't surfaced
    // to the model as real user input.
    !(
      b.type === 'text' &&
      (b.text === INTERRUPT_MESSAGE ||
        b.text === INTERRUPT_MESSAGE_FOR_TOOL_USE)
    )

  // 返回 `messages`，作为服务层 speculation这次计算的结果。
  return messages
    // 链式调用 map，继续加工上一行在服务层 speculation中产生的数据。
    .map(msg => {
      // 组合条件 `!('message' in msg) || !Array.isArray(msg.message.content)` 成立时，服务层 speculation才启用这条专门路径。
      if (!('message' in msg) || !Array.isArray(msg.message.content)) return msg
      // 文本内容筛选`content.filter`，供服务层 speculation后续处理使用。
      const content = msg.message.content.filter(keep)
      // 满足 `content.length === msg.message.content.length` 时，服务层 speculation执行该分支。
      if (content.length === msg.message.content.length) return msg
      // 文本内容为空时立即返回或跳过，避免服务层 speculation把空集合当成可处理内容。
      if (content.length === 0) return null
      // Drop messages where all remaining blocks are whitespace-only text
      // (API rejects these with 400: "text content blocks must contain non-whitespace text")
      // hasNonWhitespaceContent记录 `content.some` 是否成立，服务层 speculation随后按该结果分支。
      const hasNonWhitespaceContent = content.some(
        // 这个回调绑定到 (b: { type: string; text?: string }) =>，负责服务层 speculation在该局部场景下的响应。
        (b: { type: string; text?: string }) =>
          b.type !== 'text' || (b.text !== undefined && b.text.trim() !== ''),
      )
      // hasNonWhitespaceContent缺失时提前走兜底路径，避免服务层 speculation继续依赖无效输入。
      if (!hasNonWhitespaceContent) return null
      // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
      return { ...msg, message: { ...msg.message, content } } as typeof msg
    })
    // 链式调用 filter，继续加工上一行在服务层 speculation中产生的数据。
    .filter((m): m is Message => m !== null)
}

// createSpeculationFeedbackMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createSpeculationFeedbackMessage(
  messages: Message[],
  boundary: CompletionBoundary | null,
  timeSavedMs: number,
  sessionTotalMs: number,
): Message | null {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') return null

  // 组合条件 `messages.length === 0 || timeSavedMs === 0` 成立时，服务层 speculation才启用这条专门路径。
  if (messages.length === 0 || timeSavedMs === 0) return null

  // toolUses 集合统计`countToolsInMessages`，供服务层 speculation后续处理使用。
  const toolUses = countToolsInMessages(messages)
  // token 列表标记服务层 speculation是否启用对应路径。
  const tokens = boundary?.type === 'complete' ? boundary.outputTokens : null

  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts = []
  // 满足 `toolUses > 0` 时，服务层 speculation执行该分支。
  if (toolUses > 0) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`Speculated ${toolUses} tool ${toolUses === 1 ? 'use' : 'uses'}`)
  } else {
    // turns 集合 命名 `messages.length`，让后续代码直接表达这个值的用途。
    const turns = messages.length
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`Speculated ${turns} ${turns === 1 ? 'turn' : 'turns'}`)
  }

  // `tokens` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (tokens !== null) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`${formatNumber(tokens)} tokens`)
  }

  // savedText格式化`formatDuration`，供服务层 speculation后续处理使用。
  const savedText = `+${formatDuration(timeSavedMs)} saved`
  // sessionSuffix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sessionSuffix =
    sessionTotalMs !== timeSavedMs
      ? ` (${formatDuration(sessionTotalMs)} this session)`
      : ''

  // 返回 `createSystemMessage(`，作为服务层 speculation这次计算的结果。
  return createSystemMessage(
    `[ANT-ONLY] ${parts.join(' · ')} · ${savedText}${sessionSuffix}`,
    'warning',
  )
}

// updateActiveSpeculationState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function updateActiveSpeculationState(
  setAppState: SetAppState,
  // 这个回调绑定到 updater: (state: ActiveSpeculationState) => Partial<ActiveSpeculationState>,，负责服务层 speculation在该局部场景下的响应。
  updater: (state: ActiveSpeculationState) => Partial<ActiveSpeculationState>,
): void {
  // setAppState 写入新的状态值，使服务层 speculation后续读取保持一致。
  setAppState(prev => {
    // `prev.speculation.status` 与 `'active'` 不一致时刷新派生状态，避免使用过期结果。
    if (prev.speculation.status !== 'active') return prev
    // current保存`prev.speculation as ActiveSpeculationState`，供服务层 speculation后续判断或输出使用。
    const current = prev.speculation as ActiveSpeculationState
    // updates 集合保存`updater`，供服务层 speculation后续处理使用。
    const updates = updater(current)
    // Check if any values actually changed to avoid unnecessary re-renders
    // hasChanges 集合记录 `Object.entries` 是否成立，服务层 speculation随后按该结果分支。
    const hasChanges = Object.entries(updates).some(
      // 这个回调绑定到 ([key, value]) => current[key as keyof ActiveSpeculationState] !== value,，负责服务层 speculation在该局部场景下的响应。
      ([key, value]) => current[key as keyof ActiveSpeculationState] !== value,
    )
    // hasChanges 集合缺失时提前走兜底路径，避免服务层 speculation继续依赖无效输入。
    if (!hasChanges) return prev
    // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
    return {
      ...prev,
      speculation: { ...current, ...updates },
    }
  })
}

// resetSpeculationState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resetSpeculationState(setAppState: SetAppState): void {
  // setAppState 写入新的状态值，使服务层 speculation后续读取保持一致。
  setAppState(prev => {
    // 当 `prev.speculation.status` 匹配 `'idle'` 时，服务层 speculation执行对应分支。
    if (prev.speculation.status === 'idle') return prev
    // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
    return { ...prev, speculation: IDLE_SPECULATION_STATE }
  })
}

// isSpeculationEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSpeculationEnabled(): boolean {
  // enabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const enabled =
    process.env.USER_TYPE === 'ant' &&
    (getGlobalConfig().speculationEnabled ?? true)
  // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[Speculation] enabled=${enabled}`)
  // 返回 `enabled`，作为服务层 speculation这次计算的结果。
  return enabled
}

// generatePipelinedSuggestion 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function generatePipelinedSuggestion(
  context: REPLHookContext,
  suggestionText: string,
  speculatedMessages: Message[],
  setAppState: SetAppState,
  parentAbortController: AbortController,
): Promise<void> {
  // 保护这一段可能失败的服务层 speculation操作，确保异常能进入相邻错误处理。
  try {
    // appState 状态读取`toolUseContext.getAppState`，供服务层 speculation后续处理使用。
    const appState = context.toolUseContext.getAppState()
    // suppressReason读取`getSuggestionSuppressReason`，供服务层 speculation后续处理使用。
    const suppressReason = getSuggestionSuppressReason(appState)
    // 满足 `suppressReason` 时，服务层 speculation执行该分支。
    if (suppressReason) {
      // 调用 logSuggestionSuppressed，触发服务层 speculation此处需要的副作用。
      logSuggestionSuppressed(`pipeline_${suppressReason}`)
      // 服务层 speculation在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // augmentedContext 集中保存服务层 speculation要一起传递的字段。
    const augmentedContext: REPLHookContext = {
      ...context,
      messages: [
        ...context.messages,
        createUserMessage({ content: suggestionText }),
        ...speculatedMessages,
      ],
    }

    // pipelineAbortController构建`createChildAbortController`，供服务层 speculation后续处理使用。
    const pipelineAbortController = createChildAbortController(
      parentAbortController,
    )
    // 满足 `pipelineAbortController.signal.aborted` 时，服务层 speculation执行该分支。
    if (pipelineAbortController.signal.aborted) return

    // promptId读取`getPromptVariant`，供服务层 speculation后续处理使用。
    const promptId = getPromptVariant()
    // 从 `await generateSuggestion(` 解构 suggestion、generationRequestId，减少服务层 speculation对同一对象的重复访问。
    const { suggestion, generationRequestId } = await generateSuggestion(
      pipelineAbortController,
      promptId,
      createCacheSafeParams(augmentedContext),
    )

    // 满足 `pipelineAbortController.signal.aborted` 时，服务层 speculation执行该分支。
    if (pipelineAbortController.signal.aborted) return
    // 满足 `shouldFilterSuggestion(suggestion, promptId)` 时，服务层 speculation执行该分支。
    if (shouldFilterSuggestion(suggestion, promptId)) return

    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Speculation] Pipelined suggestion: "${suggestion!.slice(0, 50)}..."`,
    )
    // 调用 updateActiveSpeculationState，触发服务层 speculation此处需要的副作用。
    updateActiveSpeculationState(setAppState, () => ({
      pipelinedSuggestion: {
        text: suggestion!,
        promptId,
        generationRequestId,
      },
    }))
  } catch (error) {
    // 当 `error instanceof Error && error.name` 匹配 `'AbortError'` 时，服务层 speculation执行对应分支。
    if (error instanceof Error && error.name === 'AbortError') return
    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Speculation] Pipelined suggestion failed: ${errorMessage(error)}`,
    )
  }
}

// startSpeculation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function startSpeculation(
  suggestionText: string,
  context: REPLHookContext,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责服务层 speculation在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
  isPipelined = false,
  cacheSafeParams?: CacheSafeParams,
): Promise<void> {
  // 满足 `!isSpeculationEnabled()` 时，服务层 speculation执行该分支。
  if (!isSpeculationEnabled()) return

  // Abort any existing speculation before starting a new one
  // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
  abortSpeculation(setAppState)

  // 标识符保存`randomUUID`，供服务层 speculation后续处理使用。
  const id = randomUUID().slice(0, 8)

  // abortController构建`createChildAbortController`，供服务层 speculation后续处理使用。
  const abortController = createChildAbortController(
    context.toolUseContext.abortController,
  )

  // 满足 `abortController.signal.aborted` 时，服务层 speculation执行该分支。
  if (abortController.signal.aborted) return

  // startTime记录时间`Date.now`，供服务层 speculation后续处理使用。
  const startTime = Date.now()
  // messagesRef 引用 集中保存服务层 speculation要一起传递的字段。
  const messagesRef = { current: [] as Message[] }
  // writtenPathsRef 引用 集中保存服务层 speculation要一起传递的字段。
  const writtenPathsRef = { current: new Set<string>() }
  // overlayPath 路径数据读取`getOverlayPath`，供服务层 speculation后续处理使用。
  const overlayPath = getOverlayPath(id)
  // cwd读取`getCwdState`，供服务层 speculation后续处理使用。
  const cwd = getCwdState()

  // 保护这一段可能失败的服务层 speculation操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(overlayPath, { recursive: true })` 完成，再继续服务层 speculation的异步流程。
    await mkdir(overlayPath, { recursive: true })
  } catch {
    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[Speculation] Failed to create overlay directory')
    // 服务层 speculation在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // contextRef 引用 集中保存服务层 speculation要一起传递的字段。
  const contextRef = { current: context }

  // setAppState 写入新的状态值，使服务层 speculation后续读取保持一致。
  setAppState(prev => ({
    ...prev,
    speculation: {
      status: 'active',
      id,
      // 这个回调绑定到 abort: () => abortController.abort(),，负责服务层 speculation在该局部场景下的响应。
      abort: () => abortController.abort(),
      startTime,
      messagesRef,
      writtenPathsRef,
      boundary: null,
      suggestionLength: suggestionText.length,
      toolUseCount: 0,
      isPipelined,
      contextRef,
    },
  }))

  // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[Speculation] Starting speculation ${id}`)

  // 保护这一段可能失败的服务层 speculation操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`runForkedAgent`，供服务层 speculation后续处理使用。
    const result = await runForkedAgent({
      promptMessages: [createUserMessage({ content: suggestionText })],
      cacheSafeParams: cacheSafeParams ?? createCacheSafeParams(context),
      skipTranscript: true,
      // 这个回调绑定到 canUseTool: async (tool, input) => {，负责服务层 speculation在该局部场景下的响应。
      canUseTool: async (tool, input) => {
        // isWriteTool记录 `WRITE_TOOLS.has` 是否成立，服务层 speculation随后按该结果分支。
        const isWriteTool = WRITE_TOOLS.has(tool.name)
        // isSafeReadOnlyTool记录 `SAFE_READ_ONLY_TOOLS.has` 是否成立，服务层 speculation随后按该结果分支。
        const isSafeReadOnlyTool = SAFE_READ_ONLY_TOOLS.has(tool.name)

        // Check permission mode BEFORE allowing file edits
        // 满足 `isWriteTool` 时，服务层 speculation执行该分支。
        if (isWriteTool) {
          // appState 状态读取`toolUseContext.getAppState`，供服务层 speculation后续处理使用。
          const appState = context.toolUseContext.getAppState()
          // 服务层 speculation先整理这一处局部数据，后续分支可以直接读取。
          const { mode, isBypassPermissionsModeAvailable } =
            appState.toolPermissionContext

          // canAutoAcceptEdits 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const canAutoAcceptEdits =
            mode === 'acceptEdits' ||
            mode === 'bypassPermissions' ||
            (mode === 'plan' && isBypassPermissionsModeAvailable)

          // canAutoAcceptEdits 集合缺失时提前走兜底路径，避免服务层 speculation继续依赖无效输入。
          if (!canAutoAcceptEdits) {
            // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`[Speculation] Stopping at file edit: ${tool.name}`)
            // editPath 路径数据保存`(`，供服务层 speculation后续判断或输出使用。
            const editPath = (
              'file_path' in input ? input.file_path : undefined
            ) as string | undefined
            // 调用 updateActiveSpeculationState，触发服务层 speculation此处需要的副作用。
            updateActiveSpeculationState(setAppState, () => ({
              boundary: {
                type: 'edit',
                toolName: tool.name,
                filePath: editPath ?? '',
                completedAt: Date.now(),
              },
            }))
            // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
            abortController.abort()
            // 返回 `denySpeculation(`，作为服务层 speculation这次计算的结果。
            return denySpeculation(
              'Speculation paused: file edit requires permission',
              'speculation_edit_boundary',
            )
          }
        }

        // Handle file path rewriting for overlay isolation
        // 组合条件 `isWriteTool || isSafeReadOnlyTool` 成立时，服务层 speculation才启用这条专门路径。
        if (isWriteTool || isSafeReadOnlyTool) {
          // pathKey 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const pathKey =
            'notebook_path' in input
              ? 'notebook_path'
              : 'path' in input
                ? 'path'
                : 'file_path'
          // 文件路径读取 `input[pathKey] as string | undefined` 对应条目，后续围绕该成员继续处理。
          const filePath = input[pathKey] as string | undefined
          // 满足 `filePath` 时，服务层 speculation执行该分支。
          if (filePath) {
            // rel保存`relative`，供服务层 speculation后续处理使用。
            const rel = relative(cwd, filePath)
            // 组合条件 `isAbsolute(rel) || rel.startsWith('..')` 成立时，服务层 speculation才启用这条专门路径。
            if (isAbsolute(rel) || rel.startsWith('..')) {
              // 满足 `isWriteTool` 时，服务层 speculation执行该分支。
              if (isWriteTool) {
                // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[Speculation] Denied ${tool.name}: path outside cwd: ${filePath}`,
                )
                // 返回 `denySpeculation(`，作为服务层 speculation这次计算的结果。
                return denySpeculation(
                  'Write outside cwd not allowed during speculation',
                  'speculation_write_outside_root',
                )
              }
              // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
              return {
                behavior: 'allow' as const,
                updatedInput: input,
                decisionReason: {
                  type: 'other' as const,
                  reason: 'speculation_read_outside_root',
                },
              }
            }

            // 满足 `isWriteTool` 时，服务层 speculation执行该分支。
            if (isWriteTool) {
              // Copy-on-write: copy original to overlay if not yet there
              // 满足 `!writtenPathsRef.current.has(rel)` 时，服务层 speculation执行该分支。
              if (!writtenPathsRef.current.has(rel)) {
                // overlayFile 文件数据格式化`join`，供服务层 speculation后续处理使用。
                const overlayFile = join(overlayPath, rel)
                // 等待 `mkdir(dirname(overlayFile), { recursive: true })` 完成，再继续服务层 speculation的异步流程。
                await mkdir(dirname(overlayFile), { recursive: true })
                // 保护这一段可能失败的服务层 speculation操作，确保异常能进入相邻错误处理。
                try {
                  // 等待 `copyFile(join(cwd, rel), overlayFile)` 完成，再继续服务层 speculation的异步流程。
                  await copyFile(join(cwd, rel), overlayFile)
                } catch {
                  // Original may not exist (new file creation) - that's fine
                }
                // 调用 writtenPathsRef.current.add，触发服务层 speculation此处需要的副作用。
                writtenPathsRef.current.add(rel)
              }
              // 用户输入更新为 `{ ...input, [pathKey]: join(overlayPath, rel) }`，确保服务层后续读取最新状态。
              input = { ...input, [pathKey]: join(overlayPath, rel) }
            } else {
              // Read: redirect to overlay if file was previously written
              // 满足 `writtenPathsRef.current.has(rel)` 时，服务层 speculation执行该分支。
              if (writtenPathsRef.current.has(rel)) {
                // 用户输入更新为 `{ ...input, [pathKey]: join(overlayPath, rel) }`，确保服务层后续读取最新状态。
                input = { ...input, [pathKey]: join(overlayPath, rel) }
              }
              // Otherwise read from main (no rewrite)
            }

            // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[Speculation] ${isWriteTool ? 'Write' : 'Read'} ${filePath} -> ${input[pathKey]}`,
            )

            // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
            return {
              behavior: 'allow' as const,
              updatedInput: input,
              decisionReason: {
                type: 'other' as const,
                reason: 'speculation_file_access',
              },
            }
          }
          // Read tools without explicit path (e.g. Glob/Grep defaulting to CWD) are safe
          // 满足 `isSafeReadOnlyTool` 时，服务层 speculation执行该分支。
          if (isSafeReadOnlyTool) {
            // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
            return {
              behavior: 'allow' as const,
              updatedInput: input,
              decisionReason: {
                type: 'other' as const,
                reason: 'speculation_read_default_cwd',
              },
            }
          }
          // Write tools with undefined path → fall through to default deny
        }

        // Stop at non-read-only bash commands
        // 当 `tool.name` 匹配 `'Bash'` 时，服务层 speculation执行对应分支。
        if (tool.name === 'Bash') {
          // command 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const command =
            'command' in input && typeof input.command === 'string'
              ? input.command
              : ''
          // 服务层 speculation在这里进入条件判断，后续代码按实际状态分流。
          if (
            !command ||
            checkReadOnlyConstraints({ command }, commandHasAnyCd(command))
              .behavior !== 'allow'
          ) {
            // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[Speculation] Stopping at bash: ${command.slice(0, 50) || 'missing command'}`,
            )
            // 调用 updateActiveSpeculationState，触发服务层 speculation此处需要的副作用。
            updateActiveSpeculationState(setAppState, () => ({
              boundary: { type: 'bash', command, completedAt: Date.now() },
            }))
            // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
            abortController.abort()
            // 返回 `denySpeculation(`，作为服务层 speculation这次计算的结果。
            return denySpeculation(
              'Speculation paused: bash boundary',
              'speculation_bash_boundary',
            )
          }
          // Read-only bash command — allow during speculation
          // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
          return {
            behavior: 'allow' as const,
            updatedInput: input,
            decisionReason: {
              type: 'other' as const,
              reason: 'speculation_readonly_bash',
            },
          }
        }

        // Deny all other tools by default
        // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[Speculation] Stopping at denied tool: ${tool.name}`)
        // detail保存`String`，供服务层 speculation后续处理使用。
        const detail = String(
          ('url' in input && input.url) ||
            ('file_path' in input && input.file_path) ||
            ('path' in input && input.path) ||
            ('command' in input && input.command) ||
            '',
        ).slice(0, 200)
        // 调用 updateActiveSpeculationState，触发服务层 speculation此处需要的副作用。
        updateActiveSpeculationState(setAppState, () => ({
          boundary: {
            type: 'denied_tool',
            toolName: tool.name,
            detail,
            completedAt: Date.now(),
          },
        }))
        // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
        abortController.abort()
        // 返回 `denySpeculation(`，作为服务层 speculation这次计算的结果。
        return denySpeculation(
          `Tool ${tool.name} not allowed during speculation`,
          'speculation_unknown_tool',
        )
      },
      querySource: 'speculation',
      forkLabel: 'speculation',
      maxTurns: MAX_SPECULATION_TURNS,
      overrides: { abortController, requireCanUseTool: true },
      // 这个回调绑定到 onMessage: msg => {，负责服务层 speculation在该局部场景下的响应。
      onMessage: msg => {
        // 当 `msg.type` 匹配 `'assistant' || msg.type ===...` 时，服务层 speculation执行对应分支。
        if (msg.type === 'assistant' || msg.type === 'user') {
          // current追加新条目，保持收集顺序与输入顺序一致。
          messagesRef.current.push(msg)
          // 满足 `messagesRef.current.length >= MAX_SPECULATION_MES` 时，服务层 speculation执行该分支。
          if (messagesRef.current.length >= MAX_SPECULATION_MESSAGES) {
            // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
            abortController.abort()
          }
          // 满足 `isUserMessageWithArrayContent(msg)` 时，服务层 speculation执行该分支。
          if (isUserMessageWithArrayContent(msg)) {
            // newTools 集合统计`count`，供服务层 speculation后续处理使用。
            const newTools = count(
              msg.message.content as { type: string; is_error?: boolean }[],
              // b更新为 `> b.type === 'tool_result' && !b.is_error`，确保服务层后续读取最新状态。
              b => b.type === 'tool_result' && !b.is_error,
            )
            // 满足 `newTools > 0` 时，服务层 speculation执行该分支。
            if (newTools > 0) {
              // 调用 updateActiveSpeculationState，触发服务层 speculation此处需要的副作用。
              updateActiveSpeculationState(setAppState, prev => ({
                toolUseCount: prev.toolUseCount + newTools,
              }))
            }
          }
        }
      },
    })

    // 满足 `abortController.signal.aborted` 时，服务层 speculation执行该分支。
    if (abortController.signal.aborted) return

    // 调用 updateActiveSpeculationState，触发服务层 speculation此处需要的副作用。
    updateActiveSpeculationState(setAppState, () => ({
      boundary: {
        type: 'complete' as const,
        completedAt: Date.now(),
        outputTokens: result.totalUsage.output_tokens,
      },
    }))

    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Speculation] Complete: ${countToolsInMessages(messagesRef.current)} tools`,
    )

    // Pipeline: generate the next suggestion while we wait for the user to accept
    // 显式忽略 `generatePipelinedSuggestion(` 的返回值，只保留它触发的副作用。
    void generatePipelinedSuggestion(
      contextRef.current,
      suggestionText,
      messagesRef.current,
      setAppState,
      abortController,
    )
  } catch (error) {
    // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
    abortController.abort()

    // 组合条件 `error instanceof Error && error.name === 'AbortEr` 成立时，服务层 speculation才启用这条专门路径。
    if (error instanceof Error && error.name === 'AbortError') {
      // 调用 safeRemoveOverlay，触发服务层 speculation此处需要的副作用。
      safeRemoveOverlay(overlayPath)
      // 调用 resetSpeculationState，触发服务层 speculation此处需要的副作用。
      resetSpeculationState(setAppState)
      // 服务层 speculation在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 safeRemoveOverlay，触发服务层 speculation此处需要的副作用。
    safeRemoveOverlay(overlayPath)

    // eslint-disable-next-line no-restricted-syntax -- custom fallback message, not toError(e)
    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logError(error instanceof Error ? error : new Error('Speculation failed'))

    // 调用 logSpeculation，触发服务层 speculation此处需要的副作用。
    logSpeculation(
      id,
      'error',
      startTime,
      suggestionText.length,
      messagesRef.current,
      null,
      {
        error_type: error instanceof Error ? error.name : 'Unknown',
        error_message: errorMessage(error).slice(
          0,
          200,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        error_phase:
          'start' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        is_pipelined: isPipelined,
      },
    )

    // 调用 resetSpeculationState，触发服务层 speculation此处需要的副作用。
    resetSpeculationState(setAppState)
  }
}

// acceptSpeculation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function acceptSpeculation(
  state: SpeculationState,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责服务层 speculation在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
  cleanMessageCount: number,
): Promise<SpeculationResult | null> {
  // `state.status` 与 `'active'` 不一致时刷新派生状态，避免使用过期结果。
  if (state.status !== 'active') return null

  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    id,
    messagesRef,
    writtenPathsRef,
    abort,
    startTime,
    suggestionLength,
    isPipelined,
  } = state
  // 对话消息保存`messagesRef.current`，供后续判断或组装使用。
  const messages = messagesRef.current
  // overlayPath 路径数据读取`getOverlayPath`，供服务层 speculation后续处理使用。
  const overlayPath = getOverlayPath(id)
  // acceptedAt记录时间`Date.now`，供服务层 speculation后续处理使用。
  const acceptedAt = Date.now()

  // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
  abort()

  // 满足 `cleanMessageCount > 0` 时，服务层 speculation执行该分支。
  if (cleanMessageCount > 0) {
    // 等待 `copyOverlayToMain(overlayPath, writtenPathsRef.current, getCwdState())` 完成，再继续服务层 speculation的异步流程。
    await copyOverlayToMain(overlayPath, writtenPathsRef.current, getCwdState())
  }
  // 调用 safeRemoveOverlay，触发服务层 speculation此处需要的副作用。
  safeRemoveOverlay(overlayPath)

  // Use snapshot boundary as default (available since state.status === 'active' was checked above)
  // boundary 命名 `state.boundary`，让后续代码直接表达这个值的用途。
  let boundary: CompletionBoundary | null = state.boundary
  // timeSavedMs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let timeSavedMs =
    Math.min(acceptedAt, boundary?.completedAt ?? Infinity) - startTime

  // setAppState 写入新的状态值，使服务层 speculation后续读取保持一致。
  setAppState(prev => {
    // Refine with latest React state if speculation is still active
    // 组合条件 `prev.speculation.status === 'active' && prev.spec` 成立时，服务层 speculation才启用这条专门路径。
    if (prev.speculation.status === 'active' && prev.speculation.boundary) {
      // boundary更新为 `prev.speculation.boundary`，确保服务层后续读取最新状态。
      boundary = prev.speculation.boundary
      // endTime保存`Math.min`，供服务层 speculation后续处理使用。
      const endTime = Math.min(acceptedAt, boundary.completedAt ?? Infinity)
      // timeSavedMs 集合更新为 `endTime - startTime`，确保服务层后续读取最新状态。
      timeSavedMs = endTime - startTime
    }
    // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
    return {
      ...prev,
      speculation: IDLE_SPECULATION_STATE,
      speculationSessionTimeSavedMs:
        prev.speculationSessionTimeSavedMs + timeSavedMs,
    }
  })

  // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    boundary === null
      ? `[Speculation] Accept ${id}: still running, using ${messages.length} messages`
      : `[Speculation] Accept ${id}: already complete`,
  )

  // 调用 logSpeculation，触发服务层 speculation此处需要的副作用。
  logSpeculation(
    id,
    'accepted',
    startTime,
    suggestionLength,
    messages,
    boundary,
    {
      message_count: messages.length,
      time_saved_ms: timeSavedMs,
      is_pipelined: isPipelined,
    },
  )

  // 满足 `timeSavedMs > 0` 时，服务层 speculation执行该分支。
  if (timeSavedMs > 0) {
    // entry 集中保存服务层 speculation要一起传递的字段。
    const entry: SpeculationAcceptMessage = {
      type: 'speculation-accept',
      timestamp: new Date().toISOString(),
      timeSavedMs,
    }
    // 显式忽略 `appendFile(getTranscriptPath(), jsonStringify(entry) + '\n', {` 的返回值，只保留它触发的副作用。
    void appendFile(getTranscriptPath(), jsonStringify(entry) + '\n', {
      mode: 0o600,
    // 这个回调绑定到 }).catch(() => {，负责服务层 speculation在该局部场景下的响应。
    }).catch(() => {
      // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[Speculation] Failed to write speculation-accept to transcript',
      )
    })
  }

  // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
  return { messages, boundary, timeSavedMs }
}

// abortSpeculation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function abortSpeculation(setAppState: SetAppState): void {
  // setAppState 写入新的状态值，使服务层 speculation后续读取保持一致。
  setAppState(prev => {
    // `prev.speculation.status` 与 `'active'` 不一致时刷新派生状态，避免使用过期结果。
    if (prev.speculation.status !== 'active') return prev

    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      id,
      abort,
      startTime,
      boundary,
      suggestionLength,
      messagesRef,
      isPipelined,
    } = prev.speculation

    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[Speculation] Aborting ${id}`)

    // 调用 logSpeculation，触发服务层 speculation此处需要的副作用。
    logSpeculation(
      id,
      'aborted',
      startTime,
      suggestionLength,
      messagesRef.current,
      boundary,
      { abort_reason: 'user_typed', is_pipelined: isPipelined },
    )

    // 触发取消信号，通知服务层 speculation中仍在等待的异步任务尽快停止。
    abort()
    // 调用 safeRemoveOverlay，触发服务层 speculation此处需要的副作用。
    safeRemoveOverlay(getOverlayPath(id))

    // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
    return { ...prev, speculation: IDLE_SPECULATION_STATE }
  })
}

// handleSpeculationAccept 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function handleSpeculationAccept(
  speculationState: ActiveSpeculationState,
  speculationSessionTimeSavedMs: number,
  setAppState: SetAppState,
  input: string,
  deps: {
    // 这个回调绑定到 setMessages: (f: (prev: Message[]) => Message[]) => void，负责服务层 speculation在该局部场景下的响应。
    setMessages: (f: (prev: Message[]) => Message[]) => void
    readFileState: { current: FileStateCache }
    cwd: string
  },
): Promise<{ queryRequired: boolean }> {
  // 保护这一段可能失败的服务层 speculation操作，确保异常能进入相邻错误处理。
  try {
    // 从 `deps` 解构 setMessages、readFileState、cwd，减少服务层 speculation对同一对象的重复访问。
    const { setMessages, readFileState, cwd } = deps

    // Clear prompt suggestion state. logOutcomeAtSubmission logged the accept
    // but was called with skipReset to avoid aborting speculation before we use it.
    // setAppState 写入新的状态值，使服务层 speculation后续读取保持一致。
    setAppState(prev => {
      // 服务层 speculation在这里进入条件判断，后续代码按实际状态分流。
      if (
        prev.promptSuggestion.text === null &&
        prev.promptSuggestion.promptId === null
      ) {
        // 返回 `prev`，作为服务层 speculation这次计算的结果。
        return prev
      }
      // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
      return {
        ...prev,
        promptSuggestion: {
          text: null,
          promptId: null,
          shownAt: 0,
          acceptedAt: 0,
          generationRequestId: null,
        },
      }
    })

    // Capture speculation messages before any state updates - must be stable reference
    // speculationMessages 消息数据 命名 `speculationState.messagesRef.current`，让后续代码直接表达这个值的用途。
    const speculationMessages = speculationState.messagesRef.current
    // cleanMessages 消息数据保存`prepareMessagesForInjection`，供服务层 speculation后续处理使用。
    let cleanMessages = prepareMessagesForInjection(speculationMessages)

    // Inject user message first for instant visual feedback before any async work
    // userMessage 消息数据构建`createUserMessage`，供服务层 speculation后续处理使用。
    const userMessage = createUserMessage({ content: input })
    // setMessages 写入新的状态值，使服务层 speculation后续读取保持一致。
    setMessages(prev => [...prev, userMessage])

    // 结果保存`acceptSpeculation`，供服务层 speculation后续处理使用。
    const result = await acceptSpeculation(
      speculationState,
      setAppState,
      cleanMessages.length,
    )

    // isComplete标记服务层 speculation是否启用对应路径。
    const isComplete = result?.boundary?.type === 'complete'

    // When speculation didn't complete, the follow-up query needs the
    // conversation to end with a user message. Drop trailing assistant
    // messages — models that don't support prefill
    // reject conversations ending with an assistant turn. The model will
    // regenerate this content in the follow-up query.
    // isComplete缺失时提前走兜底路径，避免服务层 speculation继续依赖无效输入。
    if (!isComplete) {
      // lastNonAssistant筛选`cleanMessages.findLastIndex`，供服务层 speculation后续处理使用。
      const lastNonAssistant = cleanMessages.findLastIndex(
        // m更新为 `> m.type !== 'assistant'`，确保服务层后续读取最新状态。
        m => m.type !== 'assistant',
      )
      // cleanMessages 消息数据更新为 `cleanMessages.slice(0, lastNonAssistant + 1)`，确保服务层后续读取最新状态。
      cleanMessages = cleanMessages.slice(0, lastNonAssistant + 1)
    }

    // timeSavedMs 集合保存`result?.timeSavedMs ?? 0`，供后续判断或组装使用。
    const timeSavedMs = result?.timeSavedMs ?? 0
    // newSessionTotal 会话数据保存`speculationSessionTimeSavedMs + timeSavedMs`，供后续判断或组装使用。
    const newSessionTotal = speculationSessionTimeSavedMs + timeSavedMs
    // feedbackMessage 消息数据构建`createSpeculationFeedbackMessage`，供服务层 speculation后续处理使用。
    const feedbackMessage = createSpeculationFeedbackMessage(
      cleanMessages,
      result?.boundary ?? null,
      timeSavedMs,
      newSessionTotal,
    )

    // Inject speculated messages
    // setMessages 写入新的状态值，使服务层 speculation后续读取保持一致。
    setMessages(prev => [...prev, ...cleanMessages])

    // extracted保存`extractReadFilesFromMessages`，供服务层 speculation后续处理使用。
    const extracted = extractReadFilesFromMessages(
      cleanMessages,
      cwd,
      READ_FILE_STATE_CACHE_SIZE,
    )
    // current更新为 `mergeFileStateCaches(`，确保服务层后续读取最新状态。
    readFileState.current = mergeFileStateCaches(
      readFileState.current,
      extracted,
    )

    // 满足 `feedbackMessage` 时，服务层 speculation执行该分支。
    if (feedbackMessage) {
      // setMessages 写入新的状态值，使服务层 speculation后续读取保持一致。
      setMessages(prev => [...prev, feedbackMessage])
    }

    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Speculation] ${result?.boundary?.type ?? 'incomplete'}, injected ${cleanMessages.length} messages`,
    )

    // Promote pipelined suggestion if speculation completed fully
    // 组合条件 `isComplete && speculationState.pipelinedSuggestion` 成立时，服务层 speculation才启用这条专门路径。
    if (isComplete && speculationState.pipelinedSuggestion) {
      // 服务层 speculation先整理这一处局部数据，后续分支可以直接读取。
      const { text, promptId, generationRequestId } =
        speculationState.pipelinedSuggestion
      // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Speculation] Promoting pipelined suggestion: "${text.slice(0, 50)}..."`,
      )
      // setAppState 写入新的状态值，使服务层 speculation后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        promptSuggestion: {
          text,
          promptId,
          shownAt: Date.now(),
          acceptedAt: 0,
          generationRequestId,
        },
      }))

      // Start speculation on the pipelined suggestion
      // augmentedContext 集中保存服务层 speculation要一起传递的字段。
      const augmentedContext: REPLHookContext = {
        ...speculationState.contextRef.current,
        messages: [
          ...speculationState.contextRef.current.messages,
          createUserMessage({ content: input }),
          ...cleanMessages,
        ],
      }
      // 显式忽略 `startSpeculation(text, augmentedContext, setAppState, true)` 的返回值，只保留它触发的副作用。
      void startSpeculation(text, augmentedContext, setAppState, true)
    }

    // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
    return { queryRequired: !isComplete }
  } catch (error) {
    // Fail open: log error and fall back to normal query flow
    /* eslint-disable no-restricted-syntax -- custom fallback message, not toError(e) */
    // 记录服务层 speculation运行诊断，方便排查异常路径或性能问题。
    logError(
      error instanceof Error
        ? error
        : new Error('handleSpeculationAccept failed'),
    )
    /* eslint-enable no-restricted-syntax */
    // 调用 logSpeculation，触发服务层 speculation此处需要的副作用。
    logSpeculation(
      speculationState.id,
      'error',
      speculationState.startTime,
      speculationState.suggestionLength,
      speculationState.messagesRef.current,
      speculationState.boundary,
      {
        error_type: error instanceof Error ? error.name : 'Unknown',
        error_message: errorMessage(error).slice(
          0,
          200,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        error_phase:
          'accept' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        is_pipelined: speculationState.isPipelined,
      },
    )
    // 调用 safeRemoveOverlay，触发服务层 speculation此处需要的副作用。
    safeRemoveOverlay(getOverlayPath(speculationState.id))
    // 调用 resetSpeculationState，触发服务层 speculation此处需要的副作用。
    resetSpeculationState(setAppState)
    // Query required so user's message is processed normally (without speculated work)
    // 返回结构化结果，集中表达服务层 speculation已经整理出的状态。
    return { queryRequired: true }
  }
}
