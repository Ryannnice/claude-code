// 引入 coerce，将 semver 中已经封装好的能力接到本文件流程里。
import { coerce } from 'semver'
// 类型依赖 { Writable } 来自 stream，用于校准终端渲染的数据契约。
import type { Writable } from 'stream'
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js'
// 复用 gte 工具函数，把通用处理留在 ../utils/semver.js 中维护。
import { gte } from '../utils/semver.js'
// 引入 getClearTerminalSequence，将 ./clearTerminal.js 中已经封装好的能力接到本文件流程里。
import { getClearTerminalSequence } from './clearTerminal.js'
// 类型依赖 { Diff } 来自 ./frame.js，用于校准终端渲染的数据契约。
import type { Diff } from './frame.js'
// 引入 cursorMove、cursorTo、eraseLines，将 ./termio/csi.js 中已经封装好的能力接到本文件流程里。
import { cursorMove, cursorTo, eraseLines } from './termio/csi.js'
// 引入 BSU、ESU、HIDE_CURSOR、SHOW_CURSOR，将 ./termio/dec.js 中已经封装好的能力接到本文件流程里。
import { BSU, ESU, HIDE_CURSOR, SHOW_CURSOR } from './termio/dec.js'
// 引入 link，将 ./termio/osc.js 中已经封装好的能力接到本文件流程里。
import { link } from './termio/osc.js'

// Progress 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Progress = {
  state: 'running' | 'completed' | 'error' | 'indeterminate'
  percentage?: number
}

/**
 * Checks if the terminal supports OSC 9;4 progress reporting.
 * Supported terminals:
 * - ConEmu (Windows) - all versions
 * - Ghostty 1.2.0+
 * - iTerm2 3.6.6+
 *
 * Note: Windows Terminal interprets OSC 9;4 as notifications, not progress.
 */
