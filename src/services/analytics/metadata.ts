// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
/**
 * Shared event metadata enrichment for analytics systems
 *
 * This module provides a single source of truth for collecting and formatting
 * event metadata across all analytics systems (Datadog, 1P).
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { extname } from 'path'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 复用 env、getHostPlatformForAnalytics 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env, getHostPlatformForAnalytics } from '../../utils/env.js'
// 复用 envDynamic 工具函数，把通用处理留在 ../../utils/envDynamic.js 中维护。
import { envDynamic } from '../../utils/envDynamic.js'
// 复用 getModelBetas 工具函数，把通用处理留在 ../../utils/betas.js 中维护。
import { getModelBetas } from '../../utils/betas.js'
// 复用 getMainLoopModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getMainLoopModel } from '../../utils/model/model.js'
// 整理这一组导入，让服务层 metadata后续逻辑可以直接复用这些外部能力。
import {
  getSessionId,
  getIsInteractive,
  getKairosActive,
  getClientType,
  getParentSessionId as getParentSessionIdFromState,
} from '../../bootstrap/state.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 引入 isOfficialMcpUrl，将 ../mcp/officialRegistry.js 中已经封装好的能力接到本文件流程里。
import { isOfficialMcpUrl } from '../mcp/officialRegistry.js'
// 复用 isClaudeAISubscriber、getSubscriptionType 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isClaudeAISubscriber, getSubscriptionType } from '../../utils/auth.js'
// 复用 getRepoRemoteHash 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { getRepoRemoteHash } from '../../utils/git.js'
// 整理这一组导入，让服务层 metadata后续逻辑可以直接复用这些外部能力。
import {
  getWslVersion,
  getLinuxDistroInfo,
  detectVcs,
} from '../../utils/platform.js'
// 类型依赖 { CoreUserData } 来自 src/utils/user.js，用于校准服务层 metadata的数据契约。
import type { CoreUserData } from 'src/utils/user.js'
// 复用 getAgentContext 工具函数，把通用处理留在 ../../utils/agentContext.js 中维护。
import { getAgentContext } from '../../utils/agentContext.js'
// 类型依赖 { EnvironmentMetadata } 来自 ../../types/generated/events_mono/claude_code/v1/claude_code_internal_event.js，用于校准服务层 metadata的数据契约。
import type { EnvironmentMetadata } from '../../types/generated/events_mono/claude_code/v1/claude_code_internal_event.js'
// 类型依赖 { PublicApiAuth } 来自 ../../types/generated/events_mono/common/v1/auth.js，用于校准服务层 metadata的数据契约。
import type { PublicApiAuth } from '../../types/generated/events_mono/common/v1/auth.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让服务层 metadata后续逻辑可以直接复用这些外部能力。
import {
  getAgentId,
  getParentSessionId as getTeammateParentSessionId,
  getTeamName,
  isTeammate,
} from '../../utils/teammate.js'
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'

/**
 * Marker type for verifying analytics metadata doesn't contain sensitive data
 *
 * This type forces explicit verification that string values being logged
 * don't contain code snippets, file paths, or other sensitive information.
 *
 * The metadata is expected to be JSON-serializable.
 *
 * Usage: `myString as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`
 *
 * The type is `never` which means it can never actually hold a value - this is
 * intentional as it's only used for type-casting to document developer intent.
 */
// AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS 固化服务层 metadata里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS = never

/**
 * Sanitizes tool names for analytics logging to avoid PII exposure.
 *
 * MCP tool names follow the format `mcp__<server>__<tool>` and can reveal
 * user-specific server configurations, which is considered PII-medium.
 * This function redacts MCP tool names while preserving built-in tool names
 * (Bash, Read, Write, etc.) which are safe to log.
 *
 * @param toolName - The tool name to sanitize
 * @returns The original name for built-in tools, or 'mcp_tool' for MCP tools
 */
// sanitizeToolNameForAnalytics 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizeToolNameForAnalytics(
  toolName: string,
): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  // 满足 `toolName.startsWith('mcp__')` 时，服务层 metadata执行该分支。
  if (toolName.startsWith('mcp__')) {
    // 返回 `'mcp_tool' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`，作为服务层 metadata这次计算的结果。
    return 'mcp_tool' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  }
  // 返回 `toolName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`，作为服务层 metadata这次计算的结果。
  return toolName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if detailed tool name logging is enabled for OTLP events.
 * When enabled, MCP server/tool names and Skill names are logged.
 * Disabled by default to protect PII (user-specific server configurations).
 *
 * Enable with OTEL_LOG_TOOL_DETAILS=1
 */
// isToolDetailsLoggingEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isToolDetailsLoggingEnabled(): boolean {
  // 返回 `isEnvTruthy(process.env.OTEL_LOG_TOOL_DETAILS)`，作为服务层 metadata这次计算的结果。
  return isEnvTruthy(process.env.OTEL_LOG_TOOL_DETAILS)
}

/**
 * Check if detailed tool name logging (MCP server/tool names) is enabled
 * for analytics events.
 *
 * Per go/taxonomy, MCP names are medium PII. We log them for:
 * - Cowork (entrypoint=local-agent) — no ZDR concept, log all MCPs
 * - claude.ai-proxied connectors — always official (from claude.ai's list)
 * - Servers whose URL matches the official MCP registry — directory
 *   connectors added via `claude mcp add`, not customer-specific config
 *
 * Custom/user-configured MCPs stay sanitized (toolName='mcp_tool').
 */
// isAnalyticsToolDetailsLoggingEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAnalyticsToolDetailsLoggingEnabled(
  mcpServerType: string | undefined,
  mcpServerBaseUrl: string | undefined,
): boolean {
  // 满足 `process.env.CLAUDE_CODE_ENTRYPOINT === 'local-age` 时，服务层 metadata执行该分支。
  if (process.env.CLAUDE_CODE_ENTRYPOINT === 'local-agent') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 当 `mcpServerType` 匹配 `'claudeai-proxy'` 时，服务层 metadata执行对应分支。
  if (mcpServerType === 'claudeai-proxy') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 组合条件 `mcpServerBaseUrl && isOfficialMcpUrl(mcpServerBaseUrl)` 成立时，服务层 metadata才启用这条专门路径。
  if (mcpServerBaseUrl && isOfficialMcpUrl(mcpServerBaseUrl)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Built-in first-party MCP servers whose names are fixed reserved strings,
 * not user-configured — so logging them is not PII. Checked in addition to
 * isAnalyticsToolDetailsLoggingEnabled's transport/URL gates, which a stdio
 * built-in would otherwise fail.
 *
 * Feature-gated so the set is empty when the feature is off: the name
 * reservation (main.tsx, config.ts addMcpServer) is itself feature-gated, so
 * a user-configured 'computer-use' is possible in builds without the feature.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
// BUILTIN_MCP_SERVER_NAMES 集合 用 Set 去重，后续只需判断成员是否存在。
const BUILTIN_MCP_SERVER_NAMES: ReadonlySet<string> = new Set(
  feature('CHICAGO_MCP')
    ? [
        (
          require('../../utils/computerUse/common.js') as typeof import('../../utils/computerUse/common.js')
        ).COMPUTER_USE_MCP_SERVER_NAME,
      ]
    : [],
)
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Spreadable helper for logEvent payloads — returns {mcpServerName, mcpToolName}
 * if the gate passes, empty object otherwise. Consolidates the identical IIFE
 * pattern at each tengu_tool_use_* call site.
 */
// mcpToolDetailsForAnalytics 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mcpToolDetailsForAnalytics(
  toolName: string,
  mcpServerType: string | undefined,
  mcpServerBaseUrl: string | undefined,
): {
  mcpServerName?: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  mcpToolName?: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
} {
  // details 集合保存`extractMcpToolDetails`，供服务层 metadata后续处理使用。
  const details = extractMcpToolDetails(toolName)
  // details 集合缺失时提前走兜底路径，避免服务层 metadata继续依赖无效输入。
  if (!details) {
    // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
    return {}
  }
  // 服务层 metadata在这里进入条件判断，后续代码按实际状态分流。
  if (
    !BUILTIN_MCP_SERVER_NAMES.has(details.serverName) &&
    !isAnalyticsToolDetailsLoggingEnabled(mcpServerType, mcpServerBaseUrl)
  ) {
    // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
    return {}
  }
  // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
  return {
    mcpServerName: details.serverName,
    mcpToolName: details.mcpToolName,
  }
}

/**
 * Extract MCP server and tool names from a full MCP tool name.
 * MCP tool names follow the format: mcp__<server>__<tool>
 *
 * @param toolName - The full tool name (e.g., 'mcp__slack__read_channel')
 * @returns Object with serverName and toolName, or undefined if not an MCP tool
 */
// extractMcpToolDetails 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractMcpToolDetails(toolName: string):
  | {
      serverName: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      mcpToolName: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    }
  | undefined {
  // 满足 `!toolName.startsWith('mcp__')` 时，服务层 metadata执行该分支。
  if (!toolName.startsWith('mcp__')) {
    // 返回 `undefined`，作为服务层 metadata这次计算的结果。
    return undefined
  }

  // Format: mcp__<server>__<tool>
  // 片段列表格式化`toolName.split`，供服务层 metadata后续处理使用。
  const parts = toolName.split('__')
  // 满足 `parts.length < 3` 时，服务层 metadata执行该分支。
  if (parts.length < 3) {
    // 返回 `undefined`，作为服务层 metadata这次计算的结果。
    return undefined
  }

  // serverName读取 `parts[1]` 对应条目，后续围绕该成员继续处理。
  const serverName = parts[1]
  // Tool name may contain __ so rejoin remaining parts
  // mcpToolName格式化`parts.slice`，供服务层 metadata后续处理使用。
  const mcpToolName = parts.slice(2).join('__')

  // 组合条件 `!serverName || !mcpToolName` 成立时，服务层 metadata才启用这条专门路径。
  if (!serverName || !mcpToolName) {
    // 返回 `undefined`，作为服务层 metadata这次计算的结果。
    return undefined
  }

  // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
  return {
    serverName:
      serverName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    mcpToolName:
      mcpToolName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  }
}

/**
 * Extract skill name from Skill tool input.
 *
 * @param toolName - The tool name (should be 'Skill')
 * @param input - The tool input containing the skill name
 * @returns The skill name if this is a Skill tool call, undefined otherwise
 */
// extractSkillName 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractSkillName(
  toolName: string,
  input: unknown,
): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS | undefined {
  // `toolName` 与 `'Skill'` 不一致时刷新派生状态，避免使用过期结果。
  if (toolName !== 'Skill') {
    // 返回 `undefined`，作为服务层 metadata这次计算的结果。
    return undefined
  }

  // 服务层 metadata在这里进入条件判断，后续代码按实际状态分流。
  if (
    typeof input === 'object' &&
    input !== null &&
    'skill' in input &&
    typeof (input as { skill: unknown }).skill === 'string'
  ) {
    // 返回 `(input as { skill: string })`，作为服务层 metadata这次计算的结果。
    return (input as { skill: string })
      .skill as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  }

  // 返回 `undefined`，作为服务层 metadata这次计算的结果。
  return undefined
}

// TOOL_INPUT_STRING_TRUNCATE_AT保存`512`，供服务层 metadata后续判断或输出使用。
const TOOL_INPUT_STRING_TRUNCATE_AT = 512
// TOOL_INPUT_STRING_TRUNCATE_TO 命名 `128`，让后续代码直接表达这个值的用途。
const TOOL_INPUT_STRING_TRUNCATE_TO = 128
// TOOL_INPUT_MAX_JSON_CHARS 集合 命名 `4 * 1024`，让后续代码直接表达这个值的用途。
const TOOL_INPUT_MAX_JSON_CHARS = 4 * 1024
// TOOL_INPUT_MAX_COLLECTION_ITEMS 集合 命名 `20`，让后续代码直接表达这个值的用途。
const TOOL_INPUT_MAX_COLLECTION_ITEMS = 20
// TOOL_INPUT_MAX_DEPTH保存`2`，供后续判断或组装使用。
const TOOL_INPUT_MAX_DEPTH = 2

