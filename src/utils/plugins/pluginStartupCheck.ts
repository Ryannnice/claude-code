// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 类型依赖 { SettingSource } 来自 ../settings/constants.js，用于校准插件管理的数据契约。
import type { SettingSource } from '../settings/constants.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getSettingsForSource,
  updateSettingsForSource,
} from '../settings/settings.js'
// 引入 getAddDirEnabledPlugins，将 ./addDirPluginSettings.js 中已经封装好的能力接到本文件流程里。
import { getAddDirEnabledPlugins } from './addDirPluginSettings.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getInMemoryInstalledPlugins,
  migrateFromEnabledPlugins,
} from './installedPluginsManager.js'
// 引入 getPluginById，将 ./marketplaceManager.js 中已经封装好的能力接到本文件流程里。
import { getPluginById } from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type ExtendedPluginScope,
  type PersistablePluginScope,
  SETTING_SOURCE_TO_SCOPE,
  scopeToSettingSource,
} from './pluginIdentifier.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  cacheAndRegisterPlugin,
  registerPluginInstallation,
} from './pluginInstallationHelpers.js'
// 引入 isLocalPluginSource、PluginScope，将 ./schemas.js 中已经封装好的能力接到本文件流程里。
import { isLocalPluginSource, type PluginScope } from './schemas.js'

/**
 * Checks for enabled plugins across all settings sources, including --add-dir.
 *
 * Uses getInitialSettings() which merges all sources with policy as
 * highest priority, then layers --add-dir plugins underneath. This is the
 * authoritative "is this plugin enabled?" check — don't delegate to
 * getPluginEditableScopes() which serves a different purpose (scope tracking).
 *
 * @returns Array of plugin IDs (plugin@marketplace format) that are enabled
 */
// checkEnabledPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkEnabledPlugins(): Promise<string[]> {
  // settings 集合读取`getInitialSettings`，供插件管理后续处理使用。
  const settings = getInitialSettings()
  // enabledPlugins 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const enabledPlugins: string[] = []

  // Start with --add-dir plugins (lowest priority)
  // addDirPlugins 插件数据读取`getAddDirEnabledPlugins`，供插件管理后续处理使用。
  const addDirPlugins = getAddDirEnabledPlugins()
  // 循环处理 `const [pluginId, value] of Object.entries(addDirPlugins)`，让插件管理把同类条目按顺序走完。
  for (const [pluginId, value] of Object.entries(addDirPlugins)) {
    // 只有 `pluginId.includes('@') && value` 满足时，插件管理才执行该分支。
    if (pluginId.includes('@') && value) {
      // enabledPlugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
      enabledPlugins.push(pluginId)
    }
  }

  // Merged settings (policy > local > project > user) override --add-dir
  // 满足 `settings.enabledPlugins` 时，插件管理执行该分支。
  if (settings.enabledPlugins) {
    // 循环处理 `const [pluginId, value] of Object.entries(settings.enabledPlugins)`，让插件管理把同类条目按顺序走完。
    for (const [pluginId, value] of Object.entries(settings.enabledPlugins)) {
      // 满足 `!pluginId.includes('@')` 时，插件管理执行该分支。
      if (!pluginId.includes('@')) {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // idx保存`enabledPlugins.indexOf`，供插件管理后续处理使用。
      const idx = enabledPlugins.indexOf(pluginId)
      // 满足 `value` 时，插件管理执行该分支。
      if (value) {
        // 满足 `idx === -1` 时，插件管理执行该分支。
        if (idx === -1) {
          // enabledPlugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
          enabledPlugins.push(pluginId)
        }
      } else {
        // Explicitly disabled — remove even if --add-dir enabled it
        // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
        if (idx !== -1) {
          // 调用 enabledPlugins.splice，触发插件管理此处需要的副作用。
          enabledPlugins.splice(idx, 1)
        }
      }
    }
  }

  // 返回 `enabledPlugins`，作为插件管理这次计算的结果。
  return enabledPlugins
}

