// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { statSync } from 'fs'
// 引入 ignore，将 ignore 中已经封装好的能力接到本文件流程里。
import ignore from 'ignore'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_CONFIG_DIRECTORIES,
  loadMarkdownFilesForSubdir,
} from 'src/utils/markdownConfigLoader.js'
// 类型依赖 { SuggestionItem } 来自 ../components/PromptInput/PromptInputFooterSuggestions.js，用于校准React hook 状态流的数据契约。
import type { SuggestionItem } from '../components/PromptInput/PromptInputFooterSuggestions.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  CHUNK_MS,
  FileIndex,
  yieldToEventLoop,
} from '../native-ts/file-index/index.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 类型依赖 { FileSuggestionCommandInput } 来自 ../types/fileSuggestion.js，用于校准React hook 状态流的数据契约。
import type { FileSuggestionCommandInput } from '../types/fileSuggestion.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 execFileNoThrowWithCwd 工具函数，把通用处理留在 ../utils/execFileNoThrow.js 中维护。
import { execFileNoThrowWithCwd } from '../utils/execFileNoThrow.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../utils/fsOperations.js'
// 复用 findGitRoot、gitExe 工具函数，把通用处理留在 ../utils/git.js 中维护。
import { findGitRoot, gitExe } from '../utils/git.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  createBaseHookInput,
  executeFileSuggestionCommand,
} from '../utils/hooks.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 expandPath 工具函数，把通用处理留在 ../utils/path.js 中维护。
import { expandPath } from '../utils/path.js'
// 复用 ripGrep 工具函数，把通用处理留在 ../utils/ripgrep.js 中维护。
import { ripGrep } from '../utils/ripgrep.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../utils/settings/settings.js'
// 复用 createSignal 工具函数，把通用处理留在 ../utils/signal.js 中维护。
import { createSignal } from '../utils/signal.js'

// Lazily constructed singleton
// fileIndex 文件数据初始化为空值，后续分支会在有数据时补齐。
let fileIndex: FileIndex | null = null

// getFileIndex 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFileIndex(): FileIndex {
  // fileIndex 文件数据缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!fileIndex) {
    // fileIndex 文件数据更新为 `new FileIndex()`，确保fileSuggestions后续读取最新状态。
    fileIndex = new FileIndex()
  }
  // 返回 `fileIndex`，作为React hook 状态流这次计算的结果。
  return fileIndex
}

// fileListRefreshPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let fileListRefreshPromise: Promise<FileIndex> | null = null
// Signal fired when an in-progress index build completes. Lets the
// typeahead UI re-run its last search so partial results upgrade to full.
// indexBuildComplete 索引构建`createSignal`，供React hook后续处理使用。
const indexBuildComplete = createSignal()
// onIndexBuildComplete 索引 命名 `indexBuildComplete.subscribe`，让后续代码直接表达这个值的用途。
export const onIndexBuildComplete = indexBuildComplete.subscribe
// cacheGeneration 缓存保存`0`，供React hook file Sugge...后续判断或输出使用。
let cacheGeneration = 0

// Background fetch for untracked files
// untrackedFetchPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let untrackedFetchPromise: Promise<void> | null = null

// Store tracked files so we can rebuild index with untracked
// cachedTrackedFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
let cachedTrackedFiles: string[] = []
// Store config files so mergeUntrackedIntoNormalizedCache preserves them
// cachedConfigFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
let cachedConfigFiles: string[] = []
// Store tracked directories so mergeUntrackedIntoNormalizedCache doesn't
// recompute ~270k path.dirname() calls on each merge
// cachedTrackedDirs 缓存 从空数组开始收集，后续循环会按处理顺序追加条目。
let cachedTrackedDirs: string[] = []

// Cache for .ignore/.rgignore patterns (keyed by repoRoot:cwd)
// ignorePatternsCache 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let ignorePatternsCache: ReturnType<typeof ignore> | null = null
// ignorePatternsCacheKey 缓存保存`null`，作为后续空值处理的输入。
let ignorePatternsCacheKey: string | null = null

// Throttle state for background refresh. .git/index mtime triggers an
// immediate refresh when tracked files change (add/checkout/commit/rm).
// The time floor still refreshes every 5s to pick up untracked files,
// which don't bump the index.
// lastRefreshMs 集合保存`0`，供后续判断或组装使用。
let lastRefreshMs = 0
// lastGitIndexMtime 索引保存`null`，作为后续空值处理的输入。
let lastGitIndexMtime: number | null = null

// Signatures of the path lists loaded into the Rust index. Two separate
// signatures because the two loadFromFileList call sites use differently
// structured arrays — a shared signature would ping-pong and never match.
// Skips nucleo.restart() when git ls-files returns an unchanged list
// (e.g. `git add` of an already-tracked file bumps index mtime but not the list).
// loadedTrackedSignature保存`null`，作为后续空值处理的输入。
let loadedTrackedSignature: string | null = null
// loadedMergedSignature 命名 `null`，让后续代码直接表达这个值的用途。
let loadedMergedSignature: string | null = null

/**
 * Clear all file suggestion caches.
 * Call this when resuming a session to ensure fresh file discovery.
 */
