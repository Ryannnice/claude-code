// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { type FileHandle, open } from 'fs/promises'
// 引入 isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT } from './errors.js'

// CHUNK_SIZE保存`8 * 1024`，供后续判断或组装使用。
export const CHUNK_SIZE = 8 * 1024
// MAX_SCAN_BYTES 集合 命名 `10 * 1024 * 1024`，让后续代码直接表达这个值的用途。
export const MAX_SCAN_BYTES = 10 * 1024 * 1024
// NL 命名 `0x0a`，让后续代码直接表达这个值的用途。
const NL = 0x0a

// EditContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EditContext = {
  /** Slice of the file: contextLines before/after the match, on line boundaries. */
  content: string
  /** 1-based line number of content's first line in the original file. */
  lineOffset: number
  /** True if MAX_SCAN_BYTES was hit without finding the needle. */
  truncated: boolean
}

/**
 * Finds `needle` in the file at `path` and returns a context-window slice
 * containing the match plus `contextLines` of surrounding context on each side.
 *
 * Scans in 8KB chunks with a straddle overlap so matches crossing a chunk
 * boundary are found. Capped at MAX_SCAN_BYTES. No stat — EOF detected via
 * bytesRead.
 *
 * React callers: wrap in useState lazy-init then use() + Suspense. useMemo
 * re-runs when callers pass fresh array literals.
 *
 * Returns null on ENOENT. Returns { truncated: true, content: '' } if the
 * needle isn't found within MAX_SCAN_BYTES.
 */
// readEditContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readEditContext(
  path: string,
  needle: string,
  contextLines = 3,
): Promise<EditContext | null> {
  // handle保存`openForScan`，供共享工具后续处理使用。
  const handle = await openForScan(path)
  // 满足 `handle === null` 时，共享工具执行该分支。
  if (handle === null) return null
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `scanForContext(handle, needle, contextLines)`，调用方直接接收异步结果。
    return await scanForContext(handle, needle, contextLines)
  } finally {
    // 等待 `handle.close()` 完成，再继续共享工具 read Edit Context的异步流程。
    await handle.close()
  }
}

/**
 * Opens `path` for reading. Returns null on ENOENT. Caller owns close().
 */
// openForScan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function openForScan(path: string): Promise<FileHandle | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `open(path, 'r')`，调用方直接接收异步结果。
    return await open(path, 'r')
  } catch (e) {
    // 满足 `isENOENT(e)` 时，共享工具执行该分支。
    if (isENOENT(e)) return null
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

/**
 * Handle-accepting core of readEditContext. Caller owns open/close.
 */
// scanForContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function scanForContext(
  handle: FileHandle,
  needle: string,
  contextLines: number,
): Promise<EditContext> {
  // 满足 `needle === ''` 时，共享工具执行该分支。
  if (needle === '') return { content: '', lineOffset: 1, truncated: false }
  // needleLF保存`Buffer.from`，供共享工具后续处理使用。
  const needleLF = Buffer.from(needle, 'utf8')
  // Model sends LF; files may be CRLF. Count newlines to size the overlap for
  // the longer CRLF form; defer encoding the CRLF buffer until LF scan misses.
  // nlCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let nlCount = 0
  // 按索引扫描 `needleLF.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < needleLF.length; i++) if (needleLF[i] === NL) nlCount++
  // needleCRLF 先占位，稍后的条件分支会根据实际输入补齐它。
  let needleCRLF: Buffer | undefined
  // overlap 命名 `needleLF.length + nlCount - 1`，让后续代码直接表达这个值的用途。
  const overlap = needleLF.length + nlCount - 1

  // buf保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
  const buf = Buffer.allocUnsafe(CHUNK_SIZE + overlap)
  // pos 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let pos = 0
  // linesBeforePos 集合保存`0`，供后续判断或组装使用。
  let linesBeforePos = 0
  // prevTail保存`0`，供后续判断或组装使用。
  let prevTail = 0

  // while 使用 pos < MAX_SCAN_BYTES 完成共享工具里的对应操作。
  while (pos < MAX_SCAN_BYTES) {
    // 从 `await handle.read(buf, prevTail, CHUNK_SIZE, pos)` 解构 bytesRead，减少共享工具 read Edit Context对同一对象的重复访问。
    const { bytesRead } = await handle.read(buf, prevTail, CHUNK_SIZE, pos)
    // 满足 `bytesRead === 0` 时，共享工具执行该分支。
    if (bytesRead === 0) break
    // viewLen保存`prevTail + bytesRead`，供后续判断或组装使用。
    const viewLen = prevTail + bytesRead

    // matchAt保存`indexOfWithin`，供共享工具后续处理使用。
    let matchAt = indexOfWithin(buf, needleLF, viewLen)
    // matchLen 命名 `needleLF.length`，让后续代码直接表达这个值的用途。
    let matchLen = needleLF.length
    // 只有 `matchAt === -1 && nlCount > 0` 满足时，共享工具才执行该分支。
    if (matchAt === -1 && nlCount > 0) {
      // 共享工具 read Edit Context在这里处理 `needleCRLF ??= Buffer.from(needle.replaceAll('\n', '\r\n'), 'utf8')`，完成这一小步状态转换。
      needleCRLF ??= Buffer.from(needle.replaceAll('\n', '\r\n'), 'utf8')
      // matchAt更新为 `indexOfWithin(buf, needleCRLF, viewLen)`，确保共享工具后续读取最新状态。
      matchAt = indexOfWithin(buf, needleCRLF, viewLen)
      // matchLen更新为 `needleCRLF.length`，确保共享工具后续读取最新状态。
      matchLen = needleCRLF.length
    }
    // `matchAt` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (matchAt !== -1) {
      // absMatch保存`pos - prevTail + matchAt`，供后续判断或组装使用。
      const absMatch = pos - prevTail + matchAt
      // 等待并返回 `sliceContext(`，调用方直接接收异步结果。
      return await sliceContext(
        handle,
        buf,
        absMatch,
        matchLen,
        contextLines,
        linesBeforePos + countNewlines(buf, 0, matchAt),
      )
    }
    // 共享工具 read Edit Context在这里处理 `pos += bytesRead`，完成这一小步状态转换。
    pos += bytesRead
    // Shift the tail to the front for straddle. linesBeforePos tracks
    // newlines in bytes we've DISCARDED (not in buf) — count only the
    // non-overlap portion we're about to copyWithin over.
    // nextTail保存`Math.min`，供共享工具后续处理使用。
    const nextTail = Math.min(overlap, viewLen)
    // 共享工具 read Edit Context在这里处理 `linesBeforePos += countNewlines(buf, 0, viewLen - nextTail)`，完成这一小步状态转换。
    linesBeforePos += countNewlines(buf, 0, viewLen - nextTail)
    // prevTail更新为 `nextTail`，确保共享工具后续读取最新状态。
    prevTail = nextTail
    // 调用 buf.copyWithin，触发共享工具此处需要的副作用。
    buf.copyWithin(0, viewLen - prevTail, viewLen)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { content: '', lineOffset: 1, truncated: pos >= MAX_SCAN_BYTES }
}

