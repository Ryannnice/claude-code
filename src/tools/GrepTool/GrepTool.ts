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
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 expandPath、toRelativePath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath, toRelativePath } from '../../utils/path.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  checkReadPermissionForTool,
  getFileReadIgnorePatterns,
  normalizePatternsToPath,
} from '../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 复用 matchWildcardPattern 工具函数，把通用处理留在 ../../utils/permissions/shellRuleMatching.js 中维护。
import { matchWildcardPattern } from '../../utils/permissions/shellRuleMatching.js'
// 复用 getGlobExclusionsForPluginCache 工具函数，把通用处理留在 ../../utils/plugins/orphanedPluginFilter.js 中维护。
import { getGlobExclusionsForPluginCache } from '../../utils/plugins/orphanedPluginFilter.js'
// 复用 ripGrep 工具函数，把通用处理留在 ../../utils/ripgrep.js 中维护。
import { ripGrep } from '../../utils/ripgrep.js'
// 复用 semanticBoolean 工具函数，把通用处理留在 ../../utils/semanticBoolean.js 中维护。
import { semanticBoolean } from '../../utils/semanticBoolean.js'
// 复用 semanticNumber 工具函数，把通用处理留在 ../../utils/semanticNumber.js 中维护。
import { semanticNumber } from '../../utils/semanticNumber.js'
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js'
// 引入 GREP_TOOL_NAME、getDescription，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { GREP_TOOL_NAME, getDescription } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseErrorMessage,
  renderToolUseMessage,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    pattern: z
      .string()
      .describe(
        'The regular expression pattern to search for in file contents',
      ),
    path: z
      .string()
      .optional()
      .describe(
        'File or directory to search in (rg PATH). Defaults to current working directory.',
      ),
    glob: z
      .string()
      .optional()
      .describe(
        'Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}") - maps to rg --glob',
      ),
    output_mode: z
      .enum(['content', 'files_with_matches', 'count'])
      .optional()
      .describe(
        'Output mode: "content" shows matching lines (supports -A/-B/-C context, -n line numbers, head_limit), "files_with_matches" shows file paths (supports head_limit), "count" shows match counts (supports head_limit). Defaults to "files_with_matches".',
      ),
    '-B': semanticNumber(z.number().optional()).describe(
      'Number of lines to show before each match (rg -B). Requires output_mode: "content", ignored otherwise.',
    ),
    '-A': semanticNumber(z.number().optional()).describe(
      'Number of lines to show after each match (rg -A). Requires output_mode: "content", ignored otherwise.',
    ),
    '-C': semanticNumber(z.number().optional()).describe('Alias for context.'),
    context: semanticNumber(z.number().optional()).describe(
      'Number of lines to show before and after each match (rg -C). Requires output_mode: "content", ignored otherwise.',
    ),
    '-n': semanticBoolean(z.boolean().optional()).describe(
      'Show line numbers in output (rg -n). Requires output_mode: "content", ignored otherwise. Defaults to true.',
    ),
    '-i': semanticBoolean(z.boolean().optional()).describe(
      'Case insensitive search (rg -i)',
    ),
    type: z
      .string()
      .optional()
      .describe(
        'File type to search (rg --type). Common types: js, py, rust, go, java, etc. More efficient than include for standard file types.',
      ),
    head_limit: semanticNumber(z.number().optional()).describe(
      'Limit output to first N lines/entries, equivalent to "| head -N". Works across all output modes: content (limits output lines), files_with_matches (limits file paths), count (limits count entries). Defaults to 250 when unspecified. Pass 0 for unlimited (use sparingly — large result sets waste context).',
    ),
    offset: semanticNumber(z.number().optional()).describe(
      'Skip first N lines/entries before applying head_limit, equivalent to "| tail -n +N | head -N". Works across all output modes. Defaults to 0.',
    ),
    multiline: semanticBoolean(z.boolean().optional()).describe(
      'Enable multiline mode where . matches newlines and patterns can span lines (rg -U --multiline-dotall). Default: false.',
    ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// Version control system directories to exclude from searches
// These are excluded automatically because they create noise in search results
// VCS_DIRECTORIES_TO_EXCLUDE 聚合成有序列表，保持后续遍历顺序稳定。
const VCS_DIRECTORIES_TO_EXCLUDE = [
  '.git',
  '.svn',
  '.hg',
  '.bzr',
  '.jj',
  '.sl',
] as const

// Default cap on grep results when head_limit is unspecified. Unbounded content-mode
// greps can fill up to the 20KB persist threshold (~6-24K tokens/grep-heavy session).
// 250 is generous enough for exploratory searches while preventing context bloat.
// Pass head_limit=0 explicitly for unlimited.
// DEFAULT_HEAD_LIMIT保存`250`，供后续判断或组装使用。
const DEFAULT_HEAD_LIMIT = 250

// applyHeadLimit 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyHeadLimit<T>(
  items: T[],
  limit: number | undefined,
  offset: number = 0,
): { items: T[]; appliedLimit: number | undefined } {
  // Explicit 0 = unlimited escape hatch
  // 满足 `limit === 0` 时，工具调用执行该分支。
  if (limit === 0) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { items: items.slice(offset), appliedLimit: undefined }
  }
  // effectiveLimit保存`limit ?? DEFAULT_HEAD_LIMIT`，供工具实现 Grep Tool后续判断或输出使用。
  const effectiveLimit = limit ?? DEFAULT_HEAD_LIMIT
  // sliced格式化`items.slice`，供工具调用后续处理使用。
  const sliced = items.slice(offset, offset + effectiveLimit)
  // Only report appliedLimit when truncation actually occurred, so the model
  // knows there may be more results and can paginate with offset.
  // wasTruncated 命名 `items.length - offset > effectiveLimit`，让后续代码直接表达这个值的用途。
  const wasTruncated = items.length - offset > effectiveLimit
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    items: sliced,
    appliedLimit: wasTruncated ? effectiveLimit : undefined,
  }
}