// clearFileSuggestionCaches 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearFileSuggestionCaches(): void {
  // fileIndex 文件数据更新为 `null`，确保fileSuggestions后续读取最新状态。
  fileIndex = null
  // fileListRefreshPromise 异步任务更新为 `null`，确保fileSuggestions后续读取最新状态。
  fileListRefreshPromise = null
  // React hook file Suggestions在这里处理 `cacheGeneration++`，完成这一小步状态转换。
  cacheGeneration++
  // untrackedFetchPromise 异步任务更新为 `null`，确保fileSuggestions后续读取最新状态。
  untrackedFetchPromise = null
  // cachedTrackedFiles 文件数据更新为 `[]`，确保fileSuggestions后续读取最新状态。
  cachedTrackedFiles = []
  // cachedConfigFiles 文件数据更新为 `[]`，确保fileSuggestions后续读取最新状态。
  cachedConfigFiles = []
  // cachedTrackedDirs 缓存更新为 `[]`，确保fileSuggestions后续读取最新状态。
  cachedTrackedDirs = []
  // 调用 indexBuildComplete.clear，触发React hook此处需要的副作用。
  indexBuildComplete.clear()
  // ignorePatternsCache 缓存更新为 `null`，确保fileSuggestions后续读取最新状态。
  ignorePatternsCache = null
  // ignorePatternsCacheKey 缓存更新为 `null`，确保fileSuggestions后续读取最新状态。
  ignorePatternsCacheKey = null
  // lastRefreshMs 集合更新为 `0`，确保fileSuggestions后续读取最新状态。
  lastRefreshMs = 0
  // lastGitIndexMtime 索引更新为 `null`，确保fileSuggestions后续读取最新状态。
  lastGitIndexMtime = null
  // loadedTrackedSignature更新为 `null`，确保fileSuggestions后续读取最新状态。
  loadedTrackedSignature = null
  // loadedMergedSignature更新为 `null`，确保fileSuggestions后续读取最新状态。
  loadedMergedSignature = null
}

/**
 * Content hash of a path list. A length|first|last sample misses renames of
 * middle files (same length, same endpoints → stale entry stuck in nucleo).
 *
 * Samples every Nth path (plus length). On a 346k-path list this hashes ~700
 * paths instead of 14MB — enough to catch git operations (checkout, rebase,
 * add/rm) while running in <1ms. A single mid-list rename that happens to
 * fall between samples will miss the rebuild, but the 5s refresh floor picks
 * it up on the next cycle.
 */
// pathListSignature 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pathListSignature(paths: string[]): string {
  // n记录 `paths.length` 是否成立，下一步按该结果分支。
  const n = paths.length
  // stride保存`Math.max`，供React hook后续处理使用。
  const stride = Math.max(1, Math.floor(n / 500))
  // h 命名 `0x811c9dc5 | 0`，让后续代码直接表达这个值的用途。
  let h = 0x811c9dc5 | 0
  // 循环处理 `let i = 0; i < n; i += stride`，让React hook 状态流逐项把同类条目按顺序走完。
  for (let i = 0; i < n; i += stride) {
    // p 命名 `paths[i]!`，让后续代码直接表达这个值的用途。
    const p = paths[i]!
    // 按索引扫描 `p.length`，需要消费相邻参数时可以精确移动游标。
    for (let j = 0; j < p.length; j++) {
      // h更新为 `((h ^ p.charCodeAt(j)) * 0x01000193) | 0`，确保fileSuggestions后续读取最新状态。
      h = ((h ^ p.charCodeAt(j)) * 0x01000193) | 0
    }
    // h更新为 `(h * 0x01000193) | 0`，确保fileSuggestions后续读取最新状态。
    h = (h * 0x01000193) | 0
  }
  // Stride starts at 0 (first path always hashed); explicitly include last
  // so single-file add/rm at the tail is caught
  // 满足 `n > 0` 时，React hook执行该分支。
  if (n > 0) {
    // last 命名 `paths[n - 1]!`，让后续代码直接表达这个值的用途。
    const last = paths[n - 1]!
    // 按索引扫描 `last.length`，需要消费相邻参数时可以精确移动游标。
    for (let j = 0; j < last.length; j++) {
      // h更新为 `((h ^ last.charCodeAt(j)) * 0x01000193) | 0`，确保fileSuggestions后续读取最新状态。
      h = ((h ^ last.charCodeAt(j)) * 0x01000193) | 0
    }
  }
  // 返回 ``${n}:${(h >>> 0).toString(16)}``，作为React hook 状态流这次计算的结果。
  return `${n}:${(h >>> 0).toString(16)}`
}

/**
 * Stat .git/index to detect git state changes without spawning git ls-files.
 * Returns null for worktrees (.git is a file → ENOTDIR), fresh repos with no
 * index yet (ENOENT), and non-git dirs — caller falls back to time throttle.
 */
// getGitIndexMtime 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getGitIndexMtime(): number | null {
  // repoRoot筛选`findGitRoot`，供React hook后续处理使用。
  const repoRoot = findGitRoot(getCwd())
  // repoRoot缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!repoRoot) return null
  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs -- mtimeMs is the operation here, not a pre-check. findGitRoot above already stat-walks synchronously; one more stat is marginal vs spawning git ls-files on every keystroke. Async would force startBackgroundCacheRefresh to become async, breaking the synchronous fileListRefreshPromise contract at the cold-start await site.
    // 返回 `statSync(path.join(repoRoot, '.git', 'index')).mtimeMs`，作为React hook 状态流这次计算的结果。
    return statSync(path.join(repoRoot, '.git', 'index')).mtimeMs
  } catch {
    // 返回 `null`，作为React hook 状态流这次计算的结果。
    return null
  }
}

/**
 * Normalize git paths relative to originalCwd
 */
// normalizeGitPaths 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeGitPaths(
  files: string[],
  repoRoot: string,
  originalCwd: string,
): string[] {
  // 满足 `originalCwd === repoRoot` 时，React hook执行该分支。
  if (originalCwd === repoRoot) {
    // 返回 `files`，作为React hook 状态流这次计算的结果。
    return files
  }
  // 返回 `files.map(f => {`，作为React hook 状态流这次计算的结果。
  return files.map(f => {
    // absolutePath 路径数据格式化`path.join`，供React hook后续处理使用。
    const absolutePath = path.join(repoRoot, f)
    // 返回 `path.relative(originalCwd, absolutePath)`，作为React hook 状态流这次计算的结果。
    return path.relative(originalCwd, absolutePath)
  })
}

/**
 * Merge already-normalized untracked files into the cache
 */
