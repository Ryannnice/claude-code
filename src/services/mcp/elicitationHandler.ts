// 类型依赖 { Client } 来自 @modelcontextprotocol/sdk/client/index.js，用于校准MCP 服务的数据契约。
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  ElicitationCompleteNotificationSchema,
  type ElicitRequestParams,
  ElicitRequestSchema,
  type ElicitResult,
} from '@modelcontextprotocol/sdk/types.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准MCP 服务的数据契约。
import type { AppState } from '../../state/AppState.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  executeElicitationHooks,
  executeElicitationResultHooks,
  executeNotificationHooks,
} from '../../utils/hooks.js'
// 复用 logMCPDebug、logMCPError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPDebug, logMCPError } from '../../utils/log.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'

/** Configuration for the waiting state shown after the user opens a URL. */
// ElicitationWaitingState 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ElicitationWaitingState = {
  /** Button label, e.g. "Retry now" or "Skip confirmation" */
  actionLabel: string
  /** Whether to show a visible Cancel button (e.g. for error-based retry flow) */
  showCancel?: boolean
}

// ElicitationRequestEvent 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type ElicitationRequestEvent = {
  serverName: string
  /** The JSON-RPC request ID, unique per server connection. */
  requestId: string | number
  params: ElicitRequestParams
  signal: AbortSignal
  /**
   * Resolves the elicitation. For explicit elicitations, all actions are
   * meaningful. For error-based retry (-32042), 'accept' is a no-op —
   * the retry is driven by onWaitingDismiss instead.
   */
  // 这个回调绑定到 respond: (response: ElicitResult) => void，负责MCP 服务在该局部场景下的响应。
  respond: (response: ElicitResult) => void
  /** For URL elicitations: shown after user opens the browser. */
  waitingState?: ElicitationWaitingState
  /** Called when phase 2 (waiting) is dismissed by user action or completion. */
  onWaitingDismiss?: (action: 'dismiss' | 'retry' | 'cancel') => void
  /** Set to true by the completion notification handler when the server confirms completion. */
  completed?: boolean
}

// getElicitationMode 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getElicitationMode(params: ElicitRequestParams): 'form' | 'url' {
  // 返回 `params.mode === 'url' ? 'url' : 'form'`，作为MCP 服务这次计算的结果。
  return params.mode === 'url' ? 'url' : 'form'
}

/** Find a queued elicitation event by server name and elicitationId. */
// findElicitationInQueue 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findElicitationInQueue(
  queue: ElicitationRequestEvent[],
  serverName: string,
  elicitationId: string,
): number {
  // 返回 `queue.findIndex(`，作为MCP 服务这次计算的结果。
  return queue.findIndex(
    // e更新为 `>`，确保MCP 服务后续读取最新状态。
    e =>
      e.serverName === serverName &&
      e.params.mode === 'url' &&
      'elicitationId' in e.params &&
      e.params.elicitationId === elicitationId,
  )
}

