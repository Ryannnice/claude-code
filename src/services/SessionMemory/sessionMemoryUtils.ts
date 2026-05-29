/**
 * Session Memory utility functions that can be imported without circular dependencies.
 * These are separate from the main sessionMemory.ts to avoid importing runAgent.
 */

// 复用 isFsInaccessible 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isFsInaccessible } from '../../utils/errors.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 复用 getSessionMemoryPath 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { getSessionMemoryPath } from '../../utils/permissions/filesystem.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'

// EXTRACTION_WAIT_TIMEOUT_MS 集合保存`15000`，供后续判断或组装使用。
const EXTRACTION_WAIT_TIMEOUT_MS = 15000
// EXTRACTION_STALE_THRESHOLD_MS 集合 命名 `60000 // 1 minute`，让后续代码直接表达这个值的用途。
const EXTRACTION_STALE_THRESHOLD_MS = 60000 // 1 minute

/**
 * Configuration for session memory extraction thresholds
 */
// SessionMemoryConfig 固化服务层 session Memory Utils里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionMemoryConfig = {
  /** Minimum context window tokens before initializing session memory.
   * Uses the same token counting as autocompact (input + output + cache tokens)
   * to ensure consistent behavior between the two features. */
  minimumMessageTokensToInit: number
  /** Minimum context window growth (in tokens) between session memory updates.
   * Uses the same token counting as autocompact (tokenCountWithEstimation)
   * to measure actual context growth, not cumulative API usage. */
  minimumTokensBetweenUpdate: number
  /** Number of tool calls between session memory updates */
  toolCallsBetweenUpdates: number
}

// Default configuration values
// DEFAULT_SESSION_MEMORY_CONFIG 会话数据 集中保存服务层 session Memory Utils要一起传递的字段。
export const DEFAULT_SESSION_MEMORY_CONFIG: SessionMemoryConfig = {
  minimumMessageTokensToInit: 10000,
  minimumTokensBetweenUpdate: 5000,
  toolCallsBetweenUpdates: 3,
}

// Current session memory configuration
// sessionMemoryConfig 会话数据 集中保存服务层 session Memory Utils要一起传递的字段。
let sessionMemoryConfig: SessionMemoryConfig = {
  ...DEFAULT_SESSION_MEMORY_CONFIG,
}

// Track the last summarized message ID (shared state)
// lastSummarizedMessageId 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
let lastSummarizedMessageId: string | undefined

// Track extraction state with timestamp (set by sessionMemory.ts)
// extractionStartedAt 先占位，稍后的条件分支会根据实际输入补齐它。
let extractionStartedAt: number | undefined

// Track context size at last memory extraction (for minimumTokensBetweenUpdate)
// tokensAtLastExtraction保存`0`，供后续判断或组装使用。
let tokensAtLastExtraction = 0

// Track whether session memory has been initialized (met minimumMessageTokensToInit)
// sessionMemoryInitialized 会话数据标记服务层 session Memory Utils是否启用对应路径。
let sessionMemoryInitialized = false

/**
 * Get the message ID up to which the session memory is current
 */
// getLastSummarizedMessageId 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastSummarizedMessageId(): string | undefined {
  // 返回 `lastSummarizedMessageId`，作为服务层 session Memory Utils这次计算的结果。
  return lastSummarizedMessageId
}

/**
 * Set the last summarized message ID (called from sessionMemory.ts)
 */
// setLastSummarizedMessageId 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLastSummarizedMessageId(
  messageId: string | undefined,
): void {
  // lastSummarizedMessageId 消息数据更新为 `messageId`，确保服务层后续读取最新状态。
  lastSummarizedMessageId = messageId
}

/**
 * Mark extraction as started (called from sessionMemory.ts)
 */
// markExtractionStarted 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markExtractionStarted(): void {
  // extractionStartedAt更新为 `Date.now()`，确保服务层后续读取最新状态。
  extractionStartedAt = Date.now()
}

/**
 * Mark extraction as completed (called from sessionMemory.ts)
 */
// markExtractionCompleted 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markExtractionCompleted(): void {
  // extractionStartedAt更新为 `undefined`，确保服务层后续读取最新状态。
  extractionStartedAt = undefined
}

/**
 * Wait for any in-progress session memory extraction to complete (with 15s timeout)
 * Returns immediately if no extraction is in progress or if extraction is stale (>1min old).
 */
