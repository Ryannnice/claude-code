/**
 * LSP Plugin Recommendation Utility
 *
 * Scans installed marketplaces for LSP plugins and recommends plugins
 * based on file extensions, but ONLY when the LSP binary is already
 * installed on the system.
 *
 * Limitation: Can only detect LSP plugins that declare their servers
 * inline in the marketplace entry. Plugins with separate .lsp.json files
 * are not detectable until after installation.
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { extname } from 'path'
// 引入 isBinaryInstalled，将 ../binaryCheck.js 中已经封装好的能力接到本文件流程里。
import { isBinaryInstalled } from '../binaryCheck.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isPluginInstalled，将 ./installedPluginsManager.js 中已经封装好的能力接到本文件流程里。
import { isPluginInstalled } from './installedPluginsManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getMarketplace,
  loadKnownMarketplacesConfig,
} from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  ALLOWED_OFFICIAL_MARKETPLACE_NAMES,
  type PluginMarketplaceEntry,
} from './schemas.js'

/**
 * LSP plugin recommendation returned to the caller
 */
// LspPluginRecommendation 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type LspPluginRecommendation = {
  pluginId: string // "plugin-name@marketplace-name"
  pluginName: string // Human-readable plugin name
  marketplaceName: string // Marketplace name
  description?: string // Plugin description
  isOfficial: boolean // From official marketplace?
  extensions: string[] // File extensions this plugin supports
  command: string // LSP server command (e.g., "typescript-language-server")
}

// Maximum number of times user can ignore recommendations before we stop showing
// MAX_IGNORED_COUNT 数量 命名 `5`，让后续代码直接表达这个值的用途。
const MAX_IGNORED_COUNT = 5

/**
 * Check if a marketplace is official (from Anthropic)
 */
// isOfficialMarketplace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isOfficialMarketplace(name: string): boolean {
  // 返回 `ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(name.toLowerCase())`，作为插件管理这次计算的结果。
  return ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(name.toLowerCase())
}

/**
 * Internal type for LSP info extracted from plugin manifest
 */
// LspInfo 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type LspInfo = {
  extensions: Set<string>
  command: string
}

/**
 * Extract LSP info (extensions and command) from inline lspServers config.
 *
 * NOTE: Can only read inline configs, not external .lsp.json files.
 * String paths are skipped as they reference files only available after installation.
 *
 * @param lspServers - The lspServers field from PluginMarketplaceEntry
 * @returns LSP info with extensions and command, or null if not extractable
 */
