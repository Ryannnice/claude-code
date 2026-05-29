// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import type {
  Base64ImageSource,
  ContentBlockParam,
  MessageParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 引入 Client，将 @modelcontextprotocol/sdk/client/index.js 中已经封装好的能力接到本文件流程里。
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  SSEClientTransport,
  type SSEClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/sse.js'
// 引入 StdioClientTransport，将 @modelcontextprotocol/sdk/client/stdio.js 中已经封装好的能力接到本文件流程里。
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  StreamableHTTPClientTransport,
  type StreamableHTTPClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  createFetchWithInit,
  type FetchLike,
  type Transport,
} from '@modelcontextprotocol/sdk/shared/transport.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  CallToolResultSchema,
  ElicitRequestSchema,
  type ElicitRequestURLParams,
  type ElicitResult,
  ErrorCode,
  type JSONRPCMessage,
  type ListPromptsResult,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListRootsRequestSchema,
  type ListToolsResult,
  ListToolsResultSchema,
  McpError,
  type PromptMessage,
  type ResourceLink,
} from '@modelcontextprotocol/sdk/types.js'
// 引入 mapValues，将 lodash-es/mapValues.js 中已经封装好的能力接到本文件流程里。
import mapValues from 'lodash-es/mapValues.js'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 zipObject，将 lodash-es/zipObject.js 中已经封装好的能力接到本文件流程里。
import zipObject from 'lodash-es/zipObject.js'
// 引入 pMap，将 p-map 中已经封装好的能力接到本文件流程里。
import pMap from 'p-map'
// 引入 getOriginalCwd、getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionId } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准MCP 服务的数据契约。
import type { Command } from '../../commands.js'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 引入 PRODUCT_URL，将 ../../constants/product.js 中已经封装好的能力接到本文件流程里。
import { PRODUCT_URL } from '../../constants/product.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准MCP 服务的数据契约。
import type { AppState } from '../../state/AppState.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type Tool,
  type ToolCallProgress,
  toolMatchesName,
} from '../../Tool.js'
// 接入 ListMcpResourcesTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ListMcpResourcesTool } from '../../tools/ListMcpResourcesTool/ListMcpResourcesTool.js'
// 接入 MCPProgress、MCPTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { type MCPProgress, MCPTool } from '../../tools/MCPTool/MCPTool.js'
// 接入 createMcpAuthTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { createMcpAuthTool } from '../../tools/McpAuthTool/McpAuthTool.js'
// 接入 ReadMcpResourceTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ReadMcpResourceTool } from '../../tools/ReadMcpResourceTool/ReadMcpResourceTool.js'
// 复用 createAbortController 工具函数，把通用处理留在 ../../utils/abortController.js 中维护。
import { createAbortController } from '../../utils/abortController.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
  handleOAuth401Error,
} from '../../utils/auth.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../../utils/cleanupRegistry.js'
// 复用 detectCodeIndexingFromMcpServerName 工具函数，把通用处理留在 ../../utils/codeIndexing.js 中维护。
import { detectCodeIndexingFromMcpServerName } from '../../utils/codeIndexing.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isEnvDefinedFalsy、isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvDefinedFalsy, isEnvTruthy } from '../../utils/envUtils.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  errorMessage,
  TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from '../../utils/errors.js'
// 复用 getMCPUserAgent 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getMCPUserAgent } from '../../utils/http.js'
// 复用 maybeNotifyIDEConnected 工具函数，把通用处理留在 ../../utils/ide.js 中维护。
import { maybeNotifyIDEConnected } from '../../utils/ide.js'
// 复用 maybeResizeAndDownsampleImageBuffer 工具函数，把通用处理留在 ../../utils/imageResizer.js 中维护。
import { maybeResizeAndDownsampleImageBuffer } from '../../utils/imageResizer.js'
// 复用 logMCPDebug、logMCPError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPDebug, logMCPError } from '../../utils/log.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  getBinaryBlobSavedMessage,
  getFormatDescription,
  getLargeOutputInstructions,
  persistBinaryContent,
} from '../../utils/mcpOutputStorage.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  getContentSizeEstimate,
  type MCPToolResult,
  mcpContentNeedsTruncation,
  truncateMcpContentIfNeeded,
} from '../../utils/mcpValidation.js'
// 复用 WebSocketTransport 工具函数，把通用处理留在 ../../utils/mcpWebSocketTransport.js 中维护。
import { WebSocketTransport } from '../../utils/mcpWebSocketTransport.js'
// 复用 memoizeWithLRU 工具函数，把通用处理留在 ../../utils/memoize.js 中维护。
import { memoizeWithLRU } from '../../utils/memoize.js'
// 复用 getWebSocketTLSOptions 工具函数，把通用处理留在 ../../utils/mtls.js 中维护。
import { getWebSocketTLSOptions } from '../../utils/mtls.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  getProxyFetchOptions,
  getWebSocketProxyAgent,
  getWebSocketProxyUrl,
} from '../../utils/proxy.js'
// 复用 recursivelySanitizeUnicode 工具函数，把通用处理留在 ../../utils/sanitization.js 中维护。
import { recursivelySanitizeUnicode } from '../../utils/sanitization.js'
// 复用 getSessionIngressAuthToken 工具函数，把通用处理留在 ../../utils/sessionIngressAuth.js 中维护。
import { getSessionIngressAuthToken } from '../../utils/sessionIngressAuth.js'
// 复用 subprocessEnv 工具函数，把通用处理留在 ../../utils/subprocessEnv.js 中维护。
import { subprocessEnv } from '../../utils/subprocessEnv.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  isPersistError,
  persistToolResult,
} from '../../utils/toolResultStorage.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type ElicitationWaitingState,
  runElicitationHooks,
  runElicitationResultHooks,
} from './elicitationHandler.js'
// 引入 buildMcpToolName，将 ./mcpStringUtils.js 中已经封装好的能力接到本文件流程里。
import { buildMcpToolName } from './mcpStringUtils.js'
// 引入 normalizeNameForMCP，将 ./normalization.js 中已经封装好的能力接到本文件流程里。
import { normalizeNameForMCP } from './normalization.js'
// 引入 getLoggingSafeMcpBaseUrl，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getLoggingSafeMcpBaseUrl } from './utils.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// fetchMcpSkillsForClient保存`feature`，供MCP 服务后续处理使用。
const fetchMcpSkillsForClient = feature('MCP_SKILLS')
  ? (
      require('../../skills/mcpSkills.js') as typeof import('../../skills/mcpSkills.js')
    ).fetchMcpSkillsForClient
  : null

// 引入 UnauthorizedError，将 @modelcontextprotocol/sdk/client/auth.js 中已经封装好的能力接到本文件流程里。
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js'
// 类型依赖 { AssistantMessage } 来自 src/types/message.js，用于校准MCP 服务的数据契约。
import type { AssistantMessage } from 'src/types/message.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 接入 classifyMcpToolForCollapse 工具实现，后续工具池会按权限和开关决定是否暴露。
import { classifyMcpToolForCollapse } from '../../tools/MCPTool/classifyForCollapse.js'
// 复用 clearKeychainCache 工具函数，把通用处理留在 ../../utils/secureStorage/macOsKeychainHelpers.js 中维护。
import { clearKeychainCache } from '../../utils/secureStorage/macOsKeychainHelpers.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  ClaudeAuthProvider,
  hasMcpDiscoveryButNoToken,
  wrapFetchWithStepUpDetection,
} from './auth.js'
// 引入 markClaudeAiMcpConnected，将 ./claudeai.js 中已经封装好的能力接到本文件流程里。
import { markClaudeAiMcpConnected } from './claudeai.js'
// 引入 getAllMcpConfigs、isMcpServerDisabled，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getAllMcpConfigs, isMcpServerDisabled } from './config.js'
// 引入 getMcpServerHeaders，将 ./headersHelper.js 中已经封装好的能力接到本文件流程里。
import { getMcpServerHeaders } from './headersHelper.js'
// 引入 SdkControlClientTransport，将 ./SdkControlTransport.js 中已经封装好的能力接到本文件流程里。
import { SdkControlClientTransport } from './SdkControlTransport.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import type {
  ConnectedMCPServer,
  MCPServerConnection,
  McpSdkServerConfig,
  ScopedMcpServerConfig,
  ServerResource,
} from './types.js'

/**
 * Custom error class to indicate that an MCP tool call failed due to
 * authentication issues (e.g., expired OAuth token returning 401).
 * This error should be caught at the tool execution layer to update
 * the client's status to 'needs-auth'.
 */
// McpAuthError 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
export class McpAuthError extends Error {
  serverName: string
  // 构造函数接收 serverName: string, message: string，把外部输入整理成实例可复用的内部状态。
  constructor(serverName: string, message: string) {
    // 调用 super，触发MCP 服务此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'McpAuthError'，同步MCP 服务的内部状态。
    this.name = 'McpAuthError'
    // 更新实例字段 serverName 为 serverName，同步MCP 服务的内部状态。
    this.serverName = serverName
  }
}

/**
 * Thrown when an MCP session has expired and the connection cache has been cleared.
 * The caller should get a fresh client via ensureConnectedClient and retry.
 */
// McpSessionExpiredError 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
class McpSessionExpiredError extends Error {
  // 构造函数接收 serverName: string，把外部输入整理成实例可复用的内部状态。
  constructor(serverName: string) {
    // 调用 super，触发MCP 服务此处需要的副作用。
    super(`MCP server "${serverName}" session expired`)
    // 更新实例字段 name 为 'McpSessionExpiredError'，同步MCP 服务的内部状态。
    this.name = 'McpSessionExpiredError'
  }
}

/**
 * Thrown when an MCP tool returns `isError: true`. Carries the result's `_meta`
 * so SDK consumers can still receive it — per the MCP spec, `_meta` is on the
 * base Result type and is valid on error results.
 */
// McpToolCallError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
export class McpToolCallError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS extends TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  constructor(
    message: string,
    telemetryMessage: string,
    readonly mcpMeta?: { _meta?: Record<string, unknown> },
  ) {
    // 调用 super，触发MCP 服务此处需要的副作用。
    super(message, telemetryMessage)
    // 更新实例字段 name 为 'McpToolCallError'，同步MCP 服务的内部状态。
    this.name = 'McpToolCallError'
  }
}

/**
 * Detects whether an error is an MCP "Session not found" error (HTTP 404 + JSON-RPC code -32001).
 * Per the MCP spec, servers return 404 when a session ID is no longer valid.
 * We check both signals to avoid false positives from generic 404s (wrong URL, server gone, etc.).
 */
// isMcpSessionExpiredError 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMcpSessionExpiredError(error: Error): boolean {
  // httpStatus 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const httpStatus =
    'code' in error ? (error as Error & { code?: number }).code : undefined
  // `httpStatus` 与 `404` 不一致时刷新派生状态，避免使用过期结果。
  if (httpStatus !== 404) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // The SDK embeds the response body text in the error message.
  // MCP servers return: {"error":{"code":-32001,"message":"Session not found"},...}
  // Check for the JSON-RPC error code to distinguish from generic web server 404s.
  // 返回 `(`，作为MCP 服务这次计算的结果。
  return (
    error.message.includes('"code":-32001') ||
    error.message.includes('"code": -32001')
  )
}

/**
 * Default timeout for MCP tool calls (effectively infinite - ~27.8 hours).
 */
// DEFAULT_MCP_TOOL_TIMEOUT_MS 集合保存`100_000_000`，供MCP 服务MCP 服务 client后续判断或输出使用。
const DEFAULT_MCP_TOOL_TIMEOUT_MS = 100_000_000

/**
 * Cap on MCP tool descriptions and server instructions sent to the model.
 * OpenAPI-generated MCP servers have been observed dumping 15-60KB of endpoint
 * docs into tool.description; this caps the p95 tail without losing the intent.
 */
// MAX_MCP_DESCRIPTION_LENGTH 数量保存`2048`，供后续判断或组装使用。
const MAX_MCP_DESCRIPTION_LENGTH = 2048

/**
 * Gets the timeout for MCP tool calls in milliseconds.
 * Uses MCP_TOOL_TIMEOUT environment variable if set, otherwise defaults to ~27.8 hours.
 */
// getMcpToolTimeoutMs 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpToolTimeoutMs(): number {
  // 返回 `(`，作为MCP 服务这次计算的结果。
  return (
    parseInt(process.env.MCP_TOOL_TIMEOUT || '', 10) ||
    DEFAULT_MCP_TOOL_TIMEOUT_MS
  )
}

// 复用 isClaudeInChromeMCPServer 工具函数，把通用处理留在 ../../utils/claudeInChrome/common.js 中维护。
import { isClaudeInChromeMCPServer } from '../../utils/claudeInChrome/common.js'

// Lazy: toolRendering.tsx pulls React/ink; only needed when Claude-in-Chrome MCP server is connected
/* eslint-disable @typescript-eslint/no-require-imports */
// claudeInChromeToolRendering 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const claudeInChromeToolRendering =
  // 这个回调绑定到 (): typeof import('../../utils/claudeInChrome/toolRendering.js') =>，负责MCP 服务在该局部场景下的响应。
  (): typeof import('../../utils/claudeInChrome/toolRendering.js') =>
    require('../../utils/claudeInChrome/toolRendering.js')
// Lazy: wrapper.tsx → hostAdapter.ts → executor.ts pulls both native modules
// (@ant/computer-use-input + @ant/computer-use-swift). Runtime-gated by
// GrowthBook tengu_malort_pedway (see gates.ts).
// computerUseWrapper保存`feature`，供MCP 服务后续处理使用。
const computerUseWrapper = feature('CHICAGO_MCP')
  // 这个回调绑定到 ? (): typeof import('../../utils/computerUse/wrapper.js') =>，负责MCP 服务在该局部场景下的响应。
  ? (): typeof import('../../utils/computerUse/wrapper.js') =>
      require('../../utils/computerUse/wrapper.js')
  : undefined
// isComputerUseMCPServer记录 `feature` 是否成立，MCP 服务随后按该结果分支。
const isComputerUseMCPServer = feature('CHICAGO_MCP')
  ? (
      require('../../utils/computerUse/common.js') as typeof import('../../utils/computerUse/common.js')
    ).isComputerUseMCPServer
  : undefined

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'

// MCP_AUTH_CACHE_TTL_MS 缓存保存`15 * 60 * 1000 // 15 min`，供MCP 服务MCP 服务 client后续判断或输出使用。
const MCP_AUTH_CACHE_TTL_MS = 15 * 60 * 1000 // 15 min

// McpAuthCacheData 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type McpAuthCacheData = Record<string, { timestamp: number }>

// getMcpAuthCachePath 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpAuthCachePath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'mcp-needs-auth-cache.json')`，作为MCP 服务这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'mcp-needs-auth-cache.json')
}

// Memoized so N concurrent isMcpAuthCached() calls during batched connection
// share a single file read instead of N reads of the same file. Invalidated
// on write (setMcpAuthCacheEntry) and clear (clearMcpAuthCache). Not using
// lodash memoize because we need to null out the cache, not delete by key.
// authCachePromise 异步任务保存`null`，作为后续空值处理的输入。
let authCachePromise: Promise<McpAuthCacheData> | null = null

// getMcpAuthCache 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpAuthCache(): Promise<McpAuthCacheData> {
  // authCachePromise 异步任务缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!authCachePromise) {
    // authCachePromise 异步任务更新为 `readFile(getMcpAuthCachePath(), 'utf-8')`，确保MCP 服务后续读取最新状态。
    authCachePromise = readFile(getMcpAuthCachePath(), 'utf-8')
      .then(data => jsonParse(data) as McpAuthCacheData)
      .catch(() => ({}))
  }
  // 返回 `authCachePromise`，作为MCP 服务这次计算的结果。
  return authCachePromise
}

// isMcpAuthCached 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isMcpAuthCached(serverId: string): Promise<boolean> {
  // cache 缓存读取`getMcpAuthCache`，供MCP 服务后续处理使用。
  const cache = await getMcpAuthCache()
  // entry 命名 `cache[serverId]`，让后续代码直接表达这个值的用途。
  const entry = cache[serverId]
  // entry缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!entry) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `Date.now() - entry.timestamp < MCP_AUTH_CACHE_TTL_MS`，作为MCP 服务这次计算的结果。
  return Date.now() - entry.timestamp < MCP_AUTH_CACHE_TTL_MS
}

// Serialize cache writes through a promise chain to prevent concurrent
// read-modify-write races when multiple servers return 401 in the same batch
// writeChain读取`Promise.resolve`，供MCP 服务后续处理使用。
let writeChain = Promise.resolve()

// setMcpAuthCacheEntry 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function setMcpAuthCacheEntry(serverId: string): void {
  // writeChain更新为 `writeChain`，确保MCP 服务后续读取最新状态。
  writeChain = writeChain
    .then(async () => {
      // cache 缓存读取`getMcpAuthCache`，供MCP 服务后续处理使用。
      const cache = await getMcpAuthCache()
      // cache[serverId 缓存更新为 `{ timestamp: Date.now() }`，确保MCP 服务 client后续读取最新状态。
      cache[serverId] = { timestamp: Date.now() }
      // cachePath 路径数据读取`getMcpAuthCachePath`，供MCP 服务后续处理使用。
      const cachePath = getMcpAuthCachePath()
      // 等待 `mkdir(dirname(cachePath), { recursive: true })` 完成，再继续MCP 服务 client的异步流程。
      await mkdir(dirname(cachePath), { recursive: true })
      // 等待 `writeFile(cachePath, jsonStringify(cache))` 完成，再继续MCP 服务 client的异步流程。
      await writeFile(cachePath, jsonStringify(cache))
      // Invalidate the read cache so subsequent reads see the new entry.
      // Safe because writeChain serializes writes: the next write's
      // getMcpAuthCache() call will re-read the file with this entry present.
      // authCachePromise 异步任务更新为 `null`，确保MCP 服务后续读取最新状态。
      authCachePromise = null
    })
    // 链式调用 catch，继续加工上一行在MCP 服务中产生的数据。
    .catch(() => {
      // Best-effort cache write
    })
}

// clearMcpAuthCache 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearMcpAuthCache(): void {
  // authCachePromise 异步任务更新为 `null`，确保MCP 服务后续读取最新状态。
  authCachePromise = null
  // 这个回调绑定到 void unlink(getMcpAuthCachePath()).catch(() => {，负责MCP 服务在该局部场景下的响应。
  void unlink(getMcpAuthCachePath()).catch(() => {
    // Cache file may not exist
  })
}

/**
 * Spread-ready analytics field for the server's base URL. Calls
 * getLoggingSafeMcpBaseUrl once (not twice like the inline ternary it replaces).
 * Typed as AnalyticsMetadata since the URL is query-stripped and safe to log.
 */
// mcpBaseUrlAnalytics 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mcpBaseUrlAnalytics(serverRef: ScopedMcpServerConfig): {
  mcpServerBaseUrl?: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
} {
  // URL读取`getLoggingSafeMcpBaseUrl`，供MCP 服务后续处理使用。
  const url = getLoggingSafeMcpBaseUrl(serverRef)
  // 返回 `url`，作为MCP 服务这次计算的结果。
  return url
    ? {
        mcpServerBaseUrl:
          url as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }
    : {}
}

/**
 * Shared handler for sse/http/claudeai-proxy auth failures during connect:
 * emits tengu_mcp_server_needs_auth, caches the needs-auth entry, and returns
 * the needs-auth connection result.
 */
// handleRemoteAuthFailure 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleRemoteAuthFailure(
  name: string,
  serverRef: ScopedMcpServerConfig,
  transportType: 'sse' | 'http' | 'claudeai-proxy',
): MCPServerConnection {
  // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_mcp_server_needs_auth', {
    transportType:
      transportType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...mcpBaseUrlAnalytics(serverRef),
  })
  // label 集中保存MCP 服务 client要一起传递的字段。
  const label: Record<typeof transportType, string> = {
    sse: 'SSE',
    http: 'HTTP',
    'claudeai-proxy': 'claude.ai proxy',
  }
  // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
  logMCPDebug(
    name,
    `Authentication required for ${label[transportType]} server`,
  )
  // setMcpAuthCacheEntry 写入新的状态值，使MCP 服务后续读取保持一致。
  setMcpAuthCacheEntry(name)
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { name, type: 'needs-auth', config: serverRef }
}

/**
 * Fetch wrapper for claude.ai proxy connections. Attaches the OAuth bearer
 * token and retries once on 401 via handleOAuth401Error (force-refresh).
 *
 * The Anthropic API path has this retry (withRetry.ts, grove.ts) to handle
 * memoize-cache staleness and clock drift. Without the same here, a single
 * stale token mass-401s every claude.ai connector and sticks them all in the
 * 15-min needs-auth cache.
 */
