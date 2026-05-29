/**
 * Utility for persisting large tool results to disk instead of truncating them.
 */

// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准共享工具的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getOriginalCwd、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionId } from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  BYTES_PER_TOKEN,
  DEFAULT_MAX_RESULT_SIZE_CHARS,
  MAX_TOOL_RESULT_BYTES,
  MAX_TOOL_RESULTS_PER_MESSAGE_CHARS,
} from '../constants/toolLimits.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../services/analytics/metadata.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getErrnoCode、toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode, toError } from './errors.js'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getProjectDir，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { getProjectDir } from './sessionStorage.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// Subdirectory name for tool results within a session
// TOOL_RESULTS_SUBDIR保存`'tool-results'`，作为后续固定文本处理的输入。
export const TOOL_RESULTS_SUBDIR = 'tool-results'

// XML tag used to wrap persisted output messages
// PERSISTED_OUTPUT_TAG 命名 `'<persisted-output>'`，让后续代码直接表达这个值的用途。
export const PERSISTED_OUTPUT_TAG = '<persisted-output>'
// PERSISTED_OUTPUT_CLOSING_TAG固定为 `'</persisted-output>'`，作为共享工具 tool Result Storage后续展示或比较的基准。
export const PERSISTED_OUTPUT_CLOSING_TAG = '</persisted-output>'

// Message used when tool result content was cleared without persisting to file
// TOOL_RESULT_CLEARED_MESSAGE 消息数据固定为 `'[Old tool result content cleared]'`，作为共享工具 tool Result Storage后续展示或比较的基准。
export const TOOL_RESULT_CLEARED_MESSAGE = '[Old tool result content cleared]'

/**
 * GrowthBook override map: tool name -> persistence threshold (chars).
 * When a tool name is present in this map, that value is used directly as the
 * effective threshold, bypassing the Math.min() clamp against the 50k default.
 * Tools absent from the map use the hardcoded fallback.
 * Flag default is {} (no overrides == behavior unchanged).
 */
// PERSIST_THRESHOLD_OVERRIDE_FLAG 命名 `'tengu_satin_quoll'`，让后续代码直接表达这个值的用途。
const PERSIST_THRESHOLD_OVERRIDE_FLAG = 'tengu_satin_quoll'

/**
 * Resolve the effective persistence threshold for a tool.
 * GrowthBook override wins when present; otherwise falls back to the declared
 * per-tool cap clamped by the global default.
 *
 * Defensive: GrowthBook's cache returns `cached !== undefined ? cached : default`,
 * so a flag served as `null` leaks through. We guard with optional chaining and a
 * typeof check so any non-object flag value (null, string, number) falls through
 * to the hardcoded default instead of throwing on index or returning 0.
 */
// getPersistenceThreshold 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPersistenceThreshold(
  toolName: string,
  declaredMaxResultSizeChars: number,
): number {
  // Infinity = hard opt-out. Read self-bounds via maxTokens; persisting its
  // output to a file the model reads back with Read is circular. Checked
  // before the GB override so tengu_satin_quoll can't force it back on.
  // 满足 `!Number.isFinite(declaredMaxResultSizeChars)` 时，共享工具执行该分支。
  if (!Number.isFinite(declaredMaxResultSizeChars)) {
    // 返回 `declaredMaxResultSizeChars`，作为共享工具这次计算的结果。
    return declaredMaxResultSizeChars
  }
  // overrides 集合读取`getFeatureValue_CACHED_MAY_BE_STALE<Record<`，供后续判断或组装使用。
  const overrides = getFeatureValue_CACHED_MAY_BE_STALE<Record<
    string,
    number
  > | null>(PERSIST_THRESHOLD_OVERRIDE_FLAG, {})
  // override读取 `overrides?.[toolName]` 对应条目，后续围绕该成员继续处理。
  const override = overrides?.[toolName]
  // 共享工具在这里按实际状态进入对应分支。
  if (
    typeof override === 'number' &&
    Number.isFinite(override) &&
    override > 0
  ) {
    // 返回 `override`，作为共享工具这次计算的结果。
    return override
  }
  // 返回 `Math.min(declaredMaxResultSizeChars, DEFAULT_MAX_RESULT_SIZE_CHARS)`，作为共享工具这次计算的结果。
  return Math.min(declaredMaxResultSizeChars, DEFAULT_MAX_RESULT_SIZE_CHARS)
}

// Result of persisting a tool result to disk
// PersistedToolResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PersistedToolResult = {
  filepath: string
  originalSize: number
  isJson: boolean
  preview: string
  hasMore: boolean
}

// Error result when persistence fails
// PersistToolResultError 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PersistToolResultError = {
  error: string
}

/**
 * Get the session directory (projectDir/sessionId)
 */
// getSessionDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSessionDir(): string {
  // 返回 `join(getProjectDir(getOriginalCwd()), getSessionId())`，作为共享工具这次计算的结果。
  return join(getProjectDir(getOriginalCwd()), getSessionId())
}

/**
 * Get the tool results directory for this session (projectDir/sessionId/tool-results)
 */
// getToolResultsDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolResultsDir(): string {
  // 返回 `join(getSessionDir(), TOOL_RESULTS_SUBDIR)`，作为共享工具这次计算的结果。
  return join(getSessionDir(), TOOL_RESULTS_SUBDIR)
}

// Preview size in bytes for the reference message
// PREVIEW_SIZE_BYTES 集合保存`2000`，供共享工具 tool Result Storage后续判断或输出使用。
export const PREVIEW_SIZE_BYTES = 2000

/**
 * Get the filepath where a tool result would be persisted.
 */
// getToolResultPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolResultPath(id: string, isJson: boolean): string {
  // ext 命名 `isJson ? 'json' : 'txt'`，让后续代码直接表达这个值的用途。
  const ext = isJson ? 'json' : 'txt'
  // 返回 `join(getToolResultsDir(), `${id}.${ext}`)`，作为共享工具这次计算的结果。
  return join(getToolResultsDir(), `${id}.${ext}`)
}

/**
 * Ensure the session-specific tool results directory exists
 */
// ensureToolResultsDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureToolResultsDir(): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(getToolResultsDir(), { recursive: true })` 完成，再继续共享工具 tool Result Storage的异步流程。
    await mkdir(getToolResultsDir(), { recursive: true })
  } catch {
    // Directory may already exist
  }
}

/**
 * Persist a tool result to disk and return information about the persisted file
 *
 * @param content - The tool result content to persist (string or array of content blocks)
 * @param toolUseId - The ID of the tool use that produced the result
 * @returns Information about the persisted file including filepath and preview
 */
// persistToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function persistToolResult(
  content: NonNullable<ToolResultBlockParam['content']>,
  toolUseId: string,
): Promise<PersistedToolResult | PersistToolResultError> {
  // isJson记录 `Array.isArray` 是否成立，共享工具随后按该结果分支。
  const isJson = Array.isArray(content)

  // Check for non-text content - we can only persist text blocks
  // 满足 `isJson` 时，共享工具执行该分支。
  if (isJson) {
    // hasNonTextContent记录 `content.some` 是否成立，共享工具随后按该结果分支。
    const hasNonTextContent = content.some(block => block.type !== 'text')
    // 满足 `hasNonTextContent` 时，共享工具执行该分支。
    if (hasNonTextContent) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        error: 'Cannot persist tool results containing non-text content',
      }
    }
  }

  // 等待 `ensureToolResultsDir()` 完成，再继续共享工具 tool Result Storage的异步流程。
  await ensureToolResultsDir()
  // filepath 路径数据读取`getToolResultPath`，供共享工具后续处理使用。
  const filepath = getToolResultPath(toolUseId, isJson)
  // contentStr保存`jsonStringify`，供共享工具后续处理使用。
  const contentStr = isJson ? jsonStringify(content, null, 2) : content

  // tool_use_id is unique per invocation and content is deterministic for a
  // given id, so skip if the file already exists. This prevents re-writing
  // the same content on every API turn when microcompact replays the
  // original messages. Use 'wx' instead of a stat-then-write race.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(filepath, contentStr, { encoding: 'utf-8', flag: 'wx' })` 完成，再继续共享工具 tool Result Storage的异步流程。
    await writeFile(filepath, contentStr, { encoding: 'utf-8', flag: 'wx' })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Persisted tool result to ${filepath} (${formatFileSize(contentStr.length)})`,
    )
  } catch (error) {
    // `getErrnoCode(error)` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
    if (getErrnoCode(error) !== 'EEXIST') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { error: getFileSystemErrorMessage(toError(error)) }
    }
    // EEXIST: already persisted on a prior turn, fall through to preview
  }

  // Generate a preview
  // 从 `generatePreview(contentStr, PREVIEW_SIZE_BYTES)` 解构 preview、hasMore，减少共享工具 tool Result Storage对同一对象的重复访问。
  const { preview, hasMore } = generatePreview(contentStr, PREVIEW_SIZE_BYTES)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    filepath,
    originalSize: contentStr.length,
    isJson,
    preview,
    hasMore,
  }
}

/**
 * Build a message for large tool results with preview
 */
// buildLargeToolResultMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildLargeToolResultMessage(
  result: PersistedToolResult,
): string {
  // 消息 命名 ``${PERSISTED_OUTPUT_TAG}\n``，让后续代码直接表达这个值的用途。
  let message = `${PERSISTED_OUTPUT_TAG}\n`
  // 共享工具 tool Result Storage在这里处理 `message += `Output too large (${formatFileSize(result.originalSize)}). ...`，完成这一小步状态转换。
  message += `Output too large (${formatFileSize(result.originalSize)}). Full output saved to: ${result.filepath}\n\n`
  // 共享工具 tool Result Storage在这里处理 `message += `Preview (first ${formatFileSize(PREVIEW_SIZE_BYTES)}):\n``，完成这一小步状态转换。
  message += `Preview (first ${formatFileSize(PREVIEW_SIZE_BYTES)}):\n`
  // 共享工具 tool Result Storage在这里处理 `message += result.preview`，完成这一小步状态转换。
  message += result.preview
  // 共享工具 tool Result Storage在这里处理 `message += result.hasMore ? '\n...\n' : '\n'`，完成这一小步状态转换。
  message += result.hasMore ? '\n...\n' : '\n'
  // 共享工具 tool Result Storage在这里处理 `message += PERSISTED_OUTPUT_CLOSING_TAG`，完成这一小步状态转换。
  message += PERSISTED_OUTPUT_CLOSING_TAG
  // 返回 `message`，作为共享工具这次计算的结果。
  return message
}

/**
 * Process a tool result for inclusion in a message.
 * Maps the result to the API format and persists large results to disk.
 */
// processToolResultBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processToolResultBlock<T>(
  tool: {
    name: string
    maxResultSizeChars: number
    // 共享工具 tool Result Storage在这里处理 `mapToolResultToToolResultBlockParam: (`，完成这一小步状态转换。
    mapToolResultToToolResultBlockParam: (
      result: T,
      toolUseID: string,
    ) => ToolResultBlockParam
  },
  toolUseResult: T,
  toolUseID: string,
): Promise<ToolResultBlockParam> {
  // toolResultBlock派生`tool.mapToolResultToToolResultBlockParam`，供共享工具后续处理使用。
  const toolResultBlock = tool.mapToolResultToToolResultBlockParam(
    toolUseResult,
    toolUseID,
  )
  // 返回 `maybePersistLargeToolResult(`，作为共享工具这次计算的结果。
  return maybePersistLargeToolResult(
    toolResultBlock,
    tool.name,
    getPersistenceThreshold(tool.name, tool.maxResultSizeChars),
  )
}

/**
 * Process a pre-mapped tool result block. Applies persistence for large results
 * without re-calling mapToolResultToToolResultBlockParam.
 */
// processPreMappedToolResultBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processPreMappedToolResultBlock(
  toolResultBlock: ToolResultBlockParam,
  toolName: string,
  maxResultSizeChars: number,
): Promise<ToolResultBlockParam> {
  // 返回 `maybePersistLargeToolResult(`，作为共享工具这次计算的结果。
  return maybePersistLargeToolResult(
    toolResultBlock,
    toolName,
    getPersistenceThreshold(toolName, maxResultSizeChars),
  )
}

/**
 * True when a tool_result's content is empty or effectively empty. Covers:
 * undefined/null/'', whitespace-only strings, empty arrays, and arrays whose
 * only blocks are text blocks with empty/whitespace text. Non-text blocks
 * (images, tool_reference) are treated as non-empty.
 */
// isToolResultContentEmpty 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isToolResultContentEmpty(
  content: ToolResultBlockParam['content'],
): boolean {
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) return true
  // 满足 `typeof content === 'string') return content.trim(` 时，共享工具执行该分支。
  if (typeof content === 'string') return content.trim() === ''
  // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
  if (!Array.isArray(content)) return false
  // 文本内容为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (content.length === 0) return true
  // 返回 `content.every(`，作为共享工具这次计算的结果。
  return content.every(
    // block更新为 `>`，确保共享工具后续读取最新状态。
    block =>
      typeof block === 'object' &&
      'type' in block &&
      block.type === 'text' &&
      'text' in block &&
      (typeof block.text !== 'string' || block.text.trim() === ''),
  )
}

/**
 * Handle large tool results by persisting to disk instead of truncating.
 * Returns the original block if no persistence needed, or a modified block
 * with the content replaced by a reference to the persisted file.
 */
// maybePersistLargeToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function maybePersistLargeToolResult(
  toolResultBlock: ToolResultBlockParam,
  toolName: string,
  persistenceThreshold?: number,
): Promise<ToolResultBlockParam> {
  // Check size first before doing any async work - most tool results are small
  // 文本内容保存`toolResultBlock.content`，供后续判断或组装使用。
  const content = toolResultBlock.content

  // inc-4586: Empty tool_result content at the prompt tail causes some models
  // (notably capybara) to emit the \n\nHuman: stop sequence and end their turn
  // with zero output. The server renderer inserts no \n\nAssistant: marker after
  // tool results, so a bare </function_results>\n\n pattern-matches to a turn
  // boundary. Several tools can legitimately produce empty output (silent-success
  // shell commands, MCP servers returning content:[], REPL statements, etc.).
  // Inject a short marker so the model always has something to react to.
  // 满足 `isToolResultContentEmpty(content)` 时，共享工具执行该分支。
  if (isToolResultContentEmpty(content)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_empty_result', {
      toolName: sanitizeToolNameForAnalytics(toolName),
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...toolResultBlock,
      content: `(${toolName} completed with no output)`,
    }
  }
  // Narrow after the emptiness guard — content is non-nullish past this point.
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) {
    // 返回 `toolResultBlock`，作为共享工具这次计算的结果。
    return toolResultBlock
  }

  // Skip persistence for image content blocks - they need to be sent as-is to Claude
  // 满足 `hasImageBlock(content)` 时，共享工具执行该分支。
  if (hasImageBlock(content)) {
    // 返回 `toolResultBlock`，作为共享工具这次计算的结果。
    return toolResultBlock
  }

  // size保存`contentSize`，供共享工具后续处理使用。
  const size = contentSize(content)

  // Use tool-specific threshold if provided, otherwise fall back to global limit
  // threshold 命名 `persistenceThreshold ?? MAX_TOOL_RESULT_BYTES`，让后续代码直接表达这个值的用途。
  const threshold = persistenceThreshold ?? MAX_TOOL_RESULT_BYTES
  // 满足 `size <= threshold` 时，共享工具执行该分支。
  if (size <= threshold) {
    // 返回 `toolResultBlock`，作为共享工具这次计算的结果。
    return toolResultBlock
  }

  // Persist the entire content as a unit
  // 结果保存`persistToolResult`，供共享工具后续处理使用。
  const result = await persistToolResult(content, toolResultBlock.tool_use_id)
  // 满足 `isPersistError(result)` 时，共享工具执行该分支。
  if (isPersistError(result)) {
    // If persistence failed, return the original block unchanged
    // 返回 `toolResultBlock`，作为共享工具这次计算的结果。
    return toolResultBlock
  }

  // 消息构建`buildLargeToolResultMessage`，供共享工具后续处理使用。
  const message = buildLargeToolResultMessage(result)

  // Log analytics
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_tool_result_persisted', {
    toolName: sanitizeToolNameForAnalytics(toolName),
    originalSizeBytes: result.originalSize,
    persistedSizeBytes: message.length,
    estimatedOriginalTokens: Math.ceil(result.originalSize / BYTES_PER_TOKEN),
    estimatedPersistedTokens: Math.ceil(message.length / BYTES_PER_TOKEN),
    thresholdUsed: threshold,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { ...toolResultBlock, content: message }
}

/**
 * Generate a preview of content, truncating at a newline boundary when possible.
 */
// generatePreview 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generatePreview(
  content: string,
  maxBytes: number,
): { preview: string; hasMore: boolean } {
  // 满足 `content.length <= maxBytes` 时，共享工具执行该分支。
  if (content.length <= maxBytes) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { preview: content, hasMore: false }
  }

  // Find the last newline within the limit to avoid cutting mid-line
  // truncated格式化`content.slice`，供共享工具后续处理使用。
  const truncated = content.slice(0, maxBytes)
  // lastNewline保存`truncated.lastIndexOf`，供共享工具后续处理使用。
  const lastNewline = truncated.lastIndexOf('\n')

  // If we found a newline reasonably close to the limit, use it
  // Otherwise fall back to the exact limit
  // cutPoint保存`lastNewline > maxBytes * 0.5 ? lastNewline : maxBytes`，供共享工具 tool Result Storage后续判断或输出使用。
  const cutPoint = lastNewline > maxBytes * 0.5 ? lastNewline : maxBytes

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { preview: content.slice(0, cutPoint), hasMore: true }
}

/**
 * Type guard to check if persist result is an error
 */
// isPersistError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPersistError(
  result: PersistedToolResult | PersistToolResultError,
): result is PersistToolResultError {
  // 返回 `'error' in result`，作为共享工具这次计算的结果。
  return 'error' in result
}

// --- Message-level aggregate tool result budget ---
//
// Tracks replacement state across turns so enforceToolResultBudget makes the
// same choices every time (preserves prompt cache prefix).

/**
 * Per-conversation-thread state for the aggregate tool result budget.
 * State must be stable to preserve prompt cache:
 *   - seenIds: results that have passed through the budget check (replaced
 *     or not). Once seen, a result's fate is frozen for the conversation.
 *   - replacements: subset of seenIds that were persisted to disk and
 *     replaced with previews, mapped to the exact preview string shown to
 *     the model. Re-application is a Map lookup — no file I/O, guaranteed
 *     byte-identical, cannot fail.
 *
 * Lifecycle: one instance per conversation thread, carried on ToolUseContext.
 * Main thread: REPL provisions once, never resets — stale entries after
 * /clear, rewind, resume, or compact are never looked up (tool_use_ids are
 * UUIDs) so they're harmless. Subagents: createSubagentContext clones the
 * parent's state by default (cache-sharing forks like agentSummary need
 * identical decisions), or resumeAgentBackground threads one reconstructed
 * from sidechain records.
 */
// ContentReplacementState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ContentReplacementState = {
  seenIds: Set<string>
  replacements: Map<string, string>
}

// createContentReplacementState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createContentReplacementState(): ContentReplacementState {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { seenIds: new Set(), replacements: new Map() }
}

/**
 * Clone replacement state for a cache-sharing fork (e.g. agentSummary).
 * The fork needs state identical to the source at fork time so
 * enforceToolResultBudget makes the same choices → same wire prefix →
 * prompt cache hit. Mutating the clone does not affect the source.
 */
// cloneContentReplacementState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cloneContentReplacementState(
  source: ContentReplacementState,
): ContentReplacementState {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    seenIds: new Set(source.seenIds),
    replacements: new Map(source.replacements),
  }
}

/**
 * Resolve the per-message aggregate budget limit. GrowthBook override
 * (tengu_hawthorn_window) wins when present and a finite positive number;
 * otherwise falls back to the hardcoded constant. Defensive typeof/finite
 * check: GrowthBook's cache returns `cached !== undefined ? cached : default`,
 * so a flag served as null/string/NaN leaks through.
 */
