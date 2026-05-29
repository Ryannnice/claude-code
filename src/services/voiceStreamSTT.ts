// Anthropic voice_stream speech-to-text client for push-to-talk.
//
// Only reachable in ant builds (gated by feature('VOICE_MODE') in useVoice.ts import).
//
// Connects to Anthropic's voice_stream WebSocket endpoint using the same
// OAuth credentials as Claude Code.  The endpoint uses conversation_engine
// backed models for speech-to-text.  Designed for hold-to-talk: hold the
// keybinding to record, release to stop and submit.
//
// The wire protocol uses JSON control messages (KeepAlive, CloseStream) and
// binary audio frames.  The server responds with TranscriptText and
// TranscriptEndpoint JSON messages.

// 类型依赖 { ClientRequest, IncomingMessage } 来自 http，用于校准服务层 voice Stream STT的数据契约。
import type { ClientRequest, IncomingMessage } from 'http'
// 引入 WebSocket，将 ws 中已经封装好的能力接到本文件流程里。
import WebSocket from 'ws'
// 引入 getOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../constants/oauth.js'
// 整理这一组导入，让服务层 voice Stream STT后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
  isAnthropicAuthEnabled,
} from '../utils/auth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 getUserAgent 工具函数，把通用处理留在 ../utils/http.js 中维护。
import { getUserAgent } from '../utils/http.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 getWebSocketTLSOptions 工具函数，把通用处理留在 ../utils/mtls.js 中维护。
import { getWebSocketTLSOptions } from '../utils/mtls.js'
// 复用 getWebSocketProxyAgent、getWebSocketProxyUrl 工具函数，把通用处理留在 ../utils/proxy.js 中维护。
import { getWebSocketProxyAgent, getWebSocketProxyUrl } from '../utils/proxy.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'

// KEEPALIVE_MSG固定为 `'{"type":"KeepAlive"}'`，作为服务层 voice Stream STT后续展示或比较的基准。
const KEEPALIVE_MSG = '{"type":"KeepAlive"}'
// CLOSE_STREAM_MSG 命名 `'{"type":"CloseStream"}'`，让后续代码直接表达这个值的用途。
const CLOSE_STREAM_MSG = '{"type":"CloseStream"}'

// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ./analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from './analytics/growthbook.js'

// ─── Constants ───────────────────────────────────────────────────────

// VOICE_STREAM_PATH 路径数据固定为 `'/api/ws/speech_to_text/voice_stream'`，作为服务层 voice Stream STT后续展示或比较的基准。
const VOICE_STREAM_PATH = '/api/ws/speech_to_text/voice_stream'

// KEEPALIVE_INTERVAL_MS 集合 命名 `8_000`，让后续代码直接表达这个值的用途。
const KEEPALIVE_INTERVAL_MS = 8_000

// finalize() resolution timers. `noData` fires when no TranscriptText
// arrives post-CloseStream — the server has nothing; don't wait out the
// full ~3-5s WS teardown to confirm emptiness. `safety` is the last-
// resort cap if the WS hangs. Exported so tests can shorten them.
// FINALIZE_TIMEOUTS_MS 集合 集中保存服务层 voice Stream STT要一起传递的字段。
export const FINALIZE_TIMEOUTS_MS = {
  safety: 5_000,
  noData: 1_500,
}

// ─── Types ──────────────────────────────────────────────────────────

// VoiceStreamCallbacks 固化服务层 voice Stream STT里传递的数据形状，帮助调用方按同一结构读写字段。
export type VoiceStreamCallbacks = {
  // 这个回调绑定到 onTranscript: (text: string, isFinal: boolean) => void，负责服务层 voice Stream STT在该局部场景下的响应。
  onTranscript: (text: string, isFinal: boolean) => void
  // 这个回调绑定到 onError: (error: string, opts?: { fatal?: boolean }) => void，负责服务层 voice Stream STT在该局部场景下的响应。
  onError: (error: string, opts?: { fatal?: boolean }) => void
  // 这个回调绑定到 onClose: () => void，负责服务层 voice Stream STT在该局部场景下的响应。
  onClose: () => void
  // 这个回调绑定到 onReady: (connection: VoiceStreamConnection) => void，负责服务层 voice Stream STT在该局部场景下的响应。
  onReady: (connection: VoiceStreamConnection) => void
}

// How finalize() resolved. `no_data_timeout` means zero server messages
// after CloseStream — the silent-drop signature (anthropics/anthropic#287008).
// FinalizeSource 固化服务层 voice Stream STT里传递的数据形状，帮助调用方按同一结构读写字段。
export type FinalizeSource =
  | 'post_closestream_endpoint'
  | 'no_data_timeout'
  | 'safety_timeout'
  | 'ws_close'
  | 'ws_already_closed'

