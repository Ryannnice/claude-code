// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 复用 expandPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath } from '../../utils/path.js'

// MAX_READ_BYTES 集合保存`64 * 1024`，供后续判断或组装使用。
const MAX_READ_BYTES = 64 * 1024

/**
 * Extracts the symbol/word at a specific position in a file.
 * Used to show context in tool use messages.
 *
 * @param filePath - The file path (absolute or relative)
 * @param line - 0-indexed line number
 * @param character - 0-indexed character position on the line
 *
 * Note: This uses synchronous file I/O because it is called from
 * renderToolUseMessage (a synchronous React render function). The read is
 * wrapped in try/catch so ENOENT and other errors fall back gracefully.
 * @returns The symbol at that position, or null if extraction fails
 */
// getSymbolAtPosition 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSymbolAtPosition(
  filePath: string,
  line: number,
  character: number,
): string | null {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // fs 集合读取`getFsImplementation`，供工具调用后续处理使用。
    const fs = getFsImplementation()
    // absolutePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const absolutePath = expandPath(filePath)

    // Read only the first 64KB instead of the whole file. Most LSP hover/goto
    // targets are near recent edits; 64KB covers ~1000 lines of typical code.
    // If the target line is past this window we fall back to null (the UI
    // already handles that by showing `position: line:char`).
    // eslint-disable-next-line custom-rules/no-sync-fs -- called from sync React render (renderToolUseMessage)
    // 从 `fs.readSync(absolutePath, {` 解构 buffer、bytesRead，减少工具实现 symbol Context对同一对象的重复访问。
    const { buffer, bytesRead } = fs.readSync(absolutePath, {
      length: MAX_READ_BYTES,
    })
    // 文本内容格式化`buffer.toString`，供工具调用后续处理使用。
    const content = buffer.toString('utf-8', 0, bytesRead)
    // 文本行格式化`content.split`，供工具调用后续处理使用。
    const lines = content.split('\n')

    // 只有 `line < 0 || line >= lines.length` 满足时，工具调用才执行该分支。
    if (line < 0 || line >= lines.length) {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }
    // If we filled the full buffer the file continues past our window,
    // so the last split element may be truncated mid-line.
    // 只有 `bytesRead === MAX_READ_BYTES && line === lines.le` 满足时，工具调用才执行该分支。
    if (bytesRead === MAX_READ_BYTES && line === lines.length - 1) {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }

    // lineContent 命名 `lines[line]`，让后续代码直接表达这个值的用途。
    const lineContent = lines[line]
    // 只有 `!lineContent || character < 0 || character >= lin` 满足时，工具调用才执行该分支。
    if (!lineContent || character < 0 || character >= lineContent.length) {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }

    // Extract the word/symbol at the character position
    // Pattern matches:
    // - Standard identifiers: alphanumeric + underscore + dollar
    // - Rust lifetimes: 'a, 'static
    // - Rust macros: macro_name!
    // - Operators and special symbols: +, -, *, etc.
    // This is more inclusive to handle various programming languages
    // symbolPattern读取 `/[\w$'!]+|[+\-*/%&|^~<>=]+/g` 对应条目，后续围绕该成员继续处理。
    const symbolPattern = /[\w$'!]+|[+\-*/%&|^~<>=]+/g
    // match先声明占位，稍后的分支会根据实际输入补齐。
    let match: RegExpExecArray | null

    // 只要 (match = symbolPattern.exec(lineContent)) !== null 成立，就持续推进工具调用中的循环处理。
    while ((match = symbolPattern.exec(lineContent)) !== null) {
      // start保存`match.index`，供工具实现 symbol Context后续步骤使用。
      const start = match.index
      // end统计`start + match[0].length`，供工具实现 symbol Context后续步骤使用。
      const end = start + match[0].length

      // Check if the character position falls within this match
      // 只有 `character >= start && character < end` 满足时，工具调用才执行该分支。
      if (character >= start && character < end) {
        // symbol保存`match[0]`，供工具实现 symbol Context后续步骤使用。
        const symbol = match[0]
        // Limit length to 30 characters to avoid overly long symbols
        // 返回 truncate(symbol, 30)，把工具调用这个分支的结果交还调用方。
        return truncate(symbol, 30)
      }
    }

    // 返回 null，把工具调用这个分支的结果交还调用方。
    return null
  } catch (error) {
    // Log unexpected errors for debugging (permission issues, encoding problems, etc.)
    // Use logForDebugging since this is a display enhancement, not a critical error
    // 满足 `error instanceof Error` 时，工具调用执行该分支。
    if (error instanceof Error) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Symbol extraction failed for ${filePath}:${line}:${character}: ${error.message}`,
        { level: 'warn' },
      )
    }
    // Still return null for graceful fallback to position display
    // 返回 null，把工具调用这个分支的结果交还调用方。
    return null
  }
}
