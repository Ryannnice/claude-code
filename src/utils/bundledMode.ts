/**
 * Detects if the current runtime is Bun.
 * Returns true when:
 * - Running a JS file via the `bun` command
 * - Running a Bun-compiled standalone executable
 */
// isRunningWithBun 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRunningWithBun(): boolean {
  // https://bun.com/guides/util/detect-bun
  // 返回 `process.versions.bun !== undefined`，作为共享工具这次计算的结果。
  return process.versions.bun !== undefined
}

/**
 * Detects if running as a Bun-compiled standalone executable.
 * This checks for embedded files which are present in compiled binaries.
 */
// isInBundledMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInBundledMode(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof Bun !== 'undefined' &&
    Array.isArray(Bun.embeddedFiles) &&
    Bun.embeddedFiles.length > 0
  )
}
