/**
 * Analytics sink implementation
 *
 * This module contains the actual analytics routing logic and should be
 * initialized during app startup. It routes events to Datadog and 1P event
 * logging.
 *
 * Usage: Call initializeAnalyticsSink() during app startup to attach the sink.
 */

// 引入 trackDatadogEvent，将 ./datadog.js 中已经封装好的能力接到本文件流程里。
import { trackDatadogEvent } from './datadog.js'
// 引入 logEventTo1P、shouldSampleEvent，将 ./firstPartyEventLogger.js 中已经封装好的能力接到本文件流程里。
import { logEventTo1P, shouldSampleEvent } from './firstPartyEventLogger.js'
// 引入 checkStatsigFeatureGate_CACHED_MAY_BE_STALE，将 ./growthbook.js 中已经封装好的能力接到本文件流程里。
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from './growthbook.js'
// 引入 attachAnalyticsSink、stripProtoFields，将 ./index.js 中已经封装好的能力接到本文件流程里。
import { attachAnalyticsSink, stripProtoFields } from './index.js'
// 引入 isSinkKilled，将 ./sinkKillswitch.js 中已经封装好的能力接到本文件流程里。
import { isSinkKilled } from './sinkKillswitch.js'

// Local type matching the logEvent metadata signature
// LogEventMetadata 固化服务层 sink里传递的数据形状，帮助调用方按同一结构读写字段。
type LogEventMetadata = { [key: string]: boolean | number | undefined }

// DATADOG_GATE_NAME保存`'tengu_log_datadog_events'`，作为后续固定文本处理的输入。
const DATADOG_GATE_NAME = 'tengu_log_datadog_events'

// Module-level gate state - starts undefined, initialized during startup
// isDatadogGateEnabled标记服务层 sink是否启用对应路径。
let isDatadogGateEnabled: boolean | undefined = undefined

/**
 * Check if Datadog tracking is enabled.
 * Falls back to cached value from previous session if not yet initialized.
 */
// shouldTrackDatadog 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldTrackDatadog(): boolean {
  // 满足 `isSinkKilled('datadog')` 时，服务层 sink执行该分支。
  if (isSinkKilled('datadog')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // `isDatadogGateEnabled` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (isDatadogGateEnabled !== undefined) {
    // 返回 `isDatadogGateEnabled`，作为服务层 sink这次计算的结果。
    return isDatadogGateEnabled
  }

  // Fallback to cached value from previous session
  // 保护这一段可能失败的服务层 sink操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `checkStatsigFeatureGate_CACHED_MAY_BE_STALE(DATADOG_GATE_NAME)`，作为服务层 sink这次计算的结果。
    return checkStatsigFeatureGate_CACHED_MAY_BE_STALE(DATADOG_GATE_NAME)
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Log an event (synchronous implementation)
 */
// logEventImpl 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logEventImpl(eventName: string, metadata: LogEventMetadata): void {
  // Check if this event should be sampled
  // sampleResult保存`shouldSampleEvent`，供服务层 sink后续处理使用。
  const sampleResult = shouldSampleEvent(eventName)

  // If sample result is 0, the event was not selected for logging
  // 满足 `sampleResult === 0` 时，服务层 sink执行该分支。
  if (sampleResult === 0) {
    // 服务层 sink在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // If sample result is a positive number, add it to metadata
  // metadataWithSampleRate 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const metadataWithSampleRate =
    sampleResult !== null
      ? { ...metadata, sample_rate: sampleResult }
      : metadata

  // 满足 `shouldTrackDatadog()` 时，服务层 sink执行该分支。
  if (shouldTrackDatadog()) {
    // Datadog is a general-access backend — strip _PROTO_* keys
    // (unredacted PII-tagged values meant only for the 1P privileged column).
    // 显式忽略 `trackDatadogEvent(eventName, stripProtoFields(metadataWithSampl...` 的返回值，只保留它触发的副作用。
    void trackDatadogEvent(eventName, stripProtoFields(metadataWithSampleRate))
  }

  // 1P receives the full payload including _PROTO_* — the exporter
  // destructures and routes those keys to proto fields itself.
  // 记录服务层 sink运行诊断，方便排查异常路径或性能问题。
  logEventTo1P(eventName, metadataWithSampleRate)
}

/**
 * Log an event (asynchronous implementation)
 *
 * With Segment removed the two remaining sinks are fire-and-forget, so this
 * just wraps the sync impl — kept to preserve the sink interface contract.
 */
// logEventAsyncImpl 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logEventAsyncImpl(
  eventName: string,
  metadata: LogEventMetadata,
): Promise<void> {
  // 记录服务层 sink运行诊断，方便排查异常路径或性能问题。
  logEventImpl(eventName, metadata)
  // 返回 `Promise.resolve()`，作为服务层 sink这次计算的结果。
  return Promise.resolve()
}

/**
 * Initialize analytics gates during startup.
 *
 * Updates gate values from server. Early events use cached values from previous
 * session to avoid data loss during initialization.
 *
 * Called from main.tsx during setupBackend().
 */
// initializeAnalyticsGates 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeAnalyticsGates(): void {
  // 服务层 sink在这里处理 `isDatadogGateEnabled =`，完成这一小步状态转换。
  isDatadogGateEnabled =
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE(DATADOG_GATE_NAME)
}

/**
 * Initialize the analytics sink.
 *
 * Call this during app startup to attach the analytics backend.
 * Any events logged before this is called will be queued and drained.
 *
 * Idempotent: safe to call multiple times (subsequent calls are no-ops).
 */
// initializeAnalyticsSink 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeAnalyticsSink(): void {
  // 调用 attachAnalyticsSink，触发服务层 sink此处需要的副作用。
  attachAnalyticsSink({
    logEvent: logEventImpl,
    logEventAsync: logEventAsyncImpl,
  })
}
