// ---------------------------------------------------------------------------
// readFileInRange — line-oriented file reader with two code paths
// ---------------------------------------------------------------------------
//
// Returns lines [offset, offset + maxLines) from a file.
//
// Fast path (regular files < 10 MB):
//   Opens the file, stats the fd, reads the whole file with readFile(),
//   then splits lines in memory.  This avoids the per-chunk async overhead
//   of createReadStream and is ~2x faster for typical source files.
//
// Streaming path (large files, pipes, devices, etc.):
//   Uses createReadStream with manual indexOf('\n') scanning.  Content is
//   only accumulated for lines inside the requested range — lines outside
//   the range are counted (for totalLines) but discarded, so reading line
//   1 of a 100 GB file won't balloon RSS.
//
//   All event handlers (streamOnOpen/Data/End) are module-level named
//   functions with zero closures.  State lives in a StreamState object;
//   handlers access it via `this`, bound at registration time.
//
//   Lifecycle: `open`, `end`, and `error` use .once() (auto-remove).
//   `data` fires until the stream ends or is destroyed — either way the
//   stream and state become unreachable together and are GC'd.
//
//   On error (including maxBytes exceeded), stream.destroy(err) emits
//   'error' → reject (passed directly to .once('error')).
//
// Both paths strip UTF-8 BOM and \r (CRLF → LF).
//
// mtime comes from fstat/stat on the already-open fd — no extra open().
//
// maxBytes behavior depends on options.truncateOnByteLimit:
//   false (default): legacy semantics — throws FileTooLargeError if the FILE
//     size (fast path) or total streamed bytes (streaming) exceed maxBytes.
//   true: caps SELECTED OUTPUT at maxBytes.  Stops at the last complete line
//     that fits; sets truncatedByBytes in the result.  Never throws.
// ---------------------------------------------------------------------------

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { createReadStream, fstat } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat as fsStat, readFile } from 'fs/promises'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'

// FAST_PATH_MAX_SIZE 路径数据 命名 `10 * 1024 * 1024 // 10 MB`，让后续代码直接表达这个值的用途。
const FAST_PATH_MAX_SIZE = 10 * 1024 * 1024 // 10 MB

// ReadFileRangeResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReadFileRangeResult = {
  content: string
  lineCount: number
  totalLines: number
  totalBytes: number
  readBytes: number
  mtimeMs: number
  /** true when output was clipped to maxBytes under truncate mode */
  truncatedByBytes?: boolean
}

// FileTooLargeError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class FileTooLargeError extends Error {
  constructor(
    public sizeInBytes: number,
    public maxSizeBytes: number,
  ) {
    // 调用 super，触发共享工具此处需要的副作用。
    super(
      `File content (${formatFileSize(sizeInBytes)}) exceeds maximum allowed size (${formatFileSize(maxSizeBytes)}). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.`,
    )
    // 更新实例字段 name 为 'FileTooLargeError'，同步共享工具的内部状态。
    this.name = 'FileTooLargeError'
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

// readFileInRange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readFileInRange(
  filePath: string,
  offset = 0,
  maxLines?: number,
  maxBytes?: number,
  signal?: AbortSignal,
  options?: { truncateOnByteLimit?: boolean },
): Promise<ReadFileRangeResult> {
  // 调用 signal?.throwIfAborted()，完成这一处局部操作。
  signal?.throwIfAborted()
  // truncateOnByteLimit保存`options?.truncateOnByteLimit ?? false`，供共享工具 read File In Range后续判断或输出使用。
  const truncateOnByteLimit = options?.truncateOnByteLimit ?? false

  // stat to decide the code path and guard against OOM.
  // For regular files under 10 MB: readFile + in-memory split (fast).
  // Everything else (large files, FIFOs, devices): streaming.
  // stats 集合保存`fsStat`，供共享工具后续处理使用。
  const stats = await fsStat(filePath)

  // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
  if (stats.isDirectory()) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `EISDIR: illegal operation on a directory, read '${filePath}'`,
    )
  }

  // 只有 `stats.isFile() && stats.size < FAST_PATH_MAX_SIZE` 满足时，共享工具才执行该分支。
  if (stats.isFile() && stats.size < FAST_PATH_MAX_SIZE) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !truncateOnByteLimit &&
      maxBytes !== undefined &&
      stats.size > maxBytes
    ) {
      // 抛出 new FileTooLargeError(stats.size, maxBytes)，阻止共享工具在无效状态下继续运行。
      throw new FileTooLargeError(stats.size, maxBytes)
    }

    // 文本读取`readFile`，供共享工具后续处理使用。
    const text = await readFile(filePath, { encoding: 'utf8', signal })
    // 返回 `readFileInRangeFast(`，作为共享工具这次计算的结果。
    return readFileInRangeFast(
      text,
      stats.mtimeMs,
      offset,
      maxLines,
      truncateOnByteLimit ? maxBytes : undefined,
    )
  }

  // 返回 `readFileInRangeStreaming(`，作为共享工具这次计算的结果。
  return readFileInRangeStreaming(
    filePath,
    offset,
    maxLines,
    maxBytes,
    truncateOnByteLimit,
    signal,
  )
}

