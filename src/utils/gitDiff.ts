// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准共享工具的数据契约。
import type { StructuredPatchHunk } from 'diff'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { access, readFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join, relative, sep } from 'path'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 getCachedRepository，将 ./detectRepository.js 中已经封装好的能力接到本文件流程里。
import { getCachedRepository } from './detectRepository.js'
// 引入 execFileNoThrow、execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow, execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 isFileWithinReadSizeLimit，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { isFileWithinReadSizeLimit } from './file.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  findGitRoot,
  getDefaultBranch,
  getGitDir,
  getIsGit,
  gitExe,
} from './git.js'

// GitDiffStats 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GitDiffStats = {
  filesCount: number
  linesAdded: number
  linesRemoved: number
}

// PerFileStats 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PerFileStats = {
  added: number
  removed: number
  isBinary: boolean
  isUntracked?: boolean
}

// GitDiffResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GitDiffResult = {
  stats: GitDiffStats
  perFileStats: Map<string, PerFileStats>
  hunks: Map<string, StructuredPatchHunk[]>
}

// GIT_TIMEOUT_MS 集合 命名 `5000`，让后续代码直接表达这个值的用途。
const GIT_TIMEOUT_MS = 5000
// MAX_FILES 文件数据保存`50`，供共享工具 git Diff后续判断或输出使用。
const MAX_FILES = 50
// MAX_DIFF_SIZE_BYTES 集合保存`1_000_000 // 1 MB - skip files larger than this`，供共享工具 git Diff后续判断或输出使用。
const MAX_DIFF_SIZE_BYTES = 1_000_000 // 1 MB - skip files larger than this
// MAX_LINES_PER_FILE 文件数据 命名 `400 // GitHub's auto-load limit`，让后续代码直接表达这个值的用途。
const MAX_LINES_PER_FILE = 400 // GitHub's auto-load limit
// MAX_FILES_FOR_DETAILS 文件数据保存`500 // Skip per-file details if more files than this`，供后续判断或组装使用。
const MAX_FILES_FOR_DETAILS = 500 // Skip per-file details if more files than this

/**
 * Fetch git diff stats and hunks comparing working tree to HEAD.
 * Returns null if not in a git repo or if git commands fail.
 *
 * Returns null during merge/rebase/cherry-pick/revert operations since the
 * working tree contains incoming changes that weren't intentionally
 * made by the user.
 */
