/**
 * TMUX SOCKET ISOLATION
 * =====================
 * This module manages an isolated tmux socket for Claude's operations.
 *
 * WHY THIS EXISTS:
 * Without isolation, Claude could accidentally affect the user's tmux sessions.
 * For example, running `tmux kill-session` via the Bash tool would kill the
 * user's current session if they started Claude from within tmux.
 *
 * HOW IT WORKS:
 * 1. Claude creates its own tmux socket: `claude-<PID>` (e.g., `claude-12345`)
 * 2. ALL Tmux tool commands use this socket via the `-L` flag
 * 3. ALL Bash tool commands inherit TMUX env var pointing to this socket
 *    (set in Shell.ts via getClaudeTmuxEnv())
 *
 * This means ANY tmux command run through Claude - whether via the Tmux tool
 * directly or via Bash - will operate on Claude's isolated socket, NOT the
 * user's tmux session.
 *
 * IMPORTANT: The user's original TMUX env var is NOT used. After socket
 * initialization, getClaudeTmuxEnv() returns a value that overrides the
 * user's TMUX in all child processes spawned by Shell.ts.
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { posix } from 'path'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from './errors.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'

// Constants for tmux socket management
// TMUX_COMMAND 命令数据保存`'tmux'`，作为后续固定文本处理的输入。
const TMUX_COMMAND = 'tmux'
// CLAUDE_SOCKET_PREFIX保存`'claude'`，作为后续固定文本处理的输入。
const CLAUDE_SOCKET_PREFIX = 'claude'

/**
 * Executes a tmux command, routing through WSL on Windows.
 * On Windows, tmux only exists inside WSL — WSL interop lets the tmux session
 * launch .exe files as native Win32 processes while stdin/stdout flow through
 * the WSL pty.
 */
// execTmux 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function execTmux(
  args: string[],
  opts?: { useCwd?: boolean },
): Promise<{ stdout: string; stderr: string; code: number }> {
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // -e execs tmux directly without the login shell. Without it, wsl hands the
    // command line to bash which eats `#` as a comment: `display-message -p
    // #{socket_path},#{pid}` below becomes `display-message -p ` → exit 1 →
    // we silently fall back to the guessed path and never learn the real
    // server PID. Same root cause as TungstenTool/utils.ts:execTmuxCommand.
    // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
    const result = await execFileNoThrow('wsl', ['-e', TMUX_COMMAND, ...args], {
      env: { ...process.env, WSL_UTF8: '1' },
      ...opts,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      code: result.code || 0,
    }
  }
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow(TMUX_COMMAND, args, opts)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    code: result.code || 0,
  }
}

// Socket state - initialized lazily when Tmux tool is first used or a tmux command is run
// socketName初始化为空值，后续分支会在有数据时补齐。
let socketName: string | null = null
// socketPath 路径数据初始化为空值，后续分支会在有数据时补齐。
let socketPath: string | null = null
// serverPid 命名 `null`，让后续代码直接表达这个值的用途。
let serverPid: number | null = null
// isInitializing标记共享工具 tmux Socket是否启用对应路径。
let isInitializing = false
// initPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let initPromise: Promise<void> | null = null

// tmux availability - checked once upfront
// tmuxAvailabilityChecked标记共享工具 tmux Socket是否启用对应路径。
let tmuxAvailabilityChecked = false
// tmuxAvailable标记共享工具 tmux Socket是否启用对应路径。
let tmuxAvailable = false

// Track whether the Tmux tool has been used at least once
// Used to defer socket initialization until actually needed
// tmuxToolUsed标记共享工具 tmux Socket是否启用对应路径。
let tmuxToolUsed = false

/**
 * Gets the socket name for Claude's isolated tmux session.
 * Format: claude-<PID>
 */
// getClaudeSocketName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeSocketName(): string {
  // socketName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!socketName) {
    // socketName更新为 ``${CLAUDE_SOCKET_PREFIX}-${process.pid}``，确保共享工具后续读取最新状态。
    socketName = `${CLAUDE_SOCKET_PREFIX}-${process.pid}`
  }
  // 返回 `socketName`，作为共享工具这次计算的结果。
  return socketName
}

/**
 * Gets the socket path if the socket has been initialized.
 * Returns null if not yet initialized.
 */
// getClaudeSocketPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeSocketPath(): string | null {
  // 返回 `socketPath`，作为共享工具这次计算的结果。
  return socketPath
}

/**
 * Sets socket info after initialization.
 * Called after the tmux session is created.
 */
// setClaudeSocketInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setClaudeSocketInfo(path: string, pid: number): void {
  // socketPath 路径数据更新为 `path`，确保共享工具后续读取最新状态。
  socketPath = path
  // serverPid更新为 `pid`，确保共享工具后续读取最新状态。
  serverPid = pid
}