// mergeUntrackedIntoNormalizedCache 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function mergeUntrackedIntoNormalizedCache(
  normalizedUntracked: string[],
): Promise<void> {
  // normalizedUntracked为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
  if (normalizedUntracked.length === 0) return
  // !fileIndex || cachedTrackedFiles 文件数据为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
  if (!fileIndex || cachedTrackedFiles.length === 0) return

  // untrackedDirs 集合读取`getDirectoryNamesAsync`，供React hook后续处理使用。
  const untrackedDirs = await getDirectoryNamesAsync(normalizedUntracked)
  // allPaths 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
  const allPaths = [
    ...cachedTrackedFiles,
    ...cachedConfigFiles,
    ...cachedTrackedDirs,
    ...normalizedUntracked,
    ...untrackedDirs,
  ]
  // sig保存`pathListSignature`，供React hook后续处理使用。
  const sig = pathListSignature(allPaths)
  // 满足 `sig === loadedMergedSignature` 时，React hook执行该分支。
  if (sig === loadedMergedSignature) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[FileIndex] skipped index rebuild — merged paths unchanged`,
    )
    // React hook file Suggestions在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 等待 `fileIndex.loadFromFileListAsync(allPaths).done` 完成，再继续React hook file Suggestions的异步流程。
  await fileIndex.loadFromFileListAsync(allPaths).done
  // loadedMergedSignature更新为 `sig`，确保fileSuggestions后续读取最新状态。
  loadedMergedSignature = sig
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[FileIndex] rebuilt index with ${cachedTrackedFiles.length} tracked + ${normalizedUntracked.length} untracked files`,
  )
}

/**
 * Load ripgrep-specific ignore patterns from .ignore or .rgignore files
 * Returns an ignore instance if patterns were found, null otherwise
 * Results are cached per repoRoot:cwd combination
 */
