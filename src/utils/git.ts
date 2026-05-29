// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { readFileSync, realpathSync, statSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open, readFile, realpath, stat } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join, resolve, sep } from 'path'
// 引入 hasBinaryExtension、isBinaryContent，将 ../constants/files.js 中已经封装好的能力接到本文件流程里。
import { hasBinaryExtension, isBinaryContent } from '../constants/files.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCachedBranch,
  getCachedDefaultBranch,
  getCachedHead,
  getCachedRemoteUrl,
  getWorktreeCountFromFs,
  isShallowClone as isShallowCloneFs,
  resolveGitDir,
} from './git/gitFilesystem.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 memoizeWithLRU，将 ./memoize.js 中已经封装好的能力接到本文件流程里。
import { memoizeWithLRU } from './memoize.js'
// 引入 whichSync，将 ./which.js 中已经封装好的能力接到本文件流程里。
import { whichSync } from './which.js'

// GIT_ROOT_NOT_FOUND保存`Symbol`，供共享工具后续处理使用。
const GIT_ROOT_NOT_FOUND = Symbol('git-root-not-found')

// findGitRootImpl保存`memoizeWithLRU`，供共享工具后续处理使用。
const findGitRootImpl = memoizeWithLRU(
  // 这个回调绑定到 (startPath: string): string | typeof GIT_ROOT_NOT_FOUND => {，负责共享工具在该局部场景下的响应。
  (startPath: string): string | typeof GIT_ROOT_NOT_FOUND => {
    // startTime记录时间`Date.now`，供共享工具后续处理使用。
    const startTime = Date.now()
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'find_git_root_started')

    // current读取`resolve`，供共享工具后续处理使用。
    let current = resolve(startPath)
    // root格式化`current.substring`，供共享工具后续处理使用。
    const root = current.substring(0, current.indexOf(sep) + 1) || sep
    // statCount 数量保存`0`，供后续判断或组装使用。
    let statCount = 0

    // while 使用 current !== root 完成共享工具里的对应操作。
    while (current !== root) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // gitPath 路径数据格式化`join`，供共享工具后续处理使用。
        const gitPath = join(current, '.git')
        // 共享工具 git在这里处理 `statCount++`，完成这一小步状态转换。
        statCount++
        // stat保存`statSync`，供共享工具后续处理使用。
        const stat = statSync(gitPath)
        // .git can be a directory (regular repo) or file (worktree/submodule)
        // 只有 `stat.isDirectory() || stat.isFile()` 满足时，共享工具才执行该分支。
        if (stat.isDirectory() || stat.isFile()) {
          // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
          logForDiagnosticsNoPII('info', 'find_git_root_completed', {
            duration_ms: Date.now() - startTime,
            stat_count: statCount,
            found: true,
          })
          // 返回 `current.normalize('NFC')`，作为共享工具这次计算的结果。
          return current.normalize('NFC')
        }
      } catch {
        // .git doesn't exist at this level, continue up
      }
      // parent保存`dirname`，供共享工具后续处理使用。
      const parent = dirname(current)
      // 满足 `parent === current` 时，共享工具执行该分支。
      if (parent === current) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // current更新为 `parent`，确保共享工具后续读取最新状态。
      current = parent
    }

    // Check root directory as well
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // gitPath 路径数据格式化`join`，供共享工具后续处理使用。
      const gitPath = join(root, '.git')
      // 共享工具 git在这里处理 `statCount++`，完成这一小步状态转换。
      statCount++
      // stat保存`statSync`，供共享工具后续处理使用。
      const stat = statSync(gitPath)
      // 只有 `stat.isDirectory() || stat.isFile()` 满足时，共享工具才执行该分支。
      if (stat.isDirectory() || stat.isFile()) {
        // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
        logForDiagnosticsNoPII('info', 'find_git_root_completed', {
          duration_ms: Date.now() - startTime,
          stat_count: statCount,
          found: true,
        })
        // 返回 `root.normalize('NFC')`，作为共享工具这次计算的结果。
        return root.normalize('NFC')
      }
    } catch {
      // .git doesn't exist at root
    }

    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'find_git_root_completed', {
      duration_ms: Date.now() - startTime,
      stat_count: statCount,
      found: false,
    })
    // 返回 `GIT_ROOT_NOT_FOUND`，作为共享工具这次计算的结果。
    return GIT_ROOT_NOT_FOUND
  },
  // 路径更新为 `> path`，确保共享工具后续读取最新状态。
  path => path,
  50,
)

/**
 * Find the git root by walking up the directory tree.
 * Looks for a .git directory or file (worktrees/submodules use a file).
 * Returns the directory containing .git, or null if not found.
 *
 * Memoized per startPath with an LRU cache (max 50 entries) to prevent
 * unbounded growth — gitDiff calls this with dirname(file), so editing many
 * files across different directories would otherwise accumulate entries forever.
 */
// findGitRoot构建`createFindGitRoot`，供共享工具后续处理使用。
export const findGitRoot = createFindGitRoot()

// createFindGitRoot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createFindGitRoot(): {
  (startPath: string): string | null
  cache: typeof findGitRootImpl.cache
} {
  // wrapper 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function wrapper(startPath: string): string | null {
    // 结果筛选`findGitRootImpl`，供共享工具后续处理使用。
    const result = findGitRootImpl(startPath)
    // 返回 `result === GIT_ROOT_NOT_FOUND ? null : result`，作为共享工具这次计算的结果。
    return result === GIT_ROOT_NOT_FOUND ? null : result
  }
  // cache 缓存更新为 `findGitRootImpl.cache`，确保共享工具后续读取最新状态。
  wrapper.cache = findGitRootImpl.cache
  // 返回 `wrapper`，作为共享工具这次计算的结果。
  return wrapper
}

