// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { BetaMessageStreamParams } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, readFile, stat } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 类型依赖 { QuerySource } 来自 src/constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from 'src/constants/querySource.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  setLastAPIRequest,
  setLastAPIRequestMessages,
} from '../bootstrap/state.js'
// 引入 TICK_TAG，将 ../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { TICK_TAG } from '../constants/xml.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type LogOption,
  type SerializedMessage,
  sortLogs,
} from '../types/logs.js'
// 引入 CACHE_PATHS，将 ./cachePaths.js 中已经封装好的能力接到本文件流程里。
import { CACHE_PATHS } from './cachePaths.js'
// 引入 stripDisplayTags、stripDisplayTagsAllowEmpty，将 ./displayTags.js 中已经封装好的能力接到本文件流程里。
import { stripDisplayTags, stripDisplayTagsAllowEmpty } from './displayTags.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from './errors.js'
// 引入 isEssentialTrafficOnly，将 ./privacyLevel.js 中已经封装好的能力接到本文件流程里。
import { isEssentialTrafficOnly } from './privacyLevel.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'

/**
 * Gets the display title for a log/session with fallback logic.
 * Skips firstPrompt if it starts with a tick/goal tag (autonomous mode auto-prompt).
 * Strips display-unfriendly tags (like <ide_opened_file>) from the result.
 * Falls back to a truncated session ID when no other title is available.
 */
// getLogDisplayTitle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLogDisplayTitle(
  log: LogOption,
  defaultTitle?: string,
): string {
  // Skip firstPrompt if it's a tick/goal message (autonomous mode auto-prompt)
  // isAutonomousPrompt记录 `startsWith` 是否成立，共享工具随后按该结果分支。
  const isAutonomousPrompt = log.firstPrompt?.startsWith(`<${TICK_TAG}>`)
  // Strip display-unfriendly tags (command-name, ide_opened_file, etc.) early
  // so that command-only prompts (e.g. /clear) become empty and fall through
  // to the next fallback instead of showing raw XML tags.
  // Note: stripDisplayTags returns the original when stripping yields empty,
  // so we call stripDisplayTagsAllowEmpty to detect command-only prompts.
  // strippedFirstPrompt 命名 `log.firstPrompt`，让后续代码直接表达这个值的用途。
  const strippedFirstPrompt = log.firstPrompt
    ? stripDisplayTagsAllowEmpty(log.firstPrompt)
    : ''
  // useFirstPrompt标记共享工具 log是否启用对应路径。
  const useFirstPrompt = strippedFirstPrompt && !isAutonomousPrompt
  // title 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const title =
    log.agentName ||
    log.customTitle ||
    log.summary ||
    (useFirstPrompt ? strippedFirstPrompt : undefined) ||
    defaultTitle ||
    // For autonomous sessions without other context, show a meaningful label
    (isAutonomousPrompt ? 'Autonomous session' : undefined) ||
    // Fall back to truncated session ID for lite logs with no metadata
    (log.sessionId ? log.sessionId.slice(0, 8) : '') ||
    ''
  // Strip display-unfriendly tags (like <ide_opened_file>) for cleaner titles
  // 返回 `stripDisplayTags(title).trim()`，作为共享工具这次计算的结果。
  return stripDisplayTags(title).trim()
}

// dateToFilename 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dateToFilename(date: Date): string {
  // 返回 `date.toISOString().replace(/[:.]/g, '-')`，作为共享工具这次计算的结果。
  return date.toISOString().replace(/[:.]/g, '-')
}

// In-memory error log for recent errors
// Moved from bootstrap/state.ts to break import cycle
// MAX_IN_MEMORY_ERRORS 错误信息 命名 `100`，让后续代码直接表达这个值的用途。
const MAX_IN_MEMORY_ERRORS = 100
// inMemoryErrorLog 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
let inMemoryErrorLog: Array<{ error: string; timestamp: string }> = []

// addToInMemoryErrorLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addToInMemoryErrorLog(errorInfo: {
  error: string
  timestamp: string
}): void {
  // 满足 `inMemoryErrorLog.length >= MAX_IN_MEMORY_ERRORS` 时，共享工具执行该分支。
  if (inMemoryErrorLog.length >= MAX_IN_MEMORY_ERRORS) {
    // 调用 inMemoryErrorLog.shift，触发共享工具此处需要的副作用。
    inMemoryErrorLog.shift() // Remove oldest error
  }
  // inMemoryErrorLog 错误信息追加新条目，保持收集顺序与输入顺序一致。
  inMemoryErrorLog.push(errorInfo)
}

