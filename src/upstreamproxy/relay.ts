/* eslint-disable eslint-plugin-n/no-unsupported-features/node-builtins */
/**
 * CONNECT-over-WebSocket relay for CCR upstreamproxy.
 *
 * Listens on localhost TCP, accepts HTTP CONNECT from curl/gh/kubectl/etc,
 * and tunnels bytes over WebSocket to the CCR upstreamproxy endpoint.
 * The CCR server-side terminates the tunnel, MITMs TLS, injects org-configured
 * credentials (e.g. DD-API-KEY), and forwards to the real upstream.
 *
 * WHY WebSocket and not raw CONNECT: CCR ingress is GKE L7 with path-prefix
 * routing; there's no connect_matcher in cdk-constructs. The session-ingress
 * tunnel (sessions/tunnel/v1alpha/tunnel.proto) already uses this pattern.
 *
 * Protocol: bytes are wrapped in UpstreamProxyChunk protobuf messages
 * (`message UpstreamProxyChunk { bytes data = 1; }`) for compatibility with
 * gateway.NewWebSocketStreamAdapter on the server side.
 */

// 引入 createServer、Socket as NodeSocket，将 node:net 中已经封装好的能力接到本文件流程里。
import { createServer, type Socket as NodeSocket } from 'node:net'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 getWebSocketTLSOptions 工具函数，把通用处理留在 ../utils/mtls.js 中维护。
import { getWebSocketTLSOptions } from '../utils/mtls.js'
// 复用 getWebSocketProxyAgent、getWebSocketProxyUrl 工具函数，把通用处理留在 ../utils/proxy.js 中维护。
import { getWebSocketProxyAgent, getWebSocketProxyUrl } from '../utils/proxy.js'

// The CCR container runs behind an egress gateway — direct outbound is
// blocked, so the WS upgrade must go through the same HTTP CONNECT proxy
// everything else uses. undici's globalThis.WebSocket does not consult
// the global dispatcher for the upgrade, so under Node we use the ws package
// with an explicit agent (same pattern as SessionsWebSocket). Bun's native
// WebSocket takes a proxy URL directly. Preloaded in startNodeRelay so
// openTunnel stays synchronous and the CONNECT state machine doesn't race.
// WSCtor 固化relay里传递的数据形状，帮助调用方按同一结构读写字段。
type WSCtor = typeof import('ws').default
// nodeWSCtor 先占位，稍后的条件分支会根据实际输入补齐它。
let nodeWSCtor: WSCtor | undefined

// Intersection of the surface openTunnel touches. Both undici's
// globalThis.WebSocket and the ws package satisfy this via property-style
// onX handlers.
// WebSocketLike 固化relay里传递的数据形状，帮助调用方按同一结构读写字段。
type WebSocketLike = Pick<
  WebSocket,
  | 'onopen'
  | 'onmessage'
  | 'onerror'
  | 'onclose'
  | 'send'
  | 'close'
  | 'readyState'
  | 'binaryType'
>

// Envoy per-request buffer cap. Week-1 Datadog payloads won't hit this, but
// design for it so git-push doesn't need a relay rewrite.
// MAX_CHUNK_BYTES 集合 命名 `512 * 1024`，让后续代码直接表达这个值的用途。
const MAX_CHUNK_BYTES = 512 * 1024

// Sidecar idle timeout is 50s; ping well inside that.
// PING_INTERVAL_MS 集合保存`30_000`，供后续判断或组装使用。
const PING_INTERVAL_MS = 30_000

/**
 * Encode an UpstreamProxyChunk protobuf message by hand.
 *
 * For `message UpstreamProxyChunk { bytes data = 1; }` the wire format is:
 *   tag = (field_number << 3) | wire_type = (1 << 3) | 2 = 0x0a
 *   followed by varint length, followed by the bytes.
 *
 * protobufjs would be the general answer; for a single-field bytes message
 * the hand encoding is 10 lines and avoids a runtime dep in the hot path.
 */