// loadRipgrepIgnorePatterns 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadRipgrepIgnorePatterns(
  repoRoot: string,
  cwd: string,
): Promise<ReturnType<typeof ignore> | null> {
  // cacheKey 缓存固定为 ``${repoRoot}:${cwd}``，作为React hook file Sugge...后续展示或比较的基准。
  const cacheKey = `${repoRoot}:${cwd}`

  // Return cached result if available
  // 满足 `ignorePatternsCacheKey === cacheKey` 时，React hook执行该分支。
  if (ignorePatternsCacheKey === cacheKey) {
    // 返回 `ignorePatternsCache`，作为React hook 状态流这次计算的结果。
    return ignorePatternsCache
  }

  // fs 集合读取`getFsImplementation`，供React hook后续处理使用。
  const fs = getFsImplementation()
  // ignoreFiles 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
  const ignoreFiles = ['.ignore', '.rgignore']
  // directories 集合保存`Set`，供React hook后续处理使用。
  const directories = [...new Set([repoRoot, cwd])]

  // ig保存`ignore`，供React hook后续处理使用。
  const ig = ignore()
  // hasPatterns 集合标记React hook file Sugge...是否启用对应路径。
  let hasPatterns = false

  // 路径列表派生`directories.flatMap`，供React hook后续处理使用。
  const paths = directories.flatMap(dir =>
    // 调用 ignoreFiles.map，触发React hook此处需要的副作用。
    ignoreFiles.map(f => path.join(dir, f)),
  )
  // contents 集合保存`Promise.all`，供React hook后续处理使用。
  const contents = await Promise.all(
    // 调用 paths.map，触发React hook此处需要的副作用。
    paths.map(p => fs.readFile(p, { encoding: 'utf8' }).catch(() => null)),
  )
  // 循环处理 `const [i, content] of contents.entries()`，让React hook 状态流把同类条目按顺序走完。
  for (const [i, content] of contents.entries()) {
    // 满足 `content === null` 时，React hook执行该分支。
    if (content === null) continue
    // 调用 ig.add，触发React hook此处需要的副作用。
    ig.add(content)
    // hasPatterns 集合更新为 `true`，确保fileSuggestions后续读取最新状态。
    hasPatterns = true
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[FileIndex] loaded ignore patterns from ${paths[i]}`)
  }

  // 结果保存`hasPatterns ? ig : null`，供React hook file Sugge...后续判断或输出使用。
  const result = hasPatterns ? ig : null
  // ignorePatternsCache 缓存更新为 `result`，确保fileSuggestions后续读取最新状态。
  ignorePatternsCache = result
  // ignorePatternsCacheKey 缓存更新为 `cacheKey`，确保fileSuggestions后续读取最新状态。
  ignorePatternsCacheKey = cacheKey

  // 返回 `result`，作为React hook 状态流这次计算的结果。
  return result
}

/**
 * Get files using git ls-files (much faster than ripgrep for git repos)
 * Returns tracked files immediately, fetches untracked in background
 * @param respectGitignore If true, excludes gitignored files from untracked results
 *
 * Note: Unlike ripgrep --follow, git ls-files doesn't follow symlinks.
 * This is intentional as git tracks symlinks as symlinks.
 */
// getFilesUsingGit 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getFilesUsingGit(
  abortSignal: AbortSignal,
  respectGitignore: boolean,
): Promise<string[] | null> {
  // startTime记录时间`Date.now`，供React hook后续处理使用。
  const startTime = Date.now()
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[FileIndex] getFilesUsingGit called`)

  // Check if we're in a git repo. findGitRoot is LRU-memoized per path.
  // repoRoot筛选`findGitRoot`，供React hook后续处理使用。
  const repoRoot = findGitRoot(getCwd())
  // repoRoot缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!repoRoot) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[FileIndex] not a git repo, returning null`)
    // 返回 `null`，作为React hook 状态流这次计算的结果。
    return null
  }

  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // cwd读取`getCwd`，供React hook后续处理使用。
    const cwd = getCwd()

    // Get tracked files (fast - reads from git index)
    // Run from repoRoot so paths are relative to repo root, not CWD
    // lsFilesStart 文件数据记录时间`Date.now`，供React hook后续处理使用。
    const lsFilesStart = Date.now()
    // trackedResult保存`execFileNoThrowWithCwd`，供React hook后续处理使用。
    const trackedResult = await execFileNoThrowWithCwd(
      gitExe(),
      ['-c', 'core.quotepath=false', 'ls-files', '--recurse-submodules'],
      { timeout: 5000, abortSignal, cwd: repoRoot },
    )
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[FileIndex] git ls-files (tracked) took ${Date.now() - lsFilesStart}ms`,
    )

    // `trackedResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (trackedResult.code !== 0) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[FileIndex] git ls-files failed (code=${trackedResult.code}, stderr=${trackedResult.stderr}), falling back to ripgrep`,
      )
      // 返回 `null`，作为React hook 状态流这次计算的结果。
      return null
    }

    // trackedFiles 文件数据格式化`stdout.trim`，供React hook后续处理使用。
    const trackedFiles = trackedResult.stdout.trim().split('\n').filter(Boolean)

    // Normalize paths relative to the current working directory
    // normalizedTracked保存`normalizeGitPaths`，供React hook后续处理使用。
    let normalizedTracked = normalizeGitPaths(trackedFiles, repoRoot, cwd)

    // Apply .ignore/.rgignore patterns if present (faster than falling back to ripgrep)
    // ignorePatterns 集合读取`loadRipgrepIgnorePatterns`，供React hook后续处理使用。
    const ignorePatterns = await loadRipgrepIgnorePatterns(repoRoot, cwd)
    // 满足 `ignorePatterns` 时，React hook执行该分支。
    if (ignorePatterns) {
      // beforeCount 数量 命名 `normalizedTracked.length`，让后续代码直接表达这个值的用途。
      const beforeCount = normalizedTracked.length
      // normalizedTracked更新为 `ignorePatterns.filter(normalizedTracked)`，确保fileSuggestions后续读取最新状态。
      normalizedTracked = ignorePatterns.filter(normalizedTracked)
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[FileIndex] applied ignore patterns: ${beforeCount} -> ${normalizedTracked.length} files`,
      )
    }

    // Cache tracked files for later merge with untracked
    // cachedTrackedFiles 文件数据更新为 `normalizedTracked`，确保fileSuggestions后续读取最新状态。
    cachedTrackedFiles = normalizedTracked

    // duration记录时间`Date.now`，供React hook后续处理使用。
    const duration = Date.now() - startTime
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[FileIndex] git ls-files: ${normalizedTracked.length} tracked files in ${duration}ms`,
    )

    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_suggestions_git_ls_files', {
      file_count: normalizedTracked.length,
      tracked_count: normalizedTracked.length,
      untracked_count: 0,
      duration_ms: duration,
    })

    // Start background fetch for untracked files (don't await)
    // untrackedFetchPromise 异步任务缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!untrackedFetchPromise) {
      // untrackedArgs 集合 命名 `respectGitignore`，让后续代码直接表达这个值的用途。
      const untrackedArgs = respectGitignore
        ? [
            '-c',
            'core.quotepath=false',
            'ls-files',
            '--others',
            '--exclude-standard',
          ]
        : ['-c', 'core.quotepath=false', 'ls-files', '--others']

      // generation保存`cacheGeneration`，供后续判断或组装使用。
      const generation = cacheGeneration
      // untrackedFetchPromise 异步任务更新为 `execFileNoThrowWithCwd(gitExe(), untrackedArgs, {`，确保fileSuggestions后续读取最新状态。
      untrackedFetchPromise = execFileNoThrowWithCwd(gitExe(), untrackedArgs, {
        timeout: 10000,
        cwd: repoRoot,
      })
        // 链式调用 then，继续加工上一行在React hook 状态流中产生的数据。
        .then(async untrackedResult => {
          // `generation` 与 `cacheGeneration` 不一致时刷新派生状态，避免使用过期结果。
          if (generation !== cacheGeneration) {
            // 返回 `// Cache was cleared; don't merge stale untracked files`，作为React hook 状态流这次计算的结果。
            return // Cache was cleared; don't merge stale untracked files
          }
          // 满足 `untrackedResult.code === 0` 时，React hook执行该分支。
          if (untrackedResult.code === 0) {
            // rawUntrackedFiles 文件数据保存`untrackedResult.stdout`，供后续判断或组装使用。
            const rawUntrackedFiles = untrackedResult.stdout
              .trim()
              .split('\n')
              .filter(Boolean)

            // Normalize paths BEFORE applying ignore patterns (consistent with tracked files)
            // normalizedUntracked保存`normalizeGitPaths`，供React hook后续处理使用。
            let normalizedUntracked = normalizeGitPaths(
              rawUntrackedFiles,
              repoRoot,
              cwd,
            )

            // Apply .ignore/.rgignore patterns to normalized untracked files
            // ignorePatterns 集合读取`loadRipgrepIgnorePatterns`，供React hook后续处理使用。
            const ignorePatterns = await loadRipgrepIgnorePatterns(
              repoRoot,
              cwd,
            )
            // 组合条件 `ignorePatterns && normalizedUntracked.length > 0` 成立时，React hook 状态流才启用这条专门路径。
            if (ignorePatterns && normalizedUntracked.length > 0) {
              // beforeCount 数量 命名 `normalizedUntracked.length`，让后续代码直接表达这个值的用途。
              const beforeCount = normalizedUntracked.length
              // normalizedUntracked更新为 `ignorePatterns.filter(normalizedUntracked)`，确保fileSuggestions后续读取最新状态。
              normalizedUntracked = ignorePatterns.filter(normalizedUntracked)
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[FileIndex] applied ignore patterns to untracked: ${beforeCount} -> ${normalizedUntracked.length} files`,
              )
            }

            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[FileIndex] background untracked fetch: ${normalizedUntracked.length} files`,
            )
            // Pass already-normalized files directly to merge function
            // 显式忽略 `mergeUntrackedIntoNormalizedCache(normalizedUntracked)` 的返回值，只保留它触发的副作用。
            void mergeUntrackedIntoNormalizedCache(normalizedUntracked)
          }
        })
        // 链式调用 catch，继续加工上一行在React hook 状态流中产生的数据。
        .catch(error => {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[FileIndex] background untracked fetch failed: ${error}`,
          )
        })
        // 链式调用 finally，继续加工上一行在React hook 状态流中产生的数据。
        .finally(() => {
          // untrackedFetchPromise 异步任务更新为 `null`，确保fileSuggestions后续读取最新状态。
          untrackedFetchPromise = null
        })
    }

    // 返回 `normalizedTracked`，作为React hook 状态流这次计算的结果。
    return normalizedTracked
  } catch (error) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[FileIndex] git ls-files error: ${errorMessage(error)}`)
    // 返回 `null`，作为React hook 状态流这次计算的结果。
    return null
  }
}

