// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  Base64ImageSource,
  ContentBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile, stat } from 'fs/promises'
// 引入 getOriginalCwd，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from 'src/bootstrap/state.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 类型依赖 { ToolPermissionContext } 来自 src/Tool.js，用于校准工具调用的数据契约。
import type { ToolPermissionContext } from 'src/Tool.js'
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js'
// 复用 pathInAllowedWorkingPath 工具函数，把通用处理留在 src/utils/permissions/filesystem.js 中维护。
import { pathInAllowedWorkingPath } from 'src/utils/permissions/filesystem.js'
// 复用 setCwd 工具函数，把通用处理留在 src/utils/Shell.js 中维护。
import { setCwd } from 'src/utils/Shell.js'
// 复用 shouldMaintainProjectWorkingDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { shouldMaintainProjectWorkingDir } from '../../utils/envUtils.js'
// 复用 maybeResizeAndDownsampleImageBuffer 工具函数，把通用处理留在 ../../utils/imageResizer.js 中维护。
import { maybeResizeAndDownsampleImageBuffer } from '../../utils/imageResizer.js'
// 复用 getMaxOutputLength 工具函数，把通用处理留在 ../../utils/shell/outputLimits.js 中维护。
import { getMaxOutputLength } from '../../utils/shell/outputLimits.js'
// 复用 countCharInString、plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { countCharInString, plural } from '../../utils/stringUtils.js'
/**
 * Strips leading and trailing lines that contain only whitespace/newlines.
 * Unlike trim(), this preserves whitespace within content lines and only removes
 * completely empty lines from the beginning and end.
 */
// stripEmptyLines 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripEmptyLines(content: string): string {
  // 文本行格式化`content.split`，供工具调用后续处理使用。
  const lines = content.split('\n')

  // Find the first non-empty line
  // startIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
  let startIndex = 0
  // 只要 startIndex < lines.length && lines[startIndex]?.trim() === '' 成立，就持续推进工具调用中的循环处理。
  while (startIndex < lines.length && lines[startIndex]?.trim() === '') {
    // Bash 工具 utils在这里处理 `startIndex++`，完成这一小步状态转换。
    startIndex++
  }

  // Find the last non-empty line
  // endIndex 索引 命名 `lines.length - 1`，让后续代码直接表达这个值的用途。
  let endIndex = lines.length - 1
  // 只要 endIndex >= 0 && lines[endIndex]?.trim() === '' 成立，就持续推进工具调用中的循环处理。
  while (endIndex >= 0 && lines[endIndex]?.trim() === '') {
    // Bash 工具 utils在这里处理 `endIndex--`，完成这一小步状态转换。
    endIndex--
  }

  // If all lines are empty, return empty string
  // 满足 `startIndex > endIndex` 时，工具调用执行该分支。
  if (startIndex > endIndex) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // Return the slice with non-empty lines
  // 返回 `lines.slice(startIndex, endIndex + 1).join('\n')`，作为工具调用这次计算的结果。
  return lines.slice(startIndex, endIndex + 1).join('\n')
}

/**
 * Check if content is a base64 encoded image data URL
 */
// isImageOutput 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isImageOutput(content: string): boolean {
  // 返回 `/^data:image\/[a-z0-9.+_-]+;base64,/i.test(content)`，作为工具调用这次计算的结果。
  return /^data:image\/[a-z0-9.+_-]+;base64,/i.test(content)
}

// DATA_URI_RE 命名 `/^data:([^;]+);base64,(.+)$/`，让后续代码直接表达这个值的用途。
const DATA_URI_RE = /^data:([^;]+);base64,(.+)$/

/**
 * Parse a data-URI string into its media type and base64 payload.
 * Input is trimmed before matching.
 */
// parseDataUri 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseDataUri(
  s: string,
): { mediaType: string; data: string } | null {
  // match格式化`s.trim`，供工具调用后续处理使用。
  const match = s.trim().match(DATA_URI_RE)
  // 只有 `!match || !match[1] || !match[2]` 满足时，工具调用才执行该分支。
  if (!match || !match[1] || !match[2]) return null
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { mediaType: match[1], data: match[2] }
}

