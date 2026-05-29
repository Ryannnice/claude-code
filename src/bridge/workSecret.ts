// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'
// 类型依赖 { WorkSecret } 来自 ./types.js，用于校准远程桥接会话的数据契约。
import type { WorkSecret } from './types.js'

/** Decode a base64url-encoded work secret and validate its version. */
// decodeWorkSecret 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function decodeWorkSecret(secret: string): WorkSecret {
  // json保存`Buffer.from`，供远程桥接会话后续处理使用。
  const json = Buffer.from(secret, 'base64url').toString('utf-8')
  // 解析结果解析`jsonParse(json)`，供后续判断或组装使用。
  const parsed: unknown = jsonParse(json)
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('version' in parsed) ||
    parsed.version !== 1
  ) {
    // 抛出 new Error(，阻止远程桥接会话在无效状态下继续运行。
    throw new Error(
      `Unsupported work secret version: ${parsed && typeof parsed === 'object' && 'version' in parsed ? parsed.version : 'unknown'}`,
    )
  }
  // obj 命名 `parsed as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const obj = parsed as Record<string, unknown>
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    typeof obj.session_ingress_token !== 'string' ||
    obj.session_ingress_token.length === 0
  ) {
    // 抛出 new Error(，阻止远程桥接会话在无效状态下继续运行。
    throw new Error(
      'Invalid work secret: missing or empty session_ingress_token',
    )
  }
  // `typeof obj.api_base_url` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof obj.api_base_url !== 'string') {
    // 抛出 new Error('Invalid work secret: missing api_base_url')，阻止远程桥接会话在无效状态下继续运行。
    throw new Error('Invalid work secret: missing api_base_url')
  }
  // 返回 `parsed as WorkSecret`，作为远程桥接会话这次计算的结果。
  return parsed as WorkSecret
}

/**
 * Build a WebSocket SDK URL from the API base URL and session ID.
 * Strips the HTTP(S) protocol and constructs a ws(s):// ingress URL.
 *
 * Uses /v2/ for localhost (direct to session-ingress, no Envoy rewrite)
 * and /v1/ for production (Envoy rewrites /v1/ → /v2/).
 */
// buildSdkUrl 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSdkUrl(apiBaseUrl: string, sessionId: string): string {
  // isLocalhost 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isLocalhost =
    apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')
  // protocol 命名 `isLocalhost ? 'ws' : 'wss'`，让后续代码直接表达这个值的用途。
  const protocol = isLocalhost ? 'ws' : 'wss'
  // version 命名 `isLocalhost ? 'v2' : 'v1'`，让后续代码直接表达这个值的用途。
  const version = isLocalhost ? 'v2' : 'v1'
  // host格式化`apiBaseUrl.replace`，供远程桥接会话后续处理使用。
  const host = apiBaseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  // 返回 ``${protocol}://${host}/${version}/session_ingress/ws/${sessionId}``，作为远程桥接会话这次计算的结果。
  return `${protocol}://${host}/${version}/session_ingress/ws/${sessionId}`
}

/**
 * Compare two session IDs regardless of their tagged-ID prefix.
 *
 * Tagged IDs have the form {tag}_{body} or {tag}_staging_{body}, where the
 * body encodes a UUID. CCR v2's compat layer returns `session_*` to v1 API
 * clients (compat/convert.go:41) but the infrastructure layer (sandbox-gateway
 * work queue, work poll response) uses `cse_*` (compat/CLAUDE.md:13). Both
 * have the same underlying UUID.
 *
 * Without this, replBridge rejects its own session as "foreign" at the
 * work-received check when the ccr_v2_compat_enabled gate is on.
 */
// sameSessionId 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sameSessionId(a: string, b: string): boolean {
  // 满足 `a === b` 时，远程桥接会话执行该分支。
  if (a === b) return true
  // The body is everything after the last underscore — this handles both
  // `{tag}_{body}` and `{tag}_staging_{body}`.
  // aBody格式化`a.slice`，供远程桥接会话后续处理使用。
  const aBody = a.slice(a.lastIndexOf('_') + 1)
  // bBody格式化`b.slice`，供远程桥接会话后续处理使用。
  const bBody = b.slice(b.lastIndexOf('_') + 1)
  // Guard against IDs with no underscore (bare UUIDs): lastIndexOf returns -1,
  // slice(0) returns the whole string, and we already checked a === b above.
  // Require a minimum length to avoid accidental matches on short suffixes
  // (e.g. single-char tag remnants from malformed IDs).
  // 返回 `aBody.length >= 4 && aBody === bBody`，作为远程桥接会话这次计算的结果。
  return aBody.length >= 4 && aBody === bBody
}

/**
 * Build a CCR v2 session URL from the API base URL and session ID.
 * Unlike buildSdkUrl, this returns an HTTP(S) URL (not ws://) and points at
 * /v1/code/sessions/{id} — the child CC will derive the SSE stream path
 * and worker endpoints from this base.
 */
// buildCCRv2SdkUrl 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildCCRv2SdkUrl(
  apiBaseUrl: string,
  sessionId: string,
): string {
  // base格式化`apiBaseUrl.replace`，供远程桥接会话后续处理使用。
  const base = apiBaseUrl.replace(/\/+$/, '')
  // 返回 ``${base}/v1/code/sessions/${sessionId}``，作为远程桥接会话这次计算的结果。
  return `${base}/v1/code/sessions/${sessionId}`
}

/**
 * Register this bridge as the worker for a CCR v2 session.
 * Returns the worker_epoch, which must be passed to the child CC process
 * so its CCRClient can include it in every heartbeat/state/event request.
 *
 * Mirrors what environment-manager does in the container path
 * (api-go/environment-manager/cmd/cmd_task_run.go RegisterWorker).
 */
// registerWorker 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function registerWorker(
  sessionUrl: string,
  accessToken: string,
): Promise<number> {
  // 接口响应保存`axios.post`，供远程桥接会话后续处理使用。
  const response = await axios.post(
    `${sessionUrl}/worker/register`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      timeout: 10_000,
    },
  )
  // protojson serializes int64 as a string to avoid JS number precision loss;
  // the Go side may also return a number depending on encoder settings.
  // 原始文本保存`response.data?.worker_epoch`，供后续判断或组装使用。
  const raw = response.data?.worker_epoch
  // epoch保存`Number`，供远程桥接会话后续处理使用。
  const epoch = typeof raw === 'string' ? Number(raw) : raw
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    typeof epoch !== 'number' ||
    !Number.isFinite(epoch) ||
    !Number.isSafeInteger(epoch)
  ) {
    // 抛出 new Error(，阻止远程桥接会话在无效状态下继续运行。
    throw new Error(
      `registerWorker: invalid worker_epoch in response: ${jsonStringify(response.data)}`,
    )
  }
  // 返回 `epoch`，作为远程桥接会话这次计算的结果。
  return epoch
}
