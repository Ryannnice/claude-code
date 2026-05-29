/**
 * Shared helper functions for plugin installation
 *
 * This module contains common utilities used across the plugin installation
 * system to reduce code duplication and improve maintainability.
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { rename, rm } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join, resolve, sep } from 'path'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../settings/settings.js'
// 引入 buildPluginTelemetryFields，将 ../telemetry/pluginTelemetry.js 中已经封装好的能力接到本文件流程里。
import { buildPluginTelemetryFields } from '../telemetry/pluginTelemetry.js'
// 引入 clearAllCaches，将 ./cacheUtils.js 中已经封装好的能力接到本文件流程里。
import { clearAllCaches } from './cacheUtils.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  formatDependencyCountSuffix,
  getEnabledPluginIdsForScope,
  type ResolutionResult,
  resolveDependencyClosure,
} from './dependencyResolver.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  addInstalledPlugin,
  getGitCommitSha,
} from './installedPluginsManager.js'
// 引入 getManagedPluginNames，将 ./managedPlugins.js 中已经封装好的能力接到本文件流程里。
import { getManagedPluginNames } from './managedPlugins.js'
// 引入 getMarketplaceCacheOnly、getPluginById，将 ./marketplaceManager.js 中已经封装好的能力接到本文件流程里。
import { getMarketplaceCacheOnly, getPluginById } from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  isOfficialMarketplaceName,
  parsePluginIdentifier,
  scopeToSettingSource,
} from './pluginIdentifier.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  cachePlugin,
  getVersionedCachePath,
  getVersionedZipCachePath,
} from './pluginLoader.js'
// 引入 isPluginBlockedByPolicy，将 ./pluginPolicy.js 中已经封装好的能力接到本文件流程里。
import { isPluginBlockedByPolicy } from './pluginPolicy.js'
// 引入 calculatePluginVersion，将 ./pluginVersioning.js 中已经封装好的能力接到本文件流程里。
import { calculatePluginVersion } from './pluginVersioning.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  isLocalPluginSource,
  type PluginMarketplaceEntry,
  type PluginScope,
  type PluginSource,
} from './schemas.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  convertDirectoryToZipInPlace,
  isPluginZipCacheEnabled,
} from './zipCache.js'

/**
 * Plugin installation metadata for installed_plugins.json
 */
// PluginInstallationInfo 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginInstallationInfo = {
  pluginId: string
  installPath: string
  version?: string
}

/**
 * Get current ISO timestamp
 */
// getCurrentTimestamp 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentTimestamp(): string {
  // 返回 `new Date().toISOString()`，作为插件管理这次计算的结果。
  return new Date().toISOString()
}

/**
 * Validate that a resolved path stays within a base directory.
 * Prevents path traversal attacks where malicious paths like './../../../etc/passwd'
 * could escape the expected directory.
 *
 * @param basePath - The base directory that the resolved path must stay within
 * @param relativePath - The relative path to validate
 * @returns The validated absolute path
 * @throws Error if the path would escape the base directory
 */
