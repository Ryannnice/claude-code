// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFileSync, spawn } from 'child_process'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { constants as fsConstants, readFileSync, unlinkSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { type FileHandle, mkdir, open, realpath } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, resolve } from 'path'
// 引入 join as posixJoin，将 path/posix 中已经封装好的能力接到本文件流程里。
import { join as posixJoin } from 'path/posix'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getOriginalCwd,
  getSessionId,
  setCwdState,
} from '../bootstrap/state.js'
// 引入 generateTaskId，将 ../Task.js 中已经封装好的能力接到本文件流程里。
import { generateTaskId } from '../Task.js'
// 引入 pwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { pwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 errorMessage、isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isENOENT } from './errors.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createAbortedCommand,
  createFailedCommand,
  type ShellCommand,
  wrapSpawn,
} from './ShellCommand.js'
// 引入 getTaskOutputDir，将 ./task/diskOutput.js 中已经封装好的能力接到本文件流程里。
import { getTaskOutputDir } from './task/diskOutput.js'
// 引入 TaskOutput，将 ./task/TaskOutput.js 中已经封装好的能力接到本文件流程里。
import { TaskOutput } from './task/TaskOutput.js'
// 引入 which，将 ./which.js 中已经封装好的能力接到本文件流程里。
import { which } from './which.js'

// 导出类型定义，让其他模块沿用共享工具 Shell的数据契约。
export type { ExecResult } from './ShellCommand.js'

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { accessSync } from 'fs'
// 引入 onCwdChangedForHooks，将 ./hooks/fileChangedWatcher.js 中已经封装好的能力接到本文件流程里。
import { onCwdChangedForHooks } from './hooks/fileChangedWatcher.js'
// 引入 getClaudeTempDirName，将 ./permissions/filesystem.js 中已经封装好的能力接到本文件流程里。
import { getClaudeTempDirName } from './permissions/filesystem.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 SandboxManager，将 ./sandbox/sandbox-adapter.js 中已经封装好的能力接到本文件流程里。
import { SandboxManager } from './sandbox/sandbox-adapter.js'
// 引入 invalidateSessionEnvCache，将 ./sessionEnvironment.js 中已经封装好的能力接到本文件流程里。
import { invalidateSessionEnvCache } from './sessionEnvironment.js'
// 引入 createBashShellProvider，将 ./shell/bashProvider.js 中已经封装好的能力接到本文件流程里。
import { createBashShellProvider } from './shell/bashProvider.js'
// 引入 getCachedPowerShellPath，将 ./shell/powershellDetection.js 中已经封装好的能力接到本文件流程里。
import { getCachedPowerShellPath } from './shell/powershellDetection.js'
// 引入 createPowerShellProvider，将 ./shell/powershellProvider.js 中已经封装好的能力接到本文件流程里。
import { createPowerShellProvider } from './shell/powershellProvider.js'
// 类型依赖 { ShellProvider, ShellType } 来自 ./shell/shellProvider.js，用于校准共享工具的数据契约。
import type { ShellProvider, ShellType } from './shell/shellProvider.js'
// 引入 subprocessEnv，将 ./subprocessEnv.js 中已经封装好的能力接到本文件流程里。
import { subprocessEnv } from './subprocessEnv.js'
// 引入 posixPathToWindowsPath，将 ./windowsPaths.js 中已经封装好的能力接到本文件流程里。
import { posixPathToWindowsPath } from './windowsPaths.js'

// DEFAULT_TIMEOUT 命名 `30 * 60 * 1000 // 30 minutes`，让后续代码直接表达这个值的用途。
const DEFAULT_TIMEOUT = 30 * 60 * 1000 // 30 minutes

// ShellConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellConfig = {
  provider: ShellProvider
}

