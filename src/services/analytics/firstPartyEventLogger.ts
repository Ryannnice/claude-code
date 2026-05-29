// 类型依赖 { AnyValueMap, Logger, logs } 来自 @opentelemetry/api-logs，用于校准服务层 first Party Event Logger的数据契约。
import type { AnyValueMap, Logger, logs } from '@opentelemetry/api-logs'
// 引入 resourceFromAttributes，将 @opentelemetry/resources 中已经封装好的能力接到本文件流程里。
import { resourceFromAttributes } from '@opentelemetry/resources'
// 整理这一组导入，让服务层 first Party Event Logger后续逻辑可以直接复用这些外部能力。
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs'
// 整理这一组导入，让服务层 first Party Event Logger后续逻辑可以直接复用这些外部能力。
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 isEqual，将 lodash-es 中已经封装好的能力接到本文件流程里。
import { isEqual } from 'lodash-es'
// 复用 getOrCreateUserID 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getOrCreateUserID } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getPlatform、getWslVersion 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform, getWslVersion } from '../../utils/platform.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 profileCheckpoint 工具函数，把通用处理留在 ../../utils/startupProfiler.js 中维护。
import { profileCheckpoint } from '../../utils/startupProfiler.js'
// 复用 getCoreUserData 工具函数，把通用处理留在 ../../utils/user.js 中维护。
import { getCoreUserData } from '../../utils/user.js'
// 引入 isAnalyticsDisabled，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { isAnalyticsDisabled } from './config.js'
// 引入 FirstPartyEventLoggingExporter，将 ./firstPartyEventLoggingExporter.js 中已经封装好的能力接到本文件流程里。
import { FirstPartyEventLoggingExporter } from './firstPartyEventLoggingExporter.js'
// 类型依赖 { GrowthBookUserAttributes } 来自 ./growthbook.js，用于校准服务层 first Party Event Logger的数据契约。
import type { GrowthBookUserAttributes } from './growthbook.js'
// 引入 getDynamicConfig_CACHED_MAY_BE_STALE，将 ./growthbook.js 中已经封装好的能力接到本文件流程里。
import { getDynamicConfig_CACHED_MAY_BE_STALE } from './growthbook.js'
// 引入 getEventMetadata，将 ./metadata.js 中已经封装好的能力接到本文件流程里。
import { getEventMetadata } from './metadata.js'
// 引入 isSinkKilled，将 ./sinkKillswitch.js 中已经封装好的能力接到本文件流程里。
import { isSinkKilled } from './sinkKillswitch.js'

/**
 * Configuration for sampling individual event types.
 * Each event name maps to an object containing sample_rate (0-1).
 * Events not in the config are logged at 100% rate.
 */
// EventSamplingConfig 固化服务层 first Party Event Logger里传递的数据形状，帮助调用方按同一结构读写字段。
export type EventSamplingConfig = {
  [eventName: string]: {
    sample_rate: number
  }
}

// EVENT_SAMPLING_CONFIG_NAME 配置保存`'tengu_event_sampling_config'`，作为后续固定文本处理的输入。
const EVENT_SAMPLING_CONFIG_NAME = 'tengu_event_sampling_config'
/**
 * Get the event sampling configuration from GrowthBook.
 * Uses cached value if available, updates cache in background.
 */
// getEventSamplingConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEventSamplingConfig(): EventSamplingConfig {
  // 返回 `getDynamicConfig_CACHED_MAY_BE_STALE<EventSamplingConfig>(`，作为服务层 first Party Event Logger这次计算的结果。
  return getDynamicConfig_CACHED_MAY_BE_STALE<EventSamplingConfig>(
    EVENT_SAMPLING_CONFIG_NAME,
    {},
  )
}

/**
 * Determine if an event should be sampled based on its sample rate.
 * Returns the sample rate if sampled, null if not sampled.
 *
 * @param eventName - Name of the event to check
 * @returns The sample_rate if event should be logged, null if it should be dropped
 */
