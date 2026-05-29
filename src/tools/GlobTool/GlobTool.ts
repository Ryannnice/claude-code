// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 类型依赖 { ValidationResult } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ValidationResult } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 isENOENT 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isENOENT } from '../../utils/errors.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  FILE_NOT_FOUND_CWD_NOTE,
  suggestPathUnderCwd,
} from '../../utils/file.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 复用 glob 工具函数，把通用处理留在 ../../utils/glob.js 中维护。
import { glob } from '../../utils/glob.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 expandPath、toRelativePath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath, toRelativePath } from '../../utils/path.js'
// 复用 checkReadPermissionForTool 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { checkReadPermissionForTool } from '../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 复用 matchWildcardPattern 工具函数，把通用处理留在 ../../utils/permissions/shellRuleMatching.js 中维护。
import { matchWildcardPattern } from '../../utils/permissions/shellRuleMatching.js'
// 引入 DESCRIPTION、GLOB_TOOL_NAME，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, GLOB_TOOL_NAME } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
  userFacingName,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    pattern: z.string().describe('The glob pattern to match files against'),
    path: z
      .string()
      .optional()
      .describe(
        'The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.',
      ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    durationMs: z
      .number()
      .describe('Time taken to execute the search in milliseconds'),
    numFiles: z.number().describe('Total number of files found'),
    filenames: z
      .array(z.string())
      .describe('Array of file paths that match the pattern'),
    truncated: z
      .boolean()
      .describe('Whether results were truncated (limited to 100 files)'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// GlobTool构建`buildTool`，供工具调用后续处理使用。
export const GlobTool = buildTool({
  name: GLOB_TOOL_NAME,
  searchHint: 'find files by name pattern or wildcard',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  userFacingName,
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Finding ${summary}` : 'Finding files'`，作为工具调用这次计算的结果。
    return summary ? `Finding ${summary}` : 'Finding files'
  },
  // 工具实现 Glob Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Glob Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
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
    // 返回 `input.pattern`，作为工具调用这次计算的结果。
    return input.pattern
  },
  // isSearchOrReadCommand 用 无 判断工具调用是否满足条件。
  isSearchOrReadCommand() {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { isSearch: true, isRead: false }
  },
  // getPath 根据 { path } 读取或计算工具调用需要的结果。
  getPath({ path }): string {
    // 返回 `path ? expandPath(path) : getCwd()`，作为工具调用这次计算的结果。
    return path ? expandPath(path) : getCwd()
  },
  // preparePermissionMatcher 使用 { pattern } 完成工具调用里的对应操作。
  async preparePermissionMatcher({ pattern }) {
    // 返回 `rulePattern => matchWildcardPattern(rulePattern, pattern)`，作为工具调用这次计算的结果。
    return rulePattern => matchWildcardPattern(rulePattern, pattern)
  },
  // validateInput 使用 { path } 完成工具调用里的对应操作。
  async validateInput({ path }): Promise<ValidationResult> {
    // If path is provided, validate that it exists and is a directory
    // 满足 `path` 时，工具调用执行该分支。
    if (path) {
      // fs 集合读取`getFsImplementation`，供工具调用后续处理使用。
      const fs = getFsImplementation()
      // absolutePath 路径数据保存`expandPath`，供工具调用后续处理使用。
      const absolutePath = expandPath(path)

      // SECURITY: Skip filesystem operations for UNC paths to prevent NTLM credential leaks.
      // 只有 `absolutePath.startsWith('\\\\') || absolutePath.startsWith('//')` 满足时，工具调用才执行该分支。
      if (absolutePath.startsWith('\\\\') || absolutePath.startsWith('//')) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { result: true }
      }

      // stats 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let stats
      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // stats 集合更新为 `await fs.stat(absolutePath)`，确保工具调用后续读取最新状态。
        stats = await fs.stat(absolutePath)
      } catch (e: unknown) {
        // 满足 `isENOENT(e)` 时，工具调用执行该分支。
        if (isENOENT(e)) {
          // cwdSuggestion保存`suggestPathUnderCwd`，供工具调用后续处理使用。
          const cwdSuggestion = await suggestPathUnderCwd(absolutePath)
          // 消息读取`getCwd`，供工具调用后续处理使用。
          let message = `Directory does not exist: ${path}. ${FILE_NOT_FOUND_CWD_NOTE} ${getCwd()}.`
          // 满足 `cwdSuggestion` 时，工具调用执行该分支。
          if (cwdSuggestion) {
            // 工具实现 Glob Tool在这里处理 `message += ` Did you mean ${cwdSuggestion}?``，完成这一小步状态转换。
            message += ` Did you mean ${cwdSuggestion}?`
          }
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            message,
            errorCode: 1,
          }
        }
        // 抛出 e，阻止工具调用在无效状态下继续运行。
        throw e
      }

      // 满足 `!stats.isDirectory()` 时，工具调用执行该分支。
      if (!stats.isDirectory()) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Path is not a directory: ${path}`,
          errorCode: 2,
        }
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // checkPermissions 使用 input, context 完成工具调用里的对应操作。
  async checkPermissions(input, context): Promise<PermissionDecision> {
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // 返回 `checkReadPermissionForTool(`，作为工具调用这次计算的结果。
    return checkReadPermissionForTool(
      GlobTool,
      input,
      appState.toolPermissionContext,
    )
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  renderToolUseMessage,
  renderToolUseErrorMessage,
  renderToolResultMessage,
  // Reuses Grep's render (UI.tsx:65) — shows filenames.join. durationMs/
  // numFiles are "Found 3 files in 12ms" chrome (under-count, fine).
  // extractSearchText 使用 { filenames } 完成工具调用里的对应操作。
  extractSearchText({ filenames }) {
    // 返回 `filenames.join('\n')`，作为工具调用这次计算的结果。
    return filenames.join('\n')
  },
  // call 使用 input, { abortController, getAppState, globLimits… 完成工具调用里的对应操作。
  async call(input, { abortController, getAppState, globLimits }) {
    // start记录时间`Date.now`，供工具调用后续处理使用。
    const start = Date.now()
    // appState 状态读取`getAppState`，供工具调用后续处理使用。
    const appState = getAppState()
    // limit保存`globLimits?.maxResults ?? 100`，供后续判断或组装使用。
    const limit = globLimits?.maxResults ?? 100
    // 从 `await glob(` 解构 files、truncated，减少工具实现 Glob Tool对同一对象的重复访问。
    const { files, truncated } = await glob(
      input.pattern,
      GlobTool.getPath(input),
      { limit, offset: 0 },
      abortController.signal,
      appState.toolPermissionContext,
    )
    // Relativize paths under cwd to save tokens (same as GrepTool)
    // filenames 文件数据派生`files.map`，供工具调用后续处理使用。
    const filenames = files.map(toRelativePath)
    // output 集中保存工具实现 Glob Tool要一起传递的字段。
    const output: Output = {
      filenames,
      durationMs: Date.now() - start,
      numFiles: filenames.length,
      truncated,
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: output,
    }
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // output.filenames 文件数据为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (output.filenames.length === 0) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: 'No files found',
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: [
        ...output.filenames,
        ...(output.truncated
          ? [
              '(Results are truncated. Consider using a more specific path or pattern.)',
            ]
          : []),
      ].join('\n'),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
