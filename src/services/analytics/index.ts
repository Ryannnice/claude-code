/**
 * Analytics service - public API for event logging
 *
 * This module serves as the main entry point for analytics events in Claude CLI.
 *
 * DESIGN: This module has NO dependencies to avoid import cycles.
 * Events are queued until attachAnalyticsSink() is called during app initialization.
 * The sink handles routing to Datadog and 1P event logging.
 */

/**
 * Marker type for verifying analytics metadata doesn't contain sensitive data
 *
 * This type forces explicit verification that string values being logged
 * don't contain code snippets, file paths, or other sensitive information.
 *
 * Usage: `myString as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`
 */
// AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS 固化服务层 index里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS = never

/**
 * Marker type for values routed to PII-tagged proto columns via `_PROTO_*`
 * payload keys. The destination BQ column has privileged access controls,
 * so unredacted values are acceptable — unlike general-access backends.
 *
 * sink.ts strips `_PROTO_*` keys before Datadog fanout; only the 1P
 * exporter (firstPartyEventLoggingExporter) sees them and hoists them to the
 * top-level proto field. A single stripProtoFields call guards all non-1P
 * sinks — no per-sink filtering to forget.
 *
 * Usage: `rawName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED`
 */
// AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED 固化服务层 index里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED = never

/**
 * Strip `_PROTO_*` keys from a payload destined for general-access storage.
 * Used by:
 *   - sink.ts: before Datadog fanout (never sees PII-tagged values)
 *   - firstPartyEventLoggingExporter: defensive strip of additional_metadata
 *     after hoisting known _PROTO_* keys to proto fields — prevents a future
 *     unrecognized _PROTO_foo from silently landing in the BQ JSON blob.
 *
 * Returns the input unchanged (same reference) when no _PROTO_ keys present.
 */
// stripProtoFields 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripProtoFields<V>(
  metadata: Record<string, V>,
): Record<string, V> {
  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let result: Record<string, V> | undefined
  // 循环处理 `const key in metadata`，让服务层 index逐项把同类条目按顺序走完。
  for (const key in metadata) {
    // 满足 `key.startsWith('_PROTO_')` 时，服务层 index执行该分支。
    if (key.startsWith('_PROTO_')) {
      // 满足 `result === undefined` 时，服务层 index执行该分支。
      if (result === undefined) {
        // 结果更新为 `{ ...metadata }`，确保服务层后续读取最新状态。
        result = { ...metadata }
      }
      // 服务层 index在这里处理 `delete result[key]`，完成这一小步状态转换。
      delete result[key]
    }
  }
  // 返回 `result ?? metadata`，作为服务层 index这次计算的结果。
  return result ?? metadata
}

// Internal type for logEvent metadata - different from the enriched EventMetadata in metadata.ts
// LogEventMetadata 固化服务层 index里传递的数据形状，帮助调用方按同一结构读写字段。
type LogEventMetadata = { [key: string]: boolean | number | undefined }

// QueuedEvent 固化服务层 index里传递的数据形状，帮助调用方按同一结构读写字段。
type QueuedEvent = {
  eventName: string
  metadata: LogEventMetadata
  async: boolean
}

/**
 * Sink interface for the analytics backend
 */
// AnalyticsSink 固化服务层 index里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnalyticsSink = {
  // 这个回调绑定到 logEvent: (eventName: string, metadata: LogEventMetadata) => void，负责服务层 index在该局部场景下的响应。
  logEvent: (eventName: string, metadata: LogEventMetadata) => void
  // 服务层 index在这里处理 `logEventAsync: (`，完成这一小步状态转换。
  logEventAsync: (
    eventName: string,
    metadata: LogEventMetadata,
  ) => Promise<void>
}

// Event queue for events logged before sink is attached
// eventQueue 从空数组开始收集，后续循环会按处理顺序追加条目。
const eventQueue: QueuedEvent[] = []

