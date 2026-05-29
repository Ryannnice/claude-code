// 类型依赖 { ChildProcess, ExecFileException } 来自 child_process，用于校准共享工具的数据契约。
import type { ChildProcess, ExecFileException } from 'child_process'
// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFile, spawn } from 'child_process'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 fileURLToPath，将 url 中已经封装好的能力接到本文件流程里。
import { fileURLToPath } from 'url'
// 引入 isInBundledMode，将 ./bundledMode.js 中已经封装好的能力接到本文件流程里。
import { isInBundledMode } from './bundledMode.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvDefinedFalsy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy } from './envUtils.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 findExecutable，将 ./findExecutable.js 中已经封装好的能力接到本文件流程里。
import { findExecutable } from './findExecutable.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 countCharInString，将 ./stringUtils.js 中已经封装好的能力接到本文件流程里。
import { countCharInString } from './stringUtils.js'

// __filename 文件数据保存`fileURLToPath`，供共享工具后续处理使用。
const __filename = fileURLToPath(import.meta.url)
// we use node:path.join instead of node:url.resolve because the former doesn't encode spaces
// __dirname格式化`path.join`，供共享工具后续处理使用。
const __dirname = path.join(
  __filename,
  process.env.NODE_ENV === 'test' ? '../../../' : '../',
)

// RipgrepConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type RipgrepConfig = {
  mode: 'system' | 'builtin' | 'embedded'
  command: string
  args: string[]
  argv0?: string
}

// getRipgrepConfig 配置保存`memoize`，供共享工具后续处理使用。
const getRipgrepConfig = memoize((): RipgrepConfig => {
  // userWantsSystemRipgrep保存`isEnvDefinedFalsy`，供共享工具后续处理使用。
  const userWantsSystemRipgrep = isEnvDefinedFalsy(
    process.env.USE_BUILTIN_RIPGREP,
  )

  // Try system ripgrep if user wants it
  // 满足 `userWantsSystemRipgrep` 时，共享工具执行该分支。
  if (userWantsSystemRipgrep) {
    // 从 `findExecutable('rg', [])` 解构 cmd，减少共享工具 ripgrep对同一对象的重复访问。
    const { cmd: systemPath } = findExecutable('rg', [])
    // `systemPath` 与 `'rg'` 不一致时刷新派生状态，避免使用过期结果。
    if (systemPath !== 'rg') {
      // SECURITY: Use command name 'rg' instead of systemPath to prevent PATH hijacking
      // If we used systemPath, a malicious ./rg.exe in current directory could be executed
      // Using just 'rg' lets the OS resolve it safely with NoDefaultCurrentDirectoryInExePath protection
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { mode: 'system', command: 'rg', args: [] }
    }
  }

  // In bundled (native) mode, ripgrep is statically compiled into bun-internal
  // and dispatches based on argv[0]. We spawn ourselves with argv0='rg'.
  // 满足 `isInBundledMode()` 时，共享工具执行该分支。
  if (isInBundledMode()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      mode: 'embedded',
      command: process.execPath,
      args: ['--no-config'],
      argv0: 'rg',
    }
  }

  // rgRoot读取`path.resolve`，供共享工具后续处理使用。
  const rgRoot = path.resolve(__dirname, 'vendor', 'ripgrep')
  // command 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const command =
    process.platform === 'win32'
      ? path.resolve(rgRoot, `${process.arch}-win32`, 'rg.exe')
      : path.resolve(rgRoot, `${process.arch}-${process.platform}`, 'rg')

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { mode: 'builtin', command, args: [] }
})

// ripgrepCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ripgrepCommand(): {
  rgPath: string
  rgArgs: string[]
  argv0?: string
} {
  // 配置读取`getRipgrepConfig`，供共享工具后续处理使用。
  const config = getRipgrepConfig()
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    rgPath: config.command,
    rgArgs: config.args,
    argv0: config.argv0,
  }
}

// MAX_BUFFER_SIZE 命名 `20_000_000 // 20MB; large monorepos can have 200k+ files`，让后续代码直接表达这个值的用途。
const MAX_BUFFER_SIZE = 20_000_000 // 20MB; large monorepos can have 200k+ files

/**
 * Check if an error is EAGAIN (resource temporarily unavailable).
 * This happens in resource-constrained environments (Docker, CI) when
 * ripgrep tries to spawn too many threads.
 */
