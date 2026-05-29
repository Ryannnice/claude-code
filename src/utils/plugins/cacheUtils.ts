// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, rm, stat, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 clearCommandsCache，将 ../../commands.js 中已经封装好的能力接到本文件流程里。
import { clearCommandsCache } from '../../commands.js'
// 引入 clearAllOutputStylesCache，将 ../../constants/outputStyles.js 中已经封装好的能力接到本文件流程里。
import { clearAllOutputStylesCache } from '../../constants/outputStyles.js'
// 接入 clearAgentDefinitionsCache 工具实现，后续工具池会按权限和开关决定是否暴露。
import { clearAgentDefinitionsCache } from '../../tools/AgentTool/loadAgentsDir.js'
// 接入 clearPromptCache 工具实现，后续工具池会按权限和开关决定是否暴露。
import { clearPromptCache } from '../../tools/SkillTool/prompt.js'
// 引入 resetSentSkillNames，将 ../attachments.js 中已经封装好的能力接到本文件流程里。
import { resetSentSkillNames } from '../attachments.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 loadInstalledPluginsFromDisk，将 ./installedPluginsManager.js 中已经封装好的能力接到本文件流程里。
import { loadInstalledPluginsFromDisk } from './installedPluginsManager.js'
// 引入 clearPluginAgentCache，将 ./loadPluginAgents.js 中已经封装好的能力接到本文件流程里。
import { clearPluginAgentCache } from './loadPluginAgents.js'
// 引入 clearPluginCommandCache，将 ./loadPluginCommands.js 中已经封装好的能力接到本文件流程里。
import { clearPluginCommandCache } from './loadPluginCommands.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  clearPluginHookCache,
  pruneRemovedPluginHooks,
} from './loadPluginHooks.js'
// 引入 clearPluginOutputStyleCache，将 ./loadPluginOutputStyles.js 中已经封装好的能力接到本文件流程里。
import { clearPluginOutputStyleCache } from './loadPluginOutputStyles.js'
// 引入 clearPluginCache、getPluginCachePath，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { clearPluginCache, getPluginCachePath } from './pluginLoader.js'
// 引入 clearPluginOptionsCache，将 ./pluginOptionsStorage.js 中已经封装好的能力接到本文件流程里。
import { clearPluginOptionsCache } from './pluginOptionsStorage.js'
// 引入 isPluginZipCacheEnabled，将 ./zipCache.js 中已经封装好的能力接到本文件流程里。
import { isPluginZipCacheEnabled } from './zipCache.js'

// ORPHANED_AT_FILENAME 文件数据保存`'.orphaned_at'`，作为后续固定文本处理的输入。
const ORPHANED_AT_FILENAME = '.orphaned_at'
// CLEANUP_AGE_MS 集合 命名 `7 * 24 * 60 * 60 * 1000 // 7 days`，让后续代码直接表达这个值的用途。
const CLEANUP_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// clearAllPluginCaches 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllPluginCaches(): void {
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginCache()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginCommandCache()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginAgentCache()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginHookCache()
  // Prune hooks from plugins no longer in the enabled set so uninstalled/
  // disabled plugins stop firing immediately (gh-36995). Prune-only: hooks
  // from newly-enabled plugins are NOT added here — they wait for
  // /reload-plugins like commands/agents/MCP do. Fire-and-forget: old hooks
  // stay valid until the prune completes (preserves gh-29767). No-op when
  // STATE.registeredHooks is empty (test/preload.ts beforeEach clears it via
  // resetStateForTests before reaching here).
  // 调用 pruneRemovedPluginHooks，触发插件管理此处需要的副作用。
  pruneRemovedPluginHooks().catch(e => logError(e))
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginOptionsCache()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginOutputStyleCache()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearAllOutputStylesCache()
}

// clearAllCaches 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllCaches(): void {
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearAllPluginCaches()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearCommandsCache()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearAgentDefinitionsCache()
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPromptCache()
  // 调用 resetSentSkillNames，触发插件管理此处需要的副作用。
  resetSentSkillNames()
}

