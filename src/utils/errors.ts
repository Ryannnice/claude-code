// 引入 APIUserAbortError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIUserAbortError } from '@anthropic-ai/sdk'

// ClaudeError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ClaudeError extends Error {
  // 构造函数接收 message: string，把外部输入整理成实例可复用的内部状态。
  constructor(message: string) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 this.constructor.name，同步共享工具的内部状态。
    this.name = this.constructor.name
  }
}

// MalformedCommandError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class MalformedCommandError extends Error {}

// AbortError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class AbortError extends Error {
  // 构造函数接收 message?: string，把外部输入整理成实例可复用的内部状态。
  constructor(message?: string) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'AbortError'，同步共享工具的内部状态。
    this.name = 'AbortError'
  }
}

/**
 * True iff `e` is any of the abort-shaped errors the codebase encounters:
 * our AbortError class, a DOMException from AbortController.abort()
 * (.name === 'AbortError'), or the SDK's APIUserAbortError. The SDK class
 * is checked via instanceof because minified builds mangle class names —
 * constructor.name becomes something like 'nJT' and the SDK never sets
 * this.name, so string matching silently fails in production.
 */
// isAbortError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAbortError(e: unknown): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    e instanceof AbortError ||
    e instanceof APIUserAbortError ||
    (e instanceof Error && e.name === 'AbortError')
  )
}

/**
 * Custom error class for configuration file parsing errors
 * Includes the file path and the default configuration that should be used
 */
// ConfigParseError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ConfigParseError extends Error {
  filePath: string
  defaultConfig: unknown

  // 构造函数接收 message: string, filePath: string, defaultConfig:…，把外部输入整理成实例可复用的内部状态。
  constructor(message: string, filePath: string, defaultConfig: unknown) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'ConfigParseError'，同步共享工具的内部状态。
    this.name = 'ConfigParseError'
    // 更新实例字段 filePath 为 filePath，同步共享工具的内部状态。
    this.filePath = filePath
    // 更新实例字段 defaultConfig 为 defaultConfig，同步共享工具的内部状态。
    this.defaultConfig = defaultConfig
  }
}

// ShellError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ShellError extends Error {
  constructor(
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly code: number,
    public readonly interrupted: boolean,
  ) {
    // 调用 super，触发共享工具此处需要的副作用。
    super('Shell command failed')
    // 更新实例字段 name 为 'ShellError'，同步共享工具的内部状态。
    this.name = 'ShellError'
  }
}

// TeleportOperationError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class TeleportOperationError extends Error {
  constructor(
    message: string,
    public readonly formattedMessage: string,
  ) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'TeleportOperationError'，同步共享工具的内部状态。
    this.name = 'TeleportOperationError'
  }
}

/**
 * Error with a message that is safe to log to telemetry.
 * Use the long name to confirm you've verified the message contains no
 * sensitive data (file paths, URLs, code snippets).
 *
 * Single-arg: same message for user and telemetry
 * Two-arg: different messages (e.g., full message has file path, telemetry doesn't)
 *
 * @example
 * // Same message for both
 * throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
 *   'MCP server "slack" connection timed out'
 * )
 *
 * // Different messages
 * throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
 *   `MCP tool timed out after ${ms}ms`,  // Full message for logs/user
 *   'MCP tool timed out'                  // Telemetry message
 * )
 */
// TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS extends Error {
  readonly telemetryMessage: string

  // 构造函数接收 message: string, telemetryMessage?: string，把外部输入整理成实例可复用的内部状态。
  constructor(message: string, telemetryMessage?: string) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'TelemetrySafeError'，同步共享工具的内部状态。
    this.name = 'TelemetrySafeError'
    // 更新实例字段 telemetryMessage 为 telemetryMessage ?? message，同步共享工具的内部状态。
    this.telemetryMessage = telemetryMessage ?? message
  }
}

// hasExactErrorMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasExactErrorMessage(error: unknown, message: string): boolean {
  // 返回 `error instanceof Error && error.message === message`，作为共享工具这次计算的结果。
  return error instanceof Error && error.message === message
}

/**
 * Normalize an unknown value into an Error.
 * Use at catch-site boundaries when you need an Error instance.
 */
// toError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toError(e: unknown): Error {
  // 返回 `e instanceof Error ? e : new Error(String(e))`，作为共享工具这次计算的结果。
  return e instanceof Error ? e : new Error(String(e))
}

/**
 * Extract a string message from an unknown error-like value.
 * Use when you only need the message (e.g., for logging or display).
 */
// errorMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function errorMessage(e: unknown): string {
  // 返回 `e instanceof Error ? e.message : String(e)`，作为共享工具这次计算的结果。
  return e instanceof Error ? e.message : String(e)
}

/**
 * Extract the errno code (e.g., 'ENOENT', 'EACCES') from a caught error.
 * Returns undefined if the error has no code or is not an ErrnoException.
 * Replaces the `(e as NodeJS.ErrnoException).code` cast pattern.
 */
