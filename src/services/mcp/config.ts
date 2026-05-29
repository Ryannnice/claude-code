// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { chmod, open, rename, stat, unlink } from 'fs/promises'
// 引入 mapValues，将 lodash-es/mapValues.js 中已经封装好的能力接到本文件流程里。
import mapValues from 'lodash-es/mapValues.js'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join, parse } from 'path'
// 复用 getPlatform 工具函数，把通用处理留在 src/utils/platform.js 中维护。
import { getPlatform } from 'src/utils/platform.js'
// 类型依赖 { PluginError } 来自 ../../types/plugin.js，用于校准MCP 服务的数据契约。
import type { PluginError } from '../../types/plugin.js'
// 引入 getPluginErrorMessage，将 ../../types/plugin.js 中已经封装好的能力接到本文件流程里。
import { getPluginErrorMessage } from '../../types/plugin.js'
// 复用 isClaudeInChromeMCPServer 工具函数，把通用处理留在 ../../utils/claudeInChrome/common.js 中维护。
import { isClaudeInChromeMCPServer } from '../../utils/claudeInChrome/common.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  getCurrentProjectConfig,
  getGlobalConfig,
  saveCurrentProjectConfig,
  saveGlobalConfig,
} from '../../utils/config.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode } from '../../utils/errors.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 复用 safeParseJSON 工具函数，把通用处理留在 ../../utils/json.js 中维护。
import { safeParseJSON } from '../../utils/json.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getPluginMcpServers 工具函数，把通用处理留在 ../../utils/plugins/mcpPluginIntegration.js 中维护。
import { getPluginMcpServers } from '../../utils/plugins/mcpPluginIntegration.js'
// 复用 loadAllPluginsCacheOnly 工具函数，把通用处理留在 ../../utils/plugins/pluginLoader.js 中维护。
import { loadAllPluginsCacheOnly } from '../../utils/plugins/pluginLoader.js'
// 复用 isSettingSourceEnabled 工具函数，把通用处理留在 ../../utils/settings/constants.js 中维护。
import { isSettingSourceEnabled } from '../../utils/settings/constants.js'
// 复用 getManagedFilePath 工具函数，把通用处理留在 ../../utils/settings/managedPath.js 中维护。
import { getManagedFilePath } from '../../utils/settings/managedPath.js'
// 复用 isRestrictedToPluginOnly 工具函数，把通用处理留在 ../../utils/settings/pluginOnlyPolicy.js 中维护。
import { isRestrictedToPluginOnly } from '../../utils/settings/pluginOnlyPolicy.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getSettingsForSource,
} from '../../utils/settings/settings.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  isMcpServerCommandEntry,
  isMcpServerNameEntry,
  isMcpServerUrlEntry,
  type SettingsJson,
} from '../../utils/settings/types.js'
// 类型依赖 { ValidationError } 来自 ../../utils/settings/validation.js，用于校准MCP 服务的数据契约。
import type { ValidationError } from '../../utils/settings/validation.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 引入 fetchClaudeAIMcpConfigsIfEligible，将 ./claudeai.js 中已经封装好的能力接到本文件流程里。
import { fetchClaudeAIMcpConfigsIfEligible } from './claudeai.js'
// 引入 expandEnvVarsInString，将 ./envExpansion.js 中已经封装好的能力接到本文件流程里。
import { expandEnvVarsInString } from './envExpansion.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type ConfigScope,
  type McpHTTPServerConfig,
  type McpJsonConfig,
  McpJsonConfigSchema,
  type McpServerConfig,
  McpServerConfigSchema,
  type McpSSEServerConfig,
  type McpStdioServerConfig,
  type McpWebSocketServerConfig,
  type ScopedMcpServerConfig,
} from './types.js'
// 引入 getProjectMcpServerStatus，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getProjectMcpServerStatus } from './utils.js'

/**
 * Get the path to the managed MCP configuration file
 */
// getEnterpriseMcpFilePath 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnterpriseMcpFilePath(): string {
  // 返回 `join(getManagedFilePath(), 'managed-mcp.json')`，作为MCP 服务这次计算的结果。
  return join(getManagedFilePath(), 'managed-mcp.json')
}

/**
 * Internal utility: Add scope to server configs
 */
// addScopeToServers 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addScopeToServers(
  servers: Record<string, McpServerConfig> | undefined,
  scope: ConfigScope,
): Record<string, ScopedMcpServerConfig> {
  // servers 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!servers) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {}
  }
  // scopedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const scopedServers: Record<string, ScopedMcpServerConfig> = {}
  // 循环处理 `const [name, config] of Object.entries(servers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(servers)) {
    // scopedServers[name更新为 `{ ...config, scope }`，确保MCP 服务 config后续读取最新状态。
    scopedServers[name] = { ...config, scope }
  }
  // 返回 `scopedServers`，作为MCP 服务这次计算的结果。
  return scopedServers
}

/**
 * Internal utility: Write MCP config to .mcp.json file.
 * Preserves file permissions and flushes to disk before rename.
 * Uses the original path for rename (does not follow symlinks).
 */
// writeMcpjsonFile 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeMcpjsonFile(config: McpJsonConfig): Promise<void> {
  // mcpJsonPath 路径数据格式化`join`，供MCP 服务后续处理使用。
  const mcpJsonPath = join(getCwd(), '.mcp.json')

  // Read existing file permissions to preserve them
  // existingMode 先占位，稍后的条件分支会根据实际输入补齐它。
  let existingMode: number | undefined
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`stat`，供MCP 服务后续处理使用。
    const stats = await stat(mcpJsonPath)
    // existingMode更新为 `stats.mode`，确保MCP 服务后续读取最新状态。
    existingMode = stats.mode
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供MCP 服务后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 抛出 e，阻止MCP 服务在无效状态下继续运行。
      throw e
    }
    // File doesn't exist yet -- no permissions to preserve
  }

  // Write to temp file, flush to disk, then atomic rename
  // tempPath 路径数据记录时间`Date.now`，供MCP 服务后续处理使用。
  const tempPath = `${mcpJsonPath}.tmp.${process.pid}.${Date.now()}`
  // handle保存`open`，供MCP 服务后续处理使用。
  const handle = await open(tempPath, 'w', existingMode ?? 0o644)
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `handle.writeFile(jsonStringify(config, null, 2), {` 完成，再继续MCP 服务 config的异步流程。
    await handle.writeFile(jsonStringify(config, null, 2), {
      encoding: 'utf8',
    })
    // 等待 `handle.datasync()` 完成，再继续MCP 服务 config的异步流程。
    await handle.datasync()
  } finally {
    // 等待 `handle.close()` 完成，再继续MCP 服务 config的异步流程。
    await handle.close()
  }

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // Restore original file permissions on the temp file before rename
    // `existingMode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (existingMode !== undefined) {
      // 等待 `chmod(tempPath, existingMode)` 完成，再继续MCP 服务 config的异步流程。
      await chmod(tempPath, existingMode)
    }
    // 等待 `rename(tempPath, mcpJsonPath)` 完成，再继续MCP 服务 config的异步流程。
    await rename(tempPath, mcpJsonPath)
  } catch (e: unknown) {
    // Clean up temp file on failure
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(tempPath)` 完成，再继续MCP 服务 config的异步流程。
      await unlink(tempPath)
    } catch {
      // Best-effort cleanup
    }
    // 抛出 e，阻止MCP 服务在无效状态下继续运行。
    throw e
  }
}

/**
 * Extract command array from server config (stdio servers only)
 * Returns null for non-stdio servers
 */
// getServerCommandArray 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getServerCommandArray(config: McpServerConfig): string[] | null {
  // Non-stdio servers don't have commands
  // `config.type` 与 `undefined && config.type !== 's...` 不一致时刷新派生状态，避免使用过期结果。
  if (config.type !== undefined && config.type !== 'stdio') {
    // 返回 `null`，作为MCP 服务这次计算的结果。
    return null
  }
  // stdioConfig 配置保存`config as McpStdioServerConfig`，供后续判断或组装使用。
  const stdioConfig = config as McpStdioServerConfig
  // 返回列表结果，保留MCP 服务已经排好的条目顺序。
  return [stdioConfig.command, ...(stdioConfig.args ?? [])]
}

/**
 * Check if two command arrays match exactly
 */
// commandArraysMatch 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function commandArraysMatch(a: string[], b: string[]): boolean {
  // `a.length` 与 `b.length` 不一致时刷新派生状态，避免使用过期结果。
  if (a.length !== b.length) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `a.every((val, idx) => val === b[idx])`，作为MCP 服务这次计算的结果。
  return a.every((val, idx) => val === b[idx])
}

/**
 * Extract URL from server config (remote servers only)
 * Returns null for stdio/sdk servers
 */
// getServerUrl 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getServerUrl(config: McpServerConfig): string | null {
  // 返回 `'url' in config ? config.url : null`，作为MCP 服务这次计算的结果。
  return 'url' in config ? config.url : null
}

/**
 * CCR proxy URL path markers. In remote sessions, claude.ai connectors arrive
 * via --mcp-config with URLs rewritten to route through the CCR/session-ingress
 * SHTTP proxy. The original vendor URL is preserved in the mcp_url query param
 * so the proxy knows where to forward. See api-go/ccr/internal/ccrshared/
 * mcp_url_rewriter.go and api-go/ccr/internal/mcpproxy/proxy.go.
 */
// CCR_PROXY_PATH_MARKERS 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
const CCR_PROXY_PATH_MARKERS = [
  '/v2/session_ingress/shttp/mcp/',
  '/v2/ccr-sessions/',
]

/**
 * If the URL is a CCR proxy URL, extract the original vendor URL from the
 * mcp_url query parameter. Otherwise return the URL unchanged. This lets
 * signature-based dedup match a plugin's raw vendor URL against a connector's
 * rewritten proxy URL when both point at the same MCP server.
 */
// unwrapCcrProxyUrl 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unwrapCcrProxyUrl(url: string): string {
  // 满足 `!CCR_PROXY_PATH_MARKERS.some(m => url.includes(m))` 时，MCP 服务执行该分支。
  if (!CCR_PROXY_PATH_MARKERS.some(m => url.includes(m))) {
    // 返回 `url`，作为MCP 服务这次计算的结果。
    return url
  }
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`URL`，供MCP 服务后续处理使用。
    const parsed = new URL(url)
    // original读取`searchParams.get`，供MCP 服务后续处理使用。
    const original = parsed.searchParams.get('mcp_url')
    // 返回 `original || url`，作为MCP 服务这次计算的结果。
    return original || url
  } catch {
    // 返回 `url`，作为MCP 服务这次计算的结果。
    return url
  }
}

