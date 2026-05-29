// 类型依赖 { HrTime } 来自 @opentelemetry/api，用于校准服务层 first Party Event Logging Exporter的数据契约。
import type { HrTime } from '@opentelemetry/api'
// 引入 ExportResult、ExportResultCode，将 @opentelemetry/core 中已经封装好的能力接到本文件流程里。
import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
// 整理这一组导入，让服务层 first Party Event Logging Exporter后续逻辑可以直接复用这些外部能力。
import type {
  LogRecordExporter,
  ReadableLogRecord,
} from '@opentelemetry/sdk-logs'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { appendFile, mkdir, readdir, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 类型依赖 { CoreUserData } 来自 src/utils/user.js，用于校准服务层 first Party Event Logging Exporter的数据契约。
import type { CoreUserData } from 'src/utils/user.js'
// 整理这一组导入，让服务层 first Party Event Logging Exporter后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  getSessionId,
} from '../../bootstrap/state.js'
// 引入 ClaudeCodeInternalEvent，将 ../../types/generated/events_mono/claude_code/v1/claude_code_internal_event.js 中已经封装好的能力接到本文件流程里。
import { ClaudeCodeInternalEvent } from '../../types/generated/events_mono/claude_code/v1/claude_code_internal_event.js'
// 引入 GrowthbookExperimentEvent，将 ../../types/generated/events_mono/growthbook/v1/growthbook_experiment_event.js 中已经封装好的能力接到本文件流程里。
import { GrowthbookExperimentEvent } from '../../types/generated/events_mono/growthbook/v1/growthbook_experiment_event.js'
// 整理这一组导入，让服务层 first Party Event Logging Exporter后续逻辑可以直接复用这些外部能力。
import {
  getClaudeAIOAuthTokens,
  hasProfileScope,
  isClaudeAISubscriber,
} from '../../utils/auth.js'
// 复用 checkHasTrustDialogAccepted 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { checkHasTrustDialogAccepted } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 errorMessage、isFsInaccessible、toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage, isFsInaccessible, toError } from '../../utils/errors.js'
// 复用 getAuthHeaders 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getAuthHeaders } from '../../utils/http.js'
// 复用 readJSONLFile 工具函数，把通用处理留在 ../../utils/json.js 中维护。
import { readJSONLFile } from '../../utils/json.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'
// 引入 isOAuthTokenExpired，将 ../oauth/client.js 中已经封装好的能力接到本文件流程里。
import { isOAuthTokenExpired } from '../oauth/client.js'
// 引入 stripProtoFields，将 ./index.js 中已经封装好的能力接到本文件流程里。
import { stripProtoFields } from './index.js'
// 引入 EventMetadata、to1PEventFormat，将 ./metadata.js 中已经封装好的能力接到本文件流程里。
import { type EventMetadata, to1PEventFormat } from './metadata.js'

// Unique ID for this process run - used to isolate failed event files between runs
// BATCH_UUID保存`randomUUID`，供服务层 first Party Event Logging Expor...后续处理使用。
const BATCH_UUID = randomUUID()

// File prefix for failed event storage
// FILE_PREFIX 文件数据 命名 `'1p_failed_events.'`，让后续代码直接表达这个值的用途。
const FILE_PREFIX = '1p_failed_events.'

// Storage directory for failed events - evaluated at runtime to respect CLAUDE_CONFIG_DIR in tests
// getStorageDir 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStorageDir(): string {
  // 返回 `path.join(getClaudeConfigHomeDir(), 'telemetry')`，作为服务层 first Party Event Logging Expor...这次计算的结果。
  return path.join(getClaudeConfigHomeDir(), 'telemetry')
}

// API envelope - event_data is the JSON output from proto toJSON()
// FirstPartyEventLoggingEvent 固化服务层 first Party Event Logging Exporter里传递的数据形状，帮助调用方按同一结构读写字段。
type FirstPartyEventLoggingEvent = {
  event_type: 'ClaudeCodeInternalEvent' | 'GrowthbookExperimentEvent'
  event_data: unknown
}

// FirstPartyEventLoggingPayload 固化服务层 first Party Event Logging Exporter里传递的数据形状，帮助调用方按同一结构读写字段。
type FirstPartyEventLoggingPayload = {
  events: FirstPartyEventLoggingEvent[]
}

/**
 * Exporter for 1st-party event logging to /api/event_logging/batch.
 *
 * Export cycles are controlled by OpenTelemetry's BatchLogRecordProcessor, which
 * triggers export() when either:
 * - Time interval elapses (default: 5 seconds via scheduledDelayMillis)
 * - Batch size is reached (default: 200 events via maxExportBatchSize)
 *
 * This exporter adds resilience on top:
 * - Append-only log for failed events (concurrency-safe)
 * - Quadratic backoff retry for failed events, dropped after maxAttempts
 * - Immediate retry of queued events when any export succeeds (endpoint is healthy)
 * - Chunking large event sets into smaller batches
 * - Auth fallback: retries without auth on 401 errors
 */
// FirstPartyEventLoggingExporter 聚合服务层 first Party Event Logging Exporter相关状态与操作，把同一职责的行为收束到类实例中。
export class FirstPartyEventLoggingExporter implements LogRecordExporter {
  private readonly endpoint: string
  private readonly timeout: number
  private readonly maxBatchSize: number
  private readonly skipAuth: boolean
  private readonly batchDelayMs: number
  private readonly baseBackoffDelayMs: number
  private readonly maxBackoffDelayMs: number
  private readonly maxAttempts: number
  // 这个回调绑定到 private readonly isKilled: () => boolean，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
  private readonly isKilled: () => boolean
  private pendingExports: Promise<void>[] = []
  private isShutdown = false
  // 服务层 first Party Event Logging Expor...在这里处理 `private readonly schedule: (`，完成这一小步状态转换。
  private readonly schedule: (
    // 这个回调绑定到 fn: () => Promise<void>,，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
    fn: () => Promise<void>,
    delayMs: number,
  ) => () => void
  private cancelBackoff: (() => void) | null = null
  private attempts = 0
  private isRetrying = false
  private lastExportErrorContext: string | undefined

