// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准MCP 服务的数据契约。
import type { Command } from '../../commands.js'
// 类型依赖 { AgentMcpServerInfo } 来自 ../../components/mcp/types.js，用于校准MCP 服务的数据契约。
import type { AgentMcpServerInfo } from '../../components/mcp/types.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准MCP 服务的数据契约。
import type { Tool } from '../../Tool.js'
// 类型依赖 { AgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准MCP 服务的数据契约。
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 getGlobalClaudeFile 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { getGlobalClaudeFile } from '../../utils/env.js'
// 复用 isSettingSourceEnabled 工具函数，把通用处理留在 ../../utils/settings/constants.js 中维护。
import { isSettingSourceEnabled } from '../../utils/settings/constants.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  hasSkipDangerousModePermissionPrompt,
} from '../../utils/settings/settings.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 getEnterpriseMcpFilePath、getMcpConfigByName，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getEnterpriseMcpFilePath, getMcpConfigByName } from './config.js'
// 引入 mcpInfoFromString，将 ./mcpStringUtils.js 中已经封装好的能力接到本文件流程里。
import { mcpInfoFromString } from './mcpStringUtils.js'
// 引入 normalizeNameForMCP，将 ./normalization.js 中已经封装好的能力接到本文件流程里。
import { normalizeNameForMCP } from './normalization.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type ConfigScope,
  ConfigScopeSchema,
  type MCPServerConnection,
  type McpHTTPServerConfig,
  type McpServerConfig,
  type McpSSEServerConfig,
  type McpStdioServerConfig,
  type McpWebSocketServerConfig,
  type ScopedMcpServerConfig,
  type ServerResource,
} from './types.js'

/**
 * Filters tools by MCP server name
 *
 * @param tools Array of tools to filter
 * @param serverName Name of the MCP server
 * @returns Tools belonging to the specified server
 */
// filterToolsByServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterToolsByServer(tools: Tool[], serverName: string): Tool[] {
  // prefix保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
  const prefix = `mcp__${normalizeNameForMCP(serverName)}__`
  // 返回 `tools.filter(tool => tool.name?.startsWith(prefix))`，作为MCP 服务这次计算的结果。
  return tools.filter(tool => tool.name?.startsWith(prefix))
}

/**
 * True when a command belongs to the given MCP server.
 *
 * MCP **prompts** are named `mcp__<server>__<prompt>` (wire-format constraint);
 * MCP **skills** are named `<server>:<skill>` (matching plugin/nested-dir skill
 * naming). Both live in `mcp.commands`, so cleanup and filtering must match
 * either shape.
 */
// commandBelongsToServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function commandBelongsToServer(
  command: Command,
  serverName: string,
): boolean {
  // normalized保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
  const normalized = normalizeNameForMCP(serverName)
  // 名称保存`command.name`，供后续判断或组装使用。
  const name = command.name
  // 名称缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!name) return false
  // 返回 `(`，作为MCP 服务这次计算的结果。
  return (
    name.startsWith(`mcp__${normalized}__`) || name.startsWith(`${normalized}:`)
  )
}

/**
 * Filters commands by MCP server name
 * @param commands Array of commands to filter
 * @param serverName Name of the MCP server
 * @returns Commands belonging to the specified server
 */
// filterCommandsByServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterCommandsByServer(
  commands: Command[],
  serverName: string,
): Command[] {
  // 返回 `commands.filter(c => commandBelongsToServer(c, serverName))`，作为MCP 服务这次计算的结果。
  return commands.filter(c => commandBelongsToServer(c, serverName))
}

/**
 * Filters MCP **prompts** (not skills) by server. Used by the `/mcp` menu
 * capabilities display — skills are a separate feature shown in `/skills`,
 * so they mustn't inflate the "prompts" capability badge.
 *
 * The distinguisher is `loadedFrom === 'mcp'`: MCP skills set it, MCP
 * prompts don't (they use `isMcp: true` instead).
 */
// filterMcpPromptsByServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterMcpPromptsByServer(
  commands: Command[],
  serverName: string,
): Command[] {
  // 返回 `commands.filter(`，作为MCP 服务这次计算的结果。
  return commands.filter(
    // c更新为 `>`，确保MCP 服务后续读取最新状态。
    c =>
      commandBelongsToServer(c, serverName) &&
      !(c.type === 'prompt' && c.loadedFrom === 'mcp'),
  )
}

/**
 * Filters resources by MCP server name
 * @param resources Array of resources to filter
 * @param serverName Name of the MCP server
 * @returns Resources belonging to the specified server
 */
// filterResourcesByServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterResourcesByServer(
  resources: ServerResource[],
  serverName: string,
): ServerResource[] {
  // 返回 `resources.filter(resource => resource.server === serverName)`，作为MCP 服务这次计算的结果。
  return resources.filter(resource => resource.server === serverName)
}

/**
 * Removes tools belonging to a specific MCP server
 * @param tools Array of tools
 * @param serverName Name of the MCP server to exclude
 * @returns Tools not belonging to the specified server
 */
// excludeToolsByServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function excludeToolsByServer(
  tools: Tool[],
  serverName: string,
): Tool[] {
  // prefix保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
  const prefix = `mcp__${normalizeNameForMCP(serverName)}__`
  // 返回 `tools.filter(tool => !tool.name?.startsWith(prefix))`，作为MCP 服务这次计算的结果。
  return tools.filter(tool => !tool.name?.startsWith(prefix))
}

/**
 * Removes commands belonging to a specific MCP server
 * @param commands Array of commands
 * @param serverName Name of the MCP server to exclude
 * @returns Commands not belonging to the specified server
 */
// excludeCommandsByServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function excludeCommandsByServer(
  commands: Command[],
  serverName: string,
): Command[] {
  // 返回 `commands.filter(c => !commandBelongsToServer(c, serverName))`，作为MCP 服务这次计算的结果。
  return commands.filter(c => !commandBelongsToServer(c, serverName))
}

/**
 * Removes resources belonging to a specific MCP server
 * @param resources Map of server resources
 * @param serverName Name of the MCP server to exclude
 * @returns Resources map without the specified server
 */
// excludeResourcesByServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function excludeResourcesByServer(
  resources: Record<string, ServerResource[]>,
  serverName: string,
): Record<string, ServerResource[]> {
  // 结果集中保存MCP 服务MCP 服务 utils要一起传递的字段。
  const result = { ...resources }
  // MCP 服务 utils在这里处理 `delete result[serverName]`，完成这一小步状态转换。
  delete result[serverName]
  // 返回 `result`，作为MCP 服务这次计算的结果。
  return result
}

/**
 * Stable hash of an MCP server config for change detection on /reload-plugins.
 * Excludes `scope` (provenance, not content — moving a server from .mcp.json
 * to settings.json shouldn't reconnect it). Keys sorted so `{a:1,b:2}` and
 * `{b:2,a:1}` hash the same.
 */
// hashMcpConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hashMcpConfig(config: ScopedMcpServerConfig): string {
  // 从 `config` 解构 scope、其余 rest，减少MCP 服务 utils对同一对象的重复访问。
  const { scope: _scope, ...rest } = config
  // stable保存`jsonStringify`，供MCP 服务后续处理使用。
  const stable = jsonStringify(rest, (_k, v: unknown) => {
    // 组合条件 `v && typeof v === 'object' && !Array.isArray(v)` 成立时，MCP 服务才启用这条专门路径。
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      // obj保存`v as Record<string, unknown>`，供后续判断或组装使用。
      const obj = v as Record<string, unknown>
      // sorted 从空对象开始收集键值，后续按名称补齐内容。
      const sorted: Record<string, unknown> = {}
      // 逐项读取 `Object.keys(obj).sort()` 中的k，按输入顺序推进MCP 服务。
      for (const k of Object.keys(obj).sort()) sorted[k] = obj[k]
      // 返回 `sorted`，作为MCP 服务这次计算的结果。
      return sorted
    }
    // 返回 `v`，作为MCP 服务这次计算的结果。
    return v
  })
  // 返回 `createHash('sha256').update(stable).digest('hex').slice(0, 16)`，作为MCP 服务这次计算的结果。
  return createHash('sha256').update(stable).digest('hex').slice(0, 16)
}