// validatePathWithinBase 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validatePathWithinBase(
  basePath: string,
  relativePath: string,
): string {
  // resolvedPath 路径数据读取`resolve`，供插件管理后续处理使用。
  const resolvedPath = resolve(basePath, relativePath)
  // normalizedBase读取`resolve`，供插件管理后续处理使用。
  const normalizedBase = resolve(basePath) + sep

  // Check if the resolved path starts with the base path
  // Adding sep ensures we don't match partial directory names
  // e.g., /foo/bar should not match /foo/barbaz
  // 插件管理在这里按实际状态进入对应分支。
  if (
    !resolvedPath.startsWith(normalizedBase) &&
    resolvedPath !== resolve(basePath)
  ) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Path traversal detected: "${relativePath}" would escape the base directory`,
    )
  }

  // 返回 `resolvedPath`，作为插件管理这次计算的结果。
  return resolvedPath
}

/**
 * Cache a plugin (local or external) and add it to installed_plugins.json
 *
 * This function combines the common pattern of:
 * 1. Caching a plugin to ~/.claude/plugins/cache/
 * 2. Adding it to the installed plugins registry
 *
 * Both local plugins (with string source like "./path") and external plugins
 * (with object source like {source: "github", ...}) are cached to the same
 * location to ensure consistent behavior.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @param entry - Plugin marketplace entry
 * @param scope - Installation scope (user, project, local, or managed). Defaults to 'user'.
 *                'managed' scope is used for plugins installed automatically from managed settings.
 * @param projectPath - Project path (required for project/local scopes)
 * @param localSourcePath - For local plugins, the resolved absolute path to the source directory
 * @returns The installation path
 */
// cacheAndRegisterPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cacheAndRegisterPlugin(
  pluginId: string,
  entry: PluginMarketplaceEntry,
  scope: PluginScope = 'user',
  projectPath?: string,
  localSourcePath?: string,
): Promise<string> {
  // For local plugins, we need the resolved absolute path
  // Cast to PluginSource since cachePlugin handles any string path at runtime
  // source 先占位，稍后的条件分支会根据实际输入补齐它。
  const source: PluginSource =
    typeof entry.source === 'string' && localSourcePath
      ? (localSourcePath as PluginSource)
      : entry.source

  // cacheResult 缓存保存`cachePlugin`，供插件管理后续处理使用。
  const cacheResult = await cachePlugin(source, {
    manifest: entry as PluginMarketplaceEntry,
  })

  // For local plugins, use the original source path for Git SHA calculation
  // because the cached temp directory doesn't have .git (it's copied from a
  // subdirectory of the marketplace git repo). For external plugins, use the
  // cached path. For git-subdir sources, cachePlugin already captured the SHA
  // before discarding the ephemeral clone (the extracted subdir has no .git).
  // pathForGitSha 路径数据标记插件工具 plugin Installation Help...是否启用对应路径。
  const pathForGitSha = localSourcePath || cacheResult.path
  // gitCommitSha 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const gitCommitSha =
    cacheResult.gitCommitSha ?? (await getGitCommitSha(pathForGitSha))

  // now读取`getCurrentTimestamp`，供插件管理后续处理使用。
  const now = getCurrentTimestamp()
  // version保存`calculatePluginVersion`，供插件管理后续处理使用。
  const version = await calculatePluginVersion(
    pluginId,
    entry.source,
    cacheResult.manifest,
    pathForGitSha,
    entry.version,
    cacheResult.gitCommitSha,
  )

  // Move the cached plugin to the versioned path: cache/marketplace/plugin/version/
  // versionedPath 路径数据读取`getVersionedCachePath`，供插件管理后续处理使用。
  const versionedPath = getVersionedCachePath(pluginId, version)
  // finalPath 路径数据保存`cacheResult.path`，供后续判断或组装使用。
  let finalPath = cacheResult.path

  // Only move if the paths are different and plugin was cached to a different location
  // `cacheResult.path` 与 `versionedPath` 不一致时刷新派生状态，避免使用过期结果。
  if (cacheResult.path !== versionedPath) {
    // Create the versioned directory structure
    // 等待 `getFsImplementation().mkdir(dirname(versionedPath))` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
    await getFsImplementation().mkdir(dirname(versionedPath))

    // Remove existing versioned path if present (force: no-op if missing)
    // 等待 `rm(versionedPath, { recursive: true, force: true })` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
    await rm(versionedPath, { recursive: true, force: true })

    // Check if versionedPath is a subdirectory of cacheResult.path
    // This happens when marketplace name equals plugin name (e.g., "exa-mcp-server@exa-mcp-server")
    // In this case, we can't directly rename because we'd be moving a directory into itself
    // normalizedCachePath 路径数据保存`path.endsWith`，供插件管理后续处理使用。
    const normalizedCachePath = cacheResult.path.endsWith(sep)
      ? cacheResult.path
      : cacheResult.path + sep
    // isSubdirectory记录 `versionedPath.startsWith` 是否成立，插件管理随后按该结果分支。
    const isSubdirectory = versionedPath.startsWith(normalizedCachePath)

    // 满足 `isSubdirectory` 时，插件管理执行该分支。
    if (isSubdirectory) {
      // Move to a temp location first, then to final destination
      // We can't directly rename/copy a directory into its own subdirectory
      // Use the parent of cacheResult.path (same filesystem) to avoid EXDEV
      // errors when /tmp is on a different filesystem (e.g., tmpfs)
      // tempPath 路径数据格式化`join`，供插件管理后续处理使用。
      const tempPath = join(
        dirname(cacheResult.path),
        `.claude-plugin-temp-${Date.now()}-${randomBytes(4).toString('hex')}`,
      )
      // 等待 `rename(cacheResult.path, tempPath)` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
      await rename(cacheResult.path, tempPath)
      // 等待 `getFsImplementation().mkdir(dirname(versionedPath))` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
      await getFsImplementation().mkdir(dirname(versionedPath))
      // 等待 `rename(tempPath, versionedPath)` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
      await rename(tempPath, versionedPath)
    } else {
      // Move the cached plugin to the versioned location
      // 等待 `rename(cacheResult.path, versionedPath)` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
      await rename(cacheResult.path, versionedPath)
    }
    // finalPath 路径数据更新为 `versionedPath`，确保插件工具后续读取最新状态。
    finalPath = versionedPath
  }

  // Zip cache mode: convert directory to ZIP and remove the directory
  // 满足 `isPluginZipCacheEnabled()` 时，插件管理执行该分支。
  if (isPluginZipCacheEnabled()) {
    // zipPath 路径数据读取`getVersionedZipCachePath`，供插件管理后续处理使用。
    const zipPath = getVersionedZipCachePath(pluginId, version)
    // 等待 `convertDirectoryToZipInPlace(finalPath, zipPath)` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
    await convertDirectoryToZipInPlace(finalPath, zipPath)
    // finalPath 路径数据更新为 `zipPath`，确保插件工具后续读取最新状态。
    finalPath = zipPath
  }

  // Add to both V1 and V2 installed_plugins files with correct scope
  // 调用 addInstalledPlugin，触发插件管理此处需要的副作用。
  addInstalledPlugin(
    pluginId,
    {
      version,
      installedAt: now,
      lastUpdated: now,
      installPath: finalPath,
      gitCommitSha,
    },
    scope,
    projectPath,
  )

  // 返回 `finalPath`，作为插件管理这次计算的结果。
  return finalPath
}

/**
 * Register a plugin installation without caching
 *
 * Used for local plugins that are already on disk and don't need remote caching.
 * External plugins should use cacheAndRegisterPlugin() instead.
 *
 * @param info - Plugin installation information
 * @param scope - Installation scope (user, project, local, or managed). Defaults to 'user'.
 *                'managed' scope is used for plugins registered from managed settings.
 * @param projectPath - Project path (required for project/local scopes)
 */
// registerPluginInstallation 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerPluginInstallation(
  info: PluginInstallationInfo,
  scope: PluginScope = 'user',
  projectPath?: string,
): void {
  // now读取`getCurrentTimestamp`，供插件管理后续处理使用。
  const now = getCurrentTimestamp()
  // 调用 addInstalledPlugin，触发插件管理此处需要的副作用。
  addInstalledPlugin(
    info.pluginId,
    {
      version: info.version || 'unknown',
      installedAt: now,
      lastUpdated: now,
      installPath: info.installPath,
    },
    scope,
    projectPath,
  )
}

/**
 * Parse plugin ID into components
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @returns Parsed components or null if invalid
 */
// parsePluginId 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parsePluginId(
  pluginId: string,
): { name: string; marketplace: string } | null {
  // 片段列表格式化`pluginId.split`，供插件管理后续处理使用。
  const parts = pluginId.split('@')
  // `parts.length` 与 `2 || !parts[0] || !parts[1]` 不一致时刷新派生状态，避免使用过期结果。
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    name: parts[0],
    marketplace: parts[1],
  }
}

/**
 * Structured result from the install core. Wrappers format messages and
 * handle analytics/error-catching around this.
 */
// InstallCoreResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallCoreResult =
  | { ok: true; closure: string[]; depNote: string }
  | { ok: false; reason: 'local-source-no-location'; pluginName: string }
  | { ok: false; reason: 'settings-write-failed'; message: string }
  | {
      ok: false
      reason: 'resolution-failed'
      resolution: ResolutionResult & { ok: false }
    }
  | { ok: false; reason: 'blocked-by-policy'; pluginName: string }
  | {
      ok: false
      reason: 'dependency-blocked-by-policy'
      pluginName: string
      blockedDependency: string
    }

/**
 * Format a failed ResolutionResult into a user-facing message. Unified on
 * the richer CLI messages (the "Is the X marketplace added?" hint is useful
 * for UI users too).
 */
// formatResolutionError 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatResolutionError(
  r: ResolutionResult & { ok: false },
): string {
  // 按照 r.reason 的取值选择插件管理的具体处理分支。
  switch (r.reason) {
    case 'cycle':
      // 返回 ``Dependency cycle: ${r.chain.join(' → ')}``，作为插件管理这次计算的结果。
      return `Dependency cycle: ${r.chain.join(' → ')}`
    case 'cross-marketplace': {
      // depMkt解析`parsePluginIdentifier`，供插件管理后续处理使用。
      const depMkt = parsePluginIdentifier(r.dependency).marketplace
      // where保存`depMkt`，供后续判断或组装使用。
      const where = depMkt
        ? `marketplace "${depMkt}"`
        : 'a different marketplace'
      // hint保存`depMkt`，供插件工具 plugin Installation Help...后续判断或输出使用。
      const hint = depMkt
        ? ` Add "${depMkt}" to allowCrossMarketplaceDependenciesOn in the ROOT marketplace's marketplace.json (the marketplace of the plugin you're installing — only its allowlist applies; no transitive trust).`
        : ''
      // 返回 ``Dependency "${r.dependency}" (required by ${r.requiredBy}) is in ${whe...`，作为插件管理这次计算的结果。
      return `Dependency "${r.dependency}" (required by ${r.requiredBy}) is in ${where}, which is not in the allowlist — cross-marketplace dependencies are blocked by default. Install it manually first.${hint}`
    }
    case 'not-found': {
      // 从 `parsePluginIdentifier(r.missing)` 解构 marketplace，减少插件工具 plugin Installation Helpers对同一对象的重复访问。
      const { marketplace: depMkt } = parsePluginIdentifier(r.missing)
      // 返回 `depMkt`，作为插件管理这次计算的结果。
      return depMkt
        ? `Dependency "${r.missing}" (required by ${r.requiredBy}) not found. Is the "${depMkt}" marketplace added?`
        : `Dependency "${r.missing}" (required by ${r.requiredBy}) not found in any configured marketplace`
    }
  }
}

