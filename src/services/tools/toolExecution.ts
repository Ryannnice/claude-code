// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  ContentBlockParam,
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  extractMcpToolDetails,
  extractSkillName,
  extractToolInputForTelemetry,
  getFileExtensionForAnalytics,
  getFileExtensionsFromBashCommand,
  isToolDetailsLoggingEnabled,
  mcpToolDetailsForAnalytics,
  sanitizeToolNameForAnalytics,
} from 'src/services/analytics/metadata.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  addToToolDuration,
  getCodeEditToolDecisionCounter,
  getStatsStore,
} from '../../bootstrap/state.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildCodeEditToolAttributes,
  isCodeEditingTool,
} from '../../hooks/toolPermission/permissionLogging.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  findToolByName,
  type Tool,
  type ToolProgress,
  type ToolProgressData,
  type ToolUseContext,
} from '../../Tool.js'
// 类型依赖 { BashToolInput } 来自 ../../tools/BashTool/BashTool.js，用于校准工具调用的数据契约。
import type { BashToolInput } from '../../tools/BashTool/BashTool.js'
// 接入 startSpeculativeClassifierCheck 工具实现，后续工具池会按权限和开关决定是否暴露。
import { startSpeculativeClassifierCheck } from '../../tools/BashTool/bashPermissions.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../../tools/FileWriteTool/prompt.js'
// 接入 NOTEBOOK_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NOTEBOOK_EDIT_TOOL_NAME } from '../../tools/NotebookEditTool/constants.js'
// 接入 POWERSHELL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { POWERSHELL_TOOL_NAME } from '../../tools/PowerShellTool/toolName.js'
// 接入 parseGitCommitId 工具实现，后续工具池会按权限和开关决定是否暴露。
import { parseGitCommitId } from '../../tools/shared/gitOperationTracking.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isDeferredTool,
  TOOL_SEARCH_TOOL_NAME,
} from '../../tools/ToolSearchTool/prompt.js'
// 引入 getAllBaseTools，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { getAllBaseTools } from '../../tools.js'
// 类型依赖 { HookProgress } 来自 ../../types/hooks.js，用于校准工具调用的数据契约。
import type { HookProgress } from '../../types/hooks.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  Message,
  ProgressMessage,
  StopHookInfo,
} from '../../types/message.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 复用 createAttachmentMessage 工具函数，把通用处理留在 ../../utils/attachments.js 中维护。
import { createAttachmentMessage } from '../../utils/attachments.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  AbortError,
  errorMessage,
  getErrnoCode,
  ShellError,
  TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from '../../utils/errors.js'
// 复用 executePermissionDeniedHooks 工具函数，把通用处理留在 ../../utils/hooks.js 中维护。
import { executePermissionDeniedHooks } from '../../utils/hooks.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  CANCEL_MESSAGE,
  createProgressMessage,
  createStopHookSummaryMessage,
  createToolResultStopMessage,
  createUserMessage,
  withMemoryCorrectionHint,
} from '../../utils/messages.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  PermissionDecisionReason,
  PermissionResult,
} from '../../utils/permissions/PermissionResult.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  startSessionActivity,
  stopSessionActivity,
} from '../../utils/sessionActivity.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 Stream 工具函数，把通用处理留在 ../../utils/stream.js 中维护。
import { Stream } from '../../utils/stream.js'
// 复用 logOTelEvent 工具函数，把通用处理留在 ../../utils/telemetry/events.js 中维护。
import { logOTelEvent } from '../../utils/telemetry/events.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  addToolContentEvent,
  endToolBlockedOnUserSpan,
  endToolExecutionSpan,
  endToolSpan,
  isBetaTracingEnabled,
  startToolBlockedOnUserSpan,
  startToolExecutionSpan,
  startToolSpan,
} from '../../utils/telemetry/sessionTracing.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  formatError,
  formatZodValidationError,
} from '../../utils/toolErrors.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  processPreMappedToolResultBlock,
  processToolResultBlock,
} from '../../utils/toolResultStorage.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  extractDiscoveredToolNames,
  isToolSearchEnabledOptimistic,
  isToolSearchToolAvailable,
} from '../../utils/toolSearch.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  McpAuthError,
  McpToolCallError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from '../mcp/client.js'
// 引入 mcpInfoFromString，将 ../mcp/mcpStringUtils.js 中已经封装好的能力接到本文件流程里。
import { mcpInfoFromString } from '../mcp/mcpStringUtils.js'
// 引入 normalizeNameForMCP，将 ../mcp/normalization.js 中已经封装好的能力接到本文件流程里。
import { normalizeNameForMCP } from '../mcp/normalization.js'
// 类型依赖 { MCPServerConnection } 来自 ../mcp/types.js，用于校准工具调用的数据契约。
import type { MCPServerConnection } from '../mcp/types.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getLoggingSafeMcpBaseUrl,
  getMcpServerScopeFromToolName,
  isMcpTool,
} from '../mcp/utils.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  resolveHookPermissionDecision,
  runPostToolUseFailureHooks,
  runPostToolUseHooks,
  runPreToolUseHooks,
} from './toolHooks.js'

/** Minimum total hook duration (ms) to show inline timing summary */
// HOOK_TIMING_DISPLAY_THRESHOLD_MS 集合 命名 `500`，让后续代码直接表达这个值的用途。
export const HOOK_TIMING_DISPLAY_THRESHOLD_MS = 500
/** Log a debug warning when hooks/permission-decision block for this long. Matches
 * BashTool's PROGRESS_THRESHOLD_MS — the collapsed view feels stuck past this. */
// SLOW_PHASE_LOG_THRESHOLD_MS 集合 命名 `2000`，让后续代码直接表达这个值的用途。
const SLOW_PHASE_LOG_THRESHOLD_MS = 2000

/**
 * Classify a tool execution error into a telemetry-safe string.
 *
 * In minified/external builds, `error.constructor.name` is mangled into
 * short identifiers like "nJT" or "Chq" — useless for diagnostics.
 * This function extracts structured, telemetry-safe information instead:
 * - TelemetrySafeError: use its telemetryMessage (already vetted)
 * - Node.js fs errors: log the error code (ENOENT, EACCES, etc.)
 * - Known error types: use their unminified name
 * - Fallback: "Error" (better than a mangled 3-char identifier)
 */
// classifyToolError 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyToolError(error: unknown): string {
  // 工具调用在这里按实际状态进入对应分支。
  if (
    error instanceof TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  ) {
    // 返回 `error.telemetryMessage.slice(0, 200)`，作为工具调用这次计算的结果。
    return error.telemetryMessage.slice(0, 200)
  }
  // 满足 `error instanceof Error` 时，工具调用执行该分支。
  if (error instanceof Error) {
    // Node.js filesystem errors have a `code` property (ENOENT, EACCES, etc.)
    // These are safe to log and much more useful than the constructor name.
    // errnoCode读取`getErrnoCode`，供工具调用后续处理使用。
    const errnoCode = getErrnoCode(error)
    // 当 `typeof errnoCode` 匹配 `'string'` 时，工具调用执行对应分支。
    if (typeof errnoCode === 'string') {
      // 返回 ``Error:${errnoCode}``，作为工具调用这次计算的结果。
      return `Error:${errnoCode}`
    }
    // ShellError, ImageSizeError, etc. have stable `.name` properties
    // that survive minification (they're set in the constructor).
    // `error.name && error.name` 与 `'Error' && error.nam` 不一致时刷新派生状态，避免使用过期结果。
    if (error.name && error.name !== 'Error' && error.name.length > 3) {
      // 返回 `error.name.slice(0, 60)`，作为工具调用这次计算的结果。
      return error.name.slice(0, 60)
    }
    // 返回 `'Error'`，作为工具调用这次计算的结果。
    return 'Error'
  }
  // 返回 `'UnknownError'`，作为工具调用这次计算的结果。
  return 'UnknownError'
}

/**
 * Map a rule's origin to the documented OTel `source` vocabulary, matching
 * the interactive path's semantics (permissionLogging.ts:81): session-scoped
 * grants are temporary, on-disk grants are permanent, and user-authored
 * denies are user_reject regardless of persistence. Everything the user
 * didn't write (cliArg, policySettings, projectSettings, flagSettings) is
 * config.
 */
// ruleSourceToOTelSource 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ruleSourceToOTelSource(
  ruleSource: string,
  behavior: 'allow' | 'deny',
): string {
  // 按照 ruleSource 的取值选择工具调用的具体处理分支。
  switch (ruleSource) {
    case 'session':
      // 返回 `behavior === 'allow' ? 'user_temporary' : 'user_reject'`，作为工具调用这次计算的结果。
      return behavior === 'allow' ? 'user_temporary' : 'user_reject'
    case 'localSettings':
    case 'userSettings':
      // 返回 `behavior === 'allow' ? 'user_permanent' : 'user_reject'`，作为工具调用这次计算的结果。
      return behavior === 'allow' ? 'user_permanent' : 'user_reject'
    default:
      // 返回 `'config'`，作为工具调用这次计算的结果。
      return 'config'
  }
}

/**
 * Map a PermissionDecisionReason to the OTel `source` label for the
 * non-interactive tool_decision path, staying within the documented
 * vocabulary (config, hook, user_permanent, user_temporary, user_reject).
 *
 * For permissionPromptTool, the SDK host may set decisionClassification on
 * the PermissionResult to tell us exactly what happened (once vs always vs
 * cache hit — the host knows, we can't tell from {behavior:'allow'} alone).
 * Without it, we fall back conservatively: allow → user_temporary,
 * deny → user_reject.
 */
