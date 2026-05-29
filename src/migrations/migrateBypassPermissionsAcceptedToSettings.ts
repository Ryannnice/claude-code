// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 整理这一组导入，让migrate Bypass Permissions Accepted To Settings后续逻辑可以直接复用这些外部能力。
import {
  hasSkipDangerousModePermissionPrompt,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Migration: Move bypassPermissionsModeAccepted from global config to settings.json
 * as skipDangerousModePermissionPrompt. This is a better home since settings.json
 * is the user-configurable settings file.
 */
// migrateBypassPermissionsAcceptedToSettings 封装migrateBypassPermissionsAcceptedToSettings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateBypassPermissionsAcceptedToSettings(): void {
  // globalConfig 配置读取`getGlobalConfig`，供migrate Bypass Permissions Accepted...后续处理使用。
  const globalConfig = getGlobalConfig()

  // globalConfig.bypassPermissionsModeAccepted 权限数据缺失时提前走兜底路径，避免migrate Bypass Permissions Accepted...继续依赖无效输入。
  if (!globalConfig.bypassPermissionsModeAccepted) {
    // migrate Bypass Permissions Accepted...在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的migrate Bypass Permissions Accepted To Settings操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `!hasSkipDangerousModePermissionPrompt()` 时，migrate Bypass Permissions Accepted...执行该分支。
    if (!hasSkipDangerousModePermissionPrompt()) {
      // 调用 updateSettingsForSource，触发migrate Bypass Permissions Accepted...此处需要的副作用。
      updateSettingsForSource('userSettings', {
        skipDangerousModePermissionPrompt: true,
      })
    }

    // 记录migrate Bypass Permissions Accepted...运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_migrate_bypass_permissions_accepted', {})

    // 调用 saveGlobalConfig，触发migrate Bypass Permissions Accepted...此处需要的副作用。
    saveGlobalConfig(current => {
      // 满足 `!('bypassPermissionsModeAccepted' in current)` 时，migrate Bypass Permissions Accepted...执行该分支。
      if (!('bypassPermissionsModeAccepted' in current)) return current
      // 从 `current` 解构 bypassPermissionsModeAccepted、其余 updatedConfig，减少migrate Bypass Permissions Accepted...对同一对象的重复访问。
      const { bypassPermissionsModeAccepted: _, ...updatedConfig } = current
      // 返回 `updatedConfig`，作为migrate Bypass Permissions Accepted...这次计算的结果。
      return updatedConfig
    })
  } catch (error) {
    // 记录migrate Bypass Permissions Accepted...运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(`Failed to migrate bypass permissions accepted: ${error}`),
    )
  }
}