/**
 * Core plugin install logic, shared by the CLI path (`installPluginOp`) and
 * the interactive UI path (`installPluginFromMarketplace`). Given a
 * pre-resolved marketplace entry, this:
 *
 *   1. Guards against local-source plugins without a marketplace install
 *      location (would silently no-op otherwise).
 *   2. Resolves the transitive dependency closure (when PLUGIN_DEPENDENCIES
 *      is on; trivial single-plugin closure otherwise).
 *   3. Writes the entire closure to enabledPlugins in one settings update.
 *   4. Caches each closure member (downloads/copies sources as needed).
 *   5. Clears memoization caches.
 *
 * Returns a structured result. Message formatting, analytics, and top-level
 * error wrapping stay in the caller-specific wrappers.
 *
 * @param marketplaceInstallLocation Pass this if the caller already has it
 *   (from a prior marketplace search) to avoid a redundant lookup.
 */
// installResolvedPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installResolvedPlugin({
  pluginId,
  entry,
  scope,
  marketplaceInstallLocation,
}: {
  pluginId: string
  entry: PluginMarketplaceEntry
  scope: 'user' | 'project' | 'local'
  marketplaceInstallLocation?: string
}): Promise<InstallCoreResult> {
  // settingSource保存`scopeToSettingSource`，供插件管理后续处理使用。
  const settingSource = scopeToSettingSource(scope)

  // ── Policy guard ──
  // Org-blocked plugins (managed-settings.json enabledPlugins: false) cannot
  // be installed. Checked here so all install paths (CLI, UI, hint-triggered)
  // are covered in one place.
  // 满足 `isPluginBlockedByPolicy(pluginId)` 时，插件管理执行该分支。
  if (isPluginBlockedByPolicy(pluginId)) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { ok: false, reason: 'blocked-by-policy', pluginName: entry.name }
  }

  // ── Resolve dependency closure ──
  // depInfo caches marketplace lookups so the materialize loop doesn't
  // re-fetch. Seed the root if the caller gave us its install location.
  // depInfo构建`new Map<`，供后续判断或组装使用。
  const depInfo = new Map<
    string,
    { entry: PluginMarketplaceEntry; marketplaceInstallLocation: string }
  >()
  // Without this guard, a local-source root with undefined
  // marketplaceInstallLocation falls through: depInfo isn't seeded, the
  // materialize loop's `if (!info) continue` skips the root, and the user
  // sees "Successfully installed" while nothing is cached.
  // 只有 `isLocalPluginSource(entry.source) && !marketplaceInstallLocation` 满足时，插件管理才执行该分支。
  if (isLocalPluginSource(entry.source) && !marketplaceInstallLocation) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ok: false,
      reason: 'local-source-no-location',
      pluginName: entry.name,
    }
  }
  // 满足 `marketplaceInstallLocation` 时，插件管理执行该分支。
  if (marketplaceInstallLocation) {
    // depInfo.set 写入新的状态值，使插件管理后续读取保持一致。
    depInfo.set(pluginId, { entry, marketplaceInstallLocation })
  }

  // rootMarketplace 市场数据解析`parsePluginIdentifier`，供插件管理后续处理使用。
  const rootMarketplace = parsePluginIdentifier(pluginId).marketplace
  // allowedCrossMarketplaces 市场数据保存`Set`，供插件管理后续处理使用。
  const allowedCrossMarketplaces = new Set(
    (rootMarketplace
      ? (await getMarketplaceCacheOnly(rootMarketplace))
          ?.allowCrossMarketplaceDependenciesOn
      : undefined) ?? [],
  )
  // resolution读取`resolveDependencyClosure`，供插件管理后续处理使用。
  const resolution = await resolveDependencyClosure(
    pluginId,
    // 这个回调绑定到 async id => {，负责插件管理在该局部场景下的响应。
    async id => {
      // 满足 `depInfo.has(id)) return depInfo.get(id` 时，插件管理执行该分支。
      if (depInfo.has(id)) return depInfo.get(id)!.entry
      // 满足 `id === pluginId` 时，插件管理执行该分支。
      if (id === pluginId) return entry
      // info读取`getPluginById`，供插件管理后续处理使用。
      const info = await getPluginById(id)
      // 满足 `info) depInfo.set(id, info` 时，插件管理执行该分支。
      if (info) depInfo.set(id, info)
      // 返回 `info?.entry ?? null`，作为插件管理这次计算的结果。
      return info?.entry ?? null
    },
    getEnabledPluginIdsForScope(settingSource),
    allowedCrossMarketplaces,
  )
  // resolution.ok缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!resolution.ok) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { ok: false, reason: 'resolution-failed', resolution }
  }

  // ── Policy guard for transitive dependencies ──
  // The root plugin was already checked above, but any dependency in the
  // closure could also be policy-blocked. Check before writing to settings
  // so a non-blocked plugin can't pull in a blocked dependency.
  // 按顺序遍历 `resolution.closure` 中的标识符，逐个交给插件管理处理。
  for (const id of resolution.closure) {
    // `id` 与 `pluginId && isPluginBlockedByPo...` 不一致时刷新派生状态，避免使用过期结果。
    if (id !== pluginId && isPluginBlockedByPolicy(id)) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        ok: false,
        reason: 'dependency-blocked-by-policy',
        pluginName: entry.name,
        blockedDependency: id,
      }
    }
  }

  // ── ACTION: write entire closure to settings in one call ──
  // closureEnabled 从空对象开始收集键值，后续按名称补齐内容。
  const closureEnabled: Record<string, true> = {}
  // 逐项读取 `resolution.closure` 中的标识符，按输入顺序推进插件管理。
  for (const id of resolution.closure) closureEnabled[id] = true
  // 从 `updateSettingsForSource(settingSource, {` 解构 error，减少插件工具 plugin Installation Helpers对同一对象的重复访问。
  const { error } = updateSettingsForSource(settingSource, {
    enabledPlugins: {
      ...getSettingsForSource(settingSource)?.enabledPlugins,
      ...closureEnabled,
    },
  })
  // 满足 `error` 时，插件管理执行该分支。
  if (error) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ok: false,
      reason: 'settings-write-failed',
      message: error.message,
    }
  }

  // ── Materialize: cache each closure member ──
  // projectPath 路径数据读取`getCwd`，供插件管理后续处理使用。
  const projectPath = scope !== 'user' ? getCwd() : undefined
  // 按顺序遍历 `resolution.closure` 中的标识符，逐个交给插件管理处理。
  for (const id of resolution.closure) {
    // info读取`depInfo.get`，供插件管理后续处理使用。
    let info = depInfo.get(id)
    // Root wasn't pre-seeded (caller didn't pass marketplaceInstallLocation
    // for a non-local source). Fetch now; it's needed for the cache write.
    // 只有 `!info && id === pluginId` 满足时，插件管理才执行该分支。
    if (!info && id === pluginId) {
      // mktLocation读取`getPluginById`，供插件管理后续处理使用。
      const mktLocation = (await getPluginById(id))?.marketplaceInstallLocation
      // 满足 `mktLocation` 时，插件管理执行该分支。
      if (mktLocation) info = { entry, marketplaceInstallLocation: mktLocation }
    }
    // info缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!info) continue

    // localSourcePath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let localSourcePath: string | undefined
    // 从 `info.entry` 解构 source，减少插件工具 plugin Installation Helpers对同一对象的重复访问。
    const { source } = info.entry
    // 满足 `isLocalPluginSource(source)` 时，插件管理执行该分支。
    if (isLocalPluginSource(source)) {
      // localSourcePath 路径数据更新为 `validatePathWithinBase(`，确保插件工具后续读取最新状态。
      localSourcePath = validatePathWithinBase(
        info.marketplaceInstallLocation,
        source,
      )
    }
    // 等待 `cacheAndRegisterPlugin(` 完成，再继续插件工具 plugin Installation Helpers的异步流程。
    await cacheAndRegisterPlugin(
      id,
      info.entry,
      scope,
      projectPath,
      localSourcePath,
    )
  }

  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearAllCaches()

  // depNote格式化`formatDependencyCountSuffix`，供插件管理后续处理使用。
  const depNote = formatDependencyCountSuffix(
    // 调用 resolution.closure.filter，触发插件管理此处需要的副作用。
    resolution.closure.filter(id => id !== pluginId),
  )
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { ok: true, closure: resolution.closure, depNote }
}