// ---------------------------------------------------------------------------
// Fast path — readFile + in-memory split
// ---------------------------------------------------------------------------

// readFileInRangeFast 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readFileInRangeFast(
  raw: string,
  mtimeMs: number,
  offset: number,
  maxLines: number | undefined,
  truncateAtBytes: number | undefined,
): ReadFileRangeResult {
  // endLine标记共享工具 read File In Range是否启用对应路径。
  const endLine = maxLines !== undefined ? offset + maxLines : Infinity

  // Strip BOM.
  // 文本保存`raw.charCodeAt`，供共享工具后续处理使用。
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw

  // Split lines, strip \r, select range.
  // selectedLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const selectedLines: string[] = []
  // lineIndex 索引保存`0`，供后续判断或组装使用。
  let lineIndex = 0
  // startPos 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let startPos = 0
  // newlinePos 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let newlinePos: number
  // selectedBytes 集合保存`0`，供共享工具 read File In Range后续判断或输出使用。
  let selectedBytes = 0
  // truncatedByBytes 集合标记共享工具 read File In Range是否启用对应路径。
  let truncatedByBytes = false

  // tryPush 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function tryPush(line: string): boolean {
    // `truncateAtBytes` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (truncateAtBytes !== undefined) {
      // sep 命名 `selectedLines.length > 0 ? 1 : 0`，让后续代码直接表达这个值的用途。
      const sep = selectedLines.length > 0 ? 1 : 0
      // nextBytes 集合保存`Buffer.byteLength`，供共享工具后续处理使用。
      const nextBytes = selectedBytes + sep + Buffer.byteLength(line)
      // 满足 `nextBytes > truncateAtBytes` 时，共享工具执行该分支。
      if (nextBytes > truncateAtBytes) {
        // truncatedByBytes 集合更新为 `true`，确保共享工具后续读取最新状态。
        truncatedByBytes = true
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // selectedBytes 集合更新为 `nextBytes`，确保共享工具后续读取最新状态。
      selectedBytes = nextBytes
    }
    // selectedLines 集合追加新条目，保持收集顺序与输入顺序一致。
    selectedLines.push(line)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 只要 (newlinePos = text.indexOf('\n', startPos)) !== -1 成立，就持续推进共享工具中的循环处理。
  while ((newlinePos = text.indexOf('\n', startPos)) !== -1) {
    // 只有 `lineIndex >= offset && lineIndex < endLine && !tr` 满足时，共享工具才执行该分支。
    if (lineIndex >= offset && lineIndex < endLine && !truncatedByBytes) {
      // line格式化`text.slice`，供共享工具后续处理使用。
      let line = text.slice(startPos, newlinePos)
      // 满足 `line.endsWith('\r')` 时，共享工具执行该分支。
      if (line.endsWith('\r')) {
        // line更新为 `line.slice(0, -1)`，确保共享工具后续读取最新状态。
        line = line.slice(0, -1)
      }
      // 调用 tryPush，触发共享工具此处需要的副作用。
      tryPush(line)
    }
    // 共享工具 read File In Range在这里处理 `lineIndex++`，完成这一小步状态转换。
    lineIndex++
    // startPos 集合更新为 `newlinePos + 1`，确保共享工具后续读取最新状态。
    startPos = newlinePos + 1
  }

  // Final fragment (no trailing newline).
  // 只有 `lineIndex >= offset && lineIndex < endLine && !tr` 满足时，共享工具才执行该分支。
  if (lineIndex >= offset && lineIndex < endLine && !truncatedByBytes) {
    // line格式化`text.slice`，供共享工具后续处理使用。
    let line = text.slice(startPos)
    // 满足 `line.endsWith('\r')` 时，共享工具执行该分支。
    if (line.endsWith('\r')) {
      // line更新为 `line.slice(0, -1)`，确保共享工具后续读取最新状态。
      line = line.slice(0, -1)
    }
    // 调用 tryPush，触发共享工具此处需要的副作用。
    tryPush(line)
  }
  // 共享工具 read File In Range在这里处理 `lineIndex++`，完成这一小步状态转换。
  lineIndex++

  // 文本内容格式化`selectedLines.join`，供共享工具后续处理使用。
  const content = selectedLines.join('\n')
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    content,
    lineCount: selectedLines.length,
    totalLines: lineIndex,
    totalBytes: Buffer.byteLength(text, 'utf8'),
    readBytes: Buffer.byteLength(content, 'utf8'),
    mtimeMs,
    ...(truncatedByBytes ? { truncatedByBytes: true } : {}),
  }
}

