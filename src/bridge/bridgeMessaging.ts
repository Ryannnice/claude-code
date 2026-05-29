/**
 * Shared transport-layer helpers for bridge message handling.
 *
 * Extracted from replBridge.ts so both the env-based core (initBridgeCore)
 * and the env-less core (initEnvLessBridgeCore) can use the same ingress
 * parsing, control-request handling, and echo-dedup machinery.
 *
 * Everything here is pure — no closure over bridge-specific state. All
 * collaborators (transport, sessionId, UUID sets, callbacks) are passed
 * as params.
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import type {
  SDKControlRequest,
  SDKControlResponse,
} from '../entrypoints/sdk/controlTypes.js'
// 类型依赖 { SDKResultSuccess } 来自 ../entrypoints/sdk/coreTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKResultSuccess } from '../entrypoints/sdk/coreTypes.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 接入 EMPTY_USAGE 服务层能力，把外部通信或共享状态交给 ../services/api/emptyUsage.js 处理。
import { EMPTY_USAGE } from '../services/api/emptyUsage.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准远程桥接会话的数据契约。
import type { Message } from '../types/message.js'
// 复用 normalizeControlMessageKeys 工具函数，把通用处理留在 ../utils/controlMessageCompat.js 中维护。
import { normalizeControlMessageKeys } from '../utils/controlMessageCompat.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 stripDisplayTagsAllowEmpty 工具函数，把通用处理留在 ../utils/displayTags.js 中维护。
import { stripDisplayTagsAllowEmpty } from '../utils/displayTags.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 类型依赖 { PermissionMode } 来自 ../utils/permissions/PermissionMode.js，用于校准远程桥接会话的数据契约。
import type { PermissionMode } from '../utils/permissions/PermissionMode.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse } from '../utils/slowOperations.js'
// 类型依赖 { ReplBridgeTransport } 来自 ./replBridgeTransport.js，用于校准远程桥接会话的数据契约。
import type { ReplBridgeTransport } from './replBridgeTransport.js'

// ─── Type guards ─────────────────────────────────────────────────────────────

/** Type predicate for parsed WebSocket messages. SDKMessage is a
 *  discriminated union on `type` — validating the discriminant is
 *  sufficient for the predicate; callers narrow further via the union. */
// isSDKMessage 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSDKMessage(value: unknown): value is SDKMessage {
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    typeof value.type === 'string'
  )
}

/** Type predicate for control_response messages from the server. */
// isSDKControlResponse 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSDKControlResponse(
  value: unknown,
): value is SDKControlResponse {
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'control_response' &&
    'response' in value
  )
}

/** Type predicate for control_request messages from the server. */
// isSDKControlRequest 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSDKControlRequest(
  value: unknown,
): value is SDKControlRequest {
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'control_request' &&
    'request_id' in value &&
    'request' in value
  )
}

/**
 * True for message types that should be forwarded to the bridge transport.
 * The server only wants user/assistant turns and slash-command system events;
 * everything else (tool_result, progress, etc.) is internal REPL chatter.
 */
// isEligibleBridgeMessage 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEligibleBridgeMessage(m: Message): boolean {
  // Virtual messages (REPL inner calls) are display-only — bridge/SDK
  // consumers see the REPL tool_use/result which summarizes the work.
  // 组合条件 `(m.type === 'user' || m.type === 'assistant') && m.isVirtual` 成立时，远程桥接会话才启用这条专门路径。
  if ((m.type === 'user' || m.type === 'assistant') && m.isVirtual) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    m.type === 'user' ||
    m.type === 'assistant' ||
    (m.type === 'system' && m.subtype === 'local_command')
  )
}

/**
 * Extract title-worthy text from a Message for onUserMessage. Returns
 * undefined for messages that shouldn't title the session: non-user, meta
 * (nudges), tool results, compact summaries, non-human origins (task
 * notifications, channel messages), or pure display-tag content
 * (<ide_opened_file>, <session-start-hook>, etc.).
 *
 * Synthetic interrupts ([Request interrupted by user]) are NOT filtered here —
 * isSyntheticMessage lives in messages.ts (heavy import, pulls command
 * registry). The initialMessages path in initReplBridge checks it; the
 * writeMessages path reaching an interrupt as the *first* message is
 * implausible (an interrupt implies a prior prompt already flowed through).
 */
