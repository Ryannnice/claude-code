/**
 * In-process teammate runner
 *
 * Wraps runAgent() for in-process teammates, providing:
 * - AsyncLocalStorage-based context isolation via runWithTeammateContext()
 * - Progress tracking and AppState updates
 * - Idle notification to leader when complete
 * - Plan mode approval flow support
 * - Cleanup on completion or abort
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准共享工具的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 引入 getSystemPrompt，将 ../../constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { getSystemPrompt } from '../../constants/prompts.js'
// 引入 TEAMMATE_MESSAGE_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_MESSAGE_TAG } from '../../constants/xml.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准共享工具的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  processMailboxPermissionResponse,
  registerPermissionCallback,
  unregisterPermissionCallback,
} from '../../hooks/useSwarmPermissionPoller.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 getAutoCompactThreshold 服务层能力，把外部通信或共享状态交给 ../../services/compact/autoCompact.js 处理。
import { getAutoCompactThreshold } from '../../services/compact/autoCompact.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  buildPostCompactMessages,
  compactConversation,
  ERROR_MESSAGE_USER_ABORT,
} from '../../services/compact/compact.js'
// 接入 resetMicrocompactState 服务层能力，把外部通信或共享状态交给 ../../services/compact/microCompact.js 处理。
import { resetMicrocompactState } from '../../services/compact/microCompact.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../../state/AppState.js'
// 类型依赖 { Tool, ToolUseContext } 来自 ../../Tool.js，用于校准共享工具的数据契约。
import type { Tool, ToolUseContext } from '../../Tool.js'
// 引入 appendTeammateMessage，将 ../../tasks/InProcessTeammateTask/InProcessTeammateTask.js 中已经封装好的能力接到本文件流程里。
import { appendTeammateMessage } from '../../tasks/InProcessTeammateTask/InProcessTeammateTask.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  InProcessTeammateTaskState,
  TeammateIdentity,
} from '../../tasks/InProcessTeammateTask/types.js'
// 引入 appendCappedMessage，将 ../../tasks/InProcessTeammateTask/types.js 中已经封装好的能力接到本文件流程里。
import { appendCappedMessage } from '../../tasks/InProcessTeammateTask/types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createActivityDescriptionResolver,
  createProgressTracker,
  getProgressUpdate,
  updateProgressFromMessage,
} from '../../tasks/LocalAgentTask/LocalAgentTask.js'
// 类型依赖 { CustomAgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { CustomAgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
// 接入 runAgent 工具实现，后续工具池会按权限和开关决定是否暴露。
import { runAgent } from '../../tools/AgentTool/runAgent.js'
// 接入 awaitClassifierAutoApproval 工具实现，后续工具池会按权限和开关决定是否暴露。
import { awaitClassifierAutoApproval } from '../../tools/BashTool/bashPermissions.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 接入 SEND_MESSAGE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SEND_MESSAGE_TOOL_NAME } from '../../tools/SendMessageTool/constants.js'
// 接入 TASK_CREATE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_CREATE_TOOL_NAME } from '../../tools/TaskCreateTool/constants.js'
// 接入 TASK_GET_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_GET_TOOL_NAME } from '../../tools/TaskGetTool/constants.js'
// 接入 TASK_LIST_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_LIST_TOOL_NAME } from '../../tools/TaskListTool/constants.js'
// 接入 TASK_UPDATE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_UPDATE_TOOL_NAME } from '../../tools/TaskUpdateTool/constants.js'
// 接入 TEAM_CREATE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TEAM_CREATE_TOOL_NAME } from '../../tools/TeamCreateTool/constants.js'
// 接入 TEAM_DELETE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TEAM_DELETE_TOOL_NAME } from '../../tools/TeamDeleteTool/constants.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../../types/message.js'
// 类型依赖 { PermissionDecision } 来自 ../../types/permissions.js，用于校准共享工具的数据契约。
import type { PermissionDecision } from '../../types/permissions.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createAssistantAPIErrorMessage,
  createUserMessage,
} from '../../utils/messages.js'
// 复用 evictTaskOutput 工具函数，把通用处理留在 ../../utils/task/diskOutput.js 中维护。
import { evictTaskOutput } from '../../utils/task/diskOutput.js'
// 复用 evictTerminalTask 工具函数，把通用处理留在 ../../utils/task/framework.js 中维护。
import { evictTerminalTask } from '../../utils/task/framework.js'
// 复用 tokenCountWithEstimation 工具函数，把通用处理留在 ../../utils/tokens.js 中维护。
import { tokenCountWithEstimation } from '../../utils/tokens.js'
// 引入 createAbortController，将 ../abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from '../abortController.js'
// 引入 AgentContext、runWithAgentContext，将 ../agentContext.js 中已经封装好的能力接到本文件流程里。
import { type AgentContext, runWithAgentContext } from '../agentContext.js'
// 引入 count，将 ../array.js 中已经封装好的能力接到本文件流程里。
import { count } from '../array.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 cloneFileStateCache，将 ../fileStateCache.js 中已经封装好的能力接到本文件流程里。
import { cloneFileStateCache } from '../fileStateCache.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  SUBAGENT_REJECT_MESSAGE,
  SUBAGENT_REJECT_MESSAGE_WITH_REASON_PREFIX,
} from '../messages.js'
// 类型依赖 { ModelAlias } 来自 ../model/aliases.js，用于校准共享工具的数据契约。
import type { ModelAlias } from '../model/aliases.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  applyPermissionUpdates,
  persistPermissionUpdates,
} from '../permissions/PermissionUpdate.js'
// 类型依赖 { PermissionUpdate } 来自 ../permissions/PermissionUpdateSchema.js，用于校准共享工具的数据契约。
import type { PermissionUpdate } from '../permissions/PermissionUpdateSchema.js'
// 引入 hasPermissionsToUseTool，将 ../permissions/permissions.js 中已经封装好的能力接到本文件流程里。
import { hasPermissionsToUseTool } from '../permissions/permissions.js'
// 引入 emitTaskTerminatedSdk，将 ../sdkEventQueue.js 中已经封装好的能力接到本文件流程里。
import { emitTaskTerminatedSdk } from '../sdkEventQueue.js'
// 引入 sleep，将 ../sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from '../sleep.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 asSystemPrompt，将 ../systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from '../systemPromptType.js'
// 引入 claimTask、listTasks、Task、updateTask，将 ../tasks.js 中已经封装好的能力接到本文件流程里。
import { claimTask, listTasks, type Task, updateTask } from '../tasks.js'
// 类型依赖 { TeammateContext } 来自 ../teammateContext.js，用于校准共享工具的数据契约。
import type { TeammateContext } from '../teammateContext.js'
// 引入 runWithTeammateContext，将 ../teammateContext.js 中已经封装好的能力接到本文件流程里。
import { runWithTeammateContext } from '../teammateContext.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createIdleNotification,
  getLastPeerDmSummary,
  isPermissionResponse,
  isShutdownRequest,
  markMessageAsReadByIndex,
  readMailbox,
  writeToMailbox,
} from '../teammateMailbox.js'
// 引入 unregisterAgent as unregisterPerfettoAgent，将 ../telemetry/perfettoTracing.js 中已经封装好的能力接到本文件流程里。
import { unregisterAgent as unregisterPerfettoAgent } from '../telemetry/perfettoTracing.js'
// 引入 createContentReplacementState，将 ../toolResultStorage.js 中已经封装好的能力接到本文件流程里。
import { createContentReplacementState } from '../toolResultStorage.js'
// 引入 TEAM_LEAD_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TEAM_LEAD_NAME } from './constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getLeaderSetToolPermissionContext,
  getLeaderToolUseConfirmQueue,
} from './leaderPermissionBridge.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createPermissionRequest,
  sendPermissionRequestViaMailbox,
} from './permissionSync.js'
// 引入 TEAMMATE_SYSTEM_PROMPT_ADDENDUM，将 ./teammatePromptAddendum.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_SYSTEM_PROMPT_ADDENDUM } from './teammatePromptAddendum.js'

// SetAppStateFn 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppStateFn = (updater: (prev: AppState) => AppState) => void

// PERMISSION_POLL_INTERVAL_MS 权限数据保存`500`，供共享工具 in Process Runner后续判断或输出使用。
const PERMISSION_POLL_INTERVAL_MS = 500

/**
 * Creates a canUseTool function for in-process teammates that properly resolves
 * 'ask' permissions via the UI rather than treating them as denials.
 *
 * Always uses the leader's ToolUseConfirm dialog with a worker badge when
 * the bridge is available, giving teammates the same tool-specific UI
 * (BashPermissionRequest, FileEditToolDiff, etc.) as the leader's own tools.
 *
 * Falls back to the mailbox system when the bridge is unavailable:
 * sends a permission request to the leader's inbox, waits for the response
 * in the teammate's own mailbox.
 */