// getPerMessageBudgetLimit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPerMessageBudgetLimit(): number {
  // override读取`getFeatureValue_CACHED_MAY_BE_STALE<number | null>(`，供后续判断或组装使用。
  const override = getFeatureValue_CACHED_MAY_BE_STALE<number | null>(
    'tengu_hawthorn_window',
    null,
  )
  // 共享工具在这里按实际状态进入对应分支。
  if (
    typeof override === 'number' &&
    Number.isFinite(override) &&
    override > 0
  ) {
    // 返回 `override`，作为共享工具这次计算的结果。
    return override
  }
  // 返回 `MAX_TOOL_RESULTS_PER_MESSAGE_CHARS`，作为共享工具这次计算的结果。
  return MAX_TOOL_RESULTS_PER_MESSAGE_CHARS
}

/**
 * Provision replacement state for a new conversation thread.
 *
 * Encapsulates the feature-flag gate + reconstruct-vs-fresh choice:
 *   - Flag off → undefined (query.ts skips enforcement entirely)
 *   - No initialMessages (cold start) → fresh
 *   - initialMessages present → reconstruct (freeze all candidate IDs so the
 *     budget never replaces content the model already saw unreplaced). Empty
 *     or absent records freeze everything; non-empty records additionally
 *     populate the replacements Map for byte-identical re-apply.
 */
// provisionContentReplacementState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function provisionContentReplacementState(
  initialMessages?: Message[],
  initialContentReplacements?: ContentReplacementRecord[],
): ContentReplacementState | undefined {
  // enabled读取`getFeatureValue_CACHED_MAY_BE_STALE`，供共享工具后续处理使用。
  const enabled = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_hawthorn_steeple',
    false,
  )
  // enabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!enabled) return undefined
  // 满足 `initialMessages` 时，共享工具执行该分支。
  if (initialMessages) {
    // 返回 `reconstructContentReplacementState(`，作为共享工具这次计算的结果。
    return reconstructContentReplacementState(
      initialMessages,
      initialContentReplacements ?? [],
    )
  }
  // 返回 `createContentReplacementState()`，作为共享工具这次计算的结果。
  return createContentReplacementState()
}

/**
 * Serializable record of one content-replacement decision. Written to the
 * transcript as a ContentReplacementEntry so decisions survive resume.
 * Discriminated by `kind` so future replacement mechanisms (user text,
 * offloaded images) can share the same transcript entry type.
 *
 * `replacement` is the exact string the model saw — stored rather than
 * derived on resume so code changes to the preview template, size formatting,
 * or path layout can't silently break prompt cache.
 */
// ContentReplacementRecord 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ContentReplacementRecord = {
  kind: 'tool-result'
  toolUseId: string
  replacement: string
}

// ToolResultReplacementRecord 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolResultReplacementRecord = Extract<
  ContentReplacementRecord,
  { kind: 'tool-result' }
>

// ToolResultCandidate 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolResultCandidate = {
  toolUseId: string
  content: NonNullable<ToolResultBlockParam['content']>
  size: number
}

// CandidatePartition 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CandidatePartition = {
  mustReapply: Array<ToolResultCandidate & { replacement: string }>
  frozen: ToolResultCandidate[]
  fresh: ToolResultCandidate[]
}

// isContentAlreadyCompacted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isContentAlreadyCompacted(
  content: ToolResultBlockParam['content'],
): boolean {
  // All budget-produced content starts with the tag (buildLargeToolResultMessage).
  // `.startsWith()` avoids false-positives when the tag appears anywhere else
  // in the content (e.g., reading this source file).
  // 返回 `typeof content === 'string' && content.startsWith(PERSISTED_OUTPUT_TAG)`，作为共享工具这次计算的结果。
  return typeof content === 'string' && content.startsWith(PERSISTED_OUTPUT_TAG)
}

// hasImageBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasImageBlock(
  content: NonNullable<ToolResultBlockParam['content']>,
): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    Array.isArray(content) &&
    content.some(
      // b更新为 `> typeof b === 'object' && 'type' in b && b.type === 'ima...`，确保共享工具后续读取最新状态。
      b => typeof b === 'object' && 'type' in b && b.type === 'image',
    )
  )
}

// contentSize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function contentSize(
  content: NonNullable<ToolResultBlockParam['content']>,
): number {
  // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof content === 'string') return content.length
  // Sum text-block lengths directly. Slightly under-counts vs serialized
  // (no JSON framing), but the budget is a rough token heuristic anyway.
  // Avoids allocating a content-sized string every enforcement pass.
  // 返回 `content.reduce(`，作为共享工具这次计算的结果。
  return content.reduce(
    // 这个回调绑定到 (sum, b) => sum + (b.type === 'text' ? b.text.length : 0),，负责共享工具在该局部场景下的响应。
    (sum, b) => sum + (b.type === 'text' ? b.text.length : 0),
    0,
  )
}

/**
 * Walk messages and build tool_use_id → tool_name from assistant tool_use
 * blocks. tool_use always precedes its tool_result (model calls, then result
 * arrives), so by the time budget enforcement sees a result, its name is known.
 */
// buildToolNameMap 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildToolNameMap(messages: Message[]): Map<string, string> {
  // map构建`new Map<string, string>()` 整理出中间结果，供共享工具 tool Result Storage后续步骤使用。
  const map = new Map<string, string>()
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // `message.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'assistant') continue
    // 文本内容保存`message.message.content`，供共享工具 tool Result Storage后续判断或输出使用。
    const content = message.message.content
    // 满足 `!Array.isArray(content)` 时，共享工具执行该分支。
    if (!Array.isArray(content)) continue
    // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
    for (const block of content) {
      // 当 `block.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
      if (block.type === 'tool_use') {
        // map.set 写入新的状态值，使共享工具后续读取保持一致。
        map.set(block.id, block.name)
      }
    }
  }
  // 返回 `map`，作为共享工具这次计算的结果。
  return map
}

/**
 * Extract candidate tool_result blocks from a single user message: blocks
 * that are non-empty, non-image, and not already compacted by tag (i.e. by
 * the per-tool limit, or an earlier iteration of this same query call).
 * Returns [] for messages with no eligible blocks.
 */
// collectCandidatesFromMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectCandidatesFromMessage(message: Message): ToolResultCandidate[] {
  // `message.type` 与 `'user' || !Array.isArray(messag...` 不一致时刷新派生状态，避免使用过期结果。
  if (message.type !== 'user' || !Array.isArray(message.message.content)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `message.message.content.flatMap(block => {`，作为共享工具这次计算的结果。
  return message.message.content.flatMap(block => {
    // `block.type` 与 `'tool_result' || !block.content` 不一致时刷新派生状态，避免使用过期结果。
    if (block.type !== 'tool_result' || !block.content) return []
    // 满足 `isContentAlreadyCompacted(block.content)` 时，共享工具执行该分支。
    if (isContentAlreadyCompacted(block.content)) return []
    // 满足 `hasImageBlock(block.content)` 时，共享工具执行该分支。
    if (hasImageBlock(block.content)) return []
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [
      {
        toolUseId: block.tool_use_id,
        content: block.content,
        size: contentSize(block.content),
      },
    ]
  })
}

