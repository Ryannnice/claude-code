/**
 * Plugin and marketplace subcommand handlers — extracted from main.tsx for lazy loading.
 * These are dynamically imported only when `claude plugin *` or `claude plugin marketplace *` runs.
 */
/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handlers intentionally exit */
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname } from 'path'
// 引入 setUseCoworkPlugins，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { setUseCoworkPlugins } from '../../bootstrap/state.js'
// 整理这一组导入，让plugins后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让plugins后续逻辑可以直接复用这些外部能力。
import {
  disableAllPlugins,
  disablePlugin,
  enablePlugin,
  installPlugin,
  uninstallPlugin,
  updatePluginCli,
  VALID_INSTALLABLE_SCOPES,
  VALID_UPDATE_SCOPES,
} from '../../services/plugins/pluginCliCommands.js'
// 引入 getPluginErrorMessage，将 ../../types/plugin.js 中已经封装好的能力接到本文件流程里。
import { getPluginErrorMessage } from '../../types/plugin.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 clearAllCaches 工具函数，把通用处理留在 ../../utils/plugins/cacheUtils.js 中维护。
import { clearAllCaches } from '../../utils/plugins/cacheUtils.js'
// 复用 getInstallCounts 工具函数，把通用处理留在 ../../utils/plugins/installCounts.js 中维护。
import { getInstallCounts } from '../../utils/plugins/installCounts.js'
// 整理这一组导入，让plugins后续逻辑可以直接复用这些外部能力。
import {
  isPluginInstalled,
  loadInstalledPluginsV2,
} from '../../utils/plugins/installedPluginsManager.js'
// 整理这一组导入，让plugins后续逻辑可以直接复用这些外部能力。
import {
  createPluginId,
  loadMarketplacesWithGracefulDegradation,
} from '../../utils/plugins/marketplaceHelpers.js'
// 整理这一组导入，让plugins后续逻辑可以直接复用这些外部能力。
import {
  addMarketplaceSource,
  loadKnownMarketplacesConfig,
  refreshAllMarketplaces,
  refreshMarketplace,
  removeMarketplaceSource,
  saveMarketplaceToSettings,
} from '../../utils/plugins/marketplaceManager.js'
// 复用 loadPluginMcpServers 工具函数，把通用处理留在 ../../utils/plugins/mcpPluginIntegration.js 中维护。
import { loadPluginMcpServers } from '../../utils/plugins/mcpPluginIntegration.js'
// 复用 parseMarketplaceInput 工具函数，把通用处理留在 ../../utils/plugins/parseMarketplaceInput.js 中维护。
import { parseMarketplaceInput } from '../../utils/plugins/parseMarketplaceInput.js'
// 整理这一组导入，让plugins后续逻辑可以直接复用这些外部能力。
import {
  parsePluginIdentifier,
  scopeToSettingSource,
} from '../../utils/plugins/pluginIdentifier.js'
// 复用 loadAllPlugins 工具函数，把通用处理留在 ../../utils/plugins/pluginLoader.js 中维护。
import { loadAllPlugins } from '../../utils/plugins/pluginLoader.js'
// 类型依赖 { PluginSource } 来自 ../../utils/plugins/schemas.js，用于校准plugins的数据契约。
import type { PluginSource } from '../../utils/plugins/schemas.js'
// 整理这一组导入，让plugins后续逻辑可以直接复用这些外部能力。
import {
  type ValidationResult,
  validateManifest,
  validatePluginContents,
} from '../../utils/plugins/validatePlugin.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js'
// 引入 cliError、cliOk，将 ../exit.js 中已经封装好的能力接到本文件流程里。
import { cliError, cliOk } from '../exit.js'

// Re-export for main.tsx to reference in option definitions
// 重新导出这一组成员，让plugins的公共 API 保持集中入口。
export { VALID_INSTALLABLE_SCOPES, VALID_UPDATE_SCOPES }

/**
 * Helper function to handle marketplace command errors consistently.
 */
// handleMarketplaceError 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleMarketplaceError(error: unknown, action: string): never {
  // 记录plugins运行诊断，方便排查异常路径或性能问题。
  logError(error)
  // 调用 cliError，触发plugins此处需要的副作用。
  cliError(`${figures.cross} Failed to ${action}: ${errorMessage(error)}`)
}

// printValidationResult 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function printValidationResult(result: ValidationResult): void {
  // 满足 `result.errors.length > 0` 时，plugins执行该分支。
  if (result.errors.length > 0) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log(
      `${figures.cross} Found ${result.errors.length} ${plural(result.errors.length, 'error')}:\n`,
    )
    // 调用 result.errors.forEach，触发plugins此处需要的副作用。
    result.errors.forEach(error => {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`  ${figures.pointer} ${error.path}: ${error.message}`)
    })
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log('')
  }
  // 满足 `result.warnings.length > 0` 时，plugins执行该分支。
  if (result.warnings.length > 0) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log(
      `${figures.warning} Found ${result.warnings.length} ${plural(result.warnings.length, 'warning')}:\n`,
    )
    // 调用 result.warnings.forEach，触发plugins此处需要的副作用。
    result.warnings.forEach(warning => {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`  ${figures.pointer} ${warning.path}: ${warning.message}`)
    })
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log('')
  }
}