// fetchGitDiff 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchGitDiff(): Promise<GitDiffResult | null> {
  // isGit记录 `getIsGit` 是否成立，共享工具随后按该结果分支。
  const isGit = await getIsGit()
  // isGit缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isGit) return null

  // Skip diff calculation during transient git states since the
  // working tree contains incoming changes, not user-intentional edits
  // 满足 `await isInTransientGitState()` 时，共享工具执行该分支。
  if (await isInTransientGitState()) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Quick probe: use --shortstat to get totals without loading all content.
  // This is O(1) memory and lets us detect massive diffs (e.g., jj workspaces)
  // before committing to expensive operations.
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git Diff对同一对象的重复访问。
  const { stdout: shortstatOut, code: shortstatCode } = await execFileNoThrow(
    gitExe(),
    ['--no-optional-locks', 'diff', 'HEAD', '--shortstat'],
    { timeout: GIT_TIMEOUT_MS, preserveOutputOnError: false },
  )

  // 满足 `shortstatCode === 0` 时，共享工具执行该分支。
  if (shortstatCode === 0) {
    // quickStats 集合解析`parseShortstat`，供共享工具后续处理使用。
    const quickStats = parseShortstat(shortstatOut)
    // 只有 `quickStats && quickStats.filesCount > MAX_FILES_F` 满足时，共享工具才执行该分支。
    if (quickStats && quickStats.filesCount > MAX_FILES_FOR_DETAILS) {
      // Too many files - return accurate totals but skip per-file details
      // to avoid loading hundreds of MB into memory
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        stats: quickStats,
        perFileStats: new Map(),
        hunks: new Map(),
      }
    }
  }

  // Get stats via --numstat (all uncommitted changes vs HEAD)
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git Diff对同一对象的重复访问。
  const { stdout: numstatOut, code: numstatCode } = await execFileNoThrow(
    gitExe(),
    ['--no-optional-locks', 'diff', 'HEAD', '--numstat'],
    { timeout: GIT_TIMEOUT_MS, preserveOutputOnError: false },
  )

  // `numstatCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (numstatCode !== 0) return null

  // 从 `parseGitNumstat(numstatOut)` 解构 stats、perFileStats，减少共享工具 git Diff对同一对象的重复访问。
  const { stats, perFileStats } = parseGitNumstat(numstatOut)

  // Include untracked files (new files not yet staged)
  // Just filenames - no content reading for performance
  // remainingSlots 集合 命名 `MAX_FILES - perFileStats.size`，让后续代码直接表达这个值的用途。
  const remainingSlots = MAX_FILES - perFileStats.size
  // 满足 `remainingSlots > 0` 时，共享工具执行该分支。
  if (remainingSlots > 0) {
    // untrackedStats 集合读取`fetchUntrackedFiles`，供共享工具后续处理使用。
    const untrackedStats = await fetchUntrackedFiles(remainingSlots)
    // 满足 `untrackedStats` 时，共享工具执行该分支。
    if (untrackedStats) {
      // 共享工具 git Diff在这里处理 `stats.filesCount += untrackedStats.size`，完成这一小步状态转换。
      stats.filesCount += untrackedStats.size
      // 循环处理 `const [path, fileStats] of untrackedStats`，让共享工具逐项把同类条目按顺序走完。
      for (const [path, fileStats] of untrackedStats) {
        // perFileStats.set 写入新的状态值，使共享工具后续读取保持一致。
        perFileStats.set(path, fileStats)
      }
    }
  }

  // Return stats only - hunks are fetched on-demand via fetchGitDiffHunks()
  // to avoid expensive git diff HEAD call on every poll
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { stats, perFileStats, hunks: new Map() }
}

/**
 * Fetch git diff hunks on-demand (for DiffDialog).
 * Separated from fetchGitDiff() to avoid expensive calls during polling.
 */
// fetchGitDiffHunks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchGitDiffHunks(): Promise<
  Map<string, StructuredPatchHunk[]>
> {
  // isGit记录 `getIsGit` 是否成立，共享工具随后按该结果分支。
  const isGit = await getIsGit()
  // 满足 `!isGit) return new Map(` 时，共享工具执行该分支。
  if (!isGit) return new Map()

  // 满足 `await isInTransientGitState()` 时，共享工具执行该分支。
  if (await isInTransientGitState()) {
    // 返回 `new Map()`，作为共享工具这次计算的结果。
    return new Map()
  }

  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git Diff对同一对象的重复访问。
  const { stdout: diffOut, code: diffCode } = await execFileNoThrow(
    gitExe(),
    ['--no-optional-locks', 'diff', 'HEAD'],
    { timeout: GIT_TIMEOUT_MS, preserveOutputOnError: false },
  )

  // `diffCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (diffCode !== 0) {
    // 返回 `new Map()`，作为共享工具这次计算的结果。
    return new Map()
  }

  // 返回 `parseGitDiff(diffOut)`，作为共享工具这次计算的结果。
  return parseGitDiff(diffOut)
}

// NumstatResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type NumstatResult = {
  stats: GitDiffStats
  perFileStats: Map<string, PerFileStats>
}

/**
 * Parse git diff --numstat output into stats.
 * Format: <added>\t<removed>\t<filename>
 * Binary files show '-' for counts.
 * Only stores first MAX_FILES entries in perFileStats.
 */