// ---------------------------------------------------------------------------
// Streaming path — createReadStream + event handlers
// ---------------------------------------------------------------------------

// StreamState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type StreamState = {
  stream: ReturnType<typeof createReadStream>
  offset: number
  endLine: number
  maxBytes: number | undefined
  truncateOnByteLimit: boolean
  // 这个回调绑定到 resolve: (value: ReadFileRangeResult) => void，负责共享工具在该局部场景下的响应。
  resolve: (value: ReadFileRangeResult) => void
  totalBytesRead: number
  selectedBytes: number
  truncatedByBytes: boolean
  currentLineIndex: number
  selectedLines: string[]
  partial: string
  isFirstChunk: boolean
  // 这个回调绑定到 resolveMtime: (ms: number) => void，负责共享工具在该局部场景下的响应。
  resolveMtime: (ms: number) => void
  mtimeReady: Promise<number>
}

// streamOnOpen 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function streamOnOpen(this: StreamState, fd: number): void {
  // 调用 fstat，触发共享工具此处需要的副作用。
  fstat(fd, (err, stats) => {
    // this.resolveMtime 结算当前 Promise，唤醒等待这个异步结果的调用方。
    this.resolveMtime(err ? 0 : stats.mtimeMs)
  })
}

// streamOnData 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function streamOnData(this: StreamState, chunk: string): void {
  // 满足 `this.isFirstChunk` 时，共享工具执行该分支。
  if (this.isFirstChunk) {
    // 更新实例字段 isFirstChunk 为 false，同步共享工具的内部状态。
    this.isFirstChunk = false
    // 满足 `chunk.charCodeAt(0) === 0xfeff` 时，共享工具执行该分支。
    if (chunk.charCodeAt(0) === 0xfeff) {
      // chunk更新为 `chunk.slice(1)`，确保共享工具后续读取最新状态。
      chunk = chunk.slice(1)
    }
  }

  // 共享工具 read File In Range在这里处理 `this.totalBytesRead += Buffer.byteLength(chunk)`，完成这一小步状态转换。
  this.totalBytesRead += Buffer.byteLength(chunk)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !this.truncateOnByteLimit &&
    this.maxBytes !== undefined &&
    this.totalBytesRead > this.maxBytes
  ) {
    // 调用 this.stream.destroy，触发共享工具此处需要的副作用。
    this.stream.destroy(
      new FileTooLargeError(this.totalBytesRead, this.maxBytes),
    )
    // 共享工具 read File In Range在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // data 命名 `this.partial.length > 0 ? this.partial + chunk : chunk`，让后续代码直接表达这个值的用途。
  const data = this.partial.length > 0 ? this.partial + chunk : chunk
  // 更新实例字段 partial 为 ''，同步共享工具的内部状态。
  this.partial = ''

  // startPos 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let startPos = 0
  // newlinePos 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let newlinePos: number
  // 只要 (newlinePos = data.indexOf('\n', startPos)) !== -1 成立，就持续推进共享工具中的循环处理。
  while ((newlinePos = data.indexOf('\n', startPos)) !== -1) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      this.currentLineIndex >= this.offset &&
      this.currentLineIndex < this.endLine
    ) {
      // line格式化`data.slice`，供共享工具后续处理使用。
      let line = data.slice(startPos, newlinePos)
      // 满足 `line.endsWith('\r')` 时，共享工具执行该分支。
      if (line.endsWith('\r')) {
        // line更新为 `line.slice(0, -1)`，确保共享工具后续读取最新状态。
        line = line.slice(0, -1)
      }
      // `this.truncateOnByteLimit && this.maxBytes` 与 `und` 不一致时刷新派生状态，避免使用过期结果。
      if (this.truncateOnByteLimit && this.maxBytes !== undefined) {
        // sep 命名 `this.selectedLines.length > 0 ? 1 : 0`，让后续代码直接表达这个值的用途。
        const sep = this.selectedLines.length > 0 ? 1 : 0
        // nextBytes 集合保存`Buffer.byteLength`，供共享工具后续处理使用。
        const nextBytes = this.selectedBytes + sep + Buffer.byteLength(line)
        // 满足 `nextBytes > this.maxBytes` 时，共享工具执行该分支。
        if (nextBytes > this.maxBytes) {
          // Cap hit — collapse the selection range so nothing more is
          // accumulated.  Stream continues (to count totalLines).
          // 更新实例字段 truncatedByBytes 为 true，同步共享工具的内部状态。
          this.truncatedByBytes = true
          // 更新实例字段 endLine 为 this.currentLineIndex，同步共享工具的内部状态。
          this.endLine = this.currentLineIndex
        } else {
          // 更新实例字段 selectedBytes 为 nextBytes，同步共享工具的内部状态。
          this.selectedBytes = nextBytes
          // selectedLines 集合追加新条目，保持收集顺序与输入顺序一致。
          this.selectedLines.push(line)
        }
      } else {
        // selectedLines 集合追加新条目，保持收集顺序与输入顺序一致。
        this.selectedLines.push(line)
      }
    }
    // 共享工具 read File In Range在这里处理 `this.currentLineIndex++`，完成这一小步状态转换。
    this.currentLineIndex++
    // startPos 集合更新为 `newlinePos + 1`，确保共享工具后续读取最新状态。
    startPos = newlinePos + 1
  }

  // Only keep the trailing fragment when inside the selected range.
  // Outside the range we just count newlines — discarding prevents
  // unbounded memory growth on huge single-line files.
  // 满足 `startPos < data.length` 时，共享工具执行该分支。
  if (startPos < data.length) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      this.currentLineIndex >= this.offset &&
      this.currentLineIndex < this.endLine
    ) {
      // fragment格式化`data.slice`，供共享工具后续处理使用。
      const fragment = data.slice(startPos)
      // In truncate mode, `partial` can grow unboundedly if the selected
      // range contains a huge single line (no newline across many chunks).
      // Once the fragment alone would overflow the remaining budget, we know
      // the completed line can never fit — set truncated, collapse the
      // selection range, and discard the fragment to stop accumulation.
      // `this.truncateOnByteLimit && this.maxBytes` 与 `und` 不一致时刷新派生状态，避免使用过期结果。
      if (this.truncateOnByteLimit && this.maxBytes !== undefined) {
        // sep 命名 `this.selectedLines.length > 0 ? 1 : 0`，让后续代码直接表达这个值的用途。
        const sep = this.selectedLines.length > 0 ? 1 : 0
        // fragBytes 集合保存`Buffer.byteLength`，供共享工具后续处理使用。
        const fragBytes = this.selectedBytes + sep + Buffer.byteLength(fragment)
        // 满足 `fragBytes > this.maxBytes` 时，共享工具执行该分支。
        if (fragBytes > this.maxBytes) {
          // 更新实例字段 truncatedByBytes 为 true，同步共享工具的内部状态。
          this.truncatedByBytes = true
          // 更新实例字段 endLine 为 this.currentLineIndex，同步共享工具的内部状态。
          this.endLine = this.currentLineIndex
          // 共享工具 read File In Range在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      }
      // 更新实例字段 partial 为 fragment，同步共享工具的内部状态。
      this.partial = fragment
    }
  }
}