// isProgressReportingAvailable 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isProgressReportingAvailable(): boolean {
  // Only available if we have a TTY (not piped)
  // process.stdout.isTTY缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!process.stdout.isTTY) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Explicitly exclude Windows Terminal, which interprets OSC 9;4 as
  // notifications rather than progress indicators
  // 满足 `process.env.WT_SESSION` 时，终端渲染执行该分支。
  if (process.env.WT_SESSION) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // ConEmu supports OSC 9;4 for progress (all versions)
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    process.env.ConEmuANSI ||
    process.env.ConEmuPID ||
    process.env.ConEmuTask
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // version保存`coerce`，供终端渲染后续处理使用。
  const version = coerce(process.env.TERM_PROGRAM_VERSION)
  // version缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!version) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Ghostty 1.2.0+ supports OSC 9;4 for progress
  // https://ghostty.org/docs/install/release-notes/1-2-0
  // 当 `process.env.TERM_PROGRAM` 匹配 `'ghostty'` 时，终端渲染执行对应分支。
  if (process.env.TERM_PROGRAM === 'ghostty') {
    // 返回 `gte(version.version, '1.2.0')`，作为终端渲染这次计算的结果。
    return gte(version.version, '1.2.0')
  }

  // iTerm2 3.6.6+ supports OSC 9;4 for progress
  // https://iterm2.com/downloads.html
  // 当 `process.env.TERM_PROGRAM` 匹配 `'iTerm.app'` 时，终端渲染执行对应分支。
  if (process.env.TERM_PROGRAM === 'iTerm.app') {
    // 返回 `gte(version.version, '3.6.6')`，作为终端渲染这次计算的结果。
    return gte(version.version, '3.6.6')
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Checks if the terminal supports DEC mode 2026 (synchronized output).
 * When supported, BSU/ESU sequences prevent visible flicker during redraws.
 */
// isSynchronizedOutputSupported 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSynchronizedOutputSupported(): boolean {
  // tmux parses and proxies every byte but doesn't implement DEC 2026.
  // BSU/ESU pass through to the outer terminal but tmux has already
  // broken atomicity by chunking. Skip to save 16 bytes/frame + parser work.
  // 满足 `process.env.TMUX` 时，终端渲染执行该分支。
  if (process.env.TMUX) return false

  // termProgram 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const termProgram = process.env.TERM_PROGRAM
  // term 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const term = process.env.TERM

  // Modern terminals with known DEC 2026 support
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    termProgram === 'iTerm.app' ||
    termProgram === 'WezTerm' ||
    termProgram === 'WarpTerminal' ||
    termProgram === 'ghostty' ||
    termProgram === 'contour' ||
    termProgram === 'vscode' ||
    termProgram === 'alacritty'
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // kitty sets TERM=xterm-kitty or KITTY_WINDOW_ID
  // 只有 `term?.includes('kitty') || process.env.KITTY_WINDOW_ID` 满足时，终端渲染才执行该分支。
  if (term?.includes('kitty') || process.env.KITTY_WINDOW_ID) return true

  // Ghostty may set TERM=xterm-ghostty without TERM_PROGRAM
  // 当 `term` 匹配 `'xterm-ghostty'` 时，终端渲染执行对应分支。
  if (term === 'xterm-ghostty') return true

  // foot sets TERM=foot or TERM=foot-extra
  // 满足 `term?.startsWith('foot')` 时，终端渲染执行该分支。
  if (term?.startsWith('foot')) return true

  // Alacritty may set TERM containing 'alacritty'
  // 满足 `term?.includes('alacritty')` 时，终端渲染执行该分支。
  if (term?.includes('alacritty')) return true

  // Zed uses the alacritty_terminal crate which supports DEC 2026
  // 满足 `process.env.ZED_TERM` 时，终端渲染执行该分支。
  if (process.env.ZED_TERM) return true

  // Windows Terminal
  // 满足 `process.env.WT_SESSION` 时，终端渲染执行该分支。
  if (process.env.WT_SESSION) return true

  // VTE-based terminals (GNOME Terminal, Tilix, etc.) since VTE 0.68
  // vteVersion 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const vteVersion = process.env.VTE_VERSION
  // 满足 `vteVersion` 时，终端渲染执行该分支。
  if (vteVersion) {
    // version解析`parseInt`，供终端渲染后续处理使用。
    const version = parseInt(vteVersion, 10)
    // 满足 `version >= 6800` 时，终端渲染执行该分支。
    if (version >= 6800) return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// -- XTVERSION-detected terminal name (populated async at startup) --
//
// TERM_PROGRAM is not forwarded over SSH by default, so env-based detection
// fails when claude runs remotely inside a VS Code integrated terminal.
// XTVERSION (CSI > 0 q → DCS > | name ST) goes through the pty — the query
// reaches the *client* terminal and the reply comes back through stdin.
// App.tsx fires the query when raw mode enables; setXtversionName() is called
// from the response handler. Readers should treat undefined as "not yet known"
// and fall back to env-var detection.

// xtversionName 先占位，稍后的条件分支会根据实际输入补齐它。
let xtversionName: string | undefined

/** Record the XTVERSION response. Called once from App.tsx when the reply
 *  arrives on stdin. No-op if already set (defend against re-probe). */
// setXtversionName 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setXtversionName(name: string): void {
  // 满足 `xtversionName === undefined` 时，终端渲染执行该分支。
  if (xtversionName === undefined) xtversionName = name
}

/** True if running in an xterm.js-based terminal (VS Code, Cursor, Windsurf
 *  integrated terminals). Combines TERM_PROGRAM env check (fast, sync, but
 *  not forwarded over SSH) with the XTVERSION probe result (async, survives
 *  SSH — query/reply goes through the pty). Early calls may miss the probe
 *  reply — call lazily (e.g. in an event handler) if SSH detection matters. */
// isXtermJs 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isXtermJs(): boolean {
  // 当 `process.env.TERM_PROGRAM` 匹配 `'vscode'` 时，终端渲染执行对应分支。
  if (process.env.TERM_PROGRAM === 'vscode') return true
  // 返回 `xtversionName?.startsWith('xterm.js') ?? false`，作为终端渲染这次计算的结果。
  return xtversionName?.startsWith('xterm.js') ?? false
}

// Terminals known to correctly implement the Kitty keyboard protocol
// (CSI >1u) and/or xterm modifyOtherKeys (CSI >4;2m) for ctrl+shift+<letter>
// disambiguation. We previously enabled unconditionally (#23350), assuming
// terminals silently ignore unknown CSI — but some terminals honor the enable
// and emit codepoints our input parser doesn't handle (notably over SSH and
// in xterm.js-based terminals like VS Code). tmux is allowlisted because it
// accepts modifyOtherKeys and doesn't forward the kitty sequence to the outer
// terminal.
// EXTENDED_KEYS_TERMINALS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const EXTENDED_KEYS_TERMINALS = [
  'iTerm.app',
  'kitty',
  'WezTerm',
  'ghostty',
  'tmux',
  'windows-terminal',
]

/** True if this terminal correctly handles extended key reporting
 *  (Kitty keyboard protocol + xterm modifyOtherKeys). */