/**
 * This function collects all parent directories for each file path
 * and returns a list of unique directory names with a trailing separator.
 * For example, if the input is ['src/index.js', 'src/utils/helpers.js'],
 * the output will be ['src/', 'src/utils/'].
 * @param files An array of file paths
 * @returns An array of unique directory names with a trailing separator
 */
// getDirectoryNames 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDirectoryNames(files: string[]): string[] {
  // directoryNames 集合构建`new Set<string>()` 整理出中间结果，供React hook file Sugge...后续步骤使用。
  const directoryNames = new Set<string>()
  // 调用 collectDirectoryNames，触发React hook此处需要的副作用。
  collectDirectoryNames(files, 0, files.length, directoryNames)
  // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
  return [...directoryNames].map(d => d + path.sep)
}

/**
 * Async variant: yields every ~10k files so 270k+ file lists don't block
 * the main thread for >10ms at a time.
 */
// getDirectoryNamesAsync 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getDirectoryNamesAsync(
  files: string[],
): Promise<string[]> {
  // directoryNames 集合构建`new Set<string>()` 整理出中间结果，供React hook file Sugge...后续步骤使用。
  const directoryNames = new Set<string>()
  // Time-based chunking: yield after CHUNK_MS of work so slow machines get
  // smaller chunks and stay responsive.
  // chunkStart记录时间`performance.now`，供React hook后续处理使用。
  let chunkStart = performance.now()
  // 按索引扫描 `files.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < files.length; i++) {
    // 调用 collectDirectoryNames，触发React hook此处需要的副作用。
    collectDirectoryNames(files, i, i + 1, directoryNames)
    // 组合条件 `(i & 0xff) === 0xff && performance.now() - chunkStart > CHUNK_MS` 成立时，React hook 状态流才启用这条专门路径。
    if ((i & 0xff) === 0xff && performance.now() - chunkStart > CHUNK_MS) {
      // 等待 `yieldToEventLoop()` 完成，再继续React hook file Suggestions的异步流程。
      await yieldToEventLoop()
      // chunkStart更新为 `performance.now()`，确保fileSuggestions后续读取最新状态。
      chunkStart = performance.now()
    }
  }
  // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
  return [...directoryNames].map(d => d + path.sep)
}

// collectDirectoryNames 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectDirectoryNames(
  files: string[],
  start: number,
  end: number,
  out: Set<string>,
): void {
  // 循环处理 `let i = start; i < end; i++`，让React hook 状态流逐项把同类条目按顺序走完。
  for (let i = start; i < end; i++) {
    // currentDir保存`path.dirname`，供React hook后续处理使用。
    let currentDir = path.dirname(files[i]!)
    // Early exit if we've already processed this directory and all its parents.
    // Root detection: path.dirname returns its input at the root (fixed point),
    // so we stop when dirname stops changing. Checking this before add() keeps
    // the root out of the result set (matching the old path.parse().root guard).
    // This avoids path.parse() which allocates a 5-field object per file.
    // 只要 currentDir !== '.' && !out.has(currentDir) 成立，就持续推进React hook 状态流中的循环处理。
    while (currentDir !== '.' && !out.has(currentDir)) {
      // parent保存`path.dirname`，供React hook后续处理使用。
      const parent = path.dirname(currentDir)
      // 满足 `parent === currentDir` 时，React hook执行该分支。
      if (parent === currentDir) break
      // 调用 out.add，触发React hook此处需要的副作用。
      out.add(currentDir)
      // currentDir更新为 `parent`，确保fileSuggestions后续读取最新状态。
      currentDir = parent
    }
  }
}

/**
 * Gets additional files from Claude config directories
 */
// getClaudeConfigFiles 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getClaudeConfigFiles(cwd: string): Promise<string[]> {
  // markdownFileArrays 文件数据保存`Promise.all`，供React hook后续处理使用。
  const markdownFileArrays = await Promise.all(
    CLAUDE_CONFIG_DIRECTORIES.map(subdir =>
      loadMarkdownFilesForSubdir(subdir, cwd),
    ),
  )
  // 返回 `markdownFileArrays.flatMap(markdownFiles =>`，作为React hook 状态流这次计算的结果。
  return markdownFileArrays.flatMap(markdownFiles =>
    // 调用 markdownFiles.map，触发React hook此处需要的副作用。
    markdownFiles.map(f => f.filePath),
  )
}

/**
 * Gets project files using git ls-files (fast) or ripgrep (fallback)
 */
// getProjectFiles 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getProjectFiles(
  abortSignal: AbortSignal,
  respectGitignore: boolean,
): Promise<string[]> {
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[FileIndex] getProjectFiles called, respectGitignore=${respectGitignore}`,
  )

  // Try git ls-files first (much faster for git repos)
  // gitFiles 文件数据读取`getFilesUsingGit`，供React hook后续处理使用。
  const gitFiles = await getFilesUsingGit(abortSignal, respectGitignore)
  // `gitFiles` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (gitFiles !== null) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[FileIndex] using git ls-files result (${gitFiles.length} files)`,
    )
    // 返回 `gitFiles`，作为React hook 状态流这次计算的结果。
    return gitFiles
  }

  // Fall back to ripgrep
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[FileIndex] git ls-files returned null, falling back to ripgrep`,
  )
  // startTime记录时间`Date.now`，供React hook后续处理使用。
  const startTime = Date.now()
  // rgArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const rgArgs = [
    '--files',
    '--follow',
    '--hidden',
    '--glob',
    '!.git/',
    '--glob',
    '!.svn/',
    '--glob',
    '!.hg/',
    '--glob',
    '!.bzr/',
    '--glob',
    '!.jj/',
    '--glob',
    '!.sl/',
  ]
  // respectGitignore缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!respectGitignore) {
    // rgArgs 集合追加新条目，保持收集顺序与输入顺序一致。
    rgArgs.push('--no-ignore-vcs')
  }

  // files 文件数据保存`ripGrep`，供React hook后续处理使用。
  const files = await ripGrep(rgArgs, '.', abortSignal)
  // relativePaths 路径数据派生`files.map`，供React hook后续处理使用。
  const relativePaths = files.map(f => path.relative(getCwd(), f))

  // duration记录时间`Date.now`，供React hook后续处理使用。
  const duration = Date.now() - startTime
  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[FileIndex] ripgrep: ${relativePaths.length} files in ${duration}ms`,
  )

  // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_file_suggestions_ripgrep', {
    file_count: relativePaths.length,
    duration_ms: duration,
  })

  // 返回 `relativePaths`，作为React hook 状态流这次计算的结果。
  return relativePaths
}

