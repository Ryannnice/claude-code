// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { spawnSync } from 'child_process'
// 引入 getIsInteractive，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsInteractive } from '../bootstrap/state.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'

// loggedTmuxCcDisable标记共享工具 fullscreen是否启用对应路径。
let loggedTmuxCcDisable = false
// checkedTmuxMouseHint标记共享工具 fullscreen是否启用对应路径。
let checkedTmuxMouseHint = false

/**
 * Cached result from `tmux display-message -p '#{client_control_mode}'`.
 * undefined = not yet queried (or probe failed) — env heuristic stays authoritative.
 */
// tmuxControlModeProbed 先占位，稍后的条件分支会根据实际输入补齐它。
let tmuxControlModeProbed: boolean | undefined

/**
 * Env-var heuristic for iTerm2's tmux integration mode (`tmux -CC` / `tmux -2CC`).
 *
 * In `-CC` mode, iTerm2 renders tmux panes as native splits — tmux runs
 * as a server (TMUX is set) but iTerm2 is the actual terminal emulator
 * for each pane, so TERM_PROGRAM stays `iTerm.app` and TERM is iTerm2's
 * default (xterm-*). Contrast with regular tmux-inside-iTerm2, where tmux
 * overwrites TERM_PROGRAM to `tmux` and sets TERM to screen-* or tmux-*.
 *
 * This heuristic has known holes (SSH often doesn't propagate TERM_PROGRAM;
 * .tmux.conf can override TERM) — probeTmuxControlModeSync() is the
 * authoritative backstop. Kept as a zero-subprocess fast path.
 */
// isTmuxControlModeEnvHeuristic 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTmuxControlModeEnvHeuristic(): boolean {
  // process.env.TMUX缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!process.env.TMUX) return false
  // `process.env.TERM_PROGRAM` 与 `'iTerm.app'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.TERM_PROGRAM !== 'iTerm.app') return false
  // Belt-and-suspenders: in regular tmux TERM is screen-* or tmux-*;
  // in -CC mode iTerm2 sets its own TERM (xterm-*).
  // term 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const term = process.env.TERM ?? ''
  // 返回 `!term.startsWith('screen') && !term.startsWith('tmux')`，作为共享工具这次计算的结果。
  return !term.startsWith('screen') && !term.startsWith('tmux')
}

/**
 * Sync one-shot probe: asks tmux directly whether this client is in control
 * mode via `#{client_control_mode}`. Runs on first isTmuxControlMode() call
 * when the env heuristic can't decide; result is cached.
 *
 * Sync (spawnSync) because the answer gates whether we enter fullscreen — an
 * async probe raced against React render and lost: coder-tmux (ssh → tmux -CC
 * on a remote box) doesn't propagate TERM_PROGRAM, so the env heuristic missed,
 * and by the time the async probe resolved we'd already entered alt-screen with
 * mouse tracking enabled. Mouse wheel is dead in iTerm2's -CC integration, so
 * users couldn't scroll at all.
 *
 * Cost: one ~5ms subprocess, only when $TMUX is set AND $TERM_PROGRAM is unset
 * (the SSH-into-tmux case). Local iTerm2 -CC and non-tmux paths skip the spawn.
 *
 * The TMUX env check MUST come first — without it, display-message would
 * query whatever tmux server happens to be running rather than our client.
 */
// probeTmuxControlModeSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function probeTmuxControlModeSync(): void {
  // Seed cache with heuristic result so early returns below don't leave it
  // undefined — isTmuxControlMode() is called 15+ times per render, and an
  // undefined cache would re-enter this function (re-spawning tmux in the
  // failure case) on every call.
  // tmuxControlModeProbed更新为 `isTmuxControlModeEnvHeuristic()`，确保共享工具后续读取最新状态。
  tmuxControlModeProbed = isTmuxControlModeEnvHeuristic()
  // 满足 `tmuxControlModeProbed` 时，共享工具执行该分支。
  if (tmuxControlModeProbed) return
  // process.env.TMUX缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!process.env.TMUX) return
  // Only probe when iTerm might be involved: TERM_PROGRAM is iTerm.app
  // (covered above) or not set (SSH often doesn't propagate it). When
  // TERM_PROGRAM is explicitly a non-iTerm terminal, skip — tmux -CC is
  // an iTerm-only feature, so the subprocess would be wasted.
  // 满足 `process.env.TERM_PROGRAM` 时，共享工具执行该分支。
  if (process.env.TERM_PROGRAM) return
  // result 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let result
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果更新为 `spawnSync(`，确保共享工具后续读取最新状态。
    result = spawnSync(
      'tmux',
      ['display-message', '-p', '#{client_control_mode}'],
      { encoding: 'utf8', timeout: 2000 },
    )
  } catch {
    // spawnSync can throw on some platforms (e.g. ENOENT on Windows if tmux
    // is absent and the runtime surfaces it as an exception rather than in
    // result.error). Treat the same as a non-zero exit.
    // 共享工具 fullscreen在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Non-zero exit / spawn error: tmux too old (format var added in 2.4) or
  // unavailable. Keep the heuristic result cached.
  // `result.status` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.status !== 0) return
  // tmuxControlModeProbed更新为 `result.stdout.trim() === '1'`，确保共享工具后续读取最新状态。
  tmuxControlModeProbed = result.stdout.trim() === '1'
}

/**
 * True when running under `tmux -CC` (iTerm2 integration mode).
 *
 * The alt-screen / mouse-tracking path in fullscreen mode is unrecoverable
 * in -CC mode (double-click corrupts terminal state; mouse wheel is dead),
 * so callers auto-disable fullscreen.
 *
 * Lazily probes tmux on first call when the env heuristic can't decide.
 */
// isTmuxControlMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTmuxControlMode(): boolean {
  // 满足 `tmuxControlModeProbed === undefined) probeTmuxControlModeSync(` 时，共享工具执行该分支。
  if (tmuxControlModeProbed === undefined) probeTmuxControlModeSync()
  // 返回 `tmuxControlModeProbed ?? false`，作为共享工具这次计算的结果。
  return tmuxControlModeProbed ?? false
}

// _resetTmuxControlModeProbeForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetTmuxControlModeProbeForTesting(): void {
  // tmuxControlModeProbed更新为 `undefined`，确保共享工具后续读取最新状态。
  tmuxControlModeProbed = undefined
  // loggedTmuxCcDisable更新为 `false`，确保共享工具后续读取最新状态。
  loggedTmuxCcDisable = false
}

/**
 * Runtime env-var check only. Ants default to on (CLAUDE_CODE_NO_FLICKER=0
 * to opt out); external users default to off (CLAUDE_CODE_NO_FLICKER=1 to
 * opt in).
 */
// isFullscreenEnvEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFullscreenEnvEnabled(): boolean {
  // Explicit user opt-out always wins.
  // 满足 `isEnvDefinedFalsy(process.env.CLAUDE_CODE_NO_FLICKER)` 时，共享工具执行该分支。
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_NO_FLICKER)) return false
  // Explicit opt-in overrides auto-detection (escape hatch).
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_NO_FLICKER)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_NO_FLICKER)) return true
  // Auto-disable under tmux -CC: alt-screen + mouse tracking corrupts
  // terminal state on double-click and mouse wheel is dead.
  // 满足 `isTmuxControlMode()` 时，共享工具执行该分支。
  if (isTmuxControlMode()) {
    // loggedTmuxCcDisable缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!loggedTmuxCcDisable) {
      // loggedTmuxCcDisable更新为 `true`，确保共享工具后续读取最新状态。
      loggedTmuxCcDisable = true
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'fullscreen disabled: tmux -CC (iTerm2 integration mode) detected · set CLAUDE_CODE_NO_FLICKER=1 to override',
      )
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `process.env.USER_TYPE === 'ant'`，作为共享工具这次计算的结果。
  return process.env.USER_TYPE === 'ant'
}

/**
 * Whether fullscreen mode should enable SGR mouse tracking (DEC 1000/1002/1006).
 * Set CLAUDE_CODE_DISABLE_MOUSE=1 to keep alt-screen + virtualized scroll
 * (keyboard PgUp/PgDn/Ctrl+Home/End still work) but skip mouse capture,
 * so tmux/kitty/terminal-native copy-on-select keeps working.
 *
 * Compare with CLAUDE_CODE_NO_FLICKER=0 which is all-or-nothing — it also
 * disables alt-screen and virtualized scrollback.
 */
// isMouseTrackingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMouseTrackingEnabled(): boolean {
  // 返回 `!isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_MOUSE)`，作为共享工具这次计算的结果。
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_MOUSE)
}

/**
 * Whether mouse click handling is disabled (clicks/drags ignored, wheel still
 * works). Set CLAUDE_CODE_DISABLE_MOUSE_CLICKS=1 to prevent accidental clicks
 * from triggering cursor positioning, text selection, or message expansion.
 *
 * Fullscreen-specific — only reachable when CLAUDE_CODE_NO_FLICKER is active.
 */
// isMouseClicksDisabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMouseClicksDisabled(): boolean {
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_MOUSE_CLICKS)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_MOUSE_CLICKS)
}

/**
 * True when the fullscreen alt-screen layout is actually rendering —
 * requires an interactive REPL session AND the env var not explicitly
 * set falsy. Headless paths (--print, SDK, in-process teammates) never
 * enter fullscreen, so features that depend on alt-screen re-rendering
 * should gate on this.
 */
// isFullscreenActive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFullscreenActive(): boolean {
  // 返回 `getIsInteractive() && isFullscreenEnvEnabled()`，作为共享工具这次计算的结果。
  return getIsInteractive() && isFullscreenEnvEnabled()
}

/**
 * One-time hint for tmux users in fullscreen with `mouse off`.
 *
 * tmux's `mouse` option is session-scoped by design — there is no
 * pane-level equivalent. We used to `tmux set mouse on` when entering
 * alt-screen so wheel scrolling worked, but that changed mouse behavior
 * for every sibling pane (vim, less, shell) and leaked on kill-pane or
 * when multiple CC instances raced on restore. Now we leave tmux state
 * alone — same as vim/less/htop — and just tell the user their options.
 *
 * Fire-and-forget from REPL startup. Returns the hint text once per
 * session if TMUX is set, fullscreen is active, and tmux's current
 * `mouse` option is off; null otherwise.
 */
// maybeGetTmuxMouseHint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function maybeGetTmuxMouseHint(): Promise<string | null> {
  // process.env.TMUX缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!process.env.TMUX) return null
  // tmux -CC auto-disables fullscreen above, but belt-and-suspenders.
  // 只有 `!isFullscreenActive() || isTmuxControlMode()` 满足时，共享工具才执行该分支。
  if (!isFullscreenActive() || isTmuxControlMode()) return null
  // 满足 `checkedTmuxMouseHint` 时，共享工具执行该分支。
  if (checkedTmuxMouseHint) return null
  // checkedTmuxMouseHint更新为 `true`，确保共享工具后续读取最新状态。
  checkedTmuxMouseHint = true
  // -A includes inherited values: `show -v mouse` returns empty when the
  // option is set globally (`set -g mouse on` in .tmux.conf) but not at
  // session level — which is the common case. -A gives the effective value.
  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 fullscreen对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrow(
    'tmux',
    ['show', '-Av', 'mouse'],
    { useCwd: false, timeout: 2000 },
  )
  // 当 `code !== 0 || stdout.trim()` 匹配 `'on'` 时，共享工具执行对应分支。
  if (code !== 0 || stdout.trim() === 'on') return null
  // 返回 `"tmux detected · scroll with PgUp/PgDn · or add 'set -g mouse on' to ~/...`，作为共享工具这次计算的结果。
  return "tmux detected · scroll with PgUp/PgDn · or add 'set -g mouse on' to ~/.tmux.conf for wheel scroll"
}

/** Test-only: reset module-level once-per-session flags. */
// _resetForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetForTesting(): void {
  // loggedTmuxCcDisable更新为 `false`，确保共享工具后续读取最新状态。
  loggedTmuxCcDisable = false
  // checkedTmuxMouseHint更新为 `false`，确保共享工具后续读取最新状态。
  checkedTmuxMouseHint = false
}