/**
 * Build an image tool_result block from shell stdout containing a data URI.
 * Returns null if parse fails so callers can fall through to text handling.
 */
// buildImageToolResult 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildImageToolResult(
  stdout: string,
  toolUseID: string,
): ToolResultBlockParam | null {
  // 解析结果解析`parseDataUri`，供工具调用后续处理使用。
  const parsed = parseDataUri(stdout)
  // 解析结果缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parsed) return null
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    tool_use_id: toolUseID,
    type: 'tool_result',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: parsed.mediaType as Base64ImageSource['media_type'],
          data: parsed.data,
        },
      },
    ],
  }
}

// Cap file reads to 20 MB — any image data URI larger than this is
// well beyond what the API accepts (5 MB base64) and would OOM if read
// into memory.
// MAX_IMAGE_FILE_SIZE 文件数据保存`20 * 1024 * 1024`，供后续判断或组装使用。
const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024

/**
 * Resize image output from a shell tool. stdout is capped at
 * getMaxOutputLength() when read back from the shell output file — if the
 * full output spilled to disk, re-read it from there, since truncated base64
 * would decode to a corrupt image that either throws here or gets rejected by
 * the API. Caps dimensions too: compressImageBuffer only checks byte size, so
 * a small-but-high-DPI PNG (e.g. matplotlib at dpi=300) sails through at full
 * resolution and poisons many-image requests (CC-304).
 *
 * Returns the re-encoded data URI on success, or null if the source didn't
 * parse as a data URI (caller decides whether to flip isImage).
 */
// resizeShellImageOutput 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resizeShellImageOutput(
  stdout: string,
  outputFilePath: string | undefined,
  outputFileSize: number | undefined,
): Promise<string | null> {
  // source保存`stdout`，供Bash 工具 utils后续判断或输出使用。
  let source = stdout
  // 满足 `outputFilePath` 时，工具调用执行该分支。
  if (outputFilePath) {
    // size保存`stat`，供工具调用后续处理使用。
    const size = outputFileSize ?? (await stat(outputFilePath)).size
    // 满足 `size > MAX_IMAGE_FILE_SIZE` 时，工具调用执行该分支。
    if (size > MAX_IMAGE_FILE_SIZE) return null
    // source更新为 `await readFile(outputFilePath, 'utf8')`，确保Bash 工具后续读取最新状态。
    source = await readFile(outputFilePath, 'utf8')
  }
  // 解析结果解析`parseDataUri`，供工具调用后续处理使用。
  const parsed = parseDataUri(source)
  // 解析结果缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parsed) return null
  // buf保存`Buffer.from`，供工具调用后续处理使用。
  const buf = Buffer.from(parsed.data, 'base64')
  // ext格式化`mediaType.split`，供工具调用后续处理使用。
  const ext = parsed.mediaType.split('/')[1] || 'png'
  // resized统计`maybeResizeAndDownsampleImageBuffer`，供工具调用后续处理使用。
  const resized = await maybeResizeAndDownsampleImageBuffer(
    buf,
    buf.length,
    ext,
  )
  // 返回 ``data:image/${resized.mediaType};base64,${resized.buffer.toString('base...`，作为工具调用这次计算的结果。
  return `data:image/${resized.mediaType};base64,${resized.buffer.toString('base64')}`
}

// formatOutput 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatOutput(content: string): {
  totalLines: number
  truncatedContent: string
  isImage?: boolean
} {
  // isImage记录 `isImageOutput` 是否成立，工具调用随后按该结果分支。
  const isImage = isImageOutput(content)
  // 满足 `isImage` 时，工具调用执行该分支。
  if (isImage) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      totalLines: 1,
      truncatedContent: content,
      isImage,
    }
  }

  // maxOutputLength 数量读取`getMaxOutputLength`，供工具调用后续处理使用。
  const maxOutputLength = getMaxOutputLength()
  // 满足 `content.length <= maxOutputLength` 时，工具调用执行该分支。
  if (content.length <= maxOutputLength) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      totalLines: countCharInString(content, '\n') + 1,
      truncatedContent: content,
      isImage,
    }
  }

  // truncatedPart格式化`content.slice`，供工具调用后续处理使用。
  const truncatedPart = content.slice(0, maxOutputLength)
  // remainingLines 集合统计`countCharInString`，供工具调用后续处理使用。
  const remainingLines = countCharInString(content, '\n', maxOutputLength) + 1
  // truncated读取 ``${truncatedPart}\n\n... [${remainingLines} lines truncat...` 对应条目，后续围绕该成员继续处理。
  const truncated = `${truncatedPart}\n\n... [${remainingLines} lines truncated] ...`

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    totalLines: countCharInString(content, '\n') + 1,
    truncatedContent: truncated,
    isImage,
  }
}

