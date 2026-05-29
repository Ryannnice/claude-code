// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  DANGEROUS_SHELL_SETTINGS,
  SAFE_ENV_VARS,
} from '../../utils/managedEnvConstants.js'
// 类型依赖 { SettingsJson } 来自 ../../utils/settings/types.js，用于校准终端渲染的数据契约。
import type { SettingsJson } from '../../utils/settings/types.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'

// DangerousShellSetting 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DangerousShellSetting = (typeof DANGEROUS_SHELL_SETTINGS)[number]

// DangerousSettings 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type DangerousSettings = {
  shellSettings: Partial<Record<DangerousShellSetting, string>>
  envVars: Record<string, string>
  hasHooks: boolean
  hooks?: unknown
}

/**
 * Extract dangerous settings from a settings object.
 *
 * Dangerous env vars are determined by checking against SAFE_ENV_VARS -
 * any env var NOT in SAFE_ENV_VARS is considered dangerous.
 * See managedEnv.ts for the authoritative list and threat categories.
 */
// extractDangerousSettings 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractDangerousSettings(
  settings: SettingsJson | null | undefined,
): DangerousSettings {
  // settings 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!settings) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      shellSettings: {},
      envVars: {},
      hasHooks: false,
    }
  }

  // Extract dangerous shell settings
  // shellSettings 集合 从空对象开始收集键值，后续按名称补齐内容。
  const shellSettings: Partial<Record<DangerousShellSetting, string>> = {}
  // 按顺序遍历 `DANGEROUS_SHELL_SETTINGS` 中的key，逐个交给终端渲染处理。
  for (const key of DANGEROUS_SHELL_SETTINGS) {
    // 取值读取 `settings[key]` 对应条目，后续围绕该成员继续处理。
    const value = settings[key]
    // 只有 `typeof value === 'string' && value.length > 0` 满足时，终端渲染才执行该分支。
    if (typeof value === 'string' && value.length > 0) {
      // shellSettings[key更新为 `value`，确保终端 UI 组件 utils后续读取最新状态。
      shellSettings[key] = value
    }
  }

  // Extract dangerous env vars - any var NOT in SAFE_ENV_VARS is dangerous
  // envVars 集合 从空对象开始收集键值，后续按名称补齐内容。
  const envVars: Record<string, string> = {}
  // 当 `settings.env && typeof settings.env` 匹配 `'object'` 时，终端渲染执行对应分支。
  if (settings.env && typeof settings.env === 'object') {
    // 循环处理 `const [key, value] of Object.entries(settings.env)`，让终端渲染把同类条目按顺序走完。
    for (const [key, value] of Object.entries(settings.env)) {
      // 只有 `typeof value === 'string' && value.length > 0` 满足时，终端渲染才执行该分支。
      if (typeof value === 'string' && value.length > 0) {
        // Check if this env var is NOT in the safe list
        // 满足 `!SAFE_ENV_VARS.has(key.toUpperCase())` 时，终端渲染执行该分支。
        if (!SAFE_ENV_VARS.has(key.toUpperCase())) {
          // envVars[key更新为 `value`，确保终端 UI 组件 utils后续读取最新状态。
          envVars[key] = value
        }
      }
    }
  }

  // Check for hooks
  // hasHooks 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasHooks =
    settings.hooks !== undefined &&
    settings.hooks !== null &&
    typeof settings.hooks === 'object' &&
    Object.keys(settings.hooks).length > 0

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    shellSettings,
    envVars,
    hasHooks,
    hooks: hasHooks ? settings.hooks : undefined,
  }
}

/**
 * Check if settings contain any dangerous settings
 */
// hasDangerousSettings 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasDangerousSettings(dangerous: DangerousSettings): boolean {
  // 返回 `(`，作为终端渲染这次计算的结果。
  return (
    Object.keys(dangerous.shellSettings).length > 0 ||
    Object.keys(dangerous.envVars).length > 0 ||
    dangerous.hasHooks
  )
}

/**
 * Compare two sets of dangerous settings to see if the new settings
 * have changed or added dangerous settings compared to the old settings
 */
// hasDangerousSettingsChanged 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasDangerousSettingsChanged(
  oldSettings: SettingsJson | null | undefined,
  newSettings: SettingsJson | null | undefined,
): boolean {
  // oldDangerous 集合保存`extractDangerousSettings`，供终端渲染后续处理使用。
  const oldDangerous = extractDangerousSettings(oldSettings)
  // newDangerous 集合保存`extractDangerousSettings`，供终端渲染后续处理使用。
  const newDangerous = extractDangerousSettings(newSettings)

  // If new settings don't have any dangerous settings, no prompt needed
  // 满足 `!hasDangerousSettings(newDangerous)` 时，终端渲染执行该分支。
  if (!hasDangerousSettings(newDangerous)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // If old settings didn't have dangerous settings but new does, prompt needed
  // 满足 `!hasDangerousSettings(oldDangerous)` 时，终端渲染执行该分支。
  if (!hasDangerousSettings(oldDangerous)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Compare the dangerous settings - any change triggers a prompt
  // oldJson保存`jsonStringify`，供终端渲染后续处理使用。
  const oldJson = jsonStringify({
    shellSettings: oldDangerous.shellSettings,
    envVars: oldDangerous.envVars,
    hooks: oldDangerous.hooks,
  })
  // newJson保存`jsonStringify`，供终端渲染后续处理使用。
  const newJson = jsonStringify({
    shellSettings: newDangerous.shellSettings,
    envVars: newDangerous.envVars,
    hooks: newDangerous.hooks,
  })

  // 返回 `oldJson !== newJson`，作为终端渲染这次计算的结果。
  return oldJson !== newJson
}

/**
 * Format dangerous settings as a human-readable list for the UI
 * Only returns setting names, not values
 */
// formatDangerousSettingsList 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDangerousSettingsList(
  dangerous: DangerousSettings,
): string[] {
  // items 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const items: string[] = []

  // Shell settings (names only)
  // 逐项读取 `Object.keys(dangerous.shellSettings)` 中的key，按输入顺序推进终端渲染。
  for (const key of Object.keys(dangerous.shellSettings)) {
    // items 集合追加新条目，保持收集顺序与输入顺序一致。
    items.push(key)
  }

  // Env vars (names only)
  // 逐项读取 `Object.keys(dangerous.envVars)` 中的key，按输入顺序推进终端渲染。
  for (const key of Object.keys(dangerous.envVars)) {
    // items 集合追加新条目，保持收集顺序与输入顺序一致。
    items.push(key)
  }

  // Hooks
  // 满足 `dangerous.hasHooks` 时，终端渲染执行该分支。
  if (dangerous.hasHooks) {
    // items 集合追加新条目，保持收集顺序与输入顺序一致。
    items.push('hooks')
  }

  // 返回 `items`，作为终端渲染这次计算的结果。
  return items
}
