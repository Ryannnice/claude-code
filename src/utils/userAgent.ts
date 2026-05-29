/**
 * User-Agent string helpers.
 *
 * Kept dependency-free so SDK-bundled code (bridge, cli/transports) can
 * import without pulling in auth.ts and its transitive dependency tree.
 */

// getClaudeCodeUserAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeCodeUserAgent(): string {
  // 返回 ``claude-code/${MACRO.VERSION}``，作为共享工具这次计算的结果。
  return `claude-code/${MACRO.VERSION}`
}
