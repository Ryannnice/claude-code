// 类型依赖 { StdoutMessage } 来自 src/entrypoints/sdk/controlTypes.js，用于校准远程桥接会话的数据契约。
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'
// 引入 CCRClient，将 ../cli/transports/ccrClient.js 中已经封装好的能力接到本文件流程里。
import { CCRClient } from '../cli/transports/ccrClient.js'
// 类型依赖 { HybridTransport } 来自 ../cli/transports/HybridTransport.js，用于校准远程桥接会话的数据契约。
import type { HybridTransport } from '../cli/transports/HybridTransport.js'
// 引入 SSETransport，将 ../cli/transports/SSETransport.js 中已经封装好的能力接到本文件流程里。
import { SSETransport } from '../cli/transports/SSETransport.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 updateSessionIngressAuthToken 工具函数，把通用处理留在 ../utils/sessionIngressAuth.js 中维护。
import { updateSessionIngressAuthToken } from '../utils/sessionIngressAuth.js'
// 类型依赖 { SessionState } 来自 ../utils/sessionState.js，用于校准远程桥接会话的数据契约。
import type { SessionState } from '../utils/sessionState.js'
// 引入 registerWorker，将 ./workSecret.js 中已经封装好的能力接到本文件流程里。
import { registerWorker } from './workSecret.js'

/**
 * Transport abstraction for replBridge. Covers exactly the surface that
 * replBridge.ts uses against HybridTransport so the v1/v2 choice is
 * confined to the construction site.
 *
 * - v1: HybridTransport (WS reads + POST writes to Session-Ingress)
 * - v2: SSETransport (reads) + CCRClient (writes to CCR v2 /worker/*)
 *
 * The v2 write path goes through CCRClient.writeEvent → SerialBatchEventUploader,
 * NOT through SSETransport.write() — SSETransport.write() targets the
 * Session-Ingress POST URL shape, which is wrong for CCR v2.
 */
// ReplBridgeTransport 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReplBridgeTransport = {
  write(message: StdoutMessage): Promise<void>
  writeBatch(messages: StdoutMessage[]): Promise<void>
  close(): void
  isConnectedStatus(): boolean
  // getStateLabel不依赖额外参数，直接计算远程桥接会话需要的结果。
  getStateLabel(): string
  // setOnData 写入新的状态值，使远程桥接会话后续读取保持一致。
  setOnData(callback: (data: string) => void): void
  // setOnClose 写入新的状态值，使远程桥接会话后续读取保持一致。
  setOnClose(callback: (closeCode?: number) => void): void
  // setOnConnect 写入新的状态值，使远程桥接会话后续读取保持一致。
  setOnConnect(callback: () => void): void
  // connect 使用 无 完成远程桥接会话里的对应操作。
  connect(): void
  /**
   * High-water mark of the underlying read stream's event sequence numbers.
   * replBridge reads this before swapping transports so the new one can
   * resume from where the old one left off (otherwise the server replays
   * the entire session history from seq 0).
   *
   * v1 returns 0 — Session-Ingress WS doesn't use SSE sequence numbers;
   * replay-on-reconnect is handled by the server-side message cursor.
   */
  // getLastSequenceNum不依赖额外参数，直接计算远程桥接会话需要的结果。
  getLastSequenceNum(): number
  /**
   * Monotonic count of batches dropped via maxConsecutiveFailures.
   * Snapshot before writeBatch() and compare after to detect silent drops
   * (writeBatch() resolves normally even when batches were dropped).
   * v2 returns 0 — the v2 write path doesn't set maxConsecutiveFailures.
   */
  readonly droppedBatchCount: number
  /**
   * PUT /worker state (v2 only; v1 is a no-op). `requires_action` tells
   * the backend a permission prompt is pending — claude.ai shows the
   * "waiting for input" indicator. REPL/daemon callers don't need this
   * (user watches the REPL locally); multi-session worker callers do.
   */
  // reportState 使用 state: SessionState 完成远程桥接会话里的对应操作。
  reportState(state: SessionState): void
  /** PUT /worker external_metadata (v2 only; v1 is a no-op). */
  // reportMetadata 使用 metadata: Record<string, unknown> 完成远程桥接会话里的对应操作。
  reportMetadata(metadata: Record<string, unknown>): void
  /**
   * POST /worker/events/{id}/delivery (v2 only; v1 is a no-op). Populates
   * CCR's processing_at/processed_at columns. `received` is auto-fired by
   * CCRClient on every SSE frame and is not exposed here.
   */
  // reportDelivery 使用 eventId: string, status: 'processing' | 'processe… 完成远程桥接会话里的对应操作。
  reportDelivery(eventId: string, status: 'processing' | 'processed'): void
  /**
   * Drain the write queue before close() (v2 only; v1 resolves
   * immediately — HybridTransport POSTs are already awaited per-write).
   */
  // flush 使用 无 完成远程桥接会话里的对应操作。
  flush(): Promise<void>
}