// createClaudeAiProxyFetch 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createClaudeAiProxyFetch(innerFetch: FetchLike): FetchLike {
  // 返回 `async (url, init) => {`，作为MCP 服务这次计算的结果。
  return async (url, init) => {
    // doRequest 请求数据保存`async`，供MCP 服务后续处理使用。
    const doRequest = async () => {
      // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续MCP 服务 client的异步流程。
      await checkAndRefreshOAuthTokenIfNeeded()
      // currentTokens 集合读取`getClaudeAIOAuthTokens`，供MCP 服务后续处理使用。
      const currentTokens = getClaudeAIOAuthTokens()
      // currentTokens 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!currentTokens) {
        // 抛出 new Error('No claude.ai OAuth token available')，阻止MCP 服务在无效状态下继续运行。
        throw new Error('No claude.ai OAuth token available')
      }
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // 请求头保存`Headers`，供MCP 服务后续处理使用。
      const headers = new Headers(init?.headers)
      // headers.set 写入新的状态值，使MCP 服务后续读取保持一致。
      headers.set('Authorization', `Bearer ${currentTokens.accessToken}`)
      // 接口响应保存`innerFetch`，供MCP 服务后续处理使用。
      const response = await innerFetch(url, { ...init, headers })
      // Return the exact token that was sent. Reading getClaudeAIOAuthTokens()
      // again after the request is wrong under concurrent 401s: another
      // connector's handleOAuth401Error clears the memoize cache, so we'd read
      // the NEW token from keychain, pass it to handleOAuth401Error, which
      // finds same-as-keychain → returns false → skips retry. Same pattern as
      // bridgeApi.ts withOAuthRetry (token passed as fn param).
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return { response, sentToken: currentTokens.accessToken }
    }

    // 从 `await doRequest()` 解构 response、sentToken，减少MCP 服务 client对同一对象的重复访问。
    const { response, sentToken } = await doRequest()
    // `response.status` 与 `401` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 401) {
      // 返回 `response`，作为MCP 服务这次计算的结果。
      return response
    }
    // handleOAuth401Error returns true only if the token actually changed
    // (keychain had a newer one, or force-refresh succeeded). Gate retry on
    // that — otherwise we double round-trip time for every connector whose
    // downstream service genuinely needs auth (the common case: 30+ servers
    // with "MCP server requires authentication but no OAuth token configured").
    // tokenChanged保存`handleOAuth401Error`，供MCP 服务后续处理使用。
    const tokenChanged = await handleOAuth401Error(sentToken).catch(() => false)
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_claudeai_proxy_401', {
      tokenChanged:
        tokenChanged as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // tokenChanged缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!tokenChanged) {
      // ELOCKED contention: another connector may have won the lockfile and refreshed — check if token changed underneath us
      // now读取`getClaudeAIOAuthTokens`，供MCP 服务后续处理使用。
      const now = getClaudeAIOAuthTokens()?.accessToken
      // 组合条件 `!now || now === sentToken` 成立时，MCP 服务才启用这条专门路径。
      if (!now || now === sentToken) {
        // 返回 `response`，作为MCP 服务这次计算的结果。
        return response
      }
    }
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 返回 `(await doRequest()).response`，作为MCP 服务这次计算的结果。
      return (await doRequest()).response
    } catch {
      // Retry itself failed (network error). Return the original 401 so the
      // outer handler can classify it.
      // 返回 `response`，作为MCP 服务这次计算的结果。
      return response
    }
  }
}

// Minimal interface for WebSocket instances passed to mcpWebSocketTransport
// WsClientLike 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type WsClientLike = {
  readonly readyState: number
  close(): void
  send(data: string): void
}

/**
 * Create a ws.WebSocket client with the MCP protocol.
 * Bun's ws shim types lack the 3-arg constructor (url, protocols, options)
 * that the real ws package supports, so we cast the constructor here.
 */
// createNodeWsClient 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function createNodeWsClient(
  url: string,
  options: Record<string, unknown>,
): Promise<WsClientLike> {
  // wsModule保存`import`，供MCP 服务后续处理使用。
  const wsModule = await import('ws')
  // WS 集合保存`new`，供MCP 服务后续处理使用。
  const WS = wsModule.default as unknown as new (
    url: string,
    protocols: string[],
    options: Record<string, unknown>,
  ) => WsClientLike
  // 返回 `new WS(url, ['mcp'], options)`，作为MCP 服务这次计算的结果。
  return new WS(url, ['mcp'], options)
}

// IMAGE_MIME_TYPES 集合保存`Set`，供MCP 服务后续处理使用。
const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

// getConnectionTimeoutMs 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConnectionTimeoutMs(): number {
  // 返回 `parseInt(process.env.MCP_TIMEOUT || '', 10) || 30000`，作为MCP 服务这次计算的结果。
  return parseInt(process.env.MCP_TIMEOUT || '', 10) || 30000
}

/**
 * Default timeout for individual MCP requests (auth, tool calls, etc.)
 */
// MCP_REQUEST_TIMEOUT_MS 请求数据保存`60000`，供MCP 服务MCP 服务 client后续判断或输出使用。
const MCP_REQUEST_TIMEOUT_MS = 60000

/**
 * MCP Streamable HTTP spec requires clients to advertise acceptance of both
 * JSON and SSE on every POST. Servers that enforce this strictly reject
 * requests without it (HTTP 406).
 * https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#sending-messages-to-the-server
 */
// MCP_STREAMABLE_HTTP_ACCEPT 命名 `'application/json, text/event-stream'`，让后续代码直接表达这个值的用途。
const MCP_STREAMABLE_HTTP_ACCEPT = 'application/json, text/event-stream'

/**
 * Wraps a fetch function to apply a fresh timeout signal to each request.
 * This avoids the bug where a single AbortSignal.timeout() created at connection
 * time becomes stale after 60 seconds, causing all subsequent requests to fail
 * immediately with "The operation timed out." Uses a 60-second timeout.
 *
 * Also ensures the Accept header required by the MCP Streamable HTTP spec is
 * present on POSTs. The MCP SDK sets this inside StreamableHTTPClientTransport.send(),
 * but it is attached to a Headers instance that passes through an object spread here,
 * and some runtimes/agents have been observed dropping it before it reaches the wire.
 * See https://github.com/anthropics/claude-agent-sdk-typescript/issues/202.
 * Normalizing here (the last wrapper before fetch()) guarantees it is sent.
 *
 * GET requests are excluded from the timeout since, for MCP transports, they are
 * long-lived SSE streams meant to stay open indefinitely. (Auth-related GETs use
 * a separate fetch wrapper with its own timeout in auth.ts.)
 *
 * @param baseFetch - The fetch function to wrap
 */
// wrapFetchWithTimeout 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapFetchWithTimeout(baseFetch: FetchLike): FetchLike {
  // 返回 `async (url: string | URL, init?: RequestInit) => {`，作为MCP 服务这次计算的结果。
  return async (url: string | URL, init?: RequestInit) => {
    // method保存`toUpperCase`，供MCP 服务后续处理使用。
    const method = (init?.method ?? 'GET').toUpperCase()

    // Skip timeout for GET requests - in MCP transports, these are long-lived SSE streams.
    // (OAuth discovery GETs in auth.ts use a separate createAuthFetch() with its own timeout.)
    // 当 `method` 匹配 `'GET'` 时，MCP 服务执行对应分支。
    if (method === 'GET') {
      // 返回 `baseFetch(url, init)`，作为MCP 服务这次计算的结果。
      return baseFetch(url, init)
    }

    // Normalize headers and guarantee the Streamable-HTTP Accept value. new Headers()
    // accepts HeadersInit | undefined and copies from plain objects, tuple arrays,
    // and existing Headers instances — so whatever shape the SDK handed us, the
    // Accept value survives the spread below as an own property of a concrete object.
    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    // 请求头保存`Headers`，供MCP 服务后续处理使用。
    const headers = new Headers(init?.headers)
    // 满足 `!headers.has('accept')` 时，MCP 服务执行该分支。
    if (!headers.has('accept')) {
      // headers.set 写入新的状态值，使MCP 服务后续读取保持一致。
      headers.set('accept', MCP_STREAMABLE_HTTP_ACCEPT)
    }

    // Use setTimeout instead of AbortSignal.timeout() so we can clearTimeout on
    // completion. AbortSignal.timeout's internal timer is only released when the
    // signal is GC'd, which in Bun is lazy — ~2.4KB of native memory per request
    // lingers for the full 60s even when the request completes in milliseconds.
    // controller保存`AbortController`，供MCP 服务后续处理使用。
    const controller = new AbortController()
    // timer保存`setTimeout`，供MCP 服务后续处理使用。
    const timer = setTimeout(
      // c更新为 `>`，确保MCP 服务后续读取最新状态。
      c =>
        c.abort(new DOMException('The operation timed out.', 'TimeoutError')),
      MCP_REQUEST_TIMEOUT_MS,
      controller,
    )
    // 调用 timer.unref?.()，完成这一处局部操作。
    timer.unref?.()

    // parentSignal保存`init?.signal`，供后续判断或组装使用。
    const parentSignal = init?.signal
    // abort保存`controller.abort`，供MCP 服务后续处理使用。
    const abort = () => controller.abort(parentSignal?.reason)
    // 调用 parentSignal?.addEventListener('abort', abort)，完成这一处局部操作。
    parentSignal?.addEventListener('abort', abort)
    // 满足 `parentSignal?.aborted` 时，MCP 服务执行该分支。
    if (parentSignal?.aborted) {
      // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
      controller.abort(parentSignal.reason)
    }

    // cleanup封装成回调，供MCP 服务MCP 服务 client在事件触发或异步步骤中调用。
    const cleanup = () => {
      // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
      clearTimeout(timer)
      // 调用 parentSignal?.removeEventListener('abort', abort)，完成这一处局部操作。
      parentSignal?.removeEventListener('abort', abort)
    }

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应保存`baseFetch`，供MCP 服务后续处理使用。
      const response = await baseFetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      })
      // 调用 cleanup，触发MCP 服务此处需要的副作用。
      cleanup()
      // 返回 `response`，作为MCP 服务这次计算的结果。
      return response
    } catch (error) {
      // 调用 cleanup，触发MCP 服务此处需要的副作用。
      cleanup()
      // 抛出 error，阻止MCP 服务在无效状态下继续运行。
      throw error
    }
  }
}

// getMcpServerConnectionBatchSize 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpServerConnectionBatchSize(): number {
  // 返回 `parseInt(process.env.MCP_SERVER_CONNECTION_BATCH_SIZE || '', 10) || 3`，作为MCP 服务这次计算的结果。
  return parseInt(process.env.MCP_SERVER_CONNECTION_BATCH_SIZE || '', 10) || 3
}

// getRemoteMcpServerConnectionBatchSize 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRemoteMcpServerConnectionBatchSize(): number {
  // 返回 `(`，作为MCP 服务这次计算的结果。
  return (
    parseInt(process.env.MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE || '', 10) ||
    20
  )
}

// isLocalMcpServer 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLocalMcpServer(config: ScopedMcpServerConfig): boolean {
  // 返回 `!config.type || config.type === 'stdio' || config.type === 'sdk'`，作为MCP 服务这次计算的结果。
  return !config.type || config.type === 'stdio' || config.type === 'sdk'
}

// For the IDE MCP servers, we only include specific tools
// ALLOWED_IDE_TOOLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ALLOWED_IDE_TOOLS = ['mcp__ide__executeCode', 'mcp__ide__getDiagnostics']
// isIncludedMcpTool 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isIncludedMcpTool(tool: Tool): boolean {
  // 返回 `(`，作为MCP 服务这次计算的结果。
  return (
    !tool.name.startsWith('mcp__ide__') || ALLOWED_IDE_TOOLS.includes(tool.name)
  )
}

/**
 * Generates the cache key for a server connection
 * @param name Server name
 * @param serverRef Server configuration
 * @returns Cache key string
 */
// getServerCacheKey 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getServerCacheKey(
  name: string,
  serverRef: ScopedMcpServerConfig,
): string {
  // 返回 ``${name}-${jsonStringify(serverRef)}``，作为MCP 服务这次计算的结果。
  return `${name}-${jsonStringify(serverRef)}`
}

/**
 * TODO (ollie): The memoization here increases complexity by a lot, and im not sure it really improves performance
 * Attempts to connect to a single MCP server
 * @param name Server name
 * @param serverRef Scoped server configuration
 * @returns A wrapped client (either connected or failed)
 */