/**
 * Compute a dedup signature for an MCP server config.
 * Two configs with the same signature are considered "the same server" for
 * plugin deduplication. Ignores env (plugins always inject CLAUDE_PLUGIN_ROOT)
 * and headers (same URL = same server regardless of auth).
 * Returns null only for configs with neither command nor url (sdk type).
 */
// getMcpServerSignature 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpServerSignature(config: McpServerConfig): string | null {
  // cmd 命令数据读取`getServerCommandArray`，供MCP 服务后续处理使用。
  const cmd = getServerCommandArray(config)
  // 满足 `cmd` 时，MCP 服务执行该分支。
  if (cmd) {
    // 返回 ``stdio:${jsonStringify(cmd)}``，作为MCP 服务这次计算的结果。
    return `stdio:${jsonStringify(cmd)}`
  }
  // URL读取`getServerUrl`，供MCP 服务后续处理使用。
  const url = getServerUrl(config)
  // 满足 `url` 时，MCP 服务执行该分支。
  if (url) {
    // 返回 ``url:${unwrapCcrProxyUrl(url)}``，作为MCP 服务这次计算的结果。
    return `url:${unwrapCcrProxyUrl(url)}`
  }
  // 返回 `null`，作为MCP 服务这次计算的结果。
  return null
}

/**
 * Filter plugin MCP servers, dropping any whose signature matches a
 * manually-configured server or an earlier-loaded plugin server.
 * Manual wins over plugin; between plugins, first-loaded wins.
 *
 * Plugin servers are namespaced `plugin:name:server` so they never key-collide
 * with manual servers in the merge — this content-based check catches the case
 * where both actually launch the same underlying process/connection.
 */
// dedupPluginMcpServers 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dedupPluginMcpServers(
  pluginServers: Record<string, ScopedMcpServerConfig>,
  manualServers: Record<string, ScopedMcpServerConfig>,
): {
  servers: Record<string, ScopedMcpServerConfig>
  suppressed: Array<{ name: string; duplicateOf: string }>
} {
  // Map signature -> server name so we can report which server a dup matches
  // manualSigs 集合构建`new Map<string, string>()`，供后续判断或组装使用。
  const manualSigs = new Map<string, string>()
  // 循环处理 `const [name, config] of Object.entries(manualServers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(manualServers)) {
    // sig读取`getMcpServerSignature`，供MCP 服务后续处理使用。
    const sig = getMcpServerSignature(config)
    // 组合条件 `sig && !manualSigs.has(sig)) manualSigs.set(sig, name` 成立时，MCP 服务才启用这条专门路径。
    if (sig && !manualSigs.has(sig)) manualSigs.set(sig, name)
  }

  // servers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const servers: Record<string, ScopedMcpServerConfig> = {}
  // suppressed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const suppressed: Array<{ name: string; duplicateOf: string }> = []
  // seenPluginSigs 插件数据构建`new Map<string, string>()`，供后续判断或组装使用。
  const seenPluginSigs = new Map<string, string>()
  // 循环处理 `const [name, config] of Object.entries(pluginServers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(pluginServers)) {
    // sig读取`getMcpServerSignature`，供MCP 服务后续处理使用。
    const sig = getMcpServerSignature(config)
    // 满足 `sig === null` 时，MCP 服务执行该分支。
    if (sig === null) {
      // servers[name更新为 `config`，确保MCP 服务 config后续读取最新状态。
      servers[name] = config
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
    // manualDup读取`manualSigs.get`，供MCP 服务后续处理使用。
    const manualDup = manualSigs.get(sig)
    // `manualDup` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (manualDup !== undefined) {
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Suppressing plugin MCP server "${name}": duplicates manually-configured "${manualDup}"`,
      )
      // suppressed追加新条目，保持收集顺序与输入顺序一致。
      suppressed.push({ name, duplicateOf: manualDup })
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
    // pluginDup 插件数据读取`seenPluginSigs.get`，供MCP 服务后续处理使用。
    const pluginDup = seenPluginSigs.get(sig)
    // `pluginDup` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (pluginDup !== undefined) {
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Suppressing plugin MCP server "${name}": duplicates earlier plugin server "${pluginDup}"`,
      )
      // suppressed追加新条目，保持收集顺序与输入顺序一致。
      suppressed.push({ name, duplicateOf: pluginDup })
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
    // seenPluginSigs.set 写入新的状态值，使MCP 服务后续读取保持一致。
    seenPluginSigs.set(sig, name)
    // servers[name更新为 `config`，确保MCP 服务 config后续读取最新状态。
    servers[name] = config
  }
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { servers, suppressed }
}

/**
 * Filter claude.ai connectors, dropping any whose signature matches an enabled
 * manually-configured server. Manual wins: a user who wrote .mcp.json or ran
 * `claude mcp add` expressed higher intent than a connector toggled in the web UI.
 *
 * Connector keys are `claude.ai <DisplayName>` so they never key-collide with
 * manual servers in the merge — this content-based check catches the case where
 * both point at the same underlying URL (e.g. `mcp__slack__*` and
 * `mcp__claude_ai_Slack__*` both hitting mcp.slack.com, ~600 chars/turn wasted).
 *
 * Only enabled manual servers count as dedup targets — a disabled manual server
 * mustn't suppress its connector twin, or neither runs.
 */
