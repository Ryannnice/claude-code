// 引入 axios、AxiosError，将 axios 中已经封装好的能力接到本文件流程里。
import axios, { type AxiosError } from 'axios'
// 类型依赖 { StdoutMessage } 来自 src/entrypoints/sdk/controlTypes.js，用于校准SSETransport的数据契约。
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../../utils/diagLogs.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 getSessionIngressAuthHeaders 工具函数，把通用处理留在 ../../utils/sessionIngressAuth.js 中维护。
import { getSessionIngressAuthHeaders } from '../../utils/sessionIngressAuth.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'
// 类型依赖 { Transport } 来自 ./Transport.js，用于校准SSETransport的数据契约。
import type { Transport } from './Transport.js'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// RECONNECT_BASE_DELAY_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
const RECONNECT_BASE_DELAY_MS = 1000
// RECONNECT_MAX_DELAY_MS 集合 命名 `30_000`，让后续代码直接表达这个值的用途。
const RECONNECT_MAX_DELAY_MS = 30_000
/** Time budget for reconnection attempts before giving up (10 minutes). */
// RECONNECT_GIVE_UP_MS 集合保存`600_000`，供后续判断或组装使用。
const RECONNECT_GIVE_UP_MS = 600_000
/** Server sends keepalives every 15s; treat connection as dead after 45s of silence. */
// LIVENESS_TIMEOUT_MS 集合保存`45_000`，供SSETransport后续判断或输出使用。
const LIVENESS_TIMEOUT_MS = 45_000

/**
 * HTTP status codes that indicate a permanent server-side rejection.
 * The transport transitions to 'closed' immediately without retrying.
 */
// PERMANENT_HTTP_CODES 集合保存`Set`，供SSETransport后续处理使用。
const PERMANENT_HTTP_CODES = new Set([401, 403, 404])

// POST retry configuration (matches HybridTransport)
// POST_MAX_RETRIES 集合 命名 `10`，让后续代码直接表达这个值的用途。
const POST_MAX_RETRIES = 10
// POST_BASE_DELAY_MS 集合保存`500`，供后续判断或组装使用。
const POST_BASE_DELAY_MS = 500
// POST_MAX_DELAY_MS 集合保存`8000`，供后续判断或组装使用。
const POST_MAX_DELAY_MS = 8000

/** Hoisted TextDecoder options to avoid per-chunk allocation in readStream. */
// STREAM_DECODE_OPTS 集合 集中保存SSETransport要一起传递的字段。
const STREAM_DECODE_OPTS: TextDecodeOptions = { stream: true }

/** Hoisted axios validateStatus callback to avoid per-request closure allocation. */
// alwaysValidStatus 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function alwaysValidStatus(): boolean {
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// ---------------------------------------------------------------------------
// SSE Frame Parser
// ---------------------------------------------------------------------------

// SSEFrame 固化SSETransport里传递的数据形状，帮助调用方按同一结构读写字段。
type SSEFrame = {
  event?: string
  id?: string
  data?: string
}

/**
 * Incrementally parse SSE frames from a text buffer.
 * Returns parsed frames and the remaining (incomplete) buffer.
 *
 * @internal exported for testing
 */
