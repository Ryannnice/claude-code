/**
 * Files API client for managing files
 *
 * This module provides functionality to download and upload files to Anthropic Public Files API.
 * Used by the Claude Code agent to download file attachments at session startup.
 *
 * API Reference: https://docs.anthropic.com/en/api/files-content
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import * as fs from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 整理这一组导入，让API 服务 files Api后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'

// Files API is currently in beta. oauth-2025-04-20 enables Bearer OAuth
// on public-api routes (auth.py: "oauth_auth" not in beta_versions → 404).
// FILES_API_BETA_HEADER 文件数据保存`'files-api-2025-04-14,oauth-2025-04-20'`，作为后续固定文本处理的输入。
const FILES_API_BETA_HEADER = 'files-api-2025-04-14,oauth-2025-04-20'
// ANTHROPIC_VERSION固定为 `'2023-06-01'`，作为API 服务 files Api后续展示或比较的基准。
const ANTHROPIC_VERSION = '2023-06-01'

// API base URL - uses ANTHROPIC_BASE_URL set by env-manager for the appropriate environment
// Falls back to public API for standalone usage
// getDefaultApiBaseUrl 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDefaultApiBaseUrl(): string {
  // 返回 `(`，作为API 服务 files Api这次计算的结果。
  return (
    process.env.ANTHROPIC_BASE_URL ||
    process.env.CLAUDE_CODE_API_BASE_URL ||
    'https://api.anthropic.com'
  )
}

// logDebugError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logDebugError(message: string): void {
  // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[files-api] ${message}`, { level: 'error' })
}

// logDebug 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logDebug(message: string): void {
  // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[files-api] ${message}`)
}

/**
 * File specification parsed from CLI args
 * Format: --file=<file_id>:<relative_path>
 */
// File 固化API 服务 files Api里传递的数据形状，帮助调用方按同一结构读写字段。
export type File = {
  fileId: string
  relativePath: string
}

/**
 * Configuration for the files API client
 */
// FilesApiConfig 固化API 服务 files Api里传递的数据形状，帮助调用方按同一结构读写字段。
export type FilesApiConfig = {
  /** OAuth token for authentication (from session JWT) */
  oauthToken: string
  /** Base URL for the API (default: https://api.anthropic.com) */
  baseUrl?: string
  /** Session ID for creating session-specific directories */
  sessionId: string
}

/**
 * Result of a file download operation
 */
// DownloadResult 固化API 服务 files Api里传递的数据形状，帮助调用方按同一结构读写字段。
export type DownloadResult = {
  fileId: string
  path: string
  success: boolean
  error?: string
  bytesWritten?: number
}

// MAX_RETRIES 集合 命名 `3`，让后续代码直接表达这个值的用途。
const MAX_RETRIES = 3
// BASE_DELAY_MS 集合保存`500`，供后续判断或组装使用。
const BASE_DELAY_MS = 500
// MAX_FILE_SIZE_BYTES 文件数据 命名 `500 * 1024 * 1024 // 500MB`，让后续代码直接表达这个值的用途。
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024 // 500MB

/**
 * Result type for retry operations - signals whether to continue retrying
 */
// RetryResult 固化API 服务 files Api里传递的数据形状，帮助调用方按同一结构读写字段。
type RetryResult<T> = { done: true; value: T } | { done: false; error?: string }

/**
 * Executes an operation with exponential backoff retry logic
 *
 * @param operation - Operation name for logging
 * @param attemptFn - Function to execute on each attempt, returns RetryResult
 * @returns The successful result value
 * @throws Error if all retries exhausted
 */
