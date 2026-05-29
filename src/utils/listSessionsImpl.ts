/**
 * Standalone implementation of listSessions for the Agent SDK.
 *
 * Dependencies are kept minimal and portable — no bootstrap/state.ts,
 * no analytics, no bun:bundle, no module-scope mutable state. This module
 * can be imported safely from the SDK entrypoint without triggering CLI
 * initialization or pulling in expensive dependency chains.
 */

// 类型依赖 { Dirent } 来自 fs，用于校准共享工具的数据契约。
import type { Dirent } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, join } from 'path'
// 引入 getWorktreePathsPortable，将 ./getWorktreePathsPortable.js 中已经封装好的能力接到本文件流程里。
import { getWorktreePathsPortable } from './getWorktreePathsPortable.js'
// 类型依赖 { LiteSessionFile } 来自 ./sessionStoragePortable.js，用于校准共享工具的数据契约。
import type { LiteSessionFile } from './sessionStoragePortable.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  canonicalizePath,
  extractFirstPromptFromHead,
  extractJsonStringField,
  extractLastJsonStringField,
  findProjectDir,
  getProjectsDir,
  MAX_SANITIZED_LENGTH,
  readSessionLite,
  sanitizePath,
  validateUuid,
} from './sessionStoragePortable.js'

/**
 * Session metadata returned by listSessions.
 * Contains only data extractable from stat + head/tail reads — no full
 * JSONL parsing required.
 */
// SessionInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionInfo = {
  sessionId: string
  summary: string
  lastModified: number
  fileSize?: number
  customTitle?: string
  firstPrompt?: string
  gitBranch?: string
  cwd?: string
  tag?: string
  /** Epoch ms — from first entry's ISO timestamp. Undefined if unparseable. */
  createdAt?: number
}

// ListSessionsOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ListSessionsOptions = {
  /**
   * Directory to list sessions for. When provided, returns sessions for
   * this project directory (and optionally its git worktrees). When omitted,
   * returns sessions across all projects.
   */
  dir?: string
  /** Maximum number of sessions to return. */
  limit?: number
  /**
   * Number of sessions to skip from the start of the sorted result set.
   * Use with `limit` for pagination. Defaults to 0.
   */
  offset?: number
  /**
   * When `dir` is provided and the directory is inside a git repository,
   * include sessions from all git worktree paths. Defaults to `true`.
   */
  includeWorktrees?: boolean
}

// ---------------------------------------------------------------------------
// Field extraction — shared by listSessionsImpl and getSessionInfoImpl
// ---------------------------------------------------------------------------

/**
 * Parses SessionInfo fields from a lite session read (head/tail/stat).
 * Returns null for sidechain sessions or metadata-only sessions with no
 * extractable summary.
 *
 * Exported for reuse by getSessionInfoImpl.
 */