// shouldSampleEvent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldSampleEvent(eventName: string): number | null {
  // 配置读取`getEventSamplingConfig`，供服务层 first Party Event Logger后续处理使用。
  const config = getEventSamplingConfig()
  // eventConfig 配置 命名 `config[eventName]`，让后续代码直接表达这个值的用途。
  const eventConfig = config[eventName]

  // If no config for this event, log at 100% rate (no sampling)
  // eventConfig 配置缺失时提前走兜底路径，避免服务层 first Party Event Logger继续依赖无效输入。
  if (!eventConfig) {
    // 返回 `null`，作为服务层 first Party Event Logger这次计算的结果。
    return null
  }

  // sampleRate 命名 `eventConfig.sample_rate`，让后续代码直接表达这个值的用途。
  const sampleRate = eventConfig.sample_rate

  // Validate sample rate is in valid range
  // `typeof sampleRate` 与 `'number' || sampleRate < 0` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof sampleRate !== 'number' || sampleRate < 0 || sampleRate > 1) {
    // 返回 `null`，作为服务层 first Party Event Logger这次计算的结果。
    return null
  }

  // Sample rate of 1 means log everything (no need to add metadata)
  // 满足 `sampleRate >= 1` 时，服务层 first Party Event Logger执行该分支。
  if (sampleRate >= 1) {
    // 返回 `null`，作为服务层 first Party Event Logger这次计算的结果。
    return null
  }

  // Sample rate of 0 means drop everything
  // 满足 `sampleRate <= 0` 时，服务层 first Party Event Logger执行该分支。
  if (sampleRate <= 0) {
    // 返回 `0`，作为服务层 first Party Event Logger这次计算的结果。
    return 0
  }

  // Randomly decide whether to sample this event
  // 返回 `Math.random() < sampleRate ? sampleRate : 0`，作为服务层 first Party Event Logger这次计算的结果。
  return Math.random() < sampleRate ? sampleRate : 0
}

// BATCH_CONFIG_NAME 配置 命名 `'tengu_1p_event_batch_config'`，让后续代码直接表达这个值的用途。
const BATCH_CONFIG_NAME = 'tengu_1p_event_batch_config'
// BatchConfig 固化服务层 first Party Event Logger里传递的数据形状，帮助调用方按同一结构读写字段。
type BatchConfig = {
  scheduledDelayMillis?: number
  maxExportBatchSize?: number
  maxQueueSize?: number
  skipAuth?: boolean
  maxAttempts?: number
  path?: string
  baseUrl?: string
}
// getBatchConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBatchConfig(): BatchConfig {
  // 返回 `getDynamicConfig_CACHED_MAY_BE_STALE<BatchConfig>(`，作为服务层 first Party Event Logger这次计算的结果。
  return getDynamicConfig_CACHED_MAY_BE_STALE<BatchConfig>(
    BATCH_CONFIG_NAME,
    {},
  )
}

// Module-local state for event logging (not exposed globally)
// firstPartyEventLogger初始化为空值，后续分支会在有数据时补齐。
let firstPartyEventLogger: ReturnType<typeof logs.getLogger> | null = null
// firstPartyEventLoggerProvider 命名 `null`，让后续代码直接表达这个值的用途。
let firstPartyEventLoggerProvider: LoggerProvider | null = null
// Last batch config used to construct the provider — used by
// reinitialize1PEventLoggingIfConfigChanged to decide whether a rebuild is
// needed when GrowthBook refreshes.
// lastBatchConfig 配置 命名 `null`，让后续代码直接表达这个值的用途。
let lastBatchConfig: BatchConfig | null = null
/**
 * Flush and shutdown the 1P event logger.
 * This should be called as the final step before process exit to ensure
 * all events (including late ones from API responses) are exported.
 */
// shutdown1PEventLogging 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function shutdown1PEventLogging(): Promise<void> {
  // firstPartyEventLoggerProvider缺失时提前走兜底路径，避免服务层 first Party Event Logger继续依赖无效输入。
  if (!firstPartyEventLoggerProvider) {
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 保护这一段可能失败的服务层 first Party Event Logger操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `firstPartyEventLoggerProvider.shutdown()` 完成，再继续服务层 first Party Event Logger的异步流程。
    await firstPartyEventLoggerProvider.shutdown()
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logger执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logger运行诊断，方便排查异常路径或性能问题。
      logForDebugging('1P event logging: final shutdown complete')
    }
  } catch {
    // Ignore shutdown errors
  }
}

