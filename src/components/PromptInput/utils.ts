// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  hasUsedBackslashReturn,
  isShiftEnterKeyBindingInstalled,
} from '../../commands/terminalSetup/terminalSetup.js'
// 类型依赖 { Key } 来自 ../../ink.js，用于校准终端渲染的数据契约。
import type { Key } from '../../ink.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig } from '../../utils/config.js'
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js'
/**
 * Helper function to check if vim mode is currently enabled
 * @returns boolean indicating if vim mode is active
 */
// isVimModeEnabled 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isVimModeEnabled(): boolean {
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig()
  // 返回 `config.editorMode === 'vim'`，作为终端渲染这次计算的结果。
  return config.editorMode === 'vim'
}

// getNewlineInstructions 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getNewlineInstructions(): string {
  // Apple Terminal on macOS uses native modifier key detection for Shift+Enter
  // 只有 `env.terminal === 'Apple_Terminal' && process.plat` 满足时，终端渲染才执行该分支。
  if (env.terminal === 'Apple_Terminal' && process.platform === 'darwin') {
    // 返回 `'shift + ⏎ for newline'`，作为终端渲染这次计算的结果。
    return 'shift + ⏎ for newline'
  }

  // For iTerm2 and VSCode, show Shift+Enter instructions if installed
  // 满足 `isShiftEnterKeyBindingInstalled()` 时，终端渲染执行该分支。
  if (isShiftEnterKeyBindingInstalled()) {
    // 返回 `'shift + ⏎ for newline'`，作为终端渲染这次计算的结果。
    return 'shift + ⏎ for newline'
  }

  // Otherwise show backslash+return instructions
  // 返回 `hasUsedBackslashReturn()`，作为终端渲染这次计算的结果。
  return hasUsedBackslashReturn()
    ? '\\⏎ for newline'
    : 'backslash (\\) + return (⏎) for newline'
}

/**
 * True when the keystroke is a printable character that does not begin
 * with whitespace — i.e., a normal letter/digit/symbol the user typed.
 * Used to gate the lazy space inserted after an image pill.
 */
// isNonSpacePrintable 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isNonSpacePrintable(input: string, key: Key): boolean {
  // 终端渲染在这里按实际状态进入对应分支。
  if (
    key.ctrl ||
    key.meta ||
    key.escape ||
    key.return ||
    key.tab ||
    key.backspace ||
    key.delete ||
    key.upArrow ||
    key.downArrow ||
    key.leftArrow ||
    key.rightArrow ||
    key.pageUp ||
    key.pageDown ||
    key.home ||
    key.end
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `input.length > 0 && !/^\s/.test(input) && !input.startsWith('\x1b')`，作为终端渲染这次计算的结果。
  return input.length > 0 && !/^\s/.test(input) && !input.startsWith('\x1b')
}