/**
 * Result of a plugin installation operation
 */
// InstallPluginResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallPluginResult =
  | { success: true; message: string }
  | { success: false; error: string }

/**
 * Parameters for installing a plugin from marketplace
 */
// InstallPluginParams 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallPluginParams = {
  pluginId: string
  entry: PluginMarketplaceEntry
  marketplaceName: string
  scope?: 'user' | 'project' | 'local'
  trigger?: 'hint' | 'user'
}

/**
 * Install a single plugin from a marketplace with the specified scope.
 * Interactive-UI wrapper around `installResolvedPlugin` — adds try/catch,
 * analytics, and UI-style message formatting.
 */
// installPluginFromMarketplace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installPluginFromMarketplace({
  pluginId,
  entry,
  marketplaceName,
  scope = 'user',
  trigger = 'user',
}: InstallPluginParams): Promise<InstallPluginResult> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Look up the marketplace install location for local-source plugins.
    // Without this, plugins with relative-path sources fail from the
    // interactive UI path (/plugin install) even though the CLI path works.
    // pluginInfo 插件数据读取`getPluginById`，供插件管理后续处理使用。
    const pluginInfo = await getPluginById(pluginId)
    // marketplaceInstallLocation 市场数据保存`pluginInfo?.marketplaceInstallLocation`，供插件工具 plugin Installation Help...后续判断或输出使用。
    const marketplaceInstallLocation = pluginInfo?.marketplaceInstallLocation

    // 结果保存`installResolvedPlugin`，供插件管理后续处理使用。
    const result = await installResolvedPlugin({
      pluginId,
      entry,
      scope,
      marketplaceInstallLocation,
    })

    // result.ok缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!result.ok) {
      // 按照 result.reason 的取值选择插件管理的具体处理分支。
      switch (result.reason) {
        case 'local-source-no-location':
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return {
            success: false,
            error: `Cannot install local plugin "${result.pluginName}" without marketplace install location`,
          }
        case 'settings-write-failed':
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return {
            success: false,
            error: `Failed to update settings: ${result.message}`,
          }
        case 'resolution-failed':
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return {
            success: false,
            error: formatResolutionError(result.resolution),
          }
        case 'blocked-by-policy':
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return {
            success: false,
            error: `Plugin "${result.pluginName}" is blocked by your organization's policy and cannot be installed`,
          }
        case 'dependency-blocked-by-policy':
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return {
            success: false,
            error: `Cannot install "${result.pluginName}": dependency "${result.blockedDependency}" is blocked by your organization's policy`,
          }
      }
    }

    // _PROTO_* routes to PII-tagged plugin_name/marketplace_name BQ columns.
    // plugin_id kept in additional_metadata (redacted to 'third-party' for
    // non-official) because dbt external_claude_code_plugin_installs.sql
    // extracts $.plugin_id for official-marketplace install tracking. Other
    // plugin lifecycle events drop the blob key — no downstream consumers.
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_installed', {
      _PROTO_plugin_name:
        entry.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      _PROTO_marketplace_name:
        marketplaceName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      plugin_id: (isOfficialMarketplaceName(marketplaceName)
        ? pluginId
        : 'third-party') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      trigger:
        trigger as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      install_source: (trigger === 'hint'
        ? 'ui-suggestion'
        : 'ui-discover') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...buildPluginTelemetryFields(
        entry.name,
        marketplaceName,
        getManagedPluginNames(),
      ),
      ...(entry.version && {
        version:
          entry.version as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    })

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: true,
      message: `✓ Installed ${entry.name}${result.depNote}. Run /reload-plugins to activate.`,
    }
  } catch (err) {
    // errorMessage 消息数据保存`String`，供插件管理后续处理使用。
    const errorMessage = err instanceof Error ? err.message : String(err)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(toError(err))
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { success: false, error: `Failed to install: ${errorMessage}` }
  }
}
