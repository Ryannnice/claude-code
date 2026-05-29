// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 复用 checkHasTrustDialogAccepted 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { checkHasTrustDialogAccepted } from '../../utils/config.js'
// 复用 logAntError 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logAntError } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 execFileNoThrowWithCwd 工具函数，把通用处理留在 ../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrowWithCwd } from '../../utils/execFileNoThrow.js'
// 复用 logError、logMCPDebug、logMCPError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError, logMCPDebug, logMCPError } from '../../utils/log.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import type {
  McpHTTPServerConfig,
  McpSSEServerConfig,
  McpWebSocketServerConfig,
  ScopedMcpServerConfig,
} from './types.js'

/**
 * Check if the MCP server config comes from project settings (projectSettings or localSettings)
 * This is important for security checks
 */
// isMcpServerFromProjectOrLocalSettings 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMcpServerFromProjectOrLocalSettings(
  config: ScopedMcpServerConfig,
): boolean {
  // 返回 `config.scope === 'project' || config.scope === 'local'`，作为MCP 服务这次计算的结果。
  return config.scope === 'project' || config.scope === 'local'
}

/**
 * Get dynamic headers for an MCP server using the headersHelper script
 * @param serverName The name of the MCP server
 * @param config The MCP server configuration
 * @returns Headers object or null if not configured or failed
 */
// getMcpHeadersFromHelper 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMcpHeadersFromHelper(
  serverName: string,
  config: McpSSEServerConfig | McpHTTPServerConfig | McpWebSocketServerConfig,
): Promise<Record<string, string> | null> {
  // config.headersHelper 配置缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!config.headersHelper) {
    // 返回 `null`，作为MCP 服务这次计算的结果。
    return null
  }

  // Security check for project/local settings
  // Skip trust check in non-interactive mode (e.g., CI/CD, automation)
  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    'scope' in config &&
    isMcpServerFromProjectOrLocalSettings(config as ScopedMcpServerConfig) &&
    !getIsNonInteractiveSession()
  ) {
    // Check if trust has been established for this project
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，MCP 服务随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // hasTrust缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!hasTrust) {
      // 错误保存`Error`，供MCP 服务后续处理使用。
      const error = new Error(
        `Security: headersHelper for MCP server '${serverName}' executed before workspace trust is confirmed. If you see this message, post in ${MACRO.FEEDBACK_CHANNEL}.`,
      )
      // 调用 logAntError，触发MCP 服务此处需要的副作用。
      logAntError('MCP headersHelper invoked before trust check', error)
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_headersHelper_missing_trust', {})
      // 返回 `null`，作为MCP 服务这次计算的结果。
      return null
    }
  }

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, 'Executing headersHelper to get dynamic headers')
    // execResult保存`execFileNoThrowWithCwd`，供MCP 服务后续处理使用。
    const execResult = await execFileNoThrowWithCwd(config.headersHelper, [], {
      shell: true,
      timeout: 10000,
      // Pass server context so one helper script can serve multiple MCP servers
      // (git credential-helper style). See deshaw/anthropic-issues#28.
      env: {
        ...process.env,
        CLAUDE_CODE_MCP_SERVER_NAME: serverName,
        CLAUDE_CODE_MCP_SERVER_URL: config.url,
      },
    })
    // `execResult.code` 与 `0 || !execResult.stdout` 不一致时刷新派生状态，避免使用过期结果。
    if (execResult.code !== 0 || !execResult.stdout) {
      // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
      throw new Error(
        `headersHelper for MCP server '${serverName}' did not return a valid value`,
      )
    }
    // 结果格式化`stdout.trim`，供MCP 服务后续处理使用。
    const result = execResult.stdout.trim()

    // 请求头解析`jsonParse`，供MCP 服务后续处理使用。
    const headers = jsonParse(result)
    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      typeof headers !== 'object' ||
      headers === null ||
      Array.isArray(headers)
    ) {
      // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
      throw new Error(
        `headersHelper for MCP server '${serverName}' must return a JSON object with string key-value pairs`,
      )
    }

    // Validate all values are strings
    // 循环处理 `const [key, value] of Object.entries(headers)`，让MCP 服务把同类条目按顺序走完。
    for (const [key, value] of Object.entries(headers)) {
      // `typeof value` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof value !== 'string') {
        // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
        throw new Error(
          `headersHelper for MCP server '${serverName}' returned non-string value for key "${key}": ${typeof value}`,
        )
      }
    }

    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(
      serverName,
      `Successfully retrieved ${Object.keys(headers).length} headers from headersHelper`,
    )
    // 返回 `headers as Record<string, string>`，作为MCP 服务这次计算的结果。
    return headers as Record<string, string>
  } catch (error) {
    // 调用 logMCPError，触发MCP 服务此处需要的副作用。
    logMCPError(
      serverName,
      `Error getting headers from headersHelper: ${errorMessage(error)}`,
    )
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `Error getting MCP headers from headersHelper for server '${serverName}': ${errorMessage(error)}`,
      ),
    )
    // Return null instead of throwing to avoid blocking the connection
    // 返回 `null`，作为MCP 服务这次计算的结果。
    return null
  }
}

/**
 * Get combined headers for an MCP server (static + dynamic)
 * @param serverName The name of the MCP server
 * @param config The MCP server configuration
 * @returns Combined headers object
 */
// getMcpServerHeaders 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMcpServerHeaders(
  serverName: string,
  config: McpSSEServerConfig | McpHTTPServerConfig | McpWebSocketServerConfig,
): Promise<Record<string, string>> {
  // staticHeaders 集合标记MCP 服务MCP 服务 headers Helper是否启用对应路径。
  const staticHeaders = config.headers || {}
  // dynamicHeaders 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const dynamicHeaders =
    (await getMcpHeadersFromHelper(serverName, config)) || {}

  // Dynamic headers override static headers if both are present
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return {
    ...staticHeaders,
    ...dynamicHeaders,
  }
}