// isEagainError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEagainError(stderr: string): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    stderr.includes('os error 11') ||
    stderr.includes('Resource temporarily unavailable')
  )
}

/**
 * Custom error class for ripgrep timeouts.
 * This allows callers to distinguish between "no matches" and "timed out".
 */
// RipgrepTimeoutError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class RipgrepTimeoutError extends Error {
  constructor(
    message: string,
    public readonly partialResults: string[],
  ) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'RipgrepTimeoutError'，同步共享工具的内部状态。
    this.name = 'RipgrepTimeoutError'
  }
}

// ripGrepRaw 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ripGrepRaw(
  args: string[],
  target: string,
  abortSignal: AbortSignal,
  // 共享工具 ripgrep在这里处理 `callback: (`，完成这一小步状态转换。
  callback: (
    error: ExecFileException | null,
    stdout: string,
    stderr: string,
  ) => void,
  singleThread = false,
): ChildProcess {
  // NB: When running interactively, ripgrep does not require a path as its last
  // argument, but when run non-interactively, it will hang unless a path or file
  // pattern is provided

  // 从 `ripgrepCommand()` 解构 rgPath、rgArgs、argv0，减少共享工具 ripgrep对同一对象的重复访问。
  const { rgPath, rgArgs, argv0 } = ripgrepCommand()

  // Use single-threaded mode only if explicitly requested for this call's retry
  // threadArgs 集合读取 `singleThread ? ['-j', '1'] : []` 对应条目，后续围绕该成员继续处理。
  const threadArgs = singleThread ? ['-j', '1'] : []
  // fullArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const fullArgs = [...rgArgs, ...threadArgs, ...args, target]
  // Allow timeout to be configured via env var (in seconds), otherwise use platform defaults
  // WSL has severe performance penalty for file reads (3-5x slower on WSL2)
  // defaultTimeout读取`getPlatform`，供共享工具后续处理使用。
  const defaultTimeout = getPlatform() === 'wsl' ? 60_000 : 20_000
  // parsedSeconds 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const parsedSeconds =
    parseInt(process.env.CLAUDE_CODE_GLOB_TIMEOUT_SECONDS || '', 10) || 0
  // timeout 命名 `parsedSeconds > 0 ? parsedSeconds * 1000 : defaultTimeout`，让后续代码直接表达这个值的用途。
  const timeout = parsedSeconds > 0 ? parsedSeconds * 1000 : defaultTimeout

  // For embedded ripgrep, use spawn with argv0 (execFile doesn't support argv0 properly)
  // 满足 `argv0` 时，共享工具执行该分支。
  if (argv0) {
    // child保存`spawn`，供共享工具后续处理使用。
    const child = spawn(rgPath, fullArgs, {
      argv0,
      signal: abortSignal,
      // Prevent visible console window on Windows (no-op on other platforms)
      windowsHide: true,
    })

    // stdout 命名 `''`，让后续代码直接表达这个值的用途。
    let stdout = ''
    // stderr保存`''`，作为后续固定文本处理的输入。
    let stderr = ''
    // stdoutTruncated标记共享工具 ripgrep是否启用对应路径。
    let stdoutTruncated = false
    // stderrTruncated标记共享工具 ripgrep是否启用对应路径。
    let stderrTruncated = false

    // 这个回调绑定到 child.stdout?.on('data', (data: Buffer) => {，负责共享工具在该局部场景下的响应。
    child.stdout?.on('data', (data: Buffer) => {
      // stdoutTruncated缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!stdoutTruncated) {
        // 共享工具 ripgrep在这里处理 `stdout += data.toString()`，完成这一小步状态转换。
        stdout += data.toString()
        // 满足 `stdout.length > MAX_BUFFER_SIZE` 时，共享工具执行该分支。
        if (stdout.length > MAX_BUFFER_SIZE) {
          // stdout更新为 `stdout.slice(0, MAX_BUFFER_SIZE)`，确保共享工具后续读取最新状态。
          stdout = stdout.slice(0, MAX_BUFFER_SIZE)
          // stdoutTruncated更新为 `true`，确保共享工具后续读取最新状态。
          stdoutTruncated = true
        }
      }
    })

    // 这个回调绑定到 child.stderr?.on('data', (data: Buffer) => {，负责共享工具在该局部场景下的响应。
    child.stderr?.on('data', (data: Buffer) => {
      // stderrTruncated缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!stderrTruncated) {
        // 共享工具 ripgrep在这里处理 `stderr += data.toString()`，完成这一小步状态转换。
        stderr += data.toString()
        // 满足 `stderr.length > MAX_BUFFER_SIZE` 时，共享工具执行该分支。
        if (stderr.length > MAX_BUFFER_SIZE) {
          // stderr更新为 `stderr.slice(0, MAX_BUFFER_SIZE)`，确保共享工具后续读取最新状态。
          stderr = stderr.slice(0, MAX_BUFFER_SIZE)
          // stderrTruncated更新为 `true`，确保共享工具后续读取最新状态。
          stderrTruncated = true
        }
      }
    })

    // Set up timeout with SIGKILL escalation.
    // SIGTERM alone may not kill ripgrep if it's blocked in uninterruptible I/O
    // (e.g., deep filesystem traversal). If SIGTERM doesn't work within 5 seconds,
    // escalate to SIGKILL which cannot be caught or ignored.
    // On Windows, child.kill('SIGTERM') throws; use default signal.
    // killTimeoutId 先占位，稍后的条件分支会根据实际输入补齐它。
    let killTimeoutId: ReturnType<typeof setTimeout> | undefined
    // timeoutId保存`setTimeout`，供共享工具后续处理使用。
    const timeoutId = setTimeout(() => {
      // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
      if (process.platform === 'win32') {
        // 调用 child.kill，触发共享工具此处需要的副作用。
        child.kill()
      } else {
        // 调用 child.kill，触发共享工具此处需要的副作用。
        child.kill('SIGTERM')
        // killTimeoutId更新为 `setTimeout(c => c.kill('SIGKILL'), 5_000, child)`，确保共享工具后续读取最新状态。
        killTimeoutId = setTimeout(c => c.kill('SIGKILL'), 5_000, child)
      }
    }, timeout)

    // On Windows, both 'close' and 'error' can fire for the same process
    // (e.g. when AbortSignal kills the child). Guard against double-callback.
    // settled标记共享工具 ripgrep是否启用对应路径。
    let settled = false
    // 调用 child.on，触发共享工具此处需要的副作用。
    child.on('close', (code, signal) => {
      // 满足 `settled` 时，共享工具执行该分支。
      if (settled) return
      // settled更新为 `true`，确保共享工具后续读取最新状态。
      settled = true
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(timeoutId)
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(killTimeoutId)
      // 只有 `code === 0 || code === 1` 满足时，共享工具才执行该分支。
      if (code === 0 || code === 1) {
        // 0 = matches found, 1 = no matches (both are success)
        // 调用 callback，触发共享工具此处需要的副作用。
        callback(null, stdout, stderr)
      } else {
        // 错误 命名 `new Error(`，让后续代码直接表达这个值的用途。
        const error: ExecFileException = new Error(
          `ripgrep exited with code ${code}`,
        )
        // code更新为 `code ?? undefined`，确保共享工具后续读取最新状态。
        error.code = code ?? undefined
        // signal更新为 `signal ?? undefined`，确保共享工具后续读取最新状态。
        error.signal = signal ?? undefined
        // 调用 callback，触发共享工具此处需要的副作用。
        callback(error, stdout, stderr)
      }
    })

    // 调用 child.on，触发共享工具此处需要的副作用。
    child.on('error', (err: NodeJS.ErrnoException) => {
      // 满足 `settled` 时，共享工具执行该分支。
      if (settled) return
      // settled更新为 `true`，确保共享工具后续读取最新状态。
      settled = true
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(timeoutId)
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(killTimeoutId)
      // 错误保存`err`，供共享工具 ripgrep后续判断或输出使用。
      const error: ExecFileException = err
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(error, stdout, stderr)
    })

    // 返回 `child`，作为共享工具这次计算的结果。
    return child
  }

  // For non-embedded ripgrep, use execFile
  // Use SIGKILL as killSignal because SIGTERM may not terminate ripgrep
  // when it's blocked in uninterruptible filesystem I/O.
  // On Windows, SIGKILL throws; use default (undefined) which sends SIGTERM.
  // 返回 `execFile(`，作为共享工具这次计算的结果。
  return execFile(
    rgPath,
    fullArgs,
    {
      maxBuffer: MAX_BUFFER_SIZE,
      signal: abortSignal,
      timeout,
      killSignal: process.platform === 'win32' ? undefined : 'SIGKILL',
    },
    callback,
  )
}