  // 构造函数初始化实例状态，确保服务层 first Party Event Logging Expor...后续方法读取到完整配置。
  constructor(
    options: {
      timeout?: number
      maxBatchSize?: number
      skipAuth?: boolean
      batchDelayMs?: number
      baseBackoffDelayMs?: number
      maxBackoffDelayMs?: number
      maxAttempts?: number
      path?: string
      baseUrl?: string
      // Injected killswitch probe. Checked per-POST so that disabling the
      // firstParty sink also stops backoff retries (not just new emits).
      // Passed in rather than imported to avoid a cycle with firstPartyEventLogger.ts.
      // 这个回调绑定到 isKilled?: () => boolean，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
      isKilled?: () => boolean
      // 这个回调绑定到 schedule?: (fn: () => Promise<void>, delayMs: number) => () => void，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
      schedule?: (fn: () => Promise<void>, delayMs: number) => () => void
    } = {},
  ) {
    // Default: prod, except when ANTHROPIC_BASE_URL is explicitly staging.
    // Overridable via tengu_1p_event_batch_config.baseUrl.
    // baseUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const baseUrl =
      options.baseUrl ||
      (process.env.ANTHROPIC_BASE_URL === 'https://api-staging.anthropic.com'
        ? 'https://api-staging.anthropic.com'
        : 'https://api.anthropic.com')

    // 更新实例字段 endpoint 为 `${baseUrl}${options.path || '/api/event_logging/batch'}`，同步服务层 first Party Event Logging Exporter的内部状态。
    this.endpoint = `${baseUrl}${options.path || '/api/event_logging/batch'}`

    // 更新实例字段 timeout 为 options.timeout || 10000，同步服务层 first Party Event Logging Exporter的内部状态。
    this.timeout = options.timeout || 10000
    // 更新实例字段 maxBatchSize 为 options.maxBatchSize || 200，同步服务层 first Party Event Logging Exporter的内部状态。
    this.maxBatchSize = options.maxBatchSize || 200
    // 更新实例字段 skipAuth 为 options.skipAuth ?? false，同步服务层 first Party Event Logging Exporter的内部状态。
    this.skipAuth = options.skipAuth ?? false
    // 更新实例字段 batchDelayMs 为 options.batchDelayMs || 100，同步服务层 first Party Event Logging Exporter的内部状态。
    this.batchDelayMs = options.batchDelayMs || 100
    // 更新实例字段 baseBackoffDelayMs 为 options.baseBackoffDelayMs || 500，同步服务层 first Party Event Logging Exporter的内部状态。
    this.baseBackoffDelayMs = options.baseBackoffDelayMs || 500
    // 更新实例字段 maxBackoffDelayMs 为 options.maxBackoffDelayMs || 30000，同步服务层 first Party Event Logging Exporter的内部状态。
    this.maxBackoffDelayMs = options.maxBackoffDelayMs || 30000
    // 更新实例字段 maxAttempts 为 options.maxAttempts ?? 8，同步服务层 first Party Event Logging Exporter的内部状态。
    this.maxAttempts = options.maxAttempts ?? 8
    // 更新实例字段 isKilled 为 options.isKilled ?? (() => false)，同步服务层 first Party Event Logging Exporter的内部状态。
    this.isKilled = options.isKilled ?? (() => false)
    // 服务层 first Party Event Logging Expor...在这里处理 `this.schedule =`，完成这一小步状态转换。
    this.schedule =
      options.schedule ??
      // 这个回调绑定到 ((fn, ms) => {，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
      ((fn, ms) => {
        // t保存`setTimeout`，供服务层 first Party Event Logging Expor...后续处理使用。
        const t = setTimeout(fn, ms)
        // 返回 `() => clearTimeout(t)`，作为服务层 first Party Event Logging Expor...这次计算的结果。
        return () => clearTimeout(t)
      })

    // Retry any failed events from previous runs of this session (in background)
    // 显式忽略 `this.retryPreviousBatches()` 的返回值，只保留它触发的副作用。
    void this.retryPreviousBatches()
  }

  // Expose for testing
  // getQueuedEventCount不依赖额外参数，直接计算服务层 first Party Event Logging Exporter需要的结果。
  async getQueuedEventCount(): Promise<number> {
    // 返回 `(await this.loadEventsFromCurrentBatch()).length`，作为服务层 first Party Event Logging Expor...这次计算的结果。
    return (await this.loadEventsFromCurrentBatch()).length
  }

  // --- Storage helpers ---

