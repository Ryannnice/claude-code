// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { chmodSync, writeFileSync as fsWriteFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { realpath, stat } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep,
} from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isENOENT、isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT, isFsInaccessible } from './errors.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  detectEncodingForResolvedPath,
  detectLineEndingsForString,
  type LineEndingType,
} from './fileRead.js'
// 引入 fileReadCache，将 ./fileReadCache.js 中已经封装好的能力接到本文件流程里。
import { fileReadCache } from './fileReadCache.js'
// 引入 getFsImplementation、safeResolvePath，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, safeResolvePath } from './fsOperations.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 expandPath，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { expandPath } from './path.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'

// File 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type File = {
  filename: string
  content: string
}

/**
 * Check if a path exists asynchronously.
 */
// pathExists 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pathExists(path: string): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `stat(path)` 完成，再继续共享工具 file的异步流程。
    await stat(path)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// MAX_OUTPUT_SIZE保存`0.25 * 1024 * 1024 // 0.25MB in bytes`，供共享工具 file后续判断或输出使用。
export const MAX_OUTPUT_SIZE = 0.25 * 1024 * 1024 // 0.25MB in bytes

// readFileSafe 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function readFileSafe(filepath: string): string | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // 返回 `fs.readFileSync(filepath, { encoding: 'utf8' })`，作为共享工具这次计算的结果。
    return fs.readFileSync(filepath, { encoding: 'utf8' })
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Get the normalized modification time of a file in milliseconds.
 * Uses Math.floor to ensure consistent timestamp comparisons across file operations,
 * reducing false positives from sub-millisecond precision changes (e.g., from IDE
 * file watchers that touch files without changing content).
 */
// getFileModificationTime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFileModificationTime(filePath: string): number {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 返回 `Math.floor(fs.statSync(filePath).mtimeMs)`，作为共享工具这次计算的结果。
  return Math.floor(fs.statSync(filePath).mtimeMs)
}

/**
 * Async variant of getFileModificationTime. Same floor semantics.
 * Use this in async paths (getChangedFiles runs every turn on every readFileState
 * entry — sync statSync there triggers the slow-operation indicator on network/
 * slow disks).
 */
// getFileModificationTimeAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getFileModificationTimeAsync(
  filePath: string,
): Promise<number> {
  // s 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const s = await getFsImplementation().stat(filePath)
  // 返回 `Math.floor(s.mtimeMs)`，作为共享工具这次计算的结果。
  return Math.floor(s.mtimeMs)
}

// writeTextContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function writeTextContent(
  filePath: string,
  content: string,
  encoding: BufferEncoding,
  endings: LineEndingType,
): void {
  // toWrite保存`content`，供后续判断或组装使用。
  let toWrite = content
  // 当 `endings` 匹配 `'CRLF'` 时，共享工具执行对应分支。
  if (endings === 'CRLF') {
    // Normalize any existing CRLF to LF first so a new_string that already
    // contains \r\n (raw model output) doesn't become \r\r\n after the join.
    // toWrite更新为 `content.replaceAll('\r\n', '\n').split('\n').join('\r\n')`，确保共享工具后续读取最新状态。
    toWrite = content.replaceAll('\r\n', '\n').split('\n').join('\r\n')
  }

  // 调用 writeFileSyncAndFlush_DEPRECATED，触发共享工具此处需要的副作用。
  writeFileSyncAndFlush_DEPRECATED(filePath, toWrite, { encoding })
}

// detectFileEncoding 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectFileEncoding(filePath: string): BufferEncoding {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // 从 `safeResolvePath(fs, filePath)` 解构 resolvedPath，减少共享工具 file对同一对象的重复访问。
    const { resolvedPath } = safeResolvePath(fs, filePath)
    // 返回 `detectEncodingForResolvedPath(resolvedPath)`，作为共享工具这次计算的结果。
    return detectEncodingForResolvedPath(resolvedPath)
  } catch (error) {
    // 满足 `isFsInaccessible(error)` 时，共享工具执行该分支。
    if (isFsInaccessible(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `detectFileEncoding failed for expected reason: ${error.code}`,
        {
          level: 'debug',
        },
      )
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
    // 返回 `'utf8'`，作为共享工具这次计算的结果。
    return 'utf8'
  }
}