/**
 * Gets both files and their directory paths for providing path suggestions
 * Uses git ls-files for git repos (fast) or ripgrep as fallback
 * Returns a FileIndex populated for fast fuzzy search
 */
// getPathsForSuggestions 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPathsForSuggestions(): Promise<FileIndex> {
  // signal保存`AbortSignal.timeout`，供React hook后续处理使用。
  const signal = AbortSignal.timeout(10_000)
  // index 索引读取`getFileIndex`，供React hook后续处理使用。
  const index = getFileIndex()

  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // Check project settings first, then fall back to global config
    // projectSettings 集合读取`getInitialSettings`，供React hook后续处理使用。
    const projectSettings = getInitialSettings()
    // globalConfig 配置读取`getGlobalConfig`，供React hook后续处理使用。
    const globalConfig = getGlobalConfig()
    // respectGitignore 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const respectGitignore =
      projectSettings.respectGitignore ?? globalConfig.respectGitignore ?? true

    // cwd读取`getCwd`，供React hook后续处理使用。
    const cwd = getCwd()
    // 并行获取 projectFiles、configFiles，缩短React hook file Suggestions等待多个独立异步任务的时间。
    const [projectFiles, configFiles] = await Promise.all([
      getProjectFiles(signal, respectGitignore),
      getClaudeConfigFiles(cwd),
    ])

    // Cache for mergeUntrackedIntoNormalizedCache
    // cachedConfigFiles 文件数据更新为 `configFiles`，确保fileSuggestions后续读取最新状态。
    cachedConfigFiles = configFiles

    // allFiles 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
    const allFiles = [...projectFiles, ...configFiles]
    // directories 集合读取`getDirectoryNamesAsync`，供React hook后续处理使用。
    const directories = await getDirectoryNamesAsync(allFiles)
    // cachedTrackedDirs 缓存更新为 `directories`，确保fileSuggestions后续读取最新状态。
    cachedTrackedDirs = directories
    // allPathsList 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
    const allPathsList = [...directories, ...allFiles]

    // Skip rebuild when the list is unchanged. This is the common case
    // during a typing session — git ls-files returns the same output.
    // sig保存`pathListSignature`，供React hook后续处理使用。
    const sig = pathListSignature(allPathsList)
    // `sig` 与 `loadedTrackedSignature` 不一致时刷新派生状态，避免使用过期结果。
    if (sig !== loadedTrackedSignature) {
      // Await the full build so cold-start returns complete results. The
      // build yields every ~4ms so the UI stays responsive — user can keep
      // typing during the ~120ms wait without input lag.
      // 等待 `index.loadFromFileListAsync(allPathsList).done` 完成，再继续React hook file Suggestions的异步流程。
      await index.loadFromFileListAsync(allPathsList).done
      // loadedTrackedSignature更新为 `sig`，确保fileSuggestions后续读取最新状态。
      loadedTrackedSignature = sig
      // We just replaced the merged index with tracked-only data. Force
      // the next untracked merge to rebuild even if its own sig matches.
      // loadedMergedSignature更新为 `null`，确保fileSuggestions后续读取最新状态。
      loadedMergedSignature = null
    } else {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[FileIndex] skipped index rebuild — tracked paths unchanged`,
      )
    }
  } catch (error) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }

  // 返回 `index`，作为React hook 状态流这次计算的结果。
  return index
}

/**
 * Finds the common prefix between two strings
 */
// findCommonPrefix 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findCommonPrefix(a: string, b: string): string {
  // minLength 数量保存`Math.min`，供React hook后续处理使用。
  const minLength = Math.min(a.length, b.length)
  // i保存`0`，供React hook file Sugge...后续判断或输出使用。
  let i = 0
  // while 使用 i < minLength && a[i] === b[i] 完成React hook 状态流里的对应操作。
  while (i < minLength && a[i] === b[i]) {
    // React hook file Suggestions在这里处理 `i++`，完成这一小步状态转换。
    i++
  }
  // 返回 `a.substring(0, i)`，作为React hook 状态流这次计算的结果。
  return a.substring(0, i)
}

/**
 * Finds the longest common prefix among an array of suggestion items
 */
// findLongestCommonPrefix 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findLongestCommonPrefix(suggestions: SuggestionItem[]): string {
  // suggestions 集合为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
  if (suggestions.length === 0) return ''

  // strings 集合派生`suggestions.map`，供React hook后续处理使用。
  const strings = suggestions.map(item => item.displayText)
  // prefix 命名 `strings[0]!`，让后续代码直接表达这个值的用途。
  let prefix = strings[0]!
  // 循环处理 `let i = 1; i < strings.length; i++`，让React hook 状态流逐项把同类条目按顺序走完。
  for (let i = 1; i < strings.length; i++) {
    // currentString读取 `strings[i]!` 对应条目，后续围绕该成员继续处理。
    const currentString = strings[i]!
    // prefix更新为 `findCommonPrefix(prefix, currentString)`，确保fileSuggestions后续读取最新状态。
    prefix = findCommonPrefix(prefix, currentString)
    // 满足 `prefix === ''` 时，React hook执行该分支。
    if (prefix === '') return ''
  }
  // 返回 `prefix`，作为React hook 状态流这次计算的结果。
  return prefix
}

/**
 * Creates a file suggestion item
 */
// createFileSuggestionItem 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createFileSuggestionItem(
  filePath: string,
  score?: number,
): SuggestionItem {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    id: `file-${filePath}`,
    displayText: filePath,
    metadata: score !== undefined ? { score } : undefined,
  }
}

/**
 * Find matching files and folders for a given query using the TS file index
 */
// MAX_SUGGESTIONS 集合保存`15`，供后续判断或组装使用。
const MAX_SUGGESTIONS = 15
// findMatchingFiles 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findMatchingFiles(
  fileIndex: FileIndex,
  partialPath: string,
): SuggestionItem[] {
  // 结果列表保存`fileIndex.search`，供React hook后续处理使用。
  const results = fileIndex.search(partialPath, MAX_SUGGESTIONS)
  // 返回 `results.map(result =>`，作为React hook 状态流这次计算的结果。
  return results.map(result =>
    createFileSuggestionItem(result.path, result.score),
  )
}

/**
 * Starts a background refresh of the file index cache if not already in progress.
 *
 * Throttled: when a cache already exists, we skip the refresh unless git state
 * has actually changed. This prevents every keystroke from spawning git ls-files
 * and rebuilding the nucleo index.
 */
// REFRESH_THROTTLE_MS 集合保存`5_000`，供React hook file Sugge...后续判断或输出使用。
const REFRESH_THROTTLE_MS = 5_000
// startBackgroundCacheRefresh 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startBackgroundCacheRefresh(): void {
  // 满足 `fileListRefreshPromise` 时，React hook执行该分支。
  if (fileListRefreshPromise) return

  // Throttle only when a cache exists — cold start must always populate.
  // Refresh immediately when .git/index mtime changed (tracked files).
  // Otherwise refresh at most once per 5s — this floor picks up new UNTRACKED
  // files, which don't bump .git/index. The signature checks downstream skip
  // the rebuild when the 5s refresh finds nothing actually changed.
  // indexMtime 索引读取`getGitIndexMtime`，供React hook后续处理使用。
  const indexMtime = getGitIndexMtime()
  // 满足 `fileIndex` 时，React hook执行该分支。
  if (fileIndex) {
    // gitStateChanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const gitStateChanged =
      indexMtime !== null && indexMtime !== lastGitIndexMtime
    // 组合条件 `!gitStateChanged && Date.now() - lastRefreshMs < REFRESH_THROTTLE_MS` 成立时，React hook 状态流才启用这条专门路径。
    if (!gitStateChanged && Date.now() - lastRefreshMs < REFRESH_THROTTLE_MS) {
      // React hook file Suggestions在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // generation保存`cacheGeneration`，供后续判断或组装使用。
  const generation = cacheGeneration
  // refreshStart记录时间`Date.now`，供React hook后续处理使用。
  const refreshStart = Date.now()
  // Ensure the FileIndex singleton exists — it's progressively queryable
  // via readyCount while the build runs. Callers searching early get partial
  // results; indexBuildComplete fires after .done so they can re-search.
  // 调用 getFileIndex，触发React hook此处需要的副作用。
  getFileIndex()
  // fileListRefreshPromise 异步任务更新为 `getPathsForSuggestions()`，确保fileSuggestions后续读取最新状态。
  fileListRefreshPromise = getPathsForSuggestions()
    // 链式调用 then，继续加工上一行在React hook 状态流中产生的数据。
    .then(result => {
      // `generation` 与 `cacheGeneration` 不一致时刷新派生状态，避免使用过期结果。
      if (generation !== cacheGeneration) {
        // 返回 `result // Cache was cleared; don't overwrite with stale data`，作为React hook 状态流这次计算的结果。
        return result // Cache was cleared; don't overwrite with stale data
      }
      // fileListRefreshPromise 异步任务更新为 `null`，确保fileSuggestions后续读取最新状态。
      fileListRefreshPromise = null
      // 调用 indexBuildComplete.emit，触发React hook此处需要的副作用。
      indexBuildComplete.emit()
      // Commit the start-time mtime observation on success. If git state
      // changed mid-refresh, the next call will see the newer mtime and
      // correctly refresh again.
      // lastGitIndexMtime 索引更新为 `indexMtime`，确保fileSuggestions后续读取最新状态。
      lastGitIndexMtime = indexMtime
      // lastRefreshMs 集合更新为 `Date.now()`，确保fileSuggestions后续读取最新状态。
      lastRefreshMs = Date.now()
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[FileIndex] cache refresh completed in ${Date.now() - refreshStart}ms`,
      )
      // 返回 `result`，作为React hook 状态流这次计算的结果。
      return result
    })
    // 链式调用 catch，继续加工上一行在React hook 状态流中产生的数据。
    .catch(error => {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[FileIndex] Cache refresh failed: ${errorMessage(error)}`,
      )
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 满足 `generation === cacheGeneration` 时，React hook执行该分支。
      if (generation === cacheGeneration) {
        // fileListRefreshPromise 异步任务更新为 `null // Allow retry on next call`，确保fileSuggestions后续读取最新状态。
        fileListRefreshPromise = null // Allow retry on next call
      }
      // 返回 `getFileIndex()`，作为React hook 状态流这次计算的结果。
      return getFileIndex()
    })
}