// encodeChunk 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function encodeChunk(data: Uint8Array): Uint8Array {
  // len 命名 `data.length`，让后续代码直接表达这个值的用途。
  const len = data.length
  // varint encoding of length — most chunks fit in 1–3 length bytes
  // varint 从空数组开始收集，后续循环会按处理顺序追加条目。
  const varint: number[] = []
  // n 命名 `len`，让后续代码直接表达这个值的用途。
  let n = len
  // while 使用 n > 0x7f 完成relay里的对应操作。
  while (n > 0x7f) {
    // varint追加新条目，保持收集顺序与输入顺序一致。
    varint.push((n & 0x7f) | 0x80)
    // relay在这里处理 `n >>>= 7`，完成这一小步状态转换。
    n >>>= 7
  }
  // varint追加新条目，保持收集顺序与输入顺序一致。
  varint.push(n)
  // out保存`Uint8Array`，供relay后续处理使用。
  const out = new Uint8Array(1 + varint.length + len)
  // out[0更新为 `0x0a`，确保relay后续读取最新状态。
  out[0] = 0x0a
  // out.set 写入新的状态值，使relay后续读取保持一致。
  out.set(varint, 1)
  // out.set 写入新的状态值，使relay后续读取保持一致。
  out.set(data, 1 + varint.length)
  // 返回 `out`，作为relay这次计算的结果。
  return out
}

/**
 * Decode an UpstreamProxyChunk. Returns the data field, or null if malformed.
 * Tolerates the server sending a zero-length chunk (keepalive semantics).
 */
// decodeChunk 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function decodeChunk(buf: Uint8Array): Uint8Array | null {
  // 满足 `buf.length === 0) return new Uint8Array(0` 时，relay执行该分支。
  if (buf.length === 0) return new Uint8Array(0)
  // `buf[0]` 与 `0x0a` 不一致时刷新派生状态，避免使用过期结果。
  if (buf[0] !== 0x0a) return null
  // len保存`0`，供后续判断或组装使用。
  let len = 0
  // shift 命名 `0`，让后续代码直接表达这个值的用途。
  let shift = 0
  // i 命名 `1`，让后续代码直接表达这个值的用途。
  let i = 1
  // while 使用 i < buf.length 完成relay里的对应操作。
  while (i < buf.length) {
    // b保存`buf[i]!`，供relay后续判断或输出使用。
    const b = buf[i]!
    // relay在这里处理 `len |= (b & 0x7f) << shift`，完成这一小步状态转换。
    len |= (b & 0x7f) << shift
    // relay在这里处理 `i++`，完成这一小步状态转换。
    i++
    // 满足 `(b & 0x80) === 0` 时，relay执行该分支。
    if ((b & 0x80) === 0) break
    // relay在这里处理 `shift += 7`，完成这一小步状态转换。
    shift += 7
    // 满足 `shift > 28` 时，relay执行该分支。
    if (shift > 28) return null
  }
  // 满足 `i + len > buf.length` 时，relay执行该分支。
  if (i + len > buf.length) return null
  // 返回 `buf.subarray(i, i + len)`，作为relay这次计算的结果。
  return buf.subarray(i, i + len)
}

// UpstreamProxyRelay 固化relay里传递的数据形状，帮助调用方按同一结构读写字段。
export type UpstreamProxyRelay = {
  port: number
  // 这个回调绑定到 stop: () => void，负责relay在该局部场景下的响应。
  stop: () => void
}

// ConnState 固化relay里传递的数据形状，帮助调用方按同一结构读写字段。
type ConnState = {
  ws?: WebSocketLike
  connectBuf: Buffer
  pinger?: ReturnType<typeof setInterval>
  // Bytes that arrived after the CONNECT header but before ws.onopen fired.
  // TCP can coalesce CONNECT + ClientHello into one packet, and the socket's
  // data callback can fire again while the WS handshake is still in flight.
  // Both cases would silently drop bytes without this buffer.
  pending: Buffer[]
  wsOpen: boolean
  // Set once the server's 200 Connection Established has been forwarded and
  // the tunnel is carrying TLS. After that, writing a plaintext 502 would
  // corrupt the client's TLS stream — just close instead.
  established: boolean
  // WS onerror is always followed by onclose; without a guard the second
  // handler would sock.end() an already-ended socket. First caller wins.
  closed: boolean
}

