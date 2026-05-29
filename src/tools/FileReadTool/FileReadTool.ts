// 类型依赖 { Base64ImageSource } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { Base64ImageSource } from '@anthropic-ai/sdk/resources/index.mjs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, readFile as readFileAsync } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { posix, win32 } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  PDF_AT_MENTION_INLINE_THRESHOLD,
  PDF_EXTRACT_SIZE_THRESHOLD,
  PDF_MAX_PAGES_PER_READ,
} from '../../constants/apiLimits.js'
// 引入 hasBinaryExtension，将 ../../constants/files.js 中已经封装好的能力接到本文件流程里。
import { hasBinaryExtension } from '../../constants/files.js'
// 引入 memoryFreshnessNote，将 ../../memdir/memoryAge.js 中已经封装好的能力接到本文件流程里。
import { memoryFreshnessNote } from '../../memdir/memoryAge.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  getFileExtensionForAnalytics,
} from '../../services/analytics/metadata.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  countTokensWithAPI,
  roughTokenCountEstimationForFileType,
} from '../../services/tokenEstimation.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  activateConditionalSkillsForPaths,
  addSkillDirectories,
  discoverSkillDirsForPaths,
} from '../../skills/loadSkillsDir.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 getClaudeConfigHomeDir、isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir, isEnvTruthy } from '../../utils/envUtils.js'
// 复用 getErrnoCode、isENOENT 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode, isENOENT } from '../../utils/errors.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  addLineNumbers,
  FILE_NOT_FOUND_CWD_NOTE,
  findSimilarFile,
  getFileModificationTimeAsync,
  suggestPathUnderCwd,
} from '../../utils/file.js'
// 复用 logFileOperation 工具函数，把通用处理留在 ../../utils/fileOperationAnalytics.js 中维护。
import { logFileOperation } from '../../utils/fileOperationAnalytics.js'
// 复用 formatFileSize 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatFileSize } from '../../utils/format.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  compressImageBufferWithTokenLimit,
  createImageMetadataText,
  detectImageFormatFromBuffer,
  type ImageDimensions,
  ImageResizeError,
  maybeResizeAndDownsampleImageBuffer,
} from '../../utils/imageResizer.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 isAutoMemFile 工具函数，把通用处理留在 ../../utils/memoryFileDetection.js 中维护。
import { isAutoMemFile } from '../../utils/memoryFileDetection.js'
// 复用 createUserMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { createUserMessage } from '../../utils/messages.js'
// 复用 getCanonicalName、getMainLoopModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getCanonicalName, getMainLoopModel } from '../../utils/model/model.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  mapNotebookCellsToToolResult,
  readNotebook,
} from '../../utils/notebook.js'
// 复用 expandPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath } from '../../utils/path.js'
// 复用 extractPDFPages、getPDFPageCount、readPDF 工具函数，把通用处理留在 ../../utils/pdf.js 中维护。
import { extractPDFPages, getPDFPageCount, readPDF } from '../../utils/pdf.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isPDFExtension,
  isPDFSupported,
  parsePDFPageRange,
} from '../../utils/pdfUtils.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  checkReadPermissionForTool,
  matchingRuleForInput,
} from '../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 复用 matchWildcardPattern 工具函数，把通用处理留在 ../../utils/permissions/shellRuleMatching.js 中维护。
import { matchWildcardPattern } from '../../utils/permissions/shellRuleMatching.js'
// 复用 readFileInRange 工具函数，把通用处理留在 ../../utils/readFileInRange.js 中维护。
import { readFileInRange } from '../../utils/readFileInRange.js'
// 复用 semanticNumber 工具函数，把通用处理留在 ../../utils/semanticNumber.js 中维护。
import { semanticNumber } from '../../utils/semanticNumber.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 BASH_TOOL_NAME，将 ../BashTool/toolName.js 中已经封装好的能力接到本文件流程里。
import { BASH_TOOL_NAME } from '../BashTool/toolName.js'
// 引入 getDefaultFileReadingLimits，将 ./limits.js 中已经封装好的能力接到本文件流程里。
import { getDefaultFileReadingLimits } from './limits.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  DESCRIPTION,
  FILE_READ_TOOL_NAME,
  FILE_UNCHANGED_STUB,
  LINE_FORMAT_INSTRUCTION,
  OFFSET_INSTRUCTION_DEFAULT,
  OFFSET_INSTRUCTION_TARGETED,
  renderPromptTemplate,
} from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
  renderToolUseTag,
  userFacingName,
} from './UI.js'

// Device files that would hang the process: infinite output or blocking input.
// Checked by path only (no I/O). Safe devices like /dev/null are intentionally omitted.
// BLOCKED_DEVICE_PATHS 路径数据保存`Set`，供工具调用后续处理使用。
const BLOCKED_DEVICE_PATHS = new Set([
  // Infinite output — never reach EOF
  '/dev/zero',
  '/dev/random',
  '/dev/urandom',
  '/dev/full',
  // Blocks waiting for input
  '/dev/stdin',
  '/dev/tty',
  '/dev/console',
  // Nonsensical to read
  '/dev/stdout',
  '/dev/stderr',
  // fd aliases for stdin/stdout/stderr
  '/dev/fd/0',
  '/dev/fd/1',
  '/dev/fd/2',
])

// isBlockedDevicePath 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBlockedDevicePath(filePath: string): boolean {
  // 满足 `BLOCKED_DEVICE_PATHS.has(filePath)` 时，工具调用执行该分支。
  if (BLOCKED_DEVICE_PATHS.has(filePath)) return true
  // /proc/self/fd/0-2 and /proc/<pid>/fd/0-2 are Linux aliases for stdio
  // 工具调用在这里按实际状态进入对应分支。
  if (
    filePath.startsWith('/proc/') &&
    (filePath.endsWith('/fd/0') ||
      filePath.endsWith('/fd/1') ||
      filePath.endsWith('/fd/2'))
  )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// Narrow no-break space (U+202F) used by some macOS versions in screenshot filenames
// THIN_SPACE保存`String.fromCharCode`，供工具调用后续处理使用。
const THIN_SPACE = String.fromCharCode(8239)

/**
 * Resolves macOS screenshot paths that may have different space characters.
 * macOS uses either regular space or thin space (U+202F) before AM/PM in screenshot
 * filenames depending on the macOS version. This function tries the alternate space
 * character if the file doesn't exist with the given path.
 *
 * @param filePath - The normalized file path to resolve
 * @returns The path to the actual file on disk (may differ in space character)
 */
/**
 * For macOS screenshot paths with AM/PM, the space before AM/PM may be a
 * regular space or a thin space depending on the macOS version.  Returns
 * the alternate path to try if the original doesn't exist, or undefined.
 */
