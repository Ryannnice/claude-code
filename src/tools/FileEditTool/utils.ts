// 引入 StructuredPatchHunk、structuredPatch，将 diff 中已经封装好的能力接到本文件流程里。
import { type StructuredPatchHunk, structuredPatch } from 'diff'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 复用 expandPath 工具函数，把通用处理留在 src/utils/path.js 中维护。
import { expandPath } from 'src/utils/path.js'
// 复用 countCharInString 工具函数，把通用处理留在 src/utils/stringUtils.js 中维护。
import { countCharInString } from 'src/utils/stringUtils.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  DIFF_TIMEOUT_MS,
  getPatchForDisplay,
  getPatchFromContents,
} from '../../utils/diff.js'
// 复用 errorMessage、isENOENT 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage, isENOENT } from '../../utils/errors.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  addLineNumbers,
  convertLeadingTabsToSpaces,
  readFileSyncCached,
} from '../../utils/file.js'
// 类型依赖 { EditInput, FileEdit } 来自 ./types.js，用于校准工具调用的数据契约。
import type { EditInput, FileEdit } from './types.js'

// Claude can't output curly quotes, so we define them as constants here for Claude to use
// in the code. We do this because we normalize curly quotes to straight quotes
// when applying edits.
// LEFT_SINGLE_CURLY_QUOTE固定为 `'‘'`，作为工具实现 utils后续展示或比较的基准。
export const LEFT_SINGLE_CURLY_QUOTE = '‘'
// RIGHT_SINGLE_CURLY_QUOTE 命名 `'’'`，让后续代码直接表达这个值的用途。
export const RIGHT_SINGLE_CURLY_QUOTE = '’'
// LEFT_DOUBLE_CURLY_QUOTE 命名 `'“'`，让后续代码直接表达这个值的用途。
export const LEFT_DOUBLE_CURLY_QUOTE = '“'
// RIGHT_DOUBLE_CURLY_QUOTE固定为 `'”'`，作为工具实现 utils后续展示或比较的基准。
export const RIGHT_DOUBLE_CURLY_QUOTE = '”'

/**
 * Normalizes quotes in a string by converting curly quotes to straight quotes
 * @param str The string to normalize
 * @returns The string with all curly quotes replaced by straight quotes
 */
// normalizeQuotes 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeQuotes(str: string): string {
  // 返回 `str`，作为工具调用这次计算的结果。
  return str
    .replaceAll(LEFT_SINGLE_CURLY_QUOTE, "'")
    .replaceAll(RIGHT_SINGLE_CURLY_QUOTE, "'")
    .replaceAll(LEFT_DOUBLE_CURLY_QUOTE, '"')
    .replaceAll(RIGHT_DOUBLE_CURLY_QUOTE, '"')
}

/**
 * Strips trailing whitespace from each line in a string while preserving line endings
 * @param str The string to process
 * @returns The string with trailing whitespace removed from each line
 */
// stripTrailingWhitespace 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripTrailingWhitespace(str: string): string {
  // Handle different line endings: CRLF, LF, CR
  // Use a regex that matches line endings and captures them
  // 文本行格式化`str.split`，供工具调用后续处理使用。
  const lines = str.split(/(\r\n|\n|\r)/)

  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''
  // 按索引扫描 `lines.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < lines.length; i++) {
    // part保存`lines[i]`，供工具实现 utils后续判断或输出使用。
    const part = lines[i]
    // `part` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (part !== undefined) {
      // 满足 `i % 2 === 0` 时，工具调用执行该分支。
      if (i % 2 === 0) {
        // Even indices are line content
        // 工具实现 utils在这里处理 `result += part.replace(/\s+$/, '')`，完成这一小步状态转换。
        result += part.replace(/\s+$/, '')
      } else {
        // Odd indices are line endings
        // 工具实现 utils在这里处理 `result += part`，完成这一小步状态转换。
        result += part
      }
    }
  }

  // 返回 `result`，作为工具调用这次计算的结果。
  return result
}

/**
 * Finds the actual string in the file content that matches the search string,
 * accounting for quote normalization
 * @param fileContent The file content to search in
 * @param searchString The string to search for
 * @returns The actual string found in the file, or null if not found
 */