// detectLineEndings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectLineEndings(
  filePath: string,
  encoding: BufferEncoding = 'utf8',
): LineEndingType {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fs = getFsImplementation()
    // 从 `safeResolvePath(fs, filePath)` 解构 resolvedPath，减少共享工具 file对同一对象的重复访问。
    const { resolvedPath } = safeResolvePath(fs, filePath)
    // 从 `fs.readSync(resolvedPath, { length: 4096 })` 解构 buffer、bytesRead，减少共享工具 file对同一对象的重复访问。
    const { buffer, bytesRead } = fs.readSync(resolvedPath, { length: 4096 })

    // 文本内容格式化`buffer.toString`，供共享工具后续处理使用。
    const content = buffer.toString(encoding, 0, bytesRead)
    // 返回 `detectLineEndingsForString(content)`，作为共享工具这次计算的结果。
    return detectLineEndingsForString(content)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `'LF'`，作为共享工具这次计算的结果。
    return 'LF'
  }
}

// convertLeadingTabsToSpaces 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function convertLeadingTabsToSpaces(content: string): string {
  // The /gm regex scans every line even on no-match; skip it entirely
  // for the common tab-free case.
  // 满足 `!content.includes('\t')` 时，共享工具执行该分支。
  if (!content.includes('\t')) return content
  // 返回 `content.replace(/^\t+/gm, _ => ' '.repeat(_.length))`，作为共享工具这次计算的结果。
  return content.replace(/^\t+/gm, _ => '  '.repeat(_.length))
}

// getAbsoluteAndRelativePaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAbsoluteAndRelativePaths(path: string | undefined): {
  absolutePath: string | undefined
  relativePath: string | undefined
} {
  // absolutePath 路径数据保存`expandPath`，供共享工具后续处理使用。
  const absolutePath = path ? expandPath(path) : undefined
  // relativePath 路径数据 命名 `absolutePath`，让后续代码直接表达这个值的用途。
  const relativePath = absolutePath
    ? relative(getCwd(), absolutePath)
    : undefined
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { absolutePath, relativePath }
}

// getDisplayPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDisplayPath(filePath: string): string {
  // Use relative path if file is in the current working directory
  // 从 `getAbsoluteAndRelativePaths(filePath)` 解构 relativePath，减少共享工具 file对同一对象的重复访问。
  const { relativePath } = getAbsoluteAndRelativePaths(filePath)
  // 只有 `relativePath && !relativePath.startsWith('..')` 满足时，共享工具才执行该分支。
  if (relativePath && !relativePath.startsWith('..')) {
    // 返回 `relativePath`，作为共享工具这次计算的结果。
    return relativePath
  }

  // Use tilde notation for files in home directory
  // homeDir保存`homedir`，供共享工具后续处理使用。
  const homeDir = homedir()
  // 满足 `filePath.startsWith(homeDir + sep)` 时，共享工具执行该分支。
  if (filePath.startsWith(homeDir + sep)) {
    // 返回 `'~' + filePath.slice(homeDir.length)`，作为共享工具这次计算的结果。
    return '~' + filePath.slice(homeDir.length)
  }

  // Otherwise return the absolute path
  // 返回 `filePath`，作为共享工具这次计算的结果。
  return filePath
}

/**
 * Find files with the same name but different extensions in the same directory
 * @param filePath The path to the file that doesn't exist
 * @returns The found file with a different extension, or undefined if none found
 */

// findSimilarFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findSimilarFile(filePath: string): string | undefined {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dir保存`dirname`，供共享工具后续处理使用。
    const dir = dirname(filePath)
    // fileBaseName 文件数据保存`basename`，供共享工具后续处理使用。
    const fileBaseName = basename(filePath, extname(filePath))

    // Get all files in the directory
    // files 文件数据读取`fs.readdirSync`，供共享工具后续处理使用。
    const files = fs.readdirSync(dir)

    // Find files with the same base name but different extension
    // similarFiles 文件数据筛选`files.filter`，供共享工具后续处理使用。
    const similarFiles = files.filter(
      // file 文件数据更新为 `>`，确保共享工具后续读取最新状态。
      file =>
        basename(file.name, extname(file.name)) === fileBaseName &&
        join(dir, file.name) !== filePath,
    )

    // Return just the filename of the first match if found
    // firstMatch保存`similarFiles[0]`，供共享工具 file后续判断或输出使用。
    const firstMatch = similarFiles[0]
    // 满足 `firstMatch` 时，共享工具执行该分支。
    if (firstMatch) {
      // 返回 `firstMatch.name`，作为共享工具这次计算的结果。
      return firstMatch.name
    }
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  } catch (error) {
    // Missing dir (ENOENT) is expected; for other errors log and return undefined
    // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
    if (!isENOENT(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}

/**
 * Marker included in file-not-found error messages that contain a cwd note.
 * UI renderers check for this to show a short "File not found" message.
 */
// FILE_NOT_FOUND_CWD_NOTE 文件数据保存`'Note: your current working directory is'`，作为后续固定文本处理的输入。
export const FILE_NOT_FOUND_CWD_NOTE = 'Note: your current working directory is'

/**
 * Suggests a corrected path under the current working directory when a file/directory
 * is not found. Detects the "dropped repo folder" pattern where the model constructs
 * an absolute path missing the repo directory component.
 *
 * Example:
 *   cwd = /Users/zeeg/src/currentRepo
 *   requestedPath = /Users/zeeg/src/foobar           (doesn't exist)
 *   returns        /Users/zeeg/src/currentRepo/foobar (if it exists)
 *
 * @param requestedPath - The absolute path that was not found
 * @returns The corrected path if found under cwd, undefined otherwise
 */
// suggestPathUnderCwd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function suggestPathUnderCwd(
  requestedPath: string,
): Promise<string | undefined> {
  // cwd读取`getCwd`，供共享工具后续处理使用。
  const cwd = getCwd()
  // cwdParent保存`dirname`，供共享工具后续处理使用。
  const cwdParent = dirname(cwd)

  // Resolve symlinks in the requested path's parent directory (e.g., /tmp -> /private/tmp on macOS)
  // so the prefix comparison works correctly against the cwd (which is already realpath-resolved).
  // resolvedPath 路径数据保存`requestedPath`，供后续判断或组装使用。
  let resolvedPath = requestedPath
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // resolvedDir保存`realpath`，供共享工具后续处理使用。
    const resolvedDir = await realpath(dirname(requestedPath))
    // resolvedPath 路径数据更新为 `join(resolvedDir, basename(requestedPath))`，确保共享工具后续读取最新状态。
    resolvedPath = join(resolvedDir, basename(requestedPath))
  } catch {
    // Parent directory doesn't exist, use the original path
  }

  // Only check if the requested path is under cwd's parent but not under cwd itself.
  // When cwdParent is the root directory (e.g., '/'), use it directly as the prefix
  // to avoid a double-separator '//' that would never match.
  // cwdParentPrefix标记共享工具 file是否启用对应路径。
  const cwdParentPrefix = cwdParent === sep ? sep : cwdParent + sep
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !resolvedPath.startsWith(cwdParentPrefix) ||
    resolvedPath.startsWith(cwd + sep) ||
    resolvedPath === cwd
  ) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Get the relative path from the parent directory
  // relFromParent保存`relative`，供共享工具后续处理使用。
  const relFromParent = relative(cwdParent, resolvedPath)

  // Check if the same relative path exists under cwd
  // correctedPath 路径数据格式化`join`，供共享工具后续处理使用。
  const correctedPath = join(cwd, relFromParent)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `stat(correctedPath)` 完成，再继续共享工具 file的异步流程。
    await stat(correctedPath)
    // 返回 `correctedPath`，作为共享工具这次计算的结果。
    return correctedPath
  } catch {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}

/**
 * Whether to use the compact line-number prefix format (`N\t` instead of
 * `     N→`). The padded-arrow format costs 9 bytes/line overhead; at
 * 1.35B Read calls × 132 lines avg this is 2.18% of fleet uncached input
 * (bq-queries/read_line_prefix_overhead_verify.sql).
 *
 * Ant soak validated no Edit error regression (6.29% vs 6.86% baseline).
 * Killswitch pattern: GB can disable if issues surface externally.
 */
// isCompactLinePrefixEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCompactLinePrefixEnabled(): boolean {
  // 3P default: killswitch off = compact format enabled. Client-side only —
  // no server support needed, safe for Bedrock/Vertex/Foundry.
  // 返回 `!getFeatureValue_CACHED_MAY_BE_STALE(`，作为共享工具这次计算的结果。
  return !getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_compact_line_prefix_killswitch',
    false,
  )
}

/**
 * Adds cat -n style line numbers to the content.
 */