// getAlternateScreenshotPath 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAlternateScreenshotPath(filePath: string): string | undefined {
  // 文件名保存`path.basename`，供工具调用后续处理使用。
  const filename = path.basename(filePath)
  // amPmPattern 命名 `/^(.+)([ \u202F])(AM|PM)(\.png)$/`，让后续代码直接表达这个值的用途。
  const amPmPattern = /^(.+)([ \u202F])(AM|PM)(\.png)$/
  // match匹配`filename.match`，供工具调用后续处理使用。
  const match = filename.match(amPmPattern)
  // match缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!match) return undefined

  // currentSpace保存`match[2]`，供工具实现 File Read Tool后续判断或输出使用。
  const currentSpace = match[2]
  // alternateSpace标记工具实现 File Read Tool是否启用对应路径。
  const alternateSpace = currentSpace === ' ' ? THIN_SPACE : ' '
  // 返回 `filePath.replace(`，作为工具调用这次计算的结果。
  return filePath.replace(
    `${currentSpace}${match[3]}${match[4]}`,
    `${alternateSpace}${match[3]}${match[4]}`,
  )
}

// File read listeners - allows other services to be notified when files are read
// FileReadListener 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type FileReadListener = (filePath: string, content: string) => void
// fileReadListeners 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
const fileReadListeners: FileReadListener[] = []

// registerFileReadListener 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerFileReadListener(
  listener: FileReadListener,
): () => void {
  // fileReadListeners 文件数据追加新条目，保持收集顺序与输入顺序一致。
  fileReadListeners.push(listener)
  // 返回 `() => {`，作为工具调用这次计算的结果。
  return () => {
    // i保存`fileReadListeners.indexOf`，供工具调用后续处理使用。
    const i = fileReadListeners.indexOf(listener)
    // 满足 `i >= 0) fileReadListeners.splice(i, 1` 时，工具调用执行该分支。
    if (i >= 0) fileReadListeners.splice(i, 1)
  }
}

// MaxFileReadTokenExceededError 聚合工具调用相关状态与操作，把同一职责的行为收束到类实例中。
export class MaxFileReadTokenExceededError extends Error {
  constructor(
    public tokenCount: number,
    public maxTokens: number,
  ) {
    // 调用 super，触发工具调用此处需要的副作用。
    super(
      `File content (${tokenCount} tokens) exceeds maximum allowed tokens (${maxTokens}). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.`,
    )
    // 更新实例字段 name 为 'MaxFileReadTokenExceededError'，同步工具调用的内部状态。
    this.name = 'MaxFileReadTokenExceededError'
  }
}

// Common image extensions
// IMAGE_EXTENSIONS 集合保存`Set`，供工具调用后续处理使用。
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

/**
 * Detects if a file path is a session-related file for analytics logging.
 * Only matches files within the Claude config directory (e.g., ~/.claude).
 * Returns the type of session file or null if not a session file.
 */