/**
 * Remove stale MCP clients and their tools/commands/resources. A client is
 * stale if:
 *   - scope 'dynamic' and name no longer in configs (plugin disabled), or
 *   - config hash changed (args/url/env edited in .mcp.json) — any scope
 *
 * The removal case is scoped to 'dynamic' so /reload-plugins can't
 * accidentally disconnect a user-configured server that's just temporarily
 * absent from the in-memory config (e.g. during a partial reload). The
 * config-changed case applies to all scopes — if the config actually changed
 * on disk, reconnecting is what you want.
 *
 * Returns the stale clients so the caller can disconnect them (clearServerCache).
 */
// excludeStalePluginClients 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function excludeStalePluginClients(
  mcp: {
    clients: MCPServerConnection[]
    tools: Tool[]
    commands: Command[]
    resources: Record<string, ServerResource[]>
  },
  configs: Record<string, ScopedMcpServerConfig>,
): {
  clients: MCPServerConnection[]
  tools: Tool[]
  commands: Command[]
  resources: Record<string, ServerResource[]>
  stale: MCPServerConnection[]
} {
  // stale筛选`clients.filter`，供MCP 服务后续处理使用。
  const stale = mcp.clients.filter(c => {
    // fresh 命名 `configs[c.name]`，让后续代码直接表达这个值的用途。
    const fresh = configs[c.name]
    // fresh缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!fresh) return c.config.scope === 'dynamic'
    // 返回 `hashMcpConfig(c.config) !== hashMcpConfig(fresh)`，作为MCP 服务这次计算的结果。
    return hashMcpConfig(c.config) !== hashMcpConfig(fresh)
  })
  // stale为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
  if (stale.length === 0) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { ...mcp, stale: [] }
  }

  // 从 `mcp` 解构 tools、commands、resources，减少MCP 服务 utils对同一对象的重复访问。
  let { tools, commands, resources } = mcp
  // 按顺序遍历 `stale` 中的s 集合，逐个交给MCP 服务处理。
  for (const s of stale) {
    // tools 集合更新为 `excludeToolsByServer(tools, s.name)`，确保MCP 服务后续读取最新状态。
    tools = excludeToolsByServer(tools, s.name)
    // commands 命令数据更新为 `excludeCommandsByServer(commands, s.name)`，确保MCP 服务后续读取最新状态。
    commands = excludeCommandsByServer(commands, s.name)
    // resources 集合更新为 `excludeResourcesByServer(resources, s.name)`，确保MCP 服务后续读取最新状态。
    resources = excludeResourcesByServer(resources, s.name)
  }
  // staleNames 集合保存`Set`，供MCP 服务后续处理使用。
  const staleNames = new Set(stale.map(c => c.name))

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return {
    // 这个回调绑定到 clients: mcp.clients.filter(c => !staleNames.has(c.name)),，负责MCP 服务在该局部场景下的响应。
    clients: mcp.clients.filter(c => !staleNames.has(c.name)),
    tools,
    commands,
    resources,
    stale,
  }
}

/**
 * Checks if a tool name belongs to a specific MCP server
 * @param toolName The tool name to check
 * @param serverName The server name to match against
 * @returns True if the tool belongs to the specified server
 */
// isToolFromMcpServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isToolFromMcpServer(
  toolName: string,
  serverName: string,
): boolean {
  // info保存`mcpInfoFromString`，供MCP 服务后续处理使用。
  const info = mcpInfoFromString(toolName)
  // 返回 `info?.serverName === serverName`，作为MCP 服务这次计算的结果。
  return info?.serverName === serverName
}

/**
 * Checks if a tool belongs to any MCP server
 * @param tool The tool to check
 * @returns True if the tool is from an MCP server
 */
// isMcpTool 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMcpTool(tool: Tool): boolean {
  // 返回 `tool.name?.startsWith('mcp__') || tool.isMcp === true`，作为MCP 服务这次计算的结果。
  return tool.name?.startsWith('mcp__') || tool.isMcp === true
}

/**
 * Checks if a command belongs to any MCP server
 * @param command The command to check
 * @returns True if the command is from an MCP server
 */