// truncateToolInputValue 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateToolInputValue(value: unknown, depth = 0): unknown {
  // 当 `typeof value` 匹配 `'string'` 时，服务层 metadata执行对应分支。
  if (typeof value === 'string') {
    // 满足 `value.length > TOOL_INPUT_STRING_TRUNCATE_AT` 时，服务层 metadata执行该分支。
    if (value.length > TOOL_INPUT_STRING_TRUNCATE_AT) {
      // 返回 ``${value.slice(0, TOOL_INPUT_STRING_TRUNCATE_TO)}…[${value.length} char...`，作为服务层 metadata这次计算的结果。
      return `${value.slice(0, TOOL_INPUT_STRING_TRUNCATE_TO)}…[${value.length} chars]`
    }
    // 返回 `value`，作为服务层 metadata这次计算的结果。
    return value
  }
  // 服务层 metadata在这里进入条件判断，后续代码按实际状态分流。
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    // 返回 `value`，作为服务层 metadata这次计算的结果。
    return value
  }
  // 满足 `depth >= TOOL_INPUT_MAX_DEPTH` 时，服务层 metadata执行该分支。
  if (depth >= TOOL_INPUT_MAX_DEPTH) {
    // 返回 `'<nested>'`，作为服务层 metadata这次计算的结果。
    return '<nested>'
  }
  // 满足 `Array.isArray(value)` 时，服务层 metadata执行该分支。
  if (Array.isArray(value)) {
    // mapped保存`value`，供服务层 metadata后续判断或输出使用。
    const mapped = value
      .slice(0, TOOL_INPUT_MAX_COLLECTION_ITEMS)
      // 链式调用 map，继续加工上一行在服务层 metadata中产生的数据。
      .map(v => truncateToolInputValue(v, depth + 1))
    // 满足 `value.length > TOOL_INPUT_MAX_COLLECTION_ITEMS` 时，服务层 metadata执行该分支。
    if (value.length > TOOL_INPUT_MAX_COLLECTION_ITEMS) {
      // mapped追加新条目，保持收集顺序与输入顺序一致。
      mapped.push(`…[${value.length} items]`)
    }
    // 返回 `mapped`，作为服务层 metadata这次计算的结果。
    return mapped
  }
  // 当 `typeof value` 匹配 `'object'` 时，服务层 metadata执行对应分支。
  if (typeof value === 'object') {
    // entries 集合派生`Object.entries`，供服务层 metadata后续处理使用。
    const entries = Object.entries(value as Record<string, unknown>)
      // Skip internal marker keys (e.g. _simulatedSedEdit re-introduced by
      // SedEditPermissionRequest) so they don't leak into telemetry.
      // 链式调用 filter，继续加工上一行在服务层 metadata中产生的数据。
      .filter(([k]) => !k.startsWith('_'))
    // mapped保存`entries`，供后续判断或组装使用。
    const mapped = entries
      .slice(0, TOOL_INPUT_MAX_COLLECTION_ITEMS)
      // 链式调用 map，继续加工上一行在服务层 metadata中产生的数据。
      .map(([k, v]) => [k, truncateToolInputValue(v, depth + 1)])
    // 满足 `entries.length > TOOL_INPUT_MAX_COLLECTION_ITEMS` 时，服务层 metadata执行该分支。
    if (entries.length > TOOL_INPUT_MAX_COLLECTION_ITEMS) {
      // mapped追加新条目，保持收集顺序与输入顺序一致。
      mapped.push(['…', `${entries.length} keys`])
    }
    // 返回 `Object.fromEntries(mapped)`，作为服务层 metadata这次计算的结果。
    return Object.fromEntries(mapped)
  }
  // 返回 `String(value)`，作为服务层 metadata这次计算的结果。
  return String(value)
}

/**
 * Serialize a tool's input arguments for the OTel tool_result event.
 * Truncates long strings and deep nesting to keep the output bounded while
 * preserving forensically useful fields like file paths, URLs, and MCP args.
 * Returns undefined when OTEL_LOG_TOOL_DETAILS is not enabled.
 */
// extractToolInputForTelemetry 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractToolInputForTelemetry(
  input: unknown,
): string | undefined {
  // 满足 `!isToolDetailsLoggingEnabled()` 时，服务层 metadata执行该分支。
  if (!isToolDetailsLoggingEnabled()) {
    // 返回 `undefined`，作为服务层 metadata这次计算的结果。
    return undefined
  }
  // truncated保存`truncateToolInputValue`，供服务层 metadata后续处理使用。
  const truncated = truncateToolInputValue(input)
  // json保存`jsonStringify`，供服务层 metadata后续处理使用。
  let json = jsonStringify(truncated)
  // 满足 `json.length > TOOL_INPUT_MAX_JSON_CHARS` 时，服务层 metadata执行该分支。
  if (json.length > TOOL_INPUT_MAX_JSON_CHARS) {
    // json更新为 `json.slice(0, TOOL_INPUT_MAX_JSON_CHARS) + '…[truncated]'`，确保服务层后续读取最新状态。
    json = json.slice(0, TOOL_INPUT_MAX_JSON_CHARS) + '…[truncated]'
  }
  // 返回 `json`，作为服务层 metadata这次计算的结果。
  return json
}

/**
 * Maximum length for file extensions to be logged.
 * Extensions longer than this are considered potentially sensitive
 * (e.g., hash-based filenames like "key-hash-abcd-123-456") and
 * will be replaced with 'other'.
 */
// MAX_FILE_EXTENSION_LENGTH 文件数据保存`10`，供后续判断或组装使用。
const MAX_FILE_EXTENSION_LENGTH = 10

/**
 * Extracts and sanitizes a file extension for analytics logging.
 *
 * Uses Node's path.extname for reliable cross-platform extension extraction.
 * Returns 'other' for extensions exceeding MAX_FILE_EXTENSION_LENGTH to avoid
 * logging potentially sensitive data (like hash-based filenames).
 *
 * @param filePath - The file path to extract the extension from
 * @returns The sanitized extension, 'other' for long extensions, or undefined if no extension
 */
