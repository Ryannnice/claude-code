// This file represents useful wrappers over node:child_process
// These wrappers ease error handling and cross-platform compatbility
// By using execa, Windows automatically gets shell escaping + BAT / CMD handling

// 引入 ExecaError、execa，将 execa 中已经封装好的能力接到本文件流程里。
import { type ExecaError, execa } from 'execa'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'

// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { execSyncWithDefaults_DEPRECATED } from './execFileNoThrowPortable.js'

// MS_IN_SECOND 命名 `1000`，让后续代码直接表达这个值的用途。
const MS_IN_SECOND = 1000
// SECONDS_IN_MINUTE保存`60`，供后续判断或组装使用。
const SECONDS_IN_MINUTE = 60

// ExecFileOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ExecFileOptions = {
  abortSignal?: AbortSignal
  timeout?: number
  preserveOutputOnError?: boolean
  // Setting useCwd=false avoids circular dependencies during initialization
  // getCwd() -> PersistentShell -> logEvent() -> execFileNoThrow
  useCwd?: boolean
  env?: NodeJS.ProcessEnv
  stdin?: 'ignore' | 'inherit' | 'pipe'
  input?: string
}

// execFileNoThrow 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execFileNoThrow(
  file: string,
  args: string[],
  options: ExecFileOptions = {
    timeout: 10 * SECONDS_IN_MINUTE * MS_IN_SECOND,
    preserveOutputOnError: true,
    useCwd: true,
  },
): Promise<{ stdout: string; stderr: string; code: number; error?: string }> {
  // 返回 `execFileNoThrowWithCwd(file, args, {`，作为共享工具这次计算的结果。
  return execFileNoThrowWithCwd(file, args, {
    abortSignal: options.abortSignal,
    timeout: options.timeout,
    preserveOutputOnError: options.preserveOutputOnError,
    cwd: options.useCwd ? getCwd() : undefined,
    env: options.env,
    stdin: options.stdin,
    input: options.input,
  })
}

// ExecFileWithCwdOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ExecFileWithCwdOptions = {
  abortSignal?: AbortSignal
  timeout?: number
  preserveOutputOnError?: boolean
  maxBuffer?: number
  cwd?: string
  env?: NodeJS.ProcessEnv
  shell?: boolean | string | undefined
  stdin?: 'ignore' | 'inherit' | 'pipe'
  input?: string
}

// ExecaResultWithError 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ExecaResultWithError = {
  shortMessage?: string
  signal?: string
}

/**
 * Extracts a human-readable error message from an execa result.
 *
 * Priority order:
 * 1. shortMessage - execa's human-readable error (e.g., "Command failed with exit code 1: ...")
 *    This is preferred because it already includes signal info when a process is killed,
 *    making it more informative than just the signal name.
 * 2. signal - the signal that killed the process (e.g., "SIGTERM")
 * 3. errorCode - fallback to just the numeric exit code
 */
// getErrorMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getErrorMessage(
  result: ExecaResultWithError,
  errorCode: number,
): string {
  // 满足 `result.shortMessage` 时，共享工具执行该分支。
  if (result.shortMessage) {
    // 返回 `result.shortMessage`，作为共享工具这次计算的结果。
    return result.shortMessage
  }
  // 当 `typeof result.signal` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof result.signal === 'string') {
    // 返回 `result.signal`，作为共享工具这次计算的结果。
    return result.signal
  }
  // 返回 `String(errorCode)`，作为共享工具这次计算的结果。
  return String(errorCode)
}

/**
 * execFile, but always resolves (never throws)
 */
// execFileNoThrowWithCwd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function execFileNoThrowWithCwd(
  file: string,
  args: string[],
  {
    abortSignal,
    timeout: finalTimeout = 10 * SECONDS_IN_MINUTE * MS_IN_SECOND,
    preserveOutputOnError: finalPreserveOutput = true,
    cwd: finalCwd,
    env: finalEnv,
    maxBuffer,
    shell,
    stdin: finalStdin,
    input: finalInput,
  }: ExecFileWithCwdOptions = {
    timeout: 10 * SECONDS_IN_MINUTE * MS_IN_SECOND,
    preserveOutputOnError: true,
    maxBuffer: 1_000_000,
  },
): Promise<{ stdout: string; stderr: string; code: number; error?: string }> {
  // 返回 `new Promise(resolve => {`，作为共享工具这次计算的结果。
  return new Promise(resolve => {
    // Use execa for cross-platform .bat/.cmd compatibility on Windows
    // 调用 execa，触发共享工具此处需要的副作用。
    execa(file, args, {
      maxBuffer,
      signal: abortSignal,
      timeout: finalTimeout,
      cwd: finalCwd,
      env: finalEnv,
      shell,
      stdin: finalStdin,
      input: finalInput,
      reject: false, // Don't throw on non-zero exit codes
    })
      // 链式调用 then，继续加工上一行在共享工具中产生的数据。
      .then(result => {
        // 满足 `result.failed` 时，共享工具执行该分支。
        if (result.failed) {
          // 满足 `finalPreserveOutput` 时，共享工具执行该分支。
          if (finalPreserveOutput) {
            // errorCode 错误信息保存`result.exitCode ?? 1`，供后续判断或组装使用。
            const errorCode = result.exitCode ?? 1
            // 显式忽略 `resolve({` 的返回值，只保留它触发的副作用。
            void resolve({
              stdout: result.stdout || '',
              stderr: result.stderr || '',
              code: errorCode,
              error: getErrorMessage(
                result as unknown as ExecaResultWithError,
                errorCode,
              ),
            })
          } else {
            // 显式忽略 `resolve({ stdout: '', stderr: '', code: result.exitCode ?? 1 })` 的返回值，只保留它触发的副作用。
            void resolve({ stdout: '', stderr: '', code: result.exitCode ?? 1 })
          }
        } else {
          // 显式忽略 `resolve({` 的返回值，只保留它触发的副作用。
          void resolve({
            stdout: result.stdout,
            stderr: result.stderr,
            code: 0,
          })
        }
      })
      // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
      .catch((error: ExecaError) => {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // 显式忽略 `resolve({ stdout: '', stderr: '', code: 1 })` 的返回值，只保留它触发的副作用。
        void resolve({ stdout: '', stderr: '', code: 1 })
      })
  })
}