// isMcpCommand 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMcpCommand(command: Command): boolean {
  // 返回 `command.name?.startsWith('mcp__') || command.isMcp === true`，作为MCP 服务这次计算的结果。
  return command.name?.startsWith('mcp__') || command.isMcp === true
}

/**
 * Describe the file path for a given MCP config scope.
 * @param scope The config scope ('user', 'project', 'local', or 'dynamic')
 * @returns A description of where the config is stored
 */
// describeMcpConfigFilePath 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function describeMcpConfigFilePath(scope: ConfigScope): string {
  // 按照 scope 的取值选择MCP 服务的具体处理分支。
  switch (scope) {
    case 'user':
      // 返回 `getGlobalClaudeFile()`，作为MCP 服务这次计算的结果。
      return getGlobalClaudeFile()
    case 'project':
      // 返回 `join(getCwd(), '.mcp.json')`，作为MCP 服务这次计算的结果。
      return join(getCwd(), '.mcp.json')
    case 'local':
      // 返回 ``${getGlobalClaudeFile()} [project: ${getCwd()}]``，作为MCP 服务这次计算的结果。
      return `${getGlobalClaudeFile()} [project: ${getCwd()}]`
    case 'dynamic':
      // 返回 `'Dynamically configured'`，作为MCP 服务这次计算的结果。
      return 'Dynamically configured'
    case 'enterprise':
      // 返回 `getEnterpriseMcpFilePath()`，作为MCP 服务这次计算的结果。
      return getEnterpriseMcpFilePath()
    case 'claudeai':
      // 返回 `'claude.ai'`，作为MCP 服务这次计算的结果。
      return 'claude.ai'
    default:
      // 返回 `scope`，作为MCP 服务这次计算的结果。
      return scope
  }
}

// getScopeLabel 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getScopeLabel(scope: ConfigScope): string {
  // 按照 scope 的取值选择MCP 服务的具体处理分支。
  switch (scope) {
    case 'local':
      // 返回 `'Local config (private to you in this project)'`，作为MCP 服务这次计算的结果。
      return 'Local config (private to you in this project)'
    case 'project':
      // 返回 `'Project config (shared via .mcp.json)'`，作为MCP 服务这次计算的结果。
      return 'Project config (shared via .mcp.json)'
    case 'user':
      // 返回 `'User config (available in all your projects)'`，作为MCP 服务这次计算的结果。
      return 'User config (available in all your projects)'
    case 'dynamic':
      // 返回 `'Dynamic config (from command line)'`，作为MCP 服务这次计算的结果。
      return 'Dynamic config (from command line)'
    case 'enterprise':
      // 返回 `'Enterprise config (managed by your organization)'`，作为MCP 服务这次计算的结果。
      return 'Enterprise config (managed by your organization)'
    case 'claudeai':
      // 返回 `'claude.ai config'`，作为MCP 服务这次计算的结果。
      return 'claude.ai config'
    default:
      // 返回 `scope`，作为MCP 服务这次计算的结果。
      return scope
  }
}

// ensureConfigScope 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ensureConfigScope(scope?: string): ConfigScope {
  // scope缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!scope) return 'local'

  // 满足 `!ConfigScopeSchema().options.includes(scope as ConfigScope)` 时，MCP 服务执行该分支。
  if (!ConfigScopeSchema().options.includes(scope as ConfigScope)) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `Invalid scope: ${scope}. Must be one of: ${ConfigScopeSchema().options.join(', ')}`,
    )
  }

  // 返回 `scope as ConfigScope`，作为MCP 服务这次计算的结果。
  return scope as ConfigScope
}

// ensureTransport 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ensureTransport(type?: string): 'stdio' | 'sse' | 'http' {
  // type缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!type) return 'stdio'

  // `type` 与 `'stdio' && type !== 'sse' && ty...` 不一致时刷新派生状态，避免使用过期结果。
  if (type !== 'stdio' && type !== 'sse' && type !== 'http') {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `Invalid transport type: ${type}. Must be one of: stdio, sse, http`,
    )
  }

  // 返回 `type as 'stdio' | 'sse' | 'http'`，作为MCP 服务这次计算的结果。
  return type as 'stdio' | 'sse' | 'http'
}

