// 引入 axios、AxiosError，将 axios 中已经封装好的能力接到本文件流程里。
import axios, { type AxiosError } from 'axios'
// 类型依赖 { StdoutMessage } 来自 src/entrypoints/sdk/controlTypes.js，用于校准Hybrid Transport的数据契约。
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../../utils/diagLogs.js'
// 复用 getSessionIngressAuthToken 工具函数，把通用处理留在 ../../utils/sessionIngressAuth.js 中维护。
import { getSessionIngressAuthToken } from '../../utils/sessionIngressAuth.js'
// 引入 SerialBatchEventUploader，将 ./SerialBatchEventUploader.js 中已经封装好的能力接到本文件流程里。
import { SerialBatchEventUploader } from './SerialBatchEventUploader.js'
// 整理这一组导入，让Hybrid Transport后续逻辑可以直接复用这些外部能力。
import {
  WebSocketTransport,
  type WebSocketTransportOptions,
} from './WebSocketTransport.js'

// BATCH_FLUSH_INTERVAL_MS 集合保存`100`，供后续判断或组装使用。
const BATCH_FLUSH_INTERVAL_MS = 100
// Per-attempt POST timeout. Bounds how long a single stuck POST can block
// the serialized queue. Without this, a hung connection stalls all writes.
// POST_TIMEOUT_MS 集合保存`15_000`，供后续判断或组装使用。
const POST_TIMEOUT_MS = 15_000
// Grace period for queued writes on close(). Covers a healthy POST (~100ms)
// plus headroom; best-effort, not a delivery guarantee under degraded network.
// Void-ed (nothing awaits it) so this is a last resort — replBridge teardown
// now closes AFTER archive so archive latency is the primary drain window.
// NOTE: gracefulShutdown's cleanup budget is 2s (not the 5s outer failsafe);
// 3s here exceeds it, but the process lives ~2s longer for hooks+analytics.
// CLOSE_GRACE_MS 集合 命名 `3000`，让后续代码直接表达这个值的用途。
const CLOSE_GRACE_MS = 3000

/**
 * Hybrid transport: WebSocket for reads, HTTP POST for writes.
 *
 * Write flow:
 *
 *   write(stream_event) ─┐
 *                        │ (100ms timer)
 *                        │
 *                        ▼
 *   write(other) ────► uploader.enqueue()  (SerialBatchEventUploader)
 *                        ▲    │
 *   writeBatch() ────────┘    │ serial, batched, retries indefinitely,
 *                             │ backpressure at maxQueueSize
 *                             ▼
 *                        postOnce()  (single HTTP POST, throws on retryable)
 *
 * stream_event messages accumulate in streamEventBuffer for up to 100ms
 * before enqueue (reduces POST count for high-volume content deltas). A
 * non-stream write flushes any buffered stream_events first to preserve order.
 *
 * Serialization + retry + backpressure are delegated to SerialBatchEventUploader
 * (same primitive CCR uses). At most one POST in-flight; events arriving during
 * a POST batch into the next one. On failure, the uploader re-queues and retries
 * with exponential backoff + jitter. If the queue fills past maxQueueSize,
 * enqueue() blocks — giving awaiting callers backpressure.
 *
 * Why serialize? Bridge mode fires writes via `void transport.write()`
 * (fire-and-forget). Without this, concurrent POSTs → concurrent Firestore
 * writes to the same document → collisions → retry storms → pages oncall.
 */
// HybridTransport 聚合Hybrid Transport相关状态与操作，把同一职责的行为收束到类实例中。
export class HybridTransport extends WebSocketTransport {
  private postUrl: string
  private uploader: SerialBatchEventUploader<StdoutMessage>

  // stream_event delay buffer — accumulates content deltas for up to
  // BATCH_FLUSH_INTERVAL_MS before enqueueing (reduces POST count)
  private streamEventBuffer: StdoutMessage[] = []
  private streamEventTimer: ReturnType<typeof setTimeout> | null = null