// plugin validate
// pluginValidateHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pluginValidateHandler(
  manifestPath: string,
  options: { cowork?: boolean },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // 保护这一段可能失败的plugins操作，确保异常能进入相邻错误处理。
  try {
    // 结果读取`validateManifest`，供plugins后续处理使用。
    const result = await validateManifest(manifestPath)

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log(`Validating ${result.fileType} manifest: ${result.filePath}\n`)
    // 调用 printValidationResult，触发plugins此处需要的副作用。
    printValidationResult(result)

    // If this is a plugin manifest located inside a .claude-plugin directory,
    // also validate the plugin's content files (skills, agents, commands,
    // hooks). Works whether the user passed a directory or the plugin.json
    // path directly.
    // contentResults 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    let contentResults: ValidationResult[] = []
    // 当 `result.fileType` 匹配 `'plugin'` 时，plugins执行对应分支。
    if (result.fileType === 'plugin') {
      // manifestDir保存`dirname`，供plugins后续处理使用。
      const manifestDir = dirname(result.filePath)
      // 当 `basename(manifestDir)` 匹配 `'.claude-plugin'` 时，plugins执行对应分支。
      if (basename(manifestDir) === '.claude-plugin') {
        // contentResults 集合更新为 `await validatePluginContents(dirname(manifestDir))`，确保CLI后续读取最新状态。
        contentResults = await validatePluginContents(dirname(manifestDir))
        // 按顺序遍历 `contentResults` 中的r，逐个交给plugins处理。
        for (const r of contentResults) {
          // biome-ignore lint/suspicious/noConsole:: intentional console output
          // 调用 console.log，触发plugins此处需要的副作用。
          console.log(`Validating ${r.fileType}: ${r.filePath}\n`)
          // 调用 printValidationResult，触发plugins此处需要的副作用。
          printValidationResult(r)
        }
      }
    }

    // allSuccess 集合筛选`contentResults.every`，供plugins后续处理使用。
    const allSuccess = result.success && contentResults.every(r => r.success)
    // hasWarnings 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasWarnings =
      result.warnings.length > 0 ||
      // 调用 contentResults.some，触发plugins此处需要的副作用。
      contentResults.some(r => r.warnings.length > 0)

    // 满足 `allSuccess` 时，plugins执行该分支。
    if (allSuccess) {
      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk(
        hasWarnings
          ? `${figures.tick} Validation passed with warnings`
          : `${figures.tick} Validation passed`,
      )
    } else {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`${figures.cross} Validation failed`)
      // 调用 process.exit，触发plugins此处需要的副作用。
      process.exit(1)
    }
  } catch (error) {
    // 记录plugins运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发plugins此处需要的副作用。
    console.error(
      `${figures.cross} Unexpected error during validation: ${errorMessage(error)}`,
    )
    // 调用 process.exit，触发plugins此处需要的副作用。
    process.exit(2)
  }
}