// createInProcessCanUseTool 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createInProcessCanUseTool(
  identity: TeammateIdentity,
  abortController: AbortController,
  onPermissionWaitMs?: (waitMs: number) => void,
): CanUseToolFn {
  // 返回 `async (`，作为共享工具这次计算的结果。
  return async (
    tool,
    input,
    toolUseContext,
    assistantMessage,
    toolUseID,
    forceDecision,
  ) => {
    // result 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const result =
      forceDecision ??
      (await hasPermissionsToUseTool(
        tool,
        input,
        toolUseContext,
        assistantMessage,
        toolUseID,
      ))

    // Pass through allow/deny decisions directly
    // `result.behavior` 与 `'ask'` 不一致时刷新派生状态，避免使用过期结果。
    if (result.behavior !== 'ask') {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }

    // For bash commands, try classifier auto-approval before showing leader dialog.
    // Agents await the classifier result (rather than racing it against user
    // interaction like the main agent).
    // 共享工具在这里按实际状态进入对应分支。
    if (
      feature('BASH_CLASSIFIER') &&
      tool.name === BASH_TOOL_NAME &&
      result.pendingClassifierCheck
    ) {
      // classifierDecision保存`awaitClassifierAutoApproval`，供共享工具后续处理使用。
      const classifierDecision = await awaitClassifierAutoApproval(
        result.pendingClassifierCheck,
        abortController.signal,
        toolUseContext.options.isNonInteractiveSession,
      )
      // 满足 `classifierDecision` 时，共享工具执行该分支。
      if (classifierDecision) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          behavior: 'allow',
          updatedInput: input as Record<string, unknown>,
          decisionReason: classifierDecision,
        }
      }
    }

    // Check if aborted before showing UI
    // 满足 `abortController.signal.aborted` 时，共享工具执行该分支。
    if (abortController.signal.aborted) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { behavior: 'ask', message: SUBAGENT_REJECT_MESSAGE }
    }

    // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
    const appState = toolUseContext.getAppState()

    // description等待`await`，供共享工具后续处理使用。
    const description = await (tool as Tool).description(input as never, {
      isNonInteractiveSession: toolUseContext.options.isNonInteractiveSession,
      toolPermissionContext: appState.toolPermissionContext,
      tools: toolUseContext.options.tools,
    })

    // 满足 `abortController.signal.aborted` 时，共享工具执行该分支。
    if (abortController.signal.aborted) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { behavior: 'ask', message: SUBAGENT_REJECT_MESSAGE }
    }

    // setToolUseConfirmQueue读取`getLeaderToolUseConfirmQueue`，供共享工具后续处理使用。
    const setToolUseConfirmQueue = getLeaderToolUseConfirmQueue()

    // Standard path: use ToolUseConfirm dialog with worker badge
    // 满足 `setToolUseConfirmQueue` 时，共享工具执行该分支。
    if (setToolUseConfirmQueue) {
      // 返回 `new Promise<PermissionDecision>(resolve => {`，作为共享工具这次计算的结果。
      return new Promise<PermissionDecision>(resolve => {
        // decisionMade标记共享工具 in Process Runner是否启用对应路径。
        let decisionMade = false
        // permissionStartMs 权限数据记录时间`Date.now`，供共享工具后续处理使用。
        const permissionStartMs = Date.now()

        // Report permission wait time to the caller so it can be
        // subtracted from the displayed elapsed time.
        // reportPermissionWait 权限数据封装成回调，供共享工具 in Process Runner在事件触发或异步步骤中调用。
        const reportPermissionWait = () => {
          // 调用 onPermissionWaitMs?.(Date.now() - permissionStartMs)，完成这一处局部操作。
          onPermissionWaitMs?.(Date.now() - permissionStartMs)
        }

        // onAbortListener 集合封装成回调，供共享工具 in Process Runner在事件触发或异步步骤中调用。
        const onAbortListener = () => {
          // 满足 `decisionMade` 时，共享工具执行该分支。
          if (decisionMade) return
          // decisionMade更新为 `true`，确保共享工具后续读取最新状态。
          decisionMade = true
          // 调用 reportPermissionWait，触发共享工具此处需要的副作用。
          reportPermissionWait()
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve({ behavior: 'ask', message: SUBAGENT_REJECT_MESSAGE })
          // setToolUseConfirmQueue 写入新的状态值，使共享工具后续读取保持一致。
          setToolUseConfirmQueue(queue =>
            // 调用 queue.filter，触发共享工具此处需要的副作用。
            queue.filter(item => item.toolUseID !== toolUseID),
          )
        }

        // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
        abortController.signal.addEventListener('abort', onAbortListener, {
          once: true,
        })

        // setToolUseConfirmQueue 写入新的状态值，使共享工具后续读取保持一致。
        setToolUseConfirmQueue(queue => [
          ...queue,
          {
            assistantMessage,
            tool: tool as Tool,
            description,
            input,
            toolUseContext,
            toolUseID,
            permissionResult: result,
            permissionPromptStartTimeMs: permissionStartMs,
            workerBadge: identity.color
              ? { name: identity.agentName, color: identity.color }
              : undefined,
            // onUserInteraction 使用 无 完成共享工具里的对应操作。
            onUserInteraction() {
              // No-op for teammates (no classifier auto-approval)
            },
            // onAbort 使用 无 完成共享工具里的对应操作。
            onAbort() {
              // 满足 `decisionMade` 时，共享工具执行该分支。
              if (decisionMade) return
              // decisionMade更新为 `true`，确保共享工具后续读取最新状态。
              decisionMade = true
              // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
              abortController.signal.removeEventListener(
                'abort',
                onAbortListener,
              )
              // 调用 reportPermissionWait，触发共享工具此处需要的副作用。
              reportPermissionWait()
              // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
              resolve({ behavior: 'ask', message: SUBAGENT_REJECT_MESSAGE })
            },
            // 共享工具 in Process Runner在这里处理 `async onAllow(`，完成这一小步状态转换。
            async onAllow(
              updatedInput: Record<string, unknown>,
              permissionUpdates: PermissionUpdate[],
              feedback?: string,
              contentBlocks?: ContentBlockParam[],
            ) {
              // 满足 `decisionMade` 时，共享工具执行该分支。
              if (decisionMade) return
              // decisionMade更新为 `true`，确保共享工具后续读取最新状态。
              decisionMade = true
              // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
              abortController.signal.removeEventListener(
                'abort',
                onAbortListener,
              )
              // 调用 reportPermissionWait，触发共享工具此处需要的副作用。
              reportPermissionWait()
              // 调用 persistPermissionUpdates，触发共享工具此处需要的副作用。
              persistPermissionUpdates(permissionUpdates)
              // Write back permission updates to the leader's shared context
              // 满足 `permissionUpdates.length > 0` 时，共享工具执行该分支。
              if (permissionUpdates.length > 0) {
                // setToolPermissionContext 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
                const setToolPermissionContext =
                  getLeaderSetToolPermissionContext()
                // 满足 `setToolPermissionContext` 时，共享工具执行该分支。
                if (setToolPermissionContext) {
                  // currentAppState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
                  const currentAppState = toolUseContext.getAppState()
                  // updatedContext保存`applyPermissionUpdates`，供共享工具后续处理使用。
                  const updatedContext = applyPermissionUpdates(
                    currentAppState.toolPermissionContext,
                    permissionUpdates,
                  )
                  // Preserve the leader's mode to prevent workers'
                  // transformed 'acceptEdits' context from leaking back
                  // to the coordinator
                  // setToolPermissionContext 写入新的状态值，使共享工具后续读取保持一致。
                  setToolPermissionContext(updatedContext, {
                    preserveMode: true,
                  })
                }
              }
              // trimmedFeedback格式化`trim`，供共享工具后续处理使用。
              const trimmedFeedback = feedback?.trim()
              // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
              resolve({
                behavior: 'allow',
                updatedInput,
                userModified: false,
                acceptFeedback: trimmedFeedback || undefined,
                ...(contentBlocks &&
                  contentBlocks.length > 0 && { contentBlocks }),
              })
            },
            // onReject 使用 feedback?: string, contentBlocks?: ContentBlockPa… 完成共享工具里的对应操作。
            onReject(feedback?: string, contentBlocks?: ContentBlockParam[]) {
              // 满足 `decisionMade` 时，共享工具执行该分支。
              if (decisionMade) return
              // decisionMade更新为 `true`，确保共享工具后续读取最新状态。
              decisionMade = true
              // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
              abortController.signal.removeEventListener(
                'abort',
                onAbortListener,
              )
              // 调用 reportPermissionWait，触发共享工具此处需要的副作用。
              reportPermissionWait()
              // 消息保存`feedback`，供后续判断或组装使用。
              const message = feedback
                ? `${SUBAGENT_REJECT_MESSAGE_WITH_REASON_PREFIX}${feedback}`
                : SUBAGENT_REJECT_MESSAGE
              // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
              resolve({ behavior: 'ask', message, contentBlocks })
            },
            // recheckPermission 使用 无 完成共享工具里的对应操作。
            async recheckPermission() {
              // 满足 `decisionMade` 时，共享工具执行该分支。
              if (decisionMade) return
              // freshResult保存`hasPermissionsToUseTool`，供共享工具后续处理使用。
              const freshResult = await hasPermissionsToUseTool(
                tool,
                input,
                toolUseContext,
                assistantMessage,
                toolUseID,
              )
              // 当 `freshResult.behavior` 匹配 `'allow'` 时，共享工具执行对应分支。
              if (freshResult.behavior === 'allow') {
                // decisionMade更新为 `true`，确保共享工具后续读取最新状态。
                decisionMade = true
                // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
                abortController.signal.removeEventListener(
                  'abort',
                  onAbortListener,
                )
                // 调用 reportPermissionWait，触发共享工具此处需要的副作用。
                reportPermissionWait()
                // setToolUseConfirmQueue 写入新的状态值，使共享工具后续读取保持一致。
                setToolUseConfirmQueue(queue =>
                  // 调用 queue.filter，触发共享工具此处需要的副作用。
                  queue.filter(item => item.toolUseID !== toolUseID),
                )
                // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                resolve({
                  ...freshResult,
                  updatedInput: input,
                  userModified: false,
                })
              }
            },
          },
        ])
      })
    }

    // Fallback: use mailbox system when leader UI queue is unavailable
    // 返回 `new Promise<PermissionDecision>(resolve => {`，作为共享工具这次计算的结果。
    return new Promise<PermissionDecision>(resolve => {
      // request 请求数据构建`createPermissionRequest`，供共享工具后续处理使用。
      const request = createPermissionRequest({
        toolName: (tool as Tool).name,
        toolUseId: toolUseID,
        input,
        description,
        permissionSuggestions: result.suggestions,
        workerId: identity.agentId,
        workerName: identity.agentName,
        workerColor: identity.color,
        teamName: identity.teamName,
      })

      // Register callback to be invoked when the leader responds
      // 调用 registerPermissionCallback，触发共享工具此处需要的副作用。
      registerPermissionCallback({
        requestId: request.id,
        toolUseId: toolUseID,
        // 调用 onAllow，触发共享工具此处需要的副作用。
        onAllow(
          updatedInput: Record<string, unknown> | undefined,
          permissionUpdates: PermissionUpdate[],
          _feedback?: string,
          contentBlocks?: ContentBlockParam[],
        ) {
          // 调用 cleanup，触发共享工具此处需要的副作用。
          cleanup()
          // 调用 persistPermissionUpdates，触发共享工具此处需要的副作用。
          persistPermissionUpdates(permissionUpdates)
          // finalInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const finalInput =
            updatedInput && Object.keys(updatedInput).length > 0
              ? updatedInput
              : input
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve({
            behavior: 'allow',
            updatedInput: finalInput,
            userModified: false,
            ...(contentBlocks && contentBlocks.length > 0 && { contentBlocks }),
          })
        },
        // onReject 使用 feedback?: string, contentBlocks?: ContentBlockPa… 完成共享工具里的对应操作。
        onReject(feedback?: string, contentBlocks?: ContentBlockParam[]) {
          // 调用 cleanup，触发共享工具此处需要的副作用。
          cleanup()
          // 消息保存`feedback`，供后续判断或组装使用。
          const message = feedback
            ? `${SUBAGENT_REJECT_MESSAGE_WITH_REASON_PREFIX}${feedback}`
            : SUBAGENT_REJECT_MESSAGE
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve({ behavior: 'ask', message, contentBlocks })
        },
      })

      // Send request to leader's mailbox
      // 显式忽略 `sendPermissionRequestViaMailbox(request)` 的返回值，只保留它触发的副作用。
      void sendPermissionRequestViaMailbox(request)

      // Poll teammate's mailbox for the response
      // pollInterval保存`setInterval`，供共享工具后续处理使用。
      const pollInterval = setInterval(
        // 调用 async，触发共享工具此处需要的副作用。
        async (abortController, cleanup, resolve, identity, request) => {
          // 满足 `abortController.signal.aborted` 时，共享工具执行该分支。
          if (abortController.signal.aborted) {
            // 调用 cleanup，触发共享工具此处需要的副作用。
            cleanup()
            // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolve({ behavior: 'ask', message: SUBAGENT_REJECT_MESSAGE })
            // 共享工具 in Process Runner在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }

          // allMessages 消息数据读取`readMailbox`，供共享工具后续处理使用。
          const allMessages = await readMailbox(
            identity.agentName,
            identity.teamName,
          )
          // 按索引扫描 `allMessages.length`，需要消费相邻参数时可以精确移动游标。
          for (let i = 0; i < allMessages.length; i++) {
            // 消息读取 `allMessages[i]` 对应条目，后续围绕该成员继续处理。
            const msg = allMessages[i]
            // 只有 `msg && !msg.read` 满足时，共享工具才执行该分支。
            if (msg && !msg.read) {
              // 解析结果保存`isPermissionResponse`，供共享工具后续处理使用。
              const parsed = isPermissionResponse(msg.text)
              // 只有 `parsed && parsed.request_id === request.id` 满足时，共享工具才执行该分支。
              if (parsed && parsed.request_id === request.id) {
                // 等待 `markMessageAsReadByIndex(` 完成，再继续共享工具 in Process Runner的异步流程。
                await markMessageAsReadByIndex(
                  identity.agentName,
                  identity.teamName,
                  i,
                )
                // 当 `parsed.subtype` 匹配 `'success'` 时，共享工具执行对应分支。
                if (parsed.subtype === 'success') {
                  // 调用 processMailboxPermissionResponse，触发共享工具此处需要的副作用。
                  processMailboxPermissionResponse({
                    requestId: parsed.request_id,
                    decision: 'approved',
                    updatedInput: parsed.response?.updated_input,
                    permissionUpdates: parsed.response?.permission_updates,
                  })
                } else {
                  // 调用 processMailboxPermissionResponse，触发共享工具此处需要的副作用。
                  processMailboxPermissionResponse({
                    requestId: parsed.request_id,
                    decision: 'rejected',
                    feedback: parsed.error,
                  })
                }
                // 返回 `// Callback already resolves the promise`，作为共享工具这次计算的结果。
                return // Callback already resolves the promise
              }
            }
          }
        },
        PERMISSION_POLL_INTERVAL_MS,
        abortController,
        cleanup,
        resolve,
        identity,
        request,
      )

      // onAbortListener 集合封装成回调，供共享工具 in Process Runner在事件触发或异步步骤中调用。
      const onAbortListener = () => {
        // 调用 cleanup，触发共享工具此处需要的副作用。
        cleanup()
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve({ behavior: 'ask', message: SUBAGENT_REJECT_MESSAGE })
      }

      // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
      abortController.signal.addEventListener('abort', onAbortListener, {
        once: true,
      })

      // cleanup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
      function cleanup() {
        // 调用 clearInterval，触发共享工具此处需要的副作用。
        clearInterval(pollInterval)
        // 调用 unregisterPermissionCallback，触发共享工具此处需要的副作用。
        unregisterPermissionCallback(request.id)
        // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
        abortController.signal.removeEventListener('abort', onAbortListener)
      }
    })
  }
}

