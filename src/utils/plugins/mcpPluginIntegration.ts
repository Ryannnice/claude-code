// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 expandEnvVarsInString 服务层能力，把外部通信或共享状态交给 ../../services/mcp/envExpansion.js 处理。
import { expandEnvVarsInString } from '../../services/mcp/envExpansion.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type McpServerConfig,
  McpServerConfigSchema,
  type ScopedMcpServerConfig,
} from '../../services/mcp/types.js'
// 类型依赖 { LoadedPlugin, PluginError } 来自 ../../types/plugin.js，用于校准插件管理的数据契约。
import type { LoadedPlugin, PluginError } from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage、isENOENT，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isENOENT } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  isMcpbSource,
  loadMcpbFile,
  loadMcpServerUserConfig,
  type McpbLoadResult,
  type UserConfigSchema,
  type UserConfigValues,
  validateUserConfig,
} from './mcpbHandler.js'
// 引入 getPluginDataDir，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginDataDir } from './pluginDirectories.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getPluginStorageId,
  loadPluginOptions,
  substitutePluginVariables,
  substituteUserConfigVariables,
} from './pluginOptionsStorage.js'

/**
 * Load MCP servers from an MCPB file
 * Handles downloading, extracting, and converting DXT manifest to MCP config
 */
// loadMcpServersFromMcpb 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadMcpServersFromMcpb(
  plugin: LoadedPlugin,
  mcpbPath: string,
  errors: PluginError[],
): Promise<Record<string, McpServerConfig> | null> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Loading MCP servers from MCPB: ${mcpbPath}`)

    // Use plugin.repository directly - it's already in "plugin@marketplace" format
    // pluginId 插件数据保存`plugin.repository`，供后续判断或组装使用。
    const pluginId = plugin.repository

    // 结果读取`loadMcpbFile`，供插件管理后续处理使用。
    const result = await loadMcpbFile(
      mcpbPath,
      plugin.path,
      pluginId,
      // status 集合更新为 `> {`，确保插件工具后续读取最新状态。
      status => {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`MCPB [${plugin.name}]: ${status}`)
      },
    )

    // Check if MCPB needs user configuration
    // 只有 `'status' in result && result.status === 'needs-co` 满足时，插件管理才执行该分支。
    if ('status' in result && result.status === 'needs-config') {
      // User config needed - this is normal for unconfigured plugins
      // Don't load the MCP server yet - user can configure via /plugin menu
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `MCPB ${mcpbPath} requires user configuration. ` +
          `User can configure via: /plugin → Manage plugins → ${plugin.name} → Configure`,
      )
      // Return null to skip this server for now (not an error)
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // Type guard passed - result is success type
    // successResult保存`result as McpbLoadResult`，供插件工具 mcp Plugin Integration后续判断或输出使用。
    const successResult = result as McpbLoadResult

    // Use the DXT manifest name as the server name
    // serverName保存`successResult.manifest.name`，供插件工具 mcp Plugin Integration后续判断或输出使用。
    const serverName = successResult.manifest.name

    // Check for server name conflicts with existing servers
    // This will be checked later when merging all servers, but we log here for debugging
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Loaded MCP server "${serverName}" from MCPB (extracted to ${successResult.extractedPath})`,
    )

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { [serverName]: successResult.mcpConfig }
  } catch (error) {
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load MCPB ${mcpbPath}: ${errorMsg}`, {
      level: 'error',
    })

    // Use plugin@repository as source (consistent with other plugin errors)
    // source保存``${plugin.name}@${plugin.repository}``，作为后续固定文本处理的输入。
    const source = `${plugin.name}@${plugin.repository}`

    // Determine error type based on error message
    // isUrl记录 `mcpbPath.startsWith` 是否成立，插件管理随后按该结果分支。
    const isUrl = mcpbPath.startsWith('http')
    // 插件管理在这里按实际状态进入对应分支。
    if (
      isUrl &&
      (errorMsg.includes('download') || errorMsg.includes('network'))
    ) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'mcpb-download-failed',
        source,
        plugin: plugin.name,
        url: mcpbPath,
        reason: errorMsg,
      })
    // 插件工具 mcp Plugin Integration在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      errorMsg.includes('manifest') ||
      errorMsg.includes('user configuration')
    ) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'mcpb-invalid-manifest',
        source,
        plugin: plugin.name,
        mcpbPath,
        validationError: errorMsg,
      })
    } else {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'mcpb-extract-failed',
        source,
        plugin: plugin.name,
        mcpbPath,
        reason: errorMsg,
      })
    }

    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Load MCP servers from a plugin's manifest
 * This function loads MCP server configurations from various sources within the plugin
 * including manifest entries, .mcp.json files, and .mcpb files
 */
