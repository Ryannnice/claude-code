// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, sep } from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 diagnosticTracker 服务层能力，把外部通信或共享状态交给 ../../services/diagnosticTracking.js 处理。
import { diagnosticTracker } from '../../services/diagnosticTracking.js'
// 接入 clearDeliveredDiagnosticsForFile 服务层能力，把外部通信或共享状态交给 ../../services/lsp/LSPDiagnosticRegistry.js 处理。
import { clearDeliveredDiagnosticsForFile } from '../../services/lsp/LSPDiagnosticRegistry.js'
// 接入 getLspServerManager 服务层能力，把外部通信或共享状态交给 ../../services/lsp/manager.js 处理。
import { getLspServerManager } from '../../services/lsp/manager.js'
// 接入 notifyVscodeFileUpdated 服务层能力，把外部通信或共享状态交给 ../../services/mcp/vscodeSdkMcp.js 处理。
import { notifyVscodeFileUpdated } from '../../services/mcp/vscodeSdkMcp.js'
// 接入 checkTeamMemSecrets 服务层能力，把外部通信或共享状态交给 ../../services/teamMemorySync/teamMemSecretGuard.js 处理。
import { checkTeamMemSecrets } from '../../services/teamMemorySync/teamMemSecretGuard.js'
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
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 countLinesChanged、getPatchForDisplay 工具函数，把通用处理留在 ../../utils/diff.js 中维护。
import { countLinesChanged, getPatchForDisplay } from '../../utils/diff.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 isENOENT 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isENOENT } from '../../utils/errors.js'
// 复用 getFileModificationTime、writeTextContent 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getFileModificationTime, writeTextContent } from '../../utils/file.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  fileHistoryEnabled,
  fileHistoryTrackEdit,
} from '../../utils/fileHistory.js'
// 复用 logFileOperation 工具函数，把通用处理留在 ../../utils/fileOperationAnalytics.js 中维护。
import { logFileOperation } from '../../utils/fileOperationAnalytics.js'
// 复用 readFileSyncWithMetadata 工具函数，把通用处理留在 ../../utils/fileRead.js 中维护。
import { readFileSyncWithMetadata } from '../../utils/fileRead.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  fetchSingleFileGitDiff,
  type ToolUseDiff,
} from '../../utils/gitDiff.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 expandPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath } from '../../utils/path.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  checkWritePermissionForTool,
  matchingRuleForInput,
} from '../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 复用 matchWildcardPattern 工具函数，把通用处理留在 ../../utils/permissions/shellRuleMatching.js 中维护。
import { matchWildcardPattern } from '../../utils/permissions/shellRuleMatching.js'
// 引入 FILE_UNEXPECTEDLY_MODIFIED_ERROR，将 ../FileEditTool/constants.js 中已经封装好的能力接到本文件流程里。
import { FILE_UNEXPECTEDLY_MODIFIED_ERROR } from '../FileEditTool/constants.js'
// 引入 gitDiffSchema、hunkSchema，将 ../FileEditTool/types.js 中已经封装好的能力接到本文件流程里。
import { gitDiffSchema, hunkSchema } from '../FileEditTool/types.js'
// 引入 FILE_WRITE_TOOL_NAME、getWriteToolDescription，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_WRITE_TOOL_NAME, getWriteToolDescription } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  isResultTruncated,
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
  renderToolUseRejectedMessage,
  userFacingName,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    file_path: z
      .string()
      .describe(
        'The absolute path to the file to write (must be absolute, not relative)',
      ),
    content: z.string().describe('The content to write to the file'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    type: z
      .enum(['create', 'update'])
      .describe(
        'Whether a new file was created or an existing file was updated',
      ),
    filePath: z.string().describe('The path to the file that was written'),
    content: z.string().describe('The content that was written to the file'),
    structuredPatch: z
      .array(hunkSchema())
      .describe('Diff patch showing the changes'),
    originalFile: z
      .string()
      .nullable()
      .describe(
        'The original file content before the write (null for new files)',
      ),
    gitDiff: gitDiffSchema().optional(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>
// FileWriteToolInput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileWriteToolInput = InputSchema

// FileWriteTool 文件数据构建`buildTool`，供工具调用后续处理使用。
export const FileWriteTool = buildTool({
  name: FILE_WRITE_TOOL_NAME,
  searchHint: 'create or overwrite files',
  maxResultSizeChars: 100_000,
  strict: true,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Write a file to the local filesystem.'`，作为工具调用这次计算的结果。
    return 'Write a file to the local filesystem.'
  },
  userFacingName,
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Writing ${summary}` : 'Writing file'`，作为工具调用这次计算的结果。
    return summary ? `Writing ${summary}` : 'Writing file'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getWriteToolDescription()`，作为工具调用这次计算的结果。
    return getWriteToolDescription()
  },
  renderToolUseMessage,
  isResultTruncated,
  // 工具实现 File Write Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 File Write Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 ``${input.file_path}: ${input.content}``，作为工具调用这次计算的结果。
    return `${input.file_path}: ${input.content}`
  },
  // getPath 根据 input 读取或计算工具调用需要的结果。
  getPath(input): string {
    // 返回 `input.file_path`，作为工具调用这次计算的结果。
    return input.file_path
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
    // 返回 `checkWritePermissionForTool(`，作为工具调用这次计算的结果。
    return checkWritePermissionForTool(
      FileWriteTool,
      input,
      appState.toolPermissionContext,
    )
  },
  renderToolUseRejectedMessage,
  renderToolUseErrorMessage,
  renderToolResultMessage,
  // extractSearchText 使用 无 完成工具调用里的对应操作。
  extractSearchText() {
    // Transcript render shows either content (create, via HighlightedCode)
    // or a structured diff (update). The heuristic's 'content' allowlist key
    // would index the raw content string even in update mode where it's NOT
    // shown — phantom. Under-count: tool_use already indexes file_path.
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },
  // validateInput 使用 { file_path, content }, toolUseContext: ToolUseCo… 完成工具调用里的对应操作。
  async validateInput({ file_path, content }, toolUseContext: ToolUseContext) {
    // fullFilePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullFilePath = expandPath(file_path)

    // Reject writes to team memory files that contain secrets
    // secretError 错误信息读取`checkTeamMemSecrets`，供工具调用后续处理使用。
    const secretError = checkTeamMemSecrets(fullFilePath, content)
    // 满足 `secretError` 时，工具调用执行该分支。
    if (secretError) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: false, message: secretError, errorCode: 0 }
    }

    // Check if path should be ignored based on permission settings
    // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
    const appState = toolUseContext.getAppState()
    // denyRule保存`matchingRuleForInput`，供工具调用后续处理使用。
    const denyRule = matchingRuleForInput(
      fullFilePath,
      appState.toolPermissionContext,
      'edit',
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

    // SECURITY: Skip filesystem operations for UNC paths to prevent NTLM credential leaks.
    // On Windows, fs.existsSync() on UNC paths triggers SMB authentication which could
    // leak credentials to malicious servers. Let the permission check handle UNC paths.
    // 只有 `fullFilePath.startsWith('\\\\') || fullFilePath.startsWith('//')` 满足时，工具调用才执行该分支。
    if (fullFilePath.startsWith('\\\\') || fullFilePath.startsWith('//')) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: true }
    }

    // fs 集合读取`getFsImplementation`，供工具调用后续处理使用。
    const fs = getFsImplementation()
    // fileMtimeMs 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let fileMtimeMs: number
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // fileStat 文件数据保存`fs.stat`，供工具调用后续处理使用。
      const fileStat = await fs.stat(fullFilePath)
      // fileMtimeMs 文件数据更新为 `fileStat.mtimeMs`，确保工具调用后续读取最新状态。
      fileMtimeMs = fileStat.mtimeMs
    } catch (e) {
      // 满足 `isENOENT(e)` 时，工具调用执行该分支。
      if (isENOENT(e)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { result: true }
      }
      // 抛出 e，阻止工具调用在无效状态下继续运行。
      throw e
    }

    // readTimestamp读取`readFileState.get`，供工具调用后续处理使用。
    const readTimestamp = toolUseContext.readFileState.get(fullFilePath)
    // 只有 `!readTimestamp || readTimestamp.isPartialView` 满足时，工具调用才执行该分支。
    if (!readTimestamp || readTimestamp.isPartialView) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'File has not been read yet. Read it first before writing to it.',
        errorCode: 2,
      }
    }

    // Reuse mtime from the stat above — avoids a redundant statSync via
    // getFileModificationTime. The readTimestamp guard above ensures this
    // block is always reached when the file exists.
    // lastWriteTime保存`Math.floor`，供工具调用后续处理使用。
    const lastWriteTime = Math.floor(fileMtimeMs)
    // 满足 `lastWriteTime > readTimestamp.timestamp` 时，工具调用执行该分支。
    if (lastWriteTime > readTimestamp.timestamp) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.',
        errorCode: 3,
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // 工具实现 File Write Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    { file_path, content },
    { readFileState, updateFileHistoryState, dynamicSkillDirTriggers },
    _,
    parentMessage,
  ) {
    // fullFilePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullFilePath = expandPath(file_path)
    // dir保存`dirname`，供工具调用后续处理使用。
    const dir = dirname(fullFilePath)

    // Discover skills from this file's path (fire-and-forget, non-blocking)
    // cwd读取`getCwd`，供工具调用后续处理使用。
    const cwd = getCwd()
    // newSkillDirs 集合保存`discoverSkillDirsForPaths`，供工具调用后续处理使用。
    const newSkillDirs = await discoverSkillDirsForPaths([fullFilePath], cwd)
    // 满足 `newSkillDirs.length > 0` 时，工具调用执行该分支。
    if (newSkillDirs.length > 0) {
      // Store discovered dirs for attachment display
      // 按顺序遍历 `newSkillDirs` 中的dir，逐个交给工具调用处理。
      for (const dir of newSkillDirs) {
        // 调用 dynamicSkillDirTriggers?.add(dir)，完成这一处局部操作。
        dynamicSkillDirTriggers?.add(dir)
      }
      // Don't await - let skill loading happen in the background
      // 调用 addSkillDirectories，触发工具调用此处需要的副作用。
      addSkillDirectories(newSkillDirs).catch(() => {})
    }

    // Activate conditional skills whose path patterns match this file
    // 调用 activateConditionalSkillsForPaths，触发工具调用此处需要的副作用。
    activateConditionalSkillsForPaths([fullFilePath], cwd)

    // 等待 `diagnosticTracker.beforeFileEdited(fullFilePath)` 完成，再继续工具实现 File Write Tool的异步流程。
    await diagnosticTracker.beforeFileEdited(fullFilePath)

    // Ensure parent directory exists before the atomic read-modify-write section.
    // Must stay OUTSIDE the critical section below (a yield between the staleness
    // check and writeTextContent lets concurrent edits interleave), and BEFORE the
    // write (lazy-mkdir-on-ENOENT would fire a spurious tengu_atomic_write_error
    // inside writeFileSyncAndFlush_DEPRECATED before ENOENT propagates back).
    // 等待 `getFsImplementation().mkdir(dir)` 完成，再继续工具实现 File Write Tool的异步流程。
    await getFsImplementation().mkdir(dir)
    // 满足 `fileHistoryEnabled()` 时，工具调用执行该分支。
    if (fileHistoryEnabled()) {
      // Backup captures pre-edit content — safe to call before the staleness
      // check (idempotent v1 backup keyed on content hash; if staleness fails
      // later we just have an unused backup, not corrupt state).
      // 等待 `fileHistoryTrackEdit(` 完成，再继续工具实现 File Write Tool的异步流程。
      await fileHistoryTrackEdit(
        updateFileHistoryState,
        fullFilePath,
        parentMessage.uuid,
      )
    }

    // Load current state and confirm no changes since last read.
    // Please avoid async operations between here and writing to disk to preserve atomicity.
    // meta 先占位，稍后的条件分支会根据实际输入补齐它。
    let meta: ReturnType<typeof readFileSyncWithMetadata> | null
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // meta更新为 `readFileSyncWithMetadata(fullFilePath)`，确保工具调用后续读取最新状态。
      meta = readFileSyncWithMetadata(fullFilePath)
    } catch (e) {
      // 满足 `isENOENT(e)` 时，工具调用执行该分支。
      if (isENOENT(e)) {
        // meta更新为 `null`，确保工具调用后续读取最新状态。
        meta = null
      } else {
        // 抛出 e，阻止工具调用在无效状态下继续运行。
        throw e
      }
    }

    // `meta` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (meta !== null) {
      // lastWriteTime读取`getFileModificationTime`，供工具调用后续处理使用。
      const lastWriteTime = getFileModificationTime(fullFilePath)
      // lastRead读取`readFileState.get`，供工具调用后续处理使用。
      const lastRead = readFileState.get(fullFilePath)
      // 只有 `!lastRead || lastWriteTime > lastRead.timestamp` 满足时，工具调用才执行该分支。
      if (!lastRead || lastWriteTime > lastRead.timestamp) {
        // Timestamp indicates modification, but on Windows timestamps can change
        // without content changes (cloud sync, antivirus, etc.). For full reads,
        // compare content as a fallback to avoid false positives.
        // isFullRead 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isFullRead =
          lastRead &&
          lastRead.offset === undefined &&
          lastRead.limit === undefined
        // meta.content is CRLF-normalized — matches readFileState's normalized form.
        // `!isFullRead || meta.content` 与 `lastRead.content` 不一致时刷新派生状态，避免使用过期结果。
        if (!isFullRead || meta.content !== lastRead.content) {
          // 抛出 new Error(FILE_UNEXPECTEDLY_MODIFIED_ERROR)，阻止工具调用在无效状态下继续运行。
          throw new Error(FILE_UNEXPECTEDLY_MODIFIED_ERROR)
        }
      }
    }

    // enc保存`meta?.encoding ?? 'utf8'`，供后续判断或组装使用。
    const enc = meta?.encoding ?? 'utf8'
    // 原始内容保存`meta?.content ?? null`，供工具实现 File Write Tool后续判断或输出使用。
    const oldContent = meta?.content ?? null

    // Write is a full content replacement — the model sent explicit line endings
    // in `content` and meant them. Do not rewrite them. Previously we preserved
    // the old file's line endings (or sampled the repo via ripgrep for new
    // files), which silently corrupted e.g. bash scripts with \r on Linux when
    // overwriting a CRLF file or when binaries in cwd poisoned the repo sample.
    // 调用 writeTextContent，触发工具调用此处需要的副作用。
    writeTextContent(fullFilePath, content, enc, 'LF')

    // Notify LSP servers about file modification (didChange) and save (didSave)
    // lspManager读取`getLspServerManager`，供工具调用后续处理使用。
    const lspManager = getLspServerManager()
    // 满足 `lspManager` 时，工具调用执行该分支。
    if (lspManager) {
      // Clear previously delivered diagnostics so new ones will be shown
      // 调用 clearDeliveredDiagnosticsForFile，触发工具调用此处需要的副作用。
      clearDeliveredDiagnosticsForFile(`file://${fullFilePath}`)
      // didChange: Content has been modified
      // 调用 lspManager.changeFile，触发工具调用此处需要的副作用。
      lspManager.changeFile(fullFilePath, content).catch((err: Error) => {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `LSP: Failed to notify server of file change for ${fullFilePath}: ${err.message}`,
        )
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(err)
      })
      // didSave: File has been saved to disk (triggers diagnostics in TypeScript server)
      // 调用 lspManager.saveFile，触发工具调用此处需要的副作用。
      lspManager.saveFile(fullFilePath).catch((err: Error) => {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `LSP: Failed to notify server of file save for ${fullFilePath}: ${err.message}`,
        )
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(err)
      })
    }

    // Notify VSCode about the file change for diff view
    // 调用 notifyVscodeFileUpdated，触发工具调用此处需要的副作用。
    notifyVscodeFileUpdated(fullFilePath, oldContent, content)

    // Update read timestamp, to invalidate stale writes
    // readFileState.set 写入新的状态值，使工具调用后续读取保持一致。
    readFileState.set(fullFilePath, {
      content,
      timestamp: getFileModificationTime(fullFilePath),
      offset: undefined,
      limit: undefined,
    })

    // Log when writing to CLAUDE.md
    // 满足 `fullFilePath.endsWith(`${sep}CLAUDE.md`)` 时，工具调用执行该分支。
    if (fullFilePath.endsWith(`${sep}CLAUDE.md`)) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_write_claudemd', {})
    }

    // gitDiff 先占位，稍后的条件分支会根据实际输入补齐它。
    let gitDiff: ToolUseDiff | undefined
    // 工具调用在这里按实际状态进入对应分支。
    if (
      isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) &&
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_quartz_lantern', false)
    ) {
      // startTime记录时间`Date.now`，供工具调用后续处理使用。
      const startTime = Date.now()
      // diff读取`fetchSingleFileGitDiff`，供工具调用后续处理使用。
      const diff = await fetchSingleFileGitDiff(fullFilePath)
      // 满足 `diff` 时，工具调用执行该分支。
      if (diff) gitDiff = diff
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_use_diff_computed', {
        isWriteTool: true,
        durationMs: Date.now() - startTime,
        hasDiff: !!diff,
      })
    }

    // 满足 `oldContent` 时，工具调用执行该分支。
    if (oldContent) {
      // patch读取`getPatchForDisplay`，供工具调用后续处理使用。
      const patch = getPatchForDisplay({
        filePath: file_path,
        fileContents: oldContent,
        edits: [
          {
            old_string: oldContent,
            new_string: content,
            replace_all: false,
          },
        ],
      })

      // data集中保存工具实现 File Write Tool要一起传递的字段。
      const data = {
        type: 'update' as const,
        filePath: file_path,
        content,
        structuredPatch: patch,
        originalFile: oldContent,
        ...(gitDiff && { gitDiff }),
      }
      // Track lines added and removed for file updates, right before yielding result
      // 调用 countLinesChanged，触发工具调用此处需要的副作用。
      countLinesChanged(patch)

      // 调用 logFileOperation，触发工具调用此处需要的副作用。
      logFileOperation({
        operation: 'write',
        tool: 'FileWriteTool',
        filePath: fullFilePath,
        type: 'update',
      })

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data,
      }
    }

    // data集中保存工具实现 File Write Tool要一起传递的字段。
    const data = {
      type: 'create' as const,
      filePath: file_path,
      content,
      structuredPatch: [],
      originalFile: null,
      ...(gitDiff && { gitDiff }),
    }

    // For creation of new files, count all lines as additions, right before yielding the result
    // 调用 countLinesChanged，触发工具调用此处需要的副作用。
    countLinesChanged([], content)

    // 调用 logFileOperation，触发工具调用此处需要的副作用。
    logFileOperation({
      operation: 'write',
      tool: 'FileWriteTool',
      filePath: fullFilePath,
      type: 'create',
    })

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data,
    }
  },
  // mapToolResultToToolResultBlockParam 使用 { filePath, type }, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam({ filePath, type }, toolUseID) {
    // 按照 type 的取值选择工具调用的具体处理分支。
    switch (type) {
      case 'create':
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: `File created successfully at: ${filePath}`,
        }
      case 'update':
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result',
          content: `The file ${filePath} has been updated successfully.`,
        }
    }
  },
} satisfies ToolDef<InputSchema, Output>)