// addLineNumbers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addLineNumbers({
  content,
  // 1-indexed
  startLine,
}: {
  content: string
  startLine: number
}): string {
  // 文本内容缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!content) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // 文本行格式化`content.split`，供共享工具后续处理使用。
  const lines = content.split(/\r?\n/)

  // 满足 `isCompactLinePrefixEnabled()` 时，共享工具执行该分支。
  if (isCompactLinePrefixEnabled()) {
    // 返回 `lines`，作为共享工具这次计算的结果。
    return lines
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map((line, index) => `${index + startLine}\t${line}`)
      .join('\n')
  }

  // 返回 `lines`，作为共享工具这次计算的结果。
  return lines
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map((line, index) => {
      // numStr保存`String`，供共享工具后续处理使用。
      const numStr = String(index + startLine)
      // 满足 `numStr.length >= 6` 时，共享工具执行该分支。
      if (numStr.length >= 6) {
        // 返回 ``${numStr}→${line}``，作为共享工具这次计算的结果。
        return `${numStr}→${line}`
      }
      // 返回 ``${numStr.padStart(6, ' ')}→${line}``，作为共享工具这次计算的结果。
      return `${numStr.padStart(6, ' ')}→${line}`
    })
    .join('\n')
}

/**
 * Inverse of addLineNumbers — strips the `N→` or `N\t` prefix from a single
 * line. Co-located so format changes here and in addLineNumbers stay in sync.
 */
// stripLineNumberPrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripLineNumberPrefix(line: string): string {
  // match匹配`line.match`，供共享工具后续处理使用。
  const match = line.match(/^\s*\d+[\u2192\t](.*)$/)
  // 返回 `match?.[1] ?? line`，作为共享工具这次计算的结果。
  return match?.[1] ?? line
}

/**
 * Checks if a directory is empty.
 * @param dirPath The path to the directory to check
 * @returns true if the directory is empty or does not exist, false otherwise
 */
// isDirEmpty 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDirEmpty(dirPath: string): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `getFsImplementation().isDirEmptySync(dirPath)`，作为共享工具这次计算的结果。
    return getFsImplementation().isDirEmptySync(dirPath)
  } catch (e) {
    // ENOENT: directory doesn't exist, consider it empty
    // Other errors (EPERM on macOS protected folders, etc.): assume not empty
    // 返回 `isENOENT(e)`，作为共享工具这次计算的结果。
    return isENOENT(e)
  }
}

/**
 * Reads a file with caching to avoid redundant I/O operations.
 * This is the preferred method for FileEditTool operations.
 */
// readFileSyncCached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function readFileSyncCached(filePath: string): string {
  // 从 `fileReadCache.readFile(filePath)` 解构 content，减少共享工具 file对同一对象的重复访问。
  const { content } = fileReadCache.readFile(filePath)
  // 返回 `content`，作为共享工具这次计算的结果。
  return content
}

/**
 * Writes to a file and flushes the file to disk
 * @param filePath The path to the file to write to
 * @param content The content to write to the file
 * @param options Options for writing the file, including encoding and mode
 * @deprecated Use `fs.promises.writeFile` with flush option instead for non-blocking writes.
 * Sync file writes block the event loop and cause performance issues.
 */