// findActualString 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findActualString(
  fileContent: string,
  searchString: string,
): string | null {
  // First try exact match
  // 满足 `fileContent.includes(searchString)` 时，工具调用执行该分支。
  if (fileContent.includes(searchString)) {
    // 返回 `searchString`，作为工具调用这次计算的结果。
    return searchString
  }

  // Try with normalized quotes
  // normalizedSearch保存`normalizeQuotes`，供工具调用后续处理使用。
  const normalizedSearch = normalizeQuotes(searchString)
  // normalizedFile 文件数据保存`normalizeQuotes`，供工具调用后续处理使用。
  const normalizedFile = normalizeQuotes(fileContent)

  // searchIndex 索引保存`normalizedFile.indexOf`，供工具调用后续处理使用。
  const searchIndex = normalizedFile.indexOf(normalizedSearch)
  // `searchIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (searchIndex !== -1) {
    // Find the actual string in the file that matches
    // 返回 `fileContent.substring(searchIndex, searchIndex + searchString.length)`，作为工具调用这次计算的结果。
    return fileContent.substring(searchIndex, searchIndex + searchString.length)
  }

  // 返回 `null`，作为工具调用这次计算的结果。
  return null
}

/**
 * When old_string matched via quote normalization (curly quotes in file,
 * straight quotes from model), apply the same curly quote style to new_string
 * so the edit preserves the file's typography.
 *
 * Uses a simple open/close heuristic: a quote character preceded by whitespace,
 * start of string, or opening punctuation is treated as an opening quote;
 * otherwise it's a closing quote.
 */
// preserveQuoteStyle 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function preserveQuoteStyle(
  oldString: string,
  actualOldString: string,
  newString: string,
): string {
  // If they're the same, no normalization happened
  // 满足 `oldString === actualOldString` 时，工具调用执行该分支。
  if (oldString === actualOldString) {
    // 返回 `newString`，作为工具调用这次计算的结果。
    return newString
  }

  // Detect which curly quote types were in the file
  // hasDoubleQuotes 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasDoubleQuotes =
    actualOldString.includes(LEFT_DOUBLE_CURLY_QUOTE) ||
    actualOldString.includes(RIGHT_DOUBLE_CURLY_QUOTE)
  // hasSingleQuotes 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasSingleQuotes =
    actualOldString.includes(LEFT_SINGLE_CURLY_QUOTE) ||
    actualOldString.includes(RIGHT_SINGLE_CURLY_QUOTE)

  // 只有 `!hasDoubleQuotes && !hasSingleQuotes` 满足时，工具调用才执行该分支。
  if (!hasDoubleQuotes && !hasSingleQuotes) {
    // 返回 `newString`，作为工具调用这次计算的结果。
    return newString
  }

  // 结果 命名 `newString`，让后续代码直接表达这个值的用途。
  let result = newString

  // 满足 `hasDoubleQuotes` 时，工具调用执行该分支。
  if (hasDoubleQuotes) {
    // 结果更新为 `applyCurlyDoubleQuotes(result)`，确保工具调用后续读取最新状态。
    result = applyCurlyDoubleQuotes(result)
  }
  // 满足 `hasSingleQuotes` 时，工具调用执行该分支。
  if (hasSingleQuotes) {
    // 结果更新为 `applyCurlySingleQuotes(result)`，确保工具调用后续读取最新状态。
    result = applyCurlySingleQuotes(result)
  }

  // 返回 `result`，作为工具调用这次计算的结果。
  return result
}

// isOpeningContext 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isOpeningContext(chars: string[], index: number): boolean {
  // 满足 `index === 0` 时，工具调用执行该分支。
  if (index === 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // prev 命名 `chars[index - 1]`，让后续代码直接表达这个值的用途。
  const prev = chars[index - 1]
  // 返回 `(`，作为工具调用这次计算的结果。
  return (
    prev === ' ' ||
    prev === '\t' ||
    prev === '\n' ||
    prev === '\r' ||
    prev === '(' ||
    prev === '[' ||
    prev === '{' ||
    prev === '\u2014' || // em dash
    prev === '\u2013' // en dash
  )
}

// applyCurlyDoubleQuotes 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyCurlyDoubleQuotes(str: string): string {
  // chars 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const chars = [...str]
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: string[] = []
  // 按索引扫描 `chars.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < chars.length; i++) {
    // 当 `chars[i]` 匹配 `'"'` 时，工具调用执行对应分支。
    if (chars[i] === '"') {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(
        isOpeningContext(chars, i)
          ? LEFT_DOUBLE_CURLY_QUOTE
          : RIGHT_DOUBLE_CURLY_QUOTE,
      )
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(chars[i]!)
    }
  }
  // 返回 `result.join('')`，作为工具调用这次计算的结果。
  return result.join('')
}

