/**
 * Plugin Loader Module
 *
 * This module is responsible for discovering, loading, and validating Claude Code plugins
 * from various sources including marketplaces and git repositories.
 *
 * NPM packages are also supported but must be referenced through marketplaces - the marketplace
 * entry contains the NPM package information.
 *
 * Plugin Discovery Sources (in order of precedence):
 * 1. Marketplace-based plugins (plugin@marketplace format in settings)
 * 2. Session-only plugins (from --plugin-dir CLI flag or SDK plugins option)
 *
 * Plugin Directory Structure:
 * ```
 * my-plugin/
 * ├── plugin.json          # Optional manifest with metadata
 * ├── commands/            # Custom slash commands
 * │   ├── build.md
 * │   └── deploy.md
 * ├── agents/              # Custom AI agents
 * │   └── test-runner.md
 * └── hooks/               # Hook configurations
 *     └── hooks.json       # Hook definitions
 * ```
 *
 * The loader handles:
 * - Plugin manifest validation
 * - Hooks configuration loading and variable resolution
 * - Duplicate name detection
 * - Enable/disable state management
 * - Error collection and reporting
 */

// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  copyFile,
  readdir,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
  rmdir,
  stat,
  symlink,
} from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join, relative, resolve, sep } from 'path'
// 引入 getInlinePlugins，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getInlinePlugins } from '../../bootstrap/state.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  BUILTIN_MARKETPLACE_NAME,
  getBuiltinPlugins,
} from '../../plugins/builtinPlugins.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import type {
  LoadedPlugin,
  PluginComponent,
  PluginError,
  PluginLoadResult,
  PluginManifest,
} from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  errorMessage,
  getErrnoPath,
  isENOENT,
  isFsInaccessible,
  toError,
} from '../errors.js'
// 引入 execFileNoThrow、execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow, execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 pathExists，将 ../file.js 中已经封装好的能力接到本文件流程里。
import { pathExists } from '../file.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 gitExe，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { gitExe } from '../git.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getSettings_DEPRECATED，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from '../settings/settings.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  clearPluginSettingsBase,
  getPluginSettingsBase,
  resetSettingsCache,
  setPluginSettingsBase,
} from '../settings/settingsCache.js'
// 类型依赖 { HooksSettings } 来自 ../settings/types.js，用于校准插件管理的数据契约。
import type { HooksSettings } from '../settings/types.js'
// 引入 SettingsSchema，将 ../settings/types.js 中已经封装好的能力接到本文件流程里。
import { SettingsSchema } from '../settings/types.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 getAddDirEnabledPlugins，将 ./addDirPluginSettings.js 中已经封装好的能力接到本文件流程里。
import { getAddDirEnabledPlugins } from './addDirPluginSettings.js'
// 引入 verifyAndDemote，将 ./dependencyResolver.js 中已经封装好的能力接到本文件流程里。
import { verifyAndDemote } from './dependencyResolver.js'
// 引入 classifyFetchError、logPluginFetch，将 ./fetchTelemetry.js 中已经封装好的能力接到本文件流程里。
import { classifyFetchError, logPluginFetch } from './fetchTelemetry.js'
// 引入 checkGitAvailable，将 ./gitAvailability.js 中已经封装好的能力接到本文件流程里。
import { checkGitAvailable } from './gitAvailability.js'
// 引入 getInMemoryInstalledPlugins，将 ./installedPluginsManager.js 中已经封装好的能力接到本文件流程里。
import { getInMemoryInstalledPlugins } from './installedPluginsManager.js'
// 引入 getManagedPluginNames，将 ./managedPlugins.js 中已经封装好的能力接到本文件流程里。
import { getManagedPluginNames } from './managedPlugins.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  formatSourceForDisplay,
  getBlockedMarketplaces,
  getStrictKnownMarketplaces,
  isSourceAllowedByPolicy,
  isSourceInBlocklist,
} from './marketplaceHelpers.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getMarketplaceCacheOnly,
  getPluginByIdCacheOnly,
  loadKnownMarketplacesConfigSafe,
} from './marketplaceManager.js'
// 引入 getPluginSeedDirs、getPluginsDirectory，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginSeedDirs, getPluginsDirectory } from './pluginDirectories.js'
// 引入 parsePluginIdentifier，将 ./pluginIdentifier.js 中已经封装好的能力接到本文件流程里。
import { parsePluginIdentifier } from './pluginIdentifier.js'
// 引入 validatePathWithinBase，将 ./pluginInstallationHelpers.js 中已经封装好的能力接到本文件流程里。
import { validatePathWithinBase } from './pluginInstallationHelpers.js'
// 引入 calculatePluginVersion，将 ./pluginVersioning.js 中已经封装好的能力接到本文件流程里。
import { calculatePluginVersion } from './pluginVersioning.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type CommandMetadata,
  PluginHooksSchema,
  PluginIdSchema,
  PluginManifestSchema,
  type PluginMarketplaceEntry,
  type PluginSource,
} from './schemas.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  convertDirectoryToZipInPlace,
  extractZipToDirectory,
  getSessionPluginCachePath,
  isPluginZipCacheEnabled,
} from './zipCache.js'

/**
 * Get the path where plugin cache is stored
 */
// getPluginCachePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginCachePath(): string {
  // 返回 `join(getPluginsDirectory(), 'cache')`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), 'cache')
}

/**
 * Compute the versioned cache path under a specific base plugins directory.
 * Used to probe both primary and seed caches.
 *
 * @param baseDir - Base plugins directory (e.g. getPluginsDirectory() or seed dir)
 * @param pluginId - Plugin identifier in format "name@marketplace"
 * @param version - Version string (semver, git SHA, etc.)
 * @returns Absolute path to versioned plugin directory under baseDir
 */
// getVersionedCachePathIn 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getVersionedCachePathIn(
  baseDir: string,
  pluginId: string,
  version: string,
): string {
  // 从 `parsePluginIdentifier(pluginId)` 解构 name、marketplace，减少插件工具 plugin Loader对同一对象的重复访问。
  const { name: pluginName, marketplace } = parsePluginIdentifier(pluginId)
  // sanitizedMarketplace 市场数据格式化`replace`，供插件管理后续处理使用。
  const sanitizedMarketplace = (marketplace || 'unknown').replace(
    /[^a-zA-Z0-9\-_]/g,
    '-',
  )
  // sanitizedPlugin 插件数据格式化`replace`，供插件管理后续处理使用。
  const sanitizedPlugin = (pluginName || pluginId).replace(
    /[^a-zA-Z0-9\-_]/g,
    '-',
  )
  // Sanitize version to prevent path traversal attacks
  // sanitizedVersion格式化`version.replace`，供插件管理后续处理使用。
  const sanitizedVersion = version.replace(/[^a-zA-Z0-9\-_.]/g, '-')
  // 返回 `join(`，作为插件管理这次计算的结果。
  return join(
    baseDir,
    'cache',
    sanitizedMarketplace,
    sanitizedPlugin,
    sanitizedVersion,
  )
}

/**
 * Get versioned cache path for a plugin under the primary plugins directory.
 * Format: ~/.claude/plugins/cache/{marketplace}/{plugin}/{version}/
 *
 * @param pluginId - Plugin identifier in format "name@marketplace"
 * @param version - Version string (semver, git SHA, etc.)
 * @returns Absolute path to versioned plugin directory
 */
// getVersionedCachePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getVersionedCachePath(
  pluginId: string,
  version: string,
): string {
  // 返回 `getVersionedCachePathIn(getPluginsDirectory(), pluginId, version)`，作为插件管理这次计算的结果。
  return getVersionedCachePathIn(getPluginsDirectory(), pluginId, version)
}

/**
 * Get versioned ZIP cache path for a plugin.
 * This is the zip cache variant of getVersionedCachePath.
 */
// getVersionedZipCachePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getVersionedZipCachePath(
  pluginId: string,
  version: string,
): string {
  // 返回 ``${getVersionedCachePath(pluginId, version)}.zip``，作为插件管理这次计算的结果。
  return `${getVersionedCachePath(pluginId, version)}.zip`
}

/**
 * Probe seed directories for a populated cache at this plugin version.
 * Seeds are checked in precedence order; first hit wins. Returns null if no
 * seed is configured or none contains a populated directory at this version.
 */
// probeSeedCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function probeSeedCache(
  pluginId: string,
  version: string,
): Promise<string | null> {
  // 逐项读取 `getPluginSeedDirs()` 中的seedDir，按输入顺序推进插件管理。
  for (const seedDir of getPluginSeedDirs()) {
    // seedPath 路径数据读取`getVersionedCachePathIn`，供插件管理后续处理使用。
    const seedPath = getVersionedCachePathIn(seedDir, pluginId, version)
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // entries 集合读取`readdir`，供插件管理后续处理使用。
      const entries = await readdir(seedPath)
      // 满足 `entries.length > 0` 时，插件管理执行该分支。
      if (entries.length > 0) return seedPath
    } catch {
      // Try next seed
    }
  }
  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}

/**
 * When the computed version is 'unknown', probe seed/cache/<m>/<p>/ for an
 * actual version dir. Handles the first-boot chicken-and-egg where the
 * version can only be known after cloning, but seed already has the clone.
 *
 * Per seed, only matches when exactly one version exists (typical BYOC case).
 * Multiple versions within a single seed → ambiguous → try next seed.
 * Seeds are checked in precedence order; first match wins.
 */
// probeSeedCacheAnyVersion 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function probeSeedCacheAnyVersion(
  pluginId: string,
): Promise<string | null> {
  // 逐项读取 `getPluginSeedDirs()` 中的seedDir，按输入顺序推进插件管理。
  for (const seedDir of getPluginSeedDirs()) {
    // The parent of the version dir — computed the same way as
    // getVersionedCachePathIn, just without the version component.
    // pluginDir 插件数据保存`dirname`，供插件管理后续处理使用。
    const pluginDir = dirname(getVersionedCachePathIn(seedDir, pluginId, '_'))
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // versions 集合读取`readdir`，供插件管理后续处理使用。
      const versions = await readdir(pluginDir)
      // `versions.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
      if (versions.length !== 1) continue
      // versionDir格式化`join`，供插件管理后续处理使用。
      const versionDir = join(pluginDir, versions[0]!)
      // entries 集合读取`readdir`，供插件管理后续处理使用。
      const entries = await readdir(versionDir)
      // 满足 `entries.length > 0` 时，插件管理执行该分支。
      if (entries.length > 0) return versionDir
    } catch {
      // Try next seed
    }
  }
  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}

/**
 * Get legacy (non-versioned) cache path for a plugin.
 * Format: ~/.claude/plugins/cache/{plugin-name}/
 *
 * Used for backward compatibility with existing installations.
 *
 * @param pluginName - Plugin name (without marketplace suffix)
 * @returns Absolute path to legacy plugin directory
 */
// getLegacyCachePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLegacyCachePath(pluginName: string): string {
  // cachePath 路径数据读取`getPluginCachePath`，供插件管理后续处理使用。
  const cachePath = getPluginCachePath()
  // 返回 `join(cachePath, pluginName.replace(/[^a-zA-Z0-9\-_]/g, '-'))`，作为插件管理这次计算的结果。
  return join(cachePath, pluginName.replace(/[^a-zA-Z0-9\-_]/g, '-'))
}

/**
 * Resolve plugin path with fallback to legacy location.
 *
 * Always:
 * 1. Try versioned path first if version is provided
 * 2. Fall back to legacy path for existing installations
 * 3. Return versioned path for new installations
 *
 * @param pluginId - Plugin identifier in format "name@marketplace"
 * @param version - Optional version string
 * @returns Absolute path to plugin directory
 */
// resolvePluginPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolvePluginPath(
  pluginId: string,
  version?: string,
): Promise<string> {
  // Try versioned path first
  // 满足 `version` 时，插件管理执行该分支。
  if (version) {
    // versionedPath 路径数据读取`getVersionedCachePath`，供插件管理后续处理使用。
    const versionedPath = getVersionedCachePath(pluginId, version)
    // 满足 `await pathExists(versionedPath)` 时，插件管理执行该分支。
    if (await pathExists(versionedPath)) {
      // 返回 `versionedPath`，作为插件管理这次计算的结果。
      return versionedPath
    }
  }

  // Fall back to legacy path for existing installations
  // pluginName 插件数据解析`parsePluginIdentifier`，供插件管理后续处理使用。
  const pluginName = parsePluginIdentifier(pluginId).name || pluginId
  // legacyPath 路径数据读取`getLegacyCachePath`，供插件管理后续处理使用。
  const legacyPath = getLegacyCachePath(pluginName)
  // 满足 `await pathExists(legacyPath)` 时，插件管理执行该分支。
  if (await pathExists(legacyPath)) {
    // 返回 `legacyPath`，作为插件管理这次计算的结果。
    return legacyPath
  }

  // Return versioned path for new installations
  // 返回 `version ? getVersionedCachePath(pluginId, version) : legacyPath`，作为插件管理这次计算的结果。
  return version ? getVersionedCachePath(pluginId, version) : legacyPath
}

/**
 * Recursively copy a directory.
 * Exported for testing purposes.
 */
// copyDir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function copyDir(src: string, dest: string): Promise<void> {
  // 等待 `getFsImplementation().mkdir(dest)` 完成，再继续插件工具 plugin Loader的异步流程。
  await getFsImplementation().mkdir(dest)

  // entries 集合读取`readdir`，供插件管理后续处理使用。
  const entries = await readdir(src, { withFileTypes: true })

  // 按顺序遍历 `entries` 中的entry，逐个交给插件管理处理。
  for (const entry of entries) {
    // srcPath 路径数据格式化`join`，供插件管理后续处理使用。
    const srcPath = join(src, entry.name)
    // destPath 路径数据格式化`join`，供插件管理后续处理使用。
    const destPath = join(dest, entry.name)

    // 满足 `entry.isDirectory()` 时，插件管理执行该分支。
    if (entry.isDirectory()) {
      // 等待 `copyDir(srcPath, destPath)` 完成，再继续插件工具 plugin Loader的异步流程。
      await copyDir(srcPath, destPath)
    // 插件工具 plugin Loader在这里处理 `} else if (entry.isFile()) {`，完成这一小步状态转换。
    } else if (entry.isFile()) {
      // 等待 `copyFile(srcPath, destPath)` 完成，再继续插件工具 plugin Loader的异步流程。
      await copyFile(srcPath, destPath)
    // 插件工具 plugin Loader在这里处理 `} else if (entry.isSymbolicLink()) {`，完成这一小步状态转换。
    } else if (entry.isSymbolicLink()) {
      // linkTarget读取`readlink`，供插件管理后续处理使用。
      const linkTarget = await readlink(srcPath)

      // Resolve the symlink to get the actual target path
      // This prevents circular symlinks when src and dest overlap (e.g., via symlink chains)
      // resolvedTarget 先占位，稍后的条件分支会根据实际输入补齐它。
      let resolvedTarget: string
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // resolvedTarget更新为 `await realpath(srcPath)`，确保插件工具后续读取最新状态。
        resolvedTarget = await realpath(srcPath)
      } catch {
        // Broken symlink - copy the raw link target as-is
        // 等待 `symlink(linkTarget, destPath)` 完成，再继续插件工具 plugin Loader的异步流程。
        await symlink(linkTarget, destPath)
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // Resolve the source directory to handle symlinked source dirs
      // resolvedSrc 先占位，稍后的条件分支会根据实际输入补齐它。
      let resolvedSrc: string
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // resolvedSrc更新为 `await realpath(src)`，确保插件工具后续读取最新状态。
        resolvedSrc = await realpath(src)
      } catch {
        // resolvedSrc更新为 `src`，确保插件工具后续读取最新状态。
        resolvedSrc = src
      }

      // Check if target is within the source tree (using proper path prefix matching)
      // srcPrefix读取`resolvedSrc.endsWith`，供插件管理后续处理使用。
      const srcPrefix = resolvedSrc.endsWith(sep)
        ? resolvedSrc
        : resolvedSrc + sep
      // 插件管理在这里按实际状态进入对应分支。
      if (
        resolvedTarget.startsWith(srcPrefix) ||
        resolvedTarget === resolvedSrc
      ) {
        // Target is within source tree - create relative symlink that preserves
        // the same structure in the destination
        // targetRelativeToSrc保存`relative`，供插件管理后续处理使用。
        const targetRelativeToSrc = relative(resolvedSrc, resolvedTarget)
        // destTargetPath 路径数据格式化`join`，供插件管理后续处理使用。
        const destTargetPath = join(dest, targetRelativeToSrc)
        // relativeLinkPath 路径数据保存`relative`，供插件管理后续处理使用。
        const relativeLinkPath = relative(dirname(destPath), destTargetPath)
        // 等待 `symlink(relativeLinkPath, destPath)` 完成，再继续插件工具 plugin Loader的异步流程。
        await symlink(relativeLinkPath, destPath)
      } else {
        // Target is outside source tree - use absolute resolved path
        // 等待 `symlink(resolvedTarget, destPath)` 完成，再继续插件工具 plugin Loader的异步流程。
        await symlink(resolvedTarget, destPath)
      }
    }
  }
}

/**
 * Copy plugin files to versioned cache directory.
 *
 * For local plugins: Uses entry.source from marketplace.json as the single source of truth.
 * For remote plugins: Falls back to copying sourcePath (the downloaded content).
 *
 * @param sourcePath - Path to the plugin source (used as fallback for remote plugins)
 * @param pluginId - Plugin identifier in format "name@marketplace"
 * @param version - Version string for versioned path
 * @param entry - Optional marketplace entry containing the source field
 * @param marketplaceDir - Marketplace directory for resolving entry.source (undefined for remote plugins)
 * @returns Path to the cached plugin directory
 * @throws Error if the source directory is not found
 * @throws Error if the destination directory is empty after copy
 */
// copyPluginToVersionedCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function copyPluginToVersionedCache(
  sourcePath: string,
  pluginId: string,
  version: string,
  entry?: PluginMarketplaceEntry,
  marketplaceDir?: string,
): Promise<string> {
  // When zip cache is enabled, the canonical format is a ZIP file
  // zipCacheMode 缓存保存`isPluginZipCacheEnabled`，供插件管理后续处理使用。
  const zipCacheMode = isPluginZipCacheEnabled()
  // cachePath 路径数据读取`getVersionedCachePath`，供插件管理后续处理使用。
  const cachePath = getVersionedCachePath(pluginId, version)
  // zipPath 路径数据读取`getVersionedZipCachePath`，供插件管理后续处理使用。
  const zipPath = getVersionedZipCachePath(pluginId, version)

  // If cache already exists (directory or ZIP), return it
  // 满足 `zipCacheMode` 时，插件管理执行该分支。
  if (zipCacheMode) {
    // 满足 `await pathExists(zipPath)` 时，插件管理执行该分支。
    if (await pathExists(zipPath)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin ${pluginId} version ${version} already cached at ${zipPath}`,
      )
      // 返回 `zipPath`，作为插件管理这次计算的结果。
      return zipPath
    }
  // 插件工具 plugin Loader在这里处理 `} else if (await pathExists(cachePath)) {`，完成这一小步状态转换。
  } else if (await pathExists(cachePath)) {
    // entries 集合读取`readdir`，供插件管理后续处理使用。
    const entries = await readdir(cachePath)
    // 满足 `entries.length > 0` 时，插件管理执行该分支。
    if (entries.length > 0) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin ${pluginId} version ${version} already cached at ${cachePath}`,
      )
      // 返回 `cachePath`，作为插件管理这次计算的结果。
      return cachePath
    }
    // Directory exists but is empty, remove it so we can recreate with content
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Removing empty cache directory for ${pluginId} at ${cachePath}`,
    )
    // 等待 `rmdir(cachePath)` 完成，再继续插件工具 plugin Loader的异步流程。
    await rmdir(cachePath)
  }

  // Seed cache hit — return seed path in place (read-only, no copy).
  // Callers handle both directory and .zip paths; this returns a directory.
  // seedPath 路径数据保存`probeSeedCache`，供插件管理后续处理使用。
  const seedPath = await probeSeedCache(pluginId, version)
  // 满足 `seedPath` 时，插件管理执行该分支。
  if (seedPath) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Using seed cache for ${pluginId}@${version} at ${seedPath}`,
    )
    // 返回 `seedPath`，作为插件管理这次计算的结果。
    return seedPath
  }

  // Create parent directories
  // 等待 `getFsImplementation().mkdir(dirname(cachePath))` 完成，再继续插件工具 plugin Loader的异步流程。
  await getFsImplementation().mkdir(dirname(cachePath))

  // For local plugins: copy entry.source directory (the single source of truth)
  // For remote plugins: marketplaceDir is undefined, fall back to copying sourcePath
  // 只有 `entry && typeof entry.source === 'string' && mark` 满足时，插件管理才执行该分支。
  if (entry && typeof entry.source === 'string' && marketplaceDir) {
    // sourceDir读取`validatePathWithinBase`，供插件管理后续处理使用。
    const sourceDir = validatePathWithinBase(marketplaceDir, entry.source)

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Copying source directory ${entry.source} for plugin ${pluginId}`,
    )
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `copyDir(sourceDir, cachePath)` 完成，再继续插件工具 plugin Loader的异步流程。
      await copyDir(sourceDir, cachePath)
    } catch (e: unknown) {
      // Only remap ENOENT from the top-level sourceDir itself — nested ENOENTs
      // from recursive copyDir (broken symlinks, raced deletes) should preserve
      // their original path in the error.
      // 只有 `isENOENT(e) && getErrnoPath(e) === sourceDir` 满足时，插件管理才执行该分支。
      if (isENOENT(e) && getErrnoPath(e) === sourceDir) {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Plugin source directory not found: ${sourceDir} (from entry.source: ${entry.source})`,
        )
      }
      // 抛出 e，阻止插件管理在无效状态下继续运行。
      throw e
    }
  } else {
    // Fallback for remote plugins (already downloaded) or plugins without entry.source
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Copying plugin ${pluginId} to versioned cache (fallback to full copy)`,
    )
    // 等待 `copyDir(sourcePath, cachePath)` 完成，再继续插件工具 plugin Loader的异步流程。
    await copyDir(sourcePath, cachePath)
  }

  // Remove .git directory from cache if present
  // gitPath 路径数据格式化`join`，供插件管理后续处理使用。
  const gitPath = join(cachePath, '.git')
  // 等待 `rm(gitPath, { recursive: true, force: true })` 完成，再继续插件工具 plugin Loader的异步流程。
  await rm(gitPath, { recursive: true, force: true })

  // Validate that cache has content - if empty, throw so fallback can be used
  // cacheEntries 缓存读取`readdir`，供插件管理后续处理使用。
  const cacheEntries = await readdir(cachePath)
  // cacheEntries 缓存为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (cacheEntries.length === 0) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Failed to copy plugin ${pluginId} to versioned cache: destination is empty after copy`,
    )
  }

  // Zip cache mode: convert directory to ZIP and remove the directory
  // 满足 `zipCacheMode` 时，插件管理执行该分支。
  if (zipCacheMode) {
    // 等待 `convertDirectoryToZipInPlace(cachePath, zipPath)` 完成，再继续插件工具 plugin Loader的异步流程。
    await convertDirectoryToZipInPlace(cachePath, zipPath)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Successfully cached plugin ${pluginId} as ZIP at ${zipPath}`,
    )
    // 返回 `zipPath`，作为插件管理这次计算的结果。
    return zipPath
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Successfully cached plugin ${pluginId} at ${cachePath}`)
  // 返回 `cachePath`，作为插件管理这次计算的结果。
  return cachePath
}

/**
 * Validate a git URL using Node.js URL parsing
 */
// validateGitUrl 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateGitUrl(url: string): string {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`URL`，供插件管理后续处理使用。
    const parsed = new URL(url)
    // 满足 `!['https:', 'http:', 'file:'].includes(parsed.protocol)` 时，插件管理执行该分支。
    if (!['https:', 'http:', 'file:'].includes(parsed.protocol)) {
      // 满足 `!/^git@[a-zA-Z0-9.-]+:/.test(url)` 时，插件管理执行该分支。
      if (!/^git@[a-zA-Z0-9.-]+:/.test(url)) {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Invalid git URL protocol: ${parsed.protocol}. Only HTTPS, HTTP, file:// and SSH (git@) URLs are supported.`,
        )
      }
    }
    // 返回 `url`，作为插件管理这次计算的结果。
    return url
  } catch {
    // 满足 `/^git@[a-zA-Z0-9.-]+:/.test(url)` 时，插件管理执行该分支。
    if (/^git@[a-zA-Z0-9.-]+:/.test(url)) {
      // 返回 `url`，作为插件管理这次计算的结果。
      return url
    }
    // 抛出 new Error(`Invalid git URL: ${url}`)，阻止插件管理在无效状态下继续运行。
    throw new Error(`Invalid git URL: ${url}`)
  }
}

/**
 * Install a plugin from npm using a global cache (exported for testing)
 */
// installFromNpm 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installFromNpm(
  packageName: string,
  targetPath: string,
  options: { registry?: string; version?: string } = {},
): Promise<void> {
  // npmCachePath 路径数据格式化`join`，供插件管理后续处理使用。
  const npmCachePath = join(getPluginsDirectory(), 'npm-cache')

  // 等待 `getFsImplementation().mkdir(npmCachePath)` 完成，再继续插件工具 plugin Loader的异步流程。
  await getFsImplementation().mkdir(npmCachePath)

  // packageSpec保存`options.version`，供后续判断或组装使用。
  const packageSpec = options.version
    ? `${packageName}@${options.version}`
    : packageName
  // packagePath 路径数据格式化`join`，供插件管理后续处理使用。
  const packagePath = join(npmCachePath, 'node_modules', packageName)
  // needsInstall记录 `pathExists` 是否成立，插件管理随后按该结果分支。
  const needsInstall = !(await pathExists(packagePath))

  // 满足 `needsInstall` 时，插件管理执行该分支。
  if (needsInstall) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Installing npm package ${packageSpec} to cache`)
    // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
    const args = ['install', packageSpec, '--prefix', npmCachePath]
    // 满足 `options.registry` 时，插件管理执行该分支。
    if (options.registry) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('--registry', options.registry)
    }
    // 结果保存`execFileNoThrow`，供插件管理后续处理使用。
    const result = await execFileNoThrow('npm', args, { useCwd: false })

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 抛出 new Error(`Failed to install npm package: ${result.stderr}`)，阻止插件管理在无效状态下继续运行。
      throw new Error(`Failed to install npm package: ${result.stderr}`)
    }
  }

  // 等待 `copyDir(packagePath, targetPath)` 完成，再继续插件工具 plugin Loader的异步流程。
  await copyDir(packagePath, targetPath)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Copied npm package ${packageName} from cache to ${targetPath}`,
  )
}

/**
 * Clone a git repository (exported for testing)
 *
 * @param gitUrl - The git URL to clone
 * @param targetPath - Where to clone the repository
 * @param ref - Optional branch or tag to checkout
 * @param sha - Optional specific commit SHA to checkout
 */
// gitClone 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function gitClone(
  gitUrl: string,
  targetPath: string,
  ref?: string,
  sha?: string,
): Promise<void> {
  // Use --recurse-submodules to initialize submodules
  // Always start with shallow clone for efficiency
  // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
  const args = [
    'clone',
    '--depth',
    '1',
    '--recurse-submodules',
    '--shallow-submodules',
  ]

  // Add --branch flag for specific ref (works for both branches and tags)
  // 满足 `ref` 时，插件管理执行该分支。
  if (ref) {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--branch', ref)
  }

  // If sha is specified, use --no-checkout since we'll checkout the SHA separately
  // 满足 `sha` 时，插件管理执行该分支。
  if (sha) {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--no-checkout')
  }

  // 参数列表追加新条目，保持收集顺序与输入顺序一致。
  args.push(gitUrl, targetPath)

  // cloneStarted记录时间`performance.now`，供插件管理后续处理使用。
  const cloneStarted = performance.now()
  // cloneResult保存`execFileNoThrow`，供插件管理后续处理使用。
  const cloneResult = await execFileNoThrow(gitExe(), args)

  // `cloneResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (cloneResult.code !== 0) {
    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch(
      'plugin_clone',
      gitUrl,
      'failure',
      performance.now() - cloneStarted,
      classifyFetchError(cloneResult.stderr),
    )
    // 抛出 new Error(`Failed to clone repository: ${cloneResult.stderr}`)，阻止插件管理在无效状态下继续运行。
    throw new Error(`Failed to clone repository: ${cloneResult.stderr}`)
  }

  // If sha is specified, fetch and checkout that specific commit
  // 满足 `sha` 时，插件管理执行该分支。
  if (sha) {
    // Try shallow fetch of the specific SHA first (most efficient)
    // shallowFetchResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
    const shallowFetchResult = await execFileNoThrowWithCwd(
      gitExe(),
      ['fetch', '--depth', '1', 'origin', sha],
      { cwd: targetPath },
    )

    // `shallowFetchResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (shallowFetchResult.code !== 0) {
      // Some servers don't support fetching arbitrary SHAs
      // Fall back to unshallow fetch to get full history
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Shallow fetch of SHA ${sha} failed, falling back to unshallow fetch`,
      )
      // unshallowResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
      const unshallowResult = await execFileNoThrowWithCwd(
        gitExe(),
        ['fetch', '--unshallow'],
        { cwd: targetPath },
      )

      // `unshallowResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (unshallowResult.code !== 0) {
        // 调用 logPluginFetch，触发插件管理此处需要的副作用。
        logPluginFetch(
          'plugin_clone',
          gitUrl,
          'failure',
          performance.now() - cloneStarted,
          classifyFetchError(unshallowResult.stderr),
        )
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Failed to fetch commit ${sha}: ${unshallowResult.stderr}`,
        )
      }
    }

    // Checkout the specific commit
    // checkoutResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
    const checkoutResult = await execFileNoThrowWithCwd(
      gitExe(),
      ['checkout', sha],
      { cwd: targetPath },
    )

    // `checkoutResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (checkoutResult.code !== 0) {
      // 调用 logPluginFetch，触发插件管理此处需要的副作用。
      logPluginFetch(
        'plugin_clone',
        gitUrl,
        'failure',
        performance.now() - cloneStarted,
        classifyFetchError(checkoutResult.stderr),
      )
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Failed to checkout commit ${sha}: ${checkoutResult.stderr}`,
      )
    }
  }

  // Fire success only after ALL network ops (clone + optional SHA fetch)
  // complete — same telemetry-scope discipline as mcpb and marketplace_url.
  // 调用 logPluginFetch，触发插件管理此处需要的副作用。
  logPluginFetch(
    'plugin_clone',
    gitUrl,
    'success',
    performance.now() - cloneStarted,
  )
}

/**
 * Install a plugin from a git URL
 */
// installFromGit 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installFromGit(
  gitUrl: string,
  targetPath: string,
  ref?: string,
  sha?: string,
): Promise<void> {
  // safeUrl读取`validateGitUrl`，供插件管理后续处理使用。
  const safeUrl = validateGitUrl(gitUrl)
  // 等待 `gitClone(safeUrl, targetPath, ref, sha)` 完成，再继续插件工具 plugin Loader的异步流程。
  await gitClone(safeUrl, targetPath, ref, sha)
  // refMessage 消息数据保存`ref ? ` (ref: ${ref})` : ''`，供后续判断或组装使用。
  const refMessage = ref ? ` (ref: ${ref})` : ''
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Cloned repository from ${safeUrl}${refMessage} to ${targetPath}`,
  )
}

/**
 * Install a plugin from GitHub
 */
// installFromGitHub 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installFromGitHub(
  repo: string,
  targetPath: string,
  ref?: string,
  sha?: string,
): Promise<void> {
  // 满足 `!/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/.test(repo)` 时，插件管理执行该分支。
  if (!/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/.test(repo)) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Invalid GitHub repository format: ${repo}. Expected format: owner/repo`,
    )
  }
  // Use HTTPS for CCR (no SSH keys), SSH for normal CLI
  // gitUrl保存`isEnvTruthy`，供插件管理后续处理使用。
  const gitUrl = isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)
    ? `https://github.com/${repo}.git`
    : `git@github.com:${repo}.git`
  // 返回 `installFromGit(gitUrl, targetPath, ref, sha)`，作为插件管理这次计算的结果。
  return installFromGit(gitUrl, targetPath, ref, sha)
}

/**
 * Resolve a git-subdir `url` field to a clonable git URL.
 * Accepts GitHub owner/repo shorthand (converted to ssh or https depending on
 * CLAUDE_CODE_REMOTE) or any URL that passes validateGitUrl (https, http,
 * file, git@ ssh).
 */
// resolveGitSubdirUrl 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveGitSubdirUrl(url: string): string {
  // 满足 `/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/.test(url)` 时，插件管理执行该分支。
  if (/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/.test(url)) {
    // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)`，作为插件管理这次计算的结果。
    return isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)
      ? `https://github.com/${url}.git`
      : `git@github.com:${url}.git`
  }
  // 返回 `validateGitUrl(url)`，作为插件管理这次计算的结果。
  return validateGitUrl(url)
}

/**
 * Install a plugin from a subdirectory of a git repository (exported for
 * testing).
 *
 * Uses partial clone (--filter=tree:0) + sparse-checkout so only the tree
 * objects along the path and the blobs under it are downloaded. For large
 * monorepos this is dramatically cheaper than a full clone — the tree objects
 * for a million-file repo can be hundreds of MB, all avoided here.
 *
 * Sequence:
 * 1. clone --depth 1 --filter=tree:0 --no-checkout [--branch ref]
 * 2. sparse-checkout set --cone -- <path>
 * 3. If sha: fetch --depth 1 origin <sha> (fallback: --unshallow), then
 *    checkout <sha>. The partial-clone filter is stored in remote config so
 *    subsequent fetches respect it; --unshallow gets all commits but trees
 *    and blobs remain lazy.
 *    If no sha: checkout HEAD (points to ref if --branch was used).
 * 4. Move <cloneDir>/<path> to targetPath and discard the clone.
 *
 * The clone is ephemeral — it goes into a sibling temp directory and is
 * removed after the subdir is extracted. targetPath ends up containing only
 * the plugin files with no .git directory.
 */
// installFromGitSubdir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installFromGitSubdir(
  url: string,
  targetPath: string,
  subdirPath: string,
  ref?: string,
  sha?: string,
): Promise<string | undefined> {
  // 满足 `!(await checkGitAvailable())` 时，插件管理执行该分支。
  if (!(await checkGitAvailable())) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      'git-subdir plugin source requires git to be installed and on PATH. ' +
        'Install git (version 2.25 or later for sparse-checkout cone mode) and try again.',
    )
  }

  // gitUrl读取`resolveGitSubdirUrl`，供插件管理后续处理使用。
  const gitUrl = resolveGitSubdirUrl(url)
  // Clone into a sibling temp dir (same filesystem → rename works, no EXDEV).
  // cloneDir固定为 ``${targetPath}.clone``，作为插件工具 plugin Loader后续展示或比较的基准。
  const cloneDir = `${targetPath}.clone`

  // cloneArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const cloneArgs = [
    'clone',
    '--depth',
    '1',
    '--filter=tree:0',
    '--no-checkout',
  ]
  // 满足 `ref` 时，插件管理执行该分支。
  if (ref) {
    // cloneArgs 集合追加新条目，保持收集顺序与输入顺序一致。
    cloneArgs.push('--branch', ref)
  }
  // cloneArgs 集合追加新条目，保持收集顺序与输入顺序一致。
  cloneArgs.push(gitUrl, cloneDir)

  // cloneResult保存`execFileNoThrow`，供插件管理后续处理使用。
  const cloneResult = await execFileNoThrow(gitExe(), cloneArgs)
  // `cloneResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (cloneResult.code !== 0) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Failed to clone repository for git-subdir source: ${cloneResult.stderr}`,
    )
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // sparseResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
    const sparseResult = await execFileNoThrowWithCwd(
      gitExe(),
      ['sparse-checkout', 'set', '--cone', '--', subdirPath],
      { cwd: cloneDir },
    )
    // `sparseResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (sparseResult.code !== 0) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `git sparse-checkout set failed (git >= 2.25 required for cone mode): ${sparseResult.stderr}`,
      )
    }

    // Capture the resolved commit SHA before discarding the clone. The
    // extracted subdir has no .git, so the caller can't rev-parse it later.
    // If the source specified a full 40-char sha we already know it; otherwise
    // read HEAD (which points to ref's tip after --branch, or the remote
    // default branch if no ref was given).
    // resolvedSha 先占位，稍后的条件分支会根据实际输入补齐它。
    let resolvedSha: string | undefined

    // 满足 `sha` 时，插件管理执行该分支。
    if (sha) {
      // fetchSha保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
      const fetchSha = await execFileNoThrowWithCwd(
        gitExe(),
        ['fetch', '--depth', '1', 'origin', sha],
        { cwd: cloneDir },
      )
      // `fetchSha.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (fetchSha.code !== 0) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Shallow fetch of SHA ${sha} failed for git-subdir, falling back to unshallow fetch`,
        )
        // unshallow保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
        const unshallow = await execFileNoThrowWithCwd(
          gitExe(),
          ['fetch', '--unshallow'],
          { cwd: cloneDir },
        )
        // `unshallow.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
        if (unshallow.code !== 0) {
          // 抛出 new Error(`Failed to fetch commit ${sha}: ${unshallow.stderr}`)，阻止插件管理在无效状态下继续运行。
          throw new Error(`Failed to fetch commit ${sha}: ${unshallow.stderr}`)
        }
      }
      // checkout保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
      const checkout = await execFileNoThrowWithCwd(
        gitExe(),
        ['checkout', sha],
        { cwd: cloneDir },
      )
      // `checkout.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (checkout.code !== 0) {
        // 抛出 new Error(`Failed to checkout commit ${sha}: ${checkout.stderr}`)，阻止插件管理在无效状态下继续运行。
        throw new Error(`Failed to checkout commit ${sha}: ${checkout.stderr}`)
      }
      // resolvedSha更新为 `sha`，确保插件工具后续读取最新状态。
      resolvedSha = sha
    } else {
      // checkout HEAD materializes the working tree (this is where blobs are
      // lazy-fetched — the slow, network-bound step). It doesn't move HEAD;
      // --branch at clone time already positioned it. rev-parse HEAD is a
      // purely read-only ref lookup (no index lock), so it runs safely in
      // parallel with checkout and we avoid waiting on the network for it.
      // 并行获取 checkout、revParse，缩短插件工具 plugin Loader等待多个独立异步任务的时间。
      const [checkout, revParse] = await Promise.all([
        execFileNoThrowWithCwd(gitExe(), ['checkout', 'HEAD'], {
          cwd: cloneDir,
        }),
        execFileNoThrowWithCwd(gitExe(), ['rev-parse', 'HEAD'], {
          cwd: cloneDir,
        }),
      ])
      // `checkout.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (checkout.code !== 0) {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `git checkout after sparse-checkout failed: ${checkout.stderr}`,
        )
      }
      // 满足 `revParse.code === 0` 时，插件管理执行该分支。
      if (revParse.code === 0) {
        // resolvedSha更新为 `revParse.stdout.trim()`，确保插件工具后续读取最新状态。
        resolvedSha = revParse.stdout.trim()
      }
    }

    // Path traversal guard: resolve+verify the subdir stays inside cloneDir
    // before moving it out. rename ENOENT is wrapped with a friendlier
    // message that references the source path, not internal temp dirs.
    // resolvedSubdir读取`validatePathWithinBase`，供插件管理后续处理使用。
    const resolvedSubdir = validatePathWithinBase(cloneDir, subdirPath)
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `rename(resolvedSubdir, targetPath)` 完成，再继续插件工具 plugin Loader的异步流程。
      await rename(resolvedSubdir, targetPath)
    } catch (e: unknown) {
      // 满足 `isENOENT(e)` 时，插件管理执行该分支。
      if (isENOENT(e)) {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Subdirectory '${subdirPath}' not found in repository ${gitUrl}${ref ? ` (ref: ${ref})` : ''}. ` +
            'Check that the path is correct and exists at the specified ref/sha.',
        )
      }
      // 抛出 e，阻止插件管理在无效状态下继续运行。
      throw e
    }

    // refMsg 命名 `ref ? ` ref=${ref}` : ''`，让后续代码直接表达这个值的用途。
    const refMsg = ref ? ` ref=${ref}` : ''
    // shaMsg读取`resolvedSha ? ` sha=${resolvedSha}` : ''` 整理出中间结果，供插件工具 plugin Loader后续步骤使用。
    const shaMsg = resolvedSha ? ` sha=${resolvedSha}` : ''
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Extracted subdir ${subdirPath} from ${gitUrl}${refMsg}${shaMsg} to ${targetPath}`,
    )
    // 返回 `resolvedSha`，作为插件管理这次计算的结果。
    return resolvedSha
  } finally {
    // 等待 `rm(cloneDir, { recursive: true, force: true })` 完成，再继续插件工具 plugin Loader的异步流程。
    await rm(cloneDir, { recursive: true, force: true })
  }
}