/**
 * Gets the user-editable scope that "owns" each enabled plugin.
 *
 * Used for scope tracking: determining where to write back when a user
 * enables/disables a plugin. Managed (policy) settings are processed first
 * (lowest priority) because the user cannot edit them — the scope should
 * resolve to the highest user-controllable source.
 *
 * NOTE: This is NOT the authoritative "is this plugin enabled?" check.
 * Use checkEnabledPlugins() for that — it uses merged settings where
 * policy has highest priority and can block user-enabled plugins.
 *
 * Precedence (lowest to highest):
 * 0. addDir (--add-dir directories) - session-only, lowest priority
 * 1. managed (policySettings) - not user-editable
 * 2. user (userSettings)
 * 3. project (projectSettings)
 * 4. local (localSettings)
 * 5. flag (flagSettings) - session-only, not persisted
 *
 * @returns Map of plugin ID to the user-editable scope that owns it
 */
// getPluginEditableScopes 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginEditableScopes(): Map<string, ExtendedPluginScope> {
  // 结果构建`new Map<string, ExtendedPluginScope>()` 整理出中间结果，供插件工具 plugin Startup Check后续步骤使用。
  const result = new Map<string, ExtendedPluginScope>()

  // Process --add-dir directories FIRST (lowest priority, overridden by all standard sources)
  // addDirPlugins 插件数据读取`getAddDirEnabledPlugins`，供插件管理后续处理使用。
  const addDirPlugins = getAddDirEnabledPlugins()
  // 循环处理 `const [pluginId, value] of Object.entries(addDirPlugins)`，让插件管理把同类条目按顺序走完。
  for (const [pluginId, value] of Object.entries(addDirPlugins)) {
    // 满足 `!pluginId.includes('@')` 时，插件管理执行该分支。
    if (!pluginId.includes('@')) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }
    // 满足 `value === true` 时，插件管理执行该分支。
    if (value === true) {
      // result.set 写入新的状态值，使插件管理后续读取保持一致。
      result.set(pluginId, 'flag') // 'flag' scope = session-only, no write-back
    // 插件工具 plugin Startup Check在这里处理 `} else if (value === false) {`，完成这一小步状态转换。
    } else if (value === false) {
      // 调用 result.delete，触发插件管理此处需要的副作用。
      result.delete(pluginId)
    }
  }

  // Process standard sources in precedence order (later overrides earlier)
  // scopeSources 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const scopeSources: Array<{
    scope: ExtendedPluginScope
    source: SettingSource
  }> = [
    { scope: 'managed', source: 'policySettings' },
    { scope: 'user', source: 'userSettings' },
    { scope: 'project', source: 'projectSettings' },
    { scope: 'local', source: 'localSettings' },
    { scope: 'flag', source: 'flagSettings' },
  ]

  // 循环处理 `const { scope, source } of scopeSources`，让插件管理逐项把同类条目按顺序走完。
  for (const { scope, source } of scopeSources) {
    // settings 集合读取`getSettingsForSource`，供插件管理后续处理使用。
    const settings = getSettingsForSource(source)
    // 满足 `!settings?.enabledPlugins` 时，插件管理执行该分支。
    if (!settings?.enabledPlugins) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // 循环处理 `const [pluginId, value] of Object.entries(settings.enabledPlugins)`，让插件管理把同类条目按顺序走完。
    for (const [pluginId, value] of Object.entries(settings.enabledPlugins)) {
      // Skip invalid format
      // 满足 `!pluginId.includes('@')` 时，插件管理执行该分支。
      if (!pluginId.includes('@')) {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // Log when a standard source overrides an --add-dir plugin
      // 只有 `pluginId in addDirPlugins && addDirPlugins[plugin` 满足时，插件管理才执行该分支。
      if (pluginId in addDirPlugins && addDirPlugins[pluginId] !== value) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin ${pluginId} from --add-dir (${addDirPlugins[pluginId]}) overridden by ${source} (${value})`,
        )
      }

      // 满足 `value === true` 时，插件管理执行该分支。
      if (value === true) {
        // Plugin enabled at this scope
        // result.set 写入新的状态值，使插件管理后续读取保持一致。
        result.set(pluginId, scope)
      // 插件工具 plugin Startup Check在这里处理 `} else if (value === false) {`，完成这一小步状态转换。
      } else if (value === false) {
        // Explicitly disabled - remove from result
        // 调用 result.delete，触发插件管理此处需要的副作用。
        result.delete(pluginId)
      }
      // Note: Other values (like version strings for future P2) are ignored for now
    }
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Found ${result.size} enabled plugins with scopes: ${Array.from(
      result.entries(),
    )
      .map(([id, scope]) => `${id}(${scope})`)
      .join(', ')}`,
  )

  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

/**
 * Check if a scope is persistable (not session-only).
 * @param scope The scope to check
 * @returns true if the scope should be persisted to installed_plugins.json
 */
// isPersistableScope 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPersistableScope(
  scope: ExtendedPluginScope,
): scope is PersistablePluginScope {
  // 返回 `scope !== 'flag'`，作为插件管理这次计算的结果。
  return scope !== 'flag'
}

/**
 * Convert SettingSource to plugin scope.
 * @param source The settings source
 * @returns The corresponding plugin scope
 */
// settingSourceToScope 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function settingSourceToScope(
  source: SettingSource,
): ExtendedPluginScope {
  // 返回 `SETTING_SOURCE_TO_SCOPE[source]`，作为插件管理这次计算的结果。
  return SETTING_SOURCE_TO_SCOPE[source]
}