// detectSessionFileType 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectSessionFileType(
  filePath: string,
): 'session_memory' | 'session_transcript' | null {
  // configDir 配置读取`getClaudeConfigHomeDir`，供工具调用后续处理使用。
  const configDir = getClaudeConfigHomeDir()

  // Only match files within the Claude config directory
  // 满足 `!filePath.startsWith(configDir)` 时，工具调用执行该分支。
  if (!filePath.startsWith(configDir)) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }

  // Normalize path to use forward slashes for consistent matching across platforms
  // normalizedPath 路径数据格式化`filePath.split`，供工具调用后续处理使用。
  const normalizedPath = filePath.split(win32.sep).join(posix.sep)

  // Session memory files: ~/.claude/session-memory/*.md (including summary.md)
  // 工具调用在这里按实际状态进入对应分支。
  if (
    normalizedPath.includes('/session-memory/') &&
    normalizedPath.endsWith('.md')
  ) {
    // 返回 `'session_memory'`，作为工具调用这次计算的结果。
    return 'session_memory'
  }

  // Session JSONL transcript files: ~/.claude/projects/*/*.jsonl
  // 工具调用在这里按实际状态进入对应分支。
  if (
    normalizedPath.includes('/projects/') &&
    normalizedPath.endsWith('.jsonl')
  ) {
    // 返回 `'session_transcript'`，作为工具调用这次计算的结果。
    return 'session_transcript'
  }

  // 返回 `null`，作为工具调用这次计算的结果。
  return null
}

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    file_path: z.string().describe('The absolute path to the file to read'),
    offset: semanticNumber(z.number().int().nonnegative().optional()).describe(
      'The line number to start reading from. Only provide if the file is too large to read at once',
    ),
    limit: semanticNumber(z.number().int().positive().optional()).describe(
      'The number of lines to read. Only provide if the file is too large to read at once.',
    ),
    pages: z
      .string()
      .optional()
      .describe(
        `Page range for PDF files (e.g., "1-5", "3", "10-20"). Only applicable to PDF files. Maximum ${PDF_MAX_PAGES_PER_READ} pages per request.`,
      ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<InputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() => {
  // Define the media types supported for images
  // imageMediaTypes 集合保存`z.enum`，供工具调用后续处理使用。
  const imageMediaTypes = z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ])

  // 返回 `z.discriminatedUnion('type', [`，作为工具调用这次计算的结果。
  return z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text'),
      file: z.object({
        filePath: z.string().describe('The path to the file that was read'),
        content: z.string().describe('The content of the file'),
        numLines: z
          .number()
          .describe('Number of lines in the returned content'),
        startLine: z.number().describe('The starting line number'),
        totalLines: z.number().describe('Total number of lines in the file'),
      }),
    }),
    z.object({
      type: z.literal('image'),
      file: z.object({
        base64: z.string().describe('Base64-encoded image data'),
        type: imageMediaTypes.describe('The MIME type of the image'),
        originalSize: z.number().describe('Original file size in bytes'),
        dimensions: z
          .object({
            originalWidth: z
              .number()
              .optional()
              .describe('Original image width in pixels'),
            originalHeight: z
              .number()
              .optional()
              .describe('Original image height in pixels'),
            displayWidth: z
              .number()
              .optional()
              .describe('Displayed image width in pixels (after resizing)'),
            displayHeight: z
              .number()
              .optional()
              .describe('Displayed image height in pixels (after resizing)'),
          })
          .optional()
          .describe('Image dimension info for coordinate mapping'),
      }),
    }),
    z.object({
      type: z.literal('notebook'),
      file: z.object({
        filePath: z.string().describe('The path to the notebook file'),
        cells: z.array(z.any()).describe('Array of notebook cells'),
      }),
    }),
    z.object({
      type: z.literal('pdf'),
      file: z.object({
        filePath: z.string().describe('The path to the PDF file'),
        base64: z.string().describe('Base64-encoded PDF data'),
        originalSize: z.number().describe('Original file size in bytes'),
      }),
    }),
    z.object({
      type: z.literal('parts'),
      file: z.object({
        filePath: z.string().describe('The path to the PDF file'),
        originalSize: z.number().describe('Original file size in bytes'),
        count: z.number().describe('Number of pages extracted'),
        outputDir: z
          .string()
          .describe('Directory containing extracted page images'),
      }),
    }),
    z.object({
      type: z.literal('file_unchanged'),
      file: z.object({
        filePath: z.string().describe('The path to the file'),
      }),
    }),
  ])
})
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// FileReadTool 文件数据构建`buildTool`，供工具调用后续处理使用。
export const FileReadTool = buildTool({
  name: FILE_READ_TOOL_NAME,
  searchHint: 'read files, images, PDFs, notebooks',
  // Output is bounded by maxTokens (validateContentTokens). Persisting to a
  // file the model reads back with Read is circular — never persist.
  maxResultSizeChars: Infinity,
  strict: true,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // limits 集合读取`getDefaultFileReadingLimits`，供工具调用后续处理使用。
    const limits = getDefaultFileReadingLimits()
    // maxSizeInstruction保存`limits.includeMaxSizeInPrompt`，供后续判断或组装使用。
    const maxSizeInstruction = limits.includeMaxSizeInPrompt
      ? `. Files larger than ${formatFileSize(limits.maxSizeBytes)} will return an error; use offset and limit for larger files`
      : ''
    // offsetInstruction读取`limits.targetedRangeNudge` 整理出中间结果，供工具实现 File Read Tool后续步骤使用。
    const offsetInstruction = limits.targetedRangeNudge
      ? OFFSET_INSTRUCTION_TARGETED
      : OFFSET_INSTRUCTION_DEFAULT
    // 返回 `renderPromptTemplate(`，作为工具调用这次计算的结果。
    return renderPromptTemplate(
      pickLineFormatInstruction(),
      maxSizeInstruction,
      offsetInstruction,
    )
  },
  // 工具实现 File Read Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 File Read Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  userFacingName,
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Reading ${summary}` : 'Reading file'`，作为工具调用这次计算的结果。
    return summary ? `Reading ${summary}` : 'Reading file'
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.file_path`，作为工具调用这次计算的结果。
    return input.file_path
  },
  // isSearchOrReadCommand 用 无 判断工具调用是否满足条件。
  isSearchOrReadCommand() {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { isSearch: false, isRead: true }
  },
  // getPath 根据 { file_path } 读取或计算工具调用需要的结果。
  getPath({ file_path }): string {
    // 返回 `file_path || getCwd()`，作为工具调用这次计算的结果。
    return file_path || getCwd()
  },
  // backfillObservableInput 使用 input 完成工具调用里的对应操作。
  backfillObservableInput(input) {
    // hooks.mdx documents file_path as absolute; expand so hook allowlists
    // can't be bypassed via ~ or relative paths.
    // 当 `typeof input.file_path` 匹配 `'string'` 时，工具调用执行对应分支。
    if (typeof input.file_path === 'string') {
      // file_path 路径数据更新为 `expandPath(input.file_path)`，确保工具调用后续读取最新状态。
      input.file_path = expandPath(input.file_path)
    }
  },
  // preparePermissionMatcher 使用 { file_path } 完成工具调用里的对应操作。
  async preparePermissionMatcher({ file_path }) {
    // 返回 `pattern => matchWildcardPattern(pattern, file_path)`，作为工具调用这次计算的结果。
    return pattern => matchWildcardPattern(pattern, file_path)
  },
  // checkPermissions 使用 input, context 完成工具调用里的对应操作。
  async checkPermissions(input, context): Promise<PermissionDecision> {
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // 返回 `checkReadPermissionForTool(`，作为工具调用这次计算的结果。
    return checkReadPermissionForTool(
      FileReadTool,
      input,
      appState.toolPermissionContext,
    )
  },
  renderToolUseMessage,
  renderToolUseTag,
  renderToolResultMessage,
  // UI.tsx:140 — ALL types render summary chrome only: "Read N lines",
  // "Read image (42KB)". Never the content itself. The model-facing
  // serialization (below) sends content + CYBER_RISK_MITIGATION_REMINDER
  // + line prefixes; UI shows none of it. Nothing to index. Caught by
  // the render-fidelity test when this initially claimed file.content.
  // extractSearchText 使用 无 完成工具调用里的对应操作。
  extractSearchText() {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },
  renderToolUseErrorMessage,
  // validateInput 使用 { file_path, pages }, toolUseContext: ToolUseCont… 完成工具调用里的对应操作。
  async validateInput({ file_path, pages }, toolUseContext: ToolUseContext) {
    // Validate pages parameter (pure string parsing, no I/O)
    // `pages` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (pages !== undefined) {
      // 解析结果解析`parsePDFPageRange`，供工具调用后续处理使用。
      const parsed = parsePDFPageRange(pages)
      // 解析结果缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!parsed) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Invalid pages parameter: "${pages}". Use formats like "1-5", "3", or "10-20". Pages are 1-indexed.`,
          errorCode: 7,
        }
      }
      // rangeSize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const rangeSize =
        parsed.lastPage === Infinity
          ? PDF_MAX_PAGES_PER_READ + 1
          : parsed.lastPage - parsed.firstPage + 1
      // 满足 `rangeSize > PDF_MAX_PAGES_PER_READ` 时，工具调用执行该分支。
      if (rangeSize > PDF_MAX_PAGES_PER_READ) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Page range "${pages}" exceeds maximum of ${PDF_MAX_PAGES_PER_READ} pages per request. Please use a smaller range.`,
          errorCode: 8,
        }
      }
    }

    // Path expansion + deny rule check (no I/O)
    // fullFilePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullFilePath = expandPath(file_path)

    // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
    const appState = toolUseContext.getAppState()
    // denyRule保存`matchingRuleForInput`，供工具调用后续处理使用。
    const denyRule = matchingRuleForInput(
      fullFilePath,
      appState.toolPermissionContext,
      'read',
      'deny',
    )
    // `denyRule` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (denyRule !== null) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'File is in a directory that is denied by your permission settings.',
        errorCode: 1,
      }
    }

    // SECURITY: UNC path check (no I/O) — defer filesystem operations
    // until after user grants permission to prevent NTLM credential leaks
    // isUncPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isUncPath =
      fullFilePath.startsWith('\\\\') || fullFilePath.startsWith('//')
    // 满足 `isUncPath` 时，工具调用执行该分支。
    if (isUncPath) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: true }
    }

    // Binary extension check (string check on extension only, no I/O).
    // PDF, images, and SVG are excluded - this tool renders them natively.
    // ext保存`path.extname`，供工具调用后续处理使用。
    const ext = path.extname(fullFilePath).toLowerCase()
    // 工具调用在这里按实际状态进入对应分支。
    if (
      hasBinaryExtension(fullFilePath) &&
      !isPDFExtension(ext) &&
      !IMAGE_EXTENSIONS.has(ext.slice(1))
    ) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `This tool cannot read binary files. The file appears to be a binary ${ext} file. Please use appropriate tools for binary file analysis.`,
        errorCode: 4,
      }
    }

    // Block specific device files that would hang (infinite output or blocking input).
    // This is a path-based check with no I/O — safe special files like /dev/null are allowed.
    // 满足 `isBlockedDevicePath(fullFilePath)` 时，工具调用执行该分支。
    if (isBlockedDevicePath(fullFilePath)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Cannot read '${file_path}': this device file would block or produce infinite output.`,
        errorCode: 9,
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // 工具实现 File Read Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    { file_path, offset = 1, limit = undefined, pages },
    context,
    _canUseTool?,
    parentMessage?,
  ) {
    // 从 `context` 解构 readFileState、fileReadingLimits，减少工具实现 File Read Tool对同一对象的重复访问。
    const { readFileState, fileReadingLimits } = context

    // defaults 集合读取`getDefaultFileReadingLimits`，供工具调用后续处理使用。
    const defaults = getDefaultFileReadingLimits()
    // maxSizeBytes 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const maxSizeBytes =
      fileReadingLimits?.maxSizeBytes ?? defaults.maxSizeBytes
    // maxTokens 集合 命名 `fileReadingLimits?.maxTokens ?? defaults.maxTokens`，让后续代码直接表达这个值的用途。
    const maxTokens = fileReadingLimits?.maxTokens ?? defaults.maxTokens

    // Telemetry: track when callers override default read limits.
    // Only fires on override (low volume) — event count = override frequency.
    // `fileReadingLimits` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (fileReadingLimits !== undefined) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_read_limits_override', {
        hasMaxTokens: fileReadingLimits.maxTokens !== undefined,
        hasMaxSizeBytes: fileReadingLimits.maxSizeBytes !== undefined,
      })
    }

    // ext保存`path.extname`，供工具调用后续处理使用。
    const ext = path.extname(file_path).toLowerCase().slice(1)
    // Use expandPath for consistent path normalization with FileEditTool/FileWriteTool
    // (especially handles whitespace trimming and Windows path separators)
    // fullFilePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullFilePath = expandPath(file_path)

    // Dedup: if we've already read this exact range and the file hasn't
    // changed on disk, return a stub instead of re-sending the full content.
    // The earlier Read tool_result is still in context — two full copies
    // waste cache_creation tokens on every subsequent turn. BQ proxy shows
    // ~18% of Read calls are same-file collisions (up to 2.64% of fleet
    // cache_creation). Only applies to text/notebook reads — images/PDFs
    // aren't cached in readFileState so won't match here.
    //
    // Ant soak: 1,734 dedup hits in 2h, no Read error regression.
    // Killswitch pattern: GB can disable if the stub message confuses
    // the model externally.
    // 3P default: killswitch off = dedup enabled. Client-side only — no
    // server support needed, safe for Bedrock/Vertex/Foundry.
    // dedupKillswitch读取`getFeatureValue_CACHED_MAY_BE_STALE`，供工具调用后续处理使用。
    const dedupKillswitch = getFeatureValue_CACHED_MAY_BE_STALE(
      'tengu_read_dedup_killswitch',
      false,
    )
    // existingState 状态保存`dedupKillswitch`，供工具实现 File Read Tool后续判断或输出使用。
    const existingState = dedupKillswitch
      ? undefined
      : readFileState.get(fullFilePath)
    // Only dedup entries that came from a prior Read (offset is always set
    // by Read). Edit/Write store offset=undefined — their readFileState
    // entry reflects post-edit mtime, so deduping against it would wrongly
    // point the model at the pre-edit Read content.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      existingState &&
      !existingState.isPartialView &&
      existingState.offset !== undefined
    ) {
      // rangeMatch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const rangeMatch =
        existingState.offset === offset && existingState.limit === limit
      // 满足 `rangeMatch` 时，工具调用执行该分支。
      if (rangeMatch) {
        // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
        try {
          // mtimeMs 集合读取`getFileModificationTimeAsync`，供工具调用后续处理使用。
          const mtimeMs = await getFileModificationTimeAsync(fullFilePath)
          // 满足 `mtimeMs === existingState.timestamp` 时，工具调用执行该分支。
          if (mtimeMs === existingState.timestamp) {
            // analyticsExt读取`getFileExtensionForAnalytics`，供工具调用后续处理使用。
            const analyticsExt = getFileExtensionForAnalytics(fullFilePath)
            // 记录工具调用运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_file_read_dedup', {
              ...(analyticsExt !== undefined && { ext: analyticsExt }),
            })
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              data: {
                type: 'file_unchanged' as const,
                file: { filePath: file_path },
              },
            }
          }
        } catch {
          // stat failed — fall through to full read
        }
      }
    }

    // Discover skills from this file's path (fire-and-forget, non-blocking)
    // Skip in simple mode - no skills available
    // cwd读取`getCwd`，供工具调用后续处理使用。
    const cwd = getCwd()
    // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)` 时，工具调用执行该分支。
    if (!isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
      // newSkillDirs 集合保存`discoverSkillDirsForPaths`，供工具调用后续处理使用。
      const newSkillDirs = await discoverSkillDirsForPaths([fullFilePath], cwd)
      // 满足 `newSkillDirs.length > 0` 时，工具调用执行该分支。
      if (newSkillDirs.length > 0) {
        // Store discovered dirs for attachment display
        // 按顺序遍历 `newSkillDirs` 中的dir，逐个交给工具调用处理。
        for (const dir of newSkillDirs) {
          // 调用 context.dynamicSkillDirTriggers?.add(dir)，完成这一处局部操作。
          context.dynamicSkillDirTriggers?.add(dir)
        }
        // Don't await - let skill loading happen in the background
        // 调用 addSkillDirectories，触发工具调用此处需要的副作用。
        addSkillDirectories(newSkillDirs).catch(() => {})
      }

      // Activate conditional skills whose path patterns match this file
      // 调用 activateConditionalSkillsForPaths，触发工具调用此处需要的副作用。
      activateConditionalSkillsForPaths([fullFilePath], cwd)
    }

    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `callInner(`，调用方直接接收异步结果。
      return await callInner(
        file_path,
        fullFilePath,
        fullFilePath,
        ext,
        offset,
        limit,
        pages,
        maxSizeBytes,
        maxTokens,
        readFileState,
        context,
        parentMessage?.message.id,
      )
    } catch (error) {
      // Handle file-not-found: suggest similar files
      // code读取`getErrnoCode`，供工具调用后续处理使用。
      const code = getErrnoCode(error)
      // 当 `code` 匹配 `'ENOENT'` 时，工具调用执行对应分支。
      if (code === 'ENOENT') {
        // macOS screenshots may use a thin space or regular space before
        // AM/PM — try the alternate before giving up.
        // altPath 路径数据读取`getAlternateScreenshotPath`，供工具调用后续处理使用。
        const altPath = getAlternateScreenshotPath(fullFilePath)
        // 满足 `altPath` 时，工具调用执行该分支。
        if (altPath) {
          // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
          try {
            // 等待并返回 `callInner(`，调用方直接接收异步结果。
            return await callInner(
              file_path,
              fullFilePath,
              altPath,
              ext,
              offset,
              limit,
              pages,
              maxSizeBytes,
              maxTokens,
              readFileState,
              context,
              parentMessage?.message.id,
            )
          } catch (altError) {
            // 满足 `!isENOENT(altError)` 时，工具调用执行该分支。
            if (!isENOENT(altError)) {
              // 抛出 altError，阻止工具调用在无效状态下继续运行。
              throw altError
            }
            // Alt path also missing — fall through to friendly error
          }
        }

        // similarFilename 文件数据筛选`findSimilarFile`，供工具调用后续处理使用。
        const similarFilename = findSimilarFile(fullFilePath)
        // cwdSuggestion保存`suggestPathUnderCwd`，供工具调用后续处理使用。
        const cwdSuggestion = await suggestPathUnderCwd(fullFilePath)
        // 消息读取`getCwd`，供工具调用后续处理使用。
        let message = `File does not exist. ${FILE_NOT_FOUND_CWD_NOTE} ${getCwd()}.`
        // 满足 `cwdSuggestion` 时，工具调用执行该分支。
        if (cwdSuggestion) {
          // 工具实现 File Read Tool在这里处理 `message += ` Did you mean ${cwdSuggestion}?``，完成这一小步状态转换。
          message += ` Did you mean ${cwdSuggestion}?`
        // 工具实现 File Read Tool在这里处理 `} else if (similarFilename) {`，完成这一小步状态转换。
        } else if (similarFilename) {
          // 工具实现 File Read Tool在这里处理 `message += ` Did you mean ${similarFilename}?``，完成这一小步状态转换。
          message += ` Did you mean ${similarFilename}?`
        }
        // 抛出 new Error(message)，阻止工具调用在无效状态下继续运行。
        throw new Error(message)
      }
      // 抛出 error，阻止工具调用在无效状态下继续运行。
      throw error
    }
  },
  // mapToolResultToToolResultBlockParam 使用 data, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    // 按照 data.type 的取值选择工具调用的具体处理分支。
    switch (data.type) {
      case 'image': {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                data: data.file.base64,
                media_type: data.file.type,
              },
            },
          ],
        }
      }
      case 'notebook':
        // 返回 `mapNotebookCellsToToolResult(data.file.cells, toolUseID)`，作为工具调用这次计算的结果。
        return mapNotebookCellsToToolResult(data.file.cells, toolUseID)
      case 'pdf':
        // Return PDF metadata only - the actual content is sent as a supplemental DocumentBlockParam
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: `PDF file read: ${data.file.filePath} (${formatFileSize(data.file.originalSize)})`,
        }
      case 'parts':
        // Extracted page images are read and sent as image blocks in mapToolResultToAPIMessage
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: `PDF pages extracted: ${data.file.count} page(s) from ${data.file.filePath} (${formatFileSize(data.file.originalSize)})`,
        }
      case 'file_unchanged':
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: FILE_UNCHANGED_STUB,
        }
      case 'text': {
        // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
        let content: string

        // 满足 `data.file.content` 时，工具调用执行该分支。
        if (data.file.content) {
          // 工具实现 File Read Tool在这里处理 `content =`，完成这一小步状态转换。
          content =
            memoryFileFreshnessPrefix(data) +
            formatFileLines(data.file) +
            (shouldIncludeFileReadMitigation()
              ? CYBER_RISK_MITIGATION_REMINDER
              : '')
        } else {
          // Determine the appropriate warning message
          // 工具实现 File Read Tool在这里处理 `content =`，完成这一小步状态转换。
          content =
            data.file.totalLines === 0
              ? '<system-reminder>Warning: the file exists but the contents are empty.</system-reminder>'
              : `<system-reminder>Warning: the file exists but is shorter than the provided offset (${data.file.startLine}). The file has ${data.file.totalLines} lines.</system-reminder>`
        }

        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content,
        }
      }
    }
  },
} satisfies ToolDef<InputSchema, Output>)

