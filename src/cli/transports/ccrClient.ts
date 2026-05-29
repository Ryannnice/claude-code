// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 整理这一组导入，让ccr Client后续逻辑可以直接复用这些外部能力。
import type {
  SDKPartialAssistantMessage,
  StdoutMessage,
} from 'src/entrypoints/sdk/controlTypes.js'
// 引入 decodeJwtExpiry，将 ../../bridge/jwtUtils.js 中已经封装好的能力接到本文件流程里。
import { decodeJwtExpiry } from '../../bridge/jwtUtils.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../../utils/diagLogs.js'
// 复用 errorMessage、getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage, getErrnoCode } from '../../utils/errors.js'
// 复用 createAxiosInstance 工具函数，把通用处理留在 ../../utils/proxy.js 中维护。
import { createAxiosInstance } from '../../utils/proxy.js'
// 整理这一组导入，让ccr Client后续逻辑可以直接复用这些外部能力。
import {
  registerSessionActivityCallback,
  unregisterSessionActivityCallback,
} from '../../utils/sessionActivity.js'
// 整理这一组导入，让ccr Client后续逻辑可以直接复用这些外部能力。
import {
  getSessionIngressAuthHeaders,
  getSessionIngressAuthToken,
} from '../../utils/sessionIngressAuth.js'
// 整理这一组导入，让ccr Client后续逻辑可以直接复用这些外部能力。
import type {
  RequiresActionDetails,
  SessionState,
} from '../../utils/sessionState.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'
// 整理这一组导入，让ccr Client后续逻辑可以直接复用这些外部能力。
import {
  RetryableError,
  SerialBatchEventUploader,
} from './SerialBatchEventUploader.js'
// 类型依赖 { SSETransport, StreamClientEvent } 来自 ./SSETransport.js，用于校准ccr Client的数据契约。
import type { SSETransport, StreamClientEvent } from './SSETransport.js'
// 引入 WorkerStateUploader，将 ./WorkerStateUploader.js 中已经封装好的能力接到本文件流程里。
import { WorkerStateUploader } from './WorkerStateUploader.js'

/** Default interval between heartbeat events (20s; server TTL is 60s). */
// DEFAULT_HEARTBEAT_INTERVAL_MS 集合 命名 `20_000`，让后续代码直接表达这个值的用途。
const DEFAULT_HEARTBEAT_INTERVAL_MS = 20_000

/**
 * stream_event messages accumulate in a delay buffer for up to this many ms
 * before enqueue. Mirrors HybridTransport's batching window. text_delta
 * events for the same content block accumulate into a single full-so-far
 * snapshot per flush — each emitted event is self-contained so a client
 * connecting mid-stream sees complete text, not a fragment.
 */
// STREAM_EVENT_FLUSH_INTERVAL_MS 集合保存`100`，供后续判断或组装使用。
const STREAM_EVENT_FLUSH_INTERVAL_MS = 100

/** Hoisted axios validateStatus callback to avoid per-request closure allocation. */
// alwaysValidStatus 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function alwaysValidStatus(): boolean {
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// CCRInitFailReason 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
export type CCRInitFailReason =
  | 'no_auth_headers'
  | 'missing_epoch'
  | 'worker_register_failed'

/** Thrown by initialize(); carries a typed reason for the diag classifier. */
// CCRInitError 聚合ccr Client相关状态与操作，把同一职责的行为收束到类实例中。
export class CCRInitError extends Error {
  // 构造函数接收 readonly reason: CCRInitFailReason，把外部输入整理成实例可复用的内部状态。
  constructor(readonly reason: CCRInitFailReason) {
    // 调用 super，触发ccr Client此处需要的副作用。
    super(`CCRClient init failed: ${reason}`)
  }
}

/**
 * Consecutive 401/403 with a VALID-LOOKING token before giving up. An
 * expired JWT short-circuits this (exits immediately — deterministic,
 * retry is futile). This threshold is for the uncertain case: token's
 * exp is in the future but server says 401 (userauth down, KMS hiccup,
 * clock skew). 10 × 20s heartbeat ≈ 200s to ride it out.
 */
// MAX_CONSECUTIVE_AUTH_FAILURES 集合保存`10`，供ccr Client后续判断或输出使用。
const MAX_CONSECUTIVE_AUTH_FAILURES = 10

// EventPayload 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
type EventPayload = {
  uuid: string
  type: string
  [key: string]: unknown
}

// ClientEvent 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
type ClientEvent = {
  payload: EventPayload
  ephemeral?: boolean
}

/**
 * Structural subset of a stream_event carrying a text_delta. Not a narrowing
 * of SDKPartialAssistantMessage — RawMessageStreamEvent's delta is a union and
 * narrowing through two levels defeats the discriminant.
 */
// CoalescedStreamEvent 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
type CoalescedStreamEvent = {
  type: 'stream_event'
  uuid: string
  session_id: string
  parent_tool_use_id: string | null
  event: {
    type: 'content_block_delta'
    index: number
    delta: { type: 'text_delta'; text: string }
  }
}

/**
 * Accumulator state for text_delta coalescing. Keyed by API message ID so
 * lifetime is tied to the assistant message — cleared when the complete
 * SDKAssistantMessage arrives (writeEvent), which is reliable even when
 * abort/error paths skip content_block_stop/message_stop delivery.
 */
// StreamAccumulatorState 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
export type StreamAccumulatorState = {
  /** API message ID (msg_...) → blocks[blockIndex] → chunk array. */
  byMessage: Map<string, string[][]>
  /**
   * {session_id}:{parent_tool_use_id} → active message ID.
   * content_block_delta events don't carry the message ID (only
   * message_start does), so we track which message is currently streaming
   * for each scope. At most one message streams per scope at a time.
   */
  scopeToMessage: Map<string, string>
}

// createStreamAccumulator 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createStreamAccumulator(): StreamAccumulatorState {
  // 返回结构化结果，集中表达ccr Client已经整理出的状态。
  return { byMessage: new Map(), scopeToMessage: new Map() }
}

// scopeKey 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scopeKey(m: {
  session_id: string
  parent_tool_use_id: string | null
}): string {
  // 返回 ``${m.session_id}:${m.parent_tool_use_id ?? ''}``，作为ccr Client这次计算的结果。
  return `${m.session_id}:${m.parent_tool_use_id ?? ''}`
}

/**
 * Accumulate text_delta stream_events into full-so-far snapshots per content
 * block. Each flush emits ONE event per touched block containing the FULL
 * accumulated text from the start of the block — a client connecting
 * mid-stream receives a self-contained snapshot, not a fragment.
 *
 * Non-text-delta events pass through unchanged. message_start records the
 * active message ID for the scope; content_block_delta appends chunks;
 * the snapshot event reuses the first text_delta UUID seen for that block in
 * this flush so server-side idempotency remains stable across retries.
 *
 * Cleanup happens in writeEvent when the complete assistant message arrives
 * (reliable), not here on stop events (abort/error paths skip those).
 */
