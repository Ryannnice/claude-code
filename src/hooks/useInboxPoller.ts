// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useRef } from 'react'
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts'
// 类型依赖 { ToolUseConfirm } 来自 ../components/permissions/PermissionRequest.js，用于校准React hook 状态流的数据契约。
import type { ToolUseConfirm } from '../components/permissions/PermissionRequest.js'
// 引入 TEAMMATE_MESSAGE_TAG，将 ../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_MESSAGE_TAG } from '../constants/xml.js'
// 复用 useTerminalNotification 终端界面组件，避免在这里重复拼装显示逻辑。
import { useTerminalNotification } from '../ink/useTerminalNotification.js'
// 接入 sendNotification 服务层能力，把外部通信或共享状态交给 ../services/notifier.js 处理。
import { sendNotification } from '../services/notifier.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AppState,
  useAppState,
  useAppStateStore,
  useSetAppState,
} from '../state/AppState.js'
// 引入 findToolByName，将 ../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName } from '../Tool.js'
// 引入 isInProcessTeammateTask，将 ../tasks/InProcessTeammateTask/types.js 中已经封装好的能力接到本文件流程里。
import { isInProcessTeammateTask } from '../tasks/InProcessTeammateTask/types.js'
// 引入 getAllBaseTools，将 ../tools.js 中已经封装好的能力接到本文件流程里。
import { getAllBaseTools } from '../tools.js'
// 类型依赖 { PermissionUpdate } 来自 ../types/permissions.js，用于校准React hook 状态流的数据契约。
import type { PermissionUpdate } from '../types/permissions.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  findInProcessTeammateTaskId,
  handlePlanApprovalResponse,
} from '../utils/inProcessTeammateHelpers.js'
// 复用 createAssistantMessage 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { createAssistantMessage } from '../utils/messages.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  permissionModeFromString,
  toExternalPermissionMode,
} from '../utils/permissions/PermissionMode.js'
// 复用 applyPermissionUpdate 工具函数，把通用处理留在 ../utils/permissions/PermissionUpdate.js 中维护。
import { applyPermissionUpdate } from '../utils/permissions/PermissionUpdate.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 复用 isInsideTmux 工具函数，把通用处理留在 ../utils/swarm/backends/detection.js 中维护。
import { isInsideTmux } from '../utils/swarm/backends/detection.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  ensureBackendsRegistered,
  getBackendByType,
} from '../utils/swarm/backends/registry.js'
// 类型依赖 { PaneBackendType } 来自 ../utils/swarm/backends/types.js，用于校准React hook 状态流的数据契约。
import type { PaneBackendType } from '../utils/swarm/backends/types.js'
// 复用 TEAM_LEAD_NAME 工具函数，把通用处理留在 ../utils/swarm/constants.js 中维护。
import { TEAM_LEAD_NAME } from '../utils/swarm/constants.js'
// 复用 getLeaderToolUseConfirmQueue 工具函数，把通用处理留在 ../utils/swarm/leaderPermissionBridge.js 中维护。
import { getLeaderToolUseConfirmQueue } from '../utils/swarm/leaderPermissionBridge.js'
// 复用 sendPermissionResponseViaMailbox 工具函数，把通用处理留在 ../utils/swarm/permissionSync.js 中维护。
import { sendPermissionResponseViaMailbox } from '../utils/swarm/permissionSync.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  removeTeammateFromTeamFile,
  setMemberMode,
} from '../utils/swarm/teamHelpers.js'
// 复用 unassignTeammateTasks 工具函数，把通用处理留在 ../utils/tasks.js 中维护。
import { unassignTeammateTasks } from '../utils/tasks.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getAgentName,
  isPlanModeRequired,
  isTeamLead,
  isTeammate,
} from '../utils/teammate.js'
// 复用 isInProcessTeammate 工具函数，把通用处理留在 ../utils/teammateContext.js 中维护。
import { isInProcessTeammate } from '../utils/teammateContext.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  isModeSetRequest,
  isPermissionRequest,
  isPermissionResponse,
  isPlanApprovalRequest,
  isPlanApprovalResponse,
  isSandboxPermissionRequest,
  isSandboxPermissionResponse,
  isShutdownApproved,
  isShutdownRequest,
  isTeamPermissionUpdate,
  markMessagesAsRead,
  readUnreadMessages,
  type TeammateMessage,
  writeToMailbox,
} from '../utils/teammateMailbox.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  hasPermissionCallback,
  hasSandboxPermissionCallback,
  processMailboxPermissionResponse,
  processSandboxPermissionResponse,
} from './useSwarmPermissionPoller.js'

/**
 * Get the agent name to poll for messages.
 * - In-process teammates return undefined (they use waitForNextPromptOrShutdown instead)
 * - Process-based teammates use their CLAUDE_CODE_AGENT_NAME
 * - Team leads use their name from teamContext.teammates
 * - Standalone sessions return undefined
 */
// getAgentNameToPoll 封装useInboxPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAgentNameToPoll(appState: AppState): string | undefined {
  // In-process teammates should NOT use useInboxPoller - they have their own
  // polling mechanism via waitForNextPromptOrShutdown() in inProcessRunner.ts.
  // Using useInboxPoller would cause message routing issues since in-process
  // teammates share the same React context and AppState with the leader.
  //
  // Note: This can be called when the leader's REPL re-renders while an
  // in-process teammate's AsyncLocalStorage context is active (due to shared
  // setAppState). We return undefined to gracefully skip polling rather than
  // throwing, since this is a normal occurrence during concurrent execution.
  // 满足 `isInProcessTeammate()` 时，React hook执行该分支。
  if (isInProcessTeammate()) {
    // 返回 `undefined`，作为React hook 状态流这次计算的结果。
    return undefined
  }
  // 满足 `isTeammate()` 时，React hook执行该分支。
  if (isTeammate()) {
    // 返回 `getAgentName()`，作为React hook 状态流这次计算的结果。
    return getAgentName()
  }
  // Team lead polls using their agent name (not ID)
  // 满足 `isTeamLead(appState.teamContext)` 时，React hook执行该分支。
  if (isTeamLead(appState.teamContext)) {
    // leadAgentId保存`appState.teamContext!.leadAgentId`，供后续判断或组装使用。
    const leadAgentId = appState.teamContext!.leadAgentId
    // Look up the lead's name from teammates map
    // leadName 命名 `appState.teamContext!.teammates[leadAgentId]?.name`，让后续代码直接表达这个值的用途。
    const leadName = appState.teamContext!.teammates[leadAgentId]?.name
    // 返回 `leadName || 'team-lead'`，作为React hook 状态流这次计算的结果。
    return leadName || 'team-lead'
  }
  // 返回 `undefined`，作为React hook 状态流这次计算的结果。
  return undefined
}