// plugin list (lines 5217–5416)
// pluginListHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pluginListHandler(options: {
  json?: boolean
  available?: boolean
  cowork?: boolean
}): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // 记录plugins运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_list_command', {})

  // installedData读取`loadInstalledPluginsV2`，供plugins后续处理使用。
  const installedData = loadInstalledPluginsV2()
  // 从 `await import(` 解构 getPluginEditableScopes，减少plugins对同一对象的重复访问。
  const { getPluginEditableScopes } = await import(
    '../../utils/plugins/pluginStartupCheck.js'
  )
  // enabledPlugins 插件数据读取`getPluginEditableScopes`，供plugins后续处理使用。
  const enabledPlugins = getPluginEditableScopes()

  // pluginIds 插件数据派生`Object.keys`，供plugins后续处理使用。
  const pluginIds = Object.keys(installedData.plugins)

  // Load all plugins once. The JSON and human paths both need:
  //  - loadErrors (to show load failures per plugin)
  //  - inline plugins (session-only via --plugin-dir, source='name@inline')
  //    which are NOT in installedData.plugins (V2 bookkeeping) — they must
  //    be surfaced separately or `plugin list` silently ignores --plugin-dir.
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    enabled: loadedEnabled,
    disabled: loadedDisabled,
    errors: loadErrors,
  } = await loadAllPlugins()
  // allLoadedPlugins 插件数据 聚合成有序列表，保持后续遍历顺序稳定。
  const allLoadedPlugins = [...loadedEnabled, ...loadedDisabled]
  // inlinePlugins 插件数据筛选`allLoadedPlugins.filter`，供plugins后续处理使用。
  const inlinePlugins = allLoadedPlugins.filter(p =>
    p.source.endsWith('@inline'),
  )
  // Path-level inline failures (dir doesn't exist, parse error before
  // manifest is read) use source='inline[N]'. Plugin-level errors after
  // manifest read use source='name@inline'. Collect both for the session
  // section — these are otherwise invisible since they have no pluginId.
  // inlineLoadErrors 错误信息筛选`loadErrors.filter`，供plugins后续处理使用。
  const inlineLoadErrors = loadErrors.filter(
    // e更新为 `> e.source.endsWith('@inline') || e.source.startsWith('in...`，确保CLI后续读取最新状态。
    e => e.source.endsWith('@inline') || e.source.startsWith('inline['),
  )

  // 满足 `options.json` 时，plugins执行该分支。
  if (options.json) {
    // Create a map of plugin source to loaded plugin for quick lookup
    // loadedPluginMap 插件数据保存`Map`，供plugins后续处理使用。
    const loadedPluginMap = new Map(allLoadedPlugins.map(p => [p.source, p]))

    // plugins 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
    const plugins: Array<{
      id: string
      version: string
      scope: string
      enabled: boolean
      installPath: string
      installedAt?: string
      lastUpdated?: string
      projectPath?: string
      mcpServers?: Record<string, unknown>
      errors?: string[]
    }> = []

    // 逐项读取 `pluginIds.sort()` 中的pluginId 插件数据，按输入顺序推进plugins。
    for (const pluginId of pluginIds.sort()) {
      // installations 集合 命名 `installedData.plugins[pluginId]`，让后续代码直接表达这个值的用途。
      const installations = installedData.plugins[pluginId]
      // !installations || installations 集合为空时立即返回或跳过，避免plugins把空集合当成可处理内容。
      if (!installations || installations.length === 0) continue

      // Find loading errors for this plugin
      // pluginName 插件数据解析`parsePluginIdentifier`，供plugins后续处理使用。
      const pluginName = parsePluginIdentifier(pluginId).name
      // pluginErrors 插件数据 命名 `loadErrors`，让后续代码直接表达这个值的用途。
      const pluginErrors = loadErrors
        .filter(
          // e更新为 `>`，确保CLI后续读取最新状态。
          e =>
            e.source === pluginId || ('plugin' in e && e.plugin === pluginName),
        )
        .map(getPluginErrorMessage)

      // 按顺序遍历 `installations` 中的installation，逐个交给plugins处理。
      for (const installation of installations) {
        // Try to find the loaded plugin to get MCP servers
        // loadedPlugin 插件数据读取`loadedPluginMap.get`，供plugins后续处理使用。
        const loadedPlugin = loadedPluginMap.get(pluginId)
        // mcpServers 集合 先占位，稍后的条件分支会根据实际输入补齐它。
        let mcpServers: Record<string, unknown> | undefined

        // 满足 `loadedPlugin` 时，plugins执行该分支。
        if (loadedPlugin) {
          // Load MCP servers if not already cached
          // servers 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const servers =
            loadedPlugin.mcpServers ||
            (await loadPluginMcpServers(loadedPlugin))
          // 组合条件 `servers && Object.keys(servers).length > 0` 成立时，plugins才启用这条专门路径。
          if (servers && Object.keys(servers).length > 0) {
            // mcpServers 集合更新为 `servers`，确保CLI后续读取最新状态。
            mcpServers = servers
          }
        }

        // plugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
        plugins.push({
          id: pluginId,
          version: installation.version || 'unknown',
          scope: installation.scope,
          enabled: enabledPlugins.has(pluginId),
          installPath: installation.installPath,
          installedAt: installation.installedAt,
          lastUpdated: installation.lastUpdated,
          projectPath: installation.projectPath,
          mcpServers,
          errors: pluginErrors.length > 0 ? pluginErrors : undefined,
        })
      }
    }

    // Session-only plugins: scope='session', no install metadata.
    // Filter from inlineLoadErrors (not loadErrors) so an installed plugin
    // with the same manifest name doesn't cross-contaminate via e.plugin.
    // The e.plugin fallback catches the dirName≠manifestName case:
    // createPluginFromPath tags errors with `${dirName}@inline` but
    // plugin.source is reassigned to `${manifest.name}@inline` afterward
    // (pluginLoader.ts loadInlinePlugins), so e.source !== p.source when
    // a dev checkout dir like ~/code/my-fork/ has manifest name 'cool-plugin'.
    // 按顺序遍历 `inlinePlugins` 中的p，逐个交给plugins处理。
    for (const p of inlinePlugins) {
      // servers 集合读取`loadPluginMcpServers`，供plugins后续处理使用。
      const servers = p.mcpServers || (await loadPluginMcpServers(p))
      // pErrors 错误信息保存`inlineLoadErrors`，供plugins后续判断或输出使用。
      const pErrors = inlineLoadErrors
        .filter(
          // e更新为 `> e.source === p.source || ('plugin' in e && e.plugin ===...`，确保CLI后续读取最新状态。
          e => e.source === p.source || ('plugin' in e && e.plugin === p.name),
        )
        .map(getPluginErrorMessage)
      // plugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
      plugins.push({
        id: p.source,
        version: p.manifest.version ?? 'unknown',
        scope: 'session',
        enabled: p.enabled !== false,
        installPath: p.path,
        mcpServers:
          servers && Object.keys(servers).length > 0 ? servers : undefined,
        errors: pErrors.length > 0 ? pErrors : undefined,
      })
    }
    // Path-level inline failures (--plugin-dir /nonexistent): no LoadedPlugin
    // exists so the loop above can't surface them. Mirror the human-path
    // handling so JSON consumers see the failure instead of silent omission.
    // 调用 for，触发plugins此处需要的副作用。
    for (const e of inlineLoadErrors.filter(e =>
      e.source.startsWith('inline['),
    )) {
      // plugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
      plugins.push({
        id: e.source,
        version: 'unknown',
        scope: 'session',
        enabled: false,
        installPath: 'path' in e ? e.path : '',
        errors: [getPluginErrorMessage(e)],
      })
    }

    // If --available is set, also load available plugins from marketplaces
    // 满足 `options.available` 时，plugins执行该分支。
    if (options.available) {
      // available 先占位，稍后的条件分支会根据实际输入补齐它。
      const available: Array<{
        pluginId: string
        name: string
        description?: string
        marketplaceName: string
        version?: string
        source: PluginSource
        installCount?: number
      }> = []

      // 保护这一段可能失败的plugins操作，确保异常能进入相邻错误处理。
      try {
        // 并行获取 config、installCounts，缩短plugins等待多个独立异步任务的时间。
        const [config, installCounts] = await Promise.all([
          loadKnownMarketplacesConfig(),
          getInstallCounts(),
        ])
        // plugins先整理这一处局部数据，后续分支可以直接读取。
        const { marketplaces } =
          await loadMarketplacesWithGracefulDegradation(config)

        // 调用 for，触发plugins此处需要的副作用。
        for (const {
          name: marketplaceName,
          data: marketplace,
        } of marketplaces) {
          // 满足 `marketplace` 时，plugins执行该分支。
          if (marketplace) {
            // 按顺序遍历 `marketplace.plugins` 中的entry，逐个交给plugins处理。
            for (const entry of marketplace.plugins) {
              // pluginId 插件数据构建`createPluginId`，供plugins后续处理使用。
              const pluginId = createPluginId(entry.name, marketplaceName)
              // Only include plugins that are not already installed
              // 满足 `!isPluginInstalled(pluginId)` 时，plugins执行该分支。
              if (!isPluginInstalled(pluginId)) {
                // available追加新条目，保持收集顺序与输入顺序一致。
                available.push({
                  pluginId,
                  name: entry.name,
                  description: entry.description,
                  marketplaceName,
                  version: entry.version,
                  source: entry.source,
                  installCount: installCounts?.get(pluginId),
                })
              }
            }
          }
        }
      } catch {
        // Silently ignore marketplace loading errors
      }

      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk(jsonStringify({ installed: plugins, available }, null, 2))
    } else {
      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk(jsonStringify(plugins, null, 2))
    }
  }

  // 组合条件 `pluginIds.length === 0 && inlinePlugins.length ==` 成立时，plugins才启用这条专门路径。
  if (pluginIds.length === 0 && inlinePlugins.length === 0) {
    // inlineLoadErrors can exist with zero inline plugins (e.g. --plugin-dir
    // points at a nonexistent path). Don't early-exit over them — fall
    // through to the session section so the failure is visible.
    // inlineLoadErrors 错误信息为空时立即返回或跳过，避免plugins把空集合当成可处理内容。
    if (inlineLoadErrors.length === 0) {
      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk(
        'No plugins installed. Use `claude plugin install` to install a plugin.',
      )
    }
  }

  // 满足 `pluginIds.length > 0` 时，plugins执行该分支。
  if (pluginIds.length > 0) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log('Installed plugins:\n')
  }

  // 逐项读取 `pluginIds.sort()` 中的pluginId 插件数据，按输入顺序推进plugins。
  for (const pluginId of pluginIds.sort()) {
    // installations 集合 命名 `installedData.plugins[pluginId]`，让后续代码直接表达这个值的用途。
    const installations = installedData.plugins[pluginId]
    // !installations || installations 集合为空时立即返回或跳过，避免plugins把空集合当成可处理内容。
    if (!installations || installations.length === 0) continue

    // Find loading errors for this plugin
    // pluginName 插件数据解析`parsePluginIdentifier`，供plugins后续处理使用。
    const pluginName = parsePluginIdentifier(pluginId).name
    // pluginErrors 插件数据筛选`loadErrors.filter`，供plugins后续处理使用。
    const pluginErrors = loadErrors.filter(
      // e更新为 `> e.source === pluginId || ('plugin' in e && e.plugin ===...`，确保CLI后续读取最新状态。
      e => e.source === pluginId || ('plugin' in e && e.plugin === pluginName),
    )

    // 按顺序遍历 `installations` 中的installation，逐个交给plugins处理。
    for (const installation of installations) {
      // isEnabled记录 `enabledPlugins.has` 是否成立，plugins随后按该结果分支。
      const isEnabled = enabledPlugins.has(pluginId)
      // status 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const status =
        pluginErrors.length > 0
          ? `${figures.cross} failed to load`
          : isEnabled
            ? `${figures.tick} enabled`
            : `${figures.cross} disabled`
      // version标记plugins是否启用对应路径。
      const version = installation.version || 'unknown'
      // scope保存`installation.scope`，供plugins后续判断或输出使用。
      const scope = installation.scope

      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`  ${figures.pointer} ${pluginId}`)
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`    Version: ${version}`)
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`    Scope: ${scope}`)
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`    Status: ${status}`)
      // 按顺序遍历 `pluginErrors` 中的错误，逐个交给plugins处理。
      for (const error of pluginErrors) {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.log，触发plugins此处需要的副作用。
        console.log(`    Error: ${getPluginErrorMessage(error)}`)
      }
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log('')
    }
  }

  // 组合条件 `inlinePlugins.length > 0 || inlineLoadErrors.leng` 成立时，plugins才启用这条专门路径。
  if (inlinePlugins.length > 0 || inlineLoadErrors.length > 0) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log('Session-only plugins (--plugin-dir):\n')
    // 按顺序遍历 `inlinePlugins` 中的p，逐个交给plugins处理。
    for (const p of inlinePlugins) {
      // Same dirName≠manifestName fallback as the JSON path above — error
      // sources use the dir basename but p.source uses the manifest name.
      // pErrors 错误信息筛选`inlineLoadErrors.filter`，供plugins后续处理使用。
      const pErrors = inlineLoadErrors.filter(
        // e更新为 `> e.source === p.source || ('plugin' in e && e.plugin ===...`，确保CLI后续读取最新状态。
        e => e.source === p.source || ('plugin' in e && e.plugin === p.name),
      )
      // status 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const status =
        pErrors.length > 0
          ? `${figures.cross} loaded with errors`
          : `${figures.tick} loaded`
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`  ${figures.pointer} ${p.source}`)
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`    Version: ${p.manifest.version ?? 'unknown'}`)
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`    Path: ${p.path}`)
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`    Status: ${status}`)
      // 按顺序遍历 `pErrors` 中的e，逐个交给plugins处理。
      for (const e of pErrors) {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.log，触发plugins此处需要的副作用。
        console.log(`    Error: ${getPluginErrorMessage(e)}`)
      }
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log('')
    }
    // Path-level failures: no LoadedPlugin object exists. Show them so
    // `--plugin-dir /typo` doesn't just silently produce nothing.
    // 调用 for，触发plugins此处需要的副作用。
    for (const e of inlineLoadErrors.filter(e =>
      e.source.startsWith('inline['),
    )) {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(
        `  ${figures.pointer} ${e.source}: ${figures.cross} ${getPluginErrorMessage(e)}\n`,
      )
    }
  }

  // 调用 cliOk，触发plugins此处需要的副作用。
  cliOk()
}

