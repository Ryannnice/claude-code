// 引入 resetSdkInitState，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { resetSdkInitState } from '../../bootstrap/state.js'
// 引入 isRestrictedToPluginOnly，将 ../settings/pluginOnlyPolicy.js 中已经封装好的能力接到本文件流程里。
import { isRestrictedToPluginOnly } from '../settings/pluginOnlyPolicy.js'
// Import as module object so spyOn works in tests (direct imports bypass spies)
// 引入 * as settingsModule，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import * as settingsModule from '../settings/settings.js'
// 引入 resetSettingsCache，将 ../settings/settingsCache.js 中已经封装好的能力接到本文件流程里。
import { resetSettingsCache } from '../settings/settingsCache.js'
// 类型依赖 { HooksSettings } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { HooksSettings } from '../settings/types.js'

// initialHooksConfig 配置保存`null`，作为后续空值处理的输入。
let initialHooksConfig: HooksSettings | null = null

/**
 * Get hooks from allowed sources.
 * If allowManagedHooksOnly is set in policySettings, only managed hooks are returned.
 * If disableAllHooks is set in policySettings, no hooks are returned.
 * If disableAllHooks is set in non-managed settings, only managed hooks are returned
 * (non-managed settings cannot disable managed hooks).
 * Otherwise, returns merged hooks from all sources (backwards compatible).
 */
// getHooksFromAllowedSources 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHooksFromAllowedSources(): HooksSettings {
  // policySettings 集合读取`settingsModule.getSettingsForSource`，供共享工具后续处理使用。
  const policySettings = settingsModule.getSettingsForSource('policySettings')

  // If managed settings disables all hooks, return empty
  // 满足 `policySettings?.disableAllHooks === true` 时，共享工具执行该分支。
  if (policySettings?.disableAllHooks === true) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }

  // If allowManagedHooksOnly is set in managed settings, only use managed hooks
  // 满足 `policySettings?.allowManagedHooksOnly === true` 时，共享工具执行该分支。
  if (policySettings?.allowManagedHooksOnly === true) {
    // 返回 `policySettings.hooks ?? {}`，作为共享工具这次计算的结果。
    return policySettings.hooks ?? {}
  }

  // strictPluginOnlyCustomization: block user/project/local settings hooks.
  // Plugin hooks (registered channel, hooks.ts:1391) are NOT affected —
  // they're assembled separately and the managedOnly skip there is keyed
  // on shouldAllowManagedHooksOnly(), not on this policy. Agent frontmatter
  // hooks are gated at REGISTRATION (runAgent.ts:~535) by agent source —
  // plugin/built-in/policySettings agents register normally, user-sourced
  // agents skip registration under ["hooks"]. A blanket execution-time
  // block here would over-kill plugin agents' hooks.
  // 满足 `isRestrictedToPluginOnly('hooks')` 时，共享工具执行该分支。
  if (isRestrictedToPluginOnly('hooks')) {
    // 返回 `policySettings?.hooks ?? {}`，作为共享工具这次计算的结果。
    return policySettings?.hooks ?? {}
  }

  // mergedSettings 集合读取`settingsModule.getSettings_DEPRECATED`，供共享工具后续处理使用。
  const mergedSettings = settingsModule.getSettings_DEPRECATED()

  // If disableAllHooks is set in non-managed settings, only managed hooks still run
  // (non-managed settings cannot override managed hooks)
  // 满足 `mergedSettings.disableAllHooks === true` 时，共享工具执行该分支。
  if (mergedSettings.disableAllHooks === true) {
    // 返回 `policySettings?.hooks ?? {}`，作为共享工具这次计算的结果。
    return policySettings?.hooks ?? {}
  }

  // Otherwise, use all hooks (merged from all sources) - backwards compatible
  // 返回 `mergedSettings.hooks ?? {}`，作为共享工具这次计算的结果。
  return mergedSettings.hooks ?? {}
}

/**
 * Check if only managed hooks should run.
 * This is true when:
 * - policySettings has allowManagedHooksOnly: true, OR
 * - disableAllHooks is set in non-managed settings (non-managed settings
 *   cannot disable managed hooks, so they effectively become managed-only)
 */
// shouldAllowManagedHooksOnly 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldAllowManagedHooksOnly(): boolean {
  // policySettings 集合读取`settingsModule.getSettingsForSource`，供共享工具后续处理使用。
  const policySettings = settingsModule.getSettingsForSource('policySettings')
  // 满足 `policySettings?.allowManagedHooksOnly === true` 时，共享工具执行该分支。
  if (policySettings?.allowManagedHooksOnly === true) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // If disableAllHooks is set but NOT from managed settings,
  // treat as managed-only (non-managed hooks disabled, managed hooks still run)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    settingsModule.getSettings_DEPRECATED().disableAllHooks === true &&
    policySettings?.disableAllHooks !== true
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if all hooks (including managed) should be disabled.
 * This is only true when managed/policy settings has disableAllHooks: true.
 * When disableAllHooks is set in non-managed settings, managed hooks still run.
 */
// shouldDisableAllHooksIncludingManaged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldDisableAllHooksIncludingManaged(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    settingsModule.getSettingsForSource('policySettings')?.disableAllHooks ===
    true
  )
}

/**
 * Capture a snapshot of the current hooks configuration
 * This should be called once during application startup
 * Respects the allowManagedHooksOnly setting
 */
// captureHooksConfigSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function captureHooksConfigSnapshot(): void {
  // initialHooksConfig 配置更新为 `getHooksFromAllowedSources()`，确保共享工具后续读取最新状态。
  initialHooksConfig = getHooksFromAllowedSources()
}

/**
 * Update the hooks configuration snapshot
 * This should be called when hooks are modified through the settings
 * Respects the allowManagedHooksOnly setting
 */
// updateHooksConfigSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateHooksConfigSnapshot(): void {
  // Reset the session cache to ensure we read fresh settings from disk.
  // Without this, the snapshot could use stale cached settings when the user
  // edits settings.json externally and then runs /hooks - the session cache
  // may not have been invalidated yet (e.g., if the file watcher's stability
  // threshold hasn't elapsed).
  // 调用 resetSettingsCache，触发共享工具此处需要的副作用。
  resetSettingsCache()
  // initialHooksConfig 配置更新为 `getHooksFromAllowedSources()`，确保共享工具后续读取最新状态。
  initialHooksConfig = getHooksFromAllowedSources()
}

/**
 * Get the current hooks configuration from snapshot
 * Falls back to settings if no snapshot exists
 * @returns The hooks configuration
 */
// getHooksConfigFromSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHooksConfigFromSnapshot(): HooksSettings | null {
  // 满足 `initialHooksConfig === null` 时，共享工具执行该分支。
  if (initialHooksConfig === null) {
    // 调用 captureHooksConfigSnapshot，触发共享工具此处需要的副作用。
    captureHooksConfigSnapshot()
  }
  // 返回 `initialHooksConfig`，作为共享工具这次计算的结果。
  return initialHooksConfig
}

/**
 * Reset the hooks configuration snapshot (useful for testing)
 * Also resets SDK init state to prevent test pollution
 */
// resetHooksConfigSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetHooksConfigSnapshot(): void {
  // initialHooksConfig 配置更新为 `null`，确保共享工具后续读取最新状态。
  initialHooksConfig = null
  // 调用 resetSdkInitState，触发共享工具此处需要的副作用。
  resetSdkInitState()
}
