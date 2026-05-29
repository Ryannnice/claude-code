/**
 * Escape XML/HTML special characters for safe interpolation into element
 * text content (between tags). Use when untrusted strings (process stdout,
 * user input, external data) go inside `<tag>${here}</tag>`.
 */
// escapeXml 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function escapeXml(s: string): string {
  // 返回 `s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')`，作为共享工具这次计算的结果。
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Escape for interpolation into a double- or single-quoted attribute value:
 * `<tag attr="${here}">`. Escapes quotes in addition to `& < >`.
 */
// escapeXmlAttr 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function escapeXmlAttr(s: string): string {
  // 返回 `escapeXml(s).replace(/"/g, '&quot;').replace(/'/g, '&apos;')`，作为共享工具这次计算的结果。
  return escapeXml(s).replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
