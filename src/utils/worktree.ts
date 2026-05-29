// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { spawnSync } from 'child_process'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  stat,
  symlink,
  utimes,
} from 'fs/promises'
// 引入 ignore，将 ignore 中已经封装好的能力接到本文件流程里。
import ignore from 'ignore'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join } from 'path'
// 引入 saveCurrentProjectConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { saveCurrentProjectConfig } from './config.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 errorMessage、getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode } from './errors.js'
// 引入 execFileNoThrow、execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow, execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 parseGitConfigValue，将 ./git/gitConfigParser.js 中已经封装好的能力接到本文件流程里。
import { parseGitConfigValue } from './git/gitConfigParser.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCommonDir,
  readWorktreeHeadSha,
  resolveGitDir,
  resolveRef,
} from './git/gitFilesystem.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  findCanonicalGitRoot,
  findGitRoot,
  getBranch,
  getDefaultBranch,
  gitExe,
} from './git.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  executeWorktreeCreateHook,
  executeWorktreeRemoveHook,
  hasWorktreeCreateHook,
} from './hooks.js'
// 引入 containsPathTraversal，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { containsPathTraversal } from './path.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getRelativeSettingsFilePathForSource,
} from './settings/settings.js'
// 引入 sleep，将 ./sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from './sleep.js'
// 引入 isInITerm2，将 ./swarm/backends/detection.js 中已经封装好的能力接到本文件流程里。
import { isInITerm2 } from './swarm/backends/detection.js'

// VALID_WORKTREE_SLUG_SEGMENT读取 `/^[a-zA-Z0-9._-]+$/` 对应条目，后续围绕该成员继续处理。
const VALID_WORKTREE_SLUG_SEGMENT = /^[a-zA-Z0-9._-]+$/
// MAX_WORKTREE_SLUG_LENGTH 数量 命名 `64`，让后续代码直接表达这个值的用途。
const MAX_WORKTREE_SLUG_LENGTH = 64

/**
 * Validates a worktree slug to prevent path traversal and directory escape.
 *
 * The slug is joined into `.claude/worktrees/<slug>` via path.join, which
 * normalizes `..` segments — so `../../../target` would escape the worktrees
 * directory. Similarly, an absolute path (leading `/` or `C:\`) would discard
 * the prefix entirely.
 *
 * Forward slashes are allowed for nesting (e.g. `asm/feature-foo`); each
 * segment is validated independently against the allowlist, so `.` / `..`
 * segments and drive-spec characters are still rejected.
 *
 * Throws synchronously — callers rely on this running before any side effects
 * (git commands, hook execution, chdir).
 */
// validateWorktreeSlug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateWorktreeSlug(slug: string): void {
  // 满足 `slug.length > MAX_WORKTREE_SLUG_LENGTH` 时，共享工具执行该分支。
  if (slug.length > MAX_WORKTREE_SLUG_LENGTH) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Invalid worktree name: must be ${MAX_WORKTREE_SLUG_LENGTH} characters or fewer (got ${slug.length})`,
    )
  }
  // Leading or trailing `/` would make path.join produce an absolute path
  // or a dangling segment. Splitting and validating each segment rejects
  // both (empty segments fail the regex) while allowing `user/feature`.
  // 逐项读取 `slug.split('/')` 中的segment，按输入顺序推进共享工具。
  for (const segment of slug.split('/')) {
    // 当 `segment` 匹配 `'.' || segment === '..'` 时，共享工具执行对应分支。
    if (segment === '.' || segment === '..') {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Invalid worktree name "${slug}": must not contain "." or ".." path segments`,
      )
    }
    // 满足 `!VALID_WORKTREE_SLUG_SEGMENT.test(segment)` 时，共享工具执行该分支。
    if (!VALID_WORKTREE_SLUG_SEGMENT.test(segment)) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Invalid worktree name "${slug}": each "/"-separated segment must be non-empty and contain only letters, digits, dots, underscores, and dashes`,
      )
    }
  }
}

// Helper function to create directories recursively
// mkdirRecursive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function mkdirRecursive(dirPath: string): Promise<void> {
  // 等待 `mkdir(dirPath, { recursive: true })` 完成，再继续共享工具 worktree的异步流程。
  await mkdir(dirPath, { recursive: true })
}

/**
 * Symlinks directories from the main repository to avoid duplication.
 * This prevents disk bloat from duplicating node_modules and other large directories.
 *
 * @param repoRootPath - Path to the main repository root
 * @param worktreePath - Path to the worktree directory
 * @param dirsToSymlink - Array of directory names to symlink (e.g., ['node_modules'])
 */
// symlinkDirectories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function symlinkDirectories(
  repoRootPath: string,
  worktreePath: string,
  dirsToSymlink: string[],
): Promise<void> {
  // 按顺序遍历 `dirsToSymlink` 中的dir，逐个交给共享工具处理。
  for (const dir of dirsToSymlink) {
    // Validate directory doesn't escape repository boundaries
    // 满足 `containsPathTraversal(dir)` 时，共享工具执行该分支。
    if (containsPathTraversal(dir)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Skipping symlink for "${dir}": path traversal detected`,
        { level: 'warn' },
      )
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // sourcePath 路径数据格式化`join`，供共享工具后续处理使用。
    const sourcePath = join(repoRootPath, dir)
    // destPath 路径数据格式化`join`，供共享工具后续处理使用。
    const destPath = join(worktreePath, dir)

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `symlink(sourcePath, destPath, 'dir')` 完成，再继续共享工具 worktree的异步流程。
      await symlink(sourcePath, destPath, 'dir')
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Symlinked ${dir} from main repository to worktree to avoid disk bloat`,
      )
    } catch (error) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(error)
      // ENOENT: source doesn't exist yet (expected - skip silently)
      // EEXIST: destination already exists (expected - skip silently)
      // `code` 与 `'ENOENT' && code !== 'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
      if (code !== 'ENOENT' && code !== 'EEXIST') {
        // Unexpected error (e.g., permission denied, unsupported platform)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to symlink ${dir} (${code ?? 'unknown'}): ${errorMessage(error)}`,
          { level: 'warn' },
        )
      }
    }
  }
}

// WorktreeSession 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type WorktreeSession = {
  originalCwd: string
  worktreePath: string
  worktreeName: string
  worktreeBranch?: string
  originalBranch?: string
  originalHeadCommit?: string
  sessionId: string
  tmuxSessionName?: string
  hookBased?: boolean
  /** How long worktree creation took (unset when resuming an existing worktree). */
  creationDurationMs?: number
  /** True if git sparse-checkout was applied via settings.worktree.sparsePaths. */
  usedSparsePaths?: boolean
}

// currentWorktreeSession 会话数据 命名 `null`，让后续代码直接表达这个值的用途。
let currentWorktreeSession: WorktreeSession | null = null

// getCurrentWorktreeSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentWorktreeSession(): WorktreeSession | null {
  // 返回 `currentWorktreeSession`，作为共享工具这次计算的结果。
  return currentWorktreeSession
}

/**
 * Restore the worktree session on --resume. The caller must have already
 * verified the directory exists (via process.chdir) and set the bootstrap
 * state (cwd, originalCwd).
 */
// restoreWorktreeSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreWorktreeSession(session: WorktreeSession | null): void {
  // currentWorktreeSession 会话数据更新为 `session`，确保共享工具后续读取最新状态。
  currentWorktreeSession = session
}

// generateTmuxSessionName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateTmuxSessionName(
  repoPath: string,
  branch: string,
): string {
  // repoName保存`basename`，供共享工具后续处理使用。
  const repoName = basename(repoPath)
  // combined 命名 ``${repoName}_${branch}``，让后续代码直接表达这个值的用途。
  const combined = `${repoName}_${branch}`
  // 返回 `combined.replace(/[/.]/g, '_')`，作为共享工具这次计算的结果。
  return combined.replace(/[/.]/g, '_')
}

// WorktreeCreateResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type WorktreeCreateResult =
  | {
      worktreePath: string
      worktreeBranch: string
      headCommit: string
      existed: true
    }
  | {
      worktreePath: string
      worktreeBranch: string
      headCommit: string
      baseBranch: string
      existed: false
    }

// Env vars to prevent git/SSH from prompting for credentials (which hangs the CLI).
// GIT_TERMINAL_PROMPT=0 prevents git from opening /dev/tty for credential prompts.
// GIT_ASKPASS='' disables askpass GUI programs.
// stdin: 'ignore' closes stdin so interactive prompts can't block.
// GIT_NO_PROMPT_ENV集中保存共享工具 worktree要一起传递的字段。
const GIT_NO_PROMPT_ENV = {
  GIT_TERMINAL_PROMPT: '0',
  GIT_ASKPASS: '',
}

// worktreesDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function worktreesDir(repoRoot: string): string {
  // 返回 `join(repoRoot, '.claude', 'worktrees')`，作为共享工具这次计算的结果。
  return join(repoRoot, '.claude', 'worktrees')
}