/**
 * Returns whether the socket has been initialized.
 */
// isSocketInitialized 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSocketInitialized(): boolean {
  // 返回 `socketPath !== null && serverPid !== null`，作为共享工具这次计算的结果。
  return socketPath !== null && serverPid !== null
}

/**
 * Gets the TMUX environment variable value for Claude's isolated socket.
 *
 * CRITICAL: This value is used by Shell.ts to override the TMUX env var
 * in ALL child processes. This ensures that any `tmux` command run via
 * the Bash tool will operate on Claude's socket, NOT the user's session.
 *
 * Format: "socket_path,server_pid,pane_index" (matches tmux's TMUX env var)
 * Example: "/tmp/tmux-501/claude-12345,54321,0"
 *
 * Returns null if socket is not yet initialized.
 * When null, Shell.ts does not override TMUX, preserving user's environment.
 */
// getClaudeTmuxEnv 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeTmuxEnv(): string | null {
  // 只有 `!socketPath || serverPid === null` 满足时，共享工具才执行该分支。
  if (!socketPath || serverPid === null) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 ``${socketPath},${serverPid},0``，作为共享工具这次计算的结果。
  return `${socketPath},${serverPid},0`
}

/**
 * Checks if tmux is available on this system.
 * This is checked once and cached for the lifetime of the process.
 *
 * When tmux is not available:
 * - TungstenTool (Tmux) will not work
 * - TeammateTool will not work (it uses tmux for pane management)
 * - Bash commands will run without tmux isolation
 */
// checkTmuxAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkTmuxAvailable(): Promise<boolean> {
  // tmuxAvailabilityChecked缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!tmuxAvailabilityChecked) {
    // result 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const result =
      getPlatform() === 'windows'
        ? await execFileNoThrow('wsl', ['-e', TMUX_COMMAND, '-V'], {
            env: { ...process.env, WSL_UTF8: '1' },
            useCwd: false,
          })
        : await execFileNoThrow('which', [TMUX_COMMAND], {
            useCwd: false,
          })
    // tmuxAvailable更新为 `result.code === 0`，确保共享工具后续读取最新状态。
    tmuxAvailable = result.code === 0
    // tmuxAvailable缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!tmuxAvailable) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Socket] tmux is not installed. The Tmux tool and Teammate tool will not be available.`,
      )
    }
    // tmuxAvailabilityChecked更新为 `true`，确保共享工具后续读取最新状态。
    tmuxAvailabilityChecked = true
  }
  // 返回 `tmuxAvailable`，作为共享工具这次计算的结果。
  return tmuxAvailable
}

/**
 * Returns the cached tmux availability status.
 * Returns false if availability hasn't been checked yet.
 * Use checkTmuxAvailable() to perform the check.
 */
// isTmuxAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTmuxAvailable(): boolean {
  // 返回 `tmuxAvailabilityChecked && tmuxAvailable`，作为共享工具这次计算的结果。
  return tmuxAvailabilityChecked && tmuxAvailable
}

/**
 * Marks that the Tmux tool has been used at least once.
 * Called by TungstenTool before initialization.
 * After this is called, Shell.ts will initialize the socket for subsequent Bash commands.
 */
// markTmuxToolUsed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markTmuxToolUsed(): void {
  // tmuxToolUsed更新为 `true`，确保共享工具后续读取最新状态。
  tmuxToolUsed = true
}

/**
 * Returns whether the Tmux tool has been used at least once.
 * Used by Shell.ts to decide whether to initialize the socket.
 */
// hasTmuxToolBeenUsed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasTmuxToolBeenUsed(): boolean {
  // 返回 `tmuxToolUsed`，作为共享工具这次计算的结果。
  return tmuxToolUsed
}

/**
 * Ensures the socket is initialized with a tmux session.
 * Called by Shell.ts when the Tmux tool has been used or the command includes "tmux".
 * Safe to call multiple times; will only initialize once.
 *
 * If tmux is not installed, this function returns gracefully without
 * initializing the socket. getClaudeTmuxEnv() will return null, and
 * Bash commands will run without tmux isolation.
 */