// marketplace add (lines 5433–5487)
// marketplaceAddHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function marketplaceAddHandler(
  source: string,
  options: { cowork?: boolean; sparse?: string[]; scope?: string },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // 保护这一段可能失败的plugins操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`parseMarketplaceInput`，供plugins后续处理使用。
    const parsed = await parseMarketplaceInput(source)

    // 解析结果缺失时提前走兜底路径，避免plugins继续依赖无效输入。
    if (!parsed) {
      // 调用 cliError，触发plugins此处需要的副作用。
      cliError(
        `${figures.cross} Invalid marketplace source format. Try: owner/repo, https://..., or ./path`,
      )
    }

    // 满足 `'error' in parsed` 时，plugins执行该分支。
    if ('error' in parsed) {
      // 调用 cliError，触发plugins此处需要的副作用。
      cliError(`${figures.cross} ${parsed.error}`)
    }

    // Validate scope
    // scope 命名 `options.scope ?? 'user'`，让后续代码直接表达这个值的用途。
    const scope = options.scope ?? 'user'
    // `scope` 与 `'user' && scope !== 'project' &...` 不一致时刷新派生状态，避免使用过期结果。
    if (scope !== 'user' && scope !== 'project' && scope !== 'local') {
      // 调用 cliError，触发plugins此处需要的副作用。
      cliError(
        `${figures.cross} Invalid scope '${scope}'. Use: user, project, or local`,
      )
    }
    // settingSource保存`scopeToSettingSource`，供plugins后续处理使用。
    const settingSource = scopeToSettingSource(scope)

    // marketplaceSource 市场数据 命名 `parsed`，让后续代码直接表达这个值的用途。
    let marketplaceSource = parsed

    // 组合条件 `options.sparse && options.sparse.length > 0` 成立时，plugins才启用这条专门路径。
    if (options.sparse && options.sparse.length > 0) {
      // plugins在这里进入条件判断，后续代码按实际状态分流。
      if (
        marketplaceSource.source === 'github' ||
        marketplaceSource.source === 'git'
      ) {
        // marketplaceSource 市场数据更新为 `{`，确保CLI后续读取最新状态。
        marketplaceSource = {
          ...marketplaceSource,
          sparsePaths: options.sparse,
        }
      } else {
        // 调用 cliError，触发plugins此处需要的副作用。
        cliError(
          `${figures.cross} --sparse is only supported for github and git marketplace sources (got: ${marketplaceSource.source})`,
        )
      }
    }

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log('Adding marketplace...')

    // plugins先整理这一处局部数据，后续分支可以直接读取。
    const { name, alreadyMaterialized, resolvedSource } =
      // 这个回调绑定到 await addMarketplaceSource(marketplaceSource, message => {，负责plugins在该局部场景下的响应。
      await addMarketplaceSource(marketplaceSource, message => {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.log，触发plugins此处需要的副作用。
        console.log(message)
      })

    // Write intent to settings at the requested scope
    // 调用 saveMarketplaceToSettings，触发plugins此处需要的副作用。
    saveMarketplaceToSettings(name, { source: resolvedSource }, settingSource)

    // 清理相关缓存，确保plugins下一次读取时重新加载最新数据。
    clearAllCaches()

    // sourceType保存`marketplaceSource.source`，供后续判断或组装使用。
    let sourceType = marketplaceSource.source
    // 当 `marketplaceSource.source` 匹配 `'github'` 时，plugins执行对应分支。
    if (marketplaceSource.source === 'github') {
      // plugins在这里处理 `sourceType =`，完成这一小步状态转换。
      sourceType =
        marketplaceSource.repo as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    }
    // 记录plugins运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_marketplace_added', {
      source_type:
        sourceType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // 调用 cliOk，触发plugins此处需要的副作用。
    cliOk(
      alreadyMaterialized
        ? `${figures.tick} Marketplace '${name}' already on disk — declared in ${scope} settings`
        : `${figures.tick} Successfully added marketplace: ${name} (declared in ${scope} settings)`,
    )
  } catch (error) {
    // 调用 handleMarketplaceError，触发plugins此处需要的副作用。
    handleMarketplaceError(error, 'add marketplace')
  }
}