/**
 * Extract candidate tool_result blocks grouped by API-level user message.
 *
 * normalizeMessagesForAPI merges consecutive user messages into one
 * (Bedrock compat; 1P does the same server-side), so parallel tool
 * results that arrive as N separate user messages in our state become
 * ONE user message on the wire. The budget must group the same way or
 * it would see N under-budget messages instead of one over-budget
 * message and fail to enforce exactly when it matters most.
 *
 * A "group" is a maximal run of user messages NOT separated by an
 * assistant message. Only assistant messages create wire-level
 * boundaries — normalizeMessagesForAPI filters out progress entirely
 * and merges attachment / system(local_command) INTO adjacent user
 * blocks, so those types do NOT break groups here either.
 *
 * This matters for abort-during-parallel-tools paths: agent_progress
 * messages (non-ephemeral, persisted in REPL state) can interleave
 * between fresh tool_result messages. If we flushed on progress, those
 * tool_results would split into under-budget groups, slip through
 * unreplaced, get frozen, then be merged by normalizeMessagesForAPI
 * into one over-budget wire message — defeating the feature.
 *
 * Only groups with at least one eligible candidate are returned.
 */
// collectCandidatesByMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectCandidatesByMessage(
  messages: Message[],
): ToolResultCandidate[][] {
  // groups 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const groups: ToolResultCandidate[][] = []
  // current 从空数组开始收集，后续循环会按处理顺序追加条目。
  let current: ToolResultCandidate[] = []

  // flush封装成回调，供共享工具 tool Result Storage在事件触发或异步步骤中调用。
  const flush = () => {
    // 满足 `current.length > 0) groups.push(current` 时，共享工具执行该分支。
    if (current.length > 0) groups.push(current)
    // current更新为 `[]`，确保共享工具后续读取最新状态。
    current = []
  }

  // Track all assistant message.ids seen so far — same-ID fragments are
  // merged by normalizeMessagesForAPI (messages.ts ~2126 walks back PAST
  // different-ID assistants via `continue`), so any re-appearance of a
  // previously-seen ID must NOT create a group boundary. Two scenarios:
  //   • Consecutive: streamingToolExecution yields one AssistantMessage per
  //     content_block_stop (same id); a fast tool drains between blocks;
  //     abort/hook-stop leaves [asst(X), user(trA), asst(X), user(trB)].
  //   • Interleaved: coordinator/teammate streams mix different responses
  //     so [asst(X), user(trA), asst(Y), user(trB), asst(X), user(trC)].
  // In both, normalizeMessagesForAPI merges the X fragments into one wire
  // assistant, and their following tool_results merge into one wire user
  // message — so the budget must see them as one group too.
  // seenAsstIds 集合构建`new Set<string>()` 整理出中间结果，供共享工具 tool Result Storage后续步骤使用。
  const seenAsstIds = new Set<string>()
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const message of messages) {
    // 当 `message.type` 匹配 `'user'` 时，共享工具执行对应分支。
    if (message.type === 'user') {
      // current追加新条目，保持收集顺序与输入顺序一致。
      current.push(...collectCandidatesFromMessage(message))
    // 共享工具 tool Result Storage在这里处理 `} else if (message.type === 'assistant') {`，完成这一小步状态转换。
    } else if (message.type === 'assistant') {
      // 满足 `!seenAsstIds.has(message.message.id)` 时，共享工具执行该分支。
      if (!seenAsstIds.has(message.message.id)) {
        // 调用 flush，触发共享工具此处需要的副作用。
        flush()
        // 调用 seenAsstIds.add，触发共享工具此处需要的副作用。
        seenAsstIds.add(message.message.id)
      }
    }
    // progress / attachment / system are filtered or merged by
    // normalizeMessagesForAPI — they don't create wire boundaries.
  }
  // 调用 flush，触发共享工具此处需要的副作用。
  flush()

  // 返回 `groups`，作为共享工具这次计算的结果。
  return groups
}

/**
 * Partition candidates by their prior decision state:
 *  - mustReapply: previously replaced → re-apply the cached replacement for
 *    prefix stability
 *  - frozen: previously seen and left unreplaced → off-limits (replacing
 *    now would change a prefix that was already cached)
 *  - fresh: never seen → eligible for new replacement decisions
 */
// partitionByPriorDecision 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function partitionByPriorDecision(
  candidates: ToolResultCandidate[],
  state: ContentReplacementState,
): CandidatePartition {
  // 返回 `candidates.reduce<CandidatePartition>(`，作为共享工具这次计算的结果。
  return candidates.reduce<CandidatePartition>(
    // 这个回调绑定到 (acc, c) => {，负责共享工具在该局部场景下的响应。
    (acc, c) => {
      // replacement格式化`replacements.get`，供共享工具后续处理使用。
      const replacement = state.replacements.get(c.toolUseId)
      // `replacement` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (replacement !== undefined) {
        // mustReapply追加新条目，保持收集顺序与输入顺序一致。
        acc.mustReapply.push({ ...c, replacement })
      // 共享工具 tool Result Storage在这里处理 `} else if (state.seenIds.has(c.toolUseId)) {`，完成这一小步状态转换。
      } else if (state.seenIds.has(c.toolUseId)) {
        // frozen追加新条目，保持收集顺序与输入顺序一致。
        acc.frozen.push(c)
      } else {
        // fresh追加新条目，保持收集顺序与输入顺序一致。
        acc.fresh.push(c)
      }
      // 返回 `acc`，作为共享工具这次计算的结果。
      return acc
    },
    { mustReapply: [], frozen: [], fresh: [] },
  )
}

/**
 * Pick the largest fresh results to replace until the model-visible total
 * (frozen + remaining fresh) is at or under budget, or fresh is exhausted.
 * If frozen results alone exceed budget we accept the overage — microcompact
 * will eventually clear them.
 */
// selectFreshToReplace 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function selectFreshToReplace(
  fresh: ToolResultCandidate[],
  frozenSize: number,
  limit: number,
): ToolResultCandidate[] {
  // sorted保存`sort`，供共享工具后续处理使用。
  const sorted = [...fresh].sort((a, b) => b.size - a.size)
  // selected 从空数组开始收集，后续循环会按处理顺序追加条目。
  const selected: ToolResultCandidate[] = []
  // remaining派生`fresh.reduce`，供共享工具后续处理使用。
  let remaining = frozenSize + fresh.reduce((sum, c) => sum + c.size, 0)
  // 按顺序遍历 `sorted` 中的c，逐个交给共享工具处理。
  for (const c of sorted) {
    // 满足 `remaining <= limit` 时，共享工具执行该分支。
    if (remaining <= limit) break
    // selected追加新条目，保持收集顺序与输入顺序一致。
    selected.push(c)
    // We don't know the replacement size until after persist, but previews
    // are ~2K and results hitting this path are much larger, so subtracting
    // the full size is a close approximation for selection purposes.
    // 共享工具 tool Result Storage在这里处理 `remaining -= c.size`，完成这一小步状态转换。
    remaining -= c.size
  }
  // 返回 `selected`，作为共享工具这次计算的结果。
  return selected
}