// loadPluginMcpServers 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadPluginMcpServers(
  plugin: LoadedPlugin,
  errors: PluginError[] = [],
): Promise<Record<string, McpServerConfig> | undefined> {
  // servers 集合 从空对象开始收集键值，后续按名称补齐内容。
  let servers: Record<string, McpServerConfig> = {}

  // Check for .mcp.json in plugin directory first (lowest priority)
  // defaultMcpServers 集合读取`loadMcpServersFromFile`，供插件管理后续处理使用。
  const defaultMcpServers = await loadMcpServersFromFile(
    plugin.path,
    '.mcp.json',
  )
  // 满足 `defaultMcpServers` 时，插件管理执行该分支。
  if (defaultMcpServers) {
    // servers 集合更新为 `{ ...servers, ...defaultMcpServers }`，确保插件工具后续读取最新状态。
    servers = { ...servers, ...defaultMcpServers }
  }

  // Handle manifest mcpServers if present (higher priority)
  // 满足 `plugin.manifest.mcpServers` 时，插件管理执行该分支。
  if (plugin.manifest.mcpServers) {
    // mcpServersSpec 命名 `plugin.manifest.mcpServers`，让后续代码直接表达这个值的用途。
    const mcpServersSpec = plugin.manifest.mcpServers

    // Handle different mcpServers formats
    // 当 `typeof mcpServersSpec` 匹配 `'string'` 时，插件管理执行对应分支。
    if (typeof mcpServersSpec === 'string') {
      // Check if it's an MCPB file
      // 满足 `isMcpbSource(mcpServersSpec)` 时，插件管理执行该分支。
      if (isMcpbSource(mcpServersSpec)) {
        // mcpbServers 集合读取`loadMcpServersFromMcpb`，供插件管理后续处理使用。
        const mcpbServers = await loadMcpServersFromMcpb(
          plugin,
          mcpServersSpec,
          errors,
        )
        // 满足 `mcpbServers` 时，插件管理执行该分支。
        if (mcpbServers) {
          // servers 集合更新为 `{ ...servers, ...mcpbServers }`，确保插件工具后续读取最新状态。
          servers = { ...servers, ...mcpbServers }
        }
      } else {
        // Path to JSON file
        // mcpServers 集合读取`loadMcpServersFromFile`，供插件管理后续处理使用。
        const mcpServers = await loadMcpServersFromFile(
          plugin.path,
          mcpServersSpec,
        )
        // 满足 `mcpServers` 时，插件管理执行该分支。
        if (mcpServers) {
          // servers 集合更新为 `{ ...servers, ...mcpServers }`，确保插件工具后续读取最新状态。
          servers = { ...servers, ...mcpServers }
        }
      }
    // 插件工具 mcp Plugin Integration在这里处理 `} else if (Array.isArray(mcpServersSpec)) {`，完成这一小步状态转换。
    } else if (Array.isArray(mcpServersSpec)) {
      // Array of paths or inline configs.
      // Load all specs in parallel, then merge in original order so
      // last-wins collision semantics are preserved.
      // 结果列表保存`Promise.all`，供插件管理后续处理使用。
      const results = await Promise.all(
        // 调用 mcpServersSpec.map，触发插件管理此处需要的副作用。
        mcpServersSpec.map(async spec => {
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // 当 `typeof spec` 匹配 `'string'` 时，插件管理执行对应分支。
            if (typeof spec === 'string') {
              // Check if it's an MCPB file
              // 满足 `isMcpbSource(spec)` 时，插件管理执行该分支。
              if (isMcpbSource(spec)) {
                // 等待并返回 `loadMcpServersFromMcpb(plugin, spec, errors)`，调用方直接接收异步结果。
                return await loadMcpServersFromMcpb(plugin, spec, errors)
              }
              // Path to JSON file
              // 等待并返回 `loadMcpServersFromFile(plugin.path, spec)`，调用方直接接收异步结果。
              return await loadMcpServersFromFile(plugin.path, spec)
            }
            // Inline MCP server configs (sync)
            // 返回 `spec`，作为插件管理这次计算的结果。
            return spec
          } catch (e) {
            // Defensive: if one spec throws, don't lose results from the
            // others. The previous serial loop implicitly tolerated this.
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to load MCP servers from spec for plugin ${plugin.name}: ${e}`,
              { level: 'error' },
            )
            // 返回 `null`，作为插件管理这次计算的结果。
            return null
          }
        }),
      )
      // 按顺序遍历 `results` 中的结果，逐个交给插件管理处理。
      for (const result of results) {
        // 满足 `result` 时，插件管理执行该分支。
        if (result) {
          // servers 集合更新为 `{ ...servers, ...result }`，确保插件工具后续读取最新状态。
          servers = { ...servers, ...result }
        }
      }
    } else {
      // Direct MCP server configs
      // servers 集合更新为 `{ ...servers, ...mcpServersSpec }`，确保插件工具后续读取最新状态。
      servers = { ...servers, ...mcpServersSpec }
    }
  }

  // 返回 `Object.keys(servers).length > 0 ? servers : undefined`，作为插件管理这次计算的结果。
  return Object.keys(servers).length > 0 ? servers : undefined
}

/**
 * Load MCP servers from a JSON file within a plugin
 * This is a simplified version that doesn't expand environment variables
 * and is specifically for plugin MCP configs
 */
// loadMcpServersFromFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadMcpServersFromFile(
  pluginPath: string,
  relativePath: string,
): Promise<Record<string, McpServerConfig> | null> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // 文件路径格式化`join`，供插件管理后续处理使用。
  const filePath = join(pluginPath, relativePath)

  // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
  let content: string
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容更新为 `await fs.readFile(filePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
    content = await fs.readFile(filePath, { encoding: 'utf-8' })
  } catch (e: unknown) {
    // 满足 `isENOENT(e)` 时，插件管理执行该分支。
    if (isENOENT(e)) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load MCP servers from ${filePath}: ${e}`, {
      level: 'error',
    })
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供插件管理后续处理使用。
    const parsed = jsonParse(content)

    // Check if it's in the .mcp.json format with mcpServers key
    // mcpServers 集合标记插件工具 mcp Plugin Integration是否启用对应路径。
    const mcpServers = parsed.mcpServers || parsed

    // Validate each server config
    // validatedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
    const validatedServers: Record<string, McpServerConfig> = {}
    // 循环处理 `const [name, config] of Object.entries(mcpServers)`，让插件管理把同类条目按顺序走完。
    for (const [name, config] of Object.entries(mcpServers)) {
      // 结果保存`McpServerConfigSchema`，供插件管理后续处理使用。
      const result = McpServerConfigSchema().safeParse(config)
      // 满足 `result.success` 时，插件管理执行该分支。
      if (result.success) {
        // validatedServers[name更新为 `result.data`，确保插件工具 mcp Plugin Integration后续读取最新状态。
        validatedServers[name] = result.data
      } else {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Invalid MCP server config for ${name} in ${filePath}: ${result.error.message}`,
          { level: 'error' },
        )
      }
    }

    // 返回 `validatedServers`，作为插件管理这次计算的结果。
    return validatedServers
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load MCP servers from ${filePath}: ${error}`, {
      level: 'error',
    })
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * A channel entry from a plugin's manifest whose userConfig has not yet been
 * filled in (required fields are missing from saved settings).
 */
// UnconfiguredChannel 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type UnconfiguredChannel = {
  server: string
  displayName: string
  configSchema: UserConfigSchema
}

/**
 * Find channel entries in a plugin's manifest whose required userConfig
 * fields are not yet saved. Pure function — no React, no prompting.
 * ManagePlugins.tsx calls this after a plugin is enabled to decide whether
 * to show the config dialog.
 *
 * Entries without a `userConfig` schema are skipped (nothing to prompt for).
 * Entries whose saved config already satisfies `validateUserConfig` are
 * skipped. The `configSchema` in the return value is structurally a
 * `UserConfigSchema` because the Zod schema in schemas.ts matches
 * `McpbUserConfigurationOption` field-for-field.
 */
// getUnconfiguredChannels 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUnconfiguredChannels(
  plugin: LoadedPlugin,
): UnconfiguredChannel[] {
  // channels 集合 命名 `plugin.manifest.channels`，让后续代码直接表达这个值的用途。
  const channels = plugin.manifest.channels
  // !channels || channels 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (!channels || channels.length === 0) {
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }

  // plugin.repository is already in "plugin@marketplace" format — same key
  // loadMcpServerUserConfig / saveMcpServerUserConfig use.
  // pluginId 插件数据保存`plugin.repository`，供后续判断或组装使用。
  const pluginId = plugin.repository

  // unconfigured 配置 从空数组开始收集，后续循环会按处理顺序追加条目。
  const unconfigured: UnconfiguredChannel[] = []
  // 按顺序遍历 `channels` 中的channel，逐个交给插件管理处理。
  for (const channel of channels) {
    // !channel.userConfig || Object.k... 配置为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
    if (!channel.userConfig || Object.keys(channel.userConfig).length === 0) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }
    // saved读取`loadMcpServerUserConfig`，供插件管理后续处理使用。
    const saved = loadMcpServerUserConfig(pluginId, channel.server) ?? {}
    // validation读取`validateUserConfig`，供插件管理后续处理使用。
    const validation = validateUserConfig(saved, channel.userConfig)
    // validation.valid缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!validation.valid) {
      // unconfigured 配置追加新条目，保持收集顺序与输入顺序一致。
      unconfigured.push({
        server: channel.server,
        displayName: channel.displayName ?? channel.server,
        configSchema: channel.userConfig,
      })
    }
  }
  // 返回 `unconfigured`，作为插件管理这次计算的结果。
  return unconfigured
}

/**
 * Look up saved user config for a server, if this server is declared as a
 * channel in the plugin's manifest. Returns undefined for non-channel servers
 * or channels without a userConfig schema — resolvePluginMcpEnvironment will
 * then skip ${user_config.X} substitution for that server.
 */
// loadChannelUserConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function loadChannelUserConfig(
  plugin: LoadedPlugin,
  serverName: string,
): UserConfigValues | undefined {
  // channel筛选`find`，供插件管理后续处理使用。
  const channel = plugin.manifest.channels?.find(c => c.server === serverName)
  // 满足 `!channel?.userConfig` 时，插件管理执行该分支。
  if (!channel?.userConfig) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }
  // 返回 `loadMcpServerUserConfig(plugin.repository, serverName) ?? undefined`，作为插件管理这次计算的结果。
  return loadMcpServerUserConfig(plugin.repository, serverName) ?? undefined
}

/**
 * Add plugin scope to MCP server configs
 * This adds a prefix to server names to avoid conflicts between plugins
 */
// addPluginScopeToServers 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addPluginScopeToServers(
  servers: Record<string, McpServerConfig>,
  pluginName: string,
  pluginSource: string,
): Record<string, ScopedMcpServerConfig> {
  // scopedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const scopedServers: Record<string, ScopedMcpServerConfig> = {}

  // 循环处理 `const [name, config] of Object.entries(servers)`，让插件管理把同类条目按顺序走完。
  for (const [name, config] of Object.entries(servers)) {
    // Add plugin prefix to server name to avoid conflicts
    // scopedName保存``plugin:${pluginName}:${name}``，作为后续固定文本处理的输入。
    const scopedName = `plugin:${pluginName}:${name}`
    // scoped 集中保存插件工具 mcp Plugin Integration要一起传递的字段。
    const scoped: ScopedMcpServerConfig = {
      ...config,
      scope: 'dynamic', // Use dynamic scope for plugin servers
      pluginSource,
    }
    // scopedServers[scopedName更新为 `scoped`，确保插件工具 mcp Plugin Integration后续读取最新状态。
    scopedServers[scopedName] = scoped
  }

  // 返回 `scopedServers`，作为插件管理这次计算的结果。
  return scopedServers
}

/**
 * Extract all MCP servers from loaded plugins
 * NOTE: Resolves environment variables for all servers before returning
 */
// extractMcpServersFromPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function extractMcpServersFromPlugins(
  plugins: LoadedPlugin[],
  errors: PluginError[] = [],
): Promise<Record<string, ScopedMcpServerConfig>> {
  // allServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const allServers: Record<string, ScopedMcpServerConfig> = {}

  // scopedResults 集合保存`Promise.all`，供插件管理后续处理使用。
  const scopedResults = await Promise.all(
    // 调用 plugins.map，触发插件管理此处需要的副作用。
    plugins.map(async plugin => {
      // plugin.enabled 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!plugin.enabled) return null

      // servers 集合读取`loadPluginMcpServers`，供插件管理后续处理使用。
      const servers = await loadPluginMcpServers(plugin, errors)
      // servers 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!servers) return null

      // Resolve environment variables before scoping. When a saved channel
      // config is missing a key (plugin update added a required field, or a
      // hand-edited settings.json), substituteUserConfigVariables throws
      // inside resolvePluginMcpEnvironment — catch per-server so one bad
      // config doesn't crash the whole plugin load via Promise.all.
      // resolvedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
      const resolvedServers: Record<string, McpServerConfig> = {}
      // 循环处理 `const [name, config] of Object.entries(servers)`，让插件管理把同类条目按顺序走完。
      for (const [name, config] of Object.entries(servers)) {
        // userConfig 配置构建`buildMcpUserConfig`，供插件管理后续处理使用。
        const userConfig = buildMcpUserConfig(plugin, name)
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // resolvedServers[name更新为 `resolvePluginMcpEnvironment(`，确保插件工具 mcp Plugin Integration后续读取最新状态。
          resolvedServers[name] = resolvePluginMcpEnvironment(
            config,
            plugin,
            userConfig,
            errors,
            plugin.name,
            name,
          )
        } catch (err) {
          // 调用 errors?.push({，完成这一处局部操作。
          errors?.push({
            type: 'generic-error',
            source: name,
            plugin: plugin.name,
            error: errorMessage(err),
          })
        }
      }

      // Store the UNRESOLVED servers on the plugin for caching
      // (Environment variables will be resolved fresh each time they're needed)
      // mcpServers 集合更新为 `servers`，确保插件工具后续读取最新状态。
      plugin.mcpServers = servers

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Loaded ${Object.keys(servers).length} MCP servers from plugin ${plugin.name}`,
      )

      // 返回 `addPluginScopeToServers(`，作为插件管理这次计算的结果。
      return addPluginScopeToServers(
        resolvedServers,
        plugin.name,
        plugin.source,
      )
    }),
  )

  // 按顺序遍历 `scopedResults` 中的scopedServers 集合，逐个交给插件管理处理。
  for (const scopedServers of scopedResults) {
    // 满足 `scopedServers` 时，插件管理执行该分支。
    if (scopedServers) {
      // 调用 Object.assign，触发插件管理此处需要的副作用。
      Object.assign(allServers, scopedServers)
    }
  }

  // 返回 `allServers`，作为插件管理这次计算的结果。
  return allServers
}