/**
 * Formats a message as <teammate-message> XML for injection into the conversation.
 * This ensures the model sees messages in the same format as tmux teammates.
 */
// formatAsTeammateMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatAsTeammateMessage(
  from: string,
  content: string,
  color?: string,
  summary?: string,
): string {
  // colorAttr保存`color ? ` color="${color}"` : ''`，供共享工具 in Process Runner后续判断或输出使用。
  const colorAttr = color ? ` color="${color}"` : ''
  // summaryAttr保存`summary ? ` summary="${summary}"` : ''`，供后续判断或组装使用。
  const summaryAttr = summary ? ` summary="${summary}"` : ''
  // 返回 ``<${TEAMMATE_MESSAGE_TAG} teammate_id="${from}"${colorAttr}${summaryAtt...`，作为共享工具这次计算的结果。
  return `<${TEAMMATE_MESSAGE_TAG} teammate_id="${from}"${colorAttr}${summaryAttr}>\n${content}\n</${TEAMMATE_MESSAGE_TAG}>`
}

/**
 * Configuration for running an in-process teammate.
 */
// InProcessRunnerConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InProcessRunnerConfig = {
  /** Teammate identity for context */
  identity: TeammateIdentity
  /** Task ID in AppState */
  taskId: string
  /** Initial prompt for the teammate */
  prompt: string
  /** Optional agent definition (for specialized agents) */
  agentDefinition?: CustomAgentDefinition
  /** Teammate context for AsyncLocalStorage */
  teammateContext: TeammateContext
  /** Parent's tool use context */
  toolUseContext: ToolUseContext
  /** Abort controller linked to parent */
  abortController: AbortController
  /** Optional model override for this teammate */
  model?: string
  /** Optional system prompt override for this teammate */
  systemPrompt?: string
  /** How to apply the system prompt: 'replace' or 'append' to default */
  systemPromptMode?: 'default' | 'replace' | 'append'
  /** Tool permissions to auto-allow for this teammate */
  allowedTools?: string[]
  /** Whether this teammate can show permission prompts for unlisted tools.
   * When false (default), unlisted tools are auto-denied. */
  allowPermissionPrompts?: boolean
  /** Short description of the task (used as summary for the initial prompt header) */
  description?: string
  /** request_id of the API call that spawned this teammate, for lineage
   *  tracing on tengu_api_* events. */
  invokingRequestId?: string
}

/**
 * Result from running an in-process teammate.
 */
// InProcessRunnerResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InProcessRunnerResult = {
  /** Whether the run completed successfully */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Messages produced by the agent */
  messages: Message[]
}

/**
 * Updates task state in AppState.
 */