// connectToServer保存`memoize`，供MCP 服务后续处理使用。
export const connectToServer = memoize(
  async (
    name: string,
    serverRef: ScopedMcpServerConfig,
    serverStats?: {
      totalServers: number
      stdioCount: number
      sseCount: number
      httpCount: number
      sseIdeCount: number
      wsIdeCount: number
    },
  ): Promise<MCPServerConnection> => {
    // connectStartTime记录时间`Date.now`，供MCP 服务后续处理使用。
    const connectStartTime = Date.now()
    // MCP 服务 client先整理这一处局部数据，后续分支可以直接读取。
    let inProcessServer:
      // MCP 服务 client在这里处理 `| { connect(t: Transport): Promise<void>; close(): Promise<void> }`，完成这一小步状态转换。
      | { connect(t: Transport): Promise<void>; close(): Promise<void> }
      | undefined
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // transport 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let transport

      // If we have the session ingress JWT, we will connect via the session ingress rather than
      // to remote MCP's directly.
      // sessionIngressToken 会话数据读取`getSessionIngressAuthToken`，供MCP 服务后续处理使用。
      const sessionIngressToken = getSessionIngressAuthToken()

      // 当 `serverRef.type` 匹配 `'sse'` 时，MCP 服务执行对应分支。
      if (serverRef.type === 'sse') {
        // Create an auth provider for this server
        // authProvider保存`ClaudeAuthProvider`，供MCP 服务后续处理使用。
        const authProvider = new ClaudeAuthProvider(name, serverRef)

        // Get combined headers (static + dynamic)
        // combinedHeaders 集合读取`getMcpServerHeaders`，供MCP 服务后续处理使用。
        const combinedHeaders = await getMcpServerHeaders(name, serverRef)

        // Use the auth provider with SSEClientTransport
        // transportOptions 集合 集中保存MCP 服务 client要一起传递的字段。
        const transportOptions: SSEClientTransportOptions = {
          authProvider,
          // Use fresh timeout per request to avoid stale AbortSignal bug.
          // Step-up detection wraps innermost so the 403 is seen before the
          // SDK's handler calls auth() → tokens().
          fetch: wrapFetchWithTimeout(
            wrapFetchWithStepUpDetection(createFetchWithInit(), authProvider),
          ),
          requestInit: {
            headers: {
              'User-Agent': getMCPUserAgent(),
              ...combinedHeaders,
            },
          },
        }

        // IMPORTANT: Always set eventSourceInit with a fetch that does NOT use the
        // timeout wrapper. The EventSource connection is long-lived (stays open indefinitely
        // to receive server-sent events), so applying a 60-second timeout would kill it.
        // The timeout is only meant for individual API requests (POST, auth refresh), not
        // the persistent SSE stream.
        // eventSourceInit更新为 `{`，确保MCP 服务后续读取最新状态。
        transportOptions.eventSourceInit = {
          // 这个回调绑定到 fetch: async (url: string | URL, init?: RequestInit) => {，负责MCP 服务在该局部场景下的响应。
          fetch: async (url: string | URL, init?: RequestInit) => {
            // Get auth headers from the auth provider
            // authHeaders 集合 从空对象开始收集键值，后续按名称补齐内容。
            const authHeaders: Record<string, string> = {}
            // token 列表保存`authProvider.tokens`，供MCP 服务后续处理使用。
            const tokens = await authProvider.tokens()
            // 满足 `tokens` 时，MCP 服务执行该分支。
            if (tokens) {
              // Authorization更新为 ``Bearer ${tokens.access_token}``，确保MCP 服务后续读取最新状态。
              authHeaders.Authorization = `Bearer ${tokens.access_token}`
            }

            // proxyOptions 集合读取`getProxyFetchOptions`，供MCP 服务后续处理使用。
            const proxyOptions = getProxyFetchOptions()
            // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
            // 返回 `fetch(url, {`，作为MCP 服务这次计算的结果。
            return fetch(url, {
              ...init,
              ...proxyOptions,
              headers: {
                'User-Agent': getMCPUserAgent(),
                ...authHeaders,
                ...init?.headers,
                ...combinedHeaders,
                Accept: 'text/event-stream',
              },
            })
          },
        }

        // transport更新为 `new SSEClientTransport(`，确保MCP 服务后续读取最新状态。
        transport = new SSEClientTransport(
          new URL(serverRef.url),
          transportOptions,
        )
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `SSE transport initialized, awaiting connection`)
      // MCP 服务 client在这里处理 `} else if (serverRef.type === 'sse-ide') {`，完成这一小步状态转换。
      } else if (serverRef.type === 'sse-ide') {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Setting up SSE-IDE transport to ${serverRef.url}`)
        // IDE servers don't need authentication
        // TODO: Use the auth token provided in the lockfile
        // proxyOptions 集合读取`getProxyFetchOptions`，供MCP 服务后续处理使用。
        const proxyOptions = getProxyFetchOptions()
        // transportOptions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
        const transportOptions: SSEClientTransportOptions =
          proxyOptions.dispatcher
            ? {
                eventSourceInit: {
                  // 这个回调绑定到 fetch: async (url: string | URL, init?: RequestInit) => {，负责MCP 服务在该局部场景下的响应。
                  fetch: async (url: string | URL, init?: RequestInit) => {
                    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
                    // 返回 `fetch(url, {`，作为MCP 服务这次计算的结果。
                    return fetch(url, {
                      ...init,
                      ...proxyOptions,
                      headers: {
                        'User-Agent': getMCPUserAgent(),
                        ...init?.headers,
                      },
                    })
                  },
                },
              }
            : {}

        // transport更新为 `new SSEClientTransport(`，确保MCP 服务后续读取最新状态。
        transport = new SSEClientTransport(
          new URL(serverRef.url),
          Object.keys(transportOptions).length > 0
            ? transportOptions
            : undefined,
        )
      // MCP 服务 client在这里处理 `} else if (serverRef.type === 'ws-ide') {`，完成这一小步状态转换。
      } else if (serverRef.type === 'ws-ide') {
        // tlsOptions 集合读取`getWebSocketTLSOptions`，供MCP 服务后续处理使用。
        const tlsOptions = getWebSocketTLSOptions()
        // wsHeaders 集合集中保存MCP 服务MCP 服务 client要一起传递的字段。
        const wsHeaders = {
          'User-Agent': getMCPUserAgent(),
          ...(serverRef.authToken && {
            'X-Claude-Code-Ide-Authorization': serverRef.authToken,
          }),
        }

        // wsClient 先占位，稍后的条件分支会根据实际输入补齐它。
        let wsClient: WsClientLike
        // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof Bun !== 'undefined') {
          // Bun's WebSocket supports headers/proxy/tls options but the DOM typings don't
          // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
          // wsClient更新为 `new globalThis.WebSocket(serverRef.url, {`，确保MCP 服务后续读取最新状态。
          wsClient = new globalThis.WebSocket(serverRef.url, {
            protocols: ['mcp'],
            headers: wsHeaders,
            proxy: getWebSocketProxyUrl(serverRef.url),
            tls: tlsOptions || undefined,
          } as unknown as string[])
        } else {
          // wsClient更新为 `await createNodeWsClient(serverRef.url, {`，确保MCP 服务后续读取最新状态。
          wsClient = await createNodeWsClient(serverRef.url, {
            headers: wsHeaders,
            agent: getWebSocketProxyAgent(serverRef.url),
            ...(tlsOptions || {}),
          })
        }
        // transport更新为 `new WebSocketTransport(wsClient)`，确保MCP 服务后续读取最新状态。
        transport = new WebSocketTransport(wsClient)
      // MCP 服务 client在这里处理 `} else if (serverRef.type === 'ws') {`，完成这一小步状态转换。
      } else if (serverRef.type === 'ws') {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Initializing WebSocket transport to ${serverRef.url}`,
        )

        // combinedHeaders 集合读取`getMcpServerHeaders`，供MCP 服务后续处理使用。
        const combinedHeaders = await getMcpServerHeaders(name, serverRef)

        // tlsOptions 集合读取`getWebSocketTLSOptions`，供MCP 服务后续处理使用。
        const tlsOptions = getWebSocketTLSOptions()
        // wsHeaders 集合集中保存MCP 服务MCP 服务 client要一起传递的字段。
        const wsHeaders = {
          'User-Agent': getMCPUserAgent(),
          ...(sessionIngressToken && {
            Authorization: `Bearer ${sessionIngressToken}`,
          }),
          ...combinedHeaders,
        }

        // Redact sensitive headers before logging
        // wsHeadersForLogging派生`mapValues`，供MCP 服务后续处理使用。
        const wsHeadersForLogging = mapValues(wsHeaders, (value, key) =>
          key.toLowerCase() === 'authorization' ? '[REDACTED]' : value,
        )

        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `WebSocket transport options: ${jsonStringify({
            url: serverRef.url,
            headers: wsHeadersForLogging,
            hasSessionAuth: !!sessionIngressToken,
          })}`,
        )

        // wsClient 先占位，稍后的条件分支会根据实际输入补齐它。
        let wsClient: WsClientLike
        // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof Bun !== 'undefined') {
          // Bun's WebSocket supports headers/proxy/tls options but the DOM typings don't
          // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
          // wsClient更新为 `new globalThis.WebSocket(serverRef.url, {`，确保MCP 服务后续读取最新状态。
          wsClient = new globalThis.WebSocket(serverRef.url, {
            protocols: ['mcp'],
            headers: wsHeaders,
            proxy: getWebSocketProxyUrl(serverRef.url),
            tls: tlsOptions || undefined,
          } as unknown as string[])
        } else {
          // wsClient更新为 `await createNodeWsClient(serverRef.url, {`，确保MCP 服务后续读取最新状态。
          wsClient = await createNodeWsClient(serverRef.url, {
            headers: wsHeaders,
            agent: getWebSocketProxyAgent(serverRef.url),
            ...(tlsOptions || {}),
          })
        }
        // transport更新为 `new WebSocketTransport(wsClient)`，确保MCP 服务后续读取最新状态。
        transport = new WebSocketTransport(wsClient)
      // MCP 服务 client在这里处理 `} else if (serverRef.type === 'http') {`，完成这一小步状态转换。
      } else if (serverRef.type === 'http') {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Initializing HTTP transport to ${serverRef.url}`)
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Node version: ${process.version}, Platform: ${process.platform}`,
        )
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Environment: ${jsonStringify({
            NODE_OPTIONS: process.env.NODE_OPTIONS || 'not set',
            UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || 'default',
            HTTP_PROXY: process.env.HTTP_PROXY || 'not set',
            HTTPS_PROXY: process.env.HTTPS_PROXY || 'not set',
            NO_PROXY: process.env.NO_PROXY || 'not set',
          })}`,
        )

        // Create an auth provider for this server
        // authProvider保存`ClaudeAuthProvider`，供MCP 服务后续处理使用。
        const authProvider = new ClaudeAuthProvider(name, serverRef)

        // Get combined headers (static + dynamic)
        // combinedHeaders 集合读取`getMcpServerHeaders`，供MCP 服务后续处理使用。
        const combinedHeaders = await getMcpServerHeaders(name, serverRef)

        // Check if this server has stored OAuth tokens. If so, the SDK's
        // authProvider will set Authorization — don't override with the
        // session ingress token (SDK merges requestInit AFTER authProvider).
        // CCR proxy URLs (ccr_shttp_mcp) have no stored OAuth, so they still
        // get the ingress token. See PR #24454 discussion.
        // hasOAuthTokens 集合记录 `authProvider.tokens` 是否成立，MCP 服务随后按该结果分支。
        const hasOAuthTokens = !!(await authProvider.tokens())

        // Use the auth provider with StreamableHTTPClientTransport
        // proxyOptions 集合读取`getProxyFetchOptions`，供MCP 服务后续处理使用。
        const proxyOptions = getProxyFetchOptions()
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Proxy options: ${proxyOptions.dispatcher ? 'custom dispatcher' : 'default'}`,
        )

        // transportOptions 集合 集中保存MCP 服务 client要一起传递的字段。
        const transportOptions: StreamableHTTPClientTransportOptions = {
          authProvider,
          // Use fresh timeout per request to avoid stale AbortSignal bug.
          // Step-up detection wraps innermost so the 403 is seen before the
          // SDK's handler calls auth() → tokens().
          fetch: wrapFetchWithTimeout(
            wrapFetchWithStepUpDetection(createFetchWithInit(), authProvider),
          ),
          requestInit: {
            ...proxyOptions,
            headers: {
              'User-Agent': getMCPUserAgent(),
              ...(sessionIngressToken &&
                !hasOAuthTokens && {
                  Authorization: `Bearer ${sessionIngressToken}`,
                }),
              ...combinedHeaders,
            },
          },
        }

        // Redact sensitive headers before logging
        // headersForLogging保存`transportOptions.requestInit?.headers`，供后续判断或组装使用。
        const headersForLogging = transportOptions.requestInit?.headers
          ? mapValues(
              transportOptions.requestInit.headers as Record<string, string>,
              // 这个回调绑定到 (value, key) =>，负责MCP 服务在该局部场景下的响应。
              (value, key) =>
                key.toLowerCase() === 'authorization' ? '[REDACTED]' : value,
            )
          : undefined

        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `HTTP transport options: ${jsonStringify({
            url: serverRef.url,
            headers: headersForLogging,
            hasAuthProvider: !!authProvider,
            timeoutMs: MCP_REQUEST_TIMEOUT_MS,
          })}`,
        )

        // transport更新为 `new StreamableHTTPClientTransport(`，确保MCP 服务后续读取最新状态。
        transport = new StreamableHTTPClientTransport(
          new URL(serverRef.url),
          transportOptions,
        )
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `HTTP transport created successfully`)
      // MCP 服务 client在这里处理 `} else if (serverRef.type === 'sdk') {`，完成这一小步状态转换。
      } else if (serverRef.type === 'sdk') {
        // 抛出 new Error('SDK servers should be handled in print.ts')，阻止MCP 服务在无效状态下继续运行。
        throw new Error('SDK servers should be handled in print.ts')
      // MCP 服务 client在这里处理 `} else if (serverRef.type === 'claudeai-proxy') {`，完成这一小步状态转换。
      } else if (serverRef.type === 'claudeai-proxy') {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Initializing claude.ai proxy transport for server ${serverRef.id}`,
        )

        // token 列表读取`getClaudeAIOAuthTokens`，供MCP 服务后续处理使用。
        const tokens = getClaudeAIOAuthTokens()
        // token 列表缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!tokens) {
          // 抛出 new Error('No claude.ai OAuth token found')，阻止MCP 服务在无效状态下继续运行。
          throw new Error('No claude.ai OAuth token found')
        }

        // oauthConfig 配置读取`getOauthConfig`，供MCP 服务后续处理使用。
        const oauthConfig = getOauthConfig()
        // proxyUrl格式化`MCP_PROXY_PATH.replace`，供MCP 服务后续处理使用。
        const proxyUrl = `${oauthConfig.MCP_PROXY_URL}${oauthConfig.MCP_PROXY_PATH.replace('{server_id}', serverRef.id)}`

        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Using claude.ai proxy at ${proxyUrl}`)

        // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
        // fetchWithAuth构建`createClaudeAiProxyFetch`，供MCP 服务后续处理使用。
        const fetchWithAuth = createClaudeAiProxyFetch(globalThis.fetch)

        // proxyOptions 集合读取`getProxyFetchOptions`，供MCP 服务后续处理使用。
        const proxyOptions = getProxyFetchOptions()
        // transportOptions 集合 集中保存MCP 服务 client要一起传递的字段。
        const transportOptions: StreamableHTTPClientTransportOptions = {
          // Wrap fetchWithAuth with fresh timeout per request
          fetch: wrapFetchWithTimeout(fetchWithAuth),
          requestInit: {
            ...proxyOptions,
            headers: {
              'User-Agent': getMCPUserAgent(),
              'X-Mcp-Client-Session-Id': getSessionId(),
            },
          },
        }

        // transport更新为 `new StreamableHTTPClientTransport(`，确保MCP 服务后续读取最新状态。
        transport = new StreamableHTTPClientTransport(
          new URL(proxyUrl),
          transportOptions,
        )
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `claude.ai proxy transport created successfully`)
      // MCP 服务 client在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        (serverRef.type === 'stdio' || !serverRef.type) &&
        isClaudeInChromeMCPServer(name)
      ) {
        // Run the Chrome MCP server in-process to avoid spawning a ~325 MB subprocess
        // 从 `await import(` 解构 createChromeContext，减少MCP 服务 client对同一对象的重复访问。
        const { createChromeContext } = await import(
          '../../utils/claudeInChrome/mcpServer.js'
        )
        // 从 `await import(` 解构 createClaudeForChromeMcpServer，减少MCP 服务 client对同一对象的重复访问。
        const { createClaudeForChromeMcpServer } = await import(
          '@ant/claude-for-chrome-mcp'
        )
        // 从 `await import(` 解构 createLinkedTransportPair，减少MCP 服务 client对同一对象的重复访问。
        const { createLinkedTransportPair } = await import(
          './InProcessTransport.js'
        )
        // 上下文构建`createChromeContext`，供MCP 服务后续处理使用。
        const context = createChromeContext(serverRef.env)
        // inProcessServer更新为 `createClaudeForChromeMcpServer(context)`，确保MCP 服务后续读取最新状态。
        inProcessServer = createClaudeForChromeMcpServer(context)
        // 从 `createLinkedTransportPair()` 按位置拆出 clientTransport、serverTransport，让MCP 服务 client分别处理这些返回值。
        const [clientTransport, serverTransport] = createLinkedTransportPair()
        // 等待 `inProcessServer.connect(serverTransport)` 完成，再继续MCP 服务 client的异步流程。
        await inProcessServer.connect(serverTransport)
        // transport更新为 `clientTransport`，确保MCP 服务后续读取最新状态。
        transport = clientTransport
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `In-process Chrome MCP server started`)
      // MCP 服务 client在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        feature('CHICAGO_MCP') &&
        (serverRef.type === 'stdio' || !serverRef.type) &&
        isComputerUseMCPServer!(name)
      ) {
        // Run the Computer Use MCP server in-process — same rationale as
        // Chrome above. The package's CallTool handler is a stub; real
        // dispatch goes through wrapper.tsx's .call() override.
        // 从 `await import(` 解构 createComputerUseMcpServerForCli，减少MCP 服务 client对同一对象的重复访问。
        const { createComputerUseMcpServerForCli } = await import(
          '../../utils/computerUse/mcpServer.js'
        )
        // 从 `await import(` 解构 createLinkedTransportPair，减少MCP 服务 client对同一对象的重复访问。
        const { createLinkedTransportPair } = await import(
          './InProcessTransport.js'
        )
        // inProcessServer更新为 `await createComputerUseMcpServerForCli()`，确保MCP 服务后续读取最新状态。
        inProcessServer = await createComputerUseMcpServerForCli()
        // 从 `createLinkedTransportPair()` 按位置拆出 clientTransport、serverTransport，让MCP 服务 client分别处理这些返回值。
        const [clientTransport, serverTransport] = createLinkedTransportPair()
        // 等待 `inProcessServer.connect(serverTransport)` 完成，再继续MCP 服务 client的异步流程。
        await inProcessServer.connect(serverTransport)
        // transport更新为 `clientTransport`，确保MCP 服务后续读取最新状态。
        transport = clientTransport
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `In-process Computer Use MCP server started`)
      // MCP 服务 client在这里处理 `} else if (serverRef.type === 'stdio' || !serverRef.type) {`，完成这一小步状态转换。
      } else if (serverRef.type === 'stdio' || !serverRef.type) {
        // finalCommand 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const finalCommand =
          process.env.CLAUDE_CODE_SHELL_PREFIX || serverRef.command
        // finalArgs 集合 来自环境变量默认值，运行参数仍可在入口处覆盖。
        const finalArgs = process.env.CLAUDE_CODE_SHELL_PREFIX
          ? [[serverRef.command, ...serverRef.args].join(' ')]
          : serverRef.args
        // transport更新为 `new StdioClientTransport({`，确保MCP 服务后续读取最新状态。
        transport = new StdioClientTransport({
          command: finalCommand,
          args: finalArgs,
          env: {
            ...subprocessEnv(),
            ...serverRef.env,
          } as Record<string, string>,
          stderr: 'pipe', // prevents error output from the MCP server from printing to the UI
        })
      } else {
        // 抛出 new Error(`Unsupported server type: ${serverRef.type}`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`Unsupported server type: ${serverRef.type}`)
      }

      // Set up stderr logging for stdio transport before connecting in case there are any stderr
      // outputs emitted during the connection start (this can be useful for debugging failed connections).
      // Store handler reference for cleanup to prevent memory leaks
      // 这个回调绑定到 let stderrHandler: ((data: Buffer) => void) | undefined，负责MCP 服务在该局部场景下的响应。
      let stderrHandler: ((data: Buffer) => void) | undefined
      // stderrOutput固定为 `''`，作为MCP 服务MCP 服务 client后续展示或比较的基准。
      let stderrOutput = ''
      // 组合条件 `serverRef.type === 'stdio' || !serverRef.type` 成立时，MCP 服务才启用这条专门路径。
      if (serverRef.type === 'stdio' || !serverRef.type) {
        // stdioTransport保存`transport as StdioClientTransport`，供后续判断或组装使用。
        const stdioTransport = transport as StdioClientTransport
        // 满足 `stdioTransport.stderr` 时，MCP 服务执行该分支。
        if (stdioTransport.stderr) {
          // stderrHandler更新为 `(data: Buffer) => {`，确保MCP 服务后续读取最新状态。
          stderrHandler = (data: Buffer) => {
            // Cap stderr accumulation to prevent unbounded memory growth
            // 满足 `stderrOutput.length < 64 * 1024 * 1024` 时，MCP 服务执行该分支。
            if (stderrOutput.length < 64 * 1024 * 1024) {
              // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
              try {
                // MCP 服务 client在这里处理 `stderrOutput += data.toString()`，完成这一小步状态转换。
                stderrOutput += data.toString()
              } catch {
                // Ignore errors from exceeding max string length
              }
            }
          }
          // 调用 stdioTransport.stderr.on，触发MCP 服务此处需要的副作用。
          stdioTransport.stderr.on('data', stderrHandler)
        }
      }

      // API 客户端保存`Client`，供MCP 服务后续处理使用。
      const client = new Client(
        {
          name: 'claude-code',
          title: 'Claude Code',
          version: MACRO.VERSION ?? 'unknown',
          description: "Anthropic's agentic coding tool",
          websiteUrl: PRODUCT_URL,
        },
        {
          capabilities: {
            roots: {},
            // Empty object declares the capability. Sending {form:{},url:{}}
            // breaks Java MCP SDK servers (Spring AI) whose Elicitation class
            // has zero fields and fails on unknown properties.
            elicitation: {},
          },
        },
      )

      // Add debug logging for client events if available
      // 当 `serverRef.type` 匹配 `'http'` 时，MCP 服务执行对应分支。
      if (serverRef.type === 'http') {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Client created, setting up request handler`)
      }

      // client.setRequestHandler 写入新的状态值，使MCP 服务后续读取保持一致。
      client.setRequestHandler(ListRootsRequestSchema, async () => {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Received ListRoots request from server`)
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          roots: [
            {
              uri: `file://${getOriginalCwd()}`,
            },
          ],
        }
      })

      // Add a timeout to connection attempts to prevent tests from hanging indefinitely
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        name,
        `Starting connection with timeout of ${getConnectionTimeoutMs()}ms`,
      )

      // For HTTP transport, try a basic connectivity test first
      // 当 `serverRef.type` 匹配 `'http'` 时，MCP 服务执行对应分支。
      if (serverRef.type === 'http') {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Testing basic HTTP connectivity to ${serverRef.url}`)
        // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
        try {
          // testUrl保存`URL`，供MCP 服务后续处理使用。
          const testUrl = new URL(serverRef.url)
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            name,
            `Parsed URL: host=${testUrl.hostname}, port=${testUrl.port || 'default'}, protocol=${testUrl.protocol}`,
          )

          // Log DNS resolution attempt
          // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
          if (
            testUrl.hostname === '127.0.0.1' ||
            testUrl.hostname === 'localhost'
          ) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(name, `Using loopback address: ${testUrl.hostname}`)
          }
        } catch (urlError) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(name, `Failed to parse URL: ${urlError}`)
        }
      }

      // connectPromise 异步任务保存 `client.connect` 启动的异步任务，稍后再决定等待还是后台完成。
      const connectPromise = client.connect(transport)
      // timeoutPromise 异步任务封装成回调，供MCP 服务MCP 服务 client在事件触发或异步步骤中调用。
      const timeoutPromise = new Promise<never>((_, reject) => {
        // timeoutId保存`setTimeout`，供MCP 服务后续处理使用。
        const timeoutId = setTimeout(() => {
          // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
          const elapsed = Date.now() - connectStartTime
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            name,
            `Connection timeout triggered after ${elapsed}ms (limit: ${getConnectionTimeoutMs()}ms)`,
          )
          // 满足 `inProcessServer` 时，MCP 服务执行该分支。
          if (inProcessServer) {
            // 调用 inProcessServer.close，触发MCP 服务此处需要的副作用。
            inProcessServer.close().catch(() => {})
          }
          // 调用 transport.close，触发MCP 服务此处需要的副作用。
          transport.close().catch(() => {})
          // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
          reject(
            new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
              `MCP server "${name}" connection timed out after ${getConnectionTimeoutMs()}ms`,
              'MCP connection timeout',
            ),
          )
        }, getConnectionTimeoutMs())

        // Clean up timeout if connect resolves or rejects
        // 调用 connectPromise.then，触发MCP 服务此处需要的副作用。
        connectPromise.then(
          // 这个回调绑定到 () => {，负责MCP 服务在该局部场景下的响应。
          () => {
            // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
            clearTimeout(timeoutId)
          },
          // _error 错误信息更新为 `> {`，确保MCP 服务后续读取最新状态。
          _error => {
            // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
            clearTimeout(timeoutId)
          },
        )
      })

      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `Promise.race([connectPromise, timeoutPromise])` 完成，再继续MCP 服务 client的异步流程。
        await Promise.race([connectPromise, timeoutPromise])
        // 满足 `stderrOutput` 时，MCP 服务执行该分支。
        if (stderrOutput) {
          // 调用 logMCPError，触发MCP 服务此处需要的副作用。
          logMCPError(name, `Server stderr: ${stderrOutput}`)
          // stderrOutput更新为 `'' // Release accumulated string to prevent memory growth`，确保MCP 服务后续读取最新状态。
          stderrOutput = '' // Release accumulated string to prevent memory growth
        }
        // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
        const elapsed = Date.now() - connectStartTime
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Successfully connected (transport: ${serverRef.type || 'stdio'}) in ${elapsed}ms`,
        )
      } catch (error) {
        // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
        const elapsed = Date.now() - connectStartTime
        // SSE-specific error logging
        // 组合条件 `serverRef.type === 'sse' && error instanceof Error` 成立时，MCP 服务才启用这条专门路径。
        if (serverRef.type === 'sse' && error instanceof Error) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            name,
            `SSE Connection failed after ${elapsed}ms: ${jsonStringify({
              url: serverRef.url,
              error: error.message,
              errorType: error.constructor.name,
              stack: error.stack,
            })}`,
          )
          // 调用 logMCPError，触发MCP 服务此处需要的副作用。
          logMCPError(name, error)

          // 满足 `error instanceof UnauthorizedError` 时，MCP 服务执行该分支。
          if (error instanceof UnauthorizedError) {
            // 返回 `handleRemoteAuthFailure(name, serverRef, 'sse')`，作为MCP 服务这次计算的结果。
            return handleRemoteAuthFailure(name, serverRef, 'sse')
          }
        // MCP 服务 client在这里处理 `} else if (serverRef.type === 'http' && error instanceof Error) {`，完成这一小步状态转换。
        } else if (serverRef.type === 'http' && error instanceof Error) {
          // errorObj 错误信息保存`error as Error & {`，供后续判断或组装使用。
          const errorObj = error as Error & {
            cause?: unknown
            code?: string
            errno?: string | number
            syscall?: string
          }
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            name,
            `HTTP Connection failed after ${elapsed}ms: ${error.message} (code: ${errorObj.code || 'none'}, errno: ${errorObj.errno || 'none'})`,
          )
          // 调用 logMCPError，触发MCP 服务此处需要的副作用。
          logMCPError(name, error)

          // 满足 `error instanceof UnauthorizedError` 时，MCP 服务执行该分支。
          if (error instanceof UnauthorizedError) {
            // 返回 `handleRemoteAuthFailure(name, serverRef, 'http')`，作为MCP 服务这次计算的结果。
            return handleRemoteAuthFailure(name, serverRef, 'http')
          }
        // MCP 服务 client在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          serverRef.type === 'claudeai-proxy' &&
          error instanceof Error
        ) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            name,
            `claude.ai proxy connection failed after ${elapsed}ms: ${error.message}`,
          )
          // 调用 logMCPError，触发MCP 服务此处需要的副作用。
          logMCPError(name, error)

          // StreamableHTTPError has a `code` property with the HTTP status
          // errorCode 错误信息 命名 `(error as Error & { code?: number }).code`，让后续代码直接表达这个值的用途。
          const errorCode = (error as Error & { code?: number }).code
          // 满足 `errorCode === 401` 时，MCP 服务执行该分支。
          if (errorCode === 401) {
            // 返回 `handleRemoteAuthFailure(name, serverRef, 'claudeai-proxy')`，作为MCP 服务这次计算的结果。
            return handleRemoteAuthFailure(name, serverRef, 'claudeai-proxy')
          }
        // MCP 服务 client在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          serverRef.type === 'sse-ide' ||
          serverRef.type === 'ws-ide'
        ) {
          // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_mcp_ide_server_connection_failed', {
            connectionDurationMs: elapsed,
          })
        }
        // 满足 `inProcessServer` 时，MCP 服务执行该分支。
        if (inProcessServer) {
          // 调用 inProcessServer.close，触发MCP 服务此处需要的副作用。
          inProcessServer.close().catch(() => {})
        }
        // 调用 transport.close，触发MCP 服务此处需要的副作用。
        transport.close().catch(() => {})
        // 满足 `stderrOutput` 时，MCP 服务执行该分支。
        if (stderrOutput) {
          // 调用 logMCPError，触发MCP 服务此处需要的副作用。
          logMCPError(name, `Server stderr: ${stderrOutput}`)
        }
        // 抛出 error，阻止MCP 服务在无效状态下继续运行。
        throw error
      }

      // capabilities 集合读取`client.getServerCapabilities`，供MCP 服务后续处理使用。
      const capabilities = client.getServerCapabilities()
      // serverVersion读取`client.getServerVersion`，供MCP 服务后续处理使用。
      const serverVersion = client.getServerVersion()
      // rawInstructions 集合读取`client.getInstructions`，供MCP 服务后续处理使用。
      const rawInstructions = client.getInstructions()
      // instructions 集合保存`rawInstructions`，供后续判断或组装使用。
      let instructions = rawInstructions
      // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
      if (
        rawInstructions &&
        rawInstructions.length > MAX_MCP_DESCRIPTION_LENGTH
      ) {
        // MCP 服务 client在这里处理 `instructions =`，完成这一小步状态转换。
        instructions =
          rawInstructions.slice(0, MAX_MCP_DESCRIPTION_LENGTH) + '… [truncated]'
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Server instructions truncated from ${rawInstructions.length} to ${MAX_MCP_DESCRIPTION_LENGTH} chars`,
        )
      }

      // Log successful connection details
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        name,
        `Connection established with capabilities: ${jsonStringify({
          hasTools: !!capabilities?.tools,
          hasPrompts: !!capabilities?.prompts,
          hasResources: !!capabilities?.resources,
          hasResourceSubscribe: !!capabilities?.resources?.subscribe,
          serverVersion: serverVersion || 'unknown',
        })}`,
      )
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[MCP] Server "${name}" connected with subscribe=${!!capabilities?.resources?.subscribe}`,
      )

      // Register default elicitation handler that returns cancel during the
      // window before registerElicitationHandler overwrites it in
      // onConnectionAttempt (useManageMCPConnections).
      // client.setRequestHandler 写入新的状态值，使MCP 服务后续读取保持一致。
      client.setRequestHandler(ElicitRequestSchema, async request => {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Elicitation request received during initialization: ${jsonStringify(request)}`,
        )
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return { action: 'cancel' as const }
      })

      // 组合条件 `serverRef.type === 'sse-ide' || serverRef.type ==` 成立时，MCP 服务才启用这条专门路径。
      if (serverRef.type === 'sse-ide' || serverRef.type === 'ws-ide') {
        // ideConnectionDurationMs 集合记录时间`Date.now`，供MCP 服务后续处理使用。
        const ideConnectionDurationMs = Date.now() - connectStartTime
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_mcp_ide_server_connection_succeeded', {
          connectionDurationMs: ideConnectionDurationMs,
          serverVersion:
            serverVersion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
        try {
          // 显式忽略 `maybeNotifyIDEConnected(client)` 的返回值，只保留它触发的副作用。
          void maybeNotifyIDEConnected(client)
        } catch (error) {
          // 调用 logMCPError，触发MCP 服务此处需要的副作用。
          logMCPError(
            name,
            `Failed to send ide_connected notification: ${error}`,
          )
        }
      }

      // Enhanced connection drop detection and logging for all transport types
      // connectionStartTime记录时间`Date.now`，供MCP 服务后续处理使用。
      const connectionStartTime = Date.now()
      // hasErrorOccurred 错误信息标记MCP 服务MCP 服务 client是否启用对应路径。
      let hasErrorOccurred = false

      // Store original handlers
      // originalOnerror 错误信息保存`client.onerror`，供后续判断或组装使用。
      const originalOnerror = client.onerror
      // originalOnclose保存`client.onclose`，供后续判断或组装使用。
      const originalOnclose = client.onclose

      // The SDK's transport calls onerror on connection failures but doesn't call onclose,
      // which CC uses to trigger reconnection. We bridge this gap by tracking consecutive
      // terminal errors and manually closing after MAX_ERRORS_BEFORE_RECONNECT failures.
      // consecutiveConnectionErrors 错误信息保存`0`，供后续判断或组装使用。
      let consecutiveConnectionErrors = 0
      // MAX_ERRORS_BEFORE_RECONNECT 错误信息 命名 `3`，让后续代码直接表达这个值的用途。
      const MAX_ERRORS_BEFORE_RECONNECT = 3

      // Guard against re-entry: close() aborts in-flight streams which may fire
      // onerror again before the close chain completes.
      // hasTriggeredClose标记MCP 服务MCP 服务 client是否启用对应路径。
      let hasTriggeredClose = false

      // client.close() → transport.close() → transport.onclose → SDK's _onclose():
      // rejects all pending request handlers (so hung callTool() promises fail with
      // McpError -32000 "Connection closed") and then invokes our client.onclose
      // handler below (which clears the memo cache so the next call reconnects).
      // Calling client.onclose?.() directly would only clear the cache — pending
      // tool calls would stay hung.
      // closeTransportAndRejectPending封装成回调，供MCP 服务MCP 服务 client在事件触发或异步步骤中调用。
      const closeTransportAndRejectPending = (reason: string) => {
        // 满足 `hasTriggeredClose` 时，MCP 服务执行该分支。
        if (hasTriggeredClose) return
        // hasTriggeredClose更新为 `true`，确保MCP 服务后续读取最新状态。
        hasTriggeredClose = true
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Closing transport (${reason})`)
        // 这个回调绑定到 void client.close().catch(e => {，负责MCP 服务在该局部场景下的响应。
        void client.close().catch(e => {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(name, `Error during close: ${errorMessage(e)}`)
        })
      }

      // isTerminalConnectionError 错误信息封装成回调，供MCP 服务MCP 服务 client在事件触发或异步步骤中调用。
      const isTerminalConnectionError = (msg: string): boolean => {
        // 返回 `(`，作为MCP 服务这次计算的结果。
        return (
          msg.includes('ECONNRESET') ||
          msg.includes('ETIMEDOUT') ||
          msg.includes('EPIPE') ||
          msg.includes('EHOSTUNREACH') ||
          msg.includes('ECONNREFUSED') ||
          msg.includes('Body Timeout Error') ||
          msg.includes('terminated') ||
          // SDK SSE reconnection intermediate errors — may be wrapped around the
          // actual network error, so the substrings above won't match
          msg.includes('SSE stream disconnected') ||
          msg.includes('Failed to reconnect SSE stream')
        )
      }

      // Enhanced error handler with detailed logging
      // onerror 错误信息更新为 `(error: Error) => {`，确保MCP 服务后续读取最新状态。
      client.onerror = (error: Error) => {
        // uptime记录时间`Date.now`，供MCP 服务后续处理使用。
        const uptime = Date.now() - connectionStartTime
        // hasErrorOccurred 错误信息更新为 `true`，确保MCP 服务后续读取最新状态。
        hasErrorOccurred = true
        // transportType标记MCP 服务MCP 服务 client是否启用对应路径。
        const transportType = serverRef.type || 'stdio'

        // Log the connection drop with context
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `${transportType.toUpperCase()} connection dropped after ${Math.floor(uptime / 1000)}s uptime`,
        )

        // Log specific error details for debugging
        // 满足 `error.message` 时，MCP 服务执行该分支。
        if (error.message) {
          // 满足 `error.message.includes('ECONNRESET')` 时，MCP 服务执行该分支。
          if (error.message.includes('ECONNRESET')) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              name,
              `Connection reset - server may have crashed or restarted`,
            )
          // MCP 服务 client在这里处理 `} else if (error.message.includes('ETIMEDOUT')) {`，完成这一小步状态转换。
          } else if (error.message.includes('ETIMEDOUT')) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              name,
              `Connection timeout - network issue or server unresponsive`,
            )
          // MCP 服务 client在这里处理 `} else if (error.message.includes('ECONNREFUSED')) {`，完成这一小步状态转换。
          } else if (error.message.includes('ECONNREFUSED')) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(name, `Connection refused - server may be down`)
          // MCP 服务 client在这里处理 `} else if (error.message.includes('EPIPE')) {`，完成这一小步状态转换。
          } else if (error.message.includes('EPIPE')) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              name,
              `Broken pipe - server closed connection unexpectedly`,
            )
          // MCP 服务 client在这里处理 `} else if (error.message.includes('EHOSTUNREACH')) {`，完成这一小步状态转换。
          } else if (error.message.includes('EHOSTUNREACH')) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(name, `Host unreachable - network connectivity issue`)
          // MCP 服务 client在这里处理 `} else if (error.message.includes('ESRCH')) {`，完成这一小步状态转换。
          } else if (error.message.includes('ESRCH')) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              name,
              `Process not found - stdio server process terminated`,
            )
          // MCP 服务 client在这里处理 `} else if (error.message.includes('spawn')) {`，完成这一小步状态转换。
          } else if (error.message.includes('spawn')) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              name,
              `Failed to spawn process - check command and permissions`,
            )
          } else {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(name, `Connection error: ${error.message}`)
          }
        }

        // For HTTP transports, detect session expiry (404 + JSON-RPC -32001)
        // and close the transport so pending tool calls reject and the next
        // call reconnects with a fresh session ID.
        // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
        if (
          (transportType === 'http' || transportType === 'claudeai-proxy') &&
          isMcpSessionExpiredError(error)
        ) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            name,
            `MCP session expired (server returned 404 with session-not-found), triggering reconnection`,
          )
          // 调用 closeTransportAndRejectPending，触发MCP 服务此处需要的副作用。
          closeTransportAndRejectPending('session expired')
          // 满足 `originalOnerror` 时，MCP 服务执行该分支。
          if (originalOnerror) {
            // 调用 originalOnerror，触发MCP 服务此处需要的副作用。
            originalOnerror(error)
          }
          // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // For remote transports (SSE/HTTP), track terminal connection errors
        // and trigger reconnection via close if we see repeated failures.
        // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
        if (
          transportType === 'sse' ||
          transportType === 'http' ||
          transportType === 'claudeai-proxy'
        ) {
          // The SDK's StreamableHTTP transport fires this after exhausting its
          // own SSE reconnect attempts (default maxRetries: 2) — but it never
          // calls onclose, so pending callTool() promises hang indefinitely.
          // This is the definitive "transport gave up" signal.
          // 满足 `error.message.includes('Maximum reconnection attempts')` 时，MCP 服务执行该分支。
          if (error.message.includes('Maximum reconnection attempts')) {
            // 调用 closeTransportAndRejectPending，触发MCP 服务此处需要的副作用。
            closeTransportAndRejectPending('SSE reconnection exhausted')
            // 满足 `originalOnerror` 时，MCP 服务执行该分支。
            if (originalOnerror) {
              // 调用 originalOnerror，触发MCP 服务此处需要的副作用。
              originalOnerror(error)
            }
            // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }

          // 满足 `isTerminalConnectionError(error.message)` 时，MCP 服务执行该分支。
          if (isTerminalConnectionError(error.message)) {
            // MCP 服务 client在这里处理 `consecutiveConnectionErrors++`，完成这一小步状态转换。
            consecutiveConnectionErrors++
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              name,
              `Terminal connection error ${consecutiveConnectionErrors}/${MAX_ERRORS_BEFORE_RECONNECT}`,
            )

            // 满足 `consecutiveConnectionErrors >= MAX_ERRORS_BEFORE_` 时，MCP 服务执行该分支。
            if (consecutiveConnectionErrors >= MAX_ERRORS_BEFORE_RECONNECT) {
              // consecutiveConnectionErrors 错误信息更新为 `0`，确保MCP 服务后续读取最新状态。
              consecutiveConnectionErrors = 0
              // 调用 closeTransportAndRejectPending，触发MCP 服务此处需要的副作用。
              closeTransportAndRejectPending('max consecutive terminal errors')
            }
          } else {
            // Non-terminal error (e.g., transient issue), reset counter
            // consecutiveConnectionErrors 错误信息更新为 `0`，确保MCP 服务后续读取最新状态。
            consecutiveConnectionErrors = 0
          }
        }

        // Call original handler
        // 满足 `originalOnerror` 时，MCP 服务执行该分支。
        if (originalOnerror) {
          // 调用 originalOnerror，触发MCP 服务此处需要的副作用。
          originalOnerror(error)
        }
      }

      // Enhanced close handler with connection drop context
      // onclose更新为 `() => {`，确保MCP 服务后续读取最新状态。
      client.onclose = () => {
        // uptime记录时间`Date.now`，供MCP 服务后续处理使用。
        const uptime = Date.now() - connectionStartTime
        // transportType保存`serverRef.type ?? 'unknown'`，供后续判断或组装使用。
        const transportType = serverRef.type ?? 'unknown'

        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `${transportType.toUpperCase()} connection closed after ${Math.floor(uptime / 1000)}s (${hasErrorOccurred ? 'with errors' : 'cleanly'})`,
        )

        // Clear the memoization cache so next operation reconnects
        // 按键读取`getServerCacheKey`，供MCP 服务后续处理使用。
        const key = getServerCacheKey(name, serverRef)

        // Also clear fetch caches (keyed by server name). Reconnection
        // creates a new connection object; without clearing, the next
        // fetch would return stale tools/resources from the old connection.
        // 调用 fetchToolsForClient.cache.delete，触发MCP 服务此处需要的副作用。
        fetchToolsForClient.cache.delete(name)
        // 调用 fetchResourcesForClient.cache.delete，触发MCP 服务此处需要的副作用。
        fetchResourcesForClient.cache.delete(name)
        // 调用 fetchCommandsForClient.cache.delete，触发MCP 服务此处需要的副作用。
        fetchCommandsForClient.cache.delete(name)
        // 满足 `feature('MCP_SKILLS')` 时，MCP 服务执行该分支。
        if (feature('MCP_SKILLS')) {
          // MCP 服务 client在这里处理 `fetchMcpSkillsForClient!.cache.delete(name)`，完成这一小步状态转换。
          fetchMcpSkillsForClient!.cache.delete(name)
        }

        // 调用 connectToServer.cache.delete，触发MCP 服务此处需要的副作用。
        connectToServer.cache.delete(key)
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Cleared connection cache for reconnection`)

        // 满足 `originalOnclose` 时，MCP 服务执行该分支。
        if (originalOnclose) {
          // 调用 originalOnclose，触发MCP 服务此处需要的副作用。
          originalOnclose()
        }
      }

      // cleanup保存`async`，供MCP 服务后续处理使用。
      const cleanup = async () => {
        // In-process servers (e.g. Chrome MCP) don't have child processes or stderr
        // 满足 `inProcessServer` 时，MCP 服务执行该分支。
        if (inProcessServer) {
          // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `inProcessServer.close()` 完成，再继续MCP 服务 client的异步流程。
            await inProcessServer.close()
          } catch (error) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(name, `Error closing in-process server: ${error}`)
          }
          // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `client.close()` 完成，再继续MCP 服务 client的异步流程。
            await client.close()
          } catch (error) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(name, `Error closing client: ${error}`)
          }
          // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Remove stderr event listener to prevent memory leaks
        // 组合条件 `stderrHandler && (serverRef.type === 'stdio' || !serverRef.type)` 成立时，MCP 服务才启用这条专门路径。
        if (stderrHandler && (serverRef.type === 'stdio' || !serverRef.type)) {
          // stdioTransport保存`transport as StdioClientTransport`，供后续判断或组装使用。
          const stdioTransport = transport as StdioClientTransport
          // 调用 stdioTransport.stderr?.off('data', stderrHandler)，完成这一处局部操作。
          stdioTransport.stderr?.off('data', stderrHandler)
        }

        // For stdio transports, explicitly terminate the child process with proper signals
        // NOTE: StdioClientTransport.close() only sends an abort signal, but many MCP servers
        // (especially Docker containers) need explicit SIGINT/SIGTERM signals to trigger graceful shutdown
        // 当 `serverRef.type` 匹配 `'stdio'` 时，MCP 服务执行对应分支。
        if (serverRef.type === 'stdio') {
          // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
          try {
            // stdioTransport保存`transport as StdioClientTransport`，供后续判断或组装使用。
            const stdioTransport = transport as StdioClientTransport
            // childPid 命名 `stdioTransport.pid`，让后续代码直接表达这个值的用途。
            const childPid = stdioTransport.pid

            // 满足 `childPid` 时，MCP 服务执行该分支。
            if (childPid) {
              // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
              logMCPDebug(name, 'Sending SIGINT to MCP server process')

              // First try SIGINT (like Ctrl+C)
              // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
              try {
                // 调用 process.kill，触发MCP 服务此处需要的副作用。
                process.kill(childPid, 'SIGINT')
              } catch (error) {
                // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                logMCPDebug(name, `Error sending SIGINT: ${error}`)
                // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }

              // Wait for graceful shutdown with rapid escalation (total 500ms to keep CLI responsive)
              // 这个回调绑定到 await new Promise<void>(async resolve => {，负责MCP 服务在该局部场景下的响应。
              await new Promise<void>(async resolve => {
                // resolved标记MCP 服务MCP 服务 client是否启用对应路径。
                let resolved = false

                // Set up a timer to check if process still exists
                // checkInterval保存`setInterval`，供MCP 服务后续处理使用。
                const checkInterval = setInterval(() => {
                  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                  try {
                    // process.kill(pid, 0) checks if process exists without killing it
                    // 调用 process.kill，触发MCP 服务此处需要的副作用。
                    process.kill(childPid, 0)
                  } catch {
                    // Process no longer exists
                    // resolved缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
                    if (!resolved) {
                      // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
                      resolved = true
                      // 调用 clearInterval，触发MCP 服务此处需要的副作用。
                      clearInterval(checkInterval)
                      // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
                      clearTimeout(failsafeTimeout)
                      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                      logMCPDebug(name, 'MCP server process exited cleanly')
                      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                      resolve()
                    }
                  }
                }, 50)

                // Absolute failsafe: clear interval after 600ms no matter what
                // failsafeTimeout保存`setTimeout`，供MCP 服务后续处理使用。
                const failsafeTimeout = setTimeout(() => {
                  // resolved缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
                  if (!resolved) {
                    // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
                    resolved = true
                    // 调用 clearInterval，触发MCP 服务此处需要的副作用。
                    clearInterval(checkInterval)
                    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                    logMCPDebug(
                      name,
                      'Cleanup timeout reached, stopping process monitoring',
                    )
                    // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                    resolve()
                  }
                }, 600)

                // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                try {
                  // Wait 100ms for SIGINT to work (usually much faster)
                  // 等待 `sleep(100)` 完成，再继续MCP 服务 client的异步流程。
                  await sleep(100)

                  // resolved缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
                  if (!resolved) {
                    // Check if process still exists
                    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                    try {
                      // 调用 process.kill，触发MCP 服务此处需要的副作用。
                      process.kill(childPid, 0)
                      // Process still exists, SIGINT failed, try SIGTERM
                      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                      logMCPDebug(
                        name,
                        'SIGINT failed, sending SIGTERM to MCP server process',
                      )
                      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                      try {
                        // 调用 process.kill，触发MCP 服务此处需要的副作用。
                        process.kill(childPid, 'SIGTERM')
                      } catch (termError) {
                        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                        logMCPDebug(name, `Error sending SIGTERM: ${termError}`)
                        // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
                        resolved = true
                        // 调用 clearInterval，触发MCP 服务此处需要的副作用。
                        clearInterval(checkInterval)
                        // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
                        clearTimeout(failsafeTimeout)
                        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                        resolve()
                        // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
                        return
                      }
                    } catch {
                      // Process already exited
                      // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
                      resolved = true
                      // 调用 clearInterval，触发MCP 服务此处需要的副作用。
                      clearInterval(checkInterval)
                      // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
                      clearTimeout(failsafeTimeout)
                      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                      resolve()
                      // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
                      return
                    }

                    // Wait 400ms for SIGTERM to work (slower than SIGINT, often used for cleanup)
                    // 等待 `sleep(400)` 完成，再继续MCP 服务 client的异步流程。
                    await sleep(400)

                    // resolved缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
                    if (!resolved) {
                      // Check if process still exists
                      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                      try {
                        // 调用 process.kill，触发MCP 服务此处需要的副作用。
                        process.kill(childPid, 0)
                        // Process still exists, SIGTERM failed, force kill with SIGKILL
                        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                        logMCPDebug(
                          name,
                          'SIGTERM failed, sending SIGKILL to MCP server process',
                        )
                        // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                        try {
                          // 调用 process.kill，触发MCP 服务此处需要的副作用。
                          process.kill(childPid, 'SIGKILL')
                        } catch (killError) {
                          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                          logMCPDebug(
                            name,
                            `Error sending SIGKILL: ${killError}`,
                          )
                        }
                      } catch {
                        // Process already exited
                        // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
                        resolved = true
                        // 调用 clearInterval，触发MCP 服务此处需要的副作用。
                        clearInterval(checkInterval)
                        // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
                        clearTimeout(failsafeTimeout)
                        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                        resolve()
                      }
                    }
                  }

                  // Final timeout - always resolve after 500ms max (total cleanup time)
                  // resolved缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
                  if (!resolved) {
                    // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
                    resolved = true
                    // 调用 clearInterval，触发MCP 服务此处需要的副作用。
                    clearInterval(checkInterval)
                    // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
                    clearTimeout(failsafeTimeout)
                    // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                    resolve()
                  }
                } catch {
                  // Handle any errors in the escalation sequence
                  // resolved缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
                  if (!resolved) {
                    // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
                    resolved = true
                    // 调用 clearInterval，触发MCP 服务此处需要的副作用。
                    clearInterval(checkInterval)
                    // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
                    clearTimeout(failsafeTimeout)
                    // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                    resolve()
                  }
                }
              })
            }
          } catch (processError) {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(name, `Error terminating process: ${processError}`)
          }
        }

        // Close the client connection (which also closes the transport)
        // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `client.close()` 完成，再继续MCP 服务 client的异步流程。
          await client.close()
        } catch (error) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(name, `Error closing client: ${error}`)
        }
      }

      // Register cleanup for all transport types - even network transports might need cleanup
      // This ensures all MCP servers get properly terminated, not just stdio ones
      // cleanupUnregister保存`registerCleanup`，供MCP 服务后续处理使用。
      const cleanupUnregister = registerCleanup(cleanup)

      // Create the wrapped cleanup that includes unregistering
      // wrappedCleanup保存`async`，供MCP 服务后续处理使用。
      const wrappedCleanup = async () => {
        // 调用 cleanupUnregister?.()，完成这一处局部操作。
        cleanupUnregister?.()
        // 等待 `cleanup()` 完成，再继续MCP 服务 client的异步流程。
        await cleanup()
      }

      // connectionDurationMs 集合记录时间`Date.now`，供MCP 服务后续处理使用。
      const connectionDurationMs = Date.now() - connectStartTime
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_server_connection_succeeded', {
        connectionDurationMs,
        transportType: (serverRef.type ??
          'stdio') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        totalServers: serverStats?.totalServers,
        stdioCount: serverStats?.stdioCount,
        sseCount: serverStats?.sseCount,
        httpCount: serverStats?.httpCount,
        sseIdeCount: serverStats?.sseIdeCount,
        wsIdeCount: serverStats?.wsIdeCount,
        ...mcpBaseUrlAnalytics(serverRef),
      })
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        name,
        client,
        type: 'connected' as const,
        capabilities: capabilities ?? {},
        serverInfo: serverVersion,
        instructions,
        config: serverRef,
        cleanup: wrappedCleanup,
      }
    } catch (error) {
      // connectionDurationMs 集合记录时间`Date.now`，供MCP 服务后续处理使用。
      const connectionDurationMs = Date.now() - connectStartTime
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_server_connection_failed', {
        connectionDurationMs,
        totalServers: serverStats?.totalServers || 1,
        stdioCount:
          serverStats?.stdioCount || (serverRef.type === 'stdio' ? 1 : 0),
        sseCount: serverStats?.sseCount || (serverRef.type === 'sse' ? 1 : 0),
        httpCount:
          serverStats?.httpCount || (serverRef.type === 'http' ? 1 : 0),
        sseIdeCount:
          serverStats?.sseIdeCount || (serverRef.type === 'sse-ide' ? 1 : 0),
        wsIdeCount:
          serverStats?.wsIdeCount || (serverRef.type === 'ws-ide' ? 1 : 0),
        transportType: (serverRef.type ??
          'stdio') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...mcpBaseUrlAnalytics(serverRef),
      })
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        name,
        `Connection failed after ${connectionDurationMs}ms: ${errorMessage(error)}`,
      )
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(name, `Connection failed: ${errorMessage(error)}`)

      // 满足 `inProcessServer` 时，MCP 服务执行该分支。
      if (inProcessServer) {
        // 调用 inProcessServer.close，触发MCP 服务此处需要的副作用。
        inProcessServer.close().catch(() => {})
      }
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        name,
        type: 'failed' as const,
        config: serverRef,
        error: errorMessage(error),
      }
    }
  },
  getServerCacheKey,
)