// pickLineFormatInstruction 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pickLineFormatInstruction(): string {
  // 返回 `LINE_FORMAT_INSTRUCTION`，作为工具调用这次计算的结果。
  return LINE_FORMAT_INSTRUCTION
}

/** Format file content with line numbers. */
// formatFileLines 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatFileLines(file: { content: string; startLine: number }): string {
  // 返回 `addLineNumbers(file)`，作为工具调用这次计算的结果。
  return addLineNumbers(file)
}

// CYBER_RISK_MITIGATION_REMINDER 先占位，稍后的条件分支会根据实际输入补齐它。
export const CYBER_RISK_MITIGATION_REMINDER =
  '\n\n<system-reminder>\nWhenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.\n</system-reminder>\n'

// Models where cyber risk mitigation should be skipped
// MITIGATION_EXEMPT_MODELS 集合保存`Set`，供工具调用后续处理使用。
const MITIGATION_EXEMPT_MODELS = new Set(['claude-opus-4-6'])

// shouldIncludeFileReadMitigation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldIncludeFileReadMitigation(): boolean {
  // shortName读取`getCanonicalName`，供工具调用后续处理使用。
  const shortName = getCanonicalName(getMainLoopModel())
  // 返回 `!MITIGATION_EXEMPT_MODELS.has(shortName)`，作为工具调用这次计算的结果。
  return !MITIGATION_EXEMPT_MODELS.has(shortName)
}

