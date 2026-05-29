// 引入 reject，将 lodash-es/reject.js 中已经封装好的能力接到本文件流程里。
import reject from 'lodash-es/reject.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 performMCPOAuthFlow 服务层能力，把外部通信或共享状态交给 ../../services/mcp/auth.js 处理。
import { performMCPOAuthFlow } from '../../services/mcp/auth.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  clearMcpAuthCache,
  reconnectMcpServerImpl,
} from '../../services/mcp/client.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildMcpToolName,
  getMcpPrefix,
} from '../../services/mcp/mcpStringUtils.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  McpHTTPServerConfig,
  McpSSEServerConfig,
  ScopedMcpServerConfig,
} from '../../services/mcp/types.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logMCPDebug、logMCPError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPDebug, logMCPError } from '../../utils/log.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => z.object({}))
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// McpAuthOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpAuthOutput = {
  status: 'auth_url' | 'unsupported' | 'error'
  message: string
  authUrl?: string
}

// getConfigUrl 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfigUrl(config: ScopedMcpServerConfig): string | undefined {
  // 满足 `'url' in config` 时，工具调用执行该分支。
  if ('url' in config) return config.url
  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

/**
 * Creates a pseudo-tool for an MCP server that is installed but not
 * authenticated. Surfaced in place of the server's real tools so the model
 * knows the server exists and can start the OAuth flow on the user's behalf.
 *
 * When called, starts performMCPOAuthFlow with skipBrowserOpen and returns
 * the authorization URL. The OAuth callback completes in the background;
 * once it fires, reconnectMcpServerImpl runs and the server's real tools
 * are swapped into appState.mcp.tools via the existing prefix-based
 * replacement (useManageMCPConnections.updateServer wipes anything matching
 * mcp__<server>__*, so this pseudo-tool is removed automatically).
 */
