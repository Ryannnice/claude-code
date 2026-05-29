// 类型依赖 { SettingSource } 来自 ./constants.js，用于校准共享工具的数据契约。
import type { SettingSource } from './constants.js'
// 类型依赖 { SettingsJson } 来自 ./types.js，用于校准共享工具的数据契约。
import type { SettingsJson } from './types.js'
// 类型依赖 { SettingsWithErrors, ValidationError } 来自 ./validation.js，用于校准共享工具的数据契约。
import type { SettingsWithErrors, ValidationError } from './validation.js'

// sessionSettingsCache 会话数据 命名 `null`，让后续代码直接表达这个值的用途。
let sessionSettingsCache: SettingsWithErrors | null = null

// getSessionSettingsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionSettingsCache(): SettingsWithErrors | null {
  // 返回 `sessionSettingsCache`，作为共享工具这次计算的结果。
  return sessionSettingsCache
}

// setSessionSettingsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionSettingsCache(value: SettingsWithErrors): void {
  // sessionSettingsCache 会话数据更新为 `value`，确保共享工具后续读取最新状态。
  sessionSettingsCache = value
}

/**
 * Per-source cache for getSettingsForSource. Invalidated alongside the
 * merged sessionSettingsCache — same resetSettingsCache() triggers
 * (settings write, --add-dir, plugin init, hooks refresh).
 */
// perSourceCache 缓存 命名 `new Map<SettingSource, SettingsJson | null>()`，让后续代码直接表达这个值的用途。
const perSourceCache = new Map<SettingSource, SettingsJson | null>()

// getCachedSettingsForSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedSettingsForSource(
  source: SettingSource,
): SettingsJson | null | undefined {
  // undefined = cache miss; null = cached "no settings for this source"
  // 返回 `perSourceCache.has(source) ? perSourceCache.get(source) : undefined`，作为共享工具这次计算的结果。
  return perSourceCache.has(source) ? perSourceCache.get(source) : undefined
}

// setCachedSettingsForSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCachedSettingsForSource(
  source: SettingSource,
  value: SettingsJson | null,
): void {
  // perSourceCache.set 写入新的状态值，使共享工具后续读取保持一致。
  perSourceCache.set(source, value)
}

/**
 * Path-keyed cache for parseSettingsFile. Both getSettingsForSource and
 * loadSettingsFromDisk call parseSettingsFile on the same paths during
 * startup — this dedupes the disk read + zod parse.
 */
// ParsedSettings 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParsedSettings = {
  settings: SettingsJson | null
  errors: ValidationError[]
}
// parseFileCache 文件数据构建`new Map<string, ParsedSettings>()` 整理出中间结果，供共享工具 settings Cache后续步骤使用。
const parseFileCache = new Map<string, ParsedSettings>()

// getCachedParsedFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedParsedFile(path: string): ParsedSettings | undefined {
  // 返回 `parseFileCache.get(path)`，作为共享工具这次计算的结果。
  return parseFileCache.get(path)
}

// setCachedParsedFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCachedParsedFile(path: string, value: ParsedSettings): void {
  // parseFileCache.set 写入新的状态值，使共享工具后续读取保持一致。
  parseFileCache.set(path, value)
}

// resetSettingsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSettingsCache(): void {
  // sessionSettingsCache 会话数据更新为 `null`，确保共享工具后续读取最新状态。
  sessionSettingsCache = null
  // 调用 perSourceCache.clear，触发共享工具此处需要的副作用。
  perSourceCache.clear()
  // 调用 parseFileCache.clear，触发共享工具此处需要的副作用。
  parseFileCache.clear()
}

/**
 * Plugin settings base layer for the settings cascade.
 * pluginLoader writes here after loading plugins;
 * loadSettingsFromDisk reads it as the lowest-priority base.
 */
// pluginSettingsBase 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
let pluginSettingsBase: Record<string, unknown> | undefined

// getPluginSettingsBase 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginSettingsBase(): Record<string, unknown> | undefined {
  // 返回 `pluginSettingsBase`，作为共享工具这次计算的结果。
  return pluginSettingsBase
}

// setPluginSettingsBase 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setPluginSettingsBase(
  settings: Record<string, unknown> | undefined,
): void {
  // pluginSettingsBase 插件数据更新为 `settings`，确保共享工具后续读取最新状态。
  pluginSettingsBase = settings
}

// clearPluginSettingsBase 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginSettingsBase(): void {
  // pluginSettingsBase 插件数据更新为 `undefined`，确保共享工具后续读取最新状态。
  pluginSettingsBase = undefined
}