// getFileExtensionForAnalytics 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFileExtensionForAnalytics(
  filePath: string,
): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS | undefined {
  // ext保存`extname`，供服务层 metadata后续处理使用。
  const ext = extname(filePath).toLowerCase()
  // 当 `!ext || ext` 匹配 `'.'` 时，服务层 metadata执行对应分支。
  if (!ext || ext === '.') {
    // 返回 `undefined`，作为服务层 metadata这次计算的结果。
    return undefined
  }

  // extension格式化`ext.slice`，供服务层 metadata后续处理使用。
  const extension = ext.slice(1) // remove leading dot
  // 满足 `extension.length > MAX_FILE_EXTENSION_LENGTH` 时，服务层 metadata执行该分支。
  if (extension.length > MAX_FILE_EXTENSION_LENGTH) {
    // 返回 `'other' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`，作为服务层 metadata这次计算的结果。
    return 'other' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  }

  // 返回 `extension as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`，作为服务层 metadata这次计算的结果。
  return extension as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/** Allow list of commands we extract file extensions from. */
// FILE_COMMANDS 命令数据保存`Set`，供服务层 metadata后续处理使用。
const FILE_COMMANDS = new Set([
  'rm',
  'mv',
  'cp',
  'touch',
  'mkdir',
  'chmod',
  'chown',
  'cat',
  'head',
  'tail',
  'sort',
  'stat',
  'diff',
  'wc',
  'grep',
  'rg',
  'sed',
])

/** Regex to split bash commands on compound operators (&&, ||, ;, |). */
// COMPOUND_OPERATOR_REGEX标记服务层 metadata是否启用对应路径。
const COMPOUND_OPERATOR_REGEX = /\s*(?:&&|\|\||[;|])\s*/

/** Regex to split on whitespace. */
// WHITESPACE_REGEX 命名 `/\s+/`，让后续代码直接表达这个值的用途。
const WHITESPACE_REGEX = /\s+/

/**
 * Extracts file extensions from a bash command for analytics.
 * Best-effort: splits on operators and whitespace, extracts extensions
 * from non-flag args of allowed commands. No heavy shell parsing needed
 * because grep patterns and sed scripts rarely resemble file extensions.
 */
// getFileExtensionsFromBashCommand 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFileExtensionsFromBashCommand(
  command: string,
  simulatedSedEditFilePath?: string,
): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS | undefined {
  // 组合条件 `!command.includes('.') && !simulatedSedEditFilePath` 成立时，服务层 metadata才启用这条专门路径。
  if (!command.includes('.') && !simulatedSedEditFilePath) return undefined

  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let result: string | undefined
  // seen构建`new Set<string>()`，供后续判断或组装使用。
  const seen = new Set<string>()

  // 满足 `simulatedSedEditFilePath` 时，服务层 metadata执行该分支。
  if (simulatedSedEditFilePath) {
    // ext读取`getFileExtensionForAnalytics`，供服务层 metadata后续处理使用。
    const ext = getFileExtensionForAnalytics(simulatedSedEditFilePath)
    // 满足 `ext` 时，服务层 metadata执行该分支。
    if (ext) {
      // 调用 seen.add，触发服务层 metadata此处需要的副作用。
      seen.add(ext)
      // 结果更新为 `ext`，确保服务层后续读取最新状态。
      result = ext
    }
  }

  // 逐项读取 `command.split(COMPOUND_OPERATOR_REGEX)` 中的subcmd 命令数据，按输入顺序推进服务层 metadata。
  for (const subcmd of command.split(COMPOUND_OPERATOR_REGEX)) {
    // subcmd 命令数据缺失时提前走兜底路径，避免服务层 metadata继续依赖无效输入。
    if (!subcmd) continue
    // token 列表格式化`subcmd.split`，供服务层 metadata后续处理使用。
    const tokens = subcmd.split(WHITESPACE_REGEX)
    // 满足 `tokens.length < 2` 时，服务层 metadata执行该分支。
    if (tokens.length < 2) continue

    // firstToken读取 `tokens[0]!` 对应条目，后续围绕该成员继续处理。
    const firstToken = tokens[0]!
    // slashIdx保存`firstToken.lastIndexOf`，供服务层 metadata后续处理使用。
    const slashIdx = firstToken.lastIndexOf('/')
    // 基础命令格式化`firstToken.slice`，供服务层 metadata后续处理使用。
    const baseCmd = slashIdx >= 0 ? firstToken.slice(slashIdx + 1) : firstToken
    // 满足 `!FILE_COMMANDS.has(baseCmd)` 时，服务层 metadata执行该分支。
    if (!FILE_COMMANDS.has(baseCmd)) continue

    // 循环处理 `let i = 1; i < tokens.length; i++`，让服务层 metadata逐项把同类条目按顺序走完。
    for (let i = 1; i < tokens.length; i++) {
      // 当前参数读取 `tokens[i]!` 对应条目，后续围绕该成员继续处理。
      const arg = tokens[i]!
      // 满足 `arg.charCodeAt(0) === 45 /* - */` 时，服务层 metadata执行该分支。
      if (arg.charCodeAt(0) === 45 /* - */) continue
      // ext读取`getFileExtensionForAnalytics`，供服务层 metadata后续处理使用。
      const ext = getFileExtensionForAnalytics(arg)
      // 组合条件 `ext && !seen.has(ext)` 成立时，服务层 metadata才启用这条专门路径。
      if (ext && !seen.has(ext)) {
        // 调用 seen.add，触发服务层 metadata此处需要的副作用。
        seen.add(ext)
        // 结果更新为 `result ? result + ',' + ext : ext`，确保服务层后续读取最新状态。
        result = result ? result + ',' + ext : ext
      }
    }
  }

  // 结果缺失时提前走兜底路径，避免服务层 metadata继续依赖无效输入。
  if (!result) return undefined
  // 返回 `result as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`，作为服务层 metadata这次计算的结果。
  return result as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Environment context metadata
 */
// EnvContext 固化服务层 metadata里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvContext = {
  platform: string
  platformRaw: string
  arch: string
  nodeVersion: string
  terminal: string | null
  packageManagers: string
  runtimes: string
  isRunningWithBun: boolean
  isCi: boolean
  isClaubbit: boolean
  isClaudeCodeRemote: boolean
  isLocalAgentMode: boolean
  isConductor: boolean
  remoteEnvironmentType?: string
  coworkerType?: string
  claudeCodeContainerId?: string
  claudeCodeRemoteSessionId?: string
  tags?: string
  isGithubAction: boolean
  isClaudeCodeAction: boolean
  isClaudeAiAuth: boolean
  version: string
  versionBase?: string
  buildTime: string
  deploymentEnvironment: string
  githubEventName?: string
  githubActionsRunnerEnvironment?: string
  githubActionsRunnerOs?: string
  githubActionRef?: string
  wslVersion?: string
  linuxDistroId?: string
  linuxDistroVersion?: string
  linuxKernel?: string
  vcs?: string
}

/**
 * Process metrics included with all analytics events.
 */
// ProcessMetrics 固化服务层 metadata里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProcessMetrics = {
  uptime: number
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  arrayBuffers: number
  constrainedMemory: number | undefined
  cpuUsage: NodeJS.CpuUsage
  cpuPercent: number | undefined
}

/**
 * Core event metadata shared across all analytics systems
 */
// EventMetadata 固化服务层 metadata里传递的数据形状，帮助调用方按同一结构读写字段。
export type EventMetadata = {
  model: string
  sessionId: string
  userType: string
  betas?: string
  envContext: EnvContext
  entrypoint?: string
  agentSdkVersion?: string
  isInteractive: string
  clientType: string
  processMetrics?: ProcessMetrics
  sweBenchRunId: string
  sweBenchInstanceId: string
  sweBenchTaskId: string
  // Swarm/team agent identification for analytics attribution
  agentId?: string // CLAUDE_CODE_AGENT_ID (format: agentName@teamName) or subagent UUID
  parentSessionId?: string // CLAUDE_CODE_PARENT_SESSION_ID (team lead's session)
  agentType?: 'teammate' | 'subagent' | 'standalone' // Distinguishes swarm teammates, Agent tool subagents, and standalone agents
  teamName?: string // Team name for swarm agents (from env var or AsyncLocalStorage)
  subscriptionType?: string // OAuth subscription tier (max, pro, enterprise, team)
  rh?: string // Hashed repo remote URL (first 16 chars of SHA256), for joining with server-side data
  kairosActive?: true // KAIROS assistant mode active (ant-only; set in main.tsx after gate check)
  skillMode?: 'discovery' | 'coach' | 'discovery_and_coach' // Which skill surfacing mechanism(s) are gated on (ant-only; for BQ session segmentation)
  observerMode?: 'backseat' | 'skillcoach' | 'both' // Which observer classifiers are gated on (ant-only; for BQ cohort splits on tengu_backseat_* events)
}

/**
 * Options for enriching event metadata
 */
