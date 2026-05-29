// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 getAutoModeEnabledState 工具函数，把通用处理留在 ../utils/permissions/permissionSetup.js 中维护。
import { getAutoModeEnabledState } from '../utils/permissions/permissionSetup.js'
// 整理这一组导入，让reset Auto Mode Opt In For Default Offer后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * One-shot migration: clear skipAutoPermissionPrompt for users who accepted
 * the old 2-option AutoModeOptInDialog but don't have auto as their default.
 * Re-surfaces the dialog so they see the new "make it my default mode" option.
 * Guard lives in GlobalConfig (~/.claude.json), not settings.json, so it
 * survives settings resets and doesn't re-arm itself.
 *
 * Only runs when tengu_auto_mode_config.enabled === 'enabled'. For 'opt-in'
 * users, clearing skipAutoPermissionPrompt would remove auto from the carousel
 * (permissionSetup.ts:988) — the dialog would become unreachable and the
 * migration would defeat itself. In practice the ~40 target ants are all
 * 'enabled' (they reached the old dialog via bare Shift+Tab, which requires
 * 'enabled'), but the guard makes it safe regardless.
 */
// resetAutoModeOptInForDefaultOffer 封装resetAutoModeOptInForDefaultOffer的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetAutoModeOptInForDefaultOffer(): void {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，reset Auto Mode Opt In For Default ...执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // 配置读取`getGlobalConfig`，供reset Auto Mode Opt In For Default ...后续处理使用。
    const config = getGlobalConfig()
    // 满足 `config.hasResetAutoModeOptInForDefaultOffer` 时，reset Auto Mode Opt In For Default ...执行该分支。
    if (config.hasResetAutoModeOptInForDefaultOffer) return
    // `getAutoModeEnabledState()` 与 `'enabled'` 不一致时刷新派生状态，避免使用过期结果。
    if (getAutoModeEnabledState() !== 'enabled') return

    // 保护这一段可能失败的reset Auto Mode Opt In For Default Offer操作，确保异常能进入相邻错误处理。
    try {
      // user读取`getSettingsForSource`，供reset Auto Mode Opt In For Default ...后续处理使用。
      const user = getSettingsForSource('userSettings')
      // reset Auto Mode Opt In For Default ...在这里进入条件判断，后续代码按实际状态分流。
      if (
        user?.skipAutoPermissionPrompt &&
        user?.permissions?.defaultMode !== 'auto'
      ) {
        // 调用 updateSettingsForSource，触发reset Auto Mode Opt In For Default ...此处需要的副作用。
        updateSettingsForSource('userSettings', {
          skipAutoPermissionPrompt: undefined,
        })
        // 记录reset Auto Mode Opt In For Default ...运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_migrate_reset_auto_opt_in_for_default_offer', {})
      }

      // 调用 saveGlobalConfig，触发reset Auto Mode Opt In For Default ...此处需要的副作用。
      saveGlobalConfig(c => {
        // 满足 `c.hasResetAutoModeOptInForDefaultOffer` 时，reset Auto Mode Opt In For Default ...执行该分支。
        if (c.hasResetAutoModeOptInForDefaultOffer) return c
        // 返回结构化结果，集中表达reset Auto Mode Opt In For Default ...已经整理出的状态。
        return { ...c, hasResetAutoModeOptInForDefaultOffer: true }
      })
    } catch (error) {
      // 记录reset Auto Mode Opt In For Default ...运行诊断，方便排查异常路径或性能问题。
      logError(new Error(`Failed to reset auto mode opt-in: ${error}`))
    }
  }
}