// Format limit/offset information for display in tool results.
// appliedLimit is only set when truncation actually occurred (see applyHeadLimit),
// so it may be undefined even when appliedOffset is set — build parts conditionally
// to avoid "limit: undefined" appearing in user-visible output.
// formatLimitInfo 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatLimitInfo(
  appliedLimit: number | undefined,
  appliedOffset: number | undefined,
): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // `appliedLimit` 与 `undefined) parts.push(`limit: $...` 不一致时刷新派生状态，避免使用过期结果。
  if (appliedLimit !== undefined) parts.push(`limit: ${appliedLimit}`)
  // 满足 `appliedOffset) parts.push(`offset: ${appliedOffset}`` 时，工具调用执行该分支。
  if (appliedOffset) parts.push(`offset: ${appliedOffset}`)
  // 返回 `parts.join(', ')`，作为工具调用这次计算的结果。
  return parts.join(', ')
}

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    mode: z.enum(['content', 'files_with_matches', 'count']).optional(),
    numFiles: z.number(),
    filenames: z.array(z.string()),
    content: z.string().optional(),
    numLines: z.number().optional(), // For content mode
    numMatches: z.number().optional(), // For count mode
    appliedLimit: z.number().optional(), // The limit that was applied (if any)
    appliedOffset: z.number().optional(), // The offset that was applied
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type Output = z.infer<OutputSchema>