// parseHeaders 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseHeaders(headerArray: string[]): Record<string, string> {
  // 请求头 从空对象开始收集键值，后续按名称补齐内容。
  const headers: Record<string, string> = {}

  // 按顺序遍历 `headerArray` 中的header，逐个交给MCP 服务处理。
  for (const header of headerArray) {
    // colonIndex 索引保存`header.indexOf`，供MCP 服务后续处理使用。
    const colonIndex = header.indexOf(':')
    // 满足 `colonIndex === -1` 时，MCP 服务执行该分支。
    if (colonIndex === -1) {
      // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
      throw new Error(
        `Invalid header format: "${header}". Expected format: "Header-Name: value"`,
      )
    }

    // 按键格式化`header.substring`，供MCP 服务后续处理使用。
    const key = header.substring(0, colonIndex).trim()
    // 取值格式化`header.substring`，供MCP 服务后续处理使用。
    const value = header.substring(colonIndex + 1).trim()

    // key缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!key) {
      // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
      throw new Error(
        `Invalid header: "${header}". Header name cannot be empty.`,
      )
    }

    // headers[key更新为 `value`，确保MCP 服务 utils后续读取最新状态。
    headers[key] = value
  }

  // 返回 `headers`，作为MCP 服务这次计算的结果。
  return headers
}

// getProjectMcpServerStatus 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectMcpServerStatus(
  serverName: string,
): 'approved' | 'rejected' | 'pending' {
  // settings 集合读取`getSettings_DEPRECATED`，供MCP 服务后续处理使用。
  const settings = getSettings_DEPRECATED()
  // normalizedName保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
  const normalizedName = normalizeNameForMCP(serverName)

  // TODO: This fails an e2e test if the ?. is not present. This is likely a bug in the e2e test.
  // Will fix this in a follow-up PR.
  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    settings?.disabledMcpjsonServers?.some(
      // 名称更新为 `> normalizeNameForMCP(name) === normalizedName`，确保MCP 服务后续读取最新状态。
      name => normalizeNameForMCP(name) === normalizedName,
    )
  ) {
    // 返回 `'rejected'`，作为MCP 服务这次计算的结果。
    return 'rejected'
  }

  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    settings?.enabledMcpjsonServers?.some(
      // 名称更新为 `> normalizeNameForMCP(name) === normalizedName`，确保MCP 服务后续读取最新状态。
      name => normalizeNameForMCP(name) === normalizedName,
    ) ||
    settings?.enableAllProjectMcpServers
  ) {
    // 返回 `'approved'`，作为MCP 服务这次计算的结果。
    return 'approved'
  }

  // In bypass permissions mode (--dangerously-skip-permissions), there's no way
  // to show an approval popup. Auto-approve if projectSettings is enabled since
  // the user has explicitly chosen to bypass all permission checks.
  // SECURITY: We intentionally only check skipDangerousModePermissionPrompt via
  // hasSkipDangerousModePermissionPrompt(), which reads from userSettings/localSettings/
  // flagSettings/policySettings but NOT projectSettings (repo-level .claude/settings.json).
  // This is intentional: a repo should not be able to accept the bypass dialog on behalf of
  // users. We also do NOT check getSessionBypassPermissionsMode() here because
  // sessionBypassPermissionsMode can be set from project settings before the dialog is shown,
  // which would allow RCE attacks via malicious project settings.
  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    hasSkipDangerousModePermissionPrompt() &&
    isSettingSourceEnabled('projectSettings')
  ) {
    // 返回 `'approved'`，作为MCP 服务这次计算的结果。
    return 'approved'
  }

  // In non-interactive mode (SDK, claude -p, piped input), there's no way to
  // show an approval popup. Auto-approve if projectSettings is enabled since:
  // 1. The user/developer explicitly chose to run in this mode
  // 2. For SDK, projectSettings is off by default - they must explicitly enable it
  // 3. For -p mode, the help text warns to only use in trusted directories
  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    getIsNonInteractiveSession() &&
    isSettingSourceEnabled('projectSettings')
  ) {
    // 返回 `'approved'`，作为MCP 服务这次计算的结果。
    return 'approved'
  }

  // 返回 `'pending'`，作为MCP 服务这次计算的结果。
  return 'pending'
}