// dedupClaudeAiMcpServers 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dedupClaudeAiMcpServers(
  claudeAiServers: Record<string, ScopedMcpServerConfig>,
  manualServers: Record<string, ScopedMcpServerConfig>,
): {
  servers: Record<string, ScopedMcpServerConfig>
  suppressed: Array<{ name: string; duplicateOf: string }>
} {
  // manualSigs 集合构建`new Map<string, string>()`，供后续判断或组装使用。
  const manualSigs = new Map<string, string>()
  // 循环处理 `const [name, config] of Object.entries(manualServers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(manualServers)) {
    // 满足 `isMcpServerDisabled(name)` 时，MCP 服务执行该分支。
    if (isMcpServerDisabled(name)) continue
    // sig读取`getMcpServerSignature`，供MCP 服务后续处理使用。
    const sig = getMcpServerSignature(config)
    // 组合条件 `sig && !manualSigs.has(sig)) manualSigs.set(sig, name` 成立时，MCP 服务才启用这条专门路径。
    if (sig && !manualSigs.has(sig)) manualSigs.set(sig, name)
  }

  // servers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const servers: Record<string, ScopedMcpServerConfig> = {}
  // suppressed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const suppressed: Array<{ name: string; duplicateOf: string }> = []
  // 循环处理 `const [name, config] of Object.entries(claudeAiServers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(claudeAiServers)) {
    // sig读取`getMcpServerSignature`，供MCP 服务后续处理使用。
    const sig = getMcpServerSignature(config)
    // manualDup读取`manualSigs.get`，供MCP 服务后续处理使用。
    const manualDup = sig !== null ? manualSigs.get(sig) : undefined
    // `manualDup` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (manualDup !== undefined) {
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Suppressing claude.ai connector "${name}": duplicates manually-configured "${manualDup}"`,
      )
      // suppressed追加新条目，保持收集顺序与输入顺序一致。
      suppressed.push({ name, duplicateOf: manualDup })
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
    // servers[name更新为 `config`，确保MCP 服务 config后续读取最新状态。
    servers[name] = config
  }
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { servers, suppressed }
}

/**
 * Convert a URL pattern with wildcards to a RegExp
 * Supports * as wildcard matching any characters
 * Examples:
 *   "https://example.com/*" matches "https://example.com/api/v1"
 *   "https://*.example.com/*" matches "https://api.example.com/path"
 *   "https://example.com:*\/*" matches any port
 */
// urlPatternToRegex 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function urlPatternToRegex(pattern: string): RegExp {
  // Escape regex special characters except *
  // escaped格式化`pattern.replace`，供MCP 服务后续处理使用。
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  // Replace * with regex equivalent (match any characters)
  // regexStr格式化`escaped.replace`，供MCP 服务后续处理使用。
  const regexStr = escaped.replace(/\*/g, '.*')
  // 返回 `new RegExp(`^${regexStr}$`)`，作为MCP 服务这次计算的结果。
  return new RegExp(`^${regexStr}$`)
}

/**
 * Check if a URL matches a pattern with wildcard support
 */
// urlMatchesPattern 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function urlMatchesPattern(url: string, pattern: string): boolean {
  // regex匹配`urlPatternToRegex`，供MCP 服务后续处理使用。
  const regex = urlPatternToRegex(pattern)
  // 返回 `regex.test(url)`，作为MCP 服务这次计算的结果。
  return regex.test(url)
}

/**
 * Get the settings to use for MCP server allowlist policy.
 * When allowManagedMcpServersOnly is set in policySettings, only managed settings
 * control which servers are allowed. Otherwise, returns merged settings.
 */
// getMcpAllowlistSettings 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpAllowlistSettings(): SettingsJson {
  // 满足 `shouldAllowManagedMcpServersOnly()` 时，MCP 服务执行该分支。
  if (shouldAllowManagedMcpServersOnly()) {
    // 返回 `getSettingsForSource('policySettings') ?? {}`，作为MCP 服务这次计算的结果。
    return getSettingsForSource('policySettings') ?? {}
  }
  // 返回 `getInitialSettings()`，作为MCP 服务这次计算的结果。
  return getInitialSettings()
}

/**
 * Get the settings to use for MCP server denylist policy.
 * Denylists always merge from all sources — users can always deny servers
 * for themselves, even when allowManagedMcpServersOnly is set.
 */
// getMcpDenylistSettings 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpDenylistSettings(): SettingsJson {
  // 返回 `getInitialSettings()`，作为MCP 服务这次计算的结果。
  return getInitialSettings()
}

/**
 * Check if an MCP server is denied by enterprise policy
 * Checks name-based, command-based, and URL-based restrictions
 * @param serverName The name of the server to check
 * @param config Optional server config for command/URL-based matching
 * @returns true if denied, false if not on denylist
 */
// isMcpServerDenied 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMcpServerDenied(
  serverName: string,
  config?: McpServerConfig,
): boolean {
  // settings 集合读取`getMcpDenylistSettings`，供MCP 服务后续处理使用。
  const settings = getMcpDenylistSettings()
  // settings.deniedMcpServers 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!settings.deniedMcpServers) {
    // 返回 `false // No restrictions`，作为MCP 服务这次计算的结果。
    return false // No restrictions
  }

  // Check name-based denial
  // 按顺序遍历 `settings.deniedMcpServers` 中的entry，逐个交给MCP 服务处理。
  for (const entry of settings.deniedMcpServers) {
    // 组合条件 `isMcpServerNameEntry(entry) && entry.serverName === serverName` 成立时，MCP 服务才启用这条专门路径。
    if (isMcpServerNameEntry(entry) && entry.serverName === serverName) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Check command-based denial (stdio servers only) and URL-based denial (remote servers only)
  // 满足 `config` 时，MCP 服务执行该分支。
  if (config) {
    // serverCommand 命令数据读取`getServerCommandArray`，供MCP 服务后续处理使用。
    const serverCommand = getServerCommandArray(config)
    // 满足 `serverCommand` 时，MCP 服务执行该分支。
    if (serverCommand) {
      // 按顺序遍历 `settings.deniedMcpServers` 中的entry，逐个交给MCP 服务处理。
      for (const entry of settings.deniedMcpServers) {
        // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
        if (
          isMcpServerCommandEntry(entry) &&
          commandArraysMatch(entry.serverCommand, serverCommand)
        ) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
    }

    // serverUrl读取`getServerUrl`，供MCP 服务后续处理使用。
    const serverUrl = getServerUrl(config)
    // 满足 `serverUrl` 时，MCP 服务执行该分支。
    if (serverUrl) {
      // 按顺序遍历 `settings.deniedMcpServers` 中的entry，逐个交给MCP 服务处理。
      for (const entry of settings.deniedMcpServers) {
        // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
        if (
          isMcpServerUrlEntry(entry) &&
          urlMatchesPattern(serverUrl, entry.serverUrl)
        ) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if an MCP server is allowed by enterprise policy
 * Checks name-based, command-based, and URL-based restrictions
 * @param serverName The name of the server to check
 * @param config Optional server config for command/URL-based matching
 * @returns true if allowed, false if blocked by policy
 */
// isMcpServerAllowedByPolicy 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMcpServerAllowedByPolicy(
  serverName: string,
  config?: McpServerConfig,
): boolean {
  // Denylist takes absolute precedence
  // 满足 `isMcpServerDenied(serverName, config)` 时，MCP 服务执行该分支。
  if (isMcpServerDenied(serverName, config)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // settings 集合读取`getMcpAllowlistSettings`，供MCP 服务后续处理使用。
  const settings = getMcpAllowlistSettings()
  // settings.allowedMcpServers 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!settings.allowedMcpServers) {
    // 返回 `true // No allowlist restrictions (undefined)`，作为MCP 服务这次计算的结果。
    return true // No allowlist restrictions (undefined)
  }

  // Empty allowlist means block all servers
  // settings.allowedMcpServers 集合为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
  if (settings.allowedMcpServers.length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if allowlist contains any command-based or URL-based entries
  // hasCommandEntries 命令数据记录 `allowedMcpServers.some` 是否成立，MCP 服务随后按该结果分支。
  const hasCommandEntries = settings.allowedMcpServers.some(
    isMcpServerCommandEntry,
  )
  // hasUrlEntries 集合记录 `allowedMcpServers.some` 是否成立，MCP 服务随后按该结果分支。
  const hasUrlEntries = settings.allowedMcpServers.some(isMcpServerUrlEntry)

  // 满足 `config` 时，MCP 服务执行该分支。
  if (config) {
    // serverCommand 命令数据读取`getServerCommandArray`，供MCP 服务后续处理使用。
    const serverCommand = getServerCommandArray(config)
    // serverUrl读取`getServerUrl`，供MCP 服务后续处理使用。
    const serverUrl = getServerUrl(config)

    // 满足 `serverCommand` 时，MCP 服务执行该分支。
    if (serverCommand) {
      // This is a stdio server
      // 满足 `hasCommandEntries` 时，MCP 服务执行该分支。
      if (hasCommandEntries) {
        // If ANY serverCommand entries exist, stdio servers MUST match one of them
        // 按顺序遍历 `settings.allowedMcpServers` 中的entry，逐个交给MCP 服务处理。
        for (const entry of settings.allowedMcpServers) {
          // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
          if (
            isMcpServerCommandEntry(entry) &&
            commandArraysMatch(entry.serverCommand, serverCommand)
          ) {
            // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
            return true
          }
        }
        // 返回 `false // Stdio server doesn't match any command entry`，作为MCP 服务这次计算的结果。
        return false // Stdio server doesn't match any command entry
      } else {
        // No command entries, check name-based allowance
        // 按顺序遍历 `settings.allowedMcpServers` 中的entry，逐个交给MCP 服务处理。
        for (const entry of settings.allowedMcpServers) {
          // 组合条件 `isMcpServerNameEntry(entry) && entry.serverName === serverName` 成立时，MCP 服务才启用这条专门路径。
          if (isMcpServerNameEntry(entry) && entry.serverName === serverName) {
            // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
            return true
          }
        }
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    // MCP 服务 config在这里处理 `} else if (serverUrl) {`，完成这一小步状态转换。
    } else if (serverUrl) {
      // This is a remote server (sse, http, ws, etc.)
      // 满足 `hasUrlEntries` 时，MCP 服务执行该分支。
      if (hasUrlEntries) {
        // If ANY serverUrl entries exist, remote servers MUST match one of them
        // 按顺序遍历 `settings.allowedMcpServers` 中的entry，逐个交给MCP 服务处理。
        for (const entry of settings.allowedMcpServers) {
          // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
          if (
            isMcpServerUrlEntry(entry) &&
            urlMatchesPattern(serverUrl, entry.serverUrl)
          ) {
            // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
            return true
          }
        }
        // 返回 `false // Remote server doesn't match any URL entry`，作为MCP 服务这次计算的结果。
        return false // Remote server doesn't match any URL entry
      } else {
        // No URL entries, check name-based allowance
        // 按顺序遍历 `settings.allowedMcpServers` 中的entry，逐个交给MCP 服务处理。
        for (const entry of settings.allowedMcpServers) {
          // 组合条件 `isMcpServerNameEntry(entry) && entry.serverName === serverName` 成立时，MCP 服务才启用这条专门路径。
          if (isMcpServerNameEntry(entry) && entry.serverName === serverName) {
            // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
            return true
          }
        }
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    } else {
      // Unknown server type - check name-based allowance only
      // 按顺序遍历 `settings.allowedMcpServers` 中的entry，逐个交给MCP 服务处理。
      for (const entry of settings.allowedMcpServers) {
        // 组合条件 `isMcpServerNameEntry(entry) && entry.serverName === serverName` 成立时，MCP 服务才启用这条专门路径。
        if (isMcpServerNameEntry(entry) && entry.serverName === serverName) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // No config provided - check name-based allowance only
  // 按顺序遍历 `settings.allowedMcpServers` 中的entry，逐个交给MCP 服务处理。
  for (const entry of settings.allowedMcpServers) {
    // 组合条件 `isMcpServerNameEntry(entry) && entry.serverName === serverName` 成立时，MCP 服务才启用这条专门路径。
    if (isMcpServerNameEntry(entry) && entry.serverName === serverName) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Filter a record of MCP server configs by managed policy (allowedMcpServers /
 * deniedMcpServers). Servers blocked by policy are dropped and their names
 * returned so callers can warn the user.
 *
 * Intended for user-controlled config entry points that bypass the policy filter
 * in getClaudeCodeMcpConfigs(): --mcp-config (main.tsx) and the mcp_set_servers
 * control message (print.ts, SDK V2 Query.setMcpServers()).
 *
 * SDK-type servers are exempt — they are SDK-managed transport placeholders,
 * not CLI-managed connections. The CLI never spawns a process or opens a
 * network connection for them; tool calls route back to the SDK via
 * mcp_tool_call. URL/command-based allowlist entries are meaningless for them
 * (no url, no command), and gating by name would silently drop them during
 * installPluginsAndApplyMcpInBackground's sdkMcpConfigs carry-forward.
 *
 * The generic has no type constraint because the two callsites use different
 * config type families: main.tsx uses ScopedMcpServerConfig (service type,
 * args: string[] required), print.ts uses McpServerConfigForProcessTransport
 * (SDK wire type, args?: string[] optional). Both are structurally compatible
 * with what isMcpServerAllowedByPolicy actually reads (type/url/command/args)
 * — the policy check only reads, never requires any field to be present.
 * The `as McpServerConfig` widening is safe for that reason; the downstream
 * checks tolerate missing/undefined fields: `config` is optional, and
 * `getServerCommandArray` defaults `args` to `[]` via `?? []`.
 */
// filterMcpServersByPolicy 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterMcpServersByPolicy<T>(configs: Record<string, T>): {
  allowed: Record<string, T>
  blocked: string[]
} {
  // allowed 从空对象开始收集键值，后续按名称补齐内容。
  const allowed: Record<string, T> = {}
  // blocked 从空数组开始收集，后续循环会按处理顺序追加条目。
  const blocked: string[] = []
  // 循环处理 `const [name, config] of Object.entries(configs)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(configs)) {
    // c 命名 `config as McpServerConfig`，让后续代码直接表达这个值的用途。
    const c = config as McpServerConfig
    // 组合条件 `c.type === 'sdk' || isMcpServerAllowedByPolicy(name, c)` 成立时，MCP 服务才启用这条专门路径。
    if (c.type === 'sdk' || isMcpServerAllowedByPolicy(name, c)) {
      // allowed[name更新为 `config`，确保MCP 服务 config后续读取最新状态。
      allowed[name] = config
    } else {
      // blocked追加新条目，保持收集顺序与输入顺序一致。
      blocked.push(name)
    }
  }
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { allowed, blocked }
}

/**
 * Internal utility: Expands environment variables in an MCP server config
 */
// expandEnvVars 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function expandEnvVars(config: McpServerConfig): {
  expanded: McpServerConfig
  missingVars: string[]
} {
  // missingVars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const missingVars: string[] = []

  // expandString 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function expandString(str: string): string {
    // 从 `expandEnvVarsInString(str)` 解构 expanded、missingVars，减少MCP 服务 config对同一对象的重复访问。
    const { expanded, missingVars: vars } = expandEnvVarsInString(str)
    // missingVars 集合追加新条目，保持收集顺序与输入顺序一致。
    missingVars.push(...vars)
    // 返回 `expanded`，作为MCP 服务这次计算的结果。
    return expanded
  }

  // expanded 先占位，稍后的条件分支会根据实际输入补齐它。
  let expanded: McpServerConfig

  // 按照 config.type 的取值选择MCP 服务的具体处理分支。
  switch (config.type) {
    case undefined:
    case 'stdio': {
      // stdioConfig 配置保存`config as McpStdioServerConfig`，供后续判断或组装使用。
      const stdioConfig = config as McpStdioServerConfig
      // expanded更新为 `{`，确保MCP 服务后续读取最新状态。
      expanded = {
        ...stdioConfig,
        command: expandString(stdioConfig.command),
        args: stdioConfig.args.map(expandString),
        env: stdioConfig.env
          ? mapValues(stdioConfig.env, expandString)
          : undefined,
      }
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }
    case 'sse':
    case 'http':
    case 'ws': {
      // remoteConfig 配置保存`config as`，供MCP 服务MCP 服务 config后续判断或输出使用。
      const remoteConfig = config as
        | McpSSEServerConfig
        | McpHTTPServerConfig
        | McpWebSocketServerConfig
      // expanded更新为 `{`，确保MCP 服务后续读取最新状态。
      expanded = {
        ...remoteConfig,
        url: expandString(remoteConfig.url),
        headers: remoteConfig.headers
          ? mapValues(remoteConfig.headers, expandString)
          : undefined,
      }
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }
    case 'sse-ide':
    case 'ws-ide':
      // expanded更新为 `config`，确保MCP 服务后续读取最新状态。
      expanded = config
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    case 'sdk':
      // expanded更新为 `config`，确保MCP 服务后续读取最新状态。
      expanded = config
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    case 'claudeai-proxy':
      // expanded更新为 `config`，确保MCP 服务后续读取最新状态。
      expanded = config
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
  }

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return {
    expanded,
    missingVars: [...new Set(missingVars)],
  }
}

/**
 * Add a new MCP server configuration
 * @param name The name of the server
 * @param config The server configuration
 * @param scope The configuration scope
 * @throws Error if name is invalid or server already exists, or if the config is invalid
 */
// addMcpConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function addMcpConfig(
  name: string,
  config: unknown,
  scope: ConfigScope,
): Promise<void> {
  // 满足 `name.match(/[^a-zA-Z0-9_-]/)` 时，MCP 服务执行该分支。
  if (name.match(/[^a-zA-Z0-9_-]/)) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `Invalid name ${name}. Names can only contain letters, numbers, hyphens, and underscores.`,
    )
  }

  // Block reserved server name "claude-in-chrome"
  // 满足 `isClaudeInChromeMCPServer(name)` 时，MCP 服务执行该分支。
  if (isClaudeInChromeMCPServer(name)) {
    // 抛出 new Error(`Cannot add MCP server "${name}": this name is reserved.`)，阻止MCP 服务在无效状态下继续运行。
    throw new Error(`Cannot add MCP server "${name}": this name is reserved.`)
  }

  // 满足 `feature('CHICAGO_MCP')` 时，MCP 服务执行该分支。
  if (feature('CHICAGO_MCP')) {
    // 从 `await import(` 解构 isComputerUseMCPServer，减少MCP 服务 config对同一对象的重复访问。
    const { isComputerUseMCPServer } = await import(
      '../../utils/computerUse/common.js'
    )
    // 满足 `isComputerUseMCPServer(name)` 时，MCP 服务执行该分支。
    if (isComputerUseMCPServer(name)) {
      // 抛出 new Error(`Cannot add MCP server "${name}": this name is reserved.`)，阻止MCP 服务在无效状态下继续运行。
      throw new Error(`Cannot add MCP server "${name}": this name is reserved.`)
    }
  }

  // Block adding servers when enterprise MCP config exists (it has exclusive control)
  // 满足 `doesEnterpriseMcpConfigExist()` 时，MCP 服务执行该分支。
  if (doesEnterpriseMcpConfigExist()) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `Cannot add MCP server: enterprise MCP configuration is active and has exclusive control over MCP servers`,
    )
  }

  // Validate config first (needed for command-based policy checks)
  // 结果保存`McpServerConfigSchema`，供MCP 服务后续处理使用。
  const result = McpServerConfigSchema().safeParse(config)
  // result.success 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!result.success) {
    // formattedErrors 错误信息 命名 `result.error.issues`，让后续代码直接表达这个值的用途。
    const formattedErrors = result.error.issues
      // 链式调用 map，继续加工上一行在MCP 服务中产生的数据。
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ')
    // 抛出 new Error(`Invalid configuration: ${formattedErrors}`)，阻止MCP 服务在无效状态下继续运行。
    throw new Error(`Invalid configuration: ${formattedErrors}`)
  }
  // validatedConfig 配置保存`result.data`，供后续判断或组装使用。
  const validatedConfig = result.data

  // Check denylist (with config for command-based checks)
  // 满足 `isMcpServerDenied(name, validatedConfig)` 时，MCP 服务执行该分支。
  if (isMcpServerDenied(name, validatedConfig)) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `Cannot add MCP server "${name}": server is explicitly blocked by enterprise policy`,
    )
  }

  // Check allowlist (with config for command-based checks)
  // 满足 `!isMcpServerAllowedByPolicy(name, validatedConfig)` 时，MCP 服务执行该分支。
  if (!isMcpServerAllowedByPolicy(name, validatedConfig)) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `Cannot add MCP server "${name}": not allowed by enterprise policy`,
    )
  }

  // Check if server already exists in the target scope
  // 按照 scope 的取值选择MCP 服务的具体处理分支。
  switch (scope) {
    case 'project': {
      // 从 `getProjectMcpConfigsFromCwd()` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
      const { servers } = getProjectMcpConfigsFromCwd()
      // 满足 `servers[name]` 时，MCP 服务执行该分支。
      if (servers[name]) {
        // 抛出 new Error(`MCP server ${name} already exists in .mcp.json`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`MCP server ${name} already exists in .mcp.json`)
      }
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }
    case 'user': {
      // globalConfig 配置读取`getGlobalConfig`，供MCP 服务后续处理使用。
      const globalConfig = getGlobalConfig()
      // 满足 `globalConfig.mcpServers?.[name]` 时，MCP 服务执行该分支。
      if (globalConfig.mcpServers?.[name]) {
        // 抛出 new Error(`MCP server ${name} already exists in user config`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`MCP server ${name} already exists in user config`)
      }
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }
    case 'local': {
      // projectConfig 配置读取`getCurrentProjectConfig`，供MCP 服务后续处理使用。
      const projectConfig = getCurrentProjectConfig()
      // 满足 `projectConfig.mcpServers?.[name]` 时，MCP 服务执行该分支。
      if (projectConfig.mcpServers?.[name]) {
        // 抛出 new Error(`MCP server ${name} already exists in local config`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`MCP server ${name} already exists in local config`)
      }
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }
    case 'dynamic':
      // 抛出 new Error('Cannot add MCP server to scope: dynamic')，阻止MCP 服务在无效状态下继续运行。
      throw new Error('Cannot add MCP server to scope: dynamic')
    case 'enterprise':
      // 抛出 new Error('Cannot add MCP server to scope: enterprise')，阻止MCP 服务在无效状态下继续运行。
      throw new Error('Cannot add MCP server to scope: enterprise')
    case 'claudeai':
      // 抛出 new Error('Cannot add MCP server to scope: claudeai')，阻止MCP 服务在无效状态下继续运行。
      throw new Error('Cannot add MCP server to scope: claudeai')
  }

  // Add based on scope
  // 按照 scope 的取值选择MCP 服务的具体处理分支。
  switch (scope) {
    case 'project': {
      // 从 `getProjectMcpConfigsFromCwd()` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
      const { servers: existingServers } = getProjectMcpConfigsFromCwd()

      // mcpServers 集合 从空对象开始收集键值，后续按名称补齐内容。
      const mcpServers: Record<string, McpServerConfig> = {}
      // 调用 for，触发MCP 服务此处需要的副作用。
      for (const [serverName, serverConfig] of Object.entries(
        existingServers,
      )) {
        // 从 `serverConfig` 解构 scope、其余 configWithoutScope，减少MCP 服务 config对同一对象的重复访问。
        const { scope: _, ...configWithoutScope } = serverConfig
        // mcpServers[serverName更新为 `configWithoutScope`，确保MCP 服务 config后续读取最新状态。
        mcpServers[serverName] = configWithoutScope
      }
      // mcpServers[name更新为 `validatedConfig`，确保MCP 服务 config后续读取最新状态。
      mcpServers[name] = validatedConfig
      // mcpConfig 配置集中保存MCP 服务MCP 服务 config要一起传递的字段。
      const mcpConfig = { mcpServers }

      // Write back to .mcp.json
      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `writeMcpjsonFile(mcpConfig)` 完成，再继续MCP 服务 config的异步流程。
        await writeMcpjsonFile(mcpConfig)
      } catch (error) {
        // 抛出 new Error(`Failed to write to .mcp.json: ${error}`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`Failed to write to .mcp.json: ${error}`)
      }
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }

    case 'user': {
      // 调用 saveGlobalConfig，触发MCP 服务此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        mcpServers: {
          ...current.mcpServers,
          [name]: validatedConfig,
        },
      }))
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }

    case 'local': {
      // 调用 saveCurrentProjectConfig，触发MCP 服务此处需要的副作用。
      saveCurrentProjectConfig(current => ({
        ...current,
        mcpServers: {
          ...current.mcpServers,
          [name]: validatedConfig,
        },
      }))
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }

    default:
      // 抛出 new Error(`Cannot add MCP server to scope: ${scope}`)，阻止MCP 服务在无效状态下继续运行。
      throw new Error(`Cannot add MCP server to scope: ${scope}`)
  }
}