/**
 * Resolve a git root to the canonical main repository root.
 * For a regular repo this is a no-op. For a worktree, follows the
 * `.git` file → `gitdir:` → `commondir` chain to find the main repo's
 * working directory.
 *
 * Submodules (`.git` is a file but no `commondir`) fall through to the
 * input root, which is correct since submodules are separate repos.
 *
 * Memoized with a small LRU to avoid repeated file reads on the hot
 * path (permission checks, prompt building).
 */
// resolveCanonicalRoot保存`memoizeWithLRU`，供共享工具后续处理使用。
const resolveCanonicalRoot = memoizeWithLRU(
  // 这个回调绑定到 (gitRoot: string): string => {，负责共享工具在该局部场景下的响应。
  (gitRoot: string): string => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // In a worktree, .git is a file containing: gitdir: <path>
      // In a regular repo, .git is a directory (readFileSync throws EISDIR).
      // gitContent读取`readFileSync`，供共享工具后续处理使用。
      const gitContent = readFileSync(join(gitRoot, '.git'), 'utf-8').trim()
      // 满足 `!gitContent.startsWith('gitdir:')` 时，共享工具执行该分支。
      if (!gitContent.startsWith('gitdir:')) {
        // 返回 `gitRoot`，作为共享工具这次计算的结果。
        return gitRoot
      }
      // worktreeGitDir读取`resolve`，供共享工具后续处理使用。
      const worktreeGitDir = resolve(
        gitRoot,
        gitContent.slice('gitdir:'.length).trim(),
      )
      // commondir points to the shared .git directory (relative to worktree gitdir).
      // Submodules have no commondir (readFileSync throws ENOENT) → fall through.
      // commonDir读取`resolve`，供共享工具后续处理使用。
      const commonDir = resolve(
        worktreeGitDir,
        readFileSync(join(worktreeGitDir, 'commondir'), 'utf-8').trim(),
      )
      // SECURITY: The .git file and commondir are attacker-controlled in a
      // cloned/downloaded repo. Without validation, a malicious repo can point
      // commondir at any path the victim has trusted, bypassing the trust
      // dialog and executing hooks from .claude/settings.json on startup.
      //
      // Validate the structure matches what `git worktree add` creates:
      //   1. worktreeGitDir is a direct child of <commonDir>/worktrees/
      //      → ensures the commondir file we read lives inside the resolved
      //        common dir, not inside the attacker's repo
      //   2. <worktreeGitDir>/gitdir points back to <gitRoot>/.git
      //      → ensures an attacker can't borrow a victim's existing worktree
      //        entry by guessing its path
      // Both are required: (1) alone fails if victim has a worktree of the
      // trusted repo; (2) alone fails because attacker controls worktreeGitDir.
      // `resolve(dirname(worktreeGitDir))` 与 `join(commonDir, 'worktrees')` 不一致时刷新派生状态，避免使用过期结果。
      if (resolve(dirname(worktreeGitDir)) !== join(commonDir, 'worktrees')) {
        // 返回 `gitRoot`，作为共享工具这次计算的结果。
        return gitRoot
      }
      // Git writes gitdir with strbuf_realpath() (symlinks resolved), but
      // gitRoot from findGitRoot() is only lexically resolved. Realpath gitRoot
      // so legitimate worktrees accessed via a symlinked path (e.g. macOS
      // /tmp → /private/tmp) aren't rejected. Realpath the directory then join
      // '.git' — realpathing the .git file itself would follow a symlinked .git
      // and let an attacker borrow a victim's back-link.
      // backlink保存`realpathSync`，供共享工具后续处理使用。
      const backlink = realpathSync(
        readFileSync(join(worktreeGitDir, 'gitdir'), 'utf-8').trim(),
      )
      // `backlink` 与 `join(realpathSync(gitRoot), '.g...` 不一致时刷新派生状态，避免使用过期结果。
      if (backlink !== join(realpathSync(gitRoot), '.git')) {
        // 返回 `gitRoot`，作为共享工具这次计算的结果。
        return gitRoot
      }
      // Bare-repo worktrees: the common dir isn't inside a working directory.
      // Use the common dir itself as the stable identity (anthropics/claude-code#27994).
      // `basename(commonDir)` 与 `'.git'` 不一致时刷新派生状态，避免使用过期结果。
      if (basename(commonDir) !== '.git') {
        // 返回 `commonDir.normalize('NFC')`，作为共享工具这次计算的结果。
        return commonDir.normalize('NFC')
      }
      // 返回 `dirname(commonDir).normalize('NFC')`，作为共享工具这次计算的结果。
      return dirname(commonDir).normalize('NFC')
    } catch {
      // 返回 `gitRoot`，作为共享工具这次计算的结果。
      return gitRoot
    }
  },
  // root更新为 `> root`，确保共享工具后续读取最新状态。
  root => root,
  50,
)

/**
 * Find the canonical git repository root, resolving through worktrees.
 *
 * Unlike findGitRoot, which returns the worktree directory (where the `.git`
 * file lives), this returns the main repository's working directory. This
 * ensures all worktrees of the same repo map to the same project identity.
 *
 * Use this instead of findGitRoot for project-scoped state (auto-memory,
 * project config, agent memory) so worktrees share state with the main repo.
 */
// findCanonicalGitRoot构建`createFindCanonicalGitRoot`，供共享工具后续处理使用。
export const findCanonicalGitRoot = createFindCanonicalGitRoot()

// createFindCanonicalGitRoot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createFindCanonicalGitRoot(): {
  (startPath: string): string | null
  cache: typeof resolveCanonicalRoot.cache
} {
  // wrapper 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function wrapper(startPath: string): string | null {
    // root筛选`findGitRoot`，供共享工具后续处理使用。
    const root = findGitRoot(startPath)
    // root缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!root) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回 `resolveCanonicalRoot(root)`，作为共享工具这次计算的结果。
    return resolveCanonicalRoot(root)
  }
  // cache 缓存更新为 `resolveCanonicalRoot.cache`，确保共享工具后续读取最新状态。
  wrapper.cache = resolveCanonicalRoot.cache
  // 返回 `wrapper`，作为共享工具这次计算的结果。
  return wrapper
}

