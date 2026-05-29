// 类型依赖 { Client } 来自 @modelcontextprotocol/sdk/client/index.js，用于校准MCP 服务的数据契约。
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import type {
  Resource,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'

// Configuration schemas and types
// ConfigScopeSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const ConfigScopeSchema = lazySchema(() =>
  z.enum([
    'local',
    'user',
    'project',
    'dynamic',
    'enterprise',
    'claudeai',
    'managed',
  ]),
)
// ConfigScope 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConfigScope = z.infer<ReturnType<typeof ConfigScopeSchema>>

// TransportSchema保存`lazySchema`，供MCP 服务后续处理使用。
export const TransportSchema = lazySchema(() =>
  z.enum(['stdio', 'sse', 'sse-ide', 'http', 'ws', 'sdk']),
)
// Transport 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type Transport = z.infer<ReturnType<typeof TransportSchema>>

// McpStdioServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpStdioServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('stdio').optional(), // Optional for backwards compatibility
    command: z.string().min(1, 'Command cannot be empty'),
    args: z.array(z.string()).default([]),
    env: z.record(z.string(), z.string()).optional(),
  }),
)

// Cross-App Access (XAA / SEP-990): just a per-server flag. IdP connection
// details (issuer, clientId, callbackPort) come from settings.xaaIdp — configured
// once, shared across all XAA-enabled servers. clientId/clientSecret (parent
// oauth config + keychain slot) are for the MCP server's AS.
// McpXaaConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
const McpXaaConfigSchema = lazySchema(() => z.boolean())

// McpOAuthConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
const McpOAuthConfigSchema = lazySchema(() =>
  z.object({
    clientId: z.string().optional(),
    callbackPort: z.number().int().positive().optional(),
    authServerMetadataUrl: z
      .string()
      .url()
      .startsWith('https://', {
        message: 'authServerMetadataUrl must use https://',
      })
      .optional(),
    xaa: McpXaaConfigSchema().optional(),
  }),
)

// McpSSEServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpSSEServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('sse'),
    url: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
    headersHelper: z.string().optional(),
    oauth: McpOAuthConfigSchema().optional(),
  }),
)

// Internal-only server type for IDE extensions
// McpSSEIDEServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpSSEIDEServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('sse-ide'),
    url: z.string(),
    ideName: z.string(),
    ideRunningInWindows: z.boolean().optional(),
  }),
)

// Internal-only server type for IDE extensions
// McpWebSocketIDEServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpWebSocketIDEServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('ws-ide'),
    url: z.string(),
    ideName: z.string(),
    authToken: z.string().optional(),
    ideRunningInWindows: z.boolean().optional(),
  }),
)

// McpHTTPServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpHTTPServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('http'),
    url: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
    headersHelper: z.string().optional(),
    oauth: McpOAuthConfigSchema().optional(),
  }),
)

// McpWebSocketServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpWebSocketServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('ws'),
    url: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
    headersHelper: z.string().optional(),
  }),
)

// McpSdkServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpSdkServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('sdk'),
    name: z.string(),
  }),
)

// Config type for Claude.ai proxy servers
// McpClaudeAIProxyServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpClaudeAIProxyServerConfigSchema = lazySchema(() =>
  z.object({
    type: z.literal('claudeai-proxy'),
    url: z.string(),
    id: z.string(),
  }),
)

// McpServerConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpServerConfigSchema = lazySchema(() =>
  z.union([
    McpStdioServerConfigSchema(),
    McpSSEServerConfigSchema(),
    McpSSEIDEServerConfigSchema(),
    McpWebSocketIDEServerConfigSchema(),
    McpHTTPServerConfigSchema(),
    McpWebSocketServerConfigSchema(),
    McpSdkServerConfigSchema(),
    McpClaudeAIProxyServerConfigSchema(),
  ]),
)

// McpStdioServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpStdioServerConfig = z.infer<
  ReturnType<typeof McpStdioServerConfigSchema>
>
// McpSSEServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpSSEServerConfig = z.infer<
  ReturnType<typeof McpSSEServerConfigSchema>