/**
 * Remove an MCP server configuration
 * @param name The name of the server to remove
 * @param scope The configuration scope
 * @throws Error if server not found in specified scope
 */
// removeMcpConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeMcpConfig(
  name: string,
  scope: ConfigScope,
): Promise<void> {
  // 按照 scope 的取值选择MCP 服务的具体处理分支。
  switch (scope) {
    case 'project': {
      // 从 `getProjectMcpConfigsFromCwd()` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
      const { servers: existingServers } = getProjectMcpConfigsFromCwd()

      // 满足 `!existingServers[name]` 时，MCP 服务执行该分支。
      if (!existingServers[name]) {
        // 抛出 new Error(`No MCP server found with name: ${name} in .mcp.json`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`No MCP server found with name: ${name} in .mcp.json`)
      }

      // Strip scope information when writing back to .mcp.json
      // mcpServers 集合 从空对象开始收集键值，后续按名称补齐内容。
      const mcpServers: Record<string, McpServerConfig> = {}
      // 调用 for，触发MCP 服务此处需要的副作用。
      for (const [serverName, serverConfig] of Object.entries(
        existingServers,
      )) {
        // `serverName` 与 `name` 不一致时刷新派生状态，避免使用过期结果。
        if (serverName !== name) {
          // 从 `serverConfig` 解构 scope、其余 configWithoutScope，减少MCP 服务 config对同一对象的重复访问。
          const { scope: _, ...configWithoutScope } = serverConfig
          // mcpServers[serverName更新为 `configWithoutScope`，确保MCP 服务 config后续读取最新状态。
          mcpServers[serverName] = configWithoutScope
        }
      }
      // mcpConfig 配置集中保存MCP 服务MCP 服务 config要一起传递的字段。
      const mcpConfig = { mcpServers }
      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `writeMcpjsonFile(mcpConfig)` 完成，再继续MCP 服务 config的异步流程。
        await writeMcpjsonFile(mcpConfig)
      } catch (error) {
        // 抛出 new Error(`Failed to remove from .mcp.json: ${error}`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`Failed to remove from .mcp.json: ${error}`)
      }
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }

    case 'user': {
      // 配置读取`getGlobalConfig`，供MCP 服务后续处理使用。
      const config = getGlobalConfig()
      // 满足 `!config.mcpServers?.[name]` 时，MCP 服务执行该分支。
      if (!config.mcpServers?.[name]) {
        // 抛出 new Error(`No user-scoped MCP server found with name: ${name}`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`No user-scoped MCP server found with name: ${name}`)
      }
      // 调用 saveGlobalConfig，触发MCP 服务此处需要的副作用。
      saveGlobalConfig(current => {
        // 从 `current.mcpServers ?? {}` 解构 [name]、其余 restMcpServers，减少MCP 服务 config对同一对象的重复访问。
        const { [name]: _, ...restMcpServers } = current.mcpServers ?? {}
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          ...current,
          mcpServers: restMcpServers,
        }
      })
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }

    case 'local': {
      // Check if server exists before updating
      // 配置读取`getCurrentProjectConfig`，供MCP 服务后续处理使用。
      const config = getCurrentProjectConfig()
      // 满足 `!config.mcpServers?.[name]` 时，MCP 服务执行该分支。
      if (!config.mcpServers?.[name]) {
        // 抛出 new Error(`No project-local MCP server found with name: ${name}`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`No project-local MCP server found with name: ${name}`)
      }
      // 调用 saveCurrentProjectConfig，触发MCP 服务此处需要的副作用。
      saveCurrentProjectConfig(current => {
        // 从 `current.mcpServers ?? {}` 解构 [name]、其余 restMcpServers，减少MCP 服务 config对同一对象的重复访问。
        const { [name]: _, ...restMcpServers } = current.mcpServers ?? {}
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          ...current,
          mcpServers: restMcpServers,
        }
      })
      // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
      break
    }

    default:
      // 抛出 new Error(`Cannot remove MCP server from scope: ${scope}`)，阻止MCP 服务在无效状态下继续运行。
      throw new Error(`Cannot remove MCP server from scope: ${scope}`)
  }
}

