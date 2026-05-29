/**
 * Binary file extensions to skip for text-based operations.
 * These files can't be meaningfully compared as text and are often large.
 */
// BINARY_EXTENSIONS 集合保存`Set`，供files后续处理使用。
export const BINARY_EXTENSIONS = new Set([
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.webp',
  '.tiff',
  '.tif',
  // Videos
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.wmv',
  '.flv',
  '.m4v',
  '.mpeg',
  '.mpg',
  // Audio
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.aac',
  '.m4a',
  '.wma',
  '.aiff',
  '.opus',
  // Archives
  '.zip',
  '.tar',
  '.gz',
  '.bz2',
  '.7z',
  '.rar',
  '.xz',
  '.z',
  '.tgz',
  '.iso',
  // Executables/binaries
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.o',
  '.a',
  '.obj',
  '.lib',
  '.app',
  '.msi',
  '.deb',
  '.rpm',
  // Documents (PDF is here; FileReadTool excludes it at the call site)
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  // Fonts
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.eot',
  // Bytecode / VM artifacts
  '.pyc',
  '.pyo',
  '.class',
  '.jar',
  '.war',
  '.ear',
  '.node',
  '.wasm',
  '.rlib',
  // Database files
  '.sqlite',
  '.sqlite3',
  '.db',
  '.mdb',
  '.idx',
  // Design / 3D
  '.psd',
  '.ai',
  '.eps',
  '.sketch',
  '.fig',
  '.xd',
  '.blend',
  '.3ds',
  '.max',
  // Flash
  '.swf',
  '.fla',
  // Lock/profiling data
  '.lockb',
  '.dat',
  '.data',
])

/**
 * Check if a file path has a binary extension.
 */
// hasBinaryExtension 封装files的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasBinaryExtension(filePath: string): boolean {
  // ext格式化`filePath.slice`，供files后续处理使用。
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
  // 返回 `BINARY_EXTENSIONS.has(ext)`，作为files这次计算的结果。
  return BINARY_EXTENSIONS.has(ext)
}

/**
 * Number of bytes to read for binary content detection.
 */
// BINARY_CHECK_SIZE 命名 `8192`，让后续代码直接表达这个值的用途。
const BINARY_CHECK_SIZE = 8192

/**
 * Check if a buffer contains binary content by looking for null bytes
 * or a high proportion of non-printable characters.
 */
// isBinaryContent 封装files的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBinaryContent(buffer: Buffer): boolean {
  // Check first BINARY_CHECK_SIZE bytes (or full buffer if smaller)
  // checkSize保存`Math.min`，供files后续处理使用。
  const checkSize = Math.min(buffer.length, BINARY_CHECK_SIZE)

  // nonPrintable保存`0`，供后续判断或组装使用。
  let nonPrintable = 0
  // 按索引扫描 `checkSize`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < checkSize; i++) {
    // byte保存`buffer[i]!`，供files后续判断或输出使用。
    const byte = buffer[i]!
    // Null byte is a strong indicator of binary
    // 满足 `byte === 0` 时，files执行该分支。
    if (byte === 0) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Count non-printable, non-whitespace bytes
    // Printable ASCII is 32-126, plus common whitespace (9, 10, 13)
    // files在这里进入条件判断，后续代码按实际状态分流。
    if (
      byte < 32 &&
      byte !== 9 && // tab
      byte !== 10 && // newline
      byte !== 13 // carriage return
    ) {
      // files在这里处理 `nonPrintable++`，完成这一小步状态转换。
      nonPrintable++
    }
  }

  // If more than 10% non-printable, likely binary
  // 返回 `nonPrintable / checkSize > 0.1`，作为files这次计算的结果。
  return nonPrintable / checkSize > 0.1
}
