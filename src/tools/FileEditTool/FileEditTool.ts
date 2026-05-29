// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, isAbsolute, sep } from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
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
// 复用 countLinesChanged 工具函数，把通用处理留在 ../../utils/diff.js 中维护。
import { countLinesChanged } from '../../utils/diff.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 isENOENT 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isENOENT } from '../../utils/errors.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  FILE_NOT_FOUND_CWD_NOTE,
  findSimilarFile,
  getFileModificationTime,
  suggestPathUnderCwd,
  writeTextContent,
} from '../../utils/file.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  fileHistoryEnabled,
  fileHistoryTrackEdit,
} from '../../utils/fileHistory.js'
// 复用 logFileOperation 工具函数，把通用处理留在 ../../utils/fileOperationAnalytics.js 中维护。
import { logFileOperation } from '../../utils/fileOperationAnalytics.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type LineEndingType,
  readFileSyncWithMetadata,
} from '../../utils/fileRead.js'
// 复用 formatFileSize 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatFileSize } from '../../utils/format.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  fetchSingleFileGitDiff,
  type ToolUseDiff,
} from '../../utils/gitDiff.js'
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
// 复用 validateInputForSettingsFileEdit 工具函数，把通用处理留在 ../../utils/settings/validateEditTool.js 中维护。
import { validateInputForSettingsFileEdit } from '../../utils/settings/validateEditTool.js'
// 引入 NOTEBOOK_EDIT_TOOL_NAME，将 ../NotebookEditTool/constants.js 中已经封装好的能力接到本文件流程里。
import { NOTEBOOK_EDIT_TOOL_NAME } from '../NotebookEditTool/constants.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  FILE_EDIT_TOOL_NAME,
  FILE_UNEXPECTEDLY_MODIFIED_ERROR,
} from './constants.js'
// 引入 getEditToolDescription，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getEditToolDescription } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type FileEditInput,
  type FileEditOutput,
  inputSchema,
  outputSchema,
} from './types.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
  renderToolUseRejectedMessage,
  userFacingName,
} from './UI.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  areFileEditsInputsEquivalent,
  findActualString,
  getPatchForEdit,
  preserveQuoteStyle,
} from './utils.js'

// V8/Bun string length limit is ~2^30 characters (~1 billion). For typical
// ASCII/Latin-1 files, 1 byte on disk = 1 character, so 1 GiB in stat bytes
// ≈ 1 billion characters ≈ the runtime string limit. Multi-byte UTF-8 files
// can be larger on disk per character, but 1 GiB is a safe byte-level guard
// that prevents OOM without being unnecessarily restrictive.
// MAX_EDIT_FILE_SIZE 文件数据保存`GiB`，供工具调用后续处理使用。
const MAX_EDIT_FILE_SIZE = 1024 * 1024 * 1024 // 1 GiB (stat bytes)

