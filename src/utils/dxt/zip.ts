// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, normalize } from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isENOENT，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 containsPathTraversal，将 ../path.js 中已经封装好的能力接到本文件流程里。
import { containsPathTraversal } from '../path.js'

// LIMITS 集合集中保存共享工具 zip要一起传递的字段。
const LIMITS = {
  MAX_FILE_SIZE: 512 * 1024 * 1024, // 512MB per file
  MAX_TOTAL_SIZE: 1024 * 1024 * 1024, // 1024MB total uncompressed
  MAX_FILE_COUNT: 100000, // Maximum number of files
  MAX_COMPRESSION_RATIO: 50, // Anything above 50:1 is suspicious
  MIN_COMPRESSION_RATIO: 0.5, // Below 0.5:1 might indicate already compressed malicious content
}

/**
 * State tracker for zip file validation during extraction
 */
// ZipValidationState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ZipValidationState = {
  fileCount: number
  totalUncompressedSize: number
  compressedSize: number
  errors: string[]
}

/**
 * File metadata from fflate filter
 */
// ZipFileMetadata 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ZipFileMetadata = {
  name: string
  originalSize?: number
}

/**
 * Result of validating a single file in a zip archive
 */
// FileValidationResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type FileValidationResult = {
  isValid: boolean
  error?: string
}

/**
 * Validates a file path to prevent path traversal attacks
 */
