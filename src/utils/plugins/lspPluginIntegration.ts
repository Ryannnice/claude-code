// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, relative, resolve } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import type {
  LspServerConfig,
  ScopedLspServerConfig,
} from '../../services/lsp/types.js'
// 接入 expandEnvVarsInString 服务层能力，把外部通信或共享状态交给 ../../services/mcp/envExpansion.js 处理。
import { expandEnvVarsInString } from '../../services/mcp/envExpansion.js'
// 类型依赖 { LoadedPlugin, PluginError } 来自 ../../types/plugin.js，用于校准插件管理的数据契约。
import type { LoadedPlugin, PluginError } from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isENOENT、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT, toError } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'
// 引入 getPluginDataDir，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginDataDir } from './pluginDirectories.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getPluginStorageId,
  loadPluginOptions,
  type PluginOptionValues,
  substitutePluginVariables,
  substituteUserConfigVariables,
} from './pluginOptionsStorage.js'
// 引入 LspServerConfigSchema，将 ./schemas.js 中已经封装好的能力接到本文件流程里。
import { LspServerConfigSchema } from './schemas.js'

/**
 * Validate that a resolved path stays within the plugin directory.
 * Prevents path traversal attacks via .. or absolute paths.
 */
// validatePathWithinPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validatePathWithinPlugin(
  pluginPath: string,
  relativePath: string,
): string | null {
  // Resolve both paths to absolute paths
  // resolvedPluginPath 插件数据读取`resolve`，供插件管理后续处理使用。
  const resolvedPluginPath = resolve(pluginPath)
  // resolvedFilePath 路径数据读取`resolve`，供插件管理后续处理使用。
  const resolvedFilePath = resolve(pluginPath, relativePath)

  // Check if the resolved file path is within the plugin directory
  // rel保存`relative`，供插件管理后续处理使用。
  const rel = relative(resolvedPluginPath, resolvedFilePath)

  // If relative path starts with .. or is absolute, it's outside the plugin dir
  // 只有 `rel.startsWith('..') || resolve(rel) === rel` 满足时，插件管理才执行该分支。
  if (rel.startsWith('..') || resolve(rel) === rel) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // 返回 `resolvedFilePath`，作为插件管理这次计算的结果。
  return resolvedFilePath
}

/**
 * Load LSP server configurations from a plugin.
 * Checks for:
 * 1. .lsp.json file in plugin directory
 * 2. manifest.lspServers field
 *
 * @param plugin - The loaded plugin
 * @param errors - Array to collect any errors encountered
 * @returns Record of server name to config, or undefined if no servers
 */
// loadPluginLspServers 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadPluginLspServers(
  plugin: LoadedPlugin,
  errors: PluginError[] = [],
): Promise<Record<string, LspServerConfig> | undefined> {
  // servers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const servers: Record<string, LspServerConfig> = {}

  // 1. Check for .lsp.json file in plugin directory
  // lspJsonPath 路径数据格式化`join`，供插件管理后续处理使用。
  const lspJsonPath = join(plugin.path, '.lsp.json')
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供插件管理后续处理使用。
    const content = await readFile(lspJsonPath, 'utf-8')
    // 解析结果解析`jsonParse`，供插件管理后续处理使用。
    const parsed = jsonParse(content)
    // 结果保存`z`，供后续判断或组装使用。
    const result = z
      .record(z.string(), LspServerConfigSchema())
      .safeParse(parsed)

    // 满足 `result.success` 时，插件管理执行该分支。
    if (result.success) {
      // 调用 Object.assign，触发插件管理此处需要的副作用。
      Object.assign(servers, result.data)
    } else {
      // errorMsg 错误信息 命名 ``LSP config validation failed for .lsp.json in plugin ${p...`，让后续代码直接表达这个值的用途。
      const errorMsg = `LSP config validation failed for .lsp.json in plugin ${plugin.name}: ${result.error.message}`
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(new Error(errorMsg))
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'lsp-config-invalid',
        plugin: plugin.name,
        serverName: '.lsp.json',
        validationError: result.error.message,
        source: 'plugin',
      })
    }
  } catch (error) {
    // .lsp.json is optional, ignore if it doesn't exist
    // 满足 `!isENOENT(error)` 时，插件管理执行该分支。
    if (!isENOENT(error)) {
      // _errorMsg 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const _errorMsg =
        error instanceof Error
          ? `Failed to read/parse .lsp.json in plugin ${plugin.name}: ${error.message}`
          : `Failed to read/parse .lsp.json file in plugin ${plugin.name}`

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))

      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        type: 'lsp-config-invalid',
        plugin: plugin.name,
        serverName: '.lsp.json',
        validationError:
          error instanceof Error
            ? `Failed to parse JSON: ${error.message}`
            : 'Failed to parse JSON file',
        source: 'plugin',
      })
    }
  }

  // 2. Check manifest.lspServers field
  // 满足 `plugin.manifest.lspServers` 时，插件管理执行该分支。
  if (plugin.manifest.lspServers) {
    // manifestServers 集合读取`loadLspServersFromManifest`，供插件管理后续处理使用。
    const manifestServers = await loadLspServersFromManifest(
      plugin.manifest.lspServers,
      plugin.path,
      plugin.name,
      errors,
    )
    // 满足 `manifestServers` 时，插件管理执行该分支。
    if (manifestServers) {
      // 调用 Object.assign，触发插件管理此处需要的副作用。
      Object.assign(servers, manifestServers)
    }
  }

  // 返回 `Object.keys(servers).length > 0 ? servers : undefined`，作为插件管理这次计算的结果。
  return Object.keys(servers).length > 0 ? servers : undefined
}

