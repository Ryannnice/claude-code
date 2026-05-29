// 引入 getInitialSettings，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from '../settings/settings.js'

/**
 * Resolve the default shell for input-box `!` commands.
 *
 * Resolution order (docs/design/ps-shell-selection.md §4.2):
 *   settings.defaultShell → 'bash'
 *
 * Platform default is 'bash' everywhere — we do NOT auto-flip Windows to
 * PowerShell (would break existing Windows users with bash hooks).
 */
// resolveDefaultShell 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveDefaultShell(): 'bash' | 'powershell' {
  // 返回 `getInitialSettings().defaultShell ?? 'bash'`，作为共享工具这次计算的结果。
  return getInitialSettings().defaultShell ?? 'bash'
}