// parseSessionInfoFromLite 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSessionInfoFromLite(
  sessionId: string,
  lite: LiteSessionFile,
  projectPath?: string,
): SessionInfo | null {
  // 从 `lite` 解构 head、tail、mtime、size，减少共享工具 list Sessions Impl对同一对象的重复访问。
  const { head, tail, mtime, size } = lite

  // Check first line for sidechain sessions
  // firstNewline保存`head.indexOf`，供共享工具后续处理使用。
  const firstNewline = head.indexOf('\n')
  // firstLine格式化`head.slice`，供共享工具后续处理使用。
  const firstLine = firstNewline >= 0 ? head.slice(0, firstNewline) : head
  // 共享工具在这里按实际状态进入对应分支。
  if (
    firstLine.includes('"isSidechain":true') ||
    firstLine.includes('"isSidechain": true')
  ) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // User title (customTitle) wins over AI title (aiTitle); distinct
  // field names mean extractLastJsonStringField naturally disambiguates.
  // customTitle 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const customTitle =
    extractLastJsonStringField(tail, 'customTitle') ||
    extractLastJsonStringField(head, 'customTitle') ||
    extractLastJsonStringField(tail, 'aiTitle') ||
    extractLastJsonStringField(head, 'aiTitle') ||
    undefined
  // firstPrompt保存`extractFirstPromptFromHead`，供共享工具后续处理使用。
  const firstPrompt = extractFirstPromptFromHead(head) || undefined
  // First entry's ISO timestamp → epoch ms. More reliable than
  // stat().birthtime which is unsupported on some filesystems.
  // firstTimestamp保存`extractJsonStringField`，供共享工具后续处理使用。
  const firstTimestamp = extractJsonStringField(head, 'timestamp')
  // createdAt 先占位，稍后的条件分支会根据实际输入补齐它。
  let createdAt: number | undefined
  // 满足 `firstTimestamp` 时，共享工具执行该分支。
  if (firstTimestamp) {
    // 解析结果解析`Date.parse`，供共享工具后续处理使用。
    const parsed = Date.parse(firstTimestamp)
    // 满足 `!Number.isNaN(parsed)` 时，共享工具执行该分支。
    if (!Number.isNaN(parsed)) createdAt = parsed
  }
  // last-prompt tail entry (captured by extractFirstPrompt at write
  // time, filtered) shows what the user was most recently doing.
  // Head scan is fallback for sessions without a last-prompt entry.
  // summary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const summary =
    customTitle ||
    extractLastJsonStringField(tail, 'lastPrompt') ||
    extractLastJsonStringField(tail, 'summary') ||
    firstPrompt

  // Skip metadata-only sessions (no title, no summary, no prompt)
  // summary缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!summary) return null
  // gitBranch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const gitBranch =
    extractLastJsonStringField(tail, 'gitBranch') ||
    extractJsonStringField(head, 'gitBranch') ||
    undefined
  // sessionCwd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sessionCwd =
    extractJsonStringField(head, 'cwd') || projectPath || undefined
  // Type-scope tag extraction to the {"type":"tag"} JSONL line to avoid
  // collision with tool_use inputs containing a `tag` parameter (git tag,
  // Docker tags, cloud resource tags). Mirrors sessionStorage.ts:608.
  // tagLine格式化`tail.split`，供共享工具后续处理使用。
  const tagLine = tail.split('\n').findLast(l => l.startsWith('{"type":"tag"'))
  // tag保存`tagLine`，供后续判断或组装使用。
  const tag = tagLine
    ? extractLastJsonStringField(tagLine, 'tag') || undefined
    : undefined

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    sessionId,
    summary,
    lastModified: mtime,
    fileSize: size,
    customTitle,
    firstPrompt,
    gitBranch,
    cwd: sessionCwd,
    tag,
    createdAt,
  }
}

// ---------------------------------------------------------------------------
// Candidate discovery — stat-only pass. Cheap: 1 syscall per file, no
// data reads. Lets us sort/filter before doing expensive head/tail reads.
// ---------------------------------------------------------------------------

// Candidate 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Candidate = {
  sessionId: string
  filePath: string
  mtime: number
  /** Project path for cwd fallback when file lacks a cwd field. */
  projectPath?: string
}

/**
 * Lists candidate session files in a directory via readdir, optionally
 * stat'ing each for mtime. When `doStat` is false, mtime is set to 0
 * (caller must sort/dedup after reading file contents instead).
 */
