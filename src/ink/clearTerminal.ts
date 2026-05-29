/**
 * Cross-platform terminal clearing with scrollback support.
 * Detects modern terminals that support ESC[3J for clearing scrollback.
 */

// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  CURSOR_HOME,
  csi,
  ERASE_SCREEN,
  ERASE_SCROLLBACK,
} from './termio/csi.js'

// HVP (Horizontal Vertical Position) - legacy Windows cursor home
// CURSOR_HOME_WINDOWS 集合保存`csi`，供终端渲染后续处理使用。
const CURSOR_HOME_WINDOWS = csi(0, 'f')

// isWindowsTerminal 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isWindowsTerminal(): boolean {
  // 返回 `process.platform === 'win32' && !!process.env.WT_SESSION`，作为终端渲染这次计算的结果。
  return process.platform === 'win32' && !!process.env.WT_SESSION
}

// isMintty 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMintty(): boolean {
  // mintty 3.1.5+ sets TERM_PROGRAM to 'mintty'
  // 当 `process.env.TERM_PROGRAM` 匹配 `'mintty'` 时，终端渲染执行对应分支。
  if (process.env.TERM_PROGRAM === 'mintty') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // GitBash/MSYS2/MINGW use mintty and set MSYSTEM
  // 只有 `process.platform === 'win32' && process.env.MSYST` 满足时，终端渲染才执行该分支。
  if (process.platform === 'win32' && process.env.MSYSTEM) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// isModernWindowsTerminal 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isModernWindowsTerminal(): boolean {
  // Windows Terminal sets WT_SESSION environment variable
  // 满足 `isWindowsTerminal()` 时，终端渲染执行该分支。
  if (isWindowsTerminal()) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // VS Code integrated terminal on Windows with ConPTY support
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    process.platform === 'win32' &&
    process.env.TERM_PROGRAM === 'vscode' &&
    process.env.TERM_PROGRAM_VERSION
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // mintty (GitBash/MSYS2/Cygwin) supports modern escape sequences
  // 满足 `isMintty()` 时，终端渲染执行该分支。
  if (isMintty()) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Returns the ANSI escape sequence to clear the terminal including scrollback.
 * Automatically detects terminal capabilities.
 */
// getClearTerminalSequence 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClearTerminalSequence(): string {
  // 当 `process.platform` 匹配 `'win32'` 时，终端渲染执行对应分支。
  if (process.platform === 'win32') {
    // 满足 `isModernWindowsTerminal()` 时，终端渲染执行该分支。
    if (isModernWindowsTerminal()) {
      // 返回 `ERASE_SCREEN + ERASE_SCROLLBACK + CURSOR_HOME`，作为终端渲染这次计算的结果。
      return ERASE_SCREEN + ERASE_SCROLLBACK + CURSOR_HOME
    } else {
      // Legacy Windows console - can't clear scrollback
      // 返回 `ERASE_SCREEN + CURSOR_HOME_WINDOWS`，作为终端渲染这次计算的结果。
      return ERASE_SCREEN + CURSOR_HOME_WINDOWS
    }
  }
  // 返回 `ERASE_SCREEN + ERASE_SCROLLBACK + CURSOR_HOME`，作为终端渲染这次计算的结果。
  return ERASE_SCREEN + ERASE_SCROLLBACK + CURSOR_HOME
}

/**
 * Clears the terminal screen. On supported terminals, also clears scrollback.
 */
// clearTerminal读取`getClearTerminalSequence`，供终端渲染后续处理使用。
export const clearTerminal = getClearTerminalSequence()
