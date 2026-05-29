/**
 * If the first line of a bash command is a `# comment` (not a `#!` shebang),
 * return the comment text stripped of the `#` prefix. Otherwise undefined.
 *
 * Under fullscreen mode this is the non-verbose tool-use label AND the
 * collapse-group ⎿ hint — it's what Claude wrote for the human to read.
 */
// extractBashCommentLabel 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractBashCommentLabel(command: string): string | undefined {
  // nl保存`command.indexOf`，供工具调用后续处理使用。
  const nl = command.indexOf('\n')
  // firstLine格式化`command.slice`，供工具调用后续处理使用。
  const firstLine = (nl === -1 ? command : command.slice(0, nl)).trim()
  // 只有 `!firstLine.startsWith('#') || firstLine.startsWith('#!')` 满足时，工具调用才执行该分支。
  if (!firstLine.startsWith('#') || firstLine.startsWith('#!')) return undefined
  // 返回 `firstLine.replace(/^#+\s*/, '') || undefined`，作为工具调用这次计算的结果。
  return firstLine.replace(/^#+\s*/, '') || undefined
}
