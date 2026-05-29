// 引入 whichSync，将 ./which.js 中已经封装好的能力接到本文件流程里。
import { whichSync } from './which.js'

/**
 * Find an executable by searching PATH, similar to `which`.
 * Replaces spawn-rx's findActualExecutable to avoid pulling in rxjs (~313 KB).
 *
 * Returns { cmd, args } to match the spawn-rx API shape.
 * `cmd` is the resolved path if found, or the original name if not.
 * `args` is always the pass-through of the input args.
 */
// findExecutable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findExecutable(
  exe: string,
  args: string[],
): { cmd: string; args: string[] } {
  // resolved保存`whichSync`，供共享工具后续处理使用。
  const resolved = whichSync(exe)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { cmd: resolved ?? exe, args }
}
