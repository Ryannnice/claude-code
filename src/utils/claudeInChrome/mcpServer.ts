// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ClaudeForChromeContext,
  createClaudeForChromeMcpServer,
  type Logger,
  type PermissionMode,
} from '@ant/claude-for-chrome-mcp'
// 引入 StdioServerTransport，将 @modelcontextprotocol/sdk/server/stdio.js 中已经封装好的能力接到本文件流程里。
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
// 引入 format，将 util 中已经封装好的能力接到本文件流程里。
import { format } from 'util'
// 接入 shutdownDatadog 服务层能力，把外部通信或共享状态交给 ../../services/analytics/datadog.js 处理。
import { shutdownDatadog } from '../../services/analytics/datadog.js'
// 接入 shutdown1PEventLogging 服务层能力，把外部通信或共享状态交给 ../../services/analytics/firstPartyEventLogger.js 处理。
import { shutdown1PEventLogging } from '../../services/analytics/firstPartyEventLogger.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 initializeAnalyticsSink 服务层能力，把外部通信或共享状态交给 ../../services/analytics/sink.js 处理。
import { initializeAnalyticsSink } from '../../services/analytics/sink.js'
// 引入 getClaudeAIOAuthTokens，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { getClaudeAIOAuthTokens } from '../auth.js'
// 引入 enableConfigs、getGlobalConfig、saveGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { enableConfigs, getGlobalConfig, saveGlobalConfig } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 sideQuery，将 ../sideQuery.js 中已经封装好的能力接到本文件流程里。
import { sideQuery } from '../sideQuery.js'
// 引入 getAllSocketPaths、getSecureSocketPath，将 ./common.js 中已经封装好的能力接到本文件流程里。
import { getAllSocketPaths, getSecureSocketPath } from './common.js'

// EXTENSION_DOWNLOAD_URL保存`'https://claude.ai/chrome'`，作为后续固定文本处理的输入。
const EXTENSION_DOWNLOAD_URL = 'https://claude.ai/chrome'
// BUG_REPORT_URL 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const BUG_REPORT_URL =
  'https://github.com/anthropics/claude-code/issues/new?labels=bug,claude-in-chrome'

// String metadata keys safe to forward to analytics. Keys like error_message
// are excluded because they could contain page content or user data.
// SAFE_BRIDGE_STRING_KEYS 集合保存`Set`，供共享工具后续处理使用。
const SAFE_BRIDGE_STRING_KEYS = new Set([
  'bridge_status',
  'error_type',
  'tool_name',
])

// PERMISSION_MODES 权限数据 聚合成有序列表，保持后续遍历顺序稳定。
const PERMISSION_MODES: readonly PermissionMode[] = [
  'ask',
  'skip_all_permission_checks',
  'follow_a_plan',
]

// isPermissionMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isPermissionMode(raw: string): raw is PermissionMode {
  // 返回 `PERMISSION_MODES.some(m => m === raw)`，作为共享工具这次计算的结果。
  return PERMISSION_MODES.some(m => m === raw)
}

/**
 * Resolves the Chrome bridge URL based on environment and feature flag.
 * Bridge is used when the feature flag is enabled; ant users always get
 * bridge. API key / 3P users fall back to native messaging.
 */
// getChromeBridgeUrl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getChromeBridgeUrl(): string | undefined {
  // bridgeEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const bridgeEnabled =
    process.env.USER_TYPE === 'ant' ||
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_copper_bridge', false)

  // bridgeEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!bridgeEnabled) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 共享工具在这里按实际状态进入对应分支。
  if (
    isEnvTruthy(process.env.USE_LOCAL_OAUTH) ||
    isEnvTruthy(process.env.LOCAL_BRIDGE)
  ) {
    // 返回 `'ws://localhost:8765'`，作为共享工具这次计算的结果。
    return 'ws://localhost:8765'
  }

  // 满足 `isEnvTruthy(process.env.USE_STAGING_OAUTH)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.USE_STAGING_OAUTH)) {
    // 返回 `'wss://bridge-staging.claudeusercontent.com'`，作为共享工具这次计算的结果。
    return 'wss://bridge-staging.claudeusercontent.com'
  }

  // 返回 `'wss://bridge.claudeusercontent.com'`，作为共享工具这次计算的结果。
  return 'wss://bridge.claudeusercontent.com'
}

