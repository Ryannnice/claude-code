// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 getMaxOutputLength 工具函数，把通用处理留在 ../../utils/shell/outputLimits.js 中维护。
import { getMaxOutputLength } from '../../utils/shell/outputLimits.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getPowerShellEdition,
  type PowerShellEdition,
} from '../../utils/shell/powershellDetection.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getDefaultBashTimeoutMs,
  getMaxBashTimeoutMs,
} from '../../utils/timeouts.js'
// 引入 FILE_EDIT_TOOL_NAME，将 ../FileEditTool/constants.js 中已经封装好的能力接到本文件流程里。
import { FILE_EDIT_TOOL_NAME } from '../FileEditTool/constants.js'
// 引入 FILE_READ_TOOL_NAME，将 ../FileReadTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'
// 引入 FILE_WRITE_TOOL_NAME，将 ../FileWriteTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_WRITE_TOOL_NAME } from '../FileWriteTool/prompt.js'
// 引入 GLOB_TOOL_NAME，将 ../GlobTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { GLOB_TOOL_NAME } from '../GlobTool/prompt.js'
// 引入 GREP_TOOL_NAME，将 ../GrepTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { GREP_TOOL_NAME } from '../GrepTool/prompt.js'
// 引入 POWERSHELL_TOOL_NAME，将 ./toolName.js 中已经封装好的能力接到本文件流程里。
import { POWERSHELL_TOOL_NAME } from './toolName.js'

// getDefaultTimeoutMs 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultTimeoutMs(): number {
  // 返回 `getDefaultBashTimeoutMs()`，作为工具调用这次计算的结果。
  return getDefaultBashTimeoutMs()
}

// getMaxTimeoutMs 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxTimeoutMs(): number {
  // 返回 `getMaxBashTimeoutMs()`，作为工具调用这次计算的结果。
  return getMaxBashTimeoutMs()
}

// getBackgroundUsageNote 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBackgroundUsageNote(): string | null {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)` 时，工具调用执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
  // 返回 `` - You can use the \`run_in_background\` parameter to run the command ...`，作为工具调用这次计算的结果。
  return `  - You can use the \`run_in_background\` parameter to run the command in the background. Only use this if you don't need the result immediately and are OK being notified when the command completes later. You do not need to check the output right away - you'll be notified when it finishes.`
}

// getSleepGuidance 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSleepGuidance(): string | null {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)` 时，工具调用执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
  // 返回 `` - Avoid unnecessary \`Start-Sleep\` commands:`，作为工具调用这次计算的结果。
  return `  - Avoid unnecessary \`Start-Sleep\` commands:
    - Do not sleep between commands that can run immediately — just run them.
    - If your command is long running and you would like to be notified when it finishes — simply run your command using \`run_in_background\`. There is no need to sleep in this case.
    - Do not retry failing commands in a sleep loop — diagnose the root cause or consider an alternative approach.
    - If waiting for a background task you started with \`run_in_background\`, you will be notified when it completes — do not poll.
    - If you must poll an external process, use a check command rather than sleeping first.
    - If you must sleep, keep the duration short (1-5 seconds) to avoid blocking the user.`
}

/**
 * Version-specific syntax guidance. The model's training data covers both
 * editions but it can't tell which one it's targeting, so it either emits
 * pwsh-7 syntax on 5.1 (parser error → exit 1) or needlessly avoids && on 7.
 */