// applyCurlySingleQuotes 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyCurlySingleQuotes(str: string): string {
  // chars 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const chars = [...str]
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: string[] = []
  // 按索引扫描 `chars.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < chars.length; i++) {
    // 当 `chars[i]` 匹配 `"'"` 时，工具调用执行对应分支。
    if (chars[i] === "'") {
      // Don't convert apostrophes in contractions (e.g., "don't", "it's")
      // An apostrophe between two letters is a contraction, not a quote
      // prev读取 `i > 0 ? chars[i - 1] : undefined` 对应条目，后续围绕该成员继续处理。
      const prev = i > 0 ? chars[i - 1] : undefined
      // next记录 `i < chars.length - 1 ? chars[i + 1] : undefined` 是否成立，下一步按该结果分支。
      const next = i < chars.length - 1 ? chars[i + 1] : undefined
      // prevIsLetter保存`u.test`，供工具调用后续处理使用。
      const prevIsLetter = prev !== undefined && /\p{L}/u.test(prev)
      // nextIsLetter保存`u.test`，供工具调用后续处理使用。
      const nextIsLetter = next !== undefined && /\p{L}/u.test(next)
      // 只有 `prevIsLetter && nextIsLetter` 满足时，工具调用才执行该分支。
      if (prevIsLetter && nextIsLetter) {
        // Apostrophe in a contraction — use right single curly quote
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(RIGHT_SINGLE_CURLY_QUOTE)
      } else {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push(
          isOpeningContext(chars, i)
            ? LEFT_SINGLE_CURLY_QUOTE
            : RIGHT_SINGLE_CURLY_QUOTE,
        )
      }
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(chars[i]!)
    }
  }
  // 返回 `result.join('')`，作为工具调用这次计算的结果。
  return result.join('')
}

/**
 * Transform edits to ensure replace_all always has a boolean value
 * @param edits Array of edits with optional replace_all
 * @returns Array of edits with replace_all guaranteed to be boolean
 */
// applyEditToFile 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyEditToFile(
  originalContent: string,
  oldString: string,
  newString: string,
  replaceAll: boolean = false,
): string {
  // f格式化`replaceAll` 整理出中间结果，供工具实现 utils后续步骤使用。
  const f = replaceAll
    // 这个回调绑定到 ? (content: string, search: string, replace: string) =>，负责工具调用在该局部场景下的响应。
    ? (content: string, search: string, replace: string) =>
        // 调用 content.replaceAll，触发工具调用此处需要的副作用。
        content.replaceAll(search, () => replace)
    // 这个回调绑定到 : (content: string, search: string, replace: string) =>，负责工具调用在该局部场景下的响应。
    : (content: string, search: string, replace: string) =>
        // 调用 content.replace，触发工具调用此处需要的副作用。
        content.replace(search, () => replace)

  // `newString` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
  if (newString !== '') {
    // 返回 `f(originalContent, oldString, newString)`，作为工具调用这次计算的结果。
    return f(originalContent, oldString, newString)
  }

  // stripTrailingNewline 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const stripTrailingNewline =
    !oldString.endsWith('\n') && originalContent.includes(oldString + '\n')

  // 返回 `stripTrailingNewline`，作为工具调用这次计算的结果。
  return stripTrailingNewline
    ? f(originalContent, oldString + '\n', newString)
    : f(originalContent, oldString, newString)
}

/**
 * Applies an edit to a file and returns the patch and updated file.
 * Does not write the file to disk.
 */
// getPatchForEdit 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPatchForEdit({
  filePath,
  fileContents,
  oldString,
  newString,
  replaceAll = false,
}: {
  filePath: string
  fileContents: string
  oldString: string
  newString: string
  replaceAll?: boolean
}): { patch: StructuredPatchHunk[]; updatedFile: string } {
  // 返回 `getPatchForEdits({`，作为工具调用这次计算的结果。
  return getPatchForEdits({
    filePath,
    fileContents,
    edits: [
      { old_string: oldString, new_string: newString, replace_all: replaceAll },
    ],
  })
}

/**
 * Applies a list of edits to a file and returns the patch and updated file.
 * Does not write the file to disk.
 *
 * NOTE: The returned patch is to be used for display purposes only - it has spaces instead of tabs
 */
