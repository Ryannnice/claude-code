// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准React hook 状态流的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 src/services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from 'src/services/analytics/metadata.js'
// 类型依赖 { ToolUseConfirm } 来自 ../../components/permissions/PermissionRequest.js，用于校准React hook 状态流的数据契约。
import type { ToolUseConfirm } from '../../components/permissions/PermissionRequest.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import type {
  ToolPermissionContext,
  Tool as ToolType,
  ToolUseContext,
} from '../../Tool.js'
// 接入 awaitClassifierAutoApproval 工具实现，后续工具池会按权限和开关决定是否暴露。
import { awaitClassifierAutoApproval } from '../../tools/BashTool/bashPermissions.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 类型依赖 { AssistantMessage } 来自 ../../types/message.js，用于校准React hook 状态流的数据契约。
import type { AssistantMessage } from '../../types/message.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import type {
  PendingClassifierCheck,
  PermissionAllowDecision,
  PermissionDecisionReason,
  PermissionDenyDecision,
} from '../../types/permissions.js'
// 复用 setClassifierApproval 工具函数，把通用处理留在 ../../utils/classifierApprovals.js 中维护。
import { setClassifierApproval } from '../../utils/classifierApprovals.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 executePermissionRequestHooks 工具函数，把通用处理留在 ../../utils/hooks.js 中维护。
import { executePermissionRequestHooks } from '../../utils/hooks.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  REJECT_MESSAGE,
  REJECT_MESSAGE_WITH_REASON_PREFIX,
  SUBAGENT_REJECT_MESSAGE,
  SUBAGENT_REJECT_MESSAGE_WITH_REASON_PREFIX,
  withMemoryCorrectionHint,
} from '../../utils/messages.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准React hook 状态流的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  applyPermissionUpdates,
  persistPermissionUpdates,
  supportsPersistence,
} from '../../utils/permissions/PermissionUpdate.js'
// 类型依赖 { PermissionUpdate } 来自 ../../utils/permissions/PermissionUpdateSchema.js，用于校准React hook 状态流的数据契约。
import type { PermissionUpdate } from '../../utils/permissions/PermissionUpdateSchema.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  logPermissionDecision,
  type PermissionDecisionArgs,
} from './permissionLogging.js'

// PermissionApprovalSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionApprovalSource =
  | { type: 'hook'; permanent?: boolean }
  | { type: 'user'; permanent: boolean }
  | { type: 'classifier' }

// PermissionRejectionSource 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionRejectionSource =
  | { type: 'hook' }
  | { type: 'user_abort' }
  | { type: 'user_reject'; hasFeedback: boolean }

// Generic interface for permission queue operations, decoupled from React.
// In the REPL, these are backed by React state.
// PermissionQueueOps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionQueueOps = {
  push(item: ToolUseConfirm): void
  remove(toolUseID: string): void
  update(toolUseID: string, patch: Partial<ToolUseConfirm>): void
}

// ResolveOnce 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type ResolveOnce<T> = {
  resolve(value: T): void
  isResolved(): boolean
  /**
   * Atomically check-and-mark as resolved. Returns true if this caller
   * won the race (nobody else has resolved yet), false otherwise.
   * Use this in async callbacks BEFORE awaiting, to close the window
   * between the `isResolved()` check and the actual `resolve()` call.
   */
  // claim 使用 无 完成React hook 状态流里的对应操作。
  claim(): boolean
}

