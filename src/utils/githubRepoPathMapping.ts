// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { realpath } from 'fs/promises'
// 引入 getOriginalCwd，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../bootstrap/state.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  detectCurrentRepository,
  parseGitHubRepository,
} from './detectRepository.js'
// 引入 pathExists，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { pathExists } from './file.js'
// 引入 getRemoteUrlForDir，将 ./git/gitFilesystem.js 中已经封装好的能力接到本文件流程里。
import { getRemoteUrlForDir } from './git/gitFilesystem.js'
// 引入 findGitRoot，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { findGitRoot } from './git.js'

/**
 * Updates the GitHub repository path mapping in global config.
 * Called at startup (fire-and-forget) to track known local paths for repos.
 * This is non-blocking and errors are logged silently.
 *
 * Stores the git root (not cwd) so the mapping always points to the
 * repository root regardless of which subdirectory the user launched from.
 * If the path is already tracked, it is promoted to the front of the list
 * so the most recently used clone appears first.
 */
// updateGithubRepoPathMapping 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateGithubRepoPathMapping(): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 当前仓库读取`detectCurrentRepository`，供共享工具后续处理使用。
    const repo = await detectCurrentRepository()
    // repo缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!repo) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Not in a GitHub repository, skipping path mapping update',
      )
      // 共享工具 github Repo Path Mapping在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Use the git root as the canonical path for this repo clone.
    // This ensures we always store the repo root, not an arbitrary subdirectory.
    // cwd读取`getOriginalCwd`，供共享工具后续处理使用。
    const cwd = getOriginalCwd()
    // gitRoot筛选`findGitRoot`，供共享工具后续处理使用。
    const gitRoot = findGitRoot(cwd)
    // basePath 路径数据 命名 `gitRoot ?? cwd`，让后续代码直接表达这个值的用途。
    const basePath = gitRoot ?? cwd

    // Resolve symlinks for canonical storage
    // currentPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let currentPath: string
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // currentPath 路径数据更新为 `(await realpath(basePath)).normalize('NFC')`，确保共享工具后续读取最新状态。
      currentPath = (await realpath(basePath)).normalize('NFC')
    } catch {
      // currentPath 路径数据更新为 `basePath`，确保共享工具后续读取最新状态。
      currentPath = basePath
    }

    // Normalize repo key to lowercase for case-insensitive matching
    // repoKey保存`repo.toLowerCase`，供共享工具后续处理使用。
    const repoKey = repo.toLowerCase()

    // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
    const config = getGlobalConfig()
    // existingPaths 路径数据读取 `config.githubRepoPaths?.[repoKey] ?? []` 对应条目，后续围绕该成员继续处理。
    const existingPaths = config.githubRepoPaths?.[repoKey] ?? []

    // 满足 `existingPaths[0] === currentPath` 时，共享工具执行该分支。
    if (existingPaths[0] === currentPath) {
      // Already at the front — nothing to do
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Path ${currentPath} already tracked for repo ${repoKey}`)
      // 共享工具 github Repo Path Mapping在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Remove if present elsewhere (to promote to front), then prepend
    // withoutCurrent筛选`existingPaths.filter`，供共享工具后续处理使用。
    const withoutCurrent = existingPaths.filter(p => p !== currentPath)
    // updatedPaths 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
    const updatedPaths = [currentPath, ...withoutCurrent]

    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      githubRepoPaths: {
        ...current.githubRepoPaths,
        [repoKey]: updatedPaths,
      },
    }))

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Added ${currentPath} to tracked paths for repo ${repoKey}`)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error updating repo path mapping: ${error}`)
    // Silently fail - this is non-blocking startup work
  }
}

/**
 * Gets known local paths for a given GitHub repository.
 * @param repo The repository in "owner/repo" format
 * @returns Array of known absolute paths, or empty array if none
 */
// getKnownPathsForRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getKnownPathsForRepo(repo: string): string[] {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // repoKey保存`repo.toLowerCase`，供共享工具后续处理使用。
  const repoKey = repo.toLowerCase()
  // 返回 `config.githubRepoPaths?.[repoKey] ?? []`，作为共享工具这次计算的结果。
  return config.githubRepoPaths?.[repoKey] ?? []
}

/**
 * Filters paths to only those that exist on the filesystem.
 * @param paths Array of absolute paths to check
 * @returns Array of paths that exist
 */
// filterExistingPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function filterExistingPaths(paths: string[]): Promise<string[]> {
  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(paths.map(pathExists))
  // 返回 `paths.filter((_, i) => results[i])`，作为共享工具这次计算的结果。
  return paths.filter((_, i) => results[i])
}

/**
 * Validates that a path contains the expected GitHub repository.
 * @param path Absolute path to check
 * @param expectedRepo Expected repository in "owner/repo" format
 * @returns true if the path contains the expected repo, false otherwise
 */
// validateRepoAtPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateRepoAtPath(
  path: string,
  expectedRepo: string,
): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // remoteUrl读取`getRemoteUrlForDir`，供共享工具后续处理使用。
    const remoteUrl = await getRemoteUrlForDir(path)
    // remoteUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!remoteUrl) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // actualRepo解析`parseGitHubRepository`，供共享工具后续处理使用。
    const actualRepo = parseGitHubRepository(remoteUrl)
    // actualRepo缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!actualRepo) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Case-insensitive comparison
    // 返回 `actualRepo.toLowerCase() === expectedRepo.toLowerCase()`，作为共享工具这次计算的结果。
    return actualRepo.toLowerCase() === expectedRepo.toLowerCase()
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Removes a path from the tracked paths for a given repository.
 * Used when a path is found to be invalid during selection.
 * @param repo The repository in "owner/repo" format
 * @param pathToRemove The path to remove from tracking
 */
// removePathFromRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removePathFromRepo(repo: string, pathToRemove: string): void {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // repoKey保存`repo.toLowerCase`，供共享工具后续处理使用。
  const repoKey = repo.toLowerCase()
  // existingPaths 路径数据读取 `config.githubRepoPaths?.[repoKey] ?? []` 对应条目，后续围绕该成员继续处理。
  const existingPaths = config.githubRepoPaths?.[repoKey] ?? []

  // updatedPaths 路径数据筛选`existingPaths.filter`，供共享工具后续处理使用。
  const updatedPaths = existingPaths.filter(path => path !== pathToRemove)

  // 满足 `updatedPaths.length === existingPaths.length` 时，共享工具执行该分支。
  if (updatedPaths.length === existingPaths.length) {
    // Path wasn't in the list, nothing to do
    // 共享工具 github Repo Path Mapping在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // updatedMapping集中保存共享工具 github Repo Path Mapping要一起传递的字段。
  const updatedMapping = { ...config.githubRepoPaths }

  // updatedPaths 路径数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (updatedPaths.length === 0) {
    // Remove the repo key entirely if no paths remain
    // 共享工具 github Repo Path Mapping在这里处理 `delete updatedMapping[repoKey]`，完成这一小步状态转换。
    delete updatedMapping[repoKey]
  } else {
    // updatedMapping[repoKey更新为 `updatedPaths`，确保共享工具 github Repo Path Mapping后续读取最新状态。
    updatedMapping[repoKey] = updatedPaths
  }

  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    githubRepoPaths: updatedMapping,
  }))

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Removed ${pathToRemove} from tracked paths for repo ${repoKey}`,
  )
}
