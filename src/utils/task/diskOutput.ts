// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { constants as fsConstants } from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type FileHandle,
  mkdir,
  open,
  stat,
  symlink,
  unlink,
} from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'
// 引入 readFileRange、tailFile，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { readFileRange, tailFile } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getProjectTempDir，将 ../permissions/filesystem.js 中已经封装好的能力接到本文件流程里。
import { getProjectTempDir } from '../permissions/filesystem.js'

// SECURITY: O_NOFOLLOW prevents following symlinks when opening task output files.
// Without this, an attacker in the sandbox could create symlinks in the tasks directory
// pointing to arbitrary files, causing Claude Code on the host to write to those files.
// O_NOFOLLOW is not available on Windows, but the sandbox attack vector is Unix-only.
// O_NOFOLLOW保存`fsConstants.O_NOFOLLOW ?? 0`，供后续判断或组装使用。
const O_NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0

// DEFAULT_MAX_READ_BYTES 集合保存`8 * 1024 * 1024 // 8MB`，供后续判断或组装使用。
const DEFAULT_MAX_READ_BYTES = 8 * 1024 * 1024 // 8MB

/**
 * Disk cap for task output files. In file mode (bash), a watchdog polls
 * file size and kills the process. In pipe mode (hooks), DiskTaskOutput
 * drops chunks past this limit. Shared so both caps stay in sync.
 */
// MAX_TASK_OUTPUT_BYTES 集合 命名 `5 * 1024 * 1024 * 1024`，让后续代码直接表达这个值的用途。
export const MAX_TASK_OUTPUT_BYTES = 5 * 1024 * 1024 * 1024
// MAX_TASK_OUTPUT_BYTES_DISPLAY 命名 `'5GB'`，让后续代码直接表达这个值的用途。
export const MAX_TASK_OUTPUT_BYTES_DISPLAY = '5GB'

/**
 * Get the task output directory for this session.
 * Uses project temp directory so reads are auto-allowed by checkReadableInternalPath.
 *
 * The session ID is included so concurrent sessions in the same project don't
 * clobber each other's output files. Startup cleanup in one session previously
 * unlinked in-flight output files from other sessions — the writing process's fd
 * keeps the inode alive but reads via path fail ENOENT, and getStdout() returned
 * empty string (inc-4586 / boris-20260309-060423).
 *
 * The session ID is captured at FIRST CALL, not re-read on every invocation.
 * /clear calls regenerateSessionId(), which would otherwise cause
 * ensureOutputDir() to create a new-session path while existing TaskOutput
 * instances still hold old-session paths — open() would ENOENT. Background
 * bash tasks surviving /clear need their output files to stay reachable.
 */
// _taskOutputDir 先占位，稍后的条件分支会根据实际输入补齐它。
let _taskOutputDir: string | undefined
// getTaskOutputDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTaskOutputDir(): string {
  // 满足 `_taskOutputDir === undefined` 时，共享工具执行该分支。
  if (_taskOutputDir === undefined) {
    // _taskOutputDir更新为 `join(getProjectTempDir(), getSessionId(), 'tasks')`，确保共享工具后续读取最新状态。
    _taskOutputDir = join(getProjectTempDir(), getSessionId(), 'tasks')
  }
  // 返回 `_taskOutputDir`，作为共享工具这次计算的结果。
  return _taskOutputDir
}

/** Test helper — clears the memoized dir. */
// _resetTaskOutputDirForTest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetTaskOutputDirForTest(): void {
  // _taskOutputDir更新为 `undefined`，确保共享工具后续读取最新状态。
  _taskOutputDir = undefined
}

/**
 * Ensure the task output directory exists
 */
// ensureOutputDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function ensureOutputDir(): Promise<void> {
  // 等待 `mkdir(getTaskOutputDir(), { recursive: true })` 完成，再继续共享工具 disk Output的异步流程。
  await mkdir(getTaskOutputDir(), { recursive: true })
}