// GrepTool构建`buildTool`，供工具调用后续处理使用。
export const GrepTool = buildTool({
  name: GREP_TOOL_NAME,
  searchHint: 'search file contents with regex (ripgrep)',
  // 20K chars - tool result persistence threshold
  maxResultSizeChars: 20_000,
  strict: true,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `getDescription()`，作为工具调用这次计算的结果。
    return getDescription()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'Search'`，作为工具调用这次计算的结果。
    return 'Search'
  },
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Searching for ${summary}` : 'Searching'`，作为工具调用这次计算的结果。
    return summary ? `Searching for ${summary}` : 'Searching'
  },
  // 工具实现 Grep Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Grep Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
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
    // 返回 `input.path ? `${input.pattern} in ${input.path}` : input.pattern`，作为工具调用这次计算的结果。
    return input.path ? `${input.pattern} in ${input.path}` : input.pattern
  },
  // isSearchOrReadCommand 用 无 判断工具调用是否满足条件。
  isSearchOrReadCommand() {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { isSearch: true, isRead: false }
  },
  // getPath 根据 { path } 读取或计算工具调用需要的结果。
  getPath({ path }): string {
    // 返回 `path || getCwd()`，作为工具调用这次计算的结果。
    return path || getCwd()
  },
  // preparePermissionMatcher 使用 { pattern } 完成工具调用里的对应操作。
  async preparePermissionMatcher({ pattern }) {
    // 返回 `rulePattern => matchWildcardPattern(rulePattern, pattern)`，作为工具调用这次计算的结果。
    return rulePattern => matchWildcardPattern(rulePattern, pattern)
  },
  // validateInput 使用 { path } 完成工具调用里的对应操作。
  async validateInput({ path }): Promise<ValidationResult> {
    // If path is provided, validate that it exists
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

      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `fs.stat(absolutePath)` 完成，再继续工具实现 Grep Tool的异步流程。
        await fs.stat(absolutePath)
      } catch (e: unknown) {
        // 满足 `isENOENT(e)` 时，工具调用执行该分支。
        if (isENOENT(e)) {
          // cwdSuggestion保存`suggestPathUnderCwd`，供工具调用后续处理使用。
          const cwdSuggestion = await suggestPathUnderCwd(absolutePath)
          // 消息读取`getCwd`，供工具调用后续处理使用。
          let message = `Path does not exist: ${path}. ${FILE_NOT_FOUND_CWD_NOTE} ${getCwd()}.`
          // 满足 `cwdSuggestion` 时，工具调用执行该分支。
          if (cwdSuggestion) {
            // 工具实现 Grep Tool在这里处理 `message += ` Did you mean ${cwdSuggestion}?``，完成这一小步状态转换。
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
      GrepTool,
      input,
      appState.toolPermissionContext,
    )
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getDescription()`，作为工具调用这次计算的结果。
    return getDescription()
  },
  renderToolUseMessage,
  renderToolUseErrorMessage,
  renderToolResultMessage,
  // SearchResultSummary shows content (mode=content) or filenames.join.
  // numFiles/numLines/numMatches are chrome ("Found 3 files") — fine to
  // skip (under-count, not phantom). Glob reuses this via UI.tsx:65.
  // extractSearchText 使用 { mode, content, filenames } 完成工具调用里的对应操作。
  extractSearchText({ mode, content, filenames }) {
    // 只有 `mode === 'content' && content` 满足时，工具调用才执行该分支。
    if (mode === 'content' && content) return content
    // 返回 `filenames.join('\n')`，作为工具调用这次计算的结果。
    return filenames.join('\n')
  },
  mapToolResultToToolResultBlockParam(
    {
      mode = 'files_with_matches',
      numFiles,
      filenames,
      content,
      numLines: _numLines,
      numMatches,
      appliedLimit,
      appliedOffset,
    },
    toolUseID,
  ) {
    // 当 `mode` 匹配 `'content'` 时，工具调用执行对应分支。
    if (mode === 'content') {
      // limitInfo格式化`formatLimitInfo`，供工具调用后续处理使用。
      const limitInfo = formatLimitInfo(appliedLimit, appliedOffset)
      // resultContent标记工具实现 Grep Tool是否启用对应路径。
      const resultContent = content || 'No matches found'
      // finalContent保存`limitInfo`，供工具实现 Grep Tool后续判断或输出使用。
      const finalContent = limitInfo
        ? `${resultContent}\n\n[Showing results with pagination = ${limitInfo}]`
        : resultContent
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: finalContent,
      }
    }

    // 当 `mode` 匹配 `'count'` 时，工具调用执行对应分支。
    if (mode === 'count') {
      // limitInfo格式化`formatLimitInfo`，供工具调用后续处理使用。
      const limitInfo = formatLimitInfo(appliedLimit, appliedOffset)
      // rawContent标记工具实现 Grep Tool是否启用对应路径。
      const rawContent = content || 'No matches found'
      // matches 集合保存`numMatches ?? 0`，供后续判断或组装使用。
      const matches = numMatches ?? 0
      // files 文件数据保存`numFiles ?? 0`，供工具实现 Grep Tool后续判断或输出使用。
      const files = numFiles ?? 0
      // summary标记工具实现 Grep Tool是否启用对应路径。
      const summary = `\n\nFound ${matches} total ${matches === 1 ? 'occurrence' : 'occurrences'} across ${files} ${files === 1 ? 'file' : 'files'}.${limitInfo ? ` with pagination = ${limitInfo}` : ''}`
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: rawContent + summary,
      }
    }

    // files_with_matches mode
    // limitInfo格式化`formatLimitInfo`，供工具调用后续处理使用。
    const limitInfo = formatLimitInfo(appliedLimit, appliedOffset)
    // 满足 `numFiles === 0` 时，工具调用执行该分支。
    if (numFiles === 0) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: 'No files found',
      }
    }
    // head_limit has already been applied in call() method, so just show all filenames
    // 结果保存`plural`，供工具调用后续处理使用。
    const result = `Found ${numFiles} ${plural(numFiles, 'file')}${limitInfo ? ` ${limitInfo}` : ''}\n${filenames.join('\n')}`
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: result,
    }
  },
  // 工具实现 Grep Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    {
      pattern,
      path,
      glob,
      type,
      output_mode = 'files_with_matches',
      '-B': context_before,
      '-A': context_after,
      '-C': context_c,
      context,
      '-n': show_line_numbers = true,
      '-i': case_insensitive = false,
      head_limit,
      offset = 0,
      multiline = false,
    },
    { abortController, getAppState },
  ) {
    // absolutePath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const absolutePath = path ? expandPath(path) : getCwd()
    // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
    const args = ['--hidden']

    // Exclude VCS directories to avoid noise from version control metadata
    // 按顺序遍历 `VCS_DIRECTORIES_TO_EXCLUDE` 中的dir，逐个交给工具调用处理。
    for (const dir of VCS_DIRECTORIES_TO_EXCLUDE) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('--glob', `!${dir}`)
    }

    // Limit line length to prevent base64/minified content from cluttering output
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--max-columns', '500')

    // Only apply multiline flags when explicitly requested
    // 满足 `multiline` 时，工具调用执行该分支。
    if (multiline) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-U', '--multiline-dotall')
    }

    // Add optional flags
    // 满足 `case_insensitive` 时，工具调用执行该分支。
    if (case_insensitive) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-i')
    }

    // Add output mode flags
    // 当 `output_mode` 匹配 `'files_with_matches'` 时，工具调用执行对应分支。
    if (output_mode === 'files_with_matches') {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-l')
    // 工具实现 Grep Tool在这里处理 `} else if (output_mode === 'count') {`，完成这一小步状态转换。
    } else if (output_mode === 'count') {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-c')
    }

    // Add line numbers if requested
    // 当 `show_line_numbers && output_mode` 匹配 `'content'` 时，工具调用执行对应分支。
    if (show_line_numbers && output_mode === 'content') {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-n')
    }

    // Add context flags (-C/context takes precedence over context_before/context_after)
    // 当 `output_mode` 匹配 `'content'` 时，工具调用执行对应分支。
    if (output_mode === 'content') {
      // `context` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (context !== undefined) {
        // 参数列表追加新条目，保持收集顺序与输入顺序一致。
        args.push('-C', context.toString())
      // 工具实现 Grep Tool在这里处理 `} else if (context_c !== undefined) {`，完成这一小步状态转换。
      } else if (context_c !== undefined) {
        // 参数列表追加新条目，保持收集顺序与输入顺序一致。
        args.push('-C', context_c.toString())
      } else {
        // `context_before` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (context_before !== undefined) {
          // 参数列表追加新条目，保持收集顺序与输入顺序一致。
          args.push('-B', context_before.toString())
        }
        // `context_after` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (context_after !== undefined) {
          // 参数列表追加新条目，保持收集顺序与输入顺序一致。
          args.push('-A', context_after.toString())
        }
      }
    }

    // If pattern starts with dash, use -e flag to specify it as a pattern
    // This prevents ripgrep from interpreting it as a command-line option
    // 满足 `pattern.startsWith('-')` 时，工具调用执行该分支。
    if (pattern.startsWith('-')) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-e', pattern)
    } else {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(pattern)
    }

    // Add type filter if specified
    // 满足 `type` 时，工具调用执行该分支。
    if (type) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('--type', type)
    }

    // 满足 `glob` 时，工具调用执行该分支。
    if (glob) {
      // Split on commas and spaces, but preserve patterns with braces
      // globPatterns 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const globPatterns: string[] = []
      // rawPatterns 集合格式化`glob.split`，供工具调用后续处理使用。
      const rawPatterns = glob.split(/\s+/)

      // 按顺序遍历 `rawPatterns` 中的rawPattern，逐个交给工具调用处理。
      for (const rawPattern of rawPatterns) {
        // If pattern contains braces, don't split further
        // 只有 `rawPattern.includes('{') && rawPattern.includes('}')` 满足时，工具调用才执行该分支。
        if (rawPattern.includes('{') && rawPattern.includes('}')) {
          // globPatterns 集合追加新条目，保持收集顺序与输入顺序一致。
          globPatterns.push(rawPattern)
        } else {
          // Split on commas for patterns without braces
          // globPatterns 集合追加新条目，保持收集顺序与输入顺序一致。
          globPatterns.push(...rawPattern.split(',').filter(Boolean))
        }
      }

      // 逐项读取 `globPatterns.filter(Boolean)` 中的globPattern，按输入顺序推进工具调用。
      for (const globPattern of globPatterns.filter(Boolean)) {
        // 参数列表追加新条目，保持收集顺序与输入顺序一致。
        args.push('--glob', globPattern)
      }
    }

    // Add ignore patterns
    // appState 状态读取`getAppState`，供工具调用后续处理使用。
    const appState = getAppState()
    // ignorePatterns 集合保存`normalizePatternsToPath`，供工具调用后续处理使用。
    const ignorePatterns = normalizePatternsToPath(
      getFileReadIgnorePatterns(appState.toolPermissionContext),
      getCwd(),
    )
    // 按顺序遍历 `ignorePatterns` 中的ignorePattern，逐个交给工具调用处理。
    for (const ignorePattern of ignorePatterns) {
      // Note: ripgrep only applies gitignore patterns relative to the working directory
      // So for non-absolute paths, we need to prefix them with '**'
      // See: https://github.com/BurntSushi/ripgrep/discussions/2156#discussioncomment-2316335
      //
      // We also need to negate the pattern with `!` to exclude it
      // rgIgnorePattern保存`ignorePattern.startsWith`，供工具调用后续处理使用。
      const rgIgnorePattern = ignorePattern.startsWith('/')
        ? `!${ignorePattern}`
        : `!**/${ignorePattern}`
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('--glob', rgIgnorePattern)
    }

    // Exclude orphaned plugin version directories
    // 调用 for，触发工具调用此处需要的副作用。
    for (const exclusion of await getGlobExclusionsForPluginCache(
      absolutePath,
    )) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('--glob', exclusion)
    }

    // WSL has severe performance penalty for file reads (3-5x slower on WSL2)
    // The timeout is handled by ripgrep itself via execFile timeout option
    // We don't use AbortController for timeout to avoid interrupting the agent loop
    // If ripgrep times out, it throws RipgrepTimeoutError which propagates up
    // so Claude knows the search didn't complete (rather than thinking there were no matches)
    // 结果列表保存`ripGrep`，供工具调用后续处理使用。
    const results = await ripGrep(args, absolutePath, abortController.signal)

    // 当 `output_mode` 匹配 `'content'` 时，工具调用执行对应分支。
    if (output_mode === 'content') {
      // For content mode, results are the actual content lines
      // Convert absolute paths to relative paths to save tokens

      // Apply head_limit first — relativize is per-line work, so
      // avoid processing lines that will be discarded (broad patterns can
      // return 10k+ lines with head_limit keeping only ~30-100).
      // 从 `applyHeadLimit(` 解构 items、appliedLimit，减少工具实现 Grep Tool对同一对象的重复访问。
      const { items: limitedResults, appliedLimit } = applyHeadLimit(
        results,
        head_limit,
        offset,
      )

      // finalLines 集合派生`limitedResults.map`，供工具调用后续处理使用。
      const finalLines = limitedResults.map(line => {
        // Lines have format: /absolute/path:line_content or /absolute/path:num:content
        // colonIndex 索引保存`line.indexOf`，供工具调用后续处理使用。
        const colonIndex = line.indexOf(':')
        // 满足 `colonIndex > 0` 时，工具调用执行该分支。
        if (colonIndex > 0) {
          // 文件路径格式化`line.substring`，供工具调用后续处理使用。
          const filePath = line.substring(0, colonIndex)
          // rest格式化`line.substring`，供工具调用后续处理使用。
          const rest = line.substring(colonIndex)
          // 返回 `toRelativePath(filePath) + rest`，作为工具调用这次计算的结果。
          return toRelativePath(filePath) + rest
        }
        // 返回 `line`，作为工具调用这次计算的结果。
        return line
      })
      // output集中保存工具实现 Grep Tool要一起传递的字段。
      const output = {
        mode: 'content' as const,
        numFiles: 0, // Not applicable for content mode
        filenames: [],
        content: finalLines.join('\n'),
        numLines: finalLines.length,
        ...(appliedLimit !== undefined && { appliedLimit }),
        ...(offset > 0 && { appliedOffset: offset }),
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { data: output }
    }

    // 当 `output_mode` 匹配 `'count'` 时，工具调用执行对应分支。
    if (output_mode === 'count') {
      // For count mode, pass through raw ripgrep output (filename:count format)
      // Apply head_limit first to avoid relativizing entries that will be discarded.
      // 从 `applyHeadLimit(` 解构 items、appliedLimit，减少工具实现 Grep Tool对同一对象的重复访问。
      const { items: limitedResults, appliedLimit } = applyHeadLimit(
        results,
        head_limit,
        offset,
      )

      // Convert absolute paths to relative paths to save tokens
      // finalCountLines 数量派生`limitedResults.map`，供工具调用后续处理使用。
      const finalCountLines = limitedResults.map(line => {
        // Lines have format: /absolute/path:count
        // colonIndex 索引保存`line.lastIndexOf`，供工具调用后续处理使用。
        const colonIndex = line.lastIndexOf(':')
        // 满足 `colonIndex > 0` 时，工具调用执行该分支。
        if (colonIndex > 0) {
          // 文件路径格式化`line.substring`，供工具调用后续处理使用。
          const filePath = line.substring(0, colonIndex)
          // 计数格式化`line.substring`，供工具调用后续处理使用。
          const count = line.substring(colonIndex)
          // 返回 `toRelativePath(filePath) + count`，作为工具调用这次计算的结果。
          return toRelativePath(filePath) + count
        }
        // 返回 `line`，作为工具调用这次计算的结果。
        return line
      })

      // Parse count output to extract total matches and file count
      // totalMatches 集合保存`0`，供后续判断或组装使用。
      let totalMatches = 0
      // fileCount 文件数据 命名 `0`，让后续代码直接表达这个值的用途。
      let fileCount = 0
      // 按顺序遍历 `finalCountLines` 中的line，逐个交给工具调用处理。
      for (const line of finalCountLines) {
        // colonIndex 索引保存`line.lastIndexOf`，供工具调用后续处理使用。
        const colonIndex = line.lastIndexOf(':')
        // 满足 `colonIndex > 0` 时，工具调用执行该分支。
        if (colonIndex > 0) {
          // countStr 数量格式化`line.substring`，供工具调用后续处理使用。
          const countStr = line.substring(colonIndex + 1)
          // 计数解析`parseInt`，供工具调用后续处理使用。
          const count = parseInt(countStr, 10)
          // 满足 `!isNaN(count)` 时，工具调用执行该分支。
          if (!isNaN(count)) {
            // 工具实现 Grep Tool在这里处理 `totalMatches += count`，完成这一小步状态转换。
            totalMatches += count
            // 工具实现 Grep Tool在这里处理 `fileCount += 1`，完成这一小步状态转换。
            fileCount += 1
          }
        }
      }

      // output集中保存工具实现 Grep Tool要一起传递的字段。
      const output = {
        mode: 'count' as const,
        numFiles: fileCount,
        filenames: [],
        content: finalCountLines.join('\n'),
        numMatches: totalMatches,
        ...(appliedLimit !== undefined && { appliedLimit }),
        ...(offset > 0 && { appliedOffset: offset }),
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { data: output }
    }

    // For files_with_matches mode (default)
    // Use allSettled so a single ENOENT (file deleted between ripgrep's scan
    // and this stat) does not reject the whole batch. Failed stats sort as mtime 0.
    // stats 集合保存`Promise.allSettled`，供工具调用后续处理使用。
    const stats = await Promise.allSettled(
      // 调用 results.map，触发工具调用此处需要的副作用。
      results.map(_ => getFsImplementation().stat(_)),
    )
    // sortedMatches 集合保存`results`，供后续判断或组装使用。
    const sortedMatches = results
      // Sort by modification time
      // 链式调用 map，继续加工上一行在工具调用中产生的数据。
      .map((_, i) => {
        // r 命名 `stats[i]!`，让后续代码直接表达这个值的用途。
        const r = stats[i]!
        // 返回列表结果，保留工具调用已经排好的条目顺序。
        return [
          _,
          r.status === 'fulfilled' ? (r.value.mtimeMs ?? 0) : 0,
        ] as const
      })
      // 链式调用 sort，继续加工上一行在工具调用中产生的数据。
      .sort((a, b) => {
        // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，工具调用执行对应分支。
        if (process.env.NODE_ENV === 'test') {
          // In tests, we always want to sort by filename, so that results are deterministic
          // 返回 `a[0].localeCompare(b[0])`，作为工具调用这次计算的结果。
          return a[0].localeCompare(b[0])
        }
        // timeComparison保存`b[1] - a[1]`，供工具实现 Grep Tool后续判断或输出使用。
        const timeComparison = b[1] - a[1]
        // 满足 `timeComparison === 0` 时，工具调用执行该分支。
        if (timeComparison === 0) {
          // Sort by filename as a tiebreaker
          // 返回 `a[0].localeCompare(b[0])`，作为工具调用这次计算的结果。
          return a[0].localeCompare(b[0])
        }
        // 返回 `timeComparison`，作为工具调用这次计算的结果。
        return timeComparison
      })
      // 链式调用 map，继续加工上一行在工具调用中产生的数据。
      .map(_ => _[0])

    // Apply head_limit to sorted file list (like "| head -N")
    // 从 `applyHeadLimit(` 解构 items、appliedLimit，减少工具实现 Grep Tool对同一对象的重复访问。
    const { items: finalMatches, appliedLimit } = applyHeadLimit(
      sortedMatches,
      head_limit,
      offset,
    )

    // Convert absolute paths to relative paths to save tokens
    // relativeMatches 集合派生`finalMatches.map`，供工具调用后续处理使用。
    const relativeMatches = finalMatches.map(toRelativePath)

    // output集中保存工具实现 Grep Tool要一起传递的字段。
    const output = {
      mode: 'files_with_matches' as const,
      filenames: relativeMatches,
      numFiles: relativeMatches.length,
      ...(appliedLimit !== undefined && { appliedLimit }),
      ...(offset > 0 && { appliedOffset: offset }),
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: output,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
