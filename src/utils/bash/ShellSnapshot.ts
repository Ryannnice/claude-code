// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFile } from 'child_process'
// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, stat } from 'fs/promises'
// 引入 * as os，将 os 中已经封装好的能力接到本文件流程里。
import * as os from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  embeddedSearchToolsBinaryPath,
  hasEmbeddedSearchTools,
} from '../embeddedTools.js'
// 引入 getClaudeConfigHomeDir，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from '../envUtils.js'
// 引入 pathExists，将 ../file.js 中已经封装好的能力接到本文件流程里。
import { pathExists } from '../file.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'
// 引入 ripgrepCommand，将 ../ripgrep.js 中已经封装好的能力接到本文件流程里。
import { ripgrepCommand } from '../ripgrep.js'
// 引入 subprocessEnv，将 ../subprocessEnv.js 中已经封装好的能力接到本文件流程里。
import { subprocessEnv } from '../subprocessEnv.js'
// 引入 quote，将 ./shellQuote.js 中已经封装好的能力接到本文件流程里。
import { quote } from './shellQuote.js'

// LITERAL_BACKSLASH 命名 `'\\'`，让后续代码直接表达这个值的用途。
const LITERAL_BACKSLASH = '\\'
// SNAPSHOT_CREATION_TIMEOUT保存`10000 // 10 seconds`，供后续判断或组装使用。
const SNAPSHOT_CREATION_TIMEOUT = 10000 // 10 seconds

/**
 * Creates a shell function that invokes `binaryPath` with a specific argv[0].
 * This uses the bun-internal ARGV0 dispatch trick: the bun binary checks its
 * argv[0] and runs the embedded tool (rg, bfs, ugrep) that matches.
 *
 * @param prependArgs - Arguments to inject before the user's args (e.g.,
 *   default flags). Injected literally; each element must be a valid shell
 *   word (no spaces/special chars).
 */
// createArgv0ShellFunction 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createArgv0ShellFunction(
  funcName: string,
  argv0: string,
  binaryPath: string,
  prependArgs: string[] = [],
): string {
  // quotedPath 路径数据保存`quote`，供共享工具后续处理使用。
  const quotedPath = quote([binaryPath])
  // argSuffix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const argSuffix =
    prependArgs.length > 0 ? `${prependArgs.join(' ')} "$@"` : '"$@"'
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    `function ${funcName} {`,
    '  if [[ -n $ZSH_VERSION ]]; then',
    `    ARGV0=${argv0} ${quotedPath} ${argSuffix}`,
    '  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then',
    // On Windows (git bash), exec -a does not work, so use ARGV0 env var instead
    // The bun binary reads from ARGV0 natively to set argv[0]
    `    ARGV0=${argv0} ${quotedPath} ${argSuffix}`,
    '  elif [[ $BASHPID != $$ ]]; then',
    `    exec -a ${argv0} ${quotedPath} ${argSuffix}`,
    '  else',
    `    (exec -a ${argv0} ${quotedPath} ${argSuffix})`,
    '  fi',
    '}',
  ].join('\n')
}

/**
 * Creates ripgrep shell integration (alias or function)
 * @returns Object with type and the shell snippet to use
 */
// createRipgrepShellIntegration 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createRipgrepShellIntegration(): {
  type: 'alias' | 'function'
  snippet: string
} {
  // rgCommand 命令数据保存`ripgrepCommand`，供共享工具后续处理使用。
  const rgCommand = ripgrepCommand()

  // For embedded ripgrep (bun-internal), we need a shell function that sets argv0
  // 满足 `rgCommand.argv0` 时，共享工具执行该分支。
  if (rgCommand.argv0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      type: 'function',
      snippet: createArgv0ShellFunction(
        'rg',
        rgCommand.argv0,
        rgCommand.rgPath,
      ),
    }
  }

  // For regular ripgrep, use a simple alias target
  // quotedPath 路径数据保存`quote`，供共享工具后续处理使用。
  const quotedPath = quote([rgCommand.rgPath])
  // quotedArgs 集合派生`rgArgs.map`，供共享工具后续处理使用。
  const quotedArgs = rgCommand.rgArgs.map(arg => quote([arg]))
  // aliasTarget 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const aliasTarget =
    rgCommand.rgArgs.length > 0
      ? `${quotedPath} ${quotedArgs.join(' ')}`
      : quotedPath

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { type: 'alias', snippet: aliasTarget }
}

