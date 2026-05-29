// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import type {
  ConnectedMCPServer,
  MCPServerConnection,
} from '../services/mcp/types.js'
// 复用 getConnectedIdeClient 工具函数，把通用处理留在 ../utils/ide.js 中维护。
import { getConnectedIdeClient } from '../utils/ide.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'
// IDEAtMentioned 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type IDEAtMentioned = {
  filePath: string
  lineStart?: number
  lineEnd?: number
}

// NOTIFICATION_METHOD固定为 `'at_mentioned'`，作为React hook use Ide At...后续展示或比较的基准。
const NOTIFICATION_METHOD = 'at_mentioned'

// AtMentionedSchema保存`lazySchema`，供React hook后续处理使用。
const AtMentionedSchema = lazySchema(() =>
  z.object({
    method: z.literal(NOTIFICATION_METHOD),
    params: z.object({
      filePath: z.string(),
      lineStart: z.number().optional(),
      lineEnd: z.number().optional(),
    }),
  }),
)

/**
 * A hook that tracks IDE at-mention notifications by directly registering
 * with MCP client notification handlers,
 */
// useIdeAtMentioned 封装useIdeAtMentioned的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIdeAtMentioned(
  mcpClients: MCPServerConnection[],
  // 这个回调绑定到 onAtMentioned: (atMentioned: IDEAtMentioned) => void,，负责React hook 状态流在该局部场景下的响应。
  onAtMentioned: (atMentioned: IDEAtMentioned) => void,
): void {
  // ideClientRef 引用保存 hook 状态，让React hook use Ide At...跨渲染复用同一个容器。
  const ideClientRef = useRef<ConnectedMCPServer | undefined>(undefined)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // Find the IDE client from the MCP clients list
    // ideClient读取`getConnectedIdeClient`，供React hook后续处理使用。
    const ideClient = getConnectedIdeClient(mcpClients)

    // `ideClientRef.current` 与 `ideClient` 不一致时刷新派生状态，避免使用过期结果。
    if (ideClientRef.current !== ideClient) {
      // current更新为 `ideClient`，确保useIdeAtMentioned后续读取最新状态。
      ideClientRef.current = ideClient
    }

    // If we found a connected IDE client, register our handler
    // 满足 `ideClient` 时，React hook执行该分支。
    if (ideClient) {
      // ideClient.client.setNotificationHandler 写入新的状态值，使React hook 状态流后续读取保持一致。
      ideClient.client.setNotificationHandler(
        AtMentionedSchema(),
        // notification更新为 `> {`，确保useIdeAtMentioned后续读取最新状态。
        notification => {
          // `ideClientRef.current` 与 `ideClient` 不一致时刷新派生状态，避免使用过期结果。
          if (ideClientRef.current !== ideClient) {
            // React hook use Ide At Mentioned在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
          try {
            // data保存`notification.params`，供React hook use Ide At...后续判断或输出使用。
            const data = notification.params
            // Adjust line numbers to be 1-based instead of 0-based
            // lineStart 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const lineStart =
              data.lineStart !== undefined ? data.lineStart + 1 : undefined
            // lineEnd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const lineEnd =
              data.lineEnd !== undefined ? data.lineEnd + 1 : undefined
            // 调用 onAtMentioned，触发React hook此处需要的副作用。
            onAtMentioned({
              filePath: data.filePath,
              lineStart: lineStart,
              lineEnd: lineEnd,
            })
          } catch (error) {
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logError(error as Error)
          }
        },
      )
    }

    // No cleanup needed as MCP clients manage their own lifecycle
  }, [mcpClients, onAtMentioned])
}