/**
 * Get the output file path for a task
 */
// getTaskOutputPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTaskOutputPath(taskId: string): string {
  // 返回 `join(getTaskOutputDir(), `${taskId}.output`)`，作为共享工具这次计算的结果。
  return join(getTaskOutputDir(), `${taskId}.output`)
}

// Tracks fire-and-forget promises (initTaskOutput, initTaskOutputAsSymlink,
// evictTaskOutput, #drain) so tests can drain before teardown. Prevents the
// async-ENOENT-after-teardown flake class (#24957, #25065): a voided async
// resumes after preload's afterEach nuked the temp dir → ENOENT → unhandled
// rejection → flaky test failure. allSettled so a rejection doesn't short-
// circuit the drain and leave other ops racing the rmSync.
// _pendingOps 集合 命名 `new Set<Promise<unknown>>()`，让后续代码直接表达这个值的用途。
const _pendingOps = new Set<Promise<unknown>>()
// track 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function track<T>(p: Promise<T>): Promise<T> {
  // 调用 _pendingOps.add，触发共享工具此处需要的副作用。
  _pendingOps.add(p)
  // 这个回调绑定到 void p.finally(() => _pendingOps.delete(p)).catch(() => {})，负责共享工具在该局部场景下的响应。
  void p.finally(() => _pendingOps.delete(p)).catch(() => {})
  // 返回 `p`，作为共享工具这次计算的结果。
  return p
}

/**
 * Encapsulates async disk writes for a single task's output.
 *
 * Uses a flat array as a write queue processed by a single drain loop,
 * so each chunk can be GC'd immediately after its write completes.
 * This avoids the memory retention problem of chained .then() closures
 * where every reaction captures its data until the whole chain resolves.
 */