/**
 * Install a plugin from a local path
 */
// installFromLocal 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installFromLocal(
  sourcePath: string,
  targetPath: string,
): Promise<void> {
  // 满足 `!(await pathExists(sourcePath))` 时，插件管理执行该分支。
  if (!(await pathExists(sourcePath))) {
    // 抛出 new Error(`Source path does not exist: ${sourcePath}`)，阻止插件管理在无效状态下继续运行。
    throw new Error(`Source path does not exist: ${sourcePath}`)
  }

  // 等待 `copyDir(sourcePath, targetPath)` 完成，再继续插件工具 plugin Loader的异步流程。
  await copyDir(sourcePath, targetPath)

  // gitPath 路径数据格式化`join`，供插件管理后续处理使用。
  const gitPath = join(targetPath, '.git')
  // 等待 `rm(gitPath, { recursive: true, force: true })` 完成，再继续插件工具 plugin Loader的异步流程。
  await rm(gitPath, { recursive: true, force: true })
}

/**
 * Generate a temporary cache name for a plugin
 */
// generateTemporaryCacheNameForPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateTemporaryCacheNameForPlugin(
  source: PluginSource,
): string {
  // timestamp记录时间`Date.now`，供插件管理后续处理使用。
  const timestamp = Date.now()
  // random保存`Math.random`，供插件管理后续处理使用。
  const random = Math.random().toString(36).substring(2, 8)

  // prefix 先占位，稍后的条件分支会根据实际输入补齐它。
  let prefix: string

  // 当 `typeof source` 匹配 `'string'` 时，插件管理执行对应分支。
  if (typeof source === 'string') {
    // prefix更新为 `'local'`，确保插件工具后续读取最新状态。
    prefix = 'local'
  } else {
    // 按照 source.source 的取值选择插件管理的具体处理分支。
    switch (source.source) {
      case 'npm':
        // prefix更新为 `'npm'`，确保插件工具后续读取最新状态。
        prefix = 'npm'
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      case 'pip':
        // prefix更新为 `'pip'`，确保插件工具后续读取最新状态。
        prefix = 'pip'
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      case 'github':
        // prefix更新为 `'github'`，确保插件工具后续读取最新状态。
        prefix = 'github'
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      case 'url':
        // prefix更新为 `'git'`，确保插件工具后续读取最新状态。
        prefix = 'git'
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      case 'git-subdir':
        // prefix更新为 `'subdir'`，确保插件工具后续读取最新状态。
        prefix = 'subdir'
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      default:
        // prefix更新为 `'unknown'`，确保插件工具后续读取最新状态。
        prefix = 'unknown'
    }
  }

  // 返回 ``temp_${prefix}_${timestamp}_${random}``，作为插件管理这次计算的结果。
  return `temp_${prefix}_${timestamp}_${random}`
}

/**
 * Cache a plugin from an external source
 */
// cachePlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cachePlugin(
  source: PluginSource,
  options?: {
    manifest?: PluginManifest
  },
): Promise<{ path: string; manifest: PluginManifest; gitCommitSha?: string }> {
  // cachePath 路径数据读取`getPluginCachePath`，供插件管理后续处理使用。
  const cachePath = getPluginCachePath()

  // 等待 `getFsImplementation().mkdir(cachePath)` 完成，再继续插件工具 plugin Loader的异步流程。
  await getFsImplementation().mkdir(cachePath)

  // tempName保存`generateTemporaryCacheNameForPlugin`，供插件管理后续处理使用。
  const tempName = generateTemporaryCacheNameForPlugin(source)
  // tempPath 路径数据格式化`join`，供插件管理后续处理使用。
  const tempPath = join(cachePath, tempName)

  // shouldCleanup标记插件工具 plugin Loader是否启用对应路径。
  let shouldCleanup = false
  // gitCommitSha 先占位，稍后的条件分支会根据实际输入补齐它。
  let gitCommitSha: string | undefined

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Caching plugin from source: ${jsonStringify(source)} to temporary path ${tempPath}`,
    )

    // shouldCleanup更新为 `true`，确保插件工具后续读取最新状态。
    shouldCleanup = true

    // 当 `typeof source` 匹配 `'string'` 时，插件管理执行对应分支。
    if (typeof source === 'string') {
      // 等待 `installFromLocal(source, tempPath)` 完成，再继续插件工具 plugin Loader的异步流程。
      await installFromLocal(source, tempPath)
    } else {
      // 按照 source.source 的取值选择插件管理的具体处理分支。
      switch (source.source) {
        case 'npm':
          // 等待 `installFromNpm(source.package, tempPath, {` 完成，再继续插件工具 plugin Loader的异步流程。
          await installFromNpm(source.package, tempPath, {
            registry: source.registry,
            version: source.version,
          })
          // 结束这个分支或循环，避免插件管理继续落入后续路径。
          break
        case 'github':
          // 等待 `installFromGitHub(source.repo, tempPath, source.ref, source.sha)` 完成，再继续插件工具 plugin Loader的异步流程。
          await installFromGitHub(source.repo, tempPath, source.ref, source.sha)
          // 结束这个分支或循环，避免插件管理继续落入后续路径。
          break
        case 'url':
          // 等待 `installFromGit(source.url, tempPath, source.ref, source.sha)` 完成，再继续插件工具 plugin Loader的异步流程。
          await installFromGit(source.url, tempPath, source.ref, source.sha)
          // 结束这个分支或循环，避免插件管理继续落入后续路径。
          break
        case 'git-subdir':
          // gitCommitSha更新为 `await installFromGitSubdir(`，确保插件工具后续读取最新状态。
          gitCommitSha = await installFromGitSubdir(
            source.url,
            tempPath,
            source.path,
            source.ref,
            source.sha,
          )
          // 结束这个分支或循环，避免插件管理继续落入后续路径。
          break
        case 'pip':
          // 抛出 new Error('Python package plugins are not yet supported')，阻止插件管理在无效状态下继续运行。
          throw new Error('Python package plugins are not yet supported')
        default:
          // 抛出 new Error(`Unsupported plugin source type`)，阻止插件管理在无效状态下继续运行。
          throw new Error(`Unsupported plugin source type`)
      }
    }
  } catch (error) {
    // 只有 `shouldCleanup && (await pathExists(tempPath))` 满足时，插件管理才执行该分支。
    if (shouldCleanup && (await pathExists(tempPath))) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Cleaning up failed installation at ${tempPath}`)
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `rm(tempPath, { recursive: true, force: true })` 完成，再继续插件工具 plugin Loader的异步流程。
        await rm(tempPath, { recursive: true, force: true })
      } catch (cleanupError) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to clean up installation: ${cleanupError}`, {
          level: 'error',
        })
      }
    }
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }

  // manifestPath 路径数据格式化`join`，供插件管理后续处理使用。
  const manifestPath = join(tempPath, '.claude-plugin', 'plugin.json')
  // legacyManifestPath 路径数据格式化`join`，供插件管理后续处理使用。
  const legacyManifestPath = join(tempPath, 'plugin.json')
  // manifest 先占位，稍后的条件分支会根据实际输入补齐它。
  let manifest: PluginManifest

  // 满足 `await pathExists(manifestPath)` 时，插件管理执行该分支。
  if (await pathExists(manifestPath)) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容读取`readFile`，供插件管理后续处理使用。
      const content = await readFile(manifestPath, { encoding: 'utf-8' })
      // 解析结果解析`jsonParse`，供插件管理后续处理使用。
      const parsed = jsonParse(content)
      // 结果保存`PluginManifestSchema`，供插件管理后续处理使用。
      const result = PluginManifestSchema().safeParse(parsed)

      // 满足 `result.success` 时，插件管理执行该分支。
      if (result.success) {
        // manifest更新为 `result.data`，确保插件工具后续读取最新状态。
        manifest = result.data
      } else {
        // Manifest exists but is invalid - throw error
        // 错误列表保存`result.error.issues`，供插件工具 plugin Loader后续判断或输出使用。
        const errors = result.error.issues
          // 链式调用 map，继续加工上一行在插件管理中产生的数据。
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ')

        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Invalid manifest at ${manifestPath}: ${errors}`, {
          level: 'error',
        })

        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Plugin has an invalid manifest file at ${manifestPath}. Validation errors: ${errors}`,
        )
      }
    } catch (error) {
      // Check if this is a validation error we just threw
      // 插件管理在这里按实际状态进入对应分支。
      if (
        error instanceof Error &&
        error.message.includes('invalid manifest file')
      ) {
        // 抛出 error，阻止插件管理在无效状态下继续运行。
        throw error
      }

      // JSON parse error
      // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
      const errorMsg = errorMessage(error)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to parse manifest at ${manifestPath}: ${errorMsg}`,
        {
          level: 'error',
        },
      )

      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Plugin has a corrupt manifest file at ${manifestPath}. JSON parse error: ${errorMsg}`,
      )
    }
  // 插件工具 plugin Loader在这里处理 `} else if (await pathExists(legacyManifestPath)) {`，完成这一小步状态转换。
  } else if (await pathExists(legacyManifestPath)) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容读取`readFile`，供插件管理后续处理使用。
      const content = await readFile(legacyManifestPath, {
        encoding: 'utf-8',
      })
      // 解析结果解析`jsonParse`，供插件管理后续处理使用。
      const parsed = jsonParse(content)
      // 结果保存`PluginManifestSchema`，供插件管理后续处理使用。
      const result = PluginManifestSchema().safeParse(parsed)

      // 满足 `result.success` 时，插件管理执行该分支。
      if (result.success) {
        // manifest更新为 `result.data`，确保插件工具后续读取最新状态。
        manifest = result.data
      } else {
        // Manifest exists but is invalid - throw error
        // 错误列表保存`result.error.issues`，供插件工具 plugin Loader后续判断或输出使用。
        const errors = result.error.issues
          // 链式调用 map，继续加工上一行在插件管理中产生的数据。
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ')

        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Invalid legacy manifest at ${legacyManifestPath}: ${errors}`,
          { level: 'error' },
        )

        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Plugin has an invalid manifest file at ${legacyManifestPath}. Validation errors: ${errors}`,
        )
      }
    } catch (error) {
      // Check if this is a validation error we just threw
      // 插件管理在这里按实际状态进入对应分支。
      if (
        error instanceof Error &&
        error.message.includes('invalid manifest file')
      ) {
        // 抛出 error，阻止插件管理在无效状态下继续运行。
        throw error
      }

      // JSON parse error
      // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
      const errorMsg = errorMessage(error)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to parse legacy manifest at ${legacyManifestPath}: ${errorMsg}`,
        {
          level: 'error',
        },
      )

      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Plugin has a corrupt manifest file at ${legacyManifestPath}. JSON parse error: ${errorMsg}`,
      )
    }
  } else {
    // manifest更新为 `options?.manifest || {`，确保插件工具后续读取最新状态。
    manifest = options?.manifest || {
      name: tempName,
      description: `Plugin cached from ${typeof source === 'string' ? source : source.source}`,
    }
  }

  // finalName格式化`name.replace`，供插件管理后续处理使用。
  const finalName = manifest.name.replace(/[^a-zA-Z0-9-_]/g, '-')
  // finalPath 路径数据格式化`join`，供插件管理后续处理使用。
  const finalPath = join(cachePath, finalName)

  // 满足 `await pathExists(finalPath)` 时，插件管理执行该分支。
  if (await pathExists(finalPath)) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Removing old cached version at ${finalPath}`)
    // 等待 `rm(finalPath, { recursive: true, force: true })` 完成，再继续插件工具 plugin Loader的异步流程。
    await rm(finalPath, { recursive: true, force: true })
  }

  // 等待 `rename(tempPath, finalPath)` 完成，再继续插件工具 plugin Loader的异步流程。
  await rename(tempPath, finalPath)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Successfully cached plugin ${manifest.name} to ${finalPath}`)

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    path: finalPath,
    manifest,
    ...(gitCommitSha && { gitCommitSha }),
  }
}

/**
 * Loads and validates a plugin manifest from a JSON file.
 *
 * The manifest provides metadata about the plugin including name, version,
 * description, author, and other optional fields. If no manifest exists,
 * a minimal one is created to allow the plugin to function.
 *
 * Example plugin.json:
 * ```json
 * {
 *   "name": "code-assistant",
 *   "version": "1.2.0",
 *   "description": "AI-powered code assistance tools",
 *   "author": {
 *     "name": "John Doe",
 *     "email": "john@example.com"
 *   },
 *   "keywords": ["coding", "ai", "assistant"],
 *   "homepage": "https://example.com/code-assistant",
 *   "hooks": "./custom-hooks.json",
 *   "commands": ["./extra-commands/*.md"]
 * }
 * ```
 */

/**
 * Loads and validates a plugin manifest from a JSON file.
 *
 * The manifest provides metadata about the plugin including name, version,
 * description, author, and other optional fields. If no manifest exists,
 * a minimal one is created to allow the plugin to function.
 *
 * Unknown keys in the manifest are silently stripped (PluginManifestSchema
 * uses zod's default strip behavior, not .strict()). Type mismatches and
 * other validation errors still fail.
 *
 * Behavior:
 * - Missing file: Creates default with provided name and source
 * - Invalid JSON: Throws error with parse details
 * - Schema validation failure: Throws error with validation details
 *
 * @param manifestPath - Full path to the plugin.json file
 * @param pluginName - Name to use in default manifest (e.g., "my-plugin")
 * @param source - Source description for default manifest (e.g., "git:repo" or ".claude-plugin/name")
 * @returns A valid PluginManifest object (either loaded or default)
 * @throws Error if manifest exists but is invalid (corrupt JSON or schema validation failure)
 */
// loadPluginManifest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadPluginManifest(
  manifestPath: string,
  pluginName: string,
  source: string,
): Promise<PluginManifest> {
  // Check if manifest file exists
  // If not, create a minimal manifest to allow plugin to function
  // 满足 `!(await pathExists(manifestPath))` 时，插件管理执行该分支。
  if (!(await pathExists(manifestPath))) {
    // Return default manifest with provided name and source
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      name: pluginName,
      description: `Plugin from ${source}`,
    }
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Read and parse the manifest JSON file
    // 文本内容读取`readFile`，供插件管理后续处理使用。
    const content = await readFile(manifestPath, { encoding: 'utf-8' })
    // parsedJson解析`jsonParse`，供插件管理后续处理使用。
    const parsedJson = jsonParse(content)

    // Validate against the PluginManifest schema
    // 结果保存`PluginManifestSchema`，供插件管理后续处理使用。
    const result = PluginManifestSchema().safeParse(parsedJson)

    // 满足 `result.success` 时，插件管理执行该分支。
    if (result.success) {
      // Valid manifest - return the validated data
      // 返回 `result.data`，作为插件管理这次计算的结果。
      return result.data
    }

    // Schema validation failed but JSON was valid
    // 错误列表保存`result.error.issues`，供插件工具 plugin Loader后续判断或输出使用。
    const errors = result.error.issues
      // 链式调用 map，继续加工上一行在插件管理中产生的数据。
      .map(err =>
        err.path.length > 0
          ? `${err.path.join('.')}: ${err.message}`
          : err.message,
      )
      .join(', ')

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Plugin ${pluginName} has an invalid manifest file at ${manifestPath}. Validation errors: ${errors}`,
      { level: 'error' },
    )

    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Plugin ${pluginName} has an invalid manifest file at ${manifestPath}.\n\nValidation errors: ${errors}`,
    )
  } catch (error) {
    // Check if this is the error we just threw (validation error)
    // 插件管理在这里按实际状态进入对应分支。
    if (
      error instanceof Error &&
      error.message.includes('invalid manifest file')
    ) {
      // 抛出 error，阻止插件管理在无效状态下继续运行。
      throw error
    }

    // JSON parsing failed or file read error
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Plugin ${pluginName} has a corrupt manifest file at ${manifestPath}. Parse error: ${errorMsg}`,
      { level: 'error' },
    )

    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Plugin ${pluginName} has a corrupt manifest file at ${manifestPath}.\n\nJSON parse error: ${errorMsg}`,
    )
  }
}

/**
 * Loads and validates plugin hooks configuration from a JSON file.
 * IMPORTANT: Only call this when the hooks file is expected to exist.
 *
 * @param hooksConfigPath - Full path to the hooks.json file
 * @param pluginName - Plugin name for error messages
 * @returns Validated HooksSettings
 * @throws Error if file doesn't exist or is invalid
 */
// loadPluginHooks 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadPluginHooks(
  hooksConfigPath: string,
  pluginName: string,
): Promise<HooksSettings> {
  // 满足 `!(await pathExists(hooksConfigPath))` 时，插件管理执行该分支。
  if (!(await pathExists(hooksConfigPath))) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Hooks file not found at ${hooksConfigPath} for plugin ${pluginName}. If the manifest declares hooks, the file must exist.`,
    )
  }

  // 文本内容读取`readFile`，供插件管理后续处理使用。
  const content = await readFile(hooksConfigPath, { encoding: 'utf-8' })
  // rawHooksConfig 配置解析`jsonParse`，供插件管理后续处理使用。
  const rawHooksConfig = jsonParse(content)

  // The hooks.json file has a wrapper structure with description and hooks
  // Use PluginHooksSchema to validate and extract the hooks property
  // validatedPluginHooks 插件数据保存`PluginHooksSchema`，供插件管理后续处理使用。
  const validatedPluginHooks = PluginHooksSchema().parse(rawHooksConfig)

  // 返回 `validatedPluginHooks.hooks as HooksSettings`，作为插件管理这次计算的结果。
  return validatedPluginHooks.hooks as HooksSettings
}