// gitExe保存`memoize`，供共享工具后续处理使用。
export const gitExe = memoize((): string => {
  // Every time we spawn a process, we have to lookup the path.
  // Let's instead avoid that lookup so we only do it once.
  // 返回 `whichSync('git') || 'git'`，作为共享工具这次计算的结果。
  return whichSync('git') || 'git'
})

// getIsGit保存`memoize`，供共享工具后续处理使用。
export const getIsGit = memoize(async (): Promise<boolean> => {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
  logForDiagnosticsNoPII('info', 'is_git_check_started')

  // isGit记录 `findGitRoot` 是否成立，共享工具随后按该结果分支。
  const isGit = findGitRoot(getCwd()) !== null

  // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
  logForDiagnosticsNoPII('info', 'is_git_check_completed', {
    duration_ms: Date.now() - startTime,
    is_git: isGit,
  })
  // 返回 `isGit`，作为共享工具这次计算的结果。
  return isGit
})

// getGitDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGitDir(cwd: string): Promise<string | null> {
  // 返回 `resolveGitDir(cwd)`，作为共享工具这次计算的结果。
  return resolveGitDir(cwd)
}

// isAtGitRoot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isAtGitRoot(): Promise<boolean> {
  // cwd读取`getCwd`，供共享工具后续处理使用。
  const cwd = getCwd()
  // gitRoot筛选`findGitRoot`，供共享工具后续处理使用。
  const gitRoot = findGitRoot(cwd)
  // gitRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitRoot) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Resolve symlinks for accurate comparison
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 并行获取 resolvedCwd、resolvedGitRoot，缩短共享工具 git等待多个独立异步任务的时间。
    const [resolvedCwd, resolvedGitRoot] = await Promise.all([
      realpath(cwd),
      realpath(gitRoot),
    ])
    // 返回 `resolvedCwd === resolvedGitRoot`，作为共享工具这次计算的结果。
    return resolvedCwd === resolvedGitRoot
  } catch {
    // 返回 `cwd === gitRoot`，作为共享工具这次计算的结果。
    return cwd === gitRoot
  }
}

// dirIsInGitRepo保存`async`，供共享工具后续处理使用。
export const dirIsInGitRepo = async (cwd: string): Promise<boolean> => {
  // 返回 `findGitRoot(cwd) !== null`，作为共享工具这次计算的结果。
  return findGitRoot(cwd) !== null
}

// getHead保存`async`，供共享工具后续处理使用。
export const getHead = async (): Promise<string> => {
  // 返回 `getCachedHead()`，作为共享工具这次计算的结果。
  return getCachedHead()
}

// getBranch保存`async`，供共享工具后续处理使用。
export const getBranch = async (): Promise<string> => {
  // 返回 `getCachedBranch()`，作为共享工具这次计算的结果。
  return getCachedBranch()
}

// getDefaultBranch保存`async`，供共享工具后续处理使用。
export const getDefaultBranch = async (): Promise<string> => {
  // 返回 `getCachedDefaultBranch()`，作为共享工具这次计算的结果。
  return getCachedDefaultBranch()
}

// getRemoteUrl保存`async`，供共享工具后续处理使用。
export const getRemoteUrl = async (): Promise<string | null> => {
  // 返回 `getCachedRemoteUrl()`，作为共享工具这次计算的结果。
  return getCachedRemoteUrl()
}

/**
 * Normalizes a git remote URL to a canonical form for hashing.
 * Converts SSH and HTTPS URLs to the same format: host/owner/repo (lowercase, no .git)
 *
 * Examples:
 * - git@github.com:owner/repo.git -> github.com/owner/repo
 * - https://github.com/owner/repo.git -> github.com/owner/repo
 * - ssh://git@github.com/owner/repo -> github.com/owner/repo
 * - http://local_proxy@127.0.0.1:16583/git/owner/repo -> github.com/owner/repo
 */