// accumulateStreamEvents 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function accumulateStreamEvents(
  buffer: SDKPartialAssistantMessage[],
  state: StreamAccumulatorState,
): EventPayload[] {
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: EventPayload[] = []
  // chunks[] → snapshot already in `out` this flush. Keyed by the chunks
  // array reference (stable per {messageId, index}) so subsequent deltas
  // rewrite the same entry instead of emitting one event per delta.
  // touched 命名 `new Map<string[], CoalescedStreamEvent>()`，让后续代码直接表达这个值的用途。
  const touched = new Map<string[], CoalescedStreamEvent>()
  // 按顺序遍历 `buffer` 中的消息，逐个交给ccr Client处理。
  for (const msg of buffer) {
    // 按照 msg.event.type 的取值选择ccr Client的具体处理分支。
    switch (msg.event.type) {
      case 'message_start': {
        // 标识符保存`msg.event.message.id`，供ccr Client后续判断或输出使用。
        const id = msg.event.message.id
        // prevId读取`scopeToMessage.get`，供ccr Client后续处理使用。
        const prevId = state.scopeToMessage.get(scopeKey(msg))
        // 满足 `prevId) state.byMessage.delete(prevId` 时，ccr Client执行该分支。
        if (prevId) state.byMessage.delete(prevId)
        // state.scopeToMessage.set 写入新的状态值，使ccr Client后续读取保持一致。
        state.scopeToMessage.set(scopeKey(msg), id)
        // state.byMessage.set 写入新的状态值，使ccr Client后续读取保持一致。
        state.byMessage.set(id, [])
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(msg)
        // 结束这个分支或循环，避免ccr Client继续落入后续路径。
        break
      }
      case 'content_block_delta': {
        // `msg.event.delta.type` 与 `'text_delta'` 不一致时刷新派生状态，避免使用过期结果。
        if (msg.event.delta.type !== 'text_delta') {
          // out追加新条目，保持收集顺序与输入顺序一致。
          out.push(msg)
          // 结束这个分支或循环，避免ccr Client继续落入后续路径。
          break
        }
        // messageId 消息数据读取`scopeToMessage.get`，供ccr Client后续处理使用。
        const messageId = state.scopeToMessage.get(scopeKey(msg))
        // blocks 集合读取`byMessage.get`，供ccr Client后续处理使用。
        const blocks = messageId ? state.byMessage.get(messageId) : undefined
        // blocks 集合缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
        if (!blocks) {
          // Delta without a preceding message_start (reconnect mid-stream,
          // or message_start was in a prior buffer that got dropped). Pass
          // through raw — can't produce a full-so-far snapshot without the
          // prior chunks anyway.
          // out追加新条目，保持收集顺序与输入顺序一致。
          out.push(msg)
          // 结束这个分支或循环，避免ccr Client继续落入后续路径。
          break
        }
        // 输入块 命名 `(blocks[msg.event.index] ??= [])`，让后续代码直接表达这个值的用途。
        const chunks = (blocks[msg.event.index] ??= [])
        // 输入块追加新条目，保持收集顺序与输入顺序一致。
        chunks.push(msg.event.delta.text)
        // existing读取`touched.get`，供ccr Client后续处理使用。
        const existing = touched.get(chunks)
        // 满足 `existing` 时，ccr Client执行该分支。
        if (existing) {
          // 文本更新为 `chunks.join('')`，确保CLI后续读取最新状态。
          existing.event.delta.text = chunks.join('')
          // 结束这个分支或循环，避免ccr Client继续落入后续路径。
          break
        }
        // snapshot 集中保存ccr Client要一起传递的字段。
        const snapshot: CoalescedStreamEvent = {
          type: 'stream_event',
          uuid: msg.uuid,
          session_id: msg.session_id,
          parent_tool_use_id: msg.parent_tool_use_id,
          event: {
            type: 'content_block_delta',
            index: msg.event.index,
            delta: { type: 'text_delta', text: chunks.join('') },
          },
        }
        // touched.set 写入新的状态值，使ccr Client后续读取保持一致。
        touched.set(chunks, snapshot)
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(snapshot)
        // 结束这个分支或循环，避免ccr Client继续落入后续路径。
        break
      }
      default:
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push(msg)
    }
  }
  // 返回 `out`，作为ccr Client这次计算的结果。
  return out
}

/**
 * Clear accumulator entries for a completed assistant message. Called from
 * writeEvent when the SDKAssistantMessage arrives — the reliable end-of-stream
 * signal that fires even when abort/interrupt/error skip SSE stop events.
 */
// clearStreamAccumulatorForMessage 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearStreamAccumulatorForMessage(
  state: StreamAccumulatorState,
  assistant: {
    session_id: string
    parent_tool_use_id: string | null
    message: { id: string }
  },
): void {
  // 调用 state.byMessage.delete，触发ccr Client此处需要的副作用。
  state.byMessage.delete(assistant.message.id)
  // scope保存`scopeKey`，供ccr Client后续处理使用。
  const scope = scopeKey(assistant)
  // 满足 `state.scopeToMessage.get(scope) === assistant.message.id` 时，ccr Client执行该分支。
  if (state.scopeToMessage.get(scope) === assistant.message.id) {
    // 调用 state.scopeToMessage.delete，触发ccr Client此处需要的副作用。
    state.scopeToMessage.delete(scope)
  }
}

// RequestResult 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
type RequestResult = { ok: true } | { ok: false; retryAfterMs?: number }

// WorkerEvent 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
type WorkerEvent = {
  payload: EventPayload
  is_compaction?: boolean
  agent_id?: string
}

// InternalEvent 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
export type InternalEvent = {
  event_id: string
  event_type: string
  payload: Record<string, unknown>
  event_metadata?: Record<string, unknown> | null
  is_compaction: boolean
  created_at: string
  agent_id?: string
}

// ListInternalEventsResponse 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
type ListInternalEventsResponse = {
  data: InternalEvent[]
  next_cursor?: string
}

// WorkerStateResponse 固化ccr Client里传递的数据形状，帮助调用方按同一结构读写字段。
type WorkerStateResponse = {
  worker?: {
    external_metadata?: Record<string, unknown>
  }
}

/**
 * Manages the worker lifecycle protocol with CCR v2:
 * - Epoch management: reads worker_epoch from CLAUDE_CODE_WORKER_EPOCH env var
 * - Runtime state reporting: PUT /sessions/{id}/worker
 * - Heartbeat: POST /sessions/{id}/worker/heartbeat for liveness detection
 *
 * All writes go through this.request().
 */
// CCRClient 聚合ccr Client相关状态与操作，把同一职责的行为收束到类实例中。
export class CCRClient {
  private workerEpoch = 0
  private readonly heartbeatIntervalMs: number
  private readonly heartbeatJitterFraction: number
  private heartbeatTimer: NodeJS.Timeout | null = null
  private heartbeatInFlight = false
  private closed = false
  private consecutiveAuthFailures = 0
  private currentState: SessionState | null = null
  private readonly sessionBaseUrl: string
  private readonly sessionId: string
  private readonly http = createAxiosInstance({ keepAlive: true })