/**
 * Stream-count lines from `rg --files` without buffering stdout.
 *
 * On large repos (e.g. 247k files, 16MB of paths), calling `ripGrep()` just
 * to read `.length` materializes the full stdout string plus a 247k-element
 * array. This counts newline bytes per chunk instead; peak memory is one
 * stream chunk (~64KB).
 *
 * Intentionally minimal: the only caller is telemetry (countFilesRoundedRg),
 * which swallows all errors. No EAGAIN retry, no stderr capture, no internal
 * timeout (callers pass AbortSignal.timeout; spawn's signal option kills rg).
 */
// ripGrepFileCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function ripGrepFileCount(
  args: string[],
  target: string,
  abortSignal: AbortSignal,
): Promise<number> {
  // 等待 `codesignRipgrepIfNecessary()` 完成，再继续共享工具 ripgrep的异步流程。
  await codesignRipgrepIfNecessary()
  // 从 `ripgrepCommand()` 解构 rgPath、rgArgs、argv0，减少共享工具 ripgrep对同一对象的重复访问。
  const { rgPath, rgArgs, argv0 } = ripgrepCommand()

  // 返回 `new Promise<number>((resolve, reject) => {`，作为共享工具这次计算的结果。
  return new Promise<number>((resolve, reject) => {
    // child保存`spawn`，供共享工具后续处理使用。
    const child = spawn(rgPath, [...rgArgs, ...args, target], {
      argv0,
      signal: abortSignal,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    })

    // 文本行保存`0`，供后续判断或组装使用。
    let lines = 0
    // 这个回调绑定到 child.stdout?.on('data', (chunk: Buffer) => {，负责共享工具在该局部场景下的响应。
    child.stdout?.on('data', (chunk: Buffer) => {
      // 共享工具 ripgrep在这里处理 `lines += countCharInString(chunk, '\n')`，完成这一小步状态转换。
      lines += countCharInString(chunk, '\n')
    })

    // On Windows, both 'close' and 'error' can fire for the same process.
    // settled标记共享工具 ripgrep是否启用对应路径。
    let settled = false
    // 调用 child.on，触发共享工具此处需要的副作用。
    child.on('close', code => {
      // 满足 `settled` 时，共享工具执行该分支。
      if (settled) return
      // settled更新为 `true`，确保共享工具后续读取最新状态。
      settled = true
      // 只有 `code === 0 || code === 1) resolve(lines` 满足时，共享工具才执行该分支。
      if (code === 0 || code === 1) resolve(lines)
      else reject(new Error(`rg --files exited ${code}`))
    })
    // 调用 child.on，触发共享工具此处需要的副作用。
    child.on('error', err => {
      // 满足 `settled` 时，共享工具执行该分支。
      if (settled) return
      // settled更新为 `true`，确保共享工具后续读取最新状态。
      settled = true
      // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      reject(err)
    })
  })
}

