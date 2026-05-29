// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让structured IO后续逻辑可以直接复用这些外部能力。
import type {
  ElicitResult,
  JSONRPCMessage,
} from '@modelcontextprotocol/sdk/types.js'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { AssistantMessage } 来自 src//types/message.js，用于校准structured IO的数据契约。
import type { AssistantMessage } from 'src//types/message.js'
// 整理这一组导入，让structured IO后续逻辑可以直接复用这些外部能力。
import type {
  HookInput,
  HookJSONOutput,
  PermissionUpdate,
  SDKMessage,
  SDKUserMessage,
} from 'src/entrypoints/agentSdkTypes.js'
// 引入 SDKControlElicitationResponseSchema，将 src/entrypoints/sdk/controlSchemas.js 中已经封装好的能力接到本文件流程里。
import { SDKControlElicitationResponseSchema } from 'src/entrypoints/sdk/controlSchemas.js'
// 整理这一组导入，让structured IO后续逻辑可以直接复用这些外部能力。
import type {
  SDKControlRequest,
  SDKControlResponse,
  StdinMessage,
  StdoutMessage,
} from 'src/entrypoints/sdk/controlTypes.js'
// 类型依赖 { CanUseToolFn } 来自 src/hooks/useCanUseTool.js，用于校准structured IO的数据契约。
import type { CanUseToolFn } from 'src/hooks/useCanUseTool.js'
// 类型依赖 { Tool, ToolUseContext } 来自 src/Tool.js，用于校准structured IO的数据契约。
import type { Tool, ToolUseContext } from 'src/Tool.js'
// 引入 HookCallback、hookJSONOutputSchema，将 src/types/hooks.js 中已经封装好的能力接到本文件流程里。
import { type HookCallback, hookJSONOutputSchema } from 'src/types/hooks.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 src/utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from 'src/utils/diagLogs.js'
// 复用 AbortError 工具函数，把通用处理留在 src/utils/errors.js 中维护。
import { AbortError } from 'src/utils/errors.js'
// 整理这一组导入，让structured IO后续逻辑可以直接复用这些外部能力。
import {
  type Output as PermissionToolOutput,
  permissionPromptToolResultToPermissionDecision,
  outputSchema as permissionToolOutputSchema,
} from 'src/utils/permissions/PermissionPromptToolResultSchema.js'
// 整理这一组导入，让structured IO后续逻辑可以直接复用这些外部能力。
import type {
  PermissionDecision,
  PermissionDecisionReason,
} from 'src/utils/permissions/PermissionResult.js'
// 复用 hasPermissionsToUseTool 工具函数，把通用处理留在 src/utils/permissions/permissions.js 中维护。
import { hasPermissionsToUseTool } from 'src/utils/permissions/permissions.js'
// 复用 writeToStdout 工具函数，把通用处理留在 src/utils/process.js 中维护。
import { writeToStdout } from 'src/utils/process.js'
// 复用 jsonStringify 工具函数，把通用处理留在 src/utils/slowOperations.js 中维护。
import { jsonStringify } from 'src/utils/slowOperations.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 notifyCommandLifecycle 工具函数，把通用处理留在 ../utils/commandLifecycle.js 中维护。
import { notifyCommandLifecycle } from '../utils/commandLifecycle.js'
// 复用 normalizeControlMessageKeys 工具函数，把通用处理留在 ../utils/controlMessageCompat.js 中维护。
import { normalizeControlMessageKeys } from '../utils/controlMessageCompat.js'
// 复用 executePermissionRequestHooks 工具函数，把通用处理留在 ../utils/hooks.js 中维护。
import { executePermissionRequestHooks } from '../utils/hooks.js'
// 整理这一组导入，让structured IO后续逻辑可以直接复用这些外部能力。
import {
  applyPermissionUpdates,
  persistPermissionUpdates,
} from '../utils/permissions/PermissionUpdate.js'
// 整理这一组导入，让structured IO后续逻辑可以直接复用这些外部能力。
import {
  notifySessionStateChanged,
  type RequiresActionDetails,
  type SessionExternalMetadata,
} from '../utils/sessionState.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse } from '../utils/slowOperations.js'
// 复用 Stream 工具函数，把通用处理留在 ../utils/stream.js 中维护。
import { Stream } from '../utils/stream.js'
// 引入 ndjsonSafeStringify，将 ./ndjsonSafeStringify.js 中已经封装好的能力接到本文件流程里。
import { ndjsonSafeStringify } from './ndjsonSafeStringify.js'

/**
 * Synthetic tool name used when forwarding sandbox network permission
 * requests via the can_use_tool control_request protocol. SDK hosts
 * see this as a normal tool permission prompt.
 */
// SANDBOX_NETWORK_ACCESS_TOOL_NAME固定为 `'SandboxNetworkAccess'`，作为structured IO后续展示或比较的基准。
export const SANDBOX_NETWORK_ACCESS_TOOL_NAME = 'SandboxNetworkAccess'

// serializeDecisionReason 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function serializeDecisionReason(
  reason: PermissionDecisionReason | undefined,
): string | undefined {
  // reason缺失时提前走兜底路径，避免structured IO继续依赖无效输入。
  if (!reason) {
    // 返回 `undefined`，作为structured IO这次计算的结果。
    return undefined
  }

  // structured IO在这里进入条件判断，后续代码按实际状态分流。
  if (
    (feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) &&
    reason.type === 'classifier'
  ) {
    // 返回 `reason.reason`，作为structured IO这次计算的结果。
    return reason.reason
  }
  // 按照 reason.type 的取值选择structured IO的具体处理分支。
  switch (reason.type) {
    case 'rule':
    case 'mode':
    case 'subcommandResults':
    case 'permissionPromptTool':
      // 返回 `undefined`，作为structured IO这次计算的结果。
      return undefined
    case 'hook':
    case 'asyncAgent':
    case 'sandboxOverride':
    case 'workingDir':
    case 'safetyCheck':
    case 'other':
      // 返回 `reason.reason`，作为structured IO这次计算的结果。
      return reason.reason
  }
}