// extractLspInfoFromManifest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractLspInfoFromManifest(
  lspServers: PluginMarketplaceEntry['lspServers'],
): LspInfo | null {
  // lspServers 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!lspServers) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // If it's a string path (e.g., "./.lsp.json"), we can't read it from marketplace
  // 当 `typeof lspServers` 匹配 `'string'` 时，插件管理执行对应分支。
  if (typeof lspServers === 'string') {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[lspRecommendation] Skipping string path lspServers (not readable from marketplace)',
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // If it's an array, process each element
  // 满足 `Array.isArray(lspServers)` 时，插件管理执行该分支。
  if (Array.isArray(lspServers)) {
    // 按顺序遍历 `lspServers` 中的item，逐个交给插件管理处理。
    for (const item of lspServers) {
      // Skip string paths in arrays
      // 当 `typeof item` 匹配 `'string'` 时，插件管理执行对应分支。
      if (typeof item === 'string') {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // Try to extract from inline config object
      // info保存`extractFromServerConfigRecord`，供插件管理后续处理使用。
      const info = extractFromServerConfigRecord(item)
      // 满足 `info` 时，插件管理执行该分支。
      if (info) {
        // 返回 `info`，作为插件管理这次计算的结果。
        return info
      }
    }
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // It's an inline config object: Record<string, LspServerConfig>
  // 返回 `extractFromServerConfigRecord(lspServers)`，作为插件管理这次计算的结果。
  return extractFromServerConfigRecord(lspServers)
}

/**
 * Extract LSP info from a server config record (inline object format)
 */
/**
 * Type guard to check if a value is a record object
 */
// isRecord 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRecord(value: unknown): value is Record<string, unknown> {
  // 返回 `typeof value === 'object' && value !== null`，作为插件管理这次计算的结果。
  return typeof value === 'object' && value !== null
}

// extractFromServerConfigRecord 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractFromServerConfigRecord(
  serverConfigs: Record<string, unknown>,
): LspInfo | null {
  // extensions 集合构建`new Set<string>()`，供后续判断或组装使用。
  const extensions = new Set<string>()
  // 命令 命名 `null`，让后续代码直接表达这个值的用途。
  let command: string | null = null

  // 循环处理 `const [_serverName, config] of Object.entries(serverConfigs)`，让插件管理把同类条目按顺序走完。
  for (const [_serverName, config] of Object.entries(serverConfigs)) {
    // 满足 `!isRecord(config)` 时，插件管理执行该分支。
    if (!isRecord(config)) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // Get command from first valid server config
    // 当 `!command && typeof config.command` 匹配 `'string'` 时，插件管理执行对应分支。
    if (!command && typeof config.command === 'string') {
      // 命令更新为 `config.command`，确保插件工具后续读取最新状态。
      command = config.command
    }

    // Collect all extensions from extensionToLanguage mapping
    // extMapping保存`config.extensionToLanguage`，供后续判断或组装使用。
    const extMapping = config.extensionToLanguage
    // 满足 `isRecord(extMapping)` 时，插件管理执行该分支。
    if (isRecord(extMapping)) {
      // 逐项读取 `Object.keys(extMapping)` 中的ext，按输入顺序推进插件管理。
      for (const ext of Object.keys(extMapping)) {
        // 调用 extensions.add，触发插件管理此处需要的副作用。
        extensions.add(ext.toLowerCase())
      }
    }
  }

  // 只有 `!command || extensions.size === 0` 满足时，插件管理才执行该分支。
  if (!command || extensions.size === 0) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { extensions, command }
}

/**
 * Internal type for plugin with LSP info
 */
// LspPluginInfo 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type LspPluginInfo = {
  entry: PluginMarketplaceEntry
  marketplaceName: string
  extensions: Set<string>
  command: string
  isOfficial: boolean
}

/**
 * Get all LSP plugins from all installed marketplaces
 *
 * @returns Map of pluginId to plugin info with LSP metadata
 */
// getLspPluginsFromMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getLspPluginsFromMarketplaces(): Promise<
  Map<string, LspPluginInfo>
> {
  // 结果构建`new Map<string, LspPluginInfo>()`，供后续判断或组装使用。
  const result = new Map<string, LspPluginInfo>()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
    const config = await loadKnownMarketplacesConfig()

    // 逐项读取 `Object.keys(config)` 中的marketplaceName 市场数据，按输入顺序推进插件管理。
    for (const marketplaceName of Object.keys(config)) {
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // marketplace 市场数据读取`getMarketplace`，供插件管理后续处理使用。
        const marketplace = await getMarketplace(marketplaceName)
        // isOfficial记录 `isOfficialMarketplace` 是否成立，插件管理随后按该结果分支。
        const isOfficial = isOfficialMarketplace(marketplaceName)

        // 按顺序遍历 `marketplace.plugins` 中的entry，逐个交给插件管理处理。
        for (const entry of marketplace.plugins) {
          // Skip plugins without lspServers
          // entry.lspServers 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
          if (!entry.lspServers) {
            // 跳过当前项，继续处理插件管理中的下一轮循环。
            continue
          }

          // lspInfo保存`extractLspInfoFromManifest`，供插件管理后续处理使用。
          const lspInfo = extractLspInfoFromManifest(entry.lspServers)
          // lspInfo缺失时直接走兜底路径，避免插件管理使用无效输入。
          if (!lspInfo) {
            // 跳过当前项，继续处理插件管理中的下一轮循环。
            continue
          }

          // pluginId 插件数据 命名 ``${entry.name}@${marketplaceName}``，让后续代码直接表达这个值的用途。
          const pluginId = `${entry.name}@${marketplaceName}`
          // result.set 写入新的状态值，使插件管理后续读取保持一致。
          result.set(pluginId, {
            entry,
            marketplaceName,
            extensions: lspInfo.extensions,
            command: lspInfo.command,
            isOfficial,
          })
        }
      } catch (error) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[lspRecommendation] Failed to load marketplace ${marketplaceName}: ${error}`,
        )
      }
    }
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[lspRecommendation] Failed to load marketplaces config: ${error}`,
    )
  }

  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

