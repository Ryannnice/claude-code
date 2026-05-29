// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFile as execFileCb } from 'child_process'
// 引入 promisify，将 util 中已经封装好的能力接到本文件流程里。
import { promisify } from 'util'

// execFileAsync 文件数据保存`promisify`，供共享工具后续处理使用。
const execFileAsync = promisify(execFileCb)

/**
 * Portable worktree detection using only child_process — no analytics,
 * no bootstrap deps, no execa. Used by listSessionsImpl.ts (SDK) and
 * anywhere that needs worktree paths without pulling in the CLI
 * dependency chain (execa → cross-spawn → which).
 */
// getWorktreePathsPortable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getWorktreePathsPortable(cwd: string): Promise<string[]> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await execFileAsync(` 解构 stdout，减少共享工具 get Worktree Paths Portable对同一对象的重复访问。
    const { stdout } = await execFileAsync(
      'git',
      ['worktree', 'list', '--porcelain'],
      { cwd, timeout: 5000 },
    )
    // stdout缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!stdout) return []
    // 返回 `stdout`，作为共享工具这次计算的结果。
    return stdout
      .split('\n')
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(line => line.startsWith('worktree '))
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(line => line.slice('worktree '.length).normalize('NFC'))
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}