/**
 * Load LSP servers from manifest declaration (handles multiple formats).
 */
// loadLspServersFromManifest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadLspServersFromManifest(
  declaration:
    | string
    | Record<string, LspServerConfig>
    | Array<string | Record<string, LspServerConfig>>,
  pluginPath: string,
  pluginName: string,
  errors: PluginError[],
): Promise<Record<string, LspServerConfig> | undefined> {
  // servers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const servers: Record<string, LspServerConfig> = {}

  // Normalize to array
  // declarations 集合保存`Array.isArray`，供插件管理后续处理使用。
  const declarations = Array.isArray(declaration) ? declaration : [declaration]

  // 按顺序遍历 `declarations` 中的decl，逐个交给插件管理处理。
  for (const decl of declarations) {
    // 当 `typeof decl` 匹配 `'string'` 时，插件管理执行对应分支。
    if (typeof decl === 'string') {
      // Validate path to prevent directory traversal
      // validatedPath 路径数据读取`validatePathWithinPlugin`，供插件管理后续处理使用。
      const validatedPath = validatePathWithinPlugin(pluginPath, decl)
      // validatedPath 路径数据缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!validatedPath) {
        // securityMsg固定为 ``Security: Path traversal attempt blocked in plugin ${plu...`，作为插件工具 lsp Plugin Integration后续展示或比较的基准。
        const securityMsg = `Security: Path traversal attempt blocked in plugin ${pluginName}: ${decl}`
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logError(new Error(securityMsg))
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(securityMsg, { level: 'warn' })
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'lsp-config-invalid',
          plugin: pluginName,
          serverName: decl,
          validationError:
            'Invalid path: must be relative and within plugin directory',
          source: 'plugin',
        })
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // Load from file
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容读取`readFile`，供插件管理后续处理使用。
        const content = await readFile(validatedPath, 'utf-8')
        // 解析结果解析`jsonParse`，供插件管理后续处理使用。
        const parsed = jsonParse(content)
        // 结果保存`z`，供后续判断或组装使用。
        const result = z
          .record(z.string(), LspServerConfigSchema())
          .safeParse(parsed)

        // 满足 `result.success` 时，插件管理执行该分支。
        if (result.success) {
          // 调用 Object.assign，触发插件管理此处需要的副作用。
          Object.assign(servers, result.data)
        } else {
          // errorMsg 错误信息 命名 ``LSP config validation failed for ${decl} in plugin ${plu...`，让后续代码直接表达这个值的用途。
          const errorMsg = `LSP config validation failed for ${decl} in plugin ${pluginName}: ${result.error.message}`
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logError(new Error(errorMsg))
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'lsp-config-invalid',
            plugin: pluginName,
            serverName: decl,
            validationError: result.error.message,
            source: 'plugin',
          })
        }
      } catch (error) {
        // _errorMsg 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const _errorMsg =
          error instanceof Error
            ? `Failed to read/parse LSP config from ${decl} in plugin ${pluginName}: ${error.message}`
            : `Failed to read/parse LSP config file ${decl} in plugin ${pluginName}`

        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logError(toError(error))

        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'lsp-config-invalid',
          plugin: pluginName,
          serverName: decl,
          validationError:
            error instanceof Error
              ? `Failed to parse JSON: ${error.message}`
              : 'Failed to parse JSON file',
          source: 'plugin',
        })
      }
    } else {
      // Inline configs
      // 循环处理 `const [serverName, config] of Object.entries(decl)`，让插件管理把同类条目按顺序走完。
      for (const [serverName, config] of Object.entries(decl)) {
        // 结果保存`LspServerConfigSchema`，供插件管理后续处理使用。
        const result = LspServerConfigSchema().safeParse(config)
        // 满足 `result.success` 时，插件管理执行该分支。
        if (result.success) {
          // servers[serverName更新为 `result.data`，确保插件工具 lsp Plugin Integration后续读取最新状态。
          servers[serverName] = result.data
        } else {
          // errorMsg 错误信息保存``LSP config validation failed for inline server "${server...`，作为后续固定文本处理的输入。
          const errorMsg = `LSP config validation failed for inline server "${serverName}" in plugin ${pluginName}: ${result.error.message}`
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logError(new Error(errorMsg))
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            type: 'lsp-config-invalid',
            plugin: pluginName,
            serverName,
            validationError: result.error.message,
            source: 'plugin',
          })
        }
      }
    }
  }

  // 返回 `Object.keys(servers).length > 0 ? servers : undefined`，作为插件管理这次计算的结果。
  return Object.keys(servers).length > 0 ? servers : undefined
}