/**
 * Get the scope/settings source for an MCP server from a tool name
 * @param toolName MCP tool name (format: mcp__serverName__toolName)
 * @returns ConfigScope or null if not an MCP tool or server not found
 */
// getMcpServerScopeFromToolName 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpServerScopeFromToolName(
  toolName: string,
): ConfigScope | null {
  // 满足 `!isMcpTool({ name: toolName } as Tool)` 时，MCP 服务执行该分支。
  if (!isMcpTool({ name: toolName } as Tool)) {
    // 返回 `null`，作为MCP 服务这次计算的结果。
    return null
  }

  // Extract server name from tool name (format: mcp__serverName__toolName)
  // mcpInfo保存`mcpInfoFromString`，供MCP 服务后续处理使用。
  const mcpInfo = mcpInfoFromString(toolName)
  // mcpInfo缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!mcpInfo) {
    // 返回 `null`，作为MCP 服务这次计算的结果。
    return null
  }

  // Look up server config
  // serverConfig 配置读取`getMcpConfigByName`，供MCP 服务后续处理使用。
  const serverConfig = getMcpConfigByName(mcpInfo.serverName)

  // Fallback: claude.ai servers have normalized names starting with "claude_ai_"
  // but aren't in getMcpConfigByName (they're fetched async separately)
  // 组合条件 `!serverConfig && mcpInfo.serverName.startsWith('claude_ai_')` 成立时，MCP 服务才启用这条专门路径。
  if (!serverConfig && mcpInfo.serverName.startsWith('claude_ai_')) {
    // 返回 `'claudeai'`，作为MCP 服务这次计算的结果。
    return 'claudeai'
  }

  // 返回 `serverConfig?.scope ?? null`，作为MCP 服务这次计算的结果。
  return serverConfig?.scope ?? null
}

// Type guards for MCP server config types
// isStdioConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isStdioConfig(
  config: McpServerConfig,
): config is McpStdioServerConfig {
  // 返回 `config.type === 'stdio' || config.type === undefined`，作为MCP 服务这次计算的结果。
  return config.type === 'stdio' || config.type === undefined
}

// isSSEConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSSEConfig(config: McpServerConfig): config is McpSSEServerConfig {
  // 返回 `config.type === 'sse'`，作为MCP 服务这次计算的结果。
  return config.type === 'sse'
}

// isHTTPConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isHTTPConfig(config: McpServerConfig): config is McpHTTPServerConfig {
  // 返回 `config.type === 'http'`，作为MCP 服务这次计算的结果。
  return config.type === 'http'
}

// isWebSocketConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isWebSocketConfig(
  config: McpServerConfig,
): config is McpWebSocketServerConfig {
  // 返回 `config.type === 'ws'`，作为MCP 服务这次计算的结果。
  return config.type === 'ws'
}

/**
 * Extracts MCP server definitions from agent frontmatter and groups them by server name.
 * This is used to show agent-specific MCP servers in the /mcp command.
 *
 * @param agents Array of agent definitions
 * @returns Array of AgentMcpServerInfo, grouped by server name with list of source agents
 */