// registerElicitationHandler 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerElicitationHandler(
  client: Client,
  serverName: string,
  // 这个回调绑定到 setAppState: (f: (prevState: AppState) => AppState) => void,，负责MCP 服务在该局部场景下的响应。
  setAppState: (f: (prevState: AppState) => AppState) => void,
): void {
  // Register the elicitation request handler.
  // Wrapped in try/catch because setRequestHandler throws if the client wasn't
  // created with elicitation capability declared.
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // client.setRequestHandler 写入新的状态值，使MCP 服务后续读取保持一致。
    client.setRequestHandler(ElicitRequestSchema, async (request, extra) => {
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        serverName,
        `Received elicitation request: ${jsonStringify(request)}`,
      )

      // mode读取`getElicitationMode`，供MCP 服务后续处理使用。
      const mode = getElicitationMode(request.params)

      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_elicitation_shown', {
        mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // Run elicitation hooks first - they can provide a response programmatically
        // hookResponse 响应数据保存`runElicitationHooks`，供MCP 服务后续处理使用。
        const hookResponse = await runElicitationHooks(
          serverName,
          request.params,
          extra.signal,
        )
        // 满足 `hookResponse` 时，MCP 服务执行该分支。
        if (hookResponse) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            serverName,
            `Elicitation resolved by hook: ${jsonStringify(hookResponse)}`,
          )
          // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_mcp_elicitation_response', {
            mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            action:
              hookResponse.action as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 返回 `hookResponse`，作为MCP 服务这次计算的结果。
          return hookResponse
        }

        // elicitationId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const elicitationId =
          mode === 'url' && 'elicitationId' in request.params
            ? (request.params.elicitationId as string | undefined)
            : undefined

        // 接口响应封装成回调，供MCP 服务MCP 服务 elicitation Handler在事件触发或异步步骤中调用。
        const response = new Promise<ElicitResult>(resolve => {
          // onAbort封装成回调，供MCP 服务MCP 服务 elicitation Handler在事件触发或异步步骤中调用。
          const onAbort = () => {
            // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolve({ action: 'cancel' })
          }

          // 满足 `extra.signal.aborted` 时，MCP 服务执行该分支。
          if (extra.signal.aborted) {
            // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
            onAbort()
            // MCP 服务 elicitation Handler在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }

          // waitingState 状态 先占位，稍后的条件分支会根据实际输入补齐它。
          const waitingState: ElicitationWaitingState | undefined =
            elicitationId ? { actionLabel: 'Skip confirmation' } : undefined

          // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
          setAppState(prev => ({
            ...prev,
            elicitation: {
              queue: [
                ...prev.elicitation.queue,
                {
                  serverName,
                  requestId: extra.requestId,
                  params: request.params,
                  signal: extra.signal,
                  waitingState,
                  // 这个回调绑定到 respond: (result: ElicitResult) => {，负责MCP 服务在该局部场景下的响应。
                  respond: (result: ElicitResult) => {
                    // 调用 extra.signal.removeEventListener，触发MCP 服务此处需要的副作用。
                    extra.signal.removeEventListener('abort', onAbort)
                    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_mcp_elicitation_response', {
                      mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      action:
                        result.action as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    })
                    // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                    resolve(result)
                  },
                },
              ],
            },
          }))

          // 调用 extra.signal.addEventListener，触发MCP 服务此处需要的副作用。
          extra.signal.addEventListener('abort', onAbort, { once: true })
        })
        // rawResult 等待 `response`，确保继续执行前已有结果。
        const rawResult = await response
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          serverName,
          `Elicitation response: ${jsonStringify(rawResult)}`,
        )
        // 结果保存`runElicitationResultHooks`，供MCP 服务后续处理使用。
        const result = await runElicitationResultHooks(
          serverName,
          rawResult,
          extra.signal,
          mode,
          elicitationId,
        )
        // 返回 `result`，作为MCP 服务这次计算的结果。
        return result
      } catch (error) {
        // 调用 logMCPError，触发MCP 服务此处需要的副作用。
        logMCPError(serverName, `Elicitation error: ${error}`)
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return { action: 'cancel' as const }
      }
    })

    // Register handler for elicitation completion notifications (URL mode).
    // Sets `completed: true` on the matching queue event; the dialog reacts to this flag.
    // client.setNotificationHandler 写入新的状态值，使MCP 服务后续读取保持一致。
    client.setNotificationHandler(
      ElicitationCompleteNotificationSchema,
      // notification更新为 `> {`，确保MCP 服务后续读取最新状态。
      notification => {
        // 从 `notification.params` 解构 elicitationId，减少MCP 服务 elicitation Handler对同一对象的重复访问。
        const { elicitationId } = notification.params
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          serverName,
          `Received elicitation completion notification: ${elicitationId}`,
        )
        // 显式忽略 `executeNotificationHooks({` 的返回值，只保留它触发的副作用。
        void executeNotificationHooks({
          message: `MCP server "${serverName}" confirmed elicitation ${elicitationId} complete`,
          notificationType: 'elicitation_complete',
        })
        // found标记MCP 服务MCP 服务 elicitation Handler是否启用对应路径。
        let found = false
        // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
        setAppState(prev => {
          // idx筛选`findElicitationInQueue`，供MCP 服务后续处理使用。
          const idx = findElicitationInQueue(
            prev.elicitation.queue,
            serverName,
            elicitationId,
          )
          // 满足 `idx === -1` 时，MCP 服务执行该分支。
          if (idx === -1) return prev
          // found更新为 `true`，确保MCP 服务后续读取最新状态。
          found = true
          // queue 聚合成有序列表，保持后续遍历顺序稳定。
          const queue = [...prev.elicitation.queue]
          // queue[idx更新为 `{ ...queue[idx]!, completed: true }`，确保MCP 服务 elicitation Handler后续读取最新状态。
          queue[idx] = { ...queue[idx]!, completed: true }
          // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
          return { ...prev, elicitation: { queue } }
        })
        // found缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!found) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            serverName,
            `Ignoring completion notification for unknown elicitation: ${elicitationId}`,
          )
        }
      },
    )
  } catch {
    // Client wasn't created with elicitation capability - nothing to register
    // MCP 服务 elicitation Handler在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
}