// parseGitNumstat 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseGitNumstat(stdout: string): NumstatResult {
  // 文本行格式化`stdout.trim`，供共享工具后续处理使用。
  const lines = stdout.trim().split('\n').filter(Boolean)
  // added保存`0`，供后续判断或组装使用。
  let added = 0
  // removed保存`0`，供共享工具 git Diff后续判断或输出使用。
  let removed = 0
  // validFileCount 文件数据 命名 `0`，让后续代码直接表达这个值的用途。
  let validFileCount = 0
  // perFileStats 文件数据构建`new Map<string, PerFileStats>()` 整理出中间结果，供共享工具 git Diff后续步骤使用。
  const perFileStats = new Map<string, PerFileStats>()

  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // 片段列表格式化`line.split`，供共享工具后续处理使用。
    const parts = line.split('\t')
    // Valid numstat lines have exactly 3 tab-separated parts: added, removed, filename
    // 满足 `parts.length < 3` 时，共享工具执行该分支。
    if (parts.length < 3) continue

    // 共享工具 git Diff在这里处理 `validFileCount++`，完成这一小步状态转换。
    validFileCount++
    // addStr读取 `parts[0]` 对应条目，后续围绕该成员继续处理。
    const addStr = parts[0]
    // remStr 命名 `parts[1]`，让后续代码直接表达这个值的用途。
    const remStr = parts[1]
    // 文件路径格式化`parts.slice`，供共享工具后续处理使用。
    const filePath = parts.slice(2).join('\t') // filename may contain tabs
    // isBinary标记共享工具 git Diff是否启用对应路径。
    const isBinary = addStr === '-' || remStr === '-'
    // fileAdded 文件数据解析`parseInt`，供共享工具后续处理使用。
    const fileAdded = isBinary ? 0 : parseInt(addStr ?? '0', 10) || 0
    // fileRemoved 文件数据解析`parseInt`，供共享工具后续处理使用。
    const fileRemoved = isBinary ? 0 : parseInt(remStr ?? '0', 10) || 0

    // 共享工具 git Diff在这里处理 `added += fileAdded`，完成这一小步状态转换。
    added += fileAdded
    // 共享工具 git Diff在这里处理 `removed += fileRemoved`，完成这一小步状态转换。
    removed += fileRemoved

    // Only store first MAX_FILES entries
    // 满足 `perFileStats.size < MAX_FILES` 时，共享工具执行该分支。
    if (perFileStats.size < MAX_FILES) {
      // perFileStats.set 写入新的状态值，使共享工具后续读取保持一致。
      perFileStats.set(filePath, {
        added: fileAdded,
        removed: fileRemoved,
        isBinary,
      })
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    stats: {
      filesCount: validFileCount,
      linesAdded: added,
      linesRemoved: removed,
    },
    perFileStats,
  }
}

/**
 * Parse unified diff output into per-file hunks.
 * Splits by "diff --git" and parses each file's hunks.
 *
 * Applies limits:
 * - MAX_FILES: stop after this many files
 * - Files >1MB: skipped entirely (not in result map)
 * - Files ≤1MB: parsed but limited to MAX_LINES_PER_FILE lines
 */