// VoiceStreamConnection 固化服务层 voice Stream STT里传递的数据形状，帮助调用方按同一结构读写字段。
export type VoiceStreamConnection = {
  // 这个回调绑定到 send: (audioChunk: Buffer) => void，负责服务层 voice Stream STT在该局部场景下的响应。
  send: (audioChunk: Buffer) => void
  // 这个回调绑定到 finalize: () => Promise<FinalizeSource>，负责服务层 voice Stream STT在该局部场景下的响应。
  finalize: () => Promise<FinalizeSource>
  // 这个回调绑定到 close: () => void，负责服务层 voice Stream STT在该局部场景下的响应。
  close: () => void
  // 这个回调绑定到 isConnected: () => boolean，负责服务层 voice Stream STT在该局部场景下的响应。
  isConnected: () => boolean
}

// The voice_stream endpoint returns transcript chunks and endpoint markers.
// VoiceStreamTranscriptText 固化服务层 voice Stream STT里传递的数据形状，帮助调用方按同一结构读写字段。
type VoiceStreamTranscriptText = {
  type: 'TranscriptText'
  data: string
}

// VoiceStreamTranscriptEndpoint 固化服务层 voice Stream STT里传递的数据形状，帮助调用方按同一结构读写字段。
type VoiceStreamTranscriptEndpoint = {
  type: 'TranscriptEndpoint'
}

// VoiceStreamTranscriptError 固化服务层 voice Stream STT里传递的数据形状，帮助调用方按同一结构读写字段。
type VoiceStreamTranscriptError = {
  type: 'TranscriptError'
  error_code?: string
  description?: string
}

// VoiceStreamMessage 固化服务层 voice Stream STT里传递的数据形状，帮助调用方按同一结构读写字段。
type VoiceStreamMessage =
  | VoiceStreamTranscriptText
  | VoiceStreamTranscriptEndpoint
  | VoiceStreamTranscriptError
  | { type: 'error'; message?: string }

// ─── Availability ──────────────────────────────────────────────────────

// isVoiceStreamAvailable 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isVoiceStreamAvailable(): boolean {
  // voice_stream uses the same OAuth as Claude Code — available when the
  // user is authenticated with Anthropic (Claude.ai subscriber or has
  // valid OAuth tokens).
  // 满足 `!isAnthropicAuthEnabled()` 时，服务层 voice Stream STT执行该分支。
  if (!isAnthropicAuthEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // token 列表读取`getClaudeAIOAuthTokens`，供服务层 voice Stream STT后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // 返回 `tokens !== null && tokens.accessToken !== null`，作为服务层 voice Stream STT这次计算的结果。
  return tokens !== null && tokens.accessToken !== null
}

// ─── Connection ────────────────────────────────────────────────────────

