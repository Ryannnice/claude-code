// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 复用 getOrCreateUserID 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getOrCreateUserID } from '../../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getCanonicalName 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getCanonicalName } from '../../utils/model/model.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 ../../utils/model/providers.js 中维护。
import { getAPIProvider } from '../../utils/model/providers.js'
// 复用 MODEL_COSTS 工具函数，把通用处理留在 ../../utils/modelCost.js 中维护。
import { MODEL_COSTS } from '../../utils/modelCost.js'
// 引入 isAnalyticsDisabled，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { isAnalyticsDisabled } from './config.js'
// 引入 getEventMetadata，将 ./metadata.js 中已经封装好的能力接到本文件流程里。
import { getEventMetadata } from './metadata.js'

// DATADOG_LOGS_ENDPOINT 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const DATADOG_LOGS_ENDPOINT =
  'https://http-intake.logs.us5.datadoghq.com/api/v2/logs'
// DATADOG_CLIENT_TOKEN保存`'pubbbf48e6d78dae54bceaa4acf463299bf'`，作为后续固定文本处理的输入。
const DATADOG_CLIENT_TOKEN = 'pubbbf48e6d78dae54bceaa4acf463299bf'
// DEFAULT_FLUSH_INTERVAL_MS 集合保存`15000`，供后续判断或组装使用。
const DEFAULT_FLUSH_INTERVAL_MS = 15000
// MAX_BATCH_SIZE 命名 `100`，让后续代码直接表达这个值的用途。
const MAX_BATCH_SIZE = 100
// NETWORK_TIMEOUT_MS 集合保存`5000`，供后续判断或组装使用。
const NETWORK_TIMEOUT_MS = 5000

// DATADOG_ALLOWED_EVENTS 集合保存`Set`，供服务层 datadog后续处理使用。
const DATADOG_ALLOWED_EVENTS = new Set([
  'chrome_bridge_connection_succeeded',
  'chrome_bridge_connection_failed',
  'chrome_bridge_disconnected',
  'chrome_bridge_tool_call_completed',
  'chrome_bridge_tool_call_error',
  'chrome_bridge_tool_call_started',
  'chrome_bridge_tool_call_timeout',
  'tengu_api_error',
  'tengu_api_success',
  'tengu_brief_mode_enabled',
  'tengu_brief_mode_toggled',
  'tengu_brief_send',
  'tengu_cancel',
  'tengu_compact_failed',
  'tengu_exit',
  'tengu_flicker',
  'tengu_init',
  'tengu_model_fallback_triggered',
  'tengu_oauth_error',
  'tengu_oauth_success',
  'tengu_oauth_token_refresh_failure',
  'tengu_oauth_token_refresh_success',
  'tengu_oauth_token_refresh_lock_acquiring',
  'tengu_oauth_token_refresh_lock_acquired',
  'tengu_oauth_token_refresh_starting',
  'tengu_oauth_token_refresh_completed',
  'tengu_oauth_token_refresh_lock_releasing',
  'tengu_oauth_token_refresh_lock_released',
  'tengu_query_error',
  'tengu_session_file_read',
  'tengu_started',
  'tengu_tool_use_error',
  'tengu_tool_use_granted_in_prompt_permanent',
  'tengu_tool_use_granted_in_prompt_temporary',
  'tengu_tool_use_rejected_in_prompt',
  'tengu_tool_use_success',
  'tengu_uncaught_exception',
  'tengu_unhandled_rejection',
  'tengu_voice_recording_started',
  'tengu_voice_toggled',
  'tengu_team_mem_sync_pull',
  'tengu_team_mem_sync_push',
  'tengu_team_mem_sync_started',
  'tengu_team_mem_entries_capped',
])

// TAG_FIELDS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TAG_FIELDS = [
  'arch',
  'clientType',
  'errorType',
  'http_status_range',
  'http_status',
  'kairosActive',
  'model',
  'platform',
  'provider',
  'skillMode',
  'subscriptionType',
  'toolName',
  'userBucket',
  'userType',
  'version',
  'versionBase',
]