/**
 * Validate a list of plugin component relative paths by checking existence in parallel.
 *
 * This helper parallelizes the pathExists checks (the expensive async part) while
 * preserving deterministic error/log ordering by iterating results sequentially.
 *
 * Introduced to fix a perf regression from the sync→async fs migration: sequential
 * `for { await pathExists }` loops add ~1-5ms of event-loop overhead per iteration.
 * With many plugins × several component types, this compounds to hundreds of ms.
 *
 * @param relPaths - Relative paths from the manifest/marketplace entry to validate
 * @param pluginPath - Plugin root directory to resolve relative paths against
 * @param pluginName - Plugin name for error messages
 * @param source - Source identifier for PluginError records
 * @param component - Which component these paths belong to (for error records)
 * @param componentLabel - Human-readable label for log messages (e.g. "Agent", "Skill")
 * @param contextLabel - Where the path came from, for log messages
 *   (e.g. "specified in manifest but", "from marketplace entry")
 * @param errors - Error array to push path-not-found errors into (mutated)
 * @returns Array of full paths that exist on disk, in original order
 */
// validatePluginPaths 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function validatePluginPaths(
  relPaths: string[],
  pluginPath: string,
  pluginName: string,
  source: string,
  component: PluginComponent,
  componentLabel: string,
  contextLabel: string,
  errors: PluginError[],
): Promise<string[]> {
  // Parallelize the async pathExists checks
  // checks 集合保存`Promise.all`，供插件管理后续处理使用。
  const checks = await Promise.all(
    // 调用 relPaths.map，触发插件管理此处需要的副作用。
    relPaths.map(async relPath => {
      // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
      const fullPath = join(pluginPath, relPath)
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { relPath, fullPath, exists: await pathExists(fullPath) }
    }),
  )
  // Process results in original order to keep error/log ordering deterministic
  // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const validPaths: string[] = []
  // 循环处理 `const { relPath, fullPath, exists } of checks`，让插件管理逐项把同类条目按顺序走完。
  for (const { relPath, fullPath, exists } of checks) {
    // 满足 `exists` 时，插件管理执行该分支。
    if (exists) {
      // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
      validPaths.push(fullPath)
    } else {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `${componentLabel} path ${relPath} ${contextLabel} not found at ${fullPath} for ${pluginName}`,
        { level: 'warn' },
      )
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Plugin component file not found: ${fullPath} for ${pluginName}`,
        ),
      )
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'path-not-found',
        source,
        plugin: pluginName,
        path: fullPath,
        component,
      })
    }
  }
  // 返回 `validPaths`，作为插件管理这次计算的结果。
  return validPaths
}

/**
 * Creates a LoadedPlugin object from a plugin directory path.
 *
 * This is the central function that assembles a complete plugin representation
 * by scanning the plugin directory structure and loading all components.
 * It handles both fully-featured plugins with manifests and minimal plugins
 * with just commands or agents directories.
 *
 * Directory structure it looks for:
 * ```
 * plugin-directory/
 * ├── plugin.json          # Optional: Plugin manifest
 * ├── commands/            # Optional: Custom slash commands
 * │   ├── build.md         # /build command
 * │   └── test.md          # /test command
 * ├── agents/              # Optional: Custom AI agents
 * │   ├── reviewer.md      # Code review agent
 * │   └── optimizer.md     # Performance optimization agent
 * └── hooks/               # Optional: Hook configurations
 *     └── hooks.json       # Hook definitions
 * ```
 *
 * Component detection:
 * - Manifest: Loaded from plugin.json if present, otherwise creates default
 * - Commands: Sets commandsPath if commands/ directory exists
 * - Agents: Sets agentsPath if agents/ directory exists
 * - Hooks: Loads from hooks/hooks.json if present
 *
 * The function is tolerant of missing components - a plugin can have
 * any combination of the above directories/files. Missing component files
 * are reported as errors but don't prevent plugin loading.
 *
 * @param pluginPath - Absolute path to the plugin directory
 * @param source - Source identifier (e.g., "git:repo", ".claude-plugin/my-plugin")
 * @param enabled - Initial enabled state (may be overridden by settings)
 * @param fallbackName - Name to use if manifest doesn't specify one
 * @param strict - When true, adds errors for duplicate hook files (default: true)
 * @returns Object containing the LoadedPlugin and any errors encountered
 */
// createPluginFromPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createPluginFromPath(
  pluginPath: string,
  source: string,
  enabled: boolean,
  fallbackName: string,
  strict = true,
): Promise<{ plugin: LoadedPlugin; errors: PluginError[] }> {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: PluginError[] = []

  // Step 1: Load or create the plugin manifest
  // This provides metadata about the plugin (name, version, etc.)
  // manifestPath 路径数据格式化`join`，供插件管理后续处理使用。
  const manifestPath = join(pluginPath, '.claude-plugin', 'plugin.json')
  // manifest读取`loadPluginManifest`，供插件管理后续处理使用。
  const manifest = await loadPluginManifest(manifestPath, fallbackName, source)

  // Step 2: Create the base plugin object
  // Start with required fields from manifest and parameters
  // plugin 插件数据 集中保存插件工具 plugin Loader要一起传递的字段。
  const plugin: LoadedPlugin = {
    name: manifest.name, // Use name from manifest (or fallback)
    manifest, // Store full manifest for later use
    path: pluginPath, // Absolute path to plugin directory
    source, // Source identifier (e.g., "git:repo" or ".claude-plugin/name")
    repository: source, // For backward compatibility with Plugin Repository
    enabled, // Current enabled state
  }

  // Step 3: Auto-detect optional directories in parallel
  // 插件工具 plugin Loader先整理这一处局部数据，后续分支可以直接读取。
  const [
    commandsDirExists,
    agentsDirExists,
    skillsDirExists,
    outputStylesDirExists,
  ] = await Promise.all([
    !manifest.commands ? pathExists(join(pluginPath, 'commands')) : false,
    !manifest.agents ? pathExists(join(pluginPath, 'agents')) : false,
    !manifest.skills ? pathExists(join(pluginPath, 'skills')) : false,
    !manifest.outputStyles
      ? pathExists(join(pluginPath, 'output-styles'))
      : false,
  ])

  // commandsPath 命令数据格式化`join`，供插件管理后续处理使用。
  const commandsPath = join(pluginPath, 'commands')
  // 满足 `commandsDirExists` 时，插件管理执行该分支。
  if (commandsDirExists) {
    // commandsPath 命令数据更新为 `commandsPath`，确保插件工具后续读取最新状态。
    plugin.commandsPath = commandsPath
  }

  // Step 3a: Process additional command paths from manifest
  // 满足 `manifest.commands` 时，插件管理执行该分支。
  if (manifest.commands) {
    // Check if it's an object mapping (record of command name → metadata)
    // firstValue派生`Object.values`，供插件管理后续处理使用。
    const firstValue = Object.values(manifest.commands)[0]
    // 插件管理在这里按实际状态进入对应分支。
    if (
      typeof manifest.commands === 'object' &&
      !Array.isArray(manifest.commands) &&
      firstValue &&
      typeof firstValue === 'object' &&
      ('source' in firstValue || 'content' in firstValue)
    ) {
      // Object mapping format: { "about": { "source": "./README.md", ... } }
      // commandsMetadata 命令数据 从空对象开始收集键值，后续按名称补齐内容。
      const commandsMetadata: Record<string, CommandMetadata> = {}
      // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const validPaths: string[] = []

      // Parallelize pathExists checks; process results in order to keep
      // error/log ordering deterministic.
      // entries 集合派生`Object.entries`，供插件管理后续处理使用。
      const entries = Object.entries(manifest.commands)
      // checks 集合保存`Promise.all`，供插件管理后续处理使用。
      const checks = await Promise.all(
        // 调用 entries.map，触发插件管理此处需要的副作用。
        entries.map(async ([commandName, metadata]) => {
          // `!metadata || typeof metadata` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
          if (!metadata || typeof metadata !== 'object') {
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return { commandName, metadata, kind: 'skip' as const }
          }
          // 满足 `metadata.source` 时，插件管理执行该分支。
          if (metadata.source) {
            // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
            const fullPath = join(pluginPath, metadata.source)
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return {
              commandName,
              metadata,
              kind: 'source' as const,
              fullPath,
              exists: await pathExists(fullPath),
            }
          }
          // 满足 `metadata.content` 时，插件管理执行该分支。
          if (metadata.content) {
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return { commandName, metadata, kind: 'content' as const }
          }
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return { commandName, metadata, kind: 'skip' as const }
        }),
      )
      // 按顺序遍历 `checks` 中的check，逐个交给插件管理处理。
      for (const check of checks) {
        // 当 `check.kind` 匹配 `'skip'` 时，插件管理执行对应分支。
        if (check.kind === 'skip') continue
        // 当 `check.kind` 匹配 `'content'` 时，插件管理执行对应分支。
        if (check.kind === 'content') {
          // For inline content commands, add metadata without path
          // commandName 命令数据更新为 `check.metadata`，确保插件工具 plugin Loader后续读取最新状态。
          commandsMetadata[check.commandName] = check.metadata
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }
        // kind === 'source'
        // 满足 `check.exists` 时，插件管理执行该分支。
        if (check.exists) {
          // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
          validPaths.push(check.fullPath)
          // commandName 命令数据更新为 `check.metadata`，确保插件工具 plugin Loader后续读取最新状态。
          commandsMetadata[check.commandName] = check.metadata
        } else {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Command ${check.commandName} path ${check.metadata.source} specified in manifest but not found at ${check.fullPath} for ${manifest.name}`,
            { level: 'warn' },
          )
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error(
              `Plugin component file not found: ${check.fullPath} for ${manifest.name}`,
            ),
          )
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'path-not-found',
            source,
            plugin: manifest.name,
            path: check.fullPath,
            component: 'commands',
          })
        }
      }

      // Set commandsPaths if there are file-based commands
      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // commandsPaths 命令数据更新为 `validPaths`，确保插件工具后续读取最新状态。
        plugin.commandsPaths = validPaths
      }
      // Set commandsMetadata if there are any commands (file-based or inline)
      // 满足 `Object.keys(commandsMetadata).length > 0` 时，插件管理执行该分支。
      if (Object.keys(commandsMetadata).length > 0) {
        // commandsMetadata 命令数据更新为 `commandsMetadata`，确保插件工具后续读取最新状态。
        plugin.commandsMetadata = commandsMetadata
      }
    } else {
      // Path or array of paths format
      // commandPaths 命令数据保存`Array.isArray`，供插件管理后续处理使用。
      const commandPaths = Array.isArray(manifest.commands)
        ? manifest.commands
        : [manifest.commands]

      // Parallelize pathExists checks; process results in order.
      // checks 集合保存`Promise.all`，供插件管理后续处理使用。
      const checks = await Promise.all(
        // 调用 commandPaths.map，触发插件管理此处需要的副作用。
        commandPaths.map(async cmdPath => {
          // `typeof cmdPath` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
          if (typeof cmdPath !== 'string') {
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return { cmdPath, kind: 'invalid' as const }
          }
          // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
          const fullPath = join(pluginPath, cmdPath)
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return {
            cmdPath,
            kind: 'path' as const,
            fullPath,
            exists: await pathExists(fullPath),
          }
        }),
      )
      // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const validPaths: string[] = []
      // 按顺序遍历 `checks` 中的check，逐个交给插件管理处理。
      for (const check of checks) {
        // 当 `check.kind` 匹配 `'invalid'` 时，插件管理执行对应分支。
        if (check.kind === 'invalid') {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Unexpected command format in manifest for ${manifest.name}`,
            { level: 'error' },
          )
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }
        // 满足 `check.exists` 时，插件管理执行该分支。
        if (check.exists) {
          // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
          validPaths.push(check.fullPath)
        } else {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Command path ${check.cmdPath} specified in manifest but not found at ${check.fullPath} for ${manifest.name}`,
            { level: 'warn' },
          )
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error(
              `Plugin component file not found: ${check.fullPath} for ${manifest.name}`,
            ),
          )
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'path-not-found',
            source,
            plugin: manifest.name,
            path: check.fullPath,
            component: 'commands',
          })
        }
      }

      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // commandsPaths 命令数据更新为 `validPaths`，确保插件工具后续读取最新状态。
        plugin.commandsPaths = validPaths
      }
    }
  }

  // Step 4: Register agents directory if detected
  // agentsPath 路径数据格式化`join`，供插件管理后续处理使用。
  const agentsPath = join(pluginPath, 'agents')
  // 满足 `agentsDirExists` 时，插件管理执行该分支。
  if (agentsDirExists) {
    // agentsPath 路径数据更新为 `agentsPath`，确保插件工具后续读取最新状态。
    plugin.agentsPath = agentsPath
  }

  // Step 4a: Process additional agent paths from manifest
  // 满足 `manifest.agents` 时，插件管理执行该分支。
  if (manifest.agents) {
    // agentPaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
    const agentPaths = Array.isArray(manifest.agents)
      ? manifest.agents
      : [manifest.agents]

    // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
    const validPaths = await validatePluginPaths(
      agentPaths,
      pluginPath,
      manifest.name,
      source,
      'agents',
      'Agent',
      'specified in manifest but',
      errors,
    )

    // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
    if (validPaths.length > 0) {
      // agentsPaths 路径数据更新为 `validPaths`，确保插件工具后续读取最新状态。
      plugin.agentsPaths = validPaths
    }
  }

  // Step 4b: Register skills directory if detected
  // skillsPath 路径数据格式化`join`，供插件管理后续处理使用。
  const skillsPath = join(pluginPath, 'skills')
  // 满足 `skillsDirExists` 时，插件管理执行该分支。
  if (skillsDirExists) {
    // skillsPath 路径数据更新为 `skillsPath`，确保插件工具后续读取最新状态。
    plugin.skillsPath = skillsPath
  }

  // Step 4c: Process additional skill paths from manifest
  // 满足 `manifest.skills` 时，插件管理执行该分支。
  if (manifest.skills) {
    // skillPaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
    const skillPaths = Array.isArray(manifest.skills)
      ? manifest.skills
      : [manifest.skills]

    // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
    const validPaths = await validatePluginPaths(
      skillPaths,
      pluginPath,
      manifest.name,
      source,
      'skills',
      'Skill',
      'specified in manifest but',
      errors,
    )

    // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
    if (validPaths.length > 0) {
      // skillsPaths 路径数据更新为 `validPaths`，确保插件工具后续读取最新状态。
      plugin.skillsPaths = validPaths
    }
  }

  // Step 4d: Register output-styles directory if detected
  // outputStylesPath 路径数据格式化`join`，供插件管理后续处理使用。
  const outputStylesPath = join(pluginPath, 'output-styles')
  // 满足 `outputStylesDirExists` 时，插件管理执行该分支。
  if (outputStylesDirExists) {
    // outputStylesPath 路径数据更新为 `outputStylesPath`，确保插件工具后续读取最新状态。
    plugin.outputStylesPath = outputStylesPath
  }

  // Step 4e: Process additional output style paths from manifest
  // 满足 `manifest.outputStyles` 时，插件管理执行该分支。
  if (manifest.outputStyles) {
    // outputStylePaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
    const outputStylePaths = Array.isArray(manifest.outputStyles)
      ? manifest.outputStyles
      : [manifest.outputStyles]

    // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
    const validPaths = await validatePluginPaths(
      outputStylePaths,
      pluginPath,
      manifest.name,
      source,
      'output-styles',
      'Output style',
      'specified in manifest but',
      errors,
    )

    // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
    if (validPaths.length > 0) {
      // outputStylesPaths 路径数据更新为 `validPaths`，确保插件工具后续读取最新状态。
      plugin.outputStylesPaths = validPaths
    }
  }

  // Step 5: Load hooks configuration
  // mergedHooks 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let mergedHooks: HooksSettings | undefined
  // loadedHookPaths 路径数据 命名 `new Set<string>() // Track loaded hook files`，让后续代码直接表达这个值的用途。
  const loadedHookPaths = new Set<string>() // Track loaded hook files

  // Load from standard hooks/hooks.json if it exists
  // standardHooksPath 路径数据格式化`join`，供插件管理后续处理使用。
  const standardHooksPath = join(pluginPath, 'hooks', 'hooks.json')
  // 满足 `await pathExists(standardHooksPath)` 时，插件管理执行该分支。
  if (await pathExists(standardHooksPath)) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // mergedHooks 集合更新为 `await loadPluginHooks(standardHooksPath, manifest.name)`，确保插件工具后续读取最新状态。
      mergedHooks = await loadPluginHooks(standardHooksPath, manifest.name)
      // Track the normalized path to prevent duplicate loading
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 调用 loadedHookPaths.add，触发插件管理此处需要的副作用。
        loadedHookPaths.add(await realpath(standardHooksPath))
      } catch {
        // If realpathSync fails, use original path
        // 调用 loadedHookPaths.add，触发插件管理此处需要的副作用。
        loadedHookPaths.add(standardHooksPath)
      }
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Loaded hooks from standard location for plugin ${manifest.name}: ${standardHooksPath}`,
      )
    } catch (error) {
      // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
      const errorMsg = errorMessage(error)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to load hooks for ${manifest.name}: ${errorMsg}`,
        {
          level: 'error',
        },
      )
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'hook-load-failed',
        source,
        plugin: manifest.name,
        hookPath: standardHooksPath,
        reason: errorMsg,
      })
    }
  }

  // Load and merge hooks from manifest.hooks if specified
  // 满足 `manifest.hooks` 时，插件管理执行该分支。
  if (manifest.hooks) {
    // manifestHooksArray保存`Array.isArray`，供插件管理后续处理使用。
    const manifestHooksArray = Array.isArray(manifest.hooks)
      ? manifest.hooks
      : [manifest.hooks]

    // 按顺序遍历 `manifestHooksArray` 中的hookSpec，逐个交给插件管理处理。
    for (const hookSpec of manifestHooksArray) {
      // 当 `typeof hookSpec` 匹配 `'string'` 时，插件管理执行对应分支。
      if (typeof hookSpec === 'string') {
        // Path to additional hooks file
        // hookFilePath 路径数据格式化`join`，供插件管理后续处理使用。
        const hookFilePath = join(pluginPath, hookSpec)
        // 满足 `!(await pathExists(hookFilePath))` 时，插件管理执行该分支。
        if (!(await pathExists(hookFilePath))) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hooks file ${hookSpec} specified in manifest but not found at ${hookFilePath} for ${manifest.name}`,
            { level: 'error' },
          )
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error(
              `Plugin component file not found: ${hookFilePath} for ${manifest.name}`,
            ),
          )
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'path-not-found',
            source,
            plugin: manifest.name,
            path: hookFilePath,
            component: 'hooks',
          })
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }

        // Check if this path resolves to an already-loaded hooks file
        // normalizedPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
        let normalizedPath: string
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // normalizedPath 路径数据更新为 `await realpath(hookFilePath)`，确保插件工具后续读取最新状态。
          normalizedPath = await realpath(hookFilePath)
        } catch {
          // If realpathSync fails, use original path
          // normalizedPath 路径数据更新为 `hookFilePath`，确保插件工具后续读取最新状态。
          normalizedPath = hookFilePath
        }

        // 满足 `loadedHookPaths.has(normalizedPath)` 时，插件管理执行该分支。
        if (loadedHookPaths.has(normalizedPath)) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Skipping duplicate hooks file for plugin ${manifest.name}: ${hookSpec} ` +
              `(resolves to already-loaded file: ${normalizedPath})`,
          )
          // 满足 `strict` 时，插件管理执行该分支。
          if (strict) {
            // errorMsg 错误信息 命名 ``Duplicate hooks file detected: ${hookSpec} resolves to a...`，让后续代码直接表达这个值的用途。
            const errorMsg = `Duplicate hooks file detected: ${hookSpec} resolves to already-loaded file ${normalizedPath}. The standard hooks/hooks.json is loaded automatically, so manifest.hooks should only reference additional hook files.`
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(new Error(errorMsg))
            // 错误列表追加新条目，保持收集顺序与输入顺序一致。
            errors.push({
              type: 'hook-load-failed',
              source,
              plugin: manifest.name,
              hookPath: hookFilePath,
              reason: errorMsg,
            })
          }
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }

        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // additionalHooks 集合读取`loadPluginHooks`，供插件管理后续处理使用。
          const additionalHooks = await loadPluginHooks(
            hookFilePath,
            manifest.name,
          )
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // mergedHooks 集合更新为 `mergeHooksSettings(mergedHooks, additionalHooks)`，确保插件工具后续读取最新状态。
            mergedHooks = mergeHooksSettings(mergedHooks, additionalHooks)
            // 调用 loadedHookPaths.add，触发插件管理此处需要的副作用。
            loadedHookPaths.add(normalizedPath)
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Loaded and merged hooks from manifest for plugin ${manifest.name}: ${hookSpec}`,
            )
          } catch (mergeError) {
            // mergeErrorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
            const mergeErrorMsg = errorMessage(mergeError)
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to merge hooks from ${hookSpec} for ${manifest.name}: ${mergeErrorMsg}`,
              { level: 'error' },
            )
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(toError(mergeError))
            // 错误列表追加新条目，保持收集顺序与输入顺序一致。
            errors.push({
              type: 'hook-load-failed',
              source,
              plugin: manifest.name,
              hookPath: hookFilePath,
              reason: `Failed to merge: ${mergeErrorMsg}`,
            })
          }
        } catch (error) {
          // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
          const errorMsg = errorMessage(error)
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Failed to load hooks from ${hookSpec} for ${manifest.name}: ${errorMsg}`,
            { level: 'error' },
          )
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logError(toError(error))
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'hook-load-failed',
            source,
            plugin: manifest.name,
            hookPath: hookFilePath,
            reason: errorMsg,
          })
        }
      // 插件工具 plugin Loader在这里处理 `} else if (typeof hookSpec === 'object') {`，完成这一小步状态转换。
      } else if (typeof hookSpec === 'object') {
        // Inline hooks
        // mergedHooks 集合更新为 `mergeHooksSettings(mergedHooks, hookSpec as HooksSettings)`，确保插件工具后续读取最新状态。
        mergedHooks = mergeHooksSettings(mergedHooks, hookSpec as HooksSettings)
      }
    }
  }

  // 满足 `mergedHooks` 时，插件管理执行该分支。
  if (mergedHooks) {
    // hooksConfig 配置更新为 `mergedHooks`，确保插件工具后续读取最新状态。
    plugin.hooksConfig = mergedHooks
  }

  // Step 6: Load plugin settings
  // Settings can come from settings.json in the plugin directory or from manifest.settings
  // Only allowlisted keys are kept (currently: agent)
  // pluginSettings 插件数据读取`loadPluginSettings`，供插件管理后续处理使用。
  const pluginSettings = await loadPluginSettings(pluginPath, manifest)
  // 满足 `pluginSettings` 时，插件管理执行该分支。
  if (pluginSettings) {
    // settings 集合更新为 `pluginSettings`，确保插件工具后续读取最新状态。
    plugin.settings = pluginSettings
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { plugin, errors }
}

/**
 * Schema derived from SettingsSchema that only keeps keys plugins are allowed to set.
 * Uses .strip() so unknown keys are silently removed during parsing.
 */
// PluginSettingsSchema 插件数据保存`lazySchema`，供插件管理后续处理使用。
const PluginSettingsSchema = lazySchema(() =>
  SettingsSchema()
    .pick({
      agent: true,
    })
    .strip(),
)

/**
 * Parse raw settings through PluginSettingsSchema, returning only allowlisted keys.
 * Returns undefined if parsing fails or all keys are filtered out.
 */
// parsePluginSettings 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parsePluginSettings(
  raw: Record<string, unknown>,
): Record<string, unknown> | undefined {
  // 结果保存`PluginSettingsSchema`，供插件管理后续处理使用。
  const result = PluginSettingsSchema().safeParse(raw)
  // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!result.success) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }
  // data 命名 `result.data`，让后续代码直接表达这个值的用途。
  const data = result.data
  // Object.keys(data)为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (Object.keys(data).length === 0) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }
  // 返回 `data`，作为插件管理这次计算的结果。
  return data
}

/**
 * Load plugin settings from settings.json file or manifest.settings.
 * settings.json takes priority over manifest.settings when both exist.
 * Only allowlisted keys are included in the result.
 */
// loadPluginSettings 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadPluginSettings(
  pluginPath: string,
  manifest: PluginManifest,
): Promise<Record<string, unknown> | undefined> {
  // Try loading settings.json from the plugin directory
  // settingsJsonPath 路径数据格式化`join`，供插件管理后续处理使用。
  const settingsJsonPath = join(pluginPath, 'settings.json')
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供插件管理后续处理使用。
    const content = await readFile(settingsJsonPath, { encoding: 'utf-8' })
    // 解析结果解析`jsonParse`，供插件管理后续处理使用。
    const parsed = jsonParse(content)
    // 满足 `isRecord(parsed)` 时，插件管理执行该分支。
    if (isRecord(parsed)) {
      // filtered解析`parsePluginSettings`，供插件管理后续处理使用。
      const filtered = parsePluginSettings(parsed)
      // 满足 `filtered` 时，插件管理执行该分支。
      if (filtered) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Loaded settings from settings.json for plugin ${manifest.name}`,
        )
        // 返回 `filtered`，作为插件管理这次计算的结果。
        return filtered
      }
    }
  } catch (e: unknown) {
    // Missing/inaccessible is expected - settings.json is optional
    // 满足 `!isFsInaccessible(e)` 时，插件管理执行该分支。
    if (!isFsInaccessible(e)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to parse settings.json for plugin ${manifest.name}: ${e}`,
        { level: 'warn' },
      )
    }
  }

  // Fall back to manifest.settings
  // 满足 `manifest.settings` 时，插件管理执行该分支。
  if (manifest.settings) {
    // filtered解析`parsePluginSettings`，供插件管理后续处理使用。
    const filtered = parsePluginSettings(
      manifest.settings as Record<string, unknown>,
    )
    // 满足 `filtered` 时，插件管理执行该分支。
    if (filtered) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Loaded settings from manifest for plugin ${manifest.name}`,
      )
      // 返回 `filtered`，作为插件管理这次计算的结果。
      return filtered
    }
  }

  // 返回 `undefined`，作为插件管理这次计算的结果。
  return undefined
}