/**
 * v1 adapter: HybridTransport already has the full surface (it extends
 * WebSocketTransport which has setOnConnect + getStateLabel). This is a
 * no-op wrapper that exists only so replBridge's `transport` variable
 * has a single type.
 */
// createV1ReplTransport 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createV1ReplTransport(
  hybrid: HybridTransport,
): ReplBridgeTransport {
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    // 这个回调绑定到 write: msg => hybrid.write(msg),，负责远程桥接会话在该局部场景下的响应。
    write: msg => hybrid.write(msg),
    // 这个回调绑定到 writeBatch: msgs => hybrid.writeBatch(msgs),，负责远程桥接会话在该局部场景下的响应。
    writeBatch: msgs => hybrid.writeBatch(msgs),
    // 这个回调绑定到 close: () => hybrid.close(),，负责远程桥接会话在该局部场景下的响应。
    close: () => hybrid.close(),
    // 这个回调绑定到 isConnectedStatus: () => hybrid.isConnectedStatus(),，负责远程桥接会话在该局部场景下的响应。
    isConnectedStatus: () => hybrid.isConnectedStatus(),
    // 这个回调绑定到 getStateLabel: () => hybrid.getStateLabel(),，负责远程桥接会话在该局部场景下的响应。
    getStateLabel: () => hybrid.getStateLabel(),
    // 这个回调绑定到 setOnData: cb => hybrid.setOnData(cb),，负责远程桥接会话在该局部场景下的响应。
    setOnData: cb => hybrid.setOnData(cb),
    // 这个回调绑定到 setOnClose: cb => hybrid.setOnClose(cb),，负责远程桥接会话在该局部场景下的响应。
    setOnClose: cb => hybrid.setOnClose(cb),
    // 这个回调绑定到 setOnConnect: cb => hybrid.setOnConnect(cb),，负责远程桥接会话在该局部场景下的响应。
    setOnConnect: cb => hybrid.setOnConnect(cb),
    // 这个回调绑定到 connect: () => void hybrid.connect(),，负责远程桥接会话在该局部场景下的响应。
    connect: () => void hybrid.connect(),
    // v1 Session-Ingress WS doesn't use SSE sequence numbers; replay
    // semantics are different. Always return 0 so the seq-num carryover
    // logic in replBridge is a no-op for v1.
    // 这个回调绑定到 getLastSequenceNum: () => 0,，负责远程桥接会话在该局部场景下的响应。
    getLastSequenceNum: () => 0,
    // 远程桥接 repl Bridge Transport在这里处理 `get droppedBatchCount() {`，完成这一小步状态转换。
    get droppedBatchCount() {
      // 返回 `hybrid.droppedBatchCount`，作为远程桥接会话这次计算的结果。
      return hybrid.droppedBatchCount
    },
    // 这个回调绑定到 reportState: () => {},，负责远程桥接会话在该局部场景下的响应。
    reportState: () => {},
    // 这个回调绑定到 reportMetadata: () => {},，负责远程桥接会话在该局部场景下的响应。
    reportMetadata: () => {},
    // 这个回调绑定到 reportDelivery: () => {},，负责远程桥接会话在该局部场景下的响应。
    reportDelivery: () => {},
    // 这个回调绑定到 flush: () => Promise.resolve(),，负责远程桥接会话在该局部场景下的响应。
    flush: () => Promise.resolve(),
  }
}