// streamOnEnd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function streamOnEnd(this: StreamState): void {
  // line保存`this.partial`，供共享工具 read File In Range后续判断或输出使用。
  let line = this.partial
  // 满足 `line.endsWith('\r')` 时，共享工具执行该分支。
  if (line.endsWith('\r')) {
    // line更新为 `line.slice(0, -1)`，确保共享工具后续读取最新状态。
    line = line.slice(0, -1)
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    this.currentLineIndex >= this.offset &&
    this.currentLineIndex < this.endLine
  ) {
    // `this.truncateOnByteLimit && this.maxBytes` 与 `und` 不一致时刷新派生状态，避免使用过期结果。
    if (this.truncateOnByteLimit && this.maxBytes !== undefined) {
      // sep 命名 `this.selectedLines.length > 0 ? 1 : 0`，让后续代码直接表达这个值的用途。
      const sep = this.selectedLines.length > 0 ? 1 : 0
      // nextBytes 集合保存`Buffer.byteLength`，供共享工具后续处理使用。
      const nextBytes = this.selectedBytes + sep + Buffer.byteLength(line)
      // 满足 `nextBytes > this.maxBytes` 时，共享工具执行该分支。
      if (nextBytes > this.maxBytes) {
        // 更新实例字段 truncatedByBytes 为 true，同步共享工具的内部状态。
        this.truncatedByBytes = true
      } else {
        // selectedLines 集合追加新条目，保持收集顺序与输入顺序一致。
        this.selectedLines.push(line)
      }
    } else {
      // selectedLines 集合追加新条目，保持收集顺序与输入顺序一致。
      this.selectedLines.push(line)
    }
  }
  // 共享工具 read File In Range在这里处理 `this.currentLineIndex++`，完成这一小步状态转换。
  this.currentLineIndex++

  // 文本内容格式化`selectedLines.join`，供共享工具后续处理使用。
  const content = this.selectedLines.join('\n')
  // truncated 命名 `this.truncatedByBytes`，让后续代码直接表达这个值的用途。
  const truncated = this.truncatedByBytes
  // 调用 this.mtimeReady.then，触发共享工具此处需要的副作用。
  this.mtimeReady.then(mtimeMs => {
    // this.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
    this.resolve({
      content,
      lineCount: this.selectedLines.length,
      totalLines: this.currentLineIndex,
      totalBytes: this.totalBytesRead,
      readBytes: Buffer.byteLength(content, 'utf8'),
      mtimeMs,
      ...(truncated ? { truncatedByBytes: true } : {}),
    })
  })
}

