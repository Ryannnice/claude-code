// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { unlink } from 'fs/promises'
// 引入 CircularBuffer，将 ../CircularBuffer.js 中已经封装好的能力接到本文件流程里。
import { CircularBuffer } from '../CircularBuffer.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 readFileRange、tailFile，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { readFileRange, tailFile } from '../fsOperations.js'
// 引入 getMaxOutputLength，将 ../shell/outputLimits.js 中已经封装好的能力接到本文件流程里。
import { getMaxOutputLength } from '../shell/outputLimits.js'
// 引入 safeJoinLines，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { safeJoinLines } from '../stringUtils.js'
// 引入 DiskTaskOutput、getTaskOutputPath，将 ./diskOutput.js 中已经封装好的能力接到本文件流程里。
import { DiskTaskOutput, getTaskOutputPath } from './diskOutput.js'

// DEFAULT_MAX_MEMORY保存`8 * 1024 * 1024 // 8MB`，供共享工具 Task Output后续判断或输出使用。
const DEFAULT_MAX_MEMORY = 8 * 1024 * 1024 // 8MB
// POLL_INTERVAL_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
const POLL_INTERVAL_MS = 1000
// PROGRESS_TAIL_BYTES 集合保存`4096`，供共享工具 Task Output后续判断或输出使用。
const PROGRESS_TAIL_BYTES = 4096

// ProgressCallback 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ProgressCallback = (
  lastLines: string,
  allLines: string,
  totalLines: number,
  totalBytes: number,
  isIncomplete: boolean,
) => void

/**
 * Single source of truth for a shell command's output.
 *
 * For bash commands (file mode): both stdout and stderr go directly to
 * a file via stdio fds — neither enters JS. Progress is extracted by
 * polling the file tail. getStderr() returns '' since stderr is
 * interleaved in the output file.
 *
 * For hooks (pipe mode): data flows through writeStdout()/writeStderr()
 * and is buffered in memory, spilling to disk if it exceeds the limit.
 */