// Sink - initialized during app startup
// sink初始化为空值，后续分支会在有数据时补齐。
let sink: AnalyticsSink | null = null

/**
 * Attach the analytics sink that will receive all events.
 * Queued events are drained asynchronously via queueMicrotask to avoid
 * adding latency to the startup path.
 *
 * Idempotent: if a sink is already attached, this is a no-op. This allows
 * calling from both the preAction hook (for subcommands) and setup() (for
 * the default command) without coordination.
 */
// attachAnalyticsSink 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function attachAnalyticsSink(newSink: AnalyticsSink): void {
  // `sink` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (sink !== null) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // sink更新为 `newSink`，确保服务层后续读取最新状态。
  sink = newSink

  // Drain the queue asynchronously to avoid blocking startup
  // 满足 `eventQueue.length > 0` 时，服务层 index执行该分支。
  if (eventQueue.length > 0) {
    // queuedEvents 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const queuedEvents = [...eventQueue]
    // eventQueue被清空，服务层从干净状态继续。
    eventQueue.length = 0

    // Log queue size for ants to help debug analytics initialization timing
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 index执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      sink.logEvent('analytics_sink_attached', {
        queued_event_count: queuedEvents.length,
      })
    }

    // 调用 queueMicrotask，触发服务层 index此处需要的副作用。
    queueMicrotask(() => {
      // 按顺序遍历 `queuedEvents` 中的event，逐个交给服务层 index处理。
      for (const event of queuedEvents) {
        // 满足 `event.async` 时，服务层 index执行该分支。
        if (event.async) {
          // 显式忽略 `sink!.logEventAsync(event.eventName, event.metadata)` 的返回值，只保留它触发的副作用。
          void sink!.logEventAsync(event.eventName, event.metadata)
        } else {
          // 服务层 index在这里处理 `sink!.logEvent(event.eventName, event.metadata)`，完成这一小步状态转换。
          sink!.logEvent(event.eventName, event.metadata)
        }
      }
    })
  }
}

/**
 * Log an event to analytics backends (synchronous)
 *
 * Events may be sampled based on the 'tengu_event_sampling_config' dynamic config.
 * When sampled, the sample_rate is added to the event metadata.
 *
 * If no sink is attached, events are queued and drained when the sink attaches.
 */
// logEvent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logEvent(
  eventName: string,
  // intentionally no strings unless AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  // to avoid accidentally logging code/filepaths
  metadata: LogEventMetadata,
): void {
  // 满足 `sink === null` 时，服务层 index执行该分支。
  if (sink === null) {
    // eventQueue追加新条目，保持收集顺序与输入顺序一致。
    eventQueue.push({ eventName, metadata, async: false })
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
  sink.logEvent(eventName, metadata)
}

/**
 * Log an event to analytics backends (asynchronous)
 *
 * Events may be sampled based on the 'tengu_event_sampling_config' dynamic config.
 * When sampled, the sample_rate is added to the event metadata.
 *
 * If no sink is attached, events are queued and drained when the sink attaches.
 */
// logEventAsync 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function logEventAsync(
  eventName: string,
  // intentionally no strings, to avoid accidentally logging code/filepaths
  metadata: LogEventMetadata,
): Promise<void> {
  // 满足 `sink === null` 时，服务层 index执行该分支。
  if (sink === null) {
    // eventQueue追加新条目，保持收集顺序与输入顺序一致。
    eventQueue.push({ eventName, metadata, async: true })
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 等待 `sink.logEventAsync(eventName, metadata)` 完成，再继续服务层 index的异步流程。
  await sink.logEventAsync(eventName, metadata)
}

/**
 * Reset analytics state for testing purposes only.
 * @internal
 */
// _resetForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetForTesting(): void {
  // sink更新为 `null`，确保服务层后续读取最新状态。
  sink = null
  // eventQueue被清空，服务层从干净状态继续。
  eventQueue.length = 0
}