// EnrichMetadataOptions 固化服务层 metadata里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnrichMetadataOptions = {
  // Model to use, falls back to getMainLoopModel() if not provided
  model?: unknown
  // Explicit betas string (already joined)
  betas?: unknown
  // Additional metadata to include (optional)
  additionalMetadata?: Record<string, unknown>
}

/**
 * Get agent identification for analytics.
 * Priority: AsyncLocalStorage context (subagents) > env vars (swarm teammates)
 */
// getAgentIdentification 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAgentIdentification(): {
  agentId?: string
  parentSessionId?: string
  agentType?: 'teammate' | 'subagent' | 'standalone'
  teamName?: string
} {
  // Check AsyncLocalStorage first (for subagents running in same process)
  // agentContext读取`getAgentContext`，供服务层 metadata后续处理使用。
  const agentContext = getAgentContext()
  // 满足 `agentContext` 时，服务层 metadata执行该分支。
  if (agentContext) {
    // 结果 集中保存服务层 metadata要一起传递的字段。
    const result: ReturnType<typeof getAgentIdentification> = {
      agentId: agentContext.agentId,
      parentSessionId: agentContext.parentSessionId,
      agentType: agentContext.agentType,
    }
    // 当 `agentContext.agentType` 匹配 `'teammate'` 时，服务层 metadata执行对应分支。
    if (agentContext.agentType === 'teammate') {
      // teamName更新为 `agentContext.teamName`，确保服务层后续读取最新状态。
      result.teamName = agentContext.teamName
    }
    // 返回 `result`，作为服务层 metadata这次计算的结果。
    return result
  }

  // Fall back to swarm helpers (for swarm agents)
  // agentId读取`getAgentId`，供服务层 metadata后续处理使用。
  const agentId = getAgentId()
  // parentSessionId 会话数据读取`getTeammateParentSessionId`，供服务层 metadata后续处理使用。
  const parentSessionId = getTeammateParentSessionId()
  // teamName读取`getTeamName`，供服务层 metadata后续处理使用。
  const teamName = getTeamName()
  // isSwarmAgent记录 `isTeammate` 是否成立，服务层 metadata随后按该结果分支。
  const isSwarmAgent = isTeammate()
  // For standalone agents (have agent ID but not a teammate), set agentType to 'standalone'
  // agentType保存`isSwarmAgent`，供后续判断或组装使用。
  const agentType = isSwarmAgent
    ? ('teammate' as const)
    : agentId
      ? ('standalone' as const)
      : undefined
  // 组合条件 `agentId || agentType || parentSessionId || teamNa` 成立时，服务层 metadata才启用这条专门路径。
  if (agentId || agentType || parentSessionId || teamName) {
    // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
    return {
      ...(agentId ? { agentId } : {}),
      ...(agentType ? { agentType } : {}),
      ...(parentSessionId ? { parentSessionId } : {}),
      ...(teamName ? { teamName } : {}),
    }
  }

  // Check bootstrap state for parent session ID (e.g., plan mode -> implementation)
  // stateParentSessionId 会话数据读取`getParentSessionIdFromState`，供服务层 metadata后续处理使用。
  const stateParentSessionId = getParentSessionIdFromState()
  // 满足 `stateParentSessionId` 时，服务层 metadata执行该分支。
  if (stateParentSessionId) {
    // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
    return { parentSessionId: stateParentSessionId }
  }

  // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
  return {}
}

/**
 * Extract base version from full version string. "2.0.36-dev.20251107.t174150.sha2709699" → "2.0.36-dev"
 */
// getVersionBase保存`memoize`，供服务层 metadata后续处理使用。
const getVersionBase = memoize((): string | undefined => {
  // match匹配`VERSION.match`，供服务层 metadata后续处理使用。
  const match = MACRO.VERSION.match(/^\d+\.\d+\.\d+(?:-[a-z]+)?/)
  // 返回 `match ? match[0] : undefined`，作为服务层 metadata这次计算的结果。
  return match ? match[0] : undefined
})

/**
 * Builds the environment context object
 */
// buildEnvContext保存`memoize`，供服务层 metadata后续处理使用。
const buildEnvContext = memoize(async (): Promise<EnvContext> => {
  // 并行获取 packageManagers、runtimes、linuxDistroInfo、vcs，缩短服务层 metadata等待多个独立异步任务的时间。
  const [packageManagers, runtimes, linuxDistroInfo, vcs] = await Promise.all([
    env.getPackageManagers(),
    env.getRuntimes(),
    getLinuxDistroInfo(),
    detectVcs(),
  ])

  // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
  return {
    platform: getHostPlatformForAnalytics(),
    // Raw process.platform so freebsd/openbsd/aix/sunos are visible in BQ.
    // getHostPlatformForAnalytics() buckets those into 'linux'; here we want
    // the truth. CLAUDE_CODE_HOST_PLATFORM still overrides for container/remote.
    platformRaw: process.env.CLAUDE_CODE_HOST_PLATFORM || process.platform,
    arch: env.arch,
    nodeVersion: env.nodeVersion,
    terminal: envDynamic.terminal,
    packageManagers: packageManagers.join(','),
    runtimes: runtimes.join(','),
    isRunningWithBun: env.isRunningWithBun(),
    isCi: isEnvTruthy(process.env.CI),
    isClaubbit: isEnvTruthy(process.env.CLAUBBIT),
    isClaudeCodeRemote: isEnvTruthy(process.env.CLAUDE_CODE_REMOTE),
    isLocalAgentMode: process.env.CLAUDE_CODE_ENTRYPOINT === 'local-agent',
    isConductor: env.isConductor(),
    ...(process.env.CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE && {
      remoteEnvironmentType: process.env.CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE,
    }),
    // Gated by feature flag to prevent leaking "coworkerType" string in external builds
    ...(feature('COWORKER_TYPE_TELEMETRY')
      ? process.env.CLAUDE_CODE_COWORKER_TYPE
        ? { coworkerType: process.env.CLAUDE_CODE_COWORKER_TYPE }
        : {}
      : {}),
    ...(process.env.CLAUDE_CODE_CONTAINER_ID && {
      claudeCodeContainerId: process.env.CLAUDE_CODE_CONTAINER_ID,
    }),
    ...(process.env.CLAUDE_CODE_REMOTE_SESSION_ID && {
      claudeCodeRemoteSessionId: process.env.CLAUDE_CODE_REMOTE_SESSION_ID,
    }),
    ...(process.env.CLAUDE_CODE_TAGS && {
      tags: process.env.CLAUDE_CODE_TAGS,
    }),
    isGithubAction: isEnvTruthy(process.env.GITHUB_ACTIONS),
    isClaudeCodeAction: isEnvTruthy(process.env.CLAUDE_CODE_ACTION),
    isClaudeAiAuth: isClaudeAISubscriber(),
    version: MACRO.VERSION,
    versionBase: getVersionBase(),
    buildTime: MACRO.BUILD_TIME,
    deploymentEnvironment: env.detectDeploymentEnvironment(),
    ...(isEnvTruthy(process.env.GITHUB_ACTIONS) && {
      githubEventName: process.env.GITHUB_EVENT_NAME,
      githubActionsRunnerEnvironment: process.env.RUNNER_ENVIRONMENT,
      githubActionsRunnerOs: process.env.RUNNER_OS,
      githubActionRef: process.env.GITHUB_ACTION_PATH?.includes(
        'claude-code-action/',
      )
        ? process.env.GITHUB_ACTION_PATH.split('claude-code-action/')[1]
        : undefined,
    }),
    ...(getWslVersion() && { wslVersion: getWslVersion() }),
    ...(linuxDistroInfo ?? {}),
    ...(vcs.length > 0 ? { vcs: vcs.join(',') } : {}),
  }
})