// getPatchForEdits 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPatchForEdits({
  filePath,
  fileContents,
  edits,
}: {
  filePath: string
  fileContents: string
  edits: FileEdit[]
}): { patch: StructuredPatchHunk[]; updatedFile: string } {
  // updatedFile 文件数据 命名 `fileContents`，让后续代码直接表达这个值的用途。
  let updatedFile = fileContents
  // appliedNewStrings 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const appliedNewStrings: string[] = []

  // Special case for empty files.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    !fileContents &&
    edits.length === 1 &&
    edits[0] &&
    edits[0].old_string === '' &&
    edits[0].new_string === ''
  ) {
    // patch读取`getPatchForDisplay`，供工具调用后续处理使用。
    const patch = getPatchForDisplay({
      filePath,
      fileContents,
      edits: [
        {
          old_string: fileContents,
          new_string: updatedFile,
          replace_all: false,
        },
      ],
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { patch, updatedFile: '' }
  }

  // Apply each edit and check if it actually changes the file
  // 按顺序遍历 `edits` 中的edit，逐个交给工具调用处理。
  for (const edit of edits) {
    // Strip trailing newlines from old_string before checking
    // oldStringToCheck格式化`old_string.replace`，供工具调用后续处理使用。
    const oldStringToCheck = edit.old_string.replace(/\n+$/, '')

    // Check if old_string is a substring of any previously applied new_string
    // 按顺序遍历 `appliedNewStrings` 中的previousNewString，逐个交给工具调用处理。
    for (const previousNewString of appliedNewStrings) {
      // 工具调用在这里按实际状态进入对应分支。
      if (
        oldStringToCheck !== '' &&
        previousNewString.includes(oldStringToCheck)
      ) {
        // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
        throw new Error(
          'Cannot edit file: old_string is a substring of a new_string from a previous edit.',
        )
      }
    }

    // previousContent保存`updatedFile`，供后续判断或组装使用。
    const previousContent = updatedFile
    // 工具实现 utils在这里处理 `updatedFile =`，完成这一小步状态转换。
    updatedFile =
      edit.old_string === ''
        ? edit.new_string
        : applyEditToFile(
            updatedFile,
            edit.old_string,
            edit.new_string,
            edit.replace_all,
          )

    // If this edit didn't change anything, throw an error
    // 满足 `updatedFile === previousContent` 时，工具调用执行该分支。
    if (updatedFile === previousContent) {
      // 抛出 new Error('String not found in file. Failed to apply edit.')，阻止工具调用在无效状态下继续运行。
      throw new Error('String not found in file. Failed to apply edit.')
    }

    // Track the new string that was applied
    // appliedNewStrings 集合追加新条目，保持收集顺序与输入顺序一致。
    appliedNewStrings.push(edit.new_string)
  }

  // 满足 `updatedFile === fileContents` 时，工具调用执行该分支。
  if (updatedFile === fileContents) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'Original and edited file match exactly. Failed to apply edit.',
    )
  }

  // We already have before/after content, so call getPatchFromContents directly.
  // Previously this went through getPatchForDisplay with edits=[{old:fileContents,new:updatedFile}],
  // which transforms fileContents twice (once as preparedFileContents, again as escapedOldString
  // inside the reduce) and runs a no-op full-content .replace(). This saves ~20% on large files.
  // patch读取`getPatchFromContents`，供工具调用后续处理使用。
  const patch = getPatchFromContents({
    filePath,
    oldContent: convertLeadingTabsToSpaces(fileContents),
    newContent: convertLeadingTabsToSpaces(updatedFile),
  })

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { patch, updatedFile }
}

// Cap on edited_text_file attachment snippets. Format-on-save of a large file
// previously injected the entire file per turn (observed max 16.1KB, ~14K
// tokens/session). 8KB preserves meaningful context while bounding worst case.
// DIFF_SNIPPET_MAX_BYTES 集合保存`8192`，供后续判断或组装使用。
const DIFF_SNIPPET_MAX_BYTES = 8192

/**
 * Used for attachments, to show snippets when files change.
 *
 * TODO: Unify this with the other snippet logic.
 */
