/**
 * Leader Permission Bridge
 *
 * Module-level bridge that allows the REPL to register its setToolUseConfirmQueue
 * and setToolPermissionContext functions for in-process teammates to use.
 *
 * When an in-process teammate requests permissions, it uses the standard
 * ToolUseConfirm dialog rather than the worker permission badge. This bridge
 * makes the REPL's queue setter and permission context setter accessible
 * from non-React code in the in-process runner.
 */

// 类型依赖 { ToolUseConfirm } 来自 ../../components/permissions/PermissionRequest.js，用于校准共享工具的数据契约。
import type { ToolUseConfirm } from '../../components/permissions/PermissionRequest.js'
// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'

// SetToolUseConfirmQueueFn 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SetToolUseConfirmQueueFn = (
  // 这个回调绑定到 updater: (prev: ToolUseConfirm[]) => ToolUseConfirm[],，负责共享工具在该局部场景下的响应。
  updater: (prev: ToolUseConfirm[]) => ToolUseConfirm[],
) => void

// SetToolPermissionContextFn 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SetToolPermissionContextFn = (
  context: ToolPermissionContext,
  options?: { preserveMode?: boolean },
) => void

// registeredSetter保存`null`，作为后续空值处理的输入。
let registeredSetter: SetToolUseConfirmQueueFn | null = null
// registeredPermissionContextSetter 权限数据初始化为空值，后续分支会在有数据时补齐。
let registeredPermissionContextSetter: SetToolPermissionContextFn | null = null

// registerLeaderToolUseConfirmQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerLeaderToolUseConfirmQueue(
  setter: SetToolUseConfirmQueueFn,
): void {
  // registeredSetter更新为 `setter`，确保共享工具后续读取最新状态。
  registeredSetter = setter
}

// getLeaderToolUseConfirmQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLeaderToolUseConfirmQueue(): SetToolUseConfirmQueueFn | null {
  // 返回 `registeredSetter`，作为共享工具这次计算的结果。
  return registeredSetter
}

// unregisterLeaderToolUseConfirmQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unregisterLeaderToolUseConfirmQueue(): void {
  // registeredSetter更新为 `null`，确保共享工具后续读取最新状态。
  registeredSetter = null
}

// registerLeaderSetToolPermissionContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerLeaderSetToolPermissionContext(
  setter: SetToolPermissionContextFn,
): void {
  // registeredPermissionContextSetter 权限数据更新为 `setter`，确保共享工具后续读取最新状态。
  registeredPermissionContextSetter = setter
}

// getLeaderSetToolPermissionContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLeaderSetToolPermissionContext(): SetToolPermissionContextFn | null {
  // 返回 `registeredPermissionContextSetter`，作为共享工具这次计算的结果。
  return registeredPermissionContextSetter
}

// unregisterLeaderSetToolPermissionContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unregisterLeaderSetToolPermissionContext(): void {
  // registeredPermissionContextSetter 权限数据更新为 `null`，确保共享工具后续读取最新状态。
  registeredPermissionContextSetter = null
}