/**
 * VCS directories to exclude from grep searches. Matches the list in
 * GrepTool (see GrepTool.ts: VCS_DIRECTORIES_TO_EXCLUDE).
 */
// VCS_DIRECTORIES_TO_EXCLUDE 聚合成有序列表，保持后续遍历顺序稳定。
const VCS_DIRECTORIES_TO_EXCLUDE = [
  '.git',
  '.svn',
  '.hg',
  '.bzr',
  '.jj',
  '.sl',
] as const

/**
 * Creates shell integration for `find` and `grep`, backed by bfs and ugrep
 * embedded in the bun binary (ant-native only). Unlike the rg integration,
 * this always shadows the system find/grep since bfs/ugrep are drop-in
 * replacements and we want consistent fast behavior.
 *
 * These wrappers replace the GlobTool/GrepTool dedicated tools (which are
 * removed from the tool registry when embedded search tools are available),
 * so they're tuned to match those tools' semantics, not GNU find/grep.
 *
 * `find` ↔ GlobTool:
 * - Inject `-regextype findutils-default`: bfs defaults to POSIX BRE for
 *   -regex, but GNU find defaults to emacs-flavor (which supports `\|`
 *   alternation). Without this, `find . -regex '.*\.\(js\|ts\)'` silently
 *   returns zero results. A later user-supplied -regextype still overrides.
 * - No gitignore filtering: GlobTool passes `--no-ignore` to rg. bfs has no
 *   gitignore support anyway, so this matches by default.
 * - Hidden files included: both GlobTool (`--hidden`) and bfs's default.
 *
 * Caveat: even with findutils-default, Oniguruma (bfs's regex engine) uses
 * leftmost-first alternation, not POSIX leftmost-longest. Patterns where
 * one alternative is a prefix of another (e.g., `\(ts\|tsx\)`) may miss
 * matches that GNU find catches. Workaround: put the longer alternative first.
 *
 * `grep` ↔ GrepTool (file filtering) + GNU grep (regex syntax):
 * - `-G` (basic regex / BRE): GNU grep defaults to BRE where `\|` is
 *   alternation. ugrep defaults to ERE where `|` is alternation and `\|` is a
 *   literal pipe. Without -G, `grep "foo\|bar"` silently returns zero results.
 *   User-supplied `-E`, `-F`, or `-P` later in argv overrides this.
 * - `--ignore-files`: respect .gitignore (GrepTool uses rg's default, which
 *   respects gitignore). Override with `grep --no-ignore-files`.
 * - `--hidden`: include hidden files (GrepTool passes `--hidden` to rg).
 *   Override with `grep --no-hidden`.
 * - `--exclude-dir` for VCS dirs: GrepTool passes `--glob '!.git'` etc. to rg.
 * - `-I`: skip binary files. rg's recursion silently skips binary matches
 *   by default (different from direct-file-arg behavior); ugrep doesn't, so
 *   we inject -I to match. Override with `grep -a`.
 *
 * Not replicated from GrepTool:
 * - `--max-columns 500`: ugrep's `--width` hard-truncates output which could
 *   break pipelines; rg's version replaces the line with a placeholder.
 * - Read deny rules / plugin cache exclusions: require toolPermissionContext
 *   which isn't available at shell-snapshot creation time.
 *
 * Returns null if embedded search tools are not available in this build.
 */
