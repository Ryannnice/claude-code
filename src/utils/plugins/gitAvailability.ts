/**
 * Utility for checking git availability.
 *
 * Git is required for installing GitHub-based marketplaces. This module
 * provides a memoized check to determine if git is available on the system.
 */

// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 which，将 ../which.js 中已经封装好的能力接到本文件流程里。
import { which } from '../which.js'

/**
 * Check if a command is available in PATH.
 *
 * Uses which to find the actual executable without executing it.
 * This is a security best practice to avoid executing arbitrary code
 * in untrusted directories.
 *
 * @param command - The command to check for
 * @returns True if the command exists and is executable
 */
// isCommandAvailable 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isCommandAvailable(command: string): Promise<boolean> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `!!(await which(command))`，作为插件管理这次计算的结果。
    return !!(await which(command))
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Check if git is available on the system.
 *
 * This is memoized so repeated calls within a session return the cached result.
 * Git availability is unlikely to change during a single CLI session.
 *
 * Only checks PATH — does not exec git. On macOS this means the /usr/bin/git
 * xcrun shim passes even without Xcode CLT installed; callers that hit
 * `xcrun: error:` at exec time should call markGitUnavailable() so the rest
 * of the session behaves as though git is absent.
 *
 * @returns True if git is installed and executable
 */
// checkGitAvailable保存`memoize`，供插件管理后续处理使用。
export const checkGitAvailable = memoize(async (): Promise<boolean> => {
  // 返回 `isCommandAvailable('git')`，作为插件管理这次计算的结果。
  return isCommandAvailable('git')
})

/**
 * Force the memoized git-availability check to return false for the rest of
 * the session.
 *
 * Call this when a git invocation fails in a way that indicates the binary
 * exists on PATH but cannot actually run — the macOS xcrun shim being the
 * main case (`xcrun: error: invalid active developer path`). Subsequent
 * checkGitAvailable() calls then short-circuit to false, so downstream code
 * that guards on git availability skips cleanly instead of failing repeatedly
 * with the same exec error.
 *
 * lodash memoize uses a no-arg cache key of undefined.
 */
// markGitUnavailable 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markGitUnavailable(): void {
  // 调用 checkGitAvailable.cache?.set?.(undefined, Promise.resolve(false))，完成这一处局部操作。
  checkGitAvailable.cache?.set?.(undefined, Promise.resolve(false))
}

/**
 * Clear the git availability cache.
 * Used for testing purposes.
 */
// clearGitAvailabilityCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearGitAvailabilityCache(): void {
  // 调用 checkGitAvailable.cache?.clear?.()，完成这一处局部操作。
  checkGitAvailable.cache?.clear?.()
}
