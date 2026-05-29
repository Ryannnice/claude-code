// 引入 Options as ExecaOptions、execaSync，将 execa 中已经封装好的能力接到本文件流程里。
import { type Options as ExecaOptions, execaSync } from 'execa'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 引入 slowLogging，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { slowLogging } from './slowOperations.js'

// MS_IN_SECOND保存`1000`，供后续判断或组装使用。
const MS_IN_SECOND = 1000
// SECONDS_IN_MINUTE 命名 `60`，让后续代码直接表达这个值的用途。
const SECONDS_IN_MINUTE = 60

// ExecSyncOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ExecSyncOptions = {
  abortSignal?: AbortSignal
  timeout?: number
  input?: string
  stdio?: ExecaOptions['stdio']
}

/**
 * @deprecated Use `execa` directly with `{ shell: true, reject: false }` for non-blocking execution.
 * Sync exec calls block the event loop and cause performance issues.
 */
// execSyncWithDefaults_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSyncWithDefaults_DEPRECATED(command: string): string | null
/**
 * @deprecated Use `execa` directly with `{ shell: true, reject: false }` for non-blocking execution.
 * Sync exec calls block the event loop and cause performance issues.
 */
// execSyncWithDefaults_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSyncWithDefaults_DEPRECATED(
  command: string,
  options: ExecSyncOptions,
): string | null
/**
 * @deprecated Use `execa` directly with `{ shell: true, reject: false }` for non-blocking execution.
 * Sync exec calls block the event loop and cause performance issues.
 */
// execSyncWithDefaults_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSyncWithDefaults_DEPRECATED(
  command: string,
  abortSignal: AbortSignal,
  timeout?: number,
): string | null
/**
 * @deprecated Use `execa` directly with `{ shell: true, reject: false }` for non-blocking execution.
 * Sync exec calls block the event loop and cause performance issues.
 */
// execSyncWithDefaults_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execSyncWithDefaults_DEPRECATED(
  command: string,
  optionsOrAbortSignal?: ExecSyncOptions | AbortSignal,
  timeout = 10 * SECONDS_IN_MINUTE * MS_IN_SECOND,
): string | null {
  // 选项 先占位，稍后的条件分支会根据实际输入补齐它。
  let options: ExecSyncOptions

  // 满足 `optionsOrAbortSignal === undefined` 时，共享工具执行该分支。
  if (optionsOrAbortSignal === undefined) {
    // No second argument - use defaults
    // 选项更新为 `{}`，确保共享工具后续读取最新状态。
    options = {}
  // 共享工具 exec File No Throw Portable在这里处理 `} else if (optionsOrAbortSignal instanceof AbortSignal) {`，完成这一小步状态转换。
  } else if (optionsOrAbortSignal instanceof AbortSignal) {
    // Old signature - second argument is AbortSignal
    // 选项更新为 `{`，确保共享工具后续读取最新状态。
    options = {
      abortSignal: optionsOrAbortSignal,
      timeout,
    }
  } else {
    // New signature - second argument is options object
    // 选项更新为 `optionsOrAbortSignal`，确保共享工具后续读取最新状态。
    options = optionsOrAbortSignal
  }

  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    abortSignal,
    timeout: finalTimeout = 10 * SECONDS_IN_MINUTE * MS_IN_SECOND,
    input,
    stdio = ['ignore', 'pipe', 'pipe'],
  } = options

  // 调用 abortSignal?.throwIfAborted()，完成这一处局部操作。
  abortSignal?.throwIfAborted()
  // 共享工具 exec File No Throw Portable在这里处理 `using _ = slowLogging`exec: ${command.slice(0, 200)}``，完成这一小步状态转换。
  using _ = slowLogging`exec: ${command.slice(0, 200)}`
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`execaSync`，供共享工具后续处理使用。
    const result = execaSync(command, {
      env: process.env,
      maxBuffer: 1_000_000,
      timeout: finalTimeout,
      cwd: getCwd(),
      stdio,
      shell: true, // execSync typically runs shell commands
      reject: false, // Don't throw on non-zero exit codes
      input,
    })
    // result.stdout缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result.stdout) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回 `result.stdout.trim() || null`，作为共享工具这次计算的结果。
    return result.stdout.trim() || null
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}