// retryWithBackoff 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function retryWithBackoff<T>(
  operation: string,
  // 这个回调绑定到 attemptFn: (attempt: number) => Promise<RetryResult<T>>,，负责API 服务 files Api在该局部场景下的响应。
  attemptFn: (attempt: number) => Promise<RetryResult<T>>,
): Promise<T> {
  // lastError 错误信息保存`''`，作为后续固定文本处理的输入。
  let lastError = ''

  // 循环处理 `let attempt = 1; attempt <= MAX_RETRIES; attempt++`，让API 服务 files Api逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // 结果保存`attemptFn`，供API 服务 files Api后续处理使用。
    const result = await attemptFn(attempt)

    // 满足 `result.done` 时，API 服务 files Api执行该分支。
    if (result.done) {
      // 返回 `result.value`，作为API 服务 files Api这次计算的结果。
      return result.value
    }

    // lastError 错误信息更新为 `result.error || `${operation} failed``，确保API 服务后续读取最新状态。
    lastError = result.error || `${operation} failed`
    // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
    logDebug(
      `${operation} attempt ${attempt}/${MAX_RETRIES} failed: ${lastError}`,
    )

    // 满足 `attempt < MAX_RETRIES` 时，API 服务 files Api执行该分支。
    if (attempt < MAX_RETRIES) {
      // delayMs 集合保存`Math.pow`，供API 服务 files Api后续处理使用。
      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1)
      // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
      logDebug(`Retrying ${operation} in ${delayMs}ms...`)
      // 等待 `sleep(delayMs)` 完成，再继续API 服务 files Api的异步流程。
      await sleep(delayMs)
    }
  }

  // 抛出 new Error(`${lastError} after ${MAX_RETRIES} attempts`)，阻止API 服务 files Api在无效状态下继续运行。
  throw new Error(`${lastError} after ${MAX_RETRIES} attempts`)
}

/**
 * Downloads a single file from the Anthropic Public Files API
 *
 * @param fileId - The file ID (e.g., "file_011CNha8iCJcU1wXNR6q4V8w")
 * @param config - Files API configuration
 * @returns The file content as a Buffer
 */
// downloadFile 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function downloadFile(
  fileId: string,
  config: FilesApiConfig,
): Promise<Buffer> {
  // baseUrl读取`getDefaultApiBaseUrl`，供API 服务 files Api后续处理使用。
  const baseUrl = config.baseUrl || getDefaultApiBaseUrl()
  // URL 命名 ``${baseUrl}/v1/files/${fileId}/content``，让后续代码直接表达这个值的用途。
  const url = `${baseUrl}/v1/files/${fileId}/content`

  // 请求头 集中保存API 服务 files Api要一起传递的字段。
  const headers = {
    Authorization: `Bearer ${config.oauthToken}`,
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-beta': FILES_API_BETA_HEADER,
  }

  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(`Downloading file ${fileId} from ${url}`)

  // 返回 `retryWithBackoff(`Download file ${fileId}`, async () => {`，作为API 服务 files Api这次计算的结果。
  return retryWithBackoff(`Download file ${fileId}`, async () => {
    // 保护这一段可能失败的API 服务 files Api操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应读取`axios.get`，供API 服务 files Api后续处理使用。
      const response = await axios.get(url, {
        headers,
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout for large files
        // 这个回调绑定到 validateStatus: status => status < 500,，负责API 服务 files Api在该局部场景下的响应。
        validateStatus: status => status < 500,
      })

      // 满足 `response.status === 200` 时，API 服务 files Api执行该分支。
      if (response.status === 200) {
        // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
        logDebug(`Downloaded file ${fileId} (${response.data.length} bytes)`)
        // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
        return { done: true, value: Buffer.from(response.data) }
      }

      // Non-retriable errors - throw immediately
      // 满足 `response.status === 404` 时，API 服务 files Api执行该分支。
      if (response.status === 404) {
        // 抛出 new Error(`File not found: ${fileId}`)，阻止API 服务 files Api在无效状态下继续运行。
        throw new Error(`File not found: ${fileId}`)
      }
      // 满足 `response.status === 401` 时，API 服务 files Api执行该分支。
      if (response.status === 401) {
        // 抛出 new Error('Authentication failed: invalid or missing API key')，阻止API 服务 files Api在无效状态下继续运行。
        throw new Error('Authentication failed: invalid or missing API key')
      }
      // 满足 `response.status === 403` 时，API 服务 files Api执行该分支。
      if (response.status === 403) {
        // 抛出 new Error(`Access denied to file: ${fileId}`)，阻止API 服务 files Api在无效状态下继续运行。
        throw new Error(`Access denied to file: ${fileId}`)
      }

      // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
      return { done: false, error: `status ${response.status}` }
    } catch (error) {
      // 满足 `!axios.isAxiosError(error)` 时，API 服务 files Api执行该分支。
      if (!axios.isAxiosError(error)) {
        // 抛出 error，阻止API 服务 files Api在无效状态下继续运行。
        throw error
      }
      // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
      return { done: false, error: error.message }
    }
  })
}

