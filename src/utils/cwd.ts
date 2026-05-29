// 引入 AsyncLocalStorage，将 async_hooks 中已经封装好的能力接到本文件流程里。
import { AsyncLocalStorage } from 'async_hooks'
// 引入 getCwdState、getOriginalCwd，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getCwdState, getOriginalCwd } from '../bootstrap/state.js'

// cwdOverrideStorage构建`new AsyncLocalStorage<string>()`，供后续判断或组装使用。
const cwdOverrideStorage = new AsyncLocalStorage<string>()

/**
 * Run a function with an overridden working directory for the current async context.
 * All calls to pwd()/getCwd() within the function (and its async descendants) will
 * return the overridden cwd instead of the global one. This enables concurrent
 * agents to each see their own working directory without affecting each other.
 */
// runWithCwdOverride 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function runWithCwdOverride<T>(cwd: string, fn: () => T): T {
  // 返回 `cwdOverrideStorage.run(cwd, fn)`，作为共享工具这次计算的结果。
  return cwdOverrideStorage.run(cwd, fn)
}

/**
 * Get the current working directory
 */
// pwd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pwd(): string {
  // 返回 `cwdOverrideStorage.getStore() ?? getCwdState()`，作为共享工具这次计算的结果。
  return cwdOverrideStorage.getStore() ?? getCwdState()
}

/**
 * Get the current working directory or the original working directory if the current one is not available
 */
// getCwd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCwd(): string {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `pwd()`，作为共享工具这次计算的结果。
    return pwd()
  } catch {
    // 返回 `getOriginalCwd()`，作为共享工具这次计算的结果。
    return getOriginalCwd()
  }
}