  // 服务层 first Party Event Logging Expor...在这里处理 `private getCurrentBatchFilePath(): string {`，完成这一小步状态转换。
  private getCurrentBatchFilePath(): string {
    // 返回 `path.join(`，作为服务层 first Party Event Logging Expor...这次计算的结果。
    return path.join(
      getStorageDir(),
      `${FILE_PREFIX}${getSessionId()}.${BATCH_UUID}.json`,
    )
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async loadEventsFromFile(`，完成这一小步状态转换。
  private async loadEventsFromFile(
    filePath: string,
  ): Promise<FirstPartyEventLoggingEvent[]> {
    // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `readJSONLFile<FirstPartyEventLoggingEvent>(filePath)`，调用方直接接收异步结果。
      return await readJSONLFile<FirstPartyEventLoggingEvent>(filePath)
    } catch {
      // 返回列表结果，保留服务层 first Party Event Logging Expor...已经排好的条目顺序。
      return []
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async loadEventsFromCurrentBatch(): Promise<`，完成这一小步状态转换。
  private async loadEventsFromCurrentBatch(): Promise<
    FirstPartyEventLoggingEvent[]
  > {
    // 返回 `this.loadEventsFromFile(this.getCurrentBatchFilePath())`，作为服务层 first Party Event Logging Expor...这次计算的结果。
    return this.loadEventsFromFile(this.getCurrentBatchFilePath())
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async saveEventsToFile(`，完成这一小步状态转换。
  private async saveEventsToFile(
    filePath: string,
    events: FirstPartyEventLoggingEvent[],
  ): Promise<void> {
    // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
    try {
      // events 集合为空时立即返回或跳过，避免服务层 first Party Event Logging Expor...把空集合当成可处理内容。
      if (events.length === 0) {
        // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `unlink(filePath)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
          await unlink(filePath)
        } catch {
          // File doesn't exist, nothing to delete
        }
      } else {
        // Ensure storage directory exists
        // 等待 `mkdir(getStorageDir(), { recursive: true })` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
        await mkdir(getStorageDir(), { recursive: true })
        // Write as JSON lines (one event per line)
        // 文本内容派生`events.map`，供服务层 first Party Event Logging Expor...后续处理使用。
        const content = events.map(e => jsonStringify(e)).join('\n') + '\n'
        // 等待 `writeFile(filePath, content, 'utf8')` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
        await writeFile(filePath, content, 'utf8')
      }
    } catch (error) {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async appendEventsToFile(`，完成这一小步状态转换。
  private async appendEventsToFile(
    filePath: string,
    events: FirstPartyEventLoggingEvent[],
  ): Promise<void> {
    // events 集合为空时立即返回或跳过，避免服务层 first Party Event Logging Expor...把空集合当成可处理内容。
    if (events.length === 0) return
    // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
    try {
      // Ensure storage directory exists
      // 等待 `mkdir(getStorageDir(), { recursive: true })` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await mkdir(getStorageDir(), { recursive: true })
      // Append as JSON lines (one event per line) - atomic on most filesystems
      // 文本内容派生`events.map`，供服务层 first Party Event Logging Expor...后续处理使用。
      const content = events.map(e => jsonStringify(e)).join('\n') + '\n'
      // 等待 `appendFile(filePath, content, 'utf8')` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await appendFile(filePath, content, 'utf8')
    } catch (error) {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async deleteFile(filePath: string): Promise<void> {`，完成这一小步状态转换。
  private async deleteFile(filePath: string): Promise<void> {
    // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(filePath)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await unlink(filePath)
    } catch {
      // File doesn't exist or can't be deleted, ignore
    }
  }

  // --- Previous batch retry (startup) ---

  // 服务层 first Party Event Logging Expor...在这里处理 `private async retryPreviousBatches(): Promise<void> {`，完成这一小步状态转换。
  private async retryPreviousBatches(): Promise<void> {
    // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
    try {
      // prefix读取`getSessionId`，供服务层 first Party Event Logging Expor...后续处理使用。
      const prefix = `${FILE_PREFIX}${getSessionId()}.`
      // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let files: string[]
      // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
      try {
        // files 文件数据更新为 `(await readdir(getStorageDir()))`，确保服务层后续读取最新状态。
        files = (await readdir(getStorageDir()))
          // 链式调用 filter，继续加工上一行在服务层 first Party Event Logging Exporter中产生的数据。
          .filter((f: string) => f.startsWith(prefix) && f.endsWith('.json'))
          // 链式调用 filter，继续加工上一行在服务层 first Party Event Logging Exporter中产生的数据。
          .filter((f: string) => !f.includes(BATCH_UUID)) // Exclude current batch
      } catch (e) {
        // 满足 `isFsInaccessible(e)` 时，服务层 first Party Event Logging Expor...执行该分支。
        if (isFsInaccessible(e)) return
        // 抛出 e，阻止服务层 first Party Event Logging Exporter在无效状态下继续运行。
        throw e
      }

      // 逐项读取 `files` 中的file 文件数据，按输入顺序推进服务层 first Party Event Logging Expor...。
      for (const file of files) {
        // 文件路径格式化`path.join`，供服务层 first Party Event Logging Expor...后续处理使用。
        const filePath = path.join(getStorageDir(), file)
        // 显式忽略 `this.retryFileInBackground(filePath)` 的返回值，只保留它触发的副作用。
        void this.retryFileInBackground(filePath)
      }
    } catch (error) {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async retryFileInBackground(filePath: string): Promise<void> {`，完成这一小步状态转换。
  private async retryFileInBackground(filePath: string): Promise<void> {
    // 满足 `this.attempts >= this.maxAttempts` 时，服务层 first Party Event Logging Expor...执行该分支。
    if (this.attempts >= this.maxAttempts) {
      // 等待 `this.deleteFile(filePath)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await this.deleteFile(filePath)
      // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // events 集合读取`this.loadEventsFromFile`，供服务层 first Party Event Logging Expor...后续处理使用。
    const events = await this.loadEventsFromFile(filePath)
    // events 集合为空时立即返回或跳过，避免服务层 first Party Event Logging Expor...把空集合当成可处理内容。
    if (events.length === 0) {
      // 等待 `this.deleteFile(filePath)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await this.deleteFile(filePath)
      // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `1P event logging: retrying ${events.length} events from previous batch`,
      )
    }

    // failedEvents 集合保存`this.sendEventsInBatches`，供服务层 first Party Event Logging Expor...后续处理使用。
    const failedEvents = await this.sendEventsInBatches(events)
    // failedEvents 集合为空时立即返回或跳过，避免服务层 first Party Event Logging Expor...把空集合当成可处理内容。
    if (failedEvents.length === 0) {
      // 等待 `this.deleteFile(filePath)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await this.deleteFile(filePath)
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
        logForDebugging('1P event logging: previous batch retry succeeded')
      }
    } else {
      // Save only the failed events back (not all original events)
      // 等待 `this.saveEventsToFile(filePath, failedEvents)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await this.saveEventsToFile(filePath, failedEvents)
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `1P event logging: previous batch retry failed, ${failedEvents.length} events remain`,
        )
      }
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `async export(`，完成这一小步状态转换。
  async export(
    logs: ReadableLogRecord[],
    // 这个回调绑定到 resultCallback: (result: ExportResult) => void,，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
    resultCallback: (result: ExportResult) => void,
  ): Promise<void> {
    // 满足 `this.isShutdown` 时，服务层 first Party Event Logging Expor...执行该分支。
    if (this.isShutdown) {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '1P event logging export failed: Exporter has been shutdown',
        )
      }
      // 调用 resultCallback，触发服务层 first Party Event Logging Expor...此处需要的副作用。
      resultCallback({
        code: ExportResultCode.FAILED,
        error: new Error('Exporter has been shutdown'),
      })
      // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // exportPromise 异步任务保存 `this.doExport` 启动的异步任务，稍后再决定等待还是后台完成。
    const exportPromise = this.doExport(logs, resultCallback)
    // pendingExports 集合追加新条目，保持收集顺序与输入顺序一致。
    this.pendingExports.push(exportPromise)

    // Clean up completed exports
    // 这个回调绑定到 void exportPromise.finally(() => {，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
    void exportPromise.finally(() => {
      // index 索引保存`pendingExports.indexOf`，供服务层 first Party Event Logging Expor...后续处理使用。
      const index = this.pendingExports.indexOf(exportPromise)
      // 满足 `index > -1` 时，服务层 first Party Event Logging Expor...执行该分支。
      if (index > -1) {
        // 显式忽略 `this.pendingExports.splice(index, 1)` 的返回值，只保留它触发的副作用。
        void this.pendingExports.splice(index, 1)
      }
    })
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async doExport(`，完成这一小步状态转换。
  private async doExport(
    logs: ReadableLogRecord[],
    // 这个回调绑定到 resultCallback: (result: ExportResult) => void,，负责服务层 first Party Event Logging Exporter在该局部场景下的响应。
    resultCallback: (result: ExportResult) => void,
  ): Promise<void> {
    // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
    try {
      // Filter for event logs only (by scope name)
      // eventLogs 集合筛选`logs.filter`，供服务层 first Party Event Logging Expor...后续处理使用。
      const eventLogs = logs.filter(
        // log更新为 `>`，确保服务层后续读取最新状态。
        log =>
          log.instrumentationScope?.name === 'com.anthropic.claude_code.events',
      )

      // eventLogs 集合为空时立即返回或跳过，避免服务层 first Party Event Logging Expor...把空集合当成可处理内容。
      if (eventLogs.length === 0) {
        // 调用 resultCallback，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        resultCallback({ code: ExportResultCode.SUCCESS })
        // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Transform new logs (failed events are retried independently via backoff)
      // events 集合保存`this.transformLogsToEvents`，供服务层 first Party Event Logging Expor...后续处理使用。
      const events = this.transformLogsToEvents(eventLogs).events

      // events 集合为空时立即返回或跳过，避免服务层 first Party Event Logging Expor...把空集合当成可处理内容。
      if (events.length === 0) {
        // 调用 resultCallback，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        resultCallback({ code: ExportResultCode.SUCCESS })
        // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 满足 `this.attempts >= this.maxAttempts` 时，服务层 first Party Event Logging Expor...执行该分支。
      if (this.attempts >= this.maxAttempts) {
        // 调用 resultCallback，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        resultCallback({
          code: ExportResultCode.FAILED,
          error: new Error(
            `Dropped ${events.length} events: max attempts (${this.maxAttempts}) reached`,
          ),
        })
        // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Send events
      // failedEvents 集合保存`this.sendEventsInBatches`，供服务层 first Party Event Logging Expor...后续处理使用。
      const failedEvents = await this.sendEventsInBatches(events)
      // 服务层 first Party Event Logging Expor...在这里处理 `this.attempts++`，完成这一小步状态转换。
      this.attempts++

      // 满足 `failedEvents.length > 0` 时，服务层 first Party Event Logging Expor...执行该分支。
      if (failedEvents.length > 0) {
        // 等待 `this.queueFailedEvents(failedEvents)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
        await this.queueFailedEvents(failedEvents)
        // 调用 this.scheduleBackoffRetry，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        this.scheduleBackoffRetry()
        // context保存`this.lastExportErrorContext`，供后续判断或组装使用。
        const context = this.lastExportErrorContext
          ? ` (${this.lastExportErrorContext})`
          : ''
        // 调用 resultCallback，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        resultCallback({
          code: ExportResultCode.FAILED,
          error: new Error(
            `Failed to export ${failedEvents.length} events${context}`,
          ),
        })
        // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Success - reset backoff and immediately retry any queued events
      // 调用 this.resetBackoff，触发服务层 first Party Event Logging Expor...此处需要的副作用。
      this.resetBackoff()
      // 组合条件 `(await this.getQueuedEventCount()) > 0 && !this.isRetrying` 成立时，服务层 first Party Event Logging Expor...才启用这条专门路径。
      if ((await this.getQueuedEventCount()) > 0 && !this.isRetrying) {
        // 显式忽略 `this.retryFailedEvents()` 的返回值，只保留它触发的副作用。
        void this.retryFailedEvents()
      }
      // 调用 resultCallback，触发服务层 first Party Event Logging Expor...此处需要的副作用。
      resultCallback({ code: ExportResultCode.SUCCESS })
    } catch (error) {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `1P event logging export failed: ${errorMessage(error)}`,
        )
      }
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 调用 resultCallback，触发服务层 first Party Event Logging Expor...此处需要的副作用。
      resultCallback({
        code: ExportResultCode.FAILED,
        error: toError(error),
      })
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async sendEventsInBatches(`，完成这一小步状态转换。
  private async sendEventsInBatches(
    events: FirstPartyEventLoggingEvent[],
  ): Promise<FirstPartyEventLoggingEvent[]> {
    // Chunk events into batches
    // batches 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const batches: FirstPartyEventLoggingEvent[][] = []
    // 循环处理 `let i = 0; i < events.length; i += this.maxBatchS`，让服务层 first Party Event Logging Expor...把同类条目按顺序走完。
    for (let i = 0; i < events.length; i += this.maxBatchSize) {
      // batches 集合追加新条目，保持收集顺序与输入顺序一致。
      batches.push(events.slice(i, i + this.maxBatchSize))
    }

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `1P event logging: exporting ${events.length} events in ${batches.length} batch(es)`,
      )
    }

    // Send each batch with delay between them. On first failure, assume the
    // endpoint is down and short-circuit: queue the failed batch plus all
    // remaining unsent batches without POSTing them. The backoff retry will
    // probe again with a single batch next tick.
    // failedBatchEvents 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const failedBatchEvents: FirstPartyEventLoggingEvent[] = []
    // lastErrorContext 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
    let lastErrorContext: string | undefined
    // 按索引扫描 `batches.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < batches.length; i++) {
      // batch读取 `batches[i]!` 对应条目，后续围绕该成员继续处理。
      const batch = batches[i]!
      // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `this.sendBatchWithRetry({ events: batch })` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
        await this.sendBatchWithRetry({ events: batch })
      } catch (error) {
        // lastErrorContext 错误信息更新为 `getAxiosErrorContext(error)`，确保服务层后续读取最新状态。
        lastErrorContext = getAxiosErrorContext(error)
        // 循环处理 `let j = i; j < batches.length; j++`，让服务层 first Party Event Logging Expor...把同类条目按顺序走完。
        for (let j = i; j < batches.length; j++) {
          // failedBatchEvents 集合追加新条目，保持收集顺序与输入顺序一致。
          failedBatchEvents.push(...batches[j]!)
        }
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // skipped保存 `batches.length - 1 - i` 的判断结果，供服务层 first Party Event Logging Expor...后续分支直接复用。
          const skipped = batches.length - 1 - i
          // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `1P event logging: batch ${i + 1}/${batches.length} failed (${lastErrorContext}); short-circuiting ${skipped} remaining batch(es)`,
          )
        }
        // 结束这个分支或循环，避免服务层 first Party Event Logging Exporter继续落入后续路径。
        break
      }

      // 组合条件 `i < batches.length - 1 && this.batchDelayMs > 0` 成立时，服务层 first Party Event Logging Expor...才启用这条专门路径。
      if (i < batches.length - 1 && this.batchDelayMs > 0) {
        // 等待 `sleep(this.batchDelayMs)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
        await sleep(this.batchDelayMs)
      }
    }

    // 组合条件 `failedBatchEvents.length > 0 && lastErrorContext` 成立时，服务层 first Party Event Logging Expor...才启用这条专门路径。
    if (failedBatchEvents.length > 0 && lastErrorContext) {
      // 更新实例字段 lastExportErrorContext 为 lastErrorContext，同步服务层 first Party Event Logging Exporter的内部状态。
      this.lastExportErrorContext = lastErrorContext
    }

    // 返回 `failedBatchEvents`，作为服务层 first Party Event Logging Expor...这次计算的结果。
    return failedBatchEvents
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async queueFailedEvents(`，完成这一小步状态转换。
  private async queueFailedEvents(
    events: FirstPartyEventLoggingEvent[],
  ): Promise<void> {
    // 文件路径读取`this.getCurrentBatchFilePath`，供服务层 first Party Event Logging Expor...后续处理使用。
    const filePath = this.getCurrentBatchFilePath()

    // Append-only: just add new events to file (atomic on most filesystems)
    // 等待 `this.appendEventsToFile(filePath, events)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
    await this.appendEventsToFile(filePath, events)

    // context保存`this.lastExportErrorContext`，供后续判断或组装使用。
    const context = this.lastExportErrorContext
      ? ` (${this.lastExportErrorContext})`
      : ''
    // 消息 命名 ``1P event logging: ${events.length} events failed to expo...`，让后续代码直接表达这个值的用途。
    const message = `1P event logging: ${events.length} events failed to export${context}`
    // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
    logError(new Error(message))
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private scheduleBackoffRetry(): void {`，完成这一小步状态转换。
  private scheduleBackoffRetry(): void {
    // Don't schedule if already retrying or shutdown
    // 组合条件 `this.cancelBackoff || this.isRetrying || this.isS` 成立时，服务层 first Party Event Logging Expor...才启用这条专门路径。
    if (this.cancelBackoff || this.isRetrying || this.isShutdown) {
      // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Quadratic backoff (matching Statsig SDK): base * attempts²
    // delay保存`Math.min`，供服务层 first Party Event Logging Expor...后续处理使用。
    const delay = Math.min(
      this.baseBackoffDelayMs * this.attempts * this.attempts,
      this.maxBackoffDelayMs,
    )

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `1P event logging: scheduling backoff retry in ${delay}ms (attempt ${this.attempts})`,
      )
    }

    // 更新实例字段 cancelBackoff 为 this.schedule(async () => {，同步服务层 first Party Event Logging Exporter的内部状态。
    this.cancelBackoff = this.schedule(async () => {
      // 更新实例字段 cancelBackoff 为 null，同步服务层 first Party Event Logging Exporter的内部状态。
      this.cancelBackoff = null
      // 等待 `this.retryFailedEvents()` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await this.retryFailedEvents()
    }, delay)
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async retryFailedEvents(): Promise<void> {`，完成这一小步状态转换。
  private async retryFailedEvents(): Promise<void> {
    // 文件路径读取`this.getCurrentBatchFilePath`，供服务层 first Party Event Logging Expor...后续处理使用。
    const filePath = this.getCurrentBatchFilePath()

    // Keep retrying while there are events and endpoint is healthy
    // while 使用 !this.isShutdown 完成服务层 first Party Event Logging Exporter里的对应操作。
    while (!this.isShutdown) {
      // events 集合读取`this.loadEventsFromFile`，供服务层 first Party Event Logging Expor...后续处理使用。
      const events = await this.loadEventsFromFile(filePath)
      // events 集合为空时立即返回或跳过，避免服务层 first Party Event Logging Expor...把空集合当成可处理内容。
      if (events.length === 0) break

      // 满足 `this.attempts >= this.maxAttempts` 时，服务层 first Party Event Logging Expor...执行该分支。
      if (this.attempts >= this.maxAttempts) {
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `1P event logging: max attempts (${this.maxAttempts}) reached, dropping ${events.length} events`,
          )
        }
        // 等待 `this.deleteFile(filePath)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
        await this.deleteFile(filePath)
        // 调用 this.resetBackoff，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        this.resetBackoff()
        // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 更新实例字段 isRetrying 为 true，同步服务层 first Party Event Logging Exporter的内部状态。
      this.isRetrying = true

      // Clear file before retry (we have events in memory now)
      // 等待 `this.deleteFile(filePath)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
      await this.deleteFile(filePath)

      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `1P event logging: retrying ${events.length} failed events (attempt ${this.attempts + 1})`,
        )
      }

      // failedEvents 集合保存`this.sendEventsInBatches`，供服务层 first Party Event Logging Expor...后续处理使用。
      const failedEvents = await this.sendEventsInBatches(events)
      // 服务层 first Party Event Logging Expor...在这里处理 `this.attempts++`，完成这一小步状态转换。
      this.attempts++

      // 更新实例字段 isRetrying 为 false，同步服务层 first Party Event Logging Exporter的内部状态。
      this.isRetrying = false

      // 满足 `failedEvents.length > 0` 时，服务层 first Party Event Logging Expor...执行该分支。
      if (failedEvents.length > 0) {
        // Write failures back to disk
        // 等待 `this.saveEventsToFile(filePath, failedEvents)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
        await this.saveEventsToFile(filePath, failedEvents)
        // 调用 this.scheduleBackoffRetry，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        this.scheduleBackoffRetry()
        // 返回 `// Failed - wait for backoff`，作为服务层 first Party Event Logging Expor...这次计算的结果。
        return // Failed - wait for backoff
      }

      // Success - reset backoff and continue loop to drain any newly queued events
      // 调用 this.resetBackoff，触发服务层 first Party Event Logging Expor...此处需要的副作用。
      this.resetBackoff()
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
        logForDebugging('1P event logging: backoff retry succeeded')
      }
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private resetBackoff(): void {`，完成这一小步状态转换。
  private resetBackoff(): void {
    // 更新实例字段 attempts 为 0，同步服务层 first Party Event Logging Exporter的内部状态。
    this.attempts = 0
    // 满足 `this.cancelBackoff` 时，服务层 first Party Event Logging Expor...执行该分支。
    if (this.cancelBackoff) {
      // 调用 this.cancelBackoff，触发服务层 first Party Event Logging Expor...此处需要的副作用。
      this.cancelBackoff()
      // 更新实例字段 cancelBackoff 为 null，同步服务层 first Party Event Logging Exporter的内部状态。
      this.cancelBackoff = null
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private async sendBatchWithRetry(`，完成这一小步状态转换。
  private async sendBatchWithRetry(
    payload: FirstPartyEventLoggingPayload,
  ): Promise<void> {
    // 满足 `this.isKilled()` 时，服务层 first Party Event Logging Expor...执行该分支。
    if (this.isKilled()) {
      // Throw so the caller short-circuits remaining batches and queues
      // everything to disk. Zero network traffic while killed; the backoff
      // timer keeps ticking and will resume POSTs as soon as the GrowthBook
      // cache picks up the cleared flag.
      // 抛出 new Error('firstParty sink killswitch active')，阻止服务层 first Party Event Logging Exporter在无效状态下继续运行。
      throw new Error('firstParty sink killswitch active')
    }

    // baseHeaders 集合 集中保存服务层 first Party Event Logging Expor...要一起传递的字段。
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': getClaudeCodeUserAgent(),
      'x-service-name': 'claude-code',
    }

    // Skip auth if trust hasn't been established yet
    // This prevents executing apiKeyHelper commands before the trust dialog
    // Non-interactive sessions implicitly have workspace trust
    // hasTrust 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasTrust =
      checkHasTrustDialogAccepted() || getIsNonInteractiveSession()
    // 组合条件 `process.env.USER_TYPE === 'ant' && !hasTrust` 成立时，服务层 first Party Event Logging Expor...才启用这条专门路径。
    if (process.env.USER_TYPE === 'ant' && !hasTrust) {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging('1P event logging: Trust not accepted')
    }

    // Skip auth when the OAuth token is expired or lacks user:profile
    // scope (service key sessions). Falls through to unauthenticated send.
    // shouldSkipAuth标记服务层 first Party Event Logging Expor...是否启用对应路径。
    let shouldSkipAuth = this.skipAuth || !hasTrust
    // 组合条件 `!shouldSkipAuth && isClaudeAISubscriber()` 成立时，服务层 first Party Event Logging Expor...才启用这条专门路径。
    if (!shouldSkipAuth && isClaudeAISubscriber()) {
      // token 列表读取`getClaudeAIOAuthTokens`，供服务层 first Party Event Logging Expor...后续处理使用。
      const tokens = getClaudeAIOAuthTokens()
      // 满足 `!hasProfileScope()` 时，服务层 first Party Event Logging Expor...执行该分支。
      if (!hasProfileScope()) {
        // shouldSkipAuth更新为 `true`，确保服务层后续读取最新状态。
        shouldSkipAuth = true
      // 服务层 first Party Event Logging Expor...在这里处理 `} else if (tokens && isOAuthTokenExpired(tokens.expiresAt)) {`，完成这一小步状态转换。
      } else if (tokens && isOAuthTokenExpired(tokens.expiresAt)) {
        // shouldSkipAuth更新为 `true`，确保服务层后续读取最新状态。
        shouldSkipAuth = true
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            '1P event logging: OAuth token expired, skipping auth to avoid 401',
          )
        }
      }
    }

    // Try with auth headers first (unless trust not established or token is known to be expired)
    // authResult 命名 `shouldSkipAuth`，让后续代码直接表达这个值的用途。
    const authResult = shouldSkipAuth
      ? { headers: {}, error: 'trust not established or Oauth token expired' }
      : getAuthHeaders()
    // useAuth标记服务层 first Party Event Logging Expor...是否启用对应路径。
    const useAuth = !authResult.error

    // 当 `!useAuth && process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
    if (!useAuth && process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `1P event logging: auth not available, sending without auth`,
      )
    }

    // 请求头读取 hook 状态，供服务层 first Party Event Logging Expor...本轮渲染使用。
    const headers = useAuth
      ? { ...baseHeaders, ...authResult.headers }
      : baseHeaders

    // 保护这一段可能失败的服务层 first Party Event Logging Exporter操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应保存`axios.post`，供服务层 first Party Event Logging Expor...后续处理使用。
      const response = await axios.post(this.endpoint, payload, {
        timeout: this.timeout,
        headers,
      })
      // 调用 this.logSuccess，触发服务层 first Party Event Logging Expor...此处需要的副作用。
      this.logSuccess(payload.events.length, useAuth, response.data)
      // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    } catch (error) {
      // Handle 401 by retrying without auth
      // 服务层 first Party Event Logging Expor...在这里进入条件判断，后续代码按实际状态分流。
      if (
        useAuth &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            '1P event logging: 401 auth error, retrying without auth',
          )
        }
        // 接口响应保存`axios.post`，供服务层 first Party Event Logging Expor...后续处理使用。
        const response = await axios.post(this.endpoint, payload, {
          timeout: this.timeout,
          headers: baseHeaders,
        })
        // 调用 this.logSuccess，触发服务层 first Party Event Logging Expor...此处需要的副作用。
        this.logSuccess(payload.events.length, false, response.data)
        // 服务层 first Party Event Logging Expor...在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 抛出 error，阻止服务层 first Party Event Logging Exporter在无效状态下继续运行。
      throw error
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private logSuccess(`，完成这一小步状态转换。
  private logSuccess(
    eventCount: number,
    withAuth: boolean,
    responseData: unknown,
  ): void {
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `1P event logging: ${eventCount} events exported successfully${withAuth ? ' (with auth)' : ' (without auth)'}`,
      )
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`API Response: ${jsonStringify(responseData, null, 2)}`)
    }
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private hrTimeToDate(hrTime: HrTime): Date {`，完成这一小步状态转换。
  private hrTimeToDate(hrTime: HrTime): Date {
    // 从 `hrTime` 按位置拆出 seconds、nanoseconds，让服务层 first Party Event Logging Expor...分别处理这些返回值。
    const [seconds, nanoseconds] = hrTime
    // 返回 `new Date(seconds * 1000 + nanoseconds / 1000000)`，作为服务层 first Party Event Logging Expor...这次计算的结果。
    return new Date(seconds * 1000 + nanoseconds / 1000000)
  }

  // 服务层 first Party Event Logging Expor...在这里处理 `private transformLogsToEvents(`，完成这一小步状态转换。
  private transformLogsToEvents(
    logs: ReadableLogRecord[],
  ): FirstPartyEventLoggingPayload {
    // events 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const events: FirstPartyEventLoggingEvent[] = []

    // 逐项读取 `logs` 中的log，按输入顺序推进服务层 first Party Event Logging Expor...。
    for (const log of logs) {
      // attributes 集合标记服务层 first Party Event Logging Expor...是否启用对应路径。
      const attributes = log.attributes || {}

      // Check if this is a GrowthBook experiment event
      // 满足 `attributes.event_type === 'GrowthbookExperimentEv` 时，服务层 first Party Event Logging Expor...执行该分支。
      if (attributes.event_type === 'GrowthbookExperimentEvent') {
        // timestamp记录时间`this.hrTimeToDate`，供服务层 first Party Event Logging Expor...后续处理使用。
        const timestamp = this.hrTimeToDate(log.hrTime)
        // account_uuid 数量统计`attributes.account_uuid as string | undefined`，供后续判断或组装使用。
        const account_uuid = attributes.account_uuid as string | undefined
        // organization_uuid 命名 `attributes.organization_uuid as`，让后续代码直接表达这个值的用途。
        const organization_uuid = attributes.organization_uuid as
          | string
          | undefined
        // events 集合追加新条目，保持收集顺序与输入顺序一致。
        events.push({
          event_type: 'GrowthbookExperimentEvent',
          event_data: GrowthbookExperimentEvent.toJSON({
            event_id: attributes.event_id as string,
            timestamp,
            experiment_id: attributes.experiment_id as string,
            variation_id: attributes.variation_id as number,
            environment: attributes.environment as string,
            user_attributes: attributes.user_attributes as string,
            experiment_metadata: attributes.experiment_metadata as string,
            device_id: attributes.device_id as string,
            session_id: attributes.session_id as string,
            auth:
              account_uuid || organization_uuid
                ? { account_uuid, organization_uuid }
                : undefined,
          }),
        })
        // 跳过当前项，继续处理服务层 first Party Event Logging Exporter中的下一轮循环。
        continue
      }

      // Extract event name
      // eventName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const eventName =
        (attributes.event_name as string) || (log.body as string) || 'unknown'

      // Extract metadata objects directly (no JSON parsing needed)
      // coreMetadata保存`attributes.core_metadata as EventMetadata | undefined`，供后续判断或组装使用。
      const coreMetadata = attributes.core_metadata as EventMetadata | undefined
      // userMetadata保存`attributes.user_metadata as CoreUserData`，供后续判断或组装使用。
      const userMetadata = attributes.user_metadata as CoreUserData
      // eventMetadata标记服务层 first Party Event Logging Expor...是否启用对应路径。
      const eventMetadata = (attributes.event_metadata || {}) as Record<
        string,
        unknown
      >

      // coreMetadata缺失时提前走兜底路径，避免服务层 first Party Event Logging Expor...继续依赖无效输入。
      if (!coreMetadata) {
        // Emit partial event if core metadata is missing
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `1P event logging: core_metadata missing for event ${eventName}`,
          )
        }
        // events 集合追加新条目，保持收集顺序与输入顺序一致。
        events.push({
          event_type: 'ClaudeCodeInternalEvent',
          event_data: ClaudeCodeInternalEvent.toJSON({
            event_id: attributes.event_id as string | undefined,
            event_name: eventName,
            client_timestamp: this.hrTimeToDate(log.hrTime),
            session_id: getSessionId(),
            additional_metadata: Buffer.from(
              jsonStringify({
                transform_error: 'core_metadata attribute is missing',
              }),
            ).toString('base64'),
          }),
        })
        // 跳过当前项，继续处理服务层 first Party Event Logging Exporter中的下一轮循环。
        continue
      }

      // Transform to 1P format
      // formatted保存`to1PEventFormat`，供服务层 first Party Event Logging Expor...后续处理使用。
      const formatted = to1PEventFormat(
        coreMetadata,
        userMetadata,
        eventMetadata,
      )

      // _PROTO_* keys are PII-tagged values meant only for privileged BQ
      // columns. Hoist known keys to proto fields, then defensively strip any
      // remaining _PROTO_* so an unrecognized future key can't silently land
      // in the general-access additional_metadata blob. sink.ts applies the
      // same strip before Datadog; this closes the 1P side.
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        _PROTO_skill_name,
        _PROTO_plugin_name,
        _PROTO_marketplace_name,
        ...rest
      } = formatted.additional
      // additionalMetadata保存`stripProtoFields`，供服务层 first Party Event Logging Expor...后续处理使用。
      const additionalMetadata = stripProtoFields(rest)

      // events 集合追加新条目，保持收集顺序与输入顺序一致。
      events.push({
        event_type: 'ClaudeCodeInternalEvent',
        event_data: ClaudeCodeInternalEvent.toJSON({
          event_id: attributes.event_id as string | undefined,
          event_name: eventName,
          client_timestamp: this.hrTimeToDate(log.hrTime),
          device_id: attributes.user_id as string | undefined,
          email: userMetadata?.email,
          auth: formatted.auth,
          ...formatted.core,
          env: formatted.env,
          process: formatted.process,
          skill_name:
            typeof _PROTO_skill_name === 'string'
              ? _PROTO_skill_name
              : undefined,
          plugin_name:
            typeof _PROTO_plugin_name === 'string'
              ? _PROTO_plugin_name
              : undefined,
          marketplace_name:
            typeof _PROTO_marketplace_name === 'string'
              ? _PROTO_marketplace_name
              : undefined,
          additional_metadata:
            Object.keys(additionalMetadata).length > 0
              ? Buffer.from(jsonStringify(additionalMetadata)).toString(
                  'base64',
                )
              : undefined,
        }),
      })
    }

    // 返回结构化结果，集中表达服务层 first Party Event Logging Expor...已经整理出的状态。
    return { events }
  }

  // shutdown 使用 无 完成服务层 first Party Event Logging Exporter里的对应操作。
  async shutdown(): Promise<void> {
    // 更新实例字段 isShutdown 为 true，同步服务层 first Party Event Logging Exporter的内部状态。
    this.isShutdown = true
    // 调用 this.resetBackoff，触发服务层 first Party Event Logging Expor...此处需要的副作用。
    this.resetBackoff()
    // 等待 `this.forceFlush()` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
    await this.forceFlush()
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging('1P event logging exporter shutdown complete')
    }
  }

  // forceFlush 使用 无 完成服务层 first Party Event Logging Exporter里的对应操作。
  async forceFlush(): Promise<void> {
    // 等待 `Promise.all(this.pendingExports)` 完成，再继续服务层 first Party Event Logging Expor...的异步流程。
    await Promise.all(this.pendingExports)
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logging Expor...执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logging Expor...运行诊断，方便排查异常路径或性能问题。
      logForDebugging('1P event logging exporter flush complete')
    }
  }
}