// createFindGrepShellIntegration 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createFindGrepShellIntegration(): string | null {
  // 满足 `!hasEmbeddedSearchTools()` 时，共享工具执行该分支。
  if (!hasEmbeddedSearchTools()) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // binaryPath 路径数据保存`embeddedSearchToolsBinaryPath`，供共享工具后续处理使用。
  const binaryPath = embeddedSearchToolsBinaryPath()
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    // User shell configs may define aliases like `alias find=gfind` or
    // `alias grep=ggrep` (common on macOS with Homebrew GNU tools). The
    // snapshot sources user aliases before these function definitions, and
    // bash expands aliases before function lookup — so a renaming alias
    // would silently bypass the embedded bfs/ugrep dispatch. Clear them first
    // (same fix the rg integration uses).
    'unalias find 2>/dev/null || true',
    'unalias grep 2>/dev/null || true',
    createArgv0ShellFunction('find', 'bfs', binaryPath, [
      '-regextype',
      'findutils-default',
    ]),
    createArgv0ShellFunction('grep', 'ugrep', binaryPath, [
      '-G',
      '--ignore-files',
      '--hidden',
      '-I',
      // 链式调用 链式方法，继续加工上一行在共享工具中产生的数据。
      ...VCS_DIRECTORIES_TO_EXCLUDE.map(d => `--exclude-dir=${d}`),
    ]),
  ].join('\n')
}

// getConfigFile 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfigFile(shellPath: string): string {
  // fileName 文件数据筛选`shellPath.includes`，供共享工具后续处理使用。
  const fileName = shellPath.includes('zsh')
    ? '.zshrc'
    : shellPath.includes('bash')
      ? '.bashrc'
      : '.profile'

  // configPath 路径数据格式化`join`，供共享工具后续处理使用。
  const configPath = join(os.homedir(), fileName)

  // 返回 `configPath`，作为共享工具这次计算的结果。
  return configPath
}

/**
 * Generates user-specific snapshot content (functions, options, aliases)
 * This content is derived from the user's shell configuration file
 */
// getUserSnapshotContent 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUserSnapshotContent(configFile: string): string {
  // isZsh记录 `configFile.endsWith` 是否成立，共享工具随后按该结果分支。
  const isZsh = configFile.endsWith('.zshrc')

  // 文本内容固定为 `''`，作为共享工具 Shell Snapshot后续展示或比较的基准。
  let content = ''

  // User functions
  // 满足 `isZsh` 时，共享工具执行该分支。
  if (isZsh) {
    // 共享工具 Shell Snapshot在这里处理 `content += ``，完成这一小步状态转换。
    content += `
      echo "# Functions" >> "$SNAPSHOT_FILE"

      # Force autoload all functions first
      typeset -f > /dev/null 2>&1

      # Now get user function names - filter completion functions (single underscore prefix)
      # but keep double-underscore helpers (e.g. __zsh_like_cd from mise, __pyenv_init)
      typeset +f | grep -vE '^_[^_]' | while read func; do
        typeset -f "$func" >> "$SNAPSHOT_FILE"
      done
    `
  } else {
    // 共享工具 Shell Snapshot在这里处理 `content += ``，完成这一小步状态转换。
    content += `
      echo "# Functions" >> "$SNAPSHOT_FILE"

      # Force autoload all functions first
      declare -f > /dev/null 2>&1

      # Now get user function names - filter completion functions (single underscore prefix)
      # but keep double-underscore helpers (e.g. __zsh_like_cd from mise, __pyenv_init)
      declare -F | cut -d' ' -f3 | grep -vE '^_[^_]' | while read func; do
        # Encode the function to base64, preserving all special characters
        encoded_func=$(declare -f "$func" | base64 )
        # Write the function definition to the snapshot
        echo "eval ${LITERAL_BACKSLASH}"${LITERAL_BACKSLASH}$(echo '$encoded_func' | base64 -d)${LITERAL_BACKSLASH}" > /dev/null 2>&1" >> "$SNAPSHOT_FILE"
      done
    `
  }

  // Shell options
  // 满足 `isZsh` 时，共享工具执行该分支。
  if (isZsh) {
    // 共享工具 Shell Snapshot在这里处理 `content += ``，完成这一小步状态转换。
    content += `
      echo "# Shell Options" >> "$SNAPSHOT_FILE"
      setopt | sed 's/^/setopt /' | head -n 1000 >> "$SNAPSHOT_FILE"
    `
  } else {
    // 共享工具 Shell Snapshot在这里处理 `content += ``，完成这一小步状态转换。
    content += `
      echo "# Shell Options" >> "$SNAPSHOT_FILE"
      shopt -p | head -n 1000 >> "$SNAPSHOT_FILE"
      set -o | grep "on" | awk '{print "set -o " $1}' | head -n 1000 >> "$SNAPSHOT_FILE"
      echo "shopt -s expand_aliases" >> "$SNAPSHOT_FILE"
    `
  }

  // User aliases
  // 共享工具 Shell Snapshot在这里处理 `content += ``，完成这一小步状态转换。
  content += `
      echo "# Aliases" >> "$SNAPSHOT_FILE"
      # Filter out winpty aliases on Windows to avoid "stdin is not a tty" errors
      # Git Bash automatically creates aliases like "alias node='winpty node.exe'" for
      # programs that need Win32 Console in mintty, but winpty fails when there's no TTY
      if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        alias | grep -v "='winpty " | sed 's/^alias //g' | sed 's/^/alias -- /' | head -n 1000 >> "$SNAPSHOT_FILE"
      else
        alias | sed 's/^alias //g' | sed 's/^/alias -- /' | head -n 1000 >> "$SNAPSHOT_FILE"
      fi
  `

  // 返回 `content`，作为共享工具这次计算的结果。
  return content
}