// createResolveOnce 封装PermissionContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createResolveOnce<T>(resolve: (value: T) => void): ResolveOnce<T> {
  // claimed标记React hook Permission...是否启用对应路径。
  let claimed = false
  // delivered标记React hook Permission...是否启用对应路径。
  let delivered = false
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    // resolve 使用 value: T 完成React hook 状态流里的对应操作。
    resolve(value: T) {
      // 满足 `delivered` 时，React hook执行该分支。
      if (delivered) return
      // delivered更新为 `true`，确保PermissionContext后续读取最新状态。
      delivered = true
      // claimed更新为 `true`，确保PermissionContext后续读取最新状态。
      claimed = true
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve(value)
    },
    // isResolved 用 无 判断React hook 状态流是否满足条件。
    isResolved() {
      // 返回 `claimed`，作为React hook 状态流这次计算的结果。
      return claimed
    },
    // claim 使用 无 完成React hook 状态流里的对应操作。
    claim() {
      // 满足 `claimed` 时，React hook执行该分支。
      if (claimed) return false
      // claimed更新为 `true`，确保PermissionContext后续读取最新状态。
      claimed = true
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    },
  }
}

// createPermissionContext 封装PermissionContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createPermissionContext(
  tool: ToolType,
  input: Record<string, unknown>,
  toolUseContext: ToolUseContext,
  assistantMessage: AssistantMessage,
  toolUseID: string,
  // 这个回调绑定到 setToolPermissionContext: (context: ToolPermissionContext) => void,，负责React hook 状态流在该局部场景下的响应。
  setToolPermissionContext: (context: ToolPermissionContext) => void,
  queueOps?: PermissionQueueOps,
) {
  // messageId 消息数据 命名 `assistantMessage.message.id`，让后续代码直接表达这个值的用途。
  const messageId = assistantMessage.message.id
  // ctx 集中保存React hook Permission...要一起传递的字段。
  const ctx = {
    tool,
    input,
    toolUseContext,
    assistantMessage,
    messageId,
    toolUseID,
    // 调用 logDecision，触发React hook此处需要的副作用。
    logDecision(
      args: PermissionDecisionArgs,
      opts?: {
        input?: Record<string, unknown>
        permissionPromptStartTimeMs?: number
      },
    ) {
      // 调用 logPermissionDecision，触发React hook此处需要的副作用。
      logPermissionDecision(
        {
          tool,
          input: opts?.input ?? input,
          toolUseContext,
          messageId,
          toolUseID,
        },
        args,
        opts?.permissionPromptStartTimeMs,
      )
    },
    // logCancelled 使用 无 完成React hook 状态流里的对应操作。
    logCancelled() {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tool_use_cancelled', {
        messageID:
          messageId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        toolName: sanitizeToolNameForAnalytics(tool.name),
      })
    },
    // persistPermissions 使用 updates: PermissionUpdate[] 完成React hook 状态流里的对应操作。
    async persistPermissions(updates: PermissionUpdate[]) {
      // updates 集合为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
      if (updates.length === 0) return false
      // 调用 persistPermissionUpdates，触发React hook此处需要的副作用。
      persistPermissionUpdates(updates)
      // appState 状态读取`toolUseContext.getAppState`，供React hook后续处理使用。
      const appState = toolUseContext.getAppState()
      // setToolPermissionContext 写入新的状态值，使React hook 状态流后续读取保持一致。
      setToolPermissionContext(
        applyPermissionUpdates(appState.toolPermissionContext, updates),
      )
      // 返回 `updates.some(update => supportsPersistence(update.destination))`，作为React hook 状态流这次计算的结果。
      return updates.some(update => supportsPersistence(update.destination))
    },
    // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
    resolveIfAborted(resolve: (decision: PermissionDecision) => void) {
      // toolUseContext.abortController.signal.aborted缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!toolUseContext.abortController.signal.aborted) return false
      // 调用 this.logCancelled，触发React hook此处需要的副作用。
      this.logCancelled()
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve(this.cancelAndAbort(undefined, true))
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    },
    // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
    cancelAndAbort(
      feedback?: string,
      isAbort?: boolean,
      contentBlocks?: ContentBlockParam[],
    ): PermissionDecision {
      // sub标记React hook Permission...是否启用对应路径。
      const sub = !!toolUseContext.agentId
      // baseMessage 消息数据保存`feedback`，供React hook Permission...后续判断或输出使用。
      const baseMessage = feedback
        ? `${sub ? SUBAGENT_REJECT_MESSAGE_WITH_REASON_PREFIX : REJECT_MESSAGE_WITH_REASON_PREFIX}${feedback}`
        : sub
          ? SUBAGENT_REJECT_MESSAGE
          : REJECT_MESSAGE
      // 消息保存`withMemoryCorrectionHint`，供React hook后续处理使用。
      const message = sub ? baseMessage : withMemoryCorrectionHint(baseMessage)
      // 组合条件 `isAbort || (!feedback && !contentBlocks?.length && !sub)` 成立时，React hook 状态流才启用这条专门路径。
      if (isAbort || (!feedback && !contentBlocks?.length && !sub)) {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Aborting: tool=${tool.name} isAbort=${isAbort} hasFeedback=${!!feedback} isSubagent=${sub}`,
        )
        // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
        toolUseContext.abortController.abort()
      }
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { behavior: 'ask', message, contentBlocks }
    },
    ...(feature('BASH_CLASSIFIER')
      ? {
          // React hook Permission Context在这里处理 `async tryClassifier(`，完成这一小步状态转换。
          async tryClassifier(
            pendingClassifierCheck: PendingClassifierCheck | undefined,
            updatedInput: Record<string, unknown> | undefined,
          ): Promise<PermissionDecision | null> {
            // `tool.name` 与 `BASH_TOOL_NAME || !pendingClass...` 不一致时刷新派生状态，避免使用过期结果。
            if (tool.name !== BASH_TOOL_NAME || !pendingClassifierCheck) {
              // 返回 `null`，作为React hook 状态流这次计算的结果。
              return null
            }
            // classifierDecision保存`awaitClassifierAutoApproval`，供React hook后续处理使用。
            const classifierDecision = await awaitClassifierAutoApproval(
              pendingClassifierCheck,
              toolUseContext.abortController.signal,
              toolUseContext.options.isNonInteractiveSession,
            )
            // classifierDecision缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
            if (!classifierDecision) {
              // 返回 `null`，作为React hook 状态流这次计算的结果。
              return null
            }
            // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
            if (
              feature('TRANSCRIPT_CLASSIFIER') &&
              classifierDecision.type === 'classifier'
            ) {
              // matchedRule匹配`reason.match`，供React hook后续处理使用。
              const matchedRule = classifierDecision.reason.match(
                /^Allowed by prompt rule: "(.+)"$/,
              )?.[1]
              // 满足 `matchedRule` 时，React hook执行该分支。
              if (matchedRule) {
                // setClassifierApproval 写入新的状态值，使React hook 状态流后续读取保持一致。
                setClassifierApproval(toolUseID, matchedRule)
              }
            }
            // 调用 logPermissionDecision，触发React hook此处需要的副作用。
            logPermissionDecision(
              { tool, input, toolUseContext, messageId, toolUseID },
              { decision: 'accept', source: { type: 'classifier' } },
              undefined,
            )
            // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
            return {
              behavior: 'allow' as const,
              updatedInput: updatedInput ?? input,
              userModified: false,
              decisionReason: classifierDecision,
            }
          },
        }
      : {}),
    // React hook Permission Context在这里处理 `async runHooks(`，完成这一小步状态转换。
    async runHooks(
      permissionMode: string | undefined,
      suggestions: PermissionUpdate[] | undefined,
      updatedInput?: Record<string, unknown>,
      permissionPromptStartTimeMs?: number,
    ): Promise<PermissionDecision | null> {
      // 逐项读取 `executePermissionRequestHooks(` 中的hookResult，按输入顺序推进React hook Permission Context。
      for await (const hookResult of executePermissionRequestHooks(
        tool.name,
        toolUseID,
        input,
        toolUseContext,
        permissionMode,
        suggestions,
        toolUseContext.abortController.signal,
      )) {
        // 满足 `hookResult.permissionRequestResult` 时，React hook执行该分支。
        if (hookResult.permissionRequestResult) {
          // decision 命名 `hookResult.permissionRequestResult`，让后续代码直接表达这个值的用途。
          const decision = hookResult.permissionRequestResult
          // 当 `decision.behavior` 匹配 `'allow'` 时，React hook执行对应分支。
          if (decision.behavior === 'allow') {
            // finalInput 命名 `decision.updatedInput ?? updatedInput ?? input`，让后续代码直接表达这个值的用途。
            const finalInput = decision.updatedInput ?? updatedInput ?? input
            // 等待并返回 `this.handleHookAllow(`，调用方直接接收异步结果。
            return await this.handleHookAllow(
              finalInput,
              decision.updatedPermissions ?? [],
              permissionPromptStartTimeMs,
            )
          // React hook Permission Context在这里处理 `} else if (decision.behavior === 'deny') {`，完成这一小步状态转换。
          } else if (decision.behavior === 'deny') {
            // 调用 this.logDecision，触发React hook此处需要的副作用。
            this.logDecision(
              { decision: 'reject', source: { type: 'hook' } },
              { permissionPromptStartTimeMs },
            )
            // 满足 `decision.interrupt` 时，React hook执行该分支。
            if (decision.interrupt) {
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Hook interrupt: tool=${tool.name} hookMessage=${decision.message}`,
              )
              // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
              toolUseContext.abortController.abort()
            }
            // 返回 `this.buildDeny(`，作为React hook 状态流这次计算的结果。
            return this.buildDeny(
              decision.message || 'Permission denied by hook',
              {
                type: 'hook',
                hookName: 'PermissionRequest',
                reason: decision.message,
              },
            )
          }
        }
      }
      // 返回 `null`，作为React hook 状态流这次计算的结果。
      return null
    },
    // 调用 buildAllow，触发React hook此处需要的副作用。
    buildAllow(
      updatedInput: Record<string, unknown>,
      opts?: {
        userModified?: boolean
        decisionReason?: PermissionDecisionReason
        acceptFeedback?: string
        contentBlocks?: ContentBlockParam[]
      },
    ): PermissionAllowDecision {
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        behavior: 'allow' as const,
        updatedInput,
        userModified: opts?.userModified ?? false,
        ...(opts?.decisionReason && { decisionReason: opts.decisionReason }),
        ...(opts?.acceptFeedback && { acceptFeedback: opts.acceptFeedback }),
        ...(opts?.contentBlocks &&
          opts.contentBlocks.length > 0 && {
            contentBlocks: opts.contentBlocks,
          }),
      }
    },
    // 调用 buildDeny，触发React hook此处需要的副作用。
    buildDeny(
      message: string,
      decisionReason: PermissionDecisionReason,
    ): PermissionDenyDecision {
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { behavior: 'deny' as const, message, decisionReason }
    },
    // React hook Permission Context在这里处理 `async handleUserAllow(`，完成这一小步状态转换。
    async handleUserAllow(
      updatedInput: Record<string, unknown>,
      permissionUpdates: PermissionUpdate[],
      feedback?: string,
      permissionPromptStartTimeMs?: number,
      contentBlocks?: ContentBlockParam[],
      decisionReason?: PermissionDecisionReason,
    ): Promise<PermissionAllowDecision> {
      // acceptedPermanentUpdates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const acceptedPermanentUpdates =
        await this.persistPermissions(permissionUpdates)
      // 调用 this.logDecision，触发React hook此处需要的副作用。
      this.logDecision(
        {
          decision: 'accept',
          source: { type: 'user', permanent: acceptedPermanentUpdates },
        },
        { input: updatedInput, permissionPromptStartTimeMs },
      )
      // userModified保存`tool.inputsEquivalent`，供React hook Permission...后续判断或输出使用。
      const userModified = tool.inputsEquivalent
        ? !tool.inputsEquivalent(input, updatedInput)
        : false
      // trimmedFeedback格式化`trim`，供React hook后续处理使用。
      const trimmedFeedback = feedback?.trim()
      // 返回 `this.buildAllow(updatedInput, {`，作为React hook 状态流这次计算的结果。
      return this.buildAllow(updatedInput, {
        userModified,
        decisionReason,
        acceptFeedback: trimmedFeedback || undefined,
        contentBlocks,
      })
    },
    // React hook Permission Context在这里处理 `async handleHookAllow(`，完成这一小步状态转换。
    async handleHookAllow(
      finalInput: Record<string, unknown>,
      permissionUpdates: PermissionUpdate[],
      permissionPromptStartTimeMs?: number,
    ): Promise<PermissionAllowDecision> {
      // acceptedPermanentUpdates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const acceptedPermanentUpdates =
        await this.persistPermissions(permissionUpdates)
      // 调用 this.logDecision，触发React hook此处需要的副作用。
      this.logDecision(
        {
          decision: 'accept',
          source: { type: 'hook', permanent: acceptedPermanentUpdates },
        },
        { input: finalInput, permissionPromptStartTimeMs },
      )
      // 返回 `this.buildAllow(finalInput, {`，作为React hook 状态流这次计算的结果。
      return this.buildAllow(finalInput, {
        decisionReason: { type: 'hook', hookName: 'PermissionRequest' },
      })
    },
    // pushToQueue 使用 item: ToolUseConfirm 完成React hook 状态流里的对应操作。
    pushToQueue(item: ToolUseConfirm) {
      // 调用 queueOps?.push(item)，完成这一处局部操作。
      queueOps?.push(item)
    },
    // removeFromQueue 使用 无 完成React hook 状态流里的对应操作。
    removeFromQueue() {
      // 调用 queueOps?.remove(toolUseID)，完成这一处局部操作。
      queueOps?.remove(toolUseID)
    },
    // updateQueueItem 使用 patch: Partial<ToolUseConfirm> 完成React hook 状态流里的对应操作。
    updateQueueItem(patch: Partial<ToolUseConfirm>) {
      // 调用 queueOps?.update(toolUseID, patch)，完成这一处局部操作。
      queueOps?.update(toolUseID, patch)
    },
  }
  // 返回 `Object.freeze(ctx)`，作为React hook 状态流这次计算的结果。
  return Object.freeze(ctx)
}