// runElicitationHooks 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runElicitationHooks(
  serverName: string,
  params: ElicitRequestParams,
  signal: AbortSignal,
): Promise<ElicitResult | undefined> {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // mode标记MCP 服务MCP 服务 elicitation Handler是否启用对应路径。
    const mode = params.mode === 'url' ? 'url' : 'form'
    // URL固定为 `'url' in params ? (params.url as string) : undefined`，作为MCP 服务MCP 服务 elicitation Handler后续展示或比较的基准。
    const url = 'url' in params ? (params.url as string) : undefined
    // elicitationId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const elicitationId =
      'elicitationId' in params
        ? (params.elicitationId as string | undefined)
        : undefined

    // MCP 服务 elicitation Handler先整理这一处局部数据，后续分支可以直接读取。
    const { elicitationResponse, blockingError } =
      await executeElicitationHooks({
        serverName,
        message: params.message,
        requestedSchema:
          'requestedSchema' in params
            ? (params.requestedSchema as Record<string, unknown>)
            : undefined,
        signal,
        mode,
        url,
        elicitationId,
      })

    // 满足 `blockingError` 时，MCP 服务执行该分支。
    if (blockingError) {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return { action: 'decline' }
    }

    // 满足 `elicitationResponse` 时，MCP 服务执行该分支。
    if (elicitationResponse) {
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {
        action: elicitationResponse.action,
        content: elicitationResponse.content,
      }
    }

    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  } catch (error) {
    // 调用 logMCPError，触发MCP 服务此处需要的副作用。
    logMCPError(serverName, `Elicitation hook error: ${error}`)
    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  }
}

/**
 * Run ElicitationResult hooks after the user has responded, then fire a
 * `elicitation_response` notification. Returns a (potentially modified)
 * ElicitResult — hooks may override the action/content or block the response.
 */
// runElicitationResultHooks 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runElicitationResultHooks(
  serverName: string,
  result: ElicitResult,
  signal: AbortSignal,
  mode?: 'form' | 'url',
  elicitationId?: string,
): Promise<ElicitResult> {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // MCP 服务 elicitation Handler先整理这一处局部数据，后续分支可以直接读取。
    const { elicitationResultResponse, blockingError } =
      await executeElicitationResultHooks({
        serverName,
        action: result.action,
        content: result.content as Record<string, unknown> | undefined,
        signal,
        mode,
        elicitationId,
      })

    // 满足 `blockingError` 时，MCP 服务执行该分支。
    if (blockingError) {
      // 显式忽略 `executeNotificationHooks({` 的返回值，只保留它触发的副作用。
      void executeNotificationHooks({
        message: `Elicitation response for server "${serverName}": decline`,
        notificationType: 'elicitation_response',
      })
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return { action: 'decline' }
    }

    // finalResult 命名 `elicitationResultResponse`，让后续代码直接表达这个值的用途。
    const finalResult = elicitationResultResponse
      ? {
          action: elicitationResultResponse.action,
          content: elicitationResultResponse.content ?? result.content,
        }
      : result

    // Fire a notification for observability
    // 显式忽略 `executeNotificationHooks({` 的返回值，只保留它触发的副作用。
    void executeNotificationHooks({
      message: `Elicitation response for server "${serverName}": ${finalResult.action}`,
      notificationType: 'elicitation_response',
    })

    // 返回 `finalResult`，作为MCP 服务这次计算的结果。
    return finalResult
  } catch (error) {
    // 调用 logMCPError，触发MCP 服务此处需要的副作用。
    logMCPError(serverName, `ElicitationResult hook error: ${error}`)
    // Fire notification even on error
    // 显式忽略 `executeNotificationHooks({` 的返回值，只保留它触发的副作用。
    void executeNotificationHooks({
      message: `Elicitation response for server "${serverName}": ${result.action}`,
      notificationType: 'elicitation_response',
    })
    // 返回 `result`，作为MCP 服务这次计算的结果。
    return result
  }
}