// waitForSessionMemoryExtraction 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function waitForSessionMemoryExtraction(): Promise<void> {
  // startTime记录时间`Date.now`，供服务层 session Memory Utils后续处理使用。
  const startTime = Date.now()
  // while 使用 extractionStartedAt 完成服务层 session Memory Utils里的对应操作。
  while (extractionStartedAt) {
    // extractionAge记录时间`Date.now`，供服务层 session Memory Utils后续处理使用。
    const extractionAge = Date.now() - extractionStartedAt
    // 满足 `extractionAge > EXTRACTION_STALE_THRESHOLD_MS` 时，服务层 session Memory Utils执行该分支。
    if (extractionAge > EXTRACTION_STALE_THRESHOLD_MS) {
      // Extraction is stale, don't wait
      // 服务层 session Memory Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 满足 `Date.now() - startTime > EXTRACTION_WAIT_TIMEOUT_MS` 时，服务层 session Memory Utils执行该分支。
    if (Date.now() - startTime > EXTRACTION_WAIT_TIMEOUT_MS) {
      // Timeout - continue anyway
      // 服务层 session Memory Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 等待 `sleep(1000)` 完成，再继续服务层 session Memory Utils的异步流程。
    await sleep(1000)
  }
}

/**
 * Get the current session memory content
 */
// getSessionMemoryContent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionMemoryContent(): Promise<string | null> {
  // fs 集合读取`getFsImplementation`，供服务层 session Memory Utils后续处理使用。
  const fs = getFsImplementation()
  // memoryPath 路径数据读取`getSessionMemoryPath`，供服务层 session Memory Utils后续处理使用。
  const memoryPath = getSessionMemoryPath()

  // 保护这一段可能失败的服务层 session Memory Utils操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供服务层 session Memory Utils后续处理使用。
    const content = await fs.readFile(memoryPath, { encoding: 'utf-8' })

    // 记录服务层 session Memory Utils运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_session_memory_loaded', {
      content_length: content.length,
    })

    // 返回 `content`，作为服务层 session Memory Utils这次计算的结果。
    return content
  } catch (e: unknown) {
    // 满足 `isFsInaccessible(e)` 时，服务层 session Memory Utils执行该分支。
    if (isFsInaccessible(e)) return null
    // 抛出 e，阻止服务层 session Memory Utils在无效状态下继续运行。
    throw e
  }
}

/**
 * Set the session memory configuration
 */
// setSessionMemoryConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionMemoryConfig(
  config: Partial<SessionMemoryConfig>,
): void {
  // sessionMemoryConfig 会话数据更新为 `{`，确保服务层后续读取最新状态。
  sessionMemoryConfig = {
    ...sessionMemoryConfig,
    ...config,
  }
}

/**
 * Get the current session memory configuration
 */
// getSessionMemoryConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionMemoryConfig(): SessionMemoryConfig {
  // 返回结构化结果，集中表达服务层 session Memory Utils已经整理出的状态。
  return { ...sessionMemoryConfig }
}

/**
 * Record the context size at the time of extraction.
 * Used to measure context growth for minimumTokensBetweenUpdate threshold.
 */
// recordExtractionTokenCount 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordExtractionTokenCount(currentTokenCount: number): void {
  // tokensAtLastExtraction更新为 `currentTokenCount`，确保服务层后续读取最新状态。
  tokensAtLastExtraction = currentTokenCount
}

/**
 * Check if session memory has been initialized (met minimumTokensToInit threshold)
 */
// isSessionMemoryInitialized 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSessionMemoryInitialized(): boolean {
  // 返回 `sessionMemoryInitialized`，作为服务层 session Memory Utils这次计算的结果。
  return sessionMemoryInitialized
}

/**
 * Mark session memory as initialized
 */
// markSessionMemoryInitialized 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markSessionMemoryInitialized(): void {
  // sessionMemoryInitialized 会话数据更新为 `true`，确保服务层后续读取最新状态。
  sessionMemoryInitialized = true
}

/**
 * Check if we've met the threshold to initialize session memory.
 * Uses total context window tokens (same as autocompact) for consistent behavior.
 */
// hasMetInitializationThreshold 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasMetInitializationThreshold(
  currentTokenCount: number,
): boolean {
  // 返回 `currentTokenCount >= sessionMemoryConfig.minimumMessageTokensToInit`，作为服务层 session Memory Utils这次计算的结果。
  return currentTokenCount >= sessionMemoryConfig.minimumMessageTokensToInit
}

/**
 * Check if we've met the threshold for the next update.
 * Measures actual context window growth since last extraction
 * (same metric as autocompact and initialization threshold).
 */
// hasMetUpdateThreshold 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasMetUpdateThreshold(currentTokenCount: number): boolean {
  // tokensSinceLastExtraction保存`currentTokenCount - tokensAtLastExtraction`，供后续判断或组装使用。
  const tokensSinceLastExtraction = currentTokenCount - tokensAtLastExtraction
  // 返回 `(`，作为服务层 session Memory Utils这次计算的结果。
  return (
    tokensSinceLastExtraction >= sessionMemoryConfig.minimumTokensBetweenUpdate
  )
}

/**
 * Get the configured number of tool calls between updates
 */
// getToolCallsBetweenUpdates 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolCallsBetweenUpdates(): number {
  // 返回 `sessionMemoryConfig.toolCallsBetweenUpdates`，作为服务层 session Memory Utils这次计算的结果。
  return sessionMemoryConfig.toolCallsBetweenUpdates
}

/**
 * Reset session memory state (useful for testing)
 */
// resetSessionMemoryState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSessionMemoryState(): void {
  // sessionMemoryConfig 会话数据更新为 `{ ...DEFAULT_SESSION_MEMORY_CONFIG }`，确保服务层后续读取最新状态。
  sessionMemoryConfig = { ...DEFAULT_SESSION_MEMORY_CONFIG }
  // tokensAtLastExtraction更新为 `0`，确保服务层后续读取最新状态。
  tokensAtLastExtraction = 0
  // sessionMemoryInitialized 会话数据更新为 `false`，确保服务层后续读取最新状态。
  sessionMemoryInitialized = false
  // lastSummarizedMessageId 消息数据更新为 `undefined`，确保服务层后续读取最新状态。
  lastSummarizedMessageId = undefined
  // extractionStartedAt更新为 `undefined`，确保服务层后续读取最新状态。
  extractionStartedAt = undefined
}
