// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'

/**
 * Sentinel written to stderr ahead of any diverted non-JSON line, so that
 * log scrapers and tests can grep for guard activity.
 */
// STDOUT_GUARD_MARKER固定为 `'[stdout-guard]'`，作为共享工具 stream Json Stdout Guard后续展示或比较的基准。
export const STDOUT_GUARD_MARKER = '[stdout-guard]'

// installed标记共享工具 stream Json Stdout Guard是否启用对应路径。
let installed = false
// buffer保存`''`，作为后续固定文本处理的输入。
let buffer = ''
// originalWrite保存`null`，作为后续空值处理的输入。
let originalWrite: typeof process.stdout.write | null = null

// isJsonLine 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isJsonLine(line: string): boolean {
  // Empty lines are tolerated in NDJSON streams — treat them as valid so a
  // trailing newline or a blank separator doesn't trip the guard.
  // line为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (line.length === 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 JSON.parse，触发共享工具此处需要的副作用。
    JSON.parse(line)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Install a runtime guard on process.stdout.write for --output-format=stream-json.
 *
 * SDK clients consuming stream-json parse stdout line-by-line as NDJSON. Any
 * stray write — a console.log from a dependency, a debug print that slipped
 * past review, a library banner — breaks the client's parser mid-stream with
 * no recovery path.
 *
 * This guard wraps process.stdout.write at the same layer the asciicast
 * recorder does (see asciicast.ts). Writes are buffered until a newline
 * arrives, then each complete line is JSON-parsed. Lines that parse are
 * forwarded to the real stdout; lines that don't are diverted to stderr
 * tagged with STDOUT_GUARD_MARKER so they remain visible without corrupting
 * the JSON stream.
 *
 * The blessed JSON path (structuredIO.write → writeToStdout → stdout.write)
 * always emits `ndjsonSafeStringify(msg) + '\n'`, so it passes straight
 * through. Only out-of-band writes are diverted.
 *
 * Installing twice is a no-op. Call before any stream-json output is emitted.
 */
// installStreamJsonStdoutGuard 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function installStreamJsonStdoutGuard(): void {
  // 满足 `installed` 时，共享工具执行该分支。
  if (installed) {
    // 共享工具 stream Json Stdout Guard在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // installed更新为 `true`，确保共享工具后续读取最新状态。
  installed = true

  // originalWrite更新为 `process.stdout.write.bind(`，确保共享工具后续读取最新状态。
  originalWrite = process.stdout.write.bind(
    process.stdout,
  ) as typeof process.stdout.write

  // write更新为 `function (`，确保共享工具后续读取最新状态。
  process.stdout.write = function (
    chunk: string | Uint8Array,
    // 这个回调绑定到 encodingOrCb?: BufferEncoding | ((err?: Error) => void),，负责共享工具在该局部场景下的响应。
    encodingOrCb?: BufferEncoding | ((err?: Error) => void),
    // 这个回调绑定到 cb?: (err?: Error) => void,，负责共享工具在该局部场景下的响应。
    cb?: (err?: Error) => void,
  ): boolean {
    // text 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const text =
      typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8')

    // 共享工具 stream Json Stdout Guard在这里处理 `buffer += text`，完成这一小步状态转换。
    buffer += text
    // newlineIdx 先占位，稍后的条件分支会根据实际输入补齐它。
    let newlineIdx: number
    // wrote标记共享工具 stream Json Stdout Guard是否启用对应路径。
    let wrote = true
    // 只要 (newlineIdx = buffer.indexOf('\n')) !== -1 成立，就持续推进共享工具中的循环处理。
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      // line格式化`buffer.slice`，供共享工具后续处理使用。
      const line = buffer.slice(0, newlineIdx)
      // buffer更新为 `buffer.slice(newlineIdx + 1)`，确保共享工具后续读取最新状态。
      buffer = buffer.slice(newlineIdx + 1)
      // 满足 `isJsonLine(line)` 时，共享工具执行该分支。
      if (isJsonLine(line)) {
        // wrote更新为 `originalWrite!(line + '\n')`，确保共享工具后续读取最新状态。
        wrote = originalWrite!(line + '\n')
      } else {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(`${STDOUT_GUARD_MARKER} ${line}\n`)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `streamJsonStdoutGuard diverted non-JSON stdout line: ${line.slice(0, 200)}`,
        )
      }
    }

    // Fire the callback once buffering is done. We report success even when
    // a line was diverted — the caller's intent (emit text) was honored,
    // just on a different fd.
    // callback标记共享工具 stream Json Stdout Guard是否启用对应路径。
    const callback = typeof encodingOrCb === 'function' ? encodingOrCb : cb
    // 满足 `callback` 时，共享工具执行该分支。
    if (callback) {
      // 调用 queueMicrotask，触发共享工具此处需要的副作用。
      queueMicrotask(() => callback())
    }
    // 返回 `wrote`，作为共享工具这次计算的结果。
    return wrote
  } as typeof process.stdout.write

  // 调用 registerCleanup，触发共享工具此处需要的副作用。
  registerCleanup(async () => {
    // Flush any partial line left in the buffer at shutdown. If it's a JSON
    // fragment it won't parse — divert it rather than drop it silently.
    // 满足 `buffer.length > 0` 时，共享工具执行该分支。
    if (buffer.length > 0) {
      // 只有 `originalWrite && isJsonLine(buffer)` 满足时，共享工具才执行该分支。
      if (originalWrite && isJsonLine(buffer)) {
        // 调用 originalWrite，触发共享工具此处需要的副作用。
        originalWrite(buffer + '\n')
      } else {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(`${STDOUT_GUARD_MARKER} ${buffer}\n`)
      }
      // buffer更新为 `''`，确保共享工具后续读取最新状态。
      buffer = ''
    }
    // 满足 `originalWrite` 时，共享工具执行该分支。
    if (originalWrite) {
      // write更新为 `originalWrite`，确保共享工具后续读取最新状态。
      process.stdout.write = originalWrite
      // originalWrite更新为 `null`，确保共享工具后续读取最新状态。
      originalWrite = null
    }
    // installed更新为 `false`，确保共享工具后续读取最新状态。
    installed = false
  })
}

/**
 * Testing-only reset. Restores the real stdout.write and clears the line
 * buffer so subsequent tests start from a clean slate.
 */
// _resetStreamJsonStdoutGuardForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetStreamJsonStdoutGuardForTesting(): void {
  // 满足 `originalWrite` 时，共享工具执行该分支。
  if (originalWrite) {
    // write更新为 `originalWrite`，确保共享工具后续读取最新状态。
    process.stdout.write = originalWrite
    // originalWrite更新为 `null`，确保共享工具后续读取最新状态。
    originalWrite = null
  }
  // buffer更新为 `''`，确保共享工具后续读取最新状态。
  buffer = ''
  // installed更新为 `false`，确保共享工具后续读取最新状态。
  installed = false
}