// connectVoiceStream 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function connectVoiceStream(
  callbacks: VoiceStreamCallbacks,
  options?: { language?: string; keyterms?: string[] },
): Promise<VoiceStreamConnection | null> {
  // Ensure OAuth token is fresh before connecting
  // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 voice Stream STT的异步流程。
  await checkAndRefreshOAuthTokenIfNeeded()

  // token 列表读取`getClaudeAIOAuthTokens`，供服务层 voice Stream STT后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // 满足 `!tokens?.accessToken` 时，服务层 voice Stream STT执行该分支。
  if (!tokens?.accessToken) {
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[voice_stream] No OAuth token available')
    // 返回 `null`，作为服务层 voice Stream STT这次计算的结果。
    return null
  }

  // voice_stream is a private_api route, but /api/ws/ is also exposed on
  // the api.anthropic.com listener (service_definitions.yaml private-api:
  // visibility.external: true). We target that host instead of claude.ai
  // because the claude.ai CF zone uses TLS fingerprinting and challenges
  // non-browser clients (anthropics/claude-code#34094). Same private-api
  // pod, same OAuth Bearer auth — just a CF zone that doesn't block us.
  // Desktop dictation still uses claude.ai (Swift URLSession has a
  // browser-class JA3 fingerprint, so CF lets it through).
  // wsBaseUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const wsBaseUrl =
    process.env.VOICE_STREAM_BASE_URL ||
    getOauthConfig()
      .BASE_API_URL.replace('https://', 'wss://')
      .replace('http://', 'ws://')

  // 满足 `process.env.VOICE_STREAM_BASE_URL` 时，服务层 voice Stream STT执行该分支。
  if (process.env.VOICE_STREAM_BASE_URL) {
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[voice_stream] Using VOICE_STREAM_BASE_URL override: ${process.env.VOICE_STREAM_BASE_URL}`,
    )
  }

  // params 集合保存`URLSearchParams`，供服务层 voice Stream STT后续处理使用。
  const params = new URLSearchParams({
    encoding: 'linear16',
    sample_rate: '16000',
    channels: '1',
    endpointing_ms: '300',
    utterance_end_ms: '1000',
    language: options?.language ?? 'en',
  })

  // Route through conversation-engine with Deepgram Nova 3 (bypassing
  // the server's project_bell_v2_config GrowthBook gate). The server
  // side is anthropics/anthropic#278327 + #281372; this lets us ramp
  // clients independently.
  // isNova3记录 `getFeatureValue_CACHED_MAY_BE_STALE` 是否成立，服务层 voice Stream STT随后按该结果分支。
  const isNova3 = getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_cobalt_frost',
    false,
  )
  // 满足 `isNova3` 时，服务层 voice Stream STT执行该分支。
  if (isNova3) {
    // params.set 写入新的状态值，使服务层 voice Stream STT后续读取保持一致。
    params.set('use_conversation_engine', 'true')
    // params.set 写入新的状态值，使服务层 voice Stream STT后续读取保持一致。
    params.set('stt_provider', 'deepgram-nova3')
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[voice_stream] Nova 3 gate enabled (tengu_cobalt_frost)')
  }

  // Append keyterms as query params — the voice_stream proxy forwards
  // these to the STT service which applies appropriate boosting.
  // 满足 `options?.keyterms?.length` 时，服务层 voice Stream STT执行该分支。
  if (options?.keyterms?.length) {
    // 按顺序遍历 `options.keyterms` 中的term，逐个交给服务层 voice Stream STT处理。
    for (const term of options.keyterms) {
      // 调用 params.append，触发服务层 voice Stream STT此处需要的副作用。
      params.append('keyterms', term)
    }
  }

  // URL格式化`params.toString`，供服务层 voice Stream STT后续处理使用。
  const url = `${wsBaseUrl}${VOICE_STREAM_PATH}?${params.toString()}`

  // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[voice_stream] Connecting to ${url}`)

  // 请求头 集中保存服务层 voice Stream STT要一起传递的字段。
  const headers: Record<string, string> = {
    Authorization: `Bearer ${tokens.accessToken}`,
    'User-Agent': getUserAgent(),
    'x-app': 'cli',
  }

  // tlsOptions 集合读取`getWebSocketTLSOptions`，供服务层 voice Stream STT后续处理使用。
  const tlsOptions = getWebSocketTLSOptions()
  // wsOptions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const wsOptions =
    typeof Bun !== 'undefined'
      ? {
          headers,
          proxy: getWebSocketProxyUrl(url),
          tls: tlsOptions || undefined,
        }
      : { headers, agent: getWebSocketProxyAgent(url), ...tlsOptions }

  // ws 集合保存`WebSocket`，供服务层 voice Stream STT后续处理使用。
  const ws = new WebSocket(url, wsOptions)

  // keepaliveTimer初始化为空值，后续分支会在有数据时补齐。
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null
  // connected标记服务层 voice Stream STT是否启用对应路径。
  let connected = false
  // Set to true once CloseStream has been sent (or the ws is closed).
  // After this, further audio sends are dropped.
  // finalized标记服务层 voice Stream STT是否启用对应路径。
  let finalized = false
  // Set to true when finalize() is first called, to prevent double-fire.
  // finalizing标记服务层 voice Stream STT是否启用对应路径。
  let finalizing = false
  // Set when the HTTP upgrade was rejected (unexpected-response). The
  // close event that follows (1006 from our req.destroy()) is just
  // mechanical teardown; the upgrade handler already reported the error.
  // upgradeRejected标记服务层 voice Stream STT是否启用对应路径。
  let upgradeRejected = false
  // Resolves finalize(). Four triggers: TranscriptEndpoint post-CloseStream
  // (~300ms); no-data timer (1.5s); WS close (~3-5s); safety timer (5s).
  // 这个回调绑定到 let resolveFinalize: ((source: FinalizeSource) => void) | null = null，负责服务层 voice Stream STT在该局部场景下的响应。
  let resolveFinalize: ((source: FinalizeSource) => void) | null = null
  // 这个回调绑定到 let cancelNoDataTimer: (() => void) | null = null，负责服务层 voice Stream STT在该局部场景下的响应。
  let cancelNoDataTimer: (() => void) | null = null

  // Define the connection object before event handlers so it can be passed
  // to onReady when the WebSocket opens.
  // connection 集中保存服务层 voice Stream STT要一起传递的字段。
  const connection: VoiceStreamConnection = {
    // send 使用 audioChunk: Buffer 完成服务层 voice Stream STT里的对应操作。
    send(audioChunk: Buffer): void {
      // `ws.readyState` 与 `WebSocket.OPEN` 不一致时刷新派生状态，避免使用过期结果。
      if (ws.readyState !== WebSocket.OPEN) {
        // 服务层 voice Stream STT在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 满足 `finalized` 时，服务层 voice Stream STT执行该分支。
      if (finalized) {
        // After CloseStream has been sent, the server rejects further audio.
        // Drop the chunk to avoid a protocol error.
        // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[voice_stream] Dropping audio chunk after CloseStream: ${String(audioChunk.length)} bytes`,
        )
        // 服务层 voice Stream STT在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[voice_stream] Sending audio chunk: ${String(audioChunk.length)} bytes`,
      )
      // Copy the buffer before sending: NAPI Buffer objects from native
      // modules may share a pooled ArrayBuffer.  Creating a view with
      // `new Uint8Array(buf.buffer, offset, len)` can reference stale or
      // overlapping memory by the time the ws library reads it.
      // `Buffer.from()` makes an owned copy that the ws library can safely
      // consume as a binary WebSocket frame.
      // 调用 ws.send，触发服务层 voice Stream STT此处需要的副作用。
      ws.send(Buffer.from(audioChunk))
    },
    // finalize 使用 无 完成服务层 voice Stream STT里的对应操作。
    finalize(): Promise<FinalizeSource> {
      // 组合条件 `finalizing || finalized` 成立时，服务层 voice Stream STT才启用这条专门路径。
      if (finalizing || finalized) {
        // Already finalized or WebSocket already closed — resolve immediately.
        // 返回 `Promise.resolve('ws_already_closed')`，作为服务层 voice Stream STT这次计算的结果。
        return Promise.resolve('ws_already_closed')
      }
      // finalizing更新为 `true`，确保服务层后续读取最新状态。
      finalizing = true

      // 返回 `new Promise<FinalizeSource>(resolve => {`，作为服务层 voice Stream STT这次计算的结果。
      return new Promise<FinalizeSource>(resolve => {
        // safetyTimer保存`setTimeout`，供服务层 voice Stream STT后续处理使用。
        const safetyTimer = setTimeout(
          // 这个回调绑定到 () => resolveFinalize?.('safety_timeout'),，负责服务层 voice Stream STT在该局部场景下的响应。
          () => resolveFinalize?.('safety_timeout'),
          FINALIZE_TIMEOUTS_MS.safety,
        )
        // noDataTimer保存`setTimeout`，供服务层 voice Stream STT后续处理使用。
        const noDataTimer = setTimeout(
          // 这个回调绑定到 () => resolveFinalize?.('no_data_timeout'),，负责服务层 voice Stream STT在该局部场景下的响应。
          () => resolveFinalize?.('no_data_timeout'),
          FINALIZE_TIMEOUTS_MS.noData,
        )
        // cancelNoDataTimer更新为 `() => {`，确保服务层后续读取最新状态。
        cancelNoDataTimer = () => {
          // 调用 clearTimeout，触发服务层 voice Stream STT此处需要的副作用。
          clearTimeout(noDataTimer)
          // cancelNoDataTimer更新为 `null`，确保服务层后续读取最新状态。
          cancelNoDataTimer = null
        }

        // resolveFinalize更新为 `(source: FinalizeSource) => {`，确保服务层后续读取最新状态。
        resolveFinalize = (source: FinalizeSource) => {
          // 调用 clearTimeout，触发服务层 voice Stream STT此处需要的副作用。
          clearTimeout(safetyTimer)
          // 调用 clearTimeout，触发服务层 voice Stream STT此处需要的副作用。
          clearTimeout(noDataTimer)
          // resolveFinalize更新为 `null`，确保服务层后续读取最新状态。
          resolveFinalize = null
          // cancelNoDataTimer更新为 `null`，确保服务层后续读取最新状态。
          cancelNoDataTimer = null
          // Legacy Deepgram can leave an interim in lastTranscriptText
          // with no TranscriptEndpoint (websocket_manager.py sends
          // TranscriptChunk and TranscriptEndpoint as independent
          // channel items). All resolve triggers must promote it;
          // centralize here. No-op when the close handler already did.
          // 满足 `lastTranscriptText` 时，服务层 voice Stream STT执行该分支。
          if (lastTranscriptText) {
            // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[voice_stream] Promoting unreported interim before ${source} resolve`,
            )
            // t保存`lastTranscriptText`，供服务层 voice Stream STT后续判断或输出使用。
            const t = lastTranscriptText
            // lastTranscriptText更新为 `''`，确保服务层后续读取最新状态。
            lastTranscriptText = ''
            // 调用 callbacks.onTranscript，触发服务层 voice Stream STT此处需要的副作用。
            callbacks.onTranscript(t, true)
          }
          // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`[voice_stream] Finalize resolved via ${source}`)
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve(source)
        }

        // If the WebSocket is already closed, resolve immediately.
        // 服务层 voice Stream STT在这里进入条件判断，后续代码按实际状态分流。
        if (
          ws.readyState === WebSocket.CLOSED ||
          ws.readyState === WebSocket.CLOSING
        ) {
          // resolveFinalize 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolveFinalize('ws_already_closed')
          // 服务层 voice Stream STT在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Defer CloseStream to the next event-loop iteration so any audio
        // callbacks already queued by the native recording module are flushed
        // to the WebSocket before the server is told to stop accepting audio.
        // Without this, stopRecording() can return synchronously while the
        // native module still has a pending onData callback in the event queue,
        // causing audio to arrive after CloseStream.
        // setTimeout 写入新的状态值，使服务层 voice Stream STT后续读取保持一致。
        setTimeout(() => {
          // finalized更新为 `true`，确保服务层后续读取最新状态。
          finalized = true
          // 满足 `ws.readyState === WebSocket.OPEN` 时，服务层 voice Stream STT执行该分支。
          if (ws.readyState === WebSocket.OPEN) {
            // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
            logForDebugging('[voice_stream] Sending CloseStream (finalize)')
            // 调用 ws.send，触发服务层 voice Stream STT此处需要的副作用。
            ws.send(CLOSE_STREAM_MSG)
          }
        }, 0)
      })
    },
    // close 使用 无 完成服务层 voice Stream STT里的对应操作。
    close(): void {
      // finalized更新为 `true`，确保服务层后续读取最新状态。
      finalized = true
      // 满足 `keepaliveTimer` 时，服务层 voice Stream STT执行该分支。
      if (keepaliveTimer) {
        // 调用 clearInterval，触发服务层 voice Stream STT此处需要的副作用。
        clearInterval(keepaliveTimer)
        // keepaliveTimer更新为 `null`，确保服务层后续读取最新状态。
        keepaliveTimer = null
      }
      // connected更新为 `false`，确保服务层后续读取最新状态。
      connected = false
      // 满足 `ws.readyState === WebSocket.OPEN` 时，服务层 voice Stream STT执行该分支。
      if (ws.readyState === WebSocket.OPEN) {
        // 调用 ws.close，触发服务层 voice Stream STT此处需要的副作用。
        ws.close()
      }
    },
    // isConnected 用 无 判断服务层 voice Stream STT是否满足条件。
    isConnected(): boolean {
      // 返回 `connected && ws.readyState === WebSocket.OPEN`，作为服务层 voice Stream STT这次计算的结果。
      return connected && ws.readyState === WebSocket.OPEN
    },
  }

  // 调用 ws.on，触发服务层 voice Stream STT此处需要的副作用。
  ws.on('open', () => {
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[voice_stream] WebSocket connected')
    // connected更新为 `true`，确保服务层后续读取最新状态。
    connected = true

    // Send an immediate KeepAlive so the server knows the client is active.
    // Audio hardware initialisation can take >1s, so this prevents the
    // server from closing the connection before audio capture starts.
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[voice_stream] Sending initial KeepAlive')
    // 调用 ws.send，触发服务层 voice Stream STT此处需要的副作用。
    ws.send(KEEPALIVE_MSG)

    // Send periodic keepalive to prevent idle timeout
    // keepaliveTimer更新为 `setInterval(`，确保服务层后续读取最新状态。
    keepaliveTimer = setInterval(
      // ws 集合更新为 `> {`，确保服务层后续读取最新状态。
      ws => {
        // 满足 `ws.readyState === WebSocket.OPEN` 时，服务层 voice Stream STT执行该分支。
        if (ws.readyState === WebSocket.OPEN) {
          // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
          logForDebugging('[voice_stream] Sending periodic KeepAlive')
          // 调用 ws.send，触发服务层 voice Stream STT此处需要的副作用。
          ws.send(KEEPALIVE_MSG)
        }
      },
      KEEPALIVE_INTERVAL_MS,
      ws,
    )

    // Pass the connection to the caller so it can start sending audio.
    // This fires only after the WebSocket is truly open, guaranteeing
    // that send() calls will not be silently dropped.
    // 调用 callbacks.onReady，触发服务层 voice Stream STT此处需要的副作用。
    callbacks.onReady(connection)
  })

  // Track the last TranscriptText so that when TranscriptEndpoint arrives
  // we can emit it as the final transcript.  The server sometimes sends
  // multiple non-cumulative TranscriptText messages without endpoints
  // between them; the TranscriptText handler auto-finalizes previous
  // segments when it detects the text has changed non-cumulatively.
  // lastTranscriptText保存`''`，作为后续固定文本处理的输入。
  let lastTranscriptText = ''

  // 调用 ws.on，触发服务层 voice Stream STT此处需要的副作用。
  ws.on('message', (raw: Buffer | string) => {
    // 文本格式化`raw.toString`，供服务层 voice Stream STT后续处理使用。
    const text = raw.toString()
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[voice_stream] Message received (${String(text.length)} chars): ${text.slice(0, 200)}`,
    )
    // 消息 先占位，稍后的条件分支会根据实际输入补齐它。
    let msg: VoiceStreamMessage
    // 保护这一段可能失败的服务层 voice Stream STT操作，确保异常能进入相邻错误处理。
    try {
      // 消息更新为 `jsonParse(text) as VoiceStreamMessage`，确保服务层后续读取最新状态。
      msg = jsonParse(text) as VoiceStreamMessage
    } catch {
      // 服务层 voice Stream STT在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 按照 msg.type 的取值选择服务层 voice Stream STT的具体处理分支。
    switch (msg.type) {
      case 'TranscriptText': {
        // transcript 命名 `msg.data`，让后续代码直接表达这个值的用途。
        const transcript = msg.data
        // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[voice_stream] TranscriptText: "${transcript ?? ''}"`)
        // Data arrived after CloseStream — disarm the no-data timer so
        // a slow-but-real flush isn't cut off. Only disarm once finalized
        // (CloseStream sent); pre-CloseStream data racing the deferred
        // send would cancel the timer prematurely, falling back to the
        // slower 5s safety timeout instead of the 1.5s no-data timer.
        // 满足 `finalized` 时，服务层 voice Stream STT执行该分支。
        if (finalized) {
          // 调用 cancelNoDataTimer?.()，完成这一处局部操作。
          cancelNoDataTimer?.()
        }
        // 满足 `transcript` 时，服务层 voice Stream STT执行该分支。
        if (transcript) {
          // Detect when the server has moved to a new speech segment.
          // Progressive refinements extend or shorten the previous text
          // (e.g., "hello" → "hello world", or "hello wor" → "hello wo").
          // A new segment starts with completely different text (neither
          // is a prefix of the other). When detected, emit the previous
          // text as final so the caller can accumulate it, preventing
          // the new segment from overwriting and losing the old one.
          //
          // Nova 3's interims are cumulative across segments AND can
          // revise earlier text ("Hello?" → "Hello."). Revision breaks
          // the prefix check, causing false auto-finalize → the same
          // text committed once AND re-appearing in the cumulative
          // interim = duplication. Nova 3 only endpoints on the final
          // flush, so auto-finalize is never correct for it.
          // 组合条件 `!isNova3 && lastTranscriptText` 成立时，服务层 voice Stream STT才启用这条专门路径。
          if (!isNova3 && lastTranscriptText) {
            // prev格式化`lastTranscriptText.trimStart`，供服务层 voice Stream STT后续处理使用。
            const prev = lastTranscriptText.trimStart()
            // next格式化`transcript.trimStart`，供服务层 voice Stream STT后续处理使用。
            const next = transcript.trimStart()
            // 服务层 voice Stream STT在这里进入条件判断，后续代码按实际状态分流。
            if (
              prev &&
              next &&
              !next.startsWith(prev) &&
              !prev.startsWith(next)
            ) {
              // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[voice_stream] Auto-finalizing previous segment (new segment detected): "${lastTranscriptText}"`,
              )
              // 调用 callbacks.onTranscript，触发服务层 voice Stream STT此处需要的副作用。
              callbacks.onTranscript(lastTranscriptText, true)
            }
          }
          // lastTranscriptText更新为 `transcript`，确保服务层后续读取最新状态。
          lastTranscriptText = transcript
          // Emit as interim so the caller can show a live preview.
          // 调用 callbacks.onTranscript，触发服务层 voice Stream STT此处需要的副作用。
          callbacks.onTranscript(transcript, false)
        }
        // 结束这个分支或循环，避免服务层 voice Stream STT继续落入后续路径。
        break
      }
      case 'TranscriptEndpoint': {
        // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[voice_stream] TranscriptEndpoint received, lastTranscriptText="${lastTranscriptText}"`,
        )
        // The server signals the end of an utterance.  Emit the last
        // TranscriptText as a final transcript so the caller can commit it.
        // finalText保存`lastTranscriptText`，供服务层 voice Stream STT后续判断或输出使用。
        const finalText = lastTranscriptText
        // lastTranscriptText更新为 `''`，确保服务层后续读取最新状态。
        lastTranscriptText = ''
        // 满足 `finalText` 时，服务层 voice Stream STT执行该分支。
        if (finalText) {
          // 调用 callbacks.onTranscript，触发服务层 voice Stream STT此处需要的副作用。
          callbacks.onTranscript(finalText, true)
        }
        // When TranscriptEndpoint arrives after CloseStream was sent,
        // the server has flushed its final transcript — nothing more is
        // coming.  Resolve finalize now so the caller reads the
        // accumulated buffer immediately (~300ms) instead of waiting
        // for the WebSocket close event (~3-5s of server teardown).
        // `finalized` (not `finalizing`) is the right gate: it flips
        // inside the setTimeout(0) that actually sends CloseStream, so
        // a TranscriptEndpoint that races the deferred send still waits.
        // 满足 `finalized` 时，服务层 voice Stream STT执行该分支。
        if (finalized) {
          // 调用 resolveFinalize?.('post_closestream_endpoint')，完成这一处局部操作。
          resolveFinalize?.('post_closestream_endpoint')
        }
        // 结束这个分支或循环，避免服务层 voice Stream STT继续落入后续路径。
        break
      }
      case 'TranscriptError': {
        // desc 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const desc =
          msg.description ?? msg.error_code ?? 'unknown transcription error'
        // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[voice_stream] TranscriptError: ${desc}`)
        // finalizing缺失时提前走兜底路径，避免服务层 voice Stream STT继续依赖无效输入。
        if (!finalizing) {
          // 调用 callbacks.onError，触发服务层 voice Stream STT此处需要的副作用。
          callbacks.onError(desc)
        }
        // 结束这个分支或循环，避免服务层 voice Stream STT继续落入后续路径。
        break
      }
      case 'error': {
        // errorDetail 错误信息保存`jsonStringify`，供服务层 voice Stream STT后续处理使用。
        const errorDetail = msg.message ?? jsonStringify(msg)
        // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[voice_stream] Server error: ${errorDetail}`)
        // finalizing缺失时提前走兜底路径，避免服务层 voice Stream STT继续依赖无效输入。
        if (!finalizing) {
          // 调用 callbacks.onError，触发服务层 voice Stream STT此处需要的副作用。
          callbacks.onError(errorDetail)
        }
        // 结束这个分支或循环，避免服务层 voice Stream STT继续落入后续路径。
        break
      }
      default:
        // 结束这个分支或循环，避免服务层 voice Stream STT继续落入后续路径。
        break
    }
  })

  // 调用 ws.on，触发服务层 voice Stream STT此处需要的副作用。
  ws.on('close', (code, reason) => {
    // reasonStr格式化`toString`，供服务层 voice Stream STT后续处理使用。
    const reasonStr = reason?.toString() ?? ''
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[voice_stream] WebSocket closed: code=${String(code)} reason="${reasonStr}"`,
    )
    // connected更新为 `false`，确保服务层后续读取最新状态。
    connected = false
    // 满足 `keepaliveTimer` 时，服务层 voice Stream STT执行该分支。
    if (keepaliveTimer) {
      // 调用 clearInterval，触发服务层 voice Stream STT此处需要的副作用。
      clearInterval(keepaliveTimer)
      // keepaliveTimer更新为 `null`，确保服务层后续读取最新状态。
      keepaliveTimer = null
    }
    // If the server closed the connection before sending TranscriptEndpoint,
    // promote the last interim transcript to final so no text is lost.
    // 满足 `lastTranscriptText` 时，服务层 voice Stream STT执行该分支。
    if (lastTranscriptText) {
      // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[voice_stream] Promoting unreported interim transcript to final on close',
      )
      // finalText保存`lastTranscriptText`，供服务层 voice Stream STT后续判断或输出使用。
      const finalText = lastTranscriptText
      // lastTranscriptText更新为 `''`，确保服务层后续读取最新状态。
      lastTranscriptText = ''
      // 调用 callbacks.onTranscript，触发服务层 voice Stream STT此处需要的副作用。
      callbacks.onTranscript(finalText, true)
    }
    // During finalize, suppress onError — the session already delivered
    // whatever it had. useVoice's onError path wipes accumulatedRef,
    // which would destroy the transcript before the finalize .then()
    // reads it. `finalizing` (not resolveFinalize) is the gate: set once
    // at finalize() entry, never cleared, so it stays accurate after the
    // fast path or a timer already resolved.
    // 调用 resolveFinalize?.('ws_close')，完成这一处局部操作。
    resolveFinalize?.('ws_close')
    // `!finalizing && !upgradeRejected && code` 与 `1000` 不一致时刷新派生状态，避免使用过期结果。
    if (!finalizing && !upgradeRejected && code !== 1000 && code !== 1005) {
      // 调用 callbacks.onError，触发服务层 voice Stream STT此处需要的副作用。
      callbacks.onError(
        `Connection closed: code ${String(code)}${reasonStr ? ` — ${reasonStr}` : ''}`,
      )
    }
    // 调用 callbacks.onClose，触发服务层 voice Stream STT此处需要的副作用。
    callbacks.onClose()
  })

  // The ws library fires 'unexpected-response' when the HTTP upgrade
  // returns a non-101 status. Listening lets us surface the actual status
  // and flag 4xx as fatal (same token/TLS fingerprint won't change on
  // retry). With a listener registered, ws does NOT abort on our behalf —
  // we destroy the request; 'error' does not fire, 'close' does (suppressed
  // via upgradeRejected above).
  //
  // Bun's ws shim historically didn't implement this event (a warning
  // is logged once at registration). Under Bun a non-101 upgrade falls
  // through to the generic 'error' + 'close' 1002 path with no recoverable
  // status; the attemptGenRef guard in useVoice.ts still surfaces the
  // retry-attempt failure, the user just sees "Expected 101 status code"
  // instead of "HTTP 503". No harm — the gen fix is the load-bearing part.
  // 调用 ws.on，触发服务层 voice Stream STT此处需要的副作用。
  ws.on('unexpected-response', (req: ClientRequest, res: IncomingMessage) => {
    // status 集合 命名 `res.statusCode ?? 0`，让后续代码直接表达这个值的用途。
    const status = res.statusCode ?? 0
    // Bun's ws implementation on Windows can fire this event for a
    // successful 101 Switching Protocols response (anthropics/claude-code#40510).
    // 101 is never a rejection — bail before we destroy a working upgrade.
    // 满足 `status === 101` 时，服务层 voice Stream STT执行该分支。
    if (status === 101) {
      // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[voice_stream] unexpected-response fired with 101; ignoring',
      )
      // 服务层 voice Stream STT在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[voice_stream] Upgrade rejected: status=${String(status)} cf-mitigated=${String(res.headers['cf-mitigated'])} cf-ray=${String(res.headers['cf-ray'])}`,
    )
    // upgradeRejected更新为 `true`，确保服务层后续读取最新状态。
    upgradeRejected = true
    // 调用 res.resume，触发服务层 voice Stream STT此处需要的副作用。
    res.resume()
    // 调用 req.destroy，触发服务层 voice Stream STT此处需要的副作用。
    req.destroy()
    // 满足 `finalizing` 时，服务层 voice Stream STT执行该分支。
    if (finalizing) return
    // 调用 callbacks.onError，触发服务层 voice Stream STT此处需要的副作用。
    callbacks.onError(
      `WebSocket upgrade rejected with HTTP ${String(status)}`,
      { fatal: status >= 400 && status < 500 },
    )
  })

  // 调用 ws.on，触发服务层 voice Stream STT此处需要的副作用。
  ws.on('error', (err: Error) => {
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 记录服务层 voice Stream STT运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[voice_stream] WebSocket error: ${err.message}`)
    // finalizing缺失时提前走兜底路径，避免服务层 voice Stream STT继续依赖无效输入。
    if (!finalizing) {
      // 调用 callbacks.onError，触发服务层 voice Stream STT此处需要的副作用。
      callbacks.onError(`Voice stream connection error: ${err.message}`)
    }
  })

  // 返回 `connection`，作为服务层 voice Stream STT这次计算的结果。
  return connection
}