/**
 * Generates Claude Code specific snapshot content
 * This content is always included regardless of user configuration
 */
// getClaudeCodeSnapshotContent 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getClaudeCodeSnapshotContent(): Promise<string> {
  // Get the appropriate PATH based on platform
  // pathValue 路径数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  let pathValue = process.env.PATH
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // On Windows with git-bash, read the Cygwin PATH
    // cygwinResult保存`execa`，供共享工具后续处理使用。
    const cygwinResult = await execa('echo $PATH', {
      shell: true,
      reject: false,
    })
    // 只有 `cygwinResult.exitCode === 0 && cygwinResult.stdout` 满足时，共享工具才执行该分支。
    if (cygwinResult.exitCode === 0 && cygwinResult.stdout) {
      // pathValue 路径数据更新为 `cygwinResult.stdout.trim()`，确保Bash 解析工具后续读取最新状态。
      pathValue = cygwinResult.stdout.trim()
    }
    // Fall back to process.env.PATH if we can't get Cygwin PATH
  }

  // rgIntegration构建`createRipgrepShellIntegration`，供共享工具后续处理使用。
  const rgIntegration = createRipgrepShellIntegration()

  // 文本内容固定为 `''`，作为共享工具 Shell Snapshot后续展示或比较的基准。
  let content = ''

  // Check if rg is available, if not create an alias/function to bundled ripgrep
  // We use a subshell to unalias rg before checking, so that user aliases like
  // `alias rg='rg --smart-case'` don't shadow the real binary check. The subshell
  // ensures we don't modify the user's aliases in the parent shell.
  // 共享工具 Shell Snapshot在这里处理 `content += ``，完成这一小步状态转换。
  content += `
      # Check for rg availability
      echo "# Check for rg availability" >> "$SNAPSHOT_FILE"
      echo "if ! (unalias rg 2>/dev/null; command -v rg) >/dev/null 2>&1; then" >> "$SNAPSHOT_FILE"
  `

  // 当 `rgIntegration.type` 匹配 `'function'` 时，共享工具执行对应分支。
  if (rgIntegration.type === 'function') {
    // For embedded ripgrep, write the function definition using heredoc
    // 共享工具 Shell Snapshot在这里处理 `content += ``，完成这一小步状态转换。
    content += `
      cat >> "$SNAPSHOT_FILE" << 'RIPGREP_FUNC_END'
  ${rgIntegration.snippet}
RIPGREP_FUNC_END
    `
  } else {
    // For regular ripgrep, write a simple alias
    // escapedSnippet格式化`snippet.replace`，供共享工具后续处理使用。
    const escapedSnippet = rgIntegration.snippet.replace(/'/g, "'\\''")
    // 共享工具 Shell Snapshot处理 `content += ``，完成这一小步状态转换。
    content += `
      echo '  alias rg='"'${escapedSnippet}'" >> "$SNAPSHOT_FILE"
    `
  }

  // 共享工具 Shell Snapshot处理 `content += ``，完成这一小步状态转换。
  content += `
      echo "fi" >> "$SNAPSHOT_FILE"
  `

  // For ant-native builds, shadow find/grep with bfs/ugrep embedded in the bun
  // binary. Unlike rg (which only activates if system rg is absent), we always
  // shadow find/grep since bfs/ugrep are drop-in replacements and we want
  // consistent fast behavior in Claude's shell.
  // findGrepIntegration构建`createFindGrepShellIntegration`，供共享工具后续处理使用。
  const findGrepIntegration = createFindGrepShellIntegration()
  // `findGrepIntegration` 与 `null` 不一致时刷新派生状态。
  if (findGrepIntegration !== null) {
    // 共享工具 Shell Snapshot处理 `content += ``，完成这一小步状态转换。
    content += `
      # Shadow find/grep with embedded bfs/ugrep (ant-native only)
      echo "# Shadow find/grep with embedded bfs/ugrep" >> "$SNAPSHOT_FILE"
      cat >> "$SNAPSHOT_FILE" << 'FIND_GREP_FUNC_END'
${findGrepIntegration}
FIND_GREP_FUNC_END
    `
  }

  // Add PATH to the file
  // 共享工具 Shell Snapshot处理 `content += ``，完成这一小步状态转换。
  content += `

      # Add PATH to the file
      echo "export PATH=${quote([pathValue || ''])}" >> "$SNAPSHOT_FILE"
  `

  // 返回 content，把共享工具这个分支的结果交还调用方。
  return content
}

