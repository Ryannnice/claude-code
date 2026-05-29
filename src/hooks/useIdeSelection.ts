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
// SelectionPoint 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type SelectionPoint = {
  line: number
  character: number
}

// SelectionData 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type SelectionData = {
  selection: {
    start: SelectionPoint
    end: SelectionPoint
  } | null
  text?: string
  filePath?: string
}

// IDESelection 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type IDESelection = {
  lineCount: number
  lineStart?: number
  text?: string
  filePath?: string
}

// Define the selection changed notification schema
// SelectionChangedSchema保存`lazySchema`，供React hook后续处理使用。
const SelectionChangedSchema = lazySchema(() =>
  z.object({
    method: z.literal('selection_changed'),
    params: z.object({
      selection: z
        .object({
          start: z.object({
            line: z.number(),
            character: z.number(),
          }),
          end: z.object({
            line: z.number(),
            character: z.number(),
          }),
        })
        .nullable()
        .optional(),
      text: z.string().optional(),
      filePath: z.string().optional(),
    }),
  }),
)

/**
 * A hook that tracks IDE text selection information by directly registering
 * with MCP client notification handlers
 */
// useIdeSelection 封装useIdeSelection的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIdeSelection(
  mcpClients: MCPServerConnection[],
  // 这个回调绑定到 onSelect: (selection: IDESelection) => void,，负责React hook 状态流在该局部场景下的响应。
  onSelect: (selection: IDESelection) => void,
): void {
  // handlersRegistered保存`useRef`，供React hook后续处理使用。
  const handlersRegistered = useRef(false)
  // currentIDERef 引用保存 hook 状态，让React hook use Ide Se...跨渲染复用同一个容器。
  const currentIDERef = useRef<ConnectedMCPServer | null>(null)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // Find the IDE client from the MCP clients list
    // ideClient读取`getConnectedIdeClient`，供React hook后续处理使用。
    const ideClient = getConnectedIdeClient(mcpClients)

    // If the IDE client changed, we need to re-register handlers.
    // Normalize undefined to null so the initial ref value (null) matches
    // "no IDE found" (undefined), avoiding spurious resets on every MCP update.
    // `currentIDERef.current` 与 `(ideClient ?? null)` 不一致时刷新派生状态，避免使用过期结果。
    if (currentIDERef.current !== (ideClient ?? null)) {
      // current更新为 `false`，确保useIdeSelection后续读取最新状态。
      handlersRegistered.current = false
      // current更新为 `ideClient || null`，确保useIdeSelection后续读取最新状态。
      currentIDERef.current = ideClient || null
      // Reset the selection when the IDE client changes.
      // 调用 onSelect，触发React hook此处需要的副作用。
      onSelect({
        lineCount: 0,
        lineStart: undefined,
        text: undefined,
        filePath: undefined,
      })
    }

    // Skip if we've already registered handlers for the current IDE or if there's no IDE client
    // 组合条件 `handlersRegistered.current || !ideClient` 成立时，React hook 状态流才启用这条专门路径。
    if (handlersRegistered.current || !ideClient) {
      // React hook use Ide Selection在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Handler function for selection changes
    // selectionChangeHandler封装成回调，供React hook use Ide Se...在事件触发或异步步骤中调用。
    const selectionChangeHandler = (data: SelectionData) => {
      // 组合条件 `data.selection?.start && data.selection?.end` 成立时，React hook 状态流才启用这条专门路径。
      if (data.selection?.start && data.selection?.end) {
        // 从 `data.selection` 解构 start、end，减少React hook use Ide Selection对同一对象的重复访问。
        const { start, end } = data.selection
        // lineCount 数量 命名 `end.line - start.line + 1`，让后续代码直接表达这个值的用途。
        let lineCount = end.line - start.line + 1
        // If on the first character of the line, do not count the line
        // as being selected.
        // 满足 `end.character === 0` 时，React hook执行该分支。
        if (end.character === 0) {
          // React hook use Ide Selection在这里处理 `lineCount--`，完成这一小步状态转换。
          lineCount--
        }
        // selection 集中保存React hook use Ide Se...要一起传递的字段。
        const selection = {
          lineCount,
          lineStart: start.line,
          text: data.text,
          filePath: data.filePath,
        }

        // 调用 onSelect，触发React hook此处需要的副作用。
        onSelect(selection)
      }
    }

    // Register notification handler for selection_changed events
    // ideClient.client.setNotificationHandler 写入新的状态值，使React hook 状态流后续读取保持一致。
    ideClient.client.setNotificationHandler(
      SelectionChangedSchema(),
      // notification更新为 `> {`，确保useIdeSelection后续读取最新状态。
      notification => {
        // `currentIDERef.current` 与 `ideClient` 不一致时刷新派生状态，避免使用过期结果。
        if (currentIDERef.current !== ideClient) {
          // React hook use Ide Selection在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
        try {
          // Get the selection data from the notification params
          // selectionData保存`notification.params`，供后续判断或组装使用。
          const selectionData = notification.params

          // Process selection data - validate it has required properties
          // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
          if (
            selectionData.selection &&
            selectionData.selection.start &&
            selectionData.selection.end
          ) {
            // Handle selection changes
            // 调用 selectionChangeHandler，触发React hook此处需要的副作用。
            selectionChangeHandler(selectionData as SelectionData)
          // React hook use Ide Selection在这里处理 `} else if (selectionData.text !== undefined) {`，完成这一小步状态转换。
          } else if (selectionData.text !== undefined) {
            // Handle empty selection (when text is empty string)
            // 调用 selectionChangeHandler，触发React hook此处需要的副作用。
            selectionChangeHandler({
              selection: null,
              text: selectionData.text,
              filePath: selectionData.filePath,
            })
          }
        } catch (error) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logError(error as Error)
        }
      },
    )

    // Mark that we've registered handlers
    // current更新为 `true`，确保useIdeSelection后续读取最新状态。
    handlersRegistered.current = true

    // No cleanup needed as MCP clients manage their own lifecycle
  }, [mcpClients, onSelect])
}
