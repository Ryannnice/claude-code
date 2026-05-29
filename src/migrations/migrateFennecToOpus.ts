// 整理这一组导入，让migrate Fennec To Opus后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Migrate users on removed fennec model aliases to their new Opus 4.6 aliases.
 * - fennec-latest → opus
 * - fennec-latest[1m] → opus[1m]
 * - fennec-fast-latest → opus[1m] + fast mode
 * - opus-4-5-fast → opus + fast mode
 *
 * Only touches userSettings. Reading and writing the same source keeps this
 * idempotent without a completion flag. Fennec aliases in project/local/policy
 * settings are left alone — we can't rewrite those, and reading merged
 * settings here would cause infinite re-runs + silent global promotion.
 */
// migrateFennecToOpus 封装migrateFennecToOpus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateFennecToOpus(): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // migrate Fennec To Opus在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // settings 集合读取`getSettingsForSource`，供migrate Fennec To Opus后续处理使用。
  const settings = getSettingsForSource('userSettings')

  // 模型名称 命名 `settings?.model`，让后续代码直接表达这个值的用途。
  const model = settings?.model
  // 当 `typeof model` 匹配 `'string'` 时，migrate Fennec To Opus执行对应分支。
  if (typeof model === 'string') {
    // 满足 `model.startsWith('fennec-latest[1m]')` 时，migrate Fennec To Opus执行该分支。
    if (model.startsWith('fennec-latest[1m]')) {
      // 调用 updateSettingsForSource，触发migrate Fennec To Opus此处需要的副作用。
      updateSettingsForSource('userSettings', {
        model: 'opus[1m]',
      })
    // migrate Fennec To Opus在这里处理 `} else if (model.startsWith('fennec-latest')) {`，完成这一小步状态转换。
    } else if (model.startsWith('fennec-latest')) {
      // 调用 updateSettingsForSource，触发migrate Fennec To Opus此处需要的副作用。
      updateSettingsForSource('userSettings', {
        model: 'opus',
      })
    // migrate Fennec To Opus在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      model.startsWith('fennec-fast-latest') ||
      model.startsWith('opus-4-5-fast')
    ) {
      // 调用 updateSettingsForSource，触发migrate Fennec To Opus此处需要的副作用。
      updateSettingsForSource('userSettings', {
        model: 'opus[1m]',
        fastMode: true,
      })
    }
  }
}
