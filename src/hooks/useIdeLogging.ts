// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js'
// 复用 getConnectedIdeClient 工具函数，把通用处理留在 ../utils/ide.js 中维护。
import { getConnectedIdeClient } from '../utils/ide.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'

// LogEventSchema保存`lazySchema`，供React hook后续处理使用。
const LogEventSchema = lazySchema(() =>
  z.object({
    method: z.literal('log_event'),
    params: z.object({
      eventName: z.string(),
      eventData: z.object({}).passthrough(),
    }),
  }),
)

// useIdeLogging 封装useIdeLogging的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIdeLogging(mcpClients: MCPServerConnection[]): void {
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // Skip if there are no clients
    // mcpClients.length 数量缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!mcpClients.length) {
      // React hook use Ide Logging在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Find the IDE client from the MCP clients list
    // ideClient读取`getConnectedIdeClient`，供React hook后续处理使用。
    const ideClient = getConnectedIdeClient(mcpClients)
    // 满足 `ideClient` 时，React hook执行该分支。
    if (ideClient) {
      // Register the log event handler
      // ideClient.client.setNotificationHandler 写入新的状态值，使React hook 状态流后续读取保持一致。
      ideClient.client.setNotificationHandler(
        LogEventSchema(),
        // notification更新为 `> {`，确保useIdeLogging后续读取最新状态。
        notification => {
          // 从 `notification.params` 解构 eventName、eventData，减少React hook use Ide Logging对同一对象的重复访问。
          const { eventName, eventData } = notification.params
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logEvent(
            `tengu_ide_${eventName}`,
            eventData as { [key: string]: boolean | number | undefined },
          )
        },
      )
    }
  }, [mcpClients])
}