/**
 * Find matching LSP plugins for a file path.
 *
 * Returns recommendations for plugins that:
 * 1. Support the file's extension
 * 2. Have their LSP binary installed on the system
 * 3. Are not already installed
 * 4. Are not in the user's "never suggest" list
 *
 * Results are sorted with official marketplace plugins first.
 *
 * @param filePath - Path to the file to find LSP plugins for
 * @returns Array of matching plugin recommendations (empty if none or disabled)
 */
// getMatchingLspPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMatchingLspPlugins(
  filePath: string,
): Promise<LspPluginRecommendation[]> {
  // Check if globally disabled
  // 满足 `isLspRecommendationsDisabled()` 时，插件管理执行该分支。
  if (isLspRecommendationsDisabled()) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[lspRecommendation] Recommendations are disabled')
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }

  // Extract file extension
  // ext保存`extname`，供插件管理后续处理使用。
  const ext = extname(filePath).toLowerCase()
  // ext缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!ext) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[lspRecommendation] No file extension found')
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[lspRecommendation] Looking for LSP plugins for ${ext}`)

  // Get all LSP plugins from marketplaces
  // allLspPlugins 插件数据读取`getLspPluginsFromMarketplaces`，供插件管理后续处理使用。
  const allLspPlugins = await getLspPluginsFromMarketplaces()

  // Get config for filtering
  // 配置读取`getGlobalConfig`，供插件管理后续处理使用。
  const config = getGlobalConfig()
  // neverPlugins 插件数据保存`config.lspRecommendationNeverPlugins ?? []`，供后续判断或组装使用。
  const neverPlugins = config.lspRecommendationNeverPlugins ?? []

  // Filter to matching plugins
  // matchingPlugins 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const matchingPlugins: Array<{ info: LspPluginInfo; pluginId: string }> = []

  // 循环处理 `const [pluginId, info] of allLspPlugins`，让插件管理逐项把同类条目按顺序走完。
  for (const [pluginId, info] of allLspPlugins) {
    // Check extension match
    // 满足 `!info.extensions.has(ext)` 时，插件管理执行该分支。
    if (!info.extensions.has(ext)) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // Filter: not in "never" list
    // 满足 `neverPlugins.includes(pluginId)` 时，插件管理执行该分支。
    if (neverPlugins.includes(pluginId)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[lspRecommendation] Skipping ${pluginId} (in never suggest list)`,
      )
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // Filter: not already installed
    // 满足 `isPluginInstalled(pluginId)` 时，插件管理执行该分支。
    if (isPluginInstalled(pluginId)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[lspRecommendation] Skipping ${pluginId} (already installed)`,
      )
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // matchingPlugins 插件数据追加新条目，保持收集顺序与输入顺序一致。
    matchingPlugins.push({ info, pluginId })
  }

  // Filter: binary must be installed (async check)
  // pluginsWithBinary 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const pluginsWithBinary: Array<{ info: LspPluginInfo; pluginId: string }> = []

  // 循环处理 `const { info, pluginId } of matchingPlugins`，让插件管理逐项把同类条目按顺序走完。
  for (const { info, pluginId } of matchingPlugins) {
    // binaryExists 集合保存`isBinaryInstalled`，供插件管理后续处理使用。
    const binaryExists = await isBinaryInstalled(info.command)
    // 满足 `binaryExists` 时，插件管理执行该分支。
    if (binaryExists) {
      // pluginsWithBinary 插件数据追加新条目，保持收集顺序与输入顺序一致。
      pluginsWithBinary.push({ info, pluginId })
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[lspRecommendation] Binary '${info.command}' found for ${pluginId}`,
      )
    } else {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[lspRecommendation] Skipping ${pluginId} (binary '${info.command}' not found)`,
      )
    }
  }

  // Sort: official marketplaces first
  // 调用 pluginsWithBinary.sort，触发插件管理此处需要的副作用。
  pluginsWithBinary.sort((a, b) => {
    // 只有 `a.info.isOfficial && !b.info.isOfficial` 满足时，插件管理才执行该分支。
    if (a.info.isOfficial && !b.info.isOfficial) return -1
    // 只有 `!a.info.isOfficial && b.info.isOfficial` 满足时，插件管理才执行该分支。
    if (!a.info.isOfficial && b.info.isOfficial) return 1
    // 返回 `0`，作为插件管理这次计算的结果。
    return 0
  })

  // Convert to recommendations
  // 返回 `pluginsWithBinary.map(({ info, pluginId }) => ({`，作为插件管理这次计算的结果。
  return pluginsWithBinary.map(({ info, pluginId }) => ({
    pluginId,
    pluginName: info.entry.name,
    marketplaceName: info.marketplaceName,
    description: info.entry.description,
    isOfficial: info.isOfficial,
    extensions: Array.from(info.extensions),
    command: info.command,
  }))
}

/**
 * Add a plugin to the "never suggest" list
 *
 * @param pluginId - Plugin ID to never suggest again
 */
// addToNeverSuggest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToNeverSuggest(pluginId: string): void {
  // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
  saveGlobalConfig(currentConfig => {
    // current 命名 `currentConfig.lspRecommendationNeverPlugins ?? []`，让后续代码直接表达这个值的用途。
    const current = currentConfig.lspRecommendationNeverPlugins ?? []
    // 满足 `current.includes(pluginId)` 时，插件管理执行该分支。
    if (current.includes(pluginId)) {
      // 返回 `currentConfig`，作为插件管理这次计算的结果。
      return currentConfig
    }
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...currentConfig,
      lspRecommendationNeverPlugins: [...current, pluginId],
    }
  })
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[lspRecommendation] Added ${pluginId} to never suggest`)
}

/**
 * Increment the ignored recommendation count.
 * After MAX_IGNORED_COUNT ignores, recommendations are disabled.
 */
// incrementIgnoredCount 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function incrementIgnoredCount(): void {
  // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
  saveGlobalConfig(currentConfig => {
    // newCount 数量 命名 `(currentConfig.lspRecommendationIgnoredCount ?? 0) + 1`，让后续代码直接表达这个值的用途。
    const newCount = (currentConfig.lspRecommendationIgnoredCount ?? 0) + 1
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...currentConfig,
      lspRecommendationIgnoredCount: newCount,
    }
  })
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[lspRecommendation] Incremented ignored count')
}

