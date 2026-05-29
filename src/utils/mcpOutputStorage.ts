// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 类型依赖 { MCPResultType } 来自 ../services/mcp/client.js，用于校准共享工具的数据契约。
import type { MCPResultType } from '../services/mcp/client.js'
// 引入 toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from './errors.js'
// 引入 formatFileSize，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatFileSize } from './format.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 ensureToolResultsDir、getToolResultsDir，将 ./toolResultStorage.js 中已经封装好的能力接到本文件流程里。
import { ensureToolResultsDir, getToolResultsDir } from './toolResultStorage.js'

/**
 * Generates a format description string based on the MCP result type and schema.
 */
// getFormatDescription 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFormatDescription(
  type: MCPResultType,
  schema?: unknown,
): string {
  // 按照 type 的取值选择共享工具的具体处理分支。
  switch (type) {
    case 'toolResult':
      // 返回 `'Plain text'`，作为共享工具这次计算的结果。
      return 'Plain text'
    case 'structuredContent':
      // 返回 `schema ? `JSON with schema: ${schema}` : 'JSON'`，作为共享工具这次计算的结果。
      return schema ? `JSON with schema: ${schema}` : 'JSON'
    case 'contentArray':
      // 返回 `schema ? `JSON array with schema: ${schema}` : 'JSON array'`，作为共享工具这次计算的结果。
      return schema ? `JSON array with schema: ${schema}` : 'JSON array'
  }
}

/**
 * Generates instruction text for Claude to read from a saved output file.
 *
 * @param rawOutputPath - Path to the saved output file
 * @param contentLength - Length of the content in characters
 * @param formatDescription - Description of the content format
 * @param maxReadLength - Optional max chars for Read tool (for Bash output context)
 * @returns Instruction text to include in the tool result
 */
// getLargeOutputInstructions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLargeOutputInstructions(
  rawOutputPath: string,
  contentLength: number,
  formatDescription: string,
  maxReadLength?: number,
): string {
  // baseInstructions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseInstructions =
    `Error: result (${contentLength.toLocaleString()} characters) exceeds maximum allowed tokens. Output has been saved to ${rawOutputPath}.\n` +
    `Format: ${formatDescription}\n` +
    `Use offset and limit parameters to read specific portions of the file, search within it for specific content, and jq to make structured queries.\n` +
    `REQUIREMENTS FOR SUMMARIZATION/ANALYSIS/REVIEW:\n` +
    `- You MUST read the content from the file at ${rawOutputPath} in sequential chunks until 100% of the content has been read.\n`

  // truncationWarning 警告信息保存`maxReadLength`，供共享工具 mcp Output Storage后续判断或输出使用。
  const truncationWarning = maxReadLength
    ? `- If you receive truncation warnings when reading the file ("[N lines truncated]"), reduce the chunk size until you have read 100% of the content without truncation ***DO NOT PROCEED UNTIL YOU HAVE DONE THIS***. Bash output is limited to ${maxReadLength.toLocaleString()} chars.\n`
    : `- If you receive truncation warnings when reading the file, reduce the chunk size until you have read 100% of the content without truncation.\n`

  // completionRequirement固定为 ``- Before producing ANY summary or analysis, you MUST exp...`，作为共享工具 mcp Output Storage后续展示或比较的基准。
  const completionRequirement = `- Before producing ANY summary or analysis, you MUST explicitly describe what portion of the content you have read. ***If you did not read the entire content, you MUST explicitly state this.***\n`

  // 返回 `baseInstructions + truncationWarning + completionRequirement`，作为共享工具这次计算的结果。
  return baseInstructions + truncationWarning + completionRequirement
}

/**
 * Map a mime type to a file extension. Conservative: known types get their
 * proper extension; unknown types get 'bin'. The extension matters because
 * the Read tool dispatches on it (PDFs, images, etc. need the right ext).
 */