// stdErrAppendShellResetMessage 消息数据封装成回调，供Bash 工具 utils在事件触发或异步步骤中调用。
export const stdErrAppendShellResetMessage = (stderr: string): string =>
  `${stderr.trim()}\nShell cwd was reset to ${getOriginalCwd()}`

// resetCwdIfOutsideProject 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetCwdIfOutsideProject(
  toolPermissionContext: ToolPermissionContext,
): boolean {
  // cwd读取`getCwd`，供工具调用后续处理使用。
  const cwd = getCwd()
  // originalCwd读取`getOriginalCwd`，供工具调用后续处理使用。
  const originalCwd = getOriginalCwd()
  // shouldMaintain记录 `shouldMaintainProjectWorkingDir` 是否成立，工具调用随后按该结果分支。
  const shouldMaintain = shouldMaintainProjectWorkingDir()
  // 工具调用在这里按实际状态进入对应分支。
  if (
    shouldMaintain ||
    // Fast path: originalCwd is unconditionally in allWorkingDirectories
    // (filesystem.ts), so when cwd hasn't moved, pathInAllowedWorkingPath is
    // trivially true — skip its syscalls for the no-cd common case.
    (cwd !== originalCwd &&
      !pathInAllowedWorkingPath(cwd, toolPermissionContext))
  ) {
    // Reset to original directory if maintaining project dir OR outside allowed working directory
    // setCwd 写入新的状态值，使工具调用后续读取保持一致。
    setCwd(originalCwd)
    // shouldMaintain缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!shouldMaintain) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bash_tool_reset_to_original_dir', {})
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Creates a human-readable summary of structured content blocks.
 * Used to display MCP results with images and text in the UI.
 */
// createContentSummary 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createContentSummary(content: ContentBlockParam[]): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // textCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let textCount = 0
  // imageCount 数量保存`0`，供后续判断或组装使用。
  let imageCount = 0

  // 按顺序遍历 `content` 中的block，逐个交给工具调用处理。
  for (const block of content) {
    // 当 `block.type` 匹配 `'image'` 时，工具调用执行对应分支。
    if (block.type === 'image') {
      // Bash 工具 utils在这里处理 `imageCount++`，完成这一小步状态转换。
      imageCount++
    // Bash 工具 utils在这里处理 `} else if (block.type === 'text' && 'text' in block) {`，完成这一小步状态转换。
    } else if (block.type === 'text' && 'text' in block) {
      // Bash 工具 utils在这里处理 `textCount++`，完成这一小步状态转换。
      textCount++
      // Include first 200 chars of text blocks for context
      // preview格式化`text.slice`，供工具调用后续处理使用。
      const preview = block.text.slice(0, 200)
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(preview + (block.text.length > 200 ? '...' : ''))
    }
  }

  // summary 从空数组开始收集，后续循环会按处理顺序追加条目。
  const summary: string[] = []
  // 满足 `imageCount > 0` 时，工具调用执行该分支。
  if (imageCount > 0) {
    // summary追加新条目，保持收集顺序与输入顺序一致。
    summary.push(`[${imageCount} ${plural(imageCount, 'image')}]`)
  }
  // 满足 `textCount > 0` 时，工具调用执行该分支。
  if (textCount > 0) {
    // summary追加新条目，保持收集顺序与输入顺序一致。
    summary.push(`[${textCount} text ${plural(textCount, 'block')}]`)
  }

  // 返回 ``MCP Result: ${summary.join(', ')}${parts.length > 0 ? '\n\n' + parts.j...`，作为工具调用这次计算的结果。
  return `MCP Result: ${summary.join(', ')}${parts.length > 0 ? '\n\n' + parts.join('\n\n') : ''}`
}