/**
 * Sink interface for the error logging backend
 */
// ErrorLogSink 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ErrorLogSink = {
  // 这个回调绑定到 logError: (error: Error) => void，负责共享工具在该局部场景下的响应。
  logError: (error: Error) => void
  // 这个回调绑定到 logMCPError: (serverName: string, error: unknown) => void，负责共享工具在该局部场景下的响应。
  logMCPError: (serverName: string, error: unknown) => void
  // 这个回调绑定到 logMCPDebug: (serverName: string, message: string) => void，负责共享工具在该局部场景下的响应。
  logMCPDebug: (serverName: string, message: string) => void
  // 这个回调绑定到 getErrorsPath: () => string，负责共享工具在该局部场景下的响应。
  getErrorsPath: () => string
  // 这个回调绑定到 getMCPLogsPath: (serverName: string) => string，负责共享工具在该局部场景下的响应。
  getMCPLogsPath: (serverName: string) => string
}

// Queued events for events logged before sink is attached
// QueuedErrorEvent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type QueuedErrorEvent =
  | { type: 'error'; error: Error }
  | { type: 'mcpError'; serverName: string; error: unknown }
  | { type: 'mcpDebug'; serverName: string; message: string }

// errorQueue 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
const errorQueue: QueuedErrorEvent[] = []

// Sink - initialized during app startup
// errorLogSink 错误信息初始化为空值，后续分支会在有数据时补齐。
let errorLogSink: ErrorLogSink | null = null

/**
 * Attach the error log sink that will receive all error events.
 * Queued events are drained immediately to ensure no errors are lost.
 *
 * Idempotent: if a sink is already attached, this is a no-op. This allows
 * calling from both the preAction hook (for subcommands) and setup() (for
 * the default command) without coordination.
 */
// attachErrorLogSink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function attachErrorLogSink(newSink: ErrorLogSink): void {
  // `errorLogSink` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (errorLogSink !== null) {
    // 共享工具 log在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // errorLogSink 错误信息更新为 `newSink`，确保共享工具后续读取最新状态。
  errorLogSink = newSink

  // Drain the queue immediately - errors should not be delayed
  // 满足 `errorQueue.length > 0` 时，共享工具执行该分支。
  if (errorQueue.length > 0) {
    // queuedEvents 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const queuedEvents = [...errorQueue]
    // errorQueue 错误信息被清空，共享工具从干净状态继续。
    errorQueue.length = 0

    // 按顺序遍历 `queuedEvents` 中的event，逐个交给共享工具处理。
    for (const event of queuedEvents) {
      // 按照 event.type 的取值选择共享工具的具体处理分支。
      switch (event.type) {
        case 'error':
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          errorLogSink.logError(event.error)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'mcpError':
          // 调用 errorLogSink.logMCPError，触发共享工具此处需要的副作用。
          errorLogSink.logMCPError(event.serverName, event.error)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        case 'mcpDebug':
          // 调用 errorLogSink.logMCPDebug，触发共享工具此处需要的副作用。
          errorLogSink.logMCPDebug(event.serverName, event.message)
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
      }
    }
  }
}

/**
 * Logs an error to multiple destinations for debugging and monitoring.
 *
 * This function logs errors to:
 * - Debug logs (visible via `claude --debug` or `tail -f ~/.claude/debug/latest`)
 * - In-memory error log (accessible via `getInMemoryErrors()`, useful for including
 *   in bug reports or displaying recent errors to users)
 * - Persistent error log file (only for internal 'ant' users, stored in ~/.claude/errors/)
 *
 * Usage:
 * ```ts
 * logError(new Error('Failed to connect'))
 * ```
 *
 * To view errors:
 * - Debug: Run `claude --debug` or `tail -f ~/.claude/debug/latest`
 * - In-memory: Call `getInMemoryErrors()` to get recent errors for the current session
 */
// isHardFailMode记录 `memoize` 是否成立，共享工具随后按该结果分支。
const isHardFailMode = memoize((): boolean => {
  // 返回 `process.argv.includes('--hard-fail')`，作为共享工具这次计算的结果。
  return process.argv.includes('--hard-fail')
})

