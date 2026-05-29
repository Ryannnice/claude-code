/**
 * Built-in terminal panel toggled with Meta+J.
 *
 * Uses tmux for shell persistence: a separate tmux server with a per-instance
 * socket (e.g., "claude-panel-a1b2c3d4") holds the shell session. Each Claude
 * Code instance gets its own isolated terminal panel that persists within the
 * session but is destroyed when the instance exits.
 *
 * Meta+J is bound to detach-client inside tmux, so pressing it returns to
 * Claude Code while the shell keeps running. Next toggle re-attaches to the
 * same session.
 *
 * When tmux is not available, falls back to a non-persistent shell via spawnSync.
 *
 * Uses the same suspend-Ink pattern as the external editor (promptEditor.ts).
 */

// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { spawn, spawnSync } from 'child_process'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 复用 instances 终端界面组件，避免在这里重复拼装显示逻辑。
import instances from '../ink/instances.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 pwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { pwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'

// TMUX_SESSION 会话数据 命名 `'panel'`，让后续代码直接表达这个值的用途。
const TMUX_SESSION = 'panel'

/**
 * Get the tmux socket name for the terminal panel.
 * Uses a unique socket per Claude Code instance (based on session ID)
 * so that each instance has its own isolated terminal panel.
 */
// getTerminalPanelSocket 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalPanelSocket(): string {
  // Use first 8 chars of session UUID for uniqueness while keeping name short
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // 返回 ``claude-panel-${sessionId.slice(0, 8)}``，作为共享工具这次计算的结果。
  return `claude-panel-${sessionId.slice(0, 8)}`
}

// instance 先占位，稍后的条件分支会根据实际输入补齐它。
let instance: TerminalPanel | undefined

/**
 * Return the singleton TerminalPanel, creating it lazily on first use.
 */
// getTerminalPanel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalPanel(): TerminalPanel {
  // instance缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!instance) {
    // instance更新为 `new TerminalPanel()`，确保共享工具后续读取最新状态。
    instance = new TerminalPanel()
  }
  // 返回 `instance`，作为共享工具这次计算的结果。
  return instance
}