// listCandidates 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listCandidates(
  projectDir: string,
  doStat: boolean,
  projectPath?: string,
): Promise<Candidate[]> {
  // names 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let names: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // names 集合更新为 `await readdir(projectDir)`，确保共享工具后续读取最新状态。
    names = await readdir(projectDir)
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 names.map，触发共享工具此处需要的副作用。
    names.map(async (name): Promise<Candidate | null> => {
      // 满足 `!name.endsWith('.jsonl')` 时，共享工具执行该分支。
      if (!name.endsWith('.jsonl')) return null
      // sessionId 会话数据读取`validateUuid`，供共享工具后续处理使用。
      const sessionId = validateUuid(name.slice(0, -6))
      // sessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!sessionId) return null
      // 文件路径格式化`join`，供共享工具后续处理使用。
      const filePath = join(projectDir, name)
      // doStat缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!doStat) return { sessionId, filePath, mtime: 0, projectPath }
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // s 集合保存`stat`，供共享工具后续处理使用。
        const s = await stat(filePath)
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { sessionId, filePath, mtime: s.mtime.getTime(), projectPath }
      } catch {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )

  // 返回 `results.filter((c): c is Candidate => c !== null)`，作为共享工具这次计算的结果。
  return results.filter((c): c is Candidate => c !== null)
}

/**
 * Reads a candidate's file contents and extracts full SessionInfo.
 * Returns null if the session should be filtered out (sidechain, no summary).
 */
// readCandidate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readCandidate(c: Candidate): Promise<SessionInfo | null> {
  // lite读取`readSessionLite`，供共享工具后续处理使用。
  const lite = await readSessionLite(c.filePath)
  // lite缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lite) return null

  // info解析`parseSessionInfoFromLite`，供共享工具后续处理使用。
  const info = parseSessionInfoFromLite(c.sessionId, lite, c.projectPath)
  // info缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!info) return null

  // Prefer stat-pass mtime for sort-key consistency; fall back to
  // lite.mtime when doStat=false (c.mtime is 0 placeholder).
  // 满足 `c.mtime` 时，共享工具执行该分支。
  if (c.mtime) info.lastModified = c.mtime

  // 返回 `info`，作为共享工具这次计算的结果。
  return info
}

// ---------------------------------------------------------------------------
// Sort + limit — batch-read candidates in sorted order until `limit`
// survivors are collected (some candidates filter out on full read).
// ---------------------------------------------------------------------------

/** Batch size for concurrent reads when walking the sorted candidate list. */
// READ_BATCH_SIZE保存`32`，供共享工具 list Sessions Impl后续判断或输出使用。
const READ_BATCH_SIZE = 32

/**
 * Sort comparator: lastModified desc, then sessionId desc for stable
 * ordering across mtime ties.
 */
// compareDesc 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function compareDesc(a: Candidate, b: Candidate): number {
  // `b.mtime` 与 `a.mtime` 不一致时刷新派生状态，避免使用过期结果。
  if (b.mtime !== a.mtime) return b.mtime - a.mtime
  // 返回 `b.sessionId < a.sessionId ? -1 : b.sessionId > a.sessionId ? 1 : 0`，作为共享工具这次计算的结果。
  return b.sessionId < a.sessionId ? -1 : b.sessionId > a.sessionId ? 1 : 0
}

