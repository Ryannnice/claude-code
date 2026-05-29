/**
 * Error log sink implementation
 *
 * This module contains the heavy implementation for error logging and should be
 * initialized during app startup. It handles file-based error logging to disk.
 *
 * Usage: Call initializeErrorLogSink() during app startup to attach the sink.
 *
 * DESIGN: This module is separate from log.ts to avoid import cycles.
 * log.ts has NO heavy dependencies - events are queued until this sink is attached.
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 引入 createBufferedWriter，将 ./bufferedWriter.js 中已经封装好的能力接到本文件流程里。
import { createBufferedWriter } from './bufferedWriter.js'
// 引入 CACHE_PATHS，将 ./cachePaths.js 中已经封装好的能力接到本文件流程里。
import { CACHE_PATHS } from './cachePaths.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 attachErrorLogSink、dateToFilename，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { attachErrorLogSink, dateToFilename } from './log.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// DATE保存`dateToFilename`，供共享工具后续处理使用。
const DATE = dateToFilename(new Date())

/**
 * Gets the path to the errors log file.
 */
// getErrorsPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getErrorsPath(): string {
  // 返回 `join(CACHE_PATHS.errors(), DATE + '.jsonl')`，作为共享工具这次计算的结果。
  return join(CACHE_PATHS.errors(), DATE + '.jsonl')
}

/**
 * Gets the path to MCP logs for a server.
 */
// getMCPLogsPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMCPLogsPath(serverName: string): string {
  // 返回 `join(CACHE_PATHS.mcpLogs(serverName), DATE + '.jsonl')`，作为共享工具这次计算的结果。
  return join(CACHE_PATHS.mcpLogs(serverName), DATE + '.jsonl')
}

// JsonlWriter 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type JsonlWriter = {
  // 这个回调绑定到 write: (obj: object) => void，负责共享工具在该局部场景下的响应。
  write: (obj: object) => void
  // 这个回调绑定到 flush: () => void，负责共享工具在该局部场景下的响应。
  flush: () => void
  // 这个回调绑定到 dispose: () => void，负责共享工具在该局部场景下的响应。
  dispose: () => void
}

// createJsonlWriter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createJsonlWriter(options: {
  // 这个回调绑定到 writeFn: (content: string) => void，负责共享工具在该局部场景下的响应。
  writeFn: (content: string) => void
  flushIntervalMs?: number
  maxBufferSize?: number
}): JsonlWriter {
  // writer构建`createBufferedWriter`，供共享工具后续处理使用。
  const writer = createBufferedWriter(options)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // write 使用 obj: object 完成共享工具里的对应操作。
    write(obj: object): void {
      // 调用 writer.write，触发共享工具此处需要的副作用。
      writer.write(jsonStringify(obj) + '\n')
    },
    flush: writer.flush,
    dispose: writer.dispose,
  }
}

// Buffered writers for JSONL log files, keyed by path
// logWriters 集合构建`new Map<string, JsonlWriter>()` 整理出中间结果，供共享工具 error Log Sink后续步骤使用。
const logWriters = new Map<string, JsonlWriter>()

/**
 * Flush all buffered log writers. Used for testing.
 * @internal
 */
// _flushLogWritersForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _flushLogWritersForTesting(): void {
  // 逐项读取 `logWriters.values()` 中的writer，按输入顺序推进共享工具。
  for (const writer of logWriters.values()) {
    // 调用 writer.flush，触发共享工具此处需要的副作用。
    writer.flush()
  }
}

/**
 * Clear all buffered log writers. Used for testing.
 * @internal
 */
// _clearLogWritersForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _clearLogWritersForTesting(): void {
  // 逐项读取 `logWriters.values()` 中的writer，按输入顺序推进共享工具。
  for (const writer of logWriters.values()) {
    // 调用 writer.dispose，触发共享工具此处需要的副作用。
    writer.dispose()
  }
  // 调用 logWriters.clear，触发共享工具此处需要的副作用。
  logWriters.clear()
}

// getLogWriter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLogWriter(path: string): JsonlWriter {
  // writer读取`logWriters.get`，供共享工具后续处理使用。
  let writer = logWriters.get(path)
  // writer缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!writer) {
    // dir保存`dirname`，供共享工具后续处理使用。
    const dir = dirname(path)
    // writer更新为 `createJsonlWriter({`，确保共享工具后续读取最新状态。
    writer = createJsonlWriter({
      // sync IO: called from sync context
      // 这个回调绑定到 writeFn: (content: string) => {，负责共享工具在该局部场景下的响应。
      writeFn: (content: string) => {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // Happy-path: directory already exists
          // 调用 getFsImplementation，触发共享工具此处需要的副作用。
          getFsImplementation().appendFileSync(path, content)
        } catch {
          // If any error occurs, assume it was due to missing directory
          // 调用 getFsImplementation，触发共享工具此处需要的副作用。
          getFsImplementation().mkdirSync(dir)
          // Retry appending
          // 调用 getFsImplementation，触发共享工具此处需要的副作用。
          getFsImplementation().appendFileSync(path, content)
        }
      },
      flushIntervalMs: 1000,
      maxBufferSize: 50,
    })
    // logWriters.set 写入新的状态值，使共享工具后续读取保持一致。
    logWriters.set(path, writer)
    // 调用 registerCleanup，触发共享工具此处需要的副作用。
    registerCleanup(async () => writer?.dispose())
  }
  // 返回 `writer`，作为共享工具这次计算的结果。
  return writer
}

// appendToLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function appendToLog(path: string, message: object): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 共享工具 error Log Sink在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // messageWithTimestamp 消息数据集中保存共享工具 error Log Sink要一起传递的字段。
  const messageWithTimestamp = {
    timestamp: new Date().toISOString(),
    ...message,
    cwd: getFsImplementation().cwd(),
    userType: process.env.USER_TYPE,
    sessionId: getSessionId(),
    version: MACRO.VERSION,
  }

  // 调用 getLogWriter，触发共享工具此处需要的副作用。
  getLogWriter(path).write(messageWithTimestamp)
}

// extractServerMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractServerMessage(data: unknown): string | undefined {
  // 当 `typeof data` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof data === 'string') {
    // 返回 `data`，作为共享工具这次计算的结果。
    return data
  }
  // 当 `data && typeof data` 匹配 `'object'` 时，共享工具执行对应分支。
  if (data && typeof data === 'object') {
    // obj保存`data as Record<string, unknown>`，供后续判断或组装使用。
    const obj = data as Record<string, unknown>
    // 当 `typeof obj.message` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof obj.message === 'string') {
      // 返回 `obj.message`，作为共享工具这次计算的结果。
      return obj.message
    }
    // 共享工具在这里按实际状态进入对应分支。
    if (
      typeof obj.error === 'object' &&
      obj.error &&
      'message' in obj.error &&
      typeof (obj.error as Record<string, unknown>).message === 'string'
    ) {
      // 返回 `(obj.error as Record<string, unknown>).message as string`，作为共享工具这次计算的结果。
      return (obj.error as Record<string, unknown>).message as string
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Implementation for logError - writes error to debug log and file.
 */
// logErrorImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logErrorImpl(error: Error): void {
  // errorStr 错误信息标记共享工具 error Log Sink是否启用对应路径。
  const errorStr = error.stack || error.message

  // Enrich axios errors with request URL, status, and server message for debugging
  // context固定为 `''`，作为共享工具 error Log Sink后续展示或比较的基准。
  let context = ''
  // 只有 `axios.isAxiosError(error) && error.config?.url` 满足时，共享工具才执行该分支。
  if (axios.isAxiosError(error) && error.config?.url) {
    // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
    const parts = [`url=${error.config.url}`]
    // `error.response?.status` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (error.response?.status !== undefined) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`status=${error.response.status}`)
    }
    // serverMessage 消息数据保存`extractServerMessage`，供共享工具后续处理使用。
    const serverMessage = extractServerMessage(error.response?.data)
    // 满足 `serverMessage` 时，共享工具执行该分支。
    if (serverMessage) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`body=${serverMessage}`)
    }
    // context更新为 ``[${parts.join(',')}] ``，确保共享工具后续读取最新状态。
    context = `[${parts.join(',')}] `
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`${error.name}: ${context}${errorStr}`, { level: 'error' })

  // 调用 appendToLog，触发共享工具此处需要的副作用。
  appendToLog(getErrorsPath(), {
    error: `${context}${errorStr}`,
  })
}

/**
 * Implementation for logMCPError - writes MCP error to debug log and file.
 */
// logMCPErrorImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logMCPErrorImpl(serverName: string, error: unknown): void {
  // Not themed, to avoid having to pipe theme all the way down
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`MCP server "${serverName}" ${error}`, { level: 'error' })

  // logFile 文件数据读取`getMCPLogsPath`，供共享工具后续处理使用。
  const logFile = getMCPLogsPath(serverName)
  // errorStr 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const errorStr =
    error instanceof Error ? error.stack || error.message : String(error)

  // errorInfo 错误信息集中保存共享工具 error Log Sink要一起传递的字段。
  const errorInfo = {
    error: errorStr,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    cwd: getFsImplementation().cwd(),
  }

  // 调用 getLogWriter，触发共享工具此处需要的副作用。
  getLogWriter(logFile).write(errorInfo)
}

/**
 * Implementation for logMCPDebug - writes MCP debug message to log file.
 */
// logMCPDebugImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logMCPDebugImpl(serverName: string, message: string): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`MCP server "${serverName}": ${message}`)

  // logFile 文件数据读取`getMCPLogsPath`，供共享工具后续处理使用。
  const logFile = getMCPLogsPath(serverName)

  // debugInfo集中保存共享工具 error Log Sink要一起传递的字段。
  const debugInfo = {
    debug: message,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    cwd: getFsImplementation().cwd(),
  }

  // 调用 getLogWriter，触发共享工具此处需要的副作用。
  getLogWriter(logFile).write(debugInfo)
}

/**
 * Initialize the error log sink.
 *
 * Call this during app startup to attach the error logging backend.
 * Any errors logged before this is called will be queued and drained.
 *
 * Should be called BEFORE initializeAnalyticsSink() in the startup sequence.
 *
 * Idempotent: safe to call multiple times (subsequent calls are no-ops).
 */
// initializeErrorLogSink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeErrorLogSink(): void {
  // 调用 attachErrorLogSink，触发共享工具此处需要的副作用。
  attachErrorLogSink({
    logError: logErrorImpl,
    logMCPError: logMCPErrorImpl,
    logMCPDebug: logMCPDebugImpl,
    getErrorsPath,
    getMCPLogsPath,
  })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Error log sink initialized')
}