/**
 * Gets the top-level files and directories in the current working directory
 * @returns Array of file/directory paths in the current directory
 */
// getTopLevelPaths 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getTopLevelPaths(): Promise<string[]> {
  // fs 集合读取`getFsImplementation`，供React hook后续处理使用。
  const fs = getFsImplementation()
  // cwd读取`getCwd`，供React hook后续处理使用。
  const cwd = getCwd()

  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合读取`fs.readdir`，供React hook后续处理使用。
    const entries = await fs.readdir(cwd)
    // 返回 `entries.map(entry => {`，作为React hook 状态流这次计算的结果。
    return entries.map(entry => {
      // fullPath 路径数据格式化`path.join`，供React hook后续处理使用。
      const fullPath = path.join(cwd, entry.name)
      // relativePath 路径数据保存`path.relative`，供React hook后续处理使用。
      const relativePath = path.relative(cwd, fullPath)
      // Add trailing separator for directories
      // 返回 `entry.isDirectory() ? relativePath + path.sep : relativePath`，作为React hook 状态流这次计算的结果。
      return entry.isDirectory() ? relativePath + path.sep : relativePath
    })
  } catch (error) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }
}

/**
 * Generate file suggestions for the current input and cursor position
 * @param partialPath The partial file path to match
 * @param showOnEmpty Whether to show suggestions even if partialPath is empty (used for @ symbol)
 */
