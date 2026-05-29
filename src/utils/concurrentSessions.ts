// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { chmod, mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getOriginalCwd,
  getSessionId,
  onSessionSwitch,
} from '../bootstrap/state.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 errorMessage、isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isFsInaccessible } from './errors.js'
// 引入 isProcessRunning，将 ./genericProcessUtils.js 中已经封装好的能力接到本文件流程里。
import { isProcessRunning } from './genericProcessUtils.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 jsonParse、jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from './slowOperations.js'
// 引入 getAgentId，将 ./teammate.js 中已经封装好的能力接到本文件流程里。
import { getAgentId } from './teammate.js'

// SessionKind 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionKind = 'interactive' | 'bg' | 'daemon' | 'daemon-worker'
// SessionStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionStatus = 'busy' | 'idle' | 'waiting'

// getSessionsDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSessionsDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'sessions')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'sessions')
}

/**
 * Kind override from env. Set by the spawner (`claude --bg`, daemon
 * supervisor) so the child can register without the parent having to
 * write the file for it — cleanup-on-exit wiring then works for free.
 * Gated so the env-var string is DCE'd from external builds.
 */
// envSessionKind 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function envSessionKind(): SessionKind | undefined {
  // 满足 `feature('BG_SESSIONS')` 时，共享工具执行该分支。
  if (feature('BG_SESSIONS')) {
    // k 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const k = process.env.CLAUDE_CODE_SESSION_KIND
    // 当 `k` 匹配 `'bg' || k === 'daemon' || k...` 时，共享工具执行对应分支。
    if (k === 'bg' || k === 'daemon' || k === 'daemon-worker') return k
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * True when this REPL is running inside a `claude --bg` tmux session.
 * Exit paths (/exit, ctrl+c, ctrl+d) should detach the attached client
 * instead of killing the process.
 */
// isBgSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBgSession(): boolean {
  // 返回 `envSessionKind() === 'bg'`，作为共享工具这次计算的结果。
  return envSessionKind() === 'bg'
}

/**
 * Write a PID file for this session and register cleanup.
 *
 * Registers all top-level sessions — interactive CLI, SDK (vscode, desktop,
 * typescript, python, -p), bg/daemon spawns — so `claude ps` sees everything
 * the user might be running. Skips only teammates/subagents, which would
 * conflate swarm usage with genuine concurrency and pollute ps with noise.
 *
 * Returns true if registered, false if skipped.
 * Errors logged to debug, never thrown.
 */
// registerSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function registerSession(): Promise<boolean> {
  // 满足 `getAgentId() != null` 时，共享工具执行该分支。
  if (getAgentId() != null) return false

  // kind保存`envSessionKind() ?? 'interactive'`，供共享工具 concurrent Sessions后续判断或输出使用。
  const kind: SessionKind = envSessionKind() ?? 'interactive'
  // dir读取`getSessionsDir`，供共享工具后续处理使用。
  const dir = getSessionsDir()
  // pidFile 文件数据格式化`join`，供共享工具后续处理使用。
  const pidFile = join(dir, `${process.pid}.json`)

  // 调用 registerCleanup，触发共享工具此处需要的副作用。
  registerCleanup(async () => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(pidFile)` 完成，再继续共享工具 concurrent Sessions的异步流程。
      await unlink(pidFile)
    } catch {
      // ENOENT is fine (already deleted or never written)
    }
  })

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dir, { recursive: true, mode: 0o700 })` 完成，再继续共享工具 concurrent Sessions的异步流程。
    await mkdir(dir, { recursive: true, mode: 0o700 })
    // 等待 `chmod(dir, 0o700)` 完成，再继续共享工具 concurrent Sessions的异步流程。
    await chmod(dir, 0o700)
    // 等待 `writeFile(` 完成，再继续共享工具 concurrent Sessions的异步流程。
    await writeFile(
      pidFile,
      jsonStringify({
        pid: process.pid,
        sessionId: getSessionId(),
        cwd: getOriginalCwd(),
        startedAt: Date.now(),
        kind,
        entrypoint: process.env.CLAUDE_CODE_ENTRYPOINT,
        ...(feature('UDS_INBOX')
          ? { messagingSocketPath: process.env.CLAUDE_CODE_MESSAGING_SOCKET }
          : {}),
        ...(feature('BG_SESSIONS')
          ? {
              name: process.env.CLAUDE_CODE_SESSION_NAME,
              logPath: process.env.CLAUDE_CODE_SESSION_LOG,
              agent: process.env.CLAUDE_CODE_AGENT,
            }
          : {}),
      }),
    )
    // --resume / /resume mutates getSessionId() via switchSession. Without
    // this, the PID file's sessionId goes stale and `claude ps` sparkline
    // reads the wrong transcript.
    // 调用 onSessionSwitch，触发共享工具此处需要的副作用。
    onSessionSwitch(id => {
      // 显式忽略 `updatePidFile({ sessionId: id })` 的返回值，只保留它触发的副作用。
      void updatePidFile({ sessionId: id })
    })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[concurrentSessions] register failed: ${errorMessage(e)}`)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Update this session's name in its PID registry file so ListPeers
 * can surface it. Best-effort: silently no-op if name is falsy, the
 * file doesn't exist (session not registered), or read/write fails.
 */
// updatePidFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function updatePidFile(patch: Record<string, unknown>): Promise<void> {
  // pidFile 文件数据格式化`join`，供共享工具后续处理使用。
  const pidFile = join(getSessionsDir(), `${process.pid}.json`)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // data解析`jsonParse`，供共享工具后续处理使用。
    const data = jsonParse(await readFile(pidFile, 'utf8')) as Record<
      string,
      unknown
    >
    // 等待 `writeFile(pidFile, jsonStringify({ ...data, ...patch }))` 完成，再继续共享工具 concurrent Sessions的异步流程。
    await writeFile(pidFile, jsonStringify({ ...data, ...patch }))
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[concurrentSessions] updatePidFile failed: ${errorMessage(e)}`,
    )
  }
}

