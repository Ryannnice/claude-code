// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 src/services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from 'src/services/analytics/metadata.js'
// 类型依赖 z 来自 zod/v4，用于校准工具调用的数据契约。
import type z from 'zod/v4'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 类型依赖 { AnyObject, Tool, ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { AnyObject, Tool, ToolUseContext } from '../../Tool.js'
// 类型依赖 { HookProgress } 来自 ../../types/hooks.js，用于校准工具调用的数据契约。
import type { HookProgress } from '../../types/hooks.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  ProgressMessage,
} from '../../types/message.js'
// 类型依赖 { PermissionDecision } 来自 ../../types/permissions.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../types/permissions.js'
// 复用 createAttachmentMessage 工具函数，把通用处理留在 ../../utils/attachments.js 中维护。
import { createAttachmentMessage } from '../../utils/attachments.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  executePostToolHooks,
  executePostToolUseFailureHooks,
  executePreToolHooks,
  getPreToolHookBlockingMessage,
} from '../../utils/hooks.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getRuleBehaviorDescription,
  type PermissionDecisionReason,
  type PermissionResult,
} from '../../utils/permissions/PermissionResult.js'
// 复用 checkRuleBasedPermissions 工具函数，把通用处理留在 ../../utils/permissions/permissions.js 中维护。
import { checkRuleBasedPermissions } from '../../utils/permissions/permissions.js'
// 复用 formatError 工具函数，把通用处理留在 ../../utils/toolErrors.js 中维护。
import { formatError } from '../../utils/toolErrors.js'
// 引入 isMcpTool，将 ../mcp/utils.js 中已经封装好的能力接到本文件流程里。
import { isMcpTool } from '../mcp/utils.js'
// 类型依赖 { McpServerType, MessageUpdateLazy } 来自 ./toolExecution.js，用于校准工具调用的数据契约。
import type { McpServerType, MessageUpdateLazy } from './toolExecution.js'

// PostToolUseHooksResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type PostToolUseHooksResult<Output> =
  | MessageUpdateLazy<AttachmentMessage | ProgressMessage<HookProgress>>
  | { updatedMCPToolOutput: Output }