// supportsExtendedKeys 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function supportsExtendedKeys(): boolean {
  // 返回 `EXTENDED_KEYS_TERMINALS.includes(env.terminal ?? '')`，作为终端渲染这次计算的结果。
  return EXTENDED_KEYS_TERMINALS.includes(env.terminal ?? '')
}

/** True if the terminal scrolls the viewport when it receives cursor-up
 *  sequences that reach above the visible area. On Windows, conhost's
 *  SetConsoleCursorPosition follows the cursor into scrollback
 *  (microsoft/terminal#14774), yanking users to the top of their buffer
 *  mid-stream. WT_SESSION catches WSL-in-Windows-Terminal where platform
 *  is linux but output still routes through conhost. */
// hasCursorUpViewportYankBug 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasCursorUpViewportYankBug(): boolean {
  // 返回 `process.platform === 'win32' || !!process.env.WT_SESSION`，作为终端渲染这次计算的结果。
  return process.platform === 'win32' || !!process.env.WT_SESSION
}

// Computed once at module load — terminal capabilities don't change mid-session.
// Exported so callers can pass a sync-skip hint gated to specific modes.
// SYNC_OUTPUT_SUPPORTED保存`isSynchronizedOutputSupported`，供终端渲染后续处理使用。
export const SYNC_OUTPUT_SUPPORTED = isSynchronizedOutputSupported()

// Terminal 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Terminal = {
  stdout: Writable
  stderr: Writable
}

// writeDiffToTerminal 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function writeDiffToTerminal(
  terminal: Terminal,
  diff: Diff,
  skipSyncMarkers = false,
): void {
  // No output if there are no patches
  // diff为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (diff.length === 0) {
    // Ink 渲染层 terminal在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // BSU/ESU wrapping is opt-out to keep main-screen behavior unchanged.
  // Callers pass skipSyncMarkers=true when the terminal doesn't support
  // DEC 2026 (e.g. tmux) AND the cost matters (high-frequency alt-screen).
  // useSync标记Ink 渲染层 terminal是否启用对应路径。
  const useSync = !skipSyncMarkers

  // Buffer all writes into a single string to avoid multiple write calls
  // buffer读取 hook 状态，供Ink 渲染层 terminal本轮渲染使用。
  let buffer = useSync ? BSU : ''

  // 按顺序遍历 `diff` 中的patch，逐个交给终端渲染处理。
  for (const patch of diff) {
    // 按照 patch.type 的取值选择终端渲染的具体处理分支。
    switch (patch.type) {
      case 'stdout':
        // Ink 渲染层 terminal在这里处理 `buffer += patch.content`，完成这一小步状态转换。
        buffer += patch.content
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'clear':
        // 满足 `patch.count > 0` 时，终端渲染执行该分支。
        if (patch.count > 0) {
          // Ink 渲染层 terminal在这里处理 `buffer += eraseLines(patch.count)`，完成这一小步状态转换。
          buffer += eraseLines(patch.count)
        }
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'clearTerminal':
        // Ink 渲染层 terminal在这里处理 `buffer += getClearTerminalSequence()`，完成这一小步状态转换。
        buffer += getClearTerminalSequence()
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'cursorHide':
        // Ink 渲染层 terminal在这里处理 `buffer += HIDE_CURSOR`，完成这一小步状态转换。
        buffer += HIDE_CURSOR
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'cursorShow':
        // Ink 渲染层 terminal在这里处理 `buffer += SHOW_CURSOR`，完成这一小步状态转换。
        buffer += SHOW_CURSOR
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'cursorMove':
        // Ink 渲染层 terminal在这里处理 `buffer += cursorMove(patch.x, patch.y)`，完成这一小步状态转换。
        buffer += cursorMove(patch.x, patch.y)
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'cursorTo':
        // Ink 渲染层 terminal在这里处理 `buffer += cursorTo(patch.col)`，完成这一小步状态转换。
        buffer += cursorTo(patch.col)
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'carriageReturn':
        // Ink 渲染层 terminal在这里处理 `buffer += '\r'`，完成这一小步状态转换。
        buffer += '\r'
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'hyperlink':
        // Ink 渲染层 terminal在这里处理 `buffer += link(patch.uri)`，完成这一小步状态转换。
        buffer += link(patch.uri)
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'styleStr':
        // Ink 渲染层 terminal在这里处理 `buffer += patch.str`，完成这一小步状态转换。
        buffer += patch.str
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
    }
  }

  // Add synchronized update end and flush buffer
  // 满足 `useSync` 时，终端渲染执行该分支。
  if (useSync) buffer += ESU
  // 调用 terminal.stdout.write，触发终端渲染此处需要的副作用。
  terminal.stdout.write(buffer)
}