// buildRequiresActionDetails 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildRequiresActionDetails(
  tool: Tool,
  input: Record<string, unknown>,
  toolUseID: string,
  requestId: string,
): RequiresActionDetails {
  // Per-tool summary methods may throw on malformed input; permission
  // handling must not break because of a bad description.
  // description 先占位，稍后的条件分支会根据实际输入补齐它。
  let description: string
  // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
  try {
    // structured IO在这里处理 `description =`，完成这一小步状态转换。
    description =
      tool.getActivityDescription?.(input) ??
      tool.getToolUseSummary?.(input) ??
      tool.userFacingName(input)
  } catch {
    // description更新为 `tool.name`，确保CLI后续读取最新状态。
    description = tool.name
  }
  // 返回结构化结果，集中表达structured IO已经整理出的状态。
  return {
    tool_name: tool.name,
    action_description: description,
    tool_use_id: toolUseID,
    request_id: requestId,
    input,
  }
}

// PendingRequest 固化structured IO里传递的数据形状，帮助调用方按同一结构读写字段。
type PendingRequest<T> = {
  // 这个回调绑定到 resolve: (result: T) => void，负责structured IO在该局部场景下的响应。
  resolve: (result: T) => void
  // 这个回调绑定到 reject: (error: unknown) => void，负责structured IO在该局部场景下的响应。
  reject: (error: unknown) => void
  schema?: z.Schema
  request: SDKControlRequest
}

/**
 * Provides a structured way to read and write SDK messages from stdio,
 * capturing the SDK protocol.
 */
// Maximum number of resolved tool_use IDs to track. Once exceeded, the oldest
// entry is evicted. This bounds memory in very long sessions while keeping
// enough history to catch duplicate control_response deliveries.
// MAX_RESOLVED_TOOL_USE_IDS 集合保存`1000`，供后续判断或组装使用。
const MAX_RESOLVED_TOOL_USE_IDS = 1000

// StructuredIO 聚合structured IO相关状态与操作，把同一职责的行为收束到类实例中。
export class StructuredIO {
  readonly structuredInput: AsyncGenerator<StdinMessage | SDKMessage>
  private readonly pendingRequests = new Map<string, PendingRequest<unknown>>()

  // CCR external_metadata read back on worker start; null when the
  // transport doesn't restore. Assigned by RemoteIO.
  restoredWorkerState: Promise<SessionExternalMetadata | null> =
    Promise.resolve(null)

  private inputClosed = false
  // structured IO在这里处理 `private unexpectedResponseCallback?: (`，完成这一小步状态转换。
  private unexpectedResponseCallback?: (
    response: SDKControlResponse,
  ) => Promise<void>

  // Tracks tool_use IDs that have been resolved through the normal permission
  // flow (or aborted by a hook). When a duplicate control_response arrives
  // after the original was already handled, this Set prevents the orphan
  // handler from re-processing it — which would push duplicate assistant
  // messages into mutableMessages and cause a 400 "tool_use ids must be unique"
  // error from the API.
  private readonly resolvedToolUseIds = new Set<string>()
  private prependedLines: string[] = []
  // 这个回调绑定到 private onControlRequestSent?: (request: SDKControlRequest) => void，负责structured IO在该局部场景下的响应。
  private onControlRequestSent?: (request: SDKControlRequest) => void
  // 这个回调绑定到 private onControlRequestResolved?: (requestId: string) => void，负责structured IO在该局部场景下的响应。
  private onControlRequestResolved?: (requestId: string) => void

  // sendRequest() and print.ts both enqueue here; the drain loop is the
  // only writer. Prevents control_request from overtaking queued stream_events.
  readonly outbound = new Stream<StdoutMessage>()

  // 构造函数初始化实例状态，确保structured IO后续方法读取到完整配置。
  constructor(
    private readonly input: AsyncIterable<string>,
    private readonly replayUserMessages?: boolean,
  ) {
    // 更新实例字段 input 为 input，同步structured IO的内部状态。
    this.input = input
    // 更新实例字段 structuredInput 为 this.read()，同步structured IO的内部状态。
    this.structuredInput = this.read()
  }