/**
 * Check if 1P event logging is enabled.
 * Respects the same opt-outs as other analytics sinks:
 * - Test environment
 * - Third-party cloud providers (Bedrock/Vertex)
 * - Global telemetry opt-outs
 * - Non-essential traffic disabled
 *
 * Note: Unlike BigQuery metrics, event logging does NOT check organization-level
 * metrics opt-out via API. It follows the same pattern as Statsig event logging.
 */
// is1PEventLoggingEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function is1PEventLoggingEnabled(): boolean {
  // Respect standard analytics opt-outs
  // 返回 `!isAnalyticsDisabled()`，作为服务层 first Party Event Logger这次计算的结果。
  return !isAnalyticsDisabled()
}

/**
 * Log a 1st-party event for internal analytics (async version).
 * Events are batched and exported to /api/event_logging/batch
 *
 * This enriches the event with core metadata (model, session, env context, etc.)
 * at log time, similar to logEventToStatsig.
 *
 * @param eventName - Name of the event (e.g., 'tengu_api_query')
 * @param metadata - Additional metadata for the event (intentionally no strings, to avoid accidentally logging code/filepaths)
 */
// logEventTo1PAsync 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function logEventTo1PAsync(
  firstPartyEventLogger: Logger,
  eventName: string,
  metadata: Record<string, number | boolean | undefined> = {},
): Promise<void> {
  // 保护这一段可能失败的服务层 first Party Event Logger操作，确保异常能进入相邻错误处理。
  try {
    // Enrich with core metadata at log time (similar to Statsig pattern)
    // coreMetadata读取`getEventMetadata`，供服务层 first Party Event Logger后续处理使用。
    const coreMetadata = await getEventMetadata({
      model: metadata.model,
      betas: metadata.betas,
    })

    // Build attributes - OTel supports nested objects natively via AnyValueMap
    // Cast through unknown since our nested objects are structurally compatible
    // with AnyValue but TS doesn't recognize it due to missing index signatures
    // attributes 集合 集中保存服务层 first Party Event Logger要一起传递的字段。
    const attributes = {
      event_name: eventName,
      event_id: randomUUID(),
      // Pass objects directly - no JSON serialization needed
      core_metadata: coreMetadata,
      user_metadata: getCoreUserData(true),
      event_metadata: metadata,
    } as unknown as AnyValueMap

    // Add user_id if available
    // userId读取`getOrCreateUserID`，供服务层 first Party Event Logger后续处理使用。
    const userId = getOrCreateUserID()
    // 满足 `userId` 时，服务层 first Party Event Logger执行该分支。
    if (userId) {
      // user_id更新为 `userId`，确保服务层后续读取最新状态。
      attributes.user_id = userId
    }

    // Debug logging when debug mode is enabled
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logger执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logger运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ANT-ONLY] 1P event: ${eventName} ${jsonStringify(metadata, null, 0)}`,
      )
    }

    // Emit log record
    // 调用 firstPartyEventLogger.emit，触发服务层 first Party Event Logger此处需要的副作用。
    firstPartyEventLogger.emit({
      body: eventName,
      attributes,
    })
  } catch (e) {
    // 当 `process.env.NODE_ENV` 匹配 `'development'` 时，服务层 first Party Event Logger执行对应分支。
    if (process.env.NODE_ENV === 'development') {
      // 抛出 e，阻止服务层 first Party Event Logger在无效状态下继续运行。
      throw e
    }
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logger执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logger运行诊断，方便排查异常路径或性能问题。
      logError(e as Error)
    }
    // swallow
  }
}

/**
 * Log a 1st-party event for internal analytics.
 * Events are batched and exported to /api/event_logging/batch
 *
 * @param eventName - Name of the event (e.g., 'tengu_api_query')
 * @param metadata - Additional metadata for the event (intentionally no strings, to avoid accidentally logging code/filepaths)
 */
// logEventTo1P 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logEventTo1P(
  eventName: string,
  metadata: Record<string, number | boolean | undefined> = {},
): void {
  // 满足 `!is1PEventLoggingEnabled()` 时，服务层 first Party Event Logger执行该分支。
  if (!is1PEventLoggingEnabled()) {
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 组合条件 `!firstPartyEventLogger || isSinkKilled('firstParty')` 成立时，服务层 first Party Event Logger才启用这条专门路径。
  if (!firstPartyEventLogger || isSinkKilled('firstParty')) {
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Fire and forget - don't block on metadata enrichment
  // 显式忽略 `logEventTo1PAsync(firstPartyEventLogger, eventName, metadata)` 的返回值，只保留它触发的副作用。
  void logEventTo1PAsync(firstPartyEventLogger, eventName, metadata)
}

/**
 * GrowthBook experiment event data for logging
 */
// GrowthBookExperimentData 固化服务层 first Party Event Logger里传递的数据形状，帮助调用方按同一结构读写字段。
export type GrowthBookExperimentData = {
  experimentId: string
  variationId: number
  userAttributes?: GrowthBookUserAttributes
  experimentMetadata?: Record<string, unknown>
}

// api.anthropic.com only serves the "production" GrowthBook environment
// (see starling/starling/cli/cli.py DEFAULT_ENVIRONMENTS). Staging and
// development environments are not exported to the prod API.
// getEnvironmentForGrowthBook 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEnvironmentForGrowthBook(): string {
  // 返回 `'production'`，作为服务层 first Party Event Logger这次计算的结果。
  return 'production'
}

/**
 * Log a GrowthBook experiment assignment event to 1P.
 * Events are batched and exported to /api/event_logging/batch
 *
 * @param data - GrowthBook experiment assignment data
 */
// logGrowthBookExperimentTo1P 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logGrowthBookExperimentTo1P(
  data: GrowthBookExperimentData,
): void {
  // 满足 `!is1PEventLoggingEnabled()` 时，服务层 first Party Event Logger执行该分支。
  if (!is1PEventLoggingEnabled()) {
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 组合条件 `!firstPartyEventLogger || isSinkKilled('firstParty')` 成立时，服务层 first Party Event Logger才启用这条专门路径。
  if (!firstPartyEventLogger || isSinkKilled('firstParty')) {
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // userId读取`getOrCreateUserID`，供服务层 first Party Event Logger后续处理使用。
  const userId = getOrCreateUserID()
  // 从 `getCoreUserData(true)` 解构 accountUuid、organizationUuid，减少服务层 first Party Event Logger对同一对象的重复访问。
  const { accountUuid, organizationUuid } = getCoreUserData(true)

  // Build attributes for GrowthbookExperimentEvent
  // attributes 集合 集中保存服务层 first Party Event Logger要一起传递的字段。
  const attributes = {
    event_type: 'GrowthbookExperimentEvent',
    event_id: randomUUID(),
    experiment_id: data.experimentId,
    variation_id: data.variationId,
    ...(userId && { device_id: userId }),
    ...(accountUuid && { account_uuid: accountUuid }),
    ...(organizationUuid && { organization_uuid: organizationUuid }),
    ...(data.userAttributes && {
      session_id: data.userAttributes.sessionId,
      user_attributes: jsonStringify(data.userAttributes),
    }),
    ...(data.experimentMetadata && {
      experiment_metadata: jsonStringify(data.experimentMetadata),
    }),
    environment: getEnvironmentForGrowthBook(),
  }

  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logger执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 记录服务层 first Party Event Logger运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[ANT-ONLY] 1P GrowthBook experiment: ${data.experimentId} variation=${data.variationId}`,
    )
  }

  // 调用 firstPartyEventLogger.emit，触发服务层 first Party Event Logger此处需要的副作用。
  firstPartyEventLogger.emit({
    body: 'growthbook_experiment',
    attributes,
  })
}