/**
 * Build the userConfig map for a single MCP server by merging the plugin's
 * top-level manifest.userConfig values with the channel-specific per-server
 * config (assistant-mode channels). Channel-specific wins on collision so
 * plugins that declare the same key at both levels get the more specific value.
 *
 * Returns undefined when neither source has anything — resolvePluginMcpEnvironment
 * skips substituteUserConfigVariables in that case.
 */
// buildMcpUserConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildMcpUserConfig(
  plugin: LoadedPlugin,
  serverName: string,
): UserConfigValues | undefined {
  // Gate on manifest.userConfig. loadPluginOptions always returns at least {}
  // (it spreads two `?? {}` fallbacks), so without this guard topLevel is never
  // undefined — the `!topLevel` check below is dead, we return {} for
  // unconfigured plugins, and resolvePluginMcpEnvironment runs
  // substituteUserConfigVariables against an empty map → throws on any
  // ${user_config.X} ref. The manifest check also skips the unconditional
  // keychain read (~50-100ms on macOS) for plugins that don't use options.
  // topLevel保存`plugin.manifest.userConfig`，供后续判断或组装使用。
  const topLevel = plugin.manifest.userConfig
    ? loadPluginOptions(getPluginStorageId(plugin))
    : undefined
  // channelSpecific读取`loadChannelUserConfig`，供插件管理后续处理使用。
  const channelSpecific = loadChannelUserConfig(plugin, serverName)

  // 只有 `!topLevel && !channelSpecific` 满足时，插件管理才执行该分支。
  if (!topLevel && !channelSpecific) return undefined
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { ...topLevel, ...channelSpecific }
}