/**
 * Clears the memoize cache for a specific server
 * @param name Server name
 * @param serverRef Server configuration
 */
// clearServerCache 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearServerCache(
  name: string,
  serverRef: ScopedMcpServerConfig,
): Promise<void> {
  // 按键读取`getServerCacheKey`，供MCP 服务后续处理使用。
  const key = getServerCacheKey(name, serverRef)

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // wrappedClient保存`connectToServer`，供MCP 服务后续处理使用。
    const wrappedClient = await connectToServer(name, serverRef)

    // 当 `wrappedClient.type` 匹配 `'connected'` 时，MCP 服务执行对应分支。
    if (wrappedClient.type === 'connected') {
      // 等待 `wrappedClient.cleanup()` 完成，再继续MCP 服务 client的异步流程。
      await wrappedClient.cleanup()
    }
  } catch {
    // Ignore errors - server might have failed to connect
  }

  // Clear from cache (both connection and fetch caches so reconnect
  // fetches fresh tools/resources/commands instead of stale ones)
  // 调用 connectToServer.cache.delete，触发MCP 服务此处需要的副作用。
  connectToServer.cache.delete(key)
  // 调用 fetchToolsForClient.cache.delete，触发MCP 服务此处需要的副作用。
  fetchToolsForClient.cache.delete(name)
  // 调用 fetchResourcesForClient.cache.delete，触发MCP 服务此处需要的副作用。
  fetchResourcesForClient.cache.delete(name)
  // 调用 fetchCommandsForClient.cache.delete，触发MCP 服务此处需要的副作用。
  fetchCommandsForClient.cache.delete(name)
  // 满足 `feature('MCP_SKILLS')` 时，MCP 服务执行该分支。
  if (feature('MCP_SKILLS')) {
    // MCP 服务 client在这里处理 `fetchMcpSkillsForClient!.cache.delete(name)`，完成这一小步状态转换。
    fetchMcpSkillsForClient!.cache.delete(name)
  }
}

