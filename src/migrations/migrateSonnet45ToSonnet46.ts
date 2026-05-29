// 整理这一组导入，让migrate Sonnet45 To Sonnet46后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 整理这一组导入，让migrate Sonnet45 To Sonnet46后续逻辑可以直接复用这些外部能力。
import {
  isMaxSubscriber,
  isProSubscriber,
  isTeamPremiumSubscriber,
} from '../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 ../utils/model/providers.js 中维护。
import { getAPIProvider } from '../utils/model/providers.js'
// 整理这一组导入，让migrate Sonnet45 To Sonnet46后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Migrate Pro/Max/Team Premium first-party users off explicit Sonnet 4.5
 * model strings to the 'sonnet' alias (which now resolves to Sonnet 4.6).
 *
 * Users may have been pinned to explicit Sonnet 4.5 strings by:
 * - The earlier migrateSonnet1mToSonnet45 migration (sonnet[1m] → explicit 4.5[1m])
 * - Manually selecting it via /model
 *
 * Reads userSettings specifically (not merged) so we only migrate what /model
 * wrote — project/local pins are left alone.
 * Idempotent: only writes if userSettings.model matches a Sonnet 4.5 string.
 */
// migrateSonnet45ToSonnet46 封装migrateSonnet45ToSonnet46的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateSonnet45ToSonnet46(): void {
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // migrate Sonnet45 To Sonnet46在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 组合条件 `!isProSubscriber() && !isMaxSubscriber() && !isTeamPremiumSubscriber()` 成立时，migrate Sonnet45 To Sonnet46才启用这条专门路径。
  if (!isProSubscriber() && !isMaxSubscriber() && !isTeamPremiumSubscriber()) {
    // migrate Sonnet45 To Sonnet46在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 模型名称读取`getSettingsForSource`，供migrate Sonnet45 To Sonnet46后续处理使用。
  const model = getSettingsForSource('userSettings')?.model
  // migrate Sonnet45 To Sonnet46在这里进入条件判断，后续代码按实际状态分流。
  if (
    model !== 'claude-sonnet-4-5-20250929' &&
    model !== 'claude-sonnet-4-5-20250929[1m]' &&
    model !== 'sonnet-4-5-20250929' &&
    model !== 'sonnet-4-5-20250929[1m]'
  ) {
    // migrate Sonnet45 To Sonnet46在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // has1m保存`model.endsWith`，供migrate Sonnet45 To Sonnet46后续处理使用。
  const has1m = model.endsWith('[1m]')
  // 调用 updateSettingsForSource，触发migrate Sonnet45 To Sonnet46此处需要的副作用。
  updateSettingsForSource('userSettings', {
    model: has1m ? 'sonnet[1m]' : 'sonnet',
  })

  // Skip notification for brand-new users — they never experienced the old default
  // 配置读取`getGlobalConfig`，供migrate Sonnet45 To Sonnet46后续处理使用。
  const config = getGlobalConfig()
  // 满足 `config.numStartups > 1` 时，migrate Sonnet45 To Sonnet46执行该分支。
  if (config.numStartups > 1) {
    // 调用 saveGlobalConfig，触发migrate Sonnet45 To Sonnet46此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      sonnet45To46MigrationTimestamp: Date.now(),
    }))
  }

  // 记录migrate Sonnet45 To Sonnet46运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_sonnet45_to_46_migration', {
    from_model:
      model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    has_1m: has1m,
  })
}