/**
 * Normalizes a relative path, strips redundant prefixes, and builds the full
 * download path under {basePath}/{session_id}/uploads/.
 * Returns null if the path is invalid (e.g., path traversal).
 */
// buildDownloadPath 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildDownloadPath(
  basePath: string,
  sessionId: string,
  relativePath: string,
): string | null {
  // normalized保存`path.normalize`，供API 服务 files Api后续处理使用。
  const normalized = path.normalize(relativePath)
  // 满足 `normalized.startsWith('..')` 时，API 服务 files Api执行该分支。
  if (normalized.startsWith('..')) {
    // 调用 logDebugError，触发API 服务 files Api此处需要的副作用。
    logDebugError(
      `Invalid file path: ${relativePath}. Path must not traverse above workspace`,
    )
    // 返回 `null`，作为API 服务 files Api这次计算的结果。
    return null
  }

  // uploadsBase格式化`path.join`，供API 服务 files Api后续处理使用。
  const uploadsBase = path.join(basePath, sessionId, 'uploads')
  // redundantPrefixes 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const redundantPrefixes = [
    path.join(basePath, sessionId, 'uploads') + path.sep,
    path.sep + 'uploads' + path.sep,
  ]
  // matchedPrefix筛选`redundantPrefixes.find`，供API 服务 files Api后续处理使用。
  const matchedPrefix = redundantPrefixes.find(p => normalized.startsWith(p))
  // cleanPath 路径数据保存`matchedPrefix`，供API 服务 files Api后续判断或输出使用。
  const cleanPath = matchedPrefix
    ? normalized.slice(matchedPrefix.length)
    : normalized
  // 返回 `path.join(uploadsBase, cleanPath)`，作为API 服务 files Api这次计算的结果。
  return path.join(uploadsBase, cleanPath)
}

/**
 * Downloads a file and saves it to the session-specific workspace directory
 *
 * @param attachment - The file attachment to download
 * @param config - Files API configuration
 * @returns Download result with success/failure status
 */
// downloadAndSaveFile 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function downloadAndSaveFile(
  attachment: File,
  config: FilesApiConfig,
): Promise<DownloadResult> {
  // 从 `attachment` 解构 fileId、relativePath，减少API 服务 files Api对同一对象的重复访问。
  const { fileId, relativePath } = attachment
  // fullPath 路径数据读取`buildDownloadPath`，供API 服务 files Api后续处理使用。
  const fullPath = buildDownloadPath(getCwd(), config.sessionId, relativePath)

  // fullPath 路径数据缺失时提前走兜底路径，避免API 服务 files Api继续依赖无效输入。
  if (!fullPath) {
    // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
    return {
      fileId,
      path: '',
      success: false,
      error: `Invalid file path: ${relativePath}`,
    }
  }

  // 保护这一段可能失败的API 服务 files Api操作，确保异常能进入相邻错误处理。
  try {
    // Download the file content
    // 文本内容读取`downloadFile`，供API 服务 files Api后续处理使用。
    const content = await downloadFile(fileId, config)

    // Ensure the parent directory exists
    // parentDir保存`path.dirname`，供API 服务 files Api后续处理使用。
    const parentDir = path.dirname(fullPath)
    // 等待 `fs.mkdir(parentDir, { recursive: true })` 完成，再继续API 服务 files Api的异步流程。
    await fs.mkdir(parentDir, { recursive: true })

    // Write the file
    // 等待 `fs.writeFile(fullPath, content)` 完成，再继续API 服务 files Api的异步流程。
    await fs.writeFile(fullPath, content)

    // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
    logDebug(`Saved file ${fileId} to ${fullPath} (${content.length} bytes)`)

    // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
    return {
      fileId,
      path: fullPath,
      success: true,
      bytesWritten: content.length,
    }
  } catch (error) {
    // 调用 logDebugError，触发API 服务 files Api此处需要的副作用。
    logDebugError(`Failed to download file ${fileId}: ${errorMessage(error)}`)
    // 满足 `error instanceof Error` 时，API 服务 files Api执行该分支。
    if (error instanceof Error) {
      // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }

    // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
    return {
      fileId,
      path: fullPath,
      success: false,
      error: errorMessage(error),
    }
  }
}

// Default concurrency limit for parallel downloads
// DEFAULT_CONCURRENCY保存`5`，供API 服务 files Api后续判断或输出使用。
const DEFAULT_CONCURRENCY = 5

/**
 * Execute promises with limited concurrency
 *
 * @param items - Items to process
 * @param fn - Async function to apply to each item
 * @param concurrency - Maximum concurrent operations
 * @returns Results in the same order as input items
 */
// parallelWithLimit 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function parallelWithLimit<T, R>(
  items: T[],
  // 这个回调绑定到 fn: (item: T, index: number) => Promise<R>,，负责API 服务 files Api在该局部场景下的响应。
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  // 结果列表 命名 `new Array(items.length)`，让后续代码直接表达这个值的用途。
  const results: R[] = new Array(items.length)
  // currentIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
  let currentIndex = 0

  // worker 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function worker(): Promise<void> {
    // while 使用 currentIndex < items.length 完成API 服务 files Api里的对应操作。
    while (currentIndex < items.length) {
      // index 索引 命名 `currentIndex++`，让后续代码直接表达这个值的用途。
      const index = currentIndex++
      // item保存`items[index]`，供API 服务 files Api后续判断或输出使用。
      const item = items[index]
      // `item` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (item !== undefined) {
        // results[index 索引更新为 `await fn(item, index)`，确保API 服务 files Api后续读取最新状态。
        results[index] = await fn(item, index)
      }
    }
  }

  // Start workers up to the concurrency limit
  // workers 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const workers: Promise<void>[] = []
  // workerCount 数量保存`Math.min`，供API 服务 files Api后续处理使用。
  const workerCount = Math.min(concurrency, items.length)
  // 按索引扫描 `workerCount`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < workerCount; i++) {
    // workers 集合追加新条目，保持收集顺序与输入顺序一致。
    workers.push(worker())
  }

  // 等待 `Promise.all(workers)` 完成，再继续API 服务 files Api的异步流程。
  await Promise.all(workers)
  // 返回 `results`，作为API 服务 files Api这次计算的结果。
  return results
}

