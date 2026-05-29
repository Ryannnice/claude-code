// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 整理这一组导入，让migrate Opus To Opus1m后续逻辑可以直接复用这些外部能力。
import {
  getDefaultMainLoopModelSetting,
  isOpus1mMergeEnabled,
  parseUserSpecifiedModel,
} from '../utils/model/model.js'
// 整理这一组导入，让migrate Opus To Opus1m后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Migrate users with 'opus' pinned in their settings to 'opus[1m]' when they
 * are eligible for the merged Opus 1M experience (Max/Team Premium on 1P).
 *
 * CLI invocations with --model opus are unaffected: that flag is a runtime
 * override and does not touch userSettings, so it continues to use plain Opus.
 *
 * Pro subscribers are skipped — they retain separate Opus and Opus 1M options.
 * 3P users are skipped — their model strings are full model IDs, not aliases.
 *
 * Idempotent: only writes if userSettings.model is exactly 'opus'.
 */
// migrateOpusToOpus1m 封装migrateOpusToOpus1m的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateOpusToOpus1m(): void {
  // 满足 `!isOpus1mMergeEnabled()` 时，migrate Opus To Opus1m执行该分支。
  if (!isOpus1mMergeEnabled()) {
    // migrate Opus To Opus1m在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 模型名称读取`getSettingsForSource`，供migrate Opus To Opus1m后续处理使用。
  const model = getSettingsForSource('userSettings')?.model
  // `model` 与 `'opus'` 不一致时刷新派生状态，避免使用过期结果。
  if (model !== 'opus') {
    // migrate Opus To Opus1m在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // migrated固定为 `'opus[1m]'`，作为migrate Opus To Opus1m后续展示或比较的基准。
  const migrated = 'opus[1m]'
  // modelToSet 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const modelToSet =
    parseUserSpecifiedModel(migrated) ===
    parseUserSpecifiedModel(getDefaultMainLoopModelSetting())
      ? undefined
      : migrated
  // 调用 updateSettingsForSource，触发migrate Opus To Opus1m此处需要的副作用。
  updateSettingsForSource('userSettings', { model: modelToSet })

  // 记录migrate Opus To Opus1m运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_opus_to_opus1m_migration', {})
}
