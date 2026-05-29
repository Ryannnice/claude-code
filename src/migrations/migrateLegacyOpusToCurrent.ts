// 整理这一组导入，让migrate Legacy Opus To Current后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { saveGlobalConfig } from '../utils/config.js'
// 复用 isLegacyModelRemapEnabled 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { isLegacyModelRemapEnabled } from '../utils/model/model.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 ../utils/model/providers.js 中维护。
import { getAPIProvider } from '../utils/model/providers.js'
// 整理这一组导入，让migrate Legacy Opus To Current后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Migrate first-party users off explicit Opus 4.0/4.1 model strings.
 *
 * The 'opus' alias already resolves to Opus 4.6 for 1P, so anyone still
 * on an explicit 4.0/4.1 string pinned it in settings before 4.5 launched.
 * parseUserSpecifiedModel now silently remaps these at runtime anyway —
 * this migration cleans up the settings file so /model shows the right
 * thing, and sets a timestamp so the REPL can show a one-time notification.
 *
 * Only touches userSettings. Legacy strings in project/local/policy settings
 * are left alone (we can't/shouldn't rewrite those) and are still remapped at
 * runtime by parseUserSpecifiedModel. Reading and writing the same source
 * keeps this idempotent without a completion flag, and avoids silently
 * promoting 'opus' to the global default for users who only pinned it in one
 * project.
 */
// migrateLegacyOpusToCurrent 封装migrateLegacyOpusToCurrent的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateLegacyOpusToCurrent(): void {
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // migrate Legacy Opus To Current在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `!isLegacyModelRemapEnabled()` 时，migrate Legacy Opus To Current执行该分支。
  if (!isLegacyModelRemapEnabled()) {
    // migrate Legacy Opus To Current在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 模型名称读取`getSettingsForSource`，供migrate Legacy Opus To Current后续处理使用。
  const model = getSettingsForSource('userSettings')?.model
  // migrate Legacy Opus To Current在这里进入条件判断，后续代码按实际状态分流。
  if (
    model !== 'claude-opus-4-20250514' &&
    model !== 'claude-opus-4-1-20250805' &&
    model !== 'claude-opus-4-0' &&
    model !== 'claude-opus-4-1'
  ) {
    // migrate Legacy Opus To Current在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 updateSettingsForSource，触发migrate Legacy Opus To Current此处需要的副作用。
  updateSettingsForSource('userSettings', { model: 'opus' })
  // 调用 saveGlobalConfig，触发migrate Legacy Opus To Current此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    legacyOpusMigrationTimestamp: Date.now(),
  }))
  // 记录migrate Legacy Opus To Current运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_legacy_opus_migration', {
    from_model:
      model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}