// normalizeGitRemoteUrl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeGitRemoteUrl(url: string): string | null {
  // trimmed格式化`url.trim`，供共享工具后续处理使用。
  const trimmed = url.trim()
  // trimmed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!trimmed) return null

  // Handle SSH format: git@host:owner/repo.git
  // sshMatch匹配`trimmed.match`，供共享工具后续处理使用。
  const sshMatch = trimmed.match(/^git@([^:]+):(.+?)(?:\.git)?$/)
  // 只有 `sshMatch && sshMatch[1] && sshMatch[2]` 满足时，共享工具才执行该分支。
  if (sshMatch && sshMatch[1] && sshMatch[2]) {
    // 返回 ``${sshMatch[1]}/${sshMatch[2]}`.toLowerCase()`，作为共享工具这次计算的结果。
    return `${sshMatch[1]}/${sshMatch[2]}`.toLowerCase()
  }

  // Handle HTTPS/SSH URL format: https://host/owner/repo.git or ssh://git@host/owner/repo
  // urlMatch匹配`trimmed.match`，供共享工具后续处理使用。
  const urlMatch = trimmed.match(
    /^(?:https?|ssh):\/\/(?:[^@]+@)?([^/]+)\/(.+?)(?:\.git)?$/,
  )
  // 只有 `urlMatch && urlMatch[1] && urlMatch[2]` 满足时，共享工具才执行该分支。
  if (urlMatch && urlMatch[1] && urlMatch[2]) {
    // host保存`urlMatch[1]`，供共享工具 git后续判断或输出使用。
    const host = urlMatch[1]
    // 路径 命名 `urlMatch[2]`，让后续代码直接表达这个值的用途。
    const path = urlMatch[2]

    // CCR git proxy URLs use format:
    //   Legacy:  http://...@127.0.0.1:PORT/git/owner/repo       (github.com assumed)
    //   GHE:     http://...@127.0.0.1:PORT/git/ghe.host/owner/repo (host encoded in path)
    // Strip the /git/ prefix. If the first segment contains a dot, it's a
    // hostname (GitHub org names cannot contain dots). Otherwise assume github.com.
    // 只有 `isLocalHost(host) && path.startsWith('git/')` 满足时，共享工具才执行该分支。
    if (isLocalHost(host) && path.startsWith('git/')) {
      // proxyPath 路径数据格式化`path.slice`，供共享工具后续处理使用。
      const proxyPath = path.slice(4) // Remove "git/" prefix
      // segments 集合格式化`proxyPath.split`，供共享工具后续处理使用。
      const segments = proxyPath.split('/')
      // 3+ segments where first contains a dot → host/owner/repo (GHE format)
      // 只有 `segments.length >= 3 && segments[0]!.includes('.')` 满足时，共享工具才执行该分支。
      if (segments.length >= 3 && segments[0]!.includes('.')) {
        // 返回 `proxyPath.toLowerCase()`，作为共享工具这次计算的结果。
        return proxyPath.toLowerCase()
      }
      // 2 segments → owner/repo (legacy format, assume github.com)
      // 返回 ``github.com/${proxyPath}`.toLowerCase()`，作为共享工具这次计算的结果。
      return `github.com/${proxyPath}`.toLowerCase()
    }

    // 返回 ``${host}/${path}`.toLowerCase()`，作为共享工具这次计算的结果。
    return `${host}/${path}`.toLowerCase()
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Returns a SHA256 hash (first 16 chars) of the normalized git remote URL.
 * This provides a globally unique identifier for the repository that:
 * - Is the same regardless of SSH vs HTTPS clone
 * - Does not expose the actual repository name in logs
 */
// getRepoRemoteHash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getRepoRemoteHash(): Promise<string | null> {
  // remoteUrl读取`getRemoteUrl`，供共享工具后续处理使用。
  const remoteUrl = await getRemoteUrl()
  // remoteUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!remoteUrl) return null

  // normalized保存`normalizeGitRemoteUrl`，供共享工具后续处理使用。
  const normalized = normalizeGitRemoteUrl(remoteUrl)
  // normalized缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!normalized) return null

  // hash构建`createHash`，供共享工具后续处理使用。
  const hash = createHash('sha256').update(normalized).digest('hex')
  // 返回 `hash.substring(0, 16)`，作为共享工具这次计算的结果。
  return hash.substring(0, 16)
}

// getIsHeadOnRemote保存`async`，供共享工具后续处理使用。
export const getIsHeadOnRemote = async (): Promise<boolean> => {
  // 从 `await execFileNoThrow(gitExe(), ['rev-parse', '@{u}'], {` 解构 code，减少共享工具 git对同一对象的重复访问。
  const { code } = await execFileNoThrow(gitExe(), ['rev-parse', '@{u}'], {
    preserveOutputOnError: false,
  })
  // 返回 `code === 0`，作为共享工具这次计算的结果。
  return code === 0
}

// hasUnpushedCommits 集合记录 `async` 是否成立，共享工具随后按该结果分支。
export const hasUnpushedCommits = async (): Promise<boolean> => {
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrow(
    gitExe(),
    ['rev-list', '--count', '@{u}..HEAD'],
    { preserveOutputOnError: false },
  )
  // 返回 `code === 0 && parseInt(stdout.trim(), 10) > 0`，作为共享工具这次计算的结果。
  return code === 0 && parseInt(stdout.trim(), 10) > 0
}

// getIsClean保存`async`，供共享工具后续处理使用。
export const getIsClean = async (options?: {
  ignoreUntracked?: boolean
}): Promise<boolean> => {
  // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
  const args = ['--no-optional-locks', 'status', '--porcelain']
  // 满足 `options?.ignoreUntracked` 时，共享工具执行该分支。
  if (options?.ignoreUntracked) {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('-uno')
  }
  // 从 `await execFileNoThrow(gitExe(), args, {` 解构 stdout，减少共享工具 git对同一对象的重复访问。
  const { stdout } = await execFileNoThrow(gitExe(), args, {
    preserveOutputOnError: false,
  })
  // 返回 `stdout.trim().length === 0`，作为共享工具这次计算的结果。
  return stdout.trim().length === 0
}

// getChangedFiles 文件数据保存`async`，供共享工具后续处理使用。
export const getChangedFiles = async (): Promise<string[]> => {
  // 从 `await execFileNoThrow(` 解构 stdout，减少共享工具 git对同一对象的重复访问。
  const { stdout } = await execFileNoThrow(
    gitExe(),
    ['--no-optional-locks', 'status', '--porcelain'],
    {
      preserveOutputOnError: false,
    },
  )
  // 返回 `stdout`，作为共享工具这次计算的结果。
  return stdout
    .trim()
    .split('\n')
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(line => line.trim().split(' ', 2)[1]?.trim()) // Remove status prefix (e.g., "M ", "A ", "??")
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(line => typeof line === 'string') // Remove empty entries
}

// GitFileStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GitFileStatus = {
  tracked: string[]
  untracked: string[]
}