/**
 * Mark a plugin version as orphaned.
 * Called when a plugin is uninstalled or updated to a new version.
 */
// markPluginVersionOrphaned 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markPluginVersionOrphaned(
  versionPath: string,
): Promise<void> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(getOrphanedAtPath(versionPath), `${Date.now()}`, 'utf-8')` 完成，再继续插件工具 cache Utils的异步流程。
    await writeFile(getOrphanedAtPath(versionPath), `${Date.now()}`, 'utf-8')
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to write .orphaned_at: ${versionPath}: ${error}`)
  }
}

/**
 * Clean up orphaned plugin versions that have been orphaned for more than 7 days.
 *
 * Pass 1: Remove .orphaned_at from installed versions (clears stale markers)
 * Pass 2: For each cached version not in installed_plugins.json:
 *   - If no .orphaned_at exists: create it (handles old CC versions, manual edits)
 *   - If .orphaned_at exists and > 7 days old: delete the version
 */
// cleanupOrphanedPluginVersionsInBackground 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOrphanedPluginVersionsInBackground(): Promise<void> {
  // Zip cache mode stores plugins as .zip files, not directories. readSubdirs
  // filters to directories only, so removeIfEmpty would see plugin dirs as empty
  // and delete them (including the ZIPs). Skip cleanup entirely in zip mode.
  // 满足 `isPluginZipCacheEnabled()` 时，插件管理执行该分支。
  if (isPluginZipCacheEnabled()) {
    // 插件工具 cache Utils在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // installedVersions 集合读取`getInstalledVersionPaths`，供插件管理后续处理使用。
    const installedVersions = getInstalledVersionPaths()
    // installedVersions 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!installedVersions) return

    // cachePath 路径数据读取`getPluginCachePath`，供插件管理后续处理使用。
    const cachePath = getPluginCachePath()

    // now记录时间`Date.now`，供插件管理后续处理使用。
    const now = Date.now()

    // Pass 1: Remove .orphaned_at from installed versions
    // This handles cases where a plugin was reinstalled after being orphaned
    // 等待 `Promise.all(` 完成，再继续插件工具 cache Utils的异步流程。
    await Promise.all(
      // 这个回调绑定到 [...installedVersions].map(p => removeOrphanedAtMarker(p)),，负责插件管理在该局部场景下的响应。
      [...installedVersions].map(p => removeOrphanedAtMarker(p)),
    )

    // Pass 2: Process orphaned versions
    // 逐项读取 `await readSubdirs(cachePath)` 中的marketplace 市场数据，按输入顺序推进插件管理。
    for (const marketplace of await readSubdirs(cachePath)) {
      // marketplacePath 市场数据格式化`join`，供插件管理后续处理使用。
      const marketplacePath = join(cachePath, marketplace)

      // 逐项读取 `await readSubdirs(marketplacePath)` 中的plugin 插件数据，按输入顺序推进插件管理。
      for (const plugin of await readSubdirs(marketplacePath)) {
        // pluginPath 插件数据格式化`join`，供插件管理后续处理使用。
        const pluginPath = join(marketplacePath, plugin)

        // 逐项读取 `await readSubdirs(pluginPath)` 中的version，按输入顺序推进插件管理。
        for (const version of await readSubdirs(pluginPath)) {
          // versionPath 路径数据格式化`join`，供插件管理后续处理使用。
          const versionPath = join(pluginPath, version)
          // 满足 `installedVersions.has(versionPath)` 时，插件管理执行该分支。
          if (installedVersions.has(versionPath)) continue
          // 等待 `processOrphanedPluginVersion(versionPath, now)` 完成，再继续插件工具 cache Utils的异步流程。
          await processOrphanedPluginVersion(versionPath, now)
        }

        // 等待 `removeIfEmpty(pluginPath)` 完成，再继续插件工具 cache Utils的异步流程。
        await removeIfEmpty(pluginPath)
      }

      // 等待 `removeIfEmpty(marketplacePath)` 完成，再继续插件工具 cache Utils的异步流程。
      await removeIfEmpty(marketplacePath)
    }
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Plugin cache cleanup failed: ${error}`)
  }
}

// getOrphanedAtPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOrphanedAtPath(versionPath: string): string {
  // 返回 `join(versionPath, ORPHANED_AT_FILENAME)`，作为插件管理这次计算的结果。
  return join(versionPath, ORPHANED_AT_FILENAME)
}

// removeOrphanedAtMarker 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function removeOrphanedAtMarker(versionPath: string): Promise<void> {
  // orphanedAtPath 路径数据读取`getOrphanedAtPath`，供插件管理后续处理使用。
  const orphanedAtPath = getOrphanedAtPath(versionPath)
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(orphanedAtPath)` 完成，再继续插件工具 cache Utils的异步流程。
    await unlink(orphanedAtPath)
  } catch (error) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
    if (code === 'ENOENT') return
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to remove .orphaned_at: ${versionPath}: ${error}`)
  }
}

// getInstalledVersionPaths 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInstalledVersionPaths(): Set<string> | null {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 路径列表构建`new Set<string>()`，供后续判断或组装使用。
    const paths = new Set<string>()
    // diskData读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
    const diskData = loadInstalledPluginsFromDisk()
    // 逐项读取 `Object.values(diskData.plugins)` 中的installations 集合，按输入顺序推进插件管理。
    for (const installations of Object.values(diskData.plugins)) {
      // 按顺序遍历 `installations` 中的entry，逐个交给插件管理处理。
      for (const entry of installations) {
        // 调用 paths.add，触发插件管理此处需要的副作用。
        paths.add(entry.installPath)
      }
    }
    // 返回 `paths`，作为插件管理这次计算的结果。
    return paths
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load installed plugins: ${error}`)
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

