// 引入 tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 join as posixJoin，将 path/posix 中已经封装好的能力接到本文件流程里。
import { join as posixJoin } from 'path/posix'
// 引入 getSessionEnvVars，将 ../sessionEnvVars.js 中已经封装好的能力接到本文件流程里。
import { getSessionEnvVars } from '../sessionEnvVars.js'
// 类型依赖 { ShellProvider } 来自 ./shellProvider.js，用于校准共享工具的数据契约。
import type { ShellProvider } from './shellProvider.js'

/**
 * PowerShell invocation flags + command. Shared by the provider's getSpawnArgs
 * and the hook spawn path in hooks.ts so the flag set stays in one place.
 */
// buildPowerShellArgs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildPowerShellArgs(cmd: string): string[] {
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return ['-NoProfile', '-NonInteractive', '-Command', cmd]
}

/**
 * Base64-encode a string as UTF-16LE for PowerShell's -EncodedCommand.
 * Same encoding the parser uses (parser.ts toUtf16LeBase64). The output
 * is [A-Za-z0-9+/=] only — survives ANY shell-quoting layer, including
 * @anthropic-ai/sandbox-runtime's shellquote.quote() which would otherwise
 * corrupt !$? to \!$? when re-wrapping a single-quoted string in double
 * quotes. Review 2964609818.
 */
// encodePowerShellCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function encodePowerShellCommand(psCommand: string): string {
  // 返回 `Buffer.from(psCommand, 'utf16le').toString('base64')`，作为共享工具这次计算的结果。
  return Buffer.from(psCommand, 'utf16le').toString('base64')
}

// createPowerShellProvider 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPowerShellProvider(shellPath: string): ShellProvider {
  // currentSandboxTmpDir 先占位，稍后的条件分支会根据实际输入补齐它。
  let currentSandboxTmpDir: string | undefined

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'powershell' as ShellProvider['type'],
    shellPath,
    detached: false,

    // 共享工具 powershell Provider在这里处理 `async buildExecCommand(`，完成这一小步状态转换。
    async buildExecCommand(
      command: string,
      opts: {
        id: number | string
        sandboxTmpDir?: string
        useSandbox: boolean
      },
    ): Promise<{ commandString: string; cwdFilePath: string }> {
      // Stash sandboxTmpDir for getEnvironmentOverrides (mirrors bashProvider)
      // currentSandboxTmpDir更新为 `opts.useSandbox ? opts.sandboxTmpDir : undefined`，确保共享工具后续读取最新状态。
      currentSandboxTmpDir = opts.useSandbox ? opts.sandboxTmpDir : undefined

      // When sandboxed, tmpdir() is not writable — the sandbox only allows
      // writes to sandboxTmpDir. Put the cwd tracking file there so the
      // inner pwsh can actually write it. Only applies on Linux/macOS/WSL2;
      // on Windows native, sandbox is never enabled so this branch is dead.
      // cwdFilePath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const cwdFilePath =
        opts.useSandbox && opts.sandboxTmpDir
          ? posixJoin(opts.sandboxTmpDir, `claude-pwd-ps-${opts.id}`)
          : join(tmpdir(), `claude-pwd-ps-${opts.id}`)
      // escapedCwdFilePath 路径数据格式化`cwdFilePath.replace`，供共享工具后续处理使用。
      const escapedCwdFilePath = cwdFilePath.replace(/'/g, "''")
      // Exit-code capture: prefer $LASTEXITCODE when a native exe ran.
      // On PS 5.1, a native command that writes to stderr while the stream
      // is PS-redirected (e.g. `git push 2>&1`) sets $? = $false even when
      // the exe returned exit 0 — so `if (!$?)` reports a false positive.
      // $LASTEXITCODE is $null only when no native exe has run in the
      // session; in that case fall back to $? for cmdlet-only pipelines.
      // Tradeoff: `native-ok; cmdlet-fail` now returns 0 (was 1). Reverse
      // is also true: `native-fail; cmdlet-ok` now returns the native
      // exit code (was 0 — old logic only looked at $? which the trailing
      // cmdlet set true). Both rarer than the git/npm/curl stderr case.
      // cwdTracking保存`if`，供共享工具后续处理使用。
      const cwdTracking = `\n; $_ec = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } elseif ($?) { 0 } else { 1 }\n; (Get-Location).Path | Out-File -FilePath '${escapedCwdFilePath}' -Encoding utf8 -NoNewline\n; exit $_ec`
      // psCommand 命令数据保存`command + cwdTracking`，供共享工具 powershell Provider后续步骤使用。
      const psCommand = command + cwdTracking

      // Sandbox wraps the returned commandString as `<binShell> -c '<cmd>'` —
      // hardcoded `-c`, no way to inject -NoProfile -NonInteractive. So for
      // the sandbox path, build a command that itself invokes pwsh with the
      // full flag set. Shell.ts passes /bin/sh as the sandbox binShell,
      // producing: bwrap ... sh -c 'pwsh -NoProfile ... -EncodedCommand ...'.
      // The non-sandbox path returns the bare PS command; getSpawnArgs() adds
      // the flags via buildPowerShellArgs().
      //
      // -EncodedCommand (base64 UTF-16LE), not -Command: the sandbox runtime
      // applies its OWN shellquote.quote() on top of whatever we build. Any
      // string containing ' triggers double-quote mode which escapes ! as \! —
      // POSIX sh preserves that literally, pwsh parse error. Base64 is
      // [A-Za-z0-9+/=] — no chars that any quoting layer can corrupt.
      // Review 2964609818.
      //
      // shellPath is POSIX-single-quoted so a space-containing install path
      // (e.g. /opt/my tools/pwsh) survives the inner `/bin/sh -c` word-split.
      // Flags and base64 are [A-Za-z0-9+/=-] only — no quoting needed.
      // commandString 命令数据 命名 `opts.useSandbox`，让后续代码直接表达这个值的用途。
      const commandString = opts.useSandbox
        ? [
            `'${shellPath.replace(/'/g, `'\\''`)}'`,
            '-NoProfile',
            '-NonInteractive',
            '-EncodedCommand',
            encodePowerShellCommand(psCommand),
          ].join(' ')
        : psCommand

      return { commandString, cwdFilePath }
    },

    getSpawnArgs(commandString: string): string[] {
      return buildPowerShellArgs(commandString)
    },

    async getEnvironmentOverrides(): Promise<Record<string, string>> {
      const env: Record<string, string> = {}
      // Apply session env vars set via /env (child processes only, not
      // the REPL). Without this, `/env PATH=...` affects Bash tool
      // commands but not PowerShell — so PyCharm users with a stripped
      // PATH can't self-rescue.
      // Ordering: session vars FIRST so the sandbox TMPDIR below can't be
      // overridden by `/env TMPDIR=...`. bashProvider.ts has these in the
      // opposite order (pre-existing), but sandbox isolation should win.
      for (const [key, value] of getSessionEnvVars()) {
        env[key] = value
      }
      if (currentSandboxTmpDir) {
        // PowerShell on Linux/macOS honors TMPDIR for [System.IO.Path]::GetTempPath()
        env.TMPDIR = currentSandboxTmpDir
        env.CLAUDE_CODE_TMPDIR = currentSandboxTmpDir
      }
      return env
    },
  }
}