// getFileStatus 文件数据保存`async`，供共享工具后续处理使用。
export const getFileStatus = async (): Promise<GitFileStatus> => {
  // 从 `await execFileNoThrow(` 解构 stdout，减少共享工具 git对同一对象的重复访问。
  const { stdout } = await execFileNoThrow(
    gitExe(),
    ['--no-optional-locks', 'status', '--porcelain'],
    {
      preserveOutputOnError: false,
    },
  )

  // tracked 从空数组开始收集，后续循环会按处理顺序追加条目。
  const tracked: string[] = []
  // untracked 从空数组开始收集，后续循环会按处理顺序追加条目。
  const untracked: string[] = []

  // 共享工具 git在这里处理 `stdout`，完成这一小步状态转换。
  stdout
    .trim()
    .split('\n')
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(line => line.length > 0)
    // 链式调用 forEach，继续加工上一行在共享工具中产生的数据。
    .forEach(line => {
      // status 集合格式化`line.substring`，供共享工具后续处理使用。
      const status = line.substring(0, 2)
      // 文件名格式化`line.substring`，供共享工具后续处理使用。
      const filename = line.substring(2).trim()

      // 当 `status` 匹配 `'??'` 时，共享工具执行对应分支。
      if (status === '??') {
        // untracked追加新条目，保持收集顺序与输入顺序一致。
        untracked.push(filename)
      // 共享工具 git在这里处理 `} else if (filename) {`，完成这一小步状态转换。
      } else if (filename) {
        // tracked追加新条目，保持收集顺序与输入顺序一致。
        tracked.push(filename)
      }
    })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { tracked, untracked }
}

// getWorktreeCount 数量保存`async`，供共享工具后续处理使用。
export const getWorktreeCount = async (): Promise<number> => {
  // 返回 `getWorktreeCountFromFs()`，作为共享工具这次计算的结果。
  return getWorktreeCountFromFs()
}

/**
 * Stashes all changes (including untracked files) to return git to a clean porcelain state
 * Important: This function stages untracked files before stashing to prevent data loss
 * @param message - Optional custom message for the stash
 * @returns Promise<boolean> - true if stash was successful, false otherwise
 */
// stashToCleanState 状态保存`async`，供共享工具后续处理使用。
export const stashToCleanState = async (message?: string): Promise<boolean> => {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stashMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const stashMessage =
      message || `Claude Code auto-stash - ${new Date().toISOString()}`

    // First, check if we have untracked files
    // 从 `await getFileStatus()` 解构 untracked，减少共享工具 git对同一对象的重复访问。
    const { untracked } = await getFileStatus()

    // If we have untracked files, add them to the index first
    // This prevents them from being deleted
    // 满足 `untracked.length > 0` 时，共享工具执行该分支。
    if (untracked.length > 0) {
      // 从 `await execFileNoThrow(` 解构 code，减少共享工具 git对同一对象的重复访问。
      const { code: addCode } = await execFileNoThrow(
        gitExe(),
        ['add', ...untracked],
        { preserveOutputOnError: false },
      )

      // `addCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (addCode !== 0) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }

    // Now stash everything (staged and unstaged changes)
    // 从 `await execFileNoThrow(` 解构 code，减少共享工具 git对同一对象的重复访问。
    const { code } = await execFileNoThrow(
      gitExe(),
      ['stash', 'push', '--message', stashMessage],
      { preserveOutputOnError: false },
    )
    // 返回 `code === 0`，作为共享工具这次计算的结果。
    return code === 0
  } catch (_) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// GitRepoState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GitRepoState = {
  commitHash: string
  branchName: string
  remoteUrl: string | null
  isHeadOnRemote: boolean
  isClean: boolean
  worktreeCount: number
}

