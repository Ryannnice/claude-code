// 类型依赖 { APIError } 来自 @anthropic-ai/sdk，用于校准API 服务 error Utils的数据契约。
import type { APIError } from '@anthropic-ai/sdk'

// SSL/TLS error codes from OpenSSL (used by both Node.js and Bun)
// See: https://www.openssl.org/docs/man3.1/man3/X509_STORE_CTX_get_error.html
// SSL_ERROR_CODES 错误信息保存`Set`，供API 服务 error Utils后续处理使用。
const SSL_ERROR_CODES = new Set([
  // Certificate verification errors
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_SIGNATURE_FAILURE',
  'CERT_NOT_YET_VALID',
  'CERT_HAS_EXPIRED',
  'CERT_REVOKED',
  'CERT_REJECTED',
  'CERT_UNTRUSTED',
  // Self-signed certificate errors
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  // Chain errors
  'CERT_CHAIN_TOO_LONG',
  'PATH_LENGTH_EXCEEDED',
  // Hostname/altname errors
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'HOSTNAME_MISMATCH',
  // TLS handshake errors
  'ERR_TLS_HANDSHAKE_TIMEOUT',
  'ERR_SSL_WRONG_VERSION_NUMBER',
  'ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC',
])

// ConnectionErrorDetails 固化API 服务 error Utils里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConnectionErrorDetails = {
  code: string
  message: string
  isSSLError: boolean
}

/**
 * Extracts connection error details from the error cause chain.
 * The Anthropic SDK wraps underlying errors in the `cause` property.
 * This function walks the cause chain to find the root error code/message.
 */
// extractConnectionErrorDetails 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractConnectionErrorDetails(
  error: unknown,
): ConnectionErrorDetails | null {
  // `!error || typeof error` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!error || typeof error !== 'object') {
    // 返回 `null`，作为API 服务 error Utils这次计算的结果。
    return null
  }

  // Walk the cause chain to find the root error with a code
  // current保存`error`，供API 服务 error Utils后续判断或输出使用。
  let current: unknown = error
  // maxDepth保存`5 // Prevent infinite loops`，供API 服务 error Utils后续判断或输出使用。
  const maxDepth = 5 // Prevent infinite loops
  // depth保存`0`，供后续判断或组装使用。
  let depth = 0

  // while 使用 current && depth < maxDepth 完成API 服务 error Utils里的对应操作。
  while (current && depth < maxDepth) {
    // API 服务 error Utils在这里进入条件判断，后续代码按实际状态分流。
    if (
      current instanceof Error &&
      'code' in current &&
      typeof current.code === 'string'
    ) {
      // code保存`current.code`，供API 服务 error Utils后续判断或输出使用。
      const code = current.code
      // isSSLError 错误信息记录 `SSL_ERROR_CODES.has` 是否成立，API 服务 error Utils随后按该结果分支。
      const isSSLError = SSL_ERROR_CODES.has(code)
      // 返回结构化结果，集中表达API 服务 error Utils已经整理出的状态。
      return {
        code,
        message: current.message,
        isSSLError,
      }
    }

    // Move to the next cause in the chain
    // API 服务 error Utils在这里进入条件判断，后续代码按实际状态分流。
    if (
      current instanceof Error &&
      'cause' in current &&
      current.cause !== current
    ) {
      // current更新为 `current.cause`，确保API 服务后续读取最新状态。
      current = current.cause
      // API 服务 error Utils在这里处理 `depth++`，完成这一小步状态转换。
      depth++
    } else {
      // 结束这个分支或循环，避免API 服务 error Utils继续落入后续路径。
      break
    }
  }

  // 返回 `null`，作为API 服务 error Utils这次计算的结果。
  return null
}

/**
 * Returns an actionable hint for SSL/TLS errors, intended for contexts outside
 * the main API client (OAuth token exchange, preflight connectivity checks)
 * where `formatAPIError` doesn't apply.
 *
 * Motivation: enterprise users behind TLS-intercepting proxies (Zscaler et al.)
 * see OAuth complete in-browser but the CLI's token exchange silently fails
 * with a raw SSL code. Surfacing the likely fix saves a support round-trip.
 */
// getSSLErrorHint 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSSLErrorHint(error: unknown): string | null {
  // details 集合保存`extractConnectionErrorDetails`，供API 服务 error Utils后续处理使用。
  const details = extractConnectionErrorDetails(error)
  // 满足 `!details?.isSSLError` 时，API 服务 error Utils执行该分支。
  if (!details?.isSSLError) {
    // 返回 `null`，作为API 服务 error Utils这次计算的结果。
    return null
  }
  // 返回 ``SSL certificate error (${details.code}). If you are behind a corporate...`，作为API 服务 error Utils这次计算的结果。
  return `SSL certificate error (${details.code}). If you are behind a corporate proxy or TLS-intercepting firewall, set NODE_EXTRA_CA_CERTS to your CA bundle path, or ask IT to allowlist *.anthropic.com. Run /doctor for details.`
}

