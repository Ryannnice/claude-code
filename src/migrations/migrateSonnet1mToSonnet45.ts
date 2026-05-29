// 整理这一组导入，让migrate Sonnet1m To Sonnet45后续逻辑可以直接复用这些外部能力。
import {
  getMainLoopModelOverride,
  setMainLoopModelOverride,
} from '../bootstrap/state.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 整理这一组导入，让migrate Sonnet1m To Sonnet45后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Migrate users who had "sonnet[1m]" saved to the explicit "sonnet-4-5-20250929[1m]".
 *
 * The "sonnet" alias now resolves to Sonnet 4.6, so users who previously set
 * "sonnet[1m]" (targeting Sonnet 4.5 with 1M context) need to be pinned to the
 * explicit version to preserve their intended model.
 *
 * This is needed because Sonnet 4.6 1M was offered to a different group of users than
 * Sonnet 4.5 1M, so we needed to pin existing sonnet[1m] users to Sonnet 4.5 1M.
 *
 * Reads from userSettings specifically (not merged settings) so we don't
 * promote a project-scoped "sonnet[1m]" to the global default. Runs once,
 * tracked by a completion flag in global config.
 */
// migrateSonnet1mToSonnet45 封装migrateSonnet1mToSonnet45的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateSonnet1mToSonnet45(): void {
  // 配置读取`getGlobalConfig`，供migrate Sonnet1m To Sonnet45后续处理使用。
  const config = getGlobalConfig()
  // 满足 `config.sonnet1m45MigrationComplete` 时，migrate Sonnet1m To Sonnet45执行该分支。
  if (config.sonnet1m45MigrationComplete) {
    // migrate Sonnet1m To Sonnet45在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 模型名称读取`getSettingsForSource`，供migrate Sonnet1m To Sonnet45后续处理使用。
  const model = getSettingsForSource('userSettings')?.model
  // 当 `model` 匹配 `'sonnet[1m]'` 时，migrate Sonnet1m To Sonnet45执行对应分支。
  if (model === 'sonnet[1m]') {
    // 调用 updateSettingsForSource，触发migrate Sonnet1m To Sonnet45此处需要的副作用。
    updateSettingsForSource('userSettings', {
      model: 'sonnet-4-5-20250929[1m]',
    })
  }

  // Also migrate the in-memory override if already set
  // override读取`getMainLoopModelOverride`，供migrate Sonnet1m To Sonnet45后续处理使用。
  const override = getMainLoopModelOverride()
  // 当 `override` 匹配 `'sonnet[1m]'` 时，migrate Sonnet1m To Sonnet45执行对应分支。
  if (override === 'sonnet[1m]') {
    // setMainLoopModelOverride 写入新的状态值，使migrate Sonnet1m To Sonnet45后续读取保持一致。
    setMainLoopModelOverride('sonnet-4-5-20250929[1m]')
  }

  // 调用 saveGlobalConfig，触发migrate Sonnet1m To Sonnet45此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    sonnet1m45MigrationComplete: true,
  }))
}