  /**
   * Records a tool_use ID as resolved so that late/duplicate control_response
   * messages for the same tool are ignored by the orphan handler.
   */
  // structured IO在这里处理 `private trackResolvedToolUseId(request: SDKControlRequest): void {`，完成这一小步状态转换。
  private trackResolvedToolUseId(request: SDKControlRequest): void {
    // 当 `request.request.subtype` 匹配 `'can_use_tool'` 时，structured IO执行对应分支。
    if (request.request.subtype === 'can_use_tool') {
      // this.resolvedToolUseIds.add 结算当前 Promise，唤醒等待这个异步结果的调用方。
      this.resolvedToolUseIds.add(request.request.tool_use_id)
      // 满足 `this.resolvedToolUseIds.size > MAX_RESOLVED_TOOL_` 时，structured IO执行该分支。
      if (this.resolvedToolUseIds.size > MAX_RESOLVED_TOOL_USE_IDS) {
        // Evict the oldest entry (Sets iterate in insertion order)
        // first读取`resolvedToolUseIds.values`，供structured IO后续处理使用。
        const first = this.resolvedToolUseIds.values().next().value
        // `first` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (first !== undefined) {
          // this.resolvedToolUseIds.delete 结算当前 Promise，唤醒等待这个异步结果的调用方。
          this.resolvedToolUseIds.delete(first)
        }
      }
    }
  }

  /** Flush pending internal events. No-op for non-remote IO. Overridden by RemoteIO. */
  // flushInternalEvents 使用 无 完成structured IO里的对应操作。
  flushInternalEvents(): Promise<void> {
    // 返回 `Promise.resolve()`，作为structured IO这次计算的结果。
    return Promise.resolve()
  }

  /** Internal-event queue depth. Overridden by RemoteIO; zero otherwise. */
  // structured IO在这里处理 `get internalEventsPending(): number {`，完成这一小步状态转换。
  get internalEventsPending(): number {
    // 返回 `0`，作为structured IO这次计算的结果。
    return 0
  }

  /**
   * Queue a user turn to be yielded before the next message from this.input.
   * Works before iteration starts and mid-stream — read() re-checks
   * prependedLines between each yielded message.
   */
  // prependUserMessage 使用 content: string 完成structured IO里的对应操作。
  prependUserMessage(content: string): void {
    // prependedLines 集合追加新条目，保持收集顺序与输入顺序一致。
    this.prependedLines.push(
      jsonStringify({
        type: 'user',
        session_id: '',
        message: { role: 'user', content },
        parent_tool_use_id: null,
      } satisfies SDKUserMessage) + '\n',
    )
  }

  // structured IO在这里处理 `private async *read() {`，完成这一小步状态转换。
  private async *read() {
    // 文本内容 命名 `''`，让后续代码直接表达这个值的用途。
    let content = ''

    // Called once before for-await (an empty this.input otherwise skips the
    // loop body entirely), then again per block. prependedLines re-check is
    // inside the while so a prepend pushed between two messages in the SAME
    // block still lands first.
    // splitAndProcess 集合 命名 `async function* (this: StructuredIO) {`，让后续代码直接表达这个值的用途。
    const splitAndProcess = async function* (this: StructuredIO) {
      // 循环处理 ``，让structured IO逐项把同类条目按顺序走完。
      for (;;) {
        // 满足 `this.prependedLines.length > 0` 时，structured IO执行该分支。
        if (this.prependedLines.length > 0) {
          // 文本内容更新为 `this.prependedLines.join('') + content`，确保CLI后续读取最新状态。
          content = this.prependedLines.join('') + content
          // 更新实例字段 prependedLines 为 []，同步structured IO的内部状态。
          this.prependedLines = []
        }
        // newline保存`content.indexOf`，供structured IO后续处理使用。
        const newline = content.indexOf('\n')
        // 满足 `newline === -1` 时，structured IO执行该分支。
        if (newline === -1) break
        // line格式化`content.slice`，供structured IO后续处理使用。
        const line = content.slice(0, newline)
        // 文本内容更新为 `content.slice(newline + 1)`，确保CLI后续读取最新状态。
        content = content.slice(newline + 1)
        // 消息保存`this.processLine`，供structured IO后续处理使用。
        const message = await this.processLine(line)
        // 满足 `message` 时，structured IO执行该分支。
        if (message) {
          // 调用 logForDiagnosticsNoPII，触发structured IO此处需要的副作用。
          logForDiagnosticsNoPII('info', 'cli_stdin_message_parsed', {
            type: message.type,
          })
          // 生成器产出 `message`，把阶段性结果交给上层消费。
          yield message
        }
      }
    }.bind(this)

    // 生成器产出 `yield* splitAndProcess()`，把阶段性结果交给上层消费。
    yield* splitAndProcess()

    // 逐项读取 `this.input` 中的block，按输入顺序推进structured IO。
    for await (const block of this.input) {
      // structured IO在这里处理 `content += block`，完成这一小步状态转换。
      content += block
      // 生成器产出 `yield* splitAndProcess()`，把阶段性结果交给上层消费。
      yield* splitAndProcess()
    }
    // 满足 `content` 时，structured IO执行该分支。
    if (content) {
      // 消息保存`this.processLine`，供structured IO后续处理使用。
      const message = await this.processLine(content)
      // 满足 `message` 时，structured IO执行该分支。
      if (message) {
        // 生成器产出 `message`，把阶段性结果交给上层消费。
        yield message
      }
    }
    // 更新实例字段 inputClosed 为 true，同步structured IO的内部状态。
    this.inputClosed = true
    // 逐项读取 `this.pendingRequests.values()` 中的request 请求数据，按输入顺序推进structured IO。
    for (const request of this.pendingRequests.values()) {
      // Reject all pending requests if the input stream
      // request.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      request.reject(
        new Error('Tool permission stream closed before response received'),
      )
    }
  }

  // getPendingPermissionRequests不依赖额外参数，直接计算structured IO需要的结果。
  getPendingPermissionRequests() {
    // 返回 `Array.from(this.pendingRequests.values())`，作为structured IO这次计算的结果。
    return Array.from(this.pendingRequests.values())
      .map(entry => entry.request)
      .filter(pr => pr.request.subtype === 'can_use_tool')
  }

  // setUnexpectedResponseCallback 写入新的状态值，使structured IO后续读取保持一致。
  setUnexpectedResponseCallback(
    // 这个回调绑定到 callback: (response: SDKControlResponse) => Promise<void>,，负责structured IO在该局部场景下的响应。
    callback: (response: SDKControlResponse) => Promise<void>,
  ): void {
    // 更新实例字段 unexpectedResponseCallback 为 callback，同步structured IO的内部状态。
    this.unexpectedResponseCallback = callback
  }

  /**
   * Inject a control_response message to resolve a pending permission request.
   * Used by the bridge to feed permission responses from claude.ai into the
   * SDK permission flow.
   *
   * Also sends a control_cancel_request to the SDK consumer so its canUseTool
   * callback is aborted via the signal — otherwise the callback hangs.
   */
  // injectControlResponse 使用 response: SDKControlResponse 完成structured IO里的对应操作。
  injectControlResponse(response: SDKControlResponse): void {
    // requestId 请求数据保存`response.response?.request_id`，供structured IO后续判断或输出使用。
    const requestId = response.response?.request_id
    // requestId 请求数据缺失时提前走兜底路径，避免structured IO继续依赖无效输入。
    if (!requestId) return
    // request 请求数据读取`pendingRequests.get`，供structured IO后续处理使用。
    const request = this.pendingRequests.get(requestId)
    // request 请求数据缺失时提前走兜底路径，避免structured IO继续依赖无效输入。
    if (!request) return
    // 调用 this.trackResolvedToolUseId，触发structured IO此处需要的副作用。
    this.trackResolvedToolUseId(request.request)
    // 调用 this.pendingRequests.delete，触发structured IO此处需要的副作用。
    this.pendingRequests.delete(requestId)
    // Cancel the SDK consumer's canUseTool callback — the bridge won.
    // 显式忽略 `this.write({` 的返回值，只保留它触发的副作用。
    void this.write({
      type: 'control_cancel_request',
      request_id: requestId,
    })
    // 当 `response.response.subtype` 匹配 `'error'` 时，structured IO执行对应分支。
    if (response.response.subtype === 'error') {
      // request.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      request.reject(new Error(response.response.error))
    } else {
      // 结果保存`response.response.response`，供后续判断或组装使用。
      const result = response.response.response
      // 满足 `request.schema` 时，structured IO执行该分支。
      if (request.schema) {
        // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
        try {
          // request.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          request.resolve(request.schema.parse(result))
        } catch (error) {
          // request.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
          request.reject(error)
        }
      } else {
        // request.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        request.resolve({})
      }
    }
  }

  /**
   * Register a callback invoked whenever a can_use_tool control_request
   * is written to stdout. Used by the bridge to forward permission
   * requests to claude.ai.
   */
  // setOnControlRequestSent 写入新的状态值，使structured IO后续读取保持一致。
  setOnControlRequestSent(
    // 这个回调绑定到 callback: ((request: SDKControlRequest) => void) | undefined,，负责structured IO在该局部场景下的响应。
    callback: ((request: SDKControlRequest) => void) | undefined,
  ): void {
    // 更新实例字段 onControlRequestSent 为 callback，同步structured IO的内部状态。
    this.onControlRequestSent = callback
  }

  /**
   * Register a callback invoked when a can_use_tool control_response arrives
   * from the SDK consumer (via stdin). Used by the bridge to cancel the
   * stale permission prompt on claude.ai when the SDK consumer wins the race.
   */
  // setOnControlRequestResolved 写入新的状态值，使structured IO后续读取保持一致。
  setOnControlRequestResolved(
    // 这个回调绑定到 callback: ((requestId: string) => void) | undefined,，负责structured IO在该局部场景下的响应。
    callback: ((requestId: string) => void) | undefined,
  ): void {
    // 更新实例字段 onControlRequestResolved 为 callback，同步structured IO的内部状态。
    this.onControlRequestResolved = callback
  }

  // structured IO在这里处理 `private async processLine(`，完成这一小步状态转换。
  private async processLine(
    line: string,
  ): Promise<StdinMessage | SDKMessage | undefined> {
    // Skip empty lines (e.g. from double newlines in piped stdin)
    // line缺失时提前走兜底路径，避免structured IO继续依赖无效输入。
    if (!line) {
      // 返回 `undefined`，作为structured IO这次计算的结果。
      return undefined
    }
    // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
    try {
      // 消息保存`normalizeControlMessageKeys`，供structured IO后续处理使用。
      const message = normalizeControlMessageKeys(jsonParse(line)) as
        | StdinMessage
        | SDKMessage
      // 当 `message.type` 匹配 `'keep_alive'` 时，structured IO执行对应分支。
      if (message.type === 'keep_alive') {
        // Silently ignore keep-alive messages
        // 返回 `undefined`，作为structured IO这次计算的结果。
        return undefined
      }
      // 当 `message.type` 匹配 `'update_environment_variabl...` 时，structured IO执行对应分支。
      if (message.type === 'update_environment_variables') {
        // Apply environment variable updates directly to process.env.
        // Used by bridge session runner for auth token refresh
        // (CLAUDE_CODE_SESSION_ACCESS_TOKEN) which must be readable
        // by the REPL process itself, not just child Bash commands.
        // keys 集合派生`Object.keys`，供structured IO后续处理使用。
        const keys = Object.keys(message.variables)
        // 循环处理 `const [key, value] of Object.entries(message.variables)`，让structured IO把同类条目按顺序走完。
        for (const [key, value] of Object.entries(message.variables)) {
          // env[key更新为 `value`，确保structured IO后续读取最新状态。
          process.env[key] = value
        }
        // 记录structured IO运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[structuredIO] applied update_environment_variables: ${keys.join(', ')}`,
        )
        // 返回 `undefined`，作为structured IO这次计算的结果。
        return undefined
      }
      // 当 `message.type` 匹配 `'control_response'` 时，structured IO执行对应分支。
      if (message.type === 'control_response') {
        // Close lifecycle for every control_response, including duplicates
        // and orphans — orphans don't yield to print.ts's main loop, so this
        // is the only path that sees them. uuid is server-injected into the
        // payload.
        // uuid 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const uuid =
          'uuid' in message && typeof message.uuid === 'string'
            ? message.uuid
            : undefined
        // 满足 `uuid` 时，structured IO执行该分支。
        if (uuid) {
          // 调用 notifyCommandLifecycle，触发structured IO此处需要的副作用。
          notifyCommandLifecycle(uuid, 'completed')
        }
        // request 请求数据读取`pendingRequests.get`，供structured IO后续处理使用。
        const request = this.pendingRequests.get(message.response.request_id)
        // request 请求数据缺失时提前走兜底路径，避免structured IO继续依赖无效输入。
        if (!request) {
          // Check if this tool_use was already resolved through the normal
          // permission flow. Duplicate control_response deliveries (e.g. from
          // WebSocket reconnects) arrive after the original was handled, and
          // re-processing them would push duplicate assistant messages into
          // the conversation, causing API 400 errors.
          // responsePayload 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const responsePayload =
            message.response.subtype === 'success'
              ? message.response.response
              : undefined
          // toolUseID读取`responsePayload?.toolUseID` 整理出中间结果，供structured IO后续步骤使用。
          const toolUseID = responsePayload?.toolUseID
          // structured IO在这里进入条件判断，后续代码按实际状态分流。
          if (
            typeof toolUseID === 'string' &&
            this.resolvedToolUseIds.has(toolUseID)
          ) {
            // 记录structured IO运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Ignoring duplicate control_response for already-resolved toolUseID=${toolUseID} request_id=${message.response.request_id}`,
            )
            // 返回 `undefined`，作为structured IO这次计算的结果。
            return undefined
          }
          // 满足 `this.unexpectedResponseCallback` 时，structured IO执行该分支。
          if (this.unexpectedResponseCallback) {
            // 等待 `this.unexpectedResponseCallback(message)` 完成，再继续structured IO的异步流程。
            await this.unexpectedResponseCallback(message)
          }
          // 返回 `undefined // Ignore responses for requests we don't know about`，作为structured IO这次计算的结果。
          return undefined // Ignore responses for requests we don't know about
        }
        // 调用 this.trackResolvedToolUseId，触发structured IO此处需要的副作用。
        this.trackResolvedToolUseId(request.request)
        // 调用 this.pendingRequests.delete，触发structured IO此处需要的副作用。
        this.pendingRequests.delete(message.response.request_id)
        // Notify the bridge when the SDK consumer resolves a can_use_tool
        // request, so it can cancel the stale permission prompt on claude.ai.
        // structured IO在这里进入条件判断，后续代码按实际状态分流。
        if (
          request.request.request.subtype === 'can_use_tool' &&
          this.onControlRequestResolved
        ) {
          // 调用 this.onControlRequestResolved，触发structured IO此处需要的副作用。
          this.onControlRequestResolved(message.response.request_id)
        }

        // 当 `message.response.subtype` 匹配 `'error'` 时，structured IO执行对应分支。
        if (message.response.subtype === 'error') {
          // request.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
          request.reject(new Error(message.response.error))
          // 返回 `undefined`，作为structured IO这次计算的结果。
          return undefined
        }
        // 结果保存`message.response.response`，供structured IO后续判断或输出使用。
        const result = message.response.response
        // 满足 `request.schema` 时，structured IO执行该分支。
        if (request.schema) {
          // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
          try {
            // request.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            request.resolve(request.schema.parse(result))
          } catch (error) {
            // request.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
            request.reject(error)
          }
        } else {
          // request.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          request.resolve({})
        }
        // Propagate control responses when replay is enabled
        // 满足 `this.replayUserMessages` 时，structured IO执行该分支。
        if (this.replayUserMessages) {
          // 返回 `message`，作为structured IO这次计算的结果。
          return message
        }
        // 返回 `undefined`，作为structured IO这次计算的结果。
        return undefined
      }
      // structured IO在这里进入条件判断，后续代码按实际状态分流。
      if (
        message.type !== 'user' &&
        message.type !== 'control_request' &&
        message.type !== 'assistant' &&
        message.type !== 'system'
      ) {
        // 记录structured IO运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Ignoring unknown message type: ${message.type}`, {
          level: 'warn',
        })
        // 返回 `undefined`，作为structured IO这次计算的结果。
        return undefined
      }
      // 当 `message.type` 匹配 `'control_request'` 时，structured IO执行对应分支。
      if (message.type === 'control_request') {
        // message.request 消息数据缺失时提前走兜底路径，避免structured IO继续依赖无效输入。
        if (!message.request) {
          // 调用 exitWithMessage，触发structured IO此处需要的副作用。
          exitWithMessage(`Error: Missing request on control_request`)
        }
        // 返回 `message`，作为structured IO这次计算的结果。
        return message
      }
      // 组合条件 `message.type === 'assistant' || message.type ===` 成立时，structured IO才启用这条专门路径。
      if (message.type === 'assistant' || message.type === 'system') {
        // 返回 `message`，作为structured IO这次计算的结果。
        return message
      }
      // `message.message.role` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
      if (message.message.role !== 'user') {
        // 调用 exitWithMessage，触发structured IO此处需要的副作用。
        exitWithMessage(
          `Error: Expected message role 'user', got '${message.message.role}'`,
        )
      }
      // 返回 `message`，作为structured IO这次计算的结果。
      return message
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.error，触发structured IO此处需要的副作用。
      console.error(`Error parsing streaming input line: ${line}: ${error}`)
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发structured IO此处需要的副作用。
      process.exit(1)
    }
  }

  // write 使用 message: StdoutMessage 完成structured IO里的对应操作。
  async write(message: StdoutMessage): Promise<void> {
    // 调用 writeToStdout，触发structured IO此处需要的副作用。
    writeToStdout(ndjsonSafeStringify(message) + '\n')
  }

  private async sendRequest<Response>(
    request: SDKControlRequest['request'],
    schema: z.Schema,
    signal?: AbortSignal,
    requestId: string = randomUUID(),
  ): Promise<Response> {
    // 消息 集中保存structured IO要一起传递的字段。
    const message: SDKControlRequest = {
      type: 'control_request',
      request_id: requestId,
      request,
    }
    // 满足 `this.inputClosed` 时，structured IO执行该分支。
    if (this.inputClosed) {
      // 抛出 new Error('Stream closed')，阻止structured IO在无效状态下继续运行。
      throw new Error('Stream closed')
    }
    // 满足 `signal?.aborted` 时，structured IO执行该分支。
    if (signal?.aborted) {
      // 抛出 new Error('Request aborted')，阻止structured IO在无效状态下继续运行。
      throw new Error('Request aborted')
    }
    // 调用 this.outbound.enqueue，触发structured IO此处需要的副作用。
    this.outbound.enqueue(message)
    // 组合条件 `request.subtype === 'can_use_tool' && this.onCont` 成立时，structured IO才启用这条专门路径。
    if (request.subtype === 'can_use_tool' && this.onControlRequestSent) {
      // 调用 this.onControlRequestSent，触发structured IO此处需要的副作用。
      this.onControlRequestSent(message)
    }
    // aborted封装成回调，供structured IO在事件触发或异步步骤中调用。
    const aborted = () => {
      // 调用 this.outbound.enqueue，触发structured IO此处需要的副作用。
      this.outbound.enqueue({
        type: 'control_cancel_request',
        request_id: requestId,
      })
      // Immediately reject the outstanding promise, without
      // waiting for the host to acknowledge the cancellation.
      // request 请求数据读取`pendingRequests.get`，供structured IO后续处理使用。
      const request = this.pendingRequests.get(requestId)
      // 满足 `request` 时，structured IO执行该分支。
      if (request) {
        // Track the tool_use ID as resolved before rejecting, so that a
        // late response from the host is ignored by the orphan handler.
        // 调用 this.trackResolvedToolUseId，触发structured IO此处需要的副作用。
        this.trackResolvedToolUseId(request.request)
        // request.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        request.reject(new AbortError())
      }
    }
    // 满足 `signal` 时，structured IO执行该分支。
    if (signal) {
      // 调用 signal.addEventListener，触发structured IO此处需要的副作用。
      signal.addEventListener('abort', aborted, {
        once: true,
      })
    }
    // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `new Promise<Response>((resolve, reject) => {`，调用方直接接收异步结果。
      return await new Promise<Response>((resolve, reject) => {
        // this.pendingRequests.set 写入新的状态值，使structured IO后续读取保持一致。
        this.pendingRequests.set(requestId, {
          request: {
            type: 'control_request',
            request_id: requestId,
            request,
          },
          // 这个回调绑定到 resolve: result => {，负责structured IO在该局部场景下的响应。
          resolve: result => {
            // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolve(result as Response)
          },
          reject,
          schema,
        })
      })
    } finally {
      // 满足 `signal` 时，structured IO执行该分支。
      if (signal) {
        // 调用 signal.removeEventListener，触发structured IO此处需要的副作用。
        signal.removeEventListener('abort', aborted)
      }
      // 调用 this.pendingRequests.delete，触发structured IO此处需要的副作用。
      this.pendingRequests.delete(requestId)
    }
  }

  // 调用 createCanUseTool，触发structured IO此处需要的副作用。
  createCanUseTool(
    // 这个回调绑定到 onPermissionPrompt?: (details: RequiresActionDetails) => void,，负责structured IO在该局部场景下的响应。
    onPermissionPrompt?: (details: RequiresActionDetails) => void,
  ): CanUseToolFn {
    // 返回 `async (`，作为structured IO这次计算的结果。
    return async (
      tool: Tool,
      input: { [key: string]: unknown },
      toolUseContext: ToolUseContext,
      assistantMessage: AssistantMessage,
      toolUseID: string,
      forceDecision?: PermissionDecision,
    ): Promise<PermissionDecision> => {
      // mainPermissionResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const mainPermissionResult =
        forceDecision ??
        (await hasPermissionsToUseTool(
          tool,
          input,
          toolUseContext,
          assistantMessage,
          toolUseID,
        ))
      // If the tool is allowed or denied, return the result
      // structured IO在这里进入条件判断，后续代码按实际状态分流。
      if (
        mainPermissionResult.behavior === 'allow' ||
        mainPermissionResult.behavior === 'deny'
      ) {
        // 返回 `mainPermissionResult`，作为structured IO这次计算的结果。
        return mainPermissionResult
      }

      // Run PermissionRequest hooks in parallel with the SDK permission
      // prompt.  In the terminal CLI, hooks race against the interactive
      // prompt so that e.g. a hook with --delay 20 doesn't block the UI.
      // We need the same behavior here: the SDK host (VS Code, etc.) shows
      // its permission dialog immediately while hooks run in the background.
      // Whichever resolves first wins; the loser is cancelled/ignored.

      // AbortController used to cancel the SDK request if a hook decides first
      // hookAbortController保存`AbortController`，供structured IO后续处理使用。
      const hookAbortController = new AbortController()
      // parentSignal保存`toolUseContext.abortController.signal`，供structured IO后续判断或输出使用。
      const parentSignal = toolUseContext.abortController.signal
      // Forward parent abort to our local controller
      // onParentAbort保存`hookAbortController.abort`，供structured IO后续处理使用。
      const onParentAbort = () => hookAbortController.abort()
      // 调用 parentSignal.addEventListener，触发structured IO此处需要的副作用。
      parentSignal.addEventListener('abort', onParentAbort, { once: true })

      // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
      try {
        // Start the hook evaluation (runs in background)
        // hookPromise 异步任务保存 `executePermissionRequestHooksForSDK` 启动的异步任务，稍后再决定等待还是后台完成。
        const hookPromise = executePermissionRequestHooksForSDK(
          tool.name,
          toolUseID,
          input,
          toolUseContext,
          mainPermissionResult.suggestions,
        // 这个回调绑定到 ).then(decision => ({ source: 'hook' as const, decision }))，负责structured IO在该局部场景下的响应。
        ).then(decision => ({ source: 'hook' as const, decision }))

        // Start the SDK permission prompt immediately (don't wait for hooks)
        // requestId 请求数据保存`randomUUID`，供structured IO后续处理使用。
        const requestId = randomUUID()
        // structured IO在这里处理 `onPermissionPrompt?.(`，完成这一小步状态转换。
        onPermissionPrompt?.(
          buildRequiresActionDetails(tool, input, toolUseID, requestId),
        )
        // sdkPromise 异步任务保存`this.sendRequest<PermissionToolOutput>(`，供后续判断或组装使用。
        const sdkPromise = this.sendRequest<PermissionToolOutput>(
          {
            subtype: 'can_use_tool',
            tool_name: tool.name,
            input,
            permission_suggestions: mainPermissionResult.suggestions,
            blocked_path: mainPermissionResult.blockedPath,
            decision_reason: serializeDecisionReason(
              mainPermissionResult.decisionReason,
            ),
            tool_use_id: toolUseID,
            agent_id: toolUseContext.agentId,
          },
          permissionToolOutputSchema(),
          hookAbortController.signal,
          requestId,
        // 这个回调绑定到 ).then(result => ({ source: 'sdk' as const, result }))，负责structured IO在该局部场景下的响应。
        ).then(result => ({ source: 'sdk' as const, result }))

        // Race: hook completion vs SDK prompt response.
        // The hook promise always resolves (never rejects), returning
        // undefined if no hook made a decision.
        // winner保存`Promise.race`，供structured IO后续处理使用。
        const winner = await Promise.race([hookPromise, sdkPromise])

        // 当 `winner.source` 匹配 `'hook'` 时，structured IO执行对应分支。
        if (winner.source === 'hook') {
          // 满足 `winner.decision` 时，structured IO执行该分支。
          if (winner.decision) {
            // Hook decided — abort the pending SDK request.
            // Suppress the expected AbortError rejection from sdkPromise.
            // 调用 sdkPromise.catch，触发structured IO此处需要的副作用。
            sdkPromise.catch(() => {})
            // 触发取消信号，通知structured IO中仍在等待的异步任务尽快停止。
            hookAbortController.abort()
            // 返回 `winner.decision`，作为structured IO这次计算的结果。
            return winner.decision
          }
          // Hook passed through (no decision) — wait for the SDK prompt
          // sdkResult 等待 `sdkPromise`，确保继续执行前已有结果。
          const sdkResult = await sdkPromise
          // 返回 `permissionPromptToolResultToPermissionDecision(`，作为structured IO这次计算的结果。
          return permissionPromptToolResultToPermissionDecision(
            sdkResult.result,
            tool,
            input,
            toolUseContext,
          )
        }

        // SDK prompt responded first — use its result (hook still running
        // in background but its result will be ignored)
        // 返回 `permissionPromptToolResultToPermissionDecision(`，作为structured IO这次计算的结果。
        return permissionPromptToolResultToPermissionDecision(
          winner.result,
          tool,
          input,
          toolUseContext,
        )
      } catch (error) {
        // 返回 `permissionPromptToolResultToPermissionDecision(`，作为structured IO这次计算的结果。
        return permissionPromptToolResultToPermissionDecision(
          {
            behavior: 'deny',
            message: `Tool permission request failed: ${error}`,
            toolUseID,
          },
          tool,
          input,
          toolUseContext,
        )
      } finally {
        // Only transition back to 'running' if no other permission prompts
        // are pending (concurrent tool execution can have multiple in-flight).
        // this.getPendingPermissionReques... 权限数据为空时立即返回或跳过，避免structured IO把空集合当成可处理内容。
        if (this.getPendingPermissionRequests().length === 0) {
          // 调用 notifySessionStateChanged，触发structured IO此处需要的副作用。
          notifySessionStateChanged('running')
        }
        // 调用 parentSignal.removeEventListener，触发structured IO此处需要的副作用。
        parentSignal.removeEventListener('abort', onParentAbort)
      }
    }
  }

  // createHookCallback 使用 callbackId: string, timeout?: number 完成structured IO里的对应操作。
  createHookCallback(callbackId: string, timeout?: number): HookCallback {
    // 返回结构化结果，集中表达structured IO已经整理出的状态。
    return {
      type: 'callback',
      timeout,
      callback: async (
        input: HookInput,
        toolUseID: string | null,
        abort: AbortSignal | undefined,
      ): Promise<HookJSONOutput> => {
        // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
        try {
          // 结果 等待 `this.sendRequest<HookJSONOutput>(`，确保继续执行前已有结果。
          const result = await this.sendRequest<HookJSONOutput>(
            {
              subtype: 'hook_callback',
              callback_id: callbackId,
              input,
              tool_use_id: toolUseID || undefined,
            },
            hookJSONOutputSchema(),
            abort,
          )
          // 返回 `result`，作为structured IO这次计算的结果。
          return result
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole:: intentional console output
          // 调用 console.error，触发structured IO此处需要的副作用。
          console.error(`Error in hook callback ${callbackId}:`, error)
          // 返回结构化结果，集中表达structured IO已经整理出的状态。
          return {}
        }
      },
    }
  }

  /**
   * Sends an elicitation request to the SDK consumer and returns the response.
   */
  // structured IO在这里处理 `async handleElicitation(`，完成这一小步状态转换。
  async handleElicitation(
    serverName: string,
    message: string,
    requestedSchema?: Record<string, unknown>,
    signal?: AbortSignal,
    mode?: 'form' | 'url',
    url?: string,
    elicitationId?: string,
  ): Promise<ElicitResult> {
    // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
    try {
      // 结果 等待 `this.sendRequest<ElicitResult>(`，确保继续执行前已有结果。
      const result = await this.sendRequest<ElicitResult>(
        {
          subtype: 'elicitation',
          mcp_server_name: serverName,
          message,
          mode,
          url,
          elicitation_id: elicitationId,
          requested_schema: requestedSchema,
        },
        SDKControlElicitationResponseSchema(),
        signal,
      )
      // 返回 `result`，作为structured IO这次计算的结果。
      return result
    } catch {
      // 返回结构化结果，集中表达structured IO已经整理出的状态。
      return { action: 'cancel' as const }
    }
  }

  /**
   * Creates a SandboxAskCallback that forwards sandbox network permission
   * requests to the SDK host as can_use_tool control_requests.
   *
   * This piggybacks on the existing can_use_tool protocol with a synthetic
   * tool name so that SDK hosts (VS Code, CCR, etc.) can prompt the user
   * for network access without requiring a new protocol subtype.
   */
  // createSandboxAskCallback 使用 无 完成structured IO里的对应操作。
  createSandboxAskCallback(): (hostPattern: {
    host: string
    port?: number
  }) => Promise<boolean> {
    // 返回 `async (hostPattern): Promise<boolean> => {`，作为structured IO这次计算的结果。
    return async (hostPattern): Promise<boolean> => {
      // 保护这一段可能失败的structured IO操作，确保异常能进入相邻错误处理。
      try {
        // 结果 等待 `this.sendRequest<PermissionToolOutput>(`，确保继续执行前已有结果。
        const result = await this.sendRequest<PermissionToolOutput>(
          {
            subtype: 'can_use_tool',
            tool_name: SANDBOX_NETWORK_ACCESS_TOOL_NAME,
            input: { host: hostPattern.host },
            tool_use_id: randomUUID(),
            description: `Allow network connection to ${hostPattern.host}?`,
          },
          permissionToolOutputSchema(),
        )
        // 返回 `result.behavior === 'allow'`，作为structured IO这次计算的结果。
        return result.behavior === 'allow'
      } catch {
        // If the request fails (stream closed, abort, etc.), deny the connection
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }
  }

  /**
   * Sends an MCP message to an SDK server and waits for the response
   */
  // structured IO在这里处理 `async sendMcpMessage(`，完成这一小步状态转换。
  async sendMcpMessage(
    serverName: string,
    message: JSONRPCMessage,
  ): Promise<JSONRPCMessage> {
    // 接口响应 等待 `this.sendRequest<{ mcp_response: JSONRPCMessage }>(`，确保继续执行前已有结果。
    const response = await this.sendRequest<{ mcp_response: JSONRPCMessage }>(
      {
        subtype: 'mcp_message',
        server_name: serverName,
        message,
      },
      z.object({
        mcp_response: z.any() as z.Schema<JSONRPCMessage>,
      }),
    )
    // 返回 `response.mcp_response`，作为structured IO这次计算的结果。
    return response.mcp_response
  }
}