export async function* runPostToolUseHooks<Input extends AnyObject, Output>(
  toolUseContext: ToolUseContext,
  tool: Tool<Input, Output>,
  toolUseID: string,
  messageId: string,
  toolInput: Record<string, unknown>,
  toolResponse: Output,
  requestId: string | undefined,
  mcpServerType: McpServerType,
  mcpServerBaseUrl: string | undefined,
): AsyncGenerator<PostToolUseHooksResult<Output>> {
  // postToolStartTime记录时间`Date.now`，供工具调用后续处理使用。
  const postToolStartTime = Date.now()
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
    const appState = toolUseContext.getAppState()
    // permissionMode 权限数据保存`appState.toolPermissionContext.mode`，供后续判断或组装使用。
    const permissionMode = appState.toolPermissionContext.mode

    // toolOutput 命名 `toolResponse`，让后续代码直接表达这个值的用途。
    let toolOutput = toolResponse
    // 逐项读取 `executePostToolHooks(` 中的结果，按输入顺序推进工具实现 tool Hooks。
    for await (const result of executePostToolHooks(
      tool.name,
      toolUseID,
      toolInput,
      toolOutput,
      toolUseContext,
      permissionMode,
      toolUseContext.abortController.signal,
    )) {
      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // Check if we were aborted during hook execution
        // IMPORTANT: We emit a cancelled event per hook
        // 工具调用在这里按实际状态进入对应分支。
        if (
          result.message?.type === 'attachment' &&
          result.message.attachment.type === 'hook_cancelled'
        ) {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_post_tool_hooks_cancelled', {
            toolName: sanitizeToolNameForAnalytics(tool.name),

            queryChainId: toolUseContext.queryTracking
              ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            queryDepth: toolUseContext.queryTracking?.depth,
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_cancelled',
              hookName: `PostToolUse:${tool.name}`,
              toolUseID,
              hookEvent: 'PostToolUse',
            }),
          }
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }

        // For JSON {decision:"block"} hooks, executeHooks yields two results:
        // {blockingError} and {message: hook_blocking_error attachment}. The
        // blockingError path below creates that same attachment, so skip it
        // here to avoid displaying the block reason twice (#31301). The
        // exit-code-2 path only yields {blockingError}, so it's unaffected.
        // 工具调用在这里按实际状态进入对应分支。
        if (
          result.message &&
          !(
            result.message.type === 'attachment' &&
            result.message.attachment.type === 'hook_blocking_error'
          )
        ) {
          // 生成器产出 `{ message: result.message }`，把阶段性结果交给上层消费。
          yield { message: result.message }
        }

        // 满足 `result.blockingError` 时，工具调用执行该分支。
        if (result.blockingError) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_blocking_error',
              hookName: `PostToolUse:${tool.name}`,
              toolUseID: toolUseID,
              hookEvent: 'PostToolUse',
              blockingError: result.blockingError,
            }),
          }
        }

        // If hook indicated to prevent continuation, yield a stop reason message
        // 满足 `result.preventContinuation` 时，工具调用执行该分支。
        if (result.preventContinuation) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_stopped_continuation',
              message:
                result.stopReason || 'Execution stopped by PostToolUse hook',
              hookName: `PostToolUse:${tool.name}`,
              toolUseID: toolUseID,
              hookEvent: 'PostToolUse',
            }),
          }
          // 工具实现 tool Hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // If hooks provided additional context, add it as a message
        // 只有 `result.additionalContexts && result.additionalCon` 满足时，工具调用才执行该分支。
        if (result.additionalContexts && result.additionalContexts.length > 0) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_additional_context',
              content: result.additionalContexts,
              hookName: `PostToolUse:${tool.name}`,
              toolUseID: toolUseID,
              hookEvent: 'PostToolUse',
            }),
          }
        }

        // If hooks provided updatedMCPToolOutput, yield it if this is an MCP tool
        // 只有 `result.updatedMCPToolOutput && isMcpTool(tool)` 满足时，工具调用才执行该分支。
        if (result.updatedMCPToolOutput && isMcpTool(tool)) {
          // toolOutput更新为 `result.updatedMCPToolOutput as Output`，确保工具调用后续读取最新状态。
          toolOutput = result.updatedMCPToolOutput as Output
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            updatedMCPToolOutput: toolOutput,
          }
        }
      } catch (error) {
        // postToolDurationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
        const postToolDurationMs = Date.now() - postToolStartTime
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_post_tool_hook_error', {
          messageID:
            messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          toolName: sanitizeToolNameForAnalytics(tool.name),
          isMcp: tool.isMcp ?? false,
          duration: postToolDurationMs,

          queryChainId: toolUseContext.queryTracking
            ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: toolUseContext.queryTracking?.depth,
          ...(mcpServerType
            ? {
                mcpServerType:
                  mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
          ...(requestId
            ? {
                requestId:
                  requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: createAttachmentMessage({
            type: 'hook_error_during_execution',
            content: formatError(error),
            hookName: `PostToolUse:${tool.name}`,
            toolUseID: toolUseID,
            hookEvent: 'PostToolUse',
          }),
        }
      }
    }
  } catch (error) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

// 工具实现 tool Hooks在这里处理 `export async function* runPostToolUseFailureHooks<Input extends AnyObje...`，完成这一小步状态转换。
export async function* runPostToolUseFailureHooks<Input extends AnyObject>(
  toolUseContext: ToolUseContext,
  tool: Tool<Input, unknown>,
  toolUseID: string,
  messageId: string,
  processedInput: z.infer<Input>,
  error: string,
  isInterrupt: boolean | undefined,
  requestId: string | undefined,
  mcpServerType: McpServerType,
  mcpServerBaseUrl: string | undefined,
): AsyncGenerator<
  MessageUpdateLazy<AttachmentMessage | ProgressMessage<HookProgress>>
> {
  // postToolStartTime记录时间`Date.now`，供工具调用后续处理使用。
  const postToolStartTime = Date.now()
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
    const appState = toolUseContext.getAppState()
    // permissionMode 权限数据保存`appState.toolPermissionContext.mode`，供后续判断或组装使用。
    const permissionMode = appState.toolPermissionContext.mode

    // 逐项读取 `executePostToolUseFailureHooks(` 中的结果，按输入顺序推进工具实现 tool Hooks。
    for await (const result of executePostToolUseFailureHooks(
      tool.name,
      toolUseID,
      processedInput,
      error,
      toolUseContext,
      isInterrupt,
      permissionMode,
      toolUseContext.abortController.signal,
    )) {
      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // Check if we were aborted during hook execution
        // 工具调用在这里按实际状态进入对应分支。
        if (
          result.message?.type === 'attachment' &&
          result.message.attachment.type === 'hook_cancelled'
        ) {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_post_tool_failure_hooks_cancelled', {
            toolName: sanitizeToolNameForAnalytics(tool.name),
            queryChainId: toolUseContext.queryTracking
              ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            queryDepth: toolUseContext.queryTracking?.depth,
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_cancelled',
              hookName: `PostToolUseFailure:${tool.name}`,
              toolUseID,
              hookEvent: 'PostToolUseFailure',
            }),
          }
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }

        // Skip hook_blocking_error in result.message — blockingError path
        // below creates the same attachment (see #31301 / PostToolUse above).
        // 工具调用在这里按实际状态进入对应分支。
        if (
          result.message &&
          !(
            result.message.type === 'attachment' &&
            result.message.attachment.type === 'hook_blocking_error'
          )
        ) {
          // 生成器产出 `{ message: result.message }`，把阶段性结果交给上层消费。
          yield { message: result.message }
        }

        // 满足 `result.blockingError` 时，工具调用执行该分支。
        if (result.blockingError) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_blocking_error',
              hookName: `PostToolUseFailure:${tool.name}`,
              toolUseID: toolUseID,
              hookEvent: 'PostToolUseFailure',
              blockingError: result.blockingError,
            }),
          }
        }

        // If hooks provided additional context, add it as a message
        // 只有 `result.additionalContexts && result.additionalCon` 满足时，工具调用才执行该分支。
        if (result.additionalContexts && result.additionalContexts.length > 0) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            message: createAttachmentMessage({
              type: 'hook_additional_context',
              content: result.additionalContexts,
              hookName: `PostToolUseFailure:${tool.name}`,
              toolUseID: toolUseID,
              hookEvent: 'PostToolUseFailure',
            }),
          }
        }
      } catch (hookError) {
        // postToolDurationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
        const postToolDurationMs = Date.now() - postToolStartTime
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_post_tool_failure_hook_error', {
          messageID:
            messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          toolName: sanitizeToolNameForAnalytics(tool.name),
          isMcp: tool.isMcp ?? false,
          duration: postToolDurationMs,
          queryChainId: toolUseContext.queryTracking
            ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: toolUseContext.queryTracking?.depth,
          ...(mcpServerType
            ? {
                mcpServerType:
                  mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
          ...(requestId
            ? {
                requestId:
                  requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: createAttachmentMessage({
            type: 'hook_error_during_execution',
            content: formatError(hookError),
            hookName: `PostToolUseFailure:${tool.name}`,
            toolUseID: toolUseID,
            hookEvent: 'PostToolUseFailure',
          }),
        }
      }
    }
  } catch (outerError) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(outerError)
  }
}