/**
 * Ensures a valid connected client for an MCP server.
 * For most server types, uses the memoization cache if available, or reconnects
 * if the cache was cleared (e.g., after onclose). This ensures tool/resource
 * calls always use a valid connection.
 *
 * SDK MCP servers run in-process and are handled separately via setupSdkMcpClients,
 * so they are returned as-is without going through connectToServer.
 *
 * @param client The connected MCP server client
 * @returns Connected MCP server client (same or reconnected)
 * @throws Error if server cannot be connected
 */
// ensureConnectedClient 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureConnectedClient(
  client: ConnectedMCPServer,
): Promise<ConnectedMCPServer> {
  // SDK MCP servers run in-process and are handled separately via setupSdkMcpClients
  // 当 `client.config.type` 匹配 `'sdk'` 时，MCP 服务执行对应分支。
  if (client.config.type === 'sdk') {
    // 返回 `client`，作为MCP 服务这次计算的结果。
    return client
  }

  // connectedClient保存`connectToServer`，供MCP 服务后续处理使用。
  const connectedClient = await connectToServer(client.name, client.config)
  // `connectedClient.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
  if (connectedClient.type !== 'connected') {
    // 抛出 new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(，阻止MCP 服务在无效状态下继续运行。
    throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
      `MCP server "${client.name}" is not connected`,
      'MCP server not connected',
    )
  }
  // 返回 `connectedClient`，作为MCP 服务这次计算的结果。
  return connectedClient
}

/**
 * Compares two MCP server configurations to determine if they are equivalent.
 * Used to detect when a server needs to be reconnected due to config changes.
 */
// areMcpConfigsEqual 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function areMcpConfigsEqual(
  a: ScopedMcpServerConfig,
  b: ScopedMcpServerConfig,
): boolean {
  // Quick type check first
  // `a.type` 与 `b.type` 不一致时刷新派生状态，避免使用过期结果。
  if (a.type !== b.type) return false

  // Compare by serializing - this handles all config variations
  // We exclude 'scope' from comparison since it's metadata, not connection config
  // 从 `a` 解构 scope、其余 configA，减少MCP 服务 client对同一对象的重复访问。
  const { scope: _scopeA, ...configA } = a
  // 从 `b` 解构 scope、其余 configB，减少MCP 服务 client对同一对象的重复访问。
  const { scope: _scopeB, ...configB } = b
  // 返回 `jsonStringify(configA) === jsonStringify(configB)`，作为MCP 服务这次计算的结果。
  return jsonStringify(configA) === jsonStringify(configB)
}

// Max cache size for fetch* caches. Keyed by server name (stable across
// reconnects), bounded to prevent unbounded growth with many MCP servers.
// MCP_FETCH_CACHE_SIZE 缓存保存`20`，供后续判断或组装使用。
const MCP_FETCH_CACHE_SIZE = 20

/**
 * Encode MCP tool input for the auto-mode security classifier.
 * Exported so the auto-mode eval scripts can mirror production encoding
 * for `mcp__*` tool stubs without duplicating this logic.
 */
// mcpToolInputToAutoClassifierInput 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mcpToolInputToAutoClassifierInput(
  input: Record<string, unknown>,
  toolName: string,
): string {
  // keys 集合派生`Object.keys`，供MCP 服务后续处理使用。
  const keys = Object.keys(input)
  // 返回 `keys.length > 0`，作为MCP 服务这次计算的结果。
  return keys.length > 0
    // 这个回调绑定到 ? keys.map(k => `${k}=${String(input[k])}`).join(' ')，负责MCP 服务在该局部场景下的响应。
    ? keys.map(k => `${k}=${String(input[k])}`).join(' ')
    : toolName
}

// fetchToolsForClient保存`memoizeWithLRU`，供MCP 服务后续处理使用。
export const fetchToolsForClient = memoizeWithLRU(
  // 这个异步回调接收 client: MCPServerConnection，串起MCP 服务的等待、调用和返回。
  async (client: MCPServerConnection): Promise<Tool[]> => {
    // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (client.type !== 'connected') return []

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `!client.capabilities?.tools` 时，MCP 服务执行该分支。
      if (!client.capabilities?.tools) {
        // 返回列表结果，保留MCP 服务已经排好的条目顺序。
        return []
      }

      // 结果保存`client.request`，供MCP 服务后续处理使用。
      const result = (await client.client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      )) as ListToolsResult

      // Sanitize tool data from MCP server
      // toolsToProcess 集合保存`recursivelySanitizeUnicode`，供MCP 服务后续处理使用。
      const toolsToProcess = recursivelySanitizeUnicode(result.tools)

      // Check if we should skip the mcp__ prefix for SDK MCP servers
      // skipPrefix 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const skipPrefix =
        client.config.type === 'sdk' &&
        isEnvTruthy(process.env.CLAUDE_AGENT_SDK_MCP_NO_PREFIX)

      // Convert MCP tools to our Tool format
      // 返回 `toolsToProcess`，作为MCP 服务这次计算的结果。
      return toolsToProcess
        // 链式调用 map，继续加工上一行在MCP 服务中产生的数据。
        .map((tool): Tool => {
          // fullyQualifiedName构建`buildMcpToolName`，供MCP 服务后续处理使用。
          const fullyQualifiedName = buildMcpToolName(client.name, tool.name)
          // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
          return {
            ...MCPTool,
            // In skip-prefix mode, use the original name for model invocation so MCP tools
            // can override builtins by name. mcpInfo is used for permission checking.
            name: skipPrefix ? tool.name : fullyQualifiedName,
            mcpInfo: { serverName: client.name, toolName: tool.name },
            isMcp: true,
            // Collapse whitespace: _meta is open to external MCP servers, and
            // a newline here would inject orphan lines into the deferred-tool
            // list (formatDeferredToolLine joins on '\n').
            searchHint:
              typeof tool._meta?.['anthropic/searchHint'] === 'string'
                ? tool._meta['anthropic/searchHint']
                    .replace(/\s+/g, ' ')
                    .trim() || undefined
                : undefined,
            alwaysLoad: tool._meta?.['anthropic/alwaysLoad'] === true,
            // description 使用 无 完成MCP 服务里的对应操作。
            async description() {
              // 返回 `tool.description ?? ''`，作为MCP 服务这次计算的结果。
              return tool.description ?? ''
            },
            // prompt 使用 无 完成MCP 服务里的对应操作。
            async prompt() {
              // desc 命名 `tool.description ?? ''`，让后续代码直接表达这个值的用途。
              const desc = tool.description ?? ''
              // 返回 `desc.length > MAX_MCP_DESCRIPTION_LENGTH`，作为MCP 服务这次计算的结果。
              return desc.length > MAX_MCP_DESCRIPTION_LENGTH
                ? desc.slice(0, MAX_MCP_DESCRIPTION_LENGTH) + '… [truncated]'
                : desc
            },
            // isConcurrencySafe 用 无 判断MCP 服务是否满足条件。
            isConcurrencySafe() {
              // 返回 `tool.annotations?.readOnlyHint ?? false`，作为MCP 服务这次计算的结果。
              return tool.annotations?.readOnlyHint ?? false
            },
            // isReadOnly 用 无 判断MCP 服务是否满足条件。
            isReadOnly() {
              // 返回 `tool.annotations?.readOnlyHint ?? false`，作为MCP 服务这次计算的结果。
              return tool.annotations?.readOnlyHint ?? false
            },
            // toAutoClassifierInput 使用 input 完成MCP 服务里的对应操作。
            toAutoClassifierInput(input) {
              // 返回 `mcpToolInputToAutoClassifierInput(input, tool.name)`，作为MCP 服务这次计算的结果。
              return mcpToolInputToAutoClassifierInput(input, tool.name)
            },
            // isDestructive 用 无 判断MCP 服务是否满足条件。
            isDestructive() {
              // 返回 `tool.annotations?.destructiveHint ?? false`，作为MCP 服务这次计算的结果。
              return tool.annotations?.destructiveHint ?? false
            },
            // isOpenWorld 用 无 判断MCP 服务是否满足条件。
            isOpenWorld() {
              // 返回 `tool.annotations?.openWorldHint ?? false`，作为MCP 服务这次计算的结果。
              return tool.annotations?.openWorldHint ?? false
            },
            // isSearchOrReadCommand 用 无 判断MCP 服务是否满足条件。
            isSearchOrReadCommand() {
              // 返回 `classifyMcpToolForCollapse(client.name, tool.name)`，作为MCP 服务这次计算的结果。
              return classifyMcpToolForCollapse(client.name, tool.name)
            },
            inputJSONSchema: tool.inputSchema as Tool['inputJSONSchema'],
            // checkPermissions 使用 无 完成MCP 服务里的对应操作。
            async checkPermissions() {
              // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
              return {
                behavior: 'passthrough' as const,
                message: 'MCPTool requires permission.',
                suggestions: [
                  {
                    type: 'addRules' as const,
                    rules: [
                      {
                        toolName: fullyQualifiedName,
                        ruleContent: undefined,
                      },
                    ],
                    behavior: 'allow' as const,
                    destination: 'localSettings' as const,
                  },
                ],
              }
            },
            // MCP 服务 client在这里处理 `async call(`，完成这一小步状态转换。
            async call(
              args: Record<string, unknown>,
              context,
              _canUseTool,
              parentMessage,
              onProgress?: ToolCallProgress<MCPProgress>,
            ) {
              // toolUseId保存`extractToolUseId`，供MCP 服务后续处理使用。
              const toolUseId = extractToolUseId(parentMessage)
              // meta保存`toolUseId`，供后续判断或组装使用。
              const meta = toolUseId
                ? { 'claudecode/toolUseId': toolUseId }
                : {}

              // Emit progress when tool starts
              // 组合条件 `onProgress && toolUseId` 成立时，MCP 服务才启用这条专门路径。
              if (onProgress && toolUseId) {
                // 调用 onProgress，触发MCP 服务此处需要的副作用。
                onProgress({
                  toolUseID: toolUseId,
                  data: {
                    type: 'mcp_progress',
                    status: 'started',
                    serverName: client.name,
                    toolName: tool.name,
                  },
                })
              }

              // startTime记录时间`Date.now`，供MCP 服务后续处理使用。
              const startTime = Date.now()
              // MAX_SESSION_RETRIES 会话数据保存`1`，供MCP 服务MCP 服务 client后续判断或输出使用。
              const MAX_SESSION_RETRIES = 1
              // 循环处理 `let attempt = 0; ; attempt++`，让MCP 服务逐项把同类条目按顺序走完。
              for (let attempt = 0; ; attempt++) {
                // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                try {
                  // connectedClient保存`ensureConnectedClient`，供MCP 服务后续处理使用。
                  const connectedClient = await ensureConnectedClient(client)
                  // mcpResult保存`callMCPToolWithUrlElicitationRetry`，供MCP 服务后续处理使用。
                  const mcpResult = await callMCPToolWithUrlElicitationRetry({
                    client: connectedClient,
                    clientConnection: client,
                    tool: tool.name,
                    args,
                    meta,
                    signal: context.abortController.signal,
                    setAppState: context.setAppState,
                    onProgress:
                      onProgress && toolUseId
                        // 这个回调绑定到 ? progressData => {，负责MCP 服务在该局部场景下的响应。
                        ? progressData => {
                            // 调用 onProgress，触发MCP 服务此处需要的副作用。
                            onProgress({
                              toolUseID: toolUseId,
                              data: progressData,
                            })
                          }
                        : undefined,
                    handleElicitation: context.handleElicitation,
                  })

                  // Emit progress when tool completes successfully
                  // 组合条件 `onProgress && toolUseId` 成立时，MCP 服务才启用这条专门路径。
                  if (onProgress && toolUseId) {
                    // 调用 onProgress，触发MCP 服务此处需要的副作用。
                    onProgress({
                      toolUseID: toolUseId,
                      data: {
                        type: 'mcp_progress',
                        status: 'completed',
                        serverName: client.name,
                        toolName: tool.name,
                        elapsedTimeMs: Date.now() - startTime,
                      },
                    })
                  }

                  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
                  return {
                    data: mcpResult.content,
                    ...((mcpResult._meta || mcpResult.structuredContent) && {
                      mcpMeta: {
                        ...(mcpResult._meta && {
                          _meta: mcpResult._meta,
                        }),
                        ...(mcpResult.structuredContent && {
                          structuredContent: mcpResult.structuredContent,
                        }),
                      },
                    }),
                  }
                } catch (error) {
                  // Session expired — the connection cache has been
                  // cleared, so retry with a fresh client.
                  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
                  if (
                    error instanceof McpSessionExpiredError &&
                    attempt < MAX_SESSION_RETRIES
                  ) {
                    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                    logMCPDebug(
                      client.name,
                      `Retrying tool '${tool.name}' after session recovery`,
                    )
                    // 跳过当前项，继续处理MCP 服务中的下一轮循环。
                    continue
                  }

                  // Emit progress when tool fails
                  // 组合条件 `onProgress && toolUseId` 成立时，MCP 服务才启用这条专门路径。
                  if (onProgress && toolUseId) {
                    // 调用 onProgress，触发MCP 服务此处需要的副作用。
                    onProgress({
                      toolUseID: toolUseId,
                      data: {
                        type: 'mcp_progress',
                        status: 'failed',
                        serverName: client.name,
                        toolName: tool.name,
                        elapsedTimeMs: Date.now() - startTime,
                      },
                    })
                  }
                  // Wrap MCP SDK errors so telemetry gets useful context
                  // instead of just "Error" or "McpError" (the constructor
                  // name). MCP SDK errors are protocol-level messages and
                  // don't contain user file paths or code.
                  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
                  if (
                    error instanceof Error &&
                    !(
                      error instanceof
                      TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
                    )
                  ) {
                    // 名称保存`error.constructor.name`，供MCP 服务MCP 服务 client后续判断或输出使用。
                    const name = error.constructor.name
                    // 当 `name` 匹配 `'Error'` 时，MCP 服务执行对应分支。
                    if (name === 'Error') {
                      // 抛出 new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(，阻止MCP 服务在无效状态下继续运行。
                      throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
                        error.message,
                        error.message.slice(0, 200),
                      )
                    }
                    // McpError has a numeric `code` with the JSON-RPC error
                    // code (e.g. -32000 ConnectionClosed, -32001 RequestTimeout)
                    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
                    if (
                      name === 'McpError' &&
                      'code' in error &&
                      typeof error.code === 'number'
                    ) {
                      // 抛出 new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(，阻止MCP 服务在无效状态下继续运行。
                      throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
                        error.message,
                        `McpError ${error.code}`,
                      )
                    }
                  }
                  // 抛出 error，阻止MCP 服务在无效状态下继续运行。
                  throw error
                }
              }
            },
            // userFacingName 使用 无 完成MCP 服务里的对应操作。
            userFacingName() {
              // Prefer title annotation if available, otherwise use tool name
              // displayName标记MCP 服务MCP 服务 client是否启用对应路径。
              const displayName = tool.annotations?.title || tool.name
              // 返回 ``${client.name} - ${displayName} (MCP)``，作为MCP 服务这次计算的结果。
              return `${client.name} - ${displayName} (MCP)`
            },
            ...(isClaudeInChromeMCPServer(client.name) &&
            (client.config.type === 'stdio' || !client.config.type)
              ? claudeInChromeToolRendering().getClaudeInChromeMCPToolOverrides(
                  tool.name,
                )
              : {}),
            ...(feature('CHICAGO_MCP') &&
            (client.config.type === 'stdio' || !client.config.type) &&
            isComputerUseMCPServer!(client.name)
              ? computerUseWrapper!().getComputerUseMCPToolOverrides(tool.name)
              : {}),
          }
        })
        .filter(isIncludedMcpTool)
    } catch (error) {
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(client.name, `Failed to fetch tools: ${errorMessage(error)}`)
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return []
    }
  },
  // 这个回调绑定到 (client: MCPServerConnection) => client.name,，负责MCP 服务在该局部场景下的响应。
  (client: MCPServerConnection) => client.name,
  MCP_FETCH_CACHE_SIZE,
)

