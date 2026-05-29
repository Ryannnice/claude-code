/**
 * Flagged plugin tracking utilities
 *
 * Tracks plugins that were auto-removed because they were delisted from
 * their marketplace. Data is stored in ~/.claude/plugins/flagged-plugins.json.
 * Flagged plugins appear in a "Flagged" section in /plugins until the user
 * dismisses them.
 *
 * Uses a module-level cache so that getFlaggedPlugins() can be called
 * synchronously during React render. The cache is populated on the first
 * async call (loadFlaggedPlugins or addFlaggedPlugin) and kept in sync
 * with writes.
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile, rename, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 getPluginsDirectory，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginsDirectory } from './pluginDirectories.js'

// FLAGGED_PLUGINS_FILENAME 插件数据固定为 `'flagged-plugins.json'`，作为插件工具 plugin Flagging后续展示或比较的基准。
const FLAGGED_PLUGINS_FILENAME = 'flagged-plugins.json'

// FlaggedPlugin 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type FlaggedPlugin = {
  flaggedAt: string
  seenAt?: string
}

// SEEN_EXPIRY_MS 集合保存`48 * 60 * 60 * 1000 // 48 hours`，供插件工具 plugin Flagging后续判断或输出使用。
const SEEN_EXPIRY_MS = 48 * 60 * 60 * 1000 // 48 hours

// Module-level cache — populated by loadFlaggedPlugins(), updated by writes.
// cache 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let cache: Record<string, FlaggedPlugin> | null = null

// getFlaggedPluginsPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFlaggedPluginsPath(): string {
  // 返回 `join(getPluginsDirectory(), FLAGGED_PLUGINS_FILENAME)`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), FLAGGED_PLUGINS_FILENAME)
}

// parsePluginsData 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parsePluginsData(content: string): Record<string, FlaggedPlugin> {
  // 解析结果解析`jsonParse`，供插件管理后续处理使用。
  const parsed = jsonParse(content) as unknown
  // 插件管理在这里按实际状态进入对应分支。
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('plugins' in parsed) ||
    typeof (parsed as { plugins: unknown }).plugins !== 'object' ||
    (parsed as { plugins: unknown }).plugins === null
  ) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {}
  }
  // plugins 插件数据解析`(parsed as { plugins: Record<string, unknown> }).plugins` 整理出中间结果，供插件工具 plugin Flagging后续步骤使用。
  const plugins = (parsed as { plugins: Record<string, unknown> }).plugins
  // 结果 从空对象开始收集键值，后续按名称补齐内容。
  const result: Record<string, FlaggedPlugin> = {}
  // 循环处理 `const [id, entry] of Object.entries(plugins)`，让插件管理把同类条目按顺序走完。
  for (const [id, entry] of Object.entries(plugins)) {
    // 插件管理在这里按实际状态进入对应分支。
    if (
      entry &&
      typeof entry === 'object' &&
      'flaggedAt' in entry &&
      typeof (entry as { flaggedAt: unknown }).flaggedAt === 'string'
    ) {
      // 解析结果 集中保存插件工具 plugin Flagging要一起传递的字段。
      const parsed: FlaggedPlugin = {
        flaggedAt: (entry as { flaggedAt: string }).flaggedAt,
      }
      // 插件管理在这里按实际状态进入对应分支。
      if (
        'seenAt' in entry &&
        typeof (entry as { seenAt: unknown }).seenAt === 'string'
      ) {
        // seenAt更新为 `(entry as { seenAt: string }).seenAt`，确保插件工具后续读取最新状态。
        parsed.seenAt = (entry as { seenAt: string }).seenAt
      }
      // result[id更新为 `parsed`，确保插件工具 plugin Flagging后续读取最新状态。
      result[id] = parsed
    }
  }
  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

// readFromDisk 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readFromDisk(): Promise<Record<string, FlaggedPlugin>> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供插件管理后续处理使用。
    const content = await readFile(getFlaggedPluginsPath(), {
      encoding: 'utf-8',
    })
    // 返回 `parsePluginsData(content)`，作为插件管理这次计算的结果。
    return parsePluginsData(content)
  } catch {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {}
  }
}

// writeToDisk 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeToDisk(
  plugins: Record<string, FlaggedPlugin>,
): Promise<void> {
  // 文件路径读取`getFlaggedPluginsPath`，供插件管理后续处理使用。
  const filePath = getFlaggedPluginsPath()
  // tempPath 路径数据保存`randomBytes`，供插件管理后续处理使用。
  const tempPath = `${filePath}.${randomBytes(8).toString('hex')}.tmp`

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `getFsImplementation().mkdir(getPluginsDirectory())` 完成，再继续插件工具 plugin Flagging的异步流程。
    await getFsImplementation().mkdir(getPluginsDirectory())

    // 文本内容保存`jsonStringify`，供插件管理后续处理使用。
    const content = jsonStringify({ plugins }, null, 2)
    // 等待 `writeFile(tempPath, content, {` 完成，再继续插件工具 plugin Flagging的异步流程。
    await writeFile(tempPath, content, {
      encoding: 'utf-8',
      mode: 0o600,
    })
    // 等待 `rename(tempPath, filePath)` 完成，再继续插件工具 plugin Flagging的异步流程。
    await rename(tempPath, filePath)
    // cache 缓存更新为 `plugins`，确保插件工具后续读取最新状态。
    cache = plugins
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(tempPath)` 完成，再继续插件工具 plugin Flagging的异步流程。
      await unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Load flagged plugins from disk into the module cache.
 * Must be called (and awaited) before getFlaggedPlugins() returns
 * meaningful data. Called by useManagePlugins during plugin refresh.
 */
// loadFlaggedPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadFlaggedPlugins(): Promise<void> {
  // all读取`readFromDisk`，供插件管理后续处理使用。
  const all = await readFromDisk()
  // now记录时间`Date.now`，供插件管理后续处理使用。
  const now = Date.now()
  // changed标记插件工具 plugin Flagging是否启用对应路径。
  let changed = false

  // 循环处理 `const [id, entry] of Object.entries(all)`，让插件管理把同类条目按顺序走完。
  for (const [id, entry] of Object.entries(all)) {
    // 插件管理在这里按实际状态进入对应分支。
    if (
      entry.seenAt &&
      now - new Date(entry.seenAt).getTime() >= SEEN_EXPIRY_MS
    ) {
      // 插件工具 plugin Flagging在这里处理 `delete all[id]`，完成这一小步状态转换。
      delete all[id]
      // changed更新为 `true`，确保插件工具后续读取最新状态。
      changed = true
    }
  }

  // cache 缓存更新为 `all`，确保插件工具后续读取最新状态。
  cache = all
  // 满足 `changed` 时，插件管理执行该分支。
  if (changed) {
    // 等待 `writeToDisk(all)` 完成，再继续插件工具 plugin Flagging的异步流程。
    await writeToDisk(all)
  }
}

/**
 * Get all flagged plugins from the in-memory cache.
 * Returns an empty object if loadFlaggedPlugins() has not been called yet.
 */
// getFlaggedPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFlaggedPlugins(): Record<string, FlaggedPlugin> {
  // 返回 `cache ?? {}`，作为插件管理这次计算的结果。
  return cache ?? {}
}

/**
 * Add a plugin to the flagged list.
 *
 * @param pluginId "name@marketplace" format
 */
// addFlaggedPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function addFlaggedPlugin(pluginId: string): Promise<void> {
  // 满足 `cache === null` 时，插件管理执行该分支。
  if (cache === null) {
    // cache 缓存更新为 `await readFromDisk()`，确保插件工具后续读取最新状态。
    cache = await readFromDisk()
  }

  // updated 集中保存插件工具 plugin Flagging要一起传递的字段。
  const updated = {
    ...cache,
    [pluginId]: {
      flaggedAt: new Date().toISOString(),
    },
  }

  // 等待 `writeToDisk(updated)` 完成，再继续插件工具 plugin Flagging的异步流程。
  await writeToDisk(updated)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Flagged plugin: ${pluginId}`)
}

/**
 * Mark flagged plugins as seen. Called when the Installed view renders
 * flagged plugins. Sets seenAt on entries that don't already have it.
 * After 48 hours from seenAt, entries are auto-cleared on next load.
 */
// markFlaggedPluginsSeen 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markFlaggedPluginsSeen(
  pluginIds: string[],
): Promise<void> {
  // 满足 `cache === null` 时，插件管理执行该分支。
  if (cache === null) {
    // cache 缓存更新为 `await readFromDisk()`，确保插件工具后续读取最新状态。
    cache = await readFromDisk()
  }
  // now记录时间`Date`，供插件管理后续处理使用。
  const now = new Date().toISOString()
  // changed标记插件工具 plugin Flagging是否启用对应路径。
  let changed = false

  // updated 集中保存插件工具 plugin Flagging要一起传递的字段。
  const updated = { ...cache }
  // 按顺序遍历 `pluginIds` 中的标识符，逐个交给插件管理处理。
  for (const id of pluginIds) {
    // entry保存`updated[id]`，供插件工具 plugin Flagging后续判断或输出使用。
    const entry = updated[id]
    // 只有 `entry && !entry.seenAt` 满足时，插件管理才执行该分支。
    if (entry && !entry.seenAt) {
      // updated[id更新为 `{ ...entry, seenAt: now }`，确保插件工具 plugin Flagging后续读取最新状态。
      updated[id] = { ...entry, seenAt: now }
      // changed更新为 `true`，确保插件工具后续读取最新状态。
      changed = true
    }
  }

  // 满足 `changed` 时，插件管理执行该分支。
  if (changed) {
    // 等待 `writeToDisk(updated)` 完成，再继续插件工具 plugin Flagging的异步流程。
    await writeToDisk(updated)
  }
}

/**
 * Remove a plugin from the flagged list. Called when the user dismisses
 * a flagged plugin notification in /plugins.
 */
// removeFlaggedPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeFlaggedPlugin(pluginId: string): Promise<void> {
  // 满足 `cache === null` 时，插件管理执行该分支。
  if (cache === null) {
    // cache 缓存更新为 `await readFromDisk()`，确保插件工具后续读取最新状态。
    cache = await readFromDisk()
  }
  // 满足 `!(pluginId in cache)` 时，插件管理执行该分支。
  if (!(pluginId in cache)) return

  // 从 `cache` 解构 [pluginId]、其余 rest，减少插件工具 plugin Flagging对同一对象的重复访问。
  const { [pluginId]: _, ...rest } = cache
  // cache 缓存更新为 `rest`，确保插件工具后续读取最新状态。
  cache = rest
  // 等待 `writeToDisk(rest)` 完成，再继续插件工具 plugin Flagging的异步流程。
  await writeToDisk(rest)
}