/**
 * Stream lines from ripgrep as they arrive, calling `onLines` per stdout chunk.
 *
 * Unlike `ripGrep()` which buffers the entire stdout, this flushes complete
 * lines as soon as each chunk arrives — first results paint while rg is still
 * walking the tree (the fzf `change:reload` pattern). Partial trailing lines
 * are carried across chunk boundaries.
 *
 * Callers that want to stop early (e.g. after N matches) should abort the
 * signal — spawn's signal option kills rg. No EAGAIN retry, no internal
 * timeout, stderr is ignored; interactive callers own recovery.
 */
// ripGrepStream 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ripGrepStream(
  args: string[],
  target: string,
  abortSignal: AbortSignal,
  // 这个回调绑定到 onLines: (lines: string[]) => void,，负责共享工具在该局部场景下的响应。
  onLines: (lines: string[]) => void,
): Promise<void> {
  // 等待 `codesignRipgrepIfNecessary()` 完成，再继续共享工具 ripgrep的异步流程。
  await codesignRipgrepIfNecessary()
  // 从 `ripgrepCommand()` 解构 rgPath、rgArgs、argv0，减少共享工具 ripgrep对同一对象的重复访问。
  const { rgPath, rgArgs, argv0 } = ripgrepCommand()

  // 返回 `new Promise<void>((resolve, reject) => {`，作为共享工具这次计算的结果。
  return new Promise<void>((resolve, reject) => {
    // child保存`spawn`，供共享工具后续处理使用。
    const child = spawn(rgPath, [...rgArgs, ...args, target], {
      argv0,
      signal: abortSignal,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    })

    // stripCR保存`l.endsWith`，供共享工具后续处理使用。
    const stripCR = (l: string) => (l.endsWith('\r') ? l.slice(0, -1) : l)
    // remainder保存`''`，作为后续固定文本处理的输入。
    let remainder = ''
    // 这个回调绑定到 child.stdout?.on('data', (chunk: Buffer) => {，负责共享工具在该局部场景下的响应。
    child.stdout?.on('data', (chunk: Buffer) => {
      // data格式化`chunk.toString`，供共享工具后续处理使用。
      const data = remainder + chunk.toString()
      // 文本行格式化`data.split`，供共享工具后续处理使用。
      const lines = data.split('\n')
      // remainder更新为 `lines.pop() ?? ''`，确保共享工具后续读取最新状态。
      remainder = lines.pop() ?? ''
      // 满足 `lines.length) onLines(lines.map(stripCR)` 时，共享工具执行该分支。
      if (lines.length) onLines(lines.map(stripCR))
    })

    // On Windows, both 'close' and 'error' can fire for the same process.
    // settled标记共享工具 ripgrep是否启用对应路径。
    let settled = false
    // 调用 child.on，触发共享工具此处需要的副作用。
    child.on('close', code => {
      // 满足 `settled` 时，共享工具执行该分支。
      if (settled) return
      // Abort races close — don't flush a torn tail from a killed process.
      // Promise still settles: spawn's signal option fires 'error' with
      // AbortError → reject below.
      // 满足 `abortSignal.aborted` 时，共享工具执行该分支。
      if (abortSignal.aborted) return
      // settled更新为 `true`，确保共享工具后续读取最新状态。
      settled = true
      // 只有 `code === 0 || code === 1` 满足时，共享工具才执行该分支。
      if (code === 0 || code === 1) {
        // 满足 `remainder) onLines([stripCR(remainder)]` 时，共享工具执行该分支。
        if (remainder) onLines([stripCR(remainder)])
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve()
      } else {
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(new Error(`ripgrep exited with code ${code}`))
      }
    })
    // 调用 child.on，触发共享工具此处需要的副作用。
    child.on('error', err => {
      // 满足 `settled` 时，共享工具执行该分支。
      if (settled) return
      // settled更新为 `true`，确保共享工具后续读取最新状态。
      settled = true
      // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      reject(err)
    })
  })
}