/**
 * Downloads all file attachments for a session in parallel
 *
 * @param attachments - List of file attachments to download
 * @param config - Files API configuration
 * @param concurrency - Maximum concurrent downloads (default: 5)
 * @returns Array of download results in the same order as input
 */
// downloadSessionFiles 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function downloadSessionFiles(
  files: File[],
  config: FilesApiConfig,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<DownloadResult[]> {
  // files 文件数据为空时立即返回或跳过，避免API 服务 files Api把空集合当成可处理内容。
  if (files.length === 0) {
    // 返回列表结果，保留API 服务 files Api已经排好的条目顺序。
    return []
  }

  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(
    `Downloading ${files.length} file(s) for session ${config.sessionId}`,
  )
  // startTime记录时间`Date.now`，供API 服务 files Api后续处理使用。
  const startTime = Date.now()

  // Download files in parallel with concurrency limit
  // 结果列表保存`parallelWithLimit`，供API 服务 files Api后续处理使用。
  const results = await parallelWithLimit(
    files,
    // file 文件数据更新为 `> downloadAndSaveFile(file, config)`，确保API 服务后续读取最新状态。
    file => downloadAndSaveFile(file, config),
    concurrency,
  )

  // elapsedMs 集合记录时间`Date.now`，供API 服务 files Api后续处理使用。
  const elapsedMs = Date.now() - startTime
  // successCount 数量统计`count`，供API 服务 files Api后续处理使用。
  const successCount = count(results, r => r.success)
  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(
    `Downloaded ${successCount}/${files.length} file(s) in ${elapsedMs}ms`,
  )

  // 返回 `results`，作为API 服务 files Api这次计算的结果。
  return results
}

// ============================================================================
// Upload Functions (BYOC mode)
// ============================================================================

/**
 * Result of a file upload operation
 */
// UploadResult 固化API 服务 files Api里传递的数据形状，帮助调用方按同一结构读写字段。
export type UploadResult =
  | {
      path: string
      fileId: string
      size: number
      success: true
    }
  | {
      path: string
      error: string
      success: false
    }

/**
 * Upload a single file to the Files API (BYOC mode)
 *
 * Size validation is performed after reading the file to avoid TOCTOU race
 * conditions where the file size could change between initial check and upload.
 *
 * @param filePath - Absolute path to the file to upload
 * @param relativePath - Relative path for the file (used as filename in API)
 * @param config - Files API configuration
 * @returns Upload result with success/failure status
 */