/**
 * Gets the list of currently installed plugins
 * Reads from installed_plugins.json which tracks global installation state.
 * Automatically runs migration on first call if needed.
 *
 * Always uses V2 format and initializes the in-memory session state
 * (which triggers V1→V2 migration if needed).
 *
 * @returns Array of installed plugin IDs
 */
// getInstalledPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getInstalledPlugins(): Promise<string[]> {
  // Trigger sync in background (don't await - don't block startup)
  // This syncs enabledPlugins from settings.json to installed_plugins.json
  // 这个回调绑定到 void migrateFromEnabledPlugins().catch(error => {，负责插件管理在该局部场景下的响应。
  void migrateFromEnabledPlugins().catch(error => {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
  })

  // Always use V2 format - initializes in-memory session state and triggers V1→V2 migration
  // v2Data读取`getInMemoryInstalledPlugins`，供插件管理后续处理使用。
  const v2Data = getInMemoryInstalledPlugins()
  // installed派生`Object.keys`，供插件管理后续处理使用。
  const installed = Object.keys(v2Data.plugins)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Found ${installed.length} installed plugins`)
  // 返回 `installed`，作为插件管理这次计算的结果。
  return installed
}

/**
 * Finds plugins that are enabled but not installed
 * @param enabledPlugins Array of enabled plugin IDs
 * @returns Array of missing plugin IDs
 */
// findMissingPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findMissingPlugins(
  enabledPlugins: string[],
): Promise<string[]> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // installedPlugins 插件数据读取`getInstalledPlugins`，供插件管理后续处理使用。
    const installedPlugins = await getInstalledPlugins()

    // Filter to not-installed synchronously, then look up all in parallel.
    // Results are collected in original enabledPlugins order.
    // notInstalled筛选`enabledPlugins.filter`，供插件管理后续处理使用。
    const notInstalled = enabledPlugins.filter(
      // 标识符更新为 `> !installedPlugins.includes(id)`，确保插件工具后续读取最新状态。
      id => !installedPlugins.includes(id),
    )
    // lookups 集合保存`Promise.all`，供插件管理后续处理使用。
    const lookups = await Promise.all(
      // 调用 notInstalled.map，触发插件管理此处需要的副作用。
      notInstalled.map(async pluginId => {
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // plugin 插件数据读取`getPluginById`，供插件管理后续处理使用。
          const plugin = await getPluginById(pluginId)
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return { pluginId, found: plugin !== null && plugin !== undefined }
        } catch (error) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Failed to check plugin ${pluginId} in marketplace: ${error}`,
          )
          // Plugin doesn't exist in any marketplace, will be handled as an error
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return { pluginId, found: false }
        }
      }),
    )
    // missing 命名 `lookups`，让后续代码直接表达这个值的用途。
    const missing = lookups
      // 链式调用 filter，继续加工上一行在插件管理中产生的数据。
      .filter(({ found }) => found)
      // 链式调用 map，继续加工上一行在插件管理中产生的数据。
      .map(({ pluginId }) => pluginId)

    // 返回 `missing`，作为插件管理这次计算的结果。
    return missing
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }
}

/**
 * Result of plugin installation attempt
 */
// PluginInstallResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginInstallResult = {
  installed: string[]
  failed: Array<{ name: string; error: string }>
}

/**
 * Installation scope type for install functions (excludes 'managed' which is read-only)
 */
// InstallableScope 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type InstallableScope = Exclude<PluginScope, 'managed'>

/**
 * Installs the selected plugins
 * @param pluginsToInstall Array of plugin IDs to install
 * @param onProgress Optional callback for installation progress
 * @param scope Installation scope: user, project, or local (defaults to 'user')
 * @returns Installation results with succeeded and failed plugins
 */
// installSelectedPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installSelectedPlugins(
  pluginsToInstall: string[],
  onProgress?: (name: string, index: number, total: number) => void,
  scope: InstallableScope = 'user',
): Promise<PluginInstallResult> {
  // Get projectPath for non-user scopes
  // projectPath 路径数据读取`getCwd`，供插件管理后续处理使用。
  const projectPath = scope !== 'user' ? getCwd() : undefined

  // Get the correct settings source for this scope
  // settingSource保存`scopeToSettingSource`，供插件管理后续处理使用。
  const settingSource = scopeToSettingSource(scope)
  // settings 集合读取`getSettingsForSource`，供插件管理后续处理使用。
  const settings = getSettingsForSource(settingSource)
  // updatedEnabledPlugins 插件数据 集中保存插件工具 plugin Startup Check要一起传递的字段。
  const updatedEnabledPlugins = { ...settings?.enabledPlugins }
  // installed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const installed: string[] = []
  // failed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const failed: Array<{ name: string; error: string }> = []

  // 按索引扫描 `pluginsToInstall.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < pluginsToInstall.length; i++) {
    // pluginId 插件数据 命名 `pluginsToInstall[i]`，让后续代码直接表达这个值的用途。
    const pluginId = pluginsToInstall[i]
    // pluginId 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!pluginId) continue

    // 满足 `onProgress` 时，插件管理执行该分支。
    if (onProgress) {
      // 调用 onProgress，触发插件管理此处需要的副作用。
      onProgress(pluginId, i + 1, pluginsToInstall.length)
    }

    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // pluginInfo 插件数据读取`getPluginById`，供插件管理后续处理使用。
      const pluginInfo = await getPluginById(pluginId)
      // pluginInfo 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!pluginInfo) {
        // failed追加新条目，保持收集顺序与输入顺序一致。
        failed.push({
          name: pluginId,
          error: 'Plugin not found in any marketplace',
        })
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // Cache the plugin if it's from an external source
      // 从 `pluginInfo` 解构 entry、marketplaceInstallLocation，减少插件工具 plugin Startup Check对同一对象的重复访问。
      const { entry, marketplaceInstallLocation } = pluginInfo
      // 满足 `!isLocalPluginSource(entry.source)` 时，插件管理执行该分支。
      if (!isLocalPluginSource(entry.source)) {
        // External plugin - cache and register it with scope
        // 等待 `cacheAndRegisterPlugin(pluginId, entry, scope, projectPath)` 完成，再继续插件工具 plugin Startup Check的异步流程。
        await cacheAndRegisterPlugin(pluginId, entry, scope, projectPath)
      } else {
        // Local plugin - just register it with the install path and scope
        // 调用 registerPluginInstallation，触发插件管理此处需要的副作用。
        registerPluginInstallation(
          {
            pluginId,
            installPath: join(marketplaceInstallLocation, entry.source),
            version: entry.version,
          },
          scope,
          projectPath,
        )
      }

      // Mark as enabled in settings
      // updatedEnabledPlugins[pluginId 插件数据更新为 `true`，确保插件工具 plugin Startup Check后续读取最新状态。
      updatedEnabledPlugins[pluginId] = true
      // installed追加新条目，保持收集顺序与输入顺序一致。
      installed.push(pluginId)
    } catch (error) {
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // failed追加新条目，保持收集顺序与输入顺序一致。
      failed.push({ name: pluginId, error: errorMessage })
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // Update settings with newly enabled plugins using the correct settings source
  // 调用 updateSettingsForSource，触发插件管理此处需要的副作用。
  updateSettingsForSource(settingSource, {
    ...settings,
    enabledPlugins: updatedEnabledPlugins,
  })

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { installed, failed }
}