/**
 * Strips HTML content (e.g., CloudFlare error pages) from a message string,
 * returning a user-friendly title or empty string if HTML is detected.
 * Returns the original message unchanged if no HTML is found.
 */
// sanitizeMessageHTML 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeMessageHTML(message: string): string {
  // 组合条件 `message.includes('<!DOCTYPE html') || message.includes('<html')` 成立时，API 服务 error Utils才启用这条专门路径。
  if (message.includes('<!DOCTYPE html') || message.includes('<html')) {
    // titleMatch 标题匹配`message.match`，供API 服务 error Utils后续处理使用。
    const titleMatch = message.match(/<title>([^<]+)<\/title>/)
    // 组合条件 `titleMatch && titleMatch[1]` 成立时，API 服务 error Utils才启用这条专门路径。
    if (titleMatch && titleMatch[1]) {
      // 返回 `titleMatch[1].trim()`，作为API 服务 error Utils这次计算的结果。
      return titleMatch[1].trim()
    }
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }
  // 返回 `message`，作为API 服务 error Utils这次计算的结果。
  return message
}

/**
 * Detects if an error message contains HTML content (e.g., CloudFlare error pages)
 * and returns a user-friendly message instead
 */
// sanitizeAPIError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizeAPIError(apiError: APIError): string {
  // 消息保存`apiError.message`，供API 服务 error Utils后续判断或输出使用。
  const message = apiError.message
  // 消息缺失时提前走兜底路径，避免API 服务 error Utils继续依赖无效输入。
  if (!message) {
    // Sometimes message is undefined
    // TODO: figure out why
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }
  // 返回 `sanitizeMessageHTML(message)`，作为API 服务 error Utils这次计算的结果。
  return sanitizeMessageHTML(message)
}

/**
 * Shapes of deserialized API errors from session JSONL.
 *
 * After JSON round-tripping, the SDK's APIError loses its `.message` property.
 * The actual message lives at different nesting levels depending on the provider:
 *
 * - Bedrock/proxy: `{ error: { message: "..." } }`
 * - Standard Anthropic API: `{ error: { error: { message: "..." } } }`
 *   (the outer `.error` is the response body, the inner `.error` is the API error)
 *
 * See also: `getErrorMessage` in `logging.ts` which handles the same shapes.
 */
// NestedAPIError 固化API 服务 error Utils里传递的数据形状，帮助调用方按同一结构读写字段。
type NestedAPIError = {
  error?: {
    message?: string
    error?: { message?: string }
  }
}

// hasNestedError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasNestedError(value: unknown): value is NestedAPIError {
  // 返回 `(`，作为API 服务 error Utils这次计算的结果。
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'object' &&
    value.error !== null
  )
}

/**
 * Extract a human-readable message from a deserialized API error that lacks
 * a top-level `.message`.
 *
 * Checks two nesting levels (deeper first for specificity):
 * 1. `error.error.error.message` — standard Anthropic API shape
 * 2. `error.error.message` — Bedrock shape
 */
// extractNestedErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractNestedErrorMessage(error: APIError): string | null {
  // 满足 `!hasNestedError(error)` 时，API 服务 error Utils执行该分支。
  if (!hasNestedError(error)) {
    // 返回 `null`，作为API 服务 error Utils这次计算的结果。
    return null
  }

  // Access `.error` via the narrowed type so TypeScript sees the nested shape
  // instead of the SDK's `Object | undefined`.
  // narrowed保存`error`，供后续判断或组装使用。
  const narrowed: NestedAPIError = error
  // nested保存`narrowed.error`，供API 服务 error Utils后续判断或输出使用。
  const nested = narrowed.error

  // Standard Anthropic API shape: { error: { error: { message } } }
  // deepMsg保存`nested?.error?.message`，供后续判断或组装使用。
  const deepMsg = nested?.error?.message
  // 组合条件 `typeof deepMsg === 'string' && deepMsg.length > 0` 成立时，API 服务 error Utils才启用这条专门路径。
  if (typeof deepMsg === 'string' && deepMsg.length > 0) {
    // sanitized保存`sanitizeMessageHTML`，供API 服务 error Utils后续处理使用。
    const sanitized = sanitizeMessageHTML(deepMsg)
    // 满足 `sanitized.length > 0` 时，API 服务 error Utils执行该分支。
    if (sanitized.length > 0) {
      // 返回 `sanitized`，作为API 服务 error Utils这次计算的结果。
      return sanitized
    }
  }

  // Bedrock shape: { error: { message } }
  // 消息保存`nested?.message`，供API 服务 error Utils后续判断或输出使用。
  const msg = nested?.message
  // 组合条件 `typeof msg === 'string' && msg.length > 0` 成立时，API 服务 error Utils才启用这条专门路径。
  if (typeof msg === 'string' && msg.length > 0) {
    // sanitized保存`sanitizeMessageHTML`，供API 服务 error Utils后续处理使用。
    const sanitized = sanitizeMessageHTML(msg)
    // 满足 `sanitized.length > 0` 时，API 服务 error Utils执行该分支。
    if (sanitized.length > 0) {
      // 返回 `sanitized`，作为API 服务 error Utils这次计算的结果。
      return sanitized
    }
  }

  // 返回 `null`，作为API 服务 error Utils这次计算的结果。
  return null
}