/**
 * Creates the appropriate shell script for capturing environment
 */
// getSnapshotScript 承担共享工具中的独立步骤，串起共享工具 Shell Snapshot需要的输入整理、状态更新和结果输出。
async function getSnapshotScript(
  shellPath: string,
  snapshotFilePath: string,
  configFileExists: boolean,
): Promise<string> {
  // configFile 文件数据读取`getConfigFile`，供共享工具后续处理使用。
  const configFile = getConfigFile(shellPath)
  // isZsh保存`configFile.endsWith`，供共享工具后续处理使用。
  const isZsh = configFile.endsWith('.zshrc')

  // Generate the user content and Claude Code content
  // userContent保存`configFileExists`，供共享工具 Shell Snapshot后续步骤使用。
  const userContent = configFileExists
    ? getUserSnapshotContent(configFile)
    : !isZsh
      ? // we need to manually force alias expansion in bash - normally `getUserSnapshotContent` takes care of this
        'echo "shopt -s expand_aliases" >> "$SNAPSHOT_FILE"'
      : ''
  // claudeCodeContent读取`getClaudeCodeSnapshotContent`，供共享工具后续处理使用。
  const claudeCodeContent = await getClaudeCodeSnapshotContent()

  // script保存`quote`，供共享工具后续处理使用。
  const script = `SNAPSHOT_FILE=${quote([snapshotFilePath])}
      ${configFileExists ? `source "${configFile}" < /dev/null` : '# No user config file to source'}

      # First, create/clear the snapshot file
      echo "# Snapshot file" >| "$SNAPSHOT_FILE"

      # When this file is sourced, we first unalias to avoid conflicts
      # This is necessary because aliases get "frozen" inside function definitions at definition time,
      # which can cause unexpected behavior when functions use commands that conflict with aliases
      echo "# Unset all aliases to avoid conflicts with functions" >> "$SNAPSHOT_FILE"
      echo "unalias -a 2>/dev/null || true" >> "$SNAPSHOT_FILE"

      ${userContent}

      ${claudeCodeContent}

      # Exit silently on success, only report errors
      if [ ! -f "$SNAPSHOT_FILE" ]; then
        echo "Error: Snapshot file was not created at $SNAPSHOT_FILE" >&2
        exit 1
      fi
    `

  // 返回 script，把共享工具这个分支的结果交还调用方。
  return script
}