// parseGitDiff 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseGitDiff(
  stdout: string,
): Map<string, StructuredPatchHunk[]> {
  // 结果构建`new Map<string, StructuredPatchHunk[]>()`，供后续判断或组装使用。
  const result = new Map<string, StructuredPatchHunk[]>()
  // 满足 `!stdout.trim()` 时，共享工具执行该分支。
  if (!stdout.trim()) return result

  // Split by file diffs
  // fileDiffs 文件数据格式化`stdout.split`，供共享工具后续处理使用。
  const fileDiffs = stdout.split(/^diff --git /m).filter(Boolean)

  // 按顺序遍历 `fileDiffs` 中的fileDiff 文件数据，逐个交给共享工具处理。
  for (const fileDiff of fileDiffs) {
    // Stop after MAX_FILES
    // 满足 `result.size >= MAX_FILES` 时，共享工具执行该分支。
    if (result.size >= MAX_FILES) break

    // Skip files larger than 1MB
    // 满足 `fileDiff.length > MAX_DIFF_SIZE_BYTES` 时，共享工具执行该分支。
    if (fileDiff.length > MAX_DIFF_SIZE_BYTES) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 文本行格式化`fileDiff.split`，供共享工具后续处理使用。
    const lines = fileDiff.split('\n')

    // Extract filename from first line: "a/path/to/file b/path/to/file"
    // headerMatch保存`match`，供共享工具后续处理使用。
    const headerMatch = lines[0]?.match(/^a\/(.+?) b\/(.+)$/)
    // headerMatch缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!headerMatch) continue
    // 文件路径 命名 `headerMatch[2] ?? headerMatch[1] ?? ''`，让后续代码直接表达这个值的用途。
    const filePath = headerMatch[2] ?? headerMatch[1] ?? ''

    // Find and parse hunks
    // fileHunks 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const fileHunks: StructuredPatchHunk[] = []
    // currentHunk初始化为空值，后续分支会在有数据时补齐。
    let currentHunk: StructuredPatchHunk | null = null
    // lineCount 数量保存`0`，供后续判断或组装使用。
    let lineCount = 0

    // 循环处理 `let i = 1; i < lines.length; i++`，让共享工具逐项把同类条目按顺序走完。
    for (let i = 1; i < lines.length; i++) {
      // line保存`lines[i] ?? ''`，供共享工具 git Diff后续判断或输出使用。
      const line = lines[i] ?? ''

      // StructuredPatchHunk header: @@ -oldStart,oldLines +newStart,newLines @@
      // hunkMatch匹配`line.match`，供共享工具后续处理使用。
      const hunkMatch = line.match(
        /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/,
      )
      // 满足 `hunkMatch` 时，共享工具执行该分支。
      if (hunkMatch) {
        // 满足 `currentHunk` 时，共享工具执行该分支。
        if (currentHunk) {
          // fileHunks 文件数据追加新条目，保持收集顺序与输入顺序一致。
          fileHunks.push(currentHunk)
        }
        // currentHunk更新为 `{`，确保共享工具后续读取最新状态。
        currentHunk = {
          oldStart: parseInt(hunkMatch[1] ?? '0', 10),
          oldLines: parseInt(hunkMatch[2] ?? '1', 10),
          newStart: parseInt(hunkMatch[3] ?? '0', 10),
          newLines: parseInt(hunkMatch[4] ?? '1', 10),
          lines: [],
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Skip binary file markers and other metadata
      // 共享工具在这里按实际状态进入对应分支。
      if (
        line.startsWith('index ') ||
        line.startsWith('---') ||
        line.startsWith('+++') ||
        line.startsWith('new file') ||
        line.startsWith('deleted file') ||
        line.startsWith('old mode') ||
        line.startsWith('new mode') ||
        line.startsWith('Binary files')
      ) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Add diff lines to current hunk (with line limit)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        currentHunk &&
        (line.startsWith('+') ||
          line.startsWith('-') ||
          line.startsWith(' ') ||
          line === '')
      ) {
        // Stop adding lines once we hit the limit
        // 满足 `lineCount >= MAX_LINES_PER_FILE` 时，共享工具执行该分支。
        if (lineCount >= MAX_LINES_PER_FILE) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
        // Force a flat string copy to break V8 sliced string references.
        // When split() creates lines, V8 creates "sliced strings" that reference
        // the parent. This keeps the entire parent string (~MBs) alive as long as
        // any line is retained. Using '' + line forces a new flat string allocation,
        // unlike slice(0) which V8 may optimize to return the same reference.
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        currentHunk.lines.push('' + line)
        // 共享工具 git Diff在这里处理 `lineCount++`，完成这一小步状态转换。
        lineCount++
      }
    }

    // Don't forget the last hunk
    // 满足 `currentHunk` 时，共享工具执行该分支。
    if (currentHunk) {
      // fileHunks 文件数据追加新条目，保持收集顺序与输入顺序一致。
      fileHunks.push(currentHunk)
    }

    // 满足 `fileHunks.length > 0` 时，共享工具执行该分支。
    if (fileHunks.length > 0) {
      // result.set 写入新的状态值，使共享工具后续读取保持一致。
      result.set(filePath, fileHunks)
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Check if we're in a transient git state (merge, rebase, cherry-pick, or revert).
 * During these operations, we skip diff calculation since the working
 * tree contains incoming changes that weren't intentionally made.
 *
 * Uses fs.access to check for transient ref files, avoiding process spawns.
 */
// isInTransientGitState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isInTransientGitState(): Promise<boolean> {
  // gitDir读取`getGitDir`，供共享工具后续处理使用。
  const gitDir = await getGitDir(getCwd())
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) return false

  // transientFiles 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
  const transientFiles = [
    'MERGE_HEAD',
    'REBASE_HEAD',
    'CHERRY_PICK_HEAD',
    'REVERT_HEAD',
  ]

  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 transientFiles.map，触发共享工具此处需要的副作用。
    transientFiles.map(file =>
      access(join(gitDir, file))
        // 链式调用 then，继续加工上一行在共享工具中产生的数据。
        .then(() => true)
        // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
        .catch(() => false),
    ),
  )
  // 返回 `results.some(Boolean)`，作为共享工具这次计算的结果。
  return results.some(Boolean)
}

/**
 * Fetch untracked file names (no content reading).
 * Returns file paths only - they'll be displayed with a note to stage them.
 *
 * @param maxFiles Maximum number of untracked files to include
 */
// fetchUntrackedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchUntrackedFiles(
  maxFiles: number,
): Promise<Map<string, PerFileStats> | null> {
  // Get list of untracked files (excludes gitignored)
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git Diff对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrow(
    gitExe(),
    ['--no-optional-locks', 'ls-files', '--others', '--exclude-standard'],
    { timeout: GIT_TIMEOUT_MS, preserveOutputOnError: false },
  )

  // `code` 与 `0 || !stdout.trim()` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0 || !stdout.trim()) return null

  // untrackedPaths 路径数据格式化`stdout.trim`，供共享工具后续处理使用。
  const untrackedPaths = stdout.trim().split('\n').filter(Boolean)
  // untrackedPaths 路径数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (untrackedPaths.length === 0) return null

  // perFileStats 文件数据构建`new Map<string, PerFileStats>()` 整理出中间结果，供共享工具 git Diff后续步骤使用。
  const perFileStats = new Map<string, PerFileStats>()

  // Just record filenames, no content reading
  // 逐项读取 `untrackedPaths.slice(0, maxFiles)` 中的文件路径，按输入顺序推进共享工具。
  for (const filePath of untrackedPaths.slice(0, maxFiles)) {
    // perFileStats.set 写入新的状态值，使共享工具后续读取保持一致。
    perFileStats.set(filePath, {
      added: 0,
      removed: 0,
      isBinary: false,
      isUntracked: true,
    })
  }

  // 返回 `perFileStats`，作为共享工具这次计算的结果。
  return perFileStats
}