// fetchResourcesForClient保存`memoizeWithLRU`，供MCP 服务后续处理使用。
export const fetchResourcesForClient = memoizeWithLRU(
  // 这个异步回调接收 client: MCPServerConnection，串起MCP 服务的等待、调用和返回。
  async (client: MCPServerConnection): Promise<ServerResource[]> => {
    // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (client.type !== 'connected') return []

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `!client.capabilities?.resources` 时，MCP 服务执行该分支。
      if (!client.capabilities?.resources) {
        // 返回列表结果，保留MCP 服务已经排好的条目顺序。
        return []
      }

      // 结果保存`client.request`，供MCP 服务后续处理使用。
      const result = await client.client.request(
        { method: 'resources/list' },
        ListResourcesResultSchema,
      )

      // result.resources 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!result.resources) return []

      // Add server name to each resource
      // 返回 `result.resources.map(resource => ({`，作为MCP 服务这次计算的结果。
      return result.resources.map(resource => ({
        ...resource,
        server: client.name,
      }))
    } catch (error) {
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(
        client.name,
        `Failed to fetch resources: ${errorMessage(error)}`,
      )
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return []
    }
  },
  // 这个回调绑定到 (client: MCPServerConnection) => client.name,，负责MCP 服务在该局部场景下的响应。
  (client: MCPServerConnection) => client.name,
  MCP_FETCH_CACHE_SIZE,
)

// fetchCommandsForClient 命令数据保存`memoizeWithLRU`，供MCP 服务后续处理使用。
export const fetchCommandsForClient = memoizeWithLRU(
  // 这个异步回调接收 client: MCPServerConnection，串起MCP 服务的等待、调用和返回。
  async (client: MCPServerConnection): Promise<Command[]> => {
    // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (client.type !== 'connected') return []

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `!client.capabilities?.prompts` 时，MCP 服务执行该分支。
      if (!client.capabilities?.prompts) {
        // 返回列表结果，保留MCP 服务已经排好的条目顺序。
        return []
      }

      // Request prompts list from client
      // 结果保存`client.request`，供MCP 服务后续处理使用。
      const result = (await client.client.request(
        { method: 'prompts/list' },
        ListPromptsResultSchema,
      )) as ListPromptsResult

      // result.prompts 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!result.prompts) return []

      // Sanitize prompt data from MCP server
      // promptsToProcess 集合保存`recursivelySanitizeUnicode`，供MCP 服务后续处理使用。
      const promptsToProcess = recursivelySanitizeUnicode(result.prompts)

      // Convert MCP prompts to our Command format
      // 返回 `promptsToProcess.map(prompt => {`，作为MCP 服务这次计算的结果。
      return promptsToProcess.map(prompt => {
        // argNames 集合派生`Object.values`，供MCP 服务后续处理使用。
        const argNames = Object.values(prompt.arguments ?? {}).map(k => k.name)
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          type: 'prompt' as const,
          name: 'mcp__' + normalizeNameForMCP(client.name) + '__' + prompt.name,
          description: prompt.description ?? '',
          hasUserSpecifiedDescription: !!prompt.description,
          contentLength: 0, // Dynamic MCP content
          // 这个回调绑定到 isEnabled: () => true,，负责MCP 服务在该局部场景下的响应。
          isEnabled: () => true,
          isHidden: false,
          isMcp: true,
          progressMessage: 'running',
          // userFacingName 使用 无 完成MCP 服务里的对应操作。
          userFacingName() {
            // Use prompt.name (programmatic identifier) not prompt.title (display name)
            // to avoid spaces breaking slash command parsing
            // 返回 ``${client.name}:${prompt.name} (MCP)``，作为MCP 服务这次计算的结果。
            return `${client.name}:${prompt.name} (MCP)`
          },
          argNames,
          source: 'mcp',
          // getPromptForCommand 根据 args: string 读取或计算MCP 服务需要的结果。
          async getPromptForCommand(args: string) {
            // argsArray格式化`args.split`，供MCP 服务后续处理使用。
            const argsArray = args.split(' ')
            // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
            try {
              // connectedClient保存`ensureConnectedClient`，供MCP 服务后续处理使用。
              const connectedClient = await ensureConnectedClient(client)
              // 结果读取`client.getPrompt`，供MCP 服务后续处理使用。
              const result = await connectedClient.client.getPrompt({
                name: prompt.name,
                arguments: zipObject(argNames, argsArray),
              })
              // transformed保存`Promise.all`，供MCP 服务后续处理使用。
              const transformed = await Promise.all(
                // 调用 result.messages.map，触发MCP 服务此处需要的副作用。
                result.messages.map(message =>
                  transformResultContent(message.content, connectedClient.name),
                ),
              )
              // 返回 `transformed.flat()`，作为MCP 服务这次计算的结果。
              return transformed.flat()
            } catch (error) {
              // 调用 logMCPError，触发MCP 服务此处需要的副作用。
              logMCPError(
                client.name,
                `Error running command '${prompt.name}': ${errorMessage(error)}`,
              )
              // 抛出 error，阻止MCP 服务在无效状态下继续运行。
              throw error
            }
          },
        }
      })
    } catch (error) {
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(
        client.name,
        `Failed to fetch commands: ${errorMessage(error)}`,
      )
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return []
    }
  },
  // 这个回调绑定到 (client: MCPServerConnection) => client.name,，负责MCP 服务在该局部场景下的响应。
  (client: MCPServerConnection) => client.name,
  MCP_FETCH_CACHE_SIZE,
)

/**
 * Call an IDE tool directly as an RPC
 * @param toolName The name of the tool to call
 * @param args The arguments to pass to the tool
 * @param client The IDE client to use for the RPC call
 * @returns The result of the tool call
 */
// callIdeRpc 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function callIdeRpc(
  toolName: string,
  args: Record<string, unknown>,
  client: ConnectedMCPServer,
): Promise<string | ContentBlockParam[] | undefined> {
  // 结果保存`callMCPTool`，供MCP 服务后续处理使用。
  const result = await callMCPTool({
    client,
    tool: toolName,
    args,
    signal: createAbortController().signal,
  })
  // 返回 `result.content`，作为MCP 服务这次计算的结果。
  return result.content
}

/**
 * Note: This should not be called by UI components directly, they should use the reconnectMcpServer
 * function from useManageMcpConnections.
 * @param name Server name
 * @param config Server configuration
 * @returns Object containing the client connection and its resources
 */
// reconnectMcpServerImpl 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function reconnectMcpServerImpl(
  name: string,
  config: ScopedMcpServerConfig,
): Promise<{
  client: MCPServerConnection
  tools: Tool[]
  commands: Command[]
  resources?: ServerResource[]
}> {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // Invalidate the keychain cache so we read fresh credentials from disk.
    // This is necessary when another process (e.g. the VS Code extension host)
    // has modified stored tokens (cleared auth, saved new OAuth tokens) and then
    // asks the CLI subprocess to reconnect.  Without this, the subprocess would
    // use stale cached data and never notice the tokens were removed.
    // 清理相关缓存，确保MCP 服务下一次读取时重新加载最新数据。
    clearKeychainCache()

    // 等待 `clearServerCache(name, config)` 完成，再继续MCP 服务 client的异步流程。
    await clearServerCache(name, config)
    // API 客户端保存`connectToServer`，供MCP 服务后续处理使用。
    const client = await connectToServer(name, config)

    // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (client.type !== 'connected') {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        client,
        tools: [],
        commands: [],
      }
    }

    // 当 `config.type` 匹配 `'claudeai-proxy'` 时，MCP 服务执行对应分支。
    if (config.type === 'claudeai-proxy') {
      // 调用 markClaudeAiMcpConnected，触发MCP 服务此处需要的副作用。
      markClaudeAiMcpConnected(name)
    }

    // supportsResources 集合标记MCP 服务MCP 服务 client是否启用对应路径。
    const supportsResources = !!client.capabilities?.resources

    // 并行获取 tools、mcpCommands、mcpSkills、resources，缩短MCP 服务 client等待多个独立异步任务的时间。
    const [tools, mcpCommands, mcpSkills, resources] = await Promise.all([
      fetchToolsForClient(client),
      fetchCommandsForClient(client),
      feature('MCP_SKILLS') && supportsResources
        ? fetchMcpSkillsForClient!(client)
        : Promise.resolve([]),
      supportsResources ? fetchResourcesForClient(client) : Promise.resolve([]),
    ])
    // commands 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
    const commands = [...mcpCommands, ...mcpSkills]

    // Check if we need to add resource tools
    // resourceTools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const resourceTools: Tool[] = []
    // 满足 `supportsResources` 时，MCP 服务执行该分支。
    if (supportsResources) {
      // Only add resource tools if no other server has them
      // hasResourceTools 集合记录 `some` 是否成立，MCP 服务随后按该结果分支。
      const hasResourceTools = [ListMcpResourcesTool, ReadMcpResourceTool].some(
        // 工具更新为 `> tools.some(t => toolMatchesName(t, tool.name))`，确保MCP 服务后续读取最新状态。
        tool => tools.some(t => toolMatchesName(t, tool.name)),
      )
      // hasResourceTools 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!hasResourceTools) {
        // resourceTools 集合追加新条目，保持收集顺序与输入顺序一致。
        resourceTools.push(ListMcpResourcesTool, ReadMcpResourceTool)
      }
    }

    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      client,
      tools: [...tools, ...resourceTools],
      commands,
      resources: resources.length > 0 ? resources : undefined,
    }
  } catch (error) {
    // Handle errors gracefully - connection might have closed during fetch
    // 调用 logMCPError，触发MCP 服务此处需要的副作用。
    logMCPError(name, `Error during reconnection: ${errorMessage(error)}`)

    // Return with failed status
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      client: { name, type: 'failed' as const, config },
      tools: [],
      commands: [],
    }
  }
}

// Replaced 2026-03: previous implementation ran fixed-size sequential batches
// (await batch 1 fully, then start batch 2). That meant one slow server in
// batch N held up ALL servers in batch N+1, even if the other 19 slots were
// idle. pMap frees each slot as soon as its server completes, so a single
// slow server only occupies one slot instead of blocking an entire batch
// boundary. Same concurrency ceiling, same results, better scheduling.
// processBatched 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function processBatched<T>(
  items: T[],
  concurrency: number,
  // 这个回调绑定到 processor: (item: T) => Promise<void>,，负责MCP 服务在该局部场景下的响应。
  processor: (item: T) => Promise<void>,
): Promise<void> {
  // 等待 `pMap(items, processor, { concurrency })` 完成，再继续MCP 服务 client的异步流程。
  await pMap(items, processor, { concurrency })
}