/**
 * Creates and saves the shell environment snapshot by loading the user's shell configuration
 *
 * This function is a critical part of Claude CLI's shell integration strategy. It:
 *
 * 1. Identifies the user's shell config file (.zshrc, .bashrc, etc.)
 * 2. Creates a temporary script that sources this configuration file
 * 3. Captures the resulting shell environment state including:
 *    - Functions defined in the user's shell configuration
 *    - Shell options and settings that affect command behavior
 *    - Aliases that the user has defined
 *
 * The snapshot is saved to a temporary file that can be sourced by subsequent shell
 * commands, ensuring they run with the user's expected environment, aliases, and functions.
 *
 * This approach allows Claude CLI to execute commands as if they were run in the user's
 * interactive shell, while avoiding the overhead of creating a new login shell for each command.
 * It handles both Bash and Zsh shells with their different syntax for functions, options, and aliases.
 *
 * If the snapshot creation fails (e.g., timeout, permissions issues), the CLI will still
 * function but without the user's custom shell environment, potentially missing aliases
 * and functions the user relies on.
 *
 * @returns Promise that resolves to the snapshot file path or undefined if creation failed
 */
// createAndSaveSnapshot保存`async`，供共享工具后续处理使用。
export const createAndSaveSnapshot = async (
  binShell: string,
): Promise<string | undefined> => {
  // shellType筛选`binShell.includes`，供共享工具后续处理使用。
  const shellType = binShell.includes('zsh')
    ? 'zsh'
    : binShell.includes('bash')
      ? 'bash'
      : 'sh'

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Creating shell snapshot for ${shellType} (${binShell})`)

  // 返回 new Promise(async resolve => {，把共享工具这个分支的结果交还调用方。
  return new Promise(async resolve => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // configFile 文件数据读取`getConfigFile`，供共享工具后续处理使用。
      const configFile = getConfigFile(binShell)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Looking for shell config file: ${configFile}`)
      // configFileExists 文件数据保存`pathExists`，供共享工具后续处理使用。
      const configFileExists = await pathExists(configFile)

      // configFileExists 文件数据缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
      if (!configFileExists) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Shell config file not found: ${configFile}, creating snapshot with Claude Code defaults only`,
        )
      }

      // Create unique snapshot path with timestamp and random ID
      // timestamp记录时间`Date.now`，供共享工具后续处理使用。
      const timestamp = Date.now()
      // randomId保存`Math.random`，供共享工具后续处理使用。
      const randomId = Math.random().toString(36).substring(2, 8)
      // snapshotsDir格式化`join`，供共享工具后续处理使用。
      const snapshotsDir = join(getClaudeConfigHomeDir(), 'shell-snapshots')
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Snapshots directory: ${snapshotsDir}`)
      // shellSnapshotPath 文件数据格式化`join`，供共享工具后续处理使用。
      const shellSnapshotPath = join(
        snapshotsDir,
        `snapshot-${shellType}-${timestamp}-${randomId}.sh`,
      )

      // Ensure snapshots directory exists
      // 等待 `mkdir(snapshotsDir, { recursive: true })` 完成，再继续共享工具 Shell Snapshot的异步流程。
      await mkdir(snapshotsDir, { recursive: true })

      // snapshotScript读取`getSnapshotScript`，供共享工具后续处理使用。
      const snapshotScript = await getSnapshotScript(
        binShell,
        shellSnapshotPath,
        configFileExists,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Creating snapshot at: ${shellSnapshotPath}`)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Execution timeout: ${SNAPSHOT_CREATION_TIMEOUT}ms`)
      // execFile执行共享工具在此处需要的副作用或外部交互。
      execFile(
        binShell,
        ['-c', '-l', snapshotScript],
        {
          env: {
            ...((process.env.CLAUDE_CODE_DONT_INHERIT_ENV
              ? {}
              : subprocessEnv()) as typeof process.env),
            SHELL: binShell,
            GIT_EDITOR: 'true',
            CLAUDECODE: '1',
          },
          timeout: SNAPSHOT_CREATION_TIMEOUT,
          maxBuffer: 1024 * 1024, // 1MB buffer
          encoding: 'utf8',
        },
        // async执行共享工具在此处需要的副作用或外部交互。
        async (error, stdout, stderr) => {
          // 满足 `error` 时，共享工具执行该分支。
          if (error) {
            // execError 错误信息保存`error as Error & {`，供共享工具 Shell Snapshot后续步骤使用。
            const execError = error as Error & {
              killed?: boolean
              signal?: string
              code?: number
            }
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`Shell snapshot creation failed: ${error.message}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`Error details:`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Error code: ${execError?.code}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Error signal: ${execError?.signal}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Error killed: ${execError?.killed}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Shell path: ${binShell}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Config file: ${getConfigFile(binShell)}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Config file exists: ${configFileExists}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Working directory: ${getCwd()}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`  - Claude home: ${getClaudeConfigHomeDir()}`)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`Full snapshot script:\n${snapshotScript}`)
            // 满足 `stdout` 时，共享工具执行该分支。
            if (stdout) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `stdout output (${stdout.length} chars):\n${stdout}`,
              )
            } else {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(`No stdout output captured`)
            }
            // 满足 `stderr` 时，共享工具执行该分支。
            if (stderr) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `stderr output (${stderr.length} chars): ${stderr}`,
              )
            } else {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(`No stderr output captured`)
            }
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(`Failed to create shell snapshot: ${error.message}`),
            )
            // Convert signal name to number if present
            // signalNumber保存`execError?.signal`，供共享工具 Shell Snapshot后续步骤使用。
            const signalNumber = execError?.signal
              ? os.constants.signals[
                  execError.signal as keyof typeof os.constants.signals
                ]
              : undefined
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_shell_snapshot_failed', {
              stderr_length: stderr?.length || 0,
              has_error_code: !!execError?.code,
              error_signal_number: signalNumber,
              error_killed: execError?.killed,
            })
            // resolve执行共享工具在此处需要的副作用或外部交互。
            resolve(undefined)
          } else {
            // snapshotSize先声明占位，稍后的分支会根据实际输入补齐。
            let snapshotSize: number | undefined
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // snapshotSize更新为 `(await stat(shellSnapshotPath)).size`，确保Bash 解析后续读取最新状态。
              snapshotSize = (await stat(shellSnapshotPath)).size
            } catch {
              // Snapshot file not found
            }

            // `snapshotSize` 与 `undefined` 不一致时刷新派生状态。
            if (snapshotSize !== undefined) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Shell snapshot created successfully (${snapshotSize} bytes)`,
              )

              // Register cleanup to remove snapshot on graceful shutdown
              // registerCleanup执行共享工具在此处需要的副作用或外部交互。
              registerCleanup(async () => {
                // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
                try {
                  // 等待 `getFsImplementation().unlink(shellSnapshotPath)` 完成，再继续共享工具 Shell Snapshot的异步流程。
                  await getFsImplementation().unlink(shellSnapshotPath)
                  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `Cleaned up session snapshot: ${shellSnapshotPath}`,
                  )
                } catch (error) {
                  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `Error cleaning up session snapshot: ${error}`,
                  )
                }
              })

              // resolve执行共享工具在此处需要的副作用或外部交互。
              resolve(shellSnapshotPath)
            } else {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Shell snapshot file not found after creation: ${shellSnapshotPath}`,
              )
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Checking if parent directory still exists: ${snapshotsDir}`,
              )
              // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
              try {
                // dirContents 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
                const dirContents =
                  await getFsImplementation().readdir(snapshotsDir)
                // 记录共享工具运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `Directory contains ${dirContents.length} files`,
                )
              } catch {
                // 记录共享工具运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `Parent directory does not exist or is not accessible: ${snapshotsDir}`,
                )
              }
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_shell_unknown_error', {})
              // resolve执行共享工具在此处需要的副作用或外部交互。
              resolve(undefined)
            }
          }
        },
      )
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Unexpected error during snapshot creation: ${error}`)
      // 满足 `error instanceof Error` 时，共享工具执行该分支。
      if (error instanceof Error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Error stack trace: ${error.stack}`)
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_shell_snapshot_error', {})
      // resolve执行共享工具在此处需要的副作用或外部交互。
      resolve(undefined)
    }
  })
}
