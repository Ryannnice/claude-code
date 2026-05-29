// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { appendFile, mkdir, symlink, unlink } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 getSessionId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from 'src/bootstrap/state.js'

// 引入 BufferedWriter、createBufferedWriter，将 ./bufferedWriter.js 中已经封装好的能力接到本文件流程里。
import { type BufferedWriter, createBufferedWriter } from './bufferedWriter.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type DebugFilter,
  parseDebugFilter,
  shouldShowDebugMessage,
} from './debugFilter.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 writeToStderr，将 ./process.js 中已经封装好的能力接到本文件流程里。
import { writeToStderr } from './process.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// DebugLogLevel 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DebugLogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error'

// LEVEL_ORDER 集中保存共享工具 debug要一起传递的字段。
const LEVEL_ORDER: Record<DebugLogLevel, number> = {
  verbose: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
}

/**
 * Minimum log level to include in debug output. Defaults to 'debug', which
 * filters out 'verbose' messages. Set CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose to
 * include high-volume diagnostics (e.g. full statusLine command, shell, cwd,
 * stdout/stderr) that would otherwise drown out useful debug output.
 */
// getMinDebugLogLevel保存`memoize`，供共享工具后续处理使用。
export const getMinDebugLogLevel = memoize((): DebugLogLevel => {
  // 原始文本保存`toLowerCase`，供共享工具后续处理使用。
  const raw = process.env.CLAUDE_CODE_DEBUG_LOG_LEVEL?.toLowerCase().trim()
  // 只有 `raw && Object.hasOwn(LEVEL_ORDER, raw)` 满足时，共享工具才执行该分支。
  if (raw && Object.hasOwn(LEVEL_ORDER, raw)) {
    // 返回 `raw as DebugLogLevel`，作为共享工具这次计算的结果。
    return raw as DebugLogLevel
  }
  // 返回 `'debug'`，作为共享工具这次计算的结果。
  return 'debug'
})

// runtimeDebugEnabled标记共享工具 debug是否启用对应路径。
let runtimeDebugEnabled = false

// isDebugMode记录 `memoize` 是否成立，共享工具随后按该结果分支。
export const isDebugMode = memoize((): boolean => {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    runtimeDebugEnabled ||
    isEnvTruthy(process.env.DEBUG) ||
    isEnvTruthy(process.env.DEBUG_SDK) ||
    process.argv.includes('--debug') ||
    process.argv.includes('-d') ||
    isDebugToStdErr() ||
    // Also check for --debug=pattern syntax
    // 调用 process.argv.some，触发共享工具此处需要的副作用。
    process.argv.some(arg => arg.startsWith('--debug=')) ||
    // --debug-file implicitly enables debug mode
    getDebugFilePath() !== null
  )
})

/**
 * Enables debug logging mid-session (e.g. via /debug). Non-ants don't write
 * debug logs by default, so this lets them start capturing without restarting
 * with --debug. Returns true if logging was already active.
 */
// enableDebugLogging 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function enableDebugLogging(): boolean {
  // wasActive保存`isDebugMode`，供共享工具后续处理使用。
  const wasActive = isDebugMode() || process.env.USER_TYPE === 'ant'
  // runtimeDebugEnabled更新为 `true`，确保共享工具后续读取最新状态。
  runtimeDebugEnabled = true
  // 调用 isDebugMode.cache.clear?.()，完成这一处局部操作。
  isDebugMode.cache.clear?.()
  // 返回 `wasActive`，作为共享工具这次计算的结果。
  return wasActive
}

// Extract and parse debug filter from command line arguments
// Exported for testing purposes
// getDebugFilter保存`memoize`，供共享工具后续处理使用。
export const getDebugFilter = memoize((): DebugFilter | null => {
  // Look for --debug=pattern in argv
  // debugArg筛选`argv.find`，供共享工具后续处理使用。
  const debugArg = process.argv.find(arg => arg.startsWith('--debug='))
  // debugArg缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!debugArg) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Extract the pattern after the equals sign
  // filterPattern格式化`debugArg.substring`，供共享工具后续处理使用。
  const filterPattern = debugArg.substring('--debug='.length)
  // 返回 `parseDebugFilter(filterPattern)`，作为共享工具这次计算的结果。
  return parseDebugFilter(filterPattern)
})

// isDebugToStdErr记录 `memoize` 是否成立，共享工具随后按该结果分支。
export const isDebugToStdErr = memoize((): boolean => {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    process.argv.includes('--debug-to-stderr') || process.argv.includes('-d2e')
  )
})