// ensureSocketInitialized 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureSocketInitialized(): Promise<void> {
  // Already initialized
  // 满足 `isSocketInitialized()` 时，共享工具执行该分支。
  if (isSocketInitialized()) {
    // 共享工具 tmux Socket在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check if tmux is available before trying to use it
  // available读取`checkTmuxAvailable`，供共享工具后续处理使用。
  const available = await checkTmuxAvailable()
  // available缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!available) {
    // 共享工具 tmux Socket在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Another call is already initializing - wait for it but don't propagate errors
  // The original caller handles the error and sets up graceful degradation
  // 只有 `isInitializing && initPromise` 满足时，共享工具才执行该分支。
  if (isInitializing && initPromise) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `initPromise` 完成，再继续共享工具 tmux Socket的异步流程。
      await initPromise
    } catch {
      // Ignore - the original caller logs the error
    }
    // 共享工具 tmux Socket在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // isInitializing更新为 `true`，确保共享工具后续读取最新状态。
  isInitializing = true
  // initPromise 异步任务更新为 `doInitialize()`，确保共享工具后续读取最新状态。
  initPromise = doInitialize()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `initPromise` 完成，再继续共享工具 tmux Socket的异步流程。
    await initPromise
  } catch (error) {
    // Log error but don't throw - graceful degradation
    // err保存`toError`，供共享工具后续处理使用。
    const err = toError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Socket] Failed to initialize tmux socket: ${err.message}. Tmux isolation will be disabled.`,
    )
  } finally {
    // isInitializing更新为 `false`，确保共享工具后续读取最新状态。
    isInitializing = false
  }
}

/**
 * Kills the tmux server for Claude's isolated socket.
 * Called during graceful shutdown to clean up resources.
 */
// killTmuxServer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function killTmuxServer(): Promise<void> {
  // socket读取`getClaudeSocketName`，供共享工具后续处理使用。
  const socket = getClaudeSocketName()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[Socket] Killing tmux server for socket: ${socket}`)

  // 结果保存`execTmux`，供共享工具后续处理使用。
  const result = await execTmux(['-L', socket, 'kill-server'])

  // 满足 `result.code === 0` 时，共享工具执行该分支。
  if (result.code === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[Socket] Successfully killed tmux server`)
  } else {
    // Server may already be dead, which is fine
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Socket] Failed to kill tmux server (exit ${result.code}): ${result.stderr}`,
    )
  }
}