// extractTitleText 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractTitleText(m: Message): string | undefined {
  // `m.type` 与 `'user' || m.isMeta || m.toolUse...` 不一致时刷新派生状态，避免使用过期结果。
  if (m.type !== 'user' || m.isMeta || m.toolUseResult || m.isCompactSummary)
    // 返回 `undefined`，作为远程桥接会话这次计算的结果。
    return undefined
  // `m.origin && m.origin.kind` 与 `'human'` 不一致时刷新派生状态，避免使用过期结果。
  if (m.origin && m.origin.kind !== 'human') return undefined
  // 文本内容保存`m.message.content`，供远程桥接会话远程桥接 bridge Messaging后续判断或输出使用。
  const content = m.message.content
  // 原始文本 先占位，稍后的条件分支会根据实际输入补齐它。
  let raw: string | undefined
  // 当 `typeof content` 匹配 `'string'` 时，远程桥接会话执行对应分支。
  if (typeof content === 'string') {
    // 原始文本更新为 `content`，确保Bridge 通信后续读取最新状态。
    raw = content
  } else {
    // 按顺序遍历 `content` 中的block，逐个交给远程桥接会话处理。
    for (const block of content) {
      // 当 `block.type` 匹配 `'text'` 时，远程桥接会话执行对应分支。
      if (block.type === 'text') {
        // 原始文本更新为 `block.text`，确保Bridge 通信后续读取最新状态。
        raw = block.text
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }
    }
  }
  // 原始文本缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!raw) return undefined
  // clean保存`stripDisplayTagsAllowEmpty`，供远程桥接会话后续处理使用。
  const clean = stripDisplayTagsAllowEmpty(raw)
  // 返回 `clean || undefined`，作为远程桥接会话这次计算的结果。
  return clean || undefined
}

// ─── Ingress routing ─────────────────────────────────────────────────────────

/**
 * Parse an ingress WebSocket message and route it to the appropriate handler.
 * Ignores messages whose UUID is in recentPostedUUIDs (echoes of what we sent)
 * or in recentInboundUUIDs (re-deliveries we've already forwarded — e.g.
 * server replayed history after a transport swap lost the seq-num cursor).
 */
