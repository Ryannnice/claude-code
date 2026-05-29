// 引入 URL，将 url 中已经封装好的能力接到本文件流程里。
import { URL } from 'url'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 引入 HybridTransport，将 ./HybridTransport.js 中已经封装好的能力接到本文件流程里。
import { HybridTransport } from './HybridTransport.js'
// 引入 SSETransport，将 ./SSETransport.js 中已经封装好的能力接到本文件流程里。
import { SSETransport } from './SSETransport.js'
// 类型依赖 { Transport } 来自 ./Transport.js，用于校准transport Utils的数据契约。
import type { Transport } from './Transport.js'
// 引入 WebSocketTransport，将 ./WebSocketTransport.js 中已经封装好的能力接到本文件流程里。
import { WebSocketTransport } from './WebSocketTransport.js'

/**
 * Helper function to get the appropriate transport for a URL.
 *
 * Transport selection priority:
 * 1. SSETransport (SSE reads + POST writes) when CLAUDE_CODE_USE_CCR_V2 is set
 * 2. HybridTransport (WS reads + POST writes) when CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2 is set
 * 3. WebSocketTransport (WS reads + WS writes) — default
 */
// getTransportForUrl 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTransportForUrl(
  url: URL,
  headers: Record<string, string> = {},
  sessionId?: string,
  refreshHeaders?: () => Record<string, string>,
): Transport {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)` 时，transport Utils执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)) {
    // v2: SSE for reads, HTTP POST for writes
    // --sdk-url is the session URL (.../sessions/{id});
    // derive the SSE stream URL by appending /worker/events/stream
    // sseUrl保存`URL`，供transport Utils后续处理使用。
    const sseUrl = new URL(url.href)
    // 当 `sseUrl.protocol` 匹配 `'wss:'` 时，transport Utils执行对应分支。
    if (sseUrl.protocol === 'wss:') {
      // protocol更新为 `'https:'`，确保CLI后续读取最新状态。
      sseUrl.protocol = 'https:'
    // transport Utils在这里处理 `} else if (sseUrl.protocol === 'ws:') {`，完成这一小步状态转换。
    } else if (sseUrl.protocol === 'ws:') {
      // protocol更新为 `'http:'`，确保CLI后续读取最新状态。
      sseUrl.protocol = 'http:'
    }
    // transport Utils在这里处理 `sseUrl.pathname =`，完成这一小步状态转换。
    sseUrl.pathname =
      sseUrl.pathname.replace(/\/$/, '') + '/worker/events/stream'
    // 返回 `new SSETransport(sseUrl, headers, sessionId, refreshHeaders)`，作为transport Utils这次计算的结果。
    return new SSETransport(sseUrl, headers, sessionId, refreshHeaders)
  }

  // 当 `url.protocol` 匹配 `'ws:' || url.protocol === '...` 时，transport Utils执行对应分支。
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2)` 时，transport Utils执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2)) {
      // 返回 `new HybridTransport(url, headers, sessionId, refreshHeaders)`，作为transport Utils这次计算的结果。
      return new HybridTransport(url, headers, sessionId, refreshHeaders)
    }
    // 返回 `new WebSocketTransport(url, headers, sessionId, refreshHeaders)`，作为transport Utils这次计算的结果。
    return new WebSocketTransport(url, headers, sessionId, refreshHeaders)
  } else {
    // 抛出 new Error(`Unsupported protocol: ${url.protocol}`)，阻止transport Utils在无效状态下继续运行。
    throw new Error(`Unsupported protocol: ${url.protocol}`)
  }
}