/**
 * Resolve environment variables for plugin LSP servers.
 * Handles ${CLAUDE_PLUGIN_ROOT}, ${user_config.X}, and general ${VAR}
 * substitution. Tracks missing environment variables for error reporting.
 */
// resolvePluginLspEnvironment 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolvePluginLspEnvironment(
  config: LspServerConfig,
  plugin: { path: string; source: string },
  userConfig?: PluginOptionValues,
  _errors?: PluginError[],
): LspServerConfig {
  // allMissingVars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allMissingVars: string[] = []

  // resolveValue封装成回调，供插件工具 lsp Plugin Integration在事件触发或异步步骤中调用。
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
    // 从 `expandEnvVarsInString(resolved)` 解构 expanded、missingVars，减少插件工具 lsp Plugin Integration对同一对象的重复访问。
    const { expanded, missingVars } = expandEnvVarsInString(resolved)
    // allMissingVars 集合追加新条目，保持收集顺序与输入顺序一致。
    allMissingVars.push(...missingVars)

    // 返回 `expanded`，作为插件管理这次计算的结果。
    return expanded
  }

  // resolved 集中保存插件工具 lsp Plugin Integration要一起传递的字段。
  const resolved = { ...config }

  // Resolve command path
  // 满足 `resolved.command` 时，插件管理执行该分支。
  if (resolved.command) {
    // 命令更新为 `resolveValue(resolved.command)`，确保插件工具后续读取最新状态。
    resolved.command = resolveValue(resolved.command)
  }

  // Resolve args
  // 满足 `resolved.args` 时，插件管理执行该分支。
  if (resolved.args) {
    // 参数列表更新为 `resolved.args.map(arg => resolveValue(arg))`，确保插件工具后续读取最新状态。
    resolved.args = resolved.args.map(arg => resolveValue(arg))
  }

  // Resolve environment variables and add CLAUDE_PLUGIN_ROOT / CLAUDE_PLUGIN_DATA
  // resolvedEnv 集中保存插件工具 lsp Plugin Integration要一起传递的字段。
  const resolvedEnv: Record<string, string> = {
    CLAUDE_PLUGIN_ROOT: plugin.path,
    CLAUDE_PLUGIN_DATA: getPluginDataDir(plugin.source),
    ...(resolved.env || {}),
  }
  // 循环处理 `const [key, value] of Object.entries(resolvedEnv)`，让插件管理把同类条目按顺序走完。
  for (const [key, value] of Object.entries(resolvedEnv)) {
    // `key` 与 `'CLAUDE_PLUGIN_ROOT' && key !==...` 不一致时刷新派生状态，避免使用过期结果。
    if (key !== 'CLAUDE_PLUGIN_ROOT' && key !== 'CLAUDE_PLUGIN_DATA') {
      // resolvedEnv[key更新为 `resolveValue(value)`，确保插件工具 lsp Plugin Integration后续读取最新状态。
      resolvedEnv[key] = resolveValue(value)
    }
  }
  // env更新为 `resolvedEnv`，确保插件工具后续读取最新状态。
  resolved.env = resolvedEnv

  // Resolve workspaceFolder if present
  // 满足 `resolved.workspaceFolder` 时，插件管理执行该分支。
  if (resolved.workspaceFolder) {
    // workspaceFolder更新为 `resolveValue(resolved.workspaceFolder)`，确保插件工具后续读取最新状态。
    resolved.workspaceFolder = resolveValue(resolved.workspaceFolder)
  }

  // Log missing variables if any were found
  // 满足 `allMissingVars.length > 0` 时，插件管理执行该分支。
  if (allMissingVars.length > 0) {
    // uniqueMissingVars 集合保存`Set`，供插件管理后续处理使用。
    const uniqueMissingVars = [...new Set(allMissingVars)]
    // warnMsg格式化`uniqueMissingVars.join`，供插件管理后续处理使用。
    const warnMsg = `Missing environment variables in plugin LSP config: ${uniqueMissingVars.join(', ')}`
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(new Error(warnMsg))
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(warnMsg, { level: 'warn' })
  }

  // 返回 `resolved`，作为插件管理这次计算的结果。
  return resolved
}