// TaskOutput 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class TaskOutput {
  readonly taskId: string
  readonly path: string
  /** True when stdout goes to a file fd (bypassing JS). False for pipe mode (hooks). */
  readonly stdoutToFile: boolean
  #stdoutBuffer = ''
  #stderrBuffer = ''
  #disk: DiskTaskOutput | null = null
  #recentLines = new CircularBuffer<string>(1000)
  #totalLines = 0
  #totalBytes = 0
  #maxMemory: number
  #onProgress: ProgressCallback | null
  /** Set by getStdout() — true when the file was fully read (≤ maxOutputLength). */
  #outputFileRedundant = false
  /** Set by getStdout() — total file size in bytes. */
  #outputFileSize = 0

  // --- Shared poller state ---

  /** Registry of all file-mode TaskOutput instances with onProgress callbacks. */
  static #registry = new Map<string, TaskOutput>()
  /** Subset of #registry currently being polled (visibility-driven by React). */
  static #activePolling = new Map<string, TaskOutput>()
  static #pollInterval: ReturnType<typeof setInterval> | null = null

  // 构造函数初始化实例状态，确保共享工具后续方法读取到完整配置。
  constructor(
    taskId: string,
    onProgress: ProgressCallback | null,
    stdoutToFile = false,
    maxMemory: number = DEFAULT_MAX_MEMORY,
  ) {
    // 更新实例字段 taskId 为 taskId，同步共享工具的内部状态。
    this.taskId = taskId
    // 更新实例字段 path 为 getTaskOutputPath(taskId)，同步共享工具的内部状态。
    this.path = getTaskOutputPath(taskId)
    // 更新实例字段 stdoutToFile 为 stdoutToFile，同步共享工具的内部状态。
    this.stdoutToFile = stdoutToFile
    // 共享工具 Task Output在这里处理 `this.#maxMemory = maxMemory`，完成这一小步状态转换。
    this.#maxMemory = maxMemory
    // 共享工具 Task Output在这里处理 `this.#onProgress = onProgress`，完成这一小步状态转换。
    this.#onProgress = onProgress

    // Register for polling when stdout goes to a file and progress is needed.
    // Actual polling is started/stopped by React via startPolling/stopPolling.
    // 只有 `stdoutToFile && onProgress` 满足时，共享工具才执行该分支。
    if (stdoutToFile && onProgress) {
      // 共享工具 Task Output在这里处理 `TaskOutput.#registry.set(taskId, this)`，完成这一小步状态转换。
      TaskOutput.#registry.set(taskId, this)
    }
  }

  /**
   * Begin polling the output file for progress. Called from React
   * useEffect when the progress component mounts.
   */
  // 共享工具 Task Output在这里处理 `static startPolling(taskId: string): void {`，完成这一小步状态转换。
  static startPolling(taskId: string): void {
    // instance读取`registry.get`，供共享工具后续处理使用。
    const instance = TaskOutput.#registry.get(taskId)
    // 只有 `!instance || !instance.#onProgress` 满足时，共享工具才执行该分支。
    if (!instance || !instance.#onProgress) {
      // 共享工具 Task Output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 共享工具 Task Output在这里处理 `TaskOutput.#activePolling.set(taskId, instance)`，完成这一小步状态转换。
    TaskOutput.#activePolling.set(taskId, instance)
    // 满足 `!TaskOutput.#pollInterval` 时，共享工具执行该分支。
    if (!TaskOutput.#pollInterval) {
      // 共享工具 Task Output在这里处理 `TaskOutput.#pollInterval = setInterval(TaskOutput.#tick, POLL_INTERVAL_...`，完成这一小步状态转换。
      TaskOutput.#pollInterval = setInterval(TaskOutput.#tick, POLL_INTERVAL_MS)
      // 共享工具 Task Output在这里处理 `TaskOutput.#pollInterval.unref()`，完成这一小步状态转换。
      TaskOutput.#pollInterval.unref()
    }
  }

  /**
   * Stop polling the output file. Called from React useEffect cleanup
   * when the progress component unmounts.
   */
  // 共享工具 Task Output在这里处理 `static stopPolling(taskId: string): void {`，完成这一小步状态转换。
  static stopPolling(taskId: string): void {
    // 共享工具 Task Output在这里处理 `TaskOutput.#activePolling.delete(taskId)`，完成这一小步状态转换。
    TaskOutput.#activePolling.delete(taskId)
    // 只有 `TaskOutput.#activePolling.size === 0 && TaskOutpu` 满足时，共享工具才执行该分支。
    if (TaskOutput.#activePolling.size === 0 && TaskOutput.#pollInterval) {
      // 调用 clearInterval，触发共享工具此处需要的副作用。
      clearInterval(TaskOutput.#pollInterval)
      // 共享工具 Task Output在这里处理 `TaskOutput.#pollInterval = null`，完成这一小步状态转换。
      TaskOutput.#pollInterval = null
    }
  }

  /**
   * Shared tick: reads the file tail for every actively-polled task.
   * Non-async body (.then) to avoid stacking if I/O is slow.
   */
  // 共享工具 Task Output在这里处理 `static #tick(): void {`，完成这一小步状态转换。
  static #tick(): void {
    // 循环处理 `const [, entry] of TaskOutput.#activePolling`，让共享工具逐项把同类条目按顺序走完。
    for (const [, entry] of TaskOutput.#activePolling) {
      // 满足 `!entry.#onProgress` 时，共享工具执行该分支。
      if (!entry.#onProgress) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 显式忽略 `tailFile(entry.path, PROGRESS_TAIL_BYTES).then(` 的返回值，只保留它触发的副作用。
      void tailFile(entry.path, PROGRESS_TAIL_BYTES).then(
        // 这个回调绑定到 ({ content, bytesRead, bytesTotal }) => {，负责共享工具在该局部场景下的响应。
        ({ content, bytesRead, bytesTotal }) => {
          // 满足 `!entry.#onProgress` 时，共享工具执行该分支。
          if (!entry.#onProgress) {
            // 共享工具 Task Output在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // Always call onProgress even when content is empty, so the
          // progress loop wakes up and can check for backgrounding.
          // Commands like `git log -S` produce no output for long periods.
          // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!content) {
            // 共享工具 Task Output在这里处理 `entry.#onProgress('', '', entry.#totalLines, bytesTotal, false)`，完成这一小步状态转换。
            entry.#onProgress('', '', entry.#totalLines, bytesTotal, false)
            // 共享工具 Task Output在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // Count all newlines in the tail and capture slice points for the
          // last 5 and last 100 lines. Uncapped so extrapolation stays accurate
          // for dense output (short lines → >100 newlines in 4KB).
          // pos 集合 命名 `content.length`，让后续代码直接表达这个值的用途。
          let pos = content.length
          // n5保存`0`，供后续判断或组装使用。
          let n5 = 0
          // n100 命名 `0`，让后续代码直接表达这个值的用途。
          let n100 = 0
          // lineCount 数量保存`0`，供共享工具 Task Output后续判断或输出使用。
          let lineCount = 0
          // while 使用 pos > 0 完成共享工具里的对应操作。
          while (pos > 0) {
            // pos 集合更新为 `content.lastIndexOf('\n', pos - 1)`，确保共享工具后续读取最新状态。
            pos = content.lastIndexOf('\n', pos - 1)
            // 共享工具 Task Output在这里处理 `lineCount++`，完成这一小步状态转换。
            lineCount++
            // 满足 `lineCount === 5` 时，共享工具执行该分支。
            if (lineCount === 5) n5 = pos <= 0 ? 0 : pos + 1
            // 满足 `lineCount === 100` 时，共享工具执行该分支。
            if (lineCount === 100) n100 = pos <= 0 ? 0 : pos + 1
          }
          // lineCount is exact when the whole file fits in PROGRESS_TAIL_BYTES.
          // Otherwise extrapolate from the tail sample; monotone max keeps the
          // counter from going backwards when the tail has longer lines on one tick.
          // totalLines 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const totalLines =
            bytesRead >= bytesTotal
              ? lineCount
              : Math.max(
                  entry.#totalLines,
                  Math.round((bytesTotal / bytesRead) * lineCount),
                )
          // 共享工具 Task Output在这里处理 `entry.#totalLines = totalLines`，完成这一小步状态转换。
          entry.#totalLines = totalLines
          // 共享工具 Task Output在这里处理 `entry.#totalBytes = bytesTotal`，完成这一小步状态转换。
          entry.#totalBytes = bytesTotal
          // 共享工具 Task Output在这里处理 `entry.#onProgress(`，完成这一小步状态转换。
          entry.#onProgress(
            content.slice(n5),
            content.slice(n100),
            totalLines,
            bytesTotal,
            bytesRead < bytesTotal,
          )
        },
        // 这个回调绑定到 () => {，负责共享工具在该局部场景下的响应。
        () => {
          // File may not exist yet
        },
      )
    }
  }

  /** Write stdout data (pipe mode only — used by hooks). */
  // writeStdout 使用 data: string 完成共享工具里的对应操作。
  writeStdout(data: string): void {
    // 共享工具 Task Output在这里处理 `this.#writeBuffered(data, false)`，完成这一小步状态转换。
    this.#writeBuffered(data, false)
  }

  /** Write stderr data (always piped). */
  // writeStderr 使用 data: string 完成共享工具里的对应操作。
  writeStderr(data: string): void {
    // 共享工具 Task Output在这里处理 `this.#writeBuffered(data, true)`，完成这一小步状态转换。
    this.#writeBuffered(data, true)
  }

  #writeBuffered(data: string, isStderr: boolean): void {
    // 共享工具 Task Output在这里处理 `this.#totalBytes += data.length`，完成这一小步状态转换。
    this.#totalBytes += data.length

    // 共享工具 Task Output在这里处理 `this.#updateProgress(data)`，完成这一小步状态转换。
    this.#updateProgress(data)

    // Write to disk if already overflowed
    // 满足 `this.#disk` 时，共享工具执行该分支。
    if (this.#disk) {
      // 共享工具 Task Output在这里处理 `this.#disk.append(isStderr ? `[stderr] ${data}` : data)`，完成这一小步状态转换。
      this.#disk.append(isStderr ? `[stderr] ${data}` : data)
      // 共享工具 Task Output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check if this chunk would exceed the in-memory limit
    // totalMem 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const totalMem =
      this.#stdoutBuffer.length + this.#stderrBuffer.length + data.length
    // 满足 `totalMem > this.#maxMemory` 时，共享工具执行该分支。
    if (totalMem > this.#maxMemory) {
      // 共享工具 Task Output在这里处理 `this.#spillToDisk(isStderr ? data : null, isStderr ? null : data)`，完成这一小步状态转换。
      this.#spillToDisk(isStderr ? data : null, isStderr ? null : data)
      // 共享工具 Task Output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 满足 `isStderr` 时，共享工具执行该分支。
    if (isStderr) {
      // 共享工具 Task Output在这里处理 `this.#stderrBuffer += data`，完成这一小步状态转换。
      this.#stderrBuffer += data
    } else {
      // 共享工具 Task Output在这里处理 `this.#stdoutBuffer += data`，完成这一小步状态转换。
      this.#stdoutBuffer += data
    }
  }

  /**
   * Single backward pass: count all newlines (for totalLines) and extract
   * the last few lines as flat copies (for the CircularBuffer / progress).
   * Only used in pipe mode (hooks). File mode uses the shared poller.
   */
  // MAX_PROGRESS_BYTES 集合保存`4096`，供共享工具 Task Output后续判断或输出使用。
  #updateProgress(data: string): void {
    // MAX_PROGRESS_BYTES 集合保存`4096`，供共享工具 Task Output后续判断或输出使用。
    const MAX_PROGRESS_BYTES = 4096
    // MAX_PROGRESS_LINES 集合保存`100`，供后续判断或组装使用。
    const MAX_PROGRESS_LINES = 100

    // lineCount 数量保存`0`，供共享工具 Task Output后续判断或输出使用。
    let lineCount = 0
    // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
    const lines: string[] = []
    // extractedBytes 集合保存`0`，供后续判断或组装使用。
    let extractedBytes = 0
    // pos 集合 命名 `data.length`，让后续代码直接表达这个值的用途。
    let pos = data.length

    // while 使用 pos > 0 完成共享工具里的对应操作。
    while (pos > 0) {
      // prev保存`data.lastIndexOf`，供共享工具后续处理使用。
      const prev = data.lastIndexOf('\n', pos - 1)
      // 满足 `prev === -1` 时，共享工具执行该分支。
      if (prev === -1) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // 共享工具 Task Output在这里处理 `lineCount++`，完成这一小步状态转换。
      lineCount++
      // 共享工具在这里按实际状态进入对应分支。
      if (
        lines.length < MAX_PROGRESS_LINES &&
        extractedBytes < MAX_PROGRESS_BYTES
      ) {
        // lineLen 命名 `pos - prev - 1`，让后续代码直接表达这个值的用途。
        const lineLen = pos - prev - 1
        // 只有 `lineLen > 0 && lineLen <= MAX_PROGRESS_BYTES - ex` 满足时，共享工具才执行该分支。
        if (lineLen > 0 && lineLen <= MAX_PROGRESS_BYTES - extractedBytes) {
          // line格式化`data.slice`，供共享工具后续处理使用。
          const line = data.slice(prev + 1, pos)
          // 满足 `line.trim()` 时，共享工具执行该分支。
          if (line.trim()) {
            // 文本行追加新条目，保持收集顺序与输入顺序一致。
            lines.push(Buffer.from(line).toString())
            // 共享工具 Task Output在这里处理 `extractedBytes += lineLen`，完成这一小步状态转换。
            extractedBytes += lineLen
          }
        }
      }
      // pos 集合更新为 `prev`，确保共享工具后续读取最新状态。
      pos = prev
    }

    // 共享工具 Task Output在这里处理 `this.#totalLines += lineCount`，完成这一小步状态转换。
    this.#totalLines += lineCount

    // 循环处理 `let i = lines.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
    for (let i = lines.length - 1; i >= 0; i--) {
      // 共享工具 Task Output在这里处理 `this.#recentLines.add(lines[i]!)`，完成这一小步状态转换。
      this.#recentLines.add(lines[i]!)
    }

    // 只有 `this.#onProgress && lines.length > 0` 满足时，共享工具才执行该分支。
    if (this.#onProgress && lines.length > 0) {
      // recent读取`recentLines.getRecent`，供共享工具后续处理使用。
      const recent = this.#recentLines.getRecent(5)
      // 共享工具 Task Output在这里处理 `this.#onProgress(`，完成这一小步状态转换。
      this.#onProgress(
        safeJoinLines(recent, '\n'),
        safeJoinLines(this.#recentLines.getRecent(100), '\n'),
        this.#totalLines,
        this.#totalBytes,
        this.#disk !== null,
      )
    }
  }

  // 共享工具 Task Output在这里处理 `#spillToDisk(stderrChunk: string | null, stdoutChunk: string | null): v...`，完成这一小步状态转换。
  #spillToDisk(stderrChunk: string | null, stdoutChunk: string | null): void {
    // 共享工具 Task Output在这里处理 `this.#disk = new DiskTaskOutput(this.taskId)`，完成这一小步状态转换。
    this.#disk = new DiskTaskOutput(this.taskId)

    // Flush existing buffers
    // 满足 `this.#stdoutBuffer` 时，共享工具执行该分支。
    if (this.#stdoutBuffer) {
      // 共享工具 Task Output在这里处理 `this.#disk.append(this.#stdoutBuffer)`，完成这一小步状态转换。
      this.#disk.append(this.#stdoutBuffer)
      // 共享工具 Task Output在这里处理 `this.#stdoutBuffer = ''`，完成这一小步状态转换。
      this.#stdoutBuffer = ''
    }
    // 满足 `this.#stderrBuffer` 时，共享工具执行该分支。
    if (this.#stderrBuffer) {
      // 共享工具 Task Output在这里处理 `this.#disk.append(`[stderr] ${this.#stderrBuffer}`)`，完成这一小步状态转换。
      this.#disk.append(`[stderr] ${this.#stderrBuffer}`)
      // 共享工具 Task Output在这里处理 `this.#stderrBuffer = ''`，完成这一小步状态转换。
      this.#stderrBuffer = ''
    }

    // Write the chunk that triggered overflow
    // 满足 `stdoutChunk` 时，共享工具执行该分支。
    if (stdoutChunk) {
      // 共享工具 Task Output在这里处理 `this.#disk.append(stdoutChunk)`，完成这一小步状态转换。
      this.#disk.append(stdoutChunk)
    }
    // 满足 `stderrChunk` 时，共享工具执行该分支。
    if (stderrChunk) {
      // 共享工具 Task Output在这里处理 `this.#disk.append(`[stderr] ${stderrChunk}`)`，完成这一小步状态转换。
      this.#disk.append(`[stderr] ${stderrChunk}`)
    }
  }

  /**
   * Get stdout. In file mode, reads from the output file.
   * In pipe mode, returns the in-memory buffer or tail from CircularBuffer.
   */
  // getStdout不依赖额外参数，直接计算共享工具需要的结果。
  async getStdout(): Promise<string> {
    // 满足 `this.stdoutToFile` 时，共享工具执行该分支。
    if (this.stdoutToFile) {
      // 返回 `this.#readStdoutFromFile()`，作为共享工具这次计算的结果。
      return this.#readStdoutFromFile()
    }
    // Pipe mode (hooks) — use in-memory data
    // 满足 `this.#disk` 时，共享工具执行该分支。
    if (this.#disk) {
      // recent读取`recentLines.getRecent`，供共享工具后续处理使用。
      const recent = this.#recentLines.getRecent(5)
      // tail保存`safeJoinLines`，供共享工具后续处理使用。
      const tail = safeJoinLines(recent, '\n')
      // sizeKB保存`Math.round`，供共享工具后续处理使用。
      const sizeKB = Math.round(this.#totalBytes / 1024)
      // notice保存`truncated`，供共享工具后续处理使用。
      const notice = `\nOutput truncated (${sizeKB}KB total). Full output saved to: ${this.path}`
      // 返回 `tail ? tail + notice : notice.trimStart()`，作为共享工具这次计算的结果。
      return tail ? tail + notice : notice.trimStart()
    }
    // 返回 `this.#stdoutBuffer`，作为共享工具这次计算的结果。
    return this.#stdoutBuffer
  }

  // 共享工具 Task Output在这里处理 `async #readStdoutFromFile(): Promise<string> {`，完成这一小步状态转换。
  async #readStdoutFromFile(): Promise<string> {
    // maxBytes 集合读取`getMaxOutputLength`，供共享工具后续处理使用。
    const maxBytes = getMaxOutputLength()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果读取`readFileRange`，供共享工具后续处理使用。
      const result = await readFileRange(this.path, 0, maxBytes)
      // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!result) {
        // 共享工具 Task Output在这里处理 `this.#outputFileRedundant = true`，完成这一小步状态转换。
        this.#outputFileRedundant = true
        // 返回空字符串表示没有可用文本，调用方会按空输入处理。
        return ''
      }
      // 从 `result` 解构 content、bytesRead、bytesTotal，减少共享工具 Task Output对同一对象的重复访问。
      const { content, bytesRead, bytesTotal } = result
      // If the file fits, it's fully captured inline and can be deleted.
      // If not, return what we read — processToolResultBlock handles
      // the <persisted-output> formatting and persistence downstream.
      // 共享工具 Task Output在这里处理 `this.#outputFileSize = bytesTotal`，完成这一小步状态转换。
      this.#outputFileSize = bytesTotal
      // 共享工具 Task Output在这里处理 `this.#outputFileRedundant = bytesTotal <= bytesRead`，完成这一小步状态转换。
      this.#outputFileRedundant = bytesTotal <= bytesRead
      // 返回 `content`，作为共享工具这次计算的结果。
      return content
    } catch (err) {
      // Surface the error instead of silently returning empty. An ENOENT here
      // means the output file was deleted while the command was running
      // (historically: cross-session startup cleanup in the same project dir).
      // Returning a diagnostic string keeps the tool_result non-empty, which
      // avoids reminder-only-at-tail confusion downstream and tells the model
      // (and us, via the transcript) what actually happened.
      // code 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const code =
        err instanceof Error && 'code' in err ? String(err.code) : 'unknown'
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `TaskOutput.#readStdoutFromFile: failed to read ${this.path} (${code}): ${err}`,
      )
      // 返回 ``<bash output unavailable: output file ${this.path} could not be read (...`，作为共享工具这次计算的结果。
      return `<bash output unavailable: output file ${this.path} could not be read (${code}). This usually means another Claude Code process in the same project deleted it during startup cleanup.>`
    }
  }

  /** Sync getter for ExecResult.stderr */
  // getStderr不依赖额外参数，直接计算共享工具需要的结果。
  getStderr(): string {
    // 满足 `this.#disk` 时，共享工具执行该分支。
    if (this.#disk) {
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return ''
    }
    // 返回 `this.#stderrBuffer`，作为共享工具这次计算的结果。
    return this.#stderrBuffer
  }

  // 共享工具 Task Output在这里处理 `get isOverflowed(): boolean {`，完成这一小步状态转换。
  get isOverflowed(): boolean {
    // 返回 `this.#disk !== null`，作为共享工具这次计算的结果。
    return this.#disk !== null
  }

  // 共享工具 Task Output在这里处理 `get totalLines(): number {`，完成这一小步状态转换。
  get totalLines(): number {
    // 返回 `this.#totalLines`，作为共享工具这次计算的结果。
    return this.#totalLines
  }

  // 共享工具 Task Output在这里处理 `get totalBytes(): number {`，完成这一小步状态转换。
  get totalBytes(): number {
    // 返回 `this.#totalBytes`，作为共享工具这次计算的结果。
    return this.#totalBytes
  }

  /**
   * True after getStdout() when the output file was fully read.
   * The file content is redundant (fully in ExecResult.stdout) and can be deleted.
   */
  // 共享工具 Task Output在这里处理 `get outputFileRedundant(): boolean {`，完成这一小步状态转换。
  get outputFileRedundant(): boolean {
    // 返回 `this.#outputFileRedundant`，作为共享工具这次计算的结果。
    return this.#outputFileRedundant
  }

  /** Total file size in bytes, set after getStdout() reads the file. */
  // 共享工具 Task Output在这里处理 `get outputFileSize(): number {`，完成这一小步状态转换。
  get outputFileSize(): number {
    // 返回 `this.#outputFileSize`，作为共享工具这次计算的结果。
    return this.#outputFileSize
  }

  /** Force all buffered content to disk. Call when backgrounding. */
  // spillToDisk 使用 无 完成共享工具里的对应操作。
  spillToDisk(): void {
    // 满足 `!this.#disk` 时，共享工具执行该分支。
    if (!this.#disk) {
      // 共享工具 Task Output在这里处理 `this.#spillToDisk(null, null)`，完成这一小步状态转换。
      this.#spillToDisk(null, null)
    }
  }

  // flush 使用 无 完成共享工具里的对应操作。
  async flush(): Promise<void> {
    // 等待 `this.#disk?.flush()` 完成，再继续共享工具 Task Output的异步流程。
    await this.#disk?.flush()
  }

  /** Delete the output file (fire-and-forget safe). */
  // deleteOutputFile 使用 无 完成共享工具里的对应操作。
  async deleteOutputFile(): Promise<void> {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(this.path)` 完成，再继续共享工具 Task Output的异步流程。
      await unlink(this.path)
    } catch {
      // File may already be deleted or not exist
    }
  }

  // clear 使用 无 完成共享工具里的对应操作。
  clear(): void {
    // 共享工具 Task Output在这里处理 `this.#stdoutBuffer = ''`，完成这一小步状态转换。
    this.#stdoutBuffer = ''
    // 共享工具 Task Output在这里处理 `this.#stderrBuffer = ''`，完成这一小步状态转换。
    this.#stderrBuffer = ''
    // 共享工具 Task Output在这里处理 `this.#recentLines.clear()`，完成这一小步状态转换。
    this.#recentLines.clear()
    // 共享工具 Task Output在这里处理 `this.#onProgress = null`，完成这一小步状态转换。
    this.#onProgress = null
    // 共享工具 Task Output在这里处理 `this.#disk?.cancel()`，完成这一小步状态转换。
    this.#disk?.cancel()
    // 调用 TaskOutput.stopPolling，触发共享工具此处需要的副作用。
    TaskOutput.stopPolling(this.taskId)
    // 共享工具 Task Output在这里处理 `TaskOutput.#registry.delete(this.taskId)`，完成这一小步状态转换。
    TaskOutput.#registry.delete(this.taskId)
  }
}