// parseSSEFrames 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSSEFrames(buffer: string): {
  frames: SSEFrame[]
  remaining: string
} {
  // frames 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const frames: SSEFrame[] = []
  // pos 集合保存`0`，供后续判断或组装使用。
  let pos = 0

  // SSE frames are delimited by double newlines
  // idx 先占位，稍后的条件分支会根据实际输入补齐它。
  let idx: number
  // 只要 (idx = buffer.indexOf('\n\n', pos)) !== -1 成立，就持续推进SSETransport中的循环处理。
  while ((idx = buffer.indexOf('\n\n', pos)) !== -1) {
    // rawFrame格式化`buffer.slice`，供SSETransport后续处理使用。
    const rawFrame = buffer.slice(pos, idx)
    // pos 集合更新为 `idx + 2`，确保CLI后续读取最新状态。
    pos = idx + 2

    // Skip empty frames
    // 满足 `!rawFrame.trim()` 时，SSETransport执行该分支。
    if (!rawFrame.trim()) continue

    // frame 从空对象开始收集键值，后续按名称补齐内容。
    const frame: SSEFrame = {}
    // isComment标记SSETransport是否启用对应路径。
    let isComment = false

    // 逐项读取 `rawFrame.split('\n')` 中的line，按输入顺序推进SSETransport。
    for (const line of rawFrame.split('\n')) {
      // 满足 `line.startsWith(':')` 时，SSETransport执行该分支。
      if (line.startsWith(':')) {
        // SSE comment (e.g., `:keepalive`)
        // isComment更新为 `true`，确保CLI后续读取最新状态。
        isComment = true
        // 跳过当前项，继续处理SSETransport中的下一轮循环。
        continue
      }

      // colonIdx保存`line.indexOf`，供SSETransport后续处理使用。
      const colonIdx = line.indexOf(':')
      // 满足 `colonIdx === -1` 时，SSETransport执行该分支。
      if (colonIdx === -1) continue

      // field格式化`line.slice`，供SSETransport后续处理使用。
      const field = line.slice(0, colonIdx)
      // Per SSE spec, strip one leading space after colon if present
      // value 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const value =
        line[colonIdx + 1] === ' '
          ? line.slice(colonIdx + 2)
          : line.slice(colonIdx + 1)

      // 按照 field 的取值选择SSETransport的具体处理分支。
      switch (field) {
        case 'event':
          // event更新为 `value`，确保CLI后续读取最新状态。
          frame.event = value
          // 结束这个分支或循环，避免SSETransport继续落入后续路径。
          break
        case 'id':
          // 标识符更新为 `value`，确保CLI后续读取最新状态。
          frame.id = value
          // 结束这个分支或循环，避免SSETransport继续落入后续路径。
          break
        case 'data':
          // Per SSE spec, multiple data: lines are concatenated with \n
          // data更新为 `frame.data ? frame.data + '\n' + value : value`，确保CLI后续读取最新状态。
          frame.data = frame.data ? frame.data + '\n' + value : value
          // 结束这个分支或循环，避免SSETransport继续落入后续路径。
          break
        // Ignore other fields (retry:, etc.)
      }
    }

    // Only emit frames that have data (or are pure comments which reset liveness)
    // 组合条件 `frame.data || isComment` 成立时，SSETransport才启用这条专门路径。
    if (frame.data || isComment) {
      // frames 集合追加新条目，保持收集顺序与输入顺序一致。
      frames.push(frame)
    }
  }

  // 返回结构化结果，集中表达SSETransport已经整理出的状态。
  return { frames, remaining: buffer.slice(pos) }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// SSETransportState 固化SSETransport里传递的数据形状，帮助调用方按同一结构读写字段。
type SSETransportState =
  | 'idle'
  | 'connected'
  | 'reconnecting'
  | 'closing'
  | 'closed'

/**
 * Payload for `event: client_event` frames, matching the StreamClientEvent
 * proto message in session_stream.proto. This is the only event type sent
 * to worker subscribers — delivery_update, session_update, ephemeral_event,
 * and catch_up_truncated are client-channel-only (see notifier.go and
 * event_stream.go SubscriberClient guard).
 */
// StreamClientEvent 固化SSETransport里传递的数据形状，帮助调用方按同一结构读写字段。
export type StreamClientEvent = {
  event_id: string
  sequence_num: number
  event_type: string
  source: string
  payload: Record<string, unknown>
  created_at: string
}

// ---------------------------------------------------------------------------
// SSETransport
// ---------------------------------------------------------------------------

/**
 * Transport that uses SSE for reading and HTTP POST for writing.
 *
 * Reads events via Server-Sent Events from the CCR v2 event stream endpoint.
 * Writes events via HTTP POST with retry logic (same pattern as HybridTransport).
 *
 * Each `event: client_event` frame carries a StreamClientEvent proto JSON
 * directly in `data:`. The transport extracts `payload` and passes it to
 * `onData` as newline-delimited JSON for StructuredIO consumers.
 *
 * Supports automatic reconnection with exponential backoff and Last-Event-ID
 * for resumption after disconnection.
 */
// SSETransport 聚合SSETransport相关状态与操作，把同一职责的行为收束到类实例中。
export class SSETransport implements Transport {
  private state: SSETransportState = 'idle'
  private onData?: (data: string) => void
  private onCloseCallback?: (closeCode?: number) => void
  private onEventCallback?: (event: StreamClientEvent) => void
  private headers: Record<string, string>
  private sessionId?: string
  // 这个回调绑定到 private refreshHeaders?: () => Record<string, string>，负责SSETransport在该局部场景下的响应。
  private refreshHeaders?: () => Record<string, string>
  // 这个回调绑定到 private readonly getAuthHeaders: () => Record<string, string>，负责SSETransport在该局部场景下的响应。
  private readonly getAuthHeaders: () => Record<string, string>

  // SSE connection state
  private abortController: AbortController | null = null
  private lastSequenceNum = 0
  private seenSequenceNums = new Set<number>()

  // Reconnection state
  private reconnectAttempts = 0
  private reconnectStartTime: number | null = null
  private reconnectTimer: NodeJS.Timeout | null = null

  // Liveness detection
  private livenessTimer: NodeJS.Timeout | null = null

  // POST URL (derived from SSE URL)
  private postUrl: string

  // Runtime epoch for CCR v2 event format

  // 构造函数初始化实例状态，确保SSETransport后续方法读取到完整配置。
  constructor(
    private readonly url: URL,
    headers: Record<string, string> = {},
    sessionId?: string,
    // 这个回调绑定到 refreshHeaders?: () => Record<string, string>,，负责SSETransport在该局部场景下的响应。
    refreshHeaders?: () => Record<string, string>,
    initialSequenceNum?: number,
    /**
     * Per-instance auth header source. Omit to read the process-wide
     * CLAUDE_CODE_SESSION_ACCESS_TOKEN (single-session callers). Required
     * for concurrent multi-session callers — the env-var path is a process
     * global and would stomp across sessions.
     */
    // 这个回调绑定到 getAuthHeaders?: () => Record<string, string>,，负责SSETransport在该局部场景下的响应。
    getAuthHeaders?: () => Record<string, string>,
  ) {
    // 更新实例字段 headers 为 headers，同步SSETransport的内部状态。
    this.headers = headers
    // 更新实例字段 sessionId 为 sessionId，同步SSETransport的内部状态。
    this.sessionId = sessionId
    // 更新实例字段 refreshHeaders 为 refreshHeaders，同步SSETransport的内部状态。
    this.refreshHeaders = refreshHeaders
    // 更新实例字段 getAuthHeaders 为 getAuthHeaders ?? getSessionIngressAuthHeaders，同步SSETransport的内部状态。
    this.getAuthHeaders = getAuthHeaders ?? getSessionIngressAuthHeaders
    // 更新实例字段 postUrl 为 convertSSEUrlToPostUrl(url)，同步SSETransport的内部状态。
    this.postUrl = convertSSEUrlToPostUrl(url)
    // Seed with a caller-provided high-water mark so the first connect()
    // sends from_sequence_num / Last-Event-ID. Without this, a fresh
    // SSETransport always asks the server to replay from sequence 0 —
    // the entire session history on every transport swap.
    // `initialSequenceNum` 与 `undefined && initialSequen` 不一致时刷新派生状态，避免使用过期结果。
    if (initialSequenceNum !== undefined && initialSequenceNum > 0) {
      // 更新实例字段 lastSequenceNum 为 initialSequenceNum，同步SSETransport的内部状态。
      this.lastSequenceNum = initialSequenceNum
    }
    // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`SSETransport: SSE URL = ${url.href}`)
    // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`SSETransport: POST URL = ${this.postUrl}`)
    // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_sse_transport_initialized')
  }

  /**
   * High-water mark of sequence numbers seen on this stream. Callers that
   * recreate the transport (e.g. replBridge onWorkReceived) read this before
   * close() and pass it as `initialSequenceNum` to the next instance so the
   * server resumes from the right point instead of replaying everything.
   */
  // getLastSequenceNum不依赖额外参数，直接计算SSETransport需要的结果。
  getLastSequenceNum(): number {
    // 返回 `this.lastSequenceNum`，作为SSETransport这次计算的结果。
    return this.lastSequenceNum
  }

  // connect 使用 无 完成SSETransport里的对应操作。
  async connect(): Promise<void> {
    // `this.state` 与 `'idle' && this.state !== 'recon...` 不一致时刷新派生状态，避免使用过期结果。
    if (this.state !== 'idle' && this.state !== 'reconnecting') {
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Cannot connect, current state is ${this.state}`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_sse_connect_failed')
      // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 更新实例字段 state 为 'reconnecting'，同步SSETransport的内部状态。
    this.state = 'reconnecting'
    // connectStartTime记录时间`Date.now`，供SSETransport后续处理使用。
    const connectStartTime = Date.now()

    // Build SSE URL with sequence number for resumption
    // sseUrl保存`URL`，供SSETransport后续处理使用。
    const sseUrl = new URL(this.url.href)
    // 满足 `this.lastSequenceNum > 0` 时，SSETransport执行该分支。
    if (this.lastSequenceNum > 0) {
      // sseUrl.searchParams.set 写入新的状态值，使SSETransport后续读取保持一致。
      sseUrl.searchParams.set('from_sequence_num', String(this.lastSequenceNum))
    }

    // Build headers -- use fresh auth headers (supports Cookie for session keys).
    // Remove stale Authorization header from this.headers when Cookie auth is used,
    // since sending both confuses the auth interceptor.
    // authHeaders 集合读取`this.getAuthHeaders`，供SSETransport后续处理使用。
    const authHeaders = this.getAuthHeaders()
    // 请求头 集中保存SSETransport要一起传递的字段。
    const headers: Record<string, string> = {
      ...this.headers,
      ...authHeaders,
      Accept: 'text/event-stream',
      'anthropic-version': '2023-06-01',
      'User-Agent': getClaudeCodeUserAgent(),
    }
    // 满足 `authHeaders['Cookie']` 时，SSETransport执行该分支。
    if (authHeaders['Cookie']) {
      // SSETransport在这里处理 `delete headers['Authorization']`，完成这一小步状态转换。
      delete headers['Authorization']
    }
    // 满足 `this.lastSequenceNum > 0` 时，SSETransport执行该分支。
    if (this.lastSequenceNum > 0) {
      // headers['Last-Event-ID'更新为 `String(this.lastSequenceNum)`，确保SSETransport后续读取最新状态。
      headers['Last-Event-ID'] = String(this.lastSequenceNum)
    }

    // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`SSETransport: Opening ${sseUrl.href}`)
    // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_sse_connect_opening')

    // 更新实例字段 abortController 为 new AbortController()，同步SSETransport的内部状态。
    this.abortController = new AbortController()

    // 保护这一段可能失败的SSETransport操作，确保异常能进入相邻错误处理。
    try {
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // 接口响应读取`fetch`，供SSETransport后续处理使用。
      const response = await fetch(sseUrl.href, {
        headers,
        signal: this.abortController.signal,
      })

      // response.ok 响应数据缺失时提前走兜底路径，避免SSETransport继续依赖无效输入。
      if (!response.ok) {
        // isPermanent记录 `PERMANENT_HTTP_CODES.has` 是否成立，SSETransport随后按该结果分支。
        const isPermanent = PERMANENT_HTTP_CODES.has(response.status)
        // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `SSETransport: HTTP ${response.status}${isPermanent ? ' (permanent)' : ''}`,
          { level: 'error' },
        )
        // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
        logForDiagnosticsNoPII('error', 'cli_sse_connect_http_error', {
          status: response.status,
        })

        // 满足 `isPermanent` 时，SSETransport执行该分支。
        if (isPermanent) {
          // 更新实例字段 state 为 'closed'，同步SSETransport的内部状态。
          this.state = 'closed'
          // 调用 this.onCloseCallback?.(response.status)，完成这一处局部操作。
          this.onCloseCallback?.(response.status)
          // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 调用 this.handleConnectionError，触发SSETransport此处需要的副作用。
        this.handleConnectionError()
        // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // response.body 响应数据缺失时提前走兜底路径，避免SSETransport继续依赖无效输入。
      if (!response.body) {
        // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
        logForDebugging('SSETransport: No response body')
        // 调用 this.handleConnectionError，触发SSETransport此处需要的副作用。
        this.handleConnectionError()
        // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Successfully connected
      // connectDuration记录时间`Date.now`，供SSETransport后续处理使用。
      const connectDuration = Date.now() - connectStartTime
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging('SSETransport: Connected')
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('info', 'cli_sse_connect_connected', {
        duration_ms: connectDuration,
      })

      // 更新实例字段 state 为 'connected'，同步SSETransport的内部状态。
      this.state = 'connected'
      // 更新实例字段 reconnectAttempts 为 0，同步SSETransport的内部状态。
      this.reconnectAttempts = 0
      // 更新实例字段 reconnectStartTime 为 null，同步SSETransport的内部状态。
      this.reconnectStartTime = null
      // 调用 this.resetLivenessTimer，触发SSETransport此处需要的副作用。
      this.resetLivenessTimer()

      // Read the SSE stream
      // 等待 `this.readStream(response.body)` 完成，再继续SSETransport的异步流程。
      await this.readStream(response.body)
    } catch (error) {
      // 满足 `this.abortController?.signal.aborted` 时，SSETransport执行该分支。
      if (this.abortController?.signal.aborted) {
        // Intentional close
        // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Connection error: ${errorMessage(error)}`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_sse_connect_error')
      // 调用 this.handleConnectionError，触发SSETransport此处需要的副作用。
      this.handleConnectionError()
    }
  }

  /**
   * Read and process the SSE stream body.
   */
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  // SSETransport在这里处理 `private async readStream(body: ReadableStream<Uint8Array>): Promise<voi...`，完成这一小步状态转换。
  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    // reader读取`body.getReader`，供SSETransport后续处理使用。
    const reader = body.getReader()
    // decoder保存`TextDecoder`，供SSETransport后续处理使用。
    const decoder = new TextDecoder()
    // buffer 命名 `''`，让后续代码直接表达这个值的用途。
    let buffer = ''

    // 保护这一段可能失败的SSETransport操作，确保异常能进入相邻错误处理。
    try {
      // while 使用 true 完成SSETransport里的对应操作。
      while (true) {
        // 从 `await reader.read()` 解构 done、value，减少SSETransport对同一对象的重复访问。
        const { done, value } = await reader.read()
        // 满足 `done` 时，SSETransport执行该分支。
        if (done) break

        // SSETransport在这里处理 `buffer += decoder.decode(value, STREAM_DECODE_OPTS)`，完成这一小步状态转换。
        buffer += decoder.decode(value, STREAM_DECODE_OPTS)
        // 从 `parseSSEFrames(buffer)` 解构 frames、remaining，减少SSETransport对同一对象的重复访问。
        const { frames, remaining } = parseSSEFrames(buffer)
        // buffer更新为 `remaining`，确保CLI后续读取最新状态。
        buffer = remaining

        // 按顺序遍历 `frames` 中的frame，逐个交给SSETransport处理。
        for (const frame of frames) {
          // Any frame (including keepalive comments) proves the connection is alive
          // 调用 this.resetLivenessTimer，触发SSETransport此处需要的副作用。
          this.resetLivenessTimer()

          // 满足 `frame.id` 时，SSETransport执行该分支。
          if (frame.id) {
            // seqNum解析`parseInt`，供SSETransport后续处理使用。
            const seqNum = parseInt(frame.id, 10)
            // 满足 `!isNaN(seqNum)` 时，SSETransport执行该分支。
            if (!isNaN(seqNum)) {
              // 满足 `this.seenSequenceNums.has(seqNum)` 时，SSETransport执行该分支。
              if (this.seenSequenceNums.has(seqNum)) {
                // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `SSETransport: DUPLICATE frame seq=${seqNum} (lastSequenceNum=${this.lastSequenceNum}, seenCount=${this.seenSequenceNums.size})`,
                  { level: 'warn' },
                )
                // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
                logForDiagnosticsNoPII('warn', 'cli_sse_duplicate_sequence')
              } else {
                // 调用 this.seenSequenceNums.add，触发SSETransport此处需要的副作用。
                this.seenSequenceNums.add(seqNum)
                // Prevent unbounded growth: once we have many entries, prune
                // old sequence numbers that are well below the high-water mark.
                // Only sequence numbers near lastSequenceNum matter for dedup.
                // 满足 `this.seenSequenceNums.size > 1000` 时，SSETransport执行该分支。
                if (this.seenSequenceNums.size > 1000) {
                  // threshold保存`this.lastSequenceNum - 200`，供后续判断或组装使用。
                  const threshold = this.lastSequenceNum - 200
                  // 按顺序遍历 `this.seenSequenceNums` 中的s 集合，逐个交给SSETransport处理。
                  for (const s of this.seenSequenceNums) {
                    // 满足 `s < threshold` 时，SSETransport执行该分支。
                    if (s < threshold) {
                      // 调用 this.seenSequenceNums.delete，触发SSETransport此处需要的副作用。
                      this.seenSequenceNums.delete(s)
                    }
                  }
                }
              }
              // 满足 `seqNum > this.lastSequenceNum` 时，SSETransport执行该分支。
              if (seqNum > this.lastSequenceNum) {
                // 更新实例字段 lastSequenceNum 为 seqNum，同步SSETransport的内部状态。
                this.lastSequenceNum = seqNum
              }
            }
          }

          // 组合条件 `frame.event && frame.data` 成立时，SSETransport才启用这条专门路径。
          if (frame.event && frame.data) {
            // 调用 this.handleSSEFrame，触发SSETransport此处需要的副作用。
            this.handleSSEFrame(frame.event, frame.data)
          // SSETransport在这里处理 `} else if (frame.data) {`，完成这一小步状态转换。
          } else if (frame.data) {
            // data: without event: — server is emitting the old envelope format
            // or a bug. Log so incidents show as a signal instead of silent drops.
            // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              'SSETransport: Frame has data: but no event: field — dropped',
              { level: 'warn' },
            )
            // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
            logForDiagnosticsNoPII('warn', 'cli_sse_frame_missing_event_field')
          }
        }
      }
    } catch (error) {
      // 满足 `this.abortController?.signal.aborted` 时，SSETransport执行该分支。
      if (this.abortController?.signal.aborted) return
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Stream read error: ${errorMessage(error)}`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_sse_stream_read_error')
    } finally {
      // 调用 reader.releaseLock，触发SSETransport此处需要的副作用。
      reader.releaseLock()
    }

    // Stream ended — reconnect unless we're closing
    // `this.state` 与 `'closing' && this.state !== 'cl...` 不一致时刷新派生状态，避免使用过期结果。
    if (this.state !== 'closing' && this.state !== 'closed') {
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging('SSETransport: Stream ended, reconnecting')
      // 调用 this.handleConnectionError，触发SSETransport此处需要的副作用。
      this.handleConnectionError()
    }
  }

  /**
   * Handle a single SSE frame. The event: field names the variant; data:
   * carries the inner proto JSON directly (no envelope).
   *
   * Worker subscribers only receive client_event frames (see notifier.go) —
   * any other event type indicates a server-side change that CC doesn't yet
   * understand. Log a diagnostic so we notice in telemetry.
   */
  // SSETransport在这里处理 `private handleSSEFrame(eventType: string, data: string): void {`，完成这一小步状态转换。
  private handleSSEFrame(eventType: string, data: string): void {
    // `eventType` 与 `'client_event'` 不一致时刷新派生状态，避免使用过期结果。
    if (eventType !== 'client_event') {
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Unexpected SSE event type '${eventType}' on worker stream`,
        { level: 'warn' },
      )
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'cli_sse_unexpected_event_type', {
        event_type: eventType,
      })
      // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // ev 先占位，稍后的条件分支会根据实际输入补齐它。
    let ev: StreamClientEvent
    // 保护这一段可能失败的SSETransport操作，确保异常能进入相邻错误处理。
    try {
      // ev更新为 `jsonParse(data) as StreamClientEvent`，确保CLI后续读取最新状态。
      ev = jsonParse(data) as StreamClientEvent
    } catch (error) {
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Failed to parse client_event data: ${errorMessage(error)}`,
        { level: 'error' },
      )
      // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // payload读取`ev.payload` 整理出中间结果，供SSETransport后续步骤使用。
    const payload = ev.payload
    // 当 `payload && typeof payload` 匹配 `'object' && 'type'` 时，SSETransport执行对应分支。
    if (payload && typeof payload === 'object' && 'type' in payload) {
      // sessionLabel 会话数据保存`this.sessionId ? ` session=${this.sessionId}` : ''`，供后续判断或组装使用。
      const sessionLabel = this.sessionId ? ` session=${this.sessionId}` : ''
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Event seq=${ev.sequence_num} event_id=${ev.event_id} event_type=${ev.event_type} payload_type=${String(payload.type)}${sessionLabel}`,
      )
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('info', 'cli_sse_message_received')
      // Pass the unwrapped payload as newline-delimited JSON,
      // matching the format that StructuredIO/WebSocketTransport consumers expect
      // 调用 this.onData?.(jsonStringify(payload) + '\n')，完成这一处局部操作。
      this.onData?.(jsonStringify(payload) + '\n')
    } else {
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Ignoring client_event with no type in payload: event_id=${ev.event_id}`,
      )
    }

    // 调用 this.onEventCallback?.(ev)，完成这一处局部操作。
    this.onEventCallback?.(ev)
  }

  /**
   * Handle connection errors with exponential backoff and time budget.
   */
  // SSETransport在这里处理 `private handleConnectionError(): void {`，完成这一小步状态转换。
  private handleConnectionError(): void {
    // 调用 this.clearLivenessTimer，触发SSETransport此处需要的副作用。
    this.clearLivenessTimer()

    // 当 `this.state` 匹配 `'closing' || this.state ===...` 时，SSETransport执行对应分支。
    if (this.state === 'closing' || this.state === 'closed') return

    // Abort any in-flight SSE fetch
    // 调用 this.abortController?.abort()，完成这一处局部操作。
    this.abortController?.abort()
    // 更新实例字段 abortController 为 null，同步SSETransport的内部状态。
    this.abortController = null

    // now记录时间`Date.now`，供SSETransport后续处理使用。
    const now = Date.now()
    // this.reconnectStartTime缺失时提前走兜底路径，避免SSETransport继续依赖无效输入。
    if (!this.reconnectStartTime) {
      // 更新实例字段 reconnectStartTime 为 now，同步SSETransport的内部状态。
      this.reconnectStartTime = now
    }

    // elapsed保存`now - this.reconnectStartTime`，供SSETransport后续判断或输出使用。
    const elapsed = now - this.reconnectStartTime
    // 满足 `elapsed < RECONNECT_GIVE_UP_MS` 时，SSETransport执行该分支。
    if (elapsed < RECONNECT_GIVE_UP_MS) {
      // Clear any existing timer
      // 满足 `this.reconnectTimer` 时，SSETransport执行该分支。
      if (this.reconnectTimer) {
        // 调用 clearTimeout，触发SSETransport此处需要的副作用。
        clearTimeout(this.reconnectTimer)
        // 更新实例字段 reconnectTimer 为 null，同步SSETransport的内部状态。
        this.reconnectTimer = null
      }

      // Refresh headers before reconnecting
      // 满足 `this.refreshHeaders` 时，SSETransport执行该分支。
      if (this.refreshHeaders) {
        // freshHeaders 集合保存`this.refreshHeaders`，供SSETransport后续处理使用。
        const freshHeaders = this.refreshHeaders()
        // 调用 Object.assign，触发SSETransport此处需要的副作用。
        Object.assign(this.headers, freshHeaders)
        // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
        logForDebugging('SSETransport: Refreshed headers for reconnect')
      }

      // 更新实例字段 state 为 'reconnecting'，同步SSETransport的内部状态。
      this.state = 'reconnecting'
      // SSETransport在这里处理 `this.reconnectAttempts++`，完成这一小步状态转换。
      this.reconnectAttempts++

      // baseDelay保存`Math.min`，供SSETransport后续处理使用。
      const baseDelay = Math.min(
        RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
        RECONNECT_MAX_DELAY_MS,
      )
      // Add ±25% jitter
      // delay保存`Math.max`，供SSETransport后续处理使用。
      const delay = Math.max(
        0,
        baseDelay + baseDelay * 0.25 * (2 * Math.random() - 1),
      )

      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}, ${Math.round(elapsed / 1000)}s elapsed)`,
      )
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_sse_reconnect_attempt', {
        reconnectAttempts: this.reconnectAttempts,
      })

      // 更新实例字段 reconnectTimer 为 setTimeout(() => {，同步SSETransport的内部状态。
      this.reconnectTimer = setTimeout(() => {
        // 更新实例字段 reconnectTimer 为 null，同步SSETransport的内部状态。
        this.reconnectTimer = null
        // 显式忽略 `this.connect()` 的返回值，只保留它触发的副作用。
        void this.connect()
      }, delay)
    } else {
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `SSETransport: Reconnection time budget exhausted after ${Math.round(elapsed / 1000)}s`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_sse_reconnect_exhausted', {
        reconnectAttempts: this.reconnectAttempts,
        elapsedMs: elapsed,
      })
      // 更新实例字段 state 为 'closed'，同步SSETransport的内部状态。
      this.state = 'closed'
      // 调用 this.onCloseCallback?.()，完成这一处局部操作。
      this.onCloseCallback?.()
    }
  }

  /**
   * Bound timeout callback. Hoisted from an inline closure so that
   * resetLivenessTimer (called per-frame) does not allocate a new closure
   * on every SSE frame.
   */
  // 这个回调绑定到 private readonly onLivenessTimeout = (): void => {，负责SSETransport在该局部场景下的响应。
  private readonly onLivenessTimeout = (): void => {
    // 更新实例字段 livenessTimer 为 null，同步SSETransport的内部状态。
    this.livenessTimer = null
    // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
    logForDebugging('SSETransport: Liveness timeout, reconnecting', {
      level: 'error',
    })
    // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
    logForDiagnosticsNoPII('error', 'cli_sse_liveness_timeout')
    // 调用 this.abortController?.abort()，完成这一处局部操作。
    this.abortController?.abort()
    // 调用 this.handleConnectionError，触发SSETransport此处需要的副作用。
    this.handleConnectionError()
  }

  /**
   * Reset the liveness timer. If no SSE frame arrives within the timeout,
   * treat the connection as dead and reconnect.
   */
  // SSETransport在这里处理 `private resetLivenessTimer(): void {`，完成这一小步状态转换。
  private resetLivenessTimer(): void {
    // 调用 this.clearLivenessTimer，触发SSETransport此处需要的副作用。
    this.clearLivenessTimer()
    // 更新实例字段 livenessTimer 为 setTimeout(this.onLivenessTimeout, LIVENESS_TIMEOUT_MS)，同步SSETransport的内部状态。
    this.livenessTimer = setTimeout(this.onLivenessTimeout, LIVENESS_TIMEOUT_MS)
  }

  // SSETransport在这里处理 `private clearLivenessTimer(): void {`，完成这一小步状态转换。
  private clearLivenessTimer(): void {
    // 满足 `this.livenessTimer` 时，SSETransport执行该分支。
    if (this.livenessTimer) {
      // 调用 clearTimeout，触发SSETransport此处需要的副作用。
      clearTimeout(this.livenessTimer)
      // 更新实例字段 livenessTimer 为 null，同步SSETransport的内部状态。
      this.livenessTimer = null
    }
  }

  // -----------------------------------------------------------------------
  // Write (HTTP POST) — same pattern as HybridTransport
  // -----------------------------------------------------------------------

  // write 使用 message: StdoutMessage 完成SSETransport里的对应操作。
  async write(message: StdoutMessage): Promise<void> {
    // authHeaders 集合读取`this.getAuthHeaders`，供SSETransport后续处理使用。
    const authHeaders = this.getAuthHeaders()
    // Object.keys(authHeaders)为空时立即返回或跳过，避免SSETransport把空集合当成可处理内容。
    if (Object.keys(authHeaders).length === 0) {
      // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
      logForDebugging('SSETransport: No session token available for POST')
      // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'cli_sse_post_no_token')
      // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 请求头 集中保存SSETransport要一起传递的字段。
    const headers: Record<string, string> = {
      ...authHeaders,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'User-Agent': getClaudeCodeUserAgent(),
    }

    // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `SSETransport: POST body keys=${Object.keys(message as Record<string, unknown>).join(',')}`,
    )

    // 循环处理 `let attempt = 1; attempt <= POST_MAX_RETRIES; att`，让SSETransport逐项把同类条目按顺序走完。
    for (let attempt = 1; attempt <= POST_MAX_RETRIES; attempt++) {
      // 保护这一段可能失败的SSETransport操作，确保异常能进入相邻错误处理。
      try {
        // 接口响应保存`axios.post`，供SSETransport后续处理使用。
        const response = await axios.post(this.postUrl, message, {
          headers,
          validateStatus: alwaysValidStatus,
        })

        // 组合条件 `response.status === 200 || response.status === 201` 成立时，SSETransport才启用这条专门路径。
        if (response.status === 200 || response.status === 201) {
          // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`SSETransport: POST success type=${message.type}`)
          // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `SSETransport: POST ${response.status} body=${jsonStringify(response.data).slice(0, 200)}`,
        )
        // 4xx errors (except 429) are permanent - don't retry
        // SSETransport在这里进入条件判断，后续代码按实际状态分流。
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `SSETransport: POST returned ${response.status} (client error), not retrying`,
          )
          // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
          logForDiagnosticsNoPII('warn', 'cli_sse_post_client_error', {
            status: response.status,
          })
          // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 429 or 5xx - retry
        // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `SSETransport: POST returned ${response.status}, attempt ${attempt}/${POST_MAX_RETRIES}`,
        )
        // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
        logForDiagnosticsNoPII('warn', 'cli_sse_post_retryable_error', {
          status: response.status,
          attempt,
        })
      } catch (error) {
        // axiosError 错误信息保存`error as AxiosError`，供后续判断或组装使用。
        const axiosError = error as AxiosError
        // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `SSETransport: POST error: ${axiosError.message}, attempt ${attempt}/${POST_MAX_RETRIES}`,
        )
        // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
        logForDiagnosticsNoPII('warn', 'cli_sse_post_network_error', {
          attempt,
        })
      }

      // 满足 `attempt === POST_MAX_RETRIES` 时，SSETransport执行该分支。
      if (attempt === POST_MAX_RETRIES) {
        // 记录SSETransport运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `SSETransport: POST failed after ${POST_MAX_RETRIES} attempts, continuing`,
        )
        // 调用 logForDiagnosticsNoPII，触发SSETransport此处需要的副作用。
        logForDiagnosticsNoPII('warn', 'cli_sse_post_retries_exhausted')
        // SSETransport在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // delayMs 集合保存`Math.min`，供SSETransport后续处理使用。
      const delayMs = Math.min(
        POST_BASE_DELAY_MS * Math.pow(2, attempt - 1),
        POST_MAX_DELAY_MS,
      )
      // 等待 `sleep(delayMs)` 完成，再继续SSETransport的异步流程。
      await sleep(delayMs)
    }
  }

  // -----------------------------------------------------------------------
  // Transport interface
  // -----------------------------------------------------------------------

  // isConnectedStatus 用 无 判断SSETransport是否满足条件。
  isConnectedStatus(): boolean {
    // 返回 `this.state === 'connected'`，作为SSETransport这次计算的结果。
    return this.state === 'connected'
  }

  // isClosedStatus 用 无 判断SSETransport是否满足条件。
  isClosedStatus(): boolean {
    // 返回 `this.state === 'closed'`，作为SSETransport这次计算的结果。
    return this.state === 'closed'
  }

  // setOnData 写入新的状态值，使SSETransport后续读取保持一致。
  setOnData(callback: (data: string) => void): void {
    // 更新实例字段 onData 为 callback，同步SSETransport的内部状态。
    this.onData = callback
  }

  // setOnClose 写入新的状态值，使SSETransport后续读取保持一致。
  setOnClose(callback: (closeCode?: number) => void): void {
    // 更新实例字段 onCloseCallback 为 callback，同步SSETransport的内部状态。
    this.onCloseCallback = callback
  }

  // setOnEvent 写入新的状态值，使SSETransport后续读取保持一致。
  setOnEvent(callback: (event: StreamClientEvent) => void): void {
    // 更新实例字段 onEventCallback 为 callback，同步SSETransport的内部状态。
    this.onEventCallback = callback
  }

  // close 使用 无 完成SSETransport里的对应操作。
  close(): void {
    // 满足 `this.reconnectTimer` 时，SSETransport执行该分支。
    if (this.reconnectTimer) {
      // 调用 clearTimeout，触发SSETransport此处需要的副作用。
      clearTimeout(this.reconnectTimer)
      // 更新实例字段 reconnectTimer 为 null，同步SSETransport的内部状态。
      this.reconnectTimer = null
    }
    // 调用 this.clearLivenessTimer，触发SSETransport此处需要的副作用。
    this.clearLivenessTimer()

    // 更新实例字段 state 为 'closing'，同步SSETransport的内部状态。
    this.state = 'closing'
    // 调用 this.abortController?.abort()，完成这一处局部操作。
    this.abortController?.abort()
    // 更新实例字段 abortController 为 null，同步SSETransport的内部状态。
    this.abortController = null
  }
}

// ---------------------------------------------------------------------------
// URL Conversion
// ---------------------------------------------------------------------------

/**
 * Convert an SSE URL to the HTTP POST endpoint URL.
 * The SSE stream URL and POST URL share the same base; the POST endpoint
 * is at `/events` (without `/stream`).
 *
 * From: https://api.example.com/v2/session_ingress/session/<session_id>/events/stream
 * To:   https://api.example.com/v2/session_ingress/session/<session_id>/events
 */
// convertSSEUrlToPostUrl 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertSSEUrlToPostUrl(sseUrl: URL): string {
  // pathname 路径数据保存`sseUrl.pathname`，供后续判断或组装使用。
  let pathname = sseUrl.pathname
  // Remove /stream suffix to get the POST events endpoint
  // 满足 `pathname.endsWith('/stream')` 时，SSETransport执行该分支。
  if (pathname.endsWith('/stream')) {
    // pathname 路径数据更新为 `pathname.slice(0, -'/stream'.length)`，确保CLI后续读取最新状态。
    pathname = pathname.slice(0, -'/stream'.length)
  }
  // 返回 ``${sseUrl.protocol}//${sseUrl.host}${pathname}``，作为SSETransport这次计算的结果。
  return `${sseUrl.protocol}//${sseUrl.host}${pathname}`
}