// Flatten nested slugs (`user/feature` → `user+feature`) for both the branch
// name and the directory path. Nesting in either location is unsafe:
//   - git refs: `worktree-user` (file) vs `worktree-user/feature` (needs dir)
//     is a D/F conflict that git rejects.
//   - directory: `.claude/worktrees/user/feature/` lives inside the `user`
//     worktree; `git worktree remove` on the parent deletes children with
//     uncommitted work.
// `+` is valid in git branch names and filesystem paths but NOT in the
// slug-segment allowlist ([a-zA-Z0-9._-]), so the mapping is injective.
// flattenSlug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function flattenSlug(slug: string): string {
  // 返回 `slug.replaceAll('/', '+')`，作为共享工具这次计算的结果。
  return slug.replaceAll('/', '+')
}

// worktreeBranchName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function worktreeBranchName(slug: string): string {
  // 返回 ``worktree-${flattenSlug(slug)}``，作为共享工具这次计算的结果。
  return `worktree-${flattenSlug(slug)}`
}

// worktreePathFor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function worktreePathFor(repoRoot: string, slug: string): string {
  // 返回 `join(worktreesDir(repoRoot), flattenSlug(slug))`，作为共享工具这次计算的结果。
  return join(worktreesDir(repoRoot), flattenSlug(slug))
}

/**
 * Creates a new git worktree for the given slug, or resumes it if it already exists.
 * Named worktrees reuse the same path across invocations, so the existence check
 * prevents unconditionally running `git fetch` (which can hang waiting for credentials)
 * on every resume.
 */
// getOrCreateWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getOrCreateWorktree(
  repoRoot: string,
  slug: string,
  options?: { prNumber?: number },
): Promise<WorktreeCreateResult> {
  // worktreePath 路径数据保存`worktreePathFor`，供共享工具后续处理使用。
  const worktreePath = worktreePathFor(repoRoot, slug)
  // worktreeBranch保存`worktreeBranchName`，供共享工具后续处理使用。
  const worktreeBranch = worktreeBranchName(slug)

  // Fast resume path: if the worktree already exists skip fetch and creation.
  // Read the .git pointer file directly (no subprocess, no upward walk) — a
  // subprocess `rev-parse HEAD` burns ~15ms on spawn overhead even for a 2ms
  // task, and the await yield lets background spawnSyncs pile on (seen at 55ms).
  // existingHead读取`readWorktreeHeadSha`，供共享工具后续处理使用。
  const existingHead = await readWorktreeHeadSha(worktreePath)
  // 满足 `existingHead` 时，共享工具执行该分支。
  if (existingHead) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      worktreePath,
      worktreeBranch,
      headCommit: existingHead,
      existed: true,
    }
  }

  // New worktree: fetch base branch then add
  // 等待 `mkdir(worktreesDir(repoRoot), { recursive: true })` 完成，再继续共享工具 worktree的异步流程。
  await mkdir(worktreesDir(repoRoot), { recursive: true })

  // fetchEnv集中保存共享工具 worktree要一起传递的字段。
  const fetchEnv = { ...process.env, ...GIT_NO_PROMPT_ENV }

  // baseBranch 先占位，稍后的条件分支会根据实际输入补齐它。
  let baseBranch: string
  // baseSha初始化为空值，后续分支会在有数据时补齐。
  let baseSha: string | null = null
  // 满足 `options?.prNumber` 时，共享工具执行该分支。
  if (options?.prNumber) {
    // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
    const { code: prFetchCode, stderr: prFetchStderr } =
      await execFileNoThrowWithCwd(
        gitExe(),
        ['fetch', 'origin', `pull/${options.prNumber}/head`],
        { cwd: repoRoot, stdin: 'ignore', env: fetchEnv },
      )
    // `prFetchCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (prFetchCode !== 0) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to fetch PR #${options.prNumber}: ${prFetchStderr.trim() || 'PR may not exist or the repository may not have a remote named "origin"'}`,
      )
    }
    // baseBranch更新为 `'FETCH_HEAD'`，确保共享工具后续读取最新状态。
    baseBranch = 'FETCH_HEAD'
  } else {
    // If origin/<branch> already exists locally, skip fetch. In large repos
    // (210k files, 16M objects) fetch burns ~6-8s on a local commit-graph
    // scan before even hitting the network. A slightly stale base is fine —
    // the user can pull in the worktree if they want latest.
    // resolveRef reads the loose/packed ref directly; when it succeeds we
    // already have the SHA, so the later rev-parse is skipped entirely.
    // 并行获取 defaultBranch、gitDir，缩短共享工具 worktree等待多个独立异步任务的时间。
    const [defaultBranch, gitDir] = await Promise.all([
      getDefaultBranch(),
      resolveGitDir(repoRoot),
    ])
    // originRef 引用 命名 ``origin/${defaultBranch}``，让后续代码直接表达这个值的用途。
    const originRef = `origin/${defaultBranch}`
    // originSha保存`gitDir`，供共享工具 worktree后续判断或输出使用。
    const originSha = gitDir
      ? await resolveRef(gitDir, `refs/remotes/origin/${defaultBranch}`)
      : null
    // 满足 `originSha` 时，共享工具执行该分支。
    if (originSha) {
      // baseBranch更新为 `originRef`，确保共享工具后续读取最新状态。
      baseBranch = originRef
      // baseSha更新为 `originSha`，确保共享工具后续读取最新状态。
      baseSha = originSha
    } else {
      // 从 `await execFileNoThrowWithCwd(` 解构 code，减少共享工具 worktree对同一对象的重复访问。
      const { code: fetchCode } = await execFileNoThrowWithCwd(
        gitExe(),
        ['fetch', 'origin', defaultBranch],
        { cwd: repoRoot, stdin: 'ignore', env: fetchEnv },
      )
      // baseBranch更新为 `fetchCode === 0 ? originRef : 'HEAD'`，确保共享工具后续读取最新状态。
      baseBranch = fetchCode === 0 ? originRef : 'HEAD'
    }
  }

  // For the fetch/PR-fetch paths we still need the SHA — the fs-only resolveRef
  // above only covers the "origin/<branch> already exists locally" case.
  // baseSha缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!baseSha) {
    // 从 `await execFileNoThrowWithCwd(` 解构 stdout、code，减少共享工具 worktree对同一对象的重复访问。
    const { stdout, code: shaCode } = await execFileNoThrowWithCwd(
      gitExe(),
      ['rev-parse', baseBranch],
      { cwd: repoRoot },
    )
    // `shaCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (shaCode !== 0) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to resolve base branch "${baseBranch}": git rev-parse failed`,
      )
    }
    // baseSha更新为 `stdout.trim()`，确保共享工具后续读取最新状态。
    baseSha = stdout.trim()
  }

  // sparsePaths 路径数据读取`getInitialSettings`，供共享工具后续处理使用。
  const sparsePaths = getInitialSettings().worktree?.sparsePaths
  // addArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const addArgs = ['worktree', 'add']
  // 满足 `sparsePaths?.length` 时，共享工具执行该分支。
  if (sparsePaths?.length) {
    // addArgs 集合追加新条目，保持收集顺序与输入顺序一致。
    addArgs.push('--no-checkout')
  }
  // -B (not -b): reset any orphan branch left behind by a removed worktree dir.
  // Saves a `git branch -D` subprocess (~15ms spawn overhead) on every create.
  // addArgs 集合追加新条目，保持收集顺序与输入顺序一致。
  addArgs.push('-B', worktreeBranch, worktreePath, baseBranch)

  // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
  const { code: createCode, stderr: createStderr } =
    await execFileNoThrowWithCwd(gitExe(), addArgs, { cwd: repoRoot })
  // `createCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (createCode !== 0) {
    // 抛出 new Error(`Failed to create worktree: ${createStderr}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Failed to create worktree: ${createStderr}`)
  }

  // 满足 `sparsePaths?.length` 时，共享工具执行该分支。
  if (sparsePaths?.length) {
    // If sparse-checkout or checkout fail after --no-checkout, the worktree
    // is registered and HEAD is set but the working tree is empty. Next run's
    // fast-resume (rev-parse HEAD) would succeed and present a broken worktree
    // as "resumed". Tear it down before propagating the error.
    // tearDown保存`async`，供共享工具后续处理使用。
    const tearDown = async (msg: string): Promise<never> => {
      // 等待 `execFileNoThrowWithCwd(` 完成，再继续共享工具 worktree的异步流程。
      await execFileNoThrowWithCwd(
        gitExe(),
        ['worktree', 'remove', '--force', worktreePath],
        { cwd: repoRoot },
      )
      // 抛出 new Error(msg)，阻止共享工具在无效状态下继续运行。
      throw new Error(msg)
    }
    // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
    const { code: sparseCode, stderr: sparseErr } =
      await execFileNoThrowWithCwd(
        gitExe(),
        ['sparse-checkout', 'set', '--cone', '--', ...sparsePaths],
        { cwd: worktreePath },
      )
    // `sparseCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (sparseCode !== 0) {
      // 等待 `tearDown(`Failed to configure sparse-checkout: ${sparseErr}`)` 完成，再继续共享工具 worktree的异步流程。
      await tearDown(`Failed to configure sparse-checkout: ${sparseErr}`)
    }
    // 从 `await execFileNoThrowWithCwd(` 解构 code、stderr，减少共享工具 worktree对同一对象的重复访问。
    const { code: coCode, stderr: coErr } = await execFileNoThrowWithCwd(
      gitExe(),
      ['checkout', 'HEAD'],
      { cwd: worktreePath },
    )
    // `coCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (coCode !== 0) {
      // 等待 `tearDown(`Failed to checkout sparse worktree: ${coErr}`)` 完成，再继续共享工具 worktree的异步流程。
      await tearDown(`Failed to checkout sparse worktree: ${coErr}`)
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    worktreePath,
    worktreeBranch,
    headCommit: baseSha,
    baseBranch,
    existed: false,
  }
}

