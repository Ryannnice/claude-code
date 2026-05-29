/**
 * Filesystem-based git state reading — avoids spawning git subprocesses.
 *
 * Covers: resolving .git directories (including worktrees/submodules),
 * parsing HEAD, resolving refs via loose files and packed-refs,
 * and the GitHeadWatcher that caches branch/SHA with fs.watchFile.
 *
 * Correctness notes (verified against git source):
 *   - HEAD: `ref: refs/heads/<branch>\n` or raw SHA (refs/files-backend.c)
 *   - Packed-refs: `<sha> <refname>\n`, skip `#` and `^` lines (packed-backend.c)
 *   - .git file (worktree): `gitdir: <path>\n` with optional relative path (setup.c)
 *   - Shallow: mere existence of `<commonDir>/shallow` means shallow (shallow.c)
 */

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { unwatchFile, watchFile } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, readFile, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, resolve } from 'path'
// 引入 waitForScrollIdle，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { waitForScrollIdle } from '../../bootstrap/state.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 findGitRoot，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { findGitRoot } from '../git.js'
// 引入 parseGitConfigValue，将 ./gitConfigParser.js 中已经封装好的能力接到本文件流程里。
import { parseGitConfigValue } from './gitConfigParser.js'

// ---------------------------------------------------------------------------
// resolveGitDir — find the actual .git directory
// ---------------------------------------------------------------------------

// resolveGitDirCache 缓存构建`new Map<string, string | null>()`，供后续判断或组装使用。
const resolveGitDirCache = new Map<string, string | null>()

/** Clear cached git dir resolutions. Exported for testing only. */
// clearResolveGitDirCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearResolveGitDirCache(): void {
  // resolveGitDirCache.clear 结算当前 Promise，唤醒等待这个异步结果的调用方。
  resolveGitDirCache.clear()
}

/**
 * Resolve the actual .git directory for a repo.
 * Handles worktrees/submodules where .git is a file containing `gitdir: <path>`.
 * Memoized per startPath.
 */
// resolveGitDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveGitDir(
  startPath?: string,
): Promise<string | null> {
  // cwd读取`resolve`，供共享工具后续处理使用。
  const cwd = resolve(startPath ?? getCwd())
  // cached 缓存读取`resolveGitDirCache.get`，供共享工具后续处理使用。
  const cached = resolveGitDirCache.get(cwd)
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) {
    // 返回 `cached`，作为共享工具这次计算的结果。
    return cached
  }

  // root筛选`findGitRoot`，供共享工具后续处理使用。
  const root = findGitRoot(cwd)
  // root缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!root) {
    // resolveGitDirCache.set 写入新的状态值，使共享工具后续读取保持一致。
    resolveGitDirCache.set(cwd, null)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // gitPath 路径数据格式化`join`，供共享工具后续处理使用。
  const gitPath = join(root, '.git')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // st保存`stat`，供共享工具后续处理使用。
    const st = await stat(gitPath)
    // 满足 `st.isFile()` 时，共享工具执行该分支。
    if (st.isFile()) {
      // Worktree or submodule: .git is a file with `gitdir: <path>`
      // Git strips trailing \n and \r (setup.c read_gitfile_gently).
      // 文本内容读取`readFile`，供共享工具后续处理使用。
      const content = (await readFile(gitPath, 'utf-8')).trim()
      // 满足 `content.startsWith('gitdir:')` 时，共享工具执行该分支。
      if (content.startsWith('gitdir:')) {
        // rawDir格式化`content.slice`，供共享工具后续处理使用。
        const rawDir = content.slice('gitdir:'.length).trim()
        // resolved读取`resolve`，供共享工具后续处理使用。
        const resolved = resolve(root, rawDir)
        // resolveGitDirCache.set 写入新的状态值，使共享工具后续读取保持一致。
        resolveGitDirCache.set(cwd, resolved)
        // 返回 `resolved`，作为共享工具这次计算的结果。
        return resolved
      }
    }
    // Regular repo: .git is a directory
    // resolveGitDirCache.set 写入新的状态值，使共享工具后续读取保持一致。
    resolveGitDirCache.set(cwd, gitPath)
    // 返回 `gitPath`，作为共享工具这次计算的结果。
    return gitPath
  } catch {
    // resolveGitDirCache.set 写入新的状态值，使共享工具后续读取保持一致。
    resolveGitDirCache.set(cwd, null)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// ---------------------------------------------------------------------------
// isSafeRefName — validate ref/branch names read from .git/
// ---------------------------------------------------------------------------

/**
 * Validate that a ref/branch name read from .git/ is safe to use in path
 * joins, as git positional arguments, and when interpolated into shell
 * commands (commit-push-pr skill interpolates the branch into shell).
 * An attacker who controls .git/HEAD or a loose ref file could otherwise
 * embed path traversal (`..`), argument injection (leading `-`), or shell
 * metacharacters — .git/HEAD is a plain text file that can be written
 * without git's own check-ref-format validation.
 *
 * Allowlist: ASCII alphanumerics, `/`, `.`, `_`, `+`, `-`, `@` only. This
 * covers all legitimate git branch names (e.g. `feature/foo`,
 * `release-1.2.3+build`, `dependabot/npm_and_yarn/@types/node-18.0.0`)
 * while rejecting everything that could be dangerous in shell context
 * (newlines, backticks, `$`, `;`, `|`, `&`, `(`, `)`, `<`, `>`, spaces,
 * tabs, quotes, backslash) and path traversal (`..`).
 */
// isSafeRefName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSafeRefName(name: string): boolean {
  // 只有 `!name || name.startsWith('-') || name.startsWith('/')` 满足时，共享工具才执行该分支。
  if (!name || name.startsWith('-') || name.startsWith('/')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `name.includes('..')` 时，共享工具执行该分支。
  if (name.includes('..')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Reject single-dot and empty path components (`.`, `foo/./bar`, `foo//bar`,
  // `foo/`). Git-check-ref-format rejects these, and `.` normalizes away in
  // path joins so a tampered HEAD of `refs/heads/.` would make us watch the
  // refs/heads directory itself instead of a branch file.
  // 只有 `name.split('/').some(c => c === '.' || c === '')` 满足时，共享工具才执行该分支。
  if (name.split('/').some(c => c === '.' || c === '')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Allowlist-only: alphanumerics, /, ., _, +, -, @. Rejects all shell
  // metacharacters, whitespace, NUL, and non-ASCII. Git's forbidden @{
  // sequence is blocked because { is not in the allowlist.
  // 满足 `!/^[a-zA-Z0-9/._+@-]+$/.test(name)` 时，共享工具执行该分支。
  if (!/^[a-zA-Z0-9/._+@-]+$/.test(name)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Validate that a string is a git SHA: 40 hex chars (SHA-1) or 64 hex chars
 * (SHA-256). Git never writes abbreviated SHAs to HEAD or ref files, so we
 * only accept full-length hashes.
 *
 * An attacker who controls .git/HEAD when detached, or a loose ref file,
 * could otherwise return arbitrary content that flows into shell contexts.
 */
// isValidGitSha 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isValidGitSha(s: string): boolean {
  // 返回 `/^[0-9a-f]{40}$/.test(s) || /^[0-9a-f]{64}$/.test(s)`，作为共享工具这次计算的结果。
  return /^[0-9a-f]{40}$/.test(s) || /^[0-9a-f]{64}$/.test(s)
}

// ---------------------------------------------------------------------------
// readGitHead — parse .git/HEAD
// ---------------------------------------------------------------------------

/**
 * Parse .git/HEAD to determine current branch or detached SHA.
 *
 * HEAD format (per git source, refs/files-backend.c):
 *   - `ref: refs/heads/<branch>\n`  — on a branch
 *   - `ref: <other-ref>\n`          — unusual symref (e.g. during bisect)
 *   - `<hex-sha>\n`                 — detached HEAD (e.g. during rebase)
 *
 * Git strips trailing whitespace via strbuf_rtrim; .trim() is equivalent.
 * Git allows any whitespace between "ref:" and the path; we handle
 * this by trimming after slicing past "ref:".
 */
// readGitHead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readGitHead(
  gitDir: string,
): Promise<
  { type: 'branch'; name: string } | { type: 'detached'; sha: string } | null
> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = (await readFile(join(gitDir, 'HEAD'), 'utf-8')).trim()
    // 满足 `content.startsWith('ref:')` 时，共享工具执行该分支。
    if (content.startsWith('ref:')) {
      // ref 引用格式化`content.slice`，供共享工具后续处理使用。
      const ref = content.slice('ref:'.length).trim()
      // 满足 `ref.startsWith('refs/heads/')` 时，共享工具执行该分支。
      if (ref.startsWith('refs/heads/')) {
        // 名称格式化`ref.slice`，供共享工具后续处理使用。
        const name = ref.slice('refs/heads/'.length)
        // Reject path traversal and argument injection from a tampered HEAD.
        // 满足 `!isSafeRefName(name)` 时，共享工具执行该分支。
        if (!isSafeRefName(name)) {
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { type: 'branch', name }
      }
      // Unusual symref (not a local branch) — resolve to SHA
      // 满足 `!isSafeRefName(ref)` 时，共享工具执行该分支。
      if (!isSafeRefName(ref)) {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
      // sha读取`resolveRef`，供共享工具后续处理使用。
      const sha = await resolveRef(gitDir, ref)
      // 返回 `sha ? { type: 'detached', sha } : { type: 'detached', sha: '' }`，作为共享工具这次计算的结果。
      return sha ? { type: 'detached', sha } : { type: 'detached', sha: '' }
    }
    // Raw SHA (detached HEAD). Validate: an attacker-controlled HEAD file
    // could contain shell metacharacters that flow into downstream shell
    // contexts.
    // 满足 `!isValidGitSha(content)` 时，共享工具执行该分支。
    if (!isValidGitSha(content)) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'detached', sha: content }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// ---------------------------------------------------------------------------
// resolveRef — resolve loose/packed refs to SHAs
// ---------------------------------------------------------------------------

/**
 * Resolve a git ref (e.g. `refs/heads/main`) to a commit SHA.
 * Checks loose ref files first, then falls back to packed-refs.
 * Follows symrefs (e.g. `ref: refs/remotes/origin/main`).
 *
 * For worktrees, refs live in the common gitdir (pointed to by the
 * `commondir` file), not the worktree-specific gitdir. We check the
 * worktree gitdir first, then fall back to the common dir.
 *
 * Packed-refs format (per packed-backend.c):
 *   - Header: `# pack-refs with: <traits>\n`
 *   - Entries: `<40-hex-sha> <refname>\n`
 *   - Peeled:  `^<40-hex-sha>\n` (after annotated tag entries)
 */
// resolveRef 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveRef(
  gitDir: string,
  ref: string,
): Promise<string | null> {
  // 结果读取`resolveRefInDir`，供共享工具后续处理使用。
  const result = await resolveRefInDir(gitDir, ref)
  // 满足 `result` 时，共享工具执行该分支。
  if (result) {
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // For worktrees: try the common gitdir where shared refs live
  // commonDir读取`getCommonDir`，供共享工具后续处理使用。
  const commonDir = await getCommonDir(gitDir)
  // `commonDir && commonDir` 与 `gitDir` 不一致时刷新派生状态，避免使用过期结果。
  if (commonDir && commonDir !== gitDir) {
    // 返回 `resolveRefInDir(commonDir, ref)`，作为共享工具这次计算的结果。
    return resolveRefInDir(commonDir, ref)
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// resolveRefInDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function resolveRefInDir(
  dir: string,
  ref: string,
): Promise<string | null> {
  // Try loose ref file
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = (await readFile(join(dir, ref), 'utf-8')).trim()
    // 满足 `content.startsWith('ref:')` 时，共享工具执行该分支。
    if (content.startsWith('ref:')) {
      // target格式化`content.slice`，供共享工具后续处理使用。
      const target = content.slice('ref:'.length).trim()
      // Reject path traversal in a tampered symref chain.
      // 满足 `!isSafeRefName(target)` 时，共享工具执行该分支。
      if (!isSafeRefName(target)) {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
      // 返回 `resolveRef(dir, target)`，作为共享工具这次计算的结果。
      return resolveRef(dir, target)
    }
    // Loose ref content should be a raw SHA. Validate: an attacker-controlled
    // ref file could contain shell metacharacters.
    // 满足 `!isValidGitSha(content)` 时，共享工具执行该分支。
    if (!isValidGitSha(content)) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  } catch {
    // Loose ref doesn't exist, try packed-refs
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // packed读取`readFile`，供共享工具后续处理使用。
    const packed = await readFile(join(dir, 'packed-refs'), 'utf-8')
    // 逐项读取 `packed.split('\n')` 中的line，按输入顺序推进共享工具。
    for (const line of packed.split('\n')) {
      // 只有 `line.startsWith('#') || line.startsWith('^')` 满足时，共享工具才执行该分支。
      if (line.startsWith('#') || line.startsWith('^')) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // spaceIdx保存`line.indexOf`，供共享工具后续处理使用。
      const spaceIdx = line.indexOf(' ')
      // 满足 `spaceIdx === -1` 时，共享工具执行该分支。
      if (spaceIdx === -1) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 满足 `line.slice(spaceIdx + 1) === ref` 时，共享工具执行该分支。
      if (line.slice(spaceIdx + 1) === ref) {
        // sha格式化`line.slice`，供共享工具后续处理使用。
        const sha = line.slice(0, spaceIdx)
        // 返回 `isValidGitSha(sha) ? sha : null`，作为共享工具这次计算的结果。
        return isValidGitSha(sha) ? sha : null
      }
    }
  } catch {
    // No packed-refs
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Read the `commondir` file to find the shared git directory.
 * In a worktree, this points to the main repo's .git dir.
 * Returns null if no commondir file exists (regular repo).
 */
// getCommonDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCommonDir(gitDir: string): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = (await readFile(join(gitDir, 'commondir'), 'utf-8')).trim()
    // 返回 `resolve(gitDir, content)`，作为共享工具这次计算的结果。
    return resolve(gitDir, content)
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Read a raw symref file and extract the branch name after a known prefix.
 * Returns null if the ref doesn't exist, isn't a symref, or doesn't match the prefix.
 * Checks loose file only — packed-refs doesn't store symrefs.
 */
// readRawSymref 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readRawSymref(
  gitDir: string,
  refPath: string,
  branchPrefix: string,
): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = (await readFile(join(gitDir, refPath), 'utf-8')).trim()
    // 满足 `content.startsWith('ref:')` 时，共享工具执行该分支。
    if (content.startsWith('ref:')) {
      // target格式化`content.slice`，供共享工具后续处理使用。
      const target = content.slice('ref:'.length).trim()
      // 满足 `target.startsWith(branchPrefix)` 时，共享工具执行该分支。
      if (target.startsWith(branchPrefix)) {
        // 名称格式化`target.slice`，供共享工具后续处理使用。
        const name = target.slice(branchPrefix.length)
        // Reject path traversal and argument injection from a tampered symref.
        // 满足 `!isSafeRefName(name)` 时，共享工具执行该分支。
        if (!isSafeRefName(name)) {
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }
        // 返回 `name`，作为共享工具这次计算的结果。
        return name
      }
    }
  } catch {
    // Not a loose ref
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// ---------------------------------------------------------------------------
// GitFileWatcher — watches git files and caches derived values.
// Lazily initialized on first cache access. Invalidates all cached
// values when any watched file changes.
//
// Watches:
//   .git/HEAD          — branch switches, detached HEAD
//   .git/config        — remote URL changes
//   .git/refs/heads/<branch> — new commits on the current branch
//
// When HEAD changes (branch switch), the branch ref watcher is updated
// to track the new branch's ref file.
// ---------------------------------------------------------------------------

// CacheEntry 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CacheEntry<T> = {
  value: T
  dirty: boolean
  // 这个回调绑定到 compute: () => Promise<T>，负责共享工具在该局部场景下的响应。
  compute: () => Promise<T>
}

// WATCH_INTERVAL_MS 集合 来自环境变量默认值，运行参数仍可在入口处覆盖。
const WATCH_INTERVAL_MS = process.env.NODE_ENV === 'test' ? 10 : 1000

// GitFileWatcher 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class GitFileWatcher {
  private gitDir: string | null = null
  private commonDir: string | null = null
  private initialized = false
  private initPromise: Promise<void> | null = null
  private watchedPaths: string[] = []
  private branchRefPath: string | null = null
  private cache = new Map<string, CacheEntry<unknown>>()

  // ensureStarted 使用 无 完成共享工具里的对应操作。
  async ensureStarted(): Promise<void> {
    // 满足 `this.initialized` 时，共享工具执行该分支。
    if (this.initialized) {
      // 共享工具 git Filesystem在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 满足 `this.initPromise` 时，共享工具执行该分支。
    if (this.initPromise) {
      // 返回 `this.initPromise`，作为共享工具这次计算的结果。
      return this.initPromise
    }
    // 更新实例字段 initPromise 为 this.start()，同步共享工具的内部状态。
    this.initPromise = this.start()
    // 返回 `this.initPromise`，作为共享工具这次计算的结果。
    return this.initPromise
  }

  // 共享工具 git Filesystem在这里处理 `private async start(): Promise<void> {`，完成这一小步状态转换。
  private async start(): Promise<void> {
    // 更新实例字段 gitDir 为 await resolveGitDir()，同步共享工具的内部状态。
    this.gitDir = await resolveGitDir()
    // 更新实例字段 initialized 为 true，同步共享工具的内部状态。
    this.initialized = true
    // this.gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.gitDir) {
      // 共享工具 git Filesystem在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // In a worktree, branch refs and the main config are shared and live in
    // commonDir, not the per-worktree gitDir. Resolve once so we don't
    // re-read the commondir file on every branch switch.
    // 更新实例字段 commonDir 为 await getCommonDir(this.gitDir)，同步共享工具的内部状态。
    this.commonDir = await getCommonDir(this.gitDir)

    // Watch .git/HEAD and .git/config
    // 调用 this.watchPath，触发共享工具此处需要的副作用。
    this.watchPath(join(this.gitDir, 'HEAD'), () => {
      // 显式忽略 `this.onHeadChanged()` 的返回值，只保留它触发的副作用。
      void this.onHeadChanged()
    })
    // Config (remote URLs) lives in commonDir for worktrees
    // 调用 this.watchPath，触发共享工具此处需要的副作用。
    this.watchPath(join(this.commonDir ?? this.gitDir, 'config'), () => {
      // 调用 this.invalidate，触发共享工具此处需要的副作用。
      this.invalidate()
    })

    // Watch the current branch's ref file for commit changes
    // 等待 `this.watchCurrentBranchRef()` 完成，再继续共享工具 git Filesystem的异步流程。
    await this.watchCurrentBranchRef()

    // 调用 registerCleanup，触发共享工具此处需要的副作用。
    registerCleanup(async () => {
      // 调用 this.stopWatching，触发共享工具此处需要的副作用。
      this.stopWatching()
    })
  }

  // 这个回调绑定到 private watchPath(path: string, callback: () => void): void {，负责共享工具在该局部场景下的响应。
  private watchPath(path: string, callback: () => void): void {
    // watchedPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
    this.watchedPaths.push(path)
    // 调用 watchFile，触发共享工具此处需要的副作用。
    watchFile(path, { interval: WATCH_INTERVAL_MS }, callback)
  }

  /**
   * Watch the loose ref file for the current branch.
   * Called on startup and whenever HEAD changes (branch switch).
   */
  // 共享工具 git Filesystem在这里处理 `private async watchCurrentBranchRef(): Promise<void> {`，完成这一小步状态转换。
  private async watchCurrentBranchRef(): Promise<void> {
    // this.gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.gitDir) {
      // 共享工具 git Filesystem在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // head读取`readGitHead`，供共享工具后续处理使用。
    const head = await readGitHead(this.gitDir)
    // Branch refs live in commonDir for worktrees (gitDir for regular repos)
    // refsDir保存`this.commonDir ?? this.gitDir`，供共享工具 git Filesystem后续判断或输出使用。
    const refsDir = this.commonDir ?? this.gitDir
    // refPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const refPath =
      head?.type === 'branch' ? join(refsDir, 'refs', 'heads', head.name) : null

    // Already watching this ref (or already not watching anything)
    // 满足 `refPath === this.branchRefPath` 时，共享工具执行该分支。
    if (refPath === this.branchRefPath) {
      // 共享工具 git Filesystem在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Stop watching old branch ref. Runs for branch→branch AND
    // branch→detached (checkout --detach, rebase, bisect).
    // 满足 `this.branchRefPath` 时，共享工具执行该分支。
    if (this.branchRefPath) {
      // 调用 unwatchFile，触发共享工具此处需要的副作用。
      unwatchFile(this.branchRefPath)
      // 更新实例字段 watchedPaths 为 this.watchedPaths.filter(，同步共享工具的内部状态。
      this.watchedPaths = this.watchedPaths.filter(
        // p更新为 `> p !== this.branchRefPath`，确保共享工具后续读取最新状态。
        p => p !== this.branchRefPath,
      )
    }

    // 更新实例字段 branchRefPath 为 refPath，同步共享工具的内部状态。
    this.branchRefPath = refPath

    // refPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!refPath) {
      // 共享工具 git Filesystem在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // The ref file may not exist yet (new branch before first commit).
    // watchFile works on nonexistent files — it fires when the file appears.
    // 调用 this.watchPath，触发共享工具此处需要的副作用。
    this.watchPath(refPath, () => {
      // 调用 this.invalidate，触发共享工具此处需要的副作用。
      this.invalidate()
    })
  }

  // 共享工具 git Filesystem在这里处理 `private async onHeadChanged(): Promise<void> {`，完成这一小步状态转换。
  private async onHeadChanged(): Promise<void> {
    // HEAD changed — could be a branch switch or detach.
    // Defer file I/O (readGitHead, watchFile setup) until scroll settles so
    // watchFile callbacks that land mid-scroll don't compete for the event
    // loop. invalidate() is cheap (just marks dirty) so do it first — the
    // cache correctly serves stale-marked values until the watcher updates.
    // 调用 this.invalidate，触发共享工具此处需要的副作用。
    this.invalidate()
    // 等待 `waitForScrollIdle()` 完成，再继续共享工具 git Filesystem的异步流程。
    await waitForScrollIdle()
    // 等待 `this.watchCurrentBranchRef()` 完成，再继续共享工具 git Filesystem的异步流程。
    await this.watchCurrentBranchRef()
  }

  // 共享工具 git Filesystem在这里处理 `private invalidate(): void {`，完成这一小步状态转换。
  private invalidate(): void {
    // 逐项读取 `this.cache.values()` 中的entry，按输入顺序推进共享工具。
    for (const entry of this.cache.values()) {
      // dirty更新为 `true`，确保共享工具后续读取最新状态。
      entry.dirty = true
    }
  }

  // 共享工具 git Filesystem在这里处理 `private stopWatching(): void {`，完成这一小步状态转换。
  private stopWatching(): void {
    // 按顺序遍历 `this.watchedPaths` 中的路径，逐个交给共享工具处理。
    for (const path of this.watchedPaths) {
      // 调用 unwatchFile，触发共享工具此处需要的副作用。
      unwatchFile(path)
    }
    // 更新实例字段 watchedPaths 为 []，同步共享工具的内部状态。
    this.watchedPaths = []
    // 更新实例字段 branchRefPath 为 null，同步共享工具的内部状态。
    this.branchRefPath = null
  }

  /**
   * Get a cached value by key. On first call for a key, computes and caches it.
   * Subsequent calls return the cached value until a watched file changes,
   * which marks the entry dirty. The next get() re-computes from disk.
   *
   * Race condition handling: dirty is cleared BEFORE the async compute starts.
   * If a file change arrives during compute, it re-sets dirty, so the next
   * get() will re-read again rather than serving a stale value.
   */
  // 这个回调绑定到 async get<T>(key: string, compute: () => Promise<T>): Promise<T> {，负责共享工具在该局部场景下的响应。
  async get<T>(key: string, compute: () => Promise<T>): Promise<T> {
    // 等待 `this.ensureStarted()` 完成，再继续共享工具 git Filesystem的异步流程。
    await this.ensureStarted()
    // existing读取`cache.get`，供共享工具后续处理使用。
    const existing = this.cache.get(key)
    // 只有 `existing && !existing.dirty` 满足时，共享工具才执行该分支。
    if (existing && !existing.dirty) {
      // 返回 `existing.value as T`，作为共享工具这次计算的结果。
      return existing.value as T
    }
    // Clear dirty before compute — if the file changes again during the
    // async read, invalidate() will re-set dirty and we'll re-read on
    // the next get() call.
    // 满足 `existing` 时，共享工具执行该分支。
    if (existing) {
      // dirty更新为 `false`，确保共享工具后续读取最新状态。
      existing.dirty = false
    }
    // 取值保存`compute`，供共享工具后续处理使用。
    const value = await compute()
    // Only update the cached value if no new invalidation arrived during compute
    // entry读取`cache.get`，供共享工具后续处理使用。
    const entry = this.cache.get(key)
    // 只有 `entry && !entry.dirty` 满足时，共享工具才执行该分支。
    if (entry && !entry.dirty) {
      // 取值更新为 `value`，确保共享工具后续读取最新状态。
      entry.value = value
    }
    // entry缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!entry) {
      // this.cache.set 写入新的状态值，使共享工具后续读取保持一致。
      this.cache.set(key, { value, dirty: false, compute })
    }
    // 返回 `value`，作为共享工具这次计算的结果。
    return value
  }

  /** Reset all state. Stops file watchers. For testing only. */
  // reset 使用 无 完成共享工具里的对应操作。
  reset(): void {
    // 调用 this.stopWatching，触发共享工具此处需要的副作用。
    this.stopWatching()
    // 调用 this.cache.clear，触发共享工具此处需要的副作用。
    this.cache.clear()
    // 更新实例字段 initialized 为 false，同步共享工具的内部状态。
    this.initialized = false
    // 更新实例字段 initPromise 为 null，同步共享工具的内部状态。
    this.initPromise = null
    // 更新实例字段 gitDir 为 null，同步共享工具的内部状态。
    this.gitDir = null
    // 更新实例字段 commonDir 为 null，同步共享工具的内部状态。
    this.commonDir = null
  }
}

// gitWatcher保存`GitFileWatcher`，供共享工具后续处理使用。
const gitWatcher = new GitFileWatcher()

// computeBranch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function computeBranch(): Promise<string> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir()
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) {
    // 返回 `'HEAD'`，作为共享工具这次计算的结果。
    return 'HEAD'
  }
  // head读取`readGitHead`，供共享工具后续处理使用。
  const head = await readGitHead(gitDir)
  // head缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!head) {
    // 返回 `'HEAD'`，作为共享工具这次计算的结果。
    return 'HEAD'
  }
  // 返回 `head.type === 'branch' ? head.name : 'HEAD'`，作为共享工具这次计算的结果。
  return head.type === 'branch' ? head.name : 'HEAD'
}

// computeHead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function computeHead(): Promise<string> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir()
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }
  // head读取`readGitHead`，供共享工具后续处理使用。
  const head = await readGitHead(gitDir)
  // head缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!head) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }
  // 当 `head.type` 匹配 `'branch'` 时，共享工具执行对应分支。
  if (head.type === 'branch') {
    // 返回 `(await resolveRef(gitDir, `refs/heads/${head.name}`)) ?? ''`，作为共享工具这次计算的结果。
    return (await resolveRef(gitDir, `refs/heads/${head.name}`)) ?? ''
  }
  // 返回 `head.sha`，作为共享工具这次计算的结果。
  return head.sha
}

// computeRemoteUrl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function computeRemoteUrl(): Promise<string | null> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir()
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // URL解析`parseGitConfigValue`，供共享工具后续处理使用。
  const url = await parseGitConfigValue(gitDir, 'remote', 'origin', 'url')
  // 满足 `url` 时，共享工具执行该分支。
  if (url) {
    // 返回 `url`，作为共享工具这次计算的结果。
    return url
  }
  // In worktrees, the config with remote URLs is in the common dir
  // commonDir读取`getCommonDir`，供共享工具后续处理使用。
  const commonDir = await getCommonDir(gitDir)
  // `commonDir && commonDir` 与 `gitDir` 不一致时刷新派生状态，避免使用过期结果。
  if (commonDir && commonDir !== gitDir) {
    // 返回 `parseGitConfigValue(commonDir, 'remote', 'origin', 'url')`，作为共享工具这次计算的结果。
    return parseGitConfigValue(commonDir, 'remote', 'origin', 'url')
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// computeDefaultBranch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function computeDefaultBranch(): Promise<string> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir()
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) {
    // 返回 `'main'`，作为共享工具这次计算的结果。
    return 'main'
  }
  // refs/remotes/ lives in commonDir, not the per-worktree gitDir
  // commonDir读取`getCommonDir`，供共享工具后续处理使用。
  const commonDir = (await getCommonDir(gitDir)) ?? gitDir
  // branchFromSymref 引用读取`readRawSymref`，供共享工具后续处理使用。
  const branchFromSymref = await readRawSymref(
    commonDir,
    'refs/remotes/origin/HEAD',
    'refs/remotes/origin/',
  )
  // 满足 `branchFromSymref` 时，共享工具执行该分支。
  if (branchFromSymref) {
    // 返回 `branchFromSymref`，作为共享工具这次计算的结果。
    return branchFromSymref
  }
  // 按顺序遍历 `['main', 'master']` 中的candidate，逐个交给共享工具处理。
  for (const candidate of ['main', 'master']) {
    // sha读取`resolveRef`，供共享工具后续处理使用。
    const sha = await resolveRef(commonDir, `refs/remotes/origin/${candidate}`)
    // 满足 `sha` 时，共享工具执行该分支。
    if (sha) {
      // 返回 `candidate`，作为共享工具这次计算的结果。
      return candidate
    }
  }
  // 返回 `'main'`，作为共享工具这次计算的结果。
  return 'main'
}