/**
 * Get MCP configs from current directory only (no parent traversal).
 * Used by addMcpConfig and removeMcpConfig to modify the local .mcp.json file.
 * Exported for testing purposes.
 *
 * @returns Servers with scope information and any validation errors from current directory's .mcp.json
 */
// getProjectMcpConfigsFromCwd 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectMcpConfigsFromCwd(): {
  servers: Record<string, ScopedMcpServerConfig>
  errors: ValidationError[]
} {
  // Check if project source is enabled
  // 满足 `!isSettingSourceEnabled('projectSettings')` 时，MCP 服务执行该分支。
  if (!isSettingSourceEnabled('projectSettings')) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { servers: {}, errors: [] }
  }

  // mcpJsonPath 路径数据格式化`join`，供MCP 服务后续处理使用。
  const mcpJsonPath = join(getCwd(), '.mcp.json')

  // 从 `parseMcpConfigFromFilePath({` 解构 config、errors，减少MCP 服务 config对同一对象的重复访问。
  const { config, errors } = parseMcpConfigFromFilePath({
    filePath: mcpJsonPath,
    expandVars: true,
    scope: 'project',
  })

  // Missing .mcp.json is expected, but malformed files should report errors
  // 配置缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!config) {
    // nonMissingErrors 错误信息筛选`errors.filter`，供MCP 服务后续处理使用。
    const nonMissingErrors = errors.filter(
      // e更新为 `> !e.message.startsWith('MCP config file not found')`，确保MCP 服务后续读取最新状态。
      e => !e.message.startsWith('MCP config file not found'),
    )
    // 满足 `nonMissingErrors.length > 0` 时，MCP 服务执行该分支。
    if (nonMissingErrors.length > 0) {
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        // 这个回调绑定到 `MCP config errors for ${mcpJsonPath}: ${jsonStringify(nonMissingErrors.map(e => e.m…，负责MCP 服务在该局部场景下的响应。
        `MCP config errors for ${mcpJsonPath}: ${jsonStringify(nonMissingErrors.map(e => e.message))}`,
        { level: 'error' },
      )
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return { servers: {}, errors: nonMissingErrors }
    }
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { servers: {}, errors: [] }
  }

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return {
    servers: config.mcpServers
      ? addScopeToServers(config.mcpServers, 'project')
      : {},
    errors: errors || [],
  }
}

/**
 * Get all MCP configurations from a specific scope
 * @param scope The configuration scope
 * @returns Servers with scope information and any validation errors
 */
// getMcpConfigsByScope 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpConfigsByScope(
  scope: 'project' | 'user' | 'local' | 'enterprise',
): {
  servers: Record<string, ScopedMcpServerConfig>
  errors: ValidationError[]
} {
  // Check if this source is enabled
  // sourceMap 先占位，稍后的条件分支会根据实际输入补齐它。
  const sourceMap: Record<
    string,
    'projectSettings' | 'userSettings' | 'localSettings'
  > = {
    project: 'projectSettings',
    user: 'userSettings',
    local: 'localSettings',
  }

  // 组合条件 `scope in sourceMap && !isSettingSourceEnabled(sourceMap[scope]!)` 成立时，MCP 服务才启用这条专门路径。
  if (scope in sourceMap && !isSettingSourceEnabled(sourceMap[scope]!)) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { servers: {}, errors: [] }
  }

  // 按照 scope 的取值选择MCP 服务的具体处理分支。
  switch (scope) {
    case 'project': {
      // allServers 集合 从空对象开始收集键值，后续按名称补齐内容。
      const allServers: Record<string, ScopedMcpServerConfig> = {}
      // allErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
      const allErrors: ValidationError[] = []

      // Build list of directories to check
      // dirs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const dirs: string[] = []
      // currentDir读取`getCwd`，供MCP 服务后续处理使用。
      let currentDir = getCwd()

      // 只要 currentDir !== parse(currentDir).root 成立，就持续推进MCP 服务中的循环处理。
      while (currentDir !== parse(currentDir).root) {
        // dirs 集合追加新条目，保持收集顺序与输入顺序一致。
        dirs.push(currentDir)
        // currentDir更新为 `dirname(currentDir)`，确保MCP 服务后续读取最新状态。
        currentDir = dirname(currentDir)
      }

      // Process from root downward to CWD (so closer files have higher priority)
      // 逐项读取 `dirs.reverse()` 中的dir，按输入顺序推进MCP 服务。
      for (const dir of dirs.reverse()) {
        // mcpJsonPath 路径数据格式化`join`，供MCP 服务后续处理使用。
        const mcpJsonPath = join(dir, '.mcp.json')

        // 从 `parseMcpConfigFromFilePath({` 解构 config、errors，减少MCP 服务 config对同一对象的重复访问。
        const { config, errors } = parseMcpConfigFromFilePath({
          filePath: mcpJsonPath,
          expandVars: true,
          scope: 'project',
        })

        // Missing .mcp.json in parent directories is expected, but malformed files should report errors
        // 配置缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!config) {
          // nonMissingErrors 错误信息筛选`errors.filter`，供MCP 服务后续处理使用。
          const nonMissingErrors = errors.filter(
            // e更新为 `> !e.message.startsWith('MCP config file not found')`，确保MCP 服务后续读取最新状态。
            e => !e.message.startsWith('MCP config file not found'),
          )
          // 满足 `nonMissingErrors.length > 0` 时，MCP 服务执行该分支。
          if (nonMissingErrors.length > 0) {
            // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              // 这个回调绑定到 `MCP config errors for ${mcpJsonPath}: ${jsonStringify(nonMissingErrors.map(e => e.m…，负责MCP 服务在该局部场景下的响应。
              `MCP config errors for ${mcpJsonPath}: ${jsonStringify(nonMissingErrors.map(e => e.message))}`,
              { level: 'error' },
            )
            // allErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
            allErrors.push(...nonMissingErrors)
          }
          // 跳过当前项，继续处理MCP 服务中的下一轮循环。
          continue
        }

        // 满足 `config.mcpServers` 时，MCP 服务执行该分支。
        if (config.mcpServers) {
          // Merge servers, with files closer to CWD overriding parent configs
          // 调用 Object.assign，触发MCP 服务此处需要的副作用。
          Object.assign(allServers, addScopeToServers(config.mcpServers, scope))
        }

        // 满足 `errors.length > 0` 时，MCP 服务执行该分支。
        if (errors.length > 0) {
          // allErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
          allErrors.push(...errors)
        }
      }

      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        servers: allServers,
        errors: allErrors,
      }
    }
    case 'user': {
      // mcpServers 集合读取`getGlobalConfig`，供MCP 服务后续处理使用。
      const mcpServers = getGlobalConfig().mcpServers
      // mcpServers 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!mcpServers) {
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return { servers: {}, errors: [] }
      }

      // 从 `parseMcpConfig({` 解构 config、errors，减少MCP 服务 config对同一对象的重复访问。
      const { config, errors } = parseMcpConfig({
        configObject: { mcpServers },
        expandVars: true,
        scope: 'user',
      })

      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        servers: addScopeToServers(config?.mcpServers, scope),
        errors,
      }
    }
    case 'local': {
      // mcpServers 集合读取`getCurrentProjectConfig`，供MCP 服务后续处理使用。
      const mcpServers = getCurrentProjectConfig().mcpServers
      // mcpServers 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!mcpServers) {
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return { servers: {}, errors: [] }
      }

      // 从 `parseMcpConfig({` 解构 config、errors，减少MCP 服务 config对同一对象的重复访问。
      const { config, errors } = parseMcpConfig({
        configObject: { mcpServers },
        expandVars: true,
        scope: 'local',
      })

      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        servers: addScopeToServers(config?.mcpServers, scope),
        errors,
      }
    }
    case 'enterprise': {
      // enterpriseMcpPath 路径数据读取`getEnterpriseMcpFilePath`，供MCP 服务后续处理使用。
      const enterpriseMcpPath = getEnterpriseMcpFilePath()

      // 从 `parseMcpConfigFromFilePath({` 解构 config、errors，减少MCP 服务 config对同一对象的重复访问。
      const { config, errors } = parseMcpConfigFromFilePath({
        filePath: enterpriseMcpPath,
        expandVars: true,
        scope: 'enterprise',
      })

      // Missing enterprise config file is expected, but malformed files should report errors
      // 配置缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!config) {
        // nonMissingErrors 错误信息筛选`errors.filter`，供MCP 服务后续处理使用。
        const nonMissingErrors = errors.filter(
          // e更新为 `> !e.message.startsWith('MCP config file not found')`，确保MCP 服务后续读取最新状态。
          e => !e.message.startsWith('MCP config file not found'),
        )
        // 满足 `nonMissingErrors.length > 0` 时，MCP 服务执行该分支。
        if (nonMissingErrors.length > 0) {
          // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            // 这个回调绑定到 `Enterprise MCP config errors for ${enterpriseMcpPath}: ${jsonStringify(nonMissingEr…，负责MCP 服务在该局部场景下的响应。
            `Enterprise MCP config errors for ${enterpriseMcpPath}: ${jsonStringify(nonMissingErrors.map(e => e.message))}`,
            { level: 'error' },
          )
          // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
          return { servers: {}, errors: nonMissingErrors }
        }
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return { servers: {}, errors: [] }
      }

      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        servers: addScopeToServers(config.mcpServers, scope),
        errors,
      }
    }
  }
}