// FileEditTool 文件数据构建`buildTool`，供工具调用后续处理使用。
export const FileEditTool = buildTool({
  name: FILE_EDIT_TOOL_NAME,
  searchHint: 'modify file contents in place',
  maxResultSizeChars: 100_000,
  strict: true,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'A tool for editing files'`，作为工具调用这次计算的结果。
    return 'A tool for editing files'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getEditToolDescription()`，作为工具调用这次计算的结果。
    return getEditToolDescription()
  },
  userFacingName,
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Editing ${summary}` : 'Editing file'`，作为工具调用这次计算的结果。
    return summary ? `Editing ${summary}` : 'Editing file'
  },
  // 工具实现 File Edit Tool在这里处理 `get inputSchema() {`，完成这一小步状态转换。
  get inputSchema() {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 File Edit Tool在这里处理 `get outputSchema() {`，完成这一小步状态转换。
  get outputSchema() {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 ``${input.file_path}: ${input.new_string}``，作为工具调用这次计算的结果。
    return `${input.file_path}: ${input.new_string}`
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
      FileEditTool,
      input,
      appState.toolPermissionContext,
    )
  },
  renderToolUseMessage,
  renderToolResultMessage,
  renderToolUseRejectedMessage,
  renderToolUseErrorMessage,
  // validateInput 使用 input: FileEditInput, toolUseContext: ToolUseCont… 完成工具调用里的对应操作。
  async validateInput(input: FileEditInput, toolUseContext: ToolUseContext) {
    // 从 `input` 解构 file_path、old_string、new_string、replace_all = false，减少工具实现 File Edit Tool对同一对象的重复访问。
    const { file_path, old_string, new_string, replace_all = false } = input
    // Use expandPath for consistent path normalization (especially on Windows
    // where "/" vs "\" can cause readFileState lookup mismatches)
    // fullFilePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullFilePath = expandPath(file_path)

    // Reject edits to team memory files that introduce secrets
    // secretError 错误信息读取`checkTeamMemSecrets`，供工具调用后续处理使用。
    const secretError = checkTeamMemSecrets(fullFilePath, new_string)
    // 满足 `secretError` 时，工具调用执行该分支。
    if (secretError) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: false, message: secretError, errorCode: 0 }
    }
    // 满足 `old_string === new_string` 时，工具调用执行该分支。
    if (old_string === new_string) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        behavior: 'ask',
        message:
          'No changes to make: old_string and new_string are exactly the same.',
        errorCode: 1,
      }
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
        behavior: 'ask',
        message:
          'File is in a directory that is denied by your permission settings.',
        errorCode: 2,
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

    // Prevent OOM on multi-GB files.
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 从 `await fs.stat(fullFilePath)` 解构 size，减少工具实现 File Edit Tool对同一对象的重复访问。
      const { size } = await fs.stat(fullFilePath)
      // 满足 `size > MAX_EDIT_FILE_SIZE` 时，工具调用执行该分支。
      if (size > MAX_EDIT_FILE_SIZE) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          behavior: 'ask',
          message: `File is too large to edit (${formatFileSize(size)}). Maximum editable file size is ${formatFileSize(MAX_EDIT_FILE_SIZE)}.`,
          errorCode: 10,
        }
      }
    } catch (e) {
      // 满足 `!isENOENT(e)` 时，工具调用执行该分支。
      if (!isENOENT(e)) {
        // 抛出 e，阻止工具调用在无效状态下继续运行。
        throw e
      }
    }

    // Read the file as bytes first so we can detect encoding from the buffer
    // instead of calling detectFileEncoding (which does its own sync readSync
    // and would fail with a wasted ENOENT when the file doesn't exist).
    // fileContent 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let fileContent: string | null
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // fileBuffer 文件数据读取`fs.readFileBytes`，供工具调用后续处理使用。
      const fileBuffer = await fs.readFileBytes(fullFilePath)
      // encoding 先占位，稍后的条件分支会根据实际输入补齐它。
      const encoding: BufferEncoding =
        fileBuffer.length >= 2 &&
        fileBuffer[0] === 0xff &&
        fileBuffer[1] === 0xfe
          ? 'utf16le'
          : 'utf8'
      // fileContent 文件数据更新为 `fileBuffer.toString(encoding).replaceAll('\r\n', '\n')`，确保工具调用后续读取最新状态。
      fileContent = fileBuffer.toString(encoding).replaceAll('\r\n', '\n')
    } catch (e) {
      // 满足 `isENOENT(e)` 时，工具调用执行该分支。
      if (isENOENT(e)) {
        // fileContent 文件数据更新为 `null`，确保工具调用后续读取最新状态。
        fileContent = null
      } else {
        // 抛出 e，阻止工具调用在无效状态下继续运行。
        throw e
      }
    }

    // File doesn't exist
    // 满足 `fileContent === null` 时，工具调用执行该分支。
    if (fileContent === null) {
      // Empty old_string on nonexistent file means new file creation — valid
      // 满足 `old_string === ''` 时，工具调用执行该分支。
      if (old_string === '') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { result: true }
      }
      // Try to find a similar file with a different extension
      // similarFilename 文件数据筛选`findSimilarFile`，供工具调用后续处理使用。
      const similarFilename = findSimilarFile(fullFilePath)
      // cwdSuggestion保存`suggestPathUnderCwd`，供工具调用后续处理使用。
      const cwdSuggestion = await suggestPathUnderCwd(fullFilePath)
      // 消息读取`getCwd`，供工具调用后续处理使用。
      let message = `File does not exist. ${FILE_NOT_FOUND_CWD_NOTE} ${getCwd()}.`

      // 满足 `cwdSuggestion` 时，工具调用执行该分支。
      if (cwdSuggestion) {
        // 工具实现 File Edit Tool在这里处理 `message += ` Did you mean ${cwdSuggestion}?``，完成这一小步状态转换。
        message += ` Did you mean ${cwdSuggestion}?`
      // 工具实现 File Edit Tool在这里处理 `} else if (similarFilename) {`，完成这一小步状态转换。
      } else if (similarFilename) {
        // 工具实现 File Edit Tool在这里处理 `message += ` Did you mean ${similarFilename}?``，完成这一小步状态转换。
        message += ` Did you mean ${similarFilename}?`
      }

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        behavior: 'ask',
        message,
        errorCode: 4,
      }
    }

    // File exists with empty old_string — only valid if file is empty
    // 满足 `old_string === ''` 时，工具调用执行该分支。
    if (old_string === '') {
      // Only reject if the file has content (for file creation attempt)
      // `fileContent.trim()` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
      if (fileContent.trim() !== '') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          behavior: 'ask',
          message: 'Cannot create new file - file already exists.',
          errorCode: 3,
        }
      }

      // Empty file with empty old_string is valid - we're replacing empty with content
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: true,
      }
    }

    // 满足 `fullFilePath.endsWith('.ipynb')` 时，工具调用执行该分支。
    if (fullFilePath.endsWith('.ipynb')) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        behavior: 'ask',
        message: `File is a Jupyter Notebook. Use the ${NOTEBOOK_EDIT_TOOL_NAME} to edit this file.`,
        errorCode: 5,
      }
    }

    // readTimestamp读取`readFileState.get`，供工具调用后续处理使用。
    const readTimestamp = toolUseContext.readFileState.get(fullFilePath)
    // 只有 `!readTimestamp || readTimestamp.isPartialView` 满足时，工具调用才执行该分支。
    if (!readTimestamp || readTimestamp.isPartialView) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        behavior: 'ask',
        message:
          'File has not been read yet. Read it first before writing to it.',
        meta: {
          isFilePathAbsolute: String(isAbsolute(file_path)),
        },
        errorCode: 6,
      }
    }

    // Check if file exists and get its last modified time
    // 满足 `readTimestamp` 时，工具调用执行该分支。
    if (readTimestamp) {
      // lastWriteTime读取`getFileModificationTime`，供工具调用后续处理使用。
      const lastWriteTime = getFileModificationTime(fullFilePath)
      // 满足 `lastWriteTime > readTimestamp.timestamp` 时，工具调用执行该分支。
      if (lastWriteTime > readTimestamp.timestamp) {
        // Timestamp indicates modification, but on Windows timestamps can change
        // without content changes (cloud sync, antivirus, etc.). For full reads,
        // compare content as a fallback to avoid false positives.
        // isFullRead 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isFullRead =
          readTimestamp.offset === undefined &&
          readTimestamp.limit === undefined
        // 只有 `isFullRead && fileContent === readTimestamp.conte` 满足时，工具调用才执行该分支。
        if (isFullRead && fileContent === readTimestamp.content) {
          // Content unchanged, safe to proceed
        } else {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            behavior: 'ask',
            message:
              'File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.',
            errorCode: 7,
          }
        }
      }
    }

    // file 文件数据保存`fileContent`，供工具实现 File Edit Tool后续判断或输出使用。
    const file = fileContent

    // Use findActualString to handle quote normalization
    // actualOldString筛选`findActualString`，供工具调用后续处理使用。
    const actualOldString = findActualString(file, old_string)
    // actualOldString缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!actualOldString) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        behavior: 'ask',
        message: `String to replace not found in file.\nString: ${old_string}`,
        meta: {
          isFilePathAbsolute: String(isAbsolute(file_path)),
        },
        errorCode: 8,
      }
    }

    // matches 集合格式化`file.split`，供工具调用后续处理使用。
    const matches = file.split(actualOldString).length - 1

    // Check if we have multiple matches but replace_all is false
    // 只有 `matches > 1 && !replace_all` 满足时，工具调用才执行该分支。
    if (matches > 1 && !replace_all) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        behavior: 'ask',
        message: `Found ${matches} matches of the string to replace, but replace_all is false. To replace all occurrences, set replace_all to true. To replace only one occurrence, please provide more context to uniquely identify the instance.\nString: ${old_string}`,
        meta: {
          isFilePathAbsolute: String(isAbsolute(file_path)),
          actualOldString,
        },
        errorCode: 9,
      }
    }

    // Additional validation for Claude settings files
    // settingsValidationResult读取`validateInputForSettingsFileEdit`，供工具调用后续处理使用。
    const settingsValidationResult = validateInputForSettingsFileEdit(
      fullFilePath,
      file,
      // 这个回调绑定到 () => {，负责工具调用在该局部场景下的响应。
      () => {
        // Simulate the edit to get the final content using the exact same logic as the tool
        // 返回 `replace_all`，作为工具调用这次计算的结果。
        return replace_all
          ? file.replaceAll(actualOldString, new_string)
          : file.replace(actualOldString, new_string)
      },
    )

    // `settingsValidationResult` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (settingsValidationResult !== null) {
      // 返回 `settingsValidationResult`，作为工具调用这次计算的结果。
      return settingsValidationResult
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true, meta: { actualOldString } }
  },
  // inputsEquivalent 使用 input1, input2 完成工具调用里的对应操作。
  inputsEquivalent(input1, input2) {
    // 返回 `areFileEditsInputsEquivalent(`，作为工具调用这次计算的结果。
    return areFileEditsInputsEquivalent(
      {
        file_path: input1.file_path,
        edits: [
          {
            old_string: input1.old_string,
            new_string: input1.new_string,
            replace_all: input1.replace_all ?? false,
          },
        ],
      },
      {
        file_path: input2.file_path,
        edits: [
          {
            old_string: input2.old_string,
            new_string: input2.new_string,
            replace_all: input2.replace_all ?? false,
          },
        ],
      },
    )
  },
  // 工具实现 File Edit Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    input: FileEditInput,
    {
      readFileState,
      userModified,
      updateFileHistoryState,
      dynamicSkillDirTriggers,
    },
    _,
    parentMessage,
  ) {
    // 从 `input` 解构 file_path、old_string、new_string、replace_all = false，减少工具实现 File Edit Tool对同一对象的重复访问。
    const { file_path, old_string, new_string, replace_all = false } = input

    // 1. Get current state
    // fs 集合读取`getFsImplementation`，供工具调用后续处理使用。
    const fs = getFsImplementation()
    // absoluteFilePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const absoluteFilePath = expandPath(file_path)

    // Discover skills from this file's path (fire-and-forget, non-blocking)
    // Skip in simple mode - no skills available
    // cwd读取`getCwd`，供工具调用后续处理使用。
    const cwd = getCwd()
    // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)` 时，工具调用执行该分支。
    if (!isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
      // newSkillDirs 集合保存`discoverSkillDirsForPaths`，供工具调用后续处理使用。
      const newSkillDirs = await discoverSkillDirsForPaths(
        [absoluteFilePath],
        cwd,
      )
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
      activateConditionalSkillsForPaths([absoluteFilePath], cwd)
    }

    // 等待 `diagnosticTracker.beforeFileEdited(absoluteFilePath)` 完成，再继续工具实现 File Edit Tool的异步流程。
    await diagnosticTracker.beforeFileEdited(absoluteFilePath)

    // Ensure parent directory exists before the atomic read-modify-write section.
    // These awaits must stay OUTSIDE the critical section below — a yield between
    // the staleness check and writeTextContent lets concurrent edits interleave.
    // 等待 `fs.mkdir(dirname(absoluteFilePath))` 完成，再继续工具实现 File Edit Tool的异步流程。
    await fs.mkdir(dirname(absoluteFilePath))
    // 满足 `fileHistoryEnabled()` 时，工具调用执行该分支。
    if (fileHistoryEnabled()) {
      // Backup captures pre-edit content — safe to call before the staleness
      // check (idempotent v1 backup keyed on content hash; if staleness fails
      // later we just have an unused backup, not corrupt state).
      // 等待 `fileHistoryTrackEdit(` 完成，再继续工具实现 File Edit Tool的异步流程。
      await fileHistoryTrackEdit(
        updateFileHistoryState,
        absoluteFilePath,
        parentMessage.uuid,
      )
    }

    // 2. Load current state and confirm no changes since last read
    // Please avoid async operations between here and writing to disk to preserve atomicity
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      content: originalFileContents,
      fileExists,
      encoding,
      lineEndings: endings,
    } = readFileForEdit(absoluteFilePath)

    // 满足 `fileExists` 时，工具调用执行该分支。
    if (fileExists) {
      // lastWriteTime读取`getFileModificationTime`，供工具调用后续处理使用。
      const lastWriteTime = getFileModificationTime(absoluteFilePath)
      // lastRead读取`readFileState.get`，供工具调用后续处理使用。
      const lastRead = readFileState.get(absoluteFilePath)
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
        // contentUnchanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const contentUnchanged =
          isFullRead && originalFileContents === lastRead.content
        // contentUnchanged缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!contentUnchanged) {
          // 抛出 new Error(FILE_UNEXPECTEDLY_MODIFIED_ERROR)，阻止工具调用在无效状态下继续运行。
          throw new Error(FILE_UNEXPECTEDLY_MODIFIED_ERROR)
        }
      }
    }

    // 3. Use findActualString to handle quote normalization
    // actualOldString 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const actualOldString =
      findActualString(originalFileContents, old_string) || old_string

    // Preserve curly quotes in new_string when the file uses them
    // actualNewString保存`preserveQuoteStyle`，供工具调用后续处理使用。
    const actualNewString = preserveQuoteStyle(
      old_string,
      actualOldString,
      new_string,
    )

    // 4. Generate patch
    // 从 `getPatchForEdit({` 解构 patch、updatedFile，减少工具实现 File Edit Tool对同一对象的重复访问。
    const { patch, updatedFile } = getPatchForEdit({
      filePath: absoluteFilePath,
      fileContents: originalFileContents,
      oldString: actualOldString,
      newString: actualNewString,
      replaceAll: replace_all,
    })

    // 5. Write to disk
    // 调用 writeTextContent，触发工具调用此处需要的副作用。
    writeTextContent(absoluteFilePath, updatedFile, encoding, endings)

    // Notify LSP servers about file modification (didChange) and save (didSave)
    // lspManager读取`getLspServerManager`，供工具调用后续处理使用。
    const lspManager = getLspServerManager()
    // 满足 `lspManager` 时，工具调用执行该分支。
    if (lspManager) {
      // Clear previously delivered diagnostics so new ones will be shown
      // 调用 clearDeliveredDiagnosticsForFile，触发工具调用此处需要的副作用。
      clearDeliveredDiagnosticsForFile(`file://${absoluteFilePath}`)
      // didChange: Content has been modified
      // 工具实现 File Edit Tool在这里处理 `lspManager`，完成这一小步状态转换。
      lspManager
        .changeFile(absoluteFilePath, updatedFile)
        // 链式调用 catch，继续加工上一行在工具调用中产生的数据。
        .catch((err: Error) => {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `LSP: Failed to notify server of file change for ${absoluteFilePath}: ${err.message}`,
          )
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logError(err)
        })
      // didSave: File has been saved to disk (triggers diagnostics in TypeScript server)
      // 调用 lspManager.saveFile，触发工具调用此处需要的副作用。
      lspManager.saveFile(absoluteFilePath).catch((err: Error) => {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `LSP: Failed to notify server of file save for ${absoluteFilePath}: ${err.message}`,
        )
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(err)
      })
    }

    // Notify VSCode about the file change for diff view
    // 调用 notifyVscodeFileUpdated，触发工具调用此处需要的副作用。
    notifyVscodeFileUpdated(absoluteFilePath, originalFileContents, updatedFile)

    // 6. Update read timestamp, to invalidate stale writes
    // readFileState.set 写入新的状态值，使工具调用后续读取保持一致。
    readFileState.set(absoluteFilePath, {
      content: updatedFile,
      timestamp: getFileModificationTime(absoluteFilePath),
      offset: undefined,
      limit: undefined,
    })

    // 7. Log events
    // 满足 `absoluteFilePath.endsWith(`${sep}CLAUDE.md`)` 时，工具调用执行该分支。
    if (absoluteFilePath.endsWith(`${sep}CLAUDE.md`)) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_write_claudemd', {})
    }
    // 调用 countLinesChanged，触发工具调用此处需要的副作用。
    countLinesChanged(patch)

    // 调用 logFileOperation，触发工具调用此处需要的副作用。
    logFileOperation({
      operation: 'edit',
      tool: 'FileEditTool',
      filePath: absoluteFilePath,
    })

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_edit_string_lengths', {
      oldStringBytes: Buffer.byteLength(old_string, 'utf8'),
      newStringBytes: Buffer.byteLength(new_string, 'utf8'),
      replaceAll: replace_all,
    })

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
      const diff = await fetchSingleFileGitDiff(absoluteFilePath)
      // 满足 `diff` 时，工具调用执行该分支。
      if (diff) gitDiff = diff
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_use_diff_computed', {
        isEditTool: true,
        durationMs: Date.now() - startTime,
        hasDiff: !!diff,
      })
    }

    // 8. Yield result
    // data集中保存工具实现 File Edit Tool要一起传递的字段。
    const data = {
      filePath: file_path,
      oldString: actualOldString,
      newString: new_string,
      originalFile: originalFileContents,
      structuredPatch: patch,
      userModified: userModified ?? false,
      replaceAll: replace_all,
      ...(gitDiff && { gitDiff }),
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data,
    }
  },
  // mapToolResultToToolResultBlockParam 使用 data: FileEditOutput, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(data: FileEditOutput, toolUseID) {
    // 从 `data` 解构 filePath、userModified、replaceAll，减少工具实现 File Edit Tool对同一对象的重复访问。
    const { filePath, userModified, replaceAll } = data
    // modifiedNote 命名 `userModified`，让后续代码直接表达这个值的用途。
    const modifiedNote = userModified
      ? '.  The user modified your proposed changes before accepting them. '
      : ''

    // 满足 `replaceAll` 时，工具调用执行该分支。
    if (replaceAll) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: `The file ${filePath} has been updated${modifiedNote}. All occurrences were successfully replaced.`,
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `The file ${filePath} has been updated successfully${modifiedNote}.`,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, FileEditOutput>)

// --

// readFileForEdit 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readFileForEdit(absoluteFilePath: string): {
  content: string
  fileExists: boolean
  encoding: BufferEncoding
  lineEndings: LineEndingType
} {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs
    // meta读取`readFileSyncWithMetadata`，供工具调用后续处理使用。
    const meta = readFileSyncWithMetadata(absoluteFilePath)
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      content: meta.content,
      fileExists: true,
      encoding: meta.encoding,
      lineEndings: meta.lineEndings,
    }
  } catch (e) {
    // 满足 `isENOENT(e)` 时，工具调用执行该分支。
    if (isENOENT(e)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        content: '',
        fileExists: false,
        encoding: 'utf8',
        lineEndings: 'LF',
      }
    }
    // 抛出 e，阻止工具调用在无效状态下继续运行。
    throw e
  }
}