// getSnippetForTwoFileDiff 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSnippetForTwoFileDiff(
  fileAContents: string,
  fileBContents: string,
): string {
  // patch保存`structuredPatch`，供工具调用后续处理使用。
  const patch = structuredPatch(
    'file.txt',
    'file.txt',
    fileAContents,
    fileBContents,
    undefined,
    undefined,
    {
      context: 8,
      timeout: DIFF_TIMEOUT_MS,
    },
  )

  // patch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!patch) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // full保存`patch.hunks`，供工具实现 utils后续判断或输出使用。
  const full = patch.hunks
    // 链式调用 map，继续加工上一行在工具调用中产生的数据。
    .map(_ => ({
      startLine: _.oldStart,
      content: _.lines
        // Filter out deleted lines AND diff metadata lines
        // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
        .filter(_ => !_.startsWith('-') && !_.startsWith('\\'))
        // 链式调用 map，继续加工上一行在工具调用中产生的数据。
        .map(_ => _.slice(1))
        .join('\n'),
    }))
    .map(addLineNumbers)
    .join('\n...\n')

  // 满足 `full.length <= DIFF_SNIPPET_MAX_BYTES` 时，工具调用执行该分支。
  if (full.length <= DIFF_SNIPPET_MAX_BYTES) {
    // 返回 `full`，作为工具调用这次计算的结果。
    return full
  }

  // Truncate at the last line boundary that fits within the cap.
  // Marker format matches BashTool/utils.ts.
  // cutoff保存`full.lastIndexOf`，供工具调用后续处理使用。
  const cutoff = full.lastIndexOf('\n', DIFF_SNIPPET_MAX_BYTES)
  // kept 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const kept =
    cutoff > 0 ? full.slice(0, cutoff) : full.slice(0, DIFF_SNIPPET_MAX_BYTES)
  // remaining统计`countCharInString`，供工具调用后续处理使用。
  const remaining = countCharInString(full, '\n', kept.length) + 1
  // 返回 ``${kept}\n\n... [${remaining} lines truncated] ...``，作为工具调用这次计算的结果。
  return `${kept}\n\n... [${remaining} lines truncated] ...`
}

// CONTEXT_LINES 集合保存`4`，供后续判断或组装使用。
const CONTEXT_LINES = 4

/**
 * Gets a snippet from a file showing the context around a patch with line numbers.
 * @param originalFile The original file content before applying the patch
 * @param patch The diff hunks to use for determining snippet location
 * @param newFile The file content after applying the patch
 * @returns The snippet text with line numbers and the starting line number
 */
// getSnippetForPatch 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSnippetForPatch(
  patch: StructuredPatchHunk[],
  newFile: string,
): { formattedSnippet: string; startLine: number } {
  // patch为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (patch.length === 0) {
    // No changes, return empty snippet
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { formattedSnippet: '', startLine: 1 }
  }

  // Find the first and last changed lines across all hunks
  // minLine保存`Infinity`，供后续判断或组装使用。
  let minLine = Infinity
  // maxLine 命名 `-Infinity`，让后续代码直接表达这个值的用途。
  let maxLine = -Infinity

  // 按顺序遍历 `patch` 中的hunk，逐个交给工具调用处理。
  for (const hunk of patch) {
    // 满足 `hunk.oldStart < minLine` 时，工具调用执行该分支。
    if (hunk.oldStart < minLine) {
      // minLine更新为 `hunk.oldStart`，确保工具调用后续读取最新状态。
      minLine = hunk.oldStart
    }
    // For the end line, we need to consider the new lines count since we're showing the new file
    // hunkEnd标记工具实现 utils是否启用对应路径。
    const hunkEnd = hunk.oldStart + (hunk.newLines || 0) - 1
    // 满足 `hunkEnd > maxLine` 时，工具调用执行该分支。
    if (hunkEnd > maxLine) {
      // maxLine更新为 `hunkEnd`，确保工具调用后续读取最新状态。
      maxLine = hunkEnd
    }
  }

  // Calculate the range with context
  // startLine保存`Math.max`，供工具调用后续处理使用。
  const startLine = Math.max(1, minLine - CONTEXT_LINES)
  // endLine保存`maxLine + CONTEXT_LINES`，供工具实现 utils后续判断或输出使用。
  const endLine = maxLine + CONTEXT_LINES

  // Split the new file into lines and get the snippet
  // fileLines 文件数据格式化`newFile.split`，供工具调用后续处理使用。
  const fileLines = newFile.split(/\r?\n/)
  // snippetLines 集合格式化`fileLines.slice`，供工具调用后续处理使用。
  const snippetLines = fileLines.slice(startLine - 1, endLine)
  // snippet格式化`snippetLines.join`，供工具调用后续处理使用。
  const snippet = snippetLines.join('\n')

  // Add line numbers
  // formattedSnippet保存`addLineNumbers`，供工具调用后续处理使用。
  const formattedSnippet = addLineNumbers({
    content: snippet,
    startLine,
  })

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { formattedSnippet, startLine }
}

/**
 * Gets a snippet from a file showing the context around a single edit.
 * This is a convenience function that uses the original algorithm.
 * @param originalFile The original file content
 * @param oldString The text to replace
 * @param newString The text to replace it with
 * @param contextLines The number of lines to show before and after the change
 * @returns The snippet and the starting line number
 */