// exitWithMessage 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function exitWithMessage(message: string): never {
  // biome-ignore lint/suspicious/noConsole:: intentional console output
  // 调用 console.error，触发structured IO此处需要的副作用。
  console.error(message)
  // eslint-disable-next-line custom-rules/no-process-exit
  // 调用 process.exit，触发structured IO此处需要的副作用。
  process.exit(1)
}

/**
 * Execute PermissionRequest hooks and return a decision if one is made.
 * Returns undefined if no hook made a decision.
 */
// executePermissionRequestHooksForSDK 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function executePermissionRequestHooksForSDK(
  toolName: string,
  toolUseID: string,
  input: Record<string, unknown>,
  toolUseContext: ToolUseContext,
  suggestions: PermissionUpdate[] | undefined,
): Promise<PermissionDecision | undefined> {
  // appState 状态读取`toolUseContext.getAppState`，供structured IO后续处理使用。
  const appState = toolUseContext.getAppState()
  // permissionMode 权限数据 命名 `appState.toolPermissionContext.mode`，让后续代码直接表达这个值的用途。
  const permissionMode = appState.toolPermissionContext.mode

  // Iterate directly over the generator instead of using `all`
  // hookGenerator保存`executePermissionRequestHooks`，供structured IO后续处理使用。
  const hookGenerator = executePermissionRequestHooks(
    toolName,
    toolUseID,
    input,
    toolUseContext,
    permissionMode,
    suggestions,
    toolUseContext.abortController.signal,
  )

  // 逐项读取 `hookGenerator` 中的hookResult，按输入顺序推进structured IO。
  for await (const hookResult of hookGenerator) {
    // structured IO在这里进入条件判断，后续代码按实际状态分流。
    if (
      hookResult.permissionRequestResult &&
      (hookResult.permissionRequestResult.behavior === 'allow' ||
        hookResult.permissionRequestResult.behavior === 'deny')
    ) {
      // decision 命名 `hookResult.permissionRequestResult`，让后续代码直接表达这个值的用途。
      const decision = hookResult.permissionRequestResult
      // 当 `decision.behavior` 匹配 `'allow'` 时，structured IO执行对应分支。
      if (decision.behavior === 'allow') {
        // finalInput标记structured IO是否启用对应路径。
        const finalInput = decision.updatedInput || input

        // Apply permission updates if provided by hook ("always allow")
        // permissionUpdates 权限数据 命名 `decision.updatedPermissions ?? []`，让后续代码直接表达这个值的用途。
        const permissionUpdates = decision.updatedPermissions ?? []
        // 满足 `permissionUpdates.length > 0` 时，structured IO执行该分支。
        if (permissionUpdates.length > 0) {
          // 调用 persistPermissionUpdates，触发structured IO此处需要的副作用。
          persistPermissionUpdates(permissionUpdates)
          // currentAppState 状态读取`toolUseContext.getAppState`，供structured IO后续处理使用。
          const currentAppState = toolUseContext.getAppState()
          // updatedContext保存`applyPermissionUpdates`，供structured IO后续处理使用。
          const updatedContext = applyPermissionUpdates(
            currentAppState.toolPermissionContext,
            permissionUpdates,
          )
          // Update permission context via setAppState
          // toolUseContext.setAppState 写入新的状态值，使structured IO后续读取保持一致。
          toolUseContext.setAppState(prev => {
            // 满足 `prev.toolPermissionContext === updatedContext` 时，structured IO执行该分支。
            if (prev.toolPermissionContext === updatedContext) return prev
            // 返回结构化结果，集中表达structured IO已经整理出的状态。
            return { ...prev, toolPermissionContext: updatedContext }
          })
        }

        // 返回结构化结果，集中表达structured IO已经整理出的状态。
        return {
          behavior: 'allow',
          updatedInput: finalInput,
          userModified: false,
          decisionReason: {
            type: 'hook',
            hookName: 'PermissionRequest',
          },
        }
      } else {
        // Hook denied the permission
        // 返回结构化结果，集中表达structured IO已经整理出的状态。
        return {
          behavior: 'deny',
          message:
            decision.message || 'Permission denied by PermissionRequest hook',
          decisionReason: {
            type: 'hook',
            hookName: 'PermissionRequest',
          },
        }
      }
    }
  }

  // 返回 `undefined`，作为structured IO这次计算的结果。
  return undefined
}