// DiskTaskOutput 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class DiskTaskOutput {
  #path: string
  #fileHandle: FileHandle | null = null
  #queue: string[] = []
  #bytesWritten = 0
  #capped = false
  #flushPromise: Promise<void> | null = null
  // 构造函数接收 taskId: string，把外部输入整理成实例可复用的内部状态。
  #flushResolve: (() => void) | null = null

  // 构造函数接收 taskId: string，把外部输入整理成实例可复用的内部状态。
  constructor(taskId: string) {
    // 共享工具 disk Output在这里处理 `this.#path = getTaskOutputPath(taskId)`，完成这一小步状态转换。
    this.#path = getTaskOutputPath(taskId)
  }

  // append 使用 content: string 完成共享工具里的对应操作。
  append(content: string): void {
    // 满足 `this.#capped` 时，共享工具执行该分支。
    if (this.#capped) {
      // 共享工具 disk Output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // content.length (UTF-16 code units) undercounts UTF-8 bytes by at most ~3×.
    // Acceptable for a coarse disk-fill guard — avoids re-scanning every chunk.
    // 共享工具 disk Output在这里处理 `this.#bytesWritten += content.length`，完成这一小步状态转换。
    this.#bytesWritten += content.length
    // 满足 `this.#bytesWritten > MAX_TASK_OUTPUT_BYTES` 时，共享工具执行该分支。
    if (this.#bytesWritten > MAX_TASK_OUTPUT_BYTES) {
      // 共享工具 disk Output在这里处理 `this.#capped = true`，完成这一小步状态转换。
      this.#capped = true
      // 共享工具 disk Output在这里处理 `this.#queue.push(`，完成这一小步状态转换。
      this.#queue.push(
        `\n[output truncated: exceeded ${MAX_TASK_OUTPUT_BYTES_DISPLAY} disk cap]\n`,
      )
    } else {
      // 共享工具 disk Output在这里处理 `this.#queue.push(content)`，完成这一小步状态转换。
      this.#queue.push(content)
    }
    // 满足 `!this.#flushPromise` 时，共享工具执行该分支。
    if (!this.#flushPromise) {
      // 这个回调绑定到 this.#flushPromise = new Promise<void>(resolve => {，负责共享工具在该局部场景下的响应。
      this.#flushPromise = new Promise<void>(resolve => {
        // 共享工具 disk Output在这里处理 `this.#flushResolve = resolve`，完成这一小步状态转换。
        this.#flushResolve = resolve
      })
      // 显式忽略 `track(this.#drain())` 的返回值，只保留它触发的副作用。
      void track(this.#drain())
    }
  }

  // flush 使用 无 完成共享工具里的对应操作。
  flush(): Promise<void> {
    // 返回 `this.#flushPromise ?? Promise.resolve()`，作为共享工具这次计算的结果。
    return this.#flushPromise ?? Promise.resolve()
  }

  // cancel 使用 无 完成共享工具里的对应操作。
  cancel(): void {
    // 共享工具 disk Output在这里处理 `this.#queue.length = 0`，完成这一小步状态转换。
    this.#queue.length = 0
  }

  async #drainAllChunks(): Promise<void> {
    // while 使用 true 完成共享工具里的对应操作。
    while (true) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 满足 `!this.#fileHandle` 时，共享工具执行该分支。
        if (!this.#fileHandle) {
          // 等待 `ensureOutputDir()` 完成，再继续共享工具 disk Output的异步流程。
          await ensureOutputDir()
          // 共享工具 disk Output在这里处理 `this.#fileHandle = await open(`，完成这一小步状态转换。
          this.#fileHandle = await open(
            this.#path,
            process.platform === 'win32'
              ? 'a'
              : fsConstants.O_WRONLY |
                  fsConstants.O_APPEND |
                  fsConstants.O_CREAT |
                  O_NOFOLLOW,
          )
        }
        // while 使用 true 完成共享工具里的对应操作。
        while (true) {
          // 等待 `this.#writeAllChunks()` 完成，再继续共享工具 disk Output的异步流程。
          await this.#writeAllChunks()
          // this.#queue为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
          if (this.#queue.length === 0) {
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        }
      } finally {
        // 满足 `this.#fileHandle` 时，共享工具执行该分支。
        if (this.#fileHandle) {
          // fileHandle 文件数据保存`this.#fileHandle`，供后续判断或组装使用。
          const fileHandle = this.#fileHandle
          // 共享工具 disk Output在这里处理 `this.#fileHandle = null`，完成这一小步状态转换。
          this.#fileHandle = null
          // 等待 `fileHandle.close()` 完成，再继续共享工具 disk Output的异步流程。
          await fileHandle.close()
        }
      }
      // you could have another .append() while we're waiting for the file to close, so we check the queue again before fully exiting
      // 满足 `this.#queue.length` 时，共享工具执行该分支。
      if (this.#queue.length) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // 返回 `#writeAllChunks(): Promise<void> {`，作为共享工具这次计算的结果。
  #writeAllChunks(): Promise<void> {
    // This code is extremely precise.
    // You **must not** add an await here!! That will cause memory to balloon as the queue grows.
    // It's okay to add an `await` to the caller of this method (e.g. #drainAllChunks) because that won't cause Buffer[] to be kept alive in memory.
    // 返回 `this.#fileHandle!.appendFile(`，作为共享工具这次计算的结果。
    return this.#fileHandle!.appendFile(
      // This variable needs to get GC'd ASAP.
      this.#queueToBuffers(),
    )
  }

  /** Keep this in a separate method so that GC doesn't keep it alive for any longer than it should. */
  // queue保存`queue.splice`，供共享工具后续处理使用。
  #queueToBuffers(): Buffer {
    // Use .splice to in-place mutate the array, informing the GC it can free it.
    // queue保存`queue.splice`，供共享工具后续处理使用。
    const queue = this.#queue.splice(0, this.#queue.length)

    // totalLength 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let totalLength = 0
    // 按顺序遍历 `queue` 中的str，逐个交给共享工具处理。
    for (const str of queue) {
      // 共享工具 disk Output在这里处理 `totalLength += Buffer.byteLength(str, 'utf8')`，完成这一小步状态转换。
      totalLength += Buffer.byteLength(str, 'utf8')
    }

    // buffer保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
    const buffer = Buffer.allocUnsafe(totalLength)
    // offset 命名 `0`，让后续代码直接表达这个值的用途。
    let offset = 0
    // 按顺序遍历 `queue` 中的str，逐个交给共享工具处理。
    for (const str of queue) {
      // 共享工具 disk Output在这里处理 `offset += buffer.write(str, offset, 'utf8')`，完成这一小步状态转换。
      offset += buffer.write(str, offset, 'utf8')
    }

    // 返回 `buffer`，作为共享工具这次计算的结果。
    return buffer
  }

  // 共享工具 disk Output在这里处理 `async #drain(): Promise<void> {`，完成这一小步状态转换。
  async #drain(): Promise<void> {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `this.#drainAllChunks()` 完成，再继续共享工具 disk Output的异步流程。
      await this.#drainAllChunks()
    } catch (e) {
      // Transient fs errors (EMFILE on busy CI, EPERM on Windows pending-
      // delete) previously rode up through `void this.#drain()` as an
      // unhandled rejection while the flush promise resolved anyway — callers
      // saw an empty file with no error. Retry once for the transient case
      // (queue is intact if open() failed), then log and give up.
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e)
      // 满足 `this.#queue.length > 0` 时，共享工具执行该分支。
      if (this.#queue.length > 0) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `this.#drainAllChunks()` 完成，再继续共享工具 disk Output的异步流程。
          await this.#drainAllChunks()
        } catch (e2) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(e2)
        }
      }
    } finally {
      // resolve 命名 `this.#flushResolve!`，让后续代码直接表达这个值的用途。
      const resolve = this.#flushResolve!
      // 共享工具 disk Output在这里处理 `this.#flushPromise = null`，完成这一小步状态转换。
      this.#flushPromise = null
      // 共享工具 disk Output在这里处理 `this.#flushResolve = null`，完成这一小步状态转换。
      this.#flushResolve = null
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve()
    }
  }
}

