/**
 * Zip Cache Adapters
 *
 * I/O helpers for the plugin zip cache. These functions handle reading/writing
 * zip-cache-local metadata files, extracting ZIPs to session directories,
 * and creating ZIPs for newly installed plugins.
 *
 * The zip cache stores data on a mounted volume (e.g., Filestore) that persists
 * across ephemeral container lifetimes. The session cache is a local temp dir
 * for extracted plugins used during a single session.
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 loadKnownMarketplacesConfigSafe，将 ./marketplaceManager.js 中已经封装好的能力接到本文件流程里。
import { loadKnownMarketplacesConfigSafe } from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type KnownMarketplacesFile,
  KnownMarketplacesFileSchema,
  type PluginMarketplace,
  PluginMarketplaceSchema,
} from './schemas.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  atomicWriteToZipCache,
  getMarketplaceJsonRelativePath,
  getPluginZipCachePath,
  getZipCacheKnownMarketplacesPath,
} from './zipCache.js'

// ── Metadata I/O ──

/**
 * Read known_marketplaces.json from the zip cache.
 * Returns empty object if file doesn't exist, can't be parsed, or fails schema
 * validation (data comes from a shared mounted volume — other containers may write).
 */
// readZipCacheKnownMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readZipCacheKnownMarketplaces(): Promise<KnownMarketplacesFile> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供插件管理后续处理使用。
    const content = await readFile(getZipCacheKnownMarketplacesPath(), 'utf-8')
    // 解析结果保存`KnownMarketplacesFileSchema`，供插件管理后续处理使用。
    const parsed = KnownMarketplacesFileSchema().safeParse(jsonParse(content))
    // parsed.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!parsed.success) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Invalid known_marketplaces.json in zip cache: ${parsed.error.message}`,
        { level: 'error' },
      )
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {}
    }
    // 返回 `parsed.data`，作为插件管理这次计算的结果。
    return parsed.data
  } catch {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {}
  }
}

/**
 * Write known_marketplaces.json to the zip cache atomically.
 */
// writeZipCacheKnownMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeZipCacheKnownMarketplaces(
  data: KnownMarketplacesFile,
): Promise<void> {
  // 等待 `atomicWriteToZipCache(` 完成，再继续插件工具 zip Cache Adapters的异步流程。
  await atomicWriteToZipCache(
    getZipCacheKnownMarketplacesPath(),
    jsonStringify(data, null, 2),
  )
}

// ── Marketplace JSON ──

/**
 * Read a marketplace JSON file from the zip cache.
 */