// ripGrep 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ripGrep(
  args: string[],
  target: string,
  abortSignal: AbortSignal,
): Promise<string[]> {
  // 等待 `codesignRipgrepIfNecessary()` 完成，再继续共享工具 ripgrep的异步流程。
  await codesignRipgrepIfNecessary()

  // Test ripgrep on first use and cache the result (fire and forget)
  // 这个回调绑定到 void testRipgrepOnFirstUse().catch(error => {，负责共享工具在该局部场景下的响应。
  void testRipgrepOnFirstUse().catch(error => {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  })

  // 返回 `new Promise((resolve, reject) => {`，作为共享工具这次计算的结果。
  return new Promise((resolve, reject) => {
    // handleResult 命名 `(`，让后续代码直接表达这个值的用途。
    const handleResult = (
      error: ExecFileException | null,
      stdout: string,
      stderr: string,
      isRetry: boolean,
    ): void => {
      // Success case
      // 错误缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!error) {
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve(
          stdout
            .trim()
            .split('\n')
            // 链式调用 map，继续加工上一行在共享工具中产生的数据。
            .map(line => line.replace(/\r$/, ''))
            .filter(Boolean),
        )
        // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Exit code 1 is normal "no matches"
      // 满足 `error.code === 1` 时，共享工具执行该分支。
      if (error.code === 1) {
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve([])
        // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Critical errors that indicate ripgrep is broken, not "no matches"
      // These should be surfaced to the user rather than silently returning empty results
      // CRITICAL_ERROR_CODES 错误信息 聚合成有序列表，保持后续遍历顺序稳定。
      const CRITICAL_ERROR_CODES = ['ENOENT', 'EACCES', 'EPERM']
      // 满足 `CRITICAL_ERROR_CODES.includes(error.code as string)` 时，共享工具执行该分支。
      if (CRITICAL_ERROR_CODES.includes(error.code as string)) {
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(error)
        // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // If we hit EAGAIN and haven't retried yet, retry with single-threaded mode
      // Note: We only use -j 1 for this specific retry, not for future calls.
      // Persisting single-threaded mode globally caused timeouts on large repos
      // where EAGAIN was just a transient startup error.
      // 只有 `!isRetry && isEagainError(stderr)` 满足时，共享工具才执行该分支。
      if (!isRetry && isEagainError(stderr)) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `rg EAGAIN error detected, retrying with single-threaded mode (-j 1)`,
        )
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_ripgrep_eagain_retry', {})
        // 调用 ripGrepRaw，触发共享工具此处需要的副作用。
        ripGrepRaw(
          args,
          target,
          abortSignal,
          // 这个回调绑定到 (retryError, retryStdout, retryStderr) => {，负责共享工具在该局部场景下的响应。
          (retryError, retryStdout, retryStderr) => {
            // 调用 handleResult，触发共享工具此处需要的副作用。
            handleResult(retryError, retryStdout, retryStderr, true)
          },
          true, // Force single-threaded mode for this retry only
        )
        // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // For all other errors, try to return partial results if available
      // hasOutput记录 `stdout.trim` 是否成立，共享工具随后按该结果分支。
      const hasOutput = stdout && stdout.trim().length > 0
      // isTimeout 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isTimeout =
        error.signal === 'SIGTERM' ||
        error.signal === 'SIGKILL' ||
        error.code === 'ABORT_ERR'
      // isBufferOverflow 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isBufferOverflow =
        error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'

      // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
      let lines: string[] = []
      // 满足 `hasOutput` 时，共享工具执行该分支。
      if (hasOutput) {
        // 文本行更新为 `stdout`，确保共享工具后续读取最新状态。
        lines = stdout
          .trim()
          .split('\n')
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(line => line.replace(/\r$/, ''))
          .filter(Boolean)
        // Drop last line for timeouts and buffer overflow - it may be incomplete
        // 只有 `lines.length > 0 && (isTimeout || isBufferOverflow)` 满足时，共享工具才执行该分支。
        if (lines.length > 0 && (isTimeout || isBufferOverflow)) {
          // 文本行更新为 `lines.slice(0, -1)`，确保共享工具后续读取最新状态。
          lines = lines.slice(0, -1)
        }
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `rg error (signal=${error.signal}, code=${error.code}, stderr: ${stderr}), ${lines.length} results`,
      )

      // code 2 = ripgrep usage error (already handled); ABORT_ERR = caller
      // explicitly aborted (not an error, just a cancellation — interactive
      // callers may abort on every keystroke-after-debounce).
      // `error.code` 与 `2 && error.code !== 'ABORT_ERR'` 不一致时刷新派生状态，避免使用过期结果。
      if (error.code !== 2 && error.code !== 'ABORT_ERR') {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(error)
      }

      // If we timed out with no results, throw an error so Claude knows the search
      // didn't complete rather than thinking there were no matches
      // isTimeout && lines 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (isTimeout && lines.length === 0) {
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(
          new RipgrepTimeoutError(
            `Ripgrep search timed out after ${getPlatform() === 'wsl' ? 60 : 20} seconds. The search may have matched files but did not complete in time. Try searching a more specific path or pattern.`,
            lines,
          ),
        )
        // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve(lines)
    }

    // 调用 ripGrepRaw，触发共享工具此处需要的副作用。
    ripGrepRaw(args, target, abortSignal, (error, stdout, stderr) => {
      // 调用 handleResult，触发共享工具此处需要的副作用。
      handleResult(error, stdout, stderr, false)
    })
  })
}

/**
 * Count files in a directory recursively using ripgrep and round to the nearest power of 10 for privacy
 *
 * This is much more efficient than using native Node.js methods for counting files
 * in large directories since it uses ripgrep's highly optimized file traversal.
 *
 * @param path Directory path to count files in
 * @param abortSignal AbortSignal to cancel the operation
 * @param ignorePatterns Optional additional patterns to ignore (beyond .gitignore)
 * @returns Approximate file count rounded to the nearest power of 10
 */
// countFilesRoundedRg 文件数据保存`memoize`，供共享工具后续处理使用。
export const countFilesRoundedRg = memoize(
  async (
    dirPath: string,
    abortSignal: AbortSignal,
    ignorePatterns: string[] = [],
  ): Promise<number | undefined> => {
    // Skip file counting if we're in the home directory to avoid triggering
    // macOS TCC permission dialogs for Desktop, Downloads, Documents, etc.
    // 满足 `path.resolve(dirPath) === path.resolve(homedir())` 时，共享工具执行该分支。
    if (path.resolve(dirPath) === path.resolve(homedir())) {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Build ripgrep arguments:
      // --files: List files that would be searched (rather than searching them)
      // --count: Only print a count of matching lines for each file
      // --no-ignore-parent: Don't respect ignore files in parent directories
      // --hidden: Search hidden files and directories
      // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
      const args = ['--files', '--hidden']

      // Add ignore patterns if provided
      // 调用 ignorePatterns.forEach，触发共享工具此处需要的副作用。
      ignorePatterns.forEach(pattern => {
        // 参数列表追加新条目，保持收集顺序与输入顺序一致。
        args.push('--glob', `!${pattern}`)
      })

      // 计数保存`ripGrepFileCount`，供共享工具后续处理使用。
      const count = await ripGrepFileCount(args, dirPath, abortSignal)

      // Round to nearest power of 10 for privacy
      // 满足 `count === 0` 时，共享工具执行该分支。
      if (count === 0) return 0

      // magnitude保存`Math.floor`，供共享工具后续处理使用。
      const magnitude = Math.floor(Math.log10(count))
      // power保存`Math.pow`，供共享工具后续处理使用。
      const power = Math.pow(10, magnitude)

      // Round to nearest power of 10
      // e.g., 8 -> 10, 42 -> 100, 350 -> 100, 750 -> 1000
      // 返回 `Math.round(count / power) * power`，作为共享工具这次计算的结果。
      return Math.round(count / power) * power
    } catch (error) {
      // AbortSignal.timeout firing is expected on large/slow repos, not an error.
      // `(error as Error)?.name` 与 `'AbortError') logError(error` 不一致时刷新派生状态，避免使用过期结果。
      if ((error as Error)?.name !== 'AbortError') logError(error)
    }
  },
  // lodash memoize's default resolver only uses the first argument.
  // ignorePatterns affect the result, so include them in the cache key.
  // abortSignal is intentionally excluded — it doesn't affect the count.
  // 这个回调绑定到 (dirPath, _abortSignal, ignorePatterns = []) =>，负责共享工具在该局部场景下的响应。
  (dirPath, _abortSignal, ignorePatterns = []) =>
    `${dirPath}|${ignorePatterns.join(',')}`,
)

// Singleton to store ripgrep availability status
// ripgrepStatus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
let ripgrepStatus: {
  working: boolean
  lastTested: number
  config: RipgrepConfig
} | null = null

/**
 * Get ripgrep status and configuration info
 * Returns current configuration immediately, with working status if available
 */
// getRipgrepStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRipgrepStatus(): {
  mode: 'system' | 'builtin' | 'embedded'
  path: string
  working: boolean | null // null if not yet tested
} {
  // 配置读取`getRipgrepConfig`，供共享工具后续处理使用。
  const config = getRipgrepConfig()
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    mode: config.mode,
    path: config.command,
    working: ripgrepStatus?.working ?? null,
  }
}