/**
 * Merge two HooksSettings objects
 */
// mergeHooksSettings 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mergeHooksSettings(
  base: HooksSettings | undefined,
  additional: HooksSettings,
): HooksSettings {
  // base缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!base) {
    // 返回 `additional`，作为插件管理这次计算的结果。
    return additional
  }

  // merged 集中保存插件工具 plugin Loader要一起传递的字段。
  const merged = { ...base }

  // 循环处理 `const [event, matchers] of Object.entries(additional)`，让插件管理把同类条目按顺序走完。
  for (const [event, matchers] of Object.entries(additional)) {
    // 满足 `!merged[event as keyof HooksSettings]` 时，插件管理执行该分支。
    if (!merged[event as keyof HooksSettings]) {
      // merged[event as keyof HooksSettings 集合更新为 `matchers`，确保插件工具 plugin Loader后续读取最新状态。
      merged[event as keyof HooksSettings] = matchers
    } else {
      // Merge matchers for this event
      // merged[event as keyof HooksSettings 集合更新为 `[`，确保插件工具 plugin Loader后续读取最新状态。
      merged[event as keyof HooksSettings] = [
        ...(merged[event as keyof HooksSettings] || []),
        ...matchers,
      ]
    }
  }

  // 返回 `merged`，作为插件管理这次计算的结果。
  return merged
}

/**
 * Shared discovery/policy/merge pipeline for both load modes.
 *
 * Resolves enabledPlugins → marketplace entries, runs enterprise policy
 * checks, pre-loads catalogs, then dispatches each entry to the full or
 * cache-only per-entry loader. The ONLY difference between loadAllPlugins
 * and loadAllPluginsCacheOnly is which loader runs — discovery and policy
 * are identical.
 */
// loadPluginsFromMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadPluginsFromMarketplaces({
  cacheOnly,
}: {
  cacheOnly: boolean
}): Promise<{
  plugins: LoadedPlugin[]
  errors: PluginError[]
}> {
  // settings 集合读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
  const settings = getSettings_DEPRECATED()
  // Merge --add-dir plugins at lowest priority; standard settings win on conflict
  // enabledPlugins 插件数据 集中保存插件工具 plugin Loader要一起传递的字段。
  const enabledPlugins = {
    ...getAddDirEnabledPlugins(),
    ...(settings.enabledPlugins || {}),
  }
  // plugins 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const plugins: LoadedPlugin[] = []
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: PluginError[] = []

  // Filter to plugin@marketplace format and validate
  // marketplacePluginEntries 插件数据派生`Object.entries`，供插件管理后续处理使用。
  const marketplacePluginEntries = Object.entries(enabledPlugins).filter(
    // 这个回调绑定到 ([key, value]) => {，负责插件管理在该局部场景下的响应。
    ([key, value]) => {
      // Check if it's in plugin@marketplace format (includes both enabled and disabled)
      // isValidFormat记录 `PluginIdSchema` 是否成立，插件管理随后按该结果分支。
      const isValidFormat = PluginIdSchema().safeParse(key).success
      // 只有 `!isValidFormat || value === undefined` 满足时，插件管理才执行该分支。
      if (!isValidFormat || value === undefined) return false
      // Skip built-in plugins — handled separately by getBuiltinPlugins()
      // 从 `parsePluginIdentifier(key)` 解构 marketplace，减少插件工具 plugin Loader对同一对象的重复访问。
      const { marketplace } = parsePluginIdentifier(key)
      // 返回 `marketplace !== BUILTIN_MARKETPLACE_NAME`，作为插件管理这次计算的结果。
      return marketplace !== BUILTIN_MARKETPLACE_NAME
    },
  )

  // Load known marketplaces config to look up sources for policy checking.
  // Use the Safe variant so a corrupted config file doesn't crash all plugin
  // loading — this is a read-only path, so returning {} degrades gracefully.
  // knownMarketplaces 市场数据读取`loadKnownMarketplacesConfigSafe`，供插件管理后续处理使用。
  const knownMarketplaces = await loadKnownMarketplacesConfigSafe()

  // Fail-closed guard for enterprise policy: if a policy IS configured and we
  // cannot resolve a marketplace's source (config returned {} due to corruption,
  // or entry missing), we must NOT silently skip the policy check and load the
  // plugin anyway. Before Safe, a corrupted config crashed everything (loud,
  // fail-closed). With Safe + no guard, the policy check short-circuits on
  // undefined marketplaceConfig and the fallback path (getPluginByIdCacheOnly)
  // loads the plugin unchecked — a silent fail-open. This guard restores
  // fail-closed: unknown source + active policy → block.
  //
  // Allowlist: any value (including []) is active — empty allowlist = deny all.
  // Blocklist: empty [] is a semantic no-op — only non-empty counts as active.
  // strictAllowlist 集合读取`getStrictKnownMarketplaces`，供插件管理后续处理使用。
  const strictAllowlist = getStrictKnownMarketplaces()
  // blocklist 集合读取`getBlockedMarketplaces`，供插件管理后续处理使用。
  const blocklist = getBlockedMarketplaces()
  // hasEnterprisePolicy 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasEnterprisePolicy =
    strictAllowlist !== null || (blocklist !== null && blocklist.length > 0)

  // Pre-load marketplace catalogs once per marketplace rather than re-reading
  // known_marketplaces.json + marketplace.json for every plugin. This is the
  // hot path — with N plugins across M marketplaces, the old per-plugin
  // getPluginByIdCacheOnly() did 2N config reads + N catalog reads; this does M.
  // uniqueMarketplaces 市场数据保存`Set`，供插件管理后续处理使用。
  const uniqueMarketplaces = new Set(
    marketplacePluginEntries
      // 链式调用 map，继续加工上一行在插件管理中产生的数据。
      .map(([pluginId]) => parsePluginIdentifier(pluginId).marketplace)
      // 链式调用 filter，继续加工上一行在插件管理中产生的数据。
      .filter((m): m is string => !!m),
  )
  // marketplaceCatalogs 市场数据构建`new Map<`，供后续判断或组装使用。
  const marketplaceCatalogs = new Map<
    string,
    Awaited<ReturnType<typeof getMarketplaceCacheOnly>>
  >()
  // 等待 `Promise.all(` 完成，再继续插件工具 plugin Loader的异步流程。
  await Promise.all(
    // 这个回调绑定到 [...uniqueMarketplaces].map(async name => {，负责插件管理在该局部场景下的响应。
    [...uniqueMarketplaces].map(async name => {
      // marketplaceCatalogs.set 写入新的状态值，使插件管理后续读取保持一致。
      marketplaceCatalogs.set(name, await getMarketplaceCacheOnly(name))
    }),
  )

  // Look up installed versions once so the first-pass ZIP cache check
  // can hit even when the marketplace entry omits `version`.
  // installedPluginsData 插件数据读取`getInMemoryInstalledPlugins`，供插件管理后续处理使用。
  const installedPluginsData = getInMemoryInstalledPlugins()

  // Load all marketplace plugins in parallel for faster startup
  // 结果列表保存`Promise.allSettled`，供插件管理后续处理使用。
  const results = await Promise.allSettled(
    // 调用 marketplacePluginEntries.map，触发插件管理此处需要的副作用。
    marketplacePluginEntries.map(async ([pluginId, enabledValue]) => {
      // 插件工具 plugin Loader先整理这一处局部数据，后续分支可以直接读取。
      const { name: pluginName, marketplace: marketplaceName } =
        parsePluginIdentifier(pluginId)

      // Check if marketplace source is allowed by enterprise policy
      // marketplaceConfig 市场数据保存`knownMarketplaces[marketplaceName!]`，供插件工具 plugin Loader后续判断或输出使用。
      const marketplaceConfig = knownMarketplaces[marketplaceName!]

      // Fail-closed: if enterprise policy is active and we can't look up the
      // marketplace source (config corrupted/empty, or entry missing), block
      // rather than silently skip the policy check. See hasEnterprisePolicy
      // comment above for the fail-open hazard this guards against.
      //
      // This also fires for the "stale enabledPlugins entry with no registered
      // marketplace" case, which is a UX trade-off: the user gets a policy
      // error instead of plugin-not-found. Accepted because the fallback path
      // (getPluginByIdCacheOnly) does a raw cast of known_marketplaces.json
      // with NO schema validation — if one entry is malformed enough to fail
      // our validation but readable enough for the raw cast, it would load
      // unchecked. Unverifiable source + active policy → block, always.
      // 只有 `!marketplaceConfig && hasEnterprisePolicy` 满足时，插件管理才执行该分支。
      if (!marketplaceConfig && hasEnterprisePolicy) {
        // We can't know whether the unverifiable source would actually be in
        // the blocklist or not in the allowlist — so pick the error variant
        // that matches whichever policy IS configured. If an allowlist exists,
        // "not in allowed list" is the right framing; if only a blocklist
        // exists, "blocked by blocklist" is less misleading than showing an
        // empty allowed-sources list.
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'marketplace-blocked-by-policy',
          source: pluginId,
          plugin: pluginName,
          marketplace: marketplaceName!,
          blockedByBlocklist: strictAllowlist === null,
          // 这个回调绑定到 allowedSources: (strictAllowlist ?? []).map(s =>，负责插件管理在该局部场景下的响应。
          allowedSources: (strictAllowlist ?? []).map(s =>
            formatSourceForDisplay(s),
          ),
        })
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }

      // 插件管理在这里按实际状态进入对应分支。
      if (
        marketplaceConfig &&
        !isSourceAllowedByPolicy(marketplaceConfig.source)
      ) {
        // Check if explicitly blocked vs not in allowlist for better error context
        // isBlocked记录 `isSourceInBlocklist` 是否成立，插件管理随后按该结果分支。
        const isBlocked = isSourceInBlocklist(marketplaceConfig.source)
        // allowlist 集合读取`getStrictKnownMarketplaces`，供插件管理后续处理使用。
        const allowlist = getStrictKnownMarketplaces() || []
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'marketplace-blocked-by-policy',
          source: pluginId,
          plugin: pluginName,
          marketplace: marketplaceName!,
          blockedByBlocklist: isBlocked,
          allowedSources: isBlocked
            ? []
            // 这个回调绑定到 : allowlist.map(s => formatSourceForDisplay(s)),，负责插件管理在该局部场景下的响应。
            : allowlist.map(s => formatSourceForDisplay(s)),
        })
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }

      // Look up plugin entry from pre-loaded marketplace catalog (no per-plugin I/O).
      // Fall back to getPluginByIdCacheOnly if the catalog couldn't be pre-loaded.
      // 结果 命名 `null`，让后续代码直接表达这个值的用途。
      let result: Awaited<ReturnType<typeof getPluginByIdCacheOnly>> = null
      // marketplace 市场数据读取`marketplaceCatalogs.get`，供插件管理后续处理使用。
      const marketplace = marketplaceCatalogs.get(marketplaceName!)
      // 只有 `marketplace && marketplaceConfig` 满足时，插件管理才执行该分支。
      if (marketplace && marketplaceConfig) {
        // entry筛选`plugins.find`，供插件管理后续处理使用。
        const entry = marketplace.plugins.find(p => p.name === pluginName)
        // 满足 `entry` 时，插件管理执行该分支。
        if (entry) {
          // 结果更新为 `{`，确保插件工具后续读取最新状态。
          result = {
            entry,
            marketplaceInstallLocation: marketplaceConfig.installLocation,
          }
        }
      } else {
        // 结果更新为 `await getPluginByIdCacheOnly(pluginId)`，确保插件工具后续读取最新状态。
        result = await getPluginByIdCacheOnly(pluginId)
      }

      // 结果缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!result) {
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'plugin-not-found',
          source: pluginId,
          pluginId: pluginName!,
          marketplace: marketplaceName!,
        })
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }

      // installed_plugins.json records what's actually cached on disk
      // (version for the full loader's first-pass probe, installPath for
      // the cache-only loader's direct read).
      // installEntry保存`installedPluginsData.plugins[pluginId]?.[0]`，供插件工具 plugin Loader后续判断或输出使用。
      const installEntry = installedPluginsData.plugins[pluginId]?.[0]
      // 返回 `cacheOnly`，作为插件管理这次计算的结果。
      return cacheOnly
        ? loadPluginFromMarketplaceEntryCacheOnly(
            result.entry,
            result.marketplaceInstallLocation,
            pluginId,
            enabledValue === true,
            errors,
            installEntry?.installPath,
          )
        : loadPluginFromMarketplaceEntry(
            result.entry,
            result.marketplaceInstallLocation,
            pluginId,
            enabledValue === true,
            errors,
            installEntry?.version,
          )
    }),
  )

  // 循环处理 `const [i, result] of results.entries()`，让插件管理把同类条目按顺序走完。
  for (const [i, result] of results.entries()) {
    // 只有 `result.status === 'fulfilled' && result.value` 满足时，插件管理才执行该分支。
    if (result.status === 'fulfilled' && result.value) {
      // plugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
      plugins.push(result.value)
    // 插件工具 plugin Loader在这里处理 `} else if (result.status === 'rejected') {`，完成这一小步状态转换。
    } else if (result.status === 'rejected') {
      // err保存`toError`，供插件管理后续处理使用。
      const err = toError(result.reason)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // pluginId 插件数据 命名 `marketplacePluginEntries[i]![0]`，让后续代码直接表达这个值的用途。
      const pluginId = marketplacePluginEntries[i]![0]
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'generic-error',
        source: pluginId,
        plugin: pluginId.split('@')[0],
        error: err.message,
      })
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { plugins, errors }
}