// readFileInRangeStreaming 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readFileInRangeStreaming(
  filePath: string,
  offset: number,
  maxLines: number | undefined,
  maxBytes: number | undefined,
  truncateOnByteLimit: boolean,
  signal?: AbortSignal,
): Promise<ReadFileRangeResult> {
  // 返回 `new Promise((resolve, reject) => {`，作为共享工具这次计算的结果。
  return new Promise((resolve, reject) => {
    // 状态 集中保存共享工具 read File In Range要一起传递的字段。
    const state: StreamState = {
      stream: createReadStream(filePath, {
        encoding: 'utf8',
        highWaterMark: 512 * 1024,
        ...(signal ? { signal } : undefined),
      }),
      offset,
      endLine: maxLines !== undefined ? offset + maxLines : Infinity,
      maxBytes,
      truncateOnByteLimit,
      resolve,
      totalBytesRead: 0,
      selectedBytes: 0,
      truncatedByBytes: false,
      currentLineIndex: 0,
      selectedLines: [],
      partial: '',
      isFirstChunk: true,
      // 这个回调绑定到 resolveMtime: () => {},，负责共享工具在该局部场景下的响应。
      resolveMtime: () => {},
      mtimeReady: null as unknown as Promise<number>,
    }
    // mtimeReady更新为 `new Promise<number>(r => {`，确保共享工具后续读取最新状态。
    state.mtimeReady = new Promise<number>(r => {
      // resolveMtime更新为 `r`，确保共享工具后续读取最新状态。
      state.resolveMtime = r
    })

    // 调用 state.stream.once，触发共享工具此处需要的副作用。
    state.stream.once('open', streamOnOpen.bind(state))
    // 调用 state.stream.on，触发共享工具此处需要的副作用。
    state.stream.on('data', streamOnData.bind(state))
    // 调用 state.stream.once，触发共享工具此处需要的副作用。
    state.stream.once('end', streamOnEnd.bind(state))
    // 调用 state.stream.once，触发共享工具此处需要的副作用。
    state.stream.once('error', reject)
  })
}
