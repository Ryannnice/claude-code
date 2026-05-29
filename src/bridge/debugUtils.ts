// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'

// DEBUG_MSG_LIMIT 命名 `2000`，让后续代码直接表达这个值的用途。
const DEBUG_MSG_LIMIT = 2000

// SECRET_FIELD_NAMES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SECRET_FIELD_NAMES = [
  'session_ingress_token',
  'environment_secret',
  'access_token',
  'secret',
  'token',
]

// SECRET_PATTERN匹配`RegExp`，供远程桥接会话后续处理使用。
const SECRET_PATTERN = new RegExp(
  `"(${SECRET_FIELD_NAMES.join('|')})"\\s*:\\s*"([^"]*)"`,
  'g',
)

// REDACT_MIN_LENGTH 数量保存`16`，供后续判断或组装使用。
const REDACT_MIN_LENGTH = 16

// redactSecrets 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function redactSecrets(s: string): string {
  // 返回 `s.replace(SECRET_PATTERN, (_match, field: string, value: string) => {`，作为远程桥接会话这次计算的结果。
  return s.replace(SECRET_PATTERN, (_match, field: string, value: string) => {
    // 满足 `value.length < REDACT_MIN_LENGTH` 时，远程桥接会话执行该分支。
    if (value.length < REDACT_MIN_LENGTH) {
      // 返回 ``"${field}":"[REDACTED]"``，作为远程桥接会话这次计算的结果。
      return `"${field}":"[REDACTED]"`
    }
    // redacted格式化`value.slice`，供远程桥接会话后续处理使用。
    const redacted = `${value.slice(0, 8)}...${value.slice(-4)}`
    // 返回 ``"${field}":"${redacted}"``，作为远程桥接会话这次计算的结果。
    return `"${field}":"${redacted}"`
  })
}

/** Truncate a string for debug logging, collapsing newlines. */
// debugTruncate 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function debugTruncate(s: string): string {
  // flat格式化`s.replace`，供远程桥接会话后续处理使用。
  const flat = s.replace(/\n/g, '\\n')
  // 满足 `flat.length <= DEBUG_MSG_LIMIT` 时，远程桥接会话执行该分支。
  if (flat.length <= DEBUG_MSG_LIMIT) {
    // 返回 `flat`，作为远程桥接会话这次计算的结果。
    return flat
  }
  // 返回 `flat.slice(0, DEBUG_MSG_LIMIT) + `... (${flat.length} chars)``，作为远程桥接会话这次计算的结果。
  return flat.slice(0, DEBUG_MSG_LIMIT) + `... (${flat.length} chars)`
}

/** Truncate a JSON-serializable value for debug logging. */
// debugBody 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function debugBody(data: unknown): string {
  // 原始文本保存`jsonStringify`，供远程桥接会话后续处理使用。
  const raw = typeof data === 'string' ? data : jsonStringify(data)
  // s 集合保存`redactSecrets`，供远程桥接会话后续处理使用。
  const s = redactSecrets(raw)
  // 满足 `s.length <= DEBUG_MSG_LIMIT` 时，远程桥接会话执行该分支。
  if (s.length <= DEBUG_MSG_LIMIT) {
    // 返回 `s`，作为远程桥接会话这次计算的结果。
    return s
  }
  // 返回 `s.slice(0, DEBUG_MSG_LIMIT) + `... (${s.length} chars)``，作为远程桥接会话这次计算的结果。
  return s.slice(0, DEBUG_MSG_LIMIT) + `... (${s.length} chars)`
}

/**
 * Extract a descriptive error message from an axios error (or any error).
 * For HTTP errors, appends the server's response body message if available,
 * since axios's default message only includes the status code.
 */
// describeAxiosError 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function describeAxiosError(err: unknown): string {
  // 消息保存`errorMessage`，供远程桥接会话后续处理使用。
  const msg = errorMessage(err)
  // 组合条件 `err && typeof err === 'object' && 'response' in e` 成立时，远程桥接会话才启用这条专门路径。
  if (err && typeof err === 'object' && 'response' in err) {
    // 接口响应保存`(err as { response?: { data?: unknown } }).response`，供后续判断或组装使用。
    const response = (err as { response?: { data?: unknown } }).response
    // 组合条件 `response?.data && typeof response.data === 'objec` 成立时，远程桥接会话才启用这条专门路径。
    if (response?.data && typeof response.data === 'object') {
      // data保存`response.data as Record<string, unknown>`，供远程桥接会话远程桥接 debug Utils后续判断或输出使用。
      const data = response.data as Record<string, unknown>
      // detail 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const detail =
        typeof data.message === 'string'
          ? data.message
          : typeof data.error === 'object' &&
              data.error &&
              'message' in data.error &&
              typeof (data.error as Record<string, unknown>).message ===
                'string'
            ? (data.error as Record<string, unknown>).message
            : undefined
      // 满足 `detail` 时，远程桥接会话执行该分支。
      if (detail) {
        // 返回 ``${msg}: ${detail}``，作为远程桥接会话这次计算的结果。
        return `${msg}: ${detail}`
      }
    }
  }
  // 返回 `msg`，作为远程桥接会话这次计算的结果。
  return msg
}

/**
 * Extract the HTTP status code from an axios error, if present.
 * Returns undefined for non-HTTP errors (e.g. network failures).
 */
// extractHttpStatus 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractHttpStatus(err: unknown): number | undefined {
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    (err as { response?: { status?: unknown } }).response &&
    typeof (err as { response: { status?: unknown } }).response.status ===
      'number'
  ) {
    // 返回 `(err as { response: { status: number } }).response.status`，作为远程桥接会话这次计算的结果。
    return (err as { response: { status: number } }).response.status
  }
  // 返回 `undefined`，作为远程桥接会话这次计算的结果。
  return undefined
}

/**
 * Pull a human-readable message out of an API error response body.
 * Checks `data.message` first, then `data.error.message`.
 */
// extractErrorDetail 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractErrorDetail(data: unknown): string | undefined {
  // `!data || typeof data` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!data || typeof data !== 'object') return undefined
  // 组合条件 `'message' in data && typeof data.message === 'str` 成立时，远程桥接会话才启用这条专门路径。
  if ('message' in data && typeof data.message === 'string') {
    // 返回 `data.message`，作为远程桥接会话这次计算的结果。
    return data.message
  }
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    'error' in data &&
    data.error !== null &&
    typeof data.error === 'object' &&
    'message' in data.error &&
    typeof data.error.message === 'string'
  ) {
    // 返回 `data.error.message`，作为远程桥接会话这次计算的结果。
    return data.error.message
  }
  // 返回 `undefined`，作为远程桥接会话这次计算的结果。
  return undefined
}

/**
 * Log a bridge init skip — debug message + `tengu_bridge_repl_skipped`
 * analytics event. Centralizes the event name and the AnalyticsMetadata
 * cast so call sites don't each repeat the 5-line boilerplate.
 */
// logBridgeSkip 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logBridgeSkip(
  reason: string,
  debugMsg?: string,
  v2?: boolean,
): void {
  // 满足 `debugMsg` 时，远程桥接会话执行该分支。
  if (debugMsg) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(debugMsg)
  }
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_bridge_repl_skipped', {
    reason:
      reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(v2 !== undefined && { v2 }),
  })
}