// isLocalBridge 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLocalBridge(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isEnvTruthy(process.env.USE_LOCAL_OAUTH) ||
    isEnvTruthy(process.env.LOCAL_BRIDGE)
  )
}

/**
 * Build the ClaudeForChromeContext used by both the subprocess MCP server
 * and the in-process path in the MCP client.
 */
// createChromeContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createChromeContext(
  env?: Record<string, string>,
): ClaudeForChromeContext {
  // logger保存`DebugLogger`，供共享工具后续处理使用。
  const logger = new DebugLogger()
  // chromeBridgeUrl读取`getChromeBridgeUrl`，供共享工具后续处理使用。
  const chromeBridgeUrl = getChromeBridgeUrl()
  // 调用 logger.info，触发共享工具此处需要的副作用。
  logger.info(`Bridge URL: ${chromeBridgeUrl ?? 'none (using native socket)'}`)
  // rawPermissionMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const rawPermissionMode =
    env?.CLAUDE_CHROME_PERMISSION_MODE ??
    process.env.CLAUDE_CHROME_PERMISSION_MODE
  // initialPermissionMode 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let initialPermissionMode: PermissionMode | undefined
  // 满足 `rawPermissionMode` 时，共享工具执行该分支。
  if (rawPermissionMode) {
    // 满足 `isPermissionMode(rawPermissionMode)` 时，共享工具执行该分支。
    if (isPermissionMode(rawPermissionMode)) {
      // initialPermissionMode 权限数据更新为 `rawPermissionMode`，确保共享工具后续读取最新状态。
      initialPermissionMode = rawPermissionMode
    } else {
      // 调用 logger.warn，触发共享工具此处需要的副作用。
      logger.warn(
        `Invalid CLAUDE_CHROME_PERMISSION_MODE "${rawPermissionMode}". Valid values: ${PERMISSION_MODES.join(', ')}`,
      )
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    serverName: 'Claude in Chrome',
    logger,
    socketPath: getSecureSocketPath(),
    getSocketPaths: getAllSocketPaths,
    clientTypeId: 'claude-code',
    // 这个回调绑定到 onAuthenticationError: () => {，负责共享工具在该局部场景下的响应。
    onAuthenticationError: () => {
      // 调用 logger.warn，触发共享工具此处需要的副作用。
      logger.warn(
        'Authentication error occurred. Please ensure you are logged into the Claude browser extension with the same claude.ai account as Claude Code.',
      )
    },
    // 这个回调绑定到 onToolCallDisconnected: () => {，负责共享工具在该局部场景下的响应。
    onToolCallDisconnected: () => {
      // 返回 ``Browser extension is not connected. Please ensure the Claude browser e...`，作为共享工具这次计算的结果。
      return `Browser extension is not connected. Please ensure the Claude browser extension is installed and running (${EXTENSION_DOWNLOAD_URL}), and that you are logged into claude.ai with the same account as Claude Code. If this is your first time connecting to Chrome, you may need to restart Chrome for the installation to take effect. If you continue to experience issues, please report a bug: ${BUG_REPORT_URL}`
    },
    // 这个回调绑定到 onExtensionPaired: (deviceId: string, name: string) => {，负责共享工具在该局部场景下的响应。
    onExtensionPaired: (deviceId: string, name: string) => {
      // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
      saveGlobalConfig(config => {
        // 共享工具在这里按实际状态进入对应分支。
        if (
          config.chromeExtension?.pairedDeviceId === deviceId &&
          config.chromeExtension?.pairedDeviceName === name
        ) {
          // 返回 `config`，作为共享工具这次计算的结果。
          return config
        }
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          ...config,
          chromeExtension: {
            pairedDeviceId: deviceId,
            pairedDeviceName: name,
          },
        }
      })
      // 调用 logger.info，触发共享工具此处需要的副作用。
      logger.info(`Paired with "${name}" (${deviceId.slice(0, 8)})`)
    },
    // 这个回调绑定到 getPersistedDeviceId: () => {，负责共享工具在该局部场景下的响应。
    getPersistedDeviceId: () => {
      // 返回 `getGlobalConfig().chromeExtension?.pairedDeviceId`，作为共享工具这次计算的结果。
      return getGlobalConfig().chromeExtension?.pairedDeviceId
    },
    ...(chromeBridgeUrl && {
      bridgeConfig: {
        url: chromeBridgeUrl,
        // 这个回调绑定到 getUserId: async () => {，负责共享工具在该局部场景下的响应。
        getUserId: async () => {
          // 返回 `getGlobalConfig().oauthAccount?.accountUuid`，作为共享工具这次计算的结果。
          return getGlobalConfig().oauthAccount?.accountUuid
        },
        // 这个回调绑定到 getOAuthToken: async () => {，负责共享工具在该局部场景下的响应。
        getOAuthToken: async () => {
          // 返回 `getClaudeAIOAuthTokens()?.accessToken ?? ''`，作为共享工具这次计算的结果。
          return getClaudeAIOAuthTokens()?.accessToken ?? ''
        },
        ...(isLocalBridge() && { devUserId: 'dev_user_local' }),
      },
    }),
    ...(initialPermissionMode && { initialPermissionMode }),
    // Wire inference for the browser_task tool — the chrome-mcp server runs
    // a lightning-mode agent loop in Node and calls the extension's
    // lightning_turn tool once per iteration for execution.
    //
    // Ant-only: the extension's lightning_turn is build-time-gated via
    // import.meta.env.ANT_ONLY_BUILD — the whole lightning/ module graph is
    // tree-shaken from the public extension build (build:prod greps for a
    // marker to verify). Without this injection, the Node MCP server's
    // ListTools also filters browser_task + lightning_turn out, so external
    // users never see the tools advertised. Three independent gates.
    //
    // Types inlined: AnthropicMessagesRequest/Response live in
    // @ant/claude-for-chrome-mcp@0.4.0 which isn't published yet. CI installs
    // 0.3.0. The callAnthropicMessages field is also 0.4.0-only, but spreading
    // an extra property into ClaudeForChromeContext is fine against either
    // version — 0.3.0 sees an unknown field (allowed in spread), 0.4.0 sees a
    // structurally-matching one. Once 0.4.0 is published, this can switch to
    // the package's exported types and the dep can be bumped.
    ...(process.env.USER_TYPE === 'ant' && {
      // 共享工具 mcp Server在这里处理 `callAnthropicMessages: async (req: {`，完成这一小步状态转换。
      callAnthropicMessages: async (req: {
        model: string
        max_tokens: number
        system: string
        messages: Parameters<typeof sideQuery>[0]['messages']
        stop_sequences?: string[]
        signal?: AbortSignal
      }): Promise<{
        content: Array<{ type: 'text'; text: string }>
        stop_reason: string | null
        usage?: { input_tokens: number; output_tokens: number }
      }> => {
        // sideQuery handles OAuth attribution fingerprint, proxy, model betas.
        // skipSystemPromptPrefix: the lightning prompt is complete on its own;
        // the CLI prefix would dilute the batching instructions.
        // tools: [] is load-bearing — without it Sonnet emits
        // <function_calls> XML before the text commands. Original
        // lightning-harness.js (apps repo) does the same.
        // 接口响应保存`sideQuery`，供共享工具后续处理使用。
        const response = await sideQuery({
          model: req.model,
          system: req.system,
          messages: req.messages,
          max_tokens: req.max_tokens,
          stop_sequences: req.stop_sequences,
          signal: req.signal,
          skipSystemPromptPrefix: true,
          tools: [],
          querySource: 'chrome_mcp',
        })
        // BetaContentBlock is TextBlock | ThinkingBlock | ToolUseBlock | ...
        // Only text blocks carry the model's command output.
        // textBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
        const textBlocks: Array<{ type: 'text'; text: string }> = []
        // 按顺序遍历 `response.content` 中的b，逐个交给共享工具处理。
        for (const b of response.content) {
          // 当 `b.type` 匹配 `'text'` 时，共享工具执行对应分支。
          if (b.type === 'text') {
            // textBlocks 集合追加新条目，保持收集顺序与输入顺序一致。
            textBlocks.push({ type: 'text', text: b.text })
          }
        }
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          content: textBlocks,
          stop_reason: response.stop_reason,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
          },
        }
      },
    }),
    // 这个回调绑定到 trackEvent: (eventName, metadata) => {，负责共享工具在该局部场景下的响应。
    trackEvent: (eventName, metadata) => {
      // safeMetadata 先占位，稍后的条件分支会根据实际输入补齐它。
      const safeMetadata: {
        [key: string]:
          | boolean
          | number
          | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
          | undefined
      } = {}
      // 满足 `metadata` 时，共享工具执行该分支。
      if (metadata) {
        // 循环处理 `const [key, value] of Object.entries(metadata)`，让共享工具把同类条目按顺序走完。
        for (const [key, value] of Object.entries(metadata)) {
          // Rename 'status' to 'bridge_status' to avoid Datadog's reserved field
          // safeKey标记共享工具 mcp Server是否启用对应路径。
          const safeKey = key === 'status' ? 'bridge_status' : key
          // 只有 `typeof value === 'boolean' || typeof value === 'n` 满足时，共享工具才执行该分支。
          if (typeof value === 'boolean' || typeof value === 'number') {
            // safeMetadata[safeKey更新为 `value`，确保共享工具 mcp Server后续读取最新状态。
            safeMetadata[safeKey] = value
          // 共享工具 mcp Server在这里处理 `} else if (`，完成这一小步状态转换。
          } else if (
            typeof value === 'string' &&
            SAFE_BRIDGE_STRING_KEYS.has(safeKey)
          ) {
            // Only forward allowlisted string keys — fields like error_message
            // could contain page content or user data
            // 共享工具 mcp Server在这里处理 `safeMetadata[safeKey] =`，完成这一小步状态转换。
            safeMetadata[safeKey] =
              value as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
          }
        }
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent(eventName, safeMetadata)
    },
  }
}