  // 构造函数初始化实例状态，确保Hybrid Transport后续方法读取到完整配置。
  constructor(
    url: URL,
    headers: Record<string, string> = {},
    sessionId?: string,
    // 这个回调绑定到 refreshHeaders?: () => Record<string, string>,，负责Hybrid Transport在该局部场景下的响应。
    refreshHeaders?: () => Record<string, string>,
    options?: WebSocketTransportOptions & {
      maxConsecutiveFailures?: number
      // 这个回调绑定到 onBatchDropped?: (batchSize: number, failures: number) => void，负责Hybrid Transport在该局部场景下的响应。
      onBatchDropped?: (batchSize: number, failures: number) => void
    },
  ) {
    // 调用 super，触发Hybrid Transport此处需要的副作用。
    super(url, headers, sessionId, refreshHeaders, options)
    // 从 `options ?? {}` 解构 maxConsecutiveFailures、onBatchDropped，减少Hybrid Transport对同一对象的重复访问。
    const { maxConsecutiveFailures, onBatchDropped } = options ?? {}
    // 更新实例字段 postUrl 为 convertWsUrlToPostUrl(url)，同步Hybrid Transport的内部状态。
    this.postUrl = convertWsUrlToPostUrl(url)
    // 更新实例字段 uploader 为 new SerialBatchEventUploader<StdoutMessage>({，同步Hybrid Transport的内部状态。
    this.uploader = new SerialBatchEventUploader<StdoutMessage>({
      // Large cap — session-ingress accepts arbitrary batch sizes. Events
      // naturally batch during in-flight POSTs; this just bounds the payload.
      maxBatchSize: 500,
      // Bridge callers use `void transport.write()` — backpressure doesn't
      // apply (they don't await). A batch >maxQueueSize deadlocks (see
      // SerialBatchEventUploader backpressure check). So set it high enough
      // to be a memory bound only. Wire real backpressure in a follow-up
      // once callers await.
      maxQueueSize: 100_000,
      baseDelayMs: 500,
      maxDelayMs: 8000,
      jitterMs: 1000,
      // Optional cap so a persistently-failing server can't pin the drain
      // loop for the lifetime of the process. Undefined = indefinite retry.
      // replBridge sets this; the 1P transportUtils path does not.
      maxConsecutiveFailures,
      // 这个回调绑定到 onBatchDropped: (batchSize, failures) => {，负责Hybrid Transport在该局部场景下的响应。
      onBatchDropped: (batchSize, failures) => {
        // 调用 logForDiagnosticsNoPII，触发Hybrid Transport此处需要的副作用。
        logForDiagnosticsNoPII(
          'error',
          'cli_hybrid_batch_dropped_max_failures',
          {
            batchSize,
            failures,
          },
        )
        // 调用 onBatchDropped?.(batchSize, failures)，完成这一处局部操作。
        onBatchDropped?.(batchSize, failures)
      },
      // 这个回调绑定到 send: batch => this.postOnce(batch),，负责Hybrid Transport在该局部场景下的响应。
      send: batch => this.postOnce(batch),
    })
    // 记录Hybrid Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`HybridTransport: POST URL = ${this.postUrl}`)
    // 调用 logForDiagnosticsNoPII，触发Hybrid Transport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_hybrid_transport_initialized')
  }