// getMcpToolsCommandsAndResources 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMcpToolsCommandsAndResources(
  // MCP 服务 client在这里处理 `onConnectionAttempt: (params: {`，完成这一小步状态转换。
  onConnectionAttempt: (params: {
    client: MCPServerConnection
    tools: Tool[]
    commands: Command[]
    resources?: ServerResource[]
  }) => void,
  mcpConfigs?: Record<string, ScopedMcpServerConfig>,
): Promise<void> {
  // resourceToolsAdded标记MCP 服务MCP 服务 client是否启用对应路径。
  let resourceToolsAdded = false

  // allConfigEntries 配置派生`Object.entries`，供MCP 服务后续处理使用。
  const allConfigEntries = Object.entries(
    mcpConfigs ?? (await getAllMcpConfigs()).servers,
  )

  // Partition into disabled and active entries — disabled servers should
  // never generate HTTP connections or flow through batch processing
  // configEntries 配置 从空数组开始收集，后续循环会按处理顺序追加条目。
  const configEntries: typeof allConfigEntries = []
  // 按顺序遍历 `allConfigEntries` 中的entry，逐个交给MCP 服务处理。
  for (const entry of allConfigEntries) {
    // 满足 `isMcpServerDisabled(entry[0])` 时，MCP 服务执行该分支。
    if (isMcpServerDisabled(entry[0])) {
      // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
      onConnectionAttempt({
        client: { name: entry[0], type: 'disabled', config: entry[1] },
        tools: [],
        commands: [],
      })
    } else {
      // configEntries 配置追加新条目，保持收集顺序与输入顺序一致。
      configEntries.push(entry)
    }
  }

  // Calculate transport counts for logging
  // totalServers 集合保存 `configEntries.length` 的判断结果，供MCP 服务MCP 服务 client后续分支直接复用。
  const totalServers = configEntries.length
  // stdioCount 数量统计`count`，供MCP 服务后续处理使用。
  const stdioCount = count(configEntries, ([_, c]) => c.type === 'stdio')
  // sseCount 数量统计`count`，供MCP 服务后续处理使用。
  const sseCount = count(configEntries, ([_, c]) => c.type === 'sse')
  // httpCount 数量统计`count`，供MCP 服务后续处理使用。
  const httpCount = count(configEntries, ([_, c]) => c.type === 'http')
  // sseIdeCount 数量统计`count`，供MCP 服务后续处理使用。
  const sseIdeCount = count(configEntries, ([_, c]) => c.type === 'sse-ide')
  // wsIdeCount 数量统计`count`，供MCP 服务后续处理使用。
  const wsIdeCount = count(configEntries, ([_, c]) => c.type === 'ws-ide')

  // Split servers by type: local (stdio/sdk) need lower concurrency due to
  // process spawning, remote servers can connect with higher concurrency
  // localServers 集合筛选`configEntries.filter`，供MCP 服务后续处理使用。
  const localServers = configEntries.filter(([_, config]) =>
    isLocalMcpServer(config),
  )
  // remoteServers 集合筛选`configEntries.filter`，供MCP 服务后续处理使用。
  const remoteServers = configEntries.filter(
    // 这个回调绑定到 ([_, config]) => !isLocalMcpServer(config),，负责MCP 服务在该局部场景下的响应。
    ([_, config]) => !isLocalMcpServer(config),
  )

  // serverStats 集合集中保存MCP 服务MCP 服务 client要一起传递的字段。
  const serverStats = {
    totalServers,
    stdioCount,
    sseCount,
    httpCount,
    sseIdeCount,
    wsIdeCount,
  }

  // processServer保存`async`，供MCP 服务后续处理使用。
  const processServer = async ([name, config]: [
    string,
    ScopedMcpServerConfig,
  ]): Promise<void> => {
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // Check if server is disabled - if so, just add it to state without connecting
      // 满足 `isMcpServerDisabled(name)` 时，MCP 服务执行该分支。
      if (isMcpServerDisabled(name)) {
        // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
        onConnectionAttempt({
          client: {
            name,
            type: 'disabled',
            config,
          },
          tools: [],
          commands: [],
        })
        // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Skip connection for servers that recently returned 401 (15min TTL),
      // or that we have probed before but hold no token for. The second
      // check closes the gap the TTL leaves open: without it, every 15min
      // we re-probe servers that cannot succeed until the user runs /mcp.
      // Each probe is a network round-trip for connect-401 plus OAuth
      // discovery, and print mode awaits the whole batch (main.tsx:3503).
      // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
      if (
        (config.type === 'claudeai-proxy' ||
          config.type === 'http' ||
          config.type === 'sse') &&
        ((await isMcpAuthCached(name)) ||
          ((config.type === 'http' || config.type === 'sse') &&
            hasMcpDiscoveryButNoToken(name, config)))
      ) {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Skipping connection (cached needs-auth)`)
        // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
        onConnectionAttempt({
          client: { name, type: 'needs-auth' as const, config },
          tools: [createMcpAuthTool(name, config)],
          commands: [],
        })
        // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // API 客户端保存`connectToServer`，供MCP 服务后续处理使用。
      const client = await connectToServer(name, config, serverStats)

      // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
      if (client.type !== 'connected') {
        // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
        onConnectionAttempt({
          client,
          tools:
            client.type === 'needs-auth'
              ? [createMcpAuthTool(name, config)]
              : [],
          commands: [],
        })
        // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 当 `config.type` 匹配 `'claudeai-proxy'` 时，MCP 服务执行对应分支。
      if (config.type === 'claudeai-proxy') {
        // 调用 markClaudeAiMcpConnected，触发MCP 服务此处需要的副作用。
        markClaudeAiMcpConnected(name)
      }

      // supportsResources 集合标记MCP 服务MCP 服务 client是否启用对应路径。
      const supportsResources = !!client.capabilities?.resources

      // 并行获取 tools、mcpCommands、mcpSkills、resources，缩短MCP 服务 client等待多个独立异步任务的时间。
      const [tools, mcpCommands, mcpSkills, resources] = await Promise.all([
        fetchToolsForClient(client),
        fetchCommandsForClient(client),
        // Discover skills from skill:// resources
        feature('MCP_SKILLS') && supportsResources
          ? fetchMcpSkillsForClient!(client)
          : Promise.resolve([]),
        // Fetch resources if supported
        supportsResources
          ? fetchResourcesForClient(client)
          : Promise.resolve([]),
      ])
      // commands 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
      const commands = [...mcpCommands, ...mcpSkills]

      // If this server resources and we haven't added resource tools yet,
      // include our resource tools with this client's tools
      // resourceTools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const resourceTools: Tool[] = []
      // 组合条件 `supportsResources && !resourceToolsAdded` 成立时，MCP 服务才启用这条专门路径。
      if (supportsResources && !resourceToolsAdded) {
        // resourceToolsAdded更新为 `true`，确保MCP 服务后续读取最新状态。
        resourceToolsAdded = true
        // resourceTools 集合追加新条目，保持收集顺序与输入顺序一致。
        resourceTools.push(ListMcpResourcesTool, ReadMcpResourceTool)
      }

      // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
      onConnectionAttempt({
        client,
        tools: [...tools, ...resourceTools],
        commands,
        resources: resources.length > 0 ? resources : undefined,
      })
    } catch (error) {
      // Handle errors gracefully - connection might have closed during fetch
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(
        name,
        `Error fetching tools/commands/resources: ${errorMessage(error)}`,
      )

      // Still update with the client but no tools/commands
      // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
      onConnectionAttempt({
        client: { name, type: 'failed' as const, config },
        tools: [],
        commands: [],
      })
    }
  }

  // Process both groups concurrently, each with their own concurrency limits:
  // - Local servers (stdio/sdk): lower concurrency to avoid process spawning resource contention
  // - Remote servers: higher concurrency since they're just network connections
  // 等待 `Promise.all([` 完成，再继续MCP 服务 client的异步流程。
  await Promise.all([
    processBatched(
      localServers,
      getMcpServerConnectionBatchSize(),
      processServer,
    ),
    processBatched(
      remoteServers,
      getRemoteMcpServerConnectionBatchSize(),
      processServer,
    ),
  ])
}

// Not memoized: called only 2-3 times at startup/reconfig. The inner work
// (connectToServer, fetch*ForClient) is already cached. Memoizing here by
// mcpConfigs object ref leaked — main.tsx creates fresh config objects each call.
// prefetchAllMcpResources 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prefetchAllMcpResources(
  mcpConfigs: Record<string, ScopedMcpServerConfig>,
): Promise<{
  clients: MCPServerConnection[]
  tools: Tool[]
  commands: Command[]
}> {
  // 返回 `new Promise(resolve => {`，作为MCP 服务这次计算的结果。
  return new Promise(resolve => {
    // pendingCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let pendingCount = 0
    // completedCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let completedCount = 0

    // pendingCount 数量更新为 `Object.keys(mcpConfigs).length`，确保MCP 服务后续读取最新状态。
    pendingCount = Object.keys(mcpConfigs).length

    // 满足 `pendingCount === 0` 时，MCP 服务执行该分支。
    if (pendingCount === 0) {
      // 显式忽略 `resolve({` 的返回值，只保留它触发的副作用。
      void resolve({
        clients: [],
        tools: [],
        commands: [],
      })
      // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // clients 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const clients: MCPServerConnection[] = []
    // tools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const tools: Tool[] = []
    // commands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const commands: Command[] = []

    // 调用 getMcpToolsCommandsAndResources，触发MCP 服务此处需要的副作用。
    getMcpToolsCommandsAndResources(result => {
      // clients 集合追加新条目，保持收集顺序与输入顺序一致。
      clients.push(result.client)
      // tools 集合追加新条目，保持收集顺序与输入顺序一致。
      tools.push(...result.tools)
      // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
      commands.push(...result.commands)

      // MCP 服务 client在这里处理 `completedCount++`，完成这一小步状态转换。
      completedCount++
      // 满足 `completedCount >= pendingCount` 时，MCP 服务执行该分支。
      if (completedCount >= pendingCount) {
        // commandsMetadataLength 命令数据派生`commands.reduce`，供MCP 服务后续处理使用。
        const commandsMetadataLength = commands.reduce((sum, command) => {
          // commandMetadataLength 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const commandMetadataLength =
            command.name.length +
            (command.description ?? '').length +
            (command.argumentHint ?? '').length
          // 返回 `sum + commandMetadataLength`，作为MCP 服务这次计算的结果。
          return sum + commandMetadataLength
        }, 0)
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_mcp_tools_commands_loaded', {
          tools_count: tools.length,
          commands_count: commands.length,
          commands_metadata_length: commandsMetadataLength,
        })

        // 显式忽略 `resolve({` 的返回值，只保留它触发的副作用。
        void resolve({
          clients,
          tools,
          commands,
        })
      }
    // 这个回调绑定到 }, mcpConfigs).catch(error => {，负责MCP 服务在该局部场景下的响应。
    }, mcpConfigs).catch(error => {
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(
        'prefetchAllMcpResources',
        `Failed to get MCP resources: ${errorMessage(error)}`,
      )
      // Still resolve with empty results
      // 显式忽略 `resolve({` 的返回值，只保留它触发的副作用。
      void resolve({
        clients: [],
        tools: [],
        commands: [],
      })
    })
  })
}

/**
 * Transform result content from an MCP tool or MCP prompt into message blocks
 */
// transformResultContent 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function transformResultContent(
  resultContent: PromptMessage['content'],
  serverName: string,
): Promise<Array<ContentBlockParam>> {
  // 按照 resultContent.type 的取值选择MCP 服务的具体处理分支。
  switch (resultContent.type) {
    case 'text':
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return [
        {
          type: 'text',
          text: resultContent.text,
        },
      ]
    case 'audio': {
      // audioData保存`resultContent as {`，供MCP 服务MCP 服务 client后续判断或输出使用。
      const audioData = resultContent as {
        type: 'audio'
        data: string
        mimeType?: string
      }
      // 等待并返回 `persistBlobToTextBlock(`，调用方直接接收异步结果。
      return await persistBlobToTextBlock(
        Buffer.from(audioData.data, 'base64'),
        audioData.mimeType,
        serverName,
        `[Audio from ${serverName}] `,
      )
    }
    case 'image': {
      // Resize and compress image data, enforcing API dimension limits
      // imageBuffer保存`Buffer.from`，供MCP 服务后续处理使用。
      const imageBuffer = Buffer.from(String(resultContent.data), 'base64')
      // ext格式化`split`，供MCP 服务后续处理使用。
      const ext = resultContent.mimeType?.split('/')[1] || 'png'
      // resized统计`maybeResizeAndDownsampleImageBuffer`，供MCP 服务后续处理使用。
      const resized = await maybeResizeAndDownsampleImageBuffer(
        imageBuffer,
        imageBuffer.length,
        ext,
      )
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return [
        {
          type: 'image',
          source: {
            data: resized.buffer.toString('base64'),
            media_type:
              `image/${resized.mediaType}` as Base64ImageSource['media_type'],
            type: 'base64',
          },
        },
      ]
    }
    case 'resource': {
      // resource保存`resultContent.resource`，供MCP 服务MCP 服务 client后续判断或输出使用。
      const resource = resultContent.resource
      // prefix读取 ``[Resource from ${serverName} at ${resource.uri}] `` 对应条目，后续围绕该成员继续处理。
      const prefix = `[Resource from ${serverName} at ${resource.uri}] `

      // 满足 `'text' in resource` 时，MCP 服务执行该分支。
      if ('text' in resource) {
        // 返回列表结果，保留MCP 服务已经排好的条目顺序。
        return [
          {
            type: 'text',
            text: `${prefix}${resource.text}`,
          },
        ]
      // MCP 服务 client在这里处理 `} else if ('blob' in resource) {`，完成这一小步状态转换。
      } else if ('blob' in resource) {
        // isImage记录 `IMAGE_MIME_TYPES.has` 是否成立，MCP 服务随后按该结果分支。
        const isImage = IMAGE_MIME_TYPES.has(resource.mimeType ?? '')

        // 满足 `isImage` 时，MCP 服务执行该分支。
        if (isImage) {
          // Resize and compress image blob, enforcing API dimension limits
          // imageBuffer保存`Buffer.from`，供MCP 服务后续处理使用。
          const imageBuffer = Buffer.from(resource.blob, 'base64')
          // ext格式化`split`，供MCP 服务后续处理使用。
          const ext = resource.mimeType?.split('/')[1] || 'png'
          // resized统计`maybeResizeAndDownsampleImageBuffer`，供MCP 服务后续处理使用。
          const resized = await maybeResizeAndDownsampleImageBuffer(
            imageBuffer,
            imageBuffer.length,
            ext,
          )
          // 文本内容 从空数组开始收集，后续循环会按处理顺序追加条目。
          const content: MessageParam['content'] = []
          // 满足 `prefix` 时，MCP 服务执行该分支。
          if (prefix) {
            // 文本内容追加新条目，保持收集顺序与输入顺序一致。
            content.push({
              type: 'text',
              text: prefix,
            })
          }
          // 文本内容追加新条目，保持收集顺序与输入顺序一致。
          content.push({
            type: 'image',
            source: {
              data: resized.buffer.toString('base64'),
              media_type:
                `image/${resized.mediaType}` as Base64ImageSource['media_type'],
              type: 'base64',
            },
          })
          // 返回 `content`，作为MCP 服务这次计算的结果。
          return content
        } else {
          // 等待并返回 `persistBlobToTextBlock(`，调用方直接接收异步结果。
          return await persistBlobToTextBlock(
            Buffer.from(resource.blob, 'base64'),
            resource.mimeType,
            serverName,
            prefix,
          )
        }
      }
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return []
    }
    case 'resource_link': {
      // resourceLink保存`resultContent as ResourceLink`，供后续判断或组装使用。
      const resourceLink = resultContent as ResourceLink
      // 文本内容固定为 ``[Resource link: ${resourceLink.name}] ${resourceLink.uri...`，作为MCP 服务MCP 服务 client后续展示或比较的基准。
      let text = `[Resource link: ${resourceLink.name}] ${resourceLink.uri}`
      // 满足 `resourceLink.description` 时，MCP 服务执行该分支。
      if (resourceLink.description) {
        // MCP 服务 client在这里处理 `text += ` (${resourceLink.description})``，完成这一小步状态转换。
        text += ` (${resourceLink.description})`
      }
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return [
        {
          type: 'text',
          text,
        },
      ]
    }
    default:
      // 返回列表结果，保留MCP 服务已经排好的条目顺序。
      return []
  }
}

/**
 * Decode base64 binary content, write it to disk with the proper extension,
 * and return a small text block with the file path. Replaces the old behavior
 * of dumping raw base64 into the context.
 */
// persistBlobToTextBlock 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function persistBlobToTextBlock(
  bytes: Buffer,
  mimeType: string | undefined,
  serverName: string,
  sourceDescription: string,
): Promise<Array<ContentBlockParam>> {
  // persistId保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
  const persistId = `mcp-${normalizeNameForMCP(serverName)}-blob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  // 结果保存`persistBinaryContent`，供MCP 服务后续处理使用。
  const result = await persistBinaryContent(bytes, mimeType, persistId)

  // 满足 `'error' in result` 时，MCP 服务执行该分支。
  if ('error' in result) {
    // 返回列表结果，保留MCP 服务已经排好的条目顺序。
    return [
      {
        type: 'text',
        text: `${sourceDescription}Binary content (${mimeType || 'unknown type'}, ${bytes.length} bytes) could not be saved to disk: ${result.error}`,
      },
    ]
  }

  // 返回列表结果，保留MCP 服务已经排好的条目顺序。
  return [
    {
      type: 'text',
      text: getBinaryBlobSavedMessage(
        result.filepath,
        mimeType,
        result.size,
        sourceDescription,
      ),
    },
  ]
}

/**
 * Processes MCP tool result into a normalized format.
 */
// MCPResultType 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type MCPResultType = 'toolResult' | 'structuredContent' | 'contentArray'

// TransformedMCPResult 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type TransformedMCPResult = {
  content: MCPToolResult
  type: MCPResultType
  schema?: string
}

/**
 * Generates a compact, jq-friendly type signature for a value.
 * e.g. "{title: string, items: [{id: number, name: string}]}"
 */
// inferCompactSchema 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function inferCompactSchema(value: unknown, depth = 2): string {
  // 满足 `value === null` 时，MCP 服务执行该分支。
  if (value === null) return 'null'
  // 满足 `Array.isArray(value)` 时，MCP 服务执行该分支。
  if (Array.isArray(value)) {
    // 取值为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
    if (value.length === 0) return '[]'
    // 返回 ``[${inferCompactSchema(value[0], depth - 1)}]``，作为MCP 服务这次计算的结果。
    return `[${inferCompactSchema(value[0], depth - 1)}]`
  }
  // 当 `typeof value` 匹配 `'object'` 时，MCP 服务执行对应分支。
  if (typeof value === 'object') {
    // 满足 `depth <= 0` 时，MCP 服务执行该分支。
    if (depth <= 0) return '{...}'
    // entries 集合派生`Object.entries`，供MCP 服务后续处理使用。
    const entries = Object.entries(value).slice(0, 10)
    // 组件属性派生`entries.map`，供MCP 服务后续处理使用。
    const props = entries.map(
      // 这个回调绑定到 ([k, v]) => `${k}: ${inferCompactSchema(v, depth - 1)}`,，负责MCP 服务在该局部场景下的响应。
      ([k, v]) => `${k}: ${inferCompactSchema(v, depth - 1)}`,
    )
    // suffix派生`Object.keys`，供MCP 服务后续处理使用。
    const suffix = Object.keys(value).length > 10 ? ', ...' : ''
    // 返回 ``{${props.join(', ')}${suffix}}``，作为MCP 服务这次计算的结果。
    return `{${props.join(', ')}${suffix}}`
  }
  // 返回 `typeof value`，作为MCP 服务这次计算的结果。
  return typeof value
}

// transformMCPResult 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function transformMCPResult(
  result: unknown,
  tool: string, // Tool name for validation (e.g., "search")
  name: string, // Server name for transformation (e.g., "slack")
): Promise<TransformedMCPResult> {
  // 当 `result && typeof result` 匹配 `'object'` 时，MCP 服务执行对应分支。
  if (result && typeof result === 'object') {
    // 满足 `'toolResult' in result` 时，MCP 服务执行该分支。
    if ('toolResult' in result) {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        content: String(result.toolResult),
        type: 'toolResult',
      }
    }

    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      'structuredContent' in result &&
      result.structuredContent !== undefined
    ) {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        content: jsonStringify(result.structuredContent),
        type: 'structuredContent',
        schema: inferCompactSchema(result.structuredContent),
      }
    }

    // 组合条件 `'content' in result && Array.isArray(result.content)` 成立时，MCP 服务才启用这条专门路径。
    if ('content' in result && Array.isArray(result.content)) {
      // transformedContent保存`(`，供MCP 服务MCP 服务 client后续判断或输出使用。
      const transformedContent = (
        await Promise.all(
          // 调用 result.content.map，触发MCP 服务此处需要的副作用。
          result.content.map(item => transformResultContent(item, name)),
        )
      ).flat()
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        content: transformedContent,
        type: 'contentArray',
        schema: inferCompactSchema(transformedContent),
      }
    }
  }

  // errorMessage 消息数据保存``MCP server "${name}" tool "${tool}": unexpected response...`，作为后续固定文本处理的输入。
  const errorMessage = `MCP server "${name}" tool "${tool}": unexpected response format`
  // 调用 logMCPError，触发MCP 服务此处需要的副作用。
  logMCPError(name, errorMessage)
  // 抛出 new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(，阻止MCP 服务在无效状态下继续运行。
  throw new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
    errorMessage,
    'MCP tool unexpected response format',
  )
}

/**
 * Check if MCP content contains any image blocks.
 * Used to decide whether to persist to file (images should use truncation instead
 * to preserve image compression and viewability).
 */
// contentContainsImages 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function contentContainsImages(content: MCPToolResult): boolean {
  // 当 `!content || typeof content` 匹配 `'string'` 时，MCP 服务执行对应分支。
  if (!content || typeof content === 'string') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `content.some(block => block.type === 'image')`，作为MCP 服务这次计算的结果。
  return content.some(block => block.type === 'image')
}

// processMCPResult 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processMCPResult(
  result: unknown,
  tool: string, // Tool name for validation (e.g., "search")
  name: string, // Server name for IDE check and transformation (e.g., "slack")
): Promise<MCPToolResult> {
  // 从 `await transformMCPResult(result, tool, name)` 解构 content、type、schema，减少MCP 服务 client对同一对象的重复访问。
  const { content, type, schema } = await transformMCPResult(result, tool, name)

  // IDE tools are not going to the model directly, so we don't need to
  // handle large output.
  // 当 `name` 匹配 `'ide'` 时，MCP 服务执行对应分支。
  if (name === 'ide') {
    // 返回 `content`，作为MCP 服务这次计算的结果。
    return content
  }

  // Check if content needs truncation (i.e., is too large)
  // 满足 `!(await mcpContentNeedsTruncation(content))` 时，MCP 服务执行该分支。
  if (!(await mcpContentNeedsTruncation(content))) {
    // 返回 `content`，作为MCP 服务这次计算的结果。
    return content
  }

  // sizeEstimateTokens 集合读取`getContentSizeEstimate`，供MCP 服务后续处理使用。
  const sizeEstimateTokens = getContentSizeEstimate(content)

  // If large output files feature is disabled, fall back to old truncation behavior
  // 满足 `isEnvDefinedFalsy(process.env.ENABLE_MCP_LARGE_OUTPUT_FILES)` 时，MCP 服务执行该分支。
  if (isEnvDefinedFalsy(process.env.ENABLE_MCP_LARGE_OUTPUT_FILES)) {
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_large_result_handled', {
      outcome: 'truncated',
      reason: 'env_disabled',
      sizeEstimateTokens,
    } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
    // 等待并返回 `truncateMcpContentIfNeeded(content)`，调用方直接接收异步结果。
    return await truncateMcpContentIfNeeded(content)
  }

  // Save large output to file and return instructions for reading it
  // Content is guaranteed to exist at this point (we checked mcpContentNeedsTruncation)
  // 文本内容缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!content) {
    // 返回 `content`，作为MCP 服务这次计算的结果。
    return content
  }

  // If content contains images, fall back to truncation - persisting images as JSON
  // defeats the image compression logic and makes them non-viewable
  // 满足 `contentContainsImages(content)` 时，MCP 服务执行该分支。
  if (contentContainsImages(content)) {
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_large_result_handled', {
      outcome: 'truncated',
      reason: 'contains_images',
      sizeEstimateTokens,
    } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
    // 等待并返回 `truncateMcpContentIfNeeded(content)`，调用方直接接收异步结果。
    return await truncateMcpContentIfNeeded(content)
  }

  // Generate a unique ID for the persisted file (server__tool-timestamp)
  // timestamp记录时间`Date.now`，供MCP 服务后续处理使用。
  const timestamp = Date.now()
  // persistId保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
  const persistId = `mcp-${normalizeNameForMCP(name)}-${normalizeNameForMCP(tool)}-${timestamp}`
  // Convert to string for persistence (persistToolResult expects string or specific block types)
  // contentStr 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const contentStr =
    typeof content === 'string' ? content : jsonStringify(content, null, 2)
  // persistResult保存`persistToolResult`，供MCP 服务后续处理使用。
  const persistResult = await persistToolResult(contentStr, persistId)

  // 满足 `isPersistError(persistResult)` 时，MCP 服务执行该分支。
  if (isPersistError(persistResult)) {
    // If file save failed, fall back to returning truncated content info
    // contentLength 数量保存 `contentStr.length` 的判断结果，供MCP 服务MCP 服务 client后续分支直接复用。
    const contentLength = contentStr.length
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_large_result_handled', {
      outcome: 'truncated',
      reason: 'persist_failed',
      sizeEstimateTokens,
    } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
    // 返回 ``Error: result (${contentLength.toLocaleString()} characters) exceeds m...`，作为MCP 服务这次计算的结果。
    return `Error: result (${contentLength.toLocaleString()} characters) exceeds maximum allowed tokens. Failed to save output to file: ${persistResult.error}. If this MCP server provides pagination or filtering tools, use them to retrieve specific portions of the data.`
  }

  // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_mcp_large_result_handled', {
    outcome: 'persisted',
    reason: 'file_saved',
    sizeEstimateTokens,
    persistedSizeChars: persistResult.originalSize,
  } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)

  // formatDescription读取`getFormatDescription`，供MCP 服务后续处理使用。
  const formatDescription = getFormatDescription(type, schema)
  // 返回 `getLargeOutputInstructions(`，作为MCP 服务这次计算的结果。
  return getLargeOutputInstructions(
    persistResult.filepath,
    persistResult.originalSize,
    formatDescription,
  )
}

/**
 * Call an MCP tool, handling UrlElicitationRequiredError (-32042) by
 * displaying the URL elicitation to the user, waiting for the completion
 * notification, and retrying the tool call.
 */
// MCPToolCallResult 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type MCPToolCallResult = {
  content: MCPToolResult
  _meta?: Record<string, unknown>
  structuredContent?: Record<string, unknown>
}

/** @internal Exported for testing. */
// callMCPToolWithUrlElicitationRetry 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function callMCPToolWithUrlElicitationRetry({
  client: connectedClient,
  clientConnection,
  tool,
  args,
  meta,
  signal,
  setAppState,
  onProgress,
  callToolFn = callMCPTool,
  handleElicitation,
}: {
  client: ConnectedMCPServer
  clientConnection: MCPServerConnection
  tool: string
  args: Record<string, unknown>
  meta?: Record<string, unknown>
  signal: AbortSignal
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void，负责MCP 服务在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void
  onProgress?: (data: MCPProgress) => void
  /** Injectable for testing. Defaults to callMCPTool. */
  callToolFn?: (opts: {
    client: ConnectedMCPServer
    tool: string
    args: Record<string, unknown>
    meta?: Record<string, unknown>
    signal: AbortSignal
    // 这个回调绑定到 onProgress?: (data: MCPProgress) => void，负责MCP 服务在该局部场景下的响应。
    onProgress?: (data: MCPProgress) => void
  }) => Promise<MCPToolCallResult>
  /** Handler for URL elicitations when no hook handles them.
   * In print/SDK mode, delegates to structuredIO. In REPL, falls back to queue. */
  // MCP 服务 client在这里处理 `handleElicitation?: (`，完成这一小步状态转换。
  handleElicitation?: (
    serverName: string,
    params: ElicitRequestURLParams,
    signal: AbortSignal,
  ) => Promise<ElicitResult>
}): Promise<MCPToolCallResult> {
  // MAX_URL_ELICITATION_RETRIES 集合保存`3`，供MCP 服务MCP 服务 client后续判断或输出使用。
  const MAX_URL_ELICITATION_RETRIES = 3
  // 循环处理 `let attempt = 0; ; attempt++`，让MCP 服务逐项把同类条目按顺序走完。
  for (let attempt = 0; ; attempt++) {
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `callToolFn({`，调用方直接接收异步结果。
      return await callToolFn({
        client: connectedClient,
        tool,
        args,
        meta,
        signal,
        onProgress,
      })
    } catch (error) {
      // The MCP SDK's Protocol creates plain McpError (not UrlElicitationRequiredError)
      // for error responses, so we check the error code instead of instanceof.
      // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
      if (
        !(error instanceof McpError) ||
        error.code !== ErrorCode.UrlElicitationRequired
      ) {
        // 抛出 error，阻止MCP 服务在无效状态下继续运行。
        throw error
      }

      // Limit the number of URL elicitation retries
      // 满足 `attempt >= MAX_URL_ELICITATION_RETRIES` 时，MCP 服务执行该分支。
      if (attempt >= MAX_URL_ELICITATION_RETRIES) {
        // 抛出 error，阻止MCP 服务在无效状态下继续运行。
        throw error
      }

      // errorData 错误信息保存`error.data`，供后续判断或组装使用。
      const errorData = error.data
      // rawElicitations 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const rawElicitations =
        errorData != null &&
        typeof errorData === 'object' &&
        'elicitations' in errorData &&
        Array.isArray(errorData.elicitations)
          ? (errorData.elicitations as unknown[])
          : []

      // Validate each element has the required fields for ElicitRequestURLParams
      // elicitations 集合筛选`rawElicitations.filter`，供MCP 服务后续处理使用。
      const elicitations = rawElicitations.filter(
        // 这个回调绑定到 (e): e is ElicitRequestURLParams => {，负责MCP 服务在该局部场景下的响应。
        (e): e is ElicitRequestURLParams => {
          // `e == null || typeof e` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
          if (e == null || typeof e !== 'object') return false
          // obj保存`e as Record<string, unknown>`，供后续判断或组装使用。
          const obj = e as Record<string, unknown>
          // 返回 `(`，作为MCP 服务这次计算的结果。
          return (
            obj.mode === 'url' &&
            typeof obj.url === 'string' &&
            typeof obj.elicitationId === 'string' &&
            typeof obj.message === 'string'
          )
        },
      )

      // serverName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const serverName =
        clientConnection.type === 'connected'
          ? clientConnection.name
          : 'unknown'

      // elicitations 集合为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
      if (elicitations.length === 0) {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          serverName,
          `Tool '${tool}' returned -32042 but no valid elicitations in error data`,
        )
        // 抛出 error，阻止MCP 服务在无效状态下继续运行。
        throw error
      }

      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        serverName,
        `Tool '${tool}' requires URL elicitation (error -32042, attempt ${attempt + 1}), processing ${elicitations.length} elicitation(s)`,
      )

      // Process each URL elicitation from the error.
      // The completion notification handler (in registerElicitationHandler) sets
      // `completed: true` on the matching queue event; the dialog reacts to this flag.
      // 按顺序遍历 `elicitations` 中的elicitation，逐个交给MCP 服务处理。
      for (const elicitation of elicitations) {
        // 从 `elicitation` 解构 elicitationId，减少MCP 服务 client对同一对象的重复访问。
        const { elicitationId } = elicitation

        // Run elicitation hooks — they can resolve URL elicitations programmatically
        // hookResponse 响应数据保存`runElicitationHooks`，供MCP 服务后续处理使用。
        const hookResponse = await runElicitationHooks(
          serverName,
          elicitation,
          signal,
        )
        // 满足 `hookResponse` 时，MCP 服务执行该分支。
        if (hookResponse) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            serverName,
            `URL elicitation ${elicitationId} resolved by hook: ${jsonStringify(hookResponse)}`,
          )
          // `hookResponse.action` 与 `'accept'` 不一致时刷新派生状态，避免使用过期结果。
          if (hookResponse.action !== 'accept') {
            // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
            return {
              content: `URL elicitation was ${hookResponse.action === 'decline' ? 'declined' : hookResponse.action + 'ed'} by a hook. The tool "${tool}" could not complete because it requires the user to open a URL.`,
            }
          }
          // Hook accepted — skip the UI and proceed to retry
          // 跳过当前项，继续处理MCP 服务中的下一轮循环。
          continue
        }

        // Resolve the URL elicitation via callback (print/SDK mode) or queue (REPL mode).
        // userResult 先占位，稍后的条件分支会根据实际输入补齐它。
        let userResult: ElicitResult
        // 满足 `handleElicitation` 时，MCP 服务执行该分支。
        if (handleElicitation) {
          // Print/SDK mode: delegate to structuredIO which sends a control request
          // userResult更新为 `await handleElicitation(serverName, elicitation, signal)`，确保MCP 服务后续读取最新状态。
          userResult = await handleElicitation(serverName, elicitation, signal)
        } else {
          // REPL mode: queue for ElicitationDialog with two-phase consent/waiting flow
          // waitingState 状态 集中保存MCP 服务 client要一起传递的字段。
          const waitingState: ElicitationWaitingState = {
            actionLabel: 'Retry now',
            showCancel: true,
          }
          // userResult更新为 `await new Promise<ElicitResult>(resolve => {`，确保MCP 服务后续读取最新状态。
          userResult = await new Promise<ElicitResult>(resolve => {
            // onAbort封装成回调，供MCP 服务MCP 服务 client在事件触发或异步步骤中调用。
            const onAbort = () => {
              // 显式忽略 `resolve({ action: 'cancel' })` 的返回值，只保留它触发的副作用。
              void resolve({ action: 'cancel' })
            }
            // 满足 `signal.aborted` 时，MCP 服务执行该分支。
            if (signal.aborted) {
              // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
              onAbort()
              // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // 调用 signal.addEventListener，触发MCP 服务此处需要的副作用。
            signal.addEventListener('abort', onAbort, { once: true })

            // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              elicitation: {
                queue: [
                  ...prev.elicitation.queue,
                  {
                    serverName,
                    requestId: `error-elicit-${elicitationId}`,
                    params: elicitation,
                    signal,
                    waitingState,
                    // 这个回调绑定到 respond: result => {，负责MCP 服务在该局部场景下的响应。
                    respond: result => {
                      // Phase 1 consent: accept is a no-op (doesn't resolve retry Promise)
                      // 当 `result.action` 匹配 `'accept'` 时，MCP 服务执行对应分支。
                      if (result.action === 'accept') {
                        // MCP 服务 client在这里结束当前路径，避免继续执行不适用的后续分支。
                        return
                      }
                      // Decline or cancel: resolve the retry Promise
                      // 调用 signal.removeEventListener，触发MCP 服务此处需要的副作用。
                      signal.removeEventListener('abort', onAbort)
                      // 显式忽略 `resolve(result)` 的返回值，只保留它触发的副作用。
                      void resolve(result)
                    },
                    // 这个回调绑定到 onWaitingDismiss: action => {，负责MCP 服务在该局部场景下的响应。
                    onWaitingDismiss: action => {
                      // 调用 signal.removeEventListener，触发MCP 服务此处需要的副作用。
                      signal.removeEventListener('abort', onAbort)
                      // 当 `action` 匹配 `'retry'` 时，MCP 服务执行对应分支。
                      if (action === 'retry') {
                        // 显式忽略 `resolve({ action: 'accept' })` 的返回值，只保留它触发的副作用。
                        void resolve({ action: 'accept' })
                      } else {
                        // 显式忽略 `resolve({ action: 'cancel' })` 的返回值，只保留它触发的副作用。
                        void resolve({ action: 'cancel' })
                      }
                    },
                  },
                ],
              },
            }))
          })
        }

        // Run ElicitationResult hooks — they can modify or block the response
        // finalResult保存`runElicitationResultHooks`，供MCP 服务后续处理使用。
        const finalResult = await runElicitationResultHooks(
          serverName,
          userResult,
          signal,
          'url',
          elicitationId,
        )

        // `finalResult.action` 与 `'accept'` 不一致时刷新派生状态，避免使用过期结果。
        if (finalResult.action !== 'accept') {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            serverName,
            `User ${finalResult.action === 'decline' ? 'declined' : finalResult.action + 'ed'} URL elicitation ${elicitationId}`,
          )
          // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
          return {
            content: `URL elicitation was ${finalResult.action === 'decline' ? 'declined' : finalResult.action + 'ed'} by the user. The tool "${tool}" could not complete because it requires the user to open a URL.`,
          }
        }

        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          serverName,
          `Elicitation ${elicitationId} completed, retrying tool call`,
        )
      }

      // Loop back to retry the tool call
    }
  }
}