/**
 * Copy gitignored files specified in .worktreeinclude from base repo to worktree.
 *
 * Only copies files that are BOTH:
 * 1. Matched by patterns in .worktreeinclude (uses .gitignore syntax)
 * 2. Gitignored (not tracked by git)
 *
 * Uses `git ls-files --others --ignored --exclude-standard --directory` to list
 * gitignored entries with fully-ignored dirs collapsed to single entries (so large
 * build outputs like node_modules/ don't force a full tree walk), then filters
 * against .worktreeinclude patterns in-process using the `ignore` library. If a
 * .worktreeinclude pattern explicitly targets a path inside a collapsed directory,
 * that directory is expanded with a second scoped `ls-files` call.
 */
// copyWorktreeIncludeFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function copyWorktreeIncludeFiles(
  repoRoot: string,
  worktreePath: string,
): Promise<string[]> {
  // includeContent 先占位，稍后的条件分支会根据实际输入补齐它。
  let includeContent: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // includeContent更新为 `await readFile(join(repoRoot, '.worktreeinclude'), 'utf-8...`，确保共享工具后续读取最新状态。
    includeContent = await readFile(join(repoRoot, '.worktreeinclude'), 'utf-8')
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // patterns 集合 命名 `includeContent`，让后续代码直接表达这个值的用途。
  const patterns = includeContent
    .split(/\r?\n/)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(line => line.trim())
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(line => line.length > 0 && !line.startsWith('#'))
  // patterns 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (patterns.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Single pass with --directory: collapses fully-gitignored dirs (node_modules/,
  // .turbo/, etc.) into single entries instead of listing every file inside.
  // In a large repo this cuts ~500k entries/~7s down to ~hundreds of entries/~100ms.
  // gitignored保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const gitignored = await execFileNoThrowWithCwd(
    gitExe(),
    ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory'],
    { cwd: repoRoot },
  )
  // `gitignored.code` 与 `0 || !gitignored.stdout.trim()` 不一致时刷新派生状态，避免使用过期结果。
  if (gitignored.code !== 0 || !gitignored.stdout.trim()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // entries 集合格式化`stdout.trim`，供共享工具后续处理使用。
  const entries = gitignored.stdout.trim().split('\n').filter(Boolean)
  // matcher保存`ignore`，供共享工具后续处理使用。
  const matcher = ignore().add(includeContent)

  // --directory emits collapsed dirs with a trailing slash; everything else is
  // an individual file.
  // collapsedDirs 集合筛选`entries.filter`，供共享工具后续处理使用。
  const collapsedDirs = entries.filter(e => e.endsWith('/'))
  // files 文件数据筛选`entries.filter`，供共享工具后续处理使用。
  const files = entries.filter(e => !e.endsWith('/') && matcher.ignores(e))

  // Edge case: a .worktreeinclude pattern targets a path inside a collapsed dir
  // (e.g. pattern `config/secrets/api.key` when all of `config/secrets/` is
  // gitignored with no tracked siblings). Expand only dirs where a pattern has
  // that dir as its explicit path prefix (stripping redundant leading `/`), the
  // dir falls under an anchored glob's literal prefix (e.g. `config/**/*.key`
  // expands `config/secrets/`), or the dir itself matches a pattern. We don't
  // expand for `**/` or anchorless patterns -- those match files in tracked dirs
  // (already listed individually) and expanding every collapsed dir for them
  // would defeat the perf win.
  // dirsToExpand筛选`collapsedDirs.filter`，供共享工具后续处理使用。
  const dirsToExpand = collapsedDirs.filter(dir => {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      // 调用 patterns.some，触发共享工具此处需要的副作用。
      patterns.some(p => {
        // normalized保存`p.startsWith`，供共享工具后续处理使用。
        const normalized = p.startsWith('/') ? p.slice(1) : p
        // Literal prefix match: pattern starts with the collapsed dir path
        // 满足 `normalized.startsWith(dir)` 时，共享工具执行该分支。
        if (normalized.startsWith(dir)) return true
        // Anchored glob: dir falls under the pattern's literal (non-glob) prefix
        // e.g. `config/**/*.key` has literal prefix `config/` → expand `config/secrets/`
        // globIdx保存`normalized.search`，供共享工具后续处理使用。
        const globIdx = normalized.search(/[*?[]/)
        // 满足 `globIdx > 0` 时，共享工具执行该分支。
        if (globIdx > 0) {
          // literalPrefix格式化`normalized.slice`，供共享工具后续处理使用。
          const literalPrefix = normalized.slice(0, globIdx)
          // 满足 `dir.startsWith(literalPrefix)` 时，共享工具执行该分支。
          if (dir.startsWith(literalPrefix)) return true
        }
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      })
    )
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    // 满足 `matcher.ignores(dir.slice(0, -1))` 时，共享工具执行该分支。
    if (matcher.ignores(dir.slice(0, -1))) return true
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  })
  // 满足 `dirsToExpand.length > 0` 时，共享工具执行该分支。
  if (dirsToExpand.length > 0) {
    // expanded保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const expanded = await execFileNoThrowWithCwd(
      gitExe(),
      [
        'ls-files',
        '--others',
        '--ignored',
        '--exclude-standard',
        '--',
        ...dirsToExpand,
      ],
      { cwd: repoRoot },
    )
    // 只有 `expanded.code === 0 && expanded.stdout.trim()` 满足时，共享工具才执行该分支。
    if (expanded.code === 0 && expanded.stdout.trim()) {
      // 逐项读取 `expanded.stdout.trim().split('\n').filter(Boole...` 中的f，按输入顺序推进共享工具。
      for (const f of expanded.stdout.trim().split('\n').filter(Boolean)) {
        // 满足 `matcher.ignores(f)` 时，共享工具执行该分支。
        if (matcher.ignores(f)) {
          // files 文件数据追加新条目，保持收集顺序与输入顺序一致。
          files.push(f)
        }
      }
    }
  }
  // copied 从空数组开始收集，后续循环会按处理顺序追加条目。
  const copied: string[] = []

  // 按顺序遍历 `files` 中的relativePath 路径数据，逐个交给共享工具处理。
  for (const relativePath of files) {
    // srcPath 路径数据格式化`join`，供共享工具后续处理使用。
    const srcPath = join(repoRoot, relativePath)
    // destPath 路径数据格式化`join`，供共享工具后续处理使用。
    const destPath = join(worktreePath, relativePath)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `mkdir(dirname(destPath), { recursive: true })` 完成，再继续共享工具 worktree的异步流程。
      await mkdir(dirname(destPath), { recursive: true })
      // 等待 `copyFile(srcPath, destPath)` 完成，再继续共享工具 worktree的异步流程。
      await copyFile(srcPath, destPath)
      // copied追加新条目，保持收集顺序与输入顺序一致。
      copied.push(relativePath)
    } catch (e: unknown) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to copy ${relativePath} to worktree: ${(e as Error).message}`,
        { level: 'warn' },
      )
    }
  }

  // 满足 `copied.length > 0` 时，共享工具执行该分支。
  if (copied.length > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Copied ${copied.length} files from .worktreeinclude: ${copied.join(', ')}`,
    )
  }

  // 返回 `copied`，作为共享工具这次计算的结果。
  return copied
}

/**
 * Post-creation setup for a newly created worktree.
 * Propagates settings.local.json, configures git hooks, and symlinks directories.
 */