// INBOX_POLL_INTERVAL_MS 集合保存`1000`，供后续判断或组装使用。
const INBOX_POLL_INTERVAL_MS = 1000

// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  enabled: boolean
  isLoading: boolean
  focusedInputDialog: string | undefined
  // Returns true if submission succeeded, false if rejected (e.g., query already running)
  // Dead code elimination: parameter named onSubmitMessage to avoid "teammate" string in external builds
  // 这个回调绑定到 onSubmitMessage: (formatted: string) => boolean，负责React hook 状态流在该局部场景下的响应。
  onSubmitMessage: (formatted: string) => boolean
}

/**
 * Polls the teammate inbox for new messages and submits them as turns.
 *
 * This hook:
 * 1. Polls every 1s for unread messages (teammates or team leads)
 * 2. When idle: submits messages immediately as a new turn
 * 3. When busy: queues messages in AppState.inbox for UI display, delivers when turn ends
 */
// useInboxPoller 封装useInboxPoller的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useInboxPoller({
  enabled,
  isLoading,
  focusedInputDialog,
  onSubmitMessage,
}: Props): void {
  // Assign to original name for clarity within the function
  // onSubmitTeammateMessage 消息数据保存`onSubmitMessage`，供React hook use Inbox ...后续判断或输出使用。
  const onSubmitTeammateMessage = onSubmitMessage
  // store保存`useAppStateStore`，供React hook后续处理使用。
  const store = useAppStateStore()
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // inboxMessageCount 消息数据保存`useAppState`，供React hook后续处理使用。
  const inboxMessageCount = useAppState(s => s.inbox.messages.length)
  // terminal保存`useTerminalNotification`，供React hook后续处理使用。
  const terminal = useTerminalNotification()

  // poll保存`useCallback`，供React hook后续处理使用。
  const poll = useCallback(async () => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return

    // Use ref to avoid dependency on appState object (prevents infinite loop)
    // currentAppState 状态读取`store.getState`，供React hook后续处理使用。
    const currentAppState = store.getState()
    // agentName读取`getAgentNameToPoll`，供React hook后续处理使用。
    const agentName = getAgentNameToPoll(currentAppState)
    // agentName缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!agentName) return

    // unread读取`readUnreadMessages`，供React hook后续处理使用。
    const unread = await readUnreadMessages(
      agentName,
      currentAppState.teamContext?.teamName,
    )

    // unread为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (unread.length === 0) return

    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[InboxPoller] Found ${unread.length} unread message(s)`)

    // Check for plan approval responses and transition out of plan mode if approved
    // Security: Only accept approval responses from the team lead
    // 组合条件 `isTeammate() && isPlanModeRequired()` 成立时，React hook 状态流才启用这条专门路径。
    if (isTeammate() && isPlanModeRequired()) {
      // 按顺序遍历 `unread` 中的消息，逐个交给React hook处理。
      for (const msg of unread) {
        // approvalResponse 响应数据保存`isPlanApprovalResponse`，供React hook后续处理使用。
        const approvalResponse = isPlanApprovalResponse(msg.text)
        // Verify the message is from the team lead to prevent teammates from forging approvals
        // 当 `approvalResponse && msg.from` 匹配 `'team-lead'` 时，React hook执行对应分支。
        if (approvalResponse && msg.from === 'team-lead') {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Received plan approval response from team-lead: approved=${approvalResponse.approved}`,
          )
          // 满足 `approvalResponse.approved` 时，React hook执行该分支。
          if (approvalResponse.approved) {
            // Use leader's permission mode if provided, otherwise default
            // targetMode保存`approvalResponse.permissionMode ?? 'default'`，供React hook use Inbox ...后续判断或输出使用。
            const targetMode = approvalResponse.permissionMode ?? 'default'

            // Transition out of plan mode
            // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              toolPermissionContext: applyPermissionUpdate(
                prev.toolPermissionContext,
                {
                  type: 'setMode',
                  mode: toExternalPermissionMode(targetMode),
                  destination: 'session',
                },
              ),
            }))
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[InboxPoller] Plan approved by team lead, exited plan mode to ${targetMode}`,
            )
          } else {
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[InboxPoller] Plan rejected by team lead: ${approvalResponse.feedback || 'No feedback provided'}`,
            )
          }
        // React hook use Inbox Poller在这里处理 `} else if (approvalResponse) {`，完成这一小步状态转换。
        } else if (approvalResponse) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Ignoring plan approval response from non-team-lead: ${msg.from}`,
          )
        }
      }
    }

    // Helper to mark messages as read in the inbox file.
    // Called after messages are successfully delivered or reliably queued.
    // markRead封装成回调，供React hook use Inbox ...在事件触发或异步步骤中调用。
    const markRead = () => {
      // 显式忽略 `markMessagesAsRead(agentName, currentAppState.teamContext?.team...` 的返回值，只保留它触发的副作用。
      void markMessagesAsRead(agentName, currentAppState.teamContext?.teamName)
    }

    // Separate permission messages from regular teammate messages
    // permissionRequests 权限数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const permissionRequests: TeammateMessage[] = []
    // permissionResponses 权限数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const permissionResponses: TeammateMessage[] = []
    // sandboxPermissionRequests 权限数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const sandboxPermissionRequests: TeammateMessage[] = []
    // sandboxPermissionResponses 权限数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const sandboxPermissionResponses: TeammateMessage[] = []
    // shutdownRequests 请求数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const shutdownRequests: TeammateMessage[] = []
    // shutdownApprovals 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const shutdownApprovals: TeammateMessage[] = []
    // teamPermissionUpdates 权限数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const teamPermissionUpdates: TeammateMessage[] = []
    // modeSetRequests 请求数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const modeSetRequests: TeammateMessage[] = []
    // planApprovalRequests 请求数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const planApprovalRequests: TeammateMessage[] = []
    // regularMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const regularMessages: TeammateMessage[] = []

    // 按顺序遍历 `unread` 中的m，逐个交给React hook处理。
    for (const m of unread) {
      // permReq保存`isPermissionRequest`，供React hook后续处理使用。
      const permReq = isPermissionRequest(m.text)
      // permResp保存`isPermissionResponse`，供React hook后续处理使用。
      const permResp = isPermissionResponse(m.text)
      // sandboxReq保存`isSandboxPermissionRequest`，供React hook后续处理使用。
      const sandboxReq = isSandboxPermissionRequest(m.text)
      // sandboxResp保存`isSandboxPermissionResponse`，供React hook后续处理使用。
      const sandboxResp = isSandboxPermissionResponse(m.text)
      // shutdownReq保存`isShutdownRequest`，供React hook后续处理使用。
      const shutdownReq = isShutdownRequest(m.text)
      // shutdownApproval保存`isShutdownApproved`，供React hook后续处理使用。
      const shutdownApproval = isShutdownApproved(m.text)
      // teamPermUpdate保存`isTeamPermissionUpdate`，供React hook后续处理使用。
      const teamPermUpdate = isTeamPermissionUpdate(m.text)
      // modeSetReq保存`isModeSetRequest`，供React hook后续处理使用。
      const modeSetReq = isModeSetRequest(m.text)
      // planApprovalReq保存`isPlanApprovalRequest`，供React hook后续处理使用。
      const planApprovalReq = isPlanApprovalRequest(m.text)

      // 满足 `permReq` 时，React hook执行该分支。
      if (permReq) {
        // permissionRequests 权限数据追加新条目，保持收集顺序与输入顺序一致。
        permissionRequests.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (permResp) {`，完成这一小步状态转换。
      } else if (permResp) {
        // permissionResponses 权限数据追加新条目，保持收集顺序与输入顺序一致。
        permissionResponses.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (sandboxReq) {`，完成这一小步状态转换。
      } else if (sandboxReq) {
        // sandboxPermissionRequests 权限数据追加新条目，保持收集顺序与输入顺序一致。
        sandboxPermissionRequests.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (sandboxResp) {`，完成这一小步状态转换。
      } else if (sandboxResp) {
        // sandboxPermissionResponses 权限数据追加新条目，保持收集顺序与输入顺序一致。
        sandboxPermissionResponses.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (shutdownReq) {`，完成这一小步状态转换。
      } else if (shutdownReq) {
        // shutdownRequests 请求数据追加新条目，保持收集顺序与输入顺序一致。
        shutdownRequests.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (shutdownApproval) {`，完成这一小步状态转换。
      } else if (shutdownApproval) {
        // shutdownApprovals 集合追加新条目，保持收集顺序与输入顺序一致。
        shutdownApprovals.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (teamPermUpdate) {`，完成这一小步状态转换。
      } else if (teamPermUpdate) {
        // teamPermissionUpdates 权限数据追加新条目，保持收集顺序与输入顺序一致。
        teamPermissionUpdates.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (modeSetReq) {`，完成这一小步状态转换。
      } else if (modeSetReq) {
        // modeSetRequests 请求数据追加新条目，保持收集顺序与输入顺序一致。
        modeSetRequests.push(m)
      // React hook use Inbox Poller在这里处理 `} else if (planApprovalReq) {`，完成这一小步状态转换。
      } else if (planApprovalReq) {
        // planApprovalRequests 请求数据追加新条目，保持收集顺序与输入顺序一致。
        planApprovalRequests.push(m)
      } else {
        // regularMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        regularMessages.push(m)
      }
    }

    // Handle permission requests (leader side) - route to ToolUseConfirmQueue
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      permissionRequests.length > 0 &&
      isTeamLead(currentAppState.teamContext)
    ) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${permissionRequests.length} permission request(s)`,
      )

      // setToolUseConfirmQueue读取`getLeaderToolUseConfirmQueue`，供React hook后续处理使用。
      const setToolUseConfirmQueue = getLeaderToolUseConfirmQueue()
      // teamName保存`currentAppState.teamContext?.teamName`，供React hook use Inbox ...后续判断或输出使用。
      const teamName = currentAppState.teamContext?.teamName

      // 按顺序遍历 `permissionRequests` 中的m，逐个交给React hook处理。
      for (const m of permissionRequests) {
        // 解析结果保存`isPermissionRequest`，供React hook后续处理使用。
        const parsed = isPermissionRequest(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) continue

        // 满足 `setToolUseConfirmQueue` 时，React hook执行该分支。
        if (setToolUseConfirmQueue) {
          // Route through the standard ToolUseConfirmQueue so tmux workers
          // get the same tool-specific UI (BashPermissionRequest, FileEditToolDiff, etc.)
          // as in-process teammates.
          // 工具筛选`findToolByName`，供React hook后续处理使用。
          const tool = findToolByName(getAllBaseTools(), parsed.tool_name)
          // 工具缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
          if (!tool) {
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[InboxPoller] Unknown tool ${parsed.tool_name}, skipping permission request`,
            )
            // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
            continue
          }

          // entry 集中保存React hook use Inbox Poller要一起传递的字段。
          const entry: ToolUseConfirm = {
            assistantMessage: createAssistantMessage({ content: '' }),
            tool,
            description: parsed.description,
            input: parsed.input,
            toolUseContext: {} as ToolUseConfirm['toolUseContext'],
            toolUseID: parsed.tool_use_id,
            permissionResult: {
              behavior: 'ask',
              message: parsed.description,
            },
            permissionPromptStartTimeMs: Date.now(),
            workerBadge: {
              name: parsed.agent_id,
              color: 'cyan',
            },
            // onUserInteraction 使用 无 完成React hook 状态流里的对应操作。
            onUserInteraction() {
              // No-op for tmux workers (no classifier auto-approval)
            },
            // onAbort 使用 无 完成React hook 状态流里的对应操作。
            onAbort() {
              // 显式忽略 `sendPermissionResponseViaMailbox(` 的返回值，只保留它触发的副作用。
              void sendPermissionResponseViaMailbox(
                parsed.agent_id,
                { decision: 'rejected', resolvedBy: 'leader' },
                parsed.request_id,
                teamName,
              )
            },
            // 调用 onAllow，触发React hook此处需要的副作用。
            onAllow(
              updatedInput: Record<string, unknown>,
              permissionUpdates: PermissionUpdate[],
            ) {
              // 显式忽略 `sendPermissionResponseViaMailbox(` 的返回值，只保留它触发的副作用。
              void sendPermissionResponseViaMailbox(
                parsed.agent_id,
                {
                  decision: 'approved',
                  resolvedBy: 'leader',
                  updatedInput,
                  permissionUpdates,
                },
                parsed.request_id,
                teamName,
              )
            },
            // onReject 使用 feedback?: string 完成React hook 状态流里的对应操作。
            onReject(feedback?: string) {
              // 显式忽略 `sendPermissionResponseViaMailbox(` 的返回值，只保留它触发的副作用。
              void sendPermissionResponseViaMailbox(
                parsed.agent_id,
                {
                  decision: 'rejected',
                  resolvedBy: 'leader',
                  feedback,
                },
                parsed.request_id,
                teamName,
              )
            },
            // recheckPermission 使用 无 完成React hook 状态流里的对应操作。
            async recheckPermission() {
              // No-op for tmux workers — permission state is on the worker side
            },
          }

          // Deduplicate: if markMessagesAsRead failed on a prior poll,
          // the same message will be re-read — skip if already queued.
          // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
          setToolUseConfirmQueue(queue => {
            // 满足 `queue.some(q => q.toolUseID === parsed.tool_use_id)` 时，React hook执行该分支。
            if (queue.some(q => q.toolUseID === parsed.tool_use_id)) {
              // 返回 `queue`，作为React hook 状态流这次计算的结果。
              return queue
            }
            // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
            return [...queue, entry]
          })
        } else {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] ToolUseConfirmQueue unavailable, dropping permission request from ${parsed.agent_id}`,
          )
        }
      }

      // Send desktop notification for the first request
      // firstParsed保存`isPermissionRequest`，供React hook后续处理使用。
      const firstParsed = isPermissionRequest(permissionRequests[0]?.text ?? '')
      // 组合条件 `firstParsed && !isLoading && !focusedInputDialog` 成立时，React hook 状态流才启用这条专门路径。
      if (firstParsed && !isLoading && !focusedInputDialog) {
        // 显式忽略 `sendNotification(` 的返回值，只保留它触发的副作用。
        void sendNotification(
          {
            message: `${firstParsed.agent_id} needs permission for ${firstParsed.tool_name}`,
            notificationType: 'worker_permission_prompt',
          },
          terminal,
        )
      }
    }

    // Handle permission responses (worker side) - invoke registered callbacks
    // 组合条件 `permissionResponses.length > 0 && isTeammate()` 成立时，React hook 状态流才启用这条专门路径。
    if (permissionResponses.length > 0 && isTeammate()) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${permissionResponses.length} permission response(s)`,
      )

      // 按顺序遍历 `permissionResponses` 中的m，逐个交给React hook处理。
      for (const m of permissionResponses) {
        // 解析结果保存`isPermissionResponse`，供React hook后续处理使用。
        const parsed = isPermissionResponse(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) continue

        // 满足 `hasPermissionCallback(parsed.request_id)` 时，React hook执行该分支。
        if (hasPermissionCallback(parsed.request_id)) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Processing permission response for ${parsed.request_id}: ${parsed.subtype}`,
          )

          // 当 `parsed.subtype` 匹配 `'success'` 时，React hook执行对应分支。
          if (parsed.subtype === 'success') {
            // 调用 processMailboxPermissionResponse，触发React hook此处需要的副作用。
            processMailboxPermissionResponse({
              requestId: parsed.request_id,
              decision: 'approved',
              updatedInput: parsed.response?.updated_input,
              permissionUpdates: parsed.response?.permission_updates,
            })
          } else {
            // 调用 processMailboxPermissionResponse，触发React hook此处需要的副作用。
            processMailboxPermissionResponse({
              requestId: parsed.request_id,
              decision: 'rejected',
              feedback: parsed.error,
            })
          }
        }
      }
    }

    // Handle sandbox permission requests (leader side) - add to workerSandboxPermissions queue
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      sandboxPermissionRequests.length > 0 &&
      isTeamLead(currentAppState.teamContext)
    ) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${sandboxPermissionRequests.length} sandbox permission request(s)`,
      )

      // newSandboxRequests 请求数据 先占位，稍后的条件分支会根据实际输入补齐它。
      const newSandboxRequests: Array<{
        requestId: string
        workerId: string
        workerName: string
        workerColor?: string
        host: string
        createdAt: number
      }> = []

      // 按顺序遍历 `sandboxPermissionRequests` 中的m，逐个交给React hook处理。
      for (const m of sandboxPermissionRequests) {
        // 解析结果保存`isSandboxPermissionRequest`，供React hook后续处理使用。
        const parsed = isSandboxPermissionRequest(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) continue

        // Validate required nested fields to prevent crashes from malformed messages
        // 满足 `!parsed.hostPattern?.host` 时，React hook执行该分支。
        if (!parsed.hostPattern?.host) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Invalid sandbox permission request: missing hostPattern.host`,
          )
          // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
          continue
        }

        // newSandboxRequests 请求数据追加新条目，保持收集顺序与输入顺序一致。
        newSandboxRequests.push({
          requestId: parsed.requestId,
          workerId: parsed.workerId,
          workerName: parsed.workerName,
          workerColor: parsed.workerColor,
          host: parsed.hostPattern.host,
          createdAt: parsed.createdAt,
        })
      }

      // 满足 `newSandboxRequests.length > 0` 时，React hook执行该分支。
      if (newSandboxRequests.length > 0) {
        // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          workerSandboxPermissions: {
            ...prev.workerSandboxPermissions,
            queue: [
              ...prev.workerSandboxPermissions.queue,
              ...newSandboxRequests,
            ],
          },
        }))

        // Send desktop notification for the first new request
        // firstRequest 请求数据 命名 `newSandboxRequests[0]`，让后续代码直接表达这个值的用途。
        const firstRequest = newSandboxRequests[0]
        // 组合条件 `firstRequest && !isLoading && !focusedInputDialog` 成立时，React hook 状态流才启用这条专门路径。
        if (firstRequest && !isLoading && !focusedInputDialog) {
          // 显式忽略 `sendNotification(` 的返回值，只保留它触发的副作用。
          void sendNotification(
            {
              message: `${firstRequest.workerName} needs network access to ${firstRequest.host}`,
              notificationType: 'worker_permission_prompt',
            },
            terminal,
          )
        }
      }
    }

    // Handle sandbox permission responses (worker side) - invoke registered callbacks
    // 组合条件 `sandboxPermissionResponses.length > 0 && isTeammate()` 成立时，React hook 状态流才启用这条专门路径。
    if (sandboxPermissionResponses.length > 0 && isTeammate()) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${sandboxPermissionResponses.length} sandbox permission response(s)`,
      )

      // 按顺序遍历 `sandboxPermissionResponses` 中的m，逐个交给React hook处理。
      for (const m of sandboxPermissionResponses) {
        // 解析结果保存`isSandboxPermissionResponse`，供React hook后续处理使用。
        const parsed = isSandboxPermissionResponse(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) continue

        // Check if we have a registered callback for this request
        // 满足 `hasSandboxPermissionCallback(parsed.requestId)` 时，React hook执行该分支。
        if (hasSandboxPermissionCallback(parsed.requestId)) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Processing sandbox permission response for ${parsed.requestId}: allow=${parsed.allow}`,
          )

          // Process the response using the exported function
          // 调用 processSandboxPermissionResponse，触发React hook此处需要的副作用。
          processSandboxPermissionResponse({
            requestId: parsed.requestId,
            host: parsed.host,
            allow: parsed.allow,
          })

          // Clear the pending sandbox request indicator
          // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setAppState(prev => ({
            ...prev,
            pendingSandboxRequest: null,
          }))
        }
      }
    }

    // Handle team permission updates (teammate side) - apply permission to context
    // 组合条件 `teamPermissionUpdates.length > 0 && isTeammate()` 成立时，React hook 状态流才启用这条专门路径。
    if (teamPermissionUpdates.length > 0 && isTeammate()) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${teamPermissionUpdates.length} team permission update(s)`,
      )

      // 按顺序遍历 `teamPermissionUpdates` 中的m，逐个交给React hook处理。
      for (const m of teamPermissionUpdates) {
        // 解析结果保存`isTeamPermissionUpdate`，供React hook后续处理使用。
        const parsed = isTeamPermissionUpdate(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Failed to parse team permission update: ${m.text.substring(0, 100)}`,
          )
          // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
          continue
        }

        // Validate required nested fields to prevent crashes from malformed messages
        // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
        if (
          !parsed.permissionUpdate?.rules ||
          !parsed.permissionUpdate?.behavior
        ) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Invalid team permission update: missing permissionUpdate.rules or permissionUpdate.behavior`,
          )
          // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
          continue
        }

        // Apply the permission update to the teammate's context
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[InboxPoller] Applying team permission update: ${parsed.toolName} allowed in ${parsed.directoryPath}`,
        )
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[InboxPoller] Permission update rules: ${jsonStringify(parsed.permissionUpdate.rules)}`,
        )

        // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAppState(prev => {
          // updated保存`applyPermissionUpdate`，供React hook后续处理使用。
          const updated = applyPermissionUpdate(prev.toolPermissionContext, {
            type: 'addRules',
            rules: parsed.permissionUpdate.rules,
            behavior: parsed.permissionUpdate.behavior,
            destination: 'session',
          })
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Updated session allow rules: ${jsonStringify(updated.alwaysAllowRules.session)}`,
          )
          // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
          return {
            ...prev,
            toolPermissionContext: updated,
          }
        })
      }
    }

    // Handle mode set requests (teammate side) - team lead changing teammate's mode
    // 组合条件 `modeSetRequests.length > 0 && isTeammate()` 成立时，React hook 状态流才启用这条专门路径。
    if (modeSetRequests.length > 0 && isTeammate()) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${modeSetRequests.length} mode set request(s)`,
      )

      // 按顺序遍历 `modeSetRequests` 中的m，逐个交给React hook处理。
      for (const m of modeSetRequests) {
        // Only accept mode changes from team-lead
        // `m.from` 与 `'team-lead'` 不一致时刷新派生状态，避免使用过期结果。
        if (m.from !== 'team-lead') {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Ignoring mode set request from non-team-lead: ${m.from}`,
          )
          // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
          continue
        }

        // 解析结果保存`isModeSetRequest`，供React hook后续处理使用。
        const parsed = isModeSetRequest(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[InboxPoller] Failed to parse mode set request: ${m.text.substring(0, 100)}`,
          )
          // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
          continue
        }

        // targetMode保存`permissionModeFromString`，供React hook后续处理使用。
        const targetMode = permissionModeFromString(parsed.mode)
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[InboxPoller] Applying mode change from team-lead: ${targetMode}`,
        )

        // Update local permission context
        // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          toolPermissionContext: applyPermissionUpdate(
            prev.toolPermissionContext,
            {
              type: 'setMode',
              mode: toExternalPermissionMode(targetMode),
              destination: 'session',
            },
          ),
        }))

        // Update config.json so team lead can see the new mode
        // teamName保存`currentAppState.teamContext?.teamName`，供React hook use Inbox ...后续判断或输出使用。
        const teamName = currentAppState.teamContext?.teamName
        // agentName读取`getAgentName`，供React hook后续处理使用。
        const agentName = getAgentName()
        // 组合条件 `teamName && agentName` 成立时，React hook 状态流才启用这条专门路径。
        if (teamName && agentName) {
          // setMemberMode 写入新的状态值，使React hook 状态流后续读取保持一致。
          setMemberMode(teamName, agentName, targetMode)
        }
      }
    }

    // Handle plan approval requests (leader side) - auto-approve and write response to teammate inbox
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      planApprovalRequests.length > 0 &&
      isTeamLead(currentAppState.teamContext)
    ) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${planApprovalRequests.length} plan approval request(s), auto-approving`,
      )

      // teamName保存`currentAppState.teamContext?.teamName`，供React hook use Inbox ...后续判断或输出使用。
      const teamName = currentAppState.teamContext?.teamName
      // leaderExternalMode保存`toExternalPermissionMode`，供React hook后续处理使用。
      const leaderExternalMode = toExternalPermissionMode(
        currentAppState.toolPermissionContext.mode,
      )
      // modeToInherit 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const modeToInherit =
        leaderExternalMode === 'plan' ? 'default' : leaderExternalMode

      // 按顺序遍历 `planApprovalRequests` 中的m，逐个交给React hook处理。
      for (const m of planApprovalRequests) {
        // 解析结果保存`isPlanApprovalRequest`，供React hook后续处理使用。
        const parsed = isPlanApprovalRequest(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) continue

        // Write approval response to teammate's inbox
        // approvalResponse 响应数据 集中保存React hook use Inbox ...要一起传递的字段。
        const approvalResponse = {
          type: 'plan_approval_response',
          requestId: parsed.requestId,
          approved: true,
          timestamp: new Date().toISOString(),
          permissionMode: modeToInherit,
        }

        // 显式忽略 `writeToMailbox(` 的返回值，只保留它触发的副作用。
        void writeToMailbox(
          m.from,
          {
            from: TEAM_LEAD_NAME,
            text: jsonStringify(approvalResponse),
            timestamp: new Date().toISOString(),
          },
          teamName,
        )

        // Update in-process teammate task state if applicable
        // taskId筛选`findInProcessTeammateTaskId`，供React hook后续处理使用。
        const taskId = findInProcessTeammateTaskId(m.from, currentAppState)
        // 满足 `taskId` 时，React hook执行该分支。
        if (taskId) {
          // 调用 handlePlanApprovalResponse，触发React hook此处需要的副作用。
          handlePlanApprovalResponse(
            taskId,
            {
              type: 'plan_approval_response',
              requestId: parsed.requestId,
              approved: true,
              timestamp: new Date().toISOString(),
              permissionMode: modeToInherit,
            },
            setAppState,
          )
        }

        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[InboxPoller] Auto-approved plan from ${m.from} (request ${parsed.requestId})`,
        )

        // Still pass through as a regular message so the model has context
        // about what the teammate is doing, but the approval is already sent
        // regularMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        regularMessages.push(m)
      }
    }

    // Handle shutdown requests (teammate side) - preserve JSON for UI rendering
    // 组合条件 `shutdownRequests.length > 0 && isTeammate()` 成立时，React hook 状态流才启用这条专门路径。
    if (shutdownRequests.length > 0 && isTeammate()) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${shutdownRequests.length} shutdown request(s)`,
      )

      // Pass through shutdown requests - the UI component will render them nicely
      // and the model will receive instructions via the tool prompt documentation
      // 按顺序遍历 `shutdownRequests` 中的m，逐个交给React hook处理。
      for (const m of shutdownRequests) {
        // regularMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        regularMessages.push(m)
      }
    }

    // Handle shutdown approvals (leader side) - kill the teammate's pane
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      shutdownApprovals.length > 0 &&
      isTeamLead(currentAppState.teamContext)
    ) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Found ${shutdownApprovals.length} shutdown approval(s)`,
      )

      // 按顺序遍历 `shutdownApprovals` 中的m，逐个交给React hook处理。
      for (const m of shutdownApprovals) {
        // 解析结果保存`isShutdownApproved`，供React hook后续处理使用。
        const parsed = isShutdownApproved(m.text)
        // 解析结果缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!parsed) continue

        // Kill the pane if we have the info (pane-based teammates)
        // 组合条件 `parsed.paneId && parsed.backendType` 成立时，React hook 状态流才启用这条专门路径。
        if (parsed.paneId && parsed.backendType) {
          // 调用 void，触发React hook此处需要的副作用。
          void (async () => {
            // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
            try {
              // Ensure backend classes are imported (no subprocess probes)
              // 等待 `ensureBackendsRegistered()` 完成，再继续React hook use Inbox Poller的异步流程。
              await ensureBackendsRegistered()
              // insideTmux保存`isInsideTmux`，供React hook后续处理使用。
              const insideTmux = await isInsideTmux()
              // backend读取`getBackendByType`，供React hook后续处理使用。
              const backend = getBackendByType(
                parsed.backendType as PaneBackendType,
              )
              // success 集合保存`killPane`，供React hook后续处理使用。
              const success = await backend?.killPane(
                parsed.paneId!,
                !insideTmux,
              )
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[InboxPoller] Killed pane ${parsed.paneId} for ${parsed.from}: ${success}`,
              )
            } catch (error) {
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[InboxPoller] Failed to kill pane for ${parsed.from}: ${error}`,
              )
            }
          })()
        }

        // Remove the teammate from teamContext.teammates so the count is accurate
        // teammateToRemove解析`parsed.from`，供后续判断或组装使用。
        const teammateToRemove = parsed.from
        // 组合条件 `teammateToRemove && currentAppState.teamContext?.` 成立时，React hook 状态流才启用这条专门路径。
        if (teammateToRemove && currentAppState.teamContext?.teammates) {
          // Find the teammate ID by name
          // teammateId派生`Object.entries`，供React hook后续处理使用。
          const teammateId = Object.entries(
            currentAppState.teamContext.teammates,
          // 这个回调绑定到 ).find(([, t]) => t.name === teammateToRemove)?.[0]，负责React hook 状态流在该局部场景下的响应。
          ).find(([, t]) => t.name === teammateToRemove)?.[0]

          // 满足 `teammateId` 时，React hook执行该分支。
          if (teammateId) {
            // Remove from team file (leader owns team file mutations)
            // teamName保存`currentAppState.teamContext?.teamName`，供React hook use Inbox ...后续判断或输出使用。
            const teamName = currentAppState.teamContext?.teamName
            // 满足 `teamName` 时，React hook执行该分支。
            if (teamName) {
              // 调用 removeTeammateFromTeamFile，触发React hook此处需要的副作用。
              removeTeammateFromTeamFile(teamName, {
                agentId: teammateId,
                name: teammateToRemove,
              })
            }

            // Unassign tasks and build notification message
            // 从 `teamName` 解构 notificationMessage，减少React hook use Inbox Poller对同一对象的重复访问。
            const { notificationMessage } = teamName
              ? await unassignTeammateTasks(
                  teamName,
                  teammateId,
                  teammateToRemove,
                  'shutdown',
                )
              : { notificationMessage: `${teammateToRemove} has shut down.` }

            // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
            setAppState(prev => {
              // 满足 `!prev.teamContext?.teammates` 时，React hook执行该分支。
              if (!prev.teamContext?.teammates) return prev
              // 满足 `!(teammateId in prev.teamContext.teammates)` 时，React hook执行该分支。
              if (!(teammateId in prev.teamContext.teammates)) return prev
              // React hook use Inbox Poller先整理这一处局部数据，后续分支可以直接读取。
              const { [teammateId]: _, ...remainingTeammates } =
                prev.teamContext.teammates

              // Mark the teammate's task as completed so hasRunningTeammates
              // becomes false and the spinner stops. Without this, out-of-process
              // (tmux) teammate tasks stay status:'running' forever because
              // only in-process teammates have a runner that sets 'completed'.
              // updatedTasks 集合 集中保存React hook use Inbox ...要一起传递的字段。
              const updatedTasks = { ...prev.tasks }
              // 循环处理 `const [tid, task] of Object.entries(updatedTasks)`，让React hook 状态流把同类条目按顺序走完。
              for (const [tid, task] of Object.entries(updatedTasks)) {
                // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
                if (
                  isInProcessTeammateTask(task) &&
                  task.identity.agentId === teammateId
                ) {
                  // updatedTasks[tid更新为 `{`，确保React hook use Inbox Poller后续读取最新状态。
                  updatedTasks[tid] = {
                    ...task,
                    status: 'completed' as const,
                    endTime: Date.now(),
                  }
                }
              }

              // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
              return {
                ...prev,
                tasks: updatedTasks,
                teamContext: {
                  ...prev.teamContext,
                  teammates: remainingTeammates,
                },
                inbox: {
                  messages: [
                    ...prev.inbox.messages,
                    {
                      id: randomUUID(),
                      from: 'system',
                      text: jsonStringify({
                        type: 'teammate_terminated',
                        message: notificationMessage,
                      }),
                      timestamp: new Date().toISOString(),
                      status: 'pending' as const,
                    },
                  ],
                },
              }
            })
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[InboxPoller] Removed ${teammateToRemove} (${teammateId}) from teamContext`,
            )
          }
        }

        // Pass through for UI rendering - the component will render it nicely
        // regularMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        regularMessages.push(m)
      }
    }

    // Process regular teammate messages (existing logic)
    // regularMessages 消息数据为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (regularMessages.length === 0) {
      // No regular messages, but we may have processed non-regular messages
      // (permissions, shutdown requests, etc.) above — mark those as read.
      // 调用 markRead，触发React hook此处需要的副作用。
      markRead()
      // React hook use Inbox Poller在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Format messages with XML wrapper for Claude (include color if available)
    // Transform plan approval requests to include instructions for Claude
    // formatted保存`regularMessages`，供后续判断或组装使用。
    const formatted = regularMessages
      // 链式调用 map，继续加工上一行在React hook 状态流中产生的数据。
      .map(m => {
        // colorAttr 命名 `m.color ? ` color="${m.color}"` : ''`，让后续代码直接表达这个值的用途。
        const colorAttr = m.color ? ` color="${m.color}"` : ''
        // summaryAttr 命名 `m.summary ? ` summary="${m.summary}"` : ''`，让后续代码直接表达这个值的用途。
        const summaryAttr = m.summary ? ` summary="${m.summary}"` : ''
        // messageContent 消息数据保存`m.text`，供后续判断或组装使用。
        const messageContent = m.text

        // 返回 ``<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${colorAttr}${summaryA...`，作为React hook 状态流这次计算的结果。
        return `<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${colorAttr}${summaryAttr}>\n${messageContent}\n</${TEAMMATE_MESSAGE_TAG}>`
      })
      .join('\n\n')

    // Helper to queue messages in AppState for later delivery
    // queueMessages 消息数据封装成回调，供React hook use Inbox ...在事件触发或异步步骤中调用。
    const queueMessages = () => {
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        inbox: {
          messages: [
            ...prev.inbox.messages,
            // 链式调用 链式方法，继续加工上一行在React hook 状态流中产生的数据。
            ...regularMessages.map(m => ({
              id: randomUUID(),
              from: m.from,
              text: m.text,
              timestamp: m.timestamp,
              status: 'pending' as const,
              color: m.color,
              summary: m.summary,
            })),
          ],
        },
      }))
    }

    // 组合条件 `!isLoading && !focusedInputDialog` 成立时，React hook 状态流才启用这条专门路径。
    if (!isLoading && !focusedInputDialog) {
      // IDLE: Submit as new turn immediately
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[InboxPoller] Session idle, submitting immediately`)
      // submitted保存`onSubmitTeammateMessage`，供React hook后续处理使用。
      const submitted = onSubmitTeammateMessage(formatted)
      // submitted缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!submitted) {
        // Submission rejected (query already running), queue for later
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[InboxPoller] Submission rejected, queuing for later delivery`,
        )
        // 调用 queueMessages，触发React hook此处需要的副作用。
        queueMessages()
      }
    } else {
      // BUSY: Add to inbox queue for UI display + later delivery
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[InboxPoller] Session busy, queuing for later delivery`)
      // 调用 queueMessages，触发React hook此处需要的副作用。
      queueMessages()
    }

    // Mark messages as read only after they have been successfully delivered
    // or reliably queued in AppState. This prevents permanent message loss
    // when the session is busy — if we crash before this point, the messages
    // will be re-read on the next poll cycle instead of being silently dropped.
    // 调用 markRead，触发React hook此处需要的副作用。
    markRead()
  }, [
    enabled,
    isLoading,
    focusedInputDialog,
    onSubmitTeammateMessage,
    setAppState,
    terminal,
    store,
  ])

  // When session becomes idle, deliver any pending messages and clean up processed ones
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return

    // Skip if busy or in a dialog
    // 组合条件 `isLoading || focusedInputDialog` 成立时，React hook 状态流才启用这条专门路径。
    if (isLoading || focusedInputDialog) {
      // React hook use Inbox Poller在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Use ref to avoid dependency on appState object (prevents infinite loop)
    // currentAppState 状态读取`store.getState`，供React hook后续处理使用。
    const currentAppState = store.getState()
    // agentName读取`getAgentNameToPoll`，供React hook后续处理使用。
    const agentName = getAgentNameToPoll(currentAppState)
    // agentName缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!agentName) return

    // pendingMessages 消息数据筛选`messages.filter`，供React hook后续处理使用。
    const pendingMessages = currentAppState.inbox.messages.filter(
      // m更新为 `> m.status === 'pending'`，确保useInboxPoller后续读取最新状态。
      m => m.status === 'pending',
    )
    // processedMessages 消息数据筛选`messages.filter`，供React hook后续处理使用。
    const processedMessages = currentAppState.inbox.messages.filter(
      // m更新为 `> m.status === 'processed'`，确保useInboxPoller后续读取最新状态。
      m => m.status === 'processed',
    )

    // Clean up processed messages (they were already delivered mid-turn as attachments)
    // 满足 `processedMessages.length > 0` 时，React hook执行该分支。
    if (processedMessages.length > 0) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Cleaning up ${processedMessages.length} processed message(s) that were delivered mid-turn`,
      )
      // processedIds 集合保存`Set`，供React hook后续处理使用。
      const processedIds = new Set(processedMessages.map(m => m.id))
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        inbox: {
          // 这个回调绑定到 messages: prev.inbox.messages.filter(m => !processedIds.has(m.id)),，负责React hook 状态流在该局部场景下的响应。
          messages: prev.inbox.messages.filter(m => !processedIds.has(m.id)),
        },
      }))
    }

    // No pending messages to deliver
    // pendingMessages 消息数据为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (pendingMessages.length === 0) return

    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[InboxPoller] Session idle, delivering ${pendingMessages.length} pending message(s)`,
    )

    // Format messages with XML wrapper for Claude (include color if available)
    // formatted保存`pendingMessages`，供React hook use Inbox ...后续判断或输出使用。
    const formatted = pendingMessages
      // 链式调用 map，继续加工上一行在React hook 状态流中产生的数据。
      .map(m => {
        // colorAttr 命名 `m.color ? ` color="${m.color}"` : ''`，让后续代码直接表达这个值的用途。
        const colorAttr = m.color ? ` color="${m.color}"` : ''
        // summaryAttr 命名 `m.summary ? ` summary="${m.summary}"` : ''`，让后续代码直接表达这个值的用途。
        const summaryAttr = m.summary ? ` summary="${m.summary}"` : ''
        // 返回 ``<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${colorAttr}${summaryA...`，作为React hook 状态流这次计算的结果。
        return `<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${colorAttr}${summaryAttr}>\n${m.text}\n</${TEAMMATE_MESSAGE_TAG}>`
      })
      .join('\n\n')

    // Try to submit - only clear messages if successful
    // submitted保存`onSubmitTeammateMessage`，供React hook后续处理使用。
    const submitted = onSubmitTeammateMessage(formatted)
    // 满足 `submitted` 时，React hook执行该分支。
    if (submitted) {
      // Clear the specific messages we just submitted by their IDs
      // submittedIds 集合保存`Set`，供React hook后续处理使用。
      const submittedIds = new Set(pendingMessages.map(m => m.id))
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        inbox: {
          // 这个回调绑定到 messages: prev.inbox.messages.filter(m => !submittedIds.has(m.id)),，负责React hook 状态流在该局部场景下的响应。
          messages: prev.inbox.messages.filter(m => !submittedIds.has(m.id)),
        },
      }))
    } else {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InboxPoller] Submission rejected, keeping messages queued`,
      )
    }
  }, [
    enabled,
    isLoading,
    focusedInputDialog,
    onSubmitTeammateMessage,
    setAppState,
    inboxMessageCount,
    store,
  ])

  // Poll if running as a teammate or as a team lead
  // shouldPoll记录 `getAgentNameToPoll` 是否成立，React hook随后按该结果分支。
  const shouldPoll = enabled && !!getAgentNameToPoll(store.getState())
  // 调用 useInterval，触发React hook此处需要的副作用。
  useInterval(() => void poll(), shouldPoll ? INBOX_POLL_INTERVAL_MS : null)

  // Initial poll on mount (only once)
  // hasDoneInitialPollRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasDoneInitialPollRef = useRef(false)
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return
    // 满足 `hasDoneInitialPollRef.current` 时，React hook执行该分支。
    if (hasDoneInitialPollRef.current) return
    // Use store.getState() to avoid dependency on appState object
    // 满足 `getAgentNameToPoll(store.getState())` 时，React hook执行该分支。
    if (getAgentNameToPoll(store.getState())) {
      // current更新为 `true`，确保useInboxPoller后续读取最新状态。
      hasDoneInitialPollRef.current = true
      // 显式忽略 `poll()` 的返回值，只保留它触发的副作用。
      void poll()
    }
    // Note: poll uses store.getState() (not appState) so it won't re-run on appState changes
    // The ref guard is a safety measure to ensure initial poll only happens once
  }, [enabled, poll, store])
}