// DEFAULT_LOGS_EXPORT_INTERVAL_MS 集合保存`10000`，供服务层 first Party Event Logger后续判断或输出使用。
const DEFAULT_LOGS_EXPORT_INTERVAL_MS = 10000
// DEFAULT_MAX_EXPORT_BATCH_SIZE 命名 `200`，让后续代码直接表达这个值的用途。
const DEFAULT_MAX_EXPORT_BATCH_SIZE = 200
// DEFAULT_MAX_QUEUE_SIZE 命名 `8192`，让后续代码直接表达这个值的用途。
const DEFAULT_MAX_QUEUE_SIZE = 8192

/**
 * Initialize 1P event logging infrastructure.
 * This creates a separate LoggerProvider for internal event logging,
 * independent of customer OTLP telemetry.
 *
 * This uses its own minimal resource configuration with just the attributes
 * we need for internal analytics (service name, version, platform info).
 */
// initialize1PEventLogging 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initialize1PEventLogging(): void {
  // 调用 profileCheckpoint，触发服务层 first Party Event Logger此处需要的副作用。
  profileCheckpoint('1p_event_logging_start')
  // enabled保存`is1PEventLoggingEnabled`，供服务层 first Party Event Logger后续处理使用。
  const enabled = is1PEventLoggingEnabled()

  // enabled缺失时提前走兜底路径，避免服务层 first Party Event Logger继续依赖无效输入。
  if (!enabled) {
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logger执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 first Party Event Logger运行诊断，方便排查异常路径或性能问题。
      logForDebugging('1P event logging not enabled')
    }
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Fetch batch processor configuration from GrowthBook dynamic config
  // Uses cached value if available, refreshes in background
  // batchConfig 配置读取`getBatchConfig`，供服务层 first Party Event Logger后续处理使用。
  const batchConfig = getBatchConfig()
  // lastBatchConfig 配置更新为 `batchConfig`，确保服务层后续读取最新状态。
  lastBatchConfig = batchConfig
  // 调用 profileCheckpoint，触发服务层 first Party Event Logger此处需要的副作用。
  profileCheckpoint('1p_event_after_growthbook_config')

  // scheduledDelayMillis 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const scheduledDelayMillis =
    batchConfig.scheduledDelayMillis ||
    parseInt(
      process.env.OTEL_LOGS_EXPORT_INTERVAL ||
        DEFAULT_LOGS_EXPORT_INTERVAL_MS.toString(),
    )

  // maxExportBatchSize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const maxExportBatchSize =
    batchConfig.maxExportBatchSize || DEFAULT_MAX_EXPORT_BATCH_SIZE

  // maxQueueSize标记服务层 first Party Event Logger是否启用对应路径。
  const maxQueueSize = batchConfig.maxQueueSize || DEFAULT_MAX_QUEUE_SIZE

  // Build our own resource for 1P event logging with minimal attributes
  // platform读取`getPlatform`，供服务层 first Party Event Logger后续处理使用。
  const platform = getPlatform()
  // attributes 集合 集中保存服务层 first Party Event Logger要一起传递的字段。
  const attributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: 'claude-code',
    [ATTR_SERVICE_VERSION]: MACRO.VERSION,
  }

  // Add WSL-specific attributes if running on WSL
  // 当 `platform` 匹配 `'wsl'` 时，服务层 first Party Event Logger执行对应分支。
  if (platform === 'wsl') {
    // wslVersion读取`getWslVersion`，供服务层 first Party Event Logger后续处理使用。
    const wslVersion = getWslVersion()
    // 满足 `wslVersion` 时，服务层 first Party Event Logger执行该分支。
    if (wslVersion) {
      // version'更新为 `wslVersion`，确保服务层 first Party Event Logger后续读取最新状态。
      attributes['wsl.version'] = wslVersion
    }
  }

  // resource保存`resourceFromAttributes`，供服务层 first Party Event Logger后续处理使用。
  const resource = resourceFromAttributes(attributes)

  // Create a new LoggerProvider with the EventLoggingExporter
  // NOTE: This is kept separate from customer telemetry logs to ensure
  // internal events don't leak to customer endpoints and vice versa.
  // We don't register this globally - it's only used for internal event logging.
  // eventLoggingExporter保存`FirstPartyEventLoggingExporter`，供服务层 first Party Event Logger后续处理使用。
  const eventLoggingExporter = new FirstPartyEventLoggingExporter({
    maxBatchSize: maxExportBatchSize,
    skipAuth: batchConfig.skipAuth,
    maxAttempts: batchConfig.maxAttempts,
    path: batchConfig.path,
    baseUrl: batchConfig.baseUrl,
    // 这个回调绑定到 isKilled: () => isSinkKilled('firstParty'),，负责服务层 first Party Event Logger在该局部场景下的响应。
    isKilled: () => isSinkKilled('firstParty'),
  })
  // firstPartyEventLoggerProvider更新为 `new LoggerProvider({`，确保服务层后续读取最新状态。
  firstPartyEventLoggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(eventLoggingExporter, {
        scheduledDelayMillis,
        maxExportBatchSize,
        maxQueueSize,
      }),
    ],
  })

  // Initialize event logger from our internal provider (NOT from global API)
  // IMPORTANT: We must get the logger from our local provider, not logs.getLogger()
  // because logs.getLogger() returns a logger from the global provider, which is
  // separate and used for customer telemetry.
  // firstPartyEventLogger更新为 `firstPartyEventLoggerProvider.getLogger(`，确保服务层后续读取最新状态。
  firstPartyEventLogger = firstPartyEventLoggerProvider.getLogger(
    'com.anthropic.claude_code.events',
    MACRO.VERSION,
  )
}