// decisionReasonToOTelSource 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function decisionReasonToOTelSource(
  reason: PermissionDecisionReason | undefined,
  behavior: 'allow' | 'deny',
): string {
  // reason缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!reason) {
    // 返回 `'config'`，作为工具调用这次计算的结果。
    return 'config'
  }
  // 按照 reason.type 的取值选择工具调用的具体处理分支。
  switch (reason.type) {
    case 'permissionPromptTool': {
      // toolResult is typed `unknown` on PermissionDecisionReason but carries
      // the parsed Output from PermissionPromptToolResultSchema. Narrow at
      // runtime rather than widen the cross-file type.
      // toolResult保存`reason.toolResult as`，供工具实现 tool Execution后续判断或输出使用。
      const toolResult = reason.toolResult as
        | { decisionClassification?: string }
        | undefined
      // classified 命名 `toolResult?.decisionClassification`，让后续代码直接表达这个值的用途。
      const classified = toolResult?.decisionClassification
      // 工具调用在这里按实际状态进入对应分支。
      if (
        classified === 'user_temporary' ||
        classified === 'user_permanent' ||
        classified === 'user_reject'
      ) {
        // 返回 `classified`，作为工具调用这次计算的结果。
        return classified
      }
      // 返回 `behavior === 'allow' ? 'user_temporary' : 'user_reject'`，作为工具调用这次计算的结果。
      return behavior === 'allow' ? 'user_temporary' : 'user_reject'
    }
    case 'rule':
      // 返回 `ruleSourceToOTelSource(reason.rule.source, behavior)`，作为工具调用这次计算的结果。
      return ruleSourceToOTelSource(reason.rule.source, behavior)
    case 'hook':
      // 返回 `'hook'`，作为工具调用这次计算的结果。
      return 'hook'
    case 'mode':
    case 'classifier':
    case 'subcommandResults':
    case 'asyncAgent':
    case 'sandboxOverride':
    case 'workingDir':
    case 'safetyCheck':
    case 'other':
      // 返回 `'config'`，作为工具调用这次计算的结果。
      return 'config'
    default: {
      // _exhaustive 命名 `reason`，让后续代码直接表达这个值的用途。
      const _exhaustive: never = reason
      // 返回 `'config'`，作为工具调用这次计算的结果。
      return 'config'
    }
  }
}

// getNextImagePasteId 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getNextImagePasteId(messages: Message[]): number {
  // maxId保存`0`，供后续判断或组装使用。
  let maxId = 0
  // 按顺序遍历 `messages` 中的消息，逐个交给工具调用处理。
  for (const message of messages) {
    // 只有 `message.type === 'user' && message.imagePasteIds` 满足时，工具调用才执行该分支。
    if (message.type === 'user' && message.imagePasteIds) {
      // 按顺序遍历 `message.imagePasteIds` 中的标识符，逐个交给工具调用处理。
      for (const id of message.imagePasteIds) {
        // 满足 `id > maxId` 时，工具调用执行该分支。
        if (id > maxId) maxId = id
      }
    }
  }
  // 返回 `maxId + 1`，作为工具调用这次计算的结果。
  return maxId + 1
}

// MessageUpdateLazy 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type MessageUpdateLazy<M extends Message = Message> = {
  message: M
  contextModifier?: {
    toolUseID: string
    // 这个回调绑定到 modifyContext: (context: ToolUseContext) => ToolUseContext，负责工具调用在该局部场景下的响应。
    modifyContext: (context: ToolUseContext) => ToolUseContext
  }
}

// McpServerType 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpServerType =
  | 'stdio'
  | 'sse'
  | 'http'
  | 'ws'
  | 'sdk'
  | 'sse-ide'
  | 'ws-ide'
  | 'claudeai-proxy'
  | undefined

// findMcpServerConnection 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findMcpServerConnection(
  toolName: string,
  mcpClients: MCPServerConnection[],
): MCPServerConnection | undefined {
  // 满足 `!toolName.startsWith('mcp__')` 时，工具调用执行该分支。
  if (!toolName.startsWith('mcp__')) {
    // 返回 `undefined`，作为工具调用这次计算的结果。
    return undefined
  }

  // mcpInfo保存`mcpInfoFromString`，供工具调用后续处理使用。
  const mcpInfo = mcpInfoFromString(toolName)
  // mcpInfo缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!mcpInfo) {
    // 返回 `undefined`，作为工具调用这次计算的结果。
    return undefined
  }

  // mcpInfo.serverName is normalized (e.g., "claude_ai_Slack"), but client.name
  // is the original name (e.g., "claude.ai Slack"). Normalize both for comparison.
  // 返回 `mcpClients.find(`，作为工具调用这次计算的结果。
  return mcpClients.find(
    // API 客户端更新为 `> normalizeNameForMCP(client.name) === mcpInfo.serverName`，确保工具调用后续读取最新状态。
    client => normalizeNameForMCP(client.name) === mcpInfo.serverName,
  )
}

/**
 * Extracts the MCP server transport type from a tool name.
 * Returns the server type (stdio, sse, http, ws, sdk, etc.) for MCP tools,
 * or undefined for built-in tools.
 */
// getMcpServerType 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpServerType(
  toolName: string,
  mcpClients: MCPServerConnection[],
): McpServerType {
  // serverConnection筛选`findMcpServerConnection`，供工具调用后续处理使用。
  const serverConnection = findMcpServerConnection(toolName, mcpClients)

  // 当 `serverConnection?.type` 匹配 `'connected'` 时，工具调用执行对应分支。
  if (serverConnection?.type === 'connected') {
    // Handle stdio configs where type field is optional (defaults to 'stdio')
    // 返回 `serverConnection.config.type ?? 'stdio'`，作为工具调用这次计算的结果。
    return serverConnection.config.type ?? 'stdio'
  }

  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

/**
 * Extracts the MCP server base URL for a tool by looking up its server connection.
 * Returns undefined for stdio servers, built-in tools, or if the server is not connected.
 */
// getMcpServerBaseUrlFromToolName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpServerBaseUrlFromToolName(
  toolName: string,
  mcpClients: MCPServerConnection[],
): string | undefined {
  // serverConnection筛选`findMcpServerConnection`，供工具调用后续处理使用。
  const serverConnection = findMcpServerConnection(toolName, mcpClients)
  // `serverConnection?.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
  if (serverConnection?.type !== 'connected') {
    // 返回 `undefined`，作为工具调用这次计算的结果。
    return undefined
  }
  // 返回 `getLoggingSafeMcpBaseUrl(serverConnection.config)`，作为工具调用这次计算的结果。
  return getLoggingSafeMcpBaseUrl(serverConnection.config)
}