// --
// CPU% delta tracking — inherently process-global, same pattern as logBatch/flushTimer in datadog.ts
// prevCpuUsage保存`null`，作为后续空值处理的输入。
let prevCpuUsage: NodeJS.CpuUsage | null = null
// prevWallTimeMs 集合保存`null`，作为后续空值处理的输入。
let prevWallTimeMs: number | null = null

/**
 * Builds process metrics object for all users.
 */
// buildProcessMetrics 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildProcessMetrics(): ProcessMetrics | undefined {
  // 保护这一段可能失败的服务层 metadata操作，确保异常能进入相邻错误处理。
  try {
    // mem保存`process.memoryUsage`，供服务层 metadata后续处理使用。
    const mem = process.memoryUsage()
    // cpu保存`process.cpuUsage`，供服务层 metadata后续处理使用。
    const cpu = process.cpuUsage()
    // now记录时间`Date.now`，供服务层 metadata后续处理使用。
    const now = Date.now()

    // cpuPercent 先占位，稍后的条件分支会根据实际输入补齐它。
    let cpuPercent: number | undefined
    // 组合条件 `prevCpuUsage && prevWallTimeMs` 成立时，服务层 metadata才启用这条专门路径。
    if (prevCpuUsage && prevWallTimeMs) {
      // wallDeltaMs 集合保存`now - prevWallTimeMs`，供服务层 metadata后续判断或输出使用。
      const wallDeltaMs = now - prevWallTimeMs
      // 满足 `wallDeltaMs > 0` 时，服务层 metadata执行该分支。
      if (wallDeltaMs > 0) {
        // userDeltaUs 集合保存`cpu.user - prevCpuUsage.user`，供后续判断或组装使用。
        const userDeltaUs = cpu.user - prevCpuUsage.user
        // systemDeltaUs 集合保存`cpu.system - prevCpuUsage.system`，供后续判断或组装使用。
        const systemDeltaUs = cpu.system - prevCpuUsage.system
        // 服务层 metadata在这里处理 `cpuPercent =`，完成这一小步状态转换。
        cpuPercent =
          ((userDeltaUs + systemDeltaUs) / (wallDeltaMs * 1000)) * 100
      }
    }
    // prevCpuUsage更新为 `cpu`，确保服务层后续读取最新状态。
    prevCpuUsage = cpu
    // prevWallTimeMs 集合更新为 `now`，确保服务层后续读取最新状态。
    prevWallTimeMs = now

    // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
    return {
      uptime: process.uptime(),
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      constrainedMemory: process.constrainedMemory(),
      cpuUsage: cpu,
      cpuPercent,
    }
  } catch {
    // 返回 `undefined`，作为服务层 metadata这次计算的结果。
    return undefined
  }
}

/**
 * Get core event metadata shared across all analytics systems.
 *
 * This function collects environment, runtime, and context information
 * that should be included with all analytics events.
 *
 * @param options - Configuration options
 * @returns Promise resolving to enriched metadata object
 */
// getEventMetadata 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getEventMetadata(
  options: EnrichMetadataOptions = {},
): Promise<EventMetadata> {
  // 模型名称保存`String`，供服务层 metadata后续处理使用。
  const model = options.model ? String(options.model) : getMainLoopModel()
  // betas 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const betas =
    typeof options.betas === 'string'
      ? options.betas
      : getModelBetas(model).join(',')
  // 并行获取 envContext、repoRemoteHash，缩短服务层 metadata等待多个独立异步任务的时间。
  const [envContext, repoRemoteHash] = await Promise.all([
    buildEnvContext(),
    getRepoRemoteHash(),
  ])
  // processMetrics 集合构建`buildProcessMetrics`，供服务层 metadata后续处理使用。
  const processMetrics = buildProcessMetrics()

  // metadata 集中保存服务层 metadata要一起传递的字段。
  const metadata: EventMetadata = {
    model,
    sessionId: getSessionId(),
    userType: process.env.USER_TYPE || '',
    ...(betas.length > 0 ? { betas: betas } : {}),
    envContext,
    ...(process.env.CLAUDE_CODE_ENTRYPOINT && {
      entrypoint: process.env.CLAUDE_CODE_ENTRYPOINT,
    }),
    ...(process.env.CLAUDE_AGENT_SDK_VERSION && {
      agentSdkVersion: process.env.CLAUDE_AGENT_SDK_VERSION,
    }),
    isInteractive: String(getIsInteractive()),
    clientType: getClientType(),
    ...(processMetrics && { processMetrics }),
    sweBenchRunId: process.env.SWE_BENCH_RUN_ID || '',
    sweBenchInstanceId: process.env.SWE_BENCH_INSTANCE_ID || '',
    sweBenchTaskId: process.env.SWE_BENCH_TASK_ID || '',
    // Swarm/team agent identification
    // Priority: AsyncLocalStorage context (subagents) > env vars (swarm teammates)
    ...getAgentIdentification(),
    // Subscription tier for DAU-by-tier analytics
    ...(getSubscriptionType() && {
      subscriptionType: getSubscriptionType()!,
    }),
    // Assistant mode tag — lives outside memoized buildEnvContext() because
    // setKairosActive() runs at main.tsx:~1648, after the first event may
    // have already fired and memoized the env. Read fresh per-event instead.
    ...(feature('KAIROS') && getKairosActive()
      ? { kairosActive: true as const }
      : {}),
    // Repo remote hash for joining with server-side repo bundle data
    ...(repoRemoteHash && { rh: repoRemoteHash }),
  }

  // 返回 `metadata`，作为服务层 metadata这次计算的结果。
  return metadata
}


/**
 * Core event metadata for 1P event logging (snake_case format).
 */
// FirstPartyEventLoggingCoreMetadata 固化服务层 metadata里传递的数据形状，帮助调用方按同一结构读写字段。
export type FirstPartyEventLoggingCoreMetadata = {
  session_id: string
  model: string
  user_type: string
  betas?: string
  entrypoint?: string
  agent_sdk_version?: string
  is_interactive: boolean
  client_type: string
  swe_bench_run_id?: string
  swe_bench_instance_id?: string
  swe_bench_task_id?: string
  // Swarm/team agent identification
  agent_id?: string
  parent_session_id?: string
  agent_type?: 'teammate' | 'subagent' | 'standalone'
  team_name?: string
}

