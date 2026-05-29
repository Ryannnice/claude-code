// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { sep } from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 引入 execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 gitExe，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { gitExe } from './git.js'

/**
 * Returns the paths of all worktrees for the current git repository.
 * If git is not available, not in a git repo, or only has one worktree,
 * returns an empty array.
 *
 * This version includes analytics tracking and uses the CLI's gitExe()
 * resolver. For a portable version without CLI deps, use
 * getWorktreePathsPortable().
 *
 * @param cwd Directory to run the command from
 * @returns Array of absolute worktree paths
 */
// getWorktreePaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getWorktreePaths(cwd: string): Promise<string[]> {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()

  // 从 `await execFileNoThrowWithCwd(` 解构 stdout、code，减少共享工具 get Worktree Paths对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrowWithCwd(
    gitExe(),
    ['worktree', 'list', '--porcelain'],
    {
      cwd,
      preserveOutputOnError: false,
    },
  )

  // durationMs 集合记录时间`Date.now`，供共享工具后续处理使用。
  const durationMs = Date.now() - startTime

  // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_worktree_detection', {
      duration_ms: durationMs,
      worktree_count: 0,
      success: false,
    })
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Parse porcelain output - lines starting with "worktree " contain paths
  // Example:
  // worktree /Users/foo/repo
  // HEAD abc123
  // branch refs/heads/main
  //
  // worktree /Users/foo/repo-wt1
  // HEAD def456
  // branch refs/heads/feature
  // worktreePaths 路径数据 命名 `stdout`，让后续代码直接表达这个值的用途。
  const worktreePaths = stdout
    .split('\n')
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(line => line.startsWith('worktree '))
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(line => line.slice('worktree '.length).normalize('NFC'))

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_worktree_detection', {
    duration_ms: durationMs,
    worktree_count: worktreePaths.length,
    success: true,
  })

  // Sort worktrees: current worktree first, then alphabetically
  // currentWorktree筛选`worktreePaths.find`，供共享工具后续处理使用。
  const currentWorktree = worktreePaths.find(
    // 路径更新为 `> cwd === path || cwd.startsWith(path + sep)`，确保共享工具后续读取最新状态。
    path => cwd === path || cwd.startsWith(path + sep),
  )
  // otherWorktrees 集合保存`worktreePaths`，供后续判断或组装使用。
  const otherWorktrees = worktreePaths
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(path => path !== currentWorktree)
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => a.localeCompare(b))

  // 返回 `currentWorktree ? [currentWorktree, ...otherWorktrees] : otherWorktrees`，作为共享工具这次计算的结果。
  return currentWorktree ? [currentWorktree, ...otherWorktrees] : otherWorktrees
}