// PermissionContext 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionContext = ReturnType<typeof createPermissionContext>

/**
 * Create a PermissionQueueOps backed by a React state setter.
 * This is the bridge between React's `setToolUseConfirmQueue` and the
 * generic queue interface used by PermissionContext.
 */
// createPermissionQueueOps 封装PermissionContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createPermissionQueueOps(
  setToolUseConfirmQueue: React.Dispatch<
    React.SetStateAction<ToolUseConfirm[]>
  >,
): PermissionQueueOps {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    // push 使用 item: ToolUseConfirm 完成React hook 状态流里的对应操作。
    push(item: ToolUseConfirm) {
      // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
      setToolUseConfirmQueue(queue => [...queue, item])
    },
    // remove 使用 toolUseID: string 完成React hook 状态流里的对应操作。
    remove(toolUseID: string) {
      // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
      setToolUseConfirmQueue(queue =>
        queue.filter(item => item.toolUseID !== toolUseID),
      )
    },
    // update 使用 toolUseID: string, patch: Partial<ToolUseConfirm> 完成React hook 状态流里的对应操作。
    update(toolUseID: string, patch: Partial<ToolUseConfirm>) {
      // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
      setToolUseConfirmQueue(queue =>
        queue.map(item =>
          item.toolUseID === toolUseID ? { ...item, ...patch } : item,
        ),
      )
    },
  }
}

// 重新导出这一组成员，让React hook 状态流的公共 API 保持集中入口。
export { createPermissionContext, createPermissionQueueOps, createResolveOnce }
// 导出类型定义，让其他模块沿用React hook Permission Context的数据契约。
export type {
  PermissionContext,
  PermissionApprovalSource,
  PermissionQueueOps,
  PermissionRejectionSource,
  ResolveOnce,
}
