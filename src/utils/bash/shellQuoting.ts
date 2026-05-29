// 引入 quote，将 ./shellQuote.js 中已经封装好的能力接到本文件流程里。
import { quote } from './shellQuote.js'

/**
 * Detects if a command contains a heredoc pattern
 * Matches patterns like: <<EOF, <<'EOF', <<"EOF", <<-EOF, <<-'EOF', <<\EOF, etc.
 */
// containsHeredoc 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function containsHeredoc(command: string): boolean {
  // Match heredoc patterns: << followed by optional -, then optional quotes or backslash, then word
  // Matches: <<EOF, <<'EOF', <<"EOF", <<-EOF, <<-'EOF', <<\EOF
  // Check for bit-shift operators first and exclude them
  // 共享工具在这里按实际状态进入对应分支。
  if (
    /\d\s*<<\s*\d/.test(command) ||
    /\[\[\s*\d+\s*<<\s*\d+\s*\]\]/.test(command) ||
    /\$\(\(.*<<.*\)\)/.test(command)
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Now check for heredoc patterns
  // heredocRegex保存`/<<-?\s*(?:(['"]?)(\w+)\1|\\(\w+))/`，供共享工具 shell Quoting后续判断或输出使用。
  const heredocRegex = /<<-?\s*(?:(['"]?)(\w+)\1|\\(\w+))/
  // 返回 heredocRegex.test(command)，把共享工具这个分支的结果交还调用方。
  return heredocRegex.test(command)
}

/**
 * Detects if a command contains multiline strings in quotes
 */
// containsMultilineString 承担共享工具中的独立步骤，串起共享工具 shell Quoting需要的输入整理、状态更新和结果输出。
function containsMultilineString(command: string): boolean {
  // Check for strings with actual newlines in them
  // Handle escaped quotes by using a more sophisticated pattern
  // Match single quotes: '...\n...' where content can include escaped quotes \'
  // Match double quotes: "...\n..." where content can include escaped quotes \"
  // singleQuoteMultiline保存`n`，供共享工具后续处理使用。
  const singleQuoteMultiline = /'(?:[^'\\]|\\.)*\n(?:[^'\\]|\\.)*'/
  // doubleQuoteMultiline保存`n`，供共享工具后续处理使用。
  const doubleQuoteMultiline = /"(?:[^"\\]|\\.)*\n(?:[^"\\]|\\.)*"/

  // 返回 (，把共享工具这个分支的结果交还调用方。
  return (
    singleQuoteMultiline.test(command) || doubleQuoteMultiline.test(command)
  )
}

/**
 * Quotes a shell command appropriately, preserving heredocs and multiline strings
 * @param command The command to quote
 * @param addStdinRedirect Whether to add < /dev/null
 * @returns The properly quoted command
 */
// quoteShellCommand 承担共享工具中的独立步骤，串起共享工具 shell Quoting需要的输入整理、状态更新和结果输出。
export function quoteShellCommand(
  command: string,
  addStdinRedirect: boolean = true,
): string {
  // If command contains heredoc or multiline strings, handle specially
  // The shell-quote library incorrectly escapes ! to \! in these cases
  // 判断 containsHeredoc(command) || containsMultilineString(command)，将共享工具分流到只适用于该条件的处理路径。
  if (containsHeredoc(command) || containsMultilineString(command)) {
    // For heredocs and multiline strings, we need to quote for eval
    // but avoid shell-quote's aggressive escaping
    // We'll use single quotes and escape only single quotes in the command
    // escaped格式化`command.replace`，供共享工具后续处理使用。
    const escaped = command.replace(/'/g, "'\"'\"'")
    // quoted保存``'${escaped}'``，作为后续固定文本处理的输入。
    const quoted = `'${escaped}'`

    // Don't add stdin redirect for heredocs as they provide their own input
    // 满足 `containsHeredoc(command)` 时，共享工具执行该分支。
    if (containsHeredoc(command)) {
      // 返回 `quoted`，作为共享工具这次计算的结果。
      return quoted
    }

    // For multiline strings without heredocs, add stdin redirect if needed
    // 返回 `addStdinRedirect ? `${quoted} < /dev/null` : quoted`，作为共享工具这次计算的结果。
    return addStdinRedirect ? `${quoted} < /dev/null` : quoted
  }

  // For regular commands, use shell-quote
  // 满足 `addStdinRedirect` 时，共享工具执行该分支。
  if (addStdinRedirect) {
    // 返回 `quote([command, '<', '/dev/null'])`，作为共享工具这次计算的结果。
    return quote([command, '<', '/dev/null'])
  }

  // 返回 `quote([command])`，作为共享工具这次计算的结果。
  return quote([command])
}

/**
 * Detects if a command already has a stdin redirect
 * Match patterns like: < file, </path/to/file, < /dev/null, etc.
 * But not <<EOF (heredoc), << (bit shift), or <(process substitution)
 */
// hasStdinRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasStdinRedirect(command: string): boolean {
  // Look for < followed by whitespace and a filename/path
  // Negative lookahead to exclude: <<, <(
  // Must be preceded by whitespace or command separator or start of string
  // 返回 `/(?:^|[\s;&|])<(?![<(])\s*\S+/.test(command)`，作为共享工具这次计算的结果。
  return /(?:^|[\s;&|])<(?![<(])\s*\S+/.test(command)
}

/**
 * Checks if stdin redirect should be added to a command
 * @param command The command to check
 * @returns true if stdin redirect can be safely added
 */
// shouldAddStdinRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldAddStdinRedirect(command: string): boolean {
  // Don't add stdin redirect for heredocs as it interferes with the heredoc terminator
  // 满足 `containsHeredoc(command)` 时，共享工具执行该分支。
  if (containsHeredoc(command)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Don't add stdin redirect if command already has one
  // 满足 `hasStdinRedirect(command)` 时，共享工具执行该分支。
  if (hasStdinRedirect(command)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // For other commands, stdin redirect is generally safe
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Rewrites Windows CMD-style `>nul` redirects to POSIX `/dev/null`.
 *
 * The model occasionally hallucinates Windows CMD syntax (e.g., `ls 2>nul`)
 * even though our bash shell is always POSIX (Git Bash / WSL on Windows).
 * When Git Bash sees `2>nul`, it creates a literal file named `nul` — a
 * Windows reserved device name that is extremely hard to delete and breaks
 * `git add .` and `git clone`. See anthropics/claude-code#4928.
 *
 * Matches: `>nul`, `> NUL`, `2>nul`, `&>nul`, `>>nul` (case-insensitive)
 * Does NOT match: `>null`, `>nullable`, `>nul.txt`, `cat nul.txt`
 *
 * Limitation: this regex does not parse shell quoting, so `echo ">nul"`
 * will also be rewritten. This is acceptable collateral — it's extremely
 * rare and rewriting to `/dev/null` inside a string is harmless.
 */
// NUL_REDIRECT_REGEX保存`/(\d?&?>+\s*)[Nn][Uu][Ll](?=\s|$|[|&;)\n])/g`，供共享工具 shell Quoting后续判断或输出使用。
const NUL_REDIRECT_REGEX = /(\d?&?>+\s*)[Nn][Uu][Ll](?=\s|$|[|&;)\n])/g

// rewriteWindowsNullRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function rewriteWindowsNullRedirect(command: string): string {
  // 返回 `command.replace(NUL_REDIRECT_REGEX, '$1/dev/null')`，作为共享工具这次计算的结果。
  return command.replace(NUL_REDIRECT_REGEX, '$1/dev/null')
}