// extensionForMimeType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extensionForMimeType(mimeType: string | undefined): string {
  // mimeType缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!mimeType) return 'bin'
  // Strip any charset/boundary parameter
  // mt格式化`mimeType.split`，供共享工具后续处理使用。
  const mt = (mimeType.split(';')[0] ?? '').trim().toLowerCase()
  // 按照 mt 的取值选择共享工具的具体处理分支。
  switch (mt) {
    case 'application/pdf':
      // 返回 `'pdf'`，作为共享工具这次计算的结果。
      return 'pdf'
    case 'application/json':
      // 返回 `'json'`，作为共享工具这次计算的结果。
      return 'json'
    case 'text/csv':
      // 返回 `'csv'`，作为共享工具这次计算的结果。
      return 'csv'
    case 'text/plain':
      // 返回 `'txt'`，作为共享工具这次计算的结果。
      return 'txt'
    case 'text/html':
      // 返回 `'html'`，作为共享工具这次计算的结果。
      return 'html'
    case 'text/markdown':
      // 返回 `'md'`，作为共享工具这次计算的结果。
      return 'md'
    case 'application/zip':
      // 返回 `'zip'`，作为共享工具这次计算的结果。
      return 'zip'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // 返回 `'docx'`，作为共享工具这次计算的结果。
      return 'docx'
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      // 返回 `'xlsx'`，作为共享工具这次计算的结果。
      return 'xlsx'
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      // 返回 `'pptx'`，作为共享工具这次计算的结果。
      return 'pptx'
    case 'application/msword':
      // 返回 `'doc'`，作为共享工具这次计算的结果。
      return 'doc'
    case 'application/vnd.ms-excel':
      // 返回 `'xls'`，作为共享工具这次计算的结果。
      return 'xls'
    case 'audio/mpeg':
      // 返回 `'mp3'`，作为共享工具这次计算的结果。
      return 'mp3'
    case 'audio/wav':
      // 返回 `'wav'`，作为共享工具这次计算的结果。
      return 'wav'
    case 'audio/ogg':
      // 返回 `'ogg'`，作为共享工具这次计算的结果。
      return 'ogg'
    case 'video/mp4':
      // 返回 `'mp4'`，作为共享工具这次计算的结果。
      return 'mp4'
    case 'video/webm':
      // 返回 `'webm'`，作为共享工具这次计算的结果。
      return 'webm'
    case 'image/png':
      // 返回 `'png'`，作为共享工具这次计算的结果。
      return 'png'
    case 'image/jpeg':
      // 返回 `'jpg'`，作为共享工具这次计算的结果。
      return 'jpg'
    case 'image/gif':
      // 返回 `'gif'`，作为共享工具这次计算的结果。
      return 'gif'
    case 'image/webp':
      // 返回 `'webp'`，作为共享工具这次计算的结果。
      return 'webp'
    case 'image/svg+xml':
      // 返回 `'svg'`，作为共享工具这次计算的结果。
      return 'svg'
    default:
      // 返回 `'bin'`，作为共享工具这次计算的结果。
      return 'bin'
  }
}

/**
 * Heuristic for whether a content-type header indicates binary content that
 * should be saved to disk rather than put into the model context.
 * Text-ish types (text/*, json, xml, form data) are treated as non-binary.
 */
// isBinaryContentType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBinaryContentType(contentType: string): boolean {
  // contentType缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!contentType) return false
  // mt格式化`contentType.split`，供共享工具后续处理使用。
  const mt = (contentType.split(';')[0] ?? '').trim().toLowerCase()
  // 满足 `mt.startsWith('text/')` 时，共享工具执行该分支。
  if (mt.startsWith('text/')) return false
  // Structured text formats delivered with an application/ type. Use suffix
  // or exact match rather than substring so 'openxmlformats' (docx/xlsx) stays binary.
  // 当 `mt.endsWith('+json') || mt` 匹配 `'application/json'` 时，共享工具执行对应分支。
  if (mt.endsWith('+json') || mt === 'application/json') return false
  // 当 `mt.endsWith('+xml') || mt` 匹配 `'application/xml'` 时，共享工具执行对应分支。
  if (mt.endsWith('+xml') || mt === 'application/xml') return false
  // 满足 `mt.startsWith('application/javascript')` 时，共享工具执行该分支。
  if (mt.startsWith('application/javascript')) return false
  // 当 `mt` 匹配 `'application/x-www-form-url...` 时，共享工具执行对应分支。
  if (mt === 'application/x-www-form-urlencoded') return false
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// PersistBinaryResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PersistBinaryResult =
  | { filepath: string; size: number; ext: string }
  | { error: string }

/**
 * Write raw binary bytes to the tool-results directory with a mime-derived
 * extension. Unlike persistToolResult (which stringifies), this writes the
 * bytes as-is so the resulting file can be opened with native tools (Read
 * for PDFs, pandas for xlsx, etc.).
 */
// persistBinaryContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function persistBinaryContent(
  bytes: Buffer,
  mimeType: string | undefined,
  persistId: string,
): Promise<PersistBinaryResult> {
  // 等待 `ensureToolResultsDir()` 完成，再继续共享工具 mcp Output Storage的异步流程。
  await ensureToolResultsDir()
  // ext保存`extensionForMimeType`，供共享工具后续处理使用。
  const ext = extensionForMimeType(mimeType)
  // filepath 路径数据格式化`join`，供共享工具后续处理使用。
  const filepath = join(getToolResultsDir(), `${persistId}.${ext}`)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(filepath, bytes)` 完成，再继续共享工具 mcp Output Storage的异步流程。
    await writeFile(filepath, bytes)
  } catch (error) {
    // err保存`toError`，供共享工具后续处理使用。
    const err = toError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { error: err.message }
  }

  // mime type and extension are safe fixed-vocabulary strings (not paths/code)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_binary_content_persisted', {
    mimeType: (mimeType ??
      'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    sizeBytes: bytes.length,
    ext: ext as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { filepath, size: bytes.length, ext }
}

/**
 * Build a short message telling Claude where binary content was saved.
 * Just states the path — no prescriptive hint, since what the model can
 * actually do with the file depends on provider/tooling.
 */
// getBinaryBlobSavedMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBinaryBlobSavedMessage(
  filepath: string,
  mimeType: string | undefined,
  size: number,
  sourceDescription: string,
): string {
  // mt标记共享工具 mcp Output Storage是否启用对应路径。
  const mt = mimeType || 'unknown type'
  // 返回 ``${sourceDescription}Binary content (${mt}, ${formatFileSize(size)}) sa...`，作为共享工具这次计算的结果。
  return `${sourceDescription}Binary content (${mt}, ${formatFileSize(size)}) saved to ${filepath}`
}