// getDebugFilePath 路径数据保存`memoize`，供共享工具后续处理使用。
export const getDebugFilePath = memoize((): string | null => {
  // 按索引扫描 `process.argv.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < process.argv.length; i++) {
    // 当前参数读取 `process.argv[i]!` 对应条目，后续围绕该成员继续处理。
    const arg = process.argv[i]!
    // 满足 `arg.startsWith('--debug-file=')` 时，共享工具执行该分支。
    if (arg.startsWith('--debug-file=')) {
      // 返回 `arg.substring('--debug-file='.length)`，作为共享工具这次计算的结果。
      return arg.substring('--debug-file='.length)
    }
    // 只有 `arg === '--debug-file' && i + 1 < process.argv.le` 满足时，共享工具才执行该分支。
    if (arg === '--debug-file' && i + 1 < process.argv.length) {
      // 返回 `process.argv[i + 1]!`，作为共享工具这次计算的结果。
      return process.argv[i + 1]!
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
})

// shouldLogDebugMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldLogDebugMessage(message: string): boolean {
  // 只有 `process.env.NODE_ENV === 'test' && !isDebugToStdErr()` 满足时，共享工具才执行该分支。
  if (process.env.NODE_ENV === 'test' && !isDebugToStdErr()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Non-ants only write debug logs when debug mode is active (via --debug at
  // startup or /debug mid-session). Ants always log for /share, bug reports.
  // `process.env.USER_TYPE` 与 `'ant' && !isDebugMode()` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant' && !isDebugMode()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 共享工具在这里按实际状态进入对应分支。
  if (
    typeof process === 'undefined' ||
    typeof process.versions === 'undefined' ||
    typeof process.versions.node === 'undefined'
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // filter读取`getDebugFilter`，供共享工具后续处理使用。
  const filter = getDebugFilter()
  // 返回 `shouldShowDebugMessage(message, filter)`，作为共享工具这次计算的结果。
  return shouldShowDebugMessage(message, filter)
}

// hasFormattedOutput标记共享工具 debug是否启用对应路径。
let hasFormattedOutput = false
// setHasFormattedOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setHasFormattedOutput(value: boolean): void {
  // hasFormattedOutput更新为 `value`，确保共享工具后续读取最新状态。
  hasFormattedOutput = value
}
// getHasFormattedOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHasFormattedOutput(): boolean {
  // 返回 `hasFormattedOutput`，作为共享工具这次计算的结果。
  return hasFormattedOutput
}

// debugWriter初始化为空值，后续分支会在有数据时补齐。
let debugWriter: BufferedWriter | null = null
// pendingWrite读取`Promise.resolve()`，供后续判断或组装使用。
let pendingWrite: Promise<void> = Promise.resolve()

// Module-level so .bind captures only its explicit args, not the
// writeFn closure's parent scope (Jarred, #22257).
// appendAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function appendAsync(
  needMkdir: boolean,
  dir: string,
  path: string,
  content: string,
): Promise<void> {
  // 满足 `needMkdir` 时，共享工具执行该分支。
  if (needMkdir) {
    // 这个回调绑定到 await mkdir(dir, { recursive: true }).catch(() => {})，负责共享工具在该局部场景下的响应。
    await mkdir(dir, { recursive: true }).catch(() => {})
  }
  // 等待 `appendFile(path, content)` 完成，再继续共享工具 debug的异步流程。
  await appendFile(path, content)
  // 显式忽略 `updateLatestDebugLogSymlink()` 的返回值，只保留它触发的副作用。
  void updateLatestDebugLogSymlink()
}

// noop 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function noop(): void {}

// getDebugWriter 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDebugWriter(): BufferedWriter {
  // debugWriter缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!debugWriter) {
    // ensuredDir初始化为空值，后续分支会在有数据时补齐。
    let ensuredDir: string | null = null
    // debugWriter更新为 `createBufferedWriter({`，确保共享工具后续读取最新状态。
    debugWriter = createBufferedWriter({
      // 这个回调绑定到 writeFn: content => {，负责共享工具在该局部场景下的响应。
      writeFn: content => {
        // 路径读取`getDebugLogPath`，供共享工具后续处理使用。
        const path = getDebugLogPath()
        // dir保存`dirname`，供共享工具后续处理使用。
        const dir = dirname(path)
        // needMkdir标记共享工具 debug是否启用对应路径。
        const needMkdir = ensuredDir !== dir
        // ensuredDir更新为 `dir`，确保共享工具后续读取最新状态。
        ensuredDir = dir
        // 满足 `isDebugMode()` 时，共享工具执行该分支。
        if (isDebugMode()) {
          // immediateMode: must stay sync. Async writes are lost on direct
          // process.exit() and keep the event loop alive in beforeExit
          // handlers (infinite loop with Perfetto tracing). See #22257.
          // 满足 `needMkdir` 时，共享工具执行该分支。
          if (needMkdir) {
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // 调用 getFsImplementation，触发共享工具此处需要的副作用。
              getFsImplementation().mkdirSync(dir)
            } catch {
              // Directory already exists
            }
          }
          // 调用 getFsImplementation，触发共享工具此处需要的副作用。
          getFsImplementation().appendFileSync(path, content)
          // 显式忽略 `updateLatestDebugLogSymlink()` 的返回值，只保留它触发的副作用。
          void updateLatestDebugLogSymlink()
          // 共享工具 debug在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // Buffered path (ants without --debug): flushes ~1/sec so chain
        // depth stays ~1. .bind over a closure so only the bound args are
        // retained, not this scope.
        // pendingWrite更新为 `pendingWrite`，确保共享工具后续读取最新状态。
        pendingWrite = pendingWrite
          .then(appendAsync.bind(null, needMkdir, dir, path, content))
          .catch(noop)
      },
      flushIntervalMs: 1000,
      maxBufferSize: 100,
      immediateMode: isDebugMode(),
    })
    // 调用 registerCleanup，触发共享工具此处需要的副作用。
    registerCleanup(async () => {
      // 调用 debugWriter?.dispose()，完成这一处局部操作。
      debugWriter?.dispose()
      // 等待 `pendingWrite` 完成，再继续共享工具 debug的异步流程。
      await pendingWrite
    })
  }
  // 返回 `debugWriter`，作为共享工具这次计算的结果。
  return debugWriter
}

