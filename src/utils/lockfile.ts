/**
 * Lazy accessor for proper-lockfile.
 *
 * proper-lockfile depends on graceful-fs, which monkey-patches every fs
 * method on first require (~8ms). Static imports of proper-lockfile pull this
 * cost into the startup path even when no locking happens (e.g. `--help`).
 *
 * Import this module instead of `proper-lockfile` directly. The underlying
 * package is only loaded the first time a lock function is actually called.
 */

// 类型依赖 { CheckOptions, LockOptions, UnlockOptions } 来自 proper-lockfile，用于校准共享工具的数据契约。
import type { CheckOptions, LockOptions, UnlockOptions } from 'proper-lockfile'

// Lockfile 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Lockfile = typeof import('proper-lockfile')

// _lockfile 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
let _lockfile: Lockfile | undefined

// getLockfile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLockfile(): Lockfile {
  // _lockfile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!_lockfile) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // _lockfile 文件数据更新为 `require('proper-lockfile') as Lockfile`，确保共享工具后续读取最新状态。
    _lockfile = require('proper-lockfile') as Lockfile
  }
  // 返回 `_lockfile`，作为共享工具这次计算的结果。
  return _lockfile
}

// lock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function lock(
  file: string,
  options?: LockOptions,
): Promise<() => Promise<void>> {
  // 返回 `getLockfile().lock(file, options)`，作为共享工具这次计算的结果。
  return getLockfile().lock(file, options)
}

// lockSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function lockSync(file: string, options?: LockOptions): () => void {
  // 返回 `getLockfile().lockSync(file, options)`，作为共享工具这次计算的结果。
  return getLockfile().lockSync(file, options)
}

// unlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unlock(file: string, options?: UnlockOptions): Promise<void> {
  // 返回 `getLockfile().unlock(file, options)`，作为共享工具这次计算的结果。
  return getLockfile().unlock(file, options)
}

// check 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function check(file: string, options?: CheckOptions): Promise<boolean> {
  // 返回 `getLockfile().check(file, options)`，作为共享工具这次计算的结果。
  return getLockfile().check(file, options)
}
