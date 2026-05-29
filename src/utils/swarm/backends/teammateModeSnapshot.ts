/**
 * Teammate mode snapshot module.
 *
 * Captures the teammate mode at session startup, following the same pattern
 * as hooksConfigSnapshot.ts. This ensures that runtime config changes don't
 * affect the teammate mode for the current session.
 */

// 复用 getGlobalConfig 工具函数，把通用处理留在 ../../../utils/config.js 中维护。
import { getGlobalConfig } from '../../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../../utils/debug.js 中维护。
import { logForDebugging } from '../../../utils/debug.js'
// 复用 logError 工具函数，把通用处理留在 ../../../utils/log.js 中维护。
import { logError } from '../../../utils/log.js'

// TeammateMode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateMode = 'auto' | 'tmux' | 'in-process'

// Module-level variable to hold the captured mode at startup
// initialTeammateMode初始化为空值，后续分支会在有数据时补齐。
let initialTeammateMode: TeammateMode | null = null

// CLI override (set before capture if --teammate-mode is provided)
// cliTeammateModeOverride初始化为空值，后续分支会在有数据时补齐。
let cliTeammateModeOverride: TeammateMode | null = null

/**
 * Set the CLI override for teammate mode.
 * Must be called before captureTeammateModeSnapshot().
 */
// setCliTeammateModeOverride 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCliTeammateModeOverride(mode: TeammateMode): void {
  // cliTeammateModeOverride更新为 `mode`，确保共享工具后续读取最新状态。
  cliTeammateModeOverride = mode
}

/**
 * Get the current CLI override, if any.
 * Returns null if no CLI override was set.
 */
// getCliTeammateModeOverride 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCliTeammateModeOverride(): TeammateMode | null {
  // 返回 `cliTeammateModeOverride`，作为共享工具这次计算的结果。
  return cliTeammateModeOverride
}

/**
 * Clear the CLI override and update the snapshot to the new mode.
 * Called when user changes the setting in the UI, allowing their change to take effect.
 *
 * @param newMode - The new mode the user selected (passed directly to avoid race condition)
 */
// clearCliTeammateModeOverride 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearCliTeammateModeOverride(newMode: TeammateMode): void {
  // cliTeammateModeOverride更新为 `null`，确保共享工具后续读取最新状态。
  cliTeammateModeOverride = null
  // initialTeammateMode更新为 `newMode`，确保共享工具后续读取最新状态。
  initialTeammateMode = newMode
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateModeSnapshot] CLI override cleared, new mode: ${newMode}`,
  )
}

/**
 * Capture the teammate mode at session startup.
 * Called early in main.tsx, after CLI args are parsed.
 * CLI override takes precedence over config.
 */
// captureTeammateModeSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function captureTeammateModeSnapshot(): void {
  // 满足 `cliTeammateModeOverride` 时，共享工具执行该分支。
  if (cliTeammateModeOverride) {
    // initialTeammateMode更新为 `cliTeammateModeOverride`，确保共享工具后续读取最新状态。
    initialTeammateMode = cliTeammateModeOverride
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateModeSnapshot] Captured from CLI override: ${initialTeammateMode}`,
    )
  } else {
    // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
    const config = getGlobalConfig()
    // initialTeammateMode更新为 `config.teammateMode ?? 'auto'`，确保共享工具后续读取最新状态。
    initialTeammateMode = config.teammateMode ?? 'auto'
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateModeSnapshot] Captured from config: ${initialTeammateMode}`,
    )
  }
}

/**
 * Get the teammate mode for this session.
 * Returns the snapshot captured at startup, ignoring any runtime config changes.
 */
// getTeammateModeFromSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeammateModeFromSnapshot(): TeammateMode {
  // 满足 `initialTeammateMode === null` 时，共享工具执行该分支。
  if (initialTeammateMode === null) {
    // This indicates an initialization bug - capture should happen in setup()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        'getTeammateModeFromSnapshot called before capture - this indicates an initialization bug',
      ),
    )
    // 调用 captureTeammateModeSnapshot，触发共享工具此处需要的副作用。
    captureTeammateModeSnapshot()
  }
  // Fallback to 'auto' if somehow still null (shouldn't happen, but safe)
  // 返回 `initialTeammateMode ?? 'auto'`，作为共享工具这次计算的结果。
  return initialTeammateMode ?? 'auto'
}