/**
 * Resolve a PreToolUse hook's permission result into a final PermissionDecision.
 *
 * Encapsulates the invariant that hook 'allow' does NOT bypass settings.json
 * deny/ask rules — checkRuleBasedPermissions still applies (inc-4788 analog).
 * Also handles the requiresUserInteraction/requireCanUseTool guards and the
 * 'ask' forceDecision passthrough.
 *
 * Shared by toolExecution.ts (main query loop) and REPLTool/toolWrappers.ts
 * (REPL inner calls) so the permission semantics stay in lockstep.
 */
// resolveHookPermissionDecision 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveHookPermissionDecision(
  hookPermissionResult: PermissionResult | undefined,
  tool: Tool,
  input: Record<string, unknown>,
  toolUseContext: ToolUseContext,
  canUseTool: CanUseToolFn,
  assistantMessage: AssistantMessage,
  toolUseID: string,
): Promise<{
  decision: PermissionDecision
  input: Record<string, unknown>
}> {
  // requiresInteraction 命名 `tool.requiresUserInteraction?.()`，让后续代码直接表达这个值的用途。
  const requiresInteraction = tool.requiresUserInteraction?.()
  // requireCanUseTool保存`toolUseContext.requireCanUseTool`，供后续判断或组装使用。
  const requireCanUseTool = toolUseContext.requireCanUseTool

  // 当 `hookPermissionResult?.behavior` 匹配 `'allow'` 时，工具调用执行对应分支。
  if (hookPermissionResult?.behavior === 'allow') {
    // hookInput 命名 `hookPermissionResult.updatedInput ?? input`，让后续代码直接表达这个值的用途。
    const hookInput = hookPermissionResult.updatedInput ?? input

    // Hook provided updatedInput for an interactive tool — the hook IS the
    // user interaction (e.g. headless wrapper that collected AskUserQuestion
    // answers). Treat as non-interactive for the rule-check path.
    // interactionSatisfied 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const interactionSatisfied =
      requiresInteraction && hookPermissionResult.updatedInput !== undefined

    // 只有 `(requiresInteraction && !interactionSatisfied) || requireCanUseTool` 满足时，工具调用才执行该分支。
    if ((requiresInteraction && !interactionSatisfied) || requireCanUseTool) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook approved tool use for ${tool.name}, but canUseTool is required`,
      )
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        decision: await canUseTool(
          tool,
          hookInput,
          toolUseContext,
          assistantMessage,
          toolUseID,
        ),
        input: hookInput,
      }
    }

    // Hook allow skips the interactive prompt, but deny/ask rules still apply.
    // ruleCheck读取`checkRuleBasedPermissions`，供工具调用后续处理使用。
    const ruleCheck = await checkRuleBasedPermissions(
      tool,
      hookInput,
      toolUseContext,
    )
    // 满足 `ruleCheck === null` 时，工具调用执行该分支。
    if (ruleCheck === null) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        interactionSatisfied
          ? `Hook satisfied user interaction for ${tool.name} via updatedInput`
          : `Hook approved tool use for ${tool.name}, bypassing permission prompt`,
      )
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { decision: hookPermissionResult, input: hookInput }
    }
    // 当 `ruleCheck.behavior` 匹配 `'deny'` 时，工具调用执行对应分支。
    if (ruleCheck.behavior === 'deny') {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hook approved tool use for ${tool.name}, but deny rule overrides: ${ruleCheck.message}`,
      )
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { decision: ruleCheck, input: hookInput }
    }
    // ask rule — dialog required despite hook approval
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hook approved tool use for ${tool.name}, but ask rule requires prompt`,
    )
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      decision: await canUseTool(
        tool,
        hookInput,
        toolUseContext,
        assistantMessage,
        toolUseID,
      ),
      input: hookInput,
    }
  }

  // 当 `hookPermissionResult?.behavior` 匹配 `'deny'` 时，工具调用执行对应分支。
  if (hookPermissionResult?.behavior === 'deny') {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Hook denied tool use for ${tool.name}`)
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { decision: hookPermissionResult, input }
  }

  // No hook decision or 'ask' — normal permission flow, possibly with
  // forceDecision so the dialog shows the hook's ask message.
  // forceDecision 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const forceDecision =
    hookPermissionResult?.behavior === 'ask' ? hookPermissionResult : undefined
  // askInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const askInput =
    hookPermissionResult?.behavior === 'ask' &&
    hookPermissionResult.updatedInput
      ? hookPermissionResult.updatedInput
      : input
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    decision: await canUseTool(
      tool,
      askInput,
      toolUseContext,
      assistantMessage,
      toolUseID,
      forceDecision,
    ),
    input: askInput,
  }
}