/**
 * Reads the entire file via `handle` up to MAX_SCAN_BYTES. Returns null if the
 * file exceeds the cap. For the multi-edit path in FileEditToolDiff where
 * sequential replacements need the full string.
 *
 * Single buffer, doubles on fill — ~log2(size/8KB) allocs instead of O(n)
 * chunks + concat. Reads directly into the right offset; no intermediate copies.
 */
// readCapped 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readCapped(handle: FileHandle): Promise<string | null> {
  // buf保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
  let buf = Buffer.allocUnsafe(CHUNK_SIZE)
  // total 命名 `0`，让后续代码直接表达这个值的用途。
  let total = 0
  // 循环处理 ``，让共享工具逐项把同类条目按顺序走完。
  for (;;) {
    // 满足 `total === buf.length` 时，共享工具执行该分支。
    if (total === buf.length) {
      // grown保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
      const grown = Buffer.allocUnsafe(
        Math.min(buf.length * 2, MAX_SCAN_BYTES + CHUNK_SIZE),
      )
      // 调用 buf.copy，触发共享工具此处需要的副作用。
      buf.copy(grown, 0, 0, total)
      // buf更新为 `grown`，确保共享工具后续读取最新状态。
      buf = grown
    }
    // 从 `await handle.read(` 解构 bytesRead，减少共享工具 read Edit Context对同一对象的重复访问。
    const { bytesRead } = await handle.read(
      buf,
      total,
      buf.length - total,
      total,
    )
    // 满足 `bytesRead === 0` 时，共享工具执行该分支。
    if (bytesRead === 0) break
    // 共享工具 read Edit Context在这里处理 `total += bytesRead`，完成这一小步状态转换。
    total += bytesRead
    // 满足 `total > MAX_SCAN_BYTES` 时，共享工具执行该分支。
    if (total > MAX_SCAN_BYTES) return null
  }
  // 返回 `normalizeCRLF(buf, total)`，作为共享工具这次计算的结果。
  return normalizeCRLF(buf, total)
}

/** buf.indexOf bounded to [0, end) without allocating a view. */
// indexOfWithin 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function indexOfWithin(buf: Buffer, needle: Buffer, end: number): number {
  // at保存`buf.indexOf`，供共享工具后续处理使用。
  const at = buf.indexOf(needle)
  // 返回 `at === -1 || at + needle.length > end ? -1 : at`，作为共享工具这次计算的结果。
  return at === -1 || at + needle.length > end ? -1 : at
}

// countNewlines 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countNewlines(buf: Buffer, start: number, end: number): number {
  // n 命名 `0`，让后续代码直接表达这个值的用途。
  let n = 0
  // 循环处理 `let i = start; i < end; i++) if (buf[i] === NL`，让共享工具把同类条目按顺序走完。
  for (let i = start; i < end; i++) if (buf[i] === NL) n++
  // 返回 `n`，作为共享工具这次计算的结果。
  return n
}