// flushDebugLogs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function flushDebugLogs(): Promise<void> {
  // 调用 debugWriter?.flush()，完成这一处局部操作。
  debugWriter?.flush()
  // 等待 `pendingWrite` 完成，再继续共享工具 debug的异步流程。
  await pendingWrite
}

// logForDebugging 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logForDebugging(
  message: string,
  { level }: { level: DebugLogLevel } = {
    level: 'debug',
  },
): void {
  // 满足 `LEVEL_ORDER[level] < LEVEL_ORDER[getMinDebugLogLevel()]` 时，共享工具执行该分支。
  if (LEVEL_ORDER[level] < LEVEL_ORDER[getMinDebugLogLevel()]) {
    // 共享工具 debug在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `!shouldLogDebugMessage(message)` 时，共享工具执行该分支。
  if (!shouldLogDebugMessage(message)) {
    // 共享工具 debug在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Multiline messages break the jsonl output format, so make any multiline messages JSON.
  // 只有 `hasFormattedOutput && message.includes('\n')` 满足时，共享工具才执行该分支。
  if (hasFormattedOutput && message.includes('\n')) {
    // 消息更新为 `jsonStringify(message)`，确保共享工具后续读取最新状态。
    message = jsonStringify(message)
  }
  // timestamp记录时间`Date`，供共享工具后续处理使用。
  const timestamp = new Date().toISOString()
  // output保存`level.toUpperCase`，供共享工具后续处理使用。
  const output = `${timestamp} [${level.toUpperCase()}] ${message.trim()}\n`
  // 满足 `isDebugToStdErr()` 时，共享工具执行该分支。
  if (isDebugToStdErr()) {
    // 调用 writeToStderr，触发共享工具此处需要的副作用。
    writeToStderr(output)
    // 共享工具 debug在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 getDebugWriter，触发共享工具此处需要的副作用。
  getDebugWriter().write(output)
}

// getDebugLogPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDebugLogPath(): string {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getDebugFilePath() ??
    process.env.CLAUDE_CODE_DEBUG_LOGS_DIR ??
    join(getClaudeConfigHomeDir(), 'debug', `${getSessionId()}.txt`)
  )
}

/**
 * Updates the latest debug log symlink to point to the current debug log file.
 * Creates or updates a symlink at ~/.claude/debug/latest
 */
// updateLatestDebugLogSymlink保存`memoize`，供共享工具后续处理使用。
const updateLatestDebugLogSymlink = memoize(async (): Promise<void> => {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // debugLogPath 路径数据读取`getDebugLogPath`，供共享工具后续处理使用。
    const debugLogPath = getDebugLogPath()
    // debugLogsDir保存`dirname`，供共享工具后续处理使用。
    const debugLogsDir = dirname(debugLogPath)
    // latestSymlinkPath 路径数据格式化`join`，供共享工具后续处理使用。
    const latestSymlinkPath = join(debugLogsDir, 'latest')

    // 这个回调绑定到 await unlink(latestSymlinkPath).catch(() => {})，负责共享工具在该局部场景下的响应。
    await unlink(latestSymlinkPath).catch(() => {})
    // 等待 `symlink(debugLogPath, latestSymlinkPath)` 完成，再继续共享工具 debug的异步流程。
    await symlink(debugLogPath, latestSymlinkPath)
  } catch {
    // Silently fail if symlink creation fails
  }
})

/**
 * Logs errors for Ants only, always visible in production.
 */
// logAntError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logAntError(context: string, error: unknown): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 共享工具 debug在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 只有 `error instanceof Error && error.stack` 满足时，共享工具才执行该分支。
  if (error instanceof Error && error.stack) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[ANT-ONLY] ${context} stack trace:\n${error.stack}`, {
      level: 'error',
    })
  }
}