/**
 * Return a new Message[] where each tool_result block whose id appears in
 * replacementMap has its content replaced. Messages and blocks with no
 * replacements are passed through by reference.
 */
// replaceToolResultContents 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function replaceToolResultContents(
  messages: Message[],
  replacementMap: Map<string, string>,
): Message[] {
  // 返回 `messages.map(message => {`，作为共享工具这次计算的结果。
  return messages.map(message => {
    // `message.type` 与 `'user' || !Array.isArray(messag...` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'user' || !Array.isArray(message.message.content)) {
      // 返回 `message`，作为共享工具这次计算的结果。
      return message
    }
    // 文本内容保存`message.message.content`，供共享工具 tool Result Storage后续判断或输出使用。
    const content = message.message.content
    // needsReplace记录 `content.some` 是否成立，共享工具随后按该结果分支。
    const needsReplace = content.some(
      // b更新为 `> b.type === 'tool_result' && replacementMap.has(b.tool_u...`，确保共享工具后续读取最新状态。
      b => b.type === 'tool_result' && replacementMap.has(b.tool_use_id),
    )
    // needsReplace缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!needsReplace) return message
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...message,
      message: {
        ...message.message,
        // 这个回调绑定到 content: content.map(block => {，负责共享工具在该局部场景下的响应。
        content: content.map(block => {
          // `block.type` 与 `'tool_result'` 不一致时刷新派生状态，避免使用过期结果。
          if (block.type !== 'tool_result') return block
          // replacement格式化`replacementMap.get`，供共享工具后续处理使用。
          const replacement = replacementMap.get(block.tool_use_id)
          // 返回 `replacement === undefined`，作为共享工具这次计算的结果。
          return replacement === undefined
            ? block
            : { ...block, content: replacement }
        }),
      },
    }
  })
}

// buildReplacement 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function buildReplacement(
  candidate: ToolResultCandidate,
): Promise<{ content: string; originalSize: number } | null> {
  // 结果保存`persistToolResult`，供共享工具后续处理使用。
  const result = await persistToolResult(candidate.content, candidate.toolUseId)
  // 满足 `isPersistError(result)` 时，共享工具执行该分支。
  if (isPersistError(result)) return null
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    content: buildLargeToolResultMessage(result),
    originalSize: result.originalSize,
  }
}

/**
 * Enforce the per-message budget on aggregate tool result size.
 *
 * For each user message whose tool_result blocks together exceed the
 * per-message limit (see getPerMessageBudgetLimit), the largest FRESH
 * (never-before-seen) results in THAT message are persisted to disk and
 * replaced with previews.
 * Messages are evaluated independently — a 150K result in one message and
 * a 150K result in another are both under budget and untouched.
 *
 * State is tracked by tool_use_id in `state`. Once a result is seen its
 * fate is frozen: previously-replaced results get the same replacement
 * re-applied every turn from the cached preview string (zero I/O,
 * byte-identical), and previously-unreplaced results are never replaced
 * later (would break prompt cache).
 *
 * Each turn adds at most one new user message with tool_result blocks,
 * so the per-message loop typically does the budget check at most once;
 * all prior messages just re-apply cached replacements.
 *
 * @param state — MUTATED: seenIds and replacements are updated in place
 *   to record choices made this call. The caller holds a stable reference
 *   across turns; returning a new object would require error-prone ref
 *   updates after every query.
 *
 * Returns `{ messages, newlyReplaced }`:
 *   - messages: same array instance when no replacement is needed
 *   - newlyReplaced: replacements made THIS call (not re-applies).
 *     Caller persists these to the transcript for resume reconstruction.
 */