// outputs 集合 命名 `new Map<string, DiskTaskOutput>()`，让后续代码直接表达这个值的用途。
const outputs = new Map<string, DiskTaskOutput>()

/**
 * Test helper — cancel pending writes, await in-flight ops, clear the map.
 * backgroundShells.test.ts and other task tests spawn real shells that
 * write through this module without afterEach cleanup; their entries
 * leak into diskOutput.test.ts on the same shard.
 *
 * Awaits all tracked promises until the set stabilizes — a settling promise
 * may spawn another (initTaskOutputAsSymlink's catch → initTaskOutput).
 * Call this in afterEach BEFORE rmSync to avoid async-ENOENT-after-teardown.
 */
// _clearOutputsForTest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function _clearOutputsForTest(): Promise<void> {
  // 逐项读取 `outputs.values()` 中的output，按输入顺序推进共享工具。
  for (const output of outputs.values()) {
    // 调用 output.cancel，触发共享工具此处需要的副作用。
    output.cancel()
  }
  // while 使用 _pendingOps.size > 0 完成共享工具里的对应操作。
  while (_pendingOps.size > 0) {
    // 等待 `Promise.allSettled([..._pendingOps])` 完成，再继续共享工具 disk Output的异步流程。
    await Promise.allSettled([..._pendingOps])
  }
  // 调用 outputs.clear，触发共享工具此处需要的副作用。
  outputs.clear()
}

// getOrCreateOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOrCreateOutput(taskId: string): DiskTaskOutput {
  // output读取`outputs.get`，供共享工具后续处理使用。
  let output = outputs.get(taskId)
  // output缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!output) {
    // output更新为 `new DiskTaskOutput(taskId)`，确保共享工具后续读取最新状态。
    output = new DiskTaskOutput(taskId)
    // outputs.set 写入新的状态值，使共享工具后续读取保持一致。
    outputs.set(taskId, output)
  }
  // 返回 `output`，作为共享工具这次计算的结果。
  return output
}

/**
 * Append output to a task's disk file asynchronously.
 * Creates the file if it doesn't exist.
 */
// appendTaskOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function appendTaskOutput(taskId: string, content: string): void {
  // 调用 getOrCreateOutput，触发共享工具此处需要的副作用。
  getOrCreateOutput(taskId).append(content)
}

/**
 * Wait for all pending writes for a task to complete.
 * Useful before reading output to ensure all data is flushed.
 */
// flushTaskOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function flushTaskOutput(taskId: string): Promise<void> {
  // output读取`outputs.get`，供共享工具后续处理使用。
  const output = outputs.get(taskId)
  // 满足 `output` 时，共享工具执行该分支。
  if (output) {
    // 等待 `output.flush()` 完成，再继续共享工具 disk Output的异步流程。
    await output.flush()
  }
}

/**
 * Evict a task's DiskTaskOutput from the in-memory map after flushing.
 * Unlike cleanupTaskOutput, this does not delete the output file on disk.
 * Call this when a task completes and its output has been consumed.
 */
// evictTaskOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function evictTaskOutput(taskId: string): Promise<void> {
  // 返回 `track(`，作为共享工具这次计算的结果。
  return track(
    (async () => {
      // output读取`outputs.get`，供共享工具后续处理使用。
      const output = outputs.get(taskId)
      // 满足 `output` 时，共享工具执行该分支。
      if (output) {
        // 等待 `output.flush()` 完成，再继续共享工具 disk Output的异步流程。
        await output.flush()
        // 调用 outputs.delete，触发共享工具此处需要的副作用。
        outputs.delete(taskId)
      }
    })(),
  )
}

/**
 * Get delta (new content) since last read.
 * Reads only from the byte offset, up to maxBytes — never loads the full file.
 */
// getTaskOutputDelta 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTaskOutputDelta(
  taskId: string,
  fromOffset: number,
  maxBytes: number = DEFAULT_MAX_READ_BYTES,
): Promise<{ content: string; newOffset: number }> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果读取`readFileRange`，供共享工具后续处理使用。
    const result = await readFileRange(
      getTaskOutputPath(taskId),
      fromOffset,
      maxBytes,
    )
    // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { content: '', newOffset: fromOffset }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      content: result.content,
      newOffset: fromOffset + result.bytesRead,
    }
  } catch (e) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { content: '', newOffset: fromOffset }
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: '', newOffset: fromOffset }
  }
}

/**
 * Get output for a task, reading the tail of the file.
 * Caps at maxBytes to avoid loading multi-GB files into memory.
 */
// getTaskOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTaskOutput(
  taskId: string,
  maxBytes: number = DEFAULT_MAX_READ_BYTES,
): Promise<string> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await tailFile(` 解构 content、bytesTotal、bytesRead，减少共享工具 disk Output对同一对象的重复访问。
    const { content, bytesTotal, bytesRead } = await tailFile(
      getTaskOutputPath(taskId),
      maxBytes,
    )
    // 满足 `bytesTotal > bytesRead` 时，共享工具执行该分支。
    if (bytesTotal > bytesRead) {
      // 返回 ``[${Math.round((bytesTotal - bytesRead) / 1024)}KB of earlier output om...`，作为共享工具这次计算的结果。
      return `[${Math.round((bytesTotal - bytesRead) / 1024)}KB of earlier output omitted]\n${content}`
    }
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  } catch (e) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return ''
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }
}

/**
 * Get the current size (offset) of a task's output file.
 */