// formatAPIError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatAPIError(error: APIError): string {
  // Extract connection error details from the cause chain
  // connectionDetails 集合保存`extractConnectionErrorDetails`，供API 服务 error Utils后续处理使用。
  const connectionDetails = extractConnectionErrorDetails(error)

  // 满足 `connectionDetails` 时，API 服务 error Utils执行该分支。
  if (connectionDetails) {
    // 从 `connectionDetails` 解构 code、isSSLError，减少API 服务 error Utils对同一对象的重复访问。
    const { code, isSSLError } = connectionDetails

    // Handle timeout errors
    // 当 `code` 匹配 `'ETIMEDOUT'` 时，API 服务 error Utils执行对应分支。
    if (code === 'ETIMEDOUT') {
      // 返回 `'Request timed out. Check your internet connection and proxy settings'`，作为API 服务 error Utils这次计算的结果。
      return 'Request timed out. Check your internet connection and proxy settings'
    }

    // Handle SSL/TLS errors with specific messages
    // 满足 `isSSLError` 时，API 服务 error Utils执行该分支。
    if (isSSLError) {
      // 按照 code 的取值选择API 服务 error Utils的具体处理分支。
      switch (code) {
        case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
        case 'UNABLE_TO_GET_ISSUER_CERT':
        case 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY':
          // 返回 `'Unable to connect to API: SSL certificate verification failed. Check y...`，作为API 服务 error Utils这次计算的结果。
          return 'Unable to connect to API: SSL certificate verification failed. Check your proxy or corporate SSL certificates'
        case 'CERT_HAS_EXPIRED':
          // 返回 `'Unable to connect to API: SSL certificate has expired'`，作为API 服务 error Utils这次计算的结果。
          return 'Unable to connect to API: SSL certificate has expired'
        case 'CERT_REVOKED':
          // 返回 `'Unable to connect to API: SSL certificate has been revoked'`，作为API 服务 error Utils这次计算的结果。
          return 'Unable to connect to API: SSL certificate has been revoked'
        case 'DEPTH_ZERO_SELF_SIGNED_CERT':
        case 'SELF_SIGNED_CERT_IN_CHAIN':
          // 返回 `'Unable to connect to API: Self-signed certificate detected. Check your...`，作为API 服务 error Utils这次计算的结果。
          return 'Unable to connect to API: Self-signed certificate detected. Check your proxy or corporate SSL certificates'
        case 'ERR_TLS_CERT_ALTNAME_INVALID':
        case 'HOSTNAME_MISMATCH':
          // 返回 `'Unable to connect to API: SSL certificate hostname mismatch'`，作为API 服务 error Utils这次计算的结果。
          return 'Unable to connect to API: SSL certificate hostname mismatch'
        case 'CERT_NOT_YET_VALID':
          // 返回 `'Unable to connect to API: SSL certificate is not yet valid'`，作为API 服务 error Utils这次计算的结果。
          return 'Unable to connect to API: SSL certificate is not yet valid'
        default:
          // 返回 ``Unable to connect to API: SSL error (${code})``，作为API 服务 error Utils这次计算的结果。
          return `Unable to connect to API: SSL error (${code})`
      }
    }
  }

  // 当 `error.message` 匹配 `'Connection error.'` 时，API 服务 error Utils执行对应分支。
  if (error.message === 'Connection error.') {
    // If we have a code but it's not SSL, include it for debugging
    // 满足 `connectionDetails?.code` 时，API 服务 error Utils执行该分支。
    if (connectionDetails?.code) {
      // 返回 ``Unable to connect to API (${connectionDetails.code})``，作为API 服务 error Utils这次计算的结果。
      return `Unable to connect to API (${connectionDetails.code})`
    }
    // 返回 `'Unable to connect to API. Check your internet connection'`，作为API 服务 error Utils这次计算的结果。
    return 'Unable to connect to API. Check your internet connection'
  }

  // Guard: when deserialized from JSONL (e.g. --resume), the error object may
  // be a plain object without a `.message` property.  Return a safe fallback
  // instead of undefined, which would crash callers that access `.length`.
  // error.message 消息数据缺失时提前走兜底路径，避免API 服务 error Utils继续依赖无效输入。
  if (!error.message) {
    // 返回 `(`，作为API 服务 error Utils这次计算的结果。
    return (
      extractNestedErrorMessage(error) ??
      `API error (status ${error.status ?? 'unknown'})`
    )
  }

  // sanitizedMessage 消息数据保存`sanitizeAPIError`，供API 服务 error Utils后续处理使用。
  const sanitizedMessage = sanitizeAPIError(error)
  // Use sanitized message if it's different from the original (i.e., HTML was sanitized)
  // 返回 `sanitizedMessage !== error.message && sanitizedMessage.length > 0`，作为API 服务 error Utils这次计算的结果。
  return sanitizedMessage !== error.message && sanitizedMessage.length > 0
    ? sanitizedMessage
    : error.message
}