// uploadFile 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function uploadFile(
  filePath: string,
  relativePath: string,
  config: FilesApiConfig,
  opts?: { signal?: AbortSignal },
): Promise<UploadResult> {
  // baseUrl读取`getDefaultApiBaseUrl`，供API 服务 files Api后续处理使用。
  const baseUrl = config.baseUrl || getDefaultApiBaseUrl()
  // URL保存``${baseUrl}/v1/files``，作为后续固定文本处理的输入。
  const url = `${baseUrl}/v1/files`

  // 请求头 集中保存API 服务 files Api要一起传递的字段。
  const headers = {
    Authorization: `Bearer ${config.oauthToken}`,
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-beta': FILES_API_BETA_HEADER,
  }

  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(`Uploading file ${filePath} as ${relativePath}`)

  // Read file content first (outside retry loop since it's not a network operation)
  // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
  let content: Buffer
  // 保护这一段可能失败的API 服务 files Api操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容更新为 `await fs.readFile(filePath)`，确保API 服务后续读取最新状态。
    content = await fs.readFile(filePath)
  } catch (error) {
    // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_upload_failed', {
      error_type:
        'file_read' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
    return {
      path: relativePath,
      error: errorMessage(error),
      success: false,
    }
  }

  // fileSize 文件数据保存 `content.length` 的判断结果，供API 服务 files Api后续分支直接复用。
  const fileSize = content.length

  // 满足 `fileSize > MAX_FILE_SIZE_BYTES` 时，API 服务 files Api执行该分支。
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_upload_failed', {
      error_type:
        'file_too_large' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
    return {
      path: relativePath,
      error: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES} bytes (actual: ${fileSize})`,
      success: false,
    }
  }

  // Use crypto.randomUUID for boundary to avoid collisions when uploads start same millisecond
  // boundary保存`randomUUID`，供API 服务 files Api后续处理使用。
  const boundary = `----FormBoundary${randomUUID()}`
  // filename 文件数据保存`path.basename`，供API 服务 files Api后续处理使用。
  const filename = path.basename(relativePath)

  // Build the multipart body
  // bodyParts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const bodyParts: Buffer[] = []

  // File part
  // bodyParts 集合追加新条目，保持收集顺序与输入顺序一致。
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`,
    ),
  )
  // bodyParts 集合追加新条目，保持收集顺序与输入顺序一致。
  bodyParts.push(content)
  // bodyParts 集合追加新条目，保持收集顺序与输入顺序一致。
  bodyParts.push(Buffer.from('\r\n'))

  // Purpose part
  // bodyParts 集合追加新条目，保持收集顺序与输入顺序一致。
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="purpose"\r\n\r\n` +
        `user_data\r\n`,
    ),
  )

  // End boundary
  // bodyParts 集合追加新条目，保持收集顺序与输入顺序一致。
  bodyParts.push(Buffer.from(`--${boundary}--\r\n`))

  // 请求体保存`Buffer.concat`，供API 服务 files Api后续处理使用。
  const body = Buffer.concat(bodyParts)

  // 保护这一段可能失败的API 服务 files Api操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `retryWithBackoff(`Upload file ${relativePath}`, async () => {`，调用方直接接收异步结果。
    return await retryWithBackoff(`Upload file ${relativePath}`, async () => {
      // 保护这一段可能失败的API 服务 files Api操作，确保异常能进入相邻错误处理。
      try {
        // 接口响应保存`axios.post`，供API 服务 files Api后续处理使用。
        const response = await axios.post(url, body, {
          headers: {
            ...headers,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length.toString(),
          },
          timeout: 120000, // 2 minute timeout for uploads
          signal: opts?.signal,
          // 这个回调绑定到 validateStatus: status => status < 500,，负责API 服务 files Api在该局部场景下的响应。
          validateStatus: status => status < 500,
        })

        // 组合条件 `response.status === 200 || response.status === 201` 成立时，API 服务 files Api才启用这条专门路径。
        if (response.status === 200 || response.status === 201) {
          // fileId 文件数据 命名 `response.data?.id`，让后续代码直接表达这个值的用途。
          const fileId = response.data?.id
          // fileId 文件数据缺失时提前走兜底路径，避免API 服务 files Api继续依赖无效输入。
          if (!fileId) {
            // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
            return {
              done: false,
              error: 'Upload succeeded but no file ID returned',
            }
          }
          // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
          logDebug(`Uploaded file ${filePath} -> ${fileId} (${fileSize} bytes)`)
          // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
          return {
            done: true,
            value: {
              path: relativePath,
              fileId,
              size: fileSize,
              success: true as const,
            },
          }
        }

        // Non-retriable errors - throw to exit retry loop
        // 满足 `response.status === 401` 时，API 服务 files Api执行该分支。
        if (response.status === 401) {
          // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_file_upload_failed', {
            error_type:
              'auth' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 抛出 new UploadNonRetriableError(，阻止API 服务 files Api在无效状态下继续运行。
          throw new UploadNonRetriableError(
            'Authentication failed: invalid or missing API key',
          )
        }

        // 满足 `response.status === 403` 时，API 服务 files Api执行该分支。
        if (response.status === 403) {
          // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_file_upload_failed', {
            error_type:
              'forbidden' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 抛出 new UploadNonRetriableError('Access denied for upload')，阻止API 服务 files Api在无效状态下继续运行。
          throw new UploadNonRetriableError('Access denied for upload')
        }

        // 满足 `response.status === 413` 时，API 服务 files Api执行该分支。
        if (response.status === 413) {
          // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_file_upload_failed', {
            error_type:
              'size' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 抛出 new UploadNonRetriableError('File too large for upload')，阻止API 服务 files Api在无效状态下继续运行。
          throw new UploadNonRetriableError('File too large for upload')
        }

        // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
        return { done: false, error: `status ${response.status}` }
      } catch (error) {
        // Non-retriable errors propagate up
        // 满足 `error instanceof UploadNonRetriableError` 时，API 服务 files Api执行该分支。
        if (error instanceof UploadNonRetriableError) {
          // 抛出 error，阻止API 服务 files Api在无效状态下继续运行。
          throw error
        }
        // 满足 `axios.isCancel(error)` 时，API 服务 files Api执行该分支。
        if (axios.isCancel(error)) {
          // 抛出 new UploadNonRetriableError('Upload canceled')，阻止API 服务 files Api在无效状态下继续运行。
          throw new UploadNonRetriableError('Upload canceled')
        }
        // Network errors are retriable
        // 满足 `axios.isAxiosError(error)` 时，API 服务 files Api执行该分支。
        if (axios.isAxiosError(error)) {
          // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
          return { done: false, error: error.message }
        }
        // 抛出 error，阻止API 服务 files Api在无效状态下继续运行。
        throw error
      }
    })
  } catch (error) {
    // 满足 `error instanceof UploadNonRetriableError` 时，API 服务 files Api执行该分支。
    if (error instanceof UploadNonRetriableError) {
      // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
      return {
        path: relativePath,
        error: error.message,
        success: false,
      }
    }
    // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_upload_failed', {
      error_type:
        'network' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
    return {
      path: relativePath,
      error: errorMessage(error),
      success: false,
    }
  }
}

/** Error class for non-retriable upload failures */
// UploadNonRetriableError 聚合API 服务 files Api相关状态与操作，把同一职责的行为收束到类实例中。
class UploadNonRetriableError extends Error {
  // 构造函数接收 message: string，把外部输入整理成实例可复用的内部状态。
  constructor(message: string) {
    // 调用 super，触发API 服务 files Api此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'UploadNonRetriableError'，同步API 服务 files Api的内部状态。
    this.name = 'UploadNonRetriableError'
  }
}

/**
 * Upload multiple files in parallel with concurrency limit (BYOC mode)
 *
 * @param files - Array of files to upload (path and relativePath)
 * @param config - Files API configuration
 * @param concurrency - Maximum concurrent uploads (default: 5)
 * @returns Array of upload results in the same order as input
 */
// uploadSessionFiles 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function uploadSessionFiles(
  files: Array<{ path: string; relativePath: string }>,
  config: FilesApiConfig,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<UploadResult[]> {
  // files 文件数据为空时立即返回或跳过，避免API 服务 files Api把空集合当成可处理内容。
  if (files.length === 0) {
    // 返回列表结果，保留API 服务 files Api已经排好的条目顺序。
    return []
  }

  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(`Uploading ${files.length} file(s) for session ${config.sessionId}`)
  // startTime记录时间`Date.now`，供API 服务 files Api后续处理使用。
  const startTime = Date.now()

  // 结果列表保存`parallelWithLimit`，供API 服务 files Api后续处理使用。
  const results = await parallelWithLimit(
    files,
    // file 文件数据更新为 `> uploadFile(file.path, file.relativePath, config)`，确保API 服务后续读取最新状态。
    file => uploadFile(file.path, file.relativePath, config),
    concurrency,
  )

  // elapsedMs 集合记录时间`Date.now`，供API 服务 files Api后续处理使用。
  const elapsedMs = Date.now() - startTime
  // successCount 数量统计`count`，供API 服务 files Api后续处理使用。
  const successCount = count(results, r => r.success)
  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(`Uploaded ${successCount}/${files.length} file(s) in ${elapsedMs}ms`)

  // 返回 `results`，作为API 服务 files Api这次计算的结果。
  return results
}

// ============================================================================
// List Files Functions (1P/Cloud mode)
// ============================================================================

/**
 * File metadata returned from listFilesCreatedAfter
 */
// FileMetadata 固化API 服务 files Api里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileMetadata = {
  filename: string
  fileId: string
  size: number
}

/**
 * List files created after a given timestamp (1P/Cloud mode).
 * Uses the public GET /v1/files endpoint with after_created_at query param.
 * Handles pagination via after_id cursor when has_more is true.
 *
 * @param afterCreatedAt - ISO 8601 timestamp to filter files created after
 * @param config - Files API configuration
 * @returns Array of file metadata for files created after the timestamp
 */
// listFilesCreatedAfter 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listFilesCreatedAfter(
  afterCreatedAt: string,
  config: FilesApiConfig,
): Promise<FileMetadata[]> {
  // baseUrl读取`getDefaultApiBaseUrl`，供API 服务 files Api后续处理使用。
  const baseUrl = config.baseUrl || getDefaultApiBaseUrl()
  // 请求头 集中保存API 服务 files Api要一起传递的字段。
  const headers = {
    Authorization: `Bearer ${config.oauthToken}`,
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-beta': FILES_API_BETA_HEADER,
  }

  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(`Listing files created after ${afterCreatedAt}`)

  // allFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allFiles: FileMetadata[] = []
  // afterId 先占位，稍后的条件分支会根据实际输入补齐它。
  let afterId: string | undefined

  // Paginate through results
  // while 使用 true 完成API 服务 files Api里的对应操作。
  while (true) {
    // params 集合 集中保存API 服务 files Api要一起传递的字段。
    const params: Record<string, string> = {
      after_created_at: afterCreatedAt,
    }
    // 满足 `afterId` 时，API 服务 files Api执行该分支。
    if (afterId) {
      // after_id更新为 `afterId`，确保API 服务后续读取最新状态。
      params.after_id = afterId
    }

    // page保存`retryWithBackoff`，供API 服务 files Api后续处理使用。
    const page = await retryWithBackoff(
      `List files after ${afterCreatedAt}`,
      // 调用 async，触发API 服务 files Api此处需要的副作用。
      async () => {
        // 保护这一段可能失败的API 服务 files Api操作，确保异常能进入相邻错误处理。
        try {
          // 接口响应读取`axios.get`，供API 服务 files Api后续处理使用。
          const response = await axios.get(`${baseUrl}/v1/files`, {
            headers,
            params,
            timeout: 60000,
            // 这个回调绑定到 validateStatus: status => status < 500,，负责API 服务 files Api在该局部场景下的响应。
            validateStatus: status => status < 500,
          })

          // 满足 `response.status === 200` 时，API 服务 files Api执行该分支。
          if (response.status === 200) {
            // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
            return { done: true, value: response.data }
          }

          // 满足 `response.status === 401` 时，API 服务 files Api执行该分支。
          if (response.status === 401) {
            // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_file_list_failed', {
              error_type:
                'auth' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })
            // 抛出 new Error('Authentication failed: invalid or missing API key')，阻止API 服务 files Api在无效状态下继续运行。
            throw new Error('Authentication failed: invalid or missing API key')
          }
          // 满足 `response.status === 403` 时，API 服务 files Api执行该分支。
          if (response.status === 403) {
            // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_file_list_failed', {
              error_type:
                'forbidden' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })
            // 抛出 new Error('Access denied to list files')，阻止API 服务 files Api在无效状态下继续运行。
            throw new Error('Access denied to list files')
          }

          // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
          return { done: false, error: `status ${response.status}` }
        } catch (error) {
          // 满足 `!axios.isAxiosError(error)` 时，API 服务 files Api执行该分支。
          if (!axios.isAxiosError(error)) {
            // 抛出 error，阻止API 服务 files Api在无效状态下继续运行。
            throw error
          }
          // 记录API 服务 files Api运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_file_list_failed', {
            error_type:
              'network' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 返回结构化结果，集中表达API 服务 files Api已经整理出的状态。
          return { done: false, error: error.message }
        }
      },
    )

    // files 文件数据标记API 服务 files Api是否启用对应路径。
    const files = page.data || []
    // 按顺序遍历 `files` 中的f，逐个交给API 服务 files Api处理。
    for (const f of files) {
      // allFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      allFiles.push({
        filename: f.filename,
        fileId: f.id,
        size: f.size_bytes,
      })
    }

    // page.has_more缺失时提前走兜底路径，避免API 服务 files Api继续依赖无效输入。
    if (!page.has_more) {
      // 结束这个分支或循环，避免API 服务 files Api继续落入后续路径。
      break
    }

    // Use the last file's ID as cursor for next page
    // lastFile 文件数据保存`files.at`，供API 服务 files Api后续处理使用。
    const lastFile = files.at(-1)
    // 满足 `!lastFile?.id` 时，API 服务 files Api执行该分支。
    if (!lastFile?.id) {
      // 结束这个分支或循环，避免API 服务 files Api继续落入后续路径。
      break
    }
    // afterId更新为 `lastFile.id`，确保API 服务后续读取最新状态。
    afterId = lastFile.id
  }

  // 调用 logDebug，触发API 服务 files Api此处需要的副作用。
  logDebug(`Listed ${allFiles.length} files created after ${afterCreatedAt}`)
  // 返回 `allFiles`，作为API 服务 files Api这次计算的结果。
  return allFiles
}

// ============================================================================
// Parse Functions
// ============================================================================

/**
 * Parse file attachment specs from CLI arguments
 * Format: <file_id>:<relative_path>
 *
 * @param fileSpecs - Array of file spec strings
 * @returns Parsed file attachments
 */
// parseFileSpecs 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseFileSpecs(fileSpecs: string[]): File[] {
  // files 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const files: File[] = []

  // Sandbox-gateway may pass multiple specs as a single space-separated string
  // expandedSpecs 集合派生`fileSpecs.flatMap`，供API 服务 files Api后续处理使用。
  const expandedSpecs = fileSpecs.flatMap(s => s.split(' ').filter(Boolean))

  // 按顺序遍历 `expandedSpecs` 中的spec，逐个交给API 服务 files Api处理。
  for (const spec of expandedSpecs) {
    // colonIndex 索引保存`spec.indexOf`，供API 服务 files Api后续处理使用。
    const colonIndex = spec.indexOf(':')
    // 满足 `colonIndex === -1` 时，API 服务 files Api执行该分支。
    if (colonIndex === -1) {
      // 跳过当前项，继续处理API 服务 files Api中的下一轮循环。
      continue
    }

    // fileId 文件数据格式化`spec.substring`，供API 服务 files Api后续处理使用。
    const fileId = spec.substring(0, colonIndex)
    // relativePath 路径数据格式化`spec.substring`，供API 服务 files Api后续处理使用。
    const relativePath = spec.substring(colonIndex + 1)

    // 组合条件 `!fileId || !relativePath` 成立时，API 服务 files Api才启用这条专门路径。
    if (!fileId || !relativePath) {
      // 调用 logDebugError，触发API 服务 files Api此处需要的副作用。
      logDebugError(
        `Invalid file spec: ${spec}. Both file_id and path are required`,
      )
      // 跳过当前项，继续处理API 服务 files Api中的下一轮循环。
      continue
    }

    // files 文件数据追加新条目，保持收集顺序与输入顺序一致。
    files.push({ fileId, relativePath })
  }

  // 返回 `files`，作为API 服务 files Api这次计算的结果。
  return files
}