// runClaudeInChromeMcpServer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runClaudeInChromeMcpServer(): Promise<void> {
  // 调用 enableConfigs，触发共享工具此处需要的副作用。
  enableConfigs()
  // 调用 initializeAnalyticsSink，触发共享工具此处需要的副作用。
  initializeAnalyticsSink()
  // 上下文构建`createChromeContext`，供共享工具后续处理使用。
  const context = createChromeContext()

  // server构建`createClaudeForChromeMcpServer`，供共享工具后续处理使用。
  const server = createClaudeForChromeMcpServer(context)
  // transport保存`StdioServerTransport`，供共享工具后续处理使用。
  const transport = new StdioServerTransport()

  // Exit when parent process dies (stdin pipe closes).
  // Flush analytics before exiting so final-batch events (e.g. disconnect) aren't lost.
  // exiting标记共享工具 mcp Server是否启用对应路径。
  let exiting = false
  // shutdownAndExit保存`async`，供共享工具后续处理使用。
  const shutdownAndExit = async (): Promise<void> => {
    // 满足 `exiting` 时，共享工具执行该分支。
    if (exiting) {
      // 共享工具 mcp Server在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // exiting更新为 `true`，确保共享工具后续读取最新状态。
    exiting = true
    // 等待 `shutdown1PEventLogging()` 完成，再继续共享工具 mcp Server的异步流程。
    await shutdown1PEventLogging()
    // 等待 `shutdownDatadog()` 完成，再继续共享工具 mcp Server的异步流程。
    await shutdownDatadog()
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发共享工具此处需要的副作用。
    process.exit(0)
  }
  // 调用 process.stdin.on，触发共享工具此处需要的副作用。
  process.stdin.on('end', () => void shutdownAndExit())
  // 调用 process.stdin.on，触发共享工具此处需要的副作用。
  process.stdin.on('error', () => void shutdownAndExit())

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[Claude in Chrome] Starting MCP server')
  // 等待 `server.connect(transport)` 完成，再继续共享工具 mcp Server的异步流程。
  await server.connect(transport)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[Claude in Chrome] MCP server started')
}

// DebugLogger 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class DebugLogger implements Logger {
  // silly 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  silly(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'debug' })
  }
  // debug 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  debug(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'debug' })
  }
  // info 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  info(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'info' })
  }
  // warn 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  warn(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'warn' })
  }
  // error 使用 message: string, ...args: unknown[] 完成共享工具里的对应操作。
  error(message: string, ...args: unknown[]): void {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(format(message, ...args), { level: 'error' })
  }
}