// writeFileSyncAndFlush_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function writeFileSyncAndFlush_DEPRECATED(
  filePath: string,
  content: string,
  options: { encoding: BufferEncoding; mode?: number } = { encoding: 'utf-8' },
): void {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // Check if the target file is a symlink to preserve it for all users
  // Note: We don't use safeResolvePath here because we need to manually handle
  // symlinks to ensure we write to the target while preserving the symlink itself
  // targetPath 路径数据保存`filePath`，供共享工具 file后续判断或输出使用。
  let targetPath = filePath
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Try to read the symlink - if successful, it's a symlink
    // linkTarget读取`fs.readlinkSync`，供共享工具后续处理使用。
    const linkTarget = fs.readlinkSync(filePath)
    // Resolve to absolute path
    // targetPath 路径数据更新为 `isAbsolute(linkTarget)`，确保共享工具后续读取最新状态。
    targetPath = isAbsolute(linkTarget)
      ? linkTarget
      : resolve(dirname(filePath), linkTarget)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Writing through symlink: ${filePath} -> ${targetPath}`)
  } catch {
    // ENOENT (doesn't exist) or EINVAL (not a symlink) — keep targetPath = filePath
  }

  // Try atomic write first
  // tempPath 路径数据记录时间`Date.now`，供共享工具后续处理使用。
  const tempPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`

  // Check if target file exists and get its permissions (single stat, reused in both atomic and fallback paths)
  // targetMode 先占位，稍后的条件分支会根据实际输入补齐它。
  let targetMode: number | undefined
  // targetExists 集合标记共享工具 file是否启用对应路径。
  let targetExists = false
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // targetMode更新为 `fs.statSync(targetPath).mode`，确保共享工具后续读取最新状态。
    targetMode = fs.statSync(targetPath).mode
    // targetExists 集合更新为 `true`，确保共享工具后续读取最新状态。
    targetExists = true
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Preserving file permissions: ${targetMode.toString(8)}`)
  } catch (e) {
    // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
    if (!isENOENT(e)) throw e
    // `options.mode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (options.mode !== undefined) {
      // Use provided mode for new files
      // targetMode更新为 `options.mode`，确保共享工具后续读取最新状态。
      targetMode = options.mode
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Setting permissions for new file: ${targetMode.toString(8)}`,
      )
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Writing to temp file: ${tempPath}`)

    // Write to temp file with flush and mode (if specified for new file)
    // writeOptions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const writeOptions: {
      encoding: BufferEncoding
      flush: boolean
      mode?: number
    } = {
      encoding: options.encoding,
      flush: true,
    }
    // Only set mode in writeFileSync for new files to ensure atomic permission setting
    // `!targetExists && options.mode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (!targetExists && options.mode !== undefined) {
      // mode更新为 `options.mode`，确保共享工具后续读取最新状态。
      writeOptions.mode = options.mode
    }

    // 调用 fsWriteFileSync，触发共享工具此处需要的副作用。
    fsWriteFileSync(tempPath, content, writeOptions)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Temp file written successfully, size: ${content.length} bytes`,
    )

    // For existing files or if mode was not set atomically, apply permissions
    // `targetExists && targetMode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (targetExists && targetMode !== undefined) {
      // 调用 chmodSync，触发共享工具此处需要的副作用。
      chmodSync(tempPath, targetMode)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Applied original permissions to temp file`)
    }

    // Atomic rename (on POSIX systems, this is atomic)
    // On Windows, this will overwrite the destination if it exists
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Renaming ${tempPath} to ${targetPath}`)
    // 调用 fs.renameSync，触发共享工具此处需要的副作用。
    fs.renameSync(tempPath, targetPath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`File ${targetPath} written atomically`)
  } catch (atomicError) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to write file atomically: ${atomicError}`, {
      level: 'error',
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_atomic_write_error', {})

    // Clean up temp file on error
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Cleaning up temp file: ${tempPath}`)
      // 调用 fs.unlinkSync，触发共享工具此处需要的副作用。
      fs.unlinkSync(tempPath)
    } catch (cleanupError) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to clean up temp file: ${cleanupError}`)
    }

    // Fallback to non-atomic write
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Falling back to non-atomic write for ${targetPath}`)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // fallbackOptions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      const fallbackOptions: {
        encoding: BufferEncoding
        flush: boolean
        mode?: number
      } = {
        encoding: options.encoding,
        flush: true,
      }
      // Only set mode for new files
      // `!targetExists && options.mode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (!targetExists && options.mode !== undefined) {
        // mode更新为 `options.mode`，确保共享工具后续读取最新状态。
        fallbackOptions.mode = options.mode
      }

      // 调用 fsWriteFileSync，触发共享工具此处需要的副作用。
      fsWriteFileSync(targetPath, content, fallbackOptions)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `File ${targetPath} written successfully with non-atomic fallback`,
      )
    } catch (fallbackError) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Non-atomic write also failed: ${fallbackError}`)
      // 抛出 fallbackError，阻止共享工具在无效状态下继续运行。
      throw fallbackError
    }
  }
}

// getDesktopPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDesktopPath(): string {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // homeDir保存`homedir`，供共享工具后续处理使用。
  const homeDir = homedir()

  // 当 `platform` 匹配 `'macos'` 时，共享工具执行对应分支。
  if (platform === 'macos') {
    // 返回 `join(homeDir, 'Desktop')`，作为共享工具这次计算的结果。
    return join(homeDir, 'Desktop')
  }

  // 当 `platform` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (platform === 'windows') {
    // For WSL, try to access Windows desktop
    // windowsHome 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const windowsHome = process.env.USERPROFILE
      ? process.env.USERPROFILE.replace(/\\/g, '/')
      : null

    // 满足 `windowsHome` 时，共享工具执行该分支。
    if (windowsHome) {
      // wslPath 路径数据格式化`windowsHome.replace`，供共享工具后续处理使用。
      const wslPath = windowsHome.replace(/^[A-Z]:/, '')
      // desktopPath 路径数据固定为 ``/mnt/c${wslPath}/Desktop``，作为共享工具 file后续展示或比较的基准。
      const desktopPath = `/mnt/c${wslPath}/Desktop`

      // 满足 `getFsImplementation().existsSync(desktopPath)` 时，共享工具执行该分支。
      if (getFsImplementation().existsSync(desktopPath)) {
        // 返回 `desktopPath`，作为共享工具这次计算的结果。
        return desktopPath
      }
    }

    // Fallback: try to find desktop in typical Windows user location
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // usersDir保存`'/mnt/c/Users'`，作为后续固定文本处理的输入。
      const usersDir = '/mnt/c/Users'
      // userDirs 集合读取`getFsImplementation`，供共享工具后续处理使用。
      const userDirs = getFsImplementation().readdirSync(usersDir)

      // 按顺序遍历 `userDirs` 中的user，逐个交给共享工具处理。
      for (const user of userDirs) {
        // 共享工具在这里按实际状态进入对应分支。
        if (
          user.name === 'Public' ||
          user.name === 'Default' ||
          user.name === 'Default User' ||
          user.name === 'All Users'
        ) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }

        // potentialDesktopPath 路径数据格式化`join`，供共享工具后续处理使用。
        const potentialDesktopPath = join(usersDir, user.name, 'Desktop')

        // 满足 `getFsImplementation().existsSync(potentialDesktopPath)` 时，共享工具执行该分支。
        if (getFsImplementation().existsSync(potentialDesktopPath)) {
          // 返回 `potentialDesktopPath`，作为共享工具这次计算的结果。
          return potentialDesktopPath
        }
      }
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // Linux/unknown platform fallback
  // desktopPath 路径数据格式化`join`，供共享工具后续处理使用。
  const desktopPath = join(homeDir, 'Desktop')
  // 满足 `getFsImplementation().existsSync(desktopPath)` 时，共享工具执行该分支。
  if (getFsImplementation().existsSync(desktopPath)) {
    // 返回 `desktopPath`，作为共享工具这次计算的结果。
    return desktopPath
  }

  // If Desktop folder doesn't exist, fallback to home directory
  // 返回 `homeDir`，作为共享工具这次计算的结果。
  return homeDir
}

/**
 * Validates that a file size is within the specified limit.
 * Returns true if the file is within the limit, false otherwise.
 *
 * @param filePath The path to the file to validate
 * @param maxSizeBytes The maximum allowed file size in bytes
 * @returns true if file size is within limit, false otherwise
 */
// isFileWithinReadSizeLimit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFileWithinReadSizeLimit(
  filePath: string,
  maxSizeBytes: number = MAX_OUTPUT_SIZE,
): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const stats = getFsImplementation().statSync(filePath)
    // 返回 `stats.size <= maxSizeBytes`，作为共享工具这次计算的结果。
    return stats.size <= maxSizeBytes
  } catch {
    // If we can't stat the file, return false to indicate validation failure
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Normalize a file path for comparison, handling platform differences.
 * On Windows, normalizes path separators and converts to lowercase for
 * case-insensitive comparison.
 */
// normalizePathForComparison 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizePathForComparison(filePath: string): string {
  // Use path.normalize() to clean up redundant separators and resolve . and ..
  // normalized保存`normalize`，供共享工具后续处理使用。
  let normalized = normalize(filePath)

  // On Windows, normalize for case-insensitive comparison:
  // - Convert forward slashes to backslashes (path.normalize only does this on actual Windows)
  // - Convert to lowercase (Windows paths are case-insensitive)
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // normalized更新为 `normalized.replace(/\//g, '\\').toLowerCase()`，确保共享工具后续读取最新状态。
    normalized = normalized.replace(/\//g, '\\').toLowerCase()
  }

  // 返回 `normalized`，作为共享工具这次计算的结果。
  return normalized
}

/**
 * Compare two file paths for equality, handling Windows case-insensitivity.
 */
// pathsEqual 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pathsEqual(path1: string, path2: string): boolean {
  // 返回 `normalizePathForComparison(path1) === normalizePathForComparison(path2)`，作为共享工具这次计算的结果。
  return normalizePathForComparison(path1) === normalizePathForComparison(path2)
}
