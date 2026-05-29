// 类型依赖 { ChildProcess } 来自 child_process，用于校准共享工具的数据契约。
import type { ChildProcess } from 'child_process'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 类型依赖 { Readable } 来自 stream，用于校准共享工具的数据契约。
import type { Readable } from 'stream'
// 引入 treeKill，将 tree-kill 中已经封装好的能力接到本文件流程里。
import treeKill from 'tree-kill'
// 引入 generateTaskId，将 ../Task.js 中已经封装好的能力接到本文件流程里。
import { generateTaskId } from '../Task.js'
// 引入 formatDuration，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatDuration } from './format.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  MAX_TASK_OUTPUT_BYTES,
  MAX_TASK_OUTPUT_BYTES_DISPLAY,
} from './task/diskOutput.js'
// 引入 TaskOutput，将 ./task/TaskOutput.js 中已经封装好的能力接到本文件流程里。
import { TaskOutput } from './task/TaskOutput.js'

// ExecResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExecResult = {
  stdout: string
  stderr: string
  code: number
  interrupted: boolean
  backgroundTaskId?: string
  backgroundedByUser?: boolean
  /** Set when assistant-mode auto-backgrounded a long-running blocking command. */
  assistantAutoBackgrounded?: boolean
  /** Set when stdout was too large to fit inline — points to the output file on disk. */
  outputFilePath?: string
  /** Total size of the output file in bytes (set when outputFilePath is set). */
  outputFileSize?: number
  /** The task ID for the output file (set when outputFilePath is set). */
  outputTaskId?: string
  /** Error message when the command failed before spawning (e.g., deleted cwd). */
  preSpawnError?: string
}

// ShellCommand 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellCommand = {
  // 这个回调绑定到 background: (backgroundTaskId: string) => boolean，负责共享工具在该局部场景下的响应。
  background: (backgroundTaskId: string) => boolean
  result: Promise<ExecResult>
  // 这个回调绑定到 kill: () => void，负责共享工具在该局部场景下的响应。
  kill: () => void
  status: 'running' | 'backgrounded' | 'completed' | 'killed'
  /**
   * Cleans up stream resources (event listeners).
   * Should be called after the command completes or is killed to prevent memory leaks.
   */
  // 这个回调绑定到 cleanup: () => void，负责共享工具在该局部场景下的响应。
  cleanup: () => void
  onTimeout?: (
    // 这个回调绑定到 callback: (backgroundFn: (taskId: string) => boolean) => void,，负责共享工具在该局部场景下的响应。
    callback: (backgroundFn: (taskId: string) => boolean) => void,
  ) => void
  /** The TaskOutput instance that owns all stdout/stderr data and progress. */
  taskOutput: TaskOutput
}

// SIGKILL保存`137`，供后续判断或组装使用。
const SIGKILL = 137
// SIGTERM 命名 `143`，让后续代码直接表达这个值的用途。
const SIGTERM = 143

// Background tasks write stdout/stderr directly to a file fd (no JS involvement),
// so a stuck append loop can fill the disk. Poll file size and kill when exceeded.
// SIZE_WATCHDOG_INTERVAL_MS 集合保存`5_000`，供后续判断或组装使用。
const SIZE_WATCHDOG_INTERVAL_MS = 5_000

// prependStderr 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function prependStderr(prefix: string, stderr: string): string {
  // 返回 `stderr ? `${prefix} ${stderr}` : prefix`，作为共享工具这次计算的结果。
  return stderr ? `${prefix} ${stderr}` : prefix
}

/**
 * Thin pipe from a child process stream into TaskOutput.
 * Used in pipe mode (hooks) for stdout and stderr.
 * In file mode (bash commands), both fds go to the output file —
 * the child process streams are null and no wrappers are created.
 */