// processOrphanedPluginVersion 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function processOrphanedPluginVersion(
  versionPath: string,
  now: number,
): Promise<void> {
  // orphanedAtPath 路径数据读取`getOrphanedAtPath`，供插件管理后续处理使用。
  const orphanedAtPath = getOrphanedAtPath(versionPath)

  // orphanedAt 先占位，稍后的条件分支会根据实际输入补齐它。
  let orphanedAt: number
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // orphanedAt更新为 `(await stat(orphanedAtPath)).mtimeMs`，确保插件工具后续读取最新状态。
    orphanedAt = (await stat(orphanedAtPath)).mtimeMs
  } catch (error) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
    if (code === 'ENOENT') {
      // 等待 `markPluginVersionOrphaned(versionPath)` 完成，再继续插件工具 cache Utils的异步流程。
      await markPluginVersionOrphaned(versionPath)
      // 插件工具 cache Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to stat orphaned marker: ${versionPath}: ${error}`)
    // 插件工具 cache Utils在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `now - orphanedAt > CLEANUP_AGE_MS` 时，插件管理执行该分支。
  if (now - orphanedAt > CLEANUP_AGE_MS) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `rm(versionPath, { recursive: true, force: true })` 完成，再继续插件工具 cache Utils的异步流程。
      await rm(versionPath, { recursive: true, force: true })
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to delete orphaned version: ${versionPath}: ${error}`,
      )
    }
  }
}

// removeIfEmpty 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function removeIfEmpty(dirPath: string): Promise<void> {
  // (await readSubdirs(dirPath)) 路径数据为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if ((await readSubdirs(dirPath)).length === 0) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `rm(dirPath, { recursive: true, force: true })` 完成，再继续插件工具 cache Utils的异步流程。
      await rm(dirPath, { recursive: true, force: true })
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to remove empty dir: ${dirPath}: ${error}`)
    }
  }
}

// readSubdirs 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readSubdirs(dirPath: string): Promise<string[]> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合读取`readdir`，供插件管理后续处理使用。
    const entries = await readdir(dirPath, { withFileTypes: true })
    // 返回 `entries.filter(d => d.isDirectory()).map(d => d.name)`，作为插件管理这次计算的结果。
    return entries.filter(d => d.isDirectory()).map(d => d.name)
  } catch {
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }
}