/**
 * Get an MCP server configuration by name
 * @param name The name of the server
 * @returns The server configuration with scope, or undefined if not found
 */
// getMcpConfigByName 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpConfigByName(name: string): ScopedMcpServerConfig | null {
  // 从 `getMcpConfigsByScope('enterprise')` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: enterpriseServers } = getMcpConfigsByScope('enterprise')

  // When MCP is locked to plugin-only, only enterprise servers are reachable
  // by name. User/project/local servers are blocked — same as getClaudeCodeMcpConfigs().
  // 满足 `isRestrictedToPluginOnly('mcp')` 时，MCP 服务执行该分支。
  if (isRestrictedToPluginOnly('mcp')) {
    // 返回 `enterpriseServers[name] ?? null`，作为MCP 服务这次计算的结果。
    return enterpriseServers[name] ?? null
  }

  // 从 `getMcpConfigsByScope('user')` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: userServers } = getMcpConfigsByScope('user')
  // 从 `getMcpConfigsByScope('project')` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: projectServers } = getMcpConfigsByScope('project')
  // 从 `getMcpConfigsByScope('local')` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: localServers } = getMcpConfigsByScope('local')

  // 满足 `enterpriseServers[name]` 时，MCP 服务执行该分支。
  if (enterpriseServers[name]) {
    // 返回 `enterpriseServers[name]`，作为MCP 服务这次计算的结果。
    return enterpriseServers[name]
  }
  // 满足 `localServers[name]` 时，MCP 服务执行该分支。
  if (localServers[name]) {
    // 返回 `localServers[name]`，作为MCP 服务这次计算的结果。
    return localServers[name]
  }
  // 满足 `projectServers[name]` 时，MCP 服务执行该分支。
  if (projectServers[name]) {
    // 返回 `projectServers[name]`，作为MCP 服务这次计算的结果。
    return projectServers[name]
  }
  // 满足 `userServers[name]` 时，MCP 服务执行该分支。
  if (userServers[name]) {
    // 返回 `userServers[name]`，作为MCP 服务这次计算的结果。
    return userServers[name]
  }

  // 返回 `null`，作为MCP 服务这次计算的结果。
  return null
}

/**
 * Get Claude Code MCP configurations (excludes claude.ai servers from the
 * returned set — they're fetched separately and merged by callers).
 * This is fast: only local file reads; no awaited network calls on the
 * critical path. The optional extraDedupTargets promise (e.g. the in-flight
 * claude.ai connector fetch) is awaited only after loadAllPluginsCacheOnly() completes,
 * so the two overlap rather than serialize.
 * @returns Claude Code server configurations with appropriate scopes
 */