// getCachedBranch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedBranch(): Promise<string> {
  // 返回 `gitWatcher.get('branch', computeBranch)`，作为共享工具这次计算的结果。
  return gitWatcher.get('branch', computeBranch)
}

// getCachedHead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedHead(): Promise<string> {
  // 返回 `gitWatcher.get('head', computeHead)`，作为共享工具这次计算的结果。
  return gitWatcher.get('head', computeHead)
}

// getCachedRemoteUrl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedRemoteUrl(): Promise<string | null> {
  // 返回 `gitWatcher.get('remoteUrl', computeRemoteUrl)`，作为共享工具这次计算的结果。
  return gitWatcher.get('remoteUrl', computeRemoteUrl)
}

// getCachedDefaultBranch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedDefaultBranch(): Promise<string> {
  // 返回 `gitWatcher.get('defaultBranch', computeDefaultBranch)`，作为共享工具这次计算的结果。
  return gitWatcher.get('defaultBranch', computeDefaultBranch)
}

/** Reset the git file watcher state. For testing only. */
// resetGitFileWatcher 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetGitFileWatcher(): void {
  // 调用 gitWatcher.reset，触发共享工具此处需要的副作用。
  gitWatcher.reset()
}

/**
 * Read the HEAD SHA for an arbitrary directory (not using the watcher).
 * Used by plugins that need the HEAD of a specific repo, not the CWD repo.
 */
// getHeadForDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getHeadForDir(cwd: string): Promise<string | null> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir(cwd)
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // head读取`readGitHead`，供共享工具后续处理使用。
  const head = await readGitHead(gitDir)
  // head缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!head) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 当 `head.type` 匹配 `'branch'` 时，共享工具执行对应分支。
  if (head.type === 'branch') {
    // 返回 `resolveRef(gitDir, `refs/heads/${head.name}`)`，作为共享工具这次计算的结果。
    return resolveRef(gitDir, `refs/heads/${head.name}`)
  }
  // 返回 `head.sha`，作为共享工具这次计算的结果。
  return head.sha
}

/**
 * Read the HEAD SHA for a git worktree directory (not the main repo).
 *
 * Unlike `getHeadForDir`, this reads `<worktreePath>/.git` directly as a
 * `gitdir:` pointer file, with no upward walk. `getHeadForDir` walks upward
 * via `findGitRoot` and would find the parent repo's `.git` when the
 * worktree path doesn't exist — misreporting the parent HEAD as the worktree's.
 *
 * Returns null if the worktree doesn't exist (`.git` pointer ENOENT) or is
 * malformed. Caller can treat null as "not a valid worktree".
 */
// readWorktreeHeadSha 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readWorktreeHeadSha(
  worktreePath: string,
): Promise<string | null> {
  // gitDir 先占位，稍后的条件分支会根据实际输入补齐它。
  let gitDir: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // ptr读取`readFile`，供共享工具后续处理使用。
    const ptr = (await readFile(join(worktreePath, '.git'), 'utf-8')).trim()
    // 满足 `!ptr.startsWith('gitdir:')` 时，共享工具执行该分支。
    if (!ptr.startsWith('gitdir:')) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // gitDir更新为 `resolve(worktreePath, ptr.slice('gitdir:'.length).trim())`，确保共享工具后续读取最新状态。
    gitDir = resolve(worktreePath, ptr.slice('gitdir:'.length).trim())
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // head读取`readGitHead`，供共享工具后续处理使用。
  const head = await readGitHead(gitDir)
  // head缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!head) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 当 `head.type` 匹配 `'branch'` 时，共享工具执行对应分支。
  if (head.type === 'branch') {
    // 返回 `resolveRef(gitDir, `refs/heads/${head.name}`)`，作为共享工具这次计算的结果。
    return resolveRef(gitDir, `refs/heads/${head.name}`)
  }
  // 返回 `head.sha`，作为共享工具这次计算的结果。
  return head.sha
}