/**
 * Parse git diff --shortstat output into stats.
 * Format: " 1648 files changed, 52341 insertions(+), 8123 deletions(-)"
 *
 * This is O(1) memory regardless of diff size - git computes totals without
 * loading all content. Used as a quick probe before expensive operations.
 */
// parseShortstat 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseShortstat(stdout: string): GitDiffStats | null {
  // Match: "N files changed" with optional ", N insertions(+)" and ", N deletions(-)"
  // match匹配`stdout.match`，供共享工具后续处理使用。
  const match = stdout.match(
    /(\d+)\s+files?\s+changed(?:,\s+(\d+)\s+insertions?\(\+\))?(?:,\s+(\d+)\s+deletions?\(-\))?/,
  )
  // match缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!match) return null
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    filesCount: parseInt(match[1] ?? '0', 10),
    linesAdded: parseInt(match[2] ?? '0', 10),
    linesRemoved: parseInt(match[3] ?? '0', 10),
  }
}

// SINGLE_FILE_DIFF_TIMEOUT_MS 文件数据保存`3000`，供后续判断或组装使用。
const SINGLE_FILE_DIFF_TIMEOUT_MS = 3000

// ToolUseDiff 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolUseDiff = {
  filename: string
  status: 'modified' | 'added'
  additions: number
  deletions: number
  changes: number
  patch: string
  /** GitHub "owner/repo" when available (null for non-github.com or unknown repos) */
  repository: string | null
}

