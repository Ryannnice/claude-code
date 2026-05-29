// 引入 StructuredPatchHunk、structuredPatch，将 diff 中已经封装好的能力接到本文件流程里。
import { type StructuredPatchHunk, structuredPatch } from 'diff'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 getLocCounter，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getLocCounter } from '../bootstrap/state.js'
// 引入 addToTotalLinesChanged，将 ../cost-tracker.js 中已经封装好的能力接到本文件流程里。
import { addToTotalLinesChanged } from '../cost-tracker.js'
// 类型依赖 { FileEdit } 来自 ../tools/FileEditTool/types.js，用于校准共享工具的数据契约。
import type { FileEdit } from '../tools/FileEditTool/types.js'
// 引入 count，将 ./array.js 中已经封装好的能力接到本文件流程里。
import { count } from './array.js'
// 引入 convertLeadingTabsToSpaces，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { convertLeadingTabsToSpaces } from './file.js'

// CONTEXT_LINES 集合 命名 `3`，让后续代码直接表达这个值的用途。
export const CONTEXT_LINES = 3
// DIFF_TIMEOUT_MS 集合保存`5_000`，供后续判断或组装使用。
export const DIFF_TIMEOUT_MS = 5_000

/**
 * Shifts hunk line numbers by offset. Use when getPatchForDisplay received
 * a slice of the file (e.g. readEditContext) rather than the whole file —
 * callers pass `ctx.lineOffset - 1` to convert slice-relative to file-relative.
 */
// adjustHunkLineNumbers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function adjustHunkLineNumbers(
  hunks: StructuredPatchHunk[],
  offset: number,
): StructuredPatchHunk[] {
  // 满足 `offset === 0` 时，共享工具执行该分支。
  if (offset === 0) return hunks
  // 返回 `hunks.map(h => ({`，作为共享工具这次计算的结果。
  return hunks.map(h => ({
    ...h,
    oldStart: h.oldStart + offset,
    newStart: h.newStart + offset,
  }))
}

// For some reason, & confuses the diff library, so we replace it with a token,
// then substitute it back in after the diff is computed.
// AMPERSAND_TOKEN保存`'<<:AMPERSAND_TOKEN:>>'`，作为后续固定文本处理的输入。
const AMPERSAND_TOKEN = '<<:AMPERSAND_TOKEN:>>'

// DOLLAR_TOKEN 命名 `'<<:DOLLAR_TOKEN:>>'`，让后续代码直接表达这个值的用途。
const DOLLAR_TOKEN = '<<:DOLLAR_TOKEN:>>'

// escapeForDiff 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function escapeForDiff(s: string): string {
  // 返回 `s.replaceAll('&', AMPERSAND_TOKEN).replaceAll('$', DOLLAR_TOKEN)`，作为共享工具这次计算的结果。
  return s.replaceAll('&', AMPERSAND_TOKEN).replaceAll('$', DOLLAR_TOKEN)
}

// unescapeFromDiff 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function unescapeFromDiff(s: string): string {
  // 返回 `s.replaceAll(AMPERSAND_TOKEN, '&').replaceAll(DOLLAR_TOKEN, '$')`，作为共享工具这次计算的结果。
  return s.replaceAll(AMPERSAND_TOKEN, '&').replaceAll(DOLLAR_TOKEN, '$')
}

/**
 * Count lines added and removed in a patch and update the total
 * For new files, pass the content string as the second parameter
 * @param patch Array of diff hunks
 * @param newFileContent Optional content string for new files
 */
// countLinesChanged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function countLinesChanged(
  patch: StructuredPatchHunk[],
  newFileContent?: string,
): void {
  // numAdditions 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let numAdditions = 0
  // numRemovals 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let numRemovals = 0

  // 只有 `patch.length === 0 && newFileContent` 满足时，共享工具才执行该分支。
  if (patch.length === 0 && newFileContent) {
    // For new files, count all lines as additions
    // numAdditions 集合更新为 `newFileContent.split(/\r?\n/).length`，确保共享工具后续读取最新状态。
    numAdditions = newFileContent.split(/\r?\n/).length
  } else {
    // numAdditions 集合更新为 `patch.reduce(`，确保共享工具后续读取最新状态。
    numAdditions = patch.reduce(
      // 这个回调绑定到 (acc, hunk) => acc + count(hunk.lines, _ => _.startsWith('+')),，负责共享工具在该局部场景下的响应。
      (acc, hunk) => acc + count(hunk.lines, _ => _.startsWith('+')),
      0,
    )
    // numRemovals 集合更新为 `patch.reduce(`，确保共享工具后续读取最新状态。
    numRemovals = patch.reduce(
      // 这个回调绑定到 (acc, hunk) => acc + count(hunk.lines, _ => _.startsWith('-')),，负责共享工具在该局部场景下的响应。
      (acc, hunk) => acc + count(hunk.lines, _ => _.startsWith('-')),
      0,
    )
  }

  // 调用 addToTotalLinesChanged，触发共享工具此处需要的副作用。
  addToTotalLinesChanged(numAdditions, numRemovals)

  // 调用 getLocCounter，触发共享工具此处需要的副作用。
  getLocCounter()?.add(numAdditions, { type: 'added' })
  // 调用 getLocCounter，触发共享工具此处需要的副作用。
  getLocCounter()?.add(numRemovals, { type: 'removed' })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_file_changed', {
    lines_added: numAdditions,
    lines_removed: numRemovals,
  })
}