// handleIngressMessage 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleIngressMessage(
  data: string,
  recentPostedUUIDs: BoundedUUIDSet,
  recentInboundUUIDs: BoundedUUIDSet,
  // 这个回调绑定到 onInboundMessage: ((msg: SDKMessage) => void | Promise<void>) | undefined,，负责远程桥接会话在该局部场景下的响应。
  onInboundMessage: ((msg: SDKMessage) => void | Promise<void>) | undefined,
  onPermissionResponse?: ((response: SDKControlResponse) => void) | undefined,
  onControlRequest?: ((request: SDKControlRequest) => void) | undefined,
): void {
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果 命名 `normalizeControlMessageKeys(jsonParse(data))`，让后续代码直接表达这个值的用途。
    const parsed: unknown = normalizeControlMessageKeys(jsonParse(data))

    // control_response is not an SDKMessage — check before the type guard
    // 满足 `isSDKControlResponse(parsed)` 时，远程桥接会话执行该分支。
    if (isSDKControlResponse(parsed)) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[bridge:repl] Ingress message type=control_response')
      // 调用 onPermissionResponse?.(parsed)，完成这一处局部操作。
      onPermissionResponse?.(parsed)
      // 远程桥接 bridge Messaging在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // control_request from the server (initialize, set_model, can_use_tool).
    // Must respond promptly or the server kills the WS (~10-14s timeout).
    // 满足 `isSDKControlRequest(parsed)` 时，远程桥接会话执行该分支。
    if (isSDKControlRequest(parsed)) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Inbound control_request subtype=${parsed.request.subtype}`,
      )
      // 调用 onControlRequest?.(parsed)，完成这一处局部操作。
      onControlRequest?.(parsed)
      // 远程桥接 bridge Messaging在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 满足 `!isSDKMessage(parsed)` 时，远程桥接会话执行该分支。
    if (!isSDKMessage(parsed)) return

    // Check for UUID to detect echoes of our own messages
    // uuid 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const uuid =
      'uuid' in parsed && typeof parsed.uuid === 'string'
        ? parsed.uuid
        : undefined

    // 组合条件 `uuid && recentPostedUUIDs.has(uuid)` 成立时，远程桥接会话才启用这条专门路径。
    if (uuid && recentPostedUUIDs.has(uuid)) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Ignoring echo: type=${parsed.type} uuid=${uuid}`,
      )
      // 远程桥接 bridge Messaging在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Defensive dedup: drop inbound prompts we've already forwarded. The
    // SSE seq-num carryover (lastTransportSequenceNum) is the primary fix
    // for history-replay; this catches edge cases where that negotiation
    // fails (server ignores from_sequence_num, transport died before
    // receiving any frames, etc).
    // 组合条件 `uuid && recentInboundUUIDs.has(uuid)` 成立时，远程桥接会话才启用这条专门路径。
    if (uuid && recentInboundUUIDs.has(uuid)) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Ignoring re-delivered inbound: type=${parsed.type} uuid=${uuid}`,
      )
      // 远程桥接 bridge Messaging在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Ingress message type=${parsed.type}${uuid ? ` uuid=${uuid}` : ''}`,
    )

    // 当 `parsed.type` 匹配 `'user'` 时，远程桥接会话执行对应分支。
    if (parsed.type === 'user') {
      // 满足 `uuid) recentInboundUUIDs.add(uuid` 时，远程桥接会话执行该分支。
      if (uuid) recentInboundUUIDs.add(uuid)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_message_received', {
        is_repl: true,
      })
      // Fire-and-forget — handler may be async (attachment resolution).
      // 显式忽略 `onInboundMessage?.(parsed)` 的返回值，只保留它触发的副作用。
      void onInboundMessage?.(parsed)
    } else {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Ignoring non-user inbound message: type=${parsed.type}`,
      )
    }
  } catch (err) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Failed to parse ingress message: ${errorMessage(err)}`,
    )
  }
}

// ─── Server-initiated control requests ───────────────────────────────────────

// ServerControlRequestHandlers 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type ServerControlRequestHandlers = {
  transport: ReplBridgeTransport | null
  sessionId: string
  /**
   * When true, all mutable requests (interrupt, set_model, set_permission_mode,
   * set_max_thinking_tokens) reply with an error instead of false-success.
   * initialize still replies success — the server kills the connection otherwise.
   * Used by the outbound-only bridge mode and the SDK's /bridge subpath so claude.ai sees a
   * proper error instead of "action succeeded but nothing happened locally".
   */
  outboundOnly?: boolean
  // 这个回调绑定到 onInterrupt?: () => void，负责远程桥接会话在该局部场景下的响应。
  onInterrupt?: () => void
  // 这个回调绑定到 onSetModel?: (model: string | undefined) => void，负责远程桥接会话在该局部场景下的响应。
  onSetModel?: (model: string | undefined) => void
  // 这个回调绑定到 onSetMaxThinkingTokens?: (maxTokens: number | null) => void，负责远程桥接会话在该局部场景下的响应。
  onSetMaxThinkingTokens?: (maxTokens: number | null) => void
  // 远程桥接 bridge Messaging在这里处理 `onSetPermissionMode?: (`，完成这一小步状态转换。
  onSetPermissionMode?: (
    mode: PermissionMode,
  ) => { ok: true } | { ok: false; error: string }
}

// OUTBOUND_ONLY_ERROR 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const OUTBOUND_ONLY_ERROR =
  'This session is outbound-only. Enable Remote Control locally to allow inbound control.'

/**
 * Respond to inbound control_request messages from the server. The server
 * sends these for session lifecycle events (initialize, set_model) and
 * for turn-level coordination (interrupt, set_max_thinking_tokens). If we
 * don't respond, the server hangs and kills the WS after ~10-14s.
 *
 * Previously a closure inside initBridgeCore's onWorkReceived; now takes
 * collaborators as params so both cores can use it.
 */