/**
 * Side-channel from call() to mapToolResultToToolResultBlockParam: mtime
 * of auto-memory files, keyed by the `data` object identity. Avoids
 * adding a presentation-only field to the output schema (which flows
 * into SDK types) and avoids sync fs in the mapper. WeakMap auto-GCs
 * when the data object becomes unreachable after rendering.
 */
// memoryFileMtimes 文件数据构建`new WeakMap<object, number>()`，供后续判断或组装使用。
const memoryFileMtimes = new WeakMap<object, number>()

// memoryFileFreshnessPrefix 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function memoryFileFreshnessPrefix(data: object): string {
  // mtimeMs 集合读取`memoryFileMtimes.get`，供工具调用后续处理使用。
  const mtimeMs = memoryFileMtimes.get(data)
  // 满足 `mtimeMs === undefined` 时，工具调用执行该分支。
  if (mtimeMs === undefined) return ''
  // 返回 `memoryFreshnessNote(mtimeMs)`，作为工具调用这次计算的结果。
  return memoryFreshnessNote(mtimeMs)
}

// validateContentTokens 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function validateContentTokens(
  content: string,
  ext: string,
  maxTokens?: number,
): Promise<void> {
  // effectiveMaxTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const effectiveMaxTokens =
    maxTokens ?? getDefaultFileReadingLimits().maxTokens

  // tokenEstimate保存`roughTokenCountEstimationForFileType`，供工具调用后续处理使用。
  const tokenEstimate = roughTokenCountEstimationForFileType(content, ext)
  // 只有 `!tokenEstimate || tokenEstimate <= effectiveMaxTokens / 4` 满足时，工具调用才执行该分支。
  if (!tokenEstimate || tokenEstimate <= effectiveMaxTokens / 4) return

  // tokenCount 数量统计`countTokensWithAPI`，供工具调用后续处理使用。
  const tokenCount = await countTokensWithAPI(content)
  // effectiveCount 数量保存`tokenCount ?? tokenEstimate`，供工具实现 File Read Tool后续判断或输出使用。
  const effectiveCount = tokenCount ?? tokenEstimate

  // 满足 `effectiveCount > effectiveMaxTokens` 时，工具调用执行该分支。
  if (effectiveCount > effectiveMaxTokens) {
    // 抛出 new MaxFileReadTokenExceededError(effectiveCount, effectiveMaxTokens)，阻止工具调用在无效状态下继续运行。
    throw new MaxFileReadTokenExceededError(effectiveCount, effectiveMaxTokens)
  }
}

// ImageResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type ImageResult = {
  type: 'image'
  file: {
    base64: string
    type: Base64ImageSource['media_type']
    originalSize: number
    dimensions?: ImageDimensions
  }
}

// createImageResponse 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createImageResponse(
  buffer: Buffer,
  mediaType: string,
  originalSize: number,
  dimensions?: ImageDimensions,
): ImageResult {
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    type: 'image',
    file: {
      base64: buffer.toString('base64'),
      type: `image/${mediaType}` as Base64ImageSource['media_type'],
      originalSize,
      dimensions,
    },
  }
}

/**
 * Inner implementation of call, separated to allow ENOENT handling in the outer call.
 */
// callInner 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function callInner(
  file_path: string,
  fullFilePath: string,
  resolvedFilePath: string,
  ext: string,
  offset: number,
  limit: number | undefined,
  pages: string | undefined,
  maxSizeBytes: number,
  maxTokens: number,
  readFileState: ToolUseContext['readFileState'],
  context: ToolUseContext,
  messageId: string | undefined,
): Promise<{
  data: Output
  newMessages?: ReturnType<typeof createUserMessage>[]
}> {
  // --- Notebook ---
  // 当 `ext` 匹配 `'ipynb'` 时，工具调用执行对应分支。
  if (ext === 'ipynb') {
    // cells 集合读取`readNotebook`，供工具调用后续处理使用。
    const cells = await readNotebook(resolvedFilePath)
    // cellsJson保存`jsonStringify`，供工具调用后续处理使用。
    const cellsJson = jsonStringify(cells)

    // cellsJsonBytes 集合保存`Buffer.byteLength`，供工具调用后续处理使用。
    const cellsJsonBytes = Buffer.byteLength(cellsJson)
    // 满足 `cellsJsonBytes > maxSizeBytes` 时，工具调用执行该分支。
    if (cellsJsonBytes > maxSizeBytes) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        `Notebook content (${formatFileSize(cellsJsonBytes)}) exceeds maximum allowed size (${formatFileSize(maxSizeBytes)}). ` +
          `Use ${BASH_TOOL_NAME} with jq to read specific portions:\n` +
          `  cat "${file_path}" | jq '.cells[:20]' # First 20 cells\n` +
          `  cat "${file_path}" | jq '.cells[100:120]' # Cells 100-120\n` +
          `  cat "${file_path}" | jq '.cells | length' # Count total cells\n` +
          `  cat "${file_path}" | jq '.cells[] | select(.cell_type=="code") | .source' # All code sources`,
      )
    }

    // 等待 `validateContentTokens(cellsJson, ext, maxTokens)` 完成，再继续工具实现 File Read Tool的异步流程。
    await validateContentTokens(cellsJson, ext, maxTokens)

    // Get mtime via async stat (single call, no prior existence check)
    // stats 集合读取`getFsImplementation`，供工具调用后续处理使用。
    const stats = await getFsImplementation().stat(resolvedFilePath)
    // readFileState.set 写入新的状态值，使工具调用后续读取保持一致。
    readFileState.set(fullFilePath, {
      content: cellsJson,
      timestamp: Math.floor(stats.mtimeMs),
      offset,
      limit,
    })
    // 调用 context.nestedMemoryAttachmentTriggers?.add(fullFilePath)，完成这一处局部操作。
    context.nestedMemoryAttachmentTriggers?.add(fullFilePath)

    // data集中保存工具实现 File Read Tool要一起传递的字段。
    const data = {
      type: 'notebook' as const,
      file: { filePath: file_path, cells },
    }

    // 调用 logFileOperation，触发工具调用此处需要的副作用。
    logFileOperation({
      operation: 'read',
      tool: 'FileReadTool',
      filePath: fullFilePath,
      content: cellsJson,
    })

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { data }
  }

  // --- Image (single read, no double-read) ---
  // 满足 `IMAGE_EXTENSIONS.has(ext)` 时，工具调用执行该分支。
  if (IMAGE_EXTENSIONS.has(ext)) {
    // Images have their own size limits (token budget + compression) —
    // don't apply the text maxSizeBytes cap.
    // data读取`readImageWithTokenBudget`，供工具调用后续处理使用。
    const data = await readImageWithTokenBudget(resolvedFilePath, maxTokens)
    // 调用 context.nestedMemoryAttachmentTriggers?.add(fullFilePath)，完成这一处局部操作。
    context.nestedMemoryAttachmentTriggers?.add(fullFilePath)

    // 调用 logFileOperation，触发工具调用此处需要的副作用。
    logFileOperation({
      operation: 'read',
      tool: 'FileReadTool',
      filePath: fullFilePath,
      content: data.file.base64,
    })

    // metadataText保存`data.file.dimensions`，供工具实现 File Read Tool后续判断或输出使用。
    const metadataText = data.file.dimensions
      ? createImageMetadataText(data.file.dimensions)
      : null

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data,
      ...(metadataText && {
        newMessages: [
          createUserMessage({ content: metadataText, isMeta: true }),
        ],
      }),
    }
  }

  // --- PDF ---
  // 满足 `isPDFExtension(ext)` 时，工具调用执行该分支。
  if (isPDFExtension(ext)) {
    // 满足 `pages` 时，工具调用执行该分支。
    if (pages) {
      // parsedRange解析`parsePDFPageRange`，供工具调用后续处理使用。
      const parsedRange = parsePDFPageRange(pages)
      // extractResult保存`extractPDFPages`，供工具调用后续处理使用。
      const extractResult = await extractPDFPages(
        resolvedFilePath,
        parsedRange ?? undefined,
      )
      // extractResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!extractResult.success) {
        // 抛出 new Error(extractResult.error.message)，阻止工具调用在无效状态下继续运行。
        throw new Error(extractResult.error.message)
      }
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_pdf_page_extraction', {
        success: true,
        pageCount: extractResult.data.file.count,
        fileSize: extractResult.data.file.originalSize,
        hasPageRange: true,
      })
      // 调用 logFileOperation，触发工具调用此处需要的副作用。
      logFileOperation({
        operation: 'read',
        tool: 'FileReadTool',
        filePath: fullFilePath,
        content: `PDF pages ${pages}`,
      })
      // entries 集合读取`readdir`，供工具调用后续处理使用。
      const entries = await readdir(extractResult.data.file.outputDir)
      // imageFiles 文件数据筛选`entries.filter`，供工具调用后续处理使用。
      const imageFiles = entries.filter(f => f.endsWith('.jpg')).sort()
      // imageBlocks 集合保存`Promise.all`，供工具调用后续处理使用。
      const imageBlocks = await Promise.all(
        // 调用 imageFiles.map，触发工具调用此处需要的副作用。
        imageFiles.map(async f => {
          // imgPath 路径数据格式化`path.join`，供工具调用后续处理使用。
          const imgPath = path.join(extractResult.data.file.outputDir, f)
          // imgBuffer读取`readFileAsync`，供工具调用后续处理使用。
          const imgBuffer = await readFileAsync(imgPath)
          // resized统计`maybeResizeAndDownsampleImageBuffer`，供工具调用后续处理使用。
          const resized = await maybeResizeAndDownsampleImageBuffer(
            imgBuffer,
            imgBuffer.length,
            'jpeg',
          )
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type:
                `image/${resized.mediaType}` as Base64ImageSource['media_type'],
              data: resized.buffer.toString('base64'),
            },
          }
        }),
      )
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: extractResult.data,
        ...(imageBlocks.length > 0 && {
          newMessages: [
            createUserMessage({ content: imageBlocks, isMeta: true }),
          ],
        }),
      }
    }

    // pageCount 数量读取`getPDFPageCount`，供工具调用后续处理使用。
    const pageCount = await getPDFPageCount(resolvedFilePath)
    // `pageCount` 与 `null && pageCount > PDF_AT_MENT...` 不一致时刷新派生状态，避免使用过期结果。
    if (pageCount !== null && pageCount > PDF_AT_MENTION_INLINE_THRESHOLD) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        `This PDF has ${pageCount} pages, which is too many to read at once. ` +
          `Use the pages parameter to read specific page ranges (e.g., pages: "1-5"). ` +
          `Maximum ${PDF_MAX_PAGES_PER_READ} pages per request.`,
      )
    }

    // fs 集合读取`getFsImplementation`，供工具调用后续处理使用。
    const fs = getFsImplementation()
    // stats 集合保存`fs.stat`，供工具调用后续处理使用。
    const stats = await fs.stat(resolvedFilePath)
    // shouldExtractPages 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const shouldExtractPages =
      !isPDFSupported() || stats.size > PDF_EXTRACT_SIZE_THRESHOLD

    // 满足 `shouldExtractPages` 时，工具调用执行该分支。
    if (shouldExtractPages) {
      // extractResult保存`extractPDFPages`，供工具调用后续处理使用。
      const extractResult = await extractPDFPages(resolvedFilePath)
      // 满足 `extractResult.success` 时，工具调用执行该分支。
      if (extractResult.success) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_pdf_page_extraction', {
          success: true,
          pageCount: extractResult.data.file.count,
          fileSize: extractResult.data.file.originalSize,
        })
      } else {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_pdf_page_extraction', {
          success: false,
          available: extractResult.error.reason !== 'unavailable',
          fileSize: stats.size,
        })
      }
    }

    // 满足 `!isPDFSupported()` 时，工具调用执行该分支。
    if (!isPDFSupported()) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        'Reading full PDFs is not supported with this model. Use a newer model (Sonnet 3.5 v2 or later), ' +
          `or use the pages parameter to read specific page ranges (e.g., pages: "1-5", maximum ${PDF_MAX_PAGES_PER_READ} pages per request). ` +
          'Page extraction requires poppler-utils: install with `brew install poppler` on macOS or `apt-get install poppler-utils` on Debian/Ubuntu.',
      )
    }

    // readResult读取`readPDF`，供工具调用后续处理使用。
    const readResult = await readPDF(resolvedFilePath)
    // readResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!readResult.success) {
      // 抛出 new Error(readResult.error.message)，阻止工具调用在无效状态下继续运行。
      throw new Error(readResult.error.message)
    }
    // pdfData读取`readResult.data`，供后续判断或组装使用。
    const pdfData = readResult.data
    // 调用 logFileOperation，触发工具调用此处需要的副作用。
    logFileOperation({
      operation: 'read',
      tool: 'FileReadTool',
      filePath: fullFilePath,
      content: pdfData.file.base64,
    })

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: pdfData,
      newMessages: [
        createUserMessage({
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfData.file.base64,
              },
            },
          ],
          isMeta: true,
        }),
      ],
    }
  }

  // --- Text file (single async read via readFileInRange) ---
  // lineOffset标记工具实现 File Read Tool是否启用对应路径。
  const lineOffset = offset === 0 ? 0 : offset - 1
  // 工具实现 File Read Tool先整理这一处局部数据，后续分支可以直接读取。
  const { content, lineCount, totalLines, totalBytes, readBytes, mtimeMs } =
    await readFileInRange(
      resolvedFilePath,
      lineOffset,
      limit,
      limit === undefined ? maxSizeBytes : undefined,
      context.abortController.signal,
    )

  // 等待 `validateContentTokens(content, ext, maxTokens)` 完成，再继续工具实现 File Read Tool的异步流程。
  await validateContentTokens(content, ext, maxTokens)

  // readFileState.set 写入新的状态值，使工具调用后续读取保持一致。
  readFileState.set(fullFilePath, {
    content,
    timestamp: Math.floor(mtimeMs),
    offset,
    limit,
  })
  // 调用 context.nestedMemoryAttachmentTriggers?.add(fullFilePath)，完成这一处局部操作。
  context.nestedMemoryAttachmentTriggers?.add(fullFilePath)

  // Snapshot before iterating — a listener that unsubscribes mid-callback
  // would splice the live array and skip the next listener.
  // 逐项读取 `fileReadListeners.slice()` 中的listener 集合，按输入顺序推进工具调用。
  for (const listener of fileReadListeners.slice()) {
    // 调用 listener，触发工具调用此处需要的副作用。
    listener(resolvedFilePath, content)
  }

  // data集中保存工具实现 File Read Tool要一起传递的字段。
  const data = {
    type: 'text' as const,
    file: {
      filePath: file_path,
      content,
      numLines: lineCount,
      startLine: offset,
      totalLines,
    },
  }
  // 满足 `isAutoMemFile(fullFilePath)` 时，工具调用执行该分支。
  if (isAutoMemFile(fullFilePath)) {
    // memoryFileMtimes.set 写入新的状态值，使工具调用后续读取保持一致。
    memoryFileMtimes.set(data, mtimeMs)
  }

  // 调用 logFileOperation，触发工具调用此处需要的副作用。
  logFileOperation({
    operation: 'read',
    tool: 'FileReadTool',
    filePath: fullFilePath,
    content,
  })

  // sessionFileType 会话数据读取`detectSessionFileType`，供工具调用后续处理使用。
  const sessionFileType = detectSessionFileType(fullFilePath)
  // analyticsExt读取`getFileExtensionForAnalytics`，供工具调用后续处理使用。
  const analyticsExt = getFileExtensionForAnalytics(fullFilePath)
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_session_file_read', {
    totalLines,
    readLines: lineCount,
    totalBytes,
    readBytes,
    offset,
    ...(limit !== undefined && { limit }),
    ...(analyticsExt !== undefined && { ext: analyticsExt }),
    ...(messageId !== undefined && {
      messageID:
        messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    is_session_memory: sessionFileType === 'session_memory',
    is_session_transcript: sessionFileType === 'session_transcript',
  })

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { data }
}

