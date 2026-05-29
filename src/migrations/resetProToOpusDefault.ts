// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 isProSubscriber 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import { isProSubscriber } from '../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 ../utils/model/providers.js 中维护。
import { getAPIProvider } from '../utils/model/providers.js'
// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'

// resetProToOpusDefault 封装resetProToOpusDefault的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetProToOpusDefault(): void {
  // 配置读取`getGlobalConfig`，供reset Pro To Opus Default后续处理使用。
  const config = getGlobalConfig()

  // 满足 `config.opusProMigrationComplete` 时，reset Pro To Opus Default执行该分支。
  if (config.opusProMigrationComplete) {
    // reset Pro To Opus Default在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // apiProvider读取`getAPIProvider`，供reset Pro To Opus Default后续处理使用。
  const apiProvider = getAPIProvider()

  // Pro users on firstParty get auto-migrated to Opus 4.5 default
  // `apiProvider` 与 `'firstParty' || !isProSubscribe...` 不一致时刷新派生状态，避免使用过期结果。
  if (apiProvider !== 'firstParty' || !isProSubscriber()) {
    // 调用 saveGlobalConfig，触发reset Pro To Opus Default此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      opusProMigrationComplete: true,
    }))
    // 记录reset Pro To Opus Default运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_reset_pro_to_opus_default', { skipped: true })
    // reset Pro To Opus Default在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // settings 集合读取`getSettings_DEPRECATED`，供reset Pro To Opus Default后续处理使用。
  const settings = getSettings_DEPRECATED()

  // Only show notification if user was on default (no custom model setting)
  // 满足 `settings?.model === undefined` 时，reset Pro To Opus Default执行该分支。
  if (settings?.model === undefined) {
    // opusProMigrationTimestamp记录时间`Date.now`，供reset Pro To Opus Default后续处理使用。
    const opusProMigrationTimestamp = Date.now()
    // 调用 saveGlobalConfig，触发reset Pro To Opus Default此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      opusProMigrationComplete: true,
      opusProMigrationTimestamp,
    }))
    // 记录reset Pro To Opus Default运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_reset_pro_to_opus_default', {
      skipped: false,
      had_custom_model: false,
    })
  } else {
    // User has a custom model setting, just mark migration complete
    // 调用 saveGlobalConfig，触发reset Pro To Opus Default此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      opusProMigrationComplete: true,
    }))
    // 记录reset Pro To Opus Default运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_reset_pro_to_opus_default', {
      skipped: false,
      had_custom_model: true,
    })
  }
}