// getGitState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getGitState(): Promise<GitRepoState | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 共享工具 git先整理这一处局部数据，后续分支可以直接读取。
    const [
      commitHash,
      branchName,
      remoteUrl,
      isHeadOnRemote,
      isClean,
      worktreeCount,
    ] = await Promise.all([
      getHead(),
      getBranch(),
      getRemoteUrl(),
      getIsHeadOnRemote(),
      getIsClean(),
      getWorktreeCount(),
    ])

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      commitHash,
      branchName,
      remoteUrl,
      isHeadOnRemote,
      isClean,
      worktreeCount,
    }
  } catch (_) {
    // Fail silently - git state is best effort
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// getGithubRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getGithubRepo(): Promise<string | null> {
  // 从 `await import('./detectRepository.js')` 解构 parseGitRemote，减少共享工具 git对同一对象的重复访问。
  const { parseGitRemote } = await import('./detectRepository.js')
  // remoteUrl读取`getRemoteUrl`，供共享工具后续处理使用。
  const remoteUrl = await getRemoteUrl()
  // remoteUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!remoteUrl) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Local GitHub repo: unknown')
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // Only return results for github.com — callers (e.g. issue submission)
  // assume the result is a github.com repository.
  // 解析结果解析`parseGitRemote`，供共享工具后续处理使用。
  const parsed = parseGitRemote(remoteUrl)
  // 当 `parsed && parsed.host` 匹配 `'github.com'` 时，共享工具执行对应分支。
  if (parsed && parsed.host === 'github.com') {
    // 结果固定为 ``${parsed.owner}/${parsed.name}``，作为共享工具 git后续展示或比较的基准。
    const result = `${parsed.owner}/${parsed.name}`
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Local GitHub repo: ${result}`)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Local GitHub repo: unknown')
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Preserved git state for issue submission.
 * Uses remote base (e.g., origin/main) which is rarely force-pushed,
 * unlike local commits that can be GC'd after force push.
 */
// PreservedGitState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PreservedGitState = {
  /** The SHA of the merge-base with the remote branch */
  remote_base_sha: string | null
  /** The remote branch used (e.g., "origin/main") */
  remote_base: string | null
  /** Patch from merge-base to current state (includes uncommitted changes) */
  patch: string
  /** Untracked files with their contents */
  untracked_files: Array<{ path: string; content: string }>
  /** git format-patch output for committed changes between merge-base and HEAD.
   *  Used to reconstruct the actual commit chain (author, date, message) in
   *  replay containers. null when there are no commits between merge-base and HEAD. */
  format_patch: string | null
  /** The current HEAD SHA (tip of the feature branch) */
  head_sha: string | null
  /** The current branch name (e.g., "feat/my-feature") */
  branch_name: string | null
}

// Size limits for untracked file capture
// MAX_FILE_SIZE_BYTES 文件数据保存`500 * 1024 * 1024 // 500MB per file`，供后续判断或组装使用。
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024 // 500MB per file
// MAX_TOTAL_SIZE_BYTES 集合 命名 `5 * 1024 * 1024 * 1024 // 5GB total`，让后续代码直接表达这个值的用途。
const MAX_TOTAL_SIZE_BYTES = 5 * 1024 * 1024 * 1024 // 5GB total
// MAX_FILE_COUNT 文件数据保存`20000`，供共享工具 git后续判断或输出使用。
const MAX_FILE_COUNT = 20000

// Initial read buffer for binary detection + content reuse. 64KB covers
// most source files in a single read; isBinaryContent() internally scans
// only its first 8KB for the binary heuristic, so the extra bytes are
// purely for avoiding a second read when the file turns out to be text.
// SNIFF_BUFFER_SIZE保存`64 * 1024`，供共享工具 git后续判断或输出使用。
const SNIFF_BUFFER_SIZE = 64 * 1024

/**
 * Find the best remote branch to use as a base.
 * Priority: tracking branch > origin/main > origin/staging > origin/master
 */
// findRemoteBase 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findRemoteBase(): Promise<string | null> {
  // First try: get the tracking branch for the current branch
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git对同一对象的重复访问。
  const { stdout: trackingBranch, code: trackingCode } = await execFileNoThrow(
    gitExe(),
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
    { preserveOutputOnError: false },
  )

  // 只有 `trackingCode === 0 && trackingBranch.trim()` 满足时，共享工具才执行该分支。
  if (trackingCode === 0 && trackingBranch.trim()) {
    // 返回 `trackingBranch.trim()`，作为共享工具这次计算的结果。
    return trackingBranch.trim()
  }

  // Second try: check for common default branch names on origin
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git对同一对象的重复访问。
  const { stdout: remoteRefs, code: remoteCode } = await execFileNoThrow(
    gitExe(),
    ['remote', 'show', 'origin', '--', 'HEAD'],
    { preserveOutputOnError: false },
  )

  // 满足 `remoteCode === 0` 时，共享工具执行该分支。
  if (remoteCode === 0) {
    // Parse the default branch from remote show output
    // match匹配`remoteRefs.match`，供共享工具后续处理使用。
    const match = remoteRefs.match(/HEAD branch: (\S+)/)
    // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
    if (match && match[1]) {
      // 返回 ``origin/${match[1]}``，作为共享工具这次计算的结果。
      return `origin/${match[1]}`
    }
  }

  // Third try: check which common branches exist
  // candidates 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const candidates = ['origin/main', 'origin/staging', 'origin/master']
  // 按顺序遍历 `candidates` 中的candidate，逐个交给共享工具处理。
  for (const candidate of candidates) {
    // 从 `await execFileNoThrow(` 解构 code，减少共享工具 git对同一对象的重复访问。
    const { code } = await execFileNoThrow(
      gitExe(),
      ['rev-parse', '--verify', candidate],
      { preserveOutputOnError: false },
    )
    // 满足 `code === 0` 时，共享工具执行该分支。
    if (code === 0) {
      // 返回 `candidate`，作为共享工具这次计算的结果。
      return candidate
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Check if we're in a shallow clone by looking for <gitDir>/shallow.
 */
// isShallowClone 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isShallowClone(): Promise<boolean> {
  // 返回 `isShallowCloneFs()`，作为共享工具这次计算的结果。
  return isShallowCloneFs()
}

/**
 * Capture untracked files (git diff doesn't include them).
 * Respects size limits and skips binary files.
 */
// captureUntrackedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function captureUntrackedFiles(): Promise<
  Array<{ path: string; content: string }>
> {
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrow(
    gitExe(),
    ['ls-files', '--others', '--exclude-standard'],
    { preserveOutputOnError: false },
  )

  // trimmed格式化`stdout.trim`，供共享工具后续处理使用。
  const trimmed = stdout.trim()
  // `code` 与 `0 || !trimmed` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0 || !trimmed) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // files 文件数据格式化`trimmed.split`，供共享工具后续处理使用。
  const files = trimmed.split('\n').filter(Boolean)
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: Array<{ path: string; content: string }> = []
  // totalSize保存`0`，供后续判断或组装使用。
  let totalSize = 0

  // 按顺序遍历 `files` 中的文件路径，逐个交给共享工具处理。
  for (const filePath of files) {
    // Check file count limit
    // 满足 `result.length >= MAX_FILE_COUNT` 时，共享工具执行该分支。
    if (result.length >= MAX_FILE_COUNT) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Untracked file capture: reached max file count (${MAX_FILE_COUNT})`,
      )
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    // Skip binary files by extension - zero I/O
    // 满足 `hasBinaryExtension(filePath)` 时，共享工具执行该分支。
    if (hasBinaryExtension(filePath)) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合保存`stat`，供共享工具后续处理使用。
      const stats = await stat(filePath)
      // fileSize 文件数据统计`stats.size`，供后续判断或组装使用。
      const fileSize = stats.size

      // Skip files exceeding per-file limit
      // 满足 `fileSize > MAX_FILE_SIZE_BYTES` 时，共享工具执行该分支。
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Untracked file capture: skipping ${filePath} (exceeds ${MAX_FILE_SIZE_BYTES} bytes)`,
        )
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Check total size limit
      // 满足 `totalSize + fileSize > MAX_TOTAL_SIZE_BYTES` 时，共享工具执行该分支。
      if (totalSize + fileSize > MAX_TOTAL_SIZE_BYTES) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Untracked file capture: reached total size limit (${MAX_TOTAL_SIZE_BYTES} bytes)`,
        )
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      // Empty file - no need to open
      // 满足 `fileSize === 0` 时，共享工具执行该分支。
      if (fileSize === 0) {
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({ path: filePath, content: '' })
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Binary sniff on up to SNIFF_BUFFER_SIZE bytes. Caps binary-file reads
      // at SNIFF_BUFFER_SIZE even though MAX_FILE_SIZE_BYTES allows up to 500MB.
      // If the file fits in the sniff buffer we reuse it as the content; for
      // larger text files we fall back to readFile with encoding so the runtime
      // decodes to a string without materializing a full-size Buffer in JS.
      // sniffSize保存`Math.min`，供共享工具后续处理使用。
      const sniffSize = Math.min(SNIFF_BUFFER_SIZE, fileSize)
      // fd保存`open`，供共享工具后续处理使用。
      const fd = await open(filePath, 'r')
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // sniffBuf保存`Buffer.alloc`，供共享工具后续处理使用。
        const sniffBuf = Buffer.alloc(sniffSize)
        // 从 `await fd.read(sniffBuf, 0, sniffSize, 0)` 解构 bytesRead，减少共享工具 git对同一对象的重复访问。
        const { bytesRead } = await fd.read(sniffBuf, 0, sniffSize, 0)
        // sniff保存`sniffBuf.subarray`，供共享工具后续处理使用。
        const sniff = sniffBuf.subarray(0, bytesRead)

        // 满足 `isBinaryContent(sniff)` 时，共享工具执行该分支。
        if (isBinaryContent(sniff)) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }

        // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
        let content: string
        // 满足 `fileSize <= sniffSize` 时，共享工具执行该分支。
        if (fileSize <= sniffSize) {
          // Sniff already covers the whole file
          // 文本内容更新为 `sniff.toString('utf-8')`，确保共享工具后续读取最新状态。
          content = sniff.toString('utf-8')
        } else {
          // readFile with encoding decodes to string directly, avoiding a
          // full-size Buffer living alongside the decoded string. The extra
          // open/close is cheaper than doubling peak memory for large files.
          // 文本内容更新为 `await readFile(filePath, 'utf-8')`，确保共享工具后续读取最新状态。
          content = await readFile(filePath, 'utf-8')
        }

        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push({ path: filePath, content })
        // 共享工具 git在这里处理 `totalSize += fileSize`，完成这一小步状态转换。
        totalSize += fileSize
      } finally {
        // 等待 `fd.close()` 完成，再继续共享工具 git的异步流程。
        await fd.close()
      }
    } catch (err) {
      // Skip files we can't read
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to read untracked file ${filePath}: ${err}`)
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Preserve git state for issue submission.
 * Uses remote base for more stable replay capability.
 *
 * Edge cases handled:
 * - Detached HEAD: falls back to merge-base with default branch directly
 * - No remote: returns null for remote fields, uses HEAD-only mode
 * - Shallow clone: falls back to HEAD-only mode
 */
// preserveGitStateForIssue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function preserveGitStateForIssue(): Promise<PreservedGitState | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // isGit记录 `getIsGit` 是否成立，共享工具随后按该结果分支。
    const isGit = await getIsGit()
    // isGit缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!isGit) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Check for shallow clone - fall back to simpler mode
    // 满足 `await isShallowClone()` 时，共享工具执行该分支。
    if (await isShallowClone()) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Shallow clone detected, using HEAD-only mode for issue')
      // 并行获取 { stdout、untrackedFiles，缩短共享工具 git等待多个独立异步任务的时间。
      const [{ stdout: patch }, untrackedFiles] = await Promise.all([
        execFileNoThrow(gitExe(), ['diff', 'HEAD']),
        captureUntrackedFiles(),
      ])
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        remote_base_sha: null,
        remote_base: null,
        patch: patch || '',
        untracked_files: untrackedFiles,
        format_patch: null,
        head_sha: null,
        branch_name: null,
      }
    }

    // Find the best remote base
    // remoteBase筛选`findRemoteBase`，供共享工具后续处理使用。
    const remoteBase = await findRemoteBase()

    // remoteBase缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!remoteBase) {
      // No remote found - use HEAD-only mode
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('No remote found, using HEAD-only mode for issue')
      // 并行获取 { stdout、untrackedFiles，缩短共享工具 git等待多个独立异步任务的时间。
      const [{ stdout: patch }, untrackedFiles] = await Promise.all([
        execFileNoThrow(gitExe(), ['diff', 'HEAD']),
        captureUntrackedFiles(),
      ])
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        remote_base_sha: null,
        remote_base: null,
        patch: patch || '',
        untracked_files: untrackedFiles,
        format_patch: null,
        head_sha: null,
        branch_name: null,
      }
    }

    // Get the merge-base with remote
    // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 git对同一对象的重复访问。
    const { stdout: mergeBase, code: mergeBaseCode } = await execFileNoThrow(
      gitExe(),
      ['merge-base', 'HEAD', remoteBase],
      { preserveOutputOnError: false },
    )

    // `mergeBaseCode` 与 `0 || !mergeBase.trim()` 不一致时刷新派生状态，避免使用过期结果。
    if (mergeBaseCode !== 0 || !mergeBase.trim()) {
      // Merge-base failed - fall back to HEAD-only
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Merge-base failed, using HEAD-only mode for issue')
      // 并行获取 { stdout、untrackedFiles，缩短共享工具 git等待多个独立异步任务的时间。
      const [{ stdout: patch }, untrackedFiles] = await Promise.all([
        execFileNoThrow(gitExe(), ['diff', 'HEAD']),
        captureUntrackedFiles(),
      ])
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        remote_base_sha: null,
        remote_base: null,
        patch: patch || '',
        untracked_files: untrackedFiles,
        format_patch: null,
        head_sha: null,
        branch_name: null,
      }
    }

    // remoteBaseSha格式化`mergeBase.trim`，供共享工具后续处理使用。
    const remoteBaseSha = mergeBase.trim()

    // All 5 commands below depend only on remoteBaseSha — run them in parallel.
    // ~5×90ms serial → ~90ms parallel on Bun native (used by /issue and /share).
    // 共享工具 git先整理这一处局部数据，后续分支可以直接读取。
    const [
      { stdout: patch },
      untrackedFiles,
      { stdout: formatPatchOut, code: formatPatchCode },
      { stdout: headSha },
      { stdout: branchName },
    ] = await Promise.all([
      // Patch from merge-base to current state (including staged changes)
      execFileNoThrow(gitExe(), ['diff', remoteBaseSha]),
      // Untracked files captured separately
      captureUntrackedFiles(),
      // format-patch for committed changes between merge-base and HEAD.
      // Preserves the actual commit chain (author, date, message) so replay
      // containers can reconstruct the branch with real commits instead of a
      // squashed diff. Uses --stdout to emit all patches as a single text stream.
      execFileNoThrow(gitExe(), [
        'format-patch',
        `${remoteBaseSha}..HEAD`,
        '--stdout',
      ]),
      // HEAD SHA for replay
      execFileNoThrow(gitExe(), ['rev-parse', 'HEAD']),
      // Branch name for replay
      execFileNoThrow(gitExe(), ['rev-parse', '--abbrev-ref', 'HEAD']),
    ])

    // formatPatch 命名 `null`，让后续代码直接表达这个值的用途。
    let formatPatch: string | null = null
    // 只有 `formatPatchCode === 0 && formatPatchOut && formatPatchOut.trim()` 满足时，共享工具才执行该分支。
    if (formatPatchCode === 0 && formatPatchOut && formatPatchOut.trim()) {
      // formatPatch更新为 `formatPatchOut`，确保共享工具后续读取最新状态。
      formatPatch = formatPatchOut
    }

    // trimmedBranch格式化`trim`，供共享工具后续处理使用。
    const trimmedBranch = branchName?.trim()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      remote_base_sha: remoteBaseSha,
      remote_base: remoteBase,
      patch: patch || '',
      untracked_files: untrackedFiles,
      format_patch: formatPatch,
      head_sha: headSha?.trim() || null,
      branch_name:
        trimmedBranch && trimmedBranch !== 'HEAD' ? trimmedBranch : null,
    }
  } catch (err) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// isLocalHost 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLocalHost(host: string): boolean {
  // hostWithoutPort格式化`host.split`，供共享工具后续处理使用。
  const hostWithoutPort = host.split(':')[0] ?? ''
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    hostWithoutPort === 'localhost' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostWithoutPort)
  )
}