// getErrnoCode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getErrnoCode(e: unknown): string | undefined {
  // 只有 `e && typeof e === 'object' && 'code' in e && type` 满足时，共享工具才执行该分支。
  if (e && typeof e === 'object' && 'code' in e && typeof e.code === 'string') {
    // 返回 `e.code`，作为共享工具这次计算的结果。
    return e.code
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * True if the error is ENOENT (file or directory does not exist).
 * Replaces `(e as NodeJS.ErrnoException).code === 'ENOENT'`.
 */
// isENOENT 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isENOENT(e: unknown): boolean {
  // 返回 `getErrnoCode(e) === 'ENOENT'`，作为共享工具这次计算的结果。
  return getErrnoCode(e) === 'ENOENT'
}

/**
 * Extract the errno path (the filesystem path that triggered the error)
 * from a caught error. Returns undefined if the error has no path.
 * Replaces the `(e as NodeJS.ErrnoException).path` cast pattern.
 */
// getErrnoPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getErrnoPath(e: unknown): string | undefined {
  // 只有 `e && typeof e === 'object' && 'path' in e && type` 满足时，共享工具才执行该分支。
  if (e && typeof e === 'object' && 'path' in e && typeof e.path === 'string') {
    // 返回 `e.path`，作为共享工具这次计算的结果。
    return e.path
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Extract error message + top N stack frames from an unknown error.
 * Use when the error flows to the model as a tool_result — full stack
 * traces are ~500-2000 chars of mostly-irrelevant internal frames and
 * waste context tokens. Keep the full stack in debug logs instead.
 */
// shortErrorStack 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shortErrorStack(e: unknown, maxFrames = 5): string {
  // 满足 `!(e instanceof Error)) return String(e` 时，共享工具执行该分支。
  if (!(e instanceof Error)) return String(e)
  // e.stack缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!e.stack) return e.message
  // V8/Bun stack format: "Name: message\n    at frame1\n    at frame2..."
  // First line is the message; subsequent "    at " lines are frames.
  // 文本行格式化`stack.split`，供共享工具后续处理使用。
  const lines = e.stack.split('\n')
  // header读取 `lines[0] ?? e.message` 对应条目，后续围绕该成员继续处理。
  const header = lines[0] ?? e.message
  // frames 集合格式化`lines.slice`，供共享工具后续处理使用。
  const frames = lines.slice(1).filter(l => l.trim().startsWith('at '))
  // 满足 `frames.length <= maxFrames` 时，共享工具执行该分支。
  if (frames.length <= maxFrames) return e.stack
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [header, ...frames.slice(0, maxFrames)].join('\n')
}

/**
 * True if the error means the path is missing, inaccessible, or
 * structurally unreachable — use in catch blocks after fs operations to
 * distinguish expected "nothing there / no access" from unexpected errors.
 *
 * Covers:
 *  ENOENT    — path does not exist
 *  EACCES    — permission denied
 *  EPERM     — operation not permitted
 *  ENOTDIR   — a path component is not a directory (e.g. a file named
 *              `.claude` exists where a directory is expected)
 *  ELOOP     — too many symlink levels (circular symlinks)
 */
// isFsInaccessible 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFsInaccessible(e: unknown): e is NodeJS.ErrnoException {
  // code读取`getErrnoCode`，供共享工具后续处理使用。
  const code = getErrnoCode(e)
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    code === 'ENOENT' ||
    code === 'EACCES' ||
    code === 'EPERM' ||
    code === 'ENOTDIR' ||
    code === 'ELOOP'
  )
}

// AxiosErrorKind 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AxiosErrorKind =
  | 'auth' // 401/403 — caller typically sets skipRetry
  | 'timeout' // ECONNABORTED
  | 'network' // ECONNREFUSED/ENOTFOUND
  | 'http' // other axios error (may have status)
  | 'other' // not an axios error

/**
 * Classify a caught error from an axios request into one of a few buckets.
 * Replaces the ~20-line isAxiosError → 401/403 → ECONNABORTED → ECONNREFUSED
 * chain duplicated across sync-style services (settingsSync, policyLimits,
 * remoteManagedSettings, teamMemorySync).
 *
 * Checks the `.isAxiosError` marker property directly (same as
 * axios.isAxiosError()) to keep this module dependency-free.
 */
// classifyAxiosError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyAxiosError(e: unknown): {
  kind: AxiosErrorKind
  status?: number
  message: string
} {
  // 消息保存`errorMessage`，供共享工具后续处理使用。
  const message = errorMessage(e)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !e ||
    typeof e !== 'object' ||
    !('isAxiosError' in e) ||
    !e.isAxiosError
  ) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'other', message }
  }
  // err保存`e as {`，供后续判断或组装使用。
  const err = e as {
    response?: { status?: number }
    code?: string
  }
  // status 集合 命名 `err.response?.status`，让后续代码直接表达这个值的用途。
  const status = err.response?.status
  // 只有 `status === 401 || status === 403` 满足时，共享工具才执行该分支。
  if (status === 401 || status === 403) return { kind: 'auth', status, message }
  // 当 `err.code` 匹配 `'ECONNABORTED'` 时，共享工具执行对应分支。
  if (err.code === 'ECONNABORTED') return { kind: 'timeout', status, message }
  // 只有 `err.code === 'ECONNREFUSED' || err.code === 'ENOT` 满足时，共享工具才执行该分支。
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'network', status, message }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { kind: 'http', status, message }
}