// marketplace list (lines 5497–5565)
// marketplaceListHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function marketplaceListHandler(options: {
  json?: boolean
  cowork?: boolean
}): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // 保护这一段可能失败的plugins操作，确保异常能进入相邻错误处理。
  try {
    // 配置读取`loadKnownMarketplacesConfig`，供plugins后续处理使用。
    const config = await loadKnownMarketplacesConfig()
    // names 集合派生`Object.keys`，供plugins后续处理使用。
    const names = Object.keys(config)

    // 满足 `options.json` 时，plugins执行该分支。
    if (options.json) {
      // marketplaces 市场数据保存`names.sort`，供plugins后续处理使用。
      const marketplaces = names.sort().map(name => {
        // marketplace 市场数据保存`config[name]`，供plugins后续判断或输出使用。
        const marketplace = config[name]
        // source保存`marketplace?.source`，供plugins后续判断或输出使用。
        const source = marketplace?.source
        // 返回结构化结果，集中表达plugins已经整理出的状态。
        return {
          name,
          source: source?.source,
          ...(source?.source === 'github' && { repo: source.repo }),
          ...(source?.source === 'git' && { url: source.url }),
          ...(source?.source === 'url' && { url: source.url }),
          ...(source?.source === 'directory' && { path: source.path }),
          ...(source?.source === 'file' && { path: source.path }),
          installLocation: marketplace?.installLocation,
        }
      })
      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk(jsonStringify(marketplaces, null, 2))
    }

    // names 集合为空时立即返回或跳过，避免plugins把空集合当成可处理内容。
    if (names.length === 0) {
      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk('No marketplaces configured')
    }

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发plugins此处需要的副作用。
    console.log('Configured marketplaces:\n')
    // 调用 names.forEach，触发plugins此处需要的副作用。
    names.forEach(name => {
      // marketplace 市场数据保存`config[name]`，供plugins后续判断或输出使用。
      const marketplace = config[name]
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`  ${figures.pointer} ${name}`)

      // 满足 `marketplace?.source` 时，plugins执行该分支。
      if (marketplace?.source) {
        // src保存`marketplace.source`，供后续判断或组装使用。
        const src = marketplace.source
        // 当 `src.source` 匹配 `'github'` 时，plugins执行对应分支。
        if (src.source === 'github') {
          // biome-ignore lint/suspicious/noConsole:: intentional console output
          // 调用 console.log，触发plugins此处需要的副作用。
          console.log(`    Source: GitHub (${src.repo})`)
        // plugins在这里处理 `} else if (src.source === 'git') {`，完成这一小步状态转换。
        } else if (src.source === 'git') {
          // biome-ignore lint/suspicious/noConsole:: intentional console output
          // 调用 console.log，触发plugins此处需要的副作用。
          console.log(`    Source: Git (${src.url})`)
        // plugins在这里处理 `} else if (src.source === 'url') {`，完成这一小步状态转换。
        } else if (src.source === 'url') {
          // biome-ignore lint/suspicious/noConsole:: intentional console output
          // 调用 console.log，触发plugins此处需要的副作用。
          console.log(`    Source: URL (${src.url})`)
        // plugins在这里处理 `} else if (src.source === 'directory') {`，完成这一小步状态转换。
        } else if (src.source === 'directory') {
          // biome-ignore lint/suspicious/noConsole:: intentional console output
          // 调用 console.log，触发plugins此处需要的副作用。
          console.log(`    Source: Directory (${src.path})`)
        // plugins在这里处理 `} else if (src.source === 'file') {`，完成这一小步状态转换。
        } else if (src.source === 'file') {
          // biome-ignore lint/suspicious/noConsole:: intentional console output
          // 调用 console.log，触发plugins此处需要的副作用。
          console.log(`    Source: File (${src.path})`)
        }
      }
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log('')
    })

    // 调用 cliOk，触发plugins此处需要的副作用。
    cliOk()
  } catch (error) {
    // 调用 handleMarketplaceError，触发plugins此处需要的副作用。
    handleMarketplaceError(error, 'list marketplaces')
  }
}