  // stream_event delay buffer — accumulates content deltas for up to
  // STREAM_EVENT_FLUSH_INTERVAL_MS before enqueueing (reduces POST count
  // and enables text_delta coalescing). Mirrors HybridTransport's pattern.
  private streamEventBuffer: SDKPartialAssistantMessage[] = []
  private streamEventTimer: ReturnType<typeof setTimeout> | null = null
  // Full-so-far text accumulator. Persists across flushes so each emitted
  // text_delta event carries the complete text from the start of the block —
  // mid-stream reconnects see a self-contained snapshot. Keyed by API message
  // ID; cleared in writeEvent when the complete assistant message arrives.
  private streamTextAccumulator = createStreamAccumulator()

  private readonly workerState: WorkerStateUploader
  private readonly eventUploader: SerialBatchEventUploader<ClientEvent>
  private readonly internalEventUploader: SerialBatchEventUploader<WorkerEvent>
  private readonly deliveryUploader: SerialBatchEventUploader<{
    eventId: string
    status: 'received' | 'processing' | 'processed'
  }>

  /**
   * Called when the server returns 409 (a newer worker epoch superseded ours).
   * Default: process.exit(1) — correct for spawn-mode children where the
   * parent bridge re-spawns. In-process callers (replBridge) MUST override
   * this to close gracefully instead; exit would kill the user's REPL.
   */
  // 这个回调绑定到 private readonly onEpochMismatch: () => never，负责ccr Client在该局部场景下的响应。
  private readonly onEpochMismatch: () => never

  /**
   * Auth header source. Defaults to the process-wide session-ingress token
   * (CLAUDE_CODE_SESSION_ACCESS_TOKEN env var). Callers managing multiple
   * concurrent sessions with distinct JWTs MUST inject this — the env-var
   * path is a process global and would stomp across sessions.
   */
  // 这个回调绑定到 private readonly getAuthHeaders: () => Record<string, string>，负责ccr Client在该局部场景下的响应。
  private readonly getAuthHeaders: () => Record<string, string>