// 工具实现 tool Execution在这里处理 `export async function* runToolUse(`，完成这一小步状态转换。
export async function* runToolUse(
  toolUse: ToolUseBlock,
  assistantMessage: AssistantMessage,
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<MessageUpdateLazy, void> {
  // toolName 命名 `toolUse.name`，让后续代码直接表达这个值的用途。
  const toolName = toolUse.name
  // First try to find in the available tools (what the model sees)
  // 工具筛选`findToolByName`，供工具调用后续处理使用。
  let tool = findToolByName(toolUseContext.options.tools, toolName)

  // If not found, check if it's a deprecated tool being called by alias
  // (e.g., old transcripts calling "KillShell" which is now an alias for "TaskStop")
  // Only fall back for tools where the name matches an alias, not the primary name
  // 工具缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!tool) {
    // fallbackTool筛选`findToolByName`，供工具调用后续处理使用。
    const fallbackTool = findToolByName(getAllBaseTools(), toolName)
    // Only use fallback if the tool was found via alias (deprecated name)
    // 只有 `fallbackTool && fallbackTool.aliases?.includes(toolName)` 满足时，工具调用才执行该分支。
    if (fallbackTool && fallbackTool.aliases?.includes(toolName)) {
      // 工具更新为 `fallbackTool`，确保工具调用后续读取最新状态。
      tool = fallbackTool
    }
  }
  // messageId 消息数据保存`assistantMessage.message.id`，供工具实现 tool Execution后续判断或输出使用。
  const messageId = assistantMessage.message.id
  // requestId 请求数据保存`assistantMessage.requestId`，供工具实现 tool Execution后续判断或输出使用。
  const requestId = assistantMessage.requestId
  // mcpServerType读取`getMcpServerType`，供工具调用后续处理使用。
  const mcpServerType = getMcpServerType(
    toolName,
    toolUseContext.options.mcpClients,
  )
  // mcpServerBaseUrl读取`getMcpServerBaseUrlFromToolName`，供工具调用后续处理使用。
  const mcpServerBaseUrl = getMcpServerBaseUrlFromToolName(
    toolName,
    toolUseContext.options.mcpClients,
  )

  // Check if the tool exists
  // 工具缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!tool) {
    // sanitizedToolName保存`sanitizeToolNameForAnalytics`，供工具调用后续处理使用。
    const sanitizedToolName = sanitizeToolNameForAnalytics(toolName)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Unknown tool ${toolName}: ${toolUse.id}`)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_use_error', {
      error:
        `No such tool available: ${sanitizedToolName}` as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolName: sanitizedToolName,
      toolUseID:
        toolUse.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      isMcp: toolName.startsWith('mcp__'),
      queryChainId: toolUseContext.queryTracking
        ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryDepth: toolUseContext.queryTracking?.depth,
      ...(mcpServerType && {
        mcpServerType:
          mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(mcpServerBaseUrl && {
        mcpServerBaseUrl:
          mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(requestId && {
        requestId:
          requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...mcpToolDetailsForAnalytics(toolName, mcpServerType, mcpServerBaseUrl),
    })
    // 生成器产出 `{`，把阶段性结果交给上层消费。
    yield {
      message: createUserMessage({
        content: [
          {
            type: 'tool_result',
            content: `<tool_use_error>Error: No such tool available: ${toolName}</tool_use_error>`,
            is_error: true,
            tool_use_id: toolUse.id,
          },
        ],
        toolUseResult: `Error: No such tool available: ${toolName}`,
        sourceToolAssistantUUID: assistantMessage.uuid,
      }),
    }
    // 工具实现 tool Execution在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // toolInput保存`toolUse.input as { [key: string]: string }`，供工具实现 tool Execution后续判断或输出使用。
  const toolInput = toolUse.input as { [key: string]: string }
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `toolUseContext.abortController.signal.aborted` 时，工具调用执行该分支。
    if (toolUseContext.abortController.signal.aborted) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_use_cancelled', {
        toolName: sanitizeToolNameForAnalytics(tool.name),
        toolUseID:
          toolUse.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        isMcp: tool.isMcp ?? false,

        queryChainId: toolUseContext.queryTracking
          ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        queryDepth: toolUseContext.queryTracking?.depth,
        ...(mcpServerType && {
          mcpServerType:
            mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(mcpServerBaseUrl && {
          mcpServerBaseUrl:
            mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(requestId && {
          requestId:
            requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...mcpToolDetailsForAnalytics(
          tool.name,
          mcpServerType,
          mcpServerBaseUrl,
        ),
      })
      // 文本内容构建`createToolResultStopMessage`，供工具调用后续处理使用。
      const content = createToolResultStopMessage(toolUse.id)
      // 文本内容更新为 `withMemoryCorrectionHint(CANCEL_MESSAGE)`，确保工具调用后续读取最新状态。
      content.content = withMemoryCorrectionHint(CANCEL_MESSAGE)
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        message: createUserMessage({
          content: [content],
          toolUseResult: CANCEL_MESSAGE,
          sourceToolAssistantUUID: assistantMessage.uuid,
        }),
      }
      // 工具实现 tool Execution在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 逐项读取 `streamedCheckPermissionsAndCallTool(` 中的update，按输入顺序推进工具实现 tool Execution。
    for await (const update of streamedCheckPermissionsAndCallTool(
      tool,
      toolUse.id,
      toolInput,
      toolUseContext,
      canUseTool,
      assistantMessage,
      messageId,
      requestId,
      mcpServerType,
      mcpServerBaseUrl,
    )) {
      // 生成器产出 `update`，把阶段性结果交给上层消费。
      yield update
    }
  } catch (error) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // errorMessage 消息数据保存`String`，供工具调用后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // toolInfo保存`tool ? ` (${tool.name})` : ''`，供后续判断或组装使用。
    const toolInfo = tool ? ` (${tool.name})` : ''
    // detailedError 错误信息固定为 ``Error calling tool${toolInfo}: ${errorMessage}``，作为工具实现 tool Execution后续展示或比较的基准。
    const detailedError = `Error calling tool${toolInfo}: ${errorMessage}`

    // 生成器产出 `{`，把阶段性结果交给上层消费。
    yield {
      message: createUserMessage({
        content: [
          {
            type: 'tool_result',
            content: `<tool_use_error>${detailedError}</tool_use_error>`,
            is_error: true,
            tool_use_id: toolUse.id,
          },
        ],
        toolUseResult: detailedError,
        sourceToolAssistantUUID: assistantMessage.uuid,
      }),
    }
  }
}

// streamedCheckPermissionsAndCallTool 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function streamedCheckPermissionsAndCallTool(
  tool: Tool,
  toolUseID: string,
  input: { [key: string]: boolean | string | number },
  toolUseContext: ToolUseContext,
  canUseTool: CanUseToolFn,
  assistantMessage: AssistantMessage,
  messageId: string,
  requestId: string | undefined,
  mcpServerType: McpServerType,
  mcpServerBaseUrl: ReturnType<typeof getLoggingSafeMcpBaseUrl>,
): AsyncIterable<MessageUpdateLazy> {
  // This is a bit of a hack to get progress events and final results
  // into a single async iterable.
  //
  // Ideally the progress reporting and tool call reporting would
  // be via separate mechanisms.
  // stream 命名 `new Stream<MessageUpdateLazy>()`，让后续代码直接表达这个值的用途。
  const stream = new Stream<MessageUpdateLazy>()
  // 调用 checkPermissionsAndCallTool，触发工具调用此处需要的副作用。
  checkPermissionsAndCallTool(
    tool,
    toolUseID,
    input,
    toolUseContext,
    canUseTool,
    assistantMessage,
    messageId,
    requestId,
    mcpServerType,
    mcpServerBaseUrl,
    // progress 集合更新为 `> {`，确保工具调用后续读取最新状态。
    progress => {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_use_progress', {
        messageID:
          messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        toolName: sanitizeToolNameForAnalytics(tool.name),
        isMcp: tool.isMcp ?? false,

        queryChainId: toolUseContext.queryTracking
          ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        queryDepth: toolUseContext.queryTracking?.depth,
        ...(mcpServerType && {
          mcpServerType:
            mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(mcpServerBaseUrl && {
          mcpServerBaseUrl:
            mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(requestId && {
          requestId:
            requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...mcpToolDetailsForAnalytics(
          tool.name,
          mcpServerType,
          mcpServerBaseUrl,
        ),
      })
      // 调用 stream.enqueue，触发工具调用此处需要的副作用。
      stream.enqueue({
        message: createProgressMessage({
          toolUseID: progress.toolUseID,
          parentToolUseID: toolUseID,
          data: progress.data,
        }),
      })
    },
  )
    // 链式调用 then，继续加工上一行在工具调用中产生的数据。
    .then(results => {
      // 按顺序遍历 `results` 中的结果，逐个交给工具调用处理。
      for (const result of results) {
        // 调用 stream.enqueue，触发工具调用此处需要的副作用。
        stream.enqueue(result)
      }
    })
    // 链式调用 catch，继续加工上一行在工具调用中产生的数据。
    .catch(error => {
      // 调用 stream.error，触发工具调用此处需要的副作用。
      stream.error(error)
    })
    // 链式调用 finally，继续加工上一行在工具调用中产生的数据。
    .finally(() => {
      // 调用 stream.done，触发工具调用此处需要的副作用。
      stream.done()
    })
  // 返回 `stream`，作为工具调用这次计算的结果。
  return stream
}

/**
 * Appended to Zod errors when a deferred tool wasn't in the discovered-tool
 * set — re-runs the claude.ts schema-filter scan dispatch-time to detect the
 * mismatch. The raw Zod error ("expected array, got string") doesn't tell the
 * model to re-load the tool; this hint does. Null if the schema was sent.
 */
// buildSchemaNotSentHint 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSchemaNotSentHint(
  tool: Tool,
  messages: Message[],
  tools: readonly { name: string }[],
): string | null {
  // Optimistic gating — reconstructing claude.ts's full useToolSearch
  // computation is fragile. These two gates prevent pointing at a ToolSearch
  // that isn't callable; occasional misfires (Haiku, tst-auto below threshold)
  // cost one extra round-trip on an already-failing path.
  // 满足 `!isToolSearchEnabledOptimistic()` 时，工具调用执行该分支。
  if (!isToolSearchEnabledOptimistic()) return null
  // 满足 `!isToolSearchToolAvailable(tools)` 时，工具调用执行该分支。
  if (!isToolSearchToolAvailable(tools)) return null
  // 满足 `!isDeferredTool(tool)` 时，工具调用执行该分支。
  if (!isDeferredTool(tool)) return null
  // discovered保存`extractDiscoveredToolNames`，供工具调用后续处理使用。
  const discovered = extractDiscoveredToolNames(messages)
  // 满足 `discovered.has(tool.name)` 时，工具调用执行该分支。
  if (discovered.has(tool.name)) return null
  // 返回 `(`，作为工具调用这次计算的结果。
  return (
    `\n\nThis tool's schema was not sent to the API — it was not in the discovered-tool set derived from message history. ` +
    `Without the schema in your prompt, typed parameters (arrays, numbers, booleans) get emitted as strings and the client-side parser rejects them. ` +
    `Load the tool first: call ${TOOL_SEARCH_TOOL_NAME} with query "select:${tool.name}", then retry this call.`
  )
}

// checkPermissionsAndCallTool 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkPermissionsAndCallTool(
  tool: Tool,
  toolUseID: string,
  input: { [key: string]: boolean | string | number },
  toolUseContext: ToolUseContext,
  canUseTool: CanUseToolFn,
  assistantMessage: AssistantMessage,
  messageId: string,
  requestId: string | undefined,
  mcpServerType: McpServerType,
  mcpServerBaseUrl: ReturnType<typeof getLoggingSafeMcpBaseUrl>,
  // 工具实现 tool Execution在这里处理 `onToolProgress: (`，完成这一小步状态转换。
  onToolProgress: (
    progress: ToolProgress<ToolProgressData> | ProgressMessage<HookProgress>,
  ) => void,
): Promise<MessageUpdateLazy[]> {
  // Validate input types with zod (surprisingly, the model is not great at generating valid input)
  // parsedInput保存`inputSchema.safeParse`，供工具调用后续处理使用。
  const parsedInput = tool.inputSchema.safeParse(input)
  // parsedInput.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parsedInput.success) {
    // errorContent 错误信息格式化`formatZodValidationError`，供工具调用后续处理使用。
    let errorContent = formatZodValidationError(tool.name, parsedInput.error)

    // schemaHint构建`buildSchemaNotSentHint`，供工具调用后续处理使用。
    const schemaHint = buildSchemaNotSentHint(
      tool,
      toolUseContext.messages,
      toolUseContext.options.tools,
    )
    // 满足 `schemaHint` 时，工具调用执行该分支。
    if (schemaHint) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_deferred_tool_schema_not_sent', {
        toolName: sanitizeToolNameForAnalytics(tool.name),
        isMcp: tool.isMcp ?? false,
      })
      // 工具实现 tool Execution在这里处理 `errorContent += schemaHint`，完成这一小步状态转换。
      errorContent += schemaHint
    }

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `${tool.name} tool input error: ${errorContent.slice(0, 200)}`,
    )
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_use_error', {
      error:
        'InputValidationError' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      errorDetails: errorContent.slice(
        0,
        2000,
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      messageID:
        messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolName: sanitizeToolNameForAnalytics(tool.name),
      isMcp: tool.isMcp ?? false,

      queryChainId: toolUseContext.queryTracking
        ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryDepth: toolUseContext.queryTracking?.depth,
      ...(mcpServerType && {
        mcpServerType:
          mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(mcpServerBaseUrl && {
        mcpServerBaseUrl:
          mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(requestId && {
        requestId:
          requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...mcpToolDetailsForAnalytics(tool.name, mcpServerType, mcpServerBaseUrl),
    })
    // 返回列表结果，保留工具调用已经排好的条目顺序。
    return [
      {
        message: createUserMessage({
          content: [
            {
              type: 'tool_result',
              content: `<tool_use_error>InputValidationError: ${errorContent}</tool_use_error>`,
              is_error: true,
              tool_use_id: toolUseID,
            },
          ],
          toolUseResult: `InputValidationError: ${parsedInput.error.message}`,
          sourceToolAssistantUUID: assistantMessage.uuid,
        }),
      },
    ]
  }

  // Validate input values. Each tool has its own validation logic
  // isValidCall 等待 `tool.validateInput?.(`，确保继续执行前已有结果。
  const isValidCall = await tool.validateInput?.(
    parsedInput.data,
    toolUseContext,
  )
  // 满足 `isValidCall?.result === false` 时，工具调用执行该分支。
  if (isValidCall?.result === false) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `${tool.name} tool validation error: ${isValidCall.message?.slice(0, 200)}`,
    )
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_use_error', {
      messageID:
        messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolName: sanitizeToolNameForAnalytics(tool.name),
      error:
        isValidCall.message as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      errorCode: isValidCall.errorCode,
      isMcp: tool.isMcp ?? false,

      queryChainId: toolUseContext.queryTracking
        ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryDepth: toolUseContext.queryTracking?.depth,
      ...(mcpServerType && {
        mcpServerType:
          mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(mcpServerBaseUrl && {
        mcpServerBaseUrl:
          mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(requestId && {
        requestId:
          requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...mcpToolDetailsForAnalytics(tool.name, mcpServerType, mcpServerBaseUrl),
    })
    // 返回列表结果，保留工具调用已经排好的条目顺序。
    return [
      {
        message: createUserMessage({
          content: [
            {
              type: 'tool_result',
              content: `<tool_use_error>${isValidCall.message}</tool_use_error>`,
              is_error: true,
              tool_use_id: toolUseID,
            },
          ],
          toolUseResult: `Error: ${isValidCall.message}`,
          sourceToolAssistantUUID: assistantMessage.uuid,
        }),
      },
    ]
  }
  // Speculatively start the bash allow classifier check early so it runs in
  // parallel with pre-tool hooks, deny/ask classifiers, and permission dialog
  // setup. The UI indicator (setClassifierChecking) is NOT set here — it's
  // set in interactiveHandler.ts only when the permission check returns `ask`
  // with a pendingClassifierCheck. This avoids flashing "classifier running"
  // for commands that auto-allow via prefix rules.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    tool.name === BASH_TOOL_NAME &&
    parsedInput.data &&
    'command' in parsedInput.data
  ) {
    // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
    const appState = toolUseContext.getAppState()
    // 调用 startSpeculativeClassifierCheck，触发工具调用此处需要的副作用。
    startSpeculativeClassifierCheck(
      (parsedInput.data as BashToolInput).command,
      appState.toolPermissionContext,
      toolUseContext.abortController.signal,
      toolUseContext.options.isNonInteractiveSession,
    )
  }

  // resultingMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const resultingMessages = []

  // Defense-in-depth: strip _simulatedSedEdit from model-provided Bash input.
  // This field is internal-only — it must only be injected by the permission
  // system (SedEditPermissionRequest) after user approval. If the model supplies
  // it, the schema's strictObject should already reject it, but we strip here
  // as a safeguard against future regressions.
  // processedInput解析`parsedInput.data` 整理出中间结果，供工具实现 tool Execution后续步骤使用。
  let processedInput = parsedInput.data
  // 工具调用在这里按实际状态进入对应分支。
  if (
    tool.name === BASH_TOOL_NAME &&
    processedInput &&
    typeof processedInput === 'object' &&
    '_simulatedSedEdit' in processedInput
  ) {
    // 工具实现 tool Execution先整理这一处局部数据，后续分支可以直接读取。
    const { _simulatedSedEdit: _, ...rest } =
      processedInput as typeof processedInput & {
        _simulatedSedEdit: unknown
      }
    // processedInput更新为 `rest as typeof processedInput`，确保工具调用后续读取最新状态。
    processedInput = rest as typeof processedInput
  }

  // Backfill legacy/derived fields on a shallow clone so hooks/canUseTool see
  // them without affecting tool.call(). SendMessageTool adds fields; file
  // tools overwrite file_path with expandPath — that mutation must not reach
  // call() because tool results embed the input path verbatim (e.g. "File
  // created successfully at: {path}"), and changing it alters the serialized
  // transcript and VCR fixture hashes. If a hook/permission later returns a
  // fresh updatedInput, callInput converges on it below — that replacement
  // is intentional and should reach call().
  // callInput保存`processedInput`，供工具实现 tool Execution后续判断或输出使用。
  let callInput = processedInput
  // backfilledClone 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const backfilledClone =
    tool.backfillObservableInput &&
    typeof processedInput === 'object' &&
    processedInput !== null
      ? ({ ...processedInput } as typeof processedInput)
      : null
  // 满足 `backfilledClone` 时，工具调用执行该分支。
  if (backfilledClone) {
    // 工具实现 tool Execution在这里处理 `tool.backfillObservableInput!(backfilledClone as Record<string, unknown...`，完成这一小步状态转换。
    tool.backfillObservableInput!(backfilledClone as Record<string, unknown>)
    // processedInput更新为 `backfilledClone`，确保工具调用后续读取最新状态。
    processedInput = backfilledClone
  }

  // shouldPreventContinuation标记工具实现 tool Execution是否启用对应路径。
  let shouldPreventContinuation = false
  // stopReason 先占位，稍后的条件分支会根据实际输入补齐它。
  let stopReason: string | undefined
  // hookPermissionResult 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let hookPermissionResult: PermissionResult | undefined
  // preToolHookInfos 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const preToolHookInfos: StopHookInfo[] = []
  // preToolHookStart记录时间`Date.now`，供工具调用后续处理使用。
  const preToolHookStart = Date.now()
  // 逐项读取 `runPreToolUseHooks(` 中的结果，按输入顺序推进工具实现 tool Execution。
  for await (const result of runPreToolUseHooks(
    toolUseContext,
    tool,
    processedInput,
    toolUseID,
    assistantMessage.message.id,
    requestId,
    mcpServerType,
    mcpServerBaseUrl,
  )) {
    // 按照 result.type 的取值选择工具调用的具体处理分支。
    switch (result.type) {
      case 'message':
        // 当 `result.message.message.type` 匹配 `'progress'` 时，工具调用执行对应分支。
        if (result.message.message.type === 'progress') {
          // 调用 onToolProgress，触发工具调用此处需要的副作用。
          onToolProgress(result.message.message)
        } else {
          // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
          resultingMessages.push(result.message)
          // att保存`result.message.message.attachment`，供工具实现 tool Execution后续判断或输出使用。
          const att = result.message.message.attachment
          // 工具调用在这里按实际状态进入对应分支。
          if (
            att &&
            'command' in att &&
            att.command !== undefined &&
            'durationMs' in att &&
            att.durationMs !== undefined
          ) {
            // preToolHookInfos 集合追加新条目，保持收集顺序与输入顺序一致。
            preToolHookInfos.push({
              command: att.command,
              durationMs: att.durationMs,
            })
          }
        }
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'hookPermissionResult':
        // hookPermissionResult 权限数据更新为 `result.hookPermissionResult`，确保工具调用后续读取最新状态。
        hookPermissionResult = result.hookPermissionResult
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'hookUpdatedInput':
        // Hook provided updatedInput without making a permission decision (passthrough)
        // Update processedInput so it's used in the normal permission flow
        // processedInput更新为 `result.updatedInput`，确保工具调用后续读取最新状态。
        processedInput = result.updatedInput
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'preventContinuation':
        // shouldPreventContinuation更新为 `result.shouldPreventContinuation`，确保工具调用后续读取最新状态。
        shouldPreventContinuation = result.shouldPreventContinuation
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'stopReason':
        // stopReason更新为 `result.stopReason`，确保工具调用后续读取最新状态。
        stopReason = result.stopReason
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'additionalContext':
        // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        resultingMessages.push(result.message)
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'stop':
        // 调用 getStatsStore，触发工具调用此处需要的副作用。
        getStatsStore()?.observe(
          'pre_tool_hook_duration_ms',
          Date.now() - preToolHookStart,
        )
        // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        resultingMessages.push({
          message: createUserMessage({
            content: [createToolResultStopMessage(toolUseID)],
            toolUseResult: `Error: ${stopReason}`,
            sourceToolAssistantUUID: assistantMessage.uuid,
          }),
        })
        // 返回 `resultingMessages`，作为工具调用这次计算的结果。
        return resultingMessages
    }
  }
  // preToolHookDurationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
  const preToolHookDurationMs = Date.now() - preToolHookStart
  // 调用 getStatsStore，触发工具调用此处需要的副作用。
  getStatsStore()?.observe('pre_tool_hook_duration_ms', preToolHookDurationMs)
  // 满足 `preToolHookDurationMs >= SLOW_PHASE_LOG_THRESHOLD` 时，工具调用执行该分支。
  if (preToolHookDurationMs >= SLOW_PHASE_LOG_THRESHOLD_MS) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Slow PreToolUse hooks: ${preToolHookDurationMs}ms for ${tool.name} (${preToolHookInfos.length} hooks)`,
      { level: 'info' },
    )
  }

  // Emit PreToolUse summary immediately so it's visible while the tool executes.
  // Use wall-clock time (not sum of individual durations) since hooks run in parallel.
  // 只有 `process.env.USER_TYPE === 'ant' && preToolHookInf` 满足时，工具调用才执行该分支。
  if (process.env.USER_TYPE === 'ant' && preToolHookInfos.length > 0) {
    // 满足 `preToolHookDurationMs > HOOK_TIMING_DISPLAY_THRES` 时，工具调用执行该分支。
    if (preToolHookDurationMs > HOOK_TIMING_DISPLAY_THRESHOLD_MS) {
      // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      resultingMessages.push({
        message: createStopHookSummaryMessage(
          preToolHookInfos.length,
          preToolHookInfos,
          [],
          false,
          undefined,
          false,
          'suggestion',
          undefined,
          'PreToolUse',
          preToolHookDurationMs,
        ),
      })
    }
  }

  // toolAttributes 集合 从空对象开始收集键值，后续按名称补齐内容。
  const toolAttributes: Record<string, string | number | boolean> = {}
  // 只有 `processedInput && typeof processedInput === 'obje` 满足时，工具调用才执行该分支。
  if (processedInput && typeof processedInput === 'object') {
    // 只有 `tool.name === FILE_READ_TOOL_NAME && 'file_path'` 满足时，工具调用才执行该分支。
    if (tool.name === FILE_READ_TOOL_NAME && 'file_path' in processedInput) {
      // file_path 路径数据更新为 `String(processedInput.file_path)`，确保工具调用后续读取最新状态。
      toolAttributes.file_path = String(processedInput.file_path)
    // 工具实现 tool Execution在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      (tool.name === FILE_EDIT_TOOL_NAME ||
        tool.name === FILE_WRITE_TOOL_NAME) &&
      'file_path' in processedInput
    ) {
      // file_path 路径数据更新为 `String(processedInput.file_path)`，确保工具调用后续读取最新状态。
      toolAttributes.file_path = String(processedInput.file_path)
    // 工具实现 tool Execution在这里处理 `} else if (tool.name === BASH_TOOL_NAME && 'command' in processedInput)...`，完成这一小步状态转换。
    } else if (tool.name === BASH_TOOL_NAME && 'command' in processedInput) {
      // bashInput保存`processedInput as BashToolInput`，供后续判断或组装使用。
      const bashInput = processedInput as BashToolInput
      // full_command 命令数据更新为 `bashInput.command`，确保工具调用后续读取最新状态。
      toolAttributes.full_command = bashInput.command
    }
  }

  // 调用 startToolSpan，触发工具调用此处需要的副作用。
  startToolSpan(
    tool.name,
    toolAttributes,
    isBetaTracingEnabled() ? jsonStringify(processedInput) : undefined,
  )
  // 调用 startToolBlockedOnUserSpan，触发工具调用此处需要的副作用。
  startToolBlockedOnUserSpan()

  // Check whether we have permission to use the tool,
  // and ask the user for permission if we don't
  // permissionMode 权限数据读取`toolUseContext.getAppState`，供工具调用后续处理使用。
  const permissionMode = toolUseContext.getAppState().toolPermissionContext.mode
  // permissionStart 权限数据记录时间`Date.now`，供工具调用后续处理使用。
  const permissionStart = Date.now()

  // resolved读取`resolveHookPermissionDecision`，供工具调用后续处理使用。
  const resolved = await resolveHookPermissionDecision(
    hookPermissionResult,
    tool,
    processedInput,
    toolUseContext,
    canUseTool,
    assistantMessage,
    toolUseID,
  )
  // permissionDecision 权限数据 命名 `resolved.decision`，让后续代码直接表达这个值的用途。
  const permissionDecision = resolved.decision
  // processedInput更新为 `resolved.input`，确保工具调用后续读取最新状态。
  processedInput = resolved.input
  // permissionDurationMs 权限数据记录时间`Date.now`，供工具调用后续处理使用。
  const permissionDurationMs = Date.now() - permissionStart
  // In auto mode, canUseTool awaits the classifier (side_query) — if that's
  // slow the collapsed view shows "Running…" with no (Ns) tick since
  // bash_progress hasn't started yet. Auto-only: in default mode this timer
  // includes interactive-dialog wait (user think time), which is just noise.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    permissionDurationMs >= SLOW_PHASE_LOG_THRESHOLD_MS &&
    permissionMode === 'auto'
  ) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Slow permission decision: ${permissionDurationMs}ms for ${tool.name} ` +
        `(mode=${permissionMode}, behavior=${permissionDecision.behavior})`,
      { level: 'info' },
    )
  }

  // Emit tool_decision OTel event and code-edit counter if the interactive
  // permission path didn't already log it (headless mode bypasses permission
  // logging, so we need to emit both the generic event and the code-edit
  // counter here)
  // 工具调用在这里按实际状态进入对应分支。
  if (
    permissionDecision.behavior !== 'ask' &&
    !toolUseContext.toolDecisions?.has(toolUseID)
  ) {
    // decision 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const decision =
      permissionDecision.behavior === 'allow' ? 'accept' : 'reject'
    // source保存`decisionReasonToOTelSource`，供工具调用后续处理使用。
    const source = decisionReasonToOTelSource(
      permissionDecision.decisionReason,
      permissionDecision.behavior,
    )
    // 显式忽略 `logOTelEvent('tool_decision', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('tool_decision', {
      decision,
      source,
      tool_name: sanitizeToolNameForAnalytics(tool.name),
    })

    // Increment code-edit tool decision counter for headless mode
    // 满足 `isCodeEditingTool(tool.name)` 时，工具调用执行该分支。
    if (isCodeEditingTool(tool.name)) {
      // 显式忽略 `buildCodeEditToolAttributes(` 的返回值，只保留它触发的副作用。
      void buildCodeEditToolAttributes(
        tool,
        processedInput,
        decision,
        source,
      // 这个回调绑定到 ).then(attributes => getCodeEditToolDecisionCounter()?.add(1, attributes))，负责工具调用在该局部场景下的响应。
      ).then(attributes => getCodeEditToolDecisionCounter()?.add(1, attributes))
    }
  }

  // Add message if permission was granted/denied by PermissionRequest hook
  // 工具调用在这里按实际状态进入对应分支。
  if (
    permissionDecision.decisionReason?.type === 'hook' &&
    permissionDecision.decisionReason.hookName === 'PermissionRequest' &&
    permissionDecision.behavior !== 'ask'
  ) {
    // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    resultingMessages.push({
      message: createAttachmentMessage({
        type: 'hook_permission_decision',
        decision: permissionDecision.behavior,
        toolUseID,
        hookEvent: 'PermissionRequest',
      }),
    })
  }

  // `permissionDecision.behavior` 与 `'allow'` 不一致时刷新派生状态，避免使用过期结果。
  if (permissionDecision.behavior !== 'allow') {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`${tool.name} tool permission denied`)
    // decisionInfo读取`get`，供工具调用后续处理使用。
    const decisionInfo = toolUseContext.toolDecisions?.get(toolUseID)
    // 调用 endToolBlockedOnUserSpan，触发工具调用此处需要的副作用。
    endToolBlockedOnUserSpan('reject', decisionInfo?.source || 'unknown')
    // 调用 endToolSpan，触发工具调用此处需要的副作用。
    endToolSpan()

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_use_can_use_tool_rejected', {
      messageID:
        messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolName: sanitizeToolNameForAnalytics(tool.name),

      queryChainId: toolUseContext.queryTracking
        ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryDepth: toolUseContext.queryTracking?.depth,
      ...(mcpServerType && {
        mcpServerType:
          mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(mcpServerBaseUrl && {
        mcpServerBaseUrl:
          mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(requestId && {
        requestId:
          requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...mcpToolDetailsForAnalytics(tool.name, mcpServerType, mcpServerBaseUrl),
    })
    // errorMessage 消息数据保存`permissionDecision.message`，供后续判断或组装使用。
    let errorMessage = permissionDecision.message
    // Only use generic "Execution stopped" message if we don't have a detailed hook message
    // 只有 `shouldPreventContinuation && !errorMessage` 满足时，工具调用才执行该分支。
    if (shouldPreventContinuation && !errorMessage) {
      // errorMessage 消息数据更新为 ``Execution stopped by PreToolUse hook${stopReason ? `: ${...`，确保工具调用后续读取最新状态。
      errorMessage = `Execution stopped by PreToolUse hook${stopReason ? `: ${stopReason}` : ''}`
    }

    // Build top-level content: tool_result (text-only for is_error compatibility) + images alongside
    // messageContent 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
    const messageContent: ContentBlockParam[] = [
      {
        type: 'tool_result',
        content: errorMessage,
        is_error: true,
        tool_use_id: toolUseID,
      },
    ]

    // Add image blocks at top level (not inside tool_result, which rejects non-text with is_error)
    // rejectContentBlocks 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const rejectContentBlocks =
      permissionDecision.behavior === 'ask'
        ? permissionDecision.contentBlocks
        : undefined
    // 满足 `rejectContentBlocks?.length` 时，工具调用执行该分支。
    if (rejectContentBlocks?.length) {
      // messageContent 消息数据追加新条目，保持收集顺序与输入顺序一致。
      messageContent.push(...rejectContentBlocks)
    }

    // Generate sequential imagePasteIds so each image renders with a distinct label
    // rejectImageIds 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let rejectImageIds: number[] | undefined
    // 满足 `rejectContentBlocks?.length` 时，工具调用执行该分支。
    if (rejectContentBlocks?.length) {
      // imageCount 数量统计`count`，供工具调用后续处理使用。
      const imageCount = count(
        rejectContentBlocks,
        // 这个回调绑定到 (b: ContentBlockParam) => b.type === 'image',，负责工具调用在该局部场景下的响应。
        (b: ContentBlockParam) => b.type === 'image',
      )
      // 满足 `imageCount > 0` 时，工具调用执行该分支。
      if (imageCount > 0) {
        // startId读取`getNextImagePasteId`，供工具调用后续处理使用。
        const startId = getNextImagePasteId(toolUseContext.messages)
        // rejectImageIds 集合更新为 `Array.from(`，确保工具调用后续读取最新状态。
        rejectImageIds = Array.from(
          { length: imageCount },
          // 这个回调绑定到 (_, i) => startId + i,，负责工具调用在该局部场景下的响应。
          (_, i) => startId + i,
        )
      }
    }

    // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    resultingMessages.push({
      message: createUserMessage({
        content: messageContent,
        imagePasteIds: rejectImageIds,
        toolUseResult: `Error: ${errorMessage}`,
        sourceToolAssistantUUID: assistantMessage.uuid,
      }),
    })

    // Run PermissionDenied hooks for auto mode classifier denials.
    // If a hook returns {retry: true}, tell the model it may retry.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('TRANSCRIPT_CLASSIFIER') &&
      permissionDecision.decisionReason?.type === 'classifier' &&
      permissionDecision.decisionReason.classifier === 'auto-mode'
    ) {
      // hookSaysRetry标记工具实现 tool Execution是否启用对应路径。
      let hookSaysRetry = false
      // 逐项读取 `executePermissionDeniedHooks(` 中的结果，按输入顺序推进工具实现 tool Execution。
      for await (const result of executePermissionDeniedHooks(
        tool.name,
        toolUseID,
        processedInput,
        permissionDecision.decisionReason.reason ?? 'Permission denied',
        toolUseContext,
        permissionMode,
        toolUseContext.abortController.signal,
      )) {
        // 满足 `result.retry` 时，工具调用执行该分支。
        if (result.retry) hookSaysRetry = true
      }
      // 满足 `hookSaysRetry` 时，工具调用执行该分支。
      if (hookSaysRetry) {
        // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        resultingMessages.push({
          message: createUserMessage({
            content:
              'The PermissionDenied hook indicated this command is now approved. You may retry it if you would like.',
            isMeta: true,
          }),
        })
      }
    }

    // 返回 `resultingMessages`，作为工具调用这次计算的结果。
    return resultingMessages
  }
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_tool_use_can_use_tool_allowed', {
    messageID:
      messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    toolName: sanitizeToolNameForAnalytics(tool.name),

    queryChainId: toolUseContext.queryTracking
      ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    queryDepth: toolUseContext.queryTracking?.depth,
    ...(mcpServerType && {
      mcpServerType:
        mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...(mcpServerBaseUrl && {
      mcpServerBaseUrl:
        mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...(requestId && {
      requestId:
        requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...mcpToolDetailsForAnalytics(tool.name, mcpServerType, mcpServerBaseUrl),
  })

  // Use the updated input from permissions if provided
  // (Don't overwrite if undefined - processedInput may have been modified by passthrough hooks)
  // `permissionDecision.updatedInput` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (permissionDecision.updatedInput !== undefined) {
    // processedInput更新为 `permissionDecision.updatedInput`，确保工具调用后续读取最新状态。
    processedInput = permissionDecision.updatedInput
  }

  // Prepare tool parameters for logging in tool_result event.
  // Gated by OTEL_LOG_TOOL_DETAILS — tool parameters can contain sensitive
  // content (bash commands, MCP server names, etc.) so they're opt-in only.
  // telemetryToolInput保存`extractToolInputForTelemetry`，供工具调用后续处理使用。
  const telemetryToolInput = extractToolInputForTelemetry(processedInput)
  // toolParameters 集合 从空对象开始收集键值，后续按名称补齐内容。
  let toolParameters: Record<string, unknown> = {}
  // 满足 `isToolDetailsLoggingEnabled()` 时，工具调用执行该分支。
  if (isToolDetailsLoggingEnabled()) {
    // 只有 `tool.name === BASH_TOOL_NAME && 'command' in proc` 满足时，工具调用才执行该分支。
    if (tool.name === BASH_TOOL_NAME && 'command' in processedInput) {
      // bashInput保存`processedInput as BashToolInput`，供后续判断或组装使用。
      const bashInput = processedInput as BashToolInput
      // commandParts 命令数据格式化`command.trim`，供工具调用后续处理使用。
      const commandParts = bashInput.command.trim().split(/\s+/)
      // bashCommand 命令数据标记工具实现 tool Execution是否启用对应路径。
      const bashCommand = commandParts[0] || ''

      // toolParameters 集合更新为 `{`，确保工具调用后续读取最新状态。
      toolParameters = {
        bash_command: bashCommand,
        full_command: bashInput.command,
        ...(bashInput.timeout !== undefined && {
          timeout: bashInput.timeout,
        }),
        ...(bashInput.description !== undefined && {
          description: bashInput.description,
        }),
        ...('dangerouslyDisableSandbox' in bashInput && {
          dangerouslyDisableSandbox: bashInput.dangerouslyDisableSandbox,
        }),
      }
    }

    // mcpDetails 集合保存`extractMcpToolDetails`，供工具调用后续处理使用。
    const mcpDetails = extractMcpToolDetails(tool.name)
    // 满足 `mcpDetails` 时，工具调用执行该分支。
    if (mcpDetails) {
      // mcp_server_name更新为 `mcpDetails.serverName`，确保工具调用后续读取最新状态。
      toolParameters.mcp_server_name = mcpDetails.serverName
      // mcp_tool_name更新为 `mcpDetails.mcpToolName`，确保工具调用后续读取最新状态。
      toolParameters.mcp_tool_name = mcpDetails.mcpToolName
    }
    // skillName保存`extractSkillName`，供工具调用后续处理使用。
    const skillName = extractSkillName(tool.name, processedInput)
    // 满足 `skillName` 时，工具调用执行该分支。
    if (skillName) {
      // skill_name更新为 `skillName`，确保工具调用后续读取最新状态。
      toolParameters.skill_name = skillName
    }
  }

  // decisionInfo读取`get`，供工具调用后续处理使用。
  const decisionInfo = toolUseContext.toolDecisions?.get(toolUseID)
  // 调用 endToolBlockedOnUserSpan，触发工具调用此处需要的副作用。
  endToolBlockedOnUserSpan(
    decisionInfo?.decision || 'unknown',
    decisionInfo?.source || 'unknown',
  )
  // 调用 startToolExecutionSpan，触发工具调用此处需要的副作用。
  startToolExecutionSpan()

  // startTime记录时间`Date.now`，供工具调用后续处理使用。
  const startTime = Date.now()

  // 调用 startSessionActivity，触发工具调用此处需要的副作用。
  startSessionActivity('tool_exec')
  // If processedInput still points at the backfill clone, no hook/permission
  // replaced it — pass the pre-backfill callInput so call() sees the model's
  // original field values. Otherwise converge on the hook-supplied input.
  // Permission/hook flows may return a fresh object derived from the
  // backfilled clone (e.g. via inputSchema.parse). If its file_path matches
  // the backfill-expanded value, restore the model's original so the tool
  // result string embeds the path the model emitted — keeps transcript/VCR
  // hashes stable. Other hook modifications flow through unchanged.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    backfilledClone &&
    processedInput !== callInput &&
    typeof processedInput === 'object' &&
    processedInput !== null &&
    'file_path' in processedInput &&
    'file_path' in (callInput as Record<string, unknown>) &&
    (processedInput as Record<string, unknown>).file_path ===
      (backfilledClone as Record<string, unknown>).file_path
  ) {
    // callInput更新为 `{`，确保工具调用后续读取最新状态。
    callInput = {
      ...processedInput,
      file_path: (callInput as Record<string, unknown>).file_path,
    } as typeof processedInput
  // 工具实现 tool Execution在这里处理 `} else if (processedInput !== backfilledClone) {`，完成这一小步状态转换。
  } else if (processedInput !== backfilledClone) {
    // callInput更新为 `processedInput`，确保工具调用后续读取最新状态。
    callInput = processedInput
  }
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`tool.call`，供工具调用后续处理使用。
    const result = await tool.call(
      callInput,
      {
        ...toolUseContext,
        toolUseId: toolUseID,
        userModified: permissionDecision.userModified ?? false,
      },
      canUseTool,
      assistantMessage,
      // progress 集合更新为 `> {`，确保工具调用后续读取最新状态。
      progress => {
        // 调用 onToolProgress，触发工具调用此处需要的副作用。
        onToolProgress({
          toolUseID: progress.toolUseID,
          data: progress.data,
        })
      },
    )
    // durationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
    const durationMs = Date.now() - startTime
    // 调用 addToToolDuration，触发工具调用此处需要的副作用。
    addToToolDuration(durationMs)

    // Log tool content/output as span event if enabled
    // 当 `result.data && typeof result.data` 匹配 `'object'` 时，工具调用执行对应分支。
    if (result.data && typeof result.data === 'object') {
      // contentAttributes 集合 从空对象开始收集键值，后续按名称补齐内容。
      const contentAttributes: Record<string, string | number | boolean> = {}

      // Read tool: capture file_path and content
      // 只有 `tool.name === FILE_READ_TOOL_NAME && 'content' in` 满足时，工具调用才执行该分支。
      if (tool.name === FILE_READ_TOOL_NAME && 'content' in result.data) {
        // 满足 `'file_path' in processedInput` 时，工具调用执行该分支。
        if ('file_path' in processedInput) {
          // file_path 路径数据更新为 `String(processedInput.file_path)`，确保工具调用后续读取最新状态。
          contentAttributes.file_path = String(processedInput.file_path)
        }
        // 文本内容更新为 `String(result.data.content)`，确保工具调用后续读取最新状态。
        contentAttributes.content = String(result.data.content)
      }

      // Edit/Write tools: capture file_path and diff
      // 工具调用在这里按实际状态进入对应分支。
      if (
        (tool.name === FILE_EDIT_TOOL_NAME ||
          tool.name === FILE_WRITE_TOOL_NAME) &&
        'file_path' in processedInput
      ) {
        // file_path 路径数据更新为 `String(processedInput.file_path)`，确保工具调用后续读取最新状态。
        contentAttributes.file_path = String(processedInput.file_path)

        // For Edit, capture the actual changes made
        // 只有 `tool.name === FILE_EDIT_TOOL_NAME && 'diff' in re` 满足时，工具调用才执行该分支。
        if (tool.name === FILE_EDIT_TOOL_NAME && 'diff' in result.data) {
          // diff更新为 `String(result.data.diff)`，确保工具调用后续读取最新状态。
          contentAttributes.diff = String(result.data.diff)
        }
        // For Write, capture the written content
        // 只有 `tool.name === FILE_WRITE_TOOL_NAME && 'content' i` 满足时，工具调用才执行该分支。
        if (tool.name === FILE_WRITE_TOOL_NAME && 'content' in processedInput) {
          // 文本内容更新为 `String(processedInput.content)`，确保工具调用后续读取最新状态。
          contentAttributes.content = String(processedInput.content)
        }
      }

      // Bash tool: capture command
      // 只有 `tool.name === BASH_TOOL_NAME && 'command' in proc` 满足时，工具调用才执行该分支。
      if (tool.name === BASH_TOOL_NAME && 'command' in processedInput) {
        // bashInput保存`processedInput as BashToolInput`，供后续判断或组装使用。
        const bashInput = processedInput as BashToolInput
        // bash_command 命令数据更新为 `bashInput.command`，确保工具调用后续读取最新状态。
        contentAttributes.bash_command = bashInput.command
        // Also capture output if available
        // 满足 `'output' in result.data` 时，工具调用执行该分支。
        if ('output' in result.data) {
          // output更新为 `String(result.data.output)`，确保工具调用后续读取最新状态。
          contentAttributes.output = String(result.data.output)
        }
      }

      // 满足 `Object.keys(contentAttributes).length > 0` 时，工具调用执行该分支。
      if (Object.keys(contentAttributes).length > 0) {
        // 调用 addToolContentEvent，触发工具调用此处需要的副作用。
        addToolContentEvent('tool.output', contentAttributes)
      }
    }

    // Capture structured output from tool result if present
    // 当 `typeof result` 匹配 `'object' && 'structured_out...` 时，工具调用执行对应分支。
    if (typeof result === 'object' && 'structured_output' in result) {
      // Store the structured output in an attachment message
      // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      resultingMessages.push({
        message: createAttachmentMessage({
          type: 'structured_output',
          data: result.structured_output,
        }),
      })
    }

    // 调用 endToolExecutionSpan，触发工具调用此处需要的副作用。
    endToolExecutionSpan({ success: true })
    // Pass tool result for new_context logging
    // toolResultStr 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const toolResultStr =
      result.data && typeof result.data === 'object'
        ? jsonStringify(result.data)
        : String(result.data ?? '')
    // 调用 endToolSpan，触发工具调用此处需要的副作用。
    endToolSpan(toolResultStr)

    // Map the tool result to API format once and cache it. This block is reused
    // by addToolResult (skipping the remap) and measured here for analytics.
    // mappedToolResultBlock派生`tool.mapToolResultToToolResultBlockParam`，供工具调用后续处理使用。
    const mappedToolResultBlock = tool.mapToolResultToToolResultBlockParam(
      result.data,
      toolUseID,
    )
    // mappedContent派生`mappedToolResultBlock.content`，供后续判断或组装使用。
    const mappedContent = mappedToolResultBlock.content
    // toolResultSizeBytes 集合标记工具实现 tool Execution是否启用对应路径。
    const toolResultSizeBytes = !mappedContent
      ? 0
      : typeof mappedContent === 'string'
        ? mappedContent.length
        : jsonStringify(mappedContent).length

    // Extract file extension for file-related tools
    // fileExtension 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let fileExtension: ReturnType<typeof getFileExtensionForAnalytics>
    // 只有 `processedInput && typeof processedInput === 'obje` 满足时，工具调用才执行该分支。
    if (processedInput && typeof processedInput === 'object') {
      // 工具调用在这里按实际状态进入对应分支。
      if (
        (tool.name === FILE_READ_TOOL_NAME ||
          tool.name === FILE_EDIT_TOOL_NAME ||
          tool.name === FILE_WRITE_TOOL_NAME) &&
        'file_path' in processedInput
      ) {
        // fileExtension 文件数据更新为 `getFileExtensionForAnalytics(`，确保工具调用后续读取最新状态。
        fileExtension = getFileExtensionForAnalytics(
          String(processedInput.file_path),
        )
      // 工具实现 tool Execution在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        tool.name === NOTEBOOK_EDIT_TOOL_NAME &&
        'notebook_path' in processedInput
      ) {
        // fileExtension 文件数据更新为 `getFileExtensionForAnalytics(`，确保工具调用后续读取最新状态。
        fileExtension = getFileExtensionForAnalytics(
          String(processedInput.notebook_path),
        )
      // 工具实现 tool Execution在这里处理 `} else if (tool.name === BASH_TOOL_NAME && 'command' in processedInput)...`，完成这一小步状态转换。
      } else if (tool.name === BASH_TOOL_NAME && 'command' in processedInput) {
        // bashInput保存`processedInput as BashToolInput`，供后续判断或组装使用。
        const bashInput = processedInput as BashToolInput
        // fileExtension 文件数据更新为 `getFileExtensionsFromBashCommand(`，确保工具调用后续读取最新状态。
        fileExtension = getFileExtensionsFromBashCommand(
          bashInput.command,
          bashInput._simulatedSedEdit?.filePath,
        )
      }
    }

    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tool_use_success', {
      messageID:
        messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      toolName: sanitizeToolNameForAnalytics(tool.name),
      isMcp: tool.isMcp ?? false,
      durationMs,
      preToolHookDurationMs,
      toolResultSizeBytes,
      ...(fileExtension !== undefined && { fileExtension }),

      queryChainId: toolUseContext.queryTracking
        ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      queryDepth: toolUseContext.queryTracking?.depth,
      ...(mcpServerType && {
        mcpServerType:
          mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(mcpServerBaseUrl && {
        mcpServerBaseUrl:
          mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...(requestId && {
        requestId:
          requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      ...mcpToolDetailsForAnalytics(tool.name, mcpServerType, mcpServerBaseUrl),
    })

    // Enrich tool parameters with git commit ID from successful git commit output
    // 工具调用在这里按实际状态进入对应分支。
    if (
      isToolDetailsLoggingEnabled() &&
      (tool.name === BASH_TOOL_NAME || tool.name === POWERSHELL_TOOL_NAME) &&
      'command' in processedInput &&
      typeof processedInput.command === 'string' &&
      processedInput.command.match(/\bgit\s+commit\b/) &&
      result.data &&
      typeof result.data === 'object' &&
      'stdout' in result.data
    ) {
      // gitCommitId解析`parseGitCommitId`，供工具调用后续处理使用。
      const gitCommitId = parseGitCommitId(String(result.data.stdout))
      // 满足 `gitCommitId` 时，工具调用执行该分支。
      if (gitCommitId) {
        // git_commit_id更新为 `gitCommitId`，确保工具调用后续读取最新状态。
        toolParameters.git_commit_id = gitCommitId
      }
    }

    // Log tool result event for OTLP with tool parameters and decision context
    // mcpServerScope保存`isMcpTool`，供工具调用后续处理使用。
    const mcpServerScope = isMcpTool(tool)
      ? getMcpServerScopeFromToolName(tool.name)
      : null

    // 显式忽略 `logOTelEvent('tool_result', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('tool_result', {
      tool_name: sanitizeToolNameForAnalytics(tool.name),
      success: 'true',
      duration_ms: String(durationMs),
      ...(Object.keys(toolParameters).length > 0 && {
        tool_parameters: jsonStringify(toolParameters),
      }),
      ...(telemetryToolInput && { tool_input: telemetryToolInput }),
      tool_result_size_bytes: String(toolResultSizeBytes),
      ...(decisionInfo && {
        decision_source: decisionInfo.source,
        decision_type: decisionInfo.decision,
      }),
      ...(mcpServerScope && { mcp_server_scope: mcpServerScope }),
    })

    // Run PostToolUse hooks
    // toolOutput 命名 `result.data`，让后续代码直接表达这个值的用途。
    let toolOutput = result.data
    // hookResults 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const hookResults = []
    // toolContextModifier保存`result.contextModifier`，供后续判断或组装使用。
    const toolContextModifier = result.contextModifier
    // mcpMeta 命名 `result.mcpMeta`，让后续代码直接表达这个值的用途。
    const mcpMeta = result.mcpMeta

    // addToolResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function addToolResult(
      toolUseResult: unknown,
      preMappedBlock?: ToolResultBlockParam,
    ) {
      // Use the pre-mapped block when available (non-MCP tools where hooks
      // don't modify the output), otherwise map from scratch.
      // toolResultBlock 命名 `preMappedBlock`，让后续代码直接表达这个值的用途。
      const toolResultBlock = preMappedBlock
        ? await processPreMappedToolResultBlock(
            preMappedBlock,
            tool.name,
            tool.maxResultSizeChars,
          )
        : await processToolResultBlock(tool, toolUseResult, toolUseID)

      // Build content blocks - tool result first, then optional feedback
      // contentBlocks 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const contentBlocks: ContentBlockParam[] = [toolResultBlock]
      // Add accept feedback if user provided feedback when approving
      // (acceptFeedback only exists on PermissionAllowDecision, which is guaranteed here)
      // 工具调用在这里按实际状态进入对应分支。
      if (
        'acceptFeedback' in permissionDecision &&
        permissionDecision.acceptFeedback
      ) {
        // contentBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
        contentBlocks.push({
          type: 'text',
          text: permissionDecision.acceptFeedback,
        })
      }

      // Add content blocks (e.g., pasted images) from the permission decision
      // allowContentBlocks 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const allowContentBlocks =
        'contentBlocks' in permissionDecision
          ? permissionDecision.contentBlocks
          : undefined
      // 满足 `allowContentBlocks?.length` 时，工具调用执行该分支。
      if (allowContentBlocks?.length) {
        // contentBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
        contentBlocks.push(...allowContentBlocks)
      }

      // Generate sequential imagePasteIds so each image renders with a distinct label
      // allowImageIds 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let allowImageIds: number[] | undefined
      // 满足 `allowContentBlocks?.length` 时，工具调用执行该分支。
      if (allowContentBlocks?.length) {
        // imageCount 数量统计`count`，供工具调用后续处理使用。
        const imageCount = count(
          allowContentBlocks,
          // 这个回调绑定到 (b: ContentBlockParam) => b.type === 'image',，负责工具调用在该局部场景下的响应。
          (b: ContentBlockParam) => b.type === 'image',
        )
        // 满足 `imageCount > 0` 时，工具调用执行该分支。
        if (imageCount > 0) {
          // startId读取`getNextImagePasteId`，供工具调用后续处理使用。
          const startId = getNextImagePasteId(toolUseContext.messages)
          // allowImageIds 集合更新为 `Array.from(`，确保工具调用后续读取最新状态。
          allowImageIds = Array.from(
            { length: imageCount },
            // 这个回调绑定到 (_, i) => startId + i,，负责工具调用在该局部场景下的响应。
            (_, i) => startId + i,
          )
        }
      }

      // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      resultingMessages.push({
        message: createUserMessage({
          content: contentBlocks,
          imagePasteIds: allowImageIds,
          toolUseResult:
            toolUseContext.agentId && !toolUseContext.preserveToolUseResults
              ? undefined
              : toolUseResult,
          mcpMeta: toolUseContext.agentId ? undefined : mcpMeta,
          sourceToolAssistantUUID: assistantMessage.uuid,
        }),
        contextModifier: toolContextModifier
          ? {
              toolUseID: toolUseID,
              modifyContext: toolContextModifier,
            }
          : undefined,
      })
    }

    // TOOD(hackyon): refactor so we don't have different experiences for MCP tools
    // 满足 `!isMcpTool(tool)` 时，工具调用执行该分支。
    if (!isMcpTool(tool)) {
      // 等待 `addToolResult(toolOutput, mappedToolResultBlock)` 完成，再继续工具实现 tool Execution的异步流程。
      await addToolResult(toolOutput, mappedToolResultBlock)
    }

    // postToolHookInfos 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const postToolHookInfos: StopHookInfo[] = []
    // postToolHookStart记录时间`Date.now`，供工具调用后续处理使用。
    const postToolHookStart = Date.now()
    // 逐项读取 `runPostToolUseHooks(` 中的hookResult，按输入顺序推进工具实现 tool Execution。
    for await (const hookResult of runPostToolUseHooks(
      toolUseContext,
      tool,
      toolUseID,
      assistantMessage.message.id,
      processedInput,
      toolOutput,
      requestId,
      mcpServerType,
      mcpServerBaseUrl,
    )) {
      // 满足 `'updatedMCPToolOutput' in hookResult` 时，工具调用执行该分支。
      if ('updatedMCPToolOutput' in hookResult) {
        // 满足 `isMcpTool(tool)` 时，工具调用执行该分支。
        if (isMcpTool(tool)) {
          // toolOutput更新为 `hookResult.updatedMCPToolOutput`，确保工具调用后续读取最新状态。
          toolOutput = hookResult.updatedMCPToolOutput
        }
      // 工具实现 tool Execution在这里处理 `} else if (isMcpTool(tool)) {`，完成这一小步状态转换。
      } else if (isMcpTool(tool)) {
        // hookResults 集合追加新条目，保持收集顺序与输入顺序一致。
        hookResults.push(hookResult)
        // 当 `hookResult.message.type` 匹配 `'attachment'` 时，工具调用执行对应分支。
        if (hookResult.message.type === 'attachment') {
          // att 命名 `hookResult.message.attachment`，让后续代码直接表达这个值的用途。
          const att = hookResult.message.attachment
          // 工具调用在这里按实际状态进入对应分支。
          if (
            'command' in att &&
            att.command !== undefined &&
            'durationMs' in att &&
            att.durationMs !== undefined
          ) {
            // postToolHookInfos 集合追加新条目，保持收集顺序与输入顺序一致。
            postToolHookInfos.push({
              command: att.command,
              durationMs: att.durationMs,
            })
          }
        }
      } else {
        // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        resultingMessages.push(hookResult)
        // 当 `hookResult.message.type` 匹配 `'attachment'` 时，工具调用执行对应分支。
        if (hookResult.message.type === 'attachment') {
          // att 命名 `hookResult.message.attachment`，让后续代码直接表达这个值的用途。
          const att = hookResult.message.attachment
          // 工具调用在这里按实际状态进入对应分支。
          if (
            'command' in att &&
            att.command !== undefined &&
            'durationMs' in att &&
            att.durationMs !== undefined
          ) {
            // postToolHookInfos 集合追加新条目，保持收集顺序与输入顺序一致。
            postToolHookInfos.push({
              command: att.command,
              durationMs: att.durationMs,
            })
          }
        }
      }
    }
    // postToolHookDurationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
    const postToolHookDurationMs = Date.now() - postToolHookStart
    // 满足 `postToolHookDurationMs >= SLOW_PHASE_LOG_THRESHOL` 时，工具调用执行该分支。
    if (postToolHookDurationMs >= SLOW_PHASE_LOG_THRESHOLD_MS) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Slow PostToolUse hooks: ${postToolHookDurationMs}ms for ${tool.name} (${postToolHookInfos.length} hooks)`,
        { level: 'info' },
      )
    }

    // 满足 `isMcpTool(tool)` 时，工具调用执行该分支。
    if (isMcpTool(tool)) {
      // 等待 `addToolResult(toolOutput)` 完成，再继续工具实现 tool Execution的异步流程。
      await addToolResult(toolOutput)
    }

    // Show PostToolUse hook timing inline below tool result when > 500ms.
    // Use wall-clock time (not sum of individual durations) since hooks run in parallel.
    // 只有 `process.env.USER_TYPE === 'ant' && postToolHookIn` 满足时，工具调用才执行该分支。
    if (process.env.USER_TYPE === 'ant' && postToolHookInfos.length > 0) {
      // 满足 `postToolHookDurationMs > HOOK_TIMING_DISPLAY_THRE` 时，工具调用执行该分支。
      if (postToolHookDurationMs > HOOK_TIMING_DISPLAY_THRESHOLD_MS) {
        // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        resultingMessages.push({
          message: createStopHookSummaryMessage(
            postToolHookInfos.length,
            postToolHookInfos,
            [],
            false,
            undefined,
            false,
            'suggestion',
            undefined,
            'PostToolUse',
            postToolHookDurationMs,
          ),
        })
      }
    }

    // If the tool provided new messages, add them to the list to return.
    // 只有 `result.newMessages && result.newMessages.length >` 满足时，工具调用才执行该分支。
    if (result.newMessages && result.newMessages.length > 0) {
      // 按顺序遍历 `result.newMessages` 中的消息，逐个交给工具调用处理。
      for (const message of result.newMessages) {
        // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        resultingMessages.push({ message })
      }
    }
    // If hook indicated to prevent continuation after successful execution, yield a stop reason message
    // 满足 `shouldPreventContinuation` 时，工具调用执行该分支。
    if (shouldPreventContinuation) {
      // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      resultingMessages.push({
        message: createAttachmentMessage({
          type: 'hook_stopped_continuation',
          message: stopReason || 'Execution stopped by hook',
          hookName: `PreToolUse:${tool.name}`,
          toolUseID: toolUseID,
          hookEvent: 'PreToolUse',
        }),
      })
    }

    // Yield the remaining hook results after the other messages are sent
    // 按顺序遍历 `hookResults` 中的hookResult，逐个交给工具调用处理。
    for (const hookResult of hookResults) {
      // resultingMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      resultingMessages.push(hookResult)
    }
    // 返回 `resultingMessages`，作为工具调用这次计算的结果。
    return resultingMessages
  } catch (error) {
    // durationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
    const durationMs = Date.now() - startTime
    // 调用 addToToolDuration，触发工具调用此处需要的副作用。
    addToToolDuration(durationMs)

    // 调用 endToolExecutionSpan，触发工具调用此处需要的副作用。
    endToolExecutionSpan({
      success: false,
      error: errorMessage(error),
    })
    // 调用 endToolSpan，触发工具调用此处需要的副作用。
    endToolSpan()

    // Handle MCP auth errors by updating the client status to 'needs-auth'
    // This updates the /mcp display to show the server needs re-authorization
    // 满足 `error instanceof McpAuthError` 时，工具调用执行该分支。
    if (error instanceof McpAuthError) {
      // toolUseContext.setAppState 写入新的状态值，使工具调用后续读取保持一致。
      toolUseContext.setAppState(prevState => {
        // serverName保存`error.serverName`，供工具实现 tool Execution后续判断或输出使用。
        const serverName = error.serverName
        // existingClientIndex 索引筛选`clients.findIndex`，供工具调用后续处理使用。
        const existingClientIndex = prevState.mcp.clients.findIndex(
          // c更新为 `> c.name === serverName`，确保工具调用后续读取最新状态。
          c => c.name === serverName,
        )
        // 满足 `existingClientIndex === -1` 时，工具调用执行该分支。
        if (existingClientIndex === -1) {
          // 返回 `prevState`，作为工具调用这次计算的结果。
          return prevState
        }
        // existingClient 命名 `prevState.mcp.clients[existingClientIndex]`，让后续代码直接表达这个值的用途。
        const existingClient = prevState.mcp.clients[existingClientIndex]
        // Only update if client was connected (don't overwrite other states)
        // `!existingClient || existingClient.type` 与 `'conne` 不一致时刷新派生状态，避免使用过期结果。
        if (!existingClient || existingClient.type !== 'connected') {
          // 返回 `prevState`，作为工具调用这次计算的结果。
          return prevState
        }
        // updatedClients 集合 聚合成有序列表，保持后续遍历顺序稳定。
        const updatedClients = [...prevState.mcp.clients]
        // updatedClients[existingClientIndex 索引更新为 `{`，确保工具实现 tool Execution后续读取最新状态。
        updatedClients[existingClientIndex] = {
          name: serverName,
          type: 'needs-auth' as const,
          config: existingClient.config,
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          ...prevState,
          mcp: {
            ...prevState.mcp,
            clients: updatedClients,
          },
        }
      })
    }

    // 满足 `!(error instanceof AbortError)` 时，工具调用执行该分支。
    if (!(error instanceof AbortError)) {
      // errorMsg 错误信息保存`errorMessage`，供工具调用后续处理使用。
      const errorMsg = errorMessage(error)
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `${tool.name} tool error (${durationMs}ms): ${errorMsg.slice(0, 200)}`,
      )
      // 满足 `!(error instanceof ShellError)` 时，工具调用执行该分支。
      if (!(error instanceof ShellError)) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(error)
      }
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_use_error', {
        messageID:
          messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        toolName: sanitizeToolNameForAnalytics(tool.name),
        error: classifyToolError(
          error,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        isMcp: tool.isMcp ?? false,

        queryChainId: toolUseContext.queryTracking
          ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        queryDepth: toolUseContext.queryTracking?.depth,
        ...(mcpServerType && {
          mcpServerType:
            mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(mcpServerBaseUrl && {
          mcpServerBaseUrl:
            mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(requestId && {
          requestId:
            requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...mcpToolDetailsForAnalytics(
          tool.name,
          mcpServerType,
          mcpServerBaseUrl,
        ),
      })
      // Log tool result error event for OTLP with tool parameters and decision context
      // mcpServerScope保存`isMcpTool`，供工具调用后续处理使用。
      const mcpServerScope = isMcpTool(tool)
        ? getMcpServerScopeFromToolName(tool.name)
        : null

      // 显式忽略 `logOTelEvent('tool_result', {` 的返回值，只保留它触发的副作用。
      void logOTelEvent('tool_result', {
        tool_name: sanitizeToolNameForAnalytics(tool.name),
        use_id: toolUseID,
        success: 'false',
        duration_ms: String(durationMs),
        error: errorMessage(error),
        ...(Object.keys(toolParameters).length > 0 && {
          tool_parameters: jsonStringify(toolParameters),
        }),
        ...(telemetryToolInput && { tool_input: telemetryToolInput }),
        ...(decisionInfo && {
          decision_source: decisionInfo.source,
          decision_type: decisionInfo.decision,
        }),
        ...(mcpServerScope && { mcp_server_scope: mcpServerScope }),
      })
    }
    // 文本内容格式化`formatError`，供工具调用后续处理使用。
    const content = formatError(error)

    // Determine if this was a user interrupt
    // isInterrupt标记工具实现 tool Execution是否启用对应路径。
    const isInterrupt = error instanceof AbortError

    // Run PostToolUseFailure hooks
    // hookMessages 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
    const hookMessages: MessageUpdateLazy<
      AttachmentMessage | ProgressMessage<HookProgress>
    >[] = []
    // 逐项读取 `runPostToolUseFailureHooks(` 中的hookResult，按输入顺序推进工具实现 tool Execution。
    for await (const hookResult of runPostToolUseFailureHooks(
      toolUseContext,
      tool,
      toolUseID,
      messageId,
      processedInput,
      content,
      isInterrupt,
      requestId,
      mcpServerType,
      mcpServerBaseUrl,
    )) {
      // hookMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      hookMessages.push(hookResult)
    }

    // 返回列表结果，保留工具调用已经排好的条目顺序。
    return [
      {
        message: createUserMessage({
          content: [
            {
              type: 'tool_result',
              content,
              is_error: true,
              tool_use_id: toolUseID,
            },
          ],
          toolUseResult: `Error: ${content}`,
          mcpMeta: toolUseContext.agentId
            ? undefined
            : error instanceof
                McpToolCallError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
              ? error.mcpMeta
              : undefined,
          sourceToolAssistantUUID: assistantMessage.uuid,
        }),
      },
      ...hookMessages,
    ]
  } finally {
    // 调用 stopSessionActivity，触发工具调用此处需要的副作用。
    stopSessionActivity('tool_exec')
    // Clean up decision info after logging
    // 满足 `decisionInfo` 时，工具调用执行该分支。
    if (decisionInfo) {
      // 调用 toolUseContext.toolDecisions?.delete(toolUseID)，完成这一处局部操作。
      toolUseContext.toolDecisions?.delete(toolUseID)
    }
  }
}