// updateSessionName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateSessionName(
  name: string | undefined,
): Promise<void> {
  // 名称缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!name) return
  // 等待 `updatePidFile({ name })` 完成，再继续共享工具 concurrent Sessions的异步流程。
  await updatePidFile({ name })
}

/**
 * Record this session's Remote Control session ID so peer enumeration can
 * dedup: a session reachable over both UDS and bridge should only appear
 * once (local wins). Cleared on bridge teardown so stale IDs don't
 * suppress a legitimately-remote session after reconnect.
 */
// updateSessionBridgeId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateSessionBridgeId(
  bridgeSessionId: string | null,
): Promise<void> {
  // 等待 `updatePidFile({ bridgeSessionId })` 完成，再继续共享工具 concurrent Sessions的异步流程。
  await updatePidFile({ bridgeSessionId })
}

/**
 * Push live activity state for `claude ps`. Fire-and-forget from REPL's
 * status-change effect — a dropped write just means ps falls back to
 * transcript-tail derivation for one refresh.
 */
// updateSessionActivity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateSessionActivity(patch: {
  status?: SessionStatus
  waitingFor?: string
}): Promise<void> {
  // 满足 `!feature('BG_SESSIONS')` 时，共享工具执行该分支。
  if (!feature('BG_SESSIONS')) return
  // 等待 `updatePidFile({ ...patch, updatedAt: Date.now() })` 完成，再继续共享工具 concurrent Sessions的异步流程。
  await updatePidFile({ ...patch, updatedAt: Date.now() })
}

/**
 * Count live concurrent CLI sessions (including this one).
 * Filters out stale PID files (crashed sessions) and deletes them.
 * Returns 0 on any error (conservative).
 */
// countConcurrentSessions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function countConcurrentSessions(): Promise<number> {
  // dir读取`getSessionsDir`，供共享工具后续处理使用。
  const dir = getSessionsDir()
  // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let files: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `await readdir(dir)`，确保共享工具后续读取最新状态。
    files = await readdir(dir)
  } catch (e) {
    // 满足 `!isFsInaccessible(e)` 时，共享工具执行该分支。
    if (!isFsInaccessible(e)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[concurrentSessions] readdir failed: ${errorMessage(e)}`)
    }
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }

  // count 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let count = 0
  // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
  for (const file of files) {
    // Strict filename guard: only `<pid>.json` is a candidate. parseInt's
    // lenient prefix-parsing means `2026-03-14_notes.md` would otherwise
    // parse as PID 2026 and get swept as stale — silent user data loss.
    // See anthropics/claude-code#34210.
    // 满足 `!/^\d+\.json$/.test(file)` 时，共享工具执行该分支。
    if (!/^\d+\.json$/.test(file)) continue
    // pid解析`parseInt`，供共享工具后续处理使用。
    const pid = parseInt(file.slice(0, -5), 10)
    // 满足 `pid === process.pid` 时，共享工具执行该分支。
    if (pid === process.pid) {
      // 共享工具 concurrent Sessions在这里处理 `count++`，完成这一小步状态转换。
      count++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `isProcessRunning(pid)` 时，共享工具执行该分支。
    if (isProcessRunning(pid)) {
      // 共享工具 concurrent Sessions在这里处理 `count++`，完成这一小步状态转换。
      count++
    // 共享工具 concurrent Sessions在这里处理 `} else if (getPlatform() !== 'wsl') {`，完成这一小步状态转换。
    } else if (getPlatform() !== 'wsl') {
      // Stale file from a crashed session — sweep it. Skip on WSL: if
      // ~/.claude/sessions/ is shared with Windows-native Claude (symlink
      // or CLAUDE_CONFIG_DIR), a Windows PID won't be probeable from WSL
      // and we'd falsely delete a live session's file. This is just
      // telemetry so conservative undercount is acceptable.
      // 这个回调绑定到 void unlink(join(dir, file)).catch(() => {})，负责共享工具在该局部场景下的响应。
      void unlink(join(dir, file)).catch(() => {})
    }
  }
  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}