// getClaudeCodeMcpConfigs 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getClaudeCodeMcpConfigs(
  dynamicServers: Record<string, ScopedMcpServerConfig> = {},
  extraDedupTargets: Promise<
    Record<string, ScopedMcpServerConfig>
  > = Promise.resolve({}),
): Promise<{
  servers: Record<string, ScopedMcpServerConfig>
  errors: PluginError[]
}> {
  // 从 `getMcpConfigsByScope('enterprise')` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: enterpriseServers } = getMcpConfigsByScope('enterprise')

  // If an enterprise mcp config exists, do not use any others; this has exclusive control over all MCP servers
  // (enterprise customers often do not want their users to be able to add their own MCP servers).
  // 满足 `doesEnterpriseMcpConfigExist()` 时，MCP 服务执行该分支。
  if (doesEnterpriseMcpConfigExist()) {
    // Apply policy filtering to enterprise servers
    // filtered 从空对象开始收集键值，后续按名称补齐内容。
    const filtered: Record<string, ScopedMcpServerConfig> = {}

    // 循环处理 `const [name, serverConfig] of Object.entries(enterpriseServers)`，让MCP 服务把同类条目按顺序走完。
    for (const [name, serverConfig] of Object.entries(enterpriseServers)) {
      // 满足 `!isMcpServerAllowedByPolicy(name, serverConfig)` 时，MCP 服务执行该分支。
      if (!isMcpServerAllowedByPolicy(name, serverConfig)) {
        // 跳过当前项，继续处理MCP 服务中的下一轮循环。
        continue
      }
      // filtered[name更新为 `serverConfig`，确保MCP 服务 config后续读取最新状态。
      filtered[name] = serverConfig
    }

    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { servers: filtered, errors: [] }
  }

  // Load other scopes — unless the managed policy locks MCP to plugin-only.
  // Unlike the enterprise-exclusive block above, this keeps plugin servers.
  // mcpLocked保存`isRestrictedToPluginOnly`，供MCP 服务后续处理使用。
  const mcpLocked = isRestrictedToPluginOnly('mcp')
  // noServers 集合 集中保存MCP 服务 config要一起传递的字段。
  const noServers: { servers: Record<string, ScopedMcpServerConfig> } = {
    servers: {},
  }
  // 从 `mcpLocked` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: userServers } = mcpLocked
    ? noServers
    : getMcpConfigsByScope('user')
  // 从 `mcpLocked` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: projectServers } = mcpLocked
    ? noServers
    : getMcpConfigsByScope('project')
  // 从 `mcpLocked` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: localServers } = mcpLocked
    ? noServers
    : getMcpConfigsByScope('local')

  // Load plugin MCP servers
  // pluginMcpServers 插件数据 从空对象开始收集键值，后续按名称补齐内容。
  const pluginMcpServers: Record<string, ScopedMcpServerConfig> = {}

  // pluginResult 插件数据读取`loadAllPluginsCacheOnly`，供MCP 服务后续处理使用。
  const pluginResult = await loadAllPluginsCacheOnly()

  // Collect MCP-specific errors during server loading
  // mcpErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const mcpErrors: PluginError[] = []

  // Log any plugin loading errors - NEVER silently fail in production
  // 满足 `pluginResult.errors.length > 0` 时，MCP 服务执行该分支。
  if (pluginResult.errors.length > 0) {
    // 按顺序遍历 `pluginResult.errors` 中的错误，逐个交给MCP 服务处理。
    for (const error of pluginResult.errors) {
      // Only log as MCP error if it's actually MCP-related
      // Otherwise just log as debug since the plugin might not have MCP servers
      // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
      if (
        error.type === 'mcp-config-invalid' ||
        error.type === 'mcpb-download-failed' ||
        error.type === 'mcpb-extract-failed' ||
        error.type === 'mcpb-invalid-manifest'
      ) {
        // errorMessage 消息数据读取`getPluginErrorMessage`，供MCP 服务后续处理使用。
        const errorMessage = `Plugin MCP loading error - ${error.type}: ${getPluginErrorMessage(error)}`
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logError(new Error(errorMessage))
      } else {
        // Plugin doesn't exist or isn't available - this is common and not necessarily an error
        // The plugin system will handle installing it if possible
        // errorType 错误信息 命名 `error.type`，让后续代码直接表达这个值的用途。
        const errorType = error.type
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin not available for MCP: ${error.source} - error type: ${errorType}`,
        )
      }
    }
  }

  // Process enabled plugins for MCP servers in parallel
  // pluginServerResults 插件数据保存`Promise.all`，供MCP 服务后续处理使用。
  const pluginServerResults = await Promise.all(
    // 调用 pluginResult.enabled.map，触发MCP 服务此处需要的副作用。
    pluginResult.enabled.map(plugin => getPluginMcpServers(plugin, mcpErrors)),
  )
  // 按顺序遍历 `pluginServerResults` 中的servers 集合，逐个交给MCP 服务处理。
  for (const servers of pluginServerResults) {
    // 满足 `servers` 时，MCP 服务执行该分支。
    if (servers) {
      // 调用 Object.assign，触发MCP 服务此处需要的副作用。
      Object.assign(pluginMcpServers, servers)
    }
  }

  // Add any MCP-specific errors from server loading to plugin errors
  // 满足 `mcpErrors.length > 0` 时，MCP 服务执行该分支。
  if (mcpErrors.length > 0) {
    // 按顺序遍历 `mcpErrors` 中的错误，逐个交给MCP 服务处理。
    for (const error of mcpErrors) {
      // errorMessage 消息数据读取`getPluginErrorMessage`，供MCP 服务后续处理使用。
      const errorMessage = `Plugin MCP server error - ${error.type}: ${getPluginErrorMessage(error)}`
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logError(new Error(errorMessage))
    }
  }

  // Filter project servers to only include approved ones
  // approvedProjectServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const approvedProjectServers: Record<string, ScopedMcpServerConfig> = {}
  // 循环处理 `const [name, config] of Object.entries(projectServers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(projectServers)) {
    // 当 `getProjectMcpServerStatus(name)` 匹配 `'approved'` 时，MCP 服务执行对应分支。
    if (getProjectMcpServerStatus(name) === 'approved') {
      // approvedProjectServers[name更新为 `config`，确保MCP 服务 config后续读取最新状态。
      approvedProjectServers[name] = config
    }
  }

  // Dedup plugin servers against manually-configured ones (and each other).
  // Plugin server keys are namespaced `plugin:x:y` so they never collide with
  // manual keys in the merge below — this content-based filter catches the case
  // where both would launch the same underlying process/connection.
  // Only servers that will actually connect are valid dedup targets — a
  // disabled manual server mustn't suppress a plugin server, or neither runs
  // (manual is skipped by name at connection time; plugin was removed here).
  // extraTargets 集合 等待 `extraDedupTargets`，确保继续执行前已有结果。
  const extraTargets = await extraDedupTargets
  // enabledManualServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const enabledManualServers: Record<string, ScopedMcpServerConfig> = {}
  // 调用 for，触发MCP 服务此处需要的副作用。
  for (const [name, config] of Object.entries({
    ...userServers,
    ...approvedProjectServers,
    ...localServers,
    ...dynamicServers,
    ...extraTargets,
  })) {
    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      !isMcpServerDisabled(name) &&
      isMcpServerAllowedByPolicy(name, config)
    ) {
      // enabledManualServers[name更新为 `config`，确保MCP 服务 config后续读取最新状态。
      enabledManualServers[name] = config
    }
  }
  // Split off disabled/policy-blocked plugin servers so they don't win the
  // first-plugin-wins race against an enabled duplicate — same invariant as
  // above. They're merged back after dedup so they still appear in /mcp
  // (policy filtering at the end of this function drops blocked ones).
  // enabledPluginServers 插件数据 从空对象开始收集键值，后续按名称补齐内容。
  const enabledPluginServers: Record<string, ScopedMcpServerConfig> = {}
  // disabledPluginServers 插件数据 从空对象开始收集键值，后续按名称补齐内容。
  const disabledPluginServers: Record<string, ScopedMcpServerConfig> = {}
  // 循环处理 `const [name, config] of Object.entries(pluginMcpServers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(pluginMcpServers)) {
    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      isMcpServerDisabled(name) ||
      !isMcpServerAllowedByPolicy(name, config)
    ) {
      // disabledPluginServers[name 插件数据更新为 `config`，确保MCP 服务 config后续读取最新状态。
      disabledPluginServers[name] = config
    } else {
      // enabledPluginServers[name 插件数据更新为 `config`，确保MCP 服务 config后续读取最新状态。
      enabledPluginServers[name] = config
    }
  }
  // 从 `dedupPluginMcpServers(` 解构 servers、suppressed，减少MCP 服务 config对同一对象的重复访问。
  const { servers: dedupedPluginServers, suppressed } = dedupPluginMcpServers(
    enabledPluginServers,
    enabledManualServers,
  )
  // 调用 Object.assign，触发MCP 服务此处需要的副作用。
  Object.assign(dedupedPluginServers, disabledPluginServers)
  // Surface suppressions in /plugin UI. Pushed AFTER the logError loop above
  // so these don't go to the error log — they're informational, not errors.
  // 循环处理 `const { name, duplicateOf } of suppressed`，让MCP 服务逐项把同类条目按顺序走完。
  for (const { name, duplicateOf } of suppressed) {
    // name is "plugin:${pluginName}:${serverName}" from addPluginScopeToServers
    // 片段列表格式化`name.split`，供MCP 服务后续处理使用。
    const parts = name.split(':')
    // `parts[0]` 与 `'plugin' || parts.length < 3` 不一致时刷新派生状态，避免使用过期结果。
    if (parts[0] !== 'plugin' || parts.length < 3) continue
    // mcpErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
    mcpErrors.push({
      type: 'mcp-server-suppressed-duplicate',
      source: name,
      plugin: parts[1]!,
      serverName: parts.slice(2).join(':'),
      duplicateOf,
    })
  }

  // Merge in order of precedence: plugin < user < project < local
  // configs 配置保存`Object.assign`，供MCP 服务后续处理使用。
  const configs = Object.assign(
    {},
    dedupedPluginServers,
    userServers,
    approvedProjectServers,
    localServers,
  )

  // Apply policy filtering to merged configs
  // filtered 从空对象开始收集键值，后续按名称补齐内容。
  const filtered: Record<string, ScopedMcpServerConfig> = {}

  // 循环处理 `const [name, serverConfig] of Object.entries(configs)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, serverConfig] of Object.entries(configs)) {
    // 满足 `!isMcpServerAllowedByPolicy(name, serverConfig as McpServerConfig)` 时，MCP 服务执行该分支。
    if (!isMcpServerAllowedByPolicy(name, serverConfig as McpServerConfig)) {
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
    // filtered[name更新为 `serverConfig as ScopedMcpServerConfig`，确保MCP 服务 config后续读取最新状态。
    filtered[name] = serverConfig as ScopedMcpServerConfig
  }

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { servers: filtered, errors: mcpErrors }
}

/**
 * Get all MCP configurations across all scopes, including claude.ai servers.
 * This may be slow due to network calls - use getClaudeCodeMcpConfigs() for fast startup.
 * @returns All server configurations with appropriate scopes
 */
// getAllMcpConfigs 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAllMcpConfigs(): Promise<{
  servers: Record<string, ScopedMcpServerConfig>
  errors: PluginError[]
}> {
  // In enterprise mode, don't load claude.ai servers (enterprise has exclusive control)
  // 满足 `doesEnterpriseMcpConfigExist()` 时，MCP 服务执行该分支。
  if (doesEnterpriseMcpConfigExist()) {
    // 返回 `getClaudeCodeMcpConfigs()`，作为MCP 服务这次计算的结果。
    return getClaudeCodeMcpConfigs()
  }

  // Kick off the claude.ai fetch before getClaudeCodeMcpConfigs so it overlaps
  // with loadAllPluginsCacheOnly() inside. Memoized — the awaited call below is a cache hit.
  // claudeaiPromise 异步任务保存 `fetchClaudeAIMcpConfigsIfEligible` 启动的异步任务，稍后再决定等待还是后台完成。
  const claudeaiPromise = fetchClaudeAIMcpConfigsIfEligible()
  // 从 `await getClaudeCodeMcpConfigs(` 解构 servers、errors，减少MCP 服务 config对同一对象的重复访问。
  const { servers: claudeCodeServers, errors } = await getClaudeCodeMcpConfigs(
    {},
    claudeaiPromise,
  )
  // 从 `filterMcpServersByPolicy(` 解构 allowed，减少MCP 服务 config对同一对象的重复访问。
  const { allowed: claudeaiMcpServers } = filterMcpServersByPolicy(
    await claudeaiPromise,
  )

  // Suppress claude.ai connectors that duplicate an enabled manual server.
  // Keys never collide (`slack` vs `claude.ai Slack`) so the merge below
  // won't catch this — need content-based dedup by URL signature.
  // 从 `dedupClaudeAiMcpServers(` 解构 servers，减少MCP 服务 config对同一对象的重复访问。
  const { servers: dedupedClaudeAi } = dedupClaudeAiMcpServers(
    claudeaiMcpServers,
    claudeCodeServers,
  )

  // Merge with claude.ai having lowest precedence
  // servers 集合保存`Object.assign`，供MCP 服务后续处理使用。
  const servers = Object.assign({}, dedupedClaudeAi, claudeCodeServers)

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { servers, errors }
}

/**
 * Parse and validate an MCP configuration object
 * @param params Parsing parameters
 * @returns Validated configuration with any errors
 */
// parseMcpConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseMcpConfig(params: {
  configObject: unknown
  expandVars: boolean
  scope: ConfigScope
  filePath?: string
}): {
  config: McpJsonConfig | null
  errors: ValidationError[]
} {
  // 从 `params` 解构 configObject、expandVars、scope、filePath，减少MCP 服务 config对同一对象的重复访问。
  const { configObject, expandVars, scope, filePath } = params
  // schemaResult保存`McpJsonConfigSchema`，供MCP 服务后续处理使用。
  const schemaResult = McpJsonConfigSchema().safeParse(configObject)
  // schemaResult.success 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!schemaResult.success) {
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      config: null,
      // 这个回调绑定到 errors: schemaResult.error.issues.map(issue => ({，负责MCP 服务在该局部场景下的响应。
      errors: schemaResult.error.issues.map(issue => ({
        ...(filePath && { file: filePath }),
        path: issue.path.join('.'),
        message: 'Does not adhere to MCP server configuration schema',
        mcpErrorMetadata: {
          scope,
          severity: 'fatal',
        },
      })),
    }
  }

  // Validate each server and expand variables if requested
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: ValidationError[] = []
  // validatedServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const validatedServers: Record<string, McpServerConfig> = {}

  // 循环处理 `const [name, config] of Object.entries(schemaResult.data.mcpServers)`，让MCP 服务把同类条目按顺序走完。
  for (const [name, config] of Object.entries(schemaResult.data.mcpServers)) {
    // configToCheck 配置 命名 `config`，让后续代码直接表达这个值的用途。
    let configToCheck = config

    // 满足 `expandVars` 时，MCP 服务执行该分支。
    if (expandVars) {
      // 从 `expandEnvVars(config)` 解构 expanded、missingVars，减少MCP 服务 config对同一对象的重复访问。
      const { expanded, missingVars } = expandEnvVars(config)

      // 满足 `missingVars.length > 0` 时，MCP 服务执行该分支。
      if (missingVars.length > 0) {
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          ...(filePath && { file: filePath }),
          path: `mcpServers.${name}`,
          message: `Missing environment variables: ${missingVars.join(', ')}`,
          suggestion: `Set the following environment variables: ${missingVars.join(', ')}`,
          mcpErrorMetadata: {
            scope,
            serverName: name,
            severity: 'warning',
          },
        })
      }

      // configToCheck 配置更新为 `expanded`，确保MCP 服务后续读取最新状态。
      configToCheck = expanded
    }

    // Check for Windows-specific npx usage without cmd wrapper
    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      getPlatform() === 'windows' &&
      (!configToCheck.type || configToCheck.type === 'stdio') &&
      (configToCheck.command === 'npx' ||
        configToCheck.command.endsWith('\\npx') ||
        configToCheck.command.endsWith('/npx'))
    ) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        ...(filePath && { file: filePath }),
        path: `mcpServers.${name}`,
        message: `Windows requires 'cmd /c' wrapper to execute npx`,
        suggestion: `Change command to "cmd" with args ["/c", "npx", ...]. See: https://code.claude.com/docs/en/mcp#configure-mcp-servers`,
        mcpErrorMetadata: {
          scope,
          serverName: name,
          severity: 'warning',
        },
      })
    }

    // validatedServers[name更新为 `configToCheck`，确保MCP 服务 config后续读取最新状态。
    validatedServers[name] = configToCheck
  }
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return {
    config: { mcpServers: validatedServers },
    errors,
  }
}

