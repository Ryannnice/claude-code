// 复用 env 工具函数，把通用处理留在 ../../../utils/env.js 中维护。
import { env } from '../../../utils/env.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../../utils/execFileNoThrow.js'
// 引入 TMUX_COMMAND，将 ../constants.js 中已经封装好的能力接到本文件流程里。
import { TMUX_COMMAND } from '../constants.js'

/**
 * Captured at module load time to detect if the user started Claude from within tmux.
 * Shell.ts may override TMUX env var later, so we capture the original value.
 */
// eslint-disable-next-line custom-rules/no-process-env-top-level
// ORIGINAL_USER_TMUX 来自环境变量默认值，运行参数仍可在入口处覆盖。
const ORIGINAL_USER_TMUX = process.env.TMUX

/**
 * Captured at module load time to get the leader's tmux pane ID.
 * TMUX_PANE is set by tmux to the pane ID (e.g., %0, %1) when a process runs inside tmux.
 * We capture this at startup so we always know the leader's original pane, even if
 * the user switches to a different pane later.
 */
// eslint-disable-next-line custom-rules/no-process-env-top-level
// ORIGINAL_TMUX_PANE 来自环境变量默认值，运行参数仍可在入口处覆盖。
const ORIGINAL_TMUX_PANE = process.env.TMUX_PANE

/** Cached result for isInsideTmux */
// isInsideTmuxCached 缓存标记共享工具 detection是否启用对应路径。
let isInsideTmuxCached: boolean | null = null

/** Cached result for isInITerm2 */
// isInITerm2Cached 缓存标记共享工具 detection是否启用对应路径。
let isInITerm2Cached: boolean | null = null

/**
 * Checks if we're currently running inside a tmux session (synchronous version).
 * Uses the original TMUX value captured at module load, not process.env.TMUX,
 * because Shell.ts overrides TMUX when Claude's socket is initialized.
 *
 * IMPORTANT: We ONLY check the TMUX env var. We do NOT run `tmux display-message`
 * as a fallback because that command will succeed if ANY tmux server is running
 * on the system, not just if THIS process is inside tmux.
 */
// isInsideTmuxSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInsideTmuxSync(): boolean {
  // 返回 `!!ORIGINAL_USER_TMUX`，作为共享工具这次计算的结果。
  return !!ORIGINAL_USER_TMUX
}

/**
 * Checks if we're currently running inside a tmux session.
 * Uses the original TMUX value captured at module load, not process.env.TMUX,
 * because Shell.ts overrides TMUX when Claude's socket is initialized.
 * Caches the result since this won't change during the process lifetime.
 *
 * IMPORTANT: We ONLY check the TMUX env var. We do NOT run `tmux display-message`
 * as a fallback because that command will succeed if ANY tmux server is running
 * on the system, not just if THIS process is inside tmux.
 */
// isInsideTmux 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isInsideTmux(): Promise<boolean> {
  // `isInsideTmuxCached` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (isInsideTmuxCached !== null) {
    // 返回 `isInsideTmuxCached`，作为共享工具这次计算的结果。
    return isInsideTmuxCached
  }

  // Check the original TMUX env var (captured at module load)
  // This tells us if the user started Claude from within their tmux session
  // If TMUX is not set, we are NOT inside tmux - period.
  // isInsideTmuxCached 缓存更新为 `!!ORIGINAL_USER_TMUX`，确保共享工具后续读取最新状态。
  isInsideTmuxCached = !!ORIGINAL_USER_TMUX
  // 返回 `isInsideTmuxCached`，作为共享工具这次计算的结果。
  return isInsideTmuxCached
}

/**
 * Gets the leader's tmux pane ID captured at module load.
 * Returns null if not running inside tmux.
 */
// getLeaderPaneId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLeaderPaneId(): string | null {
  // 返回 `ORIGINAL_TMUX_PANE || null`，作为共享工具这次计算的结果。
  return ORIGINAL_TMUX_PANE || null
}

/**
 * Checks if tmux is available on the system (installed and in PATH).
 */
// isTmuxAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isTmuxAvailable(): Promise<boolean> {
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow(TMUX_COMMAND, ['-V'])
  // 返回 `result.code === 0`，作为共享工具这次计算的结果。
  return result.code === 0
}

/**
 * Checks if we're currently running inside iTerm2.
 * Uses multiple detection methods:
 * 1. TERM_PROGRAM env var set to "iTerm.app"
 * 2. ITERM_SESSION_ID env var is present
 * 3. env.terminal detection from utils/env.ts
 *
 * Caches the result since this won't change during the process lifetime.
 *
 * Note: iTerm2 backend uses AppleScript (osascript) which is built into macOS,
 * so no external CLI tool installation is required.
 */
// isInITerm2 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInITerm2(): boolean {
  // `isInITerm2Cached` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (isInITerm2Cached !== null) {
    // 返回 `isInITerm2Cached`，作为共享工具这次计算的结果。
    return isInITerm2Cached
  }

  // Check multiple indicators for iTerm2
  // termProgram 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const termProgram = process.env.TERM_PROGRAM
  // hasItermSessionId 会话数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const hasItermSessionId = !!process.env.ITERM_SESSION_ID
  // terminalIsITerm标记共享工具 detection是否启用对应路径。
  const terminalIsITerm = env.terminal === 'iTerm.app'

  // 共享工具 detection在这里处理 `isInITerm2Cached =`，完成这一小步状态转换。
  isInITerm2Cached =
    termProgram === 'iTerm.app' || hasItermSessionId || terminalIsITerm

  // 返回 `isInITerm2Cached`，作为共享工具这次计算的结果。
  return isInITerm2Cached
}

/**
 * The it2 CLI command name.
 */
// IT2_COMMAND 命令数据保存`'it2'`，作为后续固定文本处理的输入。
export const IT2_COMMAND = 'it2'

/**
 * Checks if the it2 CLI tool is available AND can reach the iTerm2 Python API.
 * Uses 'session list' (not '--version') because --version succeeds even when
 * the Python API is disabled in iTerm2 preferences — which would cause
 * 'session split' to fail later with no fallback.
 */
// isIt2CliAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isIt2CliAvailable(): Promise<boolean> {
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow(IT2_COMMAND, ['session', 'list'])
  // 返回 `result.code === 0`，作为共享工具这次计算的结果。
  return result.code === 0
}

/**
 * Resets all cached detection results. Used for testing.
 */
// resetDetectionCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetDetectionCache(): void {
  // isInsideTmuxCached 缓存更新为 `null`，确保共享工具后续读取最新状态。
  isInsideTmuxCached = null
  // isInITerm2Cached 缓存更新为 `null`，确保共享工具后续读取最新状态。
  isInITerm2Cached = null
}