// applySortAndLimit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function applySortAndLimit(
  candidates: Candidate[],
  limit: number | undefined,
  offset: number,
): Promise<SessionInfo[]> {
  // 调用 candidates.sort，触发共享工具此处需要的副作用。
  candidates.sort(compareDesc)

  // sessions 会话数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sessions: SessionInfo[] = []
  // limit: 0 means "no limit" (matches getSessionMessages semantics)
  // want标记共享工具 list Sessions Impl是否启用对应路径。
  const want = limit && limit > 0 ? limit : Infinity
  // skipped 命名 `0`，让后续代码直接表达这个值的用途。
  let skipped = 0
  // Dedup post-filter: since candidates are sorted mtime-desc, the first
  // non-null read per sessionId is naturally the newest valid copy.
  // Pre-filter dedup would drop a session entirely if its newest-mtime
  // copy is unreadable/empty, diverging from the no-stat readAllAndSort path.
  // seen 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const seen = new Set<string>()

  // 循环处理 `let i = 0; i < candidates.length && sessions.leng`，让共享工具逐项把同类条目按顺序走完。
  for (let i = 0; i < candidates.length && sessions.length < want; ) {
    // batchEnd保存`Math.min`，供共享工具后续处理使用。
    const batchEnd = Math.min(i + READ_BATCH_SIZE, candidates.length)
    // batch格式化`candidates.slice`，供共享工具后续处理使用。
    const batch = candidates.slice(i, batchEnd)
    // 结果列表保存`Promise.all`，供共享工具后续处理使用。
    const results = await Promise.all(batch.map(readCandidate))
    // 循环处理 `let j = 0; j < results.length && sessions.length`，让共享工具逐项把同类条目按顺序走完。
    for (let j = 0; j < results.length && sessions.length < want; j++) {
      // 共享工具 list Sessions Impl在这里处理 `i++`，完成这一小步状态转换。
      i++
      // r保存`results[j]`，供共享工具 list Sessions Impl后续判断或输出使用。
      const r = results[j]
      // r缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!r) continue
      // 满足 `seen.has(r.sessionId)` 时，共享工具执行该分支。
      if (seen.has(r.sessionId)) continue
      // 调用 seen.add，触发共享工具此处需要的副作用。
      seen.add(r.sessionId)
      // 满足 `skipped < offset` 时，共享工具执行该分支。
      if (skipped < offset) {
        // 共享工具 list Sessions Impl在这里处理 `skipped++`，完成这一小步状态转换。
        skipped++
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // sessions 会话数据追加新条目，保持收集顺序与输入顺序一致。
      sessions.push(r)
    }
  }

  // 返回 `sessions`，作为共享工具这次计算的结果。
  return sessions
}

/**
 * Read-all path for when no limit/offset is set. Skips the stat pass
 * entirely — reads every candidate, then sorts/dedups on real mtimes
 * from readSessionLite. Matches pre-refactor I/O cost (no extra stats).
 */
// readAllAndSort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readAllAndSort(candidates: Candidate[]): Promise<SessionInfo[]> {
  // all保存`Promise.all`，供共享工具后续处理使用。
  const all = await Promise.all(candidates.map(readCandidate))
  // byId构建`new Map<string, SessionInfo>()`，供后续判断或组装使用。
  const byId = new Map<string, SessionInfo>()
  // 按顺序遍历 `all` 中的s 集合，逐个交给共享工具处理。
  for (const s of all) {
    // s 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!s) continue
    // existing读取`byId.get`，供共享工具后续处理使用。
    const existing = byId.get(s.sessionId)
    // 只有 `!existing || s.lastModified > existing.lastModifi` 满足时，共享工具才执行该分支。
    if (!existing || s.lastModified > existing.lastModified) {
      // byId.set 写入新的状态值，使共享工具后续读取保持一致。
      byId.set(s.sessionId, s)
    }
  }
  // sessions 会话数据保存`byId.values`，供共享工具后续处理使用。
  const sessions = [...byId.values()]
  // 调用 sessions.sort，触发共享工具此处需要的副作用。
  sessions.sort((a, b) =>
    b.lastModified !== a.lastModified
      ? b.lastModified - a.lastModified
      : b.sessionId < a.sessionId
        ? -1
        : b.sessionId > a.sessionId
          ? 1
          : 0,
  )
  // 返回 `sessions`，作为共享工具这次计算的结果。
  return sessions
}

// ---------------------------------------------------------------------------
// Project directory enumeration (single-project vs all-projects)
// ---------------------------------------------------------------------------

/**
 * Gathers candidate session files for a specific project directory
 * (and optionally its git worktrees).
 */