/** Decode buf[0..len) to utf8, normalizing CRLF only if CR is present. */
// normalizeCRLF 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeCRLF(buf: Buffer, len: number): string {
  // s 集合格式化`buf.toString`，供共享工具后续处理使用。
  const s = buf.toString('utf8', 0, len)
  // 返回 `s.includes('\r') ? s.replaceAll('\r\n', '\n') : s`，作为共享工具这次计算的结果。
  return s.includes('\r') ? s.replaceAll('\r\n', '\n') : s
}

/**
 * Given an absolute match offset, read ±contextLines around it and return
 * the decoded slice with its starting line number. Reuses `scratch` (the
 * caller's scan buffer) for back/forward/output reads — zero new allocs
 * when the context fits, one alloc otherwise.
 */
// sliceContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function sliceContext(
  handle: FileHandle,
  scratch: Buffer,
  matchStart: number,
  matchLen: number,
  contextLines: number,
  linesBeforeMatch: number,
): Promise<EditContext> {
  // Scan backward from matchStart to find contextLines prior newlines.
  // backChunk保存`Math.min`，供共享工具后续处理使用。
  const backChunk = Math.min(matchStart, CHUNK_SIZE)
  // 从 `await handle.read(` 解构 bytesRead，减少共享工具 read Edit Context对同一对象的重复访问。
  const { bytesRead: backRead } = await handle.read(
    scratch,
    0,
    backChunk,
    matchStart - backChunk,
  )
  // ctxStart 命名 `matchStart`，让后续代码直接表达这个值的用途。
  let ctxStart = matchStart
  // nlSeen 命名 `0`，让后续代码直接表达这个值的用途。
  let nlSeen = 0
  // 循环处理 `let i = backRead - 1; i >= 0 && nlSeen <= context`，让共享工具逐项把同类条目按顺序走完。
  for (let i = backRead - 1; i >= 0 && nlSeen <= contextLines; i--) {
    // 满足 `scratch[i] === NL` 时，共享工具执行该分支。
    if (scratch[i] === NL) {
      // 共享工具 read Edit Context在这里处理 `nlSeen++`，完成这一小步状态转换。
      nlSeen++
      // 满足 `nlSeen > contextLines` 时，共享工具执行该分支。
      if (nlSeen > contextLines) break
    }
    // 共享工具 read Edit Context在这里处理 `ctxStart--`，完成这一小步状态转换。
    ctxStart--
  }
  // Compute lineOffset now, before scratch is overwritten by the forward read.
  // walkedBack保存`matchStart - ctxStart`，供共享工具 read Edit Context后续判断或输出使用。
  const walkedBack = matchStart - ctxStart
  // lineOffset 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lineOffset =
    linesBeforeMatch -
    countNewlines(scratch, backRead - walkedBack, backRead) +
    1

  // Scan forward from matchEnd to find contextLines trailing newlines.
  // matchEnd保存`matchStart + matchLen`，供共享工具 read Edit Context后续判断或输出使用。
  const matchEnd = matchStart + matchLen
  // 从 `await handle.read(` 解构 bytesRead，减少共享工具 read Edit Context对同一对象的重复访问。
  const { bytesRead: fwdRead } = await handle.read(
    scratch,
    0,
    CHUNK_SIZE,
    matchEnd,
  )
  // ctxEnd 命名 `matchEnd`，让后续代码直接表达这个值的用途。
  let ctxEnd = matchEnd
  // nlSeen更新为 `0`，确保共享工具后续读取最新状态。
  nlSeen = 0
  // 按索引扫描 `fwdRead`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < fwdRead; i++) {
    // 共享工具 read Edit Context在这里处理 `ctxEnd++`，完成这一小步状态转换。
    ctxEnd++
    // 满足 `scratch[i] === NL` 时，共享工具执行该分支。
    if (scratch[i] === NL) {
      // 共享工具 read Edit Context在这里处理 `nlSeen++`，完成这一小步状态转换。
      nlSeen++
      // 满足 `nlSeen >= contextLines + 1` 时，共享工具执行该分支。
      if (nlSeen >= contextLines + 1) break
    }
  }

  // Read the exact context range. Reuse scratch if it fits.
  // len 命名 `ctxEnd - ctxStart`，让后续代码直接表达这个值的用途。
  const len = ctxEnd - ctxStart
  // out保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
  const out = len <= scratch.length ? scratch : Buffer.allocUnsafe(len)
  // 从 `await handle.read(out, 0, len, ctxStart)` 解构 bytesRead，减少共享工具 read Edit Context对同一对象的重复访问。
  const { bytesRead: outRead } = await handle.read(out, 0, len, ctxStart)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { content: normalizeCRLF(out, outRead), lineOffset, truncated: false }
}