// getTaskOutputSize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTaskOutputSize(taskId: string): Promise<number> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `(await stat(getTaskOutputPath(taskId))).size`，作为共享工具这次计算的结果。
    return (await stat(getTaskOutputPath(taskId))).size
  } catch (e) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回 `0`，作为共享工具这次计算的结果。
      return 0
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }
}

/**
 * Clean up a task's output file and write queue.
 */
// cleanupTaskOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupTaskOutput(taskId: string): Promise<void> {
  // output读取`outputs.get`，供共享工具后续处理使用。
  const output = outputs.get(taskId)
  // 满足 `output` 时，共享工具执行该分支。
  if (output) {
    // 调用 output.cancel，触发共享工具此处需要的副作用。
    output.cancel()
    // 调用 outputs.delete，触发共享工具此处需要的副作用。
    outputs.delete(taskId)
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(getTaskOutputPath(taskId))` 完成，再继续共享工具 disk Output的异步流程。
    await unlink(getTaskOutputPath(taskId))
  } catch (e) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 共享工具 disk Output在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}

/**
 * Initialize output file for a new task.
 * Creates an empty file to ensure the path exists.
 */
// initTaskOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initTaskOutput(taskId: string): Promise<string> {
  // 返回 `track(`，作为共享工具这次计算的结果。
  return track(
    (async () => {
      // 等待 `ensureOutputDir()` 完成，再继续共享工具 disk Output的异步流程。
      await ensureOutputDir()
      // outputPath 路径数据读取`getTaskOutputPath`，供共享工具后续处理使用。
      const outputPath = getTaskOutputPath(taskId)
      // SECURITY: O_NOFOLLOW prevents symlink-following attacks from the sandbox.
      // O_EXCL ensures we create a new file and fail if something already exists at this path.
      // On Windows, use string flags — numeric O_EXCL can produce EINVAL through libuv.
      // fh保存`open`，供共享工具后续处理使用。
      const fh = await open(
        outputPath,
        process.platform === 'win32'
          ? 'wx'
          : fsConstants.O_WRONLY |
              fsConstants.O_CREAT |
              fsConstants.O_EXCL |
              O_NOFOLLOW,
      )
      // 等待 `fh.close()` 完成，再继续共享工具 disk Output的异步流程。
      await fh.close()
      // 返回 `outputPath`，作为共享工具这次计算的结果。
      return outputPath
    })(),
  )
}

/**
 * Initialize output file as a symlink to another file (e.g., agent transcript).
 * Tries to create the symlink first; if a file already exists, removes it and retries.
 */
// initTaskOutputAsSymlink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initTaskOutputAsSymlink(
  taskId: string,
  targetPath: string,
): Promise<string> {
  // 返回 `track(`，作为共享工具这次计算的结果。
  return track(
    // 这个回调绑定到 (async () => {，负责共享工具在该局部场景下的响应。
    (async () => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `ensureOutputDir()` 完成，再继续共享工具 disk Output的异步流程。
        await ensureOutputDir()
        // outputPath 路径数据读取`getTaskOutputPath`，供共享工具后续处理使用。
        const outputPath = getTaskOutputPath(taskId)

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `symlink(targetPath, outputPath)` 完成，再继续共享工具 disk Output的异步流程。
          await symlink(targetPath, outputPath)
        } catch {
          // 等待 `unlink(outputPath)` 完成，再继续共享工具 disk Output的异步流程。
          await unlink(outputPath)
          // 等待 `symlink(targetPath, outputPath)` 完成，再继续共享工具 disk Output的异步流程。
          await symlink(targetPath, outputPath)
        }

        // 返回 `outputPath`，作为共享工具这次计算的结果。
        return outputPath
      } catch (error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // 返回 `initTaskOutput(taskId)`，作为共享工具这次计算的结果。
        return initTaskOutput(taskId)
      }
    })(),
  )
}