// gatherProjectCandidates 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function gatherProjectCandidates(
  dir: string,
  includeWorktrees: boolean,
  doStat: boolean,
): Promise<Candidate[]> {
  // canonicalDir保存`canonicalizePath`，供共享工具后续处理使用。
  const canonicalDir = await canonicalizePath(dir)

  // worktreePaths 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let worktreePaths: string[]
  // 满足 `includeWorktrees` 时，共享工具执行该分支。
  if (includeWorktrees) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // worktreePaths 路径数据更新为 `await getWorktreePathsPortable(canonicalDir)`，确保共享工具后续读取最新状态。
      worktreePaths = await getWorktreePathsPortable(canonicalDir)
    } catch {
      // worktreePaths 路径数据更新为 `[]`，确保共享工具后续读取最新状态。
      worktreePaths = []
    }
  } else {
    // worktreePaths 路径数据更新为 `[]`，确保共享工具后续读取最新状态。
    worktreePaths = []
  }

  // No worktrees (or git not available / scanning disabled) — just scan the single project dir
  // 满足 `worktreePaths.length <= 1` 时，共享工具执行该分支。
  if (worktreePaths.length <= 1) {
    // projectDir筛选`findProjectDir`，供共享工具后续处理使用。
    const projectDir = await findProjectDir(canonicalDir)
    // projectDir缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!projectDir) return []
    // 返回 `listCandidates(projectDir, doStat, canonicalDir)`，作为共享工具这次计算的结果。
    return listCandidates(projectDir, doStat, canonicalDir)
  }

  // Worktree-aware scanning: find all project dirs matching any worktree
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()
  // caseInsensitive标记共享工具 list Sessions Impl是否启用对应路径。
  const caseInsensitive = process.platform === 'win32'

  // Sort worktree paths by sanitized prefix length (longest first) so
  // more specific matches take priority over shorter ones
  // indexed 索引派生`worktreePaths.map`，供共享工具后续处理使用。
  const indexed = worktreePaths.map(wt => {
    // sanitized保存`sanitizePath`，供共享工具后续处理使用。
    const sanitized = sanitizePath(wt)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      path: wt,
      prefix: caseInsensitive ? sanitized.toLowerCase() : sanitized,
    }
  })
  // 调用 indexed.sort，触发共享工具此处需要的副作用。
  indexed.sort((a, b) => b.prefix.length - a.prefix.length)

  // allDirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let allDirents: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // allDirents 集合更新为 `await readdir(projectsDir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    allDirents = await readdir(projectsDir, { withFileTypes: true })
  } catch {
    // Fall back to single project dir
    // projectDir筛选`findProjectDir`，供共享工具后续处理使用。
    const projectDir = await findProjectDir(canonicalDir)
    // projectDir缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!projectDir) return []
    // 返回 `listCandidates(projectDir, doStat, canonicalDir)`，作为共享工具这次计算的结果。
    return listCandidates(projectDir, doStat, canonicalDir)
  }

  // all 从空数组开始收集，后续循环会按处理顺序追加条目。
  const all: Candidate[] = []
  // seenDirs 集合构建`new Set<string>()` 整理出中间结果，供共享工具 list Sessions Impl后续步骤使用。
  const seenDirs = new Set<string>()

  // Always include the user's actual directory (handles subdirectories
  // like /repo/packages/my-app that won't match worktree root prefixes)
  // canonicalProjectDir筛选`findProjectDir`，供共享工具后续处理使用。
  const canonicalProjectDir = await findProjectDir(canonicalDir)
  // 满足 `canonicalProjectDir` 时，共享工具执行该分支。
  if (canonicalProjectDir) {
    // dirBase保存`basename`，供共享工具后续处理使用。
    const dirBase = basename(canonicalProjectDir)
    // 调用 seenDirs.add，触发共享工具此处需要的副作用。
    seenDirs.add(caseInsensitive ? dirBase.toLowerCase() : dirBase)
    // all追加新条目，保持收集顺序与输入顺序一致。
    all.push(
      ...(await listCandidates(canonicalProjectDir, doStat, canonicalDir)),
    )
  }

  // 按顺序遍历 `allDirents` 中的dirent，逐个交给共享工具处理。
  for (const dirent of allDirents) {
    // 满足 `!dirent.isDirectory()` 时，共享工具执行该分支。
    if (!dirent.isDirectory()) continue
    // dirName保存`name.toLowerCase`，供共享工具后续处理使用。
    const dirName = caseInsensitive ? dirent.name.toLowerCase() : dirent.name
    // 满足 `seenDirs.has(dirName)` 时，共享工具执行该分支。
    if (seenDirs.has(dirName)) continue

    // 循环处理 `const { path: wtPath, prefix } of indexed`，让共享工具逐项把同类条目按顺序走完。
    for (const { path: wtPath, prefix } of indexed) {
      // Only use startsWith for truncated paths (>MAX_SANITIZED_LENGTH) where
      // a hash suffix follows. For short paths, require exact match to avoid
      // /root/project matching /root/project-foo.
      // isMatch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isMatch =
        dirName === prefix ||
        (prefix.length >= MAX_SANITIZED_LENGTH &&
          dirName.startsWith(prefix + '-'))
      // 满足 `isMatch` 时，共享工具执行该分支。
      if (isMatch) {
        // 调用 seenDirs.add，触发共享工具此处需要的副作用。
        seenDirs.add(dirName)
        // all追加新条目，保持收集顺序与输入顺序一致。
        all.push(
          ...(await listCandidates(
            join(projectsDir, dirent.name),
            doStat,
            wtPath,
          )),
        )
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
  }

  // 返回 `all`，作为共享工具这次计算的结果。
  return all
}

/**
 * Gathers candidate session files across all project directories.
 */
// gatherAllCandidates 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function gatherAllCandidates(doStat: boolean): Promise<Candidate[]> {
  // projectsDir读取`getProjectsDir`，供共享工具后续处理使用。
  const projectsDir = getProjectsDir()

  // dirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let dirents: Dirent[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await readdir(projectsDir, { withFileTypes: true })`，确保共享工具后续读取最新状态。
    dirents = await readdir(projectsDir, { withFileTypes: true })
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // perProject保存`Promise.all`，供共享工具后续处理使用。
  const perProject = await Promise.all(
    dirents
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(d => d.isDirectory())
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(d => listCandidates(join(projectsDir, d.name), doStat)),
  )

  // 返回 `perProject.flat()`，作为共享工具这次计算的结果。
  return perProject.flat()
}