  // 构造函数初始化实例状态，确保ccr Client后续方法读取到完整配置。
  constructor(
    transport: SSETransport,
    sessionUrl: URL,
    opts?: {
      // 这个回调绑定到 onEpochMismatch?: () => never，负责ccr Client在该局部场景下的响应。
      onEpochMismatch?: () => never
      heartbeatIntervalMs?: number
      heartbeatJitterFraction?: number
      /**
       * Per-instance auth header source. Omit to read the process-wide
       * CLAUDE_CODE_SESSION_ACCESS_TOKEN (single-session callers — REPL,
       * daemon). Required for concurrent multi-session callers.
       */
      // 这个回调绑定到 getAuthHeaders?: () => Record<string, string>，负责ccr Client在该局部场景下的响应。
      getAuthHeaders?: () => Record<string, string>
    },
  ) {
    // ccr Client在这里处理 `this.onEpochMismatch =`，完成这一小步状态转换。
    this.onEpochMismatch =
      opts?.onEpochMismatch ??
      // 这个回调绑定到 (() => {，负责ccr Client在该局部场景下的响应。
      (() => {
        // eslint-disable-next-line custom-rules/no-process-exit
        // 调用 process.exit，触发ccr Client此处需要的副作用。
        process.exit(1)
      })
    // ccr Client在这里处理 `this.heartbeatIntervalMs =`，完成这一小步状态转换。
    this.heartbeatIntervalMs =
      opts?.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS
    // 更新实例字段 heartbeatJitterFraction 为 opts?.heartbeatJitterFraction ?? 0，同步ccr Client的内部状态。
    this.heartbeatJitterFraction = opts?.heartbeatJitterFraction ?? 0
    // 更新实例字段 getAuthHeaders 为 opts?.getAuthHeaders ?? getSessionIngressAuthHeaders，同步ccr Client的内部状态。
    this.getAuthHeaders = opts?.getAuthHeaders ?? getSessionIngressAuthHeaders
    // Session URL: https://host/v1/code/sessions/{id}
    // `sessionUrl.protocol` 与 `'http:' && sessionUrl.pro` 不一致时刷新派生状态，避免使用过期结果。
    if (sessionUrl.protocol !== 'http:' && sessionUrl.protocol !== 'https:') {
      // 抛出 new Error(，阻止ccr Client在无效状态下继续运行。
      throw new Error(
        `CCRClient: Expected http(s) URL, got ${sessionUrl.protocol}`,
      )
    }
    // pathname 路径数据格式化`pathname.replace`，供ccr Client后续处理使用。
    const pathname = sessionUrl.pathname.replace(/\/$/, '')
    // 更新实例字段 sessionBaseUrl 为 `${sessionUrl.protocol}//${sessionUrl.host}${pathname}`，同步ccr Client的内部状态。
    this.sessionBaseUrl = `${sessionUrl.protocol}//${sessionUrl.host}${pathname}`
    // Extract session ID from the URL path (last segment)
    // 更新实例字段 sessionId 为 pathname.split('/').pop() || ''，同步ccr Client的内部状态。
    this.sessionId = pathname.split('/').pop() || ''

    // 更新实例字段 workerState 为 new WorkerStateUploader({，同步ccr Client的内部状态。
    this.workerState = new WorkerStateUploader({
      // 这个回调绑定到 send: body =>，负责ccr Client在该局部场景下的响应。
      send: body =>
        this.request(
          'put',
          '/worker',
          { worker_epoch: this.workerEpoch, ...body },
          'PUT worker',
        // 这个回调绑定到 ).then(r => r.ok),，负责ccr Client在该局部场景下的响应。
        ).then(r => r.ok),
      baseDelayMs: 500,
      maxDelayMs: 30_000,
      jitterMs: 500,
    })

    // 更新实例字段 eventUploader 为 new SerialBatchEventUploader<ClientEvent>({，同步ccr Client的内部状态。
    this.eventUploader = new SerialBatchEventUploader<ClientEvent>({
      maxBatchSize: 100,
      maxBatchBytes: 10 * 1024 * 1024,
      // flushStreamEventBuffer() enqueues a full 100ms window of accumulated
      // stream_events in one call. A burst of mixed delta types that don't
      // fold into a single snapshot could exceed the old cap (50) and deadlock
      // on the SerialBatchEventUploader backpressure check. Match
      // HybridTransport's bound — high enough to be memory-only.
      maxQueueSize: 100_000,
      // 这个回调绑定到 send: async batch => {，负责ccr Client在该局部场景下的响应。
      send: async batch => {
        // 结果保存`this.request`，供ccr Client后续处理使用。
        const result = await this.request(
          'post',
          '/worker/events',
          { worker_epoch: this.workerEpoch, events: batch },
          'client events',
        )
        // result.ok缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
        if (!result.ok) {
          // 抛出 new RetryableError(，阻止ccr Client在无效状态下继续运行。
          throw new RetryableError(
            'client event POST failed',
            result.retryAfterMs,
          )
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30_000,
      jitterMs: 500,
    })

    // 更新实例字段 internalEventUploader 为 new SerialBatchEventUploader<WorkerEvent>({，同步ccr Client的内部状态。
    this.internalEventUploader = new SerialBatchEventUploader<WorkerEvent>({
      maxBatchSize: 100,
      maxBatchBytes: 10 * 1024 * 1024,
      maxQueueSize: 200,
      // 这个回调绑定到 send: async batch => {，负责ccr Client在该局部场景下的响应。
      send: async batch => {
        // 结果保存`this.request`，供ccr Client后续处理使用。
        const result = await this.request(
          'post',
          '/worker/internal-events',
          { worker_epoch: this.workerEpoch, events: batch },
          'internal events',
        )
        // result.ok缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
        if (!result.ok) {
          // 抛出 new RetryableError(，阻止ccr Client在无效状态下继续运行。
          throw new RetryableError(
            'internal event POST failed',
            result.retryAfterMs,
          )
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30_000,
      jitterMs: 500,
    })

    // 更新实例字段 deliveryUploader 为 new SerialBatchEventUploader<{，同步ccr Client的内部状态。
    this.deliveryUploader = new SerialBatchEventUploader<{
      eventId: string
      status: 'received' | 'processing' | 'processed'
    }>({
      maxBatchSize: 64,
      maxQueueSize: 64,
      // 这个回调绑定到 send: async batch => {，负责ccr Client在该局部场景下的响应。
      send: async batch => {
        // 结果保存`this.request`，供ccr Client后续处理使用。
        const result = await this.request(
          'post',
          '/worker/events/delivery',
          {
            worker_epoch: this.workerEpoch,
            // 这个回调绑定到 updates: batch.map(d => ({，负责ccr Client在该局部场景下的响应。
            updates: batch.map(d => ({
              event_id: d.eventId,
              status: d.status,
            })),
          },
          'delivery batch',
        )
        // result.ok缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
        if (!result.ok) {
          // 抛出 new RetryableError('delivery POST failed', result.retryAfterMs)，阻止ccr Client在无效状态下继续运行。
          throw new RetryableError('delivery POST failed', result.retryAfterMs)
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30_000,
      jitterMs: 500,
    })

    // Ack each received client_event so CCR can track delivery status.
    // Wired here (not in initialize()) so the callback is registered the
    // moment new CCRClient() returns — remoteIO must be free to call
    // transport.connect() immediately after without racing the first
    // SSE catch-up frame against an unwired onEventCallback.
    // transport.setOnEvent 写入新的状态值，使ccr Client后续读取保持一致。
    transport.setOnEvent((event: StreamClientEvent) => {
      // 调用 this.reportDelivery，触发ccr Client此处需要的副作用。
      this.reportDelivery(event.event_id, 'received')
    })
  }

  /**
   * Initialize the session worker:
   * 1. Take worker_epoch from the argument, or fall back to
   *    CLAUDE_CODE_WORKER_EPOCH (set by env-manager / bridge spawner)
   * 2. Report state as 'idle'
   * 3. Start heartbeat timer
   *
   * In-process callers (replBridge) pass the epoch directly — they
   * registered the worker themselves and there is no parent process
   * setting env vars.
   */
  // initialize 使用 epoch?: number 完成ccr Client里的对应操作。
  async initialize(epoch?: number): Promise<Record<string, unknown> | null> {
    // startMs 集合记录时间`Date.now`，供ccr Client后续处理使用。
    const startMs = Date.now()
    // Object.keys(this.getAuthHeaders...为空时立即返回或跳过，避免ccr Client把空集合当成可处理内容。
    if (Object.keys(this.getAuthHeaders()).length === 0) {
      // 抛出 new CCRInitError('no_auth_headers')，阻止ccr Client在无效状态下继续运行。
      throw new CCRInitError('no_auth_headers')
    }
    // 满足 `epoch === undefined` 时，ccr Client执行该分支。
    if (epoch === undefined) {
      // rawEpoch 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const rawEpoch = process.env.CLAUDE_CODE_WORKER_EPOCH
      // epoch更新为 `rawEpoch ? parseInt(rawEpoch, 10) : NaN`，确保CLI后续读取最新状态。
      epoch = rawEpoch ? parseInt(rawEpoch, 10) : NaN
    }
    // 满足 `isNaN(epoch)` 时，ccr Client执行该分支。
    if (isNaN(epoch)) {
      // 抛出 new CCRInitError('missing_epoch')，阻止ccr Client在无效状态下继续运行。
      throw new CCRInitError('missing_epoch')
    }
    // 更新实例字段 workerEpoch 为 epoch，同步ccr Client的内部状态。
    this.workerEpoch = epoch

    // Concurrent with the init PUT — neither depends on the other.
    // restoredPromise 异步任务保存 `this.getWorkerState` 启动的异步任务，稍后再决定等待还是后台完成。
    const restoredPromise = this.getWorkerState()

    // 结果保存`this.request`，供ccr Client后续处理使用。
    const result = await this.request(
      'put',
      '/worker',
      {
        worker_status: 'idle',
        worker_epoch: this.workerEpoch,
        // Clear stale pending_action/task_summary left by a prior
        // worker crash — the in-session clears don't survive process restart.
        external_metadata: {
          pending_action: null,
          task_summary: null,
        },
      },
      'PUT worker (init)',
    )
    // result.ok缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
    if (!result.ok) {
      // 409 → onEpochMismatch may throw, but request() catches it and returns
      // false. Without this check we'd continue to startHeartbeat(), leaking a
      // 20s timer against a dead epoch. Throw so connect()'s rejection handler
      // fires instead of the success path.
      // 抛出 new CCRInitError('worker_register_failed')，阻止ccr Client在无效状态下继续运行。
      throw new CCRInitError('worker_register_failed')
    }
    // 更新实例字段 currentState 为 'idle'，同步ccr Client的内部状态。
    this.currentState = 'idle'
    // 调用 this.startHeartbeat，触发ccr Client此处需要的副作用。
    this.startHeartbeat()

    // sessionActivity's refcount-gated timer fires while an API call or tool
    // is in-flight; without a write the container lease can expire mid-wait.
    // v1 wires this in WebSocketTransport per-connection.
    // 调用 registerSessionActivityCallback，触发ccr Client此处需要的副作用。
    registerSessionActivityCallback(() => {
      // 显式忽略 `this.writeEvent({ type: 'keep_alive' })` 的返回值，只保留它触发的副作用。
      void this.writeEvent({ type: 'keep_alive' })
    })

    // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`CCRClient: initialized, epoch=${this.workerEpoch}`)
    // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_worker_lifecycle_initialized', {
      epoch: this.workerEpoch,
      duration_ms: Date.now() - startMs,
    })

    // Await the concurrent GET and log state_restored here, after the PUT
    // has succeeded — logging inside getWorkerState() raced: if the GET
    // resolved before the PUT failed, diagnostics showed both init_failed
    // and state_restored for the same session.
    // 从 `await restoredPromise` 解构 metadata、durationMs，减少ccr Client对同一对象的重复访问。
    const { metadata, durationMs } = await restoredPromise
    // this.closed缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
    if (!this.closed) {
      // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
      logForDiagnosticsNoPII('info', 'cli_worker_state_restored', {
        duration_ms: durationMs,
        had_state: metadata !== null,
      })
    }
    // 返回 `metadata`，作为ccr Client这次计算的结果。
    return metadata
  }

  // Control_requests are marked processed and not re-delivered on
  // restart, so read back what the prior worker wrote.
  // ccr Client在这里处理 `private async getWorkerState(): Promise<{`，完成这一小步状态转换。
  private async getWorkerState(): Promise<{
    metadata: Record<string, unknown> | null
    durationMs: number
  }> {
    // startMs 集合记录时间`Date.now`，供ccr Client后续处理使用。
    const startMs = Date.now()
    // authHeaders 集合读取`this.getAuthHeaders`，供ccr Client后续处理使用。
    const authHeaders = this.getAuthHeaders()
    // Object.keys(authHeaders)为空时立即返回或跳过，避免ccr Client把空集合当成可处理内容。
    if (Object.keys(authHeaders).length === 0) {
      // 返回结构化结果，集中表达ccr Client已经整理出的状态。
      return { metadata: null, durationMs: 0 }
    }
    // data 等待 `this.getWithRetry<WorkerStateResponse>(`，确保继续执行前已有结果。
    const data = await this.getWithRetry<WorkerStateResponse>(
      `${this.sessionBaseUrl}/worker`,
      authHeaders,
      'worker_state',
    )
    // 返回结构化结果，集中表达ccr Client已经整理出的状态。
    return {
      metadata: data?.worker?.external_metadata ?? null,
      durationMs: Date.now() - startMs,
    }
  }

  /**
   * Send an authenticated HTTP request to CCR. Handles auth headers,
   * 409 epoch mismatch, and error logging. Returns { ok: true } on 2xx.
   * On 429, reads Retry-After (integer seconds) so the uploader can honor
   * the server's backoff hint instead of blindly exponentiating.
   */
  // ccr Client在这里处理 `private async request(`，完成这一小步状态转换。
  private async request(
    method: 'post' | 'put',
    path: string,
    body: unknown,
    label: string,
    { timeout = 10_000 }: { timeout?: number } = {},
  ): Promise<RequestResult> {
    // authHeaders 集合读取`this.getAuthHeaders`，供ccr Client后续处理使用。
    const authHeaders = this.getAuthHeaders()
    // Object.keys(authHeaders)为空时立即返回或跳过，避免ccr Client把空集合当成可处理内容。
    if (Object.keys(authHeaders).length === 0) return { ok: false }

    // 保护这一段可能失败的ccr Client操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应 等待 `this.http[method](`，确保继续执行前已有结果。
      const response = await this.http[method](
        `${this.sessionBaseUrl}${path}`,
        body,
        {
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'User-Agent': getClaudeCodeUserAgent(),
          },
          validateStatus: alwaysValidStatus,
          timeout,
        },
      )

      // 组合条件 `response.status >= 200 && response.status < 300` 成立时，ccr Client才启用这条专门路径。
      if (response.status >= 200 && response.status < 300) {
        // 更新实例字段 consecutiveAuthFailures 为 0，同步ccr Client的内部状态。
        this.consecutiveAuthFailures = 0
        // 返回结构化结果，集中表达ccr Client已经整理出的状态。
        return { ok: true }
      }
      // 满足 `response.status === 409` 时，ccr Client执行该分支。
      if (response.status === 409) {
        // 调用 this.handleEpochMismatch，触发ccr Client此处需要的副作用。
        this.handleEpochMismatch()
      }
      // 组合条件 `response.status === 401 || response.status === 403` 成立时，ccr Client才启用这条专门路径。
      if (response.status === 401 || response.status === 403) {
        // A 401 with an expired JWT is deterministic — no retry will
        // ever succeed. Check the token's own exp before burning
        // wall-clock on the threshold loop.
        // tok读取`getSessionIngressAuthToken`，供ccr Client后续处理使用。
        const tok = getSessionIngressAuthToken()
        // exp保存`decodeJwtExpiry`，供ccr Client后续处理使用。
        const exp = tok ? decodeJwtExpiry(tok) : null
        // `exp` 与 `null && exp * 1000 < Date.now()` 不一致时刷新派生状态，避免使用过期结果。
        if (exp !== null && exp * 1000 < Date.now()) {
          // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `CCRClient: session_token expired (exp=${new Date(exp * 1000).toISOString()}) — no refresh was delivered, exiting`,
            { level: 'error' },
          )
          // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
          logForDiagnosticsNoPII('error', 'cli_worker_token_expired_no_refresh')
          // 调用 this.onEpochMismatch，触发ccr Client此处需要的副作用。
          this.onEpochMismatch()
        }
        // Token looks valid but server says 401 — possible server-side
        // blip (userauth down, KMS hiccup). Count toward threshold.
        // ccr Client在这里处理 `this.consecutiveAuthFailures++`，完成这一小步状态转换。
        this.consecutiveAuthFailures++
        // 满足 `this.consecutiveAuthFailures >= MAX_CONSECUTIVE_A` 时，ccr Client执行该分支。
        if (this.consecutiveAuthFailures >= MAX_CONSECUTIVE_AUTH_FAILURES) {
          // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `CCRClient: ${this.consecutiveAuthFailures} consecutive auth failures with a valid-looking token — server-side auth unrecoverable, exiting`,
            { level: 'error' },
          )
          // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
          logForDiagnosticsNoPII('error', 'cli_worker_auth_failures_exhausted')
          // 调用 this.onEpochMismatch，触发ccr Client此处需要的副作用。
          this.onEpochMismatch()
        }
      }
      // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`CCRClient: ${label} returned ${response.status}`, {
        level: 'warn',
      })
      // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'cli_worker_request_failed', {
        method,
        path,
        status: response.status,
      })
      // 满足 `response.status === 429` 时，ccr Client执行该分支。
      if (response.status === 429) {
        // 原始文本读取 `response.headers?.['retry-after']` 对应条目，后续围绕该成员继续处理。
        const raw = response.headers?.['retry-after']
        // seconds 集合解析`parseInt`，供ccr Client后续处理使用。
        const seconds = typeof raw === 'string' ? parseInt(raw, 10) : NaN
        // 组合条件 `!isNaN(seconds) && seconds >= 0` 成立时，ccr Client才启用这条专门路径。
        if (!isNaN(seconds) && seconds >= 0) {
          // 返回结构化结果，集中表达ccr Client已经整理出的状态。
          return { ok: false, retryAfterMs: seconds * 1000 }
        }
      }
      // 返回结构化结果，集中表达ccr Client已经整理出的状态。
      return { ok: false }
    } catch (error) {
      // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`CCRClient: ${label} failed: ${errorMessage(error)}`, {
        level: 'warn',
      })
      // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'cli_worker_request_error', {
        method,
        path,
        error_code: getErrnoCode(error),
      })
      // 返回结构化结果，集中表达ccr Client已经整理出的状态。
      return { ok: false }
    }
  }

  /** Report worker state to CCR via PUT /sessions/{id}/worker. */
  // reportState 使用 state: SessionState, details?: RequiresActionDeta… 完成ccr Client里的对应操作。
  reportState(state: SessionState, details?: RequiresActionDetails): void {
    // 组合条件 `state === this.currentState && !details` 成立时，ccr Client才启用这条专门路径。
    if (state === this.currentState && !details) return
    // 更新实例字段 currentState 为 state，同步ccr Client的内部状态。
    this.currentState = state
    // 调用 this.workerState.enqueue，触发ccr Client此处需要的副作用。
    this.workerState.enqueue({
      worker_status: state,
      requires_action_details: details
        ? {
            tool_name: details.tool_name,
            action_description: details.action_description,
            request_id: details.request_id,
          }
        : null,
    })
  }

  /** Report external metadata to CCR via PUT /worker. */
  // reportMetadata 使用 metadata: Record<string, unknown> 完成ccr Client里的对应操作。
  reportMetadata(metadata: Record<string, unknown>): void {
    // 调用 this.workerState.enqueue，触发ccr Client此处需要的副作用。
    this.workerState.enqueue({ external_metadata: metadata })
  }

  /**
   * Handle epoch mismatch (409 Conflict). A newer CC instance has replaced
   * this one — exit immediately.
   */
  // ccr Client在这里处理 `private handleEpochMismatch(): never {`，完成这一小步状态转换。
  private handleEpochMismatch(): never {
    // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
    logForDebugging('CCRClient: Epoch mismatch (409), shutting down', {
      level: 'error',
    })
    // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
    logForDiagnosticsNoPII('error', 'cli_worker_epoch_mismatch')
    // 调用 this.onEpochMismatch，触发ccr Client此处需要的副作用。
    this.onEpochMismatch()
  }

  /** Start periodic heartbeat. */
  // ccr Client在这里处理 `private startHeartbeat(): void {`，完成这一小步状态转换。
  private startHeartbeat(): void {
    // 调用 this.stopHeartbeat，触发ccr Client此处需要的副作用。
    this.stopHeartbeat()
    // schedule封装成回调，供ccr Client在事件触发或异步步骤中调用。
    const schedule = (): void => {
      // jitter 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const jitter =
        this.heartbeatIntervalMs *
        this.heartbeatJitterFraction *
        (2 * Math.random() - 1)
      // 更新实例字段 heartbeatTimer 为 setTimeout(tick, this.heartbeatIntervalMs + jitter)，同步ccr Client的内部状态。
      this.heartbeatTimer = setTimeout(tick, this.heartbeatIntervalMs + jitter)
    }
    // tick封装成回调，供ccr Client在事件触发或异步步骤中调用。
    const tick = (): void => {
      // 显式忽略 `this.sendHeartbeat()` 的返回值，只保留它触发的副作用。
      void this.sendHeartbeat()
      // stopHeartbeat nulls the timer; check after the fire-and-forget send
      // but before rescheduling so close() during sendHeartbeat is honored.
      // 满足 `this.heartbeatTimer === null` 时，ccr Client执行该分支。
      if (this.heartbeatTimer === null) return
      // 调用 schedule，触发ccr Client此处需要的副作用。
      schedule()
    }
    // 调用 schedule，触发ccr Client此处需要的副作用。
    schedule()
  }

  /** Stop heartbeat timer. */
  // ccr Client在这里处理 `private stopHeartbeat(): void {`，完成这一小步状态转换。
  private stopHeartbeat(): void {
    // 满足 `this.heartbeatTimer` 时，ccr Client执行该分支。
    if (this.heartbeatTimer) {
      // 调用 clearTimeout，触发ccr Client此处需要的副作用。
      clearTimeout(this.heartbeatTimer)
      // 更新实例字段 heartbeatTimer 为 null，同步ccr Client的内部状态。
      this.heartbeatTimer = null
    }
  }

  /** Send a heartbeat via POST /sessions/{id}/worker/heartbeat. */
  // ccr Client在这里处理 `private async sendHeartbeat(): Promise<void> {`，完成这一小步状态转换。
  private async sendHeartbeat(): Promise<void> {
    // 满足 `this.heartbeatInFlight` 时，ccr Client执行该分支。
    if (this.heartbeatInFlight) return
    // 更新实例字段 heartbeatInFlight 为 true，同步ccr Client的内部状态。
    this.heartbeatInFlight = true
    // 保护这一段可能失败的ccr Client操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`this.request`，供ccr Client后续处理使用。
      const result = await this.request(
        'post',
        '/worker/heartbeat',
        { session_id: this.sessionId, worker_epoch: this.workerEpoch },
        'Heartbeat',
        { timeout: 5_000 },
      )
      // 满足 `result.ok` 时，ccr Client执行该分支。
      if (result.ok) {
        // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
        logForDebugging('CCRClient: Heartbeat sent')
      }
    } finally {
      // 更新实例字段 heartbeatInFlight 为 false，同步ccr Client的内部状态。
      this.heartbeatInFlight = false
    }
  }

  /**
   * Write a StdoutMessage as a client event via POST /sessions/{id}/worker/events.
   * These events are visible to frontend clients via the SSE stream.
   * Injects a UUID if missing to ensure server-side idempotency on retry.
   *
   * stream_event messages are held in a 100ms delay buffer and accumulated
   * (text_deltas for the same content block emit a full-so-far snapshot per
   * flush). A non-stream_event write flushes the buffer first so downstream
   * ordering is preserved.
   */
  // writeEvent 使用 message: StdoutMessage 完成ccr Client里的对应操作。
  async writeEvent(message: StdoutMessage): Promise<void> {
    // 当 `message.type` 匹配 `'stream_event'` 时，ccr Client执行对应分支。
    if (message.type === 'stream_event') {
      // streamEventBuffer追加新条目，保持收集顺序与输入顺序一致。
      this.streamEventBuffer.push(message)
      // this.streamEventTimer缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
      if (!this.streamEventTimer) {
        // 更新实例字段 streamEventTimer 为 setTimeout(，同步ccr Client的内部状态。
        this.streamEventTimer = setTimeout(
          // 这个回调绑定到 () => void this.flushStreamEventBuffer(),，负责ccr Client在该局部场景下的响应。
          () => void this.flushStreamEventBuffer(),
          STREAM_EVENT_FLUSH_INTERVAL_MS,
        )
      }
      // ccr Client在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 等待 `this.flushStreamEventBuffer()` 完成，再继续ccr Client的异步流程。
    await this.flushStreamEventBuffer()
    // 当 `message.type` 匹配 `'assistant'` 时，ccr Client执行对应分支。
    if (message.type === 'assistant') {
      // 调用 clearStreamAccumulatorForMessage，触发ccr Client此处需要的副作用。
      clearStreamAccumulatorForMessage(this.streamTextAccumulator, message)
    }
    // 等待 `this.eventUploader.enqueue(this.toClientEvent(message))` 完成，再继续ccr Client的异步流程。
    await this.eventUploader.enqueue(this.toClientEvent(message))
  }

  /** Wrap a StdoutMessage as a ClientEvent, injecting a UUID if missing. */
  // ccr Client在这里处理 `private toClientEvent(message: StdoutMessage): ClientEvent {`，完成这一小步状态转换。
  private toClientEvent(message: StdoutMessage): ClientEvent {
    // 消息 命名 `message as unknown as Record<string, unknown>`，让后续代码直接表达这个值的用途。
    const msg = message as unknown as Record<string, unknown>
    // 返回结构化结果，集中表达ccr Client已经整理出的状态。
    return {
      payload: {
        ...msg,
        uuid: typeof msg.uuid === 'string' ? msg.uuid : randomUUID(),
      } as EventPayload,
    }
  }

  /**
   * Drain the stream_event delay buffer: accumulate text_deltas into
   * full-so-far snapshots, clear the timer, enqueue the resulting events.
   * Called from the timer, from writeEvent on a non-stream message, and from
   * flush(). close() drops the buffer — call flush() first if you need
   * delivery.
   */
  // ccr Client在这里处理 `private async flushStreamEventBuffer(): Promise<void> {`，完成这一小步状态转换。
  private async flushStreamEventBuffer(): Promise<void> {
    // 满足 `this.streamEventTimer` 时，ccr Client执行该分支。
    if (this.streamEventTimer) {
      // 调用 clearTimeout，触发ccr Client此处需要的副作用。
      clearTimeout(this.streamEventTimer)
      // 更新实例字段 streamEventTimer 为 null，同步ccr Client的内部状态。
      this.streamEventTimer = null
    }
    // this.streamEventBuffer为空时立即返回或跳过，避免ccr Client把空集合当成可处理内容。
    if (this.streamEventBuffer.length === 0) return
    // buffered保存`this.streamEventBuffer`，供ccr Client后续判断或输出使用。
    const buffered = this.streamEventBuffer
    // 更新实例字段 streamEventBuffer 为 []，同步ccr Client的内部状态。
    this.streamEventBuffer = []
    // payloads 集合保存`accumulateStreamEvents`，供ccr Client后续处理使用。
    const payloads = accumulateStreamEvents(
      buffered,
      this.streamTextAccumulator,
    )
    // 等待 `this.eventUploader.enqueue(` 完成，再继续ccr Client的异步流程。
    await this.eventUploader.enqueue(
      // 调用 payloads.map，触发ccr Client此处需要的副作用。
      payloads.map(payload => ({ payload, ephemeral: true })),
    )
  }

  /**
   * Write an internal worker event via POST /sessions/{id}/worker/internal-events.
   * These events are NOT visible to frontend clients — they store worker-internal
   * state (transcript messages, compaction markers) needed for session resume.
   */
  // ccr Client在这里处理 `async writeInternalEvent(`，完成这一小步状态转换。
  async writeInternalEvent(
    eventType: string,
    payload: Record<string, unknown>,
    {
      isCompaction = false,
      agentId,
    }: {
      isCompaction?: boolean
      agentId?: string
    } = {},
  ): Promise<void> {
    // event 集中保存ccr Client要一起传递的字段。
    const event: WorkerEvent = {
      payload: {
        type: eventType,
        ...payload,
        uuid: typeof payload.uuid === 'string' ? payload.uuid : randomUUID(),
      } as EventPayload,
      ...(isCompaction && { is_compaction: true }),
      ...(agentId && { agent_id: agentId }),
    }
    // 等待 `this.internalEventUploader.enqueue(event)` 完成，再继续ccr Client的异步流程。
    await this.internalEventUploader.enqueue(event)
  }

  /**
   * Flush pending internal events. Call between turns and on shutdown
   * to ensure transcript entries are persisted.
   */
  // flushInternalEvents 使用 无 完成ccr Client里的对应操作。
  flushInternalEvents(): Promise<void> {
    // 返回 `this.internalEventUploader.flush()`，作为ccr Client这次计算的结果。
    return this.internalEventUploader.flush()
  }

  /**
   * Flush pending client events (writeEvent queue). Call before close()
   * when the caller needs delivery confirmation — close() abandons the
   * queue. Resolves once the uploader drains or rejects; returns
   * regardless of whether individual POSTs succeeded (check server state
   * separately if that matters).
   */
  // flush 使用 无 完成ccr Client里的对应操作。
  async flush(): Promise<void> {
    // 等待 `this.flushStreamEventBuffer()` 完成，再继续ccr Client的异步流程。
    await this.flushStreamEventBuffer()
    // 返回 `this.eventUploader.flush()`，作为ccr Client这次计算的结果。
    return this.eventUploader.flush()
  }

  /**
   * Read foreground agent internal events from
   * GET /sessions/{id}/worker/internal-events.
   * Returns transcript entries from the last compaction boundary, or null on failure.
   * Used for session resume.
   */
  // readInternalEvents 使用 无 完成ccr Client里的对应操作。
  async readInternalEvents(): Promise<InternalEvent[] | null> {
    // 返回 `this.paginatedGet('/worker/internal-events', {}, 'internal_events')`，作为ccr Client这次计算的结果。
    return this.paginatedGet('/worker/internal-events', {}, 'internal_events')
  }

  /**
   * Read all subagent internal events from
   * GET /sessions/{id}/worker/internal-events?subagents=true.
   * Returns a merged stream across all non-foreground agents, each from its
   * compaction point. Used for session resume.
   */
  // readSubagentInternalEvents 使用 无 完成ccr Client里的对应操作。
  async readSubagentInternalEvents(): Promise<InternalEvent[] | null> {
    // 返回 `this.paginatedGet(`，作为ccr Client这次计算的结果。
    return this.paginatedGet(
      '/worker/internal-events',
      { subagents: 'true' },
      'subagent_events',
    )
  }

  /**
   * Paginated GET with retry. Fetches all pages from a list endpoint,
   * retrying each page on failure with exponential backoff + jitter.
   */
  // ccr Client在这里处理 `private async paginatedGet(`，完成这一小步状态转换。
  private async paginatedGet(
    path: string,
    params: Record<string, string>,
    context: string,
  ): Promise<InternalEvent[] | null> {
    // authHeaders 集合读取`this.getAuthHeaders`，供ccr Client后续处理使用。
    const authHeaders = this.getAuthHeaders()
    // Object.keys(authHeaders)为空时立即返回或跳过，避免ccr Client把空集合当成可处理内容。
    if (Object.keys(authHeaders).length === 0) return null

    // allEvents 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const allEvents: InternalEvent[] = []
    // cursor 先占位，稍后的条件分支会根据实际输入补齐它。
    let cursor: string | undefined

    // 先执行一次循环体，再按尾部条件决定是否继续ccr Client处理。
    do {
      // URL保存`URL`，供ccr Client后续处理使用。
      const url = new URL(`${this.sessionBaseUrl}${path}`)
      // 循环处理 `const [k, v] of Object.entries(params)`，让ccr Client把同类条目按顺序走完。
      for (const [k, v] of Object.entries(params)) {
        // url.searchParams.set 写入新的状态值，使ccr Client后续读取保持一致。
        url.searchParams.set(k, v)
      }
      // 满足 `cursor` 时，ccr Client执行该分支。
      if (cursor) {
        // url.searchParams.set 写入新的状态值，使ccr Client后续读取保持一致。
        url.searchParams.set('cursor', cursor)
      }

      // page 等待 `this.getWithRetry<ListInternalEventsResponse>(`，确保继续执行前已有结果。
      const page = await this.getWithRetry<ListInternalEventsResponse>(
        url.toString(),
        authHeaders,
        context,
      )
      // page缺失时提前走兜底路径，避免ccr Client继续依赖无效输入。
      if (!page) return null

      // allEvents 集合追加新条目，保持收集顺序与输入顺序一致。
      allEvents.push(...(page.data ?? []))
      // cursor更新为 `page.next_cursor`，确保CLI后续读取最新状态。
      cursor = page.next_cursor
    } while (cursor)

    // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `CCRClient: Read ${allEvents.length} internal events from ${path}${params.subagents ? ' (subagents)' : ''}`,
    )
    // 返回 `allEvents`，作为ccr Client这次计算的结果。
    return allEvents
  }

  /**
   * Single GET request with retry. Returns the parsed response body
   * on success, null if all retries are exhausted.
   */
  // ccr Client在这里处理 `private async getWithRetry<T>(`，完成这一小步状态转换。
  private async getWithRetry<T>(
    url: string,
    authHeaders: Record<string, string>,
    context: string,
  ): Promise<T | null> {
    // 循环处理 `let attempt = 1; attempt <= 10; attempt++`，让ccr Client逐项把同类条目按顺序走完。
    for (let attempt = 1; attempt <= 10; attempt++) {
      // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let response
      // 保护这一段可能失败的ccr Client操作，确保异常能进入相邻错误处理。
      try {
        // 接口响应更新为 `await this.http.get<T>(url, {`，确保CLI后续读取最新状态。
        response = await this.http.get<T>(url, {
          headers: {
            ...authHeaders,
            'anthropic-version': '2023-06-01',
            'User-Agent': getClaudeCodeUserAgent(),
          },
          validateStatus: alwaysValidStatus,
          timeout: 30_000,
        })
      } catch (error) {
        // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `CCRClient: GET ${url} failed (attempt ${attempt}/10): ${errorMessage(error)}`,
          { level: 'warn' },
        )
        // 满足 `attempt < 10` 时，ccr Client执行该分支。
        if (attempt < 10) {
          // delay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const delay =
            Math.min(500 * 2 ** (attempt - 1), 30_000) + Math.random() * 500
          // 等待 `sleep(delay)` 完成，再继续ccr Client的异步流程。
          await sleep(delay)
        }
        // 跳过当前项，继续处理ccr Client中的下一轮循环。
        continue
      }

      // 组合条件 `response.status >= 200 && response.status < 300` 成立时，ccr Client才启用这条专门路径。
      if (response.status >= 200 && response.status < 300) {
        // 返回 `response.data`，作为ccr Client这次计算的结果。
        return response.data
      }
      // 满足 `response.status === 409` 时，ccr Client执行该分支。
      if (response.status === 409) {
        // 调用 this.handleEpochMismatch，触发ccr Client此处需要的副作用。
        this.handleEpochMismatch()
      }
      // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CCRClient: GET ${url} returned ${response.status} (attempt ${attempt}/10)`,
        { level: 'warn' },
      )

      // 满足 `attempt < 10` 时，ccr Client执行该分支。
      if (attempt < 10) {
        // delay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const delay =
          Math.min(500 * 2 ** (attempt - 1), 30_000) + Math.random() * 500
        // 等待 `sleep(delay)` 完成，再继续ccr Client的异步流程。
        await sleep(delay)
      }
    }

    // 记录ccr Client运行诊断，方便排查异常路径或性能问题。
    logForDebugging('CCRClient: GET retries exhausted', { level: 'error' })
    // 调用 logForDiagnosticsNoPII，触发ccr Client此处需要的副作用。
    logForDiagnosticsNoPII('error', 'cli_worker_get_retries_exhausted', {
      context,
    })
    // 返回 `null`，作为ccr Client这次计算的结果。
    return null
  }

  /**
   * Report delivery status for a client-to-worker event.
   * POST /v1/code/sessions/{id}/worker/events/delivery (batch endpoint)
   */
  // 调用 reportDelivery，触发ccr Client此处需要的副作用。
  reportDelivery(
    eventId: string,
    status: 'received' | 'processing' | 'processed',
  ): void {
    // 显式忽略 `this.deliveryUploader.enqueue({ eventId, status })` 的返回值，只保留它触发的副作用。
    void this.deliveryUploader.enqueue({ eventId, status })
  }

  /** Get the current epoch (for external use). */
  // getWorkerEpoch不依赖额外参数，直接计算ccr Client需要的结果。
  getWorkerEpoch(): number {
    // 返回 `this.workerEpoch`，作为ccr Client这次计算的结果。
    return this.workerEpoch
  }

  /** Internal-event queue depth — shutdown-snapshot backpressure signal. */
  // ccr Client在这里处理 `get internalEventsPending(): number {`，完成这一小步状态转换。
  get internalEventsPending(): number {
    // 返回 `this.internalEventUploader.pendingCount`，作为ccr Client这次计算的结果。
    return this.internalEventUploader.pendingCount
  }

  /** Clean up uploaders and timers. */
  // close 使用 无 完成ccr Client里的对应操作。
  close(): void {
    // 更新实例字段 closed 为 true，同步ccr Client的内部状态。
    this.closed = true
    // 调用 this.stopHeartbeat，触发ccr Client此处需要的副作用。
    this.stopHeartbeat()
    // 调用 unregisterSessionActivityCallback，触发ccr Client此处需要的副作用。
    unregisterSessionActivityCallback()
    // 满足 `this.streamEventTimer` 时，ccr Client执行该分支。
    if (this.streamEventTimer) {
      // 调用 clearTimeout，触发ccr Client此处需要的副作用。
      clearTimeout(this.streamEventTimer)
      // 更新实例字段 streamEventTimer 为 null，同步ccr Client的内部状态。
      this.streamEventTimer = null
    }
    // 更新实例字段 streamEventBuffer 为 []，同步ccr Client的内部状态。
    this.streamEventBuffer = []
    // 调用 this.streamTextAccumulator.byMessage.clear，触发ccr Client此处需要的副作用。
    this.streamTextAccumulator.byMessage.clear()
    // 调用 this.streamTextAccumulator.scopeToMessage.clear，触发ccr Client此处需要的副作用。
    this.streamTextAccumulator.scopeToMessage.clear()
    // 调用 this.workerState.close，触发ccr Client此处需要的副作用。
    this.workerState.close()
    // 调用 this.eventUploader.close，触发ccr Client此处需要的副作用。
    this.eventUploader.close()
    // 调用 this.internalEventUploader.close，触发ccr Client此处需要的副作用。
    this.internalEventUploader.close()
    // 调用 this.deliveryUploader.close，触发ccr Client此处需要的副作用。
    this.deliveryUploader.close()
  }
}