// getPatchFromContents 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPatchFromContents({
  filePath,
  oldContent,
  newContent,
  ignoreWhitespace = false,
  singleHunk = false,
}: {
  filePath: string
  oldContent: string
  newContent: string
  ignoreWhitespace?: boolean
  singleHunk?: boolean
}): StructuredPatchHunk[] {
  // 结果保存`structuredPatch`，供共享工具后续处理使用。
  const result = structuredPatch(
    filePath,
    filePath,
    escapeForDiff(oldContent),
    escapeForDiff(newContent),
    undefined,
    undefined,
    {
      ignoreWhitespace,
      context: singleHunk ? 100_000 : CONTEXT_LINES,
      timeout: DIFF_TIMEOUT_MS,
    },
  )
  // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!result) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `result.hunks.map(_ => ({`，作为共享工具这次计算的结果。
  return result.hunks.map(_ => ({
    ..._,
    lines: _.lines.map(unescapeFromDiff),
  }))
}

/**
 * Get a patch for display with edits applied
 * @param filePath The path to the file
 * @param fileContents The contents of the file
 * @param edits An array of edits to apply to the file
 * @param ignoreWhitespace Whether to ignore whitespace changes
 * @returns An array of hunks representing the diff
 *
 * NOTE: This function will return the diff with all leading tabs
 * rendered as spaces for display
 */

// getPatchForDisplay 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPatchForDisplay({
  filePath,
  fileContents,
  edits,
  ignoreWhitespace = false,
}: {
  filePath: string
  fileContents: string
  edits: FileEdit[]
  ignoreWhitespace?: boolean
}): StructuredPatchHunk[] {
  // preparedFileContents 文件数据保存`escapeForDiff`，供共享工具后续处理使用。
  const preparedFileContents = escapeForDiff(
    convertLeadingTabsToSpaces(fileContents),
  )
  // 结果保存`structuredPatch`，供共享工具后续处理使用。
  const result = structuredPatch(
    filePath,
    filePath,
    preparedFileContents,
    // 调用 edits.reduce，触发共享工具此处需要的副作用。
    edits.reduce((p, edit) => {
      // 从 `edit` 解构 old_string、new_string，减少共享工具 diff对同一对象的重复访问。
      const { old_string, new_string } = edit
      // replace_all 命名 `'replace_all' in edit ? edit.replace_all : false`，让后续代码直接表达这个值的用途。
      const replace_all = 'replace_all' in edit ? edit.replace_all : false
      // escapedOldString保存`escapeForDiff`，供共享工具后续处理使用。
      const escapedOldString = escapeForDiff(
        convertLeadingTabsToSpaces(old_string),
      )
      // escapedNewString保存`escapeForDiff`，供共享工具后续处理使用。
      const escapedNewString = escapeForDiff(
        convertLeadingTabsToSpaces(new_string),
      )

      // 满足 `replace_all` 时，共享工具执行该分支。
      if (replace_all) {
        // 返回 `p.replaceAll(escapedOldString, () => escapedNewString)`，作为共享工具这次计算的结果。
        return p.replaceAll(escapedOldString, () => escapedNewString)
      } else {
        // 返回 `p.replace(escapedOldString, () => escapedNewString)`，作为共享工具这次计算的结果。
        return p.replace(escapedOldString, () => escapedNewString)
      }
    }, preparedFileContents),
    undefined,
    undefined,
    {
      context: CONTEXT_LINES,
      ignoreWhitespace,
      timeout: DIFF_TIMEOUT_MS,
    },
  )
  // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!result) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `result.hunks.map(_ => ({`，作为共享工具这次计算的结果。
  return result.hunks.map(_ => ({
    ..._,
    lines: _.lines.map(unescapeFromDiff),
  }))
}