// StreamWrapper 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class StreamWrapper {
  #stream: Readable | null
  #isCleanedUp = false
  #taskOutput: TaskOutput | null
  #isStderr: boolean
  #onData = this.#dataHandler.bind(this)

  // 构造函数接收 stream: Readable, taskOutput: TaskOutput, isStder…，把外部输入整理成实例可复用的内部状态。
  constructor(stream: Readable, taskOutput: TaskOutput, isStderr: boolean) {
    // 共享工具 Shell Command在这里处理 `this.#stream = stream`，完成这一小步状态转换。
    this.#stream = stream
    // 共享工具 Shell Command在这里处理 `this.#taskOutput = taskOutput`，完成这一小步状态转换。
    this.#taskOutput = taskOutput
    // 共享工具 Shell Command在这里处理 `this.#isStderr = isStderr`，完成这一小步状态转换。
    this.#isStderr = isStderr
    // Emit strings instead of Buffers - avoids repeated .toString() calls
    // stream.setEncoding 写入新的状态值，使共享工具后续读取保持一致。
    stream.setEncoding('utf-8')
    // 调用 stream.on，触发共享工具此处需要的副作用。
    stream.on('data', this.#onData)
  }

  // str格式化`data.toString`，供共享工具后续处理使用。
  #dataHandler(data: Buffer | string): void {
    // str格式化`data.toString`，供共享工具后续处理使用。
    const str = typeof data === 'string' ? data : data.toString()

    // 满足 `this.#isStderr` 时，共享工具执行该分支。
    if (this.#isStderr) {
      // 共享工具 Shell Command在这里处理 `this.#taskOutput!.writeStderr(str)`，完成这一小步状态转换。
      this.#taskOutput!.writeStderr(str)
    } else {
      // 共享工具 Shell Command在这里处理 `this.#taskOutput!.writeStdout(str)`，完成这一小步状态转换。
      this.#taskOutput!.writeStdout(str)
    }
  }

  // cleanup 使用 无 完成共享工具里的对应操作。
  cleanup(): void {
    // 满足 `this.#isCleanedUp` 时，共享工具执行该分支。
    if (this.#isCleanedUp) {
      // 共享工具 Shell Command在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 共享工具 Shell Command在这里处理 `this.#isCleanedUp = true`，完成这一小步状态转换。
    this.#isCleanedUp = true
    // 共享工具 Shell Command在这里处理 `this.#stream!.removeListener('data', this.#onData)`，完成这一小步状态转换。
    this.#stream!.removeListener('data', this.#onData)
    // Release references so the stream, its StringDecoder, and
    // the TaskOutput can be GC'd independently of this wrapper.
    // 共享工具 Shell Command在这里处理 `this.#stream = null`，完成这一小步状态转换。
    this.#stream = null
    // 共享工具 Shell Command在这里处理 `this.#taskOutput = null`，完成这一小步状态转换。
    this.#taskOutput = null
    // 这个回调绑定到 this.#onData = () => {}，负责共享工具在该局部场景下的响应。
    this.#onData = () => {}
  }
}

/**
 * Implementation of ShellCommand that wraps a child process.
 *
 * For bash commands: both stdout and stderr go to a file fd via
 * stdio[1] and stdio[2] — no JS involvement. Progress is extracted
 * by polling the file tail.
 * For hooks: pipe mode with StreamWrappers for real-time detection.
 */