// marketplace remove (lines 5576–5598)
// marketplaceRemoveHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function marketplaceRemoveHandler(
  name: string,
  options: { cowork?: boolean },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // 保护这一段可能失败的plugins操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `removeMarketplaceSource(name)` 完成，再继续plugins的异步流程。
    await removeMarketplaceSource(name)
    // 清理相关缓存，确保plugins下一次读取时重新加载最新数据。
    clearAllCaches()

    // 记录plugins运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_marketplace_removed', {
      marketplace_name:
        name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // 调用 cliOk，触发plugins此处需要的副作用。
    cliOk(`${figures.tick} Successfully removed marketplace: ${name}`)
  } catch (error) {
    // 调用 handleMarketplaceError，触发plugins此处需要的副作用。
    handleMarketplaceError(error, 'remove marketplace')
  }
}

// marketplace update (lines 5609–5672)
// marketplaceUpdateHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function marketplaceUpdateHandler(
  name: string | undefined,
  options: { cowork?: boolean },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // 保护这一段可能失败的plugins操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `name` 时，plugins执行该分支。
    if (name) {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`Updating marketplace: ${name}...`)

      // 这个回调绑定到 await refreshMarketplace(name, message => {，负责plugins在该局部场景下的响应。
      await refreshMarketplace(name, message => {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.log，触发plugins此处需要的副作用。
        console.log(message)
      })

      // 清理相关缓存，确保plugins下一次读取时重新加载最新数据。
      clearAllCaches()

      // 记录plugins运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_marketplace_updated', {
        marketplace_name:
          name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk(`${figures.tick} Successfully updated marketplace: ${name}`)
    } else {
      // 配置读取`loadKnownMarketplacesConfig`，供plugins后续处理使用。
      const config = await loadKnownMarketplacesConfig()
      // marketplaceNames 市场数据派生`Object.keys`，供plugins后续处理使用。
      const marketplaceNames = Object.keys(config)

      // marketplaceNames 市场数据为空时立即返回或跳过，避免plugins把空集合当成可处理内容。
      if (marketplaceNames.length === 0) {
        // 调用 cliOk，触发plugins此处需要的副作用。
        cliOk('No marketplaces configured')
      }

      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.log，触发plugins此处需要的副作用。
      console.log(`Updating ${marketplaceNames.length} marketplace(s)...`)

      // 等待 `refreshAllMarketplaces()` 完成，再继续plugins的异步流程。
      await refreshAllMarketplaces()
      // 清理相关缓存，确保plugins下一次读取时重新加载最新数据。
      clearAllCaches()

      // 记录plugins运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_marketplace_updated_all', {
        count:
          marketplaceNames.length as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // 调用 cliOk，触发plugins此处需要的副作用。
      cliOk(
        `${figures.tick} Successfully updated ${marketplaceNames.length} marketplace(s)`,
      )
    }
  } catch (error) {
    // 调用 handleMarketplaceError，触发plugins此处需要的副作用。
    handleMarketplaceError(error, 'update marketplace(s)')
  }
}