/**
 * Lists sessions with metadata extracted from stat + head/tail reads.
 *
 * When `dir` is provided, returns sessions for that project directory
 * and its git worktrees. When omitted, returns sessions across all
 * projects.
 *
 * Pagination via `limit`/`offset` operates on the filtered, sorted result
 * set. When either is set, a cheap stat-only pass sorts candidates before
 * expensive head/tail reads — so `limit: 20` on a directory with 1000
 * sessions does ~1000 stats + ~20 content reads, not 1000 content reads.
 * When neither is set, stat is skipped (read-all-then-sort, same I/O cost
 * as the original implementation).
 */
// listSessionsImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listSessionsImpl(
  options?: ListSessionsOptions,
): Promise<SessionInfo[]> {
  // 从 `options ?? {}` 解构 dir、limit、offset、includeWorktrees，减少共享工具 list Sessions Impl对同一对象的重复访问。
  const { dir, limit, offset, includeWorktrees } = options ?? {}
  // off 命名 `offset ?? 0`，让后续代码直接表达这个值的用途。
  const off = offset ?? 0
  // Only stat when we need to sort before reading (won't read all anyway).
  // limit: 0 means "no limit" (see applySortAndLimit), so treat it as unset.
  // doStat标记共享工具 list Sessions Impl是否启用对应路径。
  const doStat = (limit !== undefined && limit > 0) || off > 0

  // candidates 集合 命名 `dir`，让后续代码直接表达这个值的用途。
  const candidates = dir
    ? await gatherProjectCandidates(dir, includeWorktrees ?? true, doStat)
    : await gatherAllCandidates(doStat)

  // 满足 `!doStat) return readAllAndSort(candidates` 时，共享工具执行该分支。
  if (!doStat) return readAllAndSort(candidates)
  // 返回 `applySortAndLimit(candidates, limit, off)`，作为共享工具这次计算的结果。
  return applySortAndLimit(candidates, limit, off)
}