/**
 * Minimal socket abstraction so the CONNECT parser and WS tunnel plumbing
 * are runtime-agnostic. Implementations handle write backpressure internally:
 * Bun's sock.write() does partial writes and needs explicit tail-queueing;
 * Node's net.Socket buffers unconditionally and never drops bytes.
 */
// ClientSocket 固化relay里传递的数据形状，帮助调用方按同一结构读写字段。
type ClientSocket = {
  // 这个回调绑定到 write: (data: Uint8Array | string) => void，负责relay在该局部场景下的响应。
  write: (data: Uint8Array | string) => void
  // 这个回调绑定到 end: () => void，负责relay在该局部场景下的响应。
  end: () => void
}

// newConnState 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function newConnState(): ConnState {
  // 返回结构化结果，集中表达relay已经整理出的状态。
  return {
    connectBuf: Buffer.alloc(0),
    pending: [],
    wsOpen: false,
    established: false,
    closed: false,
  }
}

/**
 * Start the relay. Returns the ephemeral port it bound and a stop function.
 * Uses Bun.listen when available, otherwise Node's net.createServer — the CCR
 * container runs the CLI under Node, not Bun.
 */
// startUpstreamProxyRelay 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function startUpstreamProxyRelay(opts: {
  wsUrl: string
  sessionId: string
  token: string
}): Promise<UpstreamProxyRelay> {
  // authHeader 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const authHeader =
    'Basic ' + Buffer.from(`${opts.sessionId}:${opts.token}`).toString('base64')
  // WS upgrade itself is auth-gated (proto authn: PRIVATE_API) — the gateway
  // wants the session-ingress JWT on the upgrade request, separate from the
  // Proxy-Authorization that rides inside the tunneled CONNECT.
  // wsAuthHeader保存``Bearer ${opts.token}``，作为后续固定文本处理的输入。
  const wsAuthHeader = `Bearer ${opts.token}`

  // relay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const relay =
    typeof Bun !== 'undefined'
      ? startBunRelay(opts.wsUrl, authHeader, wsAuthHeader)
      : await startNodeRelay(opts.wsUrl, authHeader, wsAuthHeader)

  // 记录relay运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[upstreamproxy] relay listening on 127.0.0.1:${relay.port}`)
  // 返回 `relay`，作为relay这次计算的结果。
  return relay
}