// enforceToolResultBudget 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function enforceToolResultBudget(
  messages: Message[],
  state: ContentReplacementState,
  skipToolNames: ReadonlySet<string> = new Set(),
): Promise<{
  messages: Message[]
  newlyReplaced: ToolResultReplacementRecord[]
}> {
  // candidatesByMessage 消息数据保存`collectCandidatesByMessage`，供共享工具后续处理使用。
  const candidatesByMessage = collectCandidatesByMessage(messages)
  // nameByToolUseId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const nameByToolUseId =
    skipToolNames.size > 0 ? buildToolNameMap(messages) : undefined
  // shouldSkip封装成回调，供共享工具 tool Result Storage在事件触发或异步步骤中调用。
  const shouldSkip = (id: string): boolean =>
    nameByToolUseId !== undefined &&
    skipToolNames.has(nameByToolUseId.get(id) ?? '')
  // Resolve once per call. A mid-session flag change only affects FRESH
  // messages (prior decisions are frozen via seenIds/replacements), so
  // prompt cache for already-seen content is preserved regardless.
  // limit读取`getPerMessageBudgetLimit`，供共享工具后续处理使用。
  const limit = getPerMessageBudgetLimit()

  // Walk each API-level message group independently. For previously-processed messages
  // (all IDs in seenIds) this just re-applies cached replacements. For the
  // single new message this turn added, it runs the budget check.
  // replacementMap 命名 `new Map<string, string>()`，让后续代码直接表达这个值的用途。
  const replacementMap = new Map<string, string>()
  // toPersist 从空数组开始收集，后续循环会按处理顺序追加条目。
  const toPersist: ToolResultCandidate[] = []
  // reappliedCount 数量保存`0`，供共享工具 tool Result Storage后续判断或输出使用。
  let reappliedCount = 0
  // messagesOverBudget 消息数据保存`0`，供后续判断或组装使用。
  let messagesOverBudget = 0

  // 按顺序遍历 `candidatesByMessage` 中的candidates 集合，逐个交给共享工具处理。
  for (const candidates of candidatesByMessage) {
    // 从 `partitionByPriorDecision(` 解构 mustReapply、frozen、fresh，减少共享工具 tool Result Storage对同一对象的重复访问。
    const { mustReapply, frozen, fresh } = partitionByPriorDecision(
      candidates,
      state,
    )

    // Re-apply: pure Map lookups. No file I/O, byte-identical, cannot fail.
    // 调用 mustReapply.forEach，触发共享工具此处需要的副作用。
    mustReapply.forEach(c => replacementMap.set(c.toolUseId, c.replacement))
    // 共享工具 tool Result Storage在这里处理 `reappliedCount += mustReapply.length`，完成这一小步状态转换。
    reappliedCount += mustReapply.length

    // Fresh means this is a new message. Check its per-message budget.
    // (A previously-processed message has fresh.length === 0 because all
    // its IDs were added to seenIds when first seen.)
    // fresh为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (fresh.length === 0) {
      // mustReapply/frozen are already in seenIds from their first pass —
      // re-adding is a no-op but keeps the invariant explicit.
      // 调用 candidates.forEach，触发共享工具此处需要的副作用。
      candidates.forEach(c => state.seenIds.add(c.toolUseId))
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Tools with maxResultSizeChars: Infinity (Read) — never persist.
    // Mark as seen (frozen) so the decision sticks across turns. They don't
    // count toward freshSize; if that lets the group slip under budget and
    // the wire message is still large, that's the contract — Read's own
    // maxTokens is the bound, not this wrapper.
    // skipped筛选`fresh.filter`，供共享工具后续处理使用。
    const skipped = fresh.filter(c => shouldSkip(c.toolUseId))
    // 调用 skipped.forEach，触发共享工具此处需要的副作用。
    skipped.forEach(c => state.seenIds.add(c.toolUseId))
    // eligible筛选`fresh.filter`，供共享工具后续处理使用。
    const eligible = fresh.filter(c => !shouldSkip(c.toolUseId))

    // frozenSize派生`frozen.reduce`，供共享工具后续处理使用。
    const frozenSize = frozen.reduce((sum, c) => sum + c.size, 0)
    // freshSize派生`eligible.reduce`，供共享工具后续处理使用。
    const freshSize = eligible.reduce((sum, c) => sum + c.size, 0)

    // selected 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const selected =
      frozenSize + freshSize > limit
        ? selectFreshToReplace(eligible, frozenSize, limit)
        : []

    // Mark non-persisting candidates as seen NOW (synchronously). IDs
    // selected for persist are marked seen AFTER the await, alongside
    // replacements.set — keeps the pair atomic under observation so no
    // concurrent reader (once subagents share state) ever sees X∈seenIds
    // but X∉replacements, which would misclassify X as frozen and send
    // full content while the main thread sends the preview → cache miss.
    // selectedIds 集合保存`Set`，供共享工具后续处理使用。
    const selectedIds = new Set(selected.map(c => c.toolUseId))
    // 共享工具 tool Result Storage在这里处理 `candidates`，完成这一小步状态转换。
    candidates
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(c => !selectedIds.has(c.toolUseId))
      // 链式调用 forEach，继续加工上一行在共享工具中产生的数据。
      .forEach(c => state.seenIds.add(c.toolUseId))

    // selected为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (selected.length === 0) continue
    // 共享工具 tool Result Storage在这里处理 `messagesOverBudget++`，完成这一小步状态转换。
    messagesOverBudget++
    // toPersist追加新条目，保持收集顺序与输入顺序一致。
    toPersist.push(...selected)
  }

  // 只有 `replacementMap.size === 0 && toPersist.length ===` 满足时，共享工具才执行该分支。
  if (replacementMap.size === 0 && toPersist.length === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { messages, newlyReplaced: [] }
  }

  // Fresh: concurrent persist for all selected candidates across all
  // messages. In practice toPersist comes from a single message per turn.
  // freshReplacements 集合保存`Promise.all`，供共享工具后续处理使用。
  const freshReplacements = await Promise.all(
    // 调用 toPersist.map，触发共享工具此处需要的副作用。
    toPersist.map(async c => [c, await buildReplacement(c)] as const),
  )
  // newlyReplaced 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newlyReplaced: ToolResultReplacementRecord[] = []
  // replacedSize保存`0`，供后续判断或组装使用。
  let replacedSize = 0
  // 循环处理 `const [candidate, replacement] of freshReplacemen`，让共享工具逐项把同类条目按顺序走完。
  for (const [candidate, replacement] of freshReplacements) {
    // Mark seen HERE, post-await, atomically with replacements.set for
    // success cases. For persist failures (replacement === null) the ID
    // is seen-but-unreplaced — the original content was sent to the
    // model, so treating it as frozen going forward is correct.
    // 调用 state.seenIds.add，触发共享工具此处需要的副作用。
    state.seenIds.add(candidate.toolUseId)
    // 满足 `replacement === null` 时，共享工具执行该分支。
    if (replacement === null) continue
    // 共享工具 tool Result Storage在这里处理 `replacedSize += candidate.size`，完成这一小步状态转换。
    replacedSize += candidate.size
    // replacementMap.set 写入新的状态值，使共享工具后续读取保持一致。
    replacementMap.set(candidate.toolUseId, replacement.content)
    // state.replacements.set 写入新的状态值，使共享工具后续读取保持一致。
    state.replacements.set(candidate.toolUseId, replacement.content)
    // newlyReplaced追加新条目，保持收集顺序与输入顺序一致。
    newlyReplaced.push({
      kind: 'tool-result',
      toolUseId: candidate.toolUseId,
      replacement: replacement.content,
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_result_persisted_message_budget', {
      originalSizeBytes: replacement.originalSize,
      persistedSizeBytes: replacement.content.length,
      estimatedOriginalTokens: Math.ceil(
        replacement.originalSize / BYTES_PER_TOKEN,
      ),
      estimatedPersistedTokens: Math.ceil(
        replacement.content.length / BYTES_PER_TOKEN,
      ),
    })
  }

  // 满足 `replacementMap.size === 0` 时，共享工具执行该分支。
  if (replacementMap.size === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { messages, newlyReplaced: [] }
  }

  // 满足 `newlyReplaced.length > 0` 时，共享工具执行该分支。
  if (newlyReplaced.length > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Per-message budget: persisted ${newlyReplaced.length} tool results ` +
        `across ${messagesOverBudget} over-budget message(s), ` +
        `shed ~${formatFileSize(replacedSize)}, ${reappliedCount} re-applied`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_message_level_tool_result_budget_enforced', {
      resultsPersisted: newlyReplaced.length,
      messagesOverBudget,
      replacedSizeBytes: replacedSize,
      reapplied: reappliedCount,
    })
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    messages: replaceToolResultContents(messages, replacementMap),
    newlyReplaced,
  }
}

/**
 * Query-loop integration point for the aggregate budget.
 *
 * Gates on `state` (undefined means feature disabled → no-op return),
 * applies enforcement, and fires an optional transcript-write callback
 * for new replacements. The caller (query.ts) owns the persistence gate
 * — it passes a callback only for querySources that read records back on
 * resume (repl_main_thread*, agent:*); ephemeral runForkedAgent callers
 * (agentSummary, sessionMemory, /btw, compact) pass undefined.
 *
 * @returns messages with replacements applied, or the input array unchanged
 *   when the feature is off or no replacement occurred.
 */
// applyToolResultBudget 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function applyToolResultBudget(
  messages: Message[],
  state: ContentReplacementState | undefined,
  writeToTranscript?: (records: ToolResultReplacementRecord[]) => void,
  skipToolNames?: ReadonlySet<string>,
): Promise<Message[]> {
  // 状态缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!state) return messages
  // 结果读取`enforceToolResultBudget`，供共享工具后续处理使用。
  const result = await enforceToolResultBudget(messages, state, skipToolNames)
  // 满足 `result.newlyReplaced.length > 0` 时，共享工具执行该分支。
  if (result.newlyReplaced.length > 0) {
    // 调用 writeToTranscript?.(result.newlyReplaced)，完成这一处局部操作。
    writeToTranscript?.(result.newlyReplaced)
  }
  // 返回 `result.messages`，作为共享工具这次计算的结果。
  return result.messages
}

/**
 * Reconstruct replacement state from content-replacement records loaded from
 * the transcript. Used on resume so the budget makes the same choices it
 * made in the original session (prompt cache stability).
 *
 * Accepts the full ContentReplacementRecord[] from LogOption (may include
 * future non-tool-result kinds); only tool-result records are applied here.
 *
 *   - replacements: populated directly from the stored replacement strings.
 *     Records for IDs not in messages (e.g. after compact) are skipped —
 *     they're inert anyway.
 *   - seenIds: every candidate tool_use_id in the loaded messages. A result
 *     being in the transcript means it was sent to the model, so it was seen.
 *     This freezes unreplaced results against future replacement.
 *   - inheritedReplacements: gap-fill for fork-subagent resume. A fork's
 *     original run applies parent-inherited replacements via mustReapply
 *     (never persisted — not newlyReplaced). On resume the sidechain has
 *     the original content but no record, so records alone would classify
 *     it as frozen. The parent's live state still has the mapping; copy
 *     it for IDs in messages that records don't cover. No-op for non-fork
 *     resumes (parent IDs aren't in the subagent's messages).
 */
// reconstructContentReplacementState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function reconstructContentReplacementState(
  messages: Message[],
  records: ContentReplacementRecord[],
  inheritedReplacements?: ReadonlyMap<string, string>,
): ContentReplacementState {
  // 状态构建`createContentReplacementState`，供共享工具后续处理使用。
  const state = createContentReplacementState()
  // candidateIds 集合保存`Set`，供共享工具后续处理使用。
  const candidateIds = new Set(
    collectCandidatesByMessage(messages)
      .flat()
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(c => c.toolUseId),
  )

  // 按顺序遍历 `candidateIds` 中的标识符，逐个交给共享工具处理。
  for (const id of candidateIds) {
    // 调用 state.seenIds.add，触发共享工具此处需要的副作用。
    state.seenIds.add(id)
  }
  // 按顺序遍历 `records` 中的r，逐个交给共享工具处理。
  for (const r of records) {
    // 只有 `r.kind === 'tool-result' && candidateIds.has(r.toolUseId)` 满足时，共享工具才执行该分支。
    if (r.kind === 'tool-result' && candidateIds.has(r.toolUseId)) {
      // state.replacements.set 写入新的状态值，使共享工具后续读取保持一致。
      state.replacements.set(r.toolUseId, r.replacement)
    }
  }
  // 满足 `inheritedReplacements` 时，共享工具执行该分支。
  if (inheritedReplacements) {
    // 循环处理 `const [id, replacement] of inheritedReplacements`，让共享工具逐项把同类条目按顺序走完。
    for (const [id, replacement] of inheritedReplacements) {
      // 只有 `candidateIds.has(id) && !state.replacements.has(id)` 满足时，共享工具才执行该分支。
      if (candidateIds.has(id) && !state.replacements.has(id)) {
        // state.replacements.set 写入新的状态值，使共享工具后续读取保持一致。
        state.replacements.set(id, replacement)
      }
    }
  }
  // 返回 `state`，作为共享工具这次计算的结果。
  return state
}

/**
 * AgentTool-resume variant: encapsulates the feature-flag gate + parent
 * gap-fill so both AgentTool.call and resumeAgentBackground share one
 * implementation. Returns undefined when parentState is undefined (feature
 * off); otherwise reconstructs from sidechain records with parent's live
 * replacements filling gaps for fork-inherited mustReapply entries.
 *
 * Kept out of AgentTool.tsx — that file is at the feature() DCE complexity
 * cliff and cannot tolerate even +1 net source line without silently
 * breaking feature('TRANSCRIPT_CLASSIFIER') eval in tests.
 */
// reconstructForSubagentResume 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function reconstructForSubagentResume(
  parentState: ContentReplacementState | undefined,
  resumedMessages: Message[],
  sidechainRecords: ContentReplacementRecord[],
): ContentReplacementState | undefined {
  // parentState 状态缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parentState) return undefined
  // 返回 `reconstructContentReplacementState(`，作为共享工具这次计算的结果。
  return reconstructContentReplacementState(
    resumedMessages,
    sidechainRecords,
    parentState.replacements,
  )
}

/**
 * Get a human-readable error message from a filesystem error
 */
// getFileSystemErrorMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFileSystemErrorMessage(error: Error): string {
  // Node.js filesystem errors have a 'code' property
  // eslint-disable-next-line no-restricted-syntax -- uses .path, not just .code
  // nodeError 错误信息保存`error as NodeJS.ErrnoException`，供共享工具 tool Result Storage后续判断或输出使用。
  const nodeError = error as NodeJS.ErrnoException
  // 满足 `nodeError.code` 时，共享工具执行该分支。
  if (nodeError.code) {
    // 按照 nodeError.code 的取值选择共享工具的具体处理分支。
    switch (nodeError.code) {
      case 'ENOENT':
        // 返回 ``Directory not found: ${nodeError.path ?? 'unknown path'}``，作为共享工具这次计算的结果。
        return `Directory not found: ${nodeError.path ?? 'unknown path'}`
      case 'EACCES':
        // 返回 ``Permission denied: ${nodeError.path ?? 'unknown path'}``，作为共享工具这次计算的结果。
        return `Permission denied: ${nodeError.path ?? 'unknown path'}`
      case 'ENOSPC':
        // 返回 `'No space left on device'`，作为共享工具这次计算的结果。
        return 'No space left on device'
      case 'EROFS':
        // 返回 `'Read-only file system'`，作为共享工具这次计算的结果。
        return 'Read-only file system'
      case 'EMFILE':
        // 返回 `'Too many open files'`，作为共享工具这次计算的结果。
        return 'Too many open files'
      case 'EEXIST':
        // 返回 ``File already exists: ${nodeError.path ?? 'unknown path'}``，作为共享工具这次计算的结果。
        return `File already exists: ${nodeError.path ?? 'unknown path'}`
      default:
        // 返回 ``${nodeError.code}: ${nodeError.message}``，作为共享工具这次计算的结果。
        return `${nodeError.code}: ${nodeError.message}`
    }
  }
  // 返回 `error.message`，作为共享工具这次计算的结果。
  return error.message
}