// extractAgentMcpServers 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractAgentMcpServers(
  agents: AgentDefinition[],
): AgentMcpServerInfo[] {
  // Map: server name -> { config, sourceAgents }
  // serverMap构建`new Map<`，供后续判断或组装使用。
  const serverMap = new Map<
    string,
    {
      config: McpServerConfig & { name: string }
      sourceAgents: string[]
    }
  >()

  // 按顺序遍历 `agents` 中的agent，逐个交给MCP 服务处理。
  for (const agent of agents) {
    // 满足 `!agent.mcpServers?.length` 时，MCP 服务执行该分支。
    if (!agent.mcpServers?.length) continue

    // 按顺序遍历 `agent.mcpServers` 中的spec，逐个交给MCP 服务处理。
    for (const spec of agent.mcpServers) {
      // Skip string references - these refer to servers already in global config
      // 当 `typeof spec` 匹配 `'string'` 时，MCP 服务执行对应分支。
      if (typeof spec === 'string') continue

      // Inline definition as { [name]: config }
      // entries 集合派生`Object.entries`，供MCP 服务后续处理使用。
      const entries = Object.entries(spec)
      // `entries.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
      if (entries.length !== 1) continue

      // 从 `entries[0]!` 按位置拆出 serverName、serverConfig，让MCP 服务 utils分别处理这些返回值。
      const [serverName, serverConfig] = entries[0]!
      // existing读取`serverMap.get`，供MCP 服务后续处理使用。
      const existing = serverMap.get(serverName)

      // 满足 `existing` 时，MCP 服务执行该分支。
      if (existing) {
        // Add this agent as another source
        // 满足 `!existing.sourceAgents.includes(agent.agentType)` 时，MCP 服务执行该分支。
        if (!existing.sourceAgents.includes(agent.agentType)) {
          // sourceAgents 集合追加新条目，保持收集顺序与输入顺序一致。
          existing.sourceAgents.push(agent.agentType)
        }
      } else {
        // New server
        // serverMap.set 写入新的状态值，使MCP 服务后续读取保持一致。
        serverMap.set(serverName, {
          config: { ...serverConfig, name: serverName } as McpServerConfig & {
            name: string
          },
          sourceAgents: [agent.agentType],
        })
      }
    }
  }

  // Convert map to array of AgentMcpServerInfo
  // Only include transport types supported by AgentMcpServerInfo
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: AgentMcpServerInfo[] = []
  // 循环处理 `const [name, { config, sourceAgents }] of serverM`，让MCP 服务逐项把同类条目按顺序走完。
  for (const [name, { config, sourceAgents }] of serverMap) {
    // Use type guards to properly narrow the discriminated union type
    // Only include transport types that are supported by AgentMcpServerInfo
    // 满足 `isStdioConfig(config)` 时，MCP 服务执行该分支。
    if (isStdioConfig(config)) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({
        name,
        sourceAgents,
        transport: 'stdio',
        command: config.command,
        needsAuth: false,
      })
    // MCP 服务 utils在这里处理 `} else if (isSSEConfig(config)) {`，完成这一小步状态转换。
    } else if (isSSEConfig(config)) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({
        name,
        sourceAgents,
        transport: 'sse',
        url: config.url,
        needsAuth: true,
      })
    // MCP 服务 utils在这里处理 `} else if (isHTTPConfig(config)) {`，完成这一小步状态转换。
    } else if (isHTTPConfig(config)) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({
        name,
        sourceAgents,
        transport: 'http',
        url: config.url,
        needsAuth: true,
      })
    // MCP 服务 utils在这里处理 `} else if (isWebSocketConfig(config)) {`，完成这一小步状态转换。
    } else if (isWebSocketConfig(config)) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({
        name,
        sourceAgents,
        transport: 'ws',
        url: config.url,
        needsAuth: false,
      })
    }
    // Skip unsupported transport types (sdk, claudeai-proxy, sse-ide, ws-ide)
    // These are internal types not meant for agent MCP server display
  }

  // 返回 `result.sort((a, b) => a.name.localeCompare(b.name))`，作为MCP 服务这次计算的结果。
  return result.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Extracts the MCP server base URL (without query string) for analytics logging.
 * Query strings are stripped because they can contain access tokens.
 * Trailing slashes are also removed for normalization.
 * Returns undefined for stdio/sdk servers or if URL parsing fails.
 */
// getLoggingSafeMcpBaseUrl 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLoggingSafeMcpBaseUrl(
  config: McpServerConfig,
): string | undefined {
  // `!('url' in config) || typeof config.url` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (!('url' in config) || typeof config.url !== 'string') {
    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  }

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // URL保存`URL`，供MCP 服务后续处理使用。
    const url = new URL(config.url)
    // search更新为 `''`，确保MCP 服务后续读取最新状态。
    url.search = ''
    // 返回 `url.toString().replace(/\/$/, '')`，作为MCP 服务这次计算的结果。
    return url.toString().replace(/\/$/, '')
  } catch {
    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  }
}