// createMcpAuthTool 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createMcpAuthTool(
  serverName: string,
  config: ScopedMcpServerConfig,
): Tool<InputSchema, McpAuthOutput> {
  // URL读取`getConfigUrl`，供工具调用后续处理使用。
  const url = getConfigUrl(config)
  // transport保存`config.type ?? 'stdio'`，供后续判断或组装使用。
  const transport = config.type ?? 'stdio'
  // location 命名 `url ? `${transport} at ${url}` : transport`，让后续代码直接表达这个值的用途。
  const location = url ? `${transport} at ${url}` : transport

  // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const description =
    `The \`${serverName}\` MCP server (${location}) is installed but requires authentication. ` +
    `Call this tool to start the OAuth flow — you'll receive an authorization URL to share with the user. ` +
    `Once the user completes authorization in their browser, the server's real tools will become available automatically.`

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    name: buildMcpToolName(serverName, 'authenticate'),
    isMcp: true,
    mcpInfo: { serverName, toolName: 'authenticate' },
    // 这个回调绑定到 isEnabled: () => true,，负责工具调用在该局部场景下的响应。
    isEnabled: () => true,
    // 这个回调绑定到 isConcurrencySafe: () => false,，负责工具调用在该局部场景下的响应。
    isConcurrencySafe: () => false,
    // 这个回调绑定到 isReadOnly: () => false,，负责工具调用在该局部场景下的响应。
    isReadOnly: () => false,
    // 这个回调绑定到 toAutoClassifierInput: () => serverName,，负责工具调用在该局部场景下的响应。
    toAutoClassifierInput: () => serverName,
    // 这个回调绑定到 userFacingName: () => `${serverName} - authenticate (MCP)`,，负责工具调用在该局部场景下的响应。
    userFacingName: () => `${serverName} - authenticate (MCP)`,
    maxResultSizeChars: 10_000,
    // 这个回调绑定到 renderToolUseMessage: () => `Authenticate ${serverName} MCP server`,，负责工具调用在该局部场景下的响应。
    renderToolUseMessage: () => `Authenticate ${serverName} MCP server`,
    // description 使用 无 完成工具调用里的对应操作。
    async description() {
      // 返回 `description`，作为工具调用这次计算的结果。
      return description
    },
    // prompt 使用 无 完成工具调用里的对应操作。
    async prompt() {
      // 返回 `description`，作为工具调用这次计算的结果。
      return description
    },
    // 工具实现 Mcp Auth Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
    get inputSchema(): InputSchema {
      // 返回 `inputSchema()`，作为工具调用这次计算的结果。
      return inputSchema()
    },
    // checkPermissions 使用 input 完成工具调用里的对应操作。
    async checkPermissions(input): Promise<PermissionDecision> {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { behavior: 'allow', updatedInput: input }
    },
    // call 使用 _input, context 完成工具调用里的对应操作。
    async call(_input, context) {
      // claude.ai connectors use a separate auth flow (handleClaudeAIAuth in
      // MCPRemoteServerMenu) that we don't invoke programmatically here —
      // just point the user at /mcp.
      // 当 `config.type` 匹配 `'claudeai-proxy'` 时，工具调用执行对应分支。
      if (config.type === 'claudeai-proxy') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            status: 'unsupported' as const,
            message: `This is a claude.ai MCP connector. Ask the user to run /mcp and select "${serverName}" to authenticate.`,
          },
        }
      }

      // performMCPOAuthFlow only accepts sse/http. needs-auth state is only
      // set on HTTP 401 (UnauthorizedError) so other transports shouldn't
      // reach here, but be defensive.
      // `config.type` 与 `'sse' && config.type !== 'http'` 不一致时刷新派生状态，避免使用过期结果。
      if (config.type !== 'sse' && config.type !== 'http') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            status: 'unsupported' as const,
            message: `Server "${serverName}" uses ${transport} transport which does not support OAuth from this tool. Ask the user to run /mcp and authenticate manually.`,
          },
        }
      }

      // sseOrHttpConfig 配置保存`as`，供工具调用后续处理使用。
      const sseOrHttpConfig = config as (
        | McpSSEServerConfig
        | McpHTTPServerConfig
      ) & { scope: ScopedMcpServerConfig['scope'] }

      // Mirror cli/print.ts mcp_authenticate: start the flow, capture the
      // URL via onAuthorizationUrl, return it immediately. The flow's
      // Promise resolves later when the browser callback fires.
      // 这个回调绑定到 let resolveAuthUrl: ((url: string) => void) | undefined，负责工具调用在该局部场景下的响应。
      let resolveAuthUrl: ((url: string) => void) | undefined
      // authUrlPromise 异步任务封装成回调，供工具实现 Mcp Auth Tool在事件触发或异步步骤中调用。
      const authUrlPromise = new Promise<string>(resolve => {
        // resolveAuthUrl更新为 `resolve`，确保工具调用后续读取最新状态。
        resolveAuthUrl = resolve
      })

      // controller保存`AbortController`，供工具调用后续处理使用。
      const controller = new AbortController()
      // 从 `context` 解构 setAppState，减少工具实现 Mcp Auth Tool对同一对象的重复访问。
      const { setAppState } = context

      // oauthPromise 异步任务保存 `performMCPOAuthFlow` 启动的异步任务，稍后再决定等待还是后台完成。
      const oauthPromise = performMCPOAuthFlow(
        serverName,
        sseOrHttpConfig,
        // u更新为 `> resolveAuthUrl?.(u)`，确保工具调用后续读取最新状态。
        u => resolveAuthUrl?.(u),
        controller.signal,
        { skipBrowserOpen: true },
      )

      // Background continuation: once OAuth completes, reconnect and swap
      // the real tools into appState. Prefix-based replacement removes this
      // pseudo-tool since it shares the mcp__<server>__ prefix.
      // 显式忽略 `oauthPromise` 的返回值，只保留它触发的副作用。
      void oauthPromise
        // 链式调用 then，继续加工上一行在工具调用中产生的数据。
        .then(async () => {
          // 清理相关缓存，确保工具调用下一次读取时重新加载最新数据。
          clearMcpAuthCache()
          // 结果保存`reconnectMcpServerImpl`，供工具调用后续处理使用。
          const result = await reconnectMcpServerImpl(serverName, config)
          // prefix读取`getMcpPrefix`，供工具调用后续处理使用。
          const prefix = getMcpPrefix(serverName)
          // setAppState 写入新的状态值，使工具调用后续读取保持一致。
          setAppState(prev => ({
            ...prev,
            mcp: {
              ...prev.mcp,
              // 这个回调绑定到 clients: prev.mcp.clients.map(c =>，负责工具调用在该局部场景下的响应。
              clients: prev.mcp.clients.map(c =>
                c.name === serverName ? result.client : c,
              ),
              tools: [
                // 链式调用 链式方法，继续加工上一行在工具调用中产生的数据。
                ...reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),
                ...result.tools,
              ],
              commands: [
                // 链式调用 链式方法，继续加工上一行在工具调用中产生的数据。
                ...reject(prev.mcp.commands, c => c.name?.startsWith(prefix)),
                ...result.commands,
              ],
              resources: result.resources
                ? { ...prev.mcp.resources, [serverName]: result.resources }
                : prev.mcp.resources,
            },
          }))
          // 调用 logMCPDebug，触发工具调用此处需要的副作用。
          logMCPDebug(
            serverName,
            `OAuth complete, reconnected with ${result.tools.length} tool(s)`,
          )
        })
        // 链式调用 catch，继续加工上一行在工具调用中产生的数据。
        .catch(err => {
          // 调用 logMCPError，触发工具调用此处需要的副作用。
          logMCPError(
            serverName,
            `OAuth flow failed after tool-triggered start: ${errorMessage(err)}`,
          )
        })

      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // Race: get the URL, or the flow completes without needing one
        // (e.g. XAA with cached IdP token — silent auth).
        // authUrl保存`Promise.race`，供工具调用后续处理使用。
        const authUrl = await Promise.race([
          authUrlPromise,
          // 调用 oauthPromise.then，触发工具调用此处需要的副作用。
          oauthPromise.then(() => null as string | null),
        ])

        // 满足 `authUrl` 时，工具调用执行该分支。
        if (authUrl) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            data: {
              status: 'auth_url' as const,
              authUrl,
              message: `Ask the user to open this URL in their browser to authorize the ${serverName} MCP server:\n\n${authUrl}\n\nOnce they complete the flow, the server's tools will become available automatically.`,
            },
          }
        }

        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            status: 'auth_url' as const,
            message: `Authentication completed silently for ${serverName}. The server's tools should now be available.`,
          },
        }
      } catch (err) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            status: 'error' as const,
            message: `Failed to start OAuth flow for ${serverName}: ${errorMessage(err)}. Ask the user to run /mcp and authenticate manually.`,
          },
        }
      }
    },
    // mapToolResultToToolResultBlockParam 使用 data, toolUseID 完成工具调用里的对应操作。
    mapToolResultToToolResultBlockParam(data, toolUseID) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: data.message,
      }
    },
  } satisfies Tool<InputSchema, McpAuthOutput>
}
