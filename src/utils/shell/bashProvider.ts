// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { access } from 'fs/promises'
// 引入 tmpdir as osTmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir as osTmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join as nativeJoin } from 'path'
// 引入 join as posixJoin，将 path/posix 中已经封装好的能力接到本文件流程里。
import { join as posixJoin } from 'path/posix'
// 引入 rearrangePipeCommand，将 ../bash/bashPipeCommand.js 中已经封装好的能力接到本文件流程里。
import { rearrangePipeCommand } from '../bash/bashPipeCommand.js'
// 引入 createAndSaveSnapshot，将 ../bash/ShellSnapshot.js 中已经封装好的能力接到本文件流程里。
import { createAndSaveSnapshot } from '../bash/ShellSnapshot.js'
// 引入 formatShellPrefixCommand，将 ../bash/shellPrefix.js 中已经封装好的能力接到本文件流程里。
import { formatShellPrefixCommand } from '../bash/shellPrefix.js'
// 引入 quote，将 ../bash/shellQuote.js 中已经封装好的能力接到本文件流程里。
import { quote } from '../bash/shellQuote.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  quoteShellCommand,
  rewriteWindowsNullRedirect,
  shouldAddStdinRedirect,
} from '../bash/shellQuoting.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'
// 引入 getSessionEnvironmentScript，将 ../sessionEnvironment.js 中已经封装好的能力接到本文件流程里。
import { getSessionEnvironmentScript } from '../sessionEnvironment.js'
// 引入 getSessionEnvVars，将 ../sessionEnvVars.js 中已经封装好的能力接到本文件流程里。
import { getSessionEnvVars } from '../sessionEnvVars.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  ensureSocketInitialized,
  getClaudeTmuxEnv,
  hasTmuxToolBeenUsed,
} from '../tmuxSocket.js'
// 引入 windowsPathToPosixPath，将 ../windowsPaths.js 中已经封装好的能力接到本文件流程里。
import { windowsPathToPosixPath } from '../windowsPaths.js'
// 类型依赖 { ShellProvider } 来自 ./shellProvider.js，用于校准共享工具的数据契约。
import type { ShellProvider } from './shellProvider.js'

/**
 * Returns a shell command to disable extended glob patterns for security.
 * Extended globs (bash extglob, zsh EXTENDED_GLOB) can be exploited via
 * malicious filenames that expand after our security validation.
 *
 * When CLAUDE_CODE_SHELL_PREFIX is set, the actual executing shell may differ
 * from shellPath (e.g., shellPath is zsh but the wrapper runs bash). In this
 * case, we include commands for BOTH shells. We redirect both stdout and stderr
 * to /dev/null because zsh's command_not_found_handler writes to STDOUT.
 *
 * When no shell prefix is set, we use the appropriate command for the detected shell.
 */
// getDisableExtglobCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDisableExtglobCommand(shellPath: string): string | null {
  // When CLAUDE_CODE_SHELL_PREFIX is set, the wrapper may use a different shell
  // than shellPath, so we include both bash and zsh commands
  // 满足 `process.env.CLAUDE_CODE_SHELL_PREFIX` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_SHELL_PREFIX) {
    // Redirect both stdout and stderr because zsh's command_not_found_handler
    // writes to stdout instead of stderr
    // 返回 `'{ shopt -u extglob || setopt NO_EXTENDED_GLOB; } >/dev/null 2>&1 || tr...`，作为共享工具这次计算的结果。
    return '{ shopt -u extglob || setopt NO_EXTENDED_GLOB; } >/dev/null 2>&1 || true'
  }

  // No shell prefix - use shell-specific command
  // 满足 `shellPath.includes('bash')` 时，共享工具执行该分支。
  if (shellPath.includes('bash')) {
    // 返回 `'shopt -u extglob 2>/dev/null || true'`，作为共享工具这次计算的结果。
    return 'shopt -u extglob 2>/dev/null || true'
  // 共享工具 bash Provider在这里处理 `} else if (shellPath.includes('zsh')) {`，完成这一小步状态转换。
  } else if (shellPath.includes('zsh')) {
    // 返回 `'setopt NO_EXTENDED_GLOB 2>/dev/null || true'`，作为共享工具这次计算的结果。
    return 'setopt NO_EXTENDED_GLOB 2>/dev/null || true'
  }
  // Unknown shell - do nothing, we don't know the right command
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// createBashShellProvider 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createBashShellProvider(
  shellPath: string,
  options?: { skipSnapshot?: boolean },
): Promise<ShellProvider> {
  // currentSandboxTmpDir 先占位，稍后的条件分支会根据实际输入补齐它。
  let currentSandboxTmpDir: string | undefined
  // snapshotPromise 异步任务 命名 `options?.skipSnapshot`，让后续代码直接表达这个值的用途。
  const snapshotPromise: Promise<string | undefined> = options?.skipSnapshot
    ? Promise.resolve(undefined)
    // 这个回调绑定到 : createAndSaveSnapshot(shellPath).catch(error => {，负责共享工具在该局部场景下的响应。
    : createAndSaveSnapshot(shellPath).catch(error => {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to create shell snapshot: ${error}`)
        // 返回 `undefined`，作为共享工具这次计算的结果。
        return undefined
      })
  // Track the last resolved snapshot path for use in getSpawnArgs
  // lastSnapshotFilePath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastSnapshotFilePath: string | undefined

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'bash',
    shellPath,
    detached: true,

    // 共享工具 bash Provider在这里处理 `async buildExecCommand(`，完成这一小步状态转换。
    async buildExecCommand(
      command: string,
      opts: {
        id: number | string
        sandboxTmpDir?: string
        useSandbox: boolean
      },
    ): Promise<{ commandString: string; cwdFilePath: string }> {
      // snapshotFilePath 路径数据 等待 `snapshotPromise`，确保继续执行前已有结果。
      let snapshotFilePath = await snapshotPromise
      // This access() check is NOT pure TOCTOU — it's the fallback decision
      // point for getSpawnArgs. When the snapshot disappears mid-session
      // (tmpdir cleanup), we must clear lastSnapshotFilePath so getSpawnArgs
      // adds -l and the command gets login-shell init. Without this check,
      // `source ... || true` silently fails and commands run with NO shell
      // init (neither snapshot env nor login profile). The `|| true` on source
      // still guards the race between this check and the spawned shell.
      // 满足 `snapshotFilePath` 时，共享工具执行该分支。
      if (snapshotFilePath) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `access(snapshotFilePath)` 完成，再继续共享工具 bash Provider的异步流程。
          await access(snapshotFilePath)
        } catch {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Snapshot file missing, falling back to login shell: ${snapshotFilePath}`,
          )
          // snapshotFilePath 路径数据更新为 `undefined`，确保共享工具后续读取最新状态。
          snapshotFilePath = undefined
        }
      }
      // lastSnapshotFilePath 路径数据更新为 `snapshotFilePath`，确保共享工具后续读取最新状态。
      lastSnapshotFilePath = snapshotFilePath

      // Stash sandboxTmpDir for use in getEnvironmentOverrides
      // currentSandboxTmpDir更新为 `opts.sandboxTmpDir`，确保共享工具后续读取最新状态。
      currentSandboxTmpDir = opts.sandboxTmpDir

      // tmpdir保存`osTmpdir`，供共享工具后续处理使用。
      const tmpdir = osTmpdir()
      // isWindows 集合记录 `getPlatform` 是否成立，共享工具随后按该结果分支。
      const isWindows = getPlatform() === 'windows'
      // shellTmpdir保存`windowsPathToPosixPath`，供共享工具后续处理使用。
      const shellTmpdir = isWindows ? windowsPathToPosixPath(tmpdir) : tmpdir

      // shellCwdFilePath: POSIX path used inside the bash command (pwd -P >| ...)
      // cwdFilePath: native OS path used by Node.js for readFileSync/unlinkSync
      // On non-Windows these are identical; on Windows, Git Bash needs POSIX paths
      // but Node.js needs native Windows paths for file operations.
      // shellCwdFilePath 路径数据 命名 `opts.useSandbox`，让后续代码直接表达这个值的用途。
      const shellCwdFilePath = opts.useSandbox
        ? posixJoin(opts.sandboxTmpDir!, `cwd-${opts.id}`)
        : posixJoin(shellTmpdir, `claude-${opts.id}-cwd`)
      // cwdFilePath 路径数据保存`opts.useSandbox`，供后续判断或组装使用。
      const cwdFilePath = opts.useSandbox
        ? posixJoin(opts.sandboxTmpDir!, `cwd-${opts.id}`)
        : nativeJoin(tmpdir, `claude-${opts.id}-cwd`)

      // Defensive rewrite: the model sometimes emits Windows CMD-style `2>nul`
      // redirects. In POSIX bash (including Git Bash on Windows), this creates a
      // literal file named `nul` — a reserved device name that breaks git.
      // See anthropics/claude-code#4928.
      // normalizedCommand 命令数据保存`rewriteWindowsNullRedirect`，供共享工具后续处理使用。
      const normalizedCommand = rewriteWindowsNullRedirect(command)
      // addStdinRedirect保存`shouldAddStdinRedirect`，供共享工具后续处理使用。
      const addStdinRedirect = shouldAddStdinRedirect(normalizedCommand)
      // quotedCommand 命令数据保存`quoteShellCommand`，供共享工具后续处理使用。
      let quotedCommand = quoteShellCommand(normalizedCommand, addStdinRedirect)

      // Debug logging for heredoc/multiline commands to trace trailer handling
      // Only log when commit attribution is enabled to avoid noise
      // 共享工具在这里按实际状态进入对应分支。
      if (
        feature('COMMIT_ATTRIBUTION') &&
        (command.includes('<<') || command.includes('\n'))
      ) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Shell: Command before quoting (first 500 chars):\n${command.slice(0, 500)}`,
        )
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Shell: Quoted command (first 500 chars):\n${quotedCommand.slice(0, 500)}`,
        )
      }

      // Special handling for pipes: move stdin redirect after first command
      // This ensures the redirect applies to the first command, not to eval itself.
      // Without this, `eval 'rg foo | wc -l' \< /dev/null` becomes
      // `rg foo | wc -l < /dev/null` — wc reads /dev/null and outputs 0, and
      // rg (with no path arg) waits on the open spawn stdin pipe forever.
      // Applies to sandbox mode too: sandbox wraps the assembled commandString,
      // not the raw command (since PR #9189).
      // 只有 `normalizedCommand.includes('|') && addStdinRedirect` 满足时，共享工具才执行该分支。
      if (normalizedCommand.includes('|') && addStdinRedirect) {
        // quotedCommand 命令数据更新为 `rearrangePipeCommand(normalizedCommand)`，确保共享工具后续读取最新状态。
        quotedCommand = rearrangePipeCommand(normalizedCommand)
      }

      // commandParts 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const commandParts: string[] = []

      // Source the snapshot file. The `|| true` guards the race between the
      // access() check above and the spawned shell's `source` — if the file
      // vanishes in that window, the `&&` chain still continues.
      // 满足 `snapshotFilePath` 时，共享工具执行该分支。
      if (snapshotFilePath) {
        // finalPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const finalPath =
          getPlatform() === 'windows'
            ? windowsPathToPosixPath(snapshotFilePath)
            : snapshotFilePath
        // commandParts 命令数据追加新条目，保持收集顺序与输入顺序一致。
        commandParts.push(`source ${quote([finalPath])} 2>/dev/null || true`)
      }

      // Source session environment variables captured from session start hooks
      // sessionEnvScript 会话数据读取`getSessionEnvironmentScript`，供共享工具后续处理使用。
      const sessionEnvScript = await getSessionEnvironmentScript()
      // 满足 `sessionEnvScript` 时，共享工具执行该分支。
      if (sessionEnvScript) {
        // commandParts 命令数据追加新条目，保持收集顺序与输入顺序一致。
        commandParts.push(sessionEnvScript)
      }

      // Disable extended glob patterns for security (after sourcing user config to override)
      // disableExtglobCmd 命令数据读取`getDisableExtglobCommand`，供共享工具后续处理使用。
      const disableExtglobCmd = getDisableExtglobCommand(shellPath)
      // 满足 `disableExtglobCmd` 时，共享工具执行该分支。
      if (disableExtglobCmd) {
        // commandParts 命令数据追加新条目，保持收集顺序与输入顺序一致。
        commandParts.push(disableExtglobCmd)
      }

      // When sourcing a file with aliases, they won't be expanded in the same command line
      // because the shell parses the entire line before execution. Using eval after
      // sourcing causes a second parsing pass where aliases are now available for expansion.
      // commandParts 命令数据追加新条目，保持收集顺序与输入顺序一致。
      commandParts.push(`eval ${quotedCommand}`)
      // Use `pwd -P` to get the physical path of the current working directory for consistency with `process.cwd()`
      // commandParts 命令数据追加新条目，保持收集顺序与输入顺序一致。
      commandParts.push(`pwd -P >| ${quote([shellCwdFilePath])}`)
      // commandString 命令数据格式化`commandParts.join`，供共享工具后续处理使用。
      let commandString = commandParts.join(' && ')

      // Apply CLAUDE_CODE_SHELL_PREFIX if set
      // 满足 `process.env.CLAUDE_CODE_SHELL_PREFIX` 时，共享工具执行该分支。
      if (process.env.CLAUDE_CODE_SHELL_PREFIX) {
        // commandString 命令数据更新为 `formatShellPrefixCommand(`，确保共享工具后续读取最新状态。
        commandString = formatShellPrefixCommand(
          process.env.CLAUDE_CODE_SHELL_PREFIX,
          commandString,
        )
      }

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { commandString, cwdFilePath }
    },

    // getSpawnArgs 根据 commandString: string 读取或计算共享工具需要的结果。
    getSpawnArgs(commandString: string): string[] {
      // skipLoginShell标记共享工具 bash Provider是否启用对应路径。
      const skipLoginShell = lastSnapshotFilePath !== undefined
      // 满足 `skipLoginShell` 时，共享工具执行该分支。
      if (skipLoginShell) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Spawning shell without login (-l flag skipped)')
      }
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return ['-c', ...(skipLoginShell ? [] : ['-l']), commandString]
    },

    // 共享工具 bash Provider在这里处理 `async getEnvironmentOverrides(`，完成这一小步状态转换。
    async getEnvironmentOverrides(
      command: string,
    ): Promise<Record<string, string>> {
      // TMUX SOCKET ISOLATION (DEFERRED):
      // We initialize Claude's tmux socket ONLY AFTER the Tmux tool has been used
      // at least once, OR if the current command appears to use tmux.
      // This defers the startup cost until tmux is actually needed.
      //
      // Once the Tmux tool is used (or a tmux command runs), all subsequent Bash
      // commands will use Claude's isolated socket via the TMUX env var override.
      //
      // See tmuxSocket.ts for the full isolation architecture documentation.
      // commandUsesTmux 命令数据筛选`command.includes`，供共享工具后续处理使用。
      const commandUsesTmux = command.includes('tmux')
      // 共享工具在这里按实际状态进入对应分支。
      if (
        process.env.USER_TYPE === 'ant' &&
        (hasTmuxToolBeenUsed() || commandUsesTmux)
      ) {
        // 等待 `ensureSocketInitialized()` 完成，再继续共享工具 bash Provider的异步流程。
        await ensureSocketInitialized()
      }
      // claudeTmuxEnv读取`getClaudeTmuxEnv`，供共享工具后续处理使用。
      const claudeTmuxEnv = getClaudeTmuxEnv()
      // env 从空对象开始收集键值，后续按名称补齐内容。
      const env: Record<string, string> = {}
      // CRITICAL: Override TMUX to isolate ALL tmux commands to Claude's socket.
      // This is NOT the user's TMUX value - it points to Claude's isolated socket.
      // When null (before socket initializes), user's TMUX is preserved.
      // 满足 `claudeTmuxEnv` 时，共享工具执行该分支。
      if (claudeTmuxEnv) {
        // TMUX更新为 `claudeTmuxEnv`，确保共享工具后续读取最新状态。
        env.TMUX = claudeTmuxEnv
      }
      // 满足 `currentSandboxTmpDir` 时，共享工具执行该分支。
      if (currentSandboxTmpDir) {
        // posixTmpDir保存`currentSandboxTmpDir`，供共享工具 bash Provider后续判断或输出使用。
        let posixTmpDir = currentSandboxTmpDir
        // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
        if (getPlatform() === 'windows') {
          // posixTmpDir更新为 `windowsPathToPosixPath(posixTmpDir)`，确保共享工具后续读取最新状态。
          posixTmpDir = windowsPathToPosixPath(posixTmpDir)
        }
        // TMPDIR更新为 `posixTmpDir`，确保共享工具后续读取最新状态。
        env.TMPDIR = posixTmpDir
        // CLAUDE_CODE_TMPDIR更新为 `posixTmpDir`，确保共享工具后续读取最新状态。
        env.CLAUDE_CODE_TMPDIR = posixTmpDir
        // Zsh uses TMPPREFIX (default /tmp/zsh) for heredoc temp files,
        // not TMPDIR. Set it to a path inside the sandbox tmp dir so
        // heredocs work in sandboxed zsh commands.
        // Safe to set unconditionally — non-zsh shells ignore TMPPREFIX.
        // TMPPREFIX更新为 `posixJoin(posixTmpDir, 'zsh')`，确保共享工具后续读取最新状态。
        env.TMPPREFIX = posixJoin(posixTmpDir, 'zsh')
      }
      // Apply session env vars set via /env (child processes only, not the REPL)
      // 循环处理 `const [key, value] of getSessionEnvVars()`，让共享工具把同类条目按顺序走完。
      for (const [key, value] of getSessionEnvVars()) {
        // env[key更新为 `value`，确保共享工具 bash Provider后续读取最新状态。
        env[key] = value
      }
      // 返回 `env`，作为共享工具这次计算的结果。
      return env
    },
  }
}