// updateTaskState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function updateTaskState(
  taskId: string,
  // 这个回调绑定到 updater: (task: InProcessTeammateTaskState) => InProcessTeammateTaskState,，负责共享工具在该局部场景下的响应。
  updater: (task: InProcessTeammateTaskState) => InProcessTeammateTaskState,
  setAppState: SetAppStateFn,
): void {
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // task保存`prev.tasks[taskId]`，供共享工具 in Process Runner后续判断或输出使用。
    const task = prev.tasks[taskId]
    // `!task || task.type` 与 `'in_process_teammate'` 不一致时刷新派生状态，避免使用过期结果。
    if (!task || task.type !== 'in_process_teammate') {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }
    // updated保存`updater`，供共享工具后续处理使用。
    const updated = updater(task)
    // 满足 `updated === task` 时，共享工具执行该分支。
    if (updated === task) {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: updated,
      },
    }
  })
}

/**
 * Sends a message to the leader's file-based mailbox.
 * Uses the same mailbox system as tmux teammates for consistency.
 */
// sendMessageToLeader 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function sendMessageToLeader(
  from: string,
  text: string,
  color: string | undefined,
  teamName: string,
): Promise<void> {
  // 等待 `writeToMailbox(` 完成，再继续共享工具 in Process Runner的异步流程。
  await writeToMailbox(
    TEAM_LEAD_NAME,
    {
      from,
      text,
      timestamp: new Date().toISOString(),
      color,
    },
    teamName,
  )
}

/**
 * Sends idle notification to the leader via file-based mailbox.
 * Uses agentName (not agentId) for consistency with process-based teammates.
 */
// sendIdleNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function sendIdleNotification(
  agentName: string,
  agentColor: string | undefined,
  teamName: string,
  options?: {
    idleReason?: 'available' | 'interrupted' | 'failed'
    summary?: string
    completedTaskId?: string
    completedStatus?: 'resolved' | 'blocked' | 'failed'
    failureReason?: string
  },
): Promise<void> {
  // notification构建`createIdleNotification`，供共享工具后续处理使用。
  const notification = createIdleNotification(agentName, options)

  // 等待 `sendMessageToLeader(` 完成，再继续共享工具 in Process Runner的异步流程。
  await sendMessageToLeader(
    agentName,
    jsonStringify(notification),
    agentColor,
    teamName,
  )
}

/**
 * Find an available task from the team's task list.
 * A task is available if it's pending, has no owner, and is not blocked.
 */
// findAvailableTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findAvailableTask(tasks: Task[]): Task | undefined {
  // unresolvedTaskIds 集合保存`Set`，供共享工具后续处理使用。
  const unresolvedTaskIds = new Set(
    tasks.filter(t => t.status !== 'completed').map(t => t.id),
  )

  // 返回 `tasks.find(task => {`，作为共享工具这次计算的结果。
  return tasks.find(task => {
    // `task.status` 与 `'pending'` 不一致时刷新派生状态，避免使用过期结果。
    if (task.status !== 'pending') return false
    // 满足 `task.owner` 时，共享工具执行该分支。
    if (task.owner) return false
    // 返回 `task.blockedBy.every(id => !unresolvedTaskIds.has(id))`，作为共享工具这次计算的结果。
    return task.blockedBy.every(id => !unresolvedTaskIds.has(id))
  })
}

/**
 * Format a task as a prompt for the teammate to work on.
 */
// formatTaskAsPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatTaskAsPrompt(task: Task): string {
  // 提示词 命名 ``Complete all open tasks. Start with task #${task.id}: \n...`，让后续代码直接表达这个值的用途。
  let prompt = `Complete all open tasks. Start with task #${task.id}: \n\n ${task.subject}`

  // 满足 `task.description` 时，共享工具执行该分支。
  if (task.description) {
    // 共享工具 in Process Runner在这里处理 `prompt += `\n\n${task.description}``，完成这一小步状态转换。
    prompt += `\n\n${task.description}`
  }

  // 返回 `prompt`，作为共享工具这次计算的结果。
  return prompt
}

/**
 * Try to claim an available task from the team's task list.
 * Returns the formatted prompt if a task was claimed, or undefined if none available.
 */
// tryClaimNextTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryClaimNextTask(
  taskListId: string,
  agentName: string,
): Promise<string | undefined> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // tasks 集合保存`listTasks`，供共享工具后续处理使用。
    const tasks = await listTasks(taskListId)
    // availableTask筛选`findAvailableTask`，供共享工具后续处理使用。
    const availableTask = findAvailableTask(tasks)

    // availableTask缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!availableTask) {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }

    // 结果保存`claimTask`，供共享工具后续处理使用。
    const result = await claimTask(taskListId, availableTask.id, agentName)

    // result.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result.success) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[inProcessRunner] Failed to claim task #${availableTask.id}: ${result.reason}`,
      )
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }

    // Also set status to in_progress so the UI reflects it immediately
    // 等待 `updateTask(taskListId, availableTask.id, { status: 'in_progress' })` 完成，再继续共享工具 in Process Runner的异步流程。
    await updateTask(taskListId, availableTask.id, { status: 'in_progress' })

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[inProcessRunner] Claimed task #${availableTask.id}: ${availableTask.subject}`,
    )

    // 返回 `formatTaskAsPrompt(availableTask)`，作为共享工具这次计算的结果。
    return formatTaskAsPrompt(availableTask)
  } catch (err) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[inProcessRunner] Error checking task list: ${err}`)
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}

/**
 * Result of waiting for messages.
 */
// WaitResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type WaitResult =
  | {
      type: 'shutdown_request'
      request: ReturnType<typeof isShutdownRequest>
      originalMessage: string
    }
  | {
      type: 'new_message'
      message: string
      from: string
      color?: string
      summary?: string
    }
  | {
      type: 'aborted'
    }

/**
 * Waits for new prompts or shutdown request.
 * Polls the teammate's mailbox every 500ms, checking for:
 * - Shutdown request from leader (returned to caller for model decision)
 * - New messages/prompts from leader
 * - Abort signal
 *
 * This keeps the teammate alive in 'idle' state instead of terminating.
 * Does NOT auto-approve shutdown - the model should make that decision.
 */
// waitForNextPromptOrShutdown 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function waitForNextPromptOrShutdown(
  identity: TeammateIdentity,
  abortController: AbortController,
  taskId: string,
  // 这个回调绑定到 getAppState: () => AppState,，负责共享工具在该局部场景下的响应。
  getAppState: () => AppState,
  setAppState: SetAppStateFn,
  taskListId: string,
): Promise<WaitResult> {
  // POLL_INTERVAL_MS 集合保存`500`，供后续判断或组装使用。
  const POLL_INTERVAL_MS = 500

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[inProcessRunner] ${identity.agentName} starting poll loop (abort=${abortController.signal.aborted})`,
  )

  // pollCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let pollCount = 0
  // while 使用 !abortController.signal.aborted 完成共享工具里的对应操作。
  while (!abortController.signal.aborted) {
    // Check for in-memory pending messages on every iteration (from transcript viewing)
    // appState 状态读取`getAppState`，供共享工具后续处理使用。
    const appState = getAppState()
    // task读取 `appState.tasks[taskId]` 对应条目，后续围绕该成员继续处理。
    const task = appState.tasks[taskId]
    // 共享工具在这里按实际状态进入对应分支。
    if (
      task &&
      task.type === 'in_process_teammate' &&
      task.pendingUserMessages.length > 0
    ) {
      // 消息读取`task.pendingUserMessages[0]! // Safe: checked length > 0` 整理出中间结果，供共享工具 in Process Runner后续步骤使用。
      const message = task.pendingUserMessages[0]! // Safe: checked length > 0
      // Pop the message from the queue
      // setAppState 写入新的状态值，使共享工具后续读取保持一致。
      setAppState(prev => {
        // prevTask读取 `prev.tasks[taskId]` 对应条目，后续围绕该成员继续处理。
        const prevTask = prev.tasks[taskId]
        // `!prevTask || prevTask.type` 与 `'in_process_teamma` 不一致时刷新派生状态，避免使用过期结果。
        if (!prevTask || prevTask.type !== 'in_process_teammate') {
          // 返回 `prev`，作为共享工具这次计算的结果。
          return prev
        }
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          ...prev,
          tasks: {
            ...prev.tasks,
            [taskId]: {
              ...prevTask,
              pendingUserMessages: prevTask.pendingUserMessages.slice(1),
            },
          },
        }
      })
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[inProcessRunner] ${identity.agentName} found pending user message (poll #${pollCount})`,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'new_message',
        message,
        from: 'user',
      }
    }

    // Wait before next poll (skip on first iteration to check immediately)
    // 满足 `pollCount > 0` 时，共享工具执行该分支。
    if (pollCount > 0) {
      // 等待 `sleep(POLL_INTERVAL_MS)` 完成，再继续共享工具 in Process Runner的异步流程。
      await sleep(POLL_INTERVAL_MS)
    }
    // 共享工具 in Process Runner在这里处理 `pollCount++`，完成这一小步状态转换。
    pollCount++

    // Check for abort
    // 满足 `abortController.signal.aborted` 时，共享工具执行该分支。
    if (abortController.signal.aborted) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[inProcessRunner] ${identity.agentName} aborted while waiting (poll #${pollCount})`,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { type: 'aborted' }
    }

    // Check for messages in mailbox
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[inProcessRunner] ${identity.agentName} poll #${pollCount}: checking mailbox`,
    )
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Read all messages and scan unread for shutdown requests first.
      // Shutdown requests are prioritized over regular messages to prevent
      // starvation when peer-to-peer messages flood the queue.
      // allMessages 消息数据读取`readMailbox`，供共享工具后续处理使用。
      const allMessages = await readMailbox(
        identity.agentName,
        identity.teamName,
      )

      // Scan all unread messages for shutdown requests (highest priority).
      // readMailbox() already reads all messages from disk, so this scan
      // adds only ~1-2ms of JSON parsing overhead.
      // shutdownIndex 索引保存`-1`，供后续判断或组装使用。
      let shutdownIndex = -1
      // shutdownParsed 命名 `null`，让后续代码直接表达这个值的用途。
      let shutdownParsed: ReturnType<typeof isShutdownRequest> = null
      // 按索引扫描 `allMessages.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < allMessages.length; i++) {
        // m读取 `allMessages[i]` 对应条目，后续围绕该成员继续处理。
        const m = allMessages[i]
        // 只有 `m && !m.read` 满足时，共享工具才执行该分支。
        if (m && !m.read) {
          // 解析结果保存`isShutdownRequest`，供共享工具后续处理使用。
          const parsed = isShutdownRequest(m.text)
          // 满足 `parsed` 时，共享工具执行该分支。
          if (parsed) {
            // shutdownIndex 索引更新为 `i`，确保共享工具后续读取最新状态。
            shutdownIndex = i
            // shutdownParsed更新为 `parsed`，确保共享工具后续读取最新状态。
            shutdownParsed = parsed
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        }
      }

      // `shutdownIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
      if (shutdownIndex !== -1) {
        // 消息读取 `allMessages[shutdownIndex]!` 对应条目，后续围绕该成员继续处理。
        const msg = allMessages[shutdownIndex]!
        // skippedUnread统计`count`，供共享工具后续处理使用。
        const skippedUnread = count(
          allMessages.slice(0, shutdownIndex),
          // m更新为 `> !m.read`，确保共享工具后续读取最新状态。
          m => !m.read,
        )
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[inProcessRunner] ${identity.agentName} received shutdown request from ${shutdownParsed?.from} (prioritized over ${skippedUnread} unread messages)`,
        )
        // 等待 `markMessageAsReadByIndex(` 完成，再继续共享工具 in Process Runner的异步流程。
        await markMessageAsReadByIndex(
          identity.agentName,
          identity.teamName,
          shutdownIndex,
        )
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          type: 'shutdown_request',
          request: shutdownParsed,
          originalMessage: msg.text,
        }
      }

      // No shutdown request found. Prioritize team-lead messages over peer
      // messages — the leader represents user intent and coordination, so
      // their messages should not be starved behind peer-to-peer chatter.
      // Fall back to FIFO for peer messages.
      // 选中索引 命名 `-1`，让后续代码直接表达这个值的用途。
      let selectedIndex = -1

      // Check for unread team-lead messages first
      // 按索引扫描 `allMessages.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < allMessages.length; i++) {
        // m读取 `allMessages[i]` 对应条目，后续围绕该成员继续处理。
        const m = allMessages[i]
        // 只有 `m && !m.read && m.from === TEAM_LEAD_NAME` 满足时，共享工具才执行该分支。
        if (m && !m.read && m.from === TEAM_LEAD_NAME) {
          // 选中索引更新为 `i`，确保共享工具后续读取最新状态。
          selectedIndex = i
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
      }

      // Fall back to first unread message (any sender)
      // 满足 `selectedIndex === -1` 时，共享工具执行该分支。
      if (selectedIndex === -1) {
        // 选中索引更新为 `allMessages.findIndex(m => !m.read)`，确保共享工具后续读取最新状态。
        selectedIndex = allMessages.findIndex(m => !m.read)
      }

      // `selectedIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
      if (selectedIndex !== -1) {
        // 消息 命名 `allMessages[selectedIndex]`，让后续代码直接表达这个值的用途。
        const msg = allMessages[selectedIndex]
        // 满足 `msg` 时，共享工具执行该分支。
        if (msg) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[inProcessRunner] ${identity.agentName} received new message from ${msg.from} (index ${selectedIndex})`,
          )
          // 等待 `markMessageAsReadByIndex(` 完成，再继续共享工具 in Process Runner的异步流程。
          await markMessageAsReadByIndex(
            identity.agentName,
            identity.teamName,
            selectedIndex,
          )
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            type: 'new_message',
            message: msg.text,
            from: msg.from,
            color: msg.color,
            summary: msg.summary,
          }
        }
      }
    } catch (err) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[inProcessRunner] ${identity.agentName} poll error: ${err}`,
      )
      // Continue polling even if one read fails
    }

    // Check the team's task list for unclaimed tasks
    // taskPrompt保存`tryClaimNextTask`，供共享工具后续处理使用。
    const taskPrompt = await tryClaimNextTask(taskListId, identity.agentName)
    // 满足 `taskPrompt` 时，共享工具执行该分支。
    if (taskPrompt) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'new_message',
        message: taskPrompt,
        from: 'task-list',
      }
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[inProcessRunner] ${identity.agentName} exiting poll loop (abort=${abortController.signal.aborted}, polls=${pollCount})`,
  )
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { type: 'aborted' }
}

/**
 * Runs an in-process teammate with a continuous prompt loop.
 *
 * Executes runAgent() within the teammate's AsyncLocalStorage context,
 * tracks progress, updates task state, sends idle notification on completion,
 * then waits for new prompts or shutdown requests.
 *
 * Unlike background tasks, teammates stay alive and can receive multiple prompts.
 * The loop only exits on abort or after shutdown is approved by the model.
 *
 * @param config - Runner configuration
 * @returns Result with messages and success status
 */
// runInProcessTeammate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runInProcessTeammate(
  config: InProcessRunnerConfig,
): Promise<InProcessRunnerResult> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    identity,
    taskId,
    prompt,
    description,
    agentDefinition,
    teammateContext,
    toolUseContext,
    abortController,
    model,
    systemPrompt,
    systemPromptMode,
    allowedTools,
    allowPermissionPrompts,
    invokingRequestId,
  } = config
  // 从 `toolUseContext` 解构 setAppState，减少共享工具 in Process Runner对同一对象的重复访问。
  const { setAppState } = toolUseContext

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[inProcessRunner] Starting agent loop for ${identity.agentId}`,
  )

  // Create AgentContext for analytics attribution
  // agentContext 集中保存共享工具 in Process Runner要一起传递的字段。
  const agentContext: AgentContext = {
    agentId: identity.agentId,
    parentSessionId: identity.parentSessionId,
    agentName: identity.agentName,
    teamName: identity.teamName,
    agentColor: identity.color,
    planModeRequired: identity.planModeRequired,
    isTeamLead: false,
    agentType: 'teammate',
    invokingRequestId,
    invocationKind: 'spawn',
    invocationEmitted: false,
  }

  // Build system prompt based on systemPromptMode
  // teammateSystemPrompt 先占位，稍后的条件分支会根据实际输入补齐它。
  let teammateSystemPrompt: string
  // 只有 `systemPromptMode === 'replace' && systemPrompt` 满足时，共享工具才执行该分支。
  if (systemPromptMode === 'replace' && systemPrompt) {
    // teammateSystemPrompt更新为 `systemPrompt`，确保共享工具后续读取最新状态。
    teammateSystemPrompt = systemPrompt
  } else {
    // fullSystemPromptParts 集合读取`getSystemPrompt`，供共享工具后续处理使用。
    const fullSystemPromptParts = await getSystemPrompt(
      toolUseContext.options.tools,
      toolUseContext.options.mainLoopModel,
      undefined,
      toolUseContext.options.mcpClients,
    )

    // systemPromptParts 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const systemPromptParts = [
      ...fullSystemPromptParts,
      TEAMMATE_SYSTEM_PROMPT_ADDENDUM,
    ]

    // If custom agent definition provided, append its prompt
    // 满足 `agentDefinition` 时，共享工具执行该分支。
    if (agentDefinition) {
      // customPrompt读取`agentDefinition.getSystemPrompt`，供共享工具后续处理使用。
      const customPrompt = agentDefinition.getSystemPrompt()
      // 满足 `customPrompt` 时，共享工具执行该分支。
      if (customPrompt) {
        // systemPromptParts 集合追加新条目，保持收集顺序与输入顺序一致。
        systemPromptParts.push(`\n# Custom Agent Instructions\n${customPrompt}`)
      }

      // Log agent memory loaded event for in-process teammates
      // 满足 `agentDefinition.memory` 时，共享工具执行该分支。
      if (agentDefinition.memory) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_agent_memory_loaded', {
          ...(process.env.USER_TYPE === 'ant'
            ? {
                agent_type:
                  agentDefinition.agentType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
          scope:
            agentDefinition.memory as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          source:
            'in-process-teammate' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
      }
    }

    // Append mode: add provided system prompt after default
    // 只有 `systemPromptMode === 'append' && systemPrompt` 满足时，共享工具才执行该分支。
    if (systemPromptMode === 'append' && systemPrompt) {
      // systemPromptParts 集合追加新条目，保持收集顺序与输入顺序一致。
      systemPromptParts.push(systemPrompt)
    }

    // teammateSystemPrompt更新为 `systemPromptParts.join('\n')`，确保共享工具后续读取最新状态。
    teammateSystemPrompt = systemPromptParts.join('\n')
  }

  // Resolve agent definition - use full system prompt with teammate addendum
  // IMPORTANT: Set permissionMode to 'default' so teammates always get full tool
  // access regardless of the leader's permission mode.
  // resolvedAgentDefinition 集中保存共享工具 in Process Runner要一起传递的字段。
  const resolvedAgentDefinition: CustomAgentDefinition = {
    agentType: identity.agentName,
    whenToUse: `In-process teammate: ${identity.agentName}`,
    // 这个回调绑定到 getSystemPrompt: () => teammateSystemPrompt,，负责共享工具在该局部场景下的响应。
    getSystemPrompt: () => teammateSystemPrompt,
    // Inject team-essential tools so teammates can always respond to
    // shutdown requests, send messages, and coordinate via the task list,
    // even with explicit tool lists
    tools: agentDefinition?.tools
      ? [
          ...new Set([
            ...agentDefinition.tools,
            SEND_MESSAGE_TOOL_NAME,
            TEAM_CREATE_TOOL_NAME,
            TEAM_DELETE_TOOL_NAME,
            TASK_CREATE_TOOL_NAME,
            TASK_GET_TOOL_NAME,
            TASK_LIST_TOOL_NAME,
            TASK_UPDATE_TOOL_NAME,
          ]),
        ]
      : ['*'],
    source: 'projectSettings',
    permissionMode: 'default',
    // Propagate model from custom agent definition so getAgentModel()
    // can use it as a fallback when no tool-level model is specified
    ...(agentDefinition?.model ? { model: agentDefinition.model } : {}),
  }

  // All messages across all prompts
  // allMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allMessages: Message[] = []
  // Wrap initial prompt with XML for proper styling in transcript view
  // wrappedInitialPrompt格式化`formatAsTeammateMessage`，供共享工具后续处理使用。
  const wrappedInitialPrompt = formatAsTeammateMessage(
    'team-lead',
    prompt,
    undefined,
    description,
  )
  // currentPrompt 命名 `wrappedInitialPrompt`，让后续代码直接表达这个值的用途。
  let currentPrompt = wrappedInitialPrompt
  // shouldExit标记共享工具 in Process Runner是否启用对应路径。
  let shouldExit = false

  // Try to claim an available task immediately so the UI can show activity
  // from the very start. The idle loop handles claiming for subsequent tasks.
  // Use parentSessionId as the task list ID since the leader creates tasks
  // under its session ID, not the team name.
  // 等待 `tryClaimNextTask(identity.parentSessionId, identity.agentName)` 完成，再继续共享工具 in Process Runner的异步流程。
  await tryClaimNextTask(identity.parentSessionId, identity.agentName)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Add initial prompt to task.messages for display (wrapped with XML)
    // 调用 updateTaskState，触发共享工具此处需要的副作用。
    updateTaskState(
      taskId,
      // task更新为 `> ({`，确保共享工具后续读取最新状态。
      task => ({
        ...task,
        messages: appendCappedMessage(
          task.messages,
          createUserMessage({ content: wrappedInitialPrompt }),
        ),
      }),
      setAppState,
    )

    // Per-teammate content replacement state. The while-loop below calls
    // runAgent repeatedly over an accumulating `allMessages` buffer (which
    // carries FULL original tool result content, not previews — query() yields
    // originals, enforcement is non-mutating). Without persisting state across
    // iterations, each call gets a fresh empty state from createSubagentContext
    // and makes holistic replace-globally-largest decisions, diverging from
    // earlier iterations' incremental frozen-first decisions → wire prefix
    // differs → cache miss. Gated on parent to inherit feature-flag-off.
    // teammateReplacementState 状态保存`toolUseContext.contentReplacementState`，供后续判断或组装使用。
    let teammateReplacementState = toolUseContext.contentReplacementState
      ? createContentReplacementState()
      : undefined

    // Main teammate loop - runs until abort or shutdown approved
    // while 使用 !abortController.signal.aborted && !shouldExit 完成共享工具里的对应操作。
    while (!abortController.signal.aborted && !shouldExit) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[inProcessRunner] ${identity.agentId} processing prompt: ${currentPrompt.substring(0, 50)}...`,
      )

      // Create a per-turn abort controller for this iteration.
      // This allows Escape to stop current work without killing the whole teammate.
      // The lifecycle abortController still kills the whole teammate if needed.
      // currentWorkAbortController构建`createAbortController`，供共享工具后续处理使用。
      const currentWorkAbortController = createAbortController()

      // Store the work controller in task state so UI can abort it
      // 调用 updateTaskState，触发共享工具此处需要的副作用。
      updateTaskState(
        taskId,
        // task更新为 `> ({ ...task, currentWorkAbortController })`，确保共享工具后续读取最新状态。
        task => ({ ...task, currentWorkAbortController }),
        setAppState,
      )

      // Prepare prompt messages for this iteration
      // For the first iteration, start fresh
      // For subsequent iterations, pass accumulated messages as context
      // userMessage 消息数据构建`createUserMessage`，供共享工具后续处理使用。
      const userMessage = createUserMessage({ content: currentPrompt })
      // promptMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
      const promptMessages: Message[] = [userMessage]

      // Check if compaction is needed before building context
      // contextMessages 消息数据 命名 `allMessages`，让后续代码直接表达这个值的用途。
      let contextMessages = allMessages
      // tokenCount 数量保存`tokenCountWithEstimation`，供共享工具后续处理使用。
      const tokenCount = tokenCountWithEstimation(allMessages)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        tokenCount >
        getAutoCompactThreshold(toolUseContext.options.mainLoopModel)
      ) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[inProcessRunner] ${identity.agentId} compacting history (${tokenCount} tokens)`,
        )
        // Create an isolated copy of toolUseContext so that compaction
        // does not clear the main session's readFileState cache or
        // trigger the main session's UI callbacks.
        // isolatedContext 集中保存共享工具 in Process Runner要一起传递的字段。
        const isolatedContext: ToolUseContext = {
          ...toolUseContext,
          readFileState: cloneFileStateCache(toolUseContext.readFileState),
          onCompactProgress: undefined,
          setStreamMode: undefined,
        }
        // compactedSummary保存`compactConversation`，供共享工具后续处理使用。
        const compactedSummary = await compactConversation(
          allMessages,
          isolatedContext,
          {
            systemPrompt: asSystemPrompt([]),
            userContext: {},
            systemContext: {},
            toolUseContext: isolatedContext,
            forkContextMessages: [],
          },
          true, // suppressFollowUpQuestions
          undefined, // customInstructions
          true, // isAutoCompact
        )
        // contextMessages 消息数据更新为 `buildPostCompactMessages(compactedSummary)`，确保共享工具后续读取最新状态。
        contextMessages = buildPostCompactMessages(compactedSummary)
        // Reset microcompact state since full compact replaces all
        // messages — old tool IDs are no longer relevant
        // 调用 resetMicrocompactState，触发共享工具此处需要的副作用。
        resetMicrocompactState()
        // Reset content replacement state — compact replaces all messages
        // so old tool_use_ids are gone. Stale Map entries are harmless
        // (UUID keys never match) but accumulate memory over long runs.
        // 满足 `teammateReplacementState` 时，共享工具执行该分支。
        if (teammateReplacementState) {
          // teammateReplacementState 状态更新为 `createContentReplacementState()`，确保共享工具后续读取最新状态。
          teammateReplacementState = createContentReplacementState()
        }
        // Update allMessages in place with compacted version
        // allMessages 消息数据被清空，共享工具从干净状态继续。
        allMessages.length = 0
        // allMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        allMessages.push(...contextMessages)

        // Mirror compaction into task.messages — otherwise the AppState
        // mirror grows unbounded (500 turns = 500+ messages, 10-50MB).
        // Replace with the compacted messages, matching allMessages.
        // 调用 updateTaskState，触发共享工具此处需要的副作用。
        updateTaskState(
          taskId,
          // task更新为 `> ({ ...task, messages: [...contextMessages, userMessage]...`，确保共享工具后续读取最新状态。
          task => ({ ...task, messages: [...contextMessages, userMessage] }),
          setAppState,
        )
      }

      // Pass previous messages as context to preserve conversation history
      // allMessages accumulates all previous messages (user + assistant) from prior iterations
      // forkContextMessages 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const forkContextMessages =
        contextMessages.length > 0 ? [...contextMessages] : undefined

      // Add the user message to allMessages so it's included in future context
      // This ensures the full conversation (user + assistant turns) is preserved
      // allMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      allMessages.push(userMessage)

      // Create fresh progress tracker for this prompt
      // tracker构建`createProgressTracker`，供共享工具后续处理使用。
      const tracker = createProgressTracker()
      // resolveActivity构建`createActivityDescriptionResolver`，供共享工具后续处理使用。
      const resolveActivity = createActivityDescriptionResolver(
        toolUseContext.options.tools,
      )
      // iterationMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const iterationMessages: Message[] = []

      // Read current permission mode from task state (may have been cycled by leader via Shift+Tab)
      // currentAppState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
      const currentAppState = toolUseContext.getAppState()
      // currentTask 命名 `currentAppState.tasks[taskId]`，让后续代码直接表达这个值的用途。
      const currentTask = currentAppState.tasks[taskId]
      // currentPermissionMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const currentPermissionMode =
        currentTask && currentTask.type === 'in_process_teammate'
          ? currentTask.permissionMode
          : 'default'
      // iterationAgentDefinition集中保存共享工具 in Process Runner要一起传递的字段。
      const iterationAgentDefinition = {
        ...resolvedAgentDefinition,
        permissionMode: currentPermissionMode,
      }

      // Track if this iteration was interrupted by work abort (not lifecycle abort)
      // workWasAborted标记共享工具 in Process Runner是否启用对应路径。
      let workWasAborted = false

      // Run agent within contexts
      // 这个回调绑定到 await runWithTeammateContext(teammateContext, async () => {，负责共享工具在该局部场景下的响应。
      await runWithTeammateContext(teammateContext, async () => {
        // 返回 `runWithAgentContext(agentContext, async () => {`，作为共享工具这次计算的结果。
        return runWithAgentContext(agentContext, async () => {
          // Mark task as running (not idle)
          // 调用 updateTaskState，触发共享工具此处需要的副作用。
          updateTaskState(
            taskId,
            // task更新为 `> ({ ...task, status: 'running', isIdle: false })`，确保共享工具后续读取最新状态。
            task => ({ ...task, status: 'running', isIdle: false }),
            setAppState,
          )

          // Run the normal agent loop - same runAgent() used by AgentTool/subagents.
          // This calls query() internally, so we share the core API infrastructure.
          // Pass forkContextMessages to preserve conversation history across prompts.
          // In-process teammates are async but run in the same process as the leader,
          // so they CAN show permission prompts (unlike true background agents).
          // Use currentWorkAbortController so Escape stops this turn only, not the teammate.
          // 逐项读取 `runAgent({` 中的消息，按输入顺序推进共享工具 in Process Runner。
          for await (const message of runAgent({
            agentDefinition: iterationAgentDefinition,
            promptMessages,
            toolUseContext,
            canUseTool: createInProcessCanUseTool(
              identity,
              currentWorkAbortController,
              // 这个回调绑定到 (waitMs: number) => {，负责共享工具在该局部场景下的响应。
              (waitMs: number) => {
                // 调用 updateTaskState，触发共享工具此处需要的副作用。
                updateTaskState(
                  taskId,
                  // task更新为 `> ({`，确保共享工具后续读取最新状态。
                  task => ({
                    ...task,
                    totalPausedMs: (task.totalPausedMs ?? 0) + waitMs,
                  }),
                  setAppState,
                )
              },
            ),
            isAsync: true,
            canShowPermissionPrompts: allowPermissionPrompts ?? true,
            forkContextMessages,
            querySource: 'agent:custom',
            override: { abortController: currentWorkAbortController },
            model: model as ModelAlias | undefined,
            preserveToolUseResults: true,
            availableTools: toolUseContext.options.tools,
            allowedTools,
            contentReplacementState: teammateReplacementState,
          })) {
            // Check lifecycle abort first (kills whole teammate)
            // 满足 `abortController.signal.aborted` 时，共享工具执行该分支。
            if (abortController.signal.aborted) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[inProcessRunner] ${identity.agentId} lifecycle aborted`,
              )
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            }

            // Check work abort (stops current turn only)
            // 满足 `currentWorkAbortController.signal.aborted` 时，共享工具执行该分支。
            if (currentWorkAbortController.signal.aborted) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[inProcessRunner] ${identity.agentId} current work aborted (Escape pressed)`,
              )
              // workWasAborted更新为 `true`，确保共享工具后续读取最新状态。
              workWasAborted = true
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            }

            // iterationMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
            iterationMessages.push(message)
            // allMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
            allMessages.push(message)

            // 调用 updateProgressFromMessage，触发共享工具此处需要的副作用。
            updateProgressFromMessage(
              tracker,
              message,
              resolveActivity,
              toolUseContext.options.tools,
            )
            // progress 集合读取`getProgressUpdate`，供共享工具后续处理使用。
            const progress = getProgressUpdate(tracker)

            // 调用 updateTaskState，触发共享工具此处需要的副作用。
            updateTaskState(
              taskId,
              // task更新为 `> {`，确保共享工具后续读取最新状态。
              task => {
                // Track in-progress tool use IDs for animation in transcript view
                // inProgressToolUseIDs 集合保存`task.inProgressToolUseIDs`，供后续判断或组装使用。
                let inProgressToolUseIDs = task.inProgressToolUseIDs
                // 当 `message.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
                if (message.type === 'assistant') {
                  // 按顺序遍历 `message.message.content` 中的block，逐个交给共享工具处理。
                  for (const block of message.message.content) {
                    // 当 `block.type` 匹配 `'tool_use'` 时，共享工具执行对应分支。
                    if (block.type === 'tool_use') {
                      // inProgressToolUseIDs 集合更新为 `new Set([`，确保共享工具后续读取最新状态。
                      inProgressToolUseIDs = new Set([
                        ...(inProgressToolUseIDs ?? []),
                        block.id,
                      ])
                    }
                  }
                // 共享工具 in Process Runner在这里处理 `} else if (message.type === 'user') {`，完成这一小步状态转换。
                } else if (message.type === 'user') {
                  // 文本内容 命名 `message.message.content`，让后续代码直接表达这个值的用途。
                  const content = message.message.content
                  // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
                  if (Array.isArray(content)) {
                    // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
                    for (const block of content) {
                      // 共享工具在这里按实际状态进入对应分支。
                      if (
                        typeof block === 'object' &&
                        'type' in block &&
                        block.type === 'tool_result'
                      ) {
                        // 满足 `inProgressToolUseIDs` 时，共享工具执行该分支。
                        if (inProgressToolUseIDs) {
                          // inProgressToolUseIDs 集合更新为 `new Set(inProgressToolUseIDs)`，确保共享工具后续读取最新状态。
                          inProgressToolUseIDs = new Set(inProgressToolUseIDs)
                          // 调用 inProgressToolUseIDs.delete，触发共享工具此处需要的副作用。
                          inProgressToolUseIDs.delete(block.tool_use_id)
                        }
                      }
                    }
                  }
                }

                // 返回结构化结果，集中表达共享工具已经整理出的状态。
                return {
                  ...task,
                  progress,
                  messages: appendCappedMessage(task.messages, message),
                  inProgressToolUseIDs,
                }
              },
              setAppState,
            )
          }

          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { success: true, messages: iterationMessages }
        })
      })

      // Clear the work controller from state (it's no longer valid)
      // 调用 updateTaskState，触发共享工具此处需要的副作用。
      updateTaskState(
        taskId,
        // task更新为 `> ({ ...task, currentWorkAbortController: undefined })`，确保共享工具后续读取最新状态。
        task => ({ ...task, currentWorkAbortController: undefined }),
        setAppState,
      )

      // Check if lifecycle aborted during agent run (kills whole teammate)
      // 满足 `abortController.signal.aborted` 时，共享工具执行该分支。
      if (abortController.signal.aborted) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      // If work was aborted (Escape), log it and add interrupt message, then continue to idle state
      // 满足 `workWasAborted` 时，共享工具执行该分支。
      if (workWasAborted) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[inProcessRunner] ${identity.agentId} work interrupted, returning to idle`,
        )

        // Add interrupt message to teammate's messages so it appears in their scrollback
        // interruptMessage 消息数据构建`createAssistantAPIErrorMessage`，供共享工具后续处理使用。
        const interruptMessage = createAssistantAPIErrorMessage({
          content: ERROR_MESSAGE_USER_ABORT,
        })
        // 调用 updateTaskState，触发共享工具此处需要的副作用。
        updateTaskState(
          taskId,
          // task更新为 `> ({`，确保共享工具后续读取最新状态。
          task => ({
            ...task,
            messages: appendCappedMessage(task.messages, interruptMessage),
          }),
          setAppState,
        )
      }

      // Check if already idle before updating (to skip duplicate notification)
      // prevAppState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
      const prevAppState = toolUseContext.getAppState()
      // prevTask 命名 `prevAppState.tasks[taskId]`，让后续代码直接表达这个值的用途。
      const prevTask = prevAppState.tasks[taskId]
      // wasAlreadyIdle 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const wasAlreadyIdle =
        prevTask?.type === 'in_process_teammate' && prevTask.isIdle

      // Mark task as idle (NOT completed) and notify any waiters
      // 调用 updateTaskState，触发共享工具此处需要的副作用。
      updateTaskState(
        taskId,
        // task更新为 `> {`，确保共享工具后续读取最新状态。
        task => {
          // Call any registered idle callbacks
          // 这个回调绑定到 task.onIdleCallbacks?.forEach(cb => cb())，负责共享工具在该局部场景下的响应。
          task.onIdleCallbacks?.forEach(cb => cb())
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { ...task, isIdle: true, onIdleCallbacks: [] }
        },
        setAppState,
      )

      // Note: We do NOT automatically send the teammate's response to the leader.
      // Teammates should use the Teammate tool to communicate with the leader.
      // This matches process-based teammates where output is not visible to the leader.

      // Only send idle notification on transition to idle (not if already idle)
      // wasAlreadyIdle缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!wasAlreadyIdle) {
        // 等待 `sendIdleNotification(` 完成，再继续共享工具 in Process Runner的异步流程。
        await sendIdleNotification(
          identity.agentName,
          identity.color,
          identity.teamName,
          {
            idleReason: workWasAborted ? 'interrupted' : 'available',
            summary: getLastPeerDmSummary(allMessages),
          },
        )
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[inProcessRunner] Skipping duplicate idle notification for ${identity.agentName}`,
        )
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[inProcessRunner] ${identity.agentId} finished prompt, waiting for next`,
      )

      // Wait for next message or shutdown
      // waitResult保存`waitForNextPromptOrShutdown`，供共享工具后续处理使用。
      const waitResult = await waitForNextPromptOrShutdown(
        identity,
        abortController,
        taskId,
        toolUseContext.getAppState,
        setAppState,
        identity.parentSessionId,
      )

      // 按照 waitResult.type 的取值选择共享工具的具体处理分支。
      switch (waitResult.type) {
        case 'shutdown_request':
          // Pass shutdown request to model for decision
          // Format as teammate-message for consistency with how tmux teammates receive it
          // The model will use approveShutdown or rejectShutdown tool
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[inProcessRunner] ${identity.agentId} received shutdown request - passing to model`,
          )
          // currentPrompt更新为 `formatAsTeammateMessage(`，确保共享工具后续读取最新状态。
          currentPrompt = formatAsTeammateMessage(
            waitResult.request?.from || 'team-lead',
            waitResult.originalMessage,
          )
          // Add shutdown request to task.messages for transcript display
          // 调用 appendTeammateMessage，触发共享工具此处需要的副作用。
          appendTeammateMessage(
            taskId,
            createUserMessage({ content: currentPrompt }),
            setAppState,
          )
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break

        case 'new_message':
          // New prompt from leader or teammate
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[inProcessRunner] ${identity.agentId} received new message from ${waitResult.from}`,
          )
          // Messages from the user should be plain text (not wrapped in XML)
          // Messages from other teammates get XML wrapper for identification
          // 当 `waitResult.from` 匹配 `'user'` 时，共享工具执行对应分支。
          if (waitResult.from === 'user') {
            // currentPrompt更新为 `waitResult.message`，确保共享工具后续读取最新状态。
            currentPrompt = waitResult.message
          } else {
            // currentPrompt更新为 `formatAsTeammateMessage(`，确保共享工具后续读取最新状态。
            currentPrompt = formatAsTeammateMessage(
              waitResult.from,
              waitResult.message,
              waitResult.color,
              waitResult.summary,
            )
            // Add to task.messages for transcript display (only for non-user messages)
            // Messages from 'user' come from pendingUserMessages which are already
            // added by injectUserMessageToTeammate
            // 调用 appendTeammateMessage，触发共享工具此处需要的副作用。
            appendTeammateMessage(
              taskId,
              createUserMessage({ content: currentPrompt }),
              setAppState,
            )
          }
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break

        case 'aborted':
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[inProcessRunner] ${identity.agentId} aborted while waiting`,
          )
          // shouldExit更新为 `true`，确保共享工具后续读取最新状态。
          shouldExit = true
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
      }
    }

    // Mark as completed when exiting the loop
    // alreadyTerminal标记共享工具 in Process Runner是否启用对应路径。
    let alreadyTerminal = false
    // toolUseId 先占位，稍后的条件分支会根据实际输入补齐它。
    let toolUseId: string | undefined
    // 调用 updateTaskState，触发共享工具此处需要的副作用。
    updateTaskState(
      taskId,
      // task更新为 `> {`，确保共享工具后续读取最新状态。
      task => {
        // killInProcessTeammate may have already set status:killed +
        // notified:true + cleared fields. Don't overwrite (would flip
        // killed → completed and double-emit the SDK bookend).
        // `task.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
        if (task.status !== 'running') {
          // alreadyTerminal更新为 `true`，确保共享工具后续读取最新状态。
          alreadyTerminal = true
          // 返回 `task`，作为共享工具这次计算的结果。
          return task
        }
        // toolUseId更新为 `task.toolUseId`，确保共享工具后续读取最新状态。
        toolUseId = task.toolUseId
        // 这个回调绑定到 task.onIdleCallbacks?.forEach(cb => cb())，负责共享工具在该局部场景下的响应。
        task.onIdleCallbacks?.forEach(cb => cb())
        // 调用 task.unregisterCleanup?.()，完成这一处局部操作。
        task.unregisterCleanup?.()
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          ...task,
          status: 'completed' as const,
          notified: true,
          endTime: Date.now(),
          messages: task.messages?.length ? [task.messages.at(-1)!] : undefined,
          pendingUserMessages: [],
          inProgressToolUseIDs: undefined,
          abortController: undefined,
          unregisterCleanup: undefined,
          currentWorkAbortController: undefined,
          onIdleCallbacks: [],
        }
      },
      setAppState,
    )
    // 显式忽略 `evictTaskOutput(taskId)` 的返回值，只保留它触发的副作用。
    void evictTaskOutput(taskId)
    // Eagerly evict task from AppState since it's been consumed
    // 调用 evictTerminalTask，触发共享工具此处需要的副作用。
    evictTerminalTask(taskId, setAppState)
    // notified:true pre-set → no XML notification → print.ts won't emit
    // the SDK task_notification. Close the task_started bookend directly.
    // alreadyTerminal缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!alreadyTerminal) {
      // 调用 emitTaskTerminatedSdk，触发共享工具此处需要的副作用。
      emitTaskTerminatedSdk(taskId, 'completed', {
        toolUseId,
        summary: identity.agentId,
      })
    }

    // 调用 unregisterPerfettoAgent，触发共享工具此处需要的副作用。
    unregisterPerfettoAgent(identity.agentId)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, messages: allMessages }
  } catch (error) {
    // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[inProcessRunner] Agent ${identity.agentId} failed: ${errorMessage}`,
    )

    // Mark task as failed and notify any waiters
    // alreadyTerminal标记共享工具 in Process Runner是否启用对应路径。
    let alreadyTerminal = false
    // toolUseId 先占位，稍后的条件分支会根据实际输入补齐它。
    let toolUseId: string | undefined
    // 调用 updateTaskState，触发共享工具此处需要的副作用。
    updateTaskState(
      taskId,
      // task更新为 `> {`，确保共享工具后续读取最新状态。
      task => {
        // `task.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
        if (task.status !== 'running') {
          // alreadyTerminal更新为 `true`，确保共享工具后续读取最新状态。
          alreadyTerminal = true
          // 返回 `task`，作为共享工具这次计算的结果。
          return task
        }
        // toolUseId更新为 `task.toolUseId`，确保共享工具后续读取最新状态。
        toolUseId = task.toolUseId
        // 这个回调绑定到 task.onIdleCallbacks?.forEach(cb => cb())，负责共享工具在该局部场景下的响应。
        task.onIdleCallbacks?.forEach(cb => cb())
        // 调用 task.unregisterCleanup?.()，完成这一处局部操作。
        task.unregisterCleanup?.()
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          ...task,
          status: 'failed' as const,
          notified: true,
          error: errorMessage,
          isIdle: true,
          endTime: Date.now(),
          onIdleCallbacks: [],
          messages: task.messages?.length ? [task.messages.at(-1)!] : undefined,
          pendingUserMessages: [],
          inProgressToolUseIDs: undefined,
          abortController: undefined,
          unregisterCleanup: undefined,
          currentWorkAbortController: undefined,
        }
      },
      setAppState,
    )
    // 显式忽略 `evictTaskOutput(taskId)` 的返回值，只保留它触发的副作用。
    void evictTaskOutput(taskId)
    // Eagerly evict task from AppState since it's been consumed
    // 调用 evictTerminalTask，触发共享工具此处需要的副作用。
    evictTerminalTask(taskId, setAppState)
    // notified:true pre-set → no XML notification → close SDK bookend directly.
    // alreadyTerminal缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!alreadyTerminal) {
      // 调用 emitTaskTerminatedSdk，触发共享工具此处需要的副作用。
      emitTaskTerminatedSdk(taskId, 'failed', {
        toolUseId,
        summary: identity.agentId,
      })
    }

    // Send idle notification with failure via file-based mailbox
    // 等待 `sendIdleNotification(` 完成，再继续共享工具 in Process Runner的异步流程。
    await sendIdleNotification(
      identity.agentName,
      identity.color,
      identity.teamName,
      {
        idleReason: 'failed',
        completedStatus: 'failed',
        failureReason: errorMessage,
      },
    )

    // 调用 unregisterPerfettoAgent，触发共享工具此处需要的副作用。
    unregisterPerfettoAgent(identity.agentId)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: errorMessage,
      messages: allMessages,
    }
  }
}

/**
 * Starts an in-process teammate in the background.
 *
 * This is the main entry point called after spawn. It starts the agent
 * execution loop in a fire-and-forget manner.
 *
 * @param config - Runner configuration
 */
// startInProcessTeammate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startInProcessTeammate(config: InProcessRunnerConfig): void {
  // Extract agentId before the closure so the catch handler doesn't retain
  // the full config object (including toolUseContext) while the promise is
  // pending - which can be hours for a long-running teammate.
  // agentId保存`config.identity.agentId`，供后续判断或组装使用。
  const agentId = config.identity.agentId
  // 这个回调绑定到 void runInProcessTeammate(config).catch(error => {，负责共享工具在该局部场景下的响应。
  void runInProcessTeammate(config).catch(error => {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[inProcessRunner] Unhandled error in ${agentId}: ${error}`)
  })
}