// startBunRelay 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startBunRelay(
  wsUrl: string,
  authHeader: string,
  wsAuthHeader: string,
): UpstreamProxyRelay {
  // Bun TCP sockets don't auto-buffer partial writes: sock.write() returns
  // the byte count actually handed to the kernel, and the remainder is
  // silently dropped. When the kernel buffer fills, we queue the tail and
  // let the drain handler flush it. Per-socket because the adapter closure
  // outlives individual handler calls.
  // BunState 固化relay里传递的数据形状，帮助调用方按同一结构读写字段。
  type BunState = ConnState & { writeBuf: Uint8Array[] }

  // eslint-disable-next-line custom-rules/require-bun-typeof-guard -- caller dispatches on typeof Bun
  // server保存`Bun.listen<BunState>({`，供后续判断或组装使用。
  const server = Bun.listen<BunState>({
    hostname: '127.0.0.1',
    port: 0,
    socket: {
      // open 使用 sock 完成relay里的对应操作。
      open(sock) {
        // data更新为 `{ ...newConnState(), writeBuf: [] }`，确保relay后续读取最新状态。
        sock.data = { ...newConnState(), writeBuf: [] }
      },
      // data 使用 sock, data 完成relay里的对应操作。
      data(sock, data) {
        // st 命名 `sock.data`，让后续代码直接表达这个值的用途。
        const st = sock.data
        // adapter 集中保存relay要一起传递的字段。
        const adapter: ClientSocket = {
          // 这个回调绑定到 write: payload => {，负责relay在该局部场景下的响应。
          write: payload => {
            // bytes 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const bytes =
              typeof payload === 'string'
                ? Buffer.from(payload, 'utf8')
                : payload
            // 满足 `st.writeBuf.length > 0` 时，relay执行该分支。
            if (st.writeBuf.length > 0) {
              // writeBuf追加新条目，保持收集顺序与输入顺序一致。
              st.writeBuf.push(bytes)
              // relay在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // n保存`sock.write`，供relay后续处理使用。
            const n = sock.write(bytes)
            // 满足 `n < bytes.length) st.writeBuf.push(bytes.subarray(n)` 时，relay执行该分支。
            if (n < bytes.length) st.writeBuf.push(bytes.subarray(n))
          },
          // 这个回调绑定到 end: () => sock.end(),，负责relay在该局部场景下的响应。
          end: () => sock.end(),
        }
        // 调用 handleData，触发relay此处需要的副作用。
        handleData(adapter, st, data, wsUrl, authHeader, wsAuthHeader)
      },
      // drain 使用 sock 完成relay里的对应操作。
      drain(sock) {
        // st 命名 `sock.data`，让后续代码直接表达这个值的用途。
        const st = sock.data
        // while 使用 st.writeBuf.length > 0 完成relay里的对应操作。
        while (st.writeBuf.length > 0) {
          // chunk 命名 `st.writeBuf[0]!`，让后续代码直接表达这个值的用途。
          const chunk = st.writeBuf[0]!
          // n保存`sock.write`，供relay后续处理使用。
          const n = sock.write(chunk)
          // 满足 `n < chunk.length` 时，relay执行该分支。
          if (n < chunk.length) {
            // writeBuf[0更新为 `chunk.subarray(n)`，确保relay后续读取最新状态。
            st.writeBuf[0] = chunk.subarray(n)
            // relay在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // 调用 st.writeBuf.shift，触发relay此处需要的副作用。
          st.writeBuf.shift()
        }
      },
      // close 使用 sock 完成relay里的对应操作。
      close(sock) {
        // 调用 cleanupConn，触发relay此处需要的副作用。
        cleanupConn(sock.data)
      },
      // error 使用 sock, err 完成relay里的对应操作。
      error(sock, err) {
        // 记录relay运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[upstreamproxy] client socket error: ${err.message}`)
        // 调用 cleanupConn，触发relay此处需要的副作用。
        cleanupConn(sock.data)
      },
    },
  })

  // 返回结构化结果，集中表达relay已经整理出的状态。
  return {
    port: server.port,
    // 这个回调绑定到 stop: () => server.stop(true),，负责relay在该局部场景下的响应。
    stop: () => server.stop(true),
  }
}

// Exported so tests can exercise the Node path directly — the test runner is
// Bun, so the runtime dispatch in startUpstreamProxyRelay always picks Bun.
// startNodeRelay 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function startNodeRelay(
  wsUrl: string,
  authHeader: string,
  wsAuthHeader: string,
): Promise<UpstreamProxyRelay> {
  // nodeWSCtor更新为 `(await import('ws')).default`，确保relay后续读取最新状态。
  nodeWSCtor = (await import('ws')).default
  // states 状态构建`new WeakMap<NodeSocket, ConnState>()` 整理出中间结果，供relay后续步骤使用。
  const states = new WeakMap<NodeSocket, ConnState>()

  // server构建`createServer`，供relay后续处理使用。
  const server = createServer(sock => {
    // st保存`newConnState`，供relay后续处理使用。
    const st = newConnState()
    // states.set 写入新的状态值，使relay后续读取保持一致。
    states.set(sock, st)
    // Node's sock.write() buffers internally — a false return signals
    // backpressure but the bytes are already queued, so no tail-tracking
    // needed for correctness. Week-1 payloads won't stress the buffer.
    // adapter 集中保存relay要一起传递的字段。
    const adapter: ClientSocket = {
      // 这个回调绑定到 write: payload => {，负责relay在该局部场景下的响应。
      write: payload => {
        // 调用 sock.write，触发relay此处需要的副作用。
        sock.write(typeof payload === 'string' ? payload : Buffer.from(payload))
      },
      // 这个回调绑定到 end: () => sock.end(),，负责relay在该局部场景下的响应。
      end: () => sock.end(),
    }
    // 调用 sock.on，触发relay此处需要的副作用。
    sock.on('data', data =>
      handleData(adapter, st, data, wsUrl, authHeader, wsAuthHeader),
    )
    // 调用 sock.on，触发relay此处需要的副作用。
    sock.on('close', () => cleanupConn(states.get(sock)))
    // 调用 sock.on，触发relay此处需要的副作用。
    sock.on('error', err => {
      // 记录relay运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[upstreamproxy] client socket error: ${err.message}`)
      // 调用 cleanupConn，触发relay此处需要的副作用。
      cleanupConn(states.get(sock))
    })
  })

  // 返回 `new Promise((resolve, reject) => {`，作为relay这次计算的结果。
  return new Promise((resolve, reject) => {
    // 调用 server.once，触发relay此处需要的副作用。
    server.once('error', reject)
    // 调用 server.listen，触发relay此处需要的副作用。
    server.listen(0, '127.0.0.1', () => {
      // addr保存`server.address`，供relay后续处理使用。
      const addr = server.address()
      // 当 `addr === null || typeof addr` 匹配 `'string'` 时，relay执行对应分支。
      if (addr === null || typeof addr === 'string') {
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(new Error('upstreamproxy: server has no TCP address'))
        // relay在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve({
        port: addr.port,
        // 这个回调绑定到 stop: () => server.close(),，负责relay在该局部场景下的响应。
        stop: () => server.close(),
      })
    })
  })
}