// TerminalPanel 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class TerminalPanel {
  private hasTmux: boolean | undefined
  private cleanupRegistered = false

  // ── public API ────────────────────────────────────────────────────

  // toggle 使用 无 完成共享工具里的对应操作。
  toggle(): void {
    // 调用 this.showShell，触发共享工具此处需要的副作用。
    this.showShell()
  }

  // ── tmux helpers ──────────────────────────────────────────────────

  // 共享工具 terminal Panel在这里处理 `private checkTmux(): boolean {`，完成这一小步状态转换。
  private checkTmux(): boolean {
    // `this.hasTmux` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (this.hasTmux !== undefined) return this.hasTmux
    // 结果保存`spawnSync`，供共享工具后续处理使用。
    const result = spawnSync('tmux', ['-V'], { encoding: 'utf-8' })
    // 更新实例字段 hasTmux 为 result.status === 0，同步共享工具的内部状态。
    this.hasTmux = result.status === 0
    // this.hasTmux缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.hasTmux) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Terminal panel: tmux not found, falling back to non-persistent shell',
      )
    }
    // 返回 `this.hasTmux`，作为共享工具这次计算的结果。
    return this.hasTmux
  }

  // 共享工具 terminal Panel在这里处理 `private hasSession(): boolean {`，完成这一小步状态转换。
  private hasSession(): boolean {
    // 结果保存`spawnSync`，供共享工具后续处理使用。
    const result = spawnSync(
      'tmux',
      ['-L', getTerminalPanelSocket(), 'has-session', '-t', TMUX_SESSION],
      { encoding: 'utf-8' },
    )
    // 返回 `result.status === 0`，作为共享工具这次计算的结果。
    return result.status === 0
  }

  // 共享工具 terminal Panel在这里处理 `private createSession(): boolean {`，完成这一小步状态转换。
  private createSession(): boolean {
    // shell 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const shell = process.env.SHELL || '/bin/bash'
    // cwd保存`pwd`，供共享工具后续处理使用。
    const cwd = pwd()
    // socket读取`getTerminalPanelSocket`，供共享工具后续处理使用。
    const socket = getTerminalPanelSocket()

    // 结果保存`spawnSync`，供共享工具后续处理使用。
    const result = spawnSync(
      'tmux',
      [
        '-L',
        socket,
        'new-session',
        '-d',
        '-s',
        TMUX_SESSION,
        '-c',
        cwd,
        shell,
        '-l',
      ],
      { encoding: 'utf-8' },
    )

    // `result.status` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.status !== 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Terminal panel: failed to create tmux session: ${result.stderr}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Bind Meta+J (toggles back to Claude Code from inside the terminal)
    // and configure the status bar hint. Chained with ';' to collapse
    // 5 spawnSync calls into 1.
    // biome-ignore format: one tmux command per line
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync('tmux', [
      '-L', socket,
      'bind-key', '-n', 'M-j', 'detach-client', ';',
      'set-option', '-g', 'status-style', 'bg=default', ';',
      'set-option', '-g', 'status-left', '', ';',
      'set-option', '-g', 'status-right', ' Alt+J to return to Claude ', ';',
      'set-option', '-g', 'status-right-style', 'fg=brightblack',
    ])

    // this.cleanupRegistered缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.cleanupRegistered) {
      // 更新实例字段 cleanupRegistered 为 true，同步共享工具的内部状态。
      this.cleanupRegistered = true
      // 调用 registerCleanup，触发共享工具此处需要的副作用。
      registerCleanup(async () => {
        // Detached async spawn — spawnSync here would block the event loop
        // and serialize the entire cleanup Promise.all in gracefulShutdown.
        // .on('error') swallows ENOENT if tmux disappears between session
        // creation and cleanup — prevents spurious uncaughtException noise.
        // 调用 spawn，触发共享工具此处需要的副作用。
        spawn('tmux', ['-L', socket, 'kill-server'], {
          detached: true,
          stdio: 'ignore',
        })
          // 链式调用 on，继续加工上一行在共享工具中产生的数据。
          .on('error', () => {})
          .unref()
      })
    }

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 共享工具 terminal Panel在这里处理 `private attachSession(): void {`，完成这一小步状态转换。
  private attachSession(): void {
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync(
      'tmux',
      ['-L', getTerminalPanelSocket(), 'attach-session', '-t', TMUX_SESSION],
      { stdio: 'inherit' },
    )
  }

  // ── show shell ────────────────────────────────────────────────────

  // 共享工具 terminal Panel在这里处理 `private showShell(): void {`，完成这一小步状态转换。
  private showShell(): void {
    // inkInstance读取`instances.get`，供共享工具后续处理使用。
    const inkInstance = instances.get(process.stdout)
    // inkInstance缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!inkInstance) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Terminal panel: no Ink instance found, aborting')
      // 共享工具 terminal Panel在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 inkInstance.enterAlternateScreen，触发共享工具此处需要的副作用。
    inkInstance.enterAlternateScreen()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 只有 `this.checkTmux() && this.ensureSession()` 满足时，共享工具才执行该分支。
      if (this.checkTmux() && this.ensureSession()) {
        // 调用 this.attachSession，触发共享工具此处需要的副作用。
        this.attachSession()
      } else {
        // 调用 this.runShellDirect，触发共享工具此处需要的副作用。
        this.runShellDirect()
      }
    } finally {
      // 调用 inkInstance.exitAlternateScreen，触发共享工具此处需要的副作用。
      inkInstance.exitAlternateScreen()
    }
  }

  // ── helpers ───────────────────────────────────────────────────────

  /** Ensure a tmux session exists, creating one if needed. */
  // 共享工具 terminal Panel在这里处理 `private ensureSession(): boolean {`，完成这一小步状态转换。
  private ensureSession(): boolean {
    // 满足 `this.hasSession()` 时，共享工具执行该分支。
    if (this.hasSession()) return true
    // 返回 `this.createSession()`，作为共享工具这次计算的结果。
    return this.createSession()
  }

  /** Fallback when tmux is not available — runs a non-persistent shell. */
  // 共享工具 terminal Panel在这里处理 `private runShellDirect(): void {`，完成这一小步状态转换。
  private runShellDirect(): void {
    // shell 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const shell = process.env.SHELL || '/bin/bash'
    // cwd保存`pwd`，供共享工具后续处理使用。
    const cwd = pwd()
    // 调用 spawnSync，触发共享工具此处需要的副作用。
    spawnSync(shell, ['-i', '-l'], {
      stdio: 'inherit',
      cwd,
      env: process.env,
    })
  }
}