// camelToSnakeCase 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function camelToSnakeCase(str: string): string {
  // 返回 `str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)`，作为服务层 datadog这次计算的结果。
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// DatadogLog 固化服务层 datadog里传递的数据形状，帮助调用方按同一结构读写字段。
type DatadogLog = {
  ddsource: string
  ddtags: string
  message: string
  service: string
  hostname: string
  [key: string]: unknown
}

// logBatch 从空数组开始收集，后续循环会按处理顺序追加条目。
let logBatch: DatadogLog[] = []
// flushTimer初始化为空值，后续分支会在有数据时补齐。
let flushTimer: NodeJS.Timeout | null = null
// datadogInitialized保存`null`，作为后续空值处理的输入。
let datadogInitialized: boolean | null = null

// flushLogs 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function flushLogs(): Promise<void> {
  // logBatch为空时立即返回或跳过，避免服务层 datadog把空集合当成可处理内容。
  if (logBatch.length === 0) return

  // logsToSend保存`logBatch`，供服务层 datadog后续判断或输出使用。
  const logsToSend = logBatch
  // logBatch更新为 `[]`，确保服务层后续读取最新状态。
  logBatch = []

  // 保护这一段可能失败的服务层 datadog操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `axios.post(DATADOG_LOGS_ENDPOINT, logsToSend, {` 完成，再继续服务层 datadog的异步流程。
    await axios.post(DATADOG_LOGS_ENDPOINT, logsToSend, {
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DATADOG_CLIENT_TOKEN,
      },
      timeout: NETWORK_TIMEOUT_MS,
    })
  } catch (error) {
    // 记录服务层 datadog运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

// scheduleFlush 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scheduleFlush(): void {
  // 满足 `flushTimer` 时，服务层 datadog执行该分支。
  if (flushTimer) return

  // flushTimer更新为 `setTimeout(() => {`，确保服务层后续读取最新状态。
  flushTimer = setTimeout(() => {
    // flushTimer更新为 `null`，确保服务层后续读取最新状态。
    flushTimer = null
    // 显式忽略 `flushLogs()` 的返回值，只保留它触发的副作用。
    void flushLogs()
  }, getFlushIntervalMs()).unref()
}

