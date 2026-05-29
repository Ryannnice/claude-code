/**
 * Plugin Version Calculation Module
 *
 * Handles version calculation for plugins from various sources.
 * Versions are used for versioned cache paths and update detection.
 *
 * Version sources (in order of preference):
 * 1. Explicit version from plugin.json
 * 2. Git commit SHA (for git/github sources)
 * 3. Fallback timestamp for local sources
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getHeadForDir，将 ../git/gitFilesystem.js 中已经封装好的能力接到本文件流程里。
import { getHeadForDir } from '../git/gitFilesystem.js'
// 类型依赖 { PluginManifest, PluginSource } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { PluginManifest, PluginSource } from './schemas.js'

/**
 * Calculate the version for a plugin based on its source.
 *
 * Version sources (in order of priority):
 * 1. plugin.json version field (highest priority)
 * 2. Provided version (typically from marketplace entry)
 * 3. Git commit SHA from install path
 * 4. 'unknown' as last resort
 *
 * @param pluginId - Plugin identifier (e.g., "plugin@marketplace")
 * @param source - Plugin source configuration (used for git-subdir path hashing)
 * @param manifest - Optional plugin manifest with version field
 * @param installPath - Optional path to installed plugin (for git SHA extraction)
 * @param providedVersion - Optional version from marketplace entry or caller
 * @param gitCommitSha - Optional pre-resolved git SHA (for sources like
 *   git-subdir where the clone is discarded and the install path has no .git)
 * @returns Version string (semver, short SHA, or 'unknown')
 */
// calculatePluginVersion 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function calculatePluginVersion(
  pluginId: string,
  source: PluginSource,
  manifest?: PluginManifest,
  installPath?: string,
  providedVersion?: string,
  gitCommitSha?: string,
): Promise<string> {
  // 1. Use explicit version from plugin.json if available
  // 满足 `manifest?.version` 时，插件管理执行该分支。
  if (manifest?.version) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Using manifest version for ${pluginId}: ${manifest.version}`,
    )
    // 返回 `manifest.version`，作为插件管理这次计算的结果。
    return manifest.version
  }

  // 2. Use provided version (typically from marketplace entry)
  // 满足 `providedVersion` 时，插件管理执行该分支。
  if (providedVersion) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Using provided version for ${pluginId}: ${providedVersion}`,
    )
    // 返回 `providedVersion`，作为插件管理这次计算的结果。
    return providedVersion
  }

  // 3. Use pre-resolved git SHA if caller captured it before discarding the clone
  // 满足 `gitCommitSha` 时，插件管理执行该分支。
  if (gitCommitSha) {
    // shortSha格式化`gitCommitSha.substring`，供插件管理后续处理使用。
    const shortSha = gitCommitSha.substring(0, 12)
    // 当 `typeof source` 匹配 `'object' && source.source =...` 时，插件管理执行对应分支。
    if (typeof source === 'object' && source.source === 'git-subdir') {
      // Encode the subdir path in the version so cache keys differ when
      // marketplace.json's `path` changes but the monorepo SHA doesn't.
      // Without this, two plugins at different subdirs of the same commit
      // collide at cache/<m>/<p>/<sha>/ and serve each other's trees.
      //
      // Normalization MUST match the squashfs cron byte-for-byte:
      //   1. backslash → forward slash
      //   2. strip one leading `./`
      //   3. strip all trailing `/`
      //   4. UTF-8 sha256, first 8 hex chars
      // See api/…/plugins_official_squashfs/job.py _validate_subdir().
      // normPath 路径数据保存`source.path`，供后续判断或组装使用。
      const normPath = source.path
        .replace(/\\/g, '/')
        .replace(/^\.\//, '')
        .replace(/\/+$/, '')
      // pathHash 路径数据构建`createHash`，供插件管理后续处理使用。
      const pathHash = createHash('sha256')
        .update(normPath)
        .digest('hex')
        .substring(0, 8)
      // v固定为 ``${shortSha}-${pathHash}``，作为插件工具 plugin Versioning后续展示或比较的基准。
      const v = `${shortSha}-${pathHash}`
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Using git-subdir SHA+path version for ${pluginId}: ${v} (path=${normPath})`,
      )
      // 返回 `v`，作为插件管理这次计算的结果。
      return v
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Using pre-resolved git SHA for ${pluginId}: ${shortSha}`)
    // 返回 `shortSha`，作为插件管理这次计算的结果。
    return shortSha
  }

  // 4. Try to get git SHA from install path
  // 满足 `installPath` 时，插件管理执行该分支。
  if (installPath) {
    // sha读取`getGitCommitSha`，供插件管理后续处理使用。
    const sha = await getGitCommitSha(installPath)
    // 满足 `sha` 时，插件管理执行该分支。
    if (sha) {
      // shortSha格式化`sha.substring`，供插件管理后续处理使用。
      const shortSha = sha.substring(0, 12)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Using git SHA for ${pluginId}: ${shortSha}`)
      // 返回 `shortSha`，作为插件管理这次计算的结果。
      return shortSha
    }
  }

  // 5. Return 'unknown' as last resort
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`No version found for ${pluginId}, using 'unknown'`)
  // 返回 `'unknown'`，作为插件管理这次计算的结果。
  return 'unknown'
}

/**
 * Get the git commit SHA for a directory.
 *
 * @param dirPath - Path to directory (should be a git repository)
 * @returns Full commit SHA or null if not a git repo
 */
// getGitCommitSha 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGitCommitSha(dirPath: string): Promise<string | null> {
  // 返回 `getHeadForDir(dirPath)`，作为插件管理这次计算的结果。
  return getHeadForDir(dirPath)
}

/**
 * Extract version from a versioned cache path.
 *
 * Given a path like `~/.claude/plugins/cache/marketplace/plugin/1.0.0`,
 * extracts and returns `1.0.0`.
 *
 * @param installPath - Full path to plugin installation
 * @returns Version string from path, or null if not a versioned path
 */
// getVersionFromPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getVersionFromPath(installPath: string): string | null {
  // Versioned paths have format: .../plugins/cache/marketplace/plugin/version/
  // 片段列表格式化`installPath.split`，供插件管理后续处理使用。
  const parts = installPath.split('/').filter(Boolean)

  // Find 'cache' index to determine depth
  // cacheIndex 缓存筛选`parts.findIndex`，供插件管理后续处理使用。
  const cacheIndex = parts.findIndex(
    // 这个回调绑定到 (part, i) => part === 'cache' && parts[i - 1] === 'plugins',，负责插件管理在该局部场景下的响应。
    (part, i) => part === 'cache' && parts[i - 1] === 'plugins',
  )

  // 满足 `cacheIndex === -1` 时，插件管理执行该分支。
  if (cacheIndex === -1) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // Versioned path has 3 components after 'cache': marketplace/plugin/version
  // componentsAfterCache 缓存格式化`parts.slice`，供插件管理后续处理使用。
  const componentsAfterCache = parts.slice(cacheIndex + 1)
  // 满足 `componentsAfterCache.length >= 3` 时，插件管理执行该分支。
  if (componentsAfterCache.length >= 3) {
    // 返回 `componentsAfterCache[2] || null`，作为插件管理这次计算的结果。
    return componentsAfterCache[2] || null
  }

  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}

/**
 * Check if a path is a versioned plugin path.
 *
 * @param path - Path to check
 * @returns True if path follows versioned structure
 */
// isVersionedPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isVersionedPath(path: string): boolean {
  // 返回 `getVersionFromPath(path) !== null`，作为插件管理这次计算的结果。
  return getVersionFromPath(path) !== null
}