// isExecutable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isExecutable(shellPath: string): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 accessSync，触发共享工具此处需要的副作用。
    accessSync(shellPath, fsConstants.X_OK)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (_err) {
    // Fallback for Nix and other environments where X_OK check might fail
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Try to execute the shell with --version, which should exit quickly
      // Use execFileSync to avoid shell injection vulnerabilities
      // 调用 execFileSync，触发共享工具此处需要的副作用。
      execFileSync(shellPath, ['--version'], {
        timeout: 1000,
        stdio: 'ignore',
      })
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }
}

/**
 * Determines the best available shell to use.
 */
// findSuitableShell 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findSuitableShell(): Promise<string> {
  // Check for explicit shell override first
  // shellOverride 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const shellOverride = process.env.CLAUDE_CODE_SHELL
  // 满足 `shellOverride` 时，共享工具执行该分支。
  if (shellOverride) {
    // Validate it's a supported shell type
    // isSupported 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isSupported =
      shellOverride.includes('bash') || shellOverride.includes('zsh')
    // 只有 `isSupported && isExecutable(shellOverride)` 满足时，共享工具才执行该分支。
    if (isSupported && isExecutable(shellOverride)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Using shell override: ${shellOverride}`)
      // 返回 `shellOverride`，作为共享工具这次计算的结果。
      return shellOverride
    } else {
      // Note, if we ever want to add support for new shells here we'll need to update or Bash tool parsing to account for this
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CLAUDE_CODE_SHELL="${shellOverride}" is not a valid bash/zsh path, falling back to detection`,
      )
    }
  }

  // Check user's preferred shell from environment
  // env_shell 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const env_shell = process.env.SHELL
  // Only consider SHELL if it's bash or zsh
  // isEnvShellSupported 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isEnvShellSupported =
    env_shell && (env_shell.includes('bash') || env_shell.includes('zsh'))
  // preferBash筛选`includes`，供共享工具后续处理使用。
  const preferBash = env_shell?.includes('bash')

  // Try to locate shells using which (uses Bun.which when available)
  // 并行获取 zshPath、bashPath，缩短共享工具 Shell等待多个独立异步任务的时间。
  const [zshPath, bashPath] = await Promise.all([which('zsh'), which('bash')])

  // Populate shell paths from which results and fallback locations
  // shellPaths 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
  const shellPaths = ['/bin', '/usr/bin', '/usr/local/bin', '/opt/homebrew/bin']

  // Order shells based on user preference
  // shellOrder保存`preferBash ? ['bash', 'zsh'] : ['zsh', 'bash']`，供共享工具 Shell后续判断或输出使用。
  const shellOrder = preferBash ? ['bash', 'zsh'] : ['zsh', 'bash']
  // supportedShells 集合派生`shellOrder.flatMap`，供共享工具后续处理使用。
  const supportedShells = shellOrder.flatMap(shell =>
    // 调用 shellPaths.map，触发共享工具此处需要的副作用。
    shellPaths.map(path => `${path}/${shell}`),
  )

  // Add discovered paths to the beginning of our search list
  // Put the user's preferred shell type first
  // 满足 `preferBash` 时，共享工具执行该分支。
  if (preferBash) {
    // 满足 `bashPath) supportedShells.unshift(bashPath` 时，共享工具执行该分支。
    if (bashPath) supportedShells.unshift(bashPath)
    // 满足 `zshPath) supportedShells.push(zshPath` 时，共享工具执行该分支。
    if (zshPath) supportedShells.push(zshPath)
  } else {
    // 满足 `zshPath) supportedShells.unshift(zshPath` 时，共享工具执行该分支。
    if (zshPath) supportedShells.unshift(zshPath)
    // 满足 `bashPath) supportedShells.push(bashPath` 时，共享工具执行该分支。
    if (bashPath) supportedShells.push(bashPath)
  }

  // Always prioritize SHELL env variable if it's a supported shell type
  // 只有 `isEnvShellSupported && isExecutable(env_shell)` 满足时，共享工具才执行该分支。
  if (isEnvShellSupported && isExecutable(env_shell)) {
    // 调用 supportedShells.unshift，触发共享工具此处需要的副作用。
    supportedShells.unshift(env_shell)
  }

  // shellPath 路径数据筛选`supportedShells.find`，供共享工具后续处理使用。
  const shellPath = supportedShells.find(shell => shell && isExecutable(shell))

  // If no valid shell found, throw a helpful error
  // shellPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!shellPath) {
    // errorMsg 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const errorMsg =
      'No suitable shell found. Claude CLI requires a Posix shell environment. ' +
      'Please ensure you have a valid shell installed and the SHELL environment variable set.'
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(errorMsg))
    // 抛出 new Error(errorMsg)，阻止共享工具在无效状态下继续运行。
    throw new Error(errorMsg)
  }

  // 返回 `shellPath`，作为共享工具这次计算的结果。
  return shellPath
}

// getShellConfigImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getShellConfigImpl(): Promise<ShellConfig> {
  // binShell筛选`findSuitableShell`，供共享工具后续处理使用。
  const binShell = await findSuitableShell()
  // provider构建`createBashShellProvider`，供共享工具后续处理使用。
  const provider = await createBashShellProvider(binShell)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { provider }
}

// Memoize the entire shell config so it only happens once per session
// getShellConfig 配置保存`memoize`，供共享工具后续处理使用。
export const getShellConfig = memoize(getShellConfigImpl)

// getPsProvider保存`memoize`，供共享工具后续处理使用。
export const getPsProvider = memoize(async (): Promise<ShellProvider> => {
  // psPath 路径数据读取`getCachedPowerShellPath`，供共享工具后续处理使用。
  const psPath = await getCachedPowerShellPath()
  // psPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!psPath) {
    // 抛出 new Error('PowerShell is not available')，阻止共享工具在无效状态下继续运行。
    throw new Error('PowerShell is not available')
  }
  // 返回 `createPowerShellProvider(psPath)`，作为共享工具这次计算的结果。
  return createPowerShellProvider(psPath)
})

// 这个回调绑定到 const resolveProvider: Record<ShellType, () => Promise<ShellProvider>> = {，负责共享工具在该局部场景下的响应。
const resolveProvider: Record<ShellType, () => Promise<ShellProvider>> = {
  // 这个回调绑定到 bash: async () => (await getShellConfig()).provider,，负责共享工具在该局部场景下的响应。
  bash: async () => (await getShellConfig()).provider,
  powershell: getPsProvider,
}

// ExecOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExecOptions = {
  timeout?: number
  onProgress?: (
    lastLines: string,
    allLines: string,
    totalLines: number,
    totalBytes: number,
    isIncomplete: boolean,
  ) => void
  preventCwdChanges?: boolean
  shouldUseSandbox?: boolean
  shouldAutoBackground?: boolean
  /** When provided, stdout is piped (not sent to file) and this callback fires on each data chunk. */
  // 这个回调绑定到 onStdout?: (data: string) => void，负责共享工具在该局部场景下的响应。
  onStdout?: (data: string) => void
}

/**
 * Execute a shell command using the environment snapshot
 * Creates a new shell process for each command execution
 */