/**
 * v2 adapter: wrap SSETransport (reads) + CCRClient (writes, heartbeat,
 * state, delivery tracking).
 *
 * Auth: v2 endpoints validate the JWT's session_id claim (register_worker.go:32)
 * and worker role (environment_auth.py:856). OAuth tokens have neither.
 * This is the inverse of the v1 replBridge path, which deliberately uses OAuth.
 * The JWT is refreshed when the poll loop re-dispatches work — the caller
 * invokes createV2ReplTransport again with the fresh token.
 *
 * Registration happens here (not in the caller) so the entire v2 handshake
 * is one async step. registerWorker failure propagates — replBridge will
 * catch it and stay on the poll loop.
 */
// createV2ReplTransport 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createV2ReplTransport(opts: {
  sessionUrl: string
  ingressToken: string
  sessionId: string
  /**
   * SSE sequence-number high-water mark from the previous transport.
   * Passed to the new SSETransport so its first connect() sends
   * from_sequence_num / Last-Event-ID and the server resumes from where
   * the old stream left off. Without this, every transport swap asks the
   * server to replay the entire session history from seq 0.
   */
  initialSequenceNum?: number
  /**
   * Worker epoch from POST /bridge response. When provided, the server
   * already bumped epoch (the /bridge call IS the register — see server
   * PR #293280). When omitted (v1 CCR-v2 path via replBridge.ts poll loop),
   * call registerWorker as before.
   */
  epoch?: number
  /** CCRClient heartbeat interval. Defaults to 20s when omitted. */
  heartbeatIntervalMs?: number
  /** ±fraction per-beat jitter. Defaults to 0 (no jitter) when omitted. */
  heartbeatJitterFraction?: number
  /**
   * When true, skip opening the SSE read stream — only the CCRClient write
   * path is activated. Use for mirror-mode attachments that forward events
   * but never receive inbound prompts or control requests.
   */
  outboundOnly?: boolean
  /**
   * Per-instance auth header source. When provided, CCRClient + SSETransport
   * read auth from this closure instead of the process-wide
   * CLAUDE_CODE_SESSION_ACCESS_TOKEN env var. Required for callers managing
   * multiple concurrent sessions — the env-var path stomps across sessions.
   * When omitted, falls back to the env var (single-session callers).
   */
  // 这个回调绑定到 getAuthToken?: () => string | undefined，负责远程桥接会话在该局部场景下的响应。
  getAuthToken?: () => string | undefined
}): Promise<ReplBridgeTransport> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    sessionUrl,
    ingressToken,
    sessionId,
    initialSequenceNum,
    getAuthToken,
  } = opts

  // Auth header builder. If getAuthToken is provided, read from it
  // (per-instance, multi-session safe). Otherwise write ingressToken to
  // the process-wide env var (legacy single-session path — CCRClient's
  // default getAuthHeaders reads it via getSessionIngressAuthHeaders).
  // 这个回调绑定到 let getAuthHeaders: (() => Record<string, string>) | undefined，负责远程桥接会话在该局部场景下的响应。
  let getAuthHeaders: (() => Record<string, string>) | undefined
  // 满足 `getAuthToken` 时，远程桥接会话执行该分支。
  if (getAuthToken) {
    // getAuthHeaders 集合更新为 `(): Record<string, string> => {`，确保Bridge 通信后续读取最新状态。
    getAuthHeaders = (): Record<string, string> => {
      // token读取`getAuthToken`，供远程桥接会话后续处理使用。
      const token = getAuthToken()
      // token缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!token) return {}
      // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
      return { Authorization: `Bearer ${token}` }
    }
  } else {
    // CCRClient.request() and SSETransport.connect() both read auth via
    // getSessionIngressAuthHeaders() → this env var. Set it before either
    // touches the network.
    // 调用 updateSessionIngressAuthToken，触发远程桥接会话此处需要的副作用。
    updateSessionIngressAuthToken(ingressToken)
  }

  // epoch保存`registerWorker`，供远程桥接会话后续处理使用。
  const epoch = opts.epoch ?? (await registerWorker(sessionUrl, ingressToken))
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:repl] CCR v2: worker sessionId=${sessionId} epoch=${epoch}${opts.epoch !== undefined ? ' (from /bridge)' : ' (via registerWorker)'}`,
  )

  // Derive SSE stream URL. Same logic as transportUtils.ts:26-33 but
  // starting from an http(s) base instead of a --sdk-url that might be ws://.
  // sseUrl保存`URL`，供远程桥接会话后续处理使用。
  const sseUrl = new URL(sessionUrl)
  // pathname 路径数据更新为 `sseUrl.pathname.replace(/\/$/, '') + '/worker/events/stre...`，确保Bridge 通信后续读取最新状态。
  sseUrl.pathname = sseUrl.pathname.replace(/\/$/, '') + '/worker/events/stream'

  // sse保存`SSETransport`，供远程桥接会话后续处理使用。
  const sse = new SSETransport(
    sseUrl,
    {},
    sessionId,
    undefined,
    initialSequenceNum,
    getAuthHeaders,
  )
  // 这个回调绑定到 let onCloseCb: ((closeCode?: number) => void) | undefined，负责远程桥接会话在该局部场景下的响应。
  let onCloseCb: ((closeCode?: number) => void) | undefined
  // ccr保存`CCRClient`，供远程桥接会话后续处理使用。
  const ccr = new CCRClient(sse, new URL(sessionUrl), {
    getAuthHeaders,
    heartbeatIntervalMs: opts.heartbeatIntervalMs,
    heartbeatJitterFraction: opts.heartbeatJitterFraction,
    // Default is process.exit(1) — correct for spawn-mode children. In-process,
    // that kills the REPL. Close instead: replBridge's onClose wakes the poll
    // loop, which picks up the server's re-dispatch (with fresh epoch).
    // 这个回调绑定到 onEpochMismatch: () => {，负责远程桥接会话在该局部场景下的响应。
    onEpochMismatch: () => {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] CCR v2: epoch superseded (409) — closing for poll-loop recovery',
      )
      // Close resources in a try block so the throw always executes.
      // If ccr.close() or sse.close() throw, we still need to unwind
      // the caller (request()) — otherwise handleEpochMismatch's `never`
      // return type is violated at runtime and control falls through.
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // 调用 ccr.close，触发远程桥接会话此处需要的副作用。
        ccr.close()
        // 调用 sse.close，触发远程桥接会话此处需要的副作用。
        sse.close()
        // 调用 onCloseCb?.(4090)，完成这一处局部操作。
        onCloseCb?.(4090)
      } catch (closeErr: unknown) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] CCR v2: error during epoch-mismatch cleanup: ${errorMessage(closeErr)}`,
          { level: 'error' },
        )
      }
      // Don't return — the calling request() code continues after the 409
      // branch, so callers see the logged warning and a false return. We
      // throw to unwind; the uploaders catch it as a send failure.
      // 抛出 new Error('epoch superseded')，阻止远程桥接会话在无效状态下继续运行。
      throw new Error('epoch superseded')
    },
  })

  // CCRClient's constructor wired sse.setOnEvent → reportDelivery('received').
  // remoteIO.ts additionally sends 'processing'/'processed' via
  // setCommandLifecycleListener, which the in-process query loop fires. This
  // transport's only caller (replBridge/daemonBridge) has no such wiring — the
  // daemon's agent child is a separate process (ProcessTransport), and its
  // notifyCommandLifecycle calls fire with listener=null in its own module
  // scope. So events stay at 'received' forever, and reconnectSession re-queues
  // them on every daemon restart (observed: 21→24→25 phantom prompts as
  // "user sent a new message while you were working" system-reminders).
  //
  // Fix: ACK 'processed' immediately alongside 'received'. The window between
  // SSE receipt and transcript-write is narrow (queue → SDK → child stdin →
  // model); a crash there loses one prompt vs. the observed N-prompt flood on
  // every restart. Overwrite the constructor's wiring to do both — setOnEvent
  // replaces, not appends (SSETransport.ts:658).
  // sse.setOnEvent 写入新的状态值，使远程桥接会话后续读取保持一致。
  sse.setOnEvent(event => {
    // 调用 ccr.reportDelivery，触发远程桥接会话此处需要的副作用。
    ccr.reportDelivery(event.event_id, 'received')
    // 调用 ccr.reportDelivery，触发远程桥接会话此处需要的副作用。
    ccr.reportDelivery(event.event_id, 'processed')
  })

  // Both sse.connect() and ccr.initialize() are deferred to connect() below.
  // replBridge's calling order is newTransport → setOnConnect → setOnData →
  // setOnClose → connect(), and both calls need those callbacks wired first:
  // sse.connect() opens the stream (events flow to onData/onClose immediately),
  // and ccr.initialize().then() fires onConnectCb.
  //
  // onConnect fires once ccr.initialize() resolves. Writes go via
  // CCRClient HTTP POST (SerialBatchEventUploader), not SSE, so the
  // write path is ready the moment workerEpoch is set. SSE.connect()
  // awaits its read loop and never resolves — don't gate on it.
  // The SSE stream opens in parallel (~30ms) and starts delivering
  // inbound events via setOnData; outbound doesn't need to wait for it.
  // 这个回调绑定到 let onConnectCb: (() => void) | undefined，负责远程桥接会话在该局部场景下的响应。
  let onConnectCb: (() => void) | undefined
  // ccrInitialized标记远程桥接会话远程桥接 repl Bridge Transport是否启用对应路径。
  let ccrInitialized = false
  // closed标记远程桥接会话远程桥接 repl Bridge Transport是否启用对应路径。
  let closed = false

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    // write 使用 msg 完成远程桥接会话里的对应操作。
    write(msg) {
      // 返回 `ccr.writeEvent(msg)`，作为远程桥接会话这次计算的结果。
      return ccr.writeEvent(msg)
    },
    // writeBatch 使用 msgs 完成远程桥接会话里的对应操作。
    async writeBatch(msgs) {
      // SerialBatchEventUploader already batches internally (maxBatchSize=100);
      // sequential enqueue preserves order and the uploader coalesces.
      // Check closed between writes to avoid sending partial batches after
      // transport teardown (epoch mismatch, SSE drop).
      // 按顺序遍历 `msgs` 中的m，逐个交给远程桥接会话处理。
      for (const m of msgs) {
        // 满足 `closed` 时，远程桥接会话执行该分支。
        if (closed) break
        // 等待 `ccr.writeEvent(m)` 完成，再继续远程桥接 repl Bridge Transport的异步流程。
        await ccr.writeEvent(m)
      }
    },
    // close 使用 无 完成远程桥接会话里的对应操作。
    close() {
      // closed更新为 `true`，确保Bridge 通信后续读取最新状态。
      closed = true
      // 调用 ccr.close，触发远程桥接会话此处需要的副作用。
      ccr.close()
      // 调用 sse.close，触发远程桥接会话此处需要的副作用。
      sse.close()
    },
    // isConnectedStatus 用 无 判断远程桥接会话是否满足条件。
    isConnectedStatus() {
      // Write-readiness, not read-readiness — replBridge checks this
      // before calling writeBatch. SSE open state is orthogonal.
      // 返回 `ccrInitialized`，作为远程桥接会话这次计算的结果。
      return ccrInitialized
    },
    // getStateLabel不依赖额外参数，直接计算远程桥接会话需要的结果。
    getStateLabel() {
      // SSETransport doesn't expose its state string; synthesize from
      // what we can observe. replBridge only uses this for debug logging.
      // 满足 `sse.isClosedStatus()` 时，远程桥接会话执行该分支。
      if (sse.isClosedStatus()) return 'closed'
      // 满足 `sse.isConnectedStatus()` 时，远程桥接会话执行该分支。
      if (sse.isConnectedStatus()) return ccrInitialized ? 'connected' : 'init'
      // 返回 `'connecting'`，作为远程桥接会话这次计算的结果。
      return 'connecting'
    },
    // setOnData 根据 cb 更新远程桥接会话的状态。
    setOnData(cb) {
      // sse.setOnData 写入新的状态值，使远程桥接会话后续读取保持一致。
      sse.setOnData(cb)
    },
    // setOnClose 根据 cb 更新远程桥接会话的状态。
    setOnClose(cb) {
      // onCloseCb更新为 `cb`，确保Bridge 通信后续读取最新状态。
      onCloseCb = cb
      // SSE reconnect-budget exhaustion fires onClose(undefined) — map to
      // 4092 so ws_closed telemetry can distinguish it from HTTP-status
      // closes (SSETransport:280 passes response.status). Stop CCRClient's
      // heartbeat timer before notifying replBridge. (sse.close() doesn't
      // invoke this, so the epoch-mismatch path above isn't double-firing.)
      // sse.setOnClose 写入新的状态值，使远程桥接会话后续读取保持一致。
      sse.setOnClose(code => {
        // 调用 ccr.close，触发远程桥接会话此处需要的副作用。
        ccr.close()
        // 调用 cb，触发远程桥接会话此处需要的副作用。
        cb(code ?? 4092)
      })
    },
    // setOnConnect 根据 cb 更新远程桥接会话的状态。
    setOnConnect(cb) {
      // onConnectCb更新为 `cb`，确保Bridge 通信后续读取最新状态。
      onConnectCb = cb
    },
    // getLastSequenceNum不依赖额外参数，直接计算远程桥接会话需要的结果。
    getLastSequenceNum() {
      // 返回 `sse.getLastSequenceNum()`，作为远程桥接会话这次计算的结果。
      return sse.getLastSequenceNum()
    },
    // v2 write path (CCRClient) doesn't set maxConsecutiveFailures — no drops.
    droppedBatchCount: 0,
    // reportState 使用 state 完成远程桥接会话里的对应操作。
    reportState(state) {
      // 调用 ccr.reportState，触发远程桥接会话此处需要的副作用。
      ccr.reportState(state)
    },
    // reportMetadata 使用 metadata 完成远程桥接会话里的对应操作。
    reportMetadata(metadata) {
      // 调用 ccr.reportMetadata，触发远程桥接会话此处需要的副作用。
      ccr.reportMetadata(metadata)
    },
    // reportDelivery 使用 eventId, status 完成远程桥接会话里的对应操作。
    reportDelivery(eventId, status) {
      // 调用 ccr.reportDelivery，触发远程桥接会话此处需要的副作用。
      ccr.reportDelivery(eventId, status)
    },
    // flush 使用 无 完成远程桥接会话里的对应操作。
    flush() {
      // 返回 `ccr.flush()`，作为远程桥接会话这次计算的结果。
      return ccr.flush()
    },
    // connect 使用 无 完成远程桥接会话里的对应操作。
    connect() {
      // Outbound-only: skip the SSE read stream entirely — no inbound
      // events to receive, no delivery ACKs to send. Only the CCRClient
      // write path (POST /worker/events) and heartbeat are needed.
      // opts.outboundOnly缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!opts.outboundOnly) {
        // Fire-and-forget — SSETransport.connect() awaits readStream()
        // (the read loop) and only resolves on stream close/error. The
        // spawn-mode path in remoteIO.ts does the same void discard.
        // 显式忽略 `sse.connect()` 的返回值，只保留它触发的副作用。
        void sse.connect()
      }
      // 显式忽略 `ccr.initialize(epoch).then(` 的返回值，只保留它触发的副作用。
      void ccr.initialize(epoch).then(
        // 这个回调绑定到 () => {，负责远程桥接会话在该局部场景下的响应。
        () => {
          // ccrInitialized更新为 `true`，确保Bridge 通信后续读取最新状态。
          ccrInitialized = true
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:repl] v2 transport ready for writes (epoch=${epoch}, sse=${sse.isConnectedStatus() ? 'open' : 'opening'})`,
          )
          // 调用 onConnectCb?.()，完成这一处局部操作。
          onConnectCb?.()
        },
        // 这个回调绑定到 (err: unknown) => {，负责远程桥接会话在该局部场景下的响应。
        (err: unknown) => {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:repl] CCR v2 initialize failed: ${errorMessage(err)}`,
            { level: 'error' },
          )
          // Close transport resources and notify replBridge via onClose
          // so the poll loop can retry on the next work dispatch.
          // Without this callback, replBridge never learns the transport
          // failed to initialize and sits with transport === null forever.
          // 调用 ccr.close，触发远程桥接会话此处需要的副作用。
          ccr.close()
          // 调用 sse.close，触发远程桥接会话此处需要的副作用。
          sse.close()
          // 调用 onCloseCb?.(4091) // 4091 = init failure, distinguishable from 4090 epoch mismatch，完成这一处局部操作。
          onCloseCb?.(4091) // 4091 = init failure, distinguishable from 4090 epoch mismatch
        },
      )
    },
  }
}
