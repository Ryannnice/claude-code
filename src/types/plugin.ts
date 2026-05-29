// 类型依赖 { LspServerConfig } 来自 ../services/lsp/types.js，用于校准plugin的数据契约。
import type { LspServerConfig } from '../services/lsp/types.js'
// 类型依赖 { McpServerConfig } 来自 ../services/mcp/types.js，用于校准plugin的数据契约。
import type { McpServerConfig } from '../services/mcp/types.js'
// 类型依赖 { BundledSkillDefinition } 来自 ../skills/bundledSkills.js，用于校准plugin的数据契约。
import type { BundledSkillDefinition } from '../skills/bundledSkills.js'
// 整理这一组导入，让plugin后续逻辑可以直接复用这些外部能力。
import type {
  CommandMetadata,
  PluginAuthor,
  PluginManifest,
} from '../utils/plugins/schemas.js'
// 类型依赖 { HooksSettings } 来自 ../utils/settings/types.js，用于校准plugin的数据契约。
import type { HooksSettings } from '../utils/settings/types.js'

// 导出类型定义，让其他模块沿用plugin的数据契约。
export type { PluginAuthor, PluginManifest, CommandMetadata }

/**
 * Definition for a built-in plugin that ships with the CLI.
 * Built-in plugins appear in the /plugin UI and can be enabled/disabled by
 * users (persisted to user settings).
 */
// BuiltinPluginDefinition 固化plugin里传递的数据形状，帮助调用方按同一结构读写字段。
export type BuiltinPluginDefinition = {
  /** Plugin name (used in `{name}@builtin` identifier) */
  name: string
  /** Description shown in the /plugin UI */
  description: string
  /** Optional version string */
  version?: string
  /** Skills provided by this plugin */
  skills?: BundledSkillDefinition[]
  /** Hooks provided by this plugin */
  hooks?: HooksSettings
  /** MCP servers provided by this plugin */
  mcpServers?: Record<string, McpServerConfig>
  /** Whether this plugin is available (e.g. based on system capabilities). Unavailable plugins are hidden entirely. */
  // 这个回调绑定到 isAvailable?: () => boolean，负责plugin在该局部场景下的响应。
  isAvailable?: () => boolean
  /** Default enabled state before the user sets a preference (defaults to true) */
  defaultEnabled?: boolean
}

// PluginRepository 固化plugin里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginRepository = {
  url: string
  branch: string
  lastUpdated?: string
  commitSha?: string
}

// PluginConfig 固化plugin里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginConfig = {
  repositories: Record<string, PluginRepository>
}

// LoadedPlugin 固化plugin里传递的数据形状，帮助调用方按同一结构读写字段。
export type LoadedPlugin = {
  name: string
  manifest: PluginManifest
  path: string
  source: string
  repository: string // Repository identifier, usually same as source
  enabled?: boolean
  isBuiltin?: boolean // true for built-in plugins that ship with the CLI
  sha?: string // Git commit SHA for version pinning (from marketplace entry source)
  commandsPath?: string
  commandsPaths?: string[] // Additional command paths from manifest
  commandsMetadata?: Record<string, CommandMetadata> // Metadata for named commands from object-mapping format
  agentsPath?: string
  agentsPaths?: string[] // Additional agent paths from manifest
  skillsPath?: string
  skillsPaths?: string[] // Additional skill paths from manifest
  outputStylesPath?: string
  outputStylesPaths?: string[] // Additional output style paths from manifest
  hooksConfig?: HooksSettings
  mcpServers?: Record<string, McpServerConfig>
  lspServers?: Record<string, LspServerConfig>
  settings?: Record<string, unknown>
}

// PluginComponent 固化plugin里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginComponent =
  | 'commands'
  | 'agents'
  | 'skills'
  | 'hooks'
  | 'output-styles'