/**
 * Add plugin scope to LSP server configs
 * This adds a prefix to server names to avoid conflicts between plugins
 */
// addPluginScopeToLspServers 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addPluginScopeToLspServers(
  servers: Record<string, LspServerConfig>,
  pluginName: string,
): Record<string, ScopedLspServerConfig> {
  // scopedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const scopedServers: Record<string, ScopedLspServerConfig> = {}

  // 循环处理 `const [name, config] of Object.entries(servers)`，让插件管理把同类条目按顺序走完。
  for (const [name, config] of Object.entries(servers)) {
    // Add plugin prefix to server name to avoid conflicts
    // scopedName 命名 ``plugin:${pluginName}:${name}``，让后续代码直接表达这个值的用途。
    const scopedName = `plugin:${pluginName}:${name}`
    // scopedServers[scopedName更新为 `{`，确保插件工具 lsp Plugin Integration后续读取最新状态。
    scopedServers[scopedName] = {
      ...config,
      scope: 'dynamic', // Use dynamic scope for plugin servers
      source: pluginName,
    }
  }

  // 返回 `scopedServers`，作为插件管理这次计算的结果。
  return scopedServers
}

/**
 * Get LSP servers from a specific plugin with environment variable resolution and scoping
 * This function is called when the LSP servers need to be activated and ensures they have
 * the proper environment variables and scope applied
 */
// getPluginLspServers 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPluginLspServers(
  plugin: LoadedPlugin,
  errors: PluginError[] = [],
): Promise<Record<string, ScopedLspServerConfig> | undefined> {
  // plugin.enabled 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!plugin.enabled) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }

  // Use cached servers if available
  // servers 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const servers =
    plugin.lspServers || (await loadPluginLspServers(plugin, errors))
  // servers 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!servers) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }

  // Resolve environment variables. Top-level manifest.userConfig values
  // become available as ${user_config.KEY} in LSP command/args/env.
  // Gate on manifest.userConfig — same rationale as buildMcpUserConfig:
  // loadPluginOptions always returns {} so without this guard userConfig is
  // truthy for every plugin and substituteUserConfigVariables throws on any
  // unresolved ${user_config.X}. Also skips unneeded keychain reads.
  // userConfig 配置保存`plugin.manifest.userConfig`，供后续判断或组装使用。
  const userConfig = plugin.manifest.userConfig
    ? loadPluginOptions(getPluginStorageId(plugin))
    : undefined
  // resolvedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const resolvedServers: Record<string, LspServerConfig> = {}
  // 循环处理 `const [name, config] of Object.entries(servers)`，让插件管理把同类条目按顺序走完。
  for (const [name, config] of Object.entries(servers)) {
    // resolvedServers[name更新为 `resolvePluginLspEnvironment(`，确保插件工具 lsp Plugin Integration后续读取最新状态。
    resolvedServers[name] = resolvePluginLspEnvironment(
      config,
      plugin,
      userConfig,
      errors,
    )
  }

  // Add plugin scope
  // 返回 `addPluginScopeToLspServers(resolvedServers, plugin.name)`，作为插件管理这次计算的结果。
  return addPluginScopeToLspServers(resolvedServers, plugin.name)
}

/**
 * Extract all LSP servers from loaded plugins
 */
// extractLspServersFromPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function extractLspServersFromPlugins(
  plugins: LoadedPlugin[],
  errors: PluginError[] = [],
): Promise<Record<string, ScopedLspServerConfig>> {
  // allServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const allServers: Record<string, ScopedLspServerConfig> = {}

  // 按顺序遍历 `plugins` 中的plugin 插件数据，逐个交给插件管理处理。
  for (const plugin of plugins) {
    // plugin.enabled 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!plugin.enabled) continue

    // servers 集合读取`loadPluginLspServers`，供插件管理后续处理使用。
    const servers = await loadPluginLspServers(plugin, errors)
    // 满足 `servers` 时，插件管理执行该分支。
    if (servers) {
      // scopedServers 集合保存`addPluginScopeToLspServers`，供插件管理后续处理使用。
      const scopedServers = addPluginScopeToLspServers(servers, plugin.name)
      // 调用 Object.assign，触发插件管理此处需要的副作用。
      Object.assign(allServers, scopedServers)

      // Store the servers on the plugin for caching
      // lspServers 集合更新为 `servers`，确保插件工具后续读取最新状态。
      plugin.lspServers = servers

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Loaded ${Object.keys(servers).length} LSP servers from plugin ${plugin.name}`,
      )
    }
  }

  // 返回 `allServers`，作为插件管理这次计算的结果。
  return allServers
}