// doInitialize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function doInitialize(): Promise<void> {
  // socket读取`getClaudeSocketName`，供共享工具后续处理使用。
  const socket = getClaudeSocketName()

  // Create a new session with our custom socket
  // Pass CLAUDE_CODE_SKIP_PROMPT_HISTORY via -e so it's set in the initial shell environment
  //
  // On Windows, the tmux server inherits WSL_INTEROP from the short-lived
  // wsl.exe that spawns it; once `new-session -d` detaches and wsl.exe exits,
  // that socket stops servicing requests. Any cli.exe launched inside the pane
  // then hits `UtilAcceptVsock: accept4 failed 110` (ETIMEDOUT). Observed on
  // 2026-03-25: server PID 386 (started alongside /init at WSL boot) inherited
  // /run/WSL/383_interop — init's own socket, which listens but doesn't handle
  // interop. /run/WSL/1_interop is a stable symlink WSL maintains to the real
  // handler; pin the server to it so interop survives the spawning wsl.exe.
  // 结果保存`execTmux`，供共享工具后续处理使用。
  const result = await execTmux([
    '-L',
    socket,
    'new-session',
    '-d',
    '-s',
    'base',
    '-e',
    'CLAUDE_CODE_SKIP_PROMPT_HISTORY=true',
    ...(getPlatform() === 'windows'
      ? ['-e', 'WSL_INTEROP=/run/WSL/1_interop']
      : []),
  ])

  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // Session might already exist from a previous run with same PID (unlikely but possible)
    // Check if the session exists
    // checkResult保存`execTmux`，供共享工具后续处理使用。
    const checkResult = await execTmux([
      '-L',
      socket,
      'has-session',
      '-t',
      'base',
    ])
    // `checkResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (checkResult.code !== 0) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to create tmux session on socket ${socket}: ${result.stderr}`,
      )
    }
  }

  // Register cleanup to kill the tmux server on exit
  // 调用 registerCleanup，触发共享工具此处需要的副作用。
  registerCleanup(killTmuxServer)

  // Set CLAUDE_CODE_SKIP_PROMPT_HISTORY in the tmux GLOBAL environment (-g).
  // Without -g this would only apply to the 'base' session, and new sessions
  // created by TungstenTool (e.g. 'test', 'verify') would not inherit it.
  // Any Claude Code instance spawned on this socket will inherit this env var,
  // preventing test/verification sessions from polluting the user's real
  // command history and --resume session list.
  // 等待 `execTmux([` 完成，再继续共享工具 tmux Socket的异步流程。
  await execTmux([
    '-L',
    socket,
    'set-environment',
    '-g',
    'CLAUDE_CODE_SKIP_PROMPT_HISTORY',
    'true',
  ])

  // Same WSL_INTEROP pin as the new-session -e above, but in the GLOBAL env
  // so sessions created by TungstenTool inherit it too. The -e on new-session
  // only covers the base session's initial shell; a later `new-session -s cc`
  // inherits the SERVER's env, which still holds the stale socket from the
  // wsl.exe that spawned it.
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // 等待 `execTmux([` 完成，再继续共享工具 tmux Socket的异步流程。
    await execTmux([
      '-L',
      socket,
      'set-environment',
      '-g',
      'WSL_INTEROP',
      '/run/WSL/1_interop',
    ])
  }

  // Get the socket path and server PID
  // infoResult保存`execTmux`，供共享工具后续处理使用。
  const infoResult = await execTmux([
    '-L',
    socket,
    'display-message',
    '-p',
    '#{socket_path},#{pid}',
  ])

  // 满足 `infoResult.code === 0` 时，共享工具执行该分支。
  if (infoResult.code === 0) {
    // 从 `infoResult.stdout.trim().split(',')` 按位置拆出 path、pidStr，让共享工具 tmux Socket分别处理这些返回值。
    const [path, pidStr] = infoResult.stdout.trim().split(',')
    // 只有 `path && pidStr` 满足时，共享工具才执行该分支。
    if (path && pidStr) {
      // pid解析`parseInt`，供共享工具后续处理使用。
      const pid = parseInt(pidStr, 10)
      // 满足 `!isNaN(pid)` 时，共享工具执行该分支。
      if (!isNaN(pid)) {
        // setClaudeSocketInfo 写入新的状态值，使共享工具后续读取保持一致。
        setClaudeSocketInfo(path, pid)
        // 共享工具 tmux Socket在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }
    // Parsing failed - log and fall through to fallback
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Socket] Failed to parse socket info from tmux output: "${infoResult.stdout.trim()}". Using fallback path.`,
    )
  } else {
    // Command failed - log and fall through to fallback
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Socket] Failed to get socket info via display-message (exit ${infoResult.code}): ${infoResult.stderr}. Using fallback path.`,
    )
  }

  // Fallback: construct the socket path from standard tmux location
  // tmux sockets are typically at $TMPDIR/tmux-<UID>/<socket_name> (or /tmp/tmux-<UID>/ if TMPDIR is not set)
  // On Windows this path is inside WSL, so always use POSIX separators.
  // process.getuid() is undefined on Windows; WSL default user is root (uid 0) in CI.
  // uid 命名 `process.getuid?.() ?? 0`，让后续代码直接表达这个值的用途。
  const uid = process.getuid?.() ?? 0
  // baseTmpDir 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const baseTmpDir = process.env.TMPDIR || '/tmp'
  // fallbackPath 路径数据格式化`posix.join`，供共享工具后续处理使用。
  const fallbackPath = posix.join(baseTmpDir, `tmux-${uid}`, socket)

  // Get server PID separately
  // pidResult保存`execTmux`，供共享工具后续处理使用。
  const pidResult = await execTmux([
    '-L',
    socket,
    'display-message',
    '-p',
    '#{pid}',
  ])

  // 满足 `pidResult.code === 0` 时，共享工具执行该分支。
  if (pidResult.code === 0) {
    // pid解析`parseInt`，供共享工具后续处理使用。
    const pid = parseInt(pidResult.stdout.trim(), 10)
    // 满足 `!isNaN(pid)` 时，共享工具执行该分支。
    if (!isNaN(pid)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Socket] Using fallback socket path: ${fallbackPath} (server PID: ${pid})`,
      )
      // setClaudeSocketInfo 写入新的状态值，使共享工具后续读取保持一致。
      setClaudeSocketInfo(fallbackPath, pid)
      // 共享工具 tmux Socket在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // PID parsing failed
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Socket] Failed to parse server PID from tmux output: "${pidResult.stdout.trim()}"`,
    )
  } else {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Socket] Failed to get server PID (exit ${pidResult.code}): ${pidResult.stderr}`,
    )
  }

  // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
  throw new Error(
    `Failed to get socket info for ${socket}: primary="${infoResult.stderr}", fallback="${pidResult.stderr}"`,
  )
}

// For testing purposes
// resetSocketState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSocketState(): void {
  // socketName更新为 `null`，确保共享工具后续读取最新状态。
  socketName = null
  // socketPath 路径数据更新为 `null`，确保共享工具后续读取最新状态。
  socketPath = null
  // serverPid更新为 `null`，确保共享工具后续读取最新状态。
  serverPid = null
  // isInitializing更新为 `false`，确保共享工具后续读取最新状态。
  isInitializing = false
  // initPromise 异步任务更新为 `null`，确保共享工具后续读取最新状态。
  initPromise = null
  // tmuxAvailabilityChecked更新为 `false`，确保共享工具后续读取最新状态。
  tmuxAvailabilityChecked = false
  // tmuxAvailable更新为 `false`，确保共享工具后续读取最新状态。
  tmuxAvailable = false
  // tmuxToolUsed更新为 `false`，确保共享工具后续读取最新状态。
  tmuxToolUsed = false
}