/**
 * Cache-only variant of loadPluginFromMarketplaceEntry.
 *
 * Skips network (cachePlugin) and disk-copy (copyPluginToVersionedCache).
 * Reads directly from the recorded installPath; if missing, emits
 * 'plugin-cache-miss'. Still extracts ZIP-cached plugins (local, fast).
 */
// loadPluginFromMarketplaceEntryCacheOnly 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadPluginFromMarketplaceEntryCacheOnly(
  entry: PluginMarketplaceEntry,
  marketplaceInstallLocation: string,
  pluginId: string,
  enabled: boolean,
  errorsOut: PluginError[],
  installPath: string | undefined,
): Promise<LoadedPlugin | null> {
  // pluginPath 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let pluginPath: string

  // 当 `typeof entry.source` 匹配 `'string'` 时，插件管理执行对应分支。
  if (typeof entry.source === 'string') {
    // Local relative path — read from the marketplace source dir directly.
    // Skip copyPluginToVersionedCache; startup doesn't need a fresh copy.
    // marketplaceDir 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let marketplaceDir: string
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // marketplaceDir 市场数据更新为 `(await stat(marketplaceInstallLocation)).isDirectory()`，确保插件工具后续读取最新状态。
      marketplaceDir = (await stat(marketplaceInstallLocation)).isDirectory()
        ? marketplaceInstallLocation
        : join(marketplaceInstallLocation, '..')
    } catch {
      // errorsOut 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorsOut.push({
        type: 'plugin-cache-miss',
        source: pluginId,
        plugin: entry.name,
        installPath: marketplaceInstallLocation,
      })
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
    // pluginPath 插件数据更新为 `join(marketplaceDir, entry.source)`，确保插件工具后续读取最新状态。
    pluginPath = join(marketplaceDir, entry.source)
    // finishLoadingPluginFromPath reads pluginPath — its error handling
    // surfaces ENOENT as a load failure, no need to pre-check here.
  } else {
    // External source (npm/github/url/git-subdir) — use recorded installPath.
    // 只有 `!installPath || !(await pathExists(installPath))` 满足时，插件管理才执行该分支。
    if (!installPath || !(await pathExists(installPath))) {
      // errorsOut 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorsOut.push({
        type: 'plugin-cache-miss',
        source: pluginId,
        plugin: entry.name,
        installPath: installPath ?? '(not recorded)',
      })
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
    // pluginPath 插件数据更新为 `installPath`，确保插件工具后续读取最新状态。
    pluginPath = installPath
  }

  // Zip cache extraction — must still happen in cacheOnly mode (invariant 4)
  // 只有 `isPluginZipCacheEnabled() && pluginPath.endsWith('.zip')` 满足时，插件管理才执行该分支。
  if (isPluginZipCacheEnabled() && pluginPath.endsWith('.zip')) {
    // sessionDir 会话数据读取`getSessionPluginCachePath`，供插件管理后续处理使用。
    const sessionDir = await getSessionPluginCachePath()
    // extractDir格式化`join`，供插件管理后续处理使用。
    const extractDir = join(
      sessionDir,
      pluginId.replace(/[^a-zA-Z0-9@\-_]/g, '-'),
    )
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `extractZipToDirectory(pluginPath, extractDir)` 完成，再继续插件工具 plugin Loader的异步流程。
      await extractZipToDirectory(pluginPath, extractDir)
      // pluginPath 插件数据更新为 `extractDir`，确保插件工具后续读取最新状态。
      pluginPath = extractDir
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to extract plugin ZIP ${pluginPath}: ${error}`, {
        level: 'error',
      })
      // errorsOut 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorsOut.push({
        type: 'plugin-cache-miss',
        source: pluginId,
        plugin: entry.name,
        installPath: pluginPath,
      })
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
  }

  // Delegate to the shared tail — identical to the full loader from here
  // 返回 `finishLoadingPluginFromPath(`，作为插件管理这次计算的结果。
  return finishLoadingPluginFromPath(
    entry,
    pluginId,
    enabled,
    errorsOut,
    pluginPath,
  )
}

/**
 * Load a plugin from a marketplace entry based on its source configuration.
 *
 * Handles different source types:
 * - Relative path: Loads from marketplace repo directory
 * - npm/github/url: Caches then loads from cache
 *
 * @param installedVersion - Version from installed_plugins.json, used as a
 *   first-pass hint for the versioned cache lookup when the marketplace entry
 *   omits `version`. Avoids re-cloning external plugins just to discover the
 *   version we already recorded at install time.
 *
 * Returns both the loaded plugin and any errors encountered during loading.
 * Errors include missing component files and hook load failures.
 */
// loadPluginFromMarketplaceEntry 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadPluginFromMarketplaceEntry(
  entry: PluginMarketplaceEntry,
  marketplaceInstallLocation: string,
  pluginId: string,
  enabled: boolean,
  errorsOut: PluginError[],
  installedVersion?: string,
): Promise<LoadedPlugin | null> {
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Loading plugin ${entry.name} from source: ${jsonStringify(entry.source)}`,
  )
  // pluginPath 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let pluginPath: string

  // 当 `typeof entry.source` 匹配 `'string'` 时，插件管理执行对应分支。
  if (typeof entry.source === 'string') {
    // Relative path - resolve relative to marketplace install location
    // marketplaceDir 市场数据 命名 `(`，让后续代码直接表达这个值的用途。
    const marketplaceDir = (
      await stat(marketplaceInstallLocation)
    ).isDirectory()
      ? marketplaceInstallLocation
      : join(marketplaceInstallLocation, '..')
    // sourcePluginPath 插件数据格式化`join`，供插件管理后续处理使用。
    const sourcePluginPath = join(marketplaceDir, entry.source)

    // 满足 `!(await pathExists(sourcePluginPath))` 时，插件管理执行该分支。
    if (!(await pathExists(sourcePluginPath))) {
      // 错误保存`Error`，供插件管理后续处理使用。
      const error = new Error(`Plugin path not found: ${sourcePluginPath}`)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Plugin path not found: ${sourcePluginPath}`, {
        level: 'error',
      })
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // errorsOut 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorsOut.push({
        type: 'generic-error',
        source: pluginId,
        error: `Plugin directory not found at path: ${sourcePluginPath}. Check that the marketplace entry has the correct path.`,
      })
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // Always copy local plugins to versioned cache
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // Try to load manifest from plugin directory to check for version field first
      // manifestPath 路径数据格式化`join`，供插件管理后续处理使用。
      const manifestPath = join(
        sourcePluginPath,
        '.claude-plugin',
        'plugin.json',
      )
      // pluginManifest 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let pluginManifest: PluginManifest | undefined
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // pluginManifest 插件数据更新为 `await loadPluginManifest(`，确保插件工具后续读取最新状态。
        pluginManifest = await loadPluginManifest(
          manifestPath,
          entry.name,
          entry.source,
        )
      } catch {
        // Manifest loading failed - will fall back to provided version or git SHA
      }

      // Calculate version with fallback order:
      // 1. Plugin manifest version, 2. Marketplace entry version, 3. Git SHA, 4. 'unknown'
      // version保存`calculatePluginVersion`，供插件管理后续处理使用。
      const version = await calculatePluginVersion(
        pluginId,
        entry.source,
        pluginManifest,
        marketplaceDir,
        entry.version, // Marketplace entry version as fallback
      )

      // Copy to versioned cache
      // pluginPath 插件数据更新为 `await copyPluginToVersionedCache(`，确保插件工具后续读取最新状态。
      pluginPath = await copyPluginToVersionedCache(
        sourcePluginPath,
        pluginId,
        version,
        entry,
        marketplaceDir,
      )

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Resolved local plugin ${entry.name} to versioned cache: ${pluginPath}`,
      )
    } catch (error) {
      // If copy fails, fall back to loading from marketplace directly
      // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
      const errorMsg = errorMessage(error)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to copy plugin ${entry.name} to versioned cache: ${errorMsg}. Using marketplace path.`,
        { level: 'warn' },
      )
      // pluginPath 插件数据更新为 `sourcePluginPath`，确保插件工具后续读取最新状态。
      pluginPath = sourcePluginPath
    }
  } else {
    // External source (npm, github, url, pip) - always use versioned cache
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // Calculate version with fallback order:
      // 1. No manifest yet, 2. installed_plugins.json version,
      //    3. Marketplace entry version, 4. source.sha (pinned commits — the
      //    exact value the post-clone call at cached.gitCommitSha would see),
      //    5. 'unknown' → ref-tracked, falls through to clone by design.
      // version保存`calculatePluginVersion`，供插件管理后续处理使用。
      const version = await calculatePluginVersion(
        pluginId,
        entry.source,
        undefined,
        undefined,
        installedVersion ?? entry.version,
        'sha' in entry.source ? entry.source.sha : undefined,
      )

      // versionedPath 路径数据读取`getVersionedCachePath`，供插件管理后续处理使用。
      const versionedPath = getVersionedCachePath(pluginId, version)

      // Check for cached version — ZIP file (zip cache mode) or directory
      // zipPath 路径数据读取`getVersionedZipCachePath`，供插件管理后续处理使用。
      const zipPath = getVersionedZipCachePath(pluginId, version)
      // 只有 `isPluginZipCacheEnabled() && (await pathExists(zipPath))` 满足时，插件管理才执行该分支。
      if (isPluginZipCacheEnabled() && (await pathExists(zipPath))) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Using versioned cached plugin ZIP ${entry.name} from ${zipPath}`,
        )
        // pluginPath 插件数据更新为 `zipPath`，确保插件工具后续读取最新状态。
        pluginPath = zipPath
      // 插件工具 plugin Loader在这里处理 `} else if (await pathExists(versionedPath)) {`，完成这一小步状态转换。
      } else if (await pathExists(versionedPath)) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Using versioned cached plugin ${entry.name} from ${versionedPath}`,
        )
        // pluginPath 插件数据更新为 `versionedPath`，确保插件工具后续读取最新状态。
        pluginPath = versionedPath
      } else {
        // Seed cache probe (CCR pre-baked images, read-only). Seed content is
        // frozen at image build time — no freshness concern, 'whatever's there'
        // is what the image builder put there. Primary cache is NOT probed
        // here; ref-tracked sources fall through to clone (the re-clone IS
        // the freshness mechanism). If the clone fails, the plugin is simply
        // disabled for this session — errorsOut.push below surfaces it.
        // seedPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const seedPath =
          (await probeSeedCache(pluginId, version)) ??
          (version === 'unknown'
            ? await probeSeedCacheAnyVersion(pluginId)
            : null)
        // 满足 `seedPath` 时，插件管理执行该分支。
        if (seedPath) {
          // pluginPath 插件数据更新为 `seedPath`，确保插件工具后续读取最新状态。
          pluginPath = seedPath
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Using seed cache for external plugin ${entry.name} at ${seedPath}`,
          )
        } else {
          // Download to temp location, then copy to versioned cache
          // cached 缓存保存`cachePlugin`，供插件管理后续处理使用。
          const cached = await cachePlugin(entry.source, {
            manifest: { name: entry.name },
          })

          // If the pre-clone version was deterministic (source.sha /
          // entry.version / installedVersion), REUSE it. The post-clone
          // recomputation with cached.manifest can return a DIFFERENT value
          // — manifest.version (step 1) outranks gitCommitSha (step 3) —
          // which would cache at e.g. "2.0.0/" while every warm start
          // probes "{sha12}-{hash}/". Mismatched keys = re-clone forever.
          // Recomputation is only needed when pre-clone was 'unknown'
          // (ref-tracked, no hints) — the clone is the ONLY way to learn.
          // actualVersion 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const actualVersion =
            version !== 'unknown'
              ? version
              : await calculatePluginVersion(
                  pluginId,
                  entry.source,
                  cached.manifest,
                  cached.path,
                  installedVersion ?? entry.version,
                  cached.gitCommitSha,
                )

          // Copy to versioned cache
          // For external sources, marketplaceDir is not applicable (already downloaded)
          // pluginPath 插件数据更新为 `await copyPluginToVersionedCache(`，确保插件工具后续读取最新状态。
          pluginPath = await copyPluginToVersionedCache(
            cached.path,
            pluginId,
            actualVersion,
            entry,
            undefined,
          )

          // Clean up temp path
          // `cached.path` 与 `pluginPath` 不一致时刷新派生状态，避免使用过期结果。
          if (cached.path !== pluginPath) {
            // 等待 `rm(cached.path, { recursive: true, force: true })` 完成，再继续插件工具 plugin Loader的异步流程。
            await rm(cached.path, { recursive: true, force: true })
          }
        }
      }
    } catch (error) {
      // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
      const errorMsg = errorMessage(error)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to cache plugin ${entry.name}: ${errorMsg}`, {
        level: 'error',
      })
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))
      // errorsOut 错误信息追加新条目，保持收集顺序与输入顺序一致。
      errorsOut.push({
        type: 'generic-error',
        source: pluginId,
        error: `Failed to download/cache plugin ${entry.name}: ${errorMsg}`,
      })
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
  }

  // Zip cache mode: extract ZIP to session temp dir before loading
  // 只有 `isPluginZipCacheEnabled() && pluginPath.endsWith('.zip')` 满足时，插件管理才执行该分支。
  if (isPluginZipCacheEnabled() && pluginPath.endsWith('.zip')) {
    // sessionDir 会话数据读取`getSessionPluginCachePath`，供插件管理后续处理使用。
    const sessionDir = await getSessionPluginCachePath()
    // extractDir格式化`join`，供插件管理后续处理使用。
    const extractDir = join(
      sessionDir,
      pluginId.replace(/[^a-zA-Z0-9@\-_]/g, '-'),
    )
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `extractZipToDirectory(pluginPath, extractDir)` 完成，再继续插件工具 plugin Loader的异步流程。
      await extractZipToDirectory(pluginPath, extractDir)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Extracted plugin ZIP to session dir: ${extractDir}`)
      // pluginPath 插件数据更新为 `extractDir`，确保插件工具后续读取最新状态。
      pluginPath = extractDir
    } catch (error) {
      // Corrupt ZIP: delete it so next install attempt re-creates it
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to extract plugin ZIP ${pluginPath}, deleting corrupt file: ${error}`,
      )
      // 这个回调绑定到 await rm(pluginPath, { force: true }).catch(() => {})，负责插件管理在该局部场景下的响应。
      await rm(pluginPath, { force: true }).catch(() => {})
      // 抛出 error，阻止插件管理在无效状态下继续运行。
      throw error
    }
  }

  // 返回 `finishLoadingPluginFromPath(`，作为插件管理这次计算的结果。
  return finishLoadingPluginFromPath(
    entry,
    pluginId,
    enabled,
    errorsOut,
    pluginPath,
  )
}

/**
 * Shared tail of both loadPluginFromMarketplaceEntry variants.
 *
 * Once pluginPath is resolved (via clone, cache, or installPath lookup),
 * the rest of the load — manifest probe, createPluginFromPath, marketplace
 * entry supplementation — is identical. Extracted so the cache-only path
 * doesn't duplicate ~500 lines.
 */
// finishLoadingPluginFromPath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function finishLoadingPluginFromPath(
  entry: PluginMarketplaceEntry,
  pluginId: string,
  enabled: boolean,
  errorsOut: PluginError[],
  pluginPath: string,
): Promise<LoadedPlugin | null> {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: PluginError[] = []

  // Check if plugin.json exists to determine if we should use marketplace manifest
  // manifestPath 路径数据格式化`join`，供插件管理后续处理使用。
  const manifestPath = join(pluginPath, '.claude-plugin', 'plugin.json')
  // hasManifest记录 `pathExists` 是否成立，插件管理随后按该结果分支。
  const hasManifest = await pathExists(manifestPath)

  // 从 `await createPluginFromPath(` 解构 plugin、errors，减少插件工具 plugin Loader对同一对象的重复访问。
  const { plugin, errors: pluginErrors } = await createPluginFromPath(
    pluginPath,
    pluginId,
    enabled,
    entry.name,
    entry.strict ?? true, // Respect marketplace entry's strict setting
  )
  // 错误列表追加新条目，保持收集顺序与输入顺序一致。
  errors.push(...pluginErrors)

  // Set sha from source if available (for github and url source types)
  // 插件管理在这里按实际状态进入对应分支。
  if (
    typeof entry.source === 'object' &&
    'sha' in entry.source &&
    entry.source.sha
  ) {
    // sha更新为 `entry.source.sha`，确保插件工具后续读取最新状态。
    plugin.sha = entry.source.sha
  }

  // If there's no plugin.json, use marketplace entry as manifest (regardless of strict mode)
  // hasManifest缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!hasManifest) {
    // manifest更新为 `{`，确保插件工具后续读取最新状态。
    plugin.manifest = {
      ...entry,
      id: undefined,
      source: undefined,
      strict: undefined,
    } as PluginManifest
    // 名称更新为 `plugin.manifest.name`，确保插件工具后续读取最新状态。
    plugin.name = plugin.manifest.name

    // Process commands from marketplace entry
    // 满足 `entry.commands` 时，插件管理执行该分支。
    if (entry.commands) {
      // Check if it's an object mapping
      // firstValue派生`Object.values`，供插件管理后续处理使用。
      const firstValue = Object.values(entry.commands)[0]
      // 插件管理在这里按实际状态进入对应分支。
      if (
        typeof entry.commands === 'object' &&
        !Array.isArray(entry.commands) &&
        firstValue &&
        typeof firstValue === 'object' &&
        ('source' in firstValue || 'content' in firstValue)
      ) {
        // Object mapping format
        // commandsMetadata 命令数据 从空对象开始收集键值，后续按名称补齐内容。
        const commandsMetadata: Record<string, CommandMetadata> = {}
        // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
        const validPaths: string[] = []

        // Parallelize pathExists checks; process results in order.
        // entries 集合派生`Object.entries`，供插件管理后续处理使用。
        const entries = Object.entries(entry.commands)
        // checks 集合保存`Promise.all`，供插件管理后续处理使用。
        const checks = await Promise.all(
          // 调用 entries.map，触发插件管理此处需要的副作用。
          entries.map(async ([commandName, metadata]) => {
            // `!metadata || typeof metadata` 与 `'object' || !met` 不一致时刷新派生状态，避免使用过期结果。
            if (!metadata || typeof metadata !== 'object' || !metadata.source) {
              // 返回结构化结果，集中表达插件管理已经整理出的状态。
              return { commandName, metadata, skip: true as const }
            }
            // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
            const fullPath = join(pluginPath, metadata.source)
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return {
              commandName,
              metadata,
              skip: false as const,
              fullPath,
              exists: await pathExists(fullPath),
            }
          }),
        )
        // 按顺序遍历 `checks` 中的check，逐个交给插件管理处理。
        for (const check of checks) {
          // 满足 `check.skip` 时，插件管理执行该分支。
          if (check.skip) continue
          // 满足 `check.exists` 时，插件管理执行该分支。
          if (check.exists) {
            // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
            validPaths.push(check.fullPath)
            // commandName 命令数据更新为 `check.metadata`，确保插件工具 plugin Loader后续读取最新状态。
            commandsMetadata[check.commandName] = check.metadata
          } else {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Command ${check.commandName} path ${check.metadata.source} from marketplace entry not found at ${check.fullPath} for ${entry.name}`,
              { level: 'warn' },
            )
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `Plugin component file not found: ${check.fullPath} for ${entry.name}`,
              ),
            )
            // 错误列表追加新条目，保持收集顺序与输入顺序一致。
            errors.push({
              type: 'path-not-found',
              source: pluginId,
              plugin: entry.name,
              path: check.fullPath,
              component: 'commands',
            })
          }
        }

        // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
        if (validPaths.length > 0) {
          // commandsPaths 命令数据更新为 `validPaths`，确保插件工具后续读取最新状态。
          plugin.commandsPaths = validPaths
          // commandsMetadata 命令数据更新为 `commandsMetadata`，确保插件工具后续读取最新状态。
          plugin.commandsMetadata = commandsMetadata
        }
      } else {
        // Path or array of paths format
        // commandPaths 命令数据保存`Array.isArray`，供插件管理后续处理使用。
        const commandPaths = Array.isArray(entry.commands)
          ? entry.commands
          : [entry.commands]

        // Parallelize pathExists checks; process results in order.
        // checks 集合保存`Promise.all`，供插件管理后续处理使用。
        const checks = await Promise.all(
          // 调用 commandPaths.map，触发插件管理此处需要的副作用。
          commandPaths.map(async cmdPath => {
            // `typeof cmdPath` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
            if (typeof cmdPath !== 'string') {
              // 返回结构化结果，集中表达插件管理已经整理出的状态。
              return { cmdPath, kind: 'invalid' as const }
            }
            // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
            const fullPath = join(pluginPath, cmdPath)
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return {
              cmdPath,
              kind: 'path' as const,
              fullPath,
              exists: await pathExists(fullPath),
            }
          }),
        )
        // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
        const validPaths: string[] = []
        // 按顺序遍历 `checks` 中的check，逐个交给插件管理处理。
        for (const check of checks) {
          // 当 `check.kind` 匹配 `'invalid'` 时，插件管理执行对应分支。
          if (check.kind === 'invalid') {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Unexpected command format in marketplace entry for ${entry.name}`,
              { level: 'error' },
            )
            // 跳过当前项，继续处理插件管理中的下一轮循环。
            continue
          }
          // 满足 `check.exists` 时，插件管理执行该分支。
          if (check.exists) {
            // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
            validPaths.push(check.fullPath)
          } else {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Command path ${check.cmdPath} from marketplace entry not found at ${check.fullPath} for ${entry.name}`,
              { level: 'warn' },
            )
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `Plugin component file not found: ${check.fullPath} for ${entry.name}`,
              ),
            )
            // 错误列表追加新条目，保持收集顺序与输入顺序一致。
            errors.push({
              type: 'path-not-found',
              source: pluginId,
              plugin: entry.name,
              path: check.fullPath,
              component: 'commands',
            })
          }
        }

        // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
        if (validPaths.length > 0) {
          // commandsPaths 命令数据更新为 `validPaths`，确保插件工具后续读取最新状态。
          plugin.commandsPaths = validPaths
        }
      }
    }

    // Process agents from marketplace entry
    // 满足 `entry.agents` 时，插件管理执行该分支。
    if (entry.agents) {
      // agentPaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
      const agentPaths = Array.isArray(entry.agents)
        ? entry.agents
        : [entry.agents]

      // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
      const validPaths = await validatePluginPaths(
        agentPaths,
        pluginPath,
        entry.name,
        pluginId,
        'agents',
        'Agent',
        'from marketplace entry',
        errors,
      )

      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // agentsPaths 路径数据更新为 `validPaths`，确保插件工具后续读取最新状态。
        plugin.agentsPaths = validPaths
      }
    }

    // Process skills from marketplace entry
    // 满足 `entry.skills` 时，插件管理执行该分支。
    if (entry.skills) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Processing ${Array.isArray(entry.skills) ? entry.skills.length : 1} skill paths for plugin ${entry.name}`,
      )
      // skillPaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
      const skillPaths = Array.isArray(entry.skills)
        ? entry.skills
        : [entry.skills]

      // Parallelize pathExists checks; process results in order.
      // Note: previously this loop called pathExists() TWICE per iteration
      // (once in a debug log template, once in the if) — now called once.
      // checks 集合保存`Promise.all`，供插件管理后续处理使用。
      const checks = await Promise.all(
        // 调用 skillPaths.map，触发插件管理此处需要的副作用。
        skillPaths.map(async skillPath => {
          // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
          const fullPath = join(pluginPath, skillPath)
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return { skillPath, fullPath, exists: await pathExists(fullPath) }
        }),
      )
      // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const validPaths: string[] = []
      // 循环处理 `const { skillPath, fullPath, exists } of checks`，让插件管理逐项把同类条目按顺序走完。
      for (const { skillPath, fullPath, exists } of checks) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Checking skill path: ${skillPath} -> ${fullPath} (exists: ${exists})`,
        )
        // 满足 `exists` 时，插件管理执行该分支。
        if (exists) {
          // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
          validPaths.push(fullPath)
        } else {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Skill path ${skillPath} from marketplace entry not found at ${fullPath} for ${entry.name}`,
            { level: 'warn' },
          )
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error(
              `Plugin component file not found: ${fullPath} for ${entry.name}`,
            ),
          )
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'path-not-found',
            source: pluginId,
            plugin: entry.name,
            path: fullPath,
            component: 'skills',
          })
        }
      }

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Found ${validPaths.length} valid skill paths for plugin ${entry.name}, setting skillsPaths`,
      )
      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // skillsPaths 路径数据更新为 `validPaths`，确保插件工具后续读取最新状态。
        plugin.skillsPaths = validPaths
      }
    } else {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Plugin ${entry.name} has no entry.skills defined`)
    }

    // Process output styles from marketplace entry
    // 满足 `entry.outputStyles` 时，插件管理执行该分支。
    if (entry.outputStyles) {
      // outputStylePaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
      const outputStylePaths = Array.isArray(entry.outputStyles)
        ? entry.outputStyles
        : [entry.outputStyles]

      // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
      const validPaths = await validatePluginPaths(
        outputStylePaths,
        pluginPath,
        entry.name,
        pluginId,
        'output-styles',
        'Output style',
        'from marketplace entry',
        errors,
      )

      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // outputStylesPaths 路径数据更新为 `validPaths`，确保插件工具后续读取最新状态。
        plugin.outputStylesPaths = validPaths
      }
    }

    // Process inline hooks from marketplace entry
    // 满足 `entry.hooks` 时，插件管理执行该分支。
    if (entry.hooks) {
      // hooksConfig 配置更新为 `entry.hooks as HooksSettings`，确保插件工具后续读取最新状态。
      plugin.hooksConfig = entry.hooks as HooksSettings
    }
  // 插件工具 plugin Loader在这里处理 `} else if (`，完成这一小步状态转换。
  } else if (
    !entry.strict &&
    hasManifest &&
    (entry.commands ||
      entry.agents ||
      entry.skills ||
      entry.hooks ||
      entry.outputStyles)
  ) {
    // In non-strict mode with plugin.json, marketplace entries for commands/agents/skills/hooks/outputStyles are conflicts
    // 错误保存`Error`，供插件管理后续处理使用。
    const error = new Error(
      `Plugin ${entry.name} has both plugin.json and marketplace manifest entries for commands/agents/skills/hooks/outputStyles. This is a conflict.`,
    )
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Plugin ${entry.name} has both plugin.json and marketplace manifest entries for commands/agents/skills/hooks/outputStyles. This is a conflict.`,
      { level: 'error' },
    )
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // errorsOut 错误信息追加新条目，保持收集顺序与输入顺序一致。
    errorsOut.push({
      type: 'generic-error',
      source: pluginId,
      error: `Plugin ${entry.name} has conflicting manifests: both plugin.json and marketplace entry specify components. Set strict: true in marketplace entry or remove component specs from one location.`,
    })
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  // 插件工具 plugin Loader在这里处理 `} else if (hasManifest) {`，完成这一小步状态转换。
  } else if (hasManifest) {
    // Has plugin.json - marketplace can supplement commands/agents/skills/hooks/outputStyles

    // Supplement commands from marketplace entry
    // 满足 `entry.commands` 时，插件管理执行该分支。
    if (entry.commands) {
      // Check if it's an object mapping
      // firstValue派生`Object.values`，供插件管理后续处理使用。
      const firstValue = Object.values(entry.commands)[0]
      // 插件管理在这里按实际状态进入对应分支。
      if (
        typeof entry.commands === 'object' &&
        !Array.isArray(entry.commands) &&
        firstValue &&
        typeof firstValue === 'object' &&
        ('source' in firstValue || 'content' in firstValue)
      ) {
        // Object mapping format - merge metadata
        // commandsMetadata 命令数据 集中保存插件工具 plugin Loader要一起传递的字段。
        const commandsMetadata: Record<string, CommandMetadata> = {
          ...(plugin.commandsMetadata || {}),
        }
        // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
        const validPaths: string[] = []

        // Parallelize pathExists checks; process results in order.
        // entries 集合派生`Object.entries`，供插件管理后续处理使用。
        const entries = Object.entries(entry.commands)
        // checks 集合保存`Promise.all`，供插件管理后续处理使用。
        const checks = await Promise.all(
          // 调用 entries.map，触发插件管理此处需要的副作用。
          entries.map(async ([commandName, metadata]) => {
            // `!metadata || typeof metadata` 与 `'object' || !met` 不一致时刷新派生状态，避免使用过期结果。
            if (!metadata || typeof metadata !== 'object' || !metadata.source) {
              // 返回结构化结果，集中表达插件管理已经整理出的状态。
              return { commandName, metadata, skip: true as const }
            }
            // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
            const fullPath = join(pluginPath, metadata.source)
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return {
              commandName,
              metadata,
              skip: false as const,
              fullPath,
              exists: await pathExists(fullPath),
            }
          }),
        )
        // 按顺序遍历 `checks` 中的check，逐个交给插件管理处理。
        for (const check of checks) {
          // 满足 `check.skip` 时，插件管理执行该分支。
          if (check.skip) continue
          // 满足 `check.exists` 时，插件管理执行该分支。
          if (check.exists) {
            // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
            validPaths.push(check.fullPath)
            // commandName 命令数据更新为 `check.metadata`，确保插件工具 plugin Loader后续读取最新状态。
            commandsMetadata[check.commandName] = check.metadata
          } else {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Command ${check.commandName} path ${check.metadata.source} from marketplace entry not found at ${check.fullPath} for ${entry.name}`,
              { level: 'warn' },
            )
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `Plugin component file not found: ${check.fullPath} for ${entry.name}`,
              ),
            )
            // 错误列表追加新条目，保持收集顺序与输入顺序一致。
            errors.push({
              type: 'path-not-found',
              source: pluginId,
              plugin: entry.name,
              path: check.fullPath,
              component: 'commands',
            })
          }
        }

        // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
        if (validPaths.length > 0) {
          // commandsPaths 命令数据更新为 `[`，确保插件工具后续读取最新状态。
          plugin.commandsPaths = [
            ...(plugin.commandsPaths || []),
            ...validPaths,
          ]
          // commandsMetadata 命令数据更新为 `commandsMetadata`，确保插件工具后续读取最新状态。
          plugin.commandsMetadata = commandsMetadata
        }
      } else {
        // Path or array of paths format
        // commandPaths 命令数据保存`Array.isArray`，供插件管理后续处理使用。
        const commandPaths = Array.isArray(entry.commands)
          ? entry.commands
          : [entry.commands]

        // Parallelize pathExists checks; process results in order.
        // checks 集合保存`Promise.all`，供插件管理后续处理使用。
        const checks = await Promise.all(
          // 调用 commandPaths.map，触发插件管理此处需要的副作用。
          commandPaths.map(async cmdPath => {
            // `typeof cmdPath` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
            if (typeof cmdPath !== 'string') {
              // 返回结构化结果，集中表达插件管理已经整理出的状态。
              return { cmdPath, kind: 'invalid' as const }
            }
            // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
            const fullPath = join(pluginPath, cmdPath)
            // 返回结构化结果，集中表达插件管理已经整理出的状态。
            return {
              cmdPath,
              kind: 'path' as const,
              fullPath,
              exists: await pathExists(fullPath),
            }
          }),
        )
        // validPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
        const validPaths: string[] = []
        // 按顺序遍历 `checks` 中的check，逐个交给插件管理处理。
        for (const check of checks) {
          // 当 `check.kind` 匹配 `'invalid'` 时，插件管理执行对应分支。
          if (check.kind === 'invalid') {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Unexpected command format in marketplace entry for ${entry.name}`,
              { level: 'error' },
            )
            // 跳过当前项，继续处理插件管理中的下一轮循环。
            continue
          }
          // 满足 `check.exists` 时，插件管理执行该分支。
          if (check.exists) {
            // validPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
            validPaths.push(check.fullPath)
          } else {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Command path ${check.cmdPath} from marketplace entry not found at ${check.fullPath} for ${entry.name}`,
              { level: 'warn' },
            )
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `Plugin component file not found: ${check.fullPath} for ${entry.name}`,
              ),
            )
            // 错误列表追加新条目，保持收集顺序与输入顺序一致。
            errors.push({
              type: 'path-not-found',
              source: pluginId,
              plugin: entry.name,
              path: check.fullPath,
              component: 'commands',
            })
          }
        }

        // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
        if (validPaths.length > 0) {
          // commandsPaths 命令数据更新为 `[`，确保插件工具后续读取最新状态。
          plugin.commandsPaths = [
            ...(plugin.commandsPaths || []),
            ...validPaths,
          ]
        }
      }
    }

    // Supplement agents from marketplace entry
    // 满足 `entry.agents` 时，插件管理执行该分支。
    if (entry.agents) {
      // agentPaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
      const agentPaths = Array.isArray(entry.agents)
        ? entry.agents
        : [entry.agents]

      // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
      const validPaths = await validatePluginPaths(
        agentPaths,
        pluginPath,
        entry.name,
        pluginId,
        'agents',
        'Agent',
        'from marketplace entry',
        errors,
      )

      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // agentsPaths 路径数据更新为 `[...(plugin.agentsPaths || []), ...validPaths]`，确保插件工具后续读取最新状态。
        plugin.agentsPaths = [...(plugin.agentsPaths || []), ...validPaths]
      }
    }

    // Supplement skills from marketplace entry
    // 满足 `entry.skills` 时，插件管理执行该分支。
    if (entry.skills) {
      // skillPaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
      const skillPaths = Array.isArray(entry.skills)
        ? entry.skills
        : [entry.skills]

      // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
      const validPaths = await validatePluginPaths(
        skillPaths,
        pluginPath,
        entry.name,
        pluginId,
        'skills',
        'Skill',
        'from marketplace entry',
        errors,
      )

      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // skillsPaths 路径数据更新为 `[...(plugin.skillsPaths || []), ...validPaths]`，确保插件工具后续读取最新状态。
        plugin.skillsPaths = [...(plugin.skillsPaths || []), ...validPaths]
      }
    }

    // Supplement output styles from marketplace entry
    // 满足 `entry.outputStyles` 时，插件管理执行该分支。
    if (entry.outputStyles) {
      // outputStylePaths 路径数据保存`Array.isArray`，供插件管理后续处理使用。
      const outputStylePaths = Array.isArray(entry.outputStyles)
        ? entry.outputStyles
        : [entry.outputStyles]

      // validPaths 路径数据读取`validatePluginPaths`，供插件管理后续处理使用。
      const validPaths = await validatePluginPaths(
        outputStylePaths,
        pluginPath,
        entry.name,
        pluginId,
        'output-styles',
        'Output style',
        'from marketplace entry',
        errors,
      )

      // 满足 `validPaths.length > 0` 时，插件管理执行该分支。
      if (validPaths.length > 0) {
        // outputStylesPaths 路径数据更新为 `[`，确保插件工具后续读取最新状态。
        plugin.outputStylesPaths = [
          ...(plugin.outputStylesPaths || []),
          ...validPaths,
        ]
      }
    }

    // Supplement hooks from marketplace entry
    // 满足 `entry.hooks` 时，插件管理执行该分支。
    if (entry.hooks) {
      // hooksConfig 配置更新为 `{`，确保插件工具后续读取最新状态。
      plugin.hooksConfig = {
        ...(plugin.hooksConfig || {}),
        ...(entry.hooks as HooksSettings),
      }
    }
  }

  // errorsOut 错误信息追加新条目，保持收集顺序与输入顺序一致。
  errorsOut.push(...errors)
  // 返回 `plugin`，作为插件管理这次计算的结果。
  return plugin
}

/**
 * Load session-only plugins from --plugin-dir CLI flag.
 *
 * These plugins are loaded directly without going through the marketplace system.
 * They appear with source='plugin-name@inline' and are always enabled for the current session.
 *
 * @param sessionPluginPaths - Array of plugin directory paths from CLI
 * @returns LoadedPlugin objects and any errors encountered
 */
// loadSessionOnlyPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadSessionOnlyPlugins(
  sessionPluginPaths: Array<string>,
): Promise<{ plugins: LoadedPlugin[]; errors: PluginError[] }> {
  // sessionPluginPaths 插件数据为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (sessionPluginPaths.length === 0) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { plugins: [], errors: [] }
  }

  // plugins 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const plugins: LoadedPlugin[] = []
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: PluginError[] = []

  // 循环处理 `const [index, pluginPath] of sessionPluginPaths.entries()`，让插件管理把同类条目按顺序走完。
  for (const [index, pluginPath] of sessionPluginPaths.entries()) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // resolvedPath 路径数据读取`resolve`，供插件管理后续处理使用。
      const resolvedPath = resolve(pluginPath)

      // 满足 `!(await pathExists(resolvedPath))` 时，插件管理执行该分支。
      if (!(await pathExists(resolvedPath))) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin path does not exist: ${resolvedPath}, skipping`,
          { level: 'warn' },
        )
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'path-not-found',
          source: `inline[${index}]`,
          path: resolvedPath,
          component: 'commands',
        })
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // dirName保存`basename`，供插件管理后续处理使用。
      const dirName = basename(resolvedPath)
      // 从 `await createPluginFromPath(` 解构 plugin、errors，减少插件工具 plugin Loader对同一对象的重复访问。
      const { plugin, errors: pluginErrors } = await createPluginFromPath(
        resolvedPath,
        `${dirName}@inline`, // temporary, will be updated after we know the real name
        true, // always enabled
        dirName,
      )

      // Update source to use the actual plugin name from manifest
      // source更新为 ``${plugin.name}@inline``，确保插件工具后续读取最新状态。
      plugin.source = `${plugin.name}@inline`
      // repository更新为 ``${plugin.name}@inline``，确保插件工具后续读取最新状态。
      plugin.repository = `${plugin.name}@inline`

      // plugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
      plugins.push(plugin)
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(...pluginErrors)

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Loaded inline plugin from path: ${plugin.name}`)
    } catch (error) {
      // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
      const errorMsg = errorMessage(error)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to load session plugin from ${pluginPath}: ${errorMsg}`,
        { level: 'warn' },
      )
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'generic-error',
        source: `inline[${index}]`,
        error: `Failed to load plugin: ${errorMsg}`,
      })
    }
  }

  // 满足 `plugins.length > 0` 时，插件管理执行该分支。
  if (plugins.length > 0) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Loaded ${plugins.length} session-only plugins from --plugin-dir`,
    )
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { plugins, errors }
}

/**
 * Merge plugins from session (--plugin-dir), marketplace (installed), and
 * builtin sources. Session plugins override marketplace plugins with the
 * same name — the user explicitly pointed at a directory for this session.
 *
 * Exception: marketplace plugins locked by managed settings (policySettings)
 * cannot be overridden. Enterprise admin intent beats local dev convenience.
 * When a session plugin collides with a managed one, the session copy is
 * dropped and an error is returned for surfacing.
 *
 * Without this dedup, both versions sat in the array and marketplace won
 * on first-match, making --plugin-dir useless for iterating on an
 * installed plugin.
 */
// mergePluginSources 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mergePluginSources(sources: {
  session: LoadedPlugin[]
  marketplace: LoadedPlugin[]
  builtin: LoadedPlugin[]
  managedNames?: Set<string> | null
}): { plugins: LoadedPlugin[]; errors: PluginError[] } {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: PluginError[] = []
  // managed保存`sources.managedNames`，供插件工具 plugin Loader后续判断或输出使用。
  const managed = sources.managedNames

  // Managed settings win over --plugin-dir. Drop session plugins whose
  // name appears in policySettings.enabledPlugins (whether force-enabled
  // OR force-disabled — both are admin intent that --plugin-dir must not
  // bypass). Surface an error so the user knows why their dev copy was
  // ignored.
  //
  // NOTE: managedNames contains the pluginId prefix (entry.name), which is
  // expected to equal manifest.name by convention (schema description at
  // schemas.ts PluginMarketplaceEntry.name). If a marketplace publishes a
  // plugin where entry.name ≠ manifest.name, this guard will silently miss —
  // but that's a marketplace misconfiguration that breaks other things too
  // (e.g., ManagePlugins constructs pluginIds from manifest.name).
  // sessionPlugins 插件数据筛选`session.filter`，供插件管理后续处理使用。
  const sessionPlugins = sources.session.filter(p => {
    // 满足 `managed?.has(p.name)` 时，插件管理执行该分支。
    if (managed?.has(p.name)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin "${p.name}" from --plugin-dir is blocked by managed settings`,
        { level: 'warn' },
      )
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'generic-error',
        source: p.source,
        plugin: p.name,
        error: `--plugin-dir copy of "${p.name}" ignored: plugin is locked by managed settings`,
      })
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  })

  // sessionNames 会话数据保存`Set`，供插件管理后续处理使用。
  const sessionNames = new Set(sessionPlugins.map(p => p.name))
  // marketplacePlugins 插件数据筛选`marketplace.filter`，供插件管理后续处理使用。
  const marketplacePlugins = sources.marketplace.filter(p => {
    // 满足 `sessionNames.has(p.name)` 时，插件管理执行该分支。
    if (sessionNames.has(p.name)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin "${p.name}" from --plugin-dir overrides installed version`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  })
  // Session first, then non-overridden marketplace, then builtin.
  // Downstream first-match consumers see session plugins before
  // installed ones for any that slipped past the name filter.
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    plugins: [...sessionPlugins, ...marketplacePlugins, ...sources.builtin],
    errors,
  }
}

/**
 * Main plugin loading function that discovers and loads all plugins.
 *
 * This function is memoized to avoid repeated filesystem scanning and is
 * the primary entry point for the plugin system. It discovers plugins from
 * multiple sources and returns categorized results.
 *
 * Loading order and precedence (see mergePluginSources):
 * 1. Session-only plugins (from --plugin-dir CLI flag) — override
 *    installed plugins with the same name, UNLESS that plugin is
 *    locked by managed settings (policySettings, either force-enabled
 *    or force-disabled)
 * 2. Marketplace-based plugins (plugin@marketplace format from settings)
 * 3. Built-in plugins shipped with the CLI
 *
 * Name collision: session plugin wins over installed. The user explicitly
 * pointed at a directory for this session — that intent beats whatever
 * is installed. Exception: managed settings (enterprise policy) win over
 * --plugin-dir. Admin intent beats local dev convenience.
 *
 * Error collection:
 * - Non-fatal errors are collected and returned
 * - System continues loading other plugins on errors
 * - Errors include source information for debugging
 *
 * @returns Promise resolving to categorized plugin results:
 *   - enabled: Array of enabled LoadedPlugin objects
 *   - disabled: Array of disabled LoadedPlugin objects
 *   - errors: Array of loading errors with source information
 */
// loadAllPlugins 插件数据保存`memoize`，供插件管理后续处理使用。
export const loadAllPlugins = memoize(async (): Promise<PluginLoadResult> => {
  // 结果保存`assemblePluginLoadResult`，供插件管理后续处理使用。
  const result = await assemblePluginLoadResult(() =>
    loadPluginsFromMarketplaces({ cacheOnly: false }),
  )
  // A fresh full-load result is strictly valid for cache-only callers
  // (both variants share assemblePluginLoadResult). Warm the separate
  // memoize so refreshActivePlugins()'s downstream getPluginCommands() /
  // getAgentDefinitionsWithOverrides() — which now call
  // loadAllPluginsCacheOnly — see just-cloned plugins instead of reading
  // an installed_plugins.json that nothing writes mid-session.
  // 调用 loadAllPluginsCacheOnly.cache?.set(undefined, Promise.resolve(result))，完成这一处局部操作。
  loadAllPluginsCacheOnly.cache?.set(undefined, Promise.resolve(result))
  // 返回 `result`，作为插件管理这次计算的结果。
  return result
})

/**
 * Cache-only variant of loadAllPlugins.
 *
 * Same merge/dependency/settings logic, but the marketplace loader never
 * hits the network (no cachePlugin, no copyPluginToVersionedCache). Reads
 * from installed_plugins.json's installPath. Plugins not on disk emit
 * 'plugin-cache-miss' and are skipped.
 *
 * Use this in startup consumers (getCommands, loadPluginAgents, MCP/LSP
 * config) so interactive startup never blocks on git clones for ref-tracked
 * plugins. Use loadAllPlugins() in explicit refresh paths (/plugins,
 * refresh.ts, headlessPluginInstall) where fresh source is the intent.
 *
 * CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1 delegates to the full loader — that
 * mode explicitly opts into blocking install before first query, and
 * main.tsx's getClaudeCodeMcpConfigs()/getInitialSettings().agent run
 * BEFORE runHeadless() can warm this cache. First-run CCR/headless has
 * no installed_plugins.json, so cache-only would miss plugin MCP servers
 * and plugin settings (the agent key). The interactive startup win is
 * preserved since interactive mode doesn't set SYNC_PLUGIN_INSTALL.
 *
 * Separate memoize cache from loadAllPlugins — a cache-only result must
 * never satisfy a caller that wants fresh source. The reverse IS valid:
 * loadAllPlugins warms this cache on completion so refresh paths that run
 * the full loader don't get plugin-cache-miss from their downstream
 * cache-only consumers.
 */
// loadAllPluginsCacheOnly 插件数据保存`memoize`，供插件管理后续处理使用。
export const loadAllPluginsCacheOnly = memoize(
  async (): Promise<PluginLoadResult> => {
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL)` 时，插件管理执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL)) {
      // 返回 `loadAllPlugins()`，作为插件管理这次计算的结果。
      return loadAllPlugins()
    }
    // 返回 `assemblePluginLoadResult(() =>`，作为插件管理这次计算的结果。
    return assemblePluginLoadResult(() =>
      loadPluginsFromMarketplaces({ cacheOnly: true }),
    )
  },
)

