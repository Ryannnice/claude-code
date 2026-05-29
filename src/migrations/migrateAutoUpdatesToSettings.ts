// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 整理这一组导入，让migrate Auto Updates To Settings后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'
/**
 * Migration: Move user-set autoUpdates preference to settings.json env var
 * Only migrates if user explicitly disabled auto-updates (not for protection)
 * This preserves user intent while allowing native installations to auto-update
 */
// migrateAutoUpdatesToSettings 封装migrateAutoUpdatesToSettings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateAutoUpdatesToSettings(): void {
  // globalConfig 配置读取`getGlobalConfig`，供migrate Auto Updates To Settings后续处理使用。
  const globalConfig = getGlobalConfig()

  // Only migrate if autoUpdates was explicitly set to false by user preference
  // (not automatically for native protection)
  // migrate Auto Updates To Settings在这里进入条件判断，后续代码按实际状态分流。
  if (
    globalConfig.autoUpdates !== false ||
    globalConfig.autoUpdatesProtectedForNative === true
  ) {
    // migrate Auto Updates To Settings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的migrate Auto Updates To Settings操作，确保异常能进入相邻错误处理。
  try {
    // userSettings 集合读取`getSettingsForSource`，供migrate Auto Updates To Settings后续处理使用。
    const userSettings = getSettingsForSource('userSettings') || {}

    // Always set DISABLE_AUTOUPDATER to preserve user intent
    // We need to overwrite even if it exists, to ensure the migration is complete
    // 调用 updateSettingsForSource，触发migrate Auto Updates To Settings此处需要的副作用。
    updateSettingsForSource('userSettings', {
      ...userSettings,
      env: {
        ...userSettings.env,
        DISABLE_AUTOUPDATER: '1',
      },
    })

    // 记录migrate Auto Updates To Settings运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_migrate_autoupdates_to_settings', {
      was_user_preference: true,
      already_had_env_var: !!userSettings.env?.DISABLE_AUTOUPDATER,
    })

    // explicitly set, so this takes effect immediately
    // DISABLE_AUTOUPDATER更新为 `'1'`，确保migrateAutoUpdatesToSettings后续读取最新状态。
    process.env.DISABLE_AUTOUPDATER = '1'

    // Remove autoUpdates from global config after successful migration
    // 调用 saveGlobalConfig，触发migrate Auto Updates To Settings此处需要的副作用。
    saveGlobalConfig(current => {
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        autoUpdates: _,
        autoUpdatesProtectedForNative: __,
        ...updatedConfig
      } = current
      // 返回 `updatedConfig`，作为migrate Auto Updates To Settings这次计算的结果。
      return updatedConfig
    })
  } catch (error) {
    // 记录migrate Auto Updates To Settings运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Failed to migrate auto-updates: ${error}`))
    // 记录migrate Auto Updates To Settings运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_migrate_autoupdates_error', {
      has_error: true,
    })
  }
}