// logError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logError(error: unknown): void {
  // err保存`toError`，供共享工具后续处理使用。
  const err = toError(error)
  // 只有 `feature('HARD_FAIL') && isHardFailMode()` 满足时，共享工具才执行该分支。
  if (feature('HARD_FAIL') && isHardFailMode()) {
    // biome-ignore lint/suspicious/noConsole:: intentional crash output
    // 调用 console.error，触发共享工具此处需要的副作用。
    console.error('[HARD FAIL] logError called with:', err.stack || err.message)
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发共享工具此处需要的副作用。
    process.exit(1)
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Check if error reporting should be disabled
    // 共享工具在这里按实际状态进入对应分支。
    if (
      // Cloud providers (Bedrock/Vertex/Foundry) always disable features
      isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
      isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
      isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY) ||
      process.env.DISABLE_ERROR_REPORTING ||
      isEssentialTrafficOnly()
    ) {
      // 共享工具 log在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // errorStr 错误信息标记共享工具 log是否启用对应路径。
    const errorStr = err.stack || err.message

    // errorInfo 错误信息集中保存共享工具 log要一起传递的字段。
    const errorInfo = {
      error: errorStr,
      timestamp: new Date().toISOString(),
    }

    // Always add to in-memory log (no dependencies needed)
    // 调用 addToInMemoryErrorLog，触发共享工具此处需要的副作用。
    addToInMemoryErrorLog(errorInfo)

    // If sink not attached, queue the event
    // 满足 `errorLogSink === null` 时，共享工具执行该分支。
    if (errorLogSink === null) {
      // errorQueue 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorQueue.push({ type: 'error', error: err })
      // 共享工具 log在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    errorLogSink.logError(err)
  } catch {
    // pass
  }
}

// getInMemoryErrors 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInMemoryErrors(): { error: string; timestamp: string }[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...inMemoryErrorLog]
}

/**
 * Loads the list of error logs
 * @returns List of error logs sorted by date
 */
// loadErrorLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadErrorLogs(): Promise<LogOption[]> {
  // 返回 `loadLogList(CACHE_PATHS.errors())`，作为共享工具这次计算的结果。
  return loadLogList(CACHE_PATHS.errors())
}

/**
 * Gets an error log by its index
 * @param index Index in the sorted list of logs (0-based)
 * @returns Log data or null if not found
 */
// getErrorLogByIndex 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getErrorLogByIndex(
  index: number,
): Promise<LogOption | null> {
  // logs 集合读取`loadErrorLogs`，供共享工具后续处理使用。
  const logs = await loadErrorLogs()
  // 返回 `logs[index] || null`，作为共享工具这次计算的结果。
  return logs[index] || null
}

/**
 * Internal function to load and process logs from a specified path
 * @param path Directory containing logs
 * @returns Array of logs sorted by date
 * @private
 */
