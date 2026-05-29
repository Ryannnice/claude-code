/**
 * Command semantics configuration for interpreting exit codes in PowerShell.
 *
 * PowerShell-native cmdlets do NOT need exit-code semantics:
 *   - Select-String (grep equivalent) exits 0 on no-match (returns $null)
 *   - Compare-Object (diff equivalent) exits 0 regardless
 *   - Test-Path exits 0 regardless (returns bool via pipeline)
 * Native cmdlets signal failure via terminating errors ($?), not exit codes.
 *
 * However, EXTERNAL executables invoked from PowerShell DO set $LASTEXITCODE,
 * and many use non-zero codes to convey information rather than failure:
 *   - grep.exe / rg.exe (Git for Windows, scoop, etc.): 1 = no match
 *   - findstr.exe (Windows native): 1 = no match
 *   - robocopy.exe (Windows native): 0-7 = success, 8+ = error (notorious!)
 *
 * Without this module, PowerShellTool throws ShellError on any non-zero exit,
 * so `robocopy` reporting "files copied successfully" (exit 1) shows as an error.
 */

// CommandSemantic 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandSemantic = (
  exitCode: number,
  stdout: string,
  stderr: string,
) => {
  isError: boolean
  message?: string
}

/**
 * Default semantic: treat only 0 as success, everything else as error
 */
// 这个回调绑定到 const DEFAULT_SEMANTIC: CommandSemantic = (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
const DEFAULT_SEMANTIC: CommandSemantic = (exitCode, _stdout, _stderr) => ({
  isError: exitCode !== 0,
  message:
    exitCode !== 0 ? `Command failed with exit code ${exitCode}` : undefined,
})

/**
 * grep / ripgrep: 0 = matches found, 1 = no matches, 2+ = error
 */
// 这个回调绑定到 const GREP_SEMANTIC: CommandSemantic = (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
const GREP_SEMANTIC: CommandSemantic = (exitCode, _stdout, _stderr) => ({
  isError: exitCode >= 2,
  message: exitCode === 1 ? 'No matches found' : undefined,
})

/**
 * Command-specific semantics for external executables.
 * Keys are lowercase command names WITHOUT .exe suffix.
 *
 * Deliberately omitted:
 *   - 'diff': Ambiguous. Windows PowerShell 5.1 aliases `diff` → Compare-Object
 *     (exit 0 on differ), but PS Core / Git for Windows may resolve to diff.exe
 *     (exit 1 on differ). Cannot reliably interpret.
 *   - 'fc': Ambiguous. PowerShell aliases `fc` → Format-Custom (a native cmdlet),
 *     but `fc.exe` is the Windows file compare utility (exit 1 = files differ).
 *     Same aliasing problem as `diff`.
 *   - 'find': Ambiguous. Windows find.exe (text search) vs Unix find.exe
 *     (file search via Git for Windows) have different semantics.
 *   - 'test', '[': Not PowerShell constructs.
 *   - 'select-string', 'compare-object', 'test-path': Native cmdlets exit 0.
 */
// COMMAND_SEMANTICS 命令数据 用 Map 保存键值关系，方便工具实现 command Semantics按 key 查找和复用。
const COMMAND_SEMANTICS: Map<string, CommandSemantic> = new Map([
  // External grep/ripgrep (Git for Windows, scoop, choco)
  ['grep', GREP_SEMANTIC],
  ['rg', GREP_SEMANTIC],

  // findstr.exe: Windows native text search
  // 0 = match found, 1 = no match, 2 = error
  ['findstr', GREP_SEMANTIC],

  // robocopy.exe: Windows native robust file copy
  // Exit codes are a BITFIELD — 0-7 are success, 8+ indicates at least one failure:
  //   0 = no files copied, no mismatch, no failures (already in sync)
  //   1 = files copied successfully
  //   2 = extra files/dirs detected (no copy)
  //   4 = mismatched files/dirs detected
  //   8 = some files/dirs could not be copied (copy errors)
  //  16 = serious error (robocopy did not copy any files)
  // This is the single most common "CI failed but nothing's wrong" Windows gotcha.
  [
    'robocopy',
    // 这个回调绑定到 (exitCode, _stdout, _stderr) => ({，负责工具调用在该局部场景下的响应。
    (exitCode, _stdout, _stderr) => ({
      isError: exitCode >= 8,
      message:
        exitCode === 0
          ? 'No files copied (already in sync)'
          : exitCode >= 1 && exitCode < 8
            ? exitCode & 1
              ? 'Files copied successfully'
              : 'Robocopy completed (no errors)'
            : undefined,
    }),
  ],
])

/**
 * Extract the command name from a single pipeline segment.
 * Strips leading `&` / `.` call operators and `.exe` suffix, lowercases.
 */
// extractBaseCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractBaseCommand(segment: string): string {
  // Strip PowerShell call operators: & "cmd", . "cmd"
  // (& and . at segment start followed by whitespace invoke the next token)
  // stripped格式化`segment.trim`，供工具调用后续处理使用。
  const stripped = segment.trim().replace(/^[&.]\s+/, '')
  // firstToken格式化`stripped.split`，供工具调用后续处理使用。
  const firstToken = stripped.split(/\s+/)[0] || ''
  // Strip surrounding quotes if command was invoked as & "grep.exe"
  // unquoted格式化`firstToken.replace`，供工具调用后续处理使用。
  const unquoted = firstToken.replace(/^["']|["']$/g, '')
  // Strip path: C:\bin\grep.exe → grep.exe, .\rg.exe → rg.exe
  // basename格式化`unquoted.split`，供工具调用后续处理使用。
  const basename = unquoted.split(/[\\/]/).pop() || unquoted
  // Strip .exe suffix (Windows is case-insensitive)
  // 返回 basename.toLowerCase().replace(/\.exe$/, '')，把工具调用这个分支的结果交还调用方。
  return basename.toLowerCase().replace(/\.exe$/, '')
}

/**
 * Extract the primary command from a PowerShell command line.
 * Takes the LAST pipeline segment since that determines the exit code.
 *
 * Heuristic split on `;` and `|` — may get it wrong for quoted strings or
 * complex constructs. Do NOT depend on this for security; it's only used
 * for exit-code interpretation (false negatives just fall back to default).
 */
// heuristicallyExtractBaseCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function heuristicallyExtractBaseCommand(command: string): string {
  // segments 集合格式化`command.split`，供工具调用后续处理使用。
  const segments = command.split(/[;|]/).filter(s => s.trim())
  // last标记工具实现 command Semantics是否启用对应路径。
  const last = segments[segments.length - 1] || command
  // 返回 `extractBaseCommand(last)`，作为工具调用这次计算的结果。
  return extractBaseCommand(last)
}

/**
 * Interpret command result based on semantic rules
 */
// interpretCommandResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function interpretCommandResult(
  command: string,
  exitCode: number,
  stdout: string,
  stderr: string,
): {
  isError: boolean
  message?: string
} {
  // baseCommand 命令数据保存`heuristicallyExtractBaseCommand`，供工具调用后续处理使用。
  const baseCommand = heuristicallyExtractBaseCommand(command)
  // semantic读取`COMMAND_SEMANTICS.get`，供工具调用后续处理使用。
  const semantic = COMMAND_SEMANTICS.get(baseCommand) ?? DEFAULT_SEMANTIC
  // 返回 `semantic(exitCode, stdout, stderr)`，作为工具调用这次计算的结果。
  return semantic(exitCode, stdout, stderr)
}
