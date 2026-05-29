// 整理这一组导入，让sdk Message Adapter后续逻辑可以直接复用这些外部能力。
import type {
  SDKAssistantMessage,
  SDKCompactBoundaryMessage,
  SDKMessage,
  SDKPartialAssistantMessage,
  SDKResultMessage,
  SDKStatusMessage,
  SDKSystemMessage,
  SDKToolProgressMessage,
} from '../entrypoints/agentSdkTypes.js'
// 整理这一组导入，让sdk Message Adapter后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  StreamEvent,
  SystemMessage,
} from '../types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 fromSDKCompactMetadata 工具函数，把通用处理留在 ../utils/messages/mappers.js 中维护。
import { fromSDKCompactMetadata } from '../utils/messages/mappers.js'
// 复用 createUserMessage 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { createUserMessage } from '../utils/messages.js'

/**
 * Converts SDKMessage from CCR to REPL Message types.
 *
 * The CCR backend sends SDK-format messages via WebSocket. The REPL expects
 * internal Message types for rendering. This adapter bridges the two.
 */

/**
 * Convert an SDKAssistantMessage to an AssistantMessage
 */
// convertAssistantMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertAssistantMessage(msg: SDKAssistantMessage): AssistantMessage {
  // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
  return {
    type: 'assistant',
    message: msg.message,
    uuid: msg.uuid,
    requestId: undefined,
    timestamp: new Date().toISOString(),
    error: msg.error,
  }
}

/**
 * Convert an SDKPartialAssistantMessage (streaming) to a StreamEvent
 */
// convertStreamEvent 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertStreamEvent(msg: SDKPartialAssistantMessage): StreamEvent {
  // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
  return {
    type: 'stream_event',
    event: msg.event,
  }
}

/**
 * Convert an SDKResultMessage to a SystemMessage
 */
// convertResultMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertResultMessage(msg: SDKResultMessage): SystemMessage {
  // isError 错误信息标记sdk Message Adapter是否启用对应路径。
  const isError = msg.subtype !== 'success'
  // 文本内容保存`isError`，供sdk Message Adapter后续判断或输出使用。
  const content = isError
    ? msg.errors?.join(', ') || 'Unknown error'
    : 'Session completed successfully'

  // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
  return {
    type: 'system',
    subtype: 'informational',
    content,
    level: isError ? 'warning' : 'info',
    uuid: msg.uuid,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Convert an SDKSystemMessage (init) to a SystemMessage
 */
// convertInitMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertInitMessage(msg: SDKSystemMessage): SystemMessage {
  // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
  return {
    type: 'system',
    subtype: 'informational',
    content: `Remote session initialized (model: ${msg.model})`,
    level: 'info',
    uuid: msg.uuid,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Convert an SDKStatusMessage to a SystemMessage
 */
// convertStatusMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertStatusMessage(msg: SDKStatusMessage): SystemMessage | null {
  // msg.status 集合缺失时提前走兜底路径，避免sdk Message Adapter继续依赖无效输入。
  if (!msg.status) {
    // 返回 `null`，作为sdk Message Adapter这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
  return {
    type: 'system',
    subtype: 'informational',
    content:
      msg.status === 'compacting'
        ? 'Compacting conversation…'
        : `Status: ${msg.status}`,
    level: 'info',
    uuid: msg.uuid,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Convert an SDKToolProgressMessage to a SystemMessage.
 * We use a system message instead of ProgressMessage since the Progress type
 * is a complex union that requires tool-specific data we don't have from CCR.
 */
// convertToolProgressMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertToolProgressMessage(
  msg: SDKToolProgressMessage,
): SystemMessage {
  // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
  return {
    type: 'system',
    subtype: 'informational',
    content: `Tool ${msg.tool_name} running for ${msg.elapsed_time_seconds}s…`,
    level: 'info',
    uuid: msg.uuid,
    timestamp: new Date().toISOString(),
    toolUseID: msg.tool_use_id,
  }
}

/**
 * Convert an SDKCompactBoundaryMessage to a SystemMessage
 */
// convertCompactBoundaryMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertCompactBoundaryMessage(
  msg: SDKCompactBoundaryMessage,
): SystemMessage {
  // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
  return {
    type: 'system',
    subtype: 'compact_boundary',
    content: 'Conversation compacted',
    level: 'info',
    uuid: msg.uuid,
    timestamp: new Date().toISOString(),
    compactMetadata: fromSDKCompactMetadata(msg.compact_metadata),
  }
}

/**
 * Result of converting an SDKMessage
 */
// ConvertedMessage 固化sdk Message Adapter里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConvertedMessage =
  | { type: 'message'; message: Message }
  | { type: 'stream_event'; event: StreamEvent }
  | { type: 'ignored' }

// ConvertOptions 固化sdk Message Adapter里传递的数据形状，帮助调用方按同一结构读写字段。
type ConvertOptions = {
  /** Convert user messages containing tool_result content blocks into UserMessages.
   * Used by direct connect mode where tool results come from the remote server
   * and need to be rendered locally. CCR mode ignores user messages since they
   * are handled differently. */
  convertToolResults?: boolean
  /**
   * Convert user text messages into UserMessages for display. Used when
   * converting historical events where user-typed messages need to be shown.
   * In live WS mode these are already added locally by the REPL so they're
   * ignored by default.
   */
  convertUserTextMessages?: boolean
}

/**
 * Convert an SDKMessage to REPL message format
 */
// convertSDKMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function convertSDKMessage(
  msg: SDKMessage,
  opts?: ConvertOptions,
): ConvertedMessage {
  // 按照 msg.type 的取值选择sdk Message Adapter的具体处理分支。
  switch (msg.type) {
    case 'assistant':
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'message', message: convertAssistantMessage(msg) }

    case 'user': {
      // 文本内容保存`msg.message?.content`，供后续判断或组装使用。
      const content = msg.message?.content
      // Tool result messages from the remote server need to be converted so
      // they render and collapse like local tool results. Detect via content
      // shape (tool_result blocks) — parent_tool_use_id is NOT reliable: the
      // agent-side normalizeMessage() hardcodes it to null for top-level
      // tool results, so it can't distinguish tool results from prompt echoes.
      // isToolResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isToolResult =
        // 调用 Array.isArray，触发sdk Message Adapter此处需要的副作用。
        Array.isArray(content) && content.some(b => b.type === 'tool_result')
      // 组合条件 `opts?.convertToolResults && isToolResult` 成立时，sdk Message Adapter才启用这条专门路径。
      if (opts?.convertToolResults && isToolResult) {
        // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
        return {
          type: 'message',
          message: createUserMessage({
            content,
            toolUseResult: msg.tool_use_result,
            uuid: msg.uuid,
            timestamp: msg.timestamp,
          }),
        }
      }
      // When converting historical events, user-typed messages need to be
      // rendered (they weren't added locally by the REPL). Skip tool_results
      // here — already handled above.
      // 组合条件 `opts?.convertUserTextMessages && !isToolResult` 成立时，sdk Message Adapter才启用这条专门路径。
      if (opts?.convertUserTextMessages && !isToolResult) {
        // 组合条件 `typeof content === 'string' || Array.isArray(content)` 成立时，sdk Message Adapter才启用这条专门路径。
        if (typeof content === 'string' || Array.isArray(content)) {
          // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
          return {
            type: 'message',
            message: createUserMessage({
              content,
              toolUseResult: msg.tool_use_result,
              uuid: msg.uuid,
              timestamp: msg.timestamp,
            }),
          }
        }
      }
      // User-typed messages (string content) are already added locally by REPL.
      // In CCR mode, all user messages are ignored (tool results handled differently).
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'ignored' }
    }

    case 'stream_event':
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'stream_event', event: convertStreamEvent(msg) }

    case 'result':
      // Only show result messages for errors. Success results are noise
      // in multi-turn sessions (isLoading=false is sufficient signal).
      // `msg.subtype` 与 `'success'` 不一致时刷新派生状态，避免使用过期结果。
      if (msg.subtype !== 'success') {
        // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
        return { type: 'message', message: convertResultMessage(msg) }
      }
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'ignored' }

    case 'system':
      // 当 `msg.subtype` 匹配 `'init'` 时，sdk Message Adapter执行对应分支。
      if (msg.subtype === 'init') {
        // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
        return { type: 'message', message: convertInitMessage(msg) }
      }
      // 当 `msg.subtype` 匹配 `'status'` 时，sdk Message Adapter执行对应分支。
      if (msg.subtype === 'status') {
        // statusMsg保存`convertStatusMessage`，供sdk Message Adapter后续处理使用。
        const statusMsg = convertStatusMessage(msg)
        // 返回 `statusMsg`，作为sdk Message Adapter这次计算的结果。
        return statusMsg
          ? { type: 'message', message: statusMsg }
          : { type: 'ignored' }
      }
      // 当 `msg.subtype` 匹配 `'compact_boundary'` 时，sdk Message Adapter执行对应分支。
      if (msg.subtype === 'compact_boundary') {
        // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
        return {
          type: 'message',
          message: convertCompactBoundaryMessage(msg),
        }
      }
      // hook_response and other subtypes
      // 记录sdk Message Adapter运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[sdkMessageAdapter] Ignoring system message subtype: ${msg.subtype}`,
      )
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'ignored' }

    case 'tool_progress':
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'message', message: convertToolProgressMessage(msg) }

    case 'auth_status':
      // Auth status is handled separately, not converted to a display message
      // 记录sdk Message Adapter运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[sdkMessageAdapter] Ignoring auth_status message')
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'ignored' }

    case 'tool_use_summary':
      // Tool use summaries are SDK-only events, not displayed in REPL
      // 记录sdk Message Adapter运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[sdkMessageAdapter] Ignoring tool_use_summary message')
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'ignored' }

    case 'rate_limit_event':
      // Rate limit events are SDK-only events, not displayed in REPL
      // 记录sdk Message Adapter运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[sdkMessageAdapter] Ignoring rate_limit_event message')
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'ignored' }

    default: {
      // Gracefully ignore unknown message types. The backend may send new
      // types before the client is updated; logging helps with debugging
      // without crashing or losing the session.
      // 记录sdk Message Adapter运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[sdkMessageAdapter] Unknown message type: ${(msg as { type: string }).type}`,
      )
      // 返回结构化结果，集中表达sdk Message Adapter已经整理出的状态。
      return { type: 'ignored' }
    }
  }
}

/**
 * Check if an SDKMessage indicates the session has ended
 */
// isSessionEndMessage 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSessionEndMessage(msg: SDKMessage): boolean {
  // 返回 `msg.type === 'result'`，作为sdk Message Adapter这次计算的结果。
  return msg.type === 'result'
}

/**
 * Check if an SDKResultMessage indicates success
 */
// isSuccessResult 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSuccessResult(msg: SDKResultMessage): boolean {
  // 返回 `msg.subtype === 'success'`，作为sdk Message Adapter这次计算的结果。
  return msg.subtype === 'success'
}

/**
 * Extract the result text from a successful SDKResultMessage
 */
// getResultText 封装sdkMessageAdapter的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getResultText(msg: SDKResultMessage): string | null {
  // 当 `msg.subtype` 匹配 `'success'` 时，sdk Message Adapter执行对应分支。
  if (msg.subtype === 'success') {
    // 返回 `msg.result`，作为sdk Message Adapter这次计算的结果。
    return msg.result
  }
  // 返回 `null`，作为sdk Message Adapter这次计算的结果。
  return null
}