/**
 * Shared body of loadAllPlugins and loadAllPluginsCacheOnly.
 *
 * The only difference between the two is which marketplace loader runs —
 * session plugins, builtins, merge, verifyAndDemote, and cachePluginSettings
 * are identical (invariants 1-3).
 */
// assemblePluginLoadResult 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function assemblePluginLoadResult(
  // 这个回调绑定到 marketplaceLoader: () => Promise<{，负责插件管理在该局部场景下的响应。
  marketplaceLoader: () => Promise<{
    plugins: LoadedPlugin[]
    errors: PluginError[]
  }>,
): Promise<PluginLoadResult> {
  // Load marketplace plugins and session-only plugins in parallel.
  // getInlinePlugins() is a synchronous state read with no dependency on
  // marketplace loading, so these two sources can be fetched concurrently.
  // inlinePlugins 插件数据读取`getInlinePlugins`，供插件管理后续处理使用。
  const inlinePlugins = getInlinePlugins()
  // 并行获取 marketplaceResult、sessionResult，缩短插件工具 plugin Loader等待多个独立异步任务的时间。
  const [marketplaceResult, sessionResult] = await Promise.all([
    marketplaceLoader(),
    inlinePlugins.length > 0
      ? loadSessionOnlyPlugins(inlinePlugins)
      : Promise.resolve({ plugins: [], errors: [] }),
  ])
  // 3. Load built-in plugins that ship with the CLI
  // builtinResult读取`getBuiltinPlugins`，供插件管理后续处理使用。
  const builtinResult = getBuiltinPlugins()

  // Session plugins (--plugin-dir) override installed ones by name,
  // UNLESS the installed plugin is locked by managed settings
  // (policySettings). See mergePluginSources() for details.
  // 从 `mergePluginSources({` 解构 plugins、errors，减少插件工具 plugin Loader对同一对象的重复访问。
  const { plugins: allPlugins, errors: mergeErrors } = mergePluginSources({
    session: sessionResult.plugins,
    marketplace: marketplaceResult.plugins,
    builtin: [...builtinResult.enabled, ...builtinResult.disabled],
    managedNames: getManagedPluginNames(),
  })
  // allErrors 错误信息 聚合成有序列表，保持后续遍历顺序稳定。
  const allErrors = [
    ...marketplaceResult.errors,
    ...sessionResult.errors,
    ...mergeErrors,
  ]

  // Verify dependencies. Runs AFTER the parallel load — deps are presence
  // checks, not load-order, so no topological sort needed. Demotion is
  // session-local: does NOT write settings (user fixes intent via /doctor).
  // 从 `verifyAndDemote(allPlugins)` 解构 demoted、errors，减少插件工具 plugin Loader对同一对象的重复访问。
  const { demoted, errors: depErrors } = verifyAndDemote(allPlugins)
  // 按顺序遍历 `allPlugins` 中的p，逐个交给插件管理处理。
  for (const p of allPlugins) {
    // 满足 `demoted.has(p.source)` 时，插件管理执行该分支。
    if (demoted.has(p.source)) p.enabled = false
  }
  // allErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
  allErrors.push(...depErrors)

  // enabledPlugins 插件数据筛选`allPlugins.filter`，供插件管理后续处理使用。
  const enabledPlugins = allPlugins.filter(p => p.enabled)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Found ${allPlugins.length} plugins (${enabledPlugins.length} enabled, ${allPlugins.length - enabledPlugins.length} disabled)`,
  )

  // 3. Cache plugin settings for synchronous access by the settings cascade
  // 调用 cachePluginSettings，触发插件管理此处需要的副作用。
  cachePluginSettings(enabledPlugins)

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    enabled: enabledPlugins,
    // 这个回调绑定到 disabled: allPlugins.filter(p => !p.enabled),，负责插件管理在该局部场景下的响应。
    disabled: allPlugins.filter(p => !p.enabled),
    errors: allErrors,
  }
}

/**
 * Clears the memoized plugin cache.
 *
 * Call this when plugins are installed, removed, or settings change
 * to force a fresh scan on the next loadAllPlugins call.
 *
 * Use cases:
 * - After installing/uninstalling plugins
 * - After modifying .claude-plugin/ directory (for export)
 * - After changing enabledPlugins settings
 * - When debugging plugin loading issues
 */
// clearPluginCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginCache(reason?: string): void {
  // 满足 `reason` 时，插件管理执行该分支。
  if (reason) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `clearPluginCache: invalidating loadAllPlugins cache (${reason})`,
    )
  }
  // 调用 loadAllPlugins.cache?.clear?.()，完成这一处局部操作。
  loadAllPlugins.cache?.clear?.()
  // 调用 loadAllPluginsCacheOnly.cache?.clear?.()，完成这一处局部操作。
  loadAllPluginsCacheOnly.cache?.clear?.()
  // If a plugin previously contributed settings, the session settings cache
  // holds a merged result that includes them. cachePluginSettings() on reload
  // won't bust the cache when the new base is empty (the startup perf win),
  // so bust it here to drop stale plugin overrides. When the base is already
  // undefined (startup, or no prior plugin settings) this is a no-op.
  // `getPluginSettingsBase()` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (getPluginSettingsBase() !== undefined) {
    // 调用 resetSettingsCache，触发插件管理此处需要的副作用。
    resetSettingsCache()
  }
  // 调用 clearPluginSettingsBase，触发插件管理此处需要的副作用。
  clearPluginSettingsBase()
  // TODO: Clear installed plugins cache when installedPluginsManager is implemented
}

/**
 * Merge settings from all enabled plugins into a single record.
 * Later plugins override earlier ones for the same key.
 * Only allowlisted keys are included (filtering happens at load time).
 */
// mergePluginSettings 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mergePluginSettings(
  plugins: LoadedPlugin[],
): Record<string, unknown> | undefined {
  // merged 先占位，稍后的条件分支会根据实际输入补齐它。
  let merged: Record<string, unknown> | undefined

  // 按顺序遍历 `plugins` 中的plugin 插件数据，逐个交给插件管理处理。
  for (const plugin of plugins) {
    // plugin.settings 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!plugin.settings) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // merged缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!merged) {
      // merged更新为 `{}`，确保插件工具后续读取最新状态。
      merged = {}
    }

    // 循环处理 `const [key, value] of Object.entries(plugin.settings)`，让插件管理把同类条目按顺序走完。
    for (const [key, value] of Object.entries(plugin.settings)) {
      // 满足 `key in merged` 时，插件管理执行该分支。
      if (key in merged) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin "${plugin.name}" overrides setting "${key}" (previously set by another plugin)`,
        )
      }
      // merged[key更新为 `value`，确保插件工具 plugin Loader后续读取最新状态。
      merged[key] = value
    }
  }

  // 返回 `merged`，作为插件管理这次计算的结果。
  return merged
}