/**
 * Complete event logging metadata format for 1P events.
 */
// FirstPartyEventLoggingMetadata 固化服务层 metadata里传递的数据形状，帮助调用方按同一结构读写字段。
export type FirstPartyEventLoggingMetadata = {
  env: EnvironmentMetadata
  process?: string
  // auth is a top-level field on ClaudeCodeInternalEvent (proto PublicApiAuth).
  // account_id is intentionally omitted — only UUID fields are populated client-side.
  auth?: PublicApiAuth
  // core fields correspond to the top level of ClaudeCodeInternalEvent.
  // They get directly exported to their individual columns in the BigQuery tables
  core: FirstPartyEventLoggingCoreMetadata
  // additional fields are populated in the additional_metadata field of the
  // ClaudeCodeInternalEvent proto. Includes but is not limited to information
  // that differs by event type.
  additional: Record<string, unknown>
}

/**
 * Convert metadata to 1P event logging format (snake_case fields).
 *
 * The /api/event_logging/batch endpoint expects snake_case field names
 * for environment and core metadata.
 *
 * @param metadata - Core event metadata
 * @param additionalMetadata - Additional metadata to include
 * @returns Metadata formatted for 1P event logging
 */
// to1PEventFormat 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function to1PEventFormat(
  metadata: EventMetadata,
  userMetadata: CoreUserData,
  additionalMetadata: Record<string, unknown> = {},
): FirstPartyEventLoggingMetadata {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    envContext,
    processMetrics,
    rh,
    kairosActive,
    skillMode,
    observerMode,
    ...coreFields
  } = metadata

  // Convert envContext to snake_case.
  // IMPORTANT: env is typed as the proto-generated EnvironmentMetadata so that
  // adding a field here that the proto doesn't define is a compile error. The
  // generated toJSON() serializer silently drops unknown keys — a hand-written
  // parallel type previously let #11318, #13924, #19448, and coworker_type all
  // ship fields that never reached BQ.
  // Adding a field? Update the monorepo proto first (go/cc-logging):
  //   event_schemas/.../claude_code/v1/claude_code_internal_event.proto
  // then run `bun run generate:proto` here.
  // env 集中保存服务层 metadata要一起传递的字段。
  const env: EnvironmentMetadata = {
    platform: envContext.platform,
    platform_raw: envContext.platformRaw,
    arch: envContext.arch,
    node_version: envContext.nodeVersion,
    terminal: envContext.terminal || 'unknown',
    package_managers: envContext.packageManagers,
    runtimes: envContext.runtimes,
    is_running_with_bun: envContext.isRunningWithBun,
    is_ci: envContext.isCi,
    is_claubbit: envContext.isClaubbit,
    is_claude_code_remote: envContext.isClaudeCodeRemote,
    is_local_agent_mode: envContext.isLocalAgentMode,
    is_conductor: envContext.isConductor,
    is_github_action: envContext.isGithubAction,
    is_claude_code_action: envContext.isClaudeCodeAction,
    is_claude_ai_auth: envContext.isClaudeAiAuth,
    version: envContext.version,
    build_time: envContext.buildTime,
    deployment_environment: envContext.deploymentEnvironment,
  }

  // Add optional env fields
  // 满足 `envContext.remoteEnvironmentType` 时，服务层 metadata执行该分支。
  if (envContext.remoteEnvironmentType) {
    // remote_environment_type更新为 `envContext.remoteEnvironmentType`，确保服务层后续读取最新状态。
    env.remote_environment_type = envContext.remoteEnvironmentType
  }
  // 组合条件 `feature('COWORKER_TYPE_TELEMETRY') && envContext.coworkerType` 成立时，服务层 metadata才启用这条专门路径。
  if (feature('COWORKER_TYPE_TELEMETRY') && envContext.coworkerType) {
    // coworker_type更新为 `envContext.coworkerType`，确保服务层后续读取最新状态。
    env.coworker_type = envContext.coworkerType
  }
  // 满足 `envContext.claudeCodeContainerId` 时，服务层 metadata执行该分支。
  if (envContext.claudeCodeContainerId) {
    // claude_code_container_id更新为 `envContext.claudeCodeContainerId`，确保服务层后续读取最新状态。
    env.claude_code_container_id = envContext.claudeCodeContainerId
  }
  // 满足 `envContext.claudeCodeRemoteSessionId` 时，服务层 metadata执行该分支。
  if (envContext.claudeCodeRemoteSessionId) {
    // claude_code_remote_session_id 会话数据更新为 `envContext.claudeCodeRemoteSessionId`，确保服务层后续读取最新状态。
    env.claude_code_remote_session_id = envContext.claudeCodeRemoteSessionId
  }
  // 满足 `envContext.tags` 时，服务层 metadata执行该分支。
  if (envContext.tags) {
    // tags 集合更新为 `envContext.tags`，确保服务层后续读取最新状态。
    env.tags = envContext.tags
      .split(',')
      // 链式调用 map，继续加工上一行在服务层 metadata中产生的数据。
      .map(t => t.trim())
      .filter(Boolean)
  }
  // 满足 `envContext.githubEventName` 时，服务层 metadata执行该分支。
  if (envContext.githubEventName) {
    // github_event_name更新为 `envContext.githubEventName`，确保服务层后续读取最新状态。
    env.github_event_name = envContext.githubEventName
  }
  // 满足 `envContext.githubActionsRunnerEnvironment` 时，服务层 metadata执行该分支。
  if (envContext.githubActionsRunnerEnvironment) {
    // 服务层 metadata在这里处理 `env.github_actions_runner_environment =`，完成这一小步状态转换。
    env.github_actions_runner_environment =
      envContext.githubActionsRunnerEnvironment
  }
  // 满足 `envContext.githubActionsRunnerOs` 时，服务层 metadata执行该分支。
  if (envContext.githubActionsRunnerOs) {
    // github_actions_runner_os 集合更新为 `envContext.githubActionsRunnerOs`，确保服务层后续读取最新状态。
    env.github_actions_runner_os = envContext.githubActionsRunnerOs
  }
  // 满足 `envContext.githubActionRef` 时，服务层 metadata执行该分支。
  if (envContext.githubActionRef) {
    // github_action_ref 引用更新为 `envContext.githubActionRef`，确保服务层后续读取最新状态。
    env.github_action_ref = envContext.githubActionRef
  }
  // 满足 `envContext.wslVersion` 时，服务层 metadata执行该分支。
  if (envContext.wslVersion) {
    // wsl_version更新为 `envContext.wslVersion`，确保服务层后续读取最新状态。
    env.wsl_version = envContext.wslVersion
  }
  // 满足 `envContext.linuxDistroId` 时，服务层 metadata执行该分支。
  if (envContext.linuxDistroId) {
    // linux_distro_id更新为 `envContext.linuxDistroId`，确保服务层后续读取最新状态。
    env.linux_distro_id = envContext.linuxDistroId
  }
  // 满足 `envContext.linuxDistroVersion` 时，服务层 metadata执行该分支。
  if (envContext.linuxDistroVersion) {
    // linux_distro_version更新为 `envContext.linuxDistroVersion`，确保服务层后续读取最新状态。
    env.linux_distro_version = envContext.linuxDistroVersion
  }
  // 满足 `envContext.linuxKernel` 时，服务层 metadata执行该分支。
  if (envContext.linuxKernel) {
    // linux_kernel更新为 `envContext.linuxKernel`，确保服务层后续读取最新状态。
    env.linux_kernel = envContext.linuxKernel
  }
  // 满足 `envContext.vcs` 时，服务层 metadata执行该分支。
  if (envContext.vcs) {
    // vcs 集合更新为 `envContext.vcs`，确保服务层后续读取最新状态。
    env.vcs = envContext.vcs
  }
  // 满足 `envContext.versionBase` 时，服务层 metadata执行该分支。
  if (envContext.versionBase) {
    // version_base更新为 `envContext.versionBase`，确保服务层后续读取最新状态。
    env.version_base = envContext.versionBase
  }

  // Convert core fields to snake_case
  // core 集中保存服务层 metadata要一起传递的字段。
  const core: FirstPartyEventLoggingCoreMetadata = {
    session_id: coreFields.sessionId,
    model: coreFields.model,
    user_type: coreFields.userType,
    is_interactive: coreFields.isInteractive === 'true',
    client_type: coreFields.clientType,
  }

  // Add other core fields
  // 满足 `coreFields.betas` 时，服务层 metadata执行该分支。
  if (coreFields.betas) {
    // betas 集合更新为 `coreFields.betas`，确保服务层后续读取最新状态。
    core.betas = coreFields.betas
  }
  // 满足 `coreFields.entrypoint` 时，服务层 metadata执行该分支。
  if (coreFields.entrypoint) {
    // entrypoint更新为 `coreFields.entrypoint`，确保服务层后续读取最新状态。
    core.entrypoint = coreFields.entrypoint
  }
  // 满足 `coreFields.agentSdkVersion` 时，服务层 metadata执行该分支。
  if (coreFields.agentSdkVersion) {
    // agent_sdk_version更新为 `coreFields.agentSdkVersion`，确保服务层后续读取最新状态。
    core.agent_sdk_version = coreFields.agentSdkVersion
  }
  // 满足 `coreFields.sweBenchRunId` 时，服务层 metadata执行该分支。
  if (coreFields.sweBenchRunId) {
    // swe_bench_run_id更新为 `coreFields.sweBenchRunId`，确保服务层后续读取最新状态。
    core.swe_bench_run_id = coreFields.sweBenchRunId
  }
  // 满足 `coreFields.sweBenchInstanceId` 时，服务层 metadata执行该分支。
  if (coreFields.sweBenchInstanceId) {
    // swe_bench_instance_id更新为 `coreFields.sweBenchInstanceId`，确保服务层后续读取最新状态。
    core.swe_bench_instance_id = coreFields.sweBenchInstanceId
  }
  // 满足 `coreFields.sweBenchTaskId` 时，服务层 metadata执行该分支。
  if (coreFields.sweBenchTaskId) {
    // swe_bench_task_id更新为 `coreFields.sweBenchTaskId`，确保服务层后续读取最新状态。
    core.swe_bench_task_id = coreFields.sweBenchTaskId
  }
  // Swarm/team agent identification
  // 满足 `coreFields.agentId` 时，服务层 metadata执行该分支。
  if (coreFields.agentId) {
    // agent_id更新为 `coreFields.agentId`，确保服务层后续读取最新状态。
    core.agent_id = coreFields.agentId
  }
  // 满足 `coreFields.parentSessionId` 时，服务层 metadata执行该分支。
  if (coreFields.parentSessionId) {
    // parent_session_id 会话数据更新为 `coreFields.parentSessionId`，确保服务层后续读取最新状态。
    core.parent_session_id = coreFields.parentSessionId
  }
  // 满足 `coreFields.agentType` 时，服务层 metadata执行该分支。
  if (coreFields.agentType) {
    // agent_type更新为 `coreFields.agentType`，确保服务层后续读取最新状态。
    core.agent_type = coreFields.agentType
  }
  // 满足 `coreFields.teamName` 时，服务层 metadata执行该分支。
  if (coreFields.teamName) {
    // team_name更新为 `coreFields.teamName`，确保服务层后续读取最新状态。
    core.team_name = coreFields.teamName
  }

  // Map userMetadata to output fields.
  // Based on src/utils/user.ts getUser(), but with fields present in other
  // parts of ClaudeCodeInternalEvent deduplicated.
  // Convert camelCase GitHubActionsMetadata to snake_case for 1P API
  // Note: github_actions_metadata is placed inside env (EnvironmentMetadata)
  // rather than at the top level of ClaudeCodeInternalEvent
  // 满足 `userMetadata.githubActionsMetadata` 时，服务层 metadata执行该分支。
  if (userMetadata.githubActionsMetadata) {
    // ghMeta保存`userMetadata.githubActionsMetadata`，供后续判断或组装使用。
    const ghMeta = userMetadata.githubActionsMetadata
    // github_actions_metadata更新为 `{`，确保服务层后续读取最新状态。
    env.github_actions_metadata = {
      actor_id: ghMeta.actorId,
      repository_id: ghMeta.repositoryId,
      repository_owner_id: ghMeta.repositoryOwnerId,
    }
  }

  // auth 先占位，稍后的条件分支会根据实际输入补齐它。
  let auth: PublicApiAuth | undefined
  // 组合条件 `userMetadata.accountUuid || userMetadata.organiza` 成立时，服务层 metadata才启用这条专门路径。
  if (userMetadata.accountUuid || userMetadata.organizationUuid) {
    // auth更新为 `{`，确保服务层后续读取最新状态。
    auth = {
      account_uuid: userMetadata.accountUuid,
      organization_uuid: userMetadata.organizationUuid,
    }
  }

  // 返回结构化结果，集中表达服务层 metadata已经整理出的状态。
  return {
    env,
    ...(processMetrics && {
      process: Buffer.from(jsonStringify(processMetrics)).toString('base64'),
    }),
    ...(auth && { auth }),
    core,
    additional: {
      ...(rh && { rh }),
      ...(kairosActive && { is_assistant_mode: true }),
      ...(skillMode && { skill_mode: skillMode }),
      ...(observerMode && { observer_mode: observerMode }),
      ...additionalMetadata,
    },
  }
}