/**
 * Discriminated union of plugin error types.
 * Each error type has specific contextual data for better debugging and user guidance.
 *
 * This replaces the previous string-based error matching approach with type-safe
 * error handling that can't break when error messages change.
 *
 * IMPLEMENTATION STATUS:
 * Currently used in production (2 types):
 * - generic-error: Used for various plugin loading failures
 * - plugin-not-found: Used when plugin not found in marketplace
 *
 * Planned for future use (10 types - see TODOs in pluginLoader.ts):
 * - path-not-found, git-auth-failed, git-timeout, network-error
 * - manifest-parse-error, manifest-validation-error
 * - marketplace-not-found, marketplace-load-failed
 * - mcp-config-invalid, hook-load-failed, component-load-failed
 *
 * These unused types support UI formatting and provide a clear roadmap for
 * improving error specificity. They can be incrementally implemented as
 * error creation sites are refactored.
 */
// PluginError 固化plugin里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginError =
  | {
      type: 'path-not-found'
      source: string
      plugin?: string
      path: string
      component: PluginComponent
    }
  | {
      type: 'git-auth-failed'
      source: string
      plugin?: string
      gitUrl: string
      authType: 'ssh' | 'https'
    }
  | {
      type: 'git-timeout'
      source: string
      plugin?: string
      gitUrl: string
      operation: 'clone' | 'pull'
    }
  | {
      type: 'network-error'
      source: string
      plugin?: string
      url: string
      details?: string
    }
  | {
      type: 'manifest-parse-error'
      source: string
      plugin?: string
      manifestPath: string
      parseError: string
    }
  | {
      type: 'manifest-validation-error'
      source: string
      plugin?: string
      manifestPath: string
      validationErrors: string[]
    }
  | {
      type: 'plugin-not-found'
      source: string
      pluginId: string
      marketplace: string
    }
  | {
      type: 'marketplace-not-found'
      source: string
      marketplace: string
      availableMarketplaces: string[]
    }
  | {
      type: 'marketplace-load-failed'
      source: string
      marketplace: string
      reason: string
    }
  | {
      type: 'mcp-config-invalid'
      source: string
      plugin: string
      serverName: string
      validationError: string
    }
  | {
      type: 'mcp-server-suppressed-duplicate'
      source: string
      plugin: string
      serverName: string
      duplicateOf: string
    }
  | {
      type: 'lsp-config-invalid'
      source: string
      plugin: string
      serverName: string
      validationError: string
    }
  | {
      type: 'hook-load-failed'
      source: string
      plugin: string
      hookPath: string
      reason: string
    }
  | {
      type: 'component-load-failed'
      source: string
      plugin: string
      component: PluginComponent
      path: string
      reason: string
    }
  | {
      type: 'mcpb-download-failed'
      source: string
      plugin: string
      url: string
      reason: string
    }
  | {
      type: 'mcpb-extract-failed'
      source: string
      plugin: string
      mcpbPath: string
      reason: string
    }
  | {
      type: 'mcpb-invalid-manifest'
      source: string
      plugin: string
      mcpbPath: string
      validationError: string
    }
  | {
      type: 'lsp-config-invalid'
      source: string
      plugin: string
      serverName: string
      validationError: string
    }
  | {
      type: 'lsp-server-start-failed'
      source: string
      plugin: string
      serverName: string
      reason: string
    }
  | {
      type: 'lsp-server-crashed'
      source: string
      plugin: string
      serverName: string
      exitCode: number | null
      signal?: string
    }
  | {
      type: 'lsp-request-timeout'
      source: string
      plugin: string
      serverName: string
      method: string
      timeoutMs: number
    }
  | {
      type: 'lsp-request-failed'
      source: string
      plugin: string
      serverName: string
      method: string
      error: string
    }
  | {
      type: 'marketplace-blocked-by-policy'
      source: string
      plugin?: string
      marketplace: string
      blockedByBlocklist?: boolean // true if blocked by blockedMarketplaces, false if not in strictKnownMarketplaces
      allowedSources: string[] // Formatted source strings (e.g., "github:owner/repo")
    }
  | {
      type: 'dependency-unsatisfied'
      source: string
      plugin: string
      dependency: string
      reason: 'not-enabled' | 'not-found'
    }
  | {
      type: 'plugin-cache-miss'
      source: string
      plugin: string
      installPath: string
    }
  | {
      type: 'generic-error'
      source: string
      plugin?: string
      error: string
    }