// getSnippet 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSnippet(
  originalFile: string,
  oldString: string,
  newString: string,
  contextLines: number = 4,
): { snippet: string; startLine: number } {
  // Use the original algorithm from FileEditTool.tsx
  // before格式化`originalFile.split`，供工具调用后续处理使用。
  const before = originalFile.split(oldString)[0] ?? ''
  // replacementLine格式化`before.split`，供工具调用后续处理使用。
  const replacementLine = before.split(/\r?\n/).length - 1
  // newFileLines 文件数据保存`applyEditToFile`，供工具调用后续处理使用。
  const newFileLines = applyEditToFile(
    originalFile,
    oldString,
    newString,
  ).split(/\r?\n/)

  // Calculate the start and end line numbers for the snippet
  // startLine保存`Math.max`，供工具调用后续处理使用。
  const startLine = Math.max(0, replacementLine - contextLines)
  // endLine 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const endLine =
    replacementLine + contextLines + newString.split(/\r?\n/).length

  // Get snippet
  // snippetLines 集合格式化`newFileLines.slice`，供工具调用后续处理使用。
  const snippetLines = newFileLines.slice(startLine, endLine)
  // snippet格式化`snippetLines.join`，供工具调用后续处理使用。
  const snippet = snippetLines.join('\n')

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { snippet, startLine: startLine + 1 }
}

// getEditsForPatch 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEditsForPatch(patch: StructuredPatchHunk[]): FileEdit[] {
  // 返回 `patch.map(hunk => {`，作为工具调用这次计算的结果。
  return patch.map(hunk => {
    // Extract the changes from this hunk
    // contextLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const contextLines: string[] = []
    // oldLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const oldLines: string[] = []
    // newLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const newLines: string[] = []

    // Parse each line and categorize it
    // 按顺序遍历 `hunk.lines` 中的line，逐个交给工具调用处理。
    for (const line of hunk.lines) {
      // 满足 `line.startsWith(' ')` 时，工具调用执行该分支。
      if (line.startsWith(' ')) {
        // Context line - appears in both versions
        // contextLines 集合追加新条目，保持收集顺序与输入顺序一致。
        contextLines.push(line.slice(1))
        // oldLines 集合追加新条目，保持收集顺序与输入顺序一致。
        oldLines.push(line.slice(1))
        // newLines 集合追加新条目，保持收集顺序与输入顺序一致。
        newLines.push(line.slice(1))
      // 工具实现 utils在这里处理 `} else if (line.startsWith('-')) {`，完成这一小步状态转换。
      } else if (line.startsWith('-')) {
        // Deleted line - only in old version
        // oldLines 集合追加新条目，保持收集顺序与输入顺序一致。
        oldLines.push(line.slice(1))
      // 工具实现 utils在这里处理 `} else if (line.startsWith('+')) {`，完成这一小步状态转换。
      } else if (line.startsWith('+')) {
        // Added line - only in new version
        // newLines 集合追加新条目，保持收集顺序与输入顺序一致。
        newLines.push(line.slice(1))
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      old_string: oldLines.join('\n'),
      new_string: newLines.join('\n'),
      replace_all: false,
    }
  })
}

/**
 * Contains replacements to de-sanitize strings from Claude
 * Since Claude can't see any of these strings (sanitized in the API)
 * It'll output the sanitized versions in the edit response
 */
// DESANITIZATIONS 集合 集中保存工具实现 utils要一起传递的字段。
const DESANITIZATIONS: Record<string, string> = {
  '<fnr>': '<function_results>',
  '<n>': '<name>',
  '</n>': '</name>',
  '<o>': '<output>',
  '</o>': '</output>',
  '<e>': '<error>',
  '</e>': '</error>',
  '<s>': '<system>',
  '</s>': '</system>',
  '<r>': '<result>',
  '</r>': '</result>',
  '< META_START >': '<META_START>',
  '< META_END >': '<META_END>',
  '< EOT >': '<EOT>',
  '< META >': '<META>',
  '< SOS >': '<SOS>',
  '\n\nH:': '\n\nHuman:',
  '\n\nA:': '\n\nAssistant:',
}

/**
 * Normalizes a match string by applying specific replacements
 * This helps handle when exact matches fail due to formatting differences
 * @returns The normalized string and which replacements were applied
 */