// readMarketplaceJson 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readMarketplaceJson(
  marketplaceName: string,
): Promise<PluginMarketplace | null> {
  // zipCachePath 路径数据读取`getPluginZipCachePath`，供插件管理后续处理使用。
  const zipCachePath = getPluginZipCachePath()
  // zipCachePath 路径数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!zipCachePath) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
  // relPath 路径数据读取`getMarketplaceJsonRelativePath`，供插件管理后续处理使用。
  const relPath = getMarketplaceJsonRelativePath(marketplaceName)
  // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
  const fullPath = join(zipCachePath, relPath)
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供插件管理后续处理使用。
    const content = await readFile(fullPath, 'utf-8')
    // 解析结果解析`jsonParse`，供插件管理后续处理使用。
    const parsed = jsonParse(content)
    // 结果保存`PluginMarketplaceSchema`，供插件管理后续处理使用。
    const result = PluginMarketplaceSchema().safeParse(parsed)
    // 满足 `result.success` 时，插件管理执行该分支。
    if (result.success) {
      // 返回 `result.data`，作为插件管理这次计算的结果。
      return result.data
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Invalid marketplace JSON for ${marketplaceName}: ${result.error}`,
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  } catch {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Save a marketplace JSON to the zip cache from its install location.
 */
// saveMarketplaceJsonToZipCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveMarketplaceJsonToZipCache(
  marketplaceName: string,
  installLocation: string,
): Promise<void> {
  // zipCachePath 路径数据读取`getPluginZipCachePath`，供插件管理后续处理使用。
  const zipCachePath = getPluginZipCachePath()
  // zipCachePath 路径数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!zipCachePath) {
    // 插件工具 zip Cache Adapters在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 文本内容读取`readMarketplaceJsonContent`，供插件管理后续处理使用。
  const content = await readMarketplaceJsonContent(installLocation)
  // `content` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (content !== null) {
    // relPath 路径数据读取`getMarketplaceJsonRelativePath`，供插件管理后续处理使用。
    const relPath = getMarketplaceJsonRelativePath(marketplaceName)
    // 等待 `atomicWriteToZipCache(join(zipCachePath, relPath), content)` 完成，再继续插件工具 zip Cache Adapters的异步流程。
    await atomicWriteToZipCache(join(zipCachePath, relPath), content)
  }
}

/**
 * Read marketplace.json content from a cloned marketplace directory or file.
 * For directory sources: checks .claude-plugin/marketplace.json, marketplace.json
 * For URL sources: the installLocation IS the marketplace JSON file itself.
 */
// readMarketplaceJsonContent 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readMarketplaceJsonContent(dir: string): Promise<string | null> {
  // candidates 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const candidates = [
    join(dir, '.claude-plugin', 'marketplace.json'),
    join(dir, 'marketplace.json'),
    dir, // For URL sources, installLocation IS the marketplace JSON file
  ]
  // 按顺序遍历 `candidates` 中的candidate，逐个交给插件管理处理。
  for (const candidate of candidates) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `readFile(candidate, 'utf-8')`，调用方直接接收异步结果。
      return await readFile(candidate, 'utf-8')
    } catch {
      // ENOENT (doesn't exist) or EISDIR (directory) — try next
    }
  }
  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}

/**
 * Sync marketplace data to zip cache for offline access.
 * Saves marketplace JSONs and merges with previously cached data
 * so ephemeral containers can access marketplaces without re-cloning.
 */
// syncMarketplacesToZipCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function syncMarketplacesToZipCache(): Promise<void> {
  // Read-only iteration — Safe variant so a corrupted config doesn't throw.
  // This runs during startup paths; a throw here cascades to the same
  // try-block that catches loadAllPlugins failures.
  // knownMarketplaces 市场数据读取`loadKnownMarketplacesConfigSafe`，供插件管理后续处理使用。
  const knownMarketplaces = await loadKnownMarketplacesConfigSafe()

  // Save marketplace JSONs to zip cache
  // 循环处理 `const [name, entry] of Object.entries(knownMarketplaces)`，让插件管理把同类条目按顺序走完。
  for (const [name, entry] of Object.entries(knownMarketplaces)) {
    // entry.installLocation缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!entry.installLocation) continue
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `saveMarketplaceJsonToZipCache(name, entry.installLocation)` 完成，再继续插件工具 zip Cache Adapters的异步流程。
      await saveMarketplaceJsonToZipCache(name, entry.installLocation)
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to save marketplace JSON for ${name}: ${error}`)
    }
  }

  // Merge with previously cached data (ephemeral containers lose global config)
  // zipCacheKnownMarketplaces 市场数据读取`readZipCacheKnownMarketplaces`，供插件管理后续处理使用。
  const zipCacheKnownMarketplaces = await readZipCacheKnownMarketplaces()
  // mergedKnownMarketplaces 市场数据 集中保存插件工具 zip Cache Adapters要一起传递的字段。
  const mergedKnownMarketplaces: KnownMarketplacesFile = {
    ...zipCacheKnownMarketplaces,
    ...knownMarketplaces,
  }
  // 等待 `writeZipCacheKnownMarketplaces(mergedKnownMarketplaces)` 完成，再继续插件工具 zip Cache Adapters的异步流程。
  await writeZipCacheKnownMarketplaces(mergedKnownMarketplaces)
}