/**
 * Test ripgrep availability on first use and cache the result
 */
// testRipgrepOnFirstUse保存`memoize`，供共享工具后续处理使用。
const testRipgrepOnFirstUse = memoize(async (): Promise<void> => {
  // Already tested
  // `ripgrepStatus` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (ripgrepStatus !== null) {
    // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 配置读取`getRipgrepConfig`，供共享工具后续处理使用。
  const config = getRipgrepConfig()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // test 先占位，稍后的条件分支会根据实际输入补齐它。
    let test: { code: number; stdout: string }

    // For embedded ripgrep, use Bun.spawn with argv0
    // 满足 `config.argv0` 时，共享工具执行该分支。
    if (config.argv0) {
      // Only Bun embeds ripgrep.
      // eslint-disable-next-line custom-rules/require-bun-typeof-guard
      // proc保存`Bun.spawn`，供共享工具后续处理使用。
      const proc = Bun.spawn([config.command, '--version'], {
        argv0: config.argv0,
        stderr: 'ignore',
        stdout: 'pipe',
      })

      // Bun's ReadableStream has .text() at runtime, but TS types don't reflect it
      // 并行获取 stdout、code，缩短共享工具 ripgrep等待多个独立异步任务的时间。
      const [stdout, code] = await Promise.all([
        (proc.stdout as unknown as Blob).text(),
        proc.exited,
      ])
      // test更新为 `{`，确保共享工具后续读取最新状态。
      test = {
        code,
        stdout,
      }
    } else {
      // test更新为 `await execFileNoThrow(`，确保共享工具后续读取最新状态。
      test = await execFileNoThrow(
        config.command,
        [...config.args, '--version'],
        {
          timeout: 5000,
        },
      )
    }

    // working 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const working =
      test.code === 0 && !!test.stdout && test.stdout.startsWith('ripgrep ')

    // ripgrepStatus 集合更新为 `{`，确保共享工具后续读取最新状态。
    ripgrepStatus = {
      working,
      lastTested: Date.now(),
      config,
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Ripgrep first use test: ${working ? 'PASSED' : 'FAILED'} (mode=${config.mode}, path=${config.command})`,
    )

    // Log telemetry for actual ripgrep availability
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_ripgrep_availability', {
      working: working ? 1 : 0,
      using_system: config.mode === 'system' ? 1 : 0,
    })
  } catch (error) {
    // ripgrepStatus 集合更新为 `{`，确保共享工具后续读取最新状态。
    ripgrepStatus = {
      working: false,
      lastTested: Date.now(),
      config,
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
})

// alreadyDoneSignCheck标记共享工具 ripgrep是否启用对应路径。
let alreadyDoneSignCheck = false
// codesignRipgrepIfNecessary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function codesignRipgrepIfNecessary() {
  // `process.platform` 与 `'darwin' || alreadyDoneSignC` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin' || alreadyDoneSignCheck) {
    // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // alreadyDoneSignCheck更新为 `true`，确保共享工具后续读取最新状态。
  alreadyDoneSignCheck = true

  // Only sign the standalone vendored rg binary (npm builds)
  // 配置读取`getRipgrepConfig`，供共享工具后续处理使用。
  const config = getRipgrepConfig()
  // `config.mode` 与 `'builtin'` 不一致时刷新派生状态，避免使用过期结果。
  if (config.mode !== 'builtin') {
    // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // builtinPath 路径数据保存`config.command`，供后续判断或组装使用。
  const builtinPath = config.command

  // First, check to see if ripgrep is already signed
  // 文本行 命名 `(`，让后续代码直接表达这个值的用途。
  const lines = (
    await execFileNoThrow('codesign', ['-vv', '-d', builtinPath], {
      preserveOutputOnError: false,
    })
  ).stdout.split('\n')

  // needsSigned记录 `lines.find` 是否成立，共享工具随后按该结果分支。
  const needsSigned = lines.find(line => line.includes('linker-signed'))
  // needsSigned缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!needsSigned) {
    // 共享工具 ripgrep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // signResult保存`execFileNoThrow`，供共享工具后续处理使用。
    const signResult = await execFileNoThrow('codesign', [
      '--sign',
      '-',
      '--force',
      '--preserve-metadata=entitlements,requirements,flags,runtime',
      builtinPath,
    ])

    // `signResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (signResult.code !== 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Failed to sign ripgrep: ${signResult.stdout} ${signResult.stderr}`,
        ),
      )
    }

    // quarantineResult保存`execFileNoThrow`，供共享工具后续处理使用。
    const quarantineResult = await execFileNoThrow('xattr', [
      '-d',
      'com.apple.quarantine',
      builtinPath,
    ])

    // `quarantineResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (quarantineResult.code !== 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Failed to remove quarantine: ${quarantineResult.stdout} ${quarantineResult.stderr}`,
        ),
      )
    }
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}
