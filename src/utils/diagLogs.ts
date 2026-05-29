// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname } from 'path'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// DiagnosticLogLevel 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type DiagnosticLogLevel = 'debug' | 'info' | 'warn' | 'error'

// DiagnosticLogEntry 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type DiagnosticLogEntry = {
  timestamp: string
  level: DiagnosticLogLevel
  event: string
  data: Record<string, unknown>
}

/**
 * Logs diagnostic information to a logfile. This information is sent
 * via the environment manager to session-ingress to monitor issues from
 * within the container.
 *
 * *Important* - this function MUST NOT be called with any PII, including
 * file paths, project names, repo names, prompts, etc.
 *
 * @param level    Log level. Only used for information, not filtering
 * @param event    A specific event: "started", "mcp_connected", etc.
 * @param data     Optional additional data to log
 */
// sync IO: called from sync context
// logForDiagnosticsNoPII 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logForDiagnosticsNoPII(
  level: DiagnosticLogLevel,
  event: string,
  data?: Record<string, unknown>,
): void {
  // logFile 文件数据读取`getDiagnosticLogFile`，供共享工具后续处理使用。
  const logFile = getDiagnosticLogFile()
  // logFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!logFile) {
    // 共享工具 diag Logs在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // entry 集中保存共享工具 diag Logs要一起传递的字段。
  const entry: DiagnosticLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    data: data ?? {},
  }

  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // line保存`jsonStringify`，供共享工具后续处理使用。
  const line = jsonStringify(entry) + '\n'
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 fs.appendFileSync，触发共享工具此处需要的副作用。
    fs.appendFileSync(logFile, line)
  } catch {
    // If append fails, try creating the directory first
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
      fs.mkdirSync(dirname(logFile))
      // 调用 fs.appendFileSync，触发共享工具此处需要的副作用。
      fs.appendFileSync(logFile, line)
    } catch {
      // Silently fail if logging is not possible
    }
  }
}

// getDiagnosticLogFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDiagnosticLogFile(): string | undefined {
  // 返回 `process.env.CLAUDE_CODE_DIAGNOSTICS_FILE`，作为共享工具这次计算的结果。
  return process.env.CLAUDE_CODE_DIAGNOSTICS_FILE
}

/**
 * Wraps an async function with diagnostic timing logs.
 * Logs `{event}_started` before execution and `{event}_completed` after with duration_ms.
 *
 * @param event   Event name prefix (e.g., "git_status" -> logs "git_status_started" and "git_status_completed")
 * @param fn      Async function to execute and time
 * @param getData Optional function to extract additional data from the result for the completion log
 * @returns       The result of the wrapped function
 */
// withDiagnosticsTiming 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function withDiagnosticsTiming<T>(
  event: string,
  // 这个回调绑定到 fn: () => Promise<T>,，负责共享工具在该局部场景下的响应。
  fn: () => Promise<T>,
  getData?: (result: T) => Record<string, unknown>,
): Promise<T> {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
  logForDiagnosticsNoPII('info', `${event}_started`)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`fn`，供共享工具后续处理使用。
    const result = await fn()
    // additionalData读取`getData`，供共享工具后续处理使用。
    const additionalData = getData ? getData(result) : {}
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', `${event}_completed`, {
      duration_ms: Date.now() - startTime,
      ...additionalData,
    })
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (error) {
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('error', `${event}_failed`, {
      duration_ms: Date.now() - startTime,
    })
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}