/**
 * Check if LSP recommendations are disabled.
 * Disabled when:
 * - User explicitly disabled via config
 * - User has ignored MAX_IGNORED_COUNT recommendations
 */
// isLspRecommendationsDisabled 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLspRecommendationsDisabled(): boolean {
  // 配置读取`getGlobalConfig`，供插件管理后续处理使用。
  const config = getGlobalConfig()
  // 返回 `(`，作为插件管理这次计算的结果。
  return (
    config.lspRecommendationDisabled === true ||
    (config.lspRecommendationIgnoredCount ?? 0) >= MAX_IGNORED_COUNT
  )
}

/**
 * Reset the ignored count (useful if user re-enables recommendations)
 */
// resetIgnoredCount 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetIgnoredCount(): void {
  // 调用 saveGlobalConfig，触发插件管理此处需要的副作用。
  saveGlobalConfig(currentConfig => {
    // currentCount 数量保存`currentConfig.lspRecommendationIgnoredCount ?? 0`，供后续判断或组装使用。
    const currentCount = currentConfig.lspRecommendationIgnoredCount ?? 0
    // 满足 `currentCount === 0` 时，插件管理执行该分支。
    if (currentCount === 0) {
      // 返回 `currentConfig`，作为插件管理这次计算的结果。
      return currentConfig
    }
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...currentConfig,
      lspRecommendationIgnoredCount: 0,
    }
  })
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[lspRecommendation] Reset ignored count')
}
