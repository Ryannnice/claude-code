// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'

// JSON.stringify emits U+2028/U+2029 raw (valid per ECMA-404). When the
// output is a single NDJSON line, any receiver that uses JavaScript
// line-terminator semantics (ECMA-262 §11.3 — \n \r U+2028 U+2029) to
// split the stream will cut the JSON mid-string. ProcessTransport now
// silently skips non-JSON lines rather than crashing (gh-28405), but
// the truncated fragment is still lost — the message is silently dropped.
//
// The \uXXXX form is equivalent JSON (parses to the same string) but
// can never be mistaken for a line terminator by ANY receiver. This is
// what ES2019's "Subsume JSON" proposal and Node's util.inspect do.
//
// Single regex with alternation: the callback's one dispatch per match
// is cheaper than two full-string scans.
// JS_LINE_TERMINATORS 集合保存`/\u2028|\u2029/g`，供ndjson Safe Stringify后续判断或输出使用。
const JS_LINE_TERMINATORS = /\u2028|\u2029/g

// escapeJsLineTerminators 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function escapeJsLineTerminators(json: string): string {
  // 返回 `json.replace(JS_LINE_TERMINATORS, c =>`，作为ndjson Safe Stringify这次计算的结果。
  return json.replace(JS_LINE_TERMINATORS, c =>
    c === '\u2028' ? '\\u2028' : '\\u2029',
  )
}

/**
 * JSON.stringify for one-message-per-line transports. Escapes U+2028
 * LINE SEPARATOR and U+2029 PARAGRAPH SEPARATOR so the serialized output
 * cannot be broken by a line-splitting receiver. Output is still valid
 * JSON and parses to the same value.
 */
// ndjsonSafeStringify 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ndjsonSafeStringify(value: unknown): string {
  // 返回 `escapeJsLineTerminators(jsonStringify(value))`，作为ndjson Safe Stringify这次计算的结果。
  return escapeJsLineTerminators(jsonStringify(value))
}