// handleServerControlRequest 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleServerControlRequest(
  request: SDKControlRequest,
  handlers: ServerControlRequestHandlers,
): void {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    transport,
    sessionId,
    outboundOnly,
    onInterrupt,
    onSetModel,
    onSetMaxThinkingTokens,
    onSetPermissionMode,
  } = handlers
  // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!transport) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[bridge:repl] Cannot respond to control_request: transport not configured',
    )
    // 远程桥接 bridge Messaging在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 接口响应 先占位，稍后的条件分支会根据实际输入补齐它。
  let response: SDKControlResponse

  // Outbound-only: reply error for mutable requests so claude.ai doesn't show
  // false success. initialize must still succeed (server kills the connection
  // if it doesn't — see comment above).
  // `outboundOnly && request.request.subtype` 与 `'init` 不一致时刷新派生状态，避免使用过期结果。
  if (outboundOnly && request.request.subtype !== 'initialize') {
    // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
    response = {
      type: 'control_response',
      response: {
        subtype: 'error',
        request_id: request.request_id,
        error: OUTBOUND_ONLY_ERROR,
      },
    }
    // event 集中保存远程桥接会话远程桥接 bridge Messaging要一起传递的字段。
    const event = { ...response, session_id: sessionId }
    // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
    void transport.write(event)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Rejected ${request.request.subtype} (outbound-only) request_id=${request.request_id}`,
    )
    // 远程桥接 bridge Messaging在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 按照 request.request.subtype 的取值选择远程桥接会话的具体处理分支。
  switch (request.request.subtype) {
    case 'initialize':
      // Respond with minimal capabilities — the REPL handles
      // commands, models, and account info itself.
      // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
      response = {
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: request.request_id,
          response: {
            commands: [],
            output_style: 'normal',
            available_output_styles: ['normal'],
            models: [],
            account: {},
            pid: process.pid,
          },
        },
      }
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break

    case 'set_model':
      // 调用 onSetModel?.(request.request.model)，完成这一处局部操作。
      onSetModel?.(request.request.model)
      // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
      response = {
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: request.request_id,
        },
      }
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break

    case 'set_max_thinking_tokens':
      // 调用 onSetMaxThinkingTokens?.(request.request.max_thinking_tokens)，完成这一处局部操作。
      onSetMaxThinkingTokens?.(request.request.max_thinking_tokens)
      // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
      response = {
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: request.request_id,
        },
      }
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break

    case 'set_permission_mode': {
      // The callback returns a policy verdict so we can send an error
      // control_response without importing isAutoModeGateEnabled /
      // isBypassPermissionsModeDisabled here (bootstrap-isolation). If no
      // callback is registered (daemon context, which doesn't wire this —
      // see daemonBridge.ts), return an error verdict rather than a silent
      // false-success: the mode is never actually applied in that context,
      // so success would lie to the client.
      // verdict保存`onSetPermissionMode?.(request.request.mode) ?? {`，供后续判断或组装使用。
      const verdict = onSetPermissionMode?.(request.request.mode) ?? {
        ok: false,
        error:
          'set_permission_mode is not supported in this context (onSetPermissionMode callback not registered)',
      }
      // 满足 `verdict.ok` 时，远程桥接会话执行该分支。
      if (verdict.ok) {
        // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
        response = {
          type: 'control_response',
          response: {
            subtype: 'success',
            request_id: request.request_id,
          },
        }
      } else {
        // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
        response = {
          type: 'control_response',
          response: {
            subtype: 'error',
            request_id: request.request_id,
            error: verdict.error,
          },
        }
      }
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break
    }

    case 'interrupt':
      // 调用 onInterrupt?.()，完成这一处局部操作。
      onInterrupt?.()
      // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
      response = {
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: request.request_id,
        },
      }
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break

    default:
      // Unknown subtype — respond with error so the server doesn't
      // hang waiting for a reply that never comes.
      // 接口响应更新为 `{`，确保Bridge 通信后续读取最新状态。
      response = {
        type: 'control_response',
        response: {
          subtype: 'error',
          request_id: request.request_id,
          error: `REPL bridge does not handle control_request subtype: ${request.request.subtype}`,
        },
      }
  }

  // event 集中保存远程桥接会话远程桥接 bridge Messaging要一起传递的字段。
  const event = { ...response, session_id: sessionId }
  // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
  void transport.write(event)
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:repl] Sent control_response for ${request.request.subtype} request_id=${request.request_id} result=${response.response.subtype}`,
  )
}

// ─── Result message (for session archival on teardown) ───────────────────────

/**
 * Build a minimal `SDKResultSuccess` message for session archival.
 * The server needs this event before a WS close to trigger archival.
 */
// makeResultMessage 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function makeResultMessage(sessionId: string): SDKResultSuccess {
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    type: 'result',
    subtype: 'success',
    duration_ms: 0,
    duration_api_ms: 0,
    is_error: false,
    num_turns: 0,
    result: '',
    stop_reason: null,
    total_cost_usd: 0,
    usage: { ...EMPTY_USAGE },
    modelUsage: {},
    permission_denials: [],
    session_id: sessionId,
    uuid: randomUUID(),
  }
}