// PluginLoadResult 固化plugin里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginLoadResult = {
  enabled: LoadedPlugin[]
  disabled: LoadedPlugin[]
  errors: PluginError[]
}

/**
 * Helper function to get a display message from any PluginError
 * Useful for logging and simple error displays
 */
// getPluginErrorMessage 封装plugin的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginErrorMessage(error: PluginError): string {
  // 按照 error.type 的取值选择plugin的具体处理分支。
  switch (error.type) {
    case 'generic-error':
      // 返回 `error.error`，作为plugin这次计算的结果。
      return error.error
    case 'path-not-found':
      // 返回 ``Path not found: ${error.path} (${error.component})``，作为plugin这次计算的结果。
      return `Path not found: ${error.path} (${error.component})`
    case 'git-auth-failed':
      // 返回 ``Git authentication failed (${error.authType}): ${error.gitUrl}``，作为plugin这次计算的结果。
      return `Git authentication failed (${error.authType}): ${error.gitUrl}`
    case 'git-timeout':
      // 返回 ``Git ${error.operation} timeout: ${error.gitUrl}``，作为plugin这次计算的结果。
      return `Git ${error.operation} timeout: ${error.gitUrl}`
    case 'network-error':
      // 返回 ``Network error: ${error.url}${error.details ? ` - ${error.details}` : '...`，作为plugin这次计算的结果。
      return `Network error: ${error.url}${error.details ? ` - ${error.details}` : ''}`
    case 'manifest-parse-error':
      // 返回 ``Manifest parse error: ${error.parseError}``，作为plugin这次计算的结果。
      return `Manifest parse error: ${error.parseError}`
    case 'manifest-validation-error':
      // 返回 ``Manifest validation failed: ${error.validationErrors.join(', ')}``，作为plugin这次计算的结果。
      return `Manifest validation failed: ${error.validationErrors.join(', ')}`
    case 'plugin-not-found':
      // 返回 ``Plugin ${error.pluginId} not found in marketplace ${error.marketplace}``，作为plugin这次计算的结果。
      return `Plugin ${error.pluginId} not found in marketplace ${error.marketplace}`
    case 'marketplace-not-found':
      // 返回 ``Marketplace ${error.marketplace} not found``，作为plugin这次计算的结果。
      return `Marketplace ${error.marketplace} not found`
    case 'marketplace-load-failed':
      // 返回 ``Marketplace ${error.marketplace} failed to load: ${error.reason}``，作为plugin这次计算的结果。
      return `Marketplace ${error.marketplace} failed to load: ${error.reason}`
    case 'mcp-config-invalid':
      // 返回 ``MCP server ${error.serverName} invalid: ${error.validationError}``，作为plugin这次计算的结果。
      return `MCP server ${error.serverName} invalid: ${error.validationError}`
    case 'mcp-server-suppressed-duplicate': {
      // dup保存`duplicateOf.startsWith`，供plugin后续处理使用。
      const dup = error.duplicateOf.startsWith('plugin:')
        ? `server provided by plugin "${error.duplicateOf.split(':')[1] ?? '?'}"`
        : `already-configured "${error.duplicateOf}"`
      // 返回 ``MCP server "${error.serverName}" skipped — same command/URL as ${dup}``，作为plugin这次计算的结果。
      return `MCP server "${error.serverName}" skipped — same command/URL as ${dup}`
    }
    case 'hook-load-failed':
      // 返回 ``Hook load failed: ${error.reason}``，作为plugin这次计算的结果。
      return `Hook load failed: ${error.reason}`
    case 'component-load-failed':
      // 返回 ``${error.component} load failed from ${error.path}: ${error.reason}``，作为plugin这次计算的结果。
      return `${error.component} load failed from ${error.path}: ${error.reason}`
    case 'mcpb-download-failed':
      // 返回 ``Failed to download MCPB from ${error.url}: ${error.reason}``，作为plugin这次计算的结果。
      return `Failed to download MCPB from ${error.url}: ${error.reason}`
    case 'mcpb-extract-failed':
      // 返回 ``Failed to extract MCPB ${error.mcpbPath}: ${error.reason}``，作为plugin这次计算的结果。
      return `Failed to extract MCPB ${error.mcpbPath}: ${error.reason}`
    case 'mcpb-invalid-manifest':
      // 返回 ``MCPB manifest invalid at ${error.mcpbPath}: ${error.validationError}``，作为plugin这次计算的结果。
      return `MCPB manifest invalid at ${error.mcpbPath}: ${error.validationError}`
    case 'lsp-config-invalid':
      // 返回 ``Plugin "${error.plugin}" has invalid LSP server config for "${error.se...`，作为plugin这次计算的结果。
      return `Plugin "${error.plugin}" has invalid LSP server config for "${error.serverName}": ${error.validationError}`
    case 'lsp-server-start-failed':
      // 返回 ``Plugin "${error.plugin}" failed to start LSP server "${error.serverNam...`，作为plugin这次计算的结果。
      return `Plugin "${error.plugin}" failed to start LSP server "${error.serverName}": ${error.reason}`
    case 'lsp-server-crashed':
      // 满足 `error.signal` 时，plugin执行该分支。
      if (error.signal) {
        // 返回 ``Plugin "${error.plugin}" LSP server "${error.serverName}" crashed with...`，作为plugin这次计算的结果。
        return `Plugin "${error.plugin}" LSP server "${error.serverName}" crashed with signal ${error.signal}`
      }
      // 返回 ``Plugin "${error.plugin}" LSP server "${error.serverName}" crashed with...`，作为plugin这次计算的结果。
      return `Plugin "${error.plugin}" LSP server "${error.serverName}" crashed with exit code ${error.exitCode ?? 'unknown'}`
    case 'lsp-request-timeout':
      // 返回 ``Plugin "${error.plugin}" LSP server "${error.serverName}" timed out on...`，作为plugin这次计算的结果。
      return `Plugin "${error.plugin}" LSP server "${error.serverName}" timed out on ${error.method} request after ${error.timeoutMs}ms`
    case 'lsp-request-failed':
      // 返回 ``Plugin "${error.plugin}" LSP server "${error.serverName}" ${error.meth...`，作为plugin这次计算的结果。
      return `Plugin "${error.plugin}" LSP server "${error.serverName}" ${error.method} request failed: ${error.error}`
    case 'marketplace-blocked-by-policy':
      // 满足 `error.blockedByBlocklist` 时，plugin执行该分支。
      if (error.blockedByBlocklist) {
        // 返回 ``Marketplace '${error.marketplace}' is blocked by enterprise policy``，作为plugin这次计算的结果。
        return `Marketplace '${error.marketplace}' is blocked by enterprise policy`
      }
      // 返回 ``Marketplace '${error.marketplace}' is not in the allowed marketplace l...`，作为plugin这次计算的结果。
      return `Marketplace '${error.marketplace}' is not in the allowed marketplace list`
    case 'dependency-unsatisfied': {
      // hint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const hint =
        error.reason === 'not-enabled'
          ? 'disabled — enable it or remove the dependency'
          : 'not found in any configured marketplace'
      // 返回 ``Dependency "${error.dependency}" is ${hint}``，作为plugin这次计算的结果。
      return `Dependency "${error.dependency}" is ${hint}`
    }
    case 'plugin-cache-miss':
      // 返回 ``Plugin "${error.plugin}" not cached at ${error.installPath} — run /plu...`，作为plugin这次计算的结果。
      return `Plugin "${error.plugin}" not cached at ${error.installPath} — run /plugins to refresh`
  }
}