// ShellCommandImpl 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class ShellCommandImpl implements ShellCommand {
  #status: 'running' | 'backgrounded' | 'completed' | 'killed' = 'running'
  #backgroundTaskId: string | undefined
  #stdoutWrapper: StreamWrapper | null
  #stderrWrapper: StreamWrapper | null
  #childProcess: ChildProcess
  #timeoutId: NodeJS.Timeout | null = null
  #sizeWatchdog: NodeJS.Timeout | null = null
  #killedForSize = false
  #maxOutputBytes: number
  #abortSignal: AbortSignal
  #onTimeoutCallback:
    // 这个回调绑定到 | ((backgroundFn: (taskId: string) => boolean) => void)，负责共享工具在该局部场景下的响应。
    | ((backgroundFn: (taskId: string) => boolean) => void)
    | undefined
  #timeout: number
  #shouldAutoBackground: boolean
  // 共享工具 Shell Command在这里处理 `#resultResolver: ((result: ExecResult) => void) | null = null`，完成这一小步状态转换。
  #resultResolver: ((result: ExecResult) => void) | null = null
  // 共享工具 Shell Command在这里处理 `#exitCodeResolver: ((code: number) => void) | null = null`，完成这一小步状态转换。
  #exitCodeResolver: ((code: number) => void) | null = null
  // 共享工具 Shell Command在这里处理 `#boundAbortHandler: (() => void) | null = null`，完成这一小步状态转换。
  #boundAbortHandler: (() => void) | null = null
  readonly taskOutput: TaskOutput

  // 共享工具 Shell Command在这里处理 `static #handleTimeout(self: ShellCommandImpl): void {`，完成这一小步状态转换。
  static #handleTimeout(self: ShellCommandImpl): void {
    // 只有 `self.#shouldAutoBackground && self.#onTimeoutCall` 满足时，共享工具才执行该分支。
    if (self.#shouldAutoBackground && self.#onTimeoutCallback) {
      // 共享工具 Shell Command在这里处理 `self.#onTimeoutCallback(self.background.bind(self))`，完成这一小步状态转换。
      self.#onTimeoutCallback(self.background.bind(self))
    } else {
      // 共享工具 Shell Command在这里处理 `self.#doKill(SIGTERM)`，完成这一小步状态转换。
      self.#doKill(SIGTERM)
    }
  }

  readonly result: Promise<ExecResult>
  // 共享工具 Shell Command在这里处理 `readonly onTimeout?: (`，完成这一小步状态转换。
  readonly onTimeout?: (
    // 这个回调绑定到 callback: (backgroundFn: (taskId: string) => boolean) => void,，负责共享工具在该局部场景下的响应。
    callback: (backgroundFn: (taskId: string) => boolean) => void,
  ) => void

  constructor(
    childProcess: ChildProcess,
    abortSignal: AbortSignal,
    timeout: number,
    taskOutput: TaskOutput,
    shouldAutoBackground = false,
    maxOutputBytes = MAX_TASK_OUTPUT_BYTES,
  ) {
    // 共享工具 Shell Command在这里处理 `this.#childProcess = childProcess`，完成这一小步状态转换。
    this.#childProcess = childProcess
    // 共享工具 Shell Command在这里处理 `this.#abortSignal = abortSignal`，完成这一小步状态转换。
    this.#abortSignal = abortSignal
    // 共享工具 Shell Command在这里处理 `this.#timeout = timeout`，完成这一小步状态转换。
    this.#timeout = timeout
    // 共享工具 Shell Command在这里处理 `this.#shouldAutoBackground = shouldAutoBackground`，完成这一小步状态转换。
    this.#shouldAutoBackground = shouldAutoBackground
    // 共享工具 Shell Command在这里处理 `this.#maxOutputBytes = maxOutputBytes`，完成这一小步状态转换。
    this.#maxOutputBytes = maxOutputBytes
    // 更新实例字段 taskOutput 为 taskOutput，同步共享工具的内部状态。
    this.taskOutput = taskOutput

    // In file mode (bash commands), both stdout and stderr go to the
    // output file fd — childProcess.stdout/.stderr are both null.
    // In pipe mode (hooks), wrap streams to funnel data into TaskOutput.
    // 共享工具 Shell Command在这里处理 `this.#stderrWrapper = childProcess.stderr`，完成这一小步状态转换。
    this.#stderrWrapper = childProcess.stderr
      ? new StreamWrapper(childProcess.stderr, taskOutput, true)
      : null
    // 共享工具 Shell Command在这里处理 `this.#stdoutWrapper = childProcess.stdout`，完成这一小步状态转换。
    this.#stdoutWrapper = childProcess.stdout
      ? new StreamWrapper(childProcess.stdout, taskOutput, false)
      : null

    // 满足 `shouldAutoBackground` 时，共享工具执行该分支。
    if (shouldAutoBackground) {
      // 更新实例字段 onTimeout 为 (callback): void => {，同步共享工具的内部状态。
      this.onTimeout = (callback): void => {
        // 共享工具 Shell Command在这里处理 `this.#onTimeoutCallback = callback`，完成这一小步状态转换。
        this.#onTimeoutCallback = callback
      }
    }

    // 更新实例字段 result 为 this.#createResultPromise()，同步共享工具的内部状态。
    this.result = this.#createResultPromise()
  }

  // 共享工具 Shell Command在这里处理 `get status(): 'running' | 'backgrounded' | 'completed' | 'killed' {`，完成这一小步状态转换。
  get status(): 'running' | 'backgrounded' | 'completed' | 'killed' {
    // 返回 `this.#status`，作为共享工具这次计算的结果。
    return this.#status
  }

  #abortHandler(): void {
    // On 'interrupt' (user submitted a new message), don't kill — let the
    // caller background the process so the model can see partial output.
    // 当 `this.#abortSignal.reason` 匹配 `'interrupt'` 时，共享工具执行对应分支。
    if (this.#abortSignal.reason === 'interrupt') {
      // 共享工具 Shell Command在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 this.kill，触发共享工具此处需要的副作用。
    this.kill()
  }

  // exitCode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  #exitHandler(code: number | null, signal: NodeJS.Signals | null): void {
    // exitCode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const exitCode =
      code !== null && code !== undefined
        ? code
        : signal === 'SIGTERM'
          ? 144
          : 1
    // 共享工具 Shell Command在这里处理 `this.#resolveExitCode(exitCode)`，完成这一小步状态转换。
    this.#resolveExitCode(exitCode)
  }

  // 共享工具 Shell Command在这里处理 `#errorHandler(): void {`，完成这一小步状态转换。
  #errorHandler(): void {
    // 共享工具 Shell Command在这里处理 `this.#resolveExitCode(1)`，完成这一小步状态转换。
    this.#resolveExitCode(1)
  }

  // 满足 `this.#exitCodeResolver` 时，共享工具执行该分支。
  #resolveExitCode(code: number): void {
    // 满足 `this.#exitCodeResolver` 时，共享工具执行该分支。
    if (this.#exitCodeResolver) {
      // 共享工具 Shell Command在这里处理 `this.#exitCodeResolver(code)`，完成这一小步状态转换。
      this.#exitCodeResolver(code)
      // 共享工具 Shell Command在这里处理 `this.#exitCodeResolver = null`，完成这一小步状态转换。
      this.#exitCodeResolver = null
    }
  }

  // Note: exit/error listeners are NOT removed here — they're needed for
  // the result promise to resolve. They clean up when the child process exits.
  // 共享工具 Shell Command在这里处理 `#cleanupListeners(): void {`，完成这一小步状态转换。
  #cleanupListeners(): void {
    // 共享工具 Shell Command在这里处理 `this.#clearSizeWatchdog()`，完成这一小步状态转换。
    this.#clearSizeWatchdog()
    // timeoutId 命名 `this.#timeoutId`，让后续代码直接表达这个值的用途。
    const timeoutId = this.#timeoutId
    // 满足 `timeoutId` 时，共享工具执行该分支。
    if (timeoutId) {
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(timeoutId)
      // 共享工具 Shell Command在这里处理 `this.#timeoutId = null`，完成这一小步状态转换。
      this.#timeoutId = null
    }
    // boundAbortHandler 命名 `this.#boundAbortHandler`，让后续代码直接表达这个值的用途。
    const boundAbortHandler = this.#boundAbortHandler
    // 满足 `boundAbortHandler` 时，共享工具执行该分支。
    if (boundAbortHandler) {
      // 共享工具 Shell Command在这里处理 `this.#abortSignal.removeEventListener('abort', boundAbortHandler)`，完成这一小步状态转换。
      this.#abortSignal.removeEventListener('abort', boundAbortHandler)
      // 共享工具 Shell Command在这里处理 `this.#boundAbortHandler = null`，完成这一小步状态转换。
      this.#boundAbortHandler = null
    }
  }

  // 满足 `this.#sizeWatchdog` 时，共享工具执行该分支。
  #clearSizeWatchdog(): void {
    // 满足 `this.#sizeWatchdog` 时，共享工具执行该分支。
    if (this.#sizeWatchdog) {
      // 调用 clearInterval，触发共享工具此处需要的副作用。
      clearInterval(this.#sizeWatchdog)
      // 共享工具 Shell Command在这里处理 `this.#sizeWatchdog = null`，完成这一小步状态转换。
      this.#sizeWatchdog = null
    }
  }

  // 这个回调绑定到 this.#sizeWatchdog = setInterval(() => {，负责共享工具在该局部场景下的响应。
  #startSizeWatchdog(): void {
    // 这个回调绑定到 this.#sizeWatchdog = setInterval(() => {，负责共享工具在该局部场景下的响应。
    this.#sizeWatchdog = setInterval(() => {
      // 显式忽略 `stat(this.taskOutput.path).then(` 的返回值，只保留它触发的副作用。
      void stat(this.taskOutput.path).then(
        // s 集合更新为 `> {`，确保共享工具后续读取最新状态。
        s => {
          // Bail if the watchdog was cleared while this stat was in flight
          // (process exited on its own) — otherwise we'd mislabel stderr.
          // 共享工具在这里按实际状态进入对应分支。
          if (
            s.size > this.#maxOutputBytes &&
            this.#status === 'backgrounded' &&
            this.#sizeWatchdog !== null
          ) {
            // 共享工具 Shell Command在这里处理 `this.#killedForSize = true`，完成这一小步状态转换。
            this.#killedForSize = true
            // 共享工具 Shell Command在这里处理 `this.#clearSizeWatchdog()`，完成这一小步状态转换。
            this.#clearSizeWatchdog()
            // 共享工具 Shell Command在这里处理 `this.#doKill(SIGKILL)`，完成这一小步状态转换。
            this.#doKill(SIGKILL)
          }
        },
        // 这个回调绑定到 () => {，负责共享工具在该局部场景下的响应。
        () => {
          // ENOENT before first write, or unlinked mid-run — skip this tick
        },
      )
    }, SIZE_WATCHDOG_INTERVAL_MS)
    // 共享工具 Shell Command在这里处理 `this.#sizeWatchdog.unref()`，完成这一小步状态转换。
    this.#sizeWatchdog.unref()
  }

  // 共享工具 Shell Command在这里处理 `#createResultPromise(): Promise<ExecResult> {`，完成这一小步状态转换。
  #createResultPromise(): Promise<ExecResult> {
    // 共享工具 Shell Command在这里处理 `this.#boundAbortHandler = this.#abortHandler.bind(this)`，完成这一小步状态转换。
    this.#boundAbortHandler = this.#abortHandler.bind(this)
    // 共享工具 Shell Command在这里处理 `this.#abortSignal.addEventListener('abort', this.#boundAbortHandler, {`，完成这一小步状态转换。
    this.#abortSignal.addEventListener('abort', this.#boundAbortHandler, {
      once: true,
    })

    // Use 'exit' not 'close': 'close' waits for stdio to close, which includes
    // grandchild processes that inherit file descriptors (e.g. `sleep 30 &`).
    // 'exit' fires when the shell itself exits, returning control immediately.
    // 共享工具 Shell Command在这里处理 `this.#childProcess.once('exit', this.#exitHandler.bind(this))`，完成这一小步状态转换。
    this.#childProcess.once('exit', this.#exitHandler.bind(this))
    // 共享工具 Shell Command在这里处理 `this.#childProcess.once('error', this.#errorHandler.bind(this))`，完成这一小步状态转换。
    this.#childProcess.once('error', this.#errorHandler.bind(this))

    // 共享工具 Shell Command在这里处理 `this.#timeoutId = setTimeout(`，完成这一小步状态转换。
    this.#timeoutId = setTimeout(
      ShellCommandImpl.#handleTimeout,
      this.#timeout,
      this,
    ) as NodeJS.Timeout

    // exitPromise 异步任务封装成回调，供共享工具 Shell Command在事件触发或异步步骤中调用。
    const exitPromise = new Promise<number>(resolve => {
      // 共享工具 Shell Command在这里处理 `this.#exitCodeResolver = resolve`，完成这一小步状态转换。
      this.#exitCodeResolver = resolve
    })

    // 返回 `new Promise<ExecResult>(resolve => {`，作为共享工具这次计算的结果。
    return new Promise<ExecResult>(resolve => {
      // 共享工具 Shell Command在这里处理 `this.#resultResolver = resolve`，完成这一小步状态转换。
      this.#resultResolver = resolve
      // 显式忽略 `exitPromise.then(this.#handleExit.bind(this))` 的返回值，只保留它触发的副作用。
      void exitPromise.then(this.#handleExit.bind(this))
    })
  }

  // 共享工具 Shell Command在这里处理 `async #handleExit(code: number): Promise<void> {`，完成这一小步状态转换。
  async #handleExit(code: number): Promise<void> {
    // 共享工具 Shell Command在这里处理 `this.#cleanupListeners()`，完成这一小步状态转换。
    this.#cleanupListeners()
    // 只有 `this.#status === 'running' || this.#status === 'b` 满足时，共享工具才执行该分支。
    if (this.#status === 'running' || this.#status === 'backgrounded') {
      // 共享工具 Shell Command在这里处理 `this.#status = 'completed'`，完成这一小步状态转换。
      this.#status = 'completed'
    }

    // stdout读取`taskOutput.getStdout`，供共享工具后续处理使用。
    const stdout = await this.taskOutput.getStdout()
    // 结果 集中保存共享工具 Shell Command要一起传递的字段。
    const result: ExecResult = {
      code,
      stdout,
      stderr: this.taskOutput.getStderr(),
      interrupted: code === SIGKILL,
      backgroundTaskId: this.#backgroundTaskId,
    }

    // 只有 `this.taskOutput.stdoutToFile && !this.#background` 满足时，共享工具才执行该分支。
    if (this.taskOutput.stdoutToFile && !this.#backgroundTaskId) {
      // 满足 `this.taskOutput.outputFileRedundant` 时，共享工具执行该分支。
      if (this.taskOutput.outputFileRedundant) {
        // Small file — full content is in result.stdout, delete the file
        // 显式忽略 `this.taskOutput.deleteOutputFile()` 的返回值，只保留它触发的副作用。
        void this.taskOutput.deleteOutputFile()
      } else {
        // Large file — tell the caller where the full output lives
        // outputFilePath 路径数据更新为 `this.taskOutput.path`，确保共享工具后续读取最新状态。
        result.outputFilePath = this.taskOutput.path
        // outputFileSize 文件数据更新为 `this.taskOutput.outputFileSize`，确保共享工具后续读取最新状态。
        result.outputFileSize = this.taskOutput.outputFileSize
        // outputTaskId更新为 `this.taskOutput.taskId`，确保共享工具后续读取最新状态。
        result.outputTaskId = this.taskOutput.taskId
      }
    }

    // 满足 `this.#killedForSize` 时，共享工具执行该分支。
    if (this.#killedForSize) {
      // stderr更新为 `prependStderr(`，确保共享工具后续读取最新状态。
      result.stderr = prependStderr(
        `Background command killed: output file exceeded ${MAX_TASK_OUTPUT_BYTES_DISPLAY}`,
        result.stderr,
      )
    // 共享工具 Shell Command在这里处理 `} else if (code === SIGTERM) {`，完成这一小步状态转换。
    } else if (code === SIGTERM) {
      // stderr更新为 `prependStderr(`，确保共享工具后续读取最新状态。
      result.stderr = prependStderr(
        `Command timed out after ${formatDuration(this.#timeout)}`,
        result.stderr,
      )
    }

    // resultResolver保存`this.#resultResolver`，供后续判断或组装使用。
    const resultResolver = this.#resultResolver
    // 满足 `resultResolver` 时，共享工具执行该分支。
    if (resultResolver) {
      // 共享工具 Shell Command在这里处理 `this.#resultResolver = null`，完成这一小步状态转换。
      this.#resultResolver = null
      // 调用 resultResolver，触发共享工具此处需要的副作用。
      resultResolver(result)
    }
  }

  // 共享工具 Shell Command在这里处理 `#doKill(code?: number): void {`，完成这一小步状态转换。
  #doKill(code?: number): void {
    // 共享工具 Shell Command在这里处理 `this.#status = 'killed'`，完成这一小步状态转换。
    this.#status = 'killed'
    // 满足 `this.#childProcess.pid` 时，共享工具执行该分支。
    if (this.#childProcess.pid) {
      // 调用 treeKill，触发共享工具此处需要的副作用。
      treeKill(this.#childProcess.pid, 'SIGKILL')
    }
    // 共享工具 Shell Command在这里处理 `this.#resolveExitCode(code ?? SIGKILL)`，完成这一小步状态转换。
    this.#resolveExitCode(code ?? SIGKILL)
  }

  // kill 使用 无 完成共享工具里的对应操作。
  kill(): void {
    // 共享工具 Shell Command在这里处理 `this.#doKill()`，完成这一小步状态转换。
    this.#doKill()
  }

  // background 使用 taskId: string 完成共享工具里的对应操作。
  background(taskId: string): boolean {
    // 当 `this.#status` 匹配 `'running'` 时，共享工具执行对应分支。
    if (this.#status === 'running') {
      // 共享工具 Shell Command在这里处理 `this.#backgroundTaskId = taskId`，完成这一小步状态转换。
      this.#backgroundTaskId = taskId
      // 共享工具 Shell Command在这里处理 `this.#status = 'backgrounded'`，完成这一小步状态转换。
      this.#status = 'backgrounded'
      // 共享工具 Shell Command在这里处理 `this.#cleanupListeners()`，完成这一小步状态转换。
      this.#cleanupListeners()
      // 满足 `this.taskOutput.stdoutToFile` 时，共享工具执行该分支。
      if (this.taskOutput.stdoutToFile) {
        // File mode: child writes directly to the fd with no JS involvement.
        // The foreground timeout is gone, so watch file size to prevent
        // a stuck append loop from filling the disk (768GB incident).
        // 共享工具 Shell Command在这里处理 `this.#startSizeWatchdog()`，完成这一小步状态转换。
        this.#startSizeWatchdog()
      } else {
        // Pipe mode: spill the in-memory buffer so readers can find it on disk.
        // 调用 this.taskOutput.spillToDisk，触发共享工具此处需要的副作用。
        this.taskOutput.spillToDisk()
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // cleanup 使用 无 完成共享工具里的对应操作。
  cleanup(): void {
    // 共享工具 Shell Command在这里处理 `this.#stdoutWrapper?.cleanup()`，完成这一小步状态转换。
    this.#stdoutWrapper?.cleanup()
    // 共享工具 Shell Command在这里处理 `this.#stderrWrapper?.cleanup()`，完成这一小步状态转换。
    this.#stderrWrapper?.cleanup()
    // 调用 this.taskOutput.clear，触发共享工具此处需要的副作用。
    this.taskOutput.clear()
    // Must run before nulling #abortSignal — #cleanupListeners() calls
    // removeEventListener on it. Without this, a kill()+cleanup() sequence
    // crashes: kill() queues #handleExit as a microtask, cleanup() nulls
    // #abortSignal, then #handleExit runs #cleanupListeners() on the null ref.
    // 共享工具 Shell Command在这里处理 `this.#cleanupListeners()`，完成这一小步状态转换。
    this.#cleanupListeners()
    // Release references to allow GC of ChildProcess internals and AbortController chain
    // 共享工具 Shell Command在这里处理 `this.#childProcess = null!`，完成这一小步状态转换。
    this.#childProcess = null!
    // 共享工具 Shell Command在这里处理 `this.#abortSignal = null!`，完成这一小步状态转换。
    this.#abortSignal = null!
    // 共享工具 Shell Command在这里处理 `this.#onTimeoutCallback = undefined`，完成这一小步状态转换。
    this.#onTimeoutCallback = undefined
  }
}

/**
 * Wraps a child process to enable flexible handling of shell command execution.
 */
// wrapSpawn 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapSpawn(
  childProcess: ChildProcess,
  abortSignal: AbortSignal,
  timeout: number,
  taskOutput: TaskOutput,
  shouldAutoBackground = false,
  maxOutputBytes = MAX_TASK_OUTPUT_BYTES,
): ShellCommand {
  // 返回 `new ShellCommandImpl(`，作为共享工具这次计算的结果。
  return new ShellCommandImpl(
    childProcess,
    abortSignal,
    timeout,
    taskOutput,
    shouldAutoBackground,
    maxOutputBytes,
  )
}

/**
 * Static ShellCommand implementation for commands that were aborted before execution.
 */
// AbortedShellCommand 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class AbortedShellCommand implements ShellCommand {
  readonly status = 'killed' as const
  readonly result: Promise<ExecResult>
  readonly taskOutput: TaskOutput

  // 构造函数初始化实例状态，确保共享工具后续方法读取到完整配置。
  constructor(opts?: {
    backgroundTaskId?: string
    stderr?: string
    code?: number
  }) {
    // 更新实例字段 taskOutput 为 new TaskOutput(generateTaskId('local_bash'), null)，同步共享工具的内部状态。
    this.taskOutput = new TaskOutput(generateTaskId('local_bash'), null)
    // 更新实例字段 result 为 Promise.resolve({，同步共享工具的内部状态。
    this.result = Promise.resolve({
      code: opts?.code ?? 145,
      stdout: '',
      stderr: opts?.stderr ?? 'Command aborted before execution',
      interrupted: true,
      backgroundTaskId: opts?.backgroundTaskId,
    })
  }

  // background 使用 无 完成共享工具里的对应操作。
  background(): boolean {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // kill 使用 无 完成共享工具里的对应操作。
  kill(): void {}

  // cleanup 使用 无 完成共享工具里的对应操作。
  cleanup(): void {}
}

// createAbortedCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createAbortedCommand(
  backgroundTaskId?: string,
  opts?: { stderr?: string; code?: number },
): ShellCommand {
  // 返回 `new AbortedShellCommand({`，作为共享工具这次计算的结果。
  return new AbortedShellCommand({
    backgroundTaskId,
    ...opts,
  })
}

// createFailedCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createFailedCommand(preSpawnError: string): ShellCommand {
  // taskOutput保存`TaskOutput`，供共享工具后续处理使用。
  const taskOutput = new TaskOutput(generateTaskId('local_bash'), null)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    status: 'completed' as const,
    result: Promise.resolve({
      code: 1,
      stdout: '',
      stderr: preSpawnError,
      interrupted: false,
      preSpawnError,
    }),
    taskOutput,
    // background 使用 无 完成共享工具里的对应操作。
    background(): boolean {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    },
    // kill 使用 无 完成共享工具里的对应操作。
    kill(): void {},
    // cleanup 使用 无 完成共享工具里的对应操作。
    cleanup(): void {},
  }
}