/**
 * Checks if the current working directory appears to be a bare git repository
 * or has been manipulated to look like one (sandbox escape attack vector).
 *
 * SECURITY: Git's is_git_directory() function (setup.c:417-455) checks for:
 * 1. HEAD file - Must be a valid ref
 * 2. objects/ directory - Must exist and be accessible
 * 3. refs/ directory - Must exist and be accessible
 *
 * If all three exist in the current directory (not in a .git subdirectory),
 * Git treats the current directory as a bare repository and will execute
 * hooks/pre-commit and other hook scripts from the cwd.
 *
 * Attack scenario:
 * 1. Attacker creates HEAD, objects/, refs/, and hooks/pre-commit in cwd
 * 2. Attacker deletes or corrupts .git/HEAD to invalidate the normal git directory
 * 3. When user runs 'git status', Git treats cwd as the git dir and runs the hook
 *
 * @returns true if the cwd looks like a bare/exploited git directory
 */
/* eslint-disable custom-rules/no-sync-fs -- sync permission-eval check */
// isCurrentDirectoryBareGitRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCurrentDirectoryBareGitRepo(): boolean {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // cwd读取`getCwd`，供共享工具后续处理使用。
  const cwd = getCwd()

  // gitPath 路径数据格式化`join`，供共享工具后续处理使用。
  const gitPath = join(cwd, '.git')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`fs.statSync`，供共享工具后续处理使用。
    const stats = fs.statSync(gitPath)
    // 满足 `stats.isFile()` 时，共享工具执行该分支。
    if (stats.isFile()) {
      // worktree/submodule — Git follows the gitdir reference
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
    if (stats.isDirectory()) {
      // gitHeadPath 路径数据格式化`join`，供共享工具后续处理使用。
      const gitHeadPath = join(gitPath, 'HEAD')
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // SECURITY: check isFile(). An attacker creating .git/HEAD as a
        // DIRECTORY would pass a bare statSync but Git's setup_git_directory
        // rejects it (not a valid HEAD) and falls back to cwd discovery.
        // 满足 `fs.statSync(gitHeadPath).isFile()` 时，共享工具执行该分支。
        if (fs.statSync(gitHeadPath).isFile()) {
          // normal repo — .git/HEAD valid, Git won't fall back to cwd
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
        // .git/HEAD exists but is not a regular file — fall through
      } catch {
        // .git exists but no HEAD — fall through to bare-repo check
      }
    }
  } catch {
    // no .git — fall through to bare-repo indicator check
  }

  // No valid .git/HEAD found. Check if cwd has bare git repo indicators.
  // Be cautious — flag if ANY of these exist without a valid .git reference.
  // Per-indicator try/catch so an error on one doesn't mask another.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `fs.statSync(join(cwd, 'HEAD')).isFile()` 时，共享工具执行该分支。
    if (fs.statSync(join(cwd, 'HEAD')).isFile()) return true
  } catch {
    // no HEAD
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `fs.statSync(join(cwd, 'objects')).isDirectory()` 时，共享工具执行该分支。
    if (fs.statSync(join(cwd, 'objects')).isDirectory()) return true
  } catch {
    // no objects/
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `fs.statSync(join(cwd, 'refs')).isDirectory()` 时，共享工具执行该分支。
    if (fs.statSync(join(cwd, 'refs')).isDirectory()) return true
  } catch {
    // no refs/
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
/* eslint-enable custom-rules/no-sync-fs */