/**
 * Fetch a structured diff for a single file against the merge base with the
 * default branch. This produces a PR-like diff showing all changes since
 * the branch diverged. Falls back to diffing against HEAD if the merge base
 * cannot be determined (e.g., on the default branch itself).
 * For untracked files, generates a synthetic diff showing all additions.
 * Returns null if not in a git repo or if git commands fail.
 */
// fetchSingleFileGitDiff 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchSingleFileGitDiff(
  absoluteFilePath: string,
): Promise<ToolUseDiff | null> {
  // gitRoot筛选`findGitRoot`，供共享工具后续处理使用。
  const gitRoot = findGitRoot(dirname(absoluteFilePath))
  // gitRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitRoot) return null

  // gitPath 路径数据保存`relative`，供共享工具后续处理使用。
  const gitPath = relative(gitRoot, absoluteFilePath).split(sep).join('/')
  // repository读取`getCachedRepository`，供共享工具后续处理使用。
  const repository = getCachedRepository()

  // Check if the file is tracked by git
  // 从 `await execFileNoThrowWithCwd(` 解构 code，减少共享工具 git Diff对同一对象的重复访问。
  const { code: lsFilesCode } = await execFileNoThrowWithCwd(
    gitExe(),
    ['--no-optional-locks', 'ls-files', '--error-unmatch', gitPath],
    { cwd: gitRoot, timeout: SINGLE_FILE_DIFF_TIMEOUT_MS },
  )

  // 满足 `lsFilesCode === 0` 时，共享工具执行该分支。
  if (lsFilesCode === 0) {
    // File is tracked - diff against merge base for PR-like view
    // diffRef 引用读取`getDiffRef`，供共享工具后续处理使用。
    const diffRef = await getDiffRef(gitRoot)
    // 从 `await execFileNoThrowWithCwd(` 解构 stdout、code，减少共享工具 git Diff对同一对象的重复访问。
    const { stdout, code } = await execFileNoThrowWithCwd(
      gitExe(),
      ['--no-optional-locks', 'diff', diffRef, '--', gitPath],
      { cwd: gitRoot, timeout: SINGLE_FILE_DIFF_TIMEOUT_MS },
    )
    // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 0) return null
    // stdout缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!stdout) return null
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...parseRawDiffToToolUseDiff(gitPath, stdout, 'modified'),
      repository,
    }
  }

  // File is untracked - generate synthetic diff
  // syntheticDiff保存`generateSyntheticDiff`，供共享工具后续处理使用。
  const syntheticDiff = await generateSyntheticDiff(gitPath, absoluteFilePath)
  // syntheticDiff缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!syntheticDiff) return null
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { ...syntheticDiff, repository }
}

/**
 * Parse raw unified diff output into the structured ToolUseDiff format.
 * Extracts only the hunk content (starting from @@) as the patch,
 * and counts additions/deletions.
 */