// exec 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function exec(
  command: string,
  abortSignal: AbortSignal,
  shellType: ShellType,
  options?: ExecOptions,
): Promise<ShellCommand> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    timeout,
    onProgress,
    preventCwdChanges,
    shouldUseSandbox,
    shouldAutoBackground,
    onStdout,
  } = options ?? {}
  // commandTimeout 命令数据标记共享工具 Shell是否启用对应路径。
  const commandTimeout = timeout || DEFAULT_TIMEOUT

  // provider 等待 `resolveProvider[shellType]()`，确保继续执行前已有结果。
  const provider = await resolveProvider[shellType]()

  // 标识符保存`Math.floor`，供共享工具后续处理使用。
  const id = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .padStart(4, '0')

  // Sandbox temp directory - use per-user directory name to prevent multi-user permission conflicts
  // sandboxTmpDir保存`posixJoin`，供共享工具后续处理使用。
  const sandboxTmpDir = posixJoin(
    process.env.CLAUDE_CODE_TMPDIR || '/tmp',
    getClaudeTempDirName(),
  )

  // 共享工具 Shell先整理这一处局部数据，后续分支可以直接读取。
  const { commandString: builtCommand, cwdFilePath } =
    await provider.buildExecCommand(command, {
      id,
      sandboxTmpDir: shouldUseSandbox ? sandboxTmpDir : undefined,
      useSandbox: shouldUseSandbox ?? false,
    })

  // commandString 命令数据保存`builtCommand`，供后续判断或组装使用。
  let commandString = builtCommand

  // cwd保存`pwd`，供共享工具后续处理使用。
  let cwd = pwd()

  // Recover if the current working directory no longer exists on disk.
  // This can happen when a command deletes its own CWD (e.g., temp dir cleanup).
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `realpath(cwd)` 完成，再继续共享工具 Shell的异步流程。
    await realpath(cwd)
  } catch {
    // fallback读取`getOriginalCwd`，供共享工具后续处理使用。
    const fallback = getOriginalCwd()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Shell CWD "${cwd}" no longer exists, recovering to "${fallback}"`,
    )
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `realpath(fallback)` 完成，再继续共享工具 Shell的异步流程。
      await realpath(fallback)
      // setCwdState 写入新的状态值，使共享工具后续读取保持一致。
      setCwdState(fallback)
      // cwd更新为 `fallback`，确保共享工具后续读取最新状态。
      cwd = fallback
    } catch {
      // 返回 `createFailedCommand(`，作为共享工具这次计算的结果。
      return createFailedCommand(
        `Working directory "${cwd}" no longer exists. Please restart Claude from an existing directory.`,
      )
    }
  }

  // If already aborted, don't spawn the process at all
  // 满足 `abortSignal.aborted` 时，共享工具执行该分支。
  if (abortSignal.aborted) {
    // 返回 `createAbortedCommand()`，作为共享工具这次计算的结果。
    return createAbortedCommand()
  }

  // binShell保存`provider.shellPath`，供后续判断或组装使用。
  const binShell = provider.shellPath

  // Sandboxed PowerShell: wrapWithSandbox hardcodes `<binShell> -c '<cmd>'` —
  // using pwsh there would lose -NoProfile -NonInteractive (profile load
  // inside sandbox → delays, stray output, may hang on prompts). Instead:
  //   • powershellProvider.buildExecCommand (useSandbox) pre-wraps as
  //     `pwsh -NoProfile -NonInteractive -EncodedCommand <base64>` — base64
  //     survives the runtime's shellquote.quote() layer
  //   • pass /bin/sh as the sandbox's inner shell to exec that invocation
  //   • outer spawn is also /bin/sh -c to parse the runtime's POSIX output
  // /bin/sh exists on every platform where sandbox is supported.
  // isSandboxedPowerShell标记共享工具 Shell是否启用对应路径。
  const isSandboxedPowerShell = shouldUseSandbox && shellType === 'powershell'
  // sandboxBinShell 命名 `isSandboxedPowerShell ? '/bin/sh' : binShell`，让后续代码直接表达这个值的用途。
  const sandboxBinShell = isSandboxedPowerShell ? '/bin/sh' : binShell

  // 满足 `shouldUseSandbox` 时，共享工具执行该分支。
  if (shouldUseSandbox) {
    // commandString 命令数据更新为 `await SandboxManager.wrapWithSandbox(`，确保共享工具后续读取最新状态。
    commandString = await SandboxManager.wrapWithSandbox(
      commandString,
      sandboxBinShell,
      undefined,
      abortSignal,
    )
    // Create sandbox temp directory for sandboxed processes with secure permissions
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
      const fs = getFsImplementation()
      // 等待 `fs.mkdir(sandboxTmpDir, { mode: 0o700 })` 完成，再继续共享工具 Shell的异步流程。
      await fs.mkdir(sandboxTmpDir, { mode: 0o700 })
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to create ${sandboxTmpDir} directory: ${error}`)
    }
  }

  // spawnBinary保存`isSandboxedPowerShell ? '/bin/sh' : binShell`，供共享工具 Shell后续判断或输出使用。
  const spawnBinary = isSandboxedPowerShell ? '/bin/sh' : binShell
  // shellArgs 集合 命名 `isSandboxedPowerShell`，让后续代码直接表达这个值的用途。
  const shellArgs = isSandboxedPowerShell
    ? ['-c', commandString]
    : provider.getSpawnArgs(commandString)
  // envOverrides 集合读取`provider.getEnvironmentOverrides`，供共享工具后续处理使用。
  const envOverrides = await provider.getEnvironmentOverrides(command)

  // When onStdout is provided, use pipe mode: stdout flows through
  // StreamWrapper → TaskOutput in-memory buffer instead of a file fd.
  // This lets callers receive real-time stdout callbacks.
  // usePipeMode标记共享工具 Shell是否启用对应路径。
  const usePipeMode = !!onStdout
  // taskId保存`generateTaskId`，供共享工具后续处理使用。
  const taskId = generateTaskId('local_bash')
  // taskOutput保存`TaskOutput`，供共享工具后续处理使用。
  const taskOutput = new TaskOutput(taskId, onProgress ?? null, !usePipeMode)
  // 等待 `mkdir(getTaskOutputDir(), { recursive: true })` 完成，再继续共享工具 Shell的异步流程。
  await mkdir(getTaskOutputDir(), { recursive: true })

  // In file mode, both stdout and stderr go to the same file fd.
  // On POSIX, O_APPEND makes each write atomic (seek-to-end + write), so
  // stdout and stderr are interleaved chronologically without tearing.
  // On Windows, 'a' mode strips FILE_WRITE_DATA (only grants FILE_APPEND_DATA)
  // via libuv's fs__open. MSYS2/Cygwin probes inherited handles with
  // NtQueryInformationFile(FileAccessInformation) and treats handles without
  // FILE_WRITE_DATA as read-only, silently discarding all output. Using 'w'
  // grants FILE_GENERIC_WRITE. Atomicity is preserved because duplicated
  // handles share the same FILE_OBJECT with FILE_SYNCHRONOUS_IO_NONALERT,
  // which serializes all I/O through a single kernel lock.
  // SECURITY: O_NOFOLLOW prevents symlink-following attacks from the sandbox.
  // On Windows, use string flags — numeric flags can produce EINVAL through libuv.
  // outputHandle 先占位，稍后的条件分支会根据实际输入补齐它。
  let outputHandle: FileHandle | undefined
  // usePipeMode缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!usePipeMode) {
    // O_NOFOLLOW保存`fsConstants.O_NOFOLLOW ?? 0`，供共享工具 Shell后续判断或输出使用。
    const O_NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0
    // outputHandle更新为 `await open(`，确保共享工具后续读取最新状态。
    outputHandle = await open(
      taskOutput.path,
      process.platform === 'win32'
        ? 'w'
        : fsConstants.O_WRONLY |
            fsConstants.O_CREAT |
            fsConstants.O_APPEND |
            O_NOFOLLOW,
    )
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // childProcess 集合保存`spawn`，供共享工具后续处理使用。
    const childProcess = spawn(spawnBinary, shellArgs, {
      env: {
        ...subprocessEnv(),
        SHELL: shellType === 'bash' ? binShell : undefined,
        GIT_EDITOR: 'true',
        CLAUDECODE: '1',
        ...envOverrides,
        ...(process.env.USER_TYPE === 'ant'
          ? {
              CLAUDE_CODE_SESSION_ID: getSessionId(),
            }
          : {}),
      },
      cwd,
      stdio: usePipeMode
        ? ['pipe', 'pipe', 'pipe']
        : ['pipe', outputHandle?.fd, outputHandle?.fd],
      // Don't pass the signal - we'll handle termination ourselves with tree-kill
      detached: provider.detached,
      // Prevent visible console window on Windows (no-op on other platforms)
      windowsHide: true,
    })

    // shellCommand 命令数据保存`wrapSpawn`，供共享工具后续处理使用。
    const shellCommand = wrapSpawn(
      childProcess,
      abortSignal,
      commandTimeout,
      taskOutput,
      shouldAutoBackground,
    )

    // Close our copy of the fd — the child has its own dup.
    // Must happen after wrapSpawn attaches 'error' listener, since the await
    // yields and the child's ENOENT 'error' event can fire in that window.
    // Wrapped in its own try/catch so a close failure (e.g. EIO) doesn't fall
    // through to the spawn-failure catch block, which would orphan the child.
    // `outputHandle` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (outputHandle !== undefined) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `outputHandle.close()` 完成，再继续共享工具 Shell的异步流程。
        await outputHandle.close()
      } catch {
        // fd may already be closed by the child; safe to ignore
      }
    }

    // In pipe mode, attach the caller's callbacks alongside StreamWrapper.
    // Both listeners receive the same data chunks (Node.js ReadableStream supports
    // multiple 'data' listeners). StreamWrapper feeds TaskOutput for persistence;
    // these callbacks give the caller real-time access.
    // 只有 `childProcess.stdout && onStdout` 满足时，共享工具才执行该分支。
    if (childProcess.stdout && onStdout) {
      // 调用 childProcess.stdout.on，触发共享工具此处需要的副作用。
      childProcess.stdout.on('data', (chunk: string | Buffer) => {
        // 调用 onStdout，触发共享工具此处需要的副作用。
        onStdout(typeof chunk === 'string' ? chunk : chunk.toString())
      })
    }

    // Attach cleanup to the command result
    // NOTE: readFileSync/unlinkSync are intentional here — these must complete
    // synchronously within the .then() microtask so that callers who
    // `await shellCommand.result` see the updated cwd immediately after.
    // Using async readFile would introduce a microtask boundary, causing
    // a race where cwd hasn't been updated yet when the caller continues.

    // On Windows, cwdFilePath is a POSIX path (for bash's `pwd -P >| $path`),
    // but Node.js needs a native Windows path for readFileSync/unlinkSync.
    // Similarly, `pwd -P` outputs a POSIX path that must be converted before setCwd.
    // nativeCwdFilePath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const nativeCwdFilePath =
      getPlatform() === 'windows'
        ? posixPathToWindowsPath(cwdFilePath)
        : cwdFilePath

    // 这个回调绑定到 void shellCommand.result.then(async result => {，负责共享工具在该局部场景下的响应。
    void shellCommand.result.then(async result => {
      // On Linux, bwrap creates 0-byte mount-point files on the host to deny
      // writes to non-existent paths (.bashrc, HEAD, etc.). These persist after
      // bwrap exits as ghost dotfiles in cwd. Cleanup is synchronous and a no-op
      // on macOS. Keep before any await so callers awaiting .result see a clean
      // working tree in the same microtask.
      // 满足 `shouldUseSandbox` 时，共享工具执行该分支。
      if (shouldUseSandbox) {
        // 调用 SandboxManager.cleanupAfterCommand，触发共享工具此处需要的副作用。
        SandboxManager.cleanupAfterCommand()
      }
      // Only foreground tasks update the cwd
      // 只有 `result && !preventCwdChanges && !result.backgroun` 满足时，共享工具才执行该分支。
      if (result && !preventCwdChanges && !result.backgroundTaskId) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // newCwd读取`readFileSync`，供共享工具后续处理使用。
          let newCwd = readFileSync(nativeCwdFilePath, {
            encoding: 'utf8',
          }).trim()
          // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
          if (getPlatform() === 'windows') {
            // newCwd更新为 `posixPathToWindowsPath(newCwd)`，确保共享工具后续读取最新状态。
            newCwd = posixPathToWindowsPath(newCwd)
          }
          // cwd is NFC-normalized (setCwdState); newCwd from `pwd -P` may be
          // NFD on macOS APFS. Normalize before comparing so Unicode paths
          // don't false-positive as "changed" on every command.
          // `newCwd.normalize('NFC')` 与 `cwd` 不一致时刷新派生状态，避免使用过期结果。
          if (newCwd.normalize('NFC') !== cwd) {
            // setCwd 写入新的状态值，使共享工具后续读取保持一致。
            setCwd(newCwd, cwd)
            // 调用 invalidateSessionEnvCache，触发共享工具此处需要的副作用。
            invalidateSessionEnvCache()
            // 显式忽略 `onCwdChangedForHooks(cwd, newCwd)` 的返回值，只保留它触发的副作用。
            void onCwdChangedForHooks(cwd, newCwd)
          }
        } catch {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_shell_set_cwd', { success: false })
        }
      }
      // Clean up the temp file used for cwd tracking
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 unlinkSync，触发共享工具此处需要的副作用。
        unlinkSync(nativeCwdFilePath)
      } catch {
        // File may not exist if command failed before pwd -P ran
      }
    })

    // 返回 `shellCommand`，作为共享工具这次计算的结果。
    return shellCommand
  } catch (error) {
    // Close the fd if spawn failed (child never got its dup)
    // `outputHandle` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (outputHandle !== undefined) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `outputHandle.close()` 完成，再继续共享工具 Shell的异步流程。
        await outputHandle.close()
      } catch {
        // May already be closed
      }
    }
    // 调用 taskOutput.clear，触发共享工具此处需要的副作用。
    taskOutput.clear()

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Shell exec error: ${errorMessage(error)}`)

    // 返回 `createAbortedCommand(undefined, {`，作为共享工具这次计算的结果。
    return createAbortedCommand(undefined, {
      code: 126, // Standard Unix code for execution errors
      stderr: errorMessage(error),
    })
  }
}

/**
 * Set the current working directory
 */
// setCwd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCwd(path: string, relativeTo?: string): void {
  // resolved保存`isAbsolute`，供共享工具后续处理使用。
  const resolved = isAbsolute(path)
    ? path
    : resolve(relativeTo || getFsImplementation().cwd(), path)
  // Resolve symlinks to match the behavior of pwd -P.
  // realpathSync throws ENOENT if the path doesn't exist - convert to a
  // friendlier error message instead of a separate existsSync pre-check (TOCTOU).
  // physicalPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let physicalPath: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // physicalPath 路径数据更新为 `getFsImplementation().realpathSync(resolved)`，确保共享工具后续读取最新状态。
    physicalPath = getFsImplementation().realpathSync(resolved)
  } catch (e) {
    // 满足 `isENOENT(e)` 时，共享工具执行该分支。
    if (isENOENT(e)) {
      // 抛出 new Error(`Path "${resolved}" does not exist`)，阻止共享工具在无效状态下继续运行。
      throw new Error(`Path "${resolved}" does not exist`)
    }
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }

  // setCwdState 写入新的状态值，使共享工具后续读取保持一致。
  setCwdState(physicalPath)
  // `process.env.NODE_ENV` 与 `'test'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.NODE_ENV !== 'test') {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_shell_set_cwd', {
        success: true,
      })
    } catch (_error) {
      // Ignore logging errors to prevent test failures
    }
  }
}