// callMCPTool 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function callMCPTool({
  client: { client, name, config },
  tool,
  args,
  meta,
  signal,
  onProgress,
}: {
  client: ConnectedMCPServer
  tool: string
  args: Record<string, unknown>
  meta?: Record<string, unknown>
  signal: AbortSignal
  // 这个回调绑定到 onProgress?: (data: MCPProgress) => void，负责MCP 服务在该局部场景下的响应。
  onProgress?: (data: MCPProgress) => void
}): Promise<{
  content: MCPToolResult
  _meta?: Record<string, unknown>
  structuredContent?: Record<string, unknown>
}> {
  // toolStartTime记录时间`Date.now`，供MCP 服务后续处理使用。
  const toolStartTime = Date.now()
  // progressInterval 先占位，稍后的条件分支会根据实际输入补齐它。
  let progressInterval: NodeJS.Timeout | undefined

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(name, `Calling MCP tool: ${tool}`)

    // Set up progress logging for long-running tools (every 30 seconds)
    // progressInterval更新为 `setInterval(`，确保MCP 服务后续读取最新状态。
    progressInterval = setInterval(
      // 这个回调绑定到 (startTime, name, tool) => {，负责MCP 服务在该局部场景下的响应。
      (startTime, name, tool) => {
        // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
        const elapsed = Date.now() - startTime
        // elapsedSeconds 集合保存`Math.floor`，供MCP 服务后续处理使用。
        const elapsedSeconds = Math.floor(elapsed / 1000)
        // duration 命名 ``${elapsedSeconds}s``，让后续代码直接表达这个值的用途。
        const duration = `${elapsedSeconds}s`
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(name, `Tool '${tool}' still running (${duration} elapsed)`)
      },
      30000, // Log every 30 seconds
      toolStartTime,
      name,
      tool,
    )

    // Use Promise.race with our own timeout to handle cases where SDK's
    // internal timeout doesn't work (e.g., SSE stream breaks mid-request)
    // timeoutMs 集合读取`getMcpToolTimeoutMs`，供MCP 服务后续处理使用。
    const timeoutMs = getMcpToolTimeoutMs()
    // timeoutId 先占位，稍后的条件分支会根据实际输入补齐它。
    let timeoutId: NodeJS.Timeout | undefined

    // timeoutPromise 异步任务封装成回调，供MCP 服务MCP 服务 client在事件触发或异步步骤中调用。
    const timeoutPromise = new Promise<never>((_, reject) => {
      // timeoutId更新为 `setTimeout(`，确保MCP 服务后续读取最新状态。
      timeoutId = setTimeout(
        // 这个回调绑定到 (reject, name, tool, timeoutMs) => {，负责MCP 服务在该局部场景下的响应。
        (reject, name, tool, timeoutMs) => {
          // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
          reject(
            new TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
              `MCP server "${name}" tool "${tool}" timed out after ${Math.floor(timeoutMs / 1000)}s`,
              'MCP tool timeout',
            ),
          )
        },
        timeoutMs,
        reject,
        name,
        tool,
        timeoutMs,
      )
    })

    // 结果保存`Promise.race`，供MCP 服务后续处理使用。
    const result = await Promise.race([
      client.callTool(
        {
          name: tool,
          arguments: args,
          _meta: meta,
        },
        CallToolResultSchema,
        {
          signal,
          timeout: timeoutMs,
          onprogress: onProgress
            // 这个回调绑定到 ? sdkProgress => {，负责MCP 服务在该局部场景下的响应。
            ? sdkProgress => {
                // 调用 onProgress，触发MCP 服务此处需要的副作用。
                onProgress({
                  type: 'mcp_progress',
                  status: 'progress',
                  serverName: name,
                  toolName: tool,
                  progress: sdkProgress.progress,
                  total: sdkProgress.total,
                  progressMessage: sdkProgress.message,
                })
              }
            : undefined,
        },
      ),
      timeoutPromise,
    // 这个回调绑定到 ]).finally(() => {，负责MCP 服务在该局部场景下的响应。
    ]).finally(() => {
      // 满足 `timeoutId` 时，MCP 服务执行该分支。
      if (timeoutId) {
        // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
        clearTimeout(timeoutId)
      }
    })

    // 组合条件 `'isError' in result && result.isError` 成立时，MCP 服务才启用这条专门路径。
    if ('isError' in result && result.isError) {
      // errorDetails 错误信息固定为 `'Unknown error'`，作为MCP 服务MCP 服务 client后续展示或比较的基准。
      let errorDetails = 'Unknown error'
      // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
      if (
        'content' in result &&
        Array.isArray(result.content) &&
        result.content.length > 0
      ) {
        // firstContent读取 `result.content[0]` 对应条目，后续围绕该成员继续处理。
        const firstContent = result.content[0]
        // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
        if (
          firstContent &&
          typeof firstContent === 'object' &&
          'text' in firstContent
        ) {
          // errorDetails 错误信息更新为 `firstContent.text`，确保MCP 服务后续读取最新状态。
          errorDetails = firstContent.text
        }
      // MCP 服务 client在这里处理 `} else if ('error' in result) {`，完成这一小步状态转换。
      } else if ('error' in result) {
        // Fallback for legacy error format
        // errorDetails 错误信息更新为 `String(result.error)`，确保MCP 服务后续读取最新状态。
        errorDetails = String(result.error)
      }
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(name, errorDetails)
      // 抛出 new McpToolCallError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(，阻止MCP 服务在无效状态下继续运行。
      throw new McpToolCallError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS(
        errorDetails,
        'MCP tool returned error',
        '_meta' in result && result._meta ? { _meta: result._meta } : undefined,
      )
    }
    // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
    const elapsed = Date.now() - toolStartTime
    // duration 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const duration =
      elapsed < 1000
        ? `${elapsed}ms`
        : elapsed < 60000
          ? `${Math.floor(elapsed / 1000)}s`
          : `${Math.floor(elapsed / 60000)}m ${Math.floor((elapsed % 60000) / 1000)}s`

    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(name, `Tool '${tool}' completed successfully in ${duration}`)

    // Log code indexing tool usage
    // codeIndexingTool 索引读取`detectCodeIndexingFromMcpServerName`，供MCP 服务后续处理使用。
    const codeIndexingTool = detectCodeIndexingFromMcpServerName(name)
    // 满足 `codeIndexingTool` 时，MCP 服务执行该分支。
    if (codeIndexingTool) {
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_code_indexing_tool_used', {
        tool: codeIndexingTool as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        source:
          'mcp' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        success: true,
      })
    }

    // 文本内容保存`processMCPResult`，供MCP 服务后续处理使用。
    const content = await processMCPResult(result, tool, name)
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      content,
      _meta: result._meta as Record<string, unknown> | undefined,
      structuredContent: result.structuredContent as
        | Record<string, unknown>
        | undefined,
    }
  } catch (e) {
    // Clear intervals on error
    // `progressInterval` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (progressInterval !== undefined) {
      // 调用 clearInterval，触发MCP 服务此处需要的副作用。
      clearInterval(progressInterval)
    }

    // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
    const elapsed = Date.now() - toolStartTime

    // `e instanceof Error && e.name` 与 `'AbortError'` 不一致时刷新派生状态，避免使用过期结果。
    if (e instanceof Error && e.name !== 'AbortError') {
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        name,
        `Tool '${tool}' failed after ${Math.floor(elapsed / 1000)}s: ${e.message}`,
      )
    }

    // Check for 401 errors indicating expired/invalid OAuth tokens
    // The MCP SDK's StreamableHTTPError has a `code` property with the HTTP status
    // 满足 `e instanceof Error` 时，MCP 服务执行该分支。
    if (e instanceof Error) {
      // errorCode 错误信息固定为 `'code' in e ? (e.code as number | undefined) : undefined`，作为MCP 服务MCP 服务 client后续展示或比较的基准。
      const errorCode = 'code' in e ? (e.code as number | undefined) : undefined
      // 组合条件 `errorCode === 401 || e instanceof UnauthorizedErr` 成立时，MCP 服务才启用这条专门路径。
      if (errorCode === 401 || e instanceof UnauthorizedError) {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `Tool call returned 401 Unauthorized - token may have expired`,
        )
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_mcp_tool_call_auth_error', {})
        // 抛出 new McpAuthError(，阻止MCP 服务在无效状态下继续运行。
        throw new McpAuthError(
          name,
          `MCP server "${name}" requires re-authorization (token expired)`,
        )
      }

      // Check for session expiry — two error shapes can surface here:
      // 1. Direct 404 + JSON-RPC -32001 from the server (StreamableHTTPError)
      // 2. -32000 "Connection closed" (McpError) — the SDK closes the transport
      //    after the onerror handler fires, so the pending callTool() rejects
      //    with this derived error instead of the original 404.
      // In both cases, clear the connection cache so the next tool call
      // creates a fresh session.
      // isSessionExpired 会话数据记录 `isMcpSessionExpiredError` 是否成立，MCP 服务随后按该结果分支。
      const isSessionExpired = isMcpSessionExpiredError(e)
      // isConnectionClosedOnHttp 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isConnectionClosedOnHttp =
        'code' in e &&
        (e as Error & { code?: number }).code === -32000 &&
        e.message.includes('Connection closed') &&
        (config.type === 'http' || config.type === 'claudeai-proxy')
      // 组合条件 `isSessionExpired || isConnectionClosedOnHttp` 成立时，MCP 服务才启用这条专门路径。
      if (isSessionExpired || isConnectionClosedOnHttp) {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          name,
          `MCP session expired during tool call (${isSessionExpired ? '404/-32001' : 'connection closed'}), clearing connection cache for re-initialization`,
        )
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_mcp_session_expired', {})
        // 等待 `clearServerCache(name, config)` 完成，再继续MCP 服务 client的异步流程。
        await clearServerCache(name, config)
        // 抛出 new McpSessionExpiredError(name)，阻止MCP 服务在无效状态下继续运行。
        throw new McpSessionExpiredError(name)
      }
    }

    // When the users hits esc, avoid logspew
    // `!(e instanceof Error) || e.name` 与 `'AbortError'` 不一致时刷新派生状态，避免使用过期结果。
    if (!(e instanceof Error) || e.name !== 'AbortError') {
      // 抛出 e，阻止MCP 服务在无效状态下继续运行。
      throw e
    }
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { content: undefined }
  } finally {
    // Always clear intervals
    // `progressInterval` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (progressInterval !== undefined) {
      // 调用 clearInterval，触发MCP 服务此处需要的副作用。
      clearInterval(progressInterval)
    }
  }
}

// extractToolUseId 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractToolUseId(message: AssistantMessage): string | undefined {
  // `message.message.content[0]?.type` 与 `'tool_use'` 不一致时刷新派生状态，避免使用过期结果。
  if (message.message.content[0]?.type !== 'tool_use') {
    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  }
  // 返回 `message.message.content[0].id`，作为MCP 服务这次计算的结果。
  return message.message.content[0].id
}

/**
 * Sets up SDK MCP clients by creating transports and connecting them.
 * This is used for SDK MCP servers that run in the same process as the SDK.
 *
 * @param sdkMcpConfigs - The SDK MCP server configurations
 * @param sendMcpMessage - Callback to send MCP messages through the control channel
 * @returns Connected clients, their tools, and transport map for message routing
 */
// setupSdkMcpClients 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setupSdkMcpClients(
  sdkMcpConfigs: Record<string, McpSdkServerConfig>,
  // MCP 服务 client在这里处理 `sendMcpMessage: (`，完成这一小步状态转换。
  sendMcpMessage: (
    serverName: string,
    message: JSONRPCMessage,
  ) => Promise<JSONRPCMessage>,
): Promise<{
  clients: MCPServerConnection[]
  tools: Tool[]
}> {
  // clients 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const clients: MCPServerConnection[] = []
  // tools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const tools: Tool[] = []

  // Connect to all servers in parallel
  // 结果列表保存`Promise.allSettled`，供MCP 服务后续处理使用。
  const results = await Promise.allSettled(
    // 调用 Object.entries，触发MCP 服务此处需要的副作用。
    Object.entries(sdkMcpConfigs).map(async ([name, config]) => {
      // transport保存`SdkControlClientTransport`，供MCP 服务后续处理使用。
      const transport = new SdkControlClientTransport(name, sendMcpMessage)

      // API 客户端保存`Client`，供MCP 服务后续处理使用。
      const client = new Client(
        {
          name: 'claude-code',
          title: 'Claude Code',
          version: MACRO.VERSION ?? 'unknown',
          description: "Anthropic's agentic coding tool",
          websiteUrl: PRODUCT_URL,
        },
        {
          capabilities: {},
        },
      )

      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // Connect the client
        // 等待 `client.connect(transport)` 完成，再继续MCP 服务 client的异步流程。
        await client.connect(transport)

        // Get capabilities from the server
        // capabilities 集合读取`client.getServerCapabilities`，供MCP 服务后续处理使用。
        const capabilities = client.getServerCapabilities()

        // Create the connected client object
        // connectedClient 集中保存MCP 服务 client要一起传递的字段。
        const connectedClient: MCPServerConnection = {
          type: 'connected',
          name,
          capabilities: capabilities || {},
          client,
          config: { ...config, scope: 'dynamic' as const },
          // 这个回调绑定到 cleanup: async () => {，负责MCP 服务在该局部场景下的响应。
          cleanup: async () => {
            // 等待 `client.close()` 完成，再继续MCP 服务 client的异步流程。
            await client.close()
          },
        }

        // Fetch tools if the server has them
        // serverTools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
        const serverTools: Tool[] = []
        // 满足 `capabilities?.tools` 时，MCP 服务执行该分支。
        if (capabilities?.tools) {
          // sdkTools 集合读取`fetchToolsForClient`，供MCP 服务后续处理使用。
          const sdkTools = await fetchToolsForClient(connectedClient)
          // serverTools 集合追加新条目，保持收集顺序与输入顺序一致。
          serverTools.push(...sdkTools)
        }

        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          client: connectedClient,
          tools: serverTools,
        }
      } catch (error) {
        // If connection fails, return failed server
        // 调用 logMCPError，触发MCP 服务此处需要的副作用。
        logMCPError(name, `Failed to connect SDK MCP server: ${error}`)
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          client: {
            type: 'failed' as const,
            name,
            config: { ...config, scope: 'user' as const },
          },
          tools: [],
        }
      }
    }),
  )

  // Process results and collect clients and tools
  // 按顺序遍历 `results` 中的结果，逐个交给MCP 服务处理。
  for (const result of results) {
    // 当 `result.status` 匹配 `'fulfilled'` 时，MCP 服务执行对应分支。
    if (result.status === 'fulfilled') {
      // clients 集合追加新条目，保持收集顺序与输入顺序一致。
      clients.push(result.value.client)
      // tools 集合追加新条目，保持收集顺序与输入顺序一致。
      tools.push(...result.value.tools)
    }
    // If rejected (unexpected), the error was already logged inside the promise
  }

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { clients, tools }
}