// plugin install (lines 5690–5721)
// pluginInstallHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pluginInstallHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // scope标记plugins是否启用对应路径。
  const scope = options.scope || 'user'
  // `options.cowork && scope` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (options.cowork && scope !== 'user') {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError('--cowork can only be used with user scope')
  }
  // plugins在这里进入条件判断，后续代码按实际状态分流。
  if (
    !VALID_INSTALLABLE_SCOPES.includes(
      scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
    )
  ) {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError(
      `Invalid scope: ${scope}. Must be one of: ${VALID_INSTALLABLE_SCOPES.join(', ')}.`,
    )
  }
  // _PROTO_* routes to PII-tagged plugin_name/marketplace_name BQ columns.
  // Unredacted plugin arg was previously logged to general-access
  // additional_metadata for all users — dropped in favor of the privileged
  // column route. marketplace may be undefined (fires before resolution).
  // 从 `parsePluginIdentifier(plugin)` 解构 name、marketplace，减少plugins对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(plugin)
  // 记录plugins运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_install_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 等待 `installPlugin(plugin, scope as 'user' | 'project' | 'local')` 完成，再继续plugins的异步流程。
  await installPlugin(plugin, scope as 'user' | 'project' | 'local')
}

// plugin uninstall (lines 5738–5769)
// pluginUninstallHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pluginUninstallHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean; keepData?: boolean },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // scope标记plugins是否启用对应路径。
  const scope = options.scope || 'user'
  // `options.cowork && scope` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (options.cowork && scope !== 'user') {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError('--cowork can only be used with user scope')
  }
  // plugins在这里进入条件判断，后续代码按实际状态分流。
  if (
    !VALID_INSTALLABLE_SCOPES.includes(
      scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
    )
  ) {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError(
      `Invalid scope: ${scope}. Must be one of: ${VALID_INSTALLABLE_SCOPES.join(', ')}.`,
    )
  }
  // 从 `parsePluginIdentifier(plugin)` 解构 name、marketplace，减少plugins对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(plugin)
  // 记录plugins运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_uninstall_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 等待 `uninstallPlugin(` 完成，再继续plugins的异步流程。
  await uninstallPlugin(
    plugin,
    scope as 'user' | 'project' | 'local',
    options.keepData,
  )
}

// plugin enable (lines 5783–5818)
// pluginEnableHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pluginEnableHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // scope 先占位，稍后的条件分支会根据实际输入补齐它。
  let scope: (typeof VALID_INSTALLABLE_SCOPES)[number] | undefined
  // 满足 `options.scope` 时，plugins执行该分支。
  if (options.scope) {
    // plugins在这里进入条件判断，后续代码按实际状态分流。
    if (
      !VALID_INSTALLABLE_SCOPES.includes(
        options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
      )
    ) {
      // 调用 cliError，触发plugins此处需要的副作用。
      cliError(
        `Invalid scope "${options.scope}". Valid scopes: ${VALID_INSTALLABLE_SCOPES.join(', ')}`,
      )
    }
    // scope更新为 `options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number]`，确保CLI后续读取最新状态。
    scope = options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number]
  }
  // `options.cowork && scope` 与 `undefined && scope !=` 不一致时刷新派生状态，避免使用过期结果。
  if (options.cowork && scope !== undefined && scope !== 'user') {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError('--cowork can only be used with user scope')
  }

  // --cowork always operates at user scope
  // 组合条件 `options.cowork && scope === undefined` 成立时，plugins才启用这条专门路径。
  if (options.cowork && scope === undefined) {
    // scope更新为 `'user'`，确保CLI后续读取最新状态。
    scope = 'user'
  }

  // 从 `parsePluginIdentifier(plugin)` 解构 name、marketplace，减少plugins对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(plugin)
  // 记录plugins运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_enable_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: (scope ??
      'auto') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 等待 `enablePlugin(plugin, scope)` 完成，再继续plugins的异步流程。
  await enablePlugin(plugin, scope)
}