  /**
   * Enqueue a message and wait for the queue to drain. Returning flush()
   * preserves the contract that `await write()` resolves after the event is
   * POSTed (relied on by tests and replBridge's initial flush). Fire-and-forget
   * callers (`void transport.write()`) are unaffected — they don't await,
   * so the later resolution doesn't add latency.
   */
  // Hybrid Transport在这里处理 `override async write(message: StdoutMessage): Promise<void> {`，完成这一小步状态转换。
  override async write(message: StdoutMessage): Promise<void> {
    // 当 `message.type` 匹配 `'stream_event'` 时，Hybrid Transport执行对应分支。
    if (message.type === 'stream_event') {
      // Delay: accumulate stream_events briefly before enqueueing.
      // Promise resolves immediately — callers don't await stream_events.
      // streamEventBuffer追加新条目，保持收集顺序与输入顺序一致。
      this.streamEventBuffer.push(message)
      // this.streamEventTimer缺失时提前走兜底路径，避免Hybrid Transport继续依赖无效输入。
      if (!this.streamEventTimer) {
        // 更新实例字段 streamEventTimer 为 setTimeout(，同步Hybrid Transport的内部状态。
        this.streamEventTimer = setTimeout(
          // 这个回调绑定到 () => this.flushStreamEvents(),，负责Hybrid Transport在该局部场景下的响应。
          () => this.flushStreamEvents(),
          BATCH_FLUSH_INTERVAL_MS,
        )
      }
      // Hybrid Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Immediate: flush any buffered stream_events (ordering), then this event.
    // 等待 `this.uploader.enqueue([...this.takeStreamEvents(), message])` 完成，再继续Hybrid Transport的异步流程。
    await this.uploader.enqueue([...this.takeStreamEvents(), message])
    // 返回 `this.uploader.flush()`，作为Hybrid Transport这次计算的结果。
    return this.uploader.flush()
  }

  // writeBatch 使用 messages: StdoutMessage[] 完成Hybrid Transport里的对应操作。
  async writeBatch(messages: StdoutMessage[]): Promise<void> {
    // 等待 `this.uploader.enqueue([...this.takeStreamEvents(), ...messages])` 完成，再继续Hybrid Transport的异步流程。
    await this.uploader.enqueue([...this.takeStreamEvents(), ...messages])
    // 返回 `this.uploader.flush()`，作为Hybrid Transport这次计算的结果。
    return this.uploader.flush()
  }

  /** Snapshot before/after writeBatch() to detect silent drops. */
  // Hybrid Transport在这里处理 `get droppedBatchCount(): number {`，完成这一小步状态转换。
  get droppedBatchCount(): number {
    // 返回 `this.uploader.droppedBatchCount`，作为Hybrid Transport这次计算的结果。
    return this.uploader.droppedBatchCount
  }

  /**
   * Block until all pending events are POSTed. Used by bridge's initial
   * history flush so onStateChange('connected') fires after persistence.
   */
  // flush 使用 无 完成Hybrid Transport里的对应操作。
  flush(): Promise<void> {
    // 显式忽略 `this.uploader.enqueue(this.takeStreamEvents())` 的返回值，只保留它触发的副作用。
    void this.uploader.enqueue(this.takeStreamEvents())
    // 返回 `this.uploader.flush()`，作为Hybrid Transport这次计算的结果。
    return this.uploader.flush()
  }

  /** Take ownership of buffered stream_events and clear the delay timer. */
  // Hybrid Transport在这里处理 `private takeStreamEvents(): StdoutMessage[] {`，完成这一小步状态转换。
  private takeStreamEvents(): StdoutMessage[] {
    // 满足 `this.streamEventTimer` 时，Hybrid Transport执行该分支。
    if (this.streamEventTimer) {
      // 调用 clearTimeout，触发Hybrid Transport此处需要的副作用。
      clearTimeout(this.streamEventTimer)
      // 更新实例字段 streamEventTimer 为 null，同步Hybrid Transport的内部状态。
      this.streamEventTimer = null
    }
    // buffered 命名 `this.streamEventBuffer`，让后续代码直接表达这个值的用途。
    const buffered = this.streamEventBuffer
    // 更新实例字段 streamEventBuffer 为 []，同步Hybrid Transport的内部状态。
    this.streamEventBuffer = []
    // 返回 `buffered`，作为Hybrid Transport这次计算的结果。
    return buffered
  }

  /** Delay timer fired — enqueue accumulated stream_events. */
  // Hybrid Transport在这里处理 `private flushStreamEvents(): void {`，完成这一小步状态转换。
  private flushStreamEvents(): void {
    // 更新实例字段 streamEventTimer 为 null，同步Hybrid Transport的内部状态。
    this.streamEventTimer = null
    // 显式忽略 `this.uploader.enqueue(this.takeStreamEvents())` 的返回值，只保留它触发的副作用。
    void this.uploader.enqueue(this.takeStreamEvents())
  }

  // Hybrid Transport在这里处理 `override close(): void {`，完成这一小步状态转换。
  override close(): void {
    // 满足 `this.streamEventTimer` 时，Hybrid Transport执行该分支。
    if (this.streamEventTimer) {
      // 调用 clearTimeout，触发Hybrid Transport此处需要的副作用。
      clearTimeout(this.streamEventTimer)
      // 更新实例字段 streamEventTimer 为 null，同步Hybrid Transport的内部状态。
      this.streamEventTimer = null
    }
    // 更新实例字段 streamEventBuffer 为 []，同步Hybrid Transport的内部状态。
    this.streamEventBuffer = []
    // Grace period for queued writes — fallback. replBridge teardown now
    // awaits archive between write and close (see CLOSE_GRACE_MS), so
    // archive latency is the primary drain window and this is a last
    // resort. Keep close() sync (returns immediately) but defer
    // uploader.close() so any remaining queue gets a chance to finish.
    // uploader读取`this.uploader` 整理出中间结果，供Hybrid Transport后续步骤使用。
    const uploader = this.uploader
    // graceTimer 先占位，稍后的条件分支会根据实际输入补齐它。
    let graceTimer: ReturnType<typeof setTimeout> | undefined
    // 显式忽略 `Promise.race([` 的返回值，只保留它触发的副作用。
    void Promise.race([
      uploader.flush(),
      // 这个回调绑定到 new Promise<void>(r => {，负责Hybrid Transport在该局部场景下的响应。
      new Promise<void>(r => {
        // eslint-disable-next-line no-restricted-syntax -- need timer ref for clearTimeout
        // graceTimer更新为 `setTimeout(r, CLOSE_GRACE_MS)`，确保CLI后续读取最新状态。
        graceTimer = setTimeout(r, CLOSE_GRACE_MS)
      }),
    // 这个回调绑定到 ]).finally(() => {，负责Hybrid Transport在该局部场景下的响应。
    ]).finally(() => {
      // 调用 clearTimeout，触发Hybrid Transport此处需要的副作用。
      clearTimeout(graceTimer)
      // 调用 uploader.close，触发Hybrid Transport此处需要的副作用。
      uploader.close()
    })
    // 调用 super.close，触发Hybrid Transport此处需要的副作用。
    super.close()
  }

  /**
   * Single-attempt POST. Throws on retryable failures (429, 5xx, network)
   * so SerialBatchEventUploader re-queues and retries. Returns on success
   * and on permanent failures (4xx non-429, no token) so the uploader moves on.
   */
  // Hybrid Transport在这里处理 `private async postOnce(events: StdoutMessage[]): Promise<void> {`，完成这一小步状态转换。
  private async postOnce(events: StdoutMessage[]): Promise<void> {
    // sessionToken 会话数据读取`getSessionIngressAuthToken`，供Hybrid Transport后续处理使用。
    const sessionToken = getSessionIngressAuthToken()
    // sessionToken 会话数据缺失时提前走兜底路径，避免Hybrid Transport继续依赖无效输入。
    if (!sessionToken) {
      // 记录Hybrid Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging('HybridTransport: No session token available for POST')
      // 调用 logForDiagnosticsNoPII，触发Hybrid Transport此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'cli_hybrid_post_no_token')
      // Hybrid Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 请求头 集中保存Hybrid Transport要一起传递的字段。
    const headers: Record<string, string> = {
      Authorization: `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    }

    // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let response
    // 保护这一段可能失败的Hybrid Transport操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应更新为 `await axios.post(`，确保CLI后续读取最新状态。
      response = await axios.post(
        this.postUrl,
        { events },
        {
          headers,
          // 这个回调绑定到 validateStatus: () => true,，负责Hybrid Transport在该局部场景下的响应。
          validateStatus: () => true,
          timeout: POST_TIMEOUT_MS,
        },
      )
    } catch (error) {
      // axiosError 错误信息 命名 `error as AxiosError`，让后续代码直接表达这个值的用途。
      const axiosError = error as AxiosError
      // 记录Hybrid Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`HybridTransport: POST error: ${axiosError.message}`)
      // 调用 logForDiagnosticsNoPII，触发Hybrid Transport此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'cli_hybrid_post_network_error')
      // 抛出 error，阻止Hybrid Transport在无效状态下继续运行。
      throw error
    }

    // 组合条件 `response.status >= 200 && response.status < 300` 成立时，Hybrid Transport才启用这条专门路径。
    if (response.status >= 200 && response.status < 300) {
      // 记录Hybrid Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`HybridTransport: POST success count=${events.length}`)
      // Hybrid Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 4xx (except 429) are permanent — drop, don't retry.
    // Hybrid Transport在这里进入条件判断，后续代码按实际状态分流。
    if (
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 429
    ) {
      // 记录Hybrid Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `HybridTransport: POST returned ${response.status} (permanent), dropping`,
      )
      // 调用 logForDiagnosticsNoPII，触发Hybrid Transport此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'cli_hybrid_post_client_error', {
        status: response.status,
      })
      // Hybrid Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 429 / 5xx — retryable. Throw so uploader re-queues and backs off.
    // 记录Hybrid Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `HybridTransport: POST returned ${response.status} (retryable)`,
    )
    // 调用 logForDiagnosticsNoPII，触发Hybrid Transport此处需要的副作用。
    logForDiagnosticsNoPII('warn', 'cli_hybrid_post_retryable_error', {
      status: response.status,
    })
    // 抛出 new Error(`POST failed with ${response.status}`)，阻止Hybrid Transport在无效状态下继续运行。
    throw new Error(`POST failed with ${response.status}`)
  }
}

/**
 * Convert a WebSocket URL to the HTTP POST endpoint URL.
 * From: wss://api.example.com/v2/session_ingress/ws/<session_id>
 * To: https://api.example.com/v2/session_ingress/session/<session_id>/events
 */
// convertWsUrlToPostUrl 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertWsUrlToPostUrl(wsUrl: URL): string {
  // protocol标记Hybrid Transport是否启用对应路径。
  const protocol = wsUrl.protocol === 'wss:' ? 'https:' : 'http:'

  // Replace /ws/ with /session/ and append /events
  // pathname 路径数据保存`wsUrl.pathname`，供Hybrid Transport后续判断或输出使用。
  let pathname = wsUrl.pathname
  // pathname 路径数据更新为 `pathname.replace('/ws/', '/session/')`，确保CLI后续读取最新状态。
  pathname = pathname.replace('/ws/', '/session/')
  // 满足 `!pathname.endsWith('/events')` 时，Hybrid Transport执行该分支。
  if (!pathname.endsWith('/events')) {
    // pathname 路径数据更新为 `pathname.endsWith('/')`，确保CLI后续读取最新状态。
    pathname = pathname.endsWith('/')
      ? pathname + 'events'
      : pathname + '/events'
  }

  // 返回 ``${protocol}//${wsUrl.host}${pathname}${wsUrl.search}``，作为Hybrid Transport这次计算的结果。
  return `${protocol}//${wsUrl.host}${pathname}${wsUrl.search}`
}