>
// McpSSEIDEServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpSSEIDEServerConfig = z.infer<
  ReturnType<typeof McpSSEIDEServerConfigSchema>
>
// McpWebSocketIDEServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpWebSocketIDEServerConfig = z.infer<
  ReturnType<typeof McpWebSocketIDEServerConfigSchema>
>
// McpHTTPServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpHTTPServerConfig = z.infer<
  ReturnType<typeof McpHTTPServerConfigSchema>
>
// McpWebSocketServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpWebSocketServerConfig = z.infer<
  ReturnType<typeof McpWebSocketServerConfigSchema>
>
// McpSdkServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpSdkServerConfig = z.infer<
  ReturnType<typeof McpSdkServerConfigSchema>
>
// McpClaudeAIProxyServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpClaudeAIProxyServerConfig = z.infer<
  ReturnType<typeof McpClaudeAIProxyServerConfigSchema>
>
// McpServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpServerConfig = z.infer<ReturnType<typeof McpServerConfigSchema>>

// ScopedMcpServerConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ScopedMcpServerConfig = McpServerConfig & {
  scope: ConfigScope
  // For plugin-provided servers: the providing plugin's LoadedPlugin.source
  // (e.g. 'slack@anthropic'). Stashed at config-build time so the channel
  // gate doesn't have to race AppState.plugins.enabled hydration.
  pluginSource?: string
}

// McpJsonConfigSchema 配置保存`lazySchema`，供MCP 服务后续处理使用。
export const McpJsonConfigSchema = lazySchema(() =>
  z.object({
    mcpServers: z.record(z.string(), McpServerConfigSchema()),
  }),
)

// McpJsonConfig 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpJsonConfig = z.infer<ReturnType<typeof McpJsonConfigSchema>>

// Server connection types
// ConnectedMCPServer 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConnectedMCPServer = {
  client: Client
  name: string
  type: 'connected'
  capabilities: ServerCapabilities
  serverInfo?: {
    name: string
    version: string
  }
  instructions?: string
  config: ScopedMcpServerConfig
  // 这个回调绑定到 cleanup: () => Promise<void>，负责MCP 服务在该局部场景下的响应。
  cleanup: () => Promise<void>
}

// FailedMCPServer 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type FailedMCPServer = {
  name: string
  type: 'failed'
  config: ScopedMcpServerConfig
  error?: string
}

// NeedsAuthMCPServer 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type NeedsAuthMCPServer = {
  name: string
  type: 'needs-auth'
  config: ScopedMcpServerConfig
}

// PendingMCPServer 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type PendingMCPServer = {
  name: string
  type: 'pending'
  config: ScopedMcpServerConfig
  reconnectAttempt?: number
  maxReconnectAttempts?: number
}

// DisabledMCPServer 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type DisabledMCPServer = {
  name: string
  type: 'disabled'
  config: ScopedMcpServerConfig
}

// MCPServerConnection 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type MCPServerConnection =
  | ConnectedMCPServer
  | FailedMCPServer
  | NeedsAuthMCPServer
  | PendingMCPServer
  | DisabledMCPServer

// Resource types
// ServerResource 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ServerResource = Resource & { server: string }

// MCP CLI State types
// SerializedTool 描述MCP 服务需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface SerializedTool {
  name: string
  description: string
  inputJSONSchema?: {
    [x: string]: unknown
    type: 'object'
    properties?: {
      [x: string]: unknown
    }
  }
  isMcp?: boolean
  originalToolName?: string // Original unnormalized tool name from MCP server
}

// SerializedClient 描述MCP 服务需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface SerializedClient {
  name: string
  type: 'connected' | 'failed' | 'needs-auth' | 'pending' | 'disabled'
  capabilities?: ServerCapabilities
}

// MCPCliState 描述MCP 服务需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface MCPCliState {
  clients: SerializedClient[]
  configs: Record<string, ScopedMcpServerConfig>
  tools: SerializedTool[]
  resources: Record<string, ServerResource[]>
  normalizedNames?: Record<string, string> // Maps normalized names to original names
}