/**
 * Reads an image file and applies token-based compression if needed.
 * Reads the file ONCE, then applies standard resize. If the result exceeds
 * the token limit, applies aggressive compression from the same buffer.
 *
 * @param filePath - Path to the image file
 * @param maxTokens - Maximum token budget for the image
 * @returns Image data with appropriate compression applied
 */
// readImageWithTokenBudget 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readImageWithTokenBudget(
  filePath: string,
  maxTokens: number = getDefaultFileReadingLimits().maxTokens,
  maxBytes?: number,
): Promise<ImageResult> {
  // Read file ONCE — capped to maxBytes to avoid OOM on huge files
  // imageBuffer读取`getFsImplementation`，供工具调用后续处理使用。
  const imageBuffer = await getFsImplementation().readFileBytes(
    filePath,
    maxBytes,
  )
  // originalSize记录 `imageBuffer.length` 是否成立，下一步按该结果分支。
  const originalSize = imageBuffer.length

  // 满足 `originalSize === 0` 时，工具调用执行该分支。
  if (originalSize === 0) {
    // 抛出 new Error(`Image file is empty: ${filePath}`)，阻止工具调用在无效状态下继续运行。
    throw new Error(`Image file is empty: ${filePath}`)
  }

  // detectedMediaType读取`detectImageFormatFromBuffer`，供工具调用后续处理使用。
  const detectedMediaType = detectImageFormatFromBuffer(imageBuffer)
  // detectedFormat格式化`detectedMediaType.split`，供工具调用后续处理使用。
  const detectedFormat = detectedMediaType.split('/')[1] || 'png'

  // Try standard resize
  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let result: ImageResult
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // resized统计`maybeResizeAndDownsampleImageBuffer`，供工具调用后续处理使用。
    const resized = await maybeResizeAndDownsampleImageBuffer(
      imageBuffer,
      originalSize,
      detectedFormat,
    )
    // 结果更新为 `createImageResponse(`，确保工具调用后续读取最新状态。
    result = createImageResponse(
      resized.buffer,
      resized.mediaType,
      originalSize,
      resized.dimensions,
    )
  } catch (e) {
    // 满足 `e instanceof ImageResizeError` 时，工具调用执行该分支。
    if (e instanceof ImageResizeError) throw e
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 结果更新为 `createImageResponse(imageBuffer, detectedFormat, original...`，确保工具调用后续读取最新状态。
    result = createImageResponse(imageBuffer, detectedFormat, originalSize)
  }

  // Check if it fits in token budget
  // estimatedTokens 集合保存`Math.ceil`，供工具调用后续处理使用。
  const estimatedTokens = Math.ceil(result.file.base64.length * 0.125)
  // 满足 `estimatedTokens > maxTokens` 时，工具调用执行该分支。
  if (estimatedTokens > maxTokens) {
    // Aggressive compression from the SAME buffer (no re-read)
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // compressed保存`compressImageBufferWithTokenLimit`，供工具调用后续处理使用。
      const compressed = await compressImageBufferWithTokenLimit(
        imageBuffer,
        maxTokens,
        detectedMediaType,
      )
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        type: 'image',
        file: {
          base64: compressed.base64,
          type: compressed.mediaType,
          originalSize,
        },
      }
    } catch (e) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logError(e)
      // Fallback: heavily compressed version from the SAME buffer
      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // sharpModule保存`import`，供工具调用后续处理使用。
        const sharpModule = await import('sharp')
        // sharp 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const sharp =
          (
            sharpModule as {
              default?: typeof sharpModule
            } & typeof sharpModule
          ).default || sharpModule

        // fallbackBuffer保存`sharp`，供工具调用后续处理使用。
        const fallbackBuffer = await sharp(imageBuffer)
          .resize(400, 400, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 20 })
          .toBuffer()

        // 返回 `createImageResponse(fallbackBuffer, 'jpeg', originalSize)`，作为工具调用这次计算的结果。
        return createImageResponse(fallbackBuffer, 'jpeg', originalSize)
      } catch (error) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // 返回 `createImageResponse(imageBuffer, detectedFormat, originalSize)`，作为工具调用这次计算的结果。
        return createImageResponse(imageBuffer, detectedFormat, originalSize)
      }
    }
  }

  // 返回 `result`，作为工具调用这次计算的结果。
  return result
}