// 工具实现 tool Hooks在这里处理 `export async function* runPreToolUseHooks(`，完成这一小步状态转换。
export async function* runPreToolUseHooks(
  toolUseContext: ToolUseContext,
  tool: Tool,
  processedInput: Record<string, unknown>,
  toolUseID: string,
  messageId: string,
  requestId: string | undefined,
  mcpServerType: McpServerType,
  mcpServerBaseUrl: string | undefined,
): AsyncGenerator<
  | {
      type: 'message'
      message: MessageUpdateLazy<
        AttachmentMessage | ProgressMessage<HookProgress>
      >
    }
  | { type: 'hookPermissionResult'; hookPermissionResult: PermissionResult }
  | { type: 'hookUpdatedInput'; updatedInput: Record<string, unknown> }
  | { type: 'preventContinuation'; shouldPreventContinuation: boolean }
  | { type: 'stopReason'; stopReason: string }
  | {
      type: 'additionalContext'
      message: MessageUpdateLazy<AttachmentMessage>
    }
  // stop execution
  | { type: 'stop' }
> {
  // hookStartTime记录时间`Date.now`，供工具调用后续处理使用。
  const hookStartTime = Date.now()
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
    const appState = toolUseContext.getAppState()

    // 逐项读取 `executePreToolHooks(` 中的结果，按输入顺序推进工具实现 tool Hooks。
    for await (const result of executePreToolHooks(
      tool.name,
      toolUseID,
      processedInput,
      toolUseContext,
      appState.toolPermissionContext.mode,
      toolUseContext.abortController.signal,
      undefined, // timeoutMs - use default
      toolUseContext.requestPrompt,
      tool.getToolUseSummary?.(processedInput),
    )) {
      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // 满足 `result.message` 时，工具调用执行该分支。
        if (result.message) {
          // 生成器产出 `{ type: 'message', message: { message: result.message } }`，把阶段性结果交给上层消费。
          yield { type: 'message', message: { message: result.message } }
        }
        // 满足 `result.blockingError` 时，工具调用执行该分支。
        if (result.blockingError) {
          // denialMessage 消息数据读取`getPreToolHookBlockingMessage`，供工具调用后续处理使用。
          const denialMessage = getPreToolHookBlockingMessage(
            `PreToolUse:${tool.name}`,
            result.blockingError,
          )
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'hookPermissionResult',
            hookPermissionResult: {
              behavior: 'deny',
              message: denialMessage,
              decisionReason: {
                type: 'hook',
                hookName: `PreToolUse:${tool.name}`,
                reason: denialMessage,
              },
            },
          }
        }
        // Check if hook wants to prevent continuation
        // 满足 `result.preventContinuation` 时，工具调用执行该分支。
        if (result.preventContinuation) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'preventContinuation',
            shouldPreventContinuation: true,
          }
          // 满足 `result.stopReason` 时，工具调用执行该分支。
          if (result.stopReason) {
            // 生成器产出 `{ type: 'stopReason', stopReason: result.stopReason }`，把阶段性结果交给上层消费。
            yield { type: 'stopReason', stopReason: result.stopReason }
          }
        }
        // Check for hook-defined permission behavior
        // `result.permissionBehavior` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (result.permissionBehavior !== undefined) {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hook result has permissionBehavior=${result.permissionBehavior}`,
          )
          // 决策原因 集中保存工具实现 tool Hooks要一起传递的字段。
          const decisionReason: PermissionDecisionReason = {
            type: 'hook',
            hookName: `PreToolUse:${tool.name}`,
            hookSource: result.hookSource,
            reason: result.hookPermissionDecisionReason,
          }
          // 当 `result.permissionBehavior` 匹配 `'allow'` 时，工具调用执行对应分支。
          if (result.permissionBehavior === 'allow') {
            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'hookPermissionResult',
              hookPermissionResult: {
                behavior: 'allow',
                updatedInput: result.updatedInput,
                decisionReason,
              },
            }
          // 工具实现 tool Hooks在这里处理 `} else if (result.permissionBehavior === 'ask') {`，完成这一小步状态转换。
          } else if (result.permissionBehavior === 'ask') {
            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'hookPermissionResult',
              hookPermissionResult: {
                behavior: 'ask',
                updatedInput: result.updatedInput,
                message:
                  result.hookPermissionDecisionReason ||
                  `Hook PreToolUse:${tool.name} ${getRuleBehaviorDescription(result.permissionBehavior)} this tool`,
                decisionReason,
              },
            }
          } else {
            // deny - updatedInput is irrelevant since tool won't run
            // 生成器产出 `{`，把阶段性结果交给上层消费。
            yield {
              type: 'hookPermissionResult',
              hookPermissionResult: {
                behavior: result.permissionBehavior,
                message:
                  result.hookPermissionDecisionReason ||
                  `Hook PreToolUse:${tool.name} ${getRuleBehaviorDescription(result.permissionBehavior)} this tool`,
                decisionReason,
              },
            }
          }
        }

        // Yield updatedInput for passthrough case (no permission decision)
        // This allows hooks to modify input while letting normal permission flow continue
        // 只有 `result.updatedInput && result.permissionBehavior` 满足时，工具调用才执行该分支。
        if (result.updatedInput && result.permissionBehavior === undefined) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'hookUpdatedInput',
            updatedInput: result.updatedInput,
          }
        }

        // If hooks provided additional context, add it as a message
        // 只有 `result.additionalContexts && result.additionalCon` 满足时，工具调用才执行该分支。
        if (result.additionalContexts && result.additionalContexts.length > 0) {
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'additionalContext',
            message: {
              message: createAttachmentMessage({
                type: 'hook_additional_context',
                content: result.additionalContexts,
                hookName: `PreToolUse:${tool.name}`,
                toolUseID,
                hookEvent: 'PreToolUse',
              }),
            },
          }
        }

        // Check if we were aborted during hook execution
        // 满足 `toolUseContext.abortController.signal.aborted` 时，工具调用执行该分支。
        if (toolUseContext.abortController.signal.aborted) {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_pre_tool_hooks_cancelled', {
            toolName: sanitizeToolNameForAnalytics(tool.name),

            queryChainId: toolUseContext.queryTracking
              ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            queryDepth: toolUseContext.queryTracking?.depth,
          })
          // 生成器产出 `{`，把阶段性结果交给上层消费。
          yield {
            type: 'message',
            message: {
              message: createAttachmentMessage({
                type: 'hook_cancelled',
                hookName: `PreToolUse:${tool.name}`,
                toolUseID,
                hookEvent: 'PreToolUse',
              }),
            },
          }
          // 生成器产出 `{ type: 'stop' }`，把阶段性结果交给上层消费。
          yield { type: 'stop' }
          // 工具实现 tool Hooks在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      } catch (error) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // durationMs 集合记录时间`Date.now`，供工具调用后续处理使用。
        const durationMs = Date.now() - hookStartTime
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_pre_tool_hook_error', {
          messageID:
            messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          toolName: sanitizeToolNameForAnalytics(tool.name),
          isMcp: tool.isMcp ?? false,
          duration: durationMs,

          queryChainId: toolUseContext.queryTracking
            ?.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: toolUseContext.queryTracking?.depth,
          ...(mcpServerType
            ? {
                mcpServerType:
                  mcpServerType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
          ...(requestId
            ? {
                requestId:
                  requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
        })
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          type: 'message',
          message: {
            message: createAttachmentMessage({
              type: 'hook_error_during_execution',
              content: formatError(error),
              hookName: `PreToolUse:${tool.name}`,
              toolUseID: toolUseID,
              hookEvent: 'PreToolUse',
            }),
          },
        }
        // 生成器产出 `{ type: 'stop' }`，把阶段性结果交给上层消费。
        yield { type: 'stop' }
      }
    }
  } catch (error) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 生成器产出 `{ type: 'stop' }`，把阶段性结果交给上层消费。
    yield { type: 'stop' }
    // 工具实现 tool Hooks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
}
