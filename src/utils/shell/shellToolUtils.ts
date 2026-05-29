// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 接入 POWERSHELL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { POWERSHELL_TOOL_NAME } from '../../tools/PowerShellTool/toolName.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from '../envUtils.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'

// SHELL_TOOL_NAMES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const SHELL_TOOL_NAMES: string[] = [BASH_TOOL_NAME, POWERSHELL_TOOL_NAME]

/**
 * Runtime gate for PowerShellTool. Windows-only (the permission engine uses
 * Win32-specific path normalizations). Ant defaults on (opt-out via env=0);
 * external defaults off (opt-in via env=1).
 *
 * Used by tools.ts (tool-list visibility), processBashCommand (! routing),
 * and promptShellExecution (skill frontmatter routing) so the gate is
 * consistent across all paths that invoke PowerShellTool.call().
 */
// isPowerShellToolEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPowerShellToolEnabled(): boolean {
  // `getPlatform()` 与 `'windows'` 不一致时刷新派生状态，避免使用过期结果。
  if (getPlatform() !== 'windows') return false
  // 返回 `process.env.USER_TYPE === 'ant'`，作为共享工具这次计算的结果。
  return process.env.USER_TYPE === 'ant'
    ? !isEnvDefinedFalsy(process.env.CLAUDE_CODE_USE_POWERSHELL_TOOL)
    : isEnvTruthy(process.env.CLAUDE_CODE_USE_POWERSHELL_TOOL)
}
