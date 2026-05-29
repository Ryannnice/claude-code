// Auto mode state functions — lives in its own module so callers can
// conditionally require() it on feature('TRANSCRIPT_CLASSIFIER').

// autoModeActive标记权限判定权限工具 auto Mode State是否启用对应路径。
let autoModeActive = false
// autoModeFlagCli标记权限判定权限工具 auto Mode State是否启用对应路径。
let autoModeFlagCli = false
// Set by the async verifyAutoModeGateAccess check when it
// reads a fresh tengu_auto_mode_config.enabled === 'disabled' from GrowthBook.
// Used by isAutoModeGateEnabled() to block SDK/explicit re-entry after kick-out.
// autoModeCircuitBroken标记权限判定权限工具 auto Mode State是否启用对应路径。
let autoModeCircuitBroken = false

// setAutoModeActive 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAutoModeActive(active: boolean): void {
  // autoModeActive更新为 `active`，确保权限工具后续读取最新状态。
  autoModeActive = active
}

// isAutoModeActive 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoModeActive(): boolean {
  // 返回 `autoModeActive`，作为权限判定这次计算的结果。
  return autoModeActive
}

// setAutoModeFlagCli 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAutoModeFlagCli(passed: boolean): void {
  // autoModeFlagCli更新为 `passed`，确保权限工具后续读取最新状态。
  autoModeFlagCli = passed
}

// getAutoModeFlagCli 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoModeFlagCli(): boolean {
  // 返回 `autoModeFlagCli`，作为权限判定这次计算的结果。
  return autoModeFlagCli
}

// setAutoModeCircuitBroken 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAutoModeCircuitBroken(broken: boolean): void {
  // autoModeCircuitBroken更新为 `broken`，确保权限工具后续读取最新状态。
  autoModeCircuitBroken = broken
}

// isAutoModeCircuitBroken 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoModeCircuitBroken(): boolean {
  // 返回 `autoModeCircuitBroken`，作为权限判定这次计算的结果。
  return autoModeCircuitBroken
}

// _resetForTesting 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetForTesting(): void {
  // autoModeActive更新为 `false`，确保权限工具后续读取最新状态。
  autoModeActive = false
  // autoModeFlagCli更新为 `false`，确保权限工具后续读取最新状态。
  autoModeFlagCli = false
  // autoModeCircuitBroken更新为 `false`，确保权限工具后续读取最新状态。
  autoModeCircuitBroken = false
}