/**
 * Read the remote origin URL for an arbitrary directory via .git/config.
 */
// getRemoteUrlForDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getRemoteUrlForDir(cwd: string): Promise<string | null> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir(cwd)
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // URL解析`parseGitConfigValue`，供共享工具后续处理使用。
  const url = await parseGitConfigValue(gitDir, 'remote', 'origin', 'url')
  // 满足 `url` 时，共享工具执行该分支。
  if (url) {
    // 返回 `url`，作为共享工具这次计算的结果。
    return url
  }
  // In worktrees, the config with remote URLs is in the common dir
  // commonDir读取`getCommonDir`，供共享工具后续处理使用。
  const commonDir = await getCommonDir(gitDir)
  // `commonDir && commonDir` 与 `gitDir` 不一致时刷新派生状态，避免使用过期结果。
  if (commonDir && commonDir !== gitDir) {
    // 返回 `parseGitConfigValue(commonDir, 'remote', 'origin', 'url')`，作为共享工具这次计算的结果。
    return parseGitConfigValue(commonDir, 'remote', 'origin', 'url')
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Check if we're in a shallow clone by looking for <commonDir>/shallow.
 * Per git's shallow.c, mere existence of the file means shallow.
 * The shallow file lives in commonDir, not the per-worktree gitDir.
 */
// isShallowClone 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isShallowClone(): Promise<boolean> {
  // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
  const gitDir = await resolveGitDir()
  // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitDir) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // commonDir读取`getCommonDir`，供共享工具后续处理使用。
  const commonDir = (await getCommonDir(gitDir)) ?? gitDir
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `stat(join(commonDir, 'shallow'))` 完成，再继续共享工具 git Filesystem的异步流程。
    await stat(join(commonDir, 'shallow'))
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Count worktrees by reading <commonDir>/worktrees/ directory.
 * The worktrees/ directory lives in commonDir, not the per-worktree gitDir.
 * The main worktree is not listed there, so add 1.
 */
// getWorktreeCountFromFs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getWorktreeCountFromFs(): Promise<number> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
    const gitDir = await resolveGitDir()
    // gitDir缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!gitDir) {
      // 返回 `0`，作为共享工具这次计算的结果。
      return 0
    }
    // commonDir读取`getCommonDir`，供共享工具后续处理使用。
    const commonDir = (await getCommonDir(gitDir)) ?? gitDir
    // entries 集合读取`readdir`，供共享工具后续处理使用。
    const entries = await readdir(join(commonDir, 'worktrees'))
    // 返回 `entries.length + 1`，作为共享工具这次计算的结果。
    return entries.length + 1
  } catch {
    // No worktrees directory means only the main worktree
    // 返回 `1`，作为共享工具这次计算的结果。
    return 1
  }
}