// getEditionSection 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEditionSection(edition: PowerShellEdition | null): string {
  // 当 `edition` 匹配 `'desktop'` 时，工具调用执行对应分支。
  if (edition === 'desktop') {
    // 返回 ``PowerShell edition: Windows PowerShell 5.1 (powershell.exe)`，作为工具调用这次计算的结果。
    return `PowerShell edition: Windows PowerShell 5.1 (powershell.exe)
   - Pipeline chain operators \`&&\` and \`||\` are NOT available — they cause a parser error. To run B only if A succeeds: \`A; if ($?) { B }\`. To chain unconditionally: \`A; B\`.
   - Ternary (\`?:\`), null-coalescing (\`??\`), and null-conditional (\`?.\`) operators are NOT available. Use \`if/else\` and explicit \`$null -eq\` checks instead.
   - Avoid \`2>&1\` on native executables. In 5.1, redirecting a native command's stderr inside PowerShell wraps each line in an ErrorRecord (NativeCommandError) and sets \`$?\` to \`$false\` even when the exe returned exit code 0. stderr is already captured for you — don't redirect it.
   - Default file encoding is UTF-16 LE (with BOM). When writing files other tools will read, pass \`-Encoding utf8\` to \`Out-File\`/\`Set-Content\`.
   - \`ConvertFrom-Json\` returns a PSCustomObject, not a hashtable. \`-AsHashtable\` is not available.`
  }
  // 当 `edition` 匹配 `'core'` 时，工具调用执行对应分支。
  if (edition === 'core') {
    // 返回 ``PowerShell edition: PowerShell 7+ (pwsh)`，作为工具调用这次计算的结果。
    return `PowerShell edition: PowerShell 7+ (pwsh)
   - Pipeline chain operators \`&&\` and \`||\` ARE available and work like bash. Prefer \`cmd1 && cmd2\` over \`cmd1; cmd2\` when cmd2 should only run if cmd1 succeeds.
   - Ternary (\`$cond ? $a : $b\`), null-coalescing (\`??\`), and null-conditional (\`?.\`) operators are available.
   - Default file encoding is UTF-8 without BOM.`
  }
  // Detection not yet resolved (first prompt build before any tool call) or
  // PS not installed. Give the conservative 5.1-safe guidance.
  // 返回 ``PowerShell edition: unknown — assume Windows PowerShell 5.1 for compat...`，作为工具调用这次计算的结果。
  return `PowerShell edition: unknown — assume Windows PowerShell 5.1 for compatibility
   - Do NOT use \`&&\`, \`||\`, ternary \`?:\`, null-coalescing \`??\`, or null-conditional \`?.\`. These are PowerShell 7+ only and parser-error on 5.1.
   - To chain commands conditionally: \`A; if ($?) { B }\`. Unconditionally: \`A; B\`.`
}

// getPrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPrompt(): Promise<string> {
  // backgroundNote读取`getBackgroundUsageNote`，供工具调用后续处理使用。
  const backgroundNote = getBackgroundUsageNote()
  // sleepGuidance读取`getSleepGuidance`，供工具调用后续处理使用。
  const sleepGuidance = getSleepGuidance()
  // edition读取`getPowerShellEdition`，供工具调用后续处理使用。
  const edition = await getPowerShellEdition()

  // 返回 ``Executes a given PowerShell command with optional timeout. Working dir...`，作为工具调用这次计算的结果。
  return `Executes a given PowerShell command with optional timeout. Working directory persists between commands; shell state (variables, functions) does not.

IMPORTANT: This tool is for terminal operations via PowerShell: git, npm, docker, and PS cmdlets. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.

${getEditionSection(edition)}

Before executing the command, please follow these steps:

1. Directory Verification:
   - If the command will create new directories or files, first use \`Get-ChildItem\` (or \`ls\`) to verify the parent directory exists and is the correct location

2. Command Execution:
   - Always quote file paths that contain spaces with double quotes
   - Capture the output of the command.

PowerShell Syntax Notes:
   - Variables use $ prefix: $myVar = "value"
   - Escape character is backtick (\`), not backslash
   - Use Verb-Noun cmdlet naming: Get-ChildItem, Set-Location, New-Item, Remove-Item
   - Common aliases: ls (Get-ChildItem), cd (Set-Location), cat (Get-Content), rm (Remove-Item)
   - Pipe operator | works similarly to bash but passes objects, not text
   - Use Select-Object, Where-Object, ForEach-Object for filtering and transformation
   - String interpolation: "Hello $name" or "Hello $($obj.Property)"
   - Registry access uses PSDrive prefixes: \`HKLM:\\SOFTWARE\\...\`, \`HKCU:\\...\` — NOT raw \`HKEY_LOCAL_MACHINE\\...\`
   - Environment variables: read with \`$env:NAME\`, set with \`$env:NAME = "value"\` (NOT \`Set-Variable\` or bash \`export\`)
   - Call native exe with spaces in path via call operator: \`& "C:\\Program Files\\App\\app.exe" arg1 arg2\`

Interactive and blocking commands (will hang — this tool runs with -NonInteractive):
   - NEVER use \`Read-Host\`, \`Get-Credential\`, \`Out-GridView\`, \`$Host.UI.PromptForChoice\`, or \`pause\`
   - Destructive cmdlets (\`Remove-Item\`, \`Stop-Process\`, \`Clear-Content\`, etc.) may prompt for confirmation. Add \`-Confirm:$false\` when you intend the action to proceed. Use \`-Force\` for read-only/hidden items.
   - Never use \`git rebase -i\`, \`git add -i\`, or other commands that open an interactive editor

Passing multiline strings (commit messages, file content) to native executables:
   - Use a single-quoted here-string so PowerShell does not expand \`$\` or backticks inside. The closing \`'@\` MUST be at column 0 (no leading whitespace) on its own line — indenting it is a parse error:
<example>
git commit -m @'
Commit message here.
Second line with $literal dollar signs.
'@
</example>
   - Use \`@'...'@\` (single-quoted, literal) not \`@"..."@\` (double-quoted, interpolated) unless you need variable expansion
   - For arguments containing \`-\`, \`@\`, or other characters PowerShell parses as operators, use the stop-parsing token: \`git log --% --format=%H\`

Usage notes:
  - The command argument is required.
  - You can specify an optional timeout in milliseconds (up to ${getMaxTimeoutMs()}ms / ${getMaxTimeoutMs() / 60000} minutes). If not specified, commands will timeout after ${getDefaultTimeoutMs()}ms (${getDefaultTimeoutMs() / 60000} minutes).
  - It is very helpful if you write a clear, concise description of what this command does.
  - If the output exceeds ${getMaxOutputLength()} characters, output will be truncated before being returned to you.
${backgroundNote ? backgroundNote + '\n' : ''}\
  - Avoid using PowerShell to run commands that have dedicated tools, unless explicitly instructed:
    - File search: Use ${GLOB_TOOL_NAME} (NOT Get-ChildItem -Recurse)
    - Content search: Use ${GREP_TOOL_NAME} (NOT Select-String)
    - Read files: Use ${FILE_READ_TOOL_NAME} (NOT Get-Content)
    - Edit files: Use ${FILE_EDIT_TOOL_NAME}
    - Write files: Use ${FILE_WRITE_TOOL_NAME} (NOT Set-Content/Out-File)
    - Communication: Output text directly (NOT Write-Output/Write-Host)
  - When issuing multiple commands:
    - If the commands are independent and can run in parallel, make multiple ${POWERSHELL_TOOL_NAME} tool calls in a single message.
    - If the commands depend on each other and must run sequentially, chain them in a single ${POWERSHELL_TOOL_NAME} call (see edition-specific chaining syntax above).
    - Use \`;\` only when you need to run commands sequentially but don't care if earlier commands fail.
    - DO NOT use newlines to separate commands (newlines are ok in quoted strings and here-strings)
  - Do NOT prefix commands with \`cd\` or \`Set-Location\` -- the working directory is already set to the correct project directory automatically.
${sleepGuidance ? sleepGuidance + '\n' : ''}\
  - For git commands:
    - Prefer to create a new commit rather than amending an existing commit.
    - Before running destructive operations (e.g., git reset --hard, git push --force, git checkout --), consider whether there is a safer alternative that achieves the same goal. Only use destructive operations when they are truly the best approach.
    - Never skip hooks (--no-verify) or bypass signing (--no-gpg-sign, -c commit.gpgsign=false) unless the user has explicitly asked for it. If a hook fails, investigate and fix the underlying issue.`
}
