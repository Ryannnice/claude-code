/**
 * Reads plugin-related settings (enabledPlugins, extraKnownMarketplaces)
 * from --add-dir directories.
 *
 * These have the LOWEST priority — callers must spread standard settings
 * on top so that user/project/local/flag/policy sources all override.
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 类型依赖 { z } 来自 zod/v4，用于校准插件管理的数据契约。
import type { z } from 'zod/v4'
// 引入 getAdditionalDirectoriesForClaudeMd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAdditionalDirectoriesForClaudeMd } from '../../bootstrap/state.js'
// 引入 parseSettingsFile，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { parseSettingsFile } from '../settings/settings.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import type {
  ExtraKnownMarketplaceSchema,
  SettingsJson,
} from '../settings/types.js'

// ExtraKnownMarketplace 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type ExtraKnownMarketplace = z.infer<
  ReturnType<typeof ExtraKnownMarketplaceSchema>
>

// SETTINGS_FILES 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
const SETTINGS_FILES = ['settings.json', 'settings.local.json'] as const

/**
 * Returns a merged record of enabledPlugins from all --add-dir directories.
 *
 * Within each directory, settings.local.json is processed after settings.json
 * (local wins within that dir). Across directories, later CLI-order wins on
 * conflict.
 *
 * This has the lowest priority — callers must spread their standard settings
 * on top to let user/project/local/flag/policy override.
 */
// getAddDirEnabledPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAddDirEnabledPlugins(): NonNullable<
  SettingsJson['enabledPlugins']
> {
  // 结果 从空对象开始收集键值，后续按名称补齐内容。
  const result: NonNullable<SettingsJson['enabledPlugins']> = {}
  // 逐项读取 `getAdditionalDirectoriesForClaudeMd()` 中的dir，按输入顺序推进插件管理。
  for (const dir of getAdditionalDirectoriesForClaudeMd()) {
    // 按顺序遍历 `SETTINGS_FILES` 中的file 文件数据，逐个交给插件管理处理。
    for (const file of SETTINGS_FILES) {
      // 从 `parseSettingsFile(join(dir, '.claude', file))` 解构 settings，减少插件工具 add Dir Plugin Settings对同一对象的重复访问。
      const { settings } = parseSettingsFile(join(dir, '.claude', file))
      // 满足 `!settings?.enabledPlugins` 时，插件管理执行该分支。
      if (!settings?.enabledPlugins) {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // 调用 Object.assign，触发插件管理此处需要的副作用。
      Object.assign(result, settings.enabledPlugins)
    }
  }
  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

/**
 * Returns a merged record of extraKnownMarketplaces from all --add-dir directories.
 *
 * Same priority rules as getAddDirEnabledPlugins: settings.local.json wins
 * within each dir, and callers spread standard settings on top.
 */
// getAddDirExtraMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAddDirExtraMarketplaces(): Record<
  string,
  ExtraKnownMarketplace
> {
  // 结果 从空对象开始收集键值，后续按名称补齐内容。
  const result: Record<string, ExtraKnownMarketplace> = {}
  // 逐项读取 `getAdditionalDirectoriesForClaudeMd()` 中的dir，按输入顺序推进插件管理。
  for (const dir of getAdditionalDirectoriesForClaudeMd()) {
    // 按顺序遍历 `SETTINGS_FILES` 中的file 文件数据，逐个交给插件管理处理。
    for (const file of SETTINGS_FILES) {
      // 从 `parseSettingsFile(join(dir, '.claude', file))` 解构 settings，减少插件工具 add Dir Plugin Settings对同一对象的重复访问。
      const { settings } = parseSettingsFile(join(dir, '.claude', file))
      // 满足 `!settings?.extraKnownMarketplaces` 时，插件管理执行该分支。
      if (!settings?.extraKnownMarketplaces) {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // 调用 Object.assign，触发插件管理此处需要的副作用。
      Object.assign(result, settings.extraKnownMarketplaces)
    }
  }
  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}