/**
 * Parse and validate an MCP configuration from a file path
 * @param params Parsing parameters
 * @returns Validated configuration with any errors
 */
// parseMcpConfigFromFilePath 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseMcpConfigFromFilePath(params: {
  filePath: string
  expandVars: boolean
  scope: ConfigScope
}): {
  config: McpJsonConfig | null
  errors: ValidationError[]
} {
  // 从 `params` 解构 filePath、expandVars、scope，减少MCP 服务 config对同一对象的重复访问。
  const { filePath, expandVars, scope } = params
  // fs 集合读取`getFsImplementation`，供MCP 服务后续处理使用。
  const fs = getFsImplementation()

  // configContent 配置 先占位，稍后的条件分支会根据实际输入补齐它。
  let configContent: string
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // configContent 配置更新为 `fs.readFileSync(filePath, { encoding: 'utf8' })`，确保MCP 服务后续读取最新状态。
    configContent = fs.readFileSync(filePath, { encoding: 'utf8' })
  } catch (error: unknown) {
    // code读取`getErrnoCode`，供MCP 服务后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，MCP 服务执行对应分支。
    if (code === 'ENOENT') {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        config: null,
        errors: [
          {
            file: filePath,
            path: '',
            message: `MCP config file not found: ${filePath}`,
            suggestion: 'Check that the file path is correct',
            mcpErrorMetadata: {
              scope,
              severity: 'fatal',
            },
          },
        ],
      }
    }
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `MCP config read error for ${filePath} (scope=${scope}): ${error}`,
      { level: 'error' },
    )
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      config: null,
      errors: [
        {
          file: filePath,
          path: '',
          message: `Failed to read file: ${error}`,
          suggestion: 'Check file permissions and ensure the file exists',
          mcpErrorMetadata: {
            scope,
            severity: 'fatal',
          },
        },
      ],
    }
  }

  // parsedJson保存`safeParseJSON`，供MCP 服务后续处理使用。
  const parsedJson = safeParseJSON(configContent)

  // parsedJson缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!parsedJson) {
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `MCP config is not valid JSON: ${filePath} (scope=${scope}, length=${configContent.length}, first100=${jsonStringify(configContent.slice(0, 100))})`,
      { level: 'error' },
    )
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      config: null,
      errors: [
        {
          file: filePath,
          path: '',
          message: `MCP config is not a valid JSON`,
          suggestion: 'Fix the JSON syntax errors in the file',
          mcpErrorMetadata: {
            scope,
            severity: 'fatal',
          },
        },
      ],
    }
  }

  // 返回 `parseMcpConfig({`，作为MCP 服务这次计算的结果。
  return parseMcpConfig({
    configObject: parsedJson,
    expandVars,
    scope,
    filePath,
  })
}

// doesEnterpriseMcpConfigExist 配置保存`memoize`，供MCP 服务后续处理使用。
export const doesEnterpriseMcpConfigExist = memoize((): boolean => {
  // 从 `parseMcpConfigFromFilePath({` 解构 config，减少MCP 服务 config对同一对象的重复访问。
  const { config } = parseMcpConfigFromFilePath({
    filePath: getEnterpriseMcpFilePath(),
    expandVars: true,
    scope: 'enterprise',
  })
  // 返回 `config !== null`，作为MCP 服务这次计算的结果。
  return config !== null
})

/**
 * Check if MCP allowlist policy should only come from managed settings.
 * This is true when policySettings has allowManagedMcpServersOnly: true.
 * When enabled, allowedMcpServers is read exclusively from managed settings.
 * Users can still add their own MCP servers and deny servers via deniedMcpServers.
 */
// shouldAllowManagedMcpServersOnly 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldAllowManagedMcpServersOnly(): boolean {
  // 返回 `(`，作为MCP 服务这次计算的结果。
  return (
    getSettingsForSource('policySettings')?.allowManagedMcpServersOnly === true
  )
}

/**
 * Check if all MCP servers in a config are allowed with enterprise MCP config.
 */
// areMcpConfigsAllowedWithEnterpriseMcpConfig 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function areMcpConfigsAllowedWithEnterpriseMcpConfig(
  configs: Record<string, ScopedMcpServerConfig>,
): boolean {
  // NOTE: While all SDK MCP servers should be safe from a security perspective, we are still discussing
  // what the best way to do this is. In the meantime, we are limiting this to claude-vscode for now to
  // unbreak the VSCode extension for certain enterprise customers who have enterprise MCP config enabled.
  // https://anthropic.slack.com/archives/C093UA0KLD7/p1764975463670109
  // 返回 `Object.values(configs).every(`，作为MCP 服务这次计算的结果。
  return Object.values(configs).every(
    // c更新为 `> c.type === 'sdk' && c.name === 'claude-vscode'`，确保MCP 服务后续读取最新状态。
    c => c.type === 'sdk' && c.name === 'claude-vscode',
  )
}

/**
 * Built-in MCP server that defaults to disabled. Unlike user-configured servers
 * (opt-out via disabledMcpServers), this requires explicit opt-in via
 * enabledMcpServers. Shows up in /mcp as disabled until the user enables it.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
// DEFAULT_DISABLED_BUILTIN保存`feature`，供MCP 服务后续处理使用。
const DEFAULT_DISABLED_BUILTIN = feature('CHICAGO_MCP')
  ? (
      require('../../utils/computerUse/common.js') as typeof import('../../utils/computerUse/common.js')
    ).COMPUTER_USE_MCP_SERVER_NAME
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// isDefaultDisabledBuiltin 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDefaultDisabledBuiltin(name: string): boolean {
  // 返回 `DEFAULT_DISABLED_BUILTIN !== null && name === DEFAULT_DISABLED_BUILTIN`，作为MCP 服务这次计算的结果。
  return DEFAULT_DISABLED_BUILTIN !== null && name === DEFAULT_DISABLED_BUILTIN
}

/**
 * Check if an MCP server is disabled
 * @param name The name of the server
 * @returns true if the server is disabled
 */
// isMcpServerDisabled 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMcpServerDisabled(name: string): boolean {
  // projectConfig 配置读取`getCurrentProjectConfig`，供MCP 服务后续处理使用。
  const projectConfig = getCurrentProjectConfig()
  // 满足 `isDefaultDisabledBuiltin(name)` 时，MCP 服务执行该分支。
  if (isDefaultDisabledBuiltin(name)) {
    // enabledServers 集合标记MCP 服务MCP 服务 config是否启用对应路径。
    const enabledServers = projectConfig.enabledMcpServers || []
    // 返回 `!enabledServers.includes(name)`，作为MCP 服务这次计算的结果。
    return !enabledServers.includes(name)
  }
  // disabledServers 集合标记MCP 服务MCP 服务 config是否启用对应路径。
  const disabledServers = projectConfig.disabledMcpServers || []
  // 返回 `disabledServers.includes(name)`，作为MCP 服务这次计算的结果。
  return disabledServers.includes(name)
}

// toggleMembership 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toggleMembership(
  list: string[],
  name: string,
  shouldContain: boolean,
): string[] {
  // contains 集合筛选`list.includes`，供MCP 服务后续处理使用。
  const contains = list.includes(name)
  // 满足 `contains === shouldContain` 时，MCP 服务执行该分支。
  if (contains === shouldContain) return list
  // 返回 `shouldContain ? [...list, name] : list.filter(s => s !== name)`，作为MCP 服务这次计算的结果。
  return shouldContain ? [...list, name] : list.filter(s => s !== name)
}

/**
 * Enable or disable an MCP server
 * @param name The name of the server
 * @param enabled Whether the server should be enabled
 */
// setMcpServerEnabled 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMcpServerEnabled(name: string, enabled: boolean): void {
  // isBuiltinStateChange 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isBuiltinStateChange =
    isDefaultDisabledBuiltin(name) && isMcpServerDisabled(name) === enabled

  // 调用 saveCurrentProjectConfig，触发MCP 服务此处需要的副作用。
  saveCurrentProjectConfig(current => {
    // 满足 `isDefaultDisabledBuiltin(name)` 时，MCP 服务执行该分支。
    if (isDefaultDisabledBuiltin(name)) {
      // prev标记MCP 服务MCP 服务 config是否启用对应路径。
      const prev = current.enabledMcpServers || []
      // next保存`toggleMembership`，供MCP 服务后续处理使用。
      const next = toggleMembership(prev, name, enabled)
      // 满足 `next === prev` 时，MCP 服务执行该分支。
      if (next === prev) return current
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return { ...current, enabledMcpServers: next }
    }

    // prev标记MCP 服务MCP 服务 config是否启用对应路径。
    const prev = current.disabledMcpServers || []
    // next保存`toggleMembership`，供MCP 服务后续处理使用。
    const next = toggleMembership(prev, name, !enabled)
    // 满足 `next === prev` 时，MCP 服务执行该分支。
    if (next === prev) return current
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { ...current, disabledMcpServers: next }
  })

  // 满足 `isBuiltinStateChange` 时，MCP 服务执行该分支。
  if (isBuiltinStateChange) {
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_builtin_mcp_toggle', {
      serverName:
        name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      enabled,
    })
  }
}