// plugin disable (lines 5833–5902)
// pluginDisableHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pluginDisableHandler(
  plugin: string | undefined,
  options: { scope?: string; cowork?: boolean; all?: boolean },
): Promise<void> {
  // 组合条件 `options.all && plugin` 成立时，plugins才启用这条专门路径。
  if (options.all && plugin) {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError('Cannot use --all with a specific plugin')
  }

  // 组合条件 `!options.all && !plugin` 成立时，plugins才启用这条专门路径。
  if (!options.all && !plugin) {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError('Please specify a plugin name or use --all to disable all plugins')
  }

  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)

  // 满足 `options.all` 时，plugins执行该分支。
  if (options.all) {
    // 满足 `options.scope` 时，plugins执行该分支。
    if (options.scope) {
      // 调用 cliError，触发plugins此处需要的副作用。
      cliError('Cannot use --scope with --all')
    }

    // No _PROTO_plugin_name here — --all disables all plugins.
    // Distinguishable from the specific-plugin branch by plugin_name IS NULL.
    // 记录plugins运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_disable_command', {})

    // 等待 `disableAllPlugins()` 完成，再继续plugins的异步流程。
    await disableAllPlugins()
    // plugins在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // scope 先占位，稍后的条件分支会根据实际输入补齐它。
  let scope: (typeof VALID_INSTALLABLE_SCOPES)[number] | undefined
  // 满足 `options.scope` 时，plugins执行该分支。
  if (options.scope) {
    // plugins在这里进入条件判断，后续代码按实际状态分流。
    if (
      !VALID_INSTALLABLE_SCOPES.includes(
        options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number],
      )
    ) {
      // 调用 cliError，触发plugins此处需要的副作用。
      cliError(
        `Invalid scope "${options.scope}". Valid scopes: ${VALID_INSTALLABLE_SCOPES.join(', ')}`,
      )
    }
    // scope更新为 `options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number]`，确保CLI后续读取最新状态。
    scope = options.scope as (typeof VALID_INSTALLABLE_SCOPES)[number]
  }
  // `options.cowork && scope` 与 `undefined && scope !=` 不一致时刷新派生状态，避免使用过期结果。
  if (options.cowork && scope !== undefined && scope !== 'user') {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError('--cowork can only be used with user scope')
  }

  // --cowork always operates at user scope
  // 组合条件 `options.cowork && scope === undefined` 成立时，plugins才启用这条专门路径。
  if (options.cowork && scope === undefined) {
    // scope更新为 `'user'`，确保CLI后续读取最新状态。
    scope = 'user'
  }

  // 从 `parsePluginIdentifier(plugin!)` 解构 name、marketplace，减少plugins对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(plugin!)
  // 记录plugins运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_disable_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
    scope: (scope ??
      'auto') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 等待 `disablePlugin(plugin!, scope)` 完成，再继续plugins的异步流程。
  await disablePlugin(plugin!, scope)
}

// plugin update (lines 5918–5948)
// pluginUpdateHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pluginUpdateHandler(
  plugin: string,
  options: { scope?: string; cowork?: boolean },
): Promise<void> {
  // 满足 `options.cowork) setUseCoworkPlugins(true` 时，plugins执行该分支。
  if (options.cowork) setUseCoworkPlugins(true)
  // 从 `parsePluginIdentifier(plugin)` 解构 name、marketplace，减少plugins对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(plugin)
  // 记录plugins运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_update_command', {
    _PROTO_plugin_name: name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    ...(marketplace && {
      _PROTO_marketplace_name:
        marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
    }),
  })

  // scope固定为 `'user'`，作为plugins后续展示或比较的基准。
  let scope: (typeof VALID_UPDATE_SCOPES)[number] = 'user'
  // 满足 `options.scope` 时，plugins执行该分支。
  if (options.scope) {
    // plugins在这里进入条件判断，后续代码按实际状态分流。
    if (
      !VALID_UPDATE_SCOPES.includes(
        options.scope as (typeof VALID_UPDATE_SCOPES)[number],
      )
    ) {
      // 调用 cliError，触发plugins此处需要的副作用。
      cliError(
        `Invalid scope "${options.scope}". Valid scopes: ${VALID_UPDATE_SCOPES.join(', ')}`,
      )
    }
    // scope更新为 `options.scope as (typeof VALID_UPDATE_SCOPES)[number]`，确保CLI后续读取最新状态。
    scope = options.scope as (typeof VALID_UPDATE_SCOPES)[number]
  }
  // `options.cowork && scope` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
  if (options.cowork && scope !== 'user') {
    // 调用 cliError，触发plugins此处需要的副作用。
    cliError('--cowork can only be used with user scope')
  }

  // 等待 `updatePluginCli(plugin, scope)` 完成，再继续plugins的异步流程。
  await updatePluginCli(plugin, scope)
}
