/**
 * UI utilities for sandbox violations
 * These utilities are used for displaying sandbox-related information in the UI
 */

/**
 * Remove <sandbox_violations> tags from text
 * Used to clean up error messages for display purposes
 */
// removeSandboxViolationTags 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeSandboxViolationTags(text: string): string {
  // 返回 `text.replace(/<sandbox_violations>[\s\S]*?<\/sandbox_violations>/g, '')`，作为共享工具这次计算的结果。
  return text.replace(/<sandbox_violations>[\s\S]*?<\/sandbox_violations>/g, '')
}