// getAxiosErrorContext 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAxiosErrorContext(error: unknown): string {
  // 满足 `!axios.isAxiosError(error)` 时，服务层 first Party Event Logging Expor...执行该分支。
  if (!axios.isAxiosError(error)) {
    // 返回 `errorMessage(error)`，作为服务层 first Party Event Logging Expor...这次计算的结果。
    return errorMessage(error)
  }

  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []

  // requestId 请求数据保存`error.response?.headers?.['request-id']`，供服务层 first Party Event Logging Expor...后续判断或输出使用。
  const requestId = error.response?.headers?.['request-id']
  // 满足 `requestId` 时，服务层 first Party Event Logging Expor...执行该分支。
  if (requestId) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`request-id=${requestId}`)
  }

  // 满足 `error.response?.status` 时，服务层 first Party Event Logging Expor...执行该分支。
  if (error.response?.status) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`status=${error.response.status}`)
  }

  // 满足 `error.code` 时，服务层 first Party Event Logging Expor...执行该分支。
  if (error.code) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`code=${error.code}`)
  }

  // 满足 `error.message` 时，服务层 first Party Event Logging Expor...执行该分支。
  if (error.message) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(error.message)
  }

  // 返回 `parts.join(', ')`，作为服务层 first Party Event Logging Expor...这次计算的结果。
  return parts.join(', ')
}