// generateFileSuggestions 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateFileSuggestions(
  partialPath: string,
  showOnEmpty = false,
): Promise<SuggestionItem[]> {
  // If input is empty and we don't want to show suggestions on empty, return nothing
  // 组合条件 `!partialPath && !showOnEmpty` 成立时，React hook 状态流才启用这条专门路径。
  if (!partialPath && !showOnEmpty) {
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }

  // Use custom command directly if configured. We don't mix in our config files
  // because the command returns pre-ranked results using its own search logic.
  // 当 `getInitialSettings().fileSuggestion?.type` 匹配 `'command'` 时，React hook执行对应分支。
  if (getInitialSettings().fileSuggestion?.type === 'command') {
    // 用户输入 集中保存React hook file Suggestions要一起传递的字段。
    const input: FileSuggestionCommandInput = {
      ...createBaseHookInput(),
      query: partialPath,
    }
    // 结果列表保存`executeFileSuggestionCommand`，供React hook后续处理使用。
    const results = await executeFileSuggestionCommand(input)
    // 返回 `results.slice(0, MAX_SUGGESTIONS).map(createFileSuggestionItem)`，作为React hook 状态流这次计算的结果。
    return results.slice(0, MAX_SUGGESTIONS).map(createFileSuggestionItem)
  }

  // If the partial path is empty or just a dot, return current directory suggestions
  // 组合条件 `partialPath === '' || partialPath === '.' || part` 成立时，React hook 状态流才启用这条专门路径。
  if (partialPath === '' || partialPath === '.' || partialPath === './') {
    // topLevelPaths 路径数据读取`getTopLevelPaths`，供React hook后续处理使用。
    const topLevelPaths = await getTopLevelPaths()
    // 调用 startBackgroundCacheRefresh，触发React hook此处需要的副作用。
    startBackgroundCacheRefresh()
    // 返回 `topLevelPaths.slice(0, MAX_SUGGESTIONS).map(createFileSuggestionItem)`，作为React hook 状态流这次计算的结果。
    return topLevelPaths.slice(0, MAX_SUGGESTIONS).map(createFileSuggestionItem)
  }

  // startTime记录时间`Date.now`，供React hook后续处理使用。
  const startTime = Date.now()

  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // Kick a background refresh. The index is progressively queryable —
    // searches during build return partial results from ready chunks, and
    // the typeahead callback (setOnIndexBuildComplete) re-fires the search
    // when the build finishes to upgrade partial → full.
    // wasBuilding标记React hook file Sugge...是否启用对应路径。
    const wasBuilding = fileListRefreshPromise !== null
    // 调用 startBackgroundCacheRefresh，触发React hook此处需要的副作用。
    startBackgroundCacheRefresh()

    // Handle both './' and '.\'
    // normalizedPath 路径数据保存`partialPath`，供React hook file Sugge...后续判断或输出使用。
    let normalizedPath = partialPath
    // currentDirPrefix 命名 `'.' + path.sep`，让后续代码直接表达这个值的用途。
    const currentDirPrefix = '.' + path.sep
    // 满足 `partialPath.startsWith(currentDirPrefix)` 时，React hook执行该分支。
    if (partialPath.startsWith(currentDirPrefix)) {
      // normalizedPath 路径数据更新为 `partialPath.substring(2)`，确保fileSuggestions后续读取最新状态。
      normalizedPath = partialPath.substring(2)
    }

    // Handle tilde expansion for home directory
    // 满足 `normalizedPath.startsWith('~')` 时，React hook执行该分支。
    if (normalizedPath.startsWith('~')) {
      // normalizedPath 路径数据更新为 `expandPath(normalizedPath)`，确保fileSuggestions后续读取最新状态。
      normalizedPath = expandPath(normalizedPath)
    }

    // matches 集合保存`fileIndex`，供React hook file Sugge...后续判断或输出使用。
    const matches = fileIndex
      ? findMatchingFiles(fileIndex, normalizedPath)
      : []

    // duration记录时间`Date.now`，供React hook后续处理使用。
    const duration = Date.now() - startTime
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[FileIndex] generateFileSuggestions: ${matches.length} results in ${duration}ms (${wasBuilding ? 'partial' : 'full'} index)`,
    )
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_suggestions_query', {
      duration_ms: duration,
      cache_hit: !wasBuilding,
      result_count: matches.length,
      query_length: partialPath.length,
    })

    // 返回 `matches`，作为React hook 状态流这次计算的结果。
    return matches
  } catch (error) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }
}

/**
 * Apply a file suggestion to the input
 */
// applyFileSuggestion 封装fileSuggestions的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyFileSuggestion(
  suggestion: string | SuggestionItem,
  input: string,
  partialPath: string,
  startPos: number,
  // 这个回调绑定到 onInputChange: (value: string) => void,，负责React hook 状态流在该局部场景下的响应。
  onInputChange: (value: string) => void,
  // 这个回调绑定到 setCursorOffset: (offset: number) => void,，负责React hook 状态流在该局部场景下的响应。
  setCursorOffset: (offset: number) => void,
): void {
  // Extract suggestion text from string or SuggestionItem
  // suggestionText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const suggestionText =
    typeof suggestion === 'string' ? suggestion : suggestion.displayText

  // Replace the partial path with the selected file path
  // newInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const newInput =
    input.substring(0, startPos) +
    suggestionText +
    input.substring(startPos + partialPath.length)
  // 调用 onInputChange，触发React hook此处需要的副作用。
  onInputChange(newInput)

  // Move cursor to end of the file path
  // newCursorPos 集合保存 `startPos + suggestionText.length` 的判断结果，供React hook file Sugge...后续分支直接复用。
  const newCursorPos = startPos + suggestionText.length
  // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
  setCursorOffset(newCursorPos)
}