// desanitizeMatchString 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function desanitizeMatchString(matchString: string): {
  result: string
  appliedReplacements: Array<{ from: string; to: string }>
} {
  // 结果保存`matchString`，供工具实现 utils后续判断或输出使用。
  let result = matchString
  // appliedReplacements 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const appliedReplacements: Array<{ from: string; to: string }> = []

  // 循环处理 `const [from, to] of Object.entries(DESANITIZATIONS)`，让工具调用把同类条目按顺序走完。
  for (const [from, to] of Object.entries(DESANITIZATIONS)) {
    // beforeReplace 命名 `result`，让后续代码直接表达这个值的用途。
    const beforeReplace = result
    // 结果更新为 `result.replaceAll(from, to)`，确保工具调用后续读取最新状态。
    result = result.replaceAll(from, to)

    // `beforeReplace` 与 `result` 不一致时刷新派生状态，避免使用过期结果。
    if (beforeReplace !== result) {
      // appliedReplacements 集合追加新条目，保持收集顺序与输入顺序一致。
      appliedReplacements.push({ from, to })
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { result, appliedReplacements }
}

/**
 * Normalize the input for the FileEditTool
 * If the string to replace is not found in the file, try with a normalized version
 * Returns the normalized input if successful, or the original input if not
 */
// normalizeFileEditInput 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeFileEditInput({
  file_path,
  edits,
}: {
  file_path: string
  edits: EditInput[]
}): {
  file_path: string
  edits: EditInput[]
} {
  // edits 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (edits.length === 0) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { file_path, edits }
  }

  // Markdown uses two trailing spaces as a hard line break — stripping would
  // silently change semantics. Skip stripTrailingWhitespace for .md/.mdx.
  // isMarkdown记录 `i.test` 是否成立，工具调用随后按该结果分支。
  const isMarkdown = /\.(md|mdx)$/i.test(file_path)

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // fullPath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullPath = expandPath(file_path)

    // Use cached file read to avoid redundant I/O operations.
    // If the file doesn't exist, readFileSyncCached throws ENOENT which the
    // catch below handles by returning the original input (no TOCTOU pre-check).
    // fileContent 文件数据读取`readFileSyncCached`，供工具调用后续处理使用。
    const fileContent = readFileSyncCached(fullPath)

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      file_path,
      // 这个回调绑定到 edits: edits.map(({ old_string, new_string, replace_all }) => {，负责工具调用在该局部场景下的响应。
      edits: edits.map(({ old_string, new_string, replace_all }) => {
        // normalizedNewString 命名 `isMarkdown`，让后续代码直接表达这个值的用途。
        const normalizedNewString = isMarkdown
          ? new_string
          : stripTrailingWhitespace(new_string)

        // If exact string match works, keep it as is
        // 满足 `fileContent.includes(old_string)` 时，工具调用执行该分支。
        if (fileContent.includes(old_string)) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            old_string,
            new_string: normalizedNewString,
            replace_all,
          }
        }

        // Try de-sanitize string if exact match fails
        // 工具实现 utils先整理这一处局部数据，后续分支可以直接读取。
        const { result: desanitizedOldString, appliedReplacements } =
          desanitizeMatchString(old_string)

        // 满足 `fileContent.includes(desanitizedOldString)` 时，工具调用执行该分支。
        if (fileContent.includes(desanitizedOldString)) {
          // Apply the same exact replacements to new_string
          // desanitizedNewString 命名 `normalizedNewString`，让后续代码直接表达这个值的用途。
          let desanitizedNewString = normalizedNewString
          // 循环处理 `const { from, to } of appliedReplacements`，让工具调用逐项把同类条目按顺序走完。
          for (const { from, to } of appliedReplacements) {
            // desanitizedNewString更新为 `desanitizedNewString.replaceAll(from, to)`，确保工具调用后续读取最新状态。
            desanitizedNewString = desanitizedNewString.replaceAll(from, to)
          }

          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            old_string: desanitizedOldString,
            new_string: desanitizedNewString,
            replace_all,
          }
        }

        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          old_string,
          new_string: normalizedNewString,
          replace_all,
        }
      }),
    }
  } catch (error) {
    // If there's any error reading the file, just return original input.
    // ENOENT is expected when the file doesn't exist yet (e.g., new file).
    // 满足 `!isENOENT(error)` 时，工具调用执行该分支。
    if (!isENOENT(error)) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { file_path, edits }
}

/**
 * Compare two sets of edits to determine if they are equivalent
 * by applying both sets to the original content and comparing results.
 * This handles cases where edits might be different but produce the same outcome.
 */