// ─── BoundedUUIDSet (echo-dedup ring buffer) ─────────────────────────────────

/**
 * FIFO-bounded set backed by a circular buffer. Evicts the oldest entry
 * when capacity is reached, keeping memory usage constant at O(capacity).
 *
 * Messages are added in chronological order, so evicted entries are always
 * the oldest. The caller relies on external ordering (the hook's
 * lastWrittenIndexRef) as the primary dedup — this set is a secondary
 * safety net for echo filtering and race-condition dedup.
 */
// BoundedUUIDSet 聚合远程桥接会话相关状态与操作，把同一职责的行为收束到类实例中。
export class BoundedUUIDSet {
  private readonly capacity: number
  private readonly ring: (string | undefined)[]
  private readonly set = new Set<string>()
  private writeIdx = 0

  // 构造函数接收 capacity: number，把外部输入整理成实例可复用的内部状态。
  constructor(capacity: number) {
    // 更新实例字段 capacity 为 capacity，同步远程桥接会话的内部状态。
    this.capacity = capacity
    // 更新实例字段 ring 为 new Array<string | undefined>(capacity)，同步远程桥接会话的内部状态。
    this.ring = new Array<string | undefined>(capacity)
  }

  // add 使用 uuid: string 完成远程桥接会话里的对应操作。
  add(uuid: string): void {
    // 满足 `this.set.has(uuid)` 时，远程桥接会话执行该分支。
    if (this.set.has(uuid)) return
    // Evict the entry at the current write position (if occupied)
    // evicted保存`this.ring[this.writeIdx]`，供远程桥接会话远程桥接 bridge Messaging后续判断或输出使用。
    const evicted = this.ring[this.writeIdx]
    // `evicted` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (evicted !== undefined) {
      // this.set.delete 写入新的状态值，使远程桥接会话后续读取保持一致。
      this.set.delete(evicted)
    }
    // writeIdx更新为 `uuid`，确保远程桥接 bridge Messaging后续读取最新状态。
    this.ring[this.writeIdx] = uuid
    // this.set.add 写入新的状态值，使远程桥接会话后续读取保持一致。
    this.set.add(uuid)
    // 更新实例字段 writeIdx 为 (this.writeIdx + 1) % this.capacity，同步远程桥接会话的内部状态。
    this.writeIdx = (this.writeIdx + 1) % this.capacity
  }

  // has 用 uuid: string 判断远程桥接会话是否满足条件。
  has(uuid: string): boolean {
    // 返回 `this.set.has(uuid)`，作为远程桥接会话这次计算的结果。
    return this.set.has(uuid)
  }

  // clear 使用 无 完成远程桥接会话里的对应操作。
  clear(): void {
    // this.set.clear 写入新的状态值，使远程桥接会话后续读取保持一致。
    this.set.clear()
    // 调用 this.ring.fill，触发远程桥接会话此处需要的副作用。
    this.ring.fill(undefined)
    // 更新实例字段 writeIdx 为 0，同步远程桥接会话的内部状态。
    this.writeIdx = 0
  }
}