// performPostCreationSetup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function performPostCreationSetup(
  repoRoot: string,
  worktreePath: string,
): Promise<void> {
  // Copy settings.local.json to the worktree's .claude directory
  // This propagates local settings (which may contain secrets) to the worktree
  // localSettingsRelativePath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const localSettingsRelativePath =
    getRelativeSettingsFilePathForSource('localSettings')
  // sourceSettingsLocal格式化`join`，供共享工具后续处理使用。
  const sourceSettingsLocal = join(repoRoot, localSettingsRelativePath)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // destSettingsLocal格式化`join`，供共享工具后续处理使用。
    const destSettingsLocal = join(worktreePath, localSettingsRelativePath)
    // 等待 `mkdirRecursive(dirname(destSettingsLocal))` 完成，再继续共享工具 worktree的异步流程。
    await mkdirRecursive(dirname(destSettingsLocal))
    // 等待 `copyFile(sourceSettingsLocal, destSettingsLocal)` 完成，再继续共享工具 worktree的异步流程。
    await copyFile(sourceSettingsLocal, destSettingsLocal)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Copied settings.local.json to worktree: ${destSettingsLocal}`,
    )
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to copy settings.local.json: ${(e as Error).message}`,
        { level: 'warn' },
      )
    }
  }

  // Configure the worktree to use hooks from the main repository
  // This solves issues with .husky and other git hooks that use relative paths
  // huskyPath 路径数据格式化`join`，供共享工具后续处理使用。
  const huskyPath = join(repoRoot, '.husky')
  // gitHooksPath 路径数据格式化`join`，供共享工具后续处理使用。
  const gitHooksPath = join(repoRoot, '.git', 'hooks')
  // hooksPath 路径数据保存`null`，作为后续空值处理的输入。
  let hooksPath: string | null = null
  // 按顺序遍历 `[huskyPath, gitHooksPath]` 中的candidatePath 路径数据，逐个交给共享工具处理。
  for (const candidatePath of [huskyPath, gitHooksPath]) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // s 集合保存`stat`，供共享工具后续处理使用。
      const s = await stat(candidatePath)
      // 满足 `s.isDirectory()` 时，共享工具执行该分支。
      if (s.isDirectory()) {
        // hooksPath 路径数据更新为 `candidatePath`，确保共享工具后续读取最新状态。
        hooksPath = candidatePath
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    } catch {
      // Path doesn't exist or can't be accessed
    }
  }
  // 满足 `hooksPath` 时，共享工具执行该分支。
  if (hooksPath) {
    // `git config` (no --worktree flag) writes to the main repo's .git/config,
    // shared by all worktrees. Once set, every subsequent worktree create is a
    // no-op — skip the subprocess (~14ms spawn) when the value already matches.
    // gitDir读取`resolveGitDir`，供共享工具后续处理使用。
    const gitDir = await resolveGitDir(repoRoot)
    // configDir 配置读取`getCommonDir`，供共享工具后续处理使用。
    const configDir = gitDir ? ((await getCommonDir(gitDir)) ?? gitDir) : null
    // existing保存`configDir`，供共享工具 worktree后续判断或输出使用。
    const existing = configDir
      ? await parseGitConfigValue(configDir, 'core', null, 'hooksPath')
      : null
    // `existing` 与 `hooksPath` 不一致时刷新派生状态，避免使用过期结果。
    if (existing !== hooksPath) {
      // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
      const { code: configCode, stderr: configError } =
        await execFileNoThrowWithCwd(
          gitExe(),
          ['config', 'core.hooksPath', hooksPath],
          { cwd: worktreePath },
        )
      // 满足 `configCode === 0` 时，共享工具执行该分支。
      if (configCode === 0) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Configured worktree to use hooks from main repository: ${hooksPath}`,
        )
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to configure hooks path: ${configError}`, {
          level: 'error',
        })
      }
    }
  }

  // Symlink directories to avoid disk bloat (opt-in via settings)
  // settings 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const settings = getInitialSettings()
  // dirsToSymlink 命名 `settings.worktree?.symlinkDirectories ?? []`，让后续代码直接表达这个值的用途。
  const dirsToSymlink = settings.worktree?.symlinkDirectories ?? []
  // 满足 `dirsToSymlink.length > 0` 时，共享工具执行该分支。
  if (dirsToSymlink.length > 0) {
    // 等待 `symlinkDirectories(repoRoot, worktreePath, dirsToSymlink)` 完成，再继续共享工具 worktree的异步流程。
    await symlinkDirectories(repoRoot, worktreePath, dirsToSymlink)
  }

  // Copy gitignored files specified in .worktreeinclude (best-effort)
  // 等待 `copyWorktreeIncludeFiles(repoRoot, worktreePath)` 完成，再继续共享工具 worktree的异步流程。
  await copyWorktreeIncludeFiles(repoRoot, worktreePath)

  // The core.hooksPath config-set above is fragile: husky's prepare script
  // (`git config core.hooksPath .husky`) runs on every `bun install` and
  // resets the SHARED .git/config value back to relative, causing each
  // worktree to resolve to its OWN .husky/ again. The attribution hook
  // file isn't tracked (it's in .git/info/exclude), so fresh worktrees
  // don't have it. Install it directly into the worktree's .husky/ —
  // husky won't delete it (husky install is additive-only), and for
  // non-husky repos this resolves to the shared .git/hooks/ (idempotent).
  //
  // Pass the worktree-local .husky explicitly: getHooksDir would return
  // the absolute core.hooksPath we just set above (main repo's .husky),
  // not the worktree's — `git rev-parse --git-path hooks` echoes the config
  // value verbatim when it's absolute.
  // 满足 `feature('COMMIT_ATTRIBUTION')` 时，共享工具执行该分支。
  if (feature('COMMIT_ATTRIBUTION')) {
    // worktreeHooksDir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const worktreeHooksDir =
      hooksPath === huskyPath ? join(worktreePath, '.husky') : undefined
    // 显式忽略 `import('./postCommitAttribution.js')` 的返回值，只保留它触发的副作用。
    void import('./postCommitAttribution.js')
      // 链式调用 then，继续加工上一行在共享工具中产生的数据。
      .then(m =>
        m
          .installPrepareCommitMsgHook(worktreePath, worktreeHooksDir)
          // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
          .catch(error => {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to install attribution hook in worktree: ${error}`,
            )
          }),
      )
      // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
      .catch(error => {
        // Dynamic import() itself rejected (module load failure). The inner
        // .catch above only handles installPrepareCommitMsgHook rejection —
        // without this outer handler an import failure would surface as an
        // unhandled promise rejection.
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to load postCommitAttribution module: ${error}`)
      })
  }
}

/**
 * Parses a PR reference from a string.
 * Accepts GitHub-style PR URLs (e.g., https://github.com/owner/repo/pull/123,
 * or GHE equivalents like https://ghe.example.com/owner/repo/pull/123)
 * or `#N` format (e.g., #123).
 * Returns the PR number or null if the string is not a recognized PR reference.
 */
// parsePRReference 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parsePRReference(input: string): number | null {
  // GitHub-style PR URL: https://<host>/owner/repo/pull/123 (with optional trailing slash, query, hash)
  // The /pull/N path shape is specific to GitHub — GitLab uses /-/merge_requests/N,
  // Bitbucket uses /pull-requests/N — so matching any host here is safe.
  // urlMatch匹配`input.match`，供共享工具后续处理使用。
  const urlMatch = input.match(
    /^https?:\/\/[^/]+\/[^/]+\/[^/]+\/pull\/(\d+)\/?(?:[?#].*)?$/i,
  )
  // 满足 `urlMatch?.[1]` 时，共享工具执行该分支。
  if (urlMatch?.[1]) {
    // 返回 `parseInt(urlMatch[1], 10)`，作为共享工具这次计算的结果。
    return parseInt(urlMatch[1], 10)
  }

  // #N format
  // hashMatch匹配`input.match`，供共享工具后续处理使用。
  const hashMatch = input.match(/^#(\d+)$/)
  // 满足 `hashMatch?.[1]` 时，共享工具执行该分支。
  if (hashMatch?.[1]) {
    // 返回 `parseInt(hashMatch[1], 10)`，作为共享工具这次计算的结果。
    return parseInt(hashMatch[1], 10)
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// isTmuxAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isTmuxAvailable(): Promise<boolean> {
  // 从 `await execFileNoThrow('tmux', ['-V'])` 解构 code，减少共享工具 worktree对同一对象的重复访问。
  const { code } = await execFileNoThrow('tmux', ['-V'])
  // 返回 `code === 0`，作为共享工具这次计算的结果。
  return code === 0
}

// getTmuxInstallInstructions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTmuxInstallInstructions(): string {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // 按照 platform 的取值选择共享工具的具体处理分支。
  switch (platform) {
    case 'macos':
      // 返回 `'Install tmux with: brew install tmux'`，作为共享工具这次计算的结果。
      return 'Install tmux with: brew install tmux'
    case 'linux':
    case 'wsl':
      // 返回 `'Install tmux with: sudo apt install tmux (Debian/Ubuntu) or sudo dnf i...`，作为共享工具这次计算的结果。
      return 'Install tmux with: sudo apt install tmux (Debian/Ubuntu) or sudo dnf install tmux (Fedora/RHEL)'
    case 'windows':
      // 返回 `'tmux is not natively available on Windows. Consider using WSL or Cygwi...`，作为共享工具这次计算的结果。
      return 'tmux is not natively available on Windows. Consider using WSL or Cygwin.'
    default:
      // 返回 `'Install tmux using your system package manager.'`，作为共享工具这次计算的结果。
      return 'Install tmux using your system package manager.'
  }
}

// createTmuxSessionForWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createTmuxSessionForWorktree(
  sessionName: string,
  worktreePath: string,
): Promise<{ created: boolean; error?: string }> {
  // 从 `await execFileNoThrow('tmux', [` 解构 code、stderr，减少共享工具 worktree对同一对象的重复访问。
  const { code, stderr } = await execFileNoThrow('tmux', [
    'new-session',
    '-d',
    '-s',
    sessionName,
    '-c',
    worktreePath,
  ])

  // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { created: false, error: stderr }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { created: true }
}

// killTmuxSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function killTmuxSession(sessionName: string): Promise<boolean> {
  // 从 `await execFileNoThrow('tmux', [` 解构 code，减少共享工具 worktree对同一对象的重复访问。
  const { code } = await execFileNoThrow('tmux', [
    'kill-session',
    '-t',
    sessionName,
  ])
  // 返回 `code === 0`，作为共享工具这次计算的结果。
  return code === 0
}

// createWorktreeForSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createWorktreeForSession(
  sessionId: string,
  slug: string,
  tmuxSessionName?: string,
  options?: { prNumber?: number },
): Promise<WorktreeSession> {
  // Must run before the hook branch below — hooks receive the raw slug as an
  // argument, and the git branch builds a path from it via path.join.
  // 调用 validateWorktreeSlug，触发共享工具此处需要的副作用。
  validateWorktreeSlug(slug)

  // originalCwd读取`getCwd`，供共享工具后续处理使用。
  const originalCwd = getCwd()

  // Try hook-based worktree creation first (allows user-configured VCS)
  // 满足 `hasWorktreeCreateHook()` 时，共享工具执行该分支。
  if (hasWorktreeCreateHook()) {
    // hookResult保存`executeWorktreeCreateHook`，供共享工具后续处理使用。
    const hookResult = await executeWorktreeCreateHook(slug)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Created hook-based worktree at: ${hookResult.worktreePath}`,
    )

    // currentWorktreeSession 会话数据更新为 `{`，确保共享工具后续读取最新状态。
    currentWorktreeSession = {
      originalCwd,
      worktreePath: hookResult.worktreePath,
      worktreeName: slug,
      sessionId,
      tmuxSessionName,
      hookBased: true,
    }
  } else {
    // Fall back to git worktree
    // gitRoot筛选`findGitRoot`，供共享工具后续处理使用。
    const gitRoot = findGitRoot(getCwd())
    // gitRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!gitRoot) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        'Cannot create a worktree: not in a git repository and no WorktreeCreate hooks are configured. ' +
          'Configure WorktreeCreate/WorktreeRemove hooks in settings.json to use worktree isolation with other VCS systems.',
      )
    }

    // originalBranch读取`getBranch`，供共享工具后续处理使用。
    const originalBranch = await getBranch()

    // createStart记录时间`Date.now`，供共享工具后续处理使用。
    const createStart = Date.now()
    // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
    const { worktreePath, worktreeBranch, headCommit, existed } =
      await getOrCreateWorktree(gitRoot, slug, options)

    // creationDurationMs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let creationDurationMs: number | undefined
    // 满足 `existed` 时，共享工具执行该分支。
    if (existed) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Resuming existing worktree at: ${worktreePath}`)
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Created worktree at: ${worktreePath} on branch: ${worktreeBranch}`,
      )
      // 等待 `performPostCreationSetup(gitRoot, worktreePath)` 完成，再继续共享工具 worktree的异步流程。
      await performPostCreationSetup(gitRoot, worktreePath)
      // creationDurationMs 集合更新为 `Date.now() - createStart`，确保共享工具后续读取最新状态。
      creationDurationMs = Date.now() - createStart
    }

    // currentWorktreeSession 会话数据更新为 `{`，确保共享工具后续读取最新状态。
    currentWorktreeSession = {
      originalCwd,
      worktreePath,
      worktreeName: slug,
      worktreeBranch,
      originalBranch,
      originalHeadCommit: headCommit,
      sessionId,
      tmuxSessionName,
      creationDurationMs,
      usedSparsePaths:
        (getInitialSettings().worktree?.sparsePaths?.length ?? 0) > 0,
    }
  }

  // Save to project config for persistence
  // 调用 saveCurrentProjectConfig，触发共享工具此处需要的副作用。
  saveCurrentProjectConfig(current => ({
    ...current,
    activeWorktreeSession: currentWorktreeSession ?? undefined,
  }))

  // 返回 `currentWorktreeSession`，作为共享工具这次计算的结果。
  return currentWorktreeSession
}

// keepWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function keepWorktree(): Promise<void> {
  // currentWorktreeSession 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!currentWorktreeSession) {
    // 共享工具 worktree在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `currentWorktreeSession` 解构 worktreePath、originalCwd、worktreeBranch，减少共享工具 worktree对同一对象的重复访问。
    const { worktreePath, originalCwd, worktreeBranch } = currentWorktreeSession

    // Change back to original directory first
    // 调用 process.chdir，触发共享工具此处需要的副作用。
    process.chdir(originalCwd)

    // Clear the session but keep the worktree intact
    // currentWorktreeSession 会话数据更新为 `null`，确保共享工具后续读取最新状态。
    currentWorktreeSession = null

    // Update config
    // 调用 saveCurrentProjectConfig，触发共享工具此处需要的副作用。
    saveCurrentProjectConfig(current => ({
      ...current,
      activeWorktreeSession: undefined,
    }))

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Linked worktree preserved at: ${worktreePath}${worktreeBranch ? ` on branch: ${worktreeBranch}` : ''}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `You can continue working there by running: cd ${worktreePath}`,
    )
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error keeping worktree: ${error}`, {
      level: 'error',
    })
  }
}

// cleanupWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupWorktree(): Promise<void> {
  // currentWorktreeSession 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!currentWorktreeSession) {
    // 共享工具 worktree在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
    const { worktreePath, originalCwd, worktreeBranch, hookBased } =
      currentWorktreeSession

    // Change back to original directory first
    // 调用 process.chdir，触发共享工具此处需要的副作用。
    process.chdir(originalCwd)

    // 满足 `hookBased` 时，共享工具执行该分支。
    if (hookBased) {
      // Hook-based worktree: delegate cleanup to WorktreeRemove hook
      // hookRan保存`executeWorktreeRemoveHook`，供共享工具后续处理使用。
      const hookRan = await executeWorktreeRemoveHook(worktreePath)
      // 满足 `hookRan` 时，共享工具执行该分支。
      if (hookRan) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Removed hook-based worktree at: ${worktreePath}`)
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `No WorktreeRemove hook configured, hook-based worktree left at: ${worktreePath}`,
          { level: 'warn' },
        )
      }
    } else {
      // Git-based worktree: use git worktree remove.
      // Explicit cwd: process.chdir above does NOT update getCwd() (the state
      // CWD that execFileNoThrow defaults to). If the model cd'd to a non-repo
      // dir, the bare execFileNoThrow variant would fail silently here.
      // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
      const { code: removeCode, stderr: removeError } =
        await execFileNoThrowWithCwd(
          gitExe(),
          ['worktree', 'remove', '--force', worktreePath],
          { cwd: originalCwd },
        )

      // `removeCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (removeCode !== 0) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to remove linked worktree: ${removeError}`, {
          level: 'error',
        })
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Removed linked worktree at: ${worktreePath}`)
      }
    }

    // Clear the session
    // currentWorktreeSession 会话数据更新为 `null`，确保共享工具后续读取最新状态。
    currentWorktreeSession = null

    // Update config
    // 调用 saveCurrentProjectConfig，触发共享工具此处需要的副作用。
    saveCurrentProjectConfig(current => ({
      ...current,
      activeWorktreeSession: undefined,
    }))

    // Delete the temporary worktree branch (git-based only)
    // 只有 `!hookBased && worktreeBranch` 满足时，共享工具才执行该分支。
    if (!hookBased && worktreeBranch) {
      // Wait a bit to ensure git has released all locks
      // 等待 `sleep(100)` 完成，再继续共享工具 worktree的异步流程。
      await sleep(100)

      // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
      const { code: deleteBranchCode, stderr: deleteBranchError } =
        await execFileNoThrowWithCwd(
          gitExe(),
          ['branch', '-D', worktreeBranch],
          { cwd: originalCwd },
        )

      // `deleteBranchCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (deleteBranchCode !== 0) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Could not delete worktree branch: ${deleteBranchError}`,
          { level: 'error' },
        )
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Deleted worktree branch: ${worktreeBranch}`)
      }
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Linked worktree cleaned up completely')
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error cleaning up worktree: ${error}`, {
      level: 'error',
    })
  }
}

/**
 * Create a lightweight worktree for a subagent.
 * Reuses getOrCreateWorktree/performPostCreationSetup but does NOT touch
 * global session state (currentWorktreeSession, process.chdir, project config).
 * Falls back to hook-based creation if not in a git repository.
 */
// createAgentWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createAgentWorktree(slug: string): Promise<{
  worktreePath: string
  worktreeBranch?: string
  headCommit?: string
  gitRoot?: string
  hookBased?: boolean
}> {
  // 调用 validateWorktreeSlug，触发共享工具此处需要的副作用。
  validateWorktreeSlug(slug)

  // Try hook-based worktree creation first (allows user-configured VCS)
  // 满足 `hasWorktreeCreateHook()` 时，共享工具执行该分支。
  if (hasWorktreeCreateHook()) {
    // hookResult保存`executeWorktreeCreateHook`，供共享工具后续处理使用。
    const hookResult = await executeWorktreeCreateHook(slug)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Created hook-based agent worktree at: ${hookResult.worktreePath}`,
    )

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { worktreePath: hookResult.worktreePath, hookBased: true }
  }

  // Fall back to git worktree
  // findCanonicalGitRoot (not findGitRoot) so agent worktrees always land in
  // the main repo's .claude/worktrees/ even when spawned from inside a session
  // worktree — otherwise they nest at <worktree>/.claude/worktrees/ and the
  // periodic cleanup (which scans the canonical root) never finds them.
  // gitRoot筛选`findCanonicalGitRoot`，供共享工具后续处理使用。
  const gitRoot = findCanonicalGitRoot(getCwd())
  // gitRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitRoot) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'Cannot create agent worktree: not in a git repository and no WorktreeCreate hooks are configured. ' +
        'Configure WorktreeCreate/WorktreeRemove hooks in settings.json to use worktree isolation with other VCS systems.',
    )
  }

  // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
  const { worktreePath, worktreeBranch, headCommit, existed } =
    await getOrCreateWorktree(gitRoot, slug)

  // existed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!existed) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Created agent worktree at: ${worktreePath} on branch: ${worktreeBranch}`,
    )
    // 等待 `performPostCreationSetup(gitRoot, worktreePath)` 完成，再继续共享工具 worktree的异步流程。
    await performPostCreationSetup(gitRoot, worktreePath)
  } else {
    // Bump mtime so the periodic stale-worktree cleanup doesn't consider this
    // worktree stale — the fast-resume path is read-only and leaves the original
    // creation-time mtime intact, which can be past the 30-day cutoff.
    // now记录时间`Date`，供共享工具后续处理使用。
    const now = new Date()
    // 等待 `utimes(worktreePath, now, now)` 完成，再继续共享工具 worktree的异步流程。
    await utimes(worktreePath, now, now)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Resuming existing agent worktree at: ${worktreePath}`)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { worktreePath, worktreeBranch, headCommit, gitRoot }
}

/**
 * Remove a worktree created by createAgentWorktree.
 * For git-based worktrees, removes the worktree directory and deletes the temporary branch.
 * For hook-based worktrees, delegates to the WorktreeRemove hook.
 * Must be called with the main repo's git root (for git worktrees), not the worktree path,
 * since the worktree directory is deleted during this operation.
 */
// removeAgentWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeAgentWorktree(
  worktreePath: string,
  worktreeBranch?: string,
  gitRoot?: string,
  hookBased?: boolean,
): Promise<boolean> {
  // 满足 `hookBased` 时，共享工具执行该分支。
  if (hookBased) {
    // hookRan保存`executeWorktreeRemoveHook`，供共享工具后续处理使用。
    const hookRan = await executeWorktreeRemoveHook(worktreePath)
    // 满足 `hookRan` 时，共享工具执行该分支。
    if (hookRan) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Removed hook-based agent worktree at: ${worktreePath}`)
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `No WorktreeRemove hook configured, hook-based agent worktree left at: ${worktreePath}`,
        { level: 'warn' },
      )
    }
    // 返回 `hookRan`，作为共享工具这次计算的结果。
    return hookRan
  }

  // gitRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitRoot) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Cannot remove agent worktree: no git root provided', {
      level: 'error',
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Run from the main repo root, not the worktree (which we're about to delete)
  // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
  const { code: removeCode, stderr: removeError } =
    await execFileNoThrowWithCwd(
      gitExe(),
      ['worktree', 'remove', '--force', worktreePath],
      { cwd: gitRoot },
    )

  // `removeCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (removeCode !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to remove agent worktree: ${removeError}`, {
      level: 'error',
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Removed agent worktree at: ${worktreePath}`)

  // worktreeBranch缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!worktreeBranch) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Delete the temporary worktree branch from the main repo
  // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
  const { code: deleteBranchCode, stderr: deleteBranchError } =
    await execFileNoThrowWithCwd(gitExe(), ['branch', '-D', worktreeBranch], {
      cwd: gitRoot,
    })

  // `deleteBranchCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (deleteBranchCode !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Could not delete agent worktree branch: ${deleteBranchError}`,
      { level: 'error' },
    )
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Slug patterns for throwaway worktrees created by AgentTool (`agent-a<7hex>`,
 * from earlyAgentId.slice(0,8)), WorkflowTool (`wf_<runId>-<idx>` where runId
 * is randomUUID().slice(0,12) = 8 hex + `-` + 3 hex), and bridgeMain
 * (`bridge-<safeFilenameId>`). These leak when the parent process is killed
 * (Ctrl+C, ESC, crash) before their in-process cleanup runs. Exact-shape
 * patterns avoid sweeping user-named EnterWorktree slugs like `wf-myfeature`.
 */
// EPHEMERAL_WORKTREE_PATTERNS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const EPHEMERAL_WORKTREE_PATTERNS = [
  /^agent-a[0-9a-f]{7}$/,
  /^wf_[0-9a-f]{8}-[0-9a-f]{3}-\d+$/,
  // Legacy wf-<idx> slugs from before workflowRunId disambiguation — kept so
  // the 30-day sweep still cleans up worktrees leaked by older builds.
  /^wf-\d+$/,
  // Real bridge slugs are `bridge-${safeFilenameId(sessionId)}`.
  /^bridge-[A-Za-z0-9_]+(-[A-Za-z0-9_]+)*$/,
  // Template job worktrees: job-<templateName>-<8hex>. Prefix distinguishes
  // from user-named EnterWorktree slugs that happen to end in 8 hex.
  /^job-[a-zA-Z0-9._-]{1,55}-[0-9a-f]{8}$/,
]

/**
 * Remove stale agent/workflow worktrees older than cutoffDate.
 *
 * Safety:
 * - Only touches slugs matching ephemeral patterns (never user-named worktrees)
 * - Skips the current session's worktree
 * - Fail-closed: skips if git status fails or shows tracked changes
 *   (-uno: untracked files in a 30-day-old crashed agent worktree are build
 *   artifacts; skipping the untracked scan is 5-10× faster on large repos)
 * - Fail-closed: skips if any commits aren't reachable from a remote
 *
 * `git worktree remove --force` handles both the directory and git's internal
 * worktree tracking. If git doesn't recognize the path as a worktree (orphaned
 * dir), it's left in place — a later readdir finding it stale again is harmless.
 */
// cleanupStaleAgentWorktrees 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupStaleAgentWorktrees(
  cutoffDate: Date,
): Promise<number> {
  // gitRoot筛选`findCanonicalGitRoot`，供共享工具后续处理使用。
  const gitRoot = findCanonicalGitRoot(getCwd())
  // gitRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitRoot) {
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }

  // dir保存`worktreesDir`，供共享工具后续处理使用。
  const dir = worktreesDir(gitRoot)
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await readdir(dir)`，确保共享工具后续读取最新状态。
    entries = await readdir(dir)
  } catch {
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }

  // cutoffMs 集合读取`cutoffDate.getTime`，供共享工具后续处理使用。
  const cutoffMs = cutoffDate.getTime()
  // currentPath 路径数据保存`currentWorktreeSession?.worktreePath`，供共享工具 worktree后续判断或输出使用。
  const currentPath = currentWorktreeSession?.worktreePath
  // removed保存`0`，供后续判断或组装使用。
  let removed = 0

  // 按顺序遍历 `entries` 中的slug，逐个交给共享工具处理。
  for (const slug of entries) {
    // 满足 `!EPHEMERAL_WORKTREE_PATTERNS.some(p => p.test(slug))` 时，共享工具执行该分支。
    if (!EPHEMERAL_WORKTREE_PATTERNS.some(p => p.test(slug))) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // worktreePath 路径数据格式化`join`，供共享工具后续处理使用。
    const worktreePath = join(dir, slug)
    // 满足 `currentPath === worktreePath` 时，共享工具执行该分支。
    if (currentPath === worktreePath) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // mtimeMs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let mtimeMs: number
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // mtimeMs 集合更新为 `(await stat(worktreePath)).mtimeMs`，确保共享工具后续读取最新状态。
      mtimeMs = (await stat(worktreePath)).mtimeMs
    } catch {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `mtimeMs >= cutoffMs` 时，共享工具执行该分支。
    if (mtimeMs >= cutoffMs) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Both checks must succeed with empty output. Non-zero exit (corrupted
    // worktree, git not recognizing it, etc.) means skip — we don't know
    // what's in there.
    // 并行获取 status、unpushed，缩短共享工具 worktree等待多个独立异步任务的时间。
    const [status, unpushed] = await Promise.all([
      execFileNoThrowWithCwd(
        gitExe(),
        ['--no-optional-locks', 'status', '--porcelain', '-uno'],
        { cwd: worktreePath },
      ),
      execFileNoThrowWithCwd(
        gitExe(),
        ['rev-list', '--max-count=1', 'HEAD', '--not', '--remotes'],
        { cwd: worktreePath },
      ),
    ])
    // `status.code` 与 `0 || status.stdout.trim().lengt...` 不一致时刷新派生状态，避免使用过期结果。
    if (status.code !== 0 || status.stdout.trim().length > 0) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // `unpushed.code` 与 `0 || unpushed.stdout.trim().len...` 不一致时刷新派生状态，避免使用过期结果。
    if (unpushed.code !== 0 || unpushed.stdout.trim().length > 0) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 共享工具在这里按实际状态进入对应分支。
    if (
      await removeAgentWorktree(worktreePath, worktreeBranchName(slug), gitRoot)
    ) {
      // 共享工具 worktree在这里处理 `removed++`，完成这一小步状态转换。
      removed++
    }
  }

  // 满足 `removed > 0` 时，共享工具执行该分支。
  if (removed > 0) {
    // 等待 `execFileNoThrowWithCwd(gitExe(), ['worktree', 'prune'], {` 完成，再继续共享工具 worktree的异步流程。
    await execFileNoThrowWithCwd(gitExe(), ['worktree', 'prune'], {
      cwd: gitRoot,
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `cleanupStaleAgentWorktrees: removed ${removed} stale worktree(s)`,
    )
  }
  // 返回 `removed`，作为共享工具这次计算的结果。
  return removed
}

/**
 * Check whether a worktree has uncommitted changes or new commits since creation.
 * Returns true if there are uncommitted changes (dirty working tree), if commits
 * were made on the worktree branch since `headCommit`, or if git commands fail
 * — callers use this to decide whether to remove a worktree, so fail-closed.
 */
// hasWorktreeChanges 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function hasWorktreeChanges(
  worktreePath: string,
  headCommit: string,
): Promise<boolean> {
  // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
  const { code: statusCode, stdout: statusOutput } =
    await execFileNoThrowWithCwd(gitExe(), ['status', '--porcelain'], {
      cwd: worktreePath,
    })
  // `statusCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (statusCode !== 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `statusOutput.trim().length > 0` 时，共享工具执行该分支。
  if (statusOutput.trim().length > 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 共享工具 worktree先整理这一处局部数据，后续分支可以直接读取。
  const { code: revListCode, stdout: revListOutput } =
    await execFileNoThrowWithCwd(
      gitExe(),
      ['rev-list', '--count', `${headCommit}..HEAD`],
      { cwd: worktreePath },
    )
  // `revListCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (revListCode !== 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `parseInt(revListOutput.trim(), 10) > 0` 时，共享工具执行该分支。
  if (parseInt(revListOutput.trim(), 10) > 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Fast-path handler for --worktree --tmux.
 * Creates the worktree and execs into tmux running Claude inside.
 * This is called early in cli.tsx before loading the full CLI.
 */
// execIntoTmuxWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function execIntoTmuxWorktree(args: string[]): Promise<{
  handled: boolean
  error?: string
}> {
  // Check platform - tmux doesn't work on Windows
  // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (process.platform === 'win32') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      handled: false,
      error: 'Error: --tmux is not supported on Windows',
    }
  }

  // Check if tmux is available
  // tmuxCheck保存`spawnSync`，供共享工具后续处理使用。
  const tmuxCheck = spawnSync('tmux', ['-V'], { encoding: 'utf-8' })
  // `tmuxCheck.status` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (tmuxCheck.status !== 0) {
    // installHint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const installHint =
      process.platform === 'darwin'
        ? 'Install tmux with: brew install tmux'
        : 'Install tmux with: sudo apt install tmux'
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      handled: false,
      error: `Error: tmux is not installed. ${installHint}`,
    }
  }

  // Parse worktree name and tmux mode from args
  // worktreeName 先占位，稍后的条件分支会根据实际输入补齐它。
  let worktreeName: string | undefined
  // forceClassicTmux标记共享工具 worktree是否启用对应路径。
  let forceClassicTmux = false
  // 按索引扫描 `args.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < args.length; i++) {
    // 当前参数保存`args[i]`，供共享工具 worktree后续判断或输出使用。
    const arg = args[i]
    // 当前参数缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!arg) continue
    // 当 `arg` 匹配 `'-w' || arg === '--worktree'` 时，共享工具执行对应分支。
    if (arg === '-w' || arg === '--worktree') {
      // Check if next arg exists and isn't another flag
      // next保存`args[i + 1]`，供共享工具 worktree后续判断或输出使用。
      const next = args[i + 1]
      // 只有 `next && !next.startsWith('-')` 满足时，共享工具才执行该分支。
      if (next && !next.startsWith('-')) {
        // worktreeName更新为 `next`，确保共享工具后续读取最新状态。
        worktreeName = next
      }
    // 共享工具 worktree在这里处理 `} else if (arg.startsWith('--worktree=')) {`，完成这一小步状态转换。
    } else if (arg.startsWith('--worktree=')) {
      // worktreeName更新为 `arg.slice('--worktree='.length)`，确保共享工具后续读取最新状态。
      worktreeName = arg.slice('--worktree='.length)
    // 共享工具 worktree在这里处理 `} else if (arg === '--tmux=classic') {`，完成这一小步状态转换。
    } else if (arg === '--tmux=classic') {
      // forceClassicTmux更新为 `true`，确保共享工具后续读取最新状态。
      forceClassicTmux = true
    }
  }

  // Check if worktree name is a PR reference
  // prNumber初始化为空值，后续分支会在有数据时补齐。
  let prNumber: number | null = null
  // 满足 `worktreeName` 时，共享工具执行该分支。
  if (worktreeName) {
    // prNumber更新为 `parsePRReference(worktreeName)`，确保共享工具后续读取最新状态。
    prNumber = parsePRReference(worktreeName)
    // `prNumber` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (prNumber !== null) {
      // worktreeName更新为 ``pr-${prNumber}``，确保共享工具后续读取最新状态。
      worktreeName = `pr-${prNumber}`
    }
  }

  // Generate a slug if no name provided
  // worktreeName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!worktreeName) {
    // adjectives 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const adjectives = ['swift', 'bright', 'calm', 'keen', 'bold']
    // nouns 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const nouns = ['fox', 'owl', 'elm', 'oak', 'ray']
    // adj保存`Math.floor`，供共享工具后续处理使用。
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    // noun保存`Math.floor`，供共享工具后续处理使用。
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    // suffix保存`Math.random`，供共享工具后续处理使用。
    const suffix = Math.random().toString(36).slice(2, 6)
    // worktreeName更新为 ``${adj}-${noun}-${suffix}``，确保共享工具后续读取最新状态。
    worktreeName = `${adj}-${noun}-${suffix}`
  }

  // worktreeName is joined into worktreeDir via path.join below; apply the
  // same allowlist used by the in-session worktree tool so the constraint
  // holds uniformly regardless of entry point.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 validateWorktreeSlug，触发共享工具此处需要的副作用。
    validateWorktreeSlug(worktreeName)
  } catch (e) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      handled: false,
      error: `Error: ${(e as Error).message}`,
    }
  }

  // Mirror createWorktreeForSession(): hook takes precedence over git so the
  // WorktreeCreate hook substitutes the VCS backend for this fast-path too
  // (anthropics/claude-code#39281). Git path below runs only when no hook.
  // worktreeDir 先占位，稍后的条件分支会根据实际输入补齐它。
  let worktreeDir: string
  // repoName 先占位，稍后的条件分支会根据实际输入补齐它。
  let repoName: string
  // 满足 `hasWorktreeCreateHook()` 时，共享工具执行该分支。
  if (hasWorktreeCreateHook()) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // hookResult保存`executeWorktreeCreateHook`，供共享工具后续处理使用。
      const hookResult = await executeWorktreeCreateHook(worktreeName)
      // worktreeDir更新为 `hookResult.worktreePath`，确保共享工具后续读取最新状态。
      worktreeDir = hookResult.worktreePath
    } catch (error) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        handled: false,
        error: `Error: ${errorMessage(error)}`,
      }
    }
    // repoName更新为 `basename(findCanonicalGitRoot(getCwd()) ?? getCwd())`，确保共享工具后续读取最新状态。
    repoName = basename(findCanonicalGitRoot(getCwd()) ?? getCwd())
    // biome-ignore lint/suspicious/noConsole: intentional console output
    // 调用 console.log，触发共享工具此处需要的副作用。
    console.log(`Using worktree via hook: ${worktreeDir}`)
  } else {
    // Get main git repo root (resolves through worktrees)
    // repoRoot筛选`findCanonicalGitRoot`，供共享工具后续处理使用。
    const repoRoot = findCanonicalGitRoot(getCwd())
    // repoRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!repoRoot) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        handled: false,
        error: 'Error: --worktree requires a git repository',
      }
    }

    // repoName更新为 `basename(repoRoot)`，确保共享工具后续读取最新状态。
    repoName = basename(repoRoot)
    // worktreeDir更新为 `worktreePathFor(repoRoot, worktreeName)`，确保共享工具后续读取最新状态。
    worktreeDir = worktreePathFor(repoRoot, worktreeName)

    // Create or resume worktree
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果读取`getOrCreateWorktree`，供共享工具后续处理使用。
      const result = await getOrCreateWorktree(
        repoRoot,
        worktreeName,
        prNumber !== null ? { prNumber } : undefined,
      )
      // result.existed缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!result.existed) {
        // biome-ignore lint/suspicious/noConsole: intentional console output
        // 调用 console.log，触发共享工具此处需要的副作用。
        console.log(
          `Created worktree: ${worktreeDir} (based on ${result.baseBranch})`,
        )
        // 等待 `performPostCreationSetup(repoRoot, worktreeDir)` 完成，再继续共享工具 worktree的异步流程。
        await performPostCreationSetup(repoRoot, worktreeDir)
      }
    } catch (error) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        handled: false,
        error: `Error: ${errorMessage(error)}`,
      }
    }
  }

  // Sanitize for tmux session name (replace / and . with _)
  // tmuxSessionName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const tmuxSessionName =
    `${repoName}_${worktreeBranchName(worktreeName)}`.replace(/[/.]/g, '_')

  // Build new args without --tmux and --worktree (we're already in the worktree)
  // newArgs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newArgs: string[] = []
  // 按索引扫描 `args.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < args.length; i++) {
    // 当前参数保存`args[i]`，供共享工具 worktree后续判断或输出使用。
    const arg = args[i]
    // 当前参数缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!arg) continue
    // 当 `arg` 匹配 `'--tmux' || arg === '--tmux...` 时，共享工具执行对应分支。
    if (arg === '--tmux' || arg === '--tmux=classic') continue
    // 当 `arg` 匹配 `'-w' || arg === '--worktree'` 时，共享工具执行对应分支。
    if (arg === '-w' || arg === '--worktree') {
      // Skip the flag and its value if present
      // next保存`args[i + 1]`，供共享工具 worktree后续判断或输出使用。
      const next = args[i + 1]
      // 只有 `next && !next.startsWith('-')` 满足时，共享工具才执行该分支。
      if (next && !next.startsWith('-')) {
        // 共享工具 worktree在这里处理 `i++ // Skip the value too`，完成这一小步状态转换。
        i++ // Skip the value too
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `arg.startsWith('--worktree=')` 时，共享工具执行该分支。
    if (arg.startsWith('--worktree=')) continue
    // newArgs 集合追加新条目，保持收集顺序与输入顺序一致。
    newArgs.push(arg)
  }

  // Get tmux prefix for user guidance
  // tmuxPrefix固定为 `'C-b' // default`，作为共享工具 worktree后续展示或比较的基准。
  let tmuxPrefix = 'C-b' // default
  // prefixResult保存`spawnSync`，供共享工具后续处理使用。
  const prefixResult = spawnSync('tmux', ['show-options', '-g', 'prefix'], {
    encoding: 'utf-8',
  })
  // 只有 `prefixResult.status === 0 && prefixResult.stdout` 满足时，共享工具才执行该分支。
  if (prefixResult.status === 0 && prefixResult.stdout) {
    // match匹配`stdout.match`，供共享工具后续处理使用。
    const match = prefixResult.stdout.match(/prefix\s+(\S+)/)
    // 满足 `match?.[1]` 时，共享工具执行该分支。
    if (match?.[1]) {
      // tmuxPrefix更新为 `match[1]`，确保共享工具后续读取最新状态。
      tmuxPrefix = match[1]
    }
  }

  // Check if tmux prefix conflicts with Claude keybindings
  // Claude binds: ctrl+b (task:background), ctrl+c, ctrl+d, ctrl+t, ctrl+o, ctrl+r, ctrl+s, ctrl+g, ctrl+e
  // claudeBindings 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const claudeBindings = [
    'C-b',
    'C-c',
    'C-d',
    'C-t',
    'C-o',
    'C-r',
    'C-s',
    'C-g',
    'C-e',
  ]
  // prefixConflicts 集合筛选`claudeBindings.includes`，供共享工具后续处理使用。
  const prefixConflicts = claudeBindings.includes(tmuxPrefix)

  // Set env vars for the inner Claude to display tmux info in welcome message
  // tmuxEnv集中保存共享工具 worktree要一起传递的字段。
  const tmuxEnv = {
    ...process.env,
    CLAUDE_CODE_TMUX_SESSION: tmuxSessionName,
    CLAUDE_CODE_TMUX_PREFIX: tmuxPrefix,
    CLAUDE_CODE_TMUX_PREFIX_CONFLICTS: prefixConflicts ? '1' : '',
  }

  // Check if session already exists
  // hasSessionResult 会话数据记录 `spawnSync` 是否成立，共享工具随后按该结果分支。
  const hasSessionResult = spawnSync(
    'tmux',
    ['has-session', '-t', tmuxSessionName],
    { encoding: 'utf-8' },
  )
  // sessionExists 会话数据标记共享工具 worktree是否启用对应路径。
  const sessionExists = hasSessionResult.status === 0

  // Check if we're already inside a tmux session
  // isAlreadyInTmux记录 `Boolean` 是否成立，共享工具随后按该结果分支。
  const isAlreadyInTmux = Boolean(process.env.TMUX)

  // Use tmux control mode (-CC) for native iTerm2 tab/pane integration
  // This lets users use iTerm2's UI instead of learning tmux keybindings
  // Use --tmux=classic to force traditional tmux even in iTerm2
  // Control mode doesn't make sense when already in tmux (would need to switch-client)
  // useControlMode保存`isInITerm2`，供共享工具后续处理使用。
  const useControlMode = isInITerm2() && !forceClassicTmux && !isAlreadyInTmux
  // tmuxGlobalArgs 集合读取 hook 状态，供共享工具 worktree本轮渲染使用。
  const tmuxGlobalArgs = useControlMode ? ['-CC'] : []

  // Print hint about iTerm2 preferences when using control mode
  // 只有 `useControlMode && !sessionExists` 满足时，共享工具才执行该分支。
  if (useControlMode && !sessionExists) {
    // y保存`chalk.yellow`，供共享工具 worktree后续判断或输出使用。
    const y = chalk.yellow
    // biome-ignore lint/suspicious/noConsole: intentional user guidance
    // 调用 console.log，触发共享工具此处需要的副作用。
    console.log(
      `\n${y('╭─ iTerm2 Tip ────────────────────────────────────────────────────────╮')}\n` +
        `${y('│')} To open as a tab instead of a new window:                           ${y('│')}\n` +
        `${y('│')} iTerm2 > Settings > General > tmux > "Tabs in attaching window"     ${y('│')}\n` +
        `${y('╰─────────────────────────────────────────────────────────────────────╯')}\n`,
    )
  }

  // For ants in claude-cli-internal, set up dev panes (watch + start)
  // isAnt 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const isAnt = process.env.USER_TYPE === 'ant'
  // isClaudeCliInternal标记共享工具 worktree是否启用对应路径。
  const isClaudeCliInternal = repoName === 'claude-cli-internal'
  // shouldSetupDevPanes 集合标记共享工具 worktree是否启用对应路径。
  const shouldSetupDevPanes = isAnt && isClaudeCliInternal && !sessionExists

  // 满足 `shouldSetupDevPanes` 时，共享工具执行该分支。
  if (shouldSetupDevPanes) {
    // Create detached session with Claude in first pane
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync(
      'tmux',
      [
        'new-session',
        '-d', // detached
        '-s',
        tmuxSessionName,
        '-c',
        worktreeDir,
        '--',
        process.execPath,
        ...newArgs,
      ],
      { cwd: worktreeDir, env: tmuxEnv },
    )

    // Split horizontally and run watch
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync(
      'tmux',
      ['split-window', '-h', '-t', tmuxSessionName, '-c', worktreeDir],
      { cwd: worktreeDir },
    )
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync(
      'tmux',
      ['send-keys', '-t', tmuxSessionName, 'bun run watch', 'Enter'],
      { cwd: worktreeDir },
    )

    // Split vertically and run start
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync(
      'tmux',
      ['split-window', '-v', '-t', tmuxSessionName, '-c', worktreeDir],
      { cwd: worktreeDir },
    )
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync('tmux', ['send-keys', '-t', tmuxSessionName, 'bun run start'], {
      cwd: worktreeDir,
    })

    // Select the first pane (Claude)
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync('tmux', ['select-pane', '-t', `${tmuxSessionName}:0.0`], {
      cwd: worktreeDir,
    })

    // Attach or switch to the session
    // 满足 `isAlreadyInTmux` 时，共享工具执行该分支。
    if (isAlreadyInTmux) {
      // Switch to sibling session (avoid nesting)
      // 调用 spawnSync，触发共享工具此处需要的副作用。
      spawnSync('tmux', ['switch-client', '-t', tmuxSessionName], {
        stdio: 'inherit',
      })
    } else {
      // Attach to the session
      // 调用 spawnSync，触发共享工具此处需要的副作用。
      spawnSync(
        'tmux',
        [...tmuxGlobalArgs, 'attach-session', '-t', tmuxSessionName],
        {
          stdio: 'inherit',
          cwd: worktreeDir,
        },
      )
    }
  } else {
    // Standard behavior: create or attach
    // 满足 `isAlreadyInTmux` 时，共享工具执行该分支。
    if (isAlreadyInTmux) {
      // Already in tmux - create detached session, then switch to it (sibling)
      // Check if session already exists first
      // 满足 `sessionExists` 时，共享工具执行该分支。
      if (sessionExists) {
        // Just switch to existing session
        // 调用 spawnSync，触发共享工具此处需要的副作用。
        spawnSync('tmux', ['switch-client', '-t', tmuxSessionName], {
          stdio: 'inherit',
        })
      } else {
        // Create new detached session
        // 调用 spawnSync，触发共享工具此处需要的副作用。
        spawnSync(
          'tmux',
          [
            'new-session',
            '-d', // detached
            '-s',
            tmuxSessionName,
            '-c',
            worktreeDir,
            '--',
            process.execPath,
            ...newArgs,
          ],
          { cwd: worktreeDir, env: tmuxEnv },
        )

        // Switch to the new session
        // 调用 spawnSync，触发共享工具此处需要的副作用。
        spawnSync('tmux', ['switch-client', '-t', tmuxSessionName], {
          stdio: 'inherit',
        })
      }
    } else {
      // Not in tmux - create and attach (original behavior)
      // tmuxArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const tmuxArgs = [
        ...tmuxGlobalArgs,
        'new-session',
        '-A', // Attach if exists, create if not
        '-s',
        tmuxSessionName,
        '-c',
        worktreeDir,
        '--', // Separator before command
        process.execPath,
        ...newArgs,
      ]

      // 调用 spawnSync，触发共享工具此处需要的副作用。
      spawnSync('tmux', tmuxArgs, {
        stdio: 'inherit',
        cwd: worktreeDir,
        env: tmuxEnv,
      })
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { handled: true }
}