// areFileEditsEquivalent 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function areFileEditsEquivalent(
  edits1: FileEdit[],
  edits2: FileEdit[],
  originalContent: string,
): boolean {
  // Fast path: check if edits are literally identical
  // 工具调用在这里按实际状态进入对应分支。
  if (
    edits1.length === edits2.length &&
    // 调用 edits1.every，触发工具调用此处需要的副作用。
    edits1.every((edit1, index) => {
      // edit2保存`edits2[index]`，供工具实现 utils后续判断或输出使用。
      const edit2 = edits2[index]
      // 返回 `(`，作为工具调用这次计算的结果。
      return (
        edit2 !== undefined &&
        edit1.old_string === edit2.old_string &&
        edit1.new_string === edit2.new_string &&
        edit1.replace_all === edit2.replace_all
      )
    })
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Try applying both sets of edits
  // result1 先占位，稍后的条件分支会根据实际输入补齐它。
  let result1: { patch: StructuredPatchHunk[]; updatedFile: string } | null =
    null
  // error1 错误信息保存`null`，作为后续空值处理的输入。
  let error1: string | null = null
  // result2 先占位，稍后的条件分支会根据实际输入补齐它。
  let result2: { patch: StructuredPatchHunk[]; updatedFile: string } | null =
    null
  // error2 错误信息保存`null`，作为后续空值处理的输入。
  let error2: string | null = null

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // result1更新为 `getPatchForEdits({`，确保工具调用后续读取最新状态。
    result1 = getPatchForEdits({
      filePath: 'temp',
      fileContents: originalContent,
      edits: edits1,
    })
  } catch (e) {
    // error1 错误信息更新为 `errorMessage(e)`，确保工具调用后续读取最新状态。
    error1 = errorMessage(e)
  }

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // result2更新为 `getPatchForEdits({`，确保工具调用后续读取最新状态。
    result2 = getPatchForEdits({
      filePath: 'temp',
      fileContents: originalContent,
      edits: edits2,
    })
  } catch (e) {
    // error2 错误信息更新为 `errorMessage(e)`，确保工具调用后续读取最新状态。
    error2 = errorMessage(e)
  }

  // If both threw errors, they're equal only if the errors are the same
  // `error1` 与 `null && error2 !== null` 不一致时刷新派生状态，避免使用过期结果。
  if (error1 !== null && error2 !== null) {
    // Normalize error messages for comparison
    // 返回 `error1 === error2`，作为工具调用这次计算的结果。
    return error1 === error2
  }

  // If one threw an error and the other didn't, they're not equal
  // `error1` 与 `null || error2 !== null` 不一致时刷新派生状态，避免使用过期结果。
  if (error1 !== null || error2 !== null) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Both succeeded - compare the results
  // 返回 `result1!.updatedFile === result2!.updatedFile`，作为工具调用这次计算的结果。
  return result1!.updatedFile === result2!.updatedFile
}

/**
 * Unified function to check if two file edit inputs are equivalent.
 * Handles file edits (FileEditTool).
 */
// areFileEditsInputsEquivalent 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function areFileEditsInputsEquivalent(
  input1: {
    file_path: string
    edits: FileEdit[]
  },
  input2: {
    file_path: string
    edits: FileEdit[]
  },
): boolean {
  // Fast path: different files
  // `input1.file_path` 与 `input2.file_path` 不一致时刷新派生状态，避免使用过期结果。
  if (input1.file_path !== input2.file_path) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Fast path: literal equality
  // 工具调用在这里按实际状态进入对应分支。
  if (
    input1.edits.length === input2.edits.length &&
    // 调用 input1.edits.every，触发工具调用此处需要的副作用。
    input1.edits.every((edit1, index) => {
      // edit2读取 `input2.edits[index]` 对应条目，后续围绕该成员继续处理。
      const edit2 = input2.edits[index]
      // 返回 `(`，作为工具调用这次计算的结果。
      return (
        edit2 !== undefined &&
        edit1.old_string === edit2.old_string &&
        edit1.new_string === edit2.new_string &&
        edit1.replace_all === edit2.replace_all
      )
    })
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Semantic comparison (requires file read). If the file doesn't exist,
  // compare against empty content (no TOCTOU pre-check).
  // fileContent 文件数据保存`''`，作为后续固定文本处理的输入。
  let fileContent = ''
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // fileContent 文件数据更新为 `readFileSyncCached(input1.file_path)`，确保工具调用后续读取最新状态。
    fileContent = readFileSyncCached(input1.file_path)
  } catch (error) {
    // 满足 `!isENOENT(error)` 时，工具调用执行该分支。
    if (!isENOENT(error)) {
      // 抛出 error，阻止工具调用在无效状态下继续运行。
      throw error
    }
  }

  // 返回 `areFileEditsEquivalent(input1.edits, input2.edits, fileContent)`，作为工具调用这次计算的结果。
  return areFileEditsEquivalent(input1.edits, input2.edits, fileContent)
}