/**
 * Resolve environment variables for plugin MCP servers
 * Handles ${CLAUDE_PLUGIN_ROOT}, ${user_config.X}, and general ${VAR} substitution
 * Tracks missing environment variables for error reporting
 */
// resolvePluginMcpEnvironment 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolvePluginMcpEnvironment(
  config: McpServerConfig,
  plugin: { path: string; source: string },
  userConfig?: UserConfigValues,
  errors?: PluginError[],
  pluginName?: string,
  serverName?: string,
): McpServerConfig {
  // allMissingVars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allMissingVars: string[] = []

  // resolveValue封装成回调，供插件工具 mcp Plugin Integration在事件触发或异步步骤中调用。
  const resolveValue = (value: string): string => {
    // First substitute plugin-specific variables
    // resolved保存`substitutePluginVariables`，供插件管理后续处理使用。
    let resolved = substitutePluginVariables(value, plugin)

    // Then substitute user config variables if provided
    // 满足 `userConfig` 时，插件管理执行该分支。
    if (userConfig) {
      // resolved更新为 `substituteUserConfigVariables(resolved, userConfig)`，确保插件工具后续读取最新状态。
      resolved = substituteUserConfigVariables(resolved, userConfig)
    }

    // Finally expand general environment variables
    // This is done last so plugin-specific and user config vars take precedence
    // 从 `expandEnvVarsInString(resolved)` 解构 expanded、missingVars，减少插件工具 mcp Plugin Integration对同一对象的重复访问。
    const { expanded, missingVars } = expandEnvVarsInString(resolved)
    // allMissingVars 集合追加新条目，保持收集顺序与输入顺序一致。
    allMissingVars.push(...missingVars)

    // 返回 `expanded`，作为插件管理这次计算的结果。
    return expanded
  }

  // resolved 先占位，稍后的条件分支会根据实际输入补齐它。
  let resolved: McpServerConfig

  // Handle different server types
  // 按照 config.type 的取值选择插件管理的具体处理分支。
  switch (config.type) {
    case undefined:
    case 'stdio': {
      // stdioConfig 配置 集中保存插件工具 mcp Plugin Integration要一起传递的字段。
      const stdioConfig = { ...config }

      // Resolve command path
      // 满足 `stdioConfig.command` 时，插件管理执行该分支。
      if (stdioConfig.command) {
        // 命令更新为 `resolveValue(stdioConfig.command)`，确保插件工具后续读取最新状态。
        stdioConfig.command = resolveValue(stdioConfig.command)
      }

      // Resolve args
      // 满足 `stdioConfig.args` 时，插件管理执行该分支。
      if (stdioConfig.args) {
        // 参数列表更新为 `stdioConfig.args.map(arg => resolveValue(arg))`，确保插件工具后续读取最新状态。
        stdioConfig.args = stdioConfig.args.map(arg => resolveValue(arg))
      }

      // Resolve environment variables and add CLAUDE_PLUGIN_ROOT / CLAUDE_PLUGIN_DATA
      // resolvedEnv 集中保存插件工具 mcp Plugin Integration要一起传递的字段。
      const resolvedEnv: Record<string, string> = {
        CLAUDE_PLUGIN_ROOT: plugin.path,
        CLAUDE_PLUGIN_DATA: getPluginDataDir(plugin.source),
        ...(stdioConfig.env || {}),
      }
      // 循环处理 `const [key, value] of Object.entries(resolvedEnv)`，让插件管理把同类条目按顺序走完。
      for (const [key, value] of Object.entries(resolvedEnv)) {
        // `key` 与 `'CLAUDE_PLUGIN_ROOT' && key !==...` 不一致时刷新派生状态，避免使用过期结果。
        if (key !== 'CLAUDE_PLUGIN_ROOT' && key !== 'CLAUDE_PLUGIN_DATA') {
          // resolvedEnv[key更新为 `resolveValue(value)`，确保插件工具 mcp Plugin Integration后续读取最新状态。
          resolvedEnv[key] = resolveValue(value)
        }
      }
      // env更新为 `resolvedEnv`，确保插件工具后续读取最新状态。
      stdioConfig.env = resolvedEnv

      // resolved更新为 `stdioConfig`，确保插件工具后续读取最新状态。
      resolved = stdioConfig
      // 结束这个分支或循环，避免插件管理继续落入后续路径。
      break
    }

    case 'sse':
    case 'http':
    case 'ws': {
      // remoteConfig 配置 集中保存插件工具 mcp Plugin Integration要一起传递的字段。
      const remoteConfig = { ...config }

      // Resolve URL
      // 满足 `remoteConfig.url` 时，插件管理执行该分支。
      if (remoteConfig.url) {
        // URL更新为 `resolveValue(remoteConfig.url)`，确保插件工具后续读取最新状态。
        remoteConfig.url = resolveValue(remoteConfig.url)
      }

      // Resolve headers
      // 满足 `remoteConfig.headers` 时，插件管理执行该分支。
      if (remoteConfig.headers) {
        // resolvedHeaders 集合 从空对象开始收集键值，后续按名称补齐内容。
        const resolvedHeaders: Record<string, string> = {}
        // 循环处理 `const [key, value] of Object.entries(remoteConfig.headers)`，让插件管理把同类条目按顺序走完。
        for (const [key, value] of Object.entries(remoteConfig.headers)) {
          // resolvedHeaders[key更新为 `resolveValue(value)`，确保插件工具 mcp Plugin Integration后续读取最新状态。
          resolvedHeaders[key] = resolveValue(value)
        }
        // 请求头更新为 `resolvedHeaders`，确保插件工具后续读取最新状态。
        remoteConfig.headers = resolvedHeaders
      }

      // resolved更新为 `remoteConfig`，确保插件工具后续读取最新状态。
      resolved = remoteConfig
      // 结束这个分支或循环，避免插件管理继续落入后续路径。
      break
    }

    // For other types (sse-ide, ws-ide, sdk, claudeai-proxy), pass through unchanged
    case 'sse-ide':
    case 'ws-ide':
    case 'sdk':
    case 'claudeai-proxy':
      // resolved更新为 `config`，确保插件工具后续读取最新状态。
      resolved = config
      // 结束这个分支或循环，避免插件管理继续落入后续路径。
      break
  }

  // Log and track missing variables if any were found and errors array provided
  // 只有 `errors && allMissingVars.length > 0` 满足时，插件管理才执行该分支。
  if (errors && allMissingVars.length > 0) {
    // uniqueMissingVars 集合保存`Set`，供插件管理后续处理使用。
    const uniqueMissingVars = [...new Set(allMissingVars)]
    // varList 集合格式化`uniqueMissingVars.join`，供插件管理后续处理使用。
    const varList = uniqueMissingVars.join(', ')

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Missing environment variables in plugin MCP config: ${varList}`,
      { level: 'warn' },
    )

    // Add error to the errors array if plugin and server names are provided
    // 只有 `pluginName && serverName` 满足时，插件管理才执行该分支。
    if (pluginName && serverName) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'mcp-config-invalid',
        source: `plugin:${pluginName}`,
        plugin: pluginName,
        serverName,
        validationError: `Missing environment variables: ${varList}`,
      })
    }
  }

  // 返回 `resolved`，作为插件管理这次计算的结果。
  return resolved
}

/**
 * Get MCP servers from a specific plugin with environment variable resolution and scoping
 * This function is called when the MCP servers need to be activated and ensures they have
 * the proper environment variables and scope applied
 */
// getPluginMcpServers 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPluginMcpServers(
  plugin: LoadedPlugin,
  errors: PluginError[] = [],
): Promise<Record<string, ScopedMcpServerConfig> | undefined> {
  // plugin.enabled 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!plugin.enabled) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }

  // Use cached servers if available
  // servers 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const servers =
    plugin.mcpServers || (await loadPluginMcpServers(plugin, errors))
  // servers 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!servers) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }

  // Resolve environment variables. Same per-server try/catch as
  // extractMcpServersFromPlugins above: a partial saved channel config
  // (plugin update added a required field) would make
  // substituteUserConfigVariables throw inside resolvePluginMcpEnvironment,
  // and this function runs inside Promise.all at config.ts:911 — one
  // uncaught throw crashes all plugin MCP loading.
  // resolvedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const resolvedServers: Record<string, McpServerConfig> = {}
  // 循环处理 `const [name, config] of Object.entries(servers)`，让插件管理把同类条目按顺序走完。
  for (const [name, config] of Object.entries(servers)) {
    // userConfig 配置构建`buildMcpUserConfig`，供插件管理后续处理使用。
    const userConfig = buildMcpUserConfig(plugin, name)
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // resolvedServers[name更新为 `resolvePluginMcpEnvironment(`，确保插件工具 mcp Plugin Integration后续读取最新状态。
      resolvedServers[name] = resolvePluginMcpEnvironment(
        config,
        plugin,
        userConfig,
        errors,
        plugin.name,
        name,
      )
    } catch (err) {
      // 调用 errors?.push({，完成这一处局部操作。
      errors?.push({
        type: 'generic-error',
        source: name,
        plugin: plugin.name,
        error: errorMessage(err),
      })
    }
  }

  // Add plugin scope
  // 返回 `addPluginScopeToServers(resolvedServers, plugin.name, plugin.source)`，作为插件管理这次计算的结果。
  return addPluginScopeToServers(resolvedServers, plugin.name, plugin.source)
}