// loadLogList 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadLogList(path: string): Promise<LogOption[]> {
  // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let files: Awaited<ReturnType<typeof readdir>>
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `await readdir(path, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    files = await readdir(path, { withFileTypes: true })
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`No logs found at ${path}`))
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // logData保存`Promise.all`，供共享工具后续处理使用。
  const logData = await Promise.all(
    // 调用 files.map，触发共享工具此处需要的副作用。
    files.map(async (file, i) => {
      // fullPath 路径数据格式化`join`，供共享工具后续处理使用。
      const fullPath = join(path, file.name)
      // 文本内容读取`readFile`，供共享工具后续处理使用。
      const content = await readFile(fullPath, { encoding: 'utf8' })
      // 对话消息解析`jsonParse`，供共享工具后续处理使用。
      const messages = jsonParse(content) as SerializedMessage[]
      // firstMessage 消息数据 命名 `messages[0]`，让后续代码直接表达这个值的用途。
      const firstMessage = messages[0]
      // lastMessage 消息数据 命名 `messages[messages.length - 1]`，让后续代码直接表达这个值的用途。
      const lastMessage = messages[messages.length - 1]
      // firstPrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const firstPrompt =
        firstMessage?.type === 'user' &&
        typeof firstMessage?.message?.content === 'string'
          ? firstMessage?.message?.content
          : 'No prompt'

      // For new random filenames, we'll get stats from the file itself
      // fileStats 文件数据保存`stat`，供共享工具后续处理使用。
      const fileStats = await stat(fullPath)

      // Check if it's a sidechain by looking at filename
      // isSidechain记录 `fullPath.includes` 是否成立，共享工具随后按该结果分支。
      const isSidechain = fullPath.includes('sidechain')

      // For new files, use the file modified time as date
      // date保存`dateToFilename`，供共享工具后续处理使用。
      const date = dateToFilename(fileStats.mtime)

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        date,
        fullPath,
        messages,
        value: i, // hack: overwritten after sorting, right below this
        created: parseISOString(firstMessage?.timestamp || date),
        modified: lastMessage?.timestamp
          ? parseISOString(lastMessage.timestamp)
          : parseISOString(date),
        firstPrompt:
          firstPrompt.split('\n')[0]?.slice(0, 50) +
            (firstPrompt.length > 50 ? '…' : '') || 'No prompt',
        messageCount: messages.length,
        isSidechain,
      }
    }),
  )

  // 返回 `sortLogs(logData.filter(_ => _ !== null)).map((_, i) => ({`，作为共享工具这次计算的结果。
  return sortLogs(logData.filter(_ => _ !== null)).map((_, i) => ({
    ..._,
    value: i,
  }))
}

// parseISOString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseISOString(s: string): Date {
  // b格式化`s.split`，供共享工具后续处理使用。
  const b = s.split(/\D+/)
  // 返回 `new Date(`，作为共享工具这次计算的结果。
  return new Date(
    Date.UTC(
      parseInt(b[0]!, 10),
      parseInt(b[1]!, 10) - 1,
      parseInt(b[2]!, 10),
      parseInt(b[3]!, 10),
      parseInt(b[4]!, 10),
      parseInt(b[5]!, 10),
      parseInt(b[6]!, 10),
    ),
  )
}

// logMCPError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logMCPError(serverName: string, error: unknown): void {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // If sink not attached, queue the event
    // 满足 `errorLogSink === null` 时，共享工具执行该分支。
    if (errorLogSink === null) {
      // errorQueue 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorQueue.push({ type: 'mcpError', serverName, error })
      // 共享工具 log在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 errorLogSink.logMCPError，触发共享工具此处需要的副作用。
    errorLogSink.logMCPError(serverName, error)
  } catch {
    // Silently fail
  }
}

// logMCPDebug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logMCPDebug(serverName: string, message: string): void {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // If sink not attached, queue the event
    // 满足 `errorLogSink === null` 时，共享工具执行该分支。
    if (errorLogSink === null) {
      // errorQueue 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorQueue.push({ type: 'mcpDebug', serverName, message })
      // 共享工具 log在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 errorLogSink.logMCPDebug，触发共享工具此处需要的副作用。
    errorLogSink.logMCPDebug(serverName, message)
  } catch {
    // Silently fail
  }
}

/**
 * Captures the last API request for inclusion in bug reports.
 */
// captureAPIRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function captureAPIRequest(
  params: BetaMessageStreamParams,
  querySource?: QuerySource,
): void {
  // startsWith, not exact match — users with non-default output styles get
  // variants like 'repl_main_thread:outputStyle:Explanatory' (querySource.ts).
  // 只有 `!querySource || !querySource.startsWith('repl_main_thread')` 满足时，共享工具才执行该分支。
  if (!querySource || !querySource.startsWith('repl_main_thread')) {
    // 共享工具 log在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Store params WITHOUT messages to avoid retaining the entire conversation
  // for all users. Messages are already persisted to the transcript file and
  // available via React state.
  // 从 `params` 解构 messages、其余 paramsWithoutMessages，减少共享工具 log对同一对象的重复访问。
  const { messages, ...paramsWithoutMessages } = params
  // setLastAPIRequest 写入新的状态值，使共享工具后续读取保持一致。
  setLastAPIRequest(paramsWithoutMessages)
  // For ant users only: also keep a reference to the final messages array so
  // /share's serialized_conversation.json captures the exact post-compaction,
  // CLAUDE.md-injected payload the API received. Overwritten each turn;
  // dumpPrompts.ts already holds 5 full request bodies for ants, so this is
  // not a new retention class.
  // setLastAPIRequestMessages 写入新的状态值，使共享工具后续读取保持一致。
  setLastAPIRequestMessages(process.env.USER_TYPE === 'ant' ? messages : null)
}

/**
 * Reset error log state for testing purposes only.
 * @internal
 */
// _resetErrorLogForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetErrorLogForTesting(): void {
  // errorLogSink 错误信息更新为 `null`，确保共享工具后续读取最新状态。
  errorLogSink = null
  // errorQueue 错误信息被清空，共享工具从干净状态继续。
  errorQueue.length = 0
  // inMemoryErrorLog 错误信息更新为 `[]`，确保共享工具后续读取最新状态。
  inMemoryErrorLog = []
}