// initializeDatadog保存`memoize`，供服务层 datadog后续处理使用。
export const initializeDatadog = memoize(async (): Promise<boolean> => {
  // 满足 `isAnalyticsDisabled()` 时，服务层 datadog执行该分支。
  if (isAnalyticsDisabled()) {
    // datadogInitialized更新为 `false`，确保服务层后续读取最新状态。
    datadogInitialized = false
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的服务层 datadog操作，确保异常能进入相邻错误处理。
  try {
    // datadogInitialized更新为 `true`，确保服务层后续读取最新状态。
    datadogInitialized = true
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录服务层 datadog运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // datadogInitialized更新为 `false`，确保服务层后续读取最新状态。
    datadogInitialized = false
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
})

/**
 * Flush remaining Datadog logs and shut down.
 * Called from gracefulShutdown() before process.exit() since
 * forceExit() prevents the beforeExit handler from firing.
 */
// shutdownDatadog 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function shutdownDatadog(): Promise<void> {
  // 满足 `flushTimer` 时，服务层 datadog执行该分支。
  if (flushTimer) {
    // 调用 clearTimeout，触发服务层 datadog此处需要的副作用。
    clearTimeout(flushTimer)
    // flushTimer更新为 `null`，确保服务层后续读取最新状态。
    flushTimer = null
  }
  // 等待 `flushLogs()` 完成，再继续服务层 datadog的异步流程。
  await flushLogs()
}

// NOTE: use via src/services/analytics/index.ts > logEvent
// trackDatadogEvent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function trackDatadogEvent(
  eventName: string,
  properties: { [key: string]: boolean | number | undefined },
): Promise<void> {
  // `process.env.NODE_ENV` 与 `'production'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.NODE_ENV !== 'production') {
    // 服务层 datadog在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Don't send events for 3P providers (Bedrock, Vertex, Foundry)
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // 服务层 datadog在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Fast path: use cached result if available to avoid await overhead
  // initialized 命名 `datadogInitialized`，让后续代码直接表达这个值的用途。
  let initialized = datadogInitialized
  // 满足 `initialized === null` 时，服务层 datadog执行该分支。
  if (initialized === null) {
    // initialized更新为 `await initializeDatadog()`，确保服务层后续读取最新状态。
    initialized = await initializeDatadog()
  }
  // 组合条件 `!initialized || !DATADOG_ALLOWED_EVENTS.has(eventName)` 成立时，服务层 datadog才启用这条专门路径。
  if (!initialized || !DATADOG_ALLOWED_EVENTS.has(eventName)) {
    // 服务层 datadog在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的服务层 datadog操作，确保异常能进入相邻错误处理。
  try {
    // metadata读取`getEventMetadata`，供服务层 datadog后续处理使用。
    const metadata = await getEventMetadata({
      model: properties.model,
      betas: properties.betas,
    })
    // Destructure to avoid duplicate envContext (once nested, once flattened)
    // 从 `metadata` 解构 envContext、其余 restMetadata，减少服务层 datadog对同一对象的重复访问。
    const { envContext, ...restMetadata } = metadata
    // allData 集中保存服务层 datadog要一起传递的字段。
    const allData: Record<string, unknown> = {
      ...restMetadata,
      ...envContext,
      ...properties,
      userBucket: getUserBucket(),
    }

    // Normalize MCP tool names to "mcp" for cardinality reduction
    // 服务层 datadog在这里进入条件判断，后续代码按实际状态分流。
    if (
      typeof allData.toolName === 'string' &&
      allData.toolName.startsWith('mcp__')
    ) {
      // toolName更新为 `'mcp'`，确保服务层后续读取最新状态。
      allData.toolName = 'mcp'
    }

    // Normalize model names for cardinality reduction (external users only)
    // `process.env.USER_TYPE` 与 `'ant' && typeof allData` 不一致时刷新派生状态，避免使用过期结果。
    if (process.env.USER_TYPE !== 'ant' && typeof allData.model === 'string') {
      // shortName读取`getCanonicalName`，供服务层 datadog后续处理使用。
      const shortName = getCanonicalName(allData.model.replace(/\[1m]$/i, ''))
      // 模型名称更新为 `shortName in MODEL_COSTS ? shortName : 'other'`，确保服务层后续读取最新状态。
      allData.model = shortName in MODEL_COSTS ? shortName : 'other'
    }

    // Truncate dev version to base + date (remove timestamp and sha for cardinality reduction)
    // e.g. "2.0.53-dev.20251124.t173302.sha526cc6a" -> "2.0.53-dev.20251124"
    // 当 `typeof allData.version` 匹配 `'string'` 时，服务层 datadog执行对应分支。
    if (typeof allData.version === 'string') {
      // version更新为 `allData.version.replace(`，确保服务层后续读取最新状态。
      allData.version = allData.version.replace(
        /^(\d+\.\d+\.\d+-dev\.\d{8})\.t\d+\.sha[a-f0-9]+$/,
        '$1',
      )
    }

    // Transform status to http_status and http_status_range to avoid Datadog reserved field
    // `allData.status` 与 `undefined && allData.status !=` 不一致时刷新派生状态，避免使用过期结果。
    if (allData.status !== undefined && allData.status !== null) {
      // statusCode保存`String`，供服务层 datadog后续处理使用。
      const statusCode = String(allData.status)
      // http_status 集合更新为 `statusCode`，确保服务层后续读取最新状态。
      allData.http_status = statusCode

      // Determine status range (1xx, 2xx, 3xx, 4xx, 5xx)
      // firstDigit保存`statusCode.charAt`，供服务层 datadog后续处理使用。
      const firstDigit = statusCode.charAt(0)
      // 组合条件 `firstDigit >= '1' && firstDigit <= '5'` 成立时，服务层 datadog才启用这条专门路径。
      if (firstDigit >= '1' && firstDigit <= '5') {
        // http_status_range更新为 ``${firstDigit}xx``，确保服务层后续读取最新状态。
        allData.http_status_range = `${firstDigit}xx`
      }

      // Remove original status field to avoid conflict with Datadog's reserved field
      // 服务层 datadog在这里处理 `delete allData.status`，完成这一小步状态转换。
      delete allData.status
    }

    // Build ddtags with high-cardinality fields for filtering.
    // event:<name> is prepended so the event name is searchable via the
    // log search API — the `message` field (where eventName also lives)
    // is a DD reserved field and is NOT queryable from dashboard widget
    // queries or the aggregation API. See scripts/release/MONITORING.md.
    // allDataRecord保存`allData`，供后续判断或组装使用。
    const allDataRecord = allData
    // tags 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const tags = [
      `event:${eventName}`,
      ...TAG_FIELDS.filter(
        // field更新为 `>`，确保服务层后续读取最新状态。
        field =>
          allDataRecord[field] !== undefined && allDataRecord[field] !== null,
      // 这个回调绑定到 ).map(field => `${camelToSnakeCase(field)}:${allDataRecord[field]}`),，负责服务层 datadog在该局部场景下的响应。
      ).map(field => `${camelToSnakeCase(field)}:${allDataRecord[field]}`),
    ]

    // log 集中保存服务层 datadog要一起传递的字段。
    const log: DatadogLog = {
      ddsource: 'nodejs',
      ddtags: tags.join(','),
      message: eventName,
      service: 'claude-code',
      hostname: 'claude-code',
      env: process.env.USER_TYPE,
    }

    // Add all fields as searchable attributes (not duplicated in tags)
    // 循环处理 `const [key, value] of Object.entries(allData)`，让服务层 datadog把同类条目按顺序走完。
    for (const [key, value] of Object.entries(allData)) {
      // `value` 与 `undefined && value !== null` 不一致时刷新派生状态，避免使用过期结果。
      if (value !== undefined && value !== null) {
        // log[camelToSnakeCase(key)更新为 `value`，确保服务层 datadog后续读取最新状态。
        log[camelToSnakeCase(key)] = value
      }
    }

    // logBatch追加新条目，保持收集顺序与输入顺序一致。
    logBatch.push(log)

    // Flush immediately if batch is full, otherwise schedule
    // 满足 `logBatch.length >= MAX_BATCH_SIZE` 时，服务层 datadog执行该分支。
    if (logBatch.length >= MAX_BATCH_SIZE) {
      // 满足 `flushTimer` 时，服务层 datadog执行该分支。
      if (flushTimer) {
        // 调用 clearTimeout，触发服务层 datadog此处需要的副作用。
        clearTimeout(flushTimer)
        // flushTimer更新为 `null`，确保服务层后续读取最新状态。
        flushTimer = null
      }
      // 显式忽略 `flushLogs()` 的返回值，只保留它触发的副作用。
      void flushLogs()
    } else {
      // 调用 scheduleFlush，触发服务层 datadog此处需要的副作用。
      scheduleFlush()
    }
  } catch (error) {
    // 记录服务层 datadog运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

// NUM_USER_BUCKETS 集合保存`30`，供后续判断或组装使用。
const NUM_USER_BUCKETS = 30

/**
 * Gets a 'bucket' that the user ID falls into.
 *
 * For alerting purposes, we want to alert on the number of users impacted
 * by an issue, rather than the number of events- often a small number of users
 * can generate a large number of events (e.g. due to retries). To approximate
 * this without ruining cardinality by counting user IDs directly, we hash the user ID
 * and assign it to one of a fixed number of buckets.
 *
 * This allows us to estimate the number of unique users by counting unique buckets,
 * while preserving user privacy and reducing cardinality.
 */
// getUserBucket保存`memoize`，供服务层 datadog后续处理使用。
const getUserBucket = memoize((): number => {
  // userId读取`getOrCreateUserID`，供服务层 datadog后续处理使用。
  const userId = getOrCreateUserID()
  // hash构建`createHash`，供服务层 datadog后续处理使用。
  const hash = createHash('sha256').update(userId).digest('hex')
  // 返回 `parseInt(hash.slice(0, 8), 16) % NUM_USER_BUCKETS`，作为服务层 datadog这次计算的结果。
  return parseInt(hash.slice(0, 8), 16) % NUM_USER_BUCKETS
})

// getFlushIntervalMs 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFlushIntervalMs(): number {
  // Allow tests to override to not block on the default flush interval.
  // 返回 `(`，作为服务层 datadog这次计算的结果。
  return (
    parseInt(process.env.CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS || '', 10) ||
    DEFAULT_FLUSH_INTERVAL_MS
  )
}