/**
 * Rebuild the 1P event logging pipeline if the batch config changed.
 * Register this with onGrowthBookRefresh so long-running sessions pick up
 * changes to batch size, delay, endpoint, etc.
 *
 * Event-loss safety:
 * 1. Null the logger first — concurrent logEventTo1P() calls hit the
 *    !firstPartyEventLogger guard and bail during the swap window. This drops
 *    a handful of events but prevents emitting to a draining provider.
 * 2. forceFlush() drains the old BatchLogRecordProcessor buffer to the
 *    exporter. Export failures go to disk at getCurrentBatchFilePath() which
 *    is keyed by module-level BATCH_UUID + sessionId — unchanged across
 *    reinit — so the NEW exporter's disk-backed retry picks them up.
 * 3. Swap to new provider/logger; old provider shutdown runs in background
 *    (buffer already drained, just cleanup).
 */
// reinitialize1PEventLoggingIfConfigChanged 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function reinitialize1PEventLoggingIfConfigChanged(): Promise<void> {
  // 组合条件 `!is1PEventLoggingEnabled() || !firstPartyEventLoggerProvider` 成立时，服务层 first Party Event Logger才启用这条专门路径。
  if (!is1PEventLoggingEnabled() || !firstPartyEventLoggerProvider) {
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // newConfig 配置读取`getBatchConfig`，供服务层 first Party Event Logger后续处理使用。
  const newConfig = getBatchConfig()

  // 满足 `isEqual(newConfig, lastBatchConfig)` 时，服务层 first Party Event Logger执行该分支。
  if (isEqual(newConfig, lastBatchConfig)) {
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 first Party Event Logger执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 记录服务层 first Party Event Logger运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `1P event logging: ${BATCH_CONFIG_NAME} changed, reinitializing`,
    )
  }

  // oldProvider 命名 `firstPartyEventLoggerProvider`，让后续代码直接表达这个值的用途。
  const oldProvider = firstPartyEventLoggerProvider
  // oldLogger保存`firstPartyEventLogger`，供服务层 first Party Event Logger后续判断或输出使用。
  const oldLogger = firstPartyEventLogger
  // firstPartyEventLogger更新为 `null`，确保服务层后续读取最新状态。
  firstPartyEventLogger = null

  // 保护这一段可能失败的服务层 first Party Event Logger操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `oldProvider.forceFlush()` 完成，再继续服务层 first Party Event Logger的异步流程。
    await oldProvider.forceFlush()
  } catch {
    // Export failures are already on disk; new exporter will retry them.
  }

  // firstPartyEventLoggerProvider更新为 `null`，确保服务层后续读取最新状态。
  firstPartyEventLoggerProvider = null
  // 保护这一段可能失败的服务层 first Party Event Logger操作，确保异常能进入相邻错误处理。
  try {
    // 调用 initialize1PEventLogging，触发服务层 first Party Event Logger此处需要的副作用。
    initialize1PEventLogging()
  } catch (e) {
    // Restore so the next GrowthBook refresh can retry. oldProvider was
    // only forceFlush()'d, not shut down — it's still functional. Without
    // this, both stay null and the !firstPartyEventLoggerProvider gate at
    // the top makes recovery impossible.
    // firstPartyEventLoggerProvider更新为 `oldProvider`，确保服务层后续读取最新状态。
    firstPartyEventLoggerProvider = oldProvider
    // firstPartyEventLogger更新为 `oldLogger`，确保服务层后续读取最新状态。
    firstPartyEventLogger = oldLogger
    // 记录服务层 first Party Event Logger运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 服务层 first Party Event Logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 这个回调绑定到 void oldProvider.shutdown().catch(() => {})，负责服务层 first Party Event Logger在该局部场景下的响应。
  void oldProvider.shutdown().catch(() => {})
}
