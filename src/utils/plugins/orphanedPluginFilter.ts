/**
 * Provides ripgrep glob exclusion patterns for orphaned plugin versions.
 *
 * When plugin versions are updated, old versions are marked with a
 * `.orphaned_at` file but kept on disk for 7 days (since concurrent
 * sessions might still reference them). During this window, Grep/Glob
 * could return files from orphaned versions, causing Claude to use
 * outdated plugin code.
 *
 * We find `.orphaned_at` markers via a single ripgrep call and generate
 * `--glob '!<dir>/**'` patterns for their parent directories. The cache
 * is warmed in main.tsx AFTER cleanupOrphanedPluginVersionsInBackground
 * settles disk state. Once populated, the exclusion list is frozen for
 * the session unless /reload-plugins is called; subsequent disk mutations
 * (autoupdate, concurrent sessions) don't affect it.
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, isAbsolute, join, normalize, relative, sep } from 'path'
// 引入 ripGrep，将 ../ripgrep.js 中已经封装好的能力接到本文件流程里。
import { ripGrep } from '../ripgrep.js'
// 引入 getPluginsDirectory，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginsDirectory } from './pluginDirectories.js'

// Inlined from cacheUtils.ts to avoid a circular dep through commands.js.
// ORPHANED_AT_FILENAME 文件数据固定为 `'.orphaned_at'`，作为插件工具 orphaned Plugin Filter后续展示或比较的基准。
const ORPHANED_AT_FILENAME = '.orphaned_at'

/** Session-scoped cache. Frozen once computed — only cleared by explicit /reload-plugins. */
// cachedExclusions 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let cachedExclusions: string[] | null = null

/**
 * Get ripgrep glob exclusion patterns for orphaned plugin versions.
 *
 * @param searchPath - When provided, exclusions are only returned if the
 *   search overlaps the plugin cache directory (avoids unnecessary --glob
 *   args for searches outside the cache).
 *
 * Warmed eagerly in main.tsx after orphan GC; the lazy-compute path here
 * is a fallback. Best-effort: returns empty array if anything goes wrong.
 */
// getGlobExclusionsForPluginCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getGlobExclusionsForPluginCache(
  searchPath?: string,
): Promise<string[]> {
  // cachePath 路径数据保存`normalize`，供插件管理后续处理使用。
  const cachePath = normalize(join(getPluginsDirectory(), 'cache'))

  // 只有 `searchPath && !pathsOverlap(searchPath, cachePath)` 满足时，插件管理才执行该分支。
  if (searchPath && !pathsOverlap(searchPath, cachePath)) {
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }

  // `cachedExclusions` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (cachedExclusions !== null) {
    // 返回 `cachedExclusions`，作为插件管理这次计算的结果。
    return cachedExclusions
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Find all .orphaned_at files within the plugin cache directory.
    // --hidden: marker is a dotfile. --no-ignore: don't let a stray
    // .gitignore hide it. --max-depth 4: marker is always at
    // cache/<marketplace>/<plugin>/<version>/.orphaned_at — don't recurse
    // into plugin contents (node_modules, etc.). Never-aborts signal: no
    // caller signal to thread.
    // markers 集合保存`ripGrep`，供插件管理后续处理使用。
    const markers = await ripGrep(
      [
        '--files',
        '--hidden',
        '--no-ignore',
        '--max-depth',
        '4',
        '--glob',
        ORPHANED_AT_FILENAME,
      ],
      cachePath,
      new AbortController().signal,
    )

    // cachedExclusions 缓存更新为 `markers.map(markerPath => {`，确保插件工具后续读取最新状态。
    cachedExclusions = markers.map(markerPath => {
      // ripgrep may return absolute or relative — normalize to relative.
      // versionDir保存`dirname`，供插件管理后续处理使用。
      const versionDir = dirname(markerPath)
      // rel保存`isAbsolute`，供插件管理后续处理使用。
      const rel = isAbsolute(versionDir)
        ? relative(cachePath, versionDir)
        : versionDir
      // ripgrep glob patterns always use forward slashes, even on Windows
      // posixRelative格式化`rel.replace`，供插件管理后续处理使用。
      const posixRelative = rel.replace(/\\/g, '/')
      // 返回 ``!**/${posixRelative}/**``，作为插件管理这次计算的结果。
      return `!**/${posixRelative}/**`
    })
    // 返回 `cachedExclusions`，作为插件管理这次计算的结果。
    return cachedExclusions
  } catch {
    // Best-effort — don't break core search tools if ripgrep fails here
    // cachedExclusions 缓存更新为 `[]`，确保插件工具后续读取最新状态。
    cachedExclusions = []
    // 返回 `cachedExclusions`，作为插件管理这次计算的结果。
    return cachedExclusions
  }
}

// clearPluginCacheExclusions 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginCacheExclusions(): void {
  // cachedExclusions 缓存更新为 `null`，确保插件工具后续读取最新状态。
  cachedExclusions = null
}

/**
 * One path is a prefix of the other. Special-cases root (normalize('/') + sep
 * = '//'). Case-insensitive on win32 since normalize() doesn't lowercase
 * drive letters and CLAUDE_CODE_PLUGIN_CACHE_DIR may disagree with resolved.
 */
// pathsOverlap 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pathsOverlap(a: string, b: string): boolean {
  // na保存`normalizeForCompare`，供插件管理后续处理使用。
  const na = normalizeForCompare(a)
  // nb保存`normalizeForCompare`，供插件管理后续处理使用。
  const nb = normalizeForCompare(b)
  // 返回 `(`，作为插件管理这次计算的结果。
  return (
    na === nb ||
    na === sep ||
    nb === sep ||
    na.startsWith(nb + sep) ||
    nb.startsWith(na + sep)
  )
}

// normalizeForCompare 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeForCompare(p: string): string {
  // n保存`normalize`，供插件管理后续处理使用。
  const n = normalize(p)
  // 返回 `process.platform === 'win32' ? n.toLowerCase() : n`，作为插件管理这次计算的结果。
  return process.platform === 'win32' ? n.toLowerCase() : n
}