/**
 * Store merged plugin settings in the synchronous cache.
 * Called after loadAllPlugins resolves.
 */
// cachePluginSettings 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cachePluginSettings(plugins: LoadedPlugin[]): void {
  // settings 集合保存`mergePluginSettings`，供插件管理后续处理使用。
  const settings = mergePluginSettings(plugins)
  // setPluginSettingsBase 写入新的状态值，使插件管理后续读取保持一致。
  setPluginSettingsBase(settings)
  // Only bust the session settings cache if there are actually plugin settings
  // to merge. In the common case (no plugins, or plugins without settings) the
  // base layer is empty and loadSettingsFromDisk would produce the same result
  // anyway — resetting here would waste ~17ms on startup re-reading and
  // re-validating every settings file on the next getSettingsWithErrors() call.
  // 只有 `settings && Object.keys(settings).length > 0` 满足时，插件管理才执行该分支。
  if (settings && Object.keys(settings).length > 0) {
    // 调用 resetSettingsCache，触发插件管理此处需要的副作用。
    resetSettingsCache()
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cached plugin settings with keys: ${Object.keys(settings).join(', ')}`,
    )
  }
}

/**
 * Type predicate: check if a value is a non-null, non-array object (i.e., a record).
 */
// isRecord 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRecord(value: unknown): value is Record<string, unknown> {
  // 返回 `typeof value === 'object' && value !== null && !Array.isArray(value)`，作为插件管理这次计算的结果。
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