/**
 * Shared per-connection data handler. Phase 1 accumulates the CONNECT request;
 * phase 2 forwards client bytes over the WS tunnel.
 */
// handleData 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleData(
  sock: ClientSocket,
  st: ConnState,
  data: Buffer,
  wsUrl: string,
  authHeader: string,
  wsAuthHeader: string,
): void {
  // Phase 1: accumulate until we've seen the full CONNECT request
  // (terminated by CRLF CRLF). curl/gh send this in one packet, but
  // don't assume that.
  // st.ws 集合缺失时提前走兜底路径，避免relay继续依赖无效输入。
  if (!st.ws) {
    // connectBuf更新为 `Buffer.concat([st.connectBuf, data])`，确保relay后续读取最新状态。
    st.connectBuf = Buffer.concat([st.connectBuf, data])
    // headerEnd保存`connectBuf.indexOf`，供relay后续处理使用。
    const headerEnd = st.connectBuf.indexOf('\r\n\r\n')
    // 满足 `headerEnd === -1` 时，relay执行该分支。
    if (headerEnd === -1) {
      // Guard against a client that never sends CRLFCRLF.
      // 满足 `st.connectBuf.length > 8192` 时，relay执行该分支。
      if (st.connectBuf.length > 8192) {
        // 调用 sock.write，触发relay此处需要的副作用。
        sock.write('HTTP/1.1 400 Bad Request\r\n\r\n')
        // 调用 sock.end，触发relay此处需要的副作用。
        sock.end()
      }
      // relay在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // reqHead保存`connectBuf.subarray`，供relay后续处理使用。
    const reqHead = st.connectBuf.subarray(0, headerEnd).toString('utf8')
    // firstLine格式化`reqHead.split`，供relay后续处理使用。
    const firstLine = reqHead.split('\r\n')[0] ?? ''
    // m匹配`firstLine.match`，供relay后续处理使用。
    const m = firstLine.match(/^CONNECT\s+(\S+)\s+HTTP\/1\.[01]$/i)
    // m缺失时提前走兜底路径，避免relay继续依赖无效输入。
    if (!m) {
      // 调用 sock.write，触发relay此处需要的副作用。
      sock.write('HTTP/1.1 405 Method Not Allowed\r\n\r\n')
      // 调用 sock.end，触发relay此处需要的副作用。
      sock.end()
      // relay在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Stash any bytes that arrived after the CONNECT header so
    // openTunnel can flush them once the WS is open.
    // trailing保存`connectBuf.subarray`，供relay后续处理使用。
    const trailing = st.connectBuf.subarray(headerEnd + 4)
    // 满足 `trailing.length > 0` 时，relay执行该分支。
    if (trailing.length > 0) {
      // pending追加新条目，保持收集顺序与输入顺序一致。
      st.pending.push(Buffer.from(trailing))
    }
    // connectBuf更新为 `Buffer.alloc(0)`，确保relay后续读取最新状态。
    st.connectBuf = Buffer.alloc(0)
    // 调用 openTunnel，触发relay此处需要的副作用。
    openTunnel(sock, st, firstLine, wsUrl, authHeader, wsAuthHeader)
    // relay在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Phase 2: WS exists. If it isn't OPEN yet, buffer; ws.onopen will
  // flush. Once open, pump client bytes to WS in chunks.
  // st.wsOpen缺失时提前走兜底路径，避免relay继续依赖无效输入。
  if (!st.wsOpen) {
    // pending追加新条目，保持收集顺序与输入顺序一致。
    st.pending.push(Buffer.from(data))
    // relay在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 调用 forwardToWs，触发relay此处需要的副作用。
  forwardToWs(st.ws, data)
}

// openTunnel 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function openTunnel(
  sock: ClientSocket,
  st: ConnState,
  connectLine: string,
  wsUrl: string,
  authHeader: string,
  wsAuthHeader: string,
): void {
  // core/websocket/stream.go picks JSON vs binary-proto from the upgrade
  // request's Content-Type header (defaults to JSON). Without application/proto
  // the server protojson.Unmarshals our hand-encoded binary chunks and fails
  // silently with EOF.
  // 请求头 集中保存relay要一起传递的字段。
  const headers = {
    'Content-Type': 'application/proto',
    Authorization: wsAuthHeader,
  }
  // ws 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let ws: WebSocketLike
  // 满足 `nodeWSCtor` 时，relay执行该分支。
  if (nodeWSCtor) {
    // ws 集合更新为 `new nodeWSCtor(wsUrl, {`，确保relay后续读取最新状态。
    ws = new nodeWSCtor(wsUrl, {
      headers,
      agent: getWebSocketProxyAgent(wsUrl),
      ...getWebSocketTLSOptions(),
    }) as unknown as WebSocketLike
  } else {
    // ws 集合更新为 `new globalThis.WebSocket(wsUrl, {`，确保relay后续读取最新状态。
    ws = new globalThis.WebSocket(wsUrl, {
      // @ts-expect-error — Bun extension; not in lib.dom WebSocket types
      headers,
      proxy: getWebSocketProxyUrl(wsUrl),
      tls: getWebSocketTLSOptions() || undefined,
    })
  }
  // binaryType更新为 `'arraybuffer'`，确保relay后续读取最新状态。
  ws.binaryType = 'arraybuffer'
  // ws 集合更新为 `ws`，确保relay后续读取最新状态。
  st.ws = ws

  // onopen更新为 `() => {`，确保relay后续读取最新状态。
  ws.onopen = () => {
    // First chunk carries the CONNECT line plus Proxy-Authorization so the
    // server can auth the tunnel and know the target host:port. Server
    // responds with its own "HTTP/1.1 200" over the tunnel; we just pipe it.
    // head 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const head =
      `${connectLine}\r\n` + `Proxy-Authorization: ${authHeader}\r\n` + `\r\n`
    // 调用 ws.send，触发relay此处需要的副作用。
    ws.send(encodeChunk(Buffer.from(head, 'utf8')))
    // Flush anything that arrived while the WS handshake was in flight —
    // trailing bytes from the CONNECT packet and any data() callbacks that
    // fired before onopen.
    // wsOpen更新为 `true`，确保relay后续读取最新状态。
    st.wsOpen = true
    // 按顺序遍历 `st.pending` 中的buf，逐个交给relay处理。
    for (const buf of st.pending) {
      // 调用 forwardToWs，触发relay此处需要的副作用。
      forwardToWs(ws, buf)
    }
    // pending更新为 `[]`，确保relay后续读取最新状态。
    st.pending = []
    // Not all WS implementations expose ping(); empty chunk works as an
    // application-level keepalive the server can ignore.
    // pinger更新为 `setInterval(sendKeepalive, PING_INTERVAL_MS, ws)`，确保relay后续读取最新状态。
    st.pinger = setInterval(sendKeepalive, PING_INTERVAL_MS, ws)
  }

  // onmessage 消息数据更新为 `ev => {`，确保relay后续读取最新状态。
  ws.onmessage = ev => {
    // raw 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const raw =
      ev.data instanceof ArrayBuffer
        ? new Uint8Array(ev.data)
        : new Uint8Array(Buffer.from(ev.data))
    // payload保存`decodeChunk`，供relay后续处理使用。
    const payload = decodeChunk(raw)
    // 组合条件 `payload && payload.length > 0` 成立时，relay才启用这条专门路径。
    if (payload && payload.length > 0) {
      // established更新为 `true`，确保relay后续读取最新状态。
      st.established = true
      // 调用 sock.write，触发relay此处需要的副作用。
      sock.write(payload)
    }
  }

  // onerror 错误信息更新为 `ev => {`，确保relay后续读取最新状态。
  ws.onerror = ev => {
    // 消息保存`String`，供relay后续处理使用。
    const msg = 'message' in ev ? String(ev.message) : 'websocket error'
    // 记录relay运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[upstreamproxy] ws error: ${msg}`)
    // 满足 `st.closed` 时，relay执行该分支。
    if (st.closed) return
    // closed更新为 `true`，确保relay后续读取最新状态。
    st.closed = true
    // st.established缺失时提前走兜底路径，避免relay继续依赖无效输入。
    if (!st.established) {
      // 调用 sock.write，触发relay此处需要的副作用。
      sock.write('HTTP/1.1 502 Bad Gateway\r\n\r\n')
    }
    // 调用 sock.end，触发relay此处需要的副作用。
    sock.end()
    // 调用 cleanupConn，触发relay此处需要的副作用。
    cleanupConn(st)
  }

  // onclose更新为 `() => {`，确保relay后续读取最新状态。
  ws.onclose = () => {
    // 满足 `st.closed` 时，relay执行该分支。
    if (st.closed) return
    // closed更新为 `true`，确保relay后续读取最新状态。
    st.closed = true
    // 调用 sock.end，触发relay此处需要的副作用。
    sock.end()
    // 调用 cleanupConn，触发relay此处需要的副作用。
    cleanupConn(st)
  }
}

// sendKeepalive 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sendKeepalive(ws: WebSocketLike): void {
  // 满足 `ws.readyState === WebSocket.OPEN` 时，relay执行该分支。
  if (ws.readyState === WebSocket.OPEN) {
    // 调用 ws.send，触发relay此处需要的副作用。
    ws.send(encodeChunk(new Uint8Array(0)))
  }
}

// forwardToWs 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function forwardToWs(ws: WebSocketLike, data: Buffer): void {
  // `ws.readyState` 与 `WebSocket.OPEN` 不一致时刷新派生状态，避免使用过期结果。
  if (ws.readyState !== WebSocket.OPEN) return
  // 循环处理 `let off = 0; off < data.length; off += MAX_CHUNK_`，让relay逐项把同类条目按顺序走完。
  for (let off = 0; off < data.length; off += MAX_CHUNK_BYTES) {
    // slice保存`data.subarray`，供relay后续处理使用。
    const slice = data.subarray(off, off + MAX_CHUNK_BYTES)
    // 调用 ws.send，触发relay此处需要的副作用。
    ws.send(encodeChunk(slice))
  }
}

// cleanupConn 封装relay的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cleanupConn(st: ConnState | undefined): void {
  // st缺失时提前走兜底路径，避免relay继续依赖无效输入。
  if (!st) return
  // 满足 `st.pinger) clearInterval(st.pinger` 时，relay执行该分支。
  if (st.pinger) clearInterval(st.pinger)
  // 组合条件 `st.ws && st.ws.readyState <= WebSocket.OPEN` 成立时，relay才启用这条专门路径。
  if (st.ws && st.ws.readyState <= WebSocket.OPEN) {
    // 保护这一段可能失败的relay操作，确保异常能进入相邻错误处理。
    try {
      // 调用 st.ws.close，触发relay此处需要的副作用。
      st.ws.close()
    } catch {
      // already closing
    }
  }
  // ws 集合更新为 `undefined`，确保relay后续读取最新状态。
  st.ws = undefined
}
