// 引入 findGitRoot，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { findGitRoot } from '../git.js'

// Note: This is used to check git repo status synchronously
// Uses findGitRoot which walks the filesystem (no subprocess)
// Prefer `dirIsInGitRepo()` for async checks
// projectIsInGitRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function projectIsInGitRepo(cwd: string): boolean {
  // 返回 `findGitRoot(cwd) !== null`，作为共享工具这次计算的结果。
  return findGitRoot(cwd) !== null
}
