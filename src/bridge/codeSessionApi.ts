/**
 * Thin HTTP wrappers for the CCR v2 code-session API.
 *
 * Separate file from remoteBridgeCore.ts so the SDK /bridge subpath can
 * export createCodeSession + fetchRemoteCredentials without bundling the
 * heavy CLI tree (analytics, transport, etc.). Callers supply explicit
 * accessToken + baseUrl — no implicit auth or config reads.
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 引入 extractErrorDetail，将 ./debugUtils.js 中已经封装好的能力接到本文件流程里。
import { extractErrorDetail } from './debugUtils.js'

// ANTHROPIC_VERSION保存`'2023-06-01'`，作为后续固定文本处理的输入。
const ANTHROPIC_VERSION = '2023-06-01'

// oauthHeaders 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function oauthHeaders(accessToken: string): Record<string, string> {
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
  }
}

// createCodeSession 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createCodeSession(
  baseUrl: string,
  accessToken: string,
  title: string,
  timeoutMs: number,
  tags?: string[],
): Promise<string | null> {
  // URL 命名 ``${baseUrl}/v1/code/sessions``，让后续代码直接表达这个值的用途。
  const url = `${baseUrl}/v1/code/sessions`
  // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let response
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应更新为 `await axios.post(`，确保Bridge 通信后续读取最新状态。
    response = await axios.post(
      url,
      // bridge: {} is the positive signal for the oneof runner — omitting it
      // (or sending environment_id: "") now 400s. BridgeRunner is an empty
      // message today; it's a placeholder for future bridge-specific options.
      { title, bridge: {}, ...(tags?.length ? { tags } : {}) },
      {
        headers: oauthHeaders(accessToken),
        timeout: timeoutMs,
        // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
        validateStatus: s => s < 500,
      },
    )
  } catch (err: unknown) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[code-session] Session create request failed: ${errorMessage(err)}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // `response.status` 与 `200 && response.status !== 201` 不一致时刷新派生状态，避免使用过期结果。
  if (response.status !== 200 && response.status !== 201) {
    // detail保存`extractErrorDetail`，供远程桥接会话后续处理使用。
    const detail = extractErrorDetail(response.data)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[code-session] Session create failed ${response.status}${detail ? `: ${detail}` : ''}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // data保存`response.data`，供后续判断或组装使用。
  const data: unknown = response.data
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    !data ||
    typeof data !== 'object' ||
    !('session' in data) ||
    !data.session ||
    typeof data.session !== 'object' ||
    !('id' in data.session) ||
    typeof data.session.id !== 'string' ||
    !data.session.id.startsWith('cse_')
  ) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[code-session] No session.id (cse_*) in response: ${jsonStringify(data).slice(0, 200)}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // 返回 `data.session.id`，作为远程桥接会话这次计算的结果。
  return data.session.id
}

/**
 * Credentials from POST /bridge. JWT is opaque — do not decode.
 * Each /bridge call bumps worker_epoch server-side (it IS the register).
 */
// RemoteCredentials 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteCredentials = {
  worker_jwt: string
  api_base_url: string
  expires_in: number
  worker_epoch: number
}

// fetchRemoteCredentials 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchRemoteCredentials(
  sessionId: string,
  baseUrl: string,
  accessToken: string,
  timeoutMs: number,
  trustedDeviceToken?: string,
): Promise<RemoteCredentials | null> {
  // URL固定为 ``${baseUrl}/v1/code/sessions/${sessionId}/bridge``，作为远程桥接会话远程桥接 code Session Api后续展示或比较的基准。
  const url = `${baseUrl}/v1/code/sessions/${sessionId}/bridge`
  // 请求头保存`oauthHeaders`，供远程桥接会话后续处理使用。
  const headers = oauthHeaders(accessToken)
  // 满足 `trustedDeviceToken` 时，远程桥接会话执行该分支。
  if (trustedDeviceToken) {
    // headers['X-Trusted-Device-Token'更新为 `trustedDeviceToken`，确保远程桥接 code Session Api后续读取最新状态。
    headers['X-Trusted-Device-Token'] = trustedDeviceToken
  }
  // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let response
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应更新为 `await axios.post(`，确保Bridge 通信后续读取最新状态。
    response = await axios.post(
      url,
      {},
      {
        headers,
        timeout: timeoutMs,
        // 这个回调绑定到 validateStatus: s => s < 500,，负责远程桥接会话在该局部场景下的响应。
        validateStatus: s => s < 500,
      },
    )
  } catch (err: unknown) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[code-session] /bridge request failed: ${errorMessage(err)}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
  if (response.status !== 200) {
    // detail保存`extractErrorDetail`，供远程桥接会话后续处理使用。
    const detail = extractErrorDetail(response.data)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[code-session] /bridge failed ${response.status}${detail ? `: ${detail}` : ''}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // data保存`response.data`，供后续判断或组装使用。
  const data: unknown = response.data
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    data === null ||
    typeof data !== 'object' ||
    !('worker_jwt' in data) ||
    typeof data.worker_jwt !== 'string' ||
    !('expires_in' in data) ||
    typeof data.expires_in !== 'number' ||
    !('api_base_url' in data) ||
    typeof data.api_base_url !== 'string' ||
    !('worker_epoch' in data)
  ) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[code-session] /bridge response malformed (need worker_jwt, expires_in, api_base_url, worker_epoch): ${jsonStringify(data).slice(0, 200)}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // protojson serializes int64 as a string to avoid JS precision loss;
  // Go may also return a number depending on encoder settings.
  // rawEpoch保存`data.worker_epoch`，供后续判断或组装使用。
  const rawEpoch = data.worker_epoch
  // epoch保存`Number`，供远程桥接会话后续处理使用。
  const epoch = typeof rawEpoch === 'string' ? Number(rawEpoch) : rawEpoch
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    typeof epoch !== 'number' ||
    !Number.isFinite(epoch) ||
    !Number.isSafeInteger(epoch)
  ) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[code-session] /bridge worker_epoch invalid: ${jsonStringify(rawEpoch)}`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    worker_jwt: data.worker_jwt,
    api_base_url: data.api_base_url,
    expires_in: data.expires_in,
    worker_epoch: epoch,
  }
}
