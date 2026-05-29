// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from '../analytics/growthbook.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 类型依赖 { ConnectedMCPServer, MCPServerConnection } 来自 ./types.js，用于校准MCP 服务的数据契约。
import type { ConnectedMCPServer, MCPServerConnection } from './types.js'

// Mirror of AutoModeEnabledState in permissionSetup.ts — inlined because that
// file pulls in too many deps for this thin IPC module.
// AutoModeEnabledState 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type AutoModeEnabledState = 'enabled' | 'disabled' | 'opt-in'
// readAutoModeEnabledState 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readAutoModeEnabledState(): AutoModeEnabledState | undefined {
  // v读取`getFeatureValue_CACHED_MAY_BE_STALE<{ enabled?: string }>(` 整理出中间结果，供MCP 服务MCP 服务 vscode Sdk Mcp后续步骤使用。
  const v = getFeatureValue_CACHED_MAY_BE_STALE<{ enabled?: string }>(
    'tengu_auto_mode_config',
    {},
  )?.enabled
  // 返回 `v === 'enabled' || v === 'disabled' || v === 'opt-in' ? v : undefined`，作为MCP 服务这次计算的结果。
  return v === 'enabled' || v === 'disabled' || v === 'opt-in' ? v : undefined
}

// LogEventNotificationSchema保存`lazySchema`，供MCP 服务后续处理使用。
export const LogEventNotificationSchema = lazySchema(() =>
  z.object({
    method: z.literal('log_event'),
    params: z.object({
      eventName: z.string(),
      eventData: z.object({}).passthrough(),
    }),
  }),
)

// Store the VSCode MCP client reference for sending notifications
// vscodeMcpClient 命名 `null`，让后续代码直接表达这个值的用途。
let vscodeMcpClient: ConnectedMCPServer | null = null

/**
 * Sends a file_updated notification to the VSCode MCP server. This is used to
 * notify VSCode when files are edited or written by Claude.
 */
// notifyVscodeFileUpdated 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyVscodeFileUpdated(
  filePath: string,
  oldContent: string | null,
  newContent: string | null,
): void {
  // `process.env.USER_TYPE` 与 `'ant' || !vscodeMcpClie` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant' || !vscodeMcpClient) {
    // MCP 服务 vscode Sdk Mcp在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 显式忽略 `vscodeMcpClient.client` 的返回值，只保留它触发的副作用。
  void vscodeMcpClient.client
    .notification({
      method: 'file_updated',
      params: { filePath, oldContent, newContent },
    })
    // 链式调用 catch，继续加工上一行在MCP 服务中产生的数据。
    .catch((error: Error) => {
      // Do not throw if the notification failed
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[VSCode] Failed to send file_updated notification: ${error.message}`,
      )
    })
}

/**
 * Sets up the speicial internal VSCode MCP for bidirectional communication using notifications.
 */
// setupVscodeSdkMcp 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setupVscodeSdkMcp(sdkClients: MCPServerConnection[]): void {
  // API 客户端筛选`sdkClients.find`，供MCP 服务后续处理使用。
  const client = sdkClients.find(client => client.name === 'claude-vscode')

  // 当 `client && client.type` 匹配 `'connected'` 时，MCP 服务执行对应分支。
  if (client && client.type === 'connected') {
    // Store the client reference for later use
    // vscodeMcpClient更新为 `client`，确保MCP 服务后续读取最新状态。
    vscodeMcpClient = client

    // client.client.setNotificationHandler 写入新的状态值，使MCP 服务后续读取保持一致。
    client.client.setNotificationHandler(
      LogEventNotificationSchema(),
      // 这个回调绑定到 async notification => {，负责MCP 服务在该局部场景下的响应。
      async notification => {
        // 从 `notification.params` 解构 eventName、eventData，减少MCP 服务 vscode Sdk Mcp对同一对象的重复访问。
        const { eventName, eventData } = notification.params
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent(
          `tengu_vscode_${eventName}`,
          eventData as { [key: string]: boolean | number | undefined },
        )
      },
    )

    // Send necessary experiment gates to VSCode immediately.
    // gates 集合 集中保存MCP 服务 vscode Sdk Mcp要一起传递的字段。
    const gates: Record<string, boolean | string> = {
      tengu_vscode_review_upsell: checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
        'tengu_vscode_review_upsell',
      ),
      tengu_vscode_onboarding: checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
        'tengu_vscode_onboarding',
      ),
      // Browser support.
      tengu_quiet_fern: getFeatureValue_CACHED_MAY_BE_STALE(
        'tengu_quiet_fern',
        false,
      ),
      // In-band OAuth via claude_authenticate (vs. extension-native PKCE).
      tengu_vscode_cc_auth: getFeatureValue_CACHED_MAY_BE_STALE(
        'tengu_vscode_cc_auth',
        false,
      ),
    }
    // Tri-state: 'enabled' | 'disabled' | 'opt-in'. Omit if unknown so VSCode
    // fails closed (treats absent as 'disabled').
    // autoModeState 状态读取`readAutoModeEnabledState`，供MCP 服务后续处理使用。
    const autoModeState = readAutoModeEnabledState()
    // `autoModeState` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (autoModeState !== undefined) {
      // tengu_auto_mode_state 状态更新为 `autoModeState`，确保MCP 服务后续读取最新状态。
      gates.tengu_auto_mode_state = autoModeState
    }
    // 显式忽略 `client.client.notification({` 的返回值，只保留它触发的副作用。
    void client.client.notification({
      method: 'experiment_gates',
      params: { gates },
    })
  }
}