// parseRawDiffToToolUseDiff 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseRawDiffToToolUseDiff(
  filename: string,
  rawDiff: string,
  status: 'modified' | 'added',
): Omit<ToolUseDiff, 'repository'> {
  // 文本行格式化`rawDiff.split`，供共享工具后续处理使用。
  const lines = rawDiff.split('\n')
  // patchLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const patchLines: string[] = []
  // inHunks 集合标记共享工具 git Diff是否启用对应路径。
  let inHunks = false
  // additions 集合保存`0`，供后续判断或组装使用。
  let additions = 0
  // deletions 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let deletions = 0

  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // 满足 `line.startsWith('@@')` 时，共享工具执行该分支。
    if (line.startsWith('@@')) {
      // inHunks 集合更新为 `true`，确保共享工具后续读取最新状态。
      inHunks = true
    }
    // 满足 `inHunks` 时，共享工具执行该分支。
    if (inHunks) {
      // patchLines 集合追加新条目，保持收集顺序与输入顺序一致。
      patchLines.push(line)
      // 只有 `line.startsWith('+') && !line.startsWith('+++')` 满足时，共享工具才执行该分支。
      if (line.startsWith('+') && !line.startsWith('+++')) {
        // 共享工具 git Diff在这里处理 `additions++`，完成这一小步状态转换。
        additions++
      // 共享工具 git Diff在这里处理 `} else if (line.startsWith('-') && !line.startsWith('---')) {`，完成这一小步状态转换。
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // 共享工具 git Diff在这里处理 `deletions++`，完成这一小步状态转换。
        deletions++
      }
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    filename,
    status,
    additions,
    deletions,
    changes: additions + deletions,
    patch: patchLines.join('\n'),
  }
}

/**
 * Determine the best ref to diff against for a PR-like diff.
 * Priority:
 * 1. CLAUDE_CODE_BASE_REF env var (set externally, e.g. by CCR managed containers)
 * 2. Merge base with the default branch (best guess)
 * 3. HEAD (fallback if merge-base fails)
 */
// getDiffRef 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getDiffRef(gitRoot: string): Promise<string> {
  // baseBranch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseBranch =
    process.env.CLAUDE_CODE_BASE_REF || (await getDefaultBranch())
  // 从 `await execFileNoThrowWithCwd(` 解构 stdout、code，减少共享工具 git Diff对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrowWithCwd(
    gitExe(),
    ['--no-optional-locks', 'merge-base', 'HEAD', baseBranch],
    { cwd: gitRoot, timeout: SINGLE_FILE_DIFF_TIMEOUT_MS },
  )
  // 只有 `code === 0 && stdout.trim()` 满足时，共享工具才执行该分支。
  if (code === 0 && stdout.trim()) {
    // 返回 `stdout.trim()`，作为共享工具这次计算的结果。
    return stdout.trim()
  }
  // 返回 `'HEAD'`，作为共享工具这次计算的结果。
  return 'HEAD'
}

// generateSyntheticDiff 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function generateSyntheticDiff(
  gitPath: string,
  absoluteFilePath: string,
): Promise<Omit<ToolUseDiff, 'repository'> | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `!isFileWithinReadSizeLimit(absoluteFilePath, MAX_DIFF_SIZE_BYTES)` 时，共享工具执行该分支。
    if (!isFileWithinReadSizeLimit(absoluteFilePath, MAX_DIFF_SIZE_BYTES)) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(absoluteFilePath, 'utf-8')
    // 文本行格式化`content.split`，供共享工具后续处理使用。
    const lines = content.split('\n')
    // Remove trailing empty line from split if file ends with newline
    // 只有 `lines.length > 0 && lines.at(-1) === ''` 满足时，共享工具才执行该分支。
    if (lines.length > 0 && lines.at(-1) === '') {
      // 调用 lines.pop，触发共享工具此处需要的副作用。
      lines.pop()
    }
    // lineCount 数量 命名 `lines.length`，让后续代码直接表达这个值的用途。
    const lineCount = lines.length
    // addedLines 集合派生`lines.map`，供共享工具后续处理使用。
    const addedLines = lines.map(line => `+${line}`).join('\n')
    // patch保存``@@ -0,0 +1,${lineCount} @@\n${addedLines}``，作为后续固定文本处理的输入。
    const patch = `@@ -0,0 +1,${lineCount} @@\n${addedLines}`
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      filename: gitPath,
      status: 'added',
      additions: lineCount,
      deletions: 0,
      changes: lineCount,
      patch,
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}
