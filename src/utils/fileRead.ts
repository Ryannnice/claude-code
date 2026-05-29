/**
 * Sync file-read path, extracted from file.ts.
 *
 * file.ts sits in the settings SCC via log.ts → types/logs.ts → types/message.ts →
 * Tool.ts → commands.ts → … Anything that needs readFileSync from file.ts
 * pulls in the whole chain. This leaf imports only fsOperations and debug,
 * both of which terminate in Node builtins.
 *
 * detectFileEncoding/detectLineEndings stay in file.ts — they call logError
 * (log.ts → SCC) on unexpected failures. The -ForResolvedPath/-ForString
 * helpers here are the pure parts; callers who need the logging wrappers
 * import from file.ts.
 */

// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getFsImplementation、safeResolvePath，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, safeResolvePath } from './fsOperations.js'

// LineEndingType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type LineEndingType = 'CRLF' | 'LF'

// detectEncodingForResolvedPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectEncodingForResolvedPath(
  resolvedPath: string,
): BufferEncoding {
  // 从 `getFsImplementation().readSync(resolvedPath, {` 解构 buffer、bytesRead，减少共享工具 file Read对同一对象的重复访问。
  const { buffer, bytesRead } = getFsImplementation().readSync(resolvedPath, {
    length: 4096,
  })

  // Empty files should default to utf8, not ascii
  // This fixes a bug where writing emojis/CJK to empty files caused corruption
  // 满足 `bytesRead === 0` 时，共享工具执行该分支。
  if (bytesRead === 0) {
    // 返回 `'utf8'`，作为共享工具这次计算的结果。
    return 'utf8'
  }

  // 满足 `bytesRead >= 2` 时，共享工具执行该分支。
  if (bytesRead >= 2) {
    // 只有 `buffer[0] === 0xff && buffer[1] === 0xfe` 满足时，共享工具才执行该分支。
    if (buffer[0] === 0xff && buffer[1] === 0xfe) return 'utf16le'
  }

  // 共享工具在这里按实际状态进入对应分支。
  if (
    bytesRead >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    // 返回 `'utf8'`，作为共享工具这次计算的结果。
    return 'utf8'
  }

  // For non-empty files, default to utf8 since it's a superset of ascii
  // and handles all Unicode characters properly
  // 返回 `'utf8'`，作为共享工具这次计算的结果。
  return 'utf8'
}

// detectLineEndingsForString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectLineEndingsForString(content: string): LineEndingType {
  // crlfCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let crlfCount = 0
  // lfCount 数量保存`0`，供后续判断或组装使用。
  let lfCount = 0

  // 按索引扫描 `content.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < content.length; i++) {
    // 当 `content[i]` 匹配 `'\n'` 时，共享工具执行对应分支。
    if (content[i] === '\n') {
      // 当 `i > 0 && content[i - 1]` 匹配 `'\r'` 时，共享工具执行对应分支。
      if (i > 0 && content[i - 1] === '\r') {
        // 共享工具 file Read在这里处理 `crlfCount++`，完成这一小步状态转换。
        crlfCount++
      } else {
        // 共享工具 file Read在这里处理 `lfCount++`，完成这一小步状态转换。
        lfCount++
      }
    }
  }

  // 返回 `crlfCount > lfCount ? 'CRLF' : 'LF'`，作为共享工具这次计算的结果。
  return crlfCount > lfCount ? 'CRLF' : 'LF'
}

/**
 * Like readFileSync but also returns the detected encoding and original line
 * ending style in one filesystem pass. Callers writing the file back (e.g.
 * FileEditTool) can reuse these instead of calling detectFileEncoding /
 * detectLineEndings separately, which would each redo safeResolvePath +
 * readSync(4KB).
 */
// readFileSyncWithMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function readFileSyncWithMetadata(filePath: string): {
  content: string
  encoding: BufferEncoding
  lineEndings: LineEndingType
} {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 从 `safeResolvePath(fs, filePath)` 解构 resolvedPath、isSymlink，减少共享工具 file Read对同一对象的重复访问。
  const { resolvedPath, isSymlink } = safeResolvePath(fs, filePath)

  // 满足 `isSymlink` 时，共享工具执行该分支。
  if (isSymlink) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Reading through symlink: ${filePath} -> ${resolvedPath}`)
  }

  // encoding读取`detectEncodingForResolvedPath`，供共享工具后续处理使用。
  const encoding = detectEncodingForResolvedPath(resolvedPath)
  // 原始文本读取`fs.readFileSync`，供共享工具后续处理使用。
  const raw = fs.readFileSync(resolvedPath, { encoding })
  // Detect line endings from the raw head before CRLF normalization erases
  // the distinction. 4096 code units is ≥ detectLineEndings's 4096-byte
  // readSync sample (line endings are ASCII, so the unit mismatch is moot).
  // lineEndings 集合读取`detectLineEndingsForString`，供共享工具后续处理使用。
  const lineEndings = detectLineEndingsForString(raw.slice(0, 4096))
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    content: raw.replaceAll('\r\n', '\n'),
    encoding,
    lineEndings,
  }
}

// readFileSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function readFileSync(filePath: string): string {
  // 返回 `readFileSyncWithMetadata(filePath).content`，作为共享工具这次计算的结果。
  return readFileSyncWithMetadata(filePath).content
}