// isPathSafe 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPathSafe(filePath: string): boolean {
  // 满足 `containsPathTraversal(filePath)` 时，共享工具执行该分支。
  if (containsPathTraversal(filePath)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Normalize the path to resolve any '.' segments
  // normalized保存`normalize`，供共享工具后续处理使用。
  const normalized = normalize(filePath)

  // Check for absolute paths (we only want relative paths in archives)
  // 满足 `isAbsolute(normalized)` 时，共享工具执行该分支。
  if (isAbsolute(normalized)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Validates a single file during zip extraction
 */
// validateZipFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateZipFile(
  file: ZipFileMetadata,
  state: ZipValidationState,
): FileValidationResult {
  // 共享工具 zip在这里处理 `state.fileCount++`，完成这一小步状态转换。
  state.fileCount++

  // 错误 先占位，稍后的条件分支会根据实际输入补齐它。
  let error: string | undefined

  // Check file count
  // 满足 `state.fileCount > LIMITS.MAX_FILE_COUNT` 时，共享工具执行该分支。
  if (state.fileCount > LIMITS.MAX_FILE_COUNT) {
    // 错误更新为 ``Archive contains too many files: ${state.fileCount} (max...`，确保共享工具后续读取最新状态。
    error = `Archive contains too many files: ${state.fileCount} (max: ${LIMITS.MAX_FILE_COUNT})`
  }

  // Validate path safety
  // 满足 `!isPathSafe(file.name)` 时，共享工具执行该分支。
  if (!isPathSafe(file.name)) {
    // 错误更新为 ``Unsafe file path detected: "${file.name}". Path traversa...`，确保共享工具后续读取最新状态。
    error = `Unsafe file path detected: "${file.name}". Path traversal or absolute paths are not allowed.`
  }

  // Check individual file size
  // fileSize 文件数据标记共享工具 zip是否启用对应路径。
  const fileSize = file.originalSize || 0
  // 满足 `fileSize > LIMITS.MAX_FILE_SIZE` 时，共享工具执行该分支。
  if (fileSize > LIMITS.MAX_FILE_SIZE) {
    // 错误更新为 ``File "${file.name}" is too large: ${Math.round(fileSize ...`，确保共享工具后续读取最新状态。
    error = `File "${file.name}" is too large: ${Math.round(fileSize / 1024 / 1024)}MB (max: ${Math.round(LIMITS.MAX_FILE_SIZE / 1024 / 1024)}MB)`
  }

  // Track total uncompressed size
  // 共享工具 zip在这里处理 `state.totalUncompressedSize += fileSize`，完成这一小步状态转换。
  state.totalUncompressedSize += fileSize

  // Check total size
  // 满足 `state.totalUncompressedSize > LIMITS.MAX_TOTAL_SI` 时，共享工具执行该分支。
  if (state.totalUncompressedSize > LIMITS.MAX_TOTAL_SIZE) {
    // 错误更新为 ``Archive total size is too large: ${Math.round(state.tota...`，确保共享工具后续读取最新状态。
    error = `Archive total size is too large: ${Math.round(state.totalUncompressedSize / 1024 / 1024)}MB (max: ${Math.round(LIMITS.MAX_TOTAL_SIZE / 1024 / 1024)}MB)`
  }

  // Check compression ratio for zip bomb detection
  // currentRatio保存`state.totalUncompressedSize / state.compressedSize`，供后续判断或组装使用。
  const currentRatio = state.totalUncompressedSize / state.compressedSize
  // 满足 `currentRatio > LIMITS.MAX_COMPRESSION_RATIO` 时，共享工具执行该分支。
  if (currentRatio > LIMITS.MAX_COMPRESSION_RATIO) {
    // 错误更新为 ``Suspicious compression ratio detected: ${currentRatio.to...`，确保共享工具后续读取最新状态。
    error = `Suspicious compression ratio detected: ${currentRatio.toFixed(1)}:1 (max: ${LIMITS.MAX_COMPRESSION_RATIO}:1). This may be a zip bomb.`
  }

  // 返回 `error ? { isValid: false, error } : { isValid: true }`，作为共享工具这次计算的结果。
  return error ? { isValid: false, error } : { isValid: true }
}

/**
 * Unzips data from a Buffer and returns its contents as a record of file paths to Uint8Array data.
 * Uses unzipSync to avoid fflate worker termination crashes in bun.
 * Accepts raw zip bytes so that the caller can read the file asynchronously.
 *
 * fflate is lazy-imported to avoid its ~196KB of top-level lookup tables (revfd
 * Int32Array(32769), rev Uint16Array(32768), etc.) being allocated at startup
 * when this module is reached via the plugin loader chain.
 */
// unzipFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function unzipFile(
  zipData: Buffer,
): Promise<Record<string, Uint8Array>> {
  // 从 `await import('fflate')` 解构 unzipSync，减少共享工具 zip对同一对象的重复访问。
  const { unzipSync } = await import('fflate')
  // compressedSize保存 `zipData.length` 的判断结果，供共享工具 zip后续分支直接复用。
  const compressedSize = zipData.length

  // 状态 集中保存共享工具 zip要一起传递的字段。
  const state: ZipValidationState = {
    fileCount: 0,
    totalUncompressedSize: 0,
    compressedSize: compressedSize,
    errors: [],
  }

  // 结果保存`unzipSync`，供共享工具后续处理使用。
  const result = unzipSync(new Uint8Array(zipData), {
    // 这个回调绑定到 filter: file => {，负责共享工具在该局部场景下的响应。
    filter: file => {
      // validationResult读取`validateZipFile`，供共享工具后续处理使用。
      const validationResult = validateZipFile(file, state)
      // validationResult.isValid缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!validationResult.isValid) {
        // 抛出 new Error(validationResult.error!)，阻止共享工具在无效状态下继续运行。
        throw new Error(validationResult.error!)
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    },
  })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Zip extraction completed: ${state.fileCount} files, ${Math.round(state.totalUncompressedSize / 1024)}KB uncompressed`,
  )

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Parse Unix file modes from a zip's central directory.
 *
 * fflate's `unzipSync` returns only `Record<string, Uint8Array>` — it does not
 * surface the external file attributes stored in the central directory. This
 * means executable bits are lost during extraction (everything becomes 0644).
 * The git-clone path preserves +x natively, but the GCS/zip path needs this
 * helper to keep parity.
 *
 * Returns `name → mode` for entries created on a Unix host (`versionMadeBy`
 * high byte === 3). Entries from other hosts, or with no mode bits set, are
 * omitted. Callers should treat a missing key as "use default mode".
 *
 * Format per PKZIP APPNOTE.TXT §4.3.12 (central directory) and §4.3.16 (EOCD).
 * ZIP64 is not handled — returns `{}` on archives >4GB or >65535 entries,
 * which is fine for marketplace zips (~3.5MB) and MCPB bundles.
 */
// parseZipModes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseZipModes(data: Uint8Array): Record<string, number> {
  // Buffer view for readUInt* methods — shares memory, no copy.
  // buf保存`Buffer.from`，供共享工具后续处理使用。
  const buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  // modes 集合 从空对象开始收集键值，后续按名称补齐内容。
  const modes: Record<string, number> = {}

  // 1. Find the End of Central Directory record (sig 0x06054b50). It lives in
  //    the trailing 22 + 65535 bytes (fixed EOCD size + max comment length).
  //    Scan backwards — the EOCD is typically the last 22 bytes.
  // minEocd保存`Math.max`，供共享工具后续处理使用。
  const minEocd = Math.max(0, buf.length - 22 - 0xffff)
  // eocd 命名 `-1`，让后续代码直接表达这个值的用途。
  let eocd = -1
  // 循环处理 `let i = buf.length - 22; i >= minEocd; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = buf.length - 22; i >= minEocd; i--) {
    // 满足 `buf.readUInt32LE(i) === 0x06054b50` 时，共享工具执行该分支。
    if (buf.readUInt32LE(i) === 0x06054b50) {
      // eocd更新为 `i`，确保共享工具后续读取最新状态。
      eocd = i
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 满足 `eocd < 0` 时，共享工具执行该分支。
  if (eocd < 0) return modes // malformed — let fflate's error surface elsewhere

  // entryCount 数量读取`buf.readUInt16LE`，供共享工具后续处理使用。
  const entryCount = buf.readUInt16LE(eocd + 10)
  // off读取`buf.readUInt32LE`，供共享工具后续处理使用。
  let off = buf.readUInt32LE(eocd + 16) // central directory start offset

  // 2. Walk central directory entries (sig 0x02014b50). Each entry has a
  //    46-byte fixed header followed by variable-length name/extra/comment.
  // 按索引扫描 `entryCount`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < entryCount; i++) {
    // `off + 46 > buf.length || buf.readUInt32LE(o...` 与 `0x02014b50` 不一致时刷新派生状态，避免使用过期结果。
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) break
    // versionMadeBy读取`buf.readUInt16LE`，供共享工具后续处理使用。
    const versionMadeBy = buf.readUInt16LE(off + 4)
    // nameLen读取`buf.readUInt16LE`，供共享工具后续处理使用。
    const nameLen = buf.readUInt16LE(off + 28)
    // extraLen读取`buf.readUInt16LE`，供共享工具后续处理使用。
    const extraLen = buf.readUInt16LE(off + 30)
    // commentLen读取`buf.readUInt16LE`，供共享工具后续处理使用。
    const commentLen = buf.readUInt16LE(off + 32)
    // externalAttr读取`buf.readUInt32LE`，供共享工具后续处理使用。
    const externalAttr = buf.readUInt32LE(off + 38)
    // 名称格式化`buf.toString`，供共享工具后续处理使用。
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen)

    // versionMadeBy high byte = host OS. 3 = Unix. For Unix zips, the high
    // 16 bits of externalAttr hold st_mode (file type + permission bits).
    // 满足 `versionMadeBy >> 8 === 3` 时，共享工具执行该分支。
    if (versionMadeBy >> 8 === 3) {
      // mode保存`(externalAttr >>> 16) & 0xffff`，供后续判断或组装使用。
      const mode = (externalAttr >>> 16) & 0xffff
      // 满足 `mode` 时，共享工具执行该分支。
      if (mode) modes[name] = mode
    }

    // 共享工具 zip在这里处理 `off += 46 + nameLen + extraLen + commentLen`，完成这一小步状态转换。
    off += 46 + nameLen + extraLen + commentLen
  }

  // 返回 `modes`，作为共享工具这次计算的结果。
  return modes
}

/**
 * Reads a zip file from disk asynchronously and unzips it.
 * Returns its contents as a record of file paths to Uint8Array data.
 */
// readAndUnzipFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readAndUnzipFile(
  filePath: string,
): Promise<Record<string, Uint8Array>> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // zipData读取`fs.readFileBytes`，供共享工具后续处理使用。
    const zipData = await fs.readFileBytes(filePath)
    // await is required here: without it, rejections from the now-async
    // unzipFile() escape the try/catch and bypass the error wrapping below.
    // 等待并返回 `unzipFile(zipData)`，调用方直接接收异步结果。
    return await unzipFile(zipData)
  } catch (error) {
    // 满足 `isENOENT(error)` 时，共享工具执行该分支。
    if (isENOENT(error)) {
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }
    // errorMessage 消息数据保存`String`，供共享工具后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // 抛出 new Error(`Failed to read or unzip file: ${errorMessage}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Failed to read or unzip file: ${errorMessage}`)
  }
}
