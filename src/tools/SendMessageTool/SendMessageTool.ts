// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 isReplBridgeActive，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { isReplBridgeActive } from '../../bootstrap/state.js'
// 引入 getReplBridgeHandle，将 ../../bridge/replBridgeHandle.js 中已经封装好的能力接到本文件流程里。
import { getReplBridgeHandle } from '../../bridge/replBridgeHandle.js'
// 类型依赖 { Tool, ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool, ToolUseContext } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 引入 findTeammateTaskByAgentId，将 ../../tasks/InProcessTeammateTask/InProcessTeammateTask.js 中已经封装好的能力接到本文件流程里。
import { findTeammateTaskByAgentId } from '../../tasks/InProcessTeammateTask/InProcessTeammateTask.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  isLocalAgentTask,
  queuePendingMessage,
} from '../../tasks/LocalAgentTask/LocalAgentTask.js'
// 引入 isMainSessionTask，将 ../../tasks/LocalMainSessionTask.js 中已经封装好的能力接到本文件流程里。
import { isMainSessionTask } from '../../tasks/LocalMainSessionTask.js'
// 引入 toAgentId，将 ../../types/ids.js 中已经封装好的能力接到本文件流程里。
import { toAgentId } from '../../types/ids.js'
// 复用 generateRequestId 工具函数，把通用处理留在 ../../utils/agentId.js 中维护。
import { generateRequestId } from '../../utils/agentId.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js'
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../../utils/gracefulShutdown.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 parseAddress 工具函数，把通用处理留在 ../../utils/peerAddress.js 中维护。
import { parseAddress } from '../../utils/peerAddress.js'
// 复用 semanticBoolean 工具函数，把通用处理留在 ../../utils/semanticBoolean.js 中维护。
import { semanticBoolean } from '../../utils/semanticBoolean.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 类型依赖 { BackendType } 来自 ../../utils/swarm/backends/types.js，用于校准工具调用的数据契约。
import type { BackendType } from '../../utils/swarm/backends/types.js'
// 复用 TEAM_LEAD_NAME 工具函数，把通用处理留在 ../../utils/swarm/constants.js 中维护。
import { TEAM_LEAD_NAME } from '../../utils/swarm/constants.js'
// 复用 readTeamFileAsync 工具函数，把通用处理留在 ../../utils/swarm/teamHelpers.js 中维护。
import { readTeamFileAsync } from '../../utils/swarm/teamHelpers.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getAgentId,
  getAgentName,
  getTeammateColor,
  getTeamName,
  isTeamLead,
  isTeammate,
} from '../../utils/teammate.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  createShutdownApprovedMessage,
  createShutdownRejectedMessage,
  createShutdownRequestMessage,
  writeToMailbox,
} from '../../utils/teammateMailbox.js'
// 引入 resumeAgentBackground，将 ../AgentTool/resumeAgent.js 中已经封装好的能力接到本文件流程里。
import { resumeAgentBackground } from '../AgentTool/resumeAgent.js'
// 引入 SEND_MESSAGE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { SEND_MESSAGE_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、getPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, getPrompt } from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// StructuredMessage 消息数据保存`lazySchema`，供工具调用后续处理使用。
const StructuredMessage = lazySchema(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('shutdown_request'),
      reason: z.string().optional(),
    }),
    z.object({
      type: z.literal('shutdown_response'),
      request_id: z.string(),
      approve: semanticBoolean(),
      reason: z.string().optional(),
    }),
    z.object({
      type: z.literal('plan_approval_response'),
      request_id: z.string(),
      approve: semanticBoolean(),
      feedback: z.string().optional(),
    }),
  ]),
)

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.object({
    to: z
      .string()
      .describe(
        feature('UDS_INBOX')
          ? 'Recipient: teammate name, "*" for broadcast, "uds:<socket-path>" for a local peer, or "bridge:<session-id>" for a Remote Control peer (use ListPeers to discover)'
          : 'Recipient: teammate name, or "*" for broadcast to all teammates',
      ),
    summary: z
      .string()
      .optional()
      .describe(
        'A 5-10 word summary shown as a preview in the UI (required when message is a string)',
      ),
    message: z.union([
      z.string().describe('Plain text message content'),
      StructuredMessage(),
    ]),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<InputSchema>

// MessageRouting 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type MessageRouting = {
  sender: string
  senderColor?: string
  target: string
  targetColor?: string
  summary?: string
  content?: string
}

// MessageOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type MessageOutput = {
  success: boolean
  message: string
  routing?: MessageRouting
}

// BroadcastOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type BroadcastOutput = {
  success: boolean
  message: string
  recipients: string[]
  routing?: MessageRouting
}

// RequestOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type RequestOutput = {
  success: boolean
  message: string
  request_id: string
  target: string
}

// ResponseOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResponseOutput = {
  success: boolean
  message: string
  request_id?: string
}

// SendMessageToolOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type SendMessageToolOutput =
  | MessageOutput
  | BroadcastOutput
  | RequestOutput
  | ResponseOutput

// findTeammateColor 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findTeammateColor(
  appState: {
    teamContext?: { teammates: { [id: string]: { color?: string } } }
  },
  name: string,
): string | undefined {
  // teammates 集合 命名 `appState.teamContext?.teammates`，让后续代码直接表达这个值的用途。
  const teammates = appState.teamContext?.teammates
  // teammates 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teammates) return undefined
  // 逐项读取 `Object.values(teammates)` 中的teammate，按输入顺序推进工具调用。
  for (const teammate of Object.values(teammates)) {
    // 只有 `'name' in teammate && (teammate as { name: string }).name === name` 满足时，工具调用才执行该分支。
    if ('name' in teammate && (teammate as { name: string }).name === name) {
      // 返回 `teammate.color`，作为工具调用这次计算的结果。
      return teammate.color
    }
  }
  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

// handleMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleMessage(
  recipientName: string,
  content: string,
  summary: string | undefined,
  context: ToolUseContext,
): Promise<{ data: MessageOutput }> {
  // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
  const appState = context.getAppState()
  // teamName读取`getTeamName`，供工具调用后续处理使用。
  const teamName = getTeamName(appState.teamContext)
  // senderName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const senderName =
    getAgentName() || (isTeammate() ? 'teammate' : TEAM_LEAD_NAME)
  // senderColor读取`getTeammateColor`，供工具调用后续处理使用。
  const senderColor = getTeammateColor()

  // 等待 `writeToMailbox(` 完成，再继续工具实现 Send Message Tool的异步流程。
  await writeToMailbox(
    recipientName,
    {
      from: senderName,
      text: content,
      summary,
      timestamp: new Date().toISOString(),
      color: senderColor,
    },
    teamName,
  )

  // recipientColor筛选`findTeammateColor`，供工具调用后续处理使用。
  const recipientColor = findTeammateColor(appState, recipientName)

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      success: true,
      message: `Message sent to ${recipientName}'s inbox`,
      routing: {
        sender: senderName,
        senderColor,
        target: `@${recipientName}`,
        targetColor: recipientColor,
        summary,
        content,
      },
    },
  }
}

// handleBroadcast 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleBroadcast(
  content: string,
  summary: string | undefined,
  context: ToolUseContext,
): Promise<{ data: BroadcastOutput }> {
  // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
  const appState = context.getAppState()
  // teamName读取`getTeamName`，供工具调用后续处理使用。
  const teamName = getTeamName(appState.teamContext)

  // teamName缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamName) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'Not in a team context. Create a team with Teammate spawnTeam first, or set CLAUDE_CODE_TEAM_NAME.',
    )
  }

  // teamFile 文件数据读取`readTeamFileAsync`，供工具调用后续处理使用。
  const teamFile = await readTeamFileAsync(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!teamFile) {
    // 抛出 new Error(`Team "${teamName}" does not exist`)，阻止工具调用在无效状态下继续运行。
    throw new Error(`Team "${teamName}" does not exist`)
  }

  // senderName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const senderName =
    getAgentName() || (isTeammate() ? 'teammate' : TEAM_LEAD_NAME)
  // senderName缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!senderName) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'Cannot broadcast: sender name is required. Set CLAUDE_CODE_AGENT_NAME.',
    )
  }

  // senderColor读取`getTeammateColor`，供工具调用后续处理使用。
  const senderColor = getTeammateColor()

  // recipients 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const recipients: string[] = []
  // 按顺序遍历 `teamFile.members` 中的member，逐个交给工具调用处理。
  for (const member of teamFile.members) {
    // 满足 `member.name.toLowerCase() === senderName.toLowerCase()` 时，工具调用执行该分支。
    if (member.name.toLowerCase() === senderName.toLowerCase()) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // recipients 集合追加新条目，保持收集顺序与输入顺序一致。
    recipients.push(member.name)
  }

  // recipients 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (recipients.length === 0) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        success: true,
        message: 'No teammates to broadcast to (you are the only team member)',
        recipients: [],
      },
    }
  }

  // 按顺序遍历 `recipients` 中的recipientName，逐个交给工具调用处理。
  for (const recipientName of recipients) {
    // 等待 `writeToMailbox(` 完成，再继续工具实现 Send Message Tool的异步流程。
    await writeToMailbox(
      recipientName,
      {
        from: senderName,
        text: content,
        summary,
        timestamp: new Date().toISOString(),
        color: senderColor,
      },
      teamName,
    )
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      success: true,
      message: `Message broadcast to ${recipients.length} teammate(s): ${recipients.join(', ')}`,
      recipients,
      routing: {
        sender: senderName,
        senderColor,
        target: '@team',
        summary,
        content,
      },
    },
  }
}

// handleShutdownRequest 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleShutdownRequest(
  targetName: string,
  reason: string | undefined,
  context: ToolUseContext,
): Promise<{ data: RequestOutput }> {
  // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
  const appState = context.getAppState()
  // teamName读取`getTeamName`，供工具调用后续处理使用。
  const teamName = getTeamName(appState.teamContext)
  // senderName读取`getAgentName`，供工具调用后续处理使用。
  const senderName = getAgentName() || TEAM_LEAD_NAME
  // requestId 请求数据保存`generateRequestId`，供工具调用后续处理使用。
  const requestId = generateRequestId('shutdown', targetName)

  // shutdownMessage 消息数据构建`createShutdownRequestMessage`，供工具调用后续处理使用。
  const shutdownMessage = createShutdownRequestMessage({
    requestId,
    from: senderName,
    reason,
  })

  // 等待 `writeToMailbox(` 完成，再继续工具实现 Send Message Tool的异步流程。
  await writeToMailbox(
    targetName,
    {
      from: senderName,
      text: jsonStringify(shutdownMessage),
      timestamp: new Date().toISOString(),
      color: getTeammateColor(),
    },
    teamName,
  )

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      success: true,
      message: `Shutdown request sent to ${targetName}. Request ID: ${requestId}`,
      request_id: requestId,
      target: targetName,
    },
  }
}

// handleShutdownApproval 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleShutdownApproval(
  requestId: string,
  context: ToolUseContext,
): Promise<{ data: ResponseOutput }> {
  // teamName读取`getTeamName`，供工具调用后续处理使用。
  const teamName = getTeamName()
  // agentId读取`getAgentId`，供工具调用后续处理使用。
  const agentId = getAgentId()
  // agentName读取`getAgentName`，供工具调用后续处理使用。
  const agentName = getAgentName() || 'teammate'

  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SendMessageTool] handleShutdownApproval: teamName=${teamName}, agentId=${agentId}, agentName=${agentName}`,
  )

  // ownPaneId 先占位，稍后的条件分支会根据实际输入补齐它。
  let ownPaneId: string | undefined
  // ownBackendType 先占位，稍后的条件分支会根据实际输入补齐它。
  let ownBackendType: BackendType | undefined
  // 满足 `teamName` 时，工具调用执行该分支。
  if (teamName) {
    // teamFile 文件数据读取`readTeamFileAsync`，供工具调用后续处理使用。
    const teamFile = await readTeamFileAsync(teamName)
    // 只有 `teamFile && agentId` 满足时，工具调用才执行该分支。
    if (teamFile && agentId) {
      // selfMember筛选`members.find`，供工具调用后续处理使用。
      const selfMember = teamFile.members.find(m => m.agentId === agentId)
      // 满足 `selfMember` 时，工具调用执行该分支。
      if (selfMember) {
        // ownPaneId更新为 `selfMember.tmuxPaneId`，确保工具调用后续读取最新状态。
        ownPaneId = selfMember.tmuxPaneId
        // ownBackendType更新为 `selfMember.backendType`，确保工具调用后续读取最新状态。
        ownBackendType = selfMember.backendType
      }
    }
  }

  // approvedMessage 消息数据构建`createShutdownApprovedMessage`，供工具调用后续处理使用。
  const approvedMessage = createShutdownApprovedMessage({
    requestId,
    from: agentName,
    paneId: ownPaneId,
    backendType: ownBackendType,
  })

  // 等待 `writeToMailbox(` 完成，再继续工具实现 Send Message Tool的异步流程。
  await writeToMailbox(
    TEAM_LEAD_NAME,
    {
      from: agentName,
      text: jsonStringify(approvedMessage),
      timestamp: new Date().toISOString(),
      color: getTeammateColor(),
    },
    teamName,
  )

  // 当 `ownBackendType` 匹配 `'in-process'` 时，工具调用执行对应分支。
  if (ownBackendType === 'in-process') {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SendMessageTool] In-process teammate ${agentName} approving shutdown - signaling abort`,
    )

    // 满足 `agentId` 时，工具调用执行该分支。
    if (agentId) {
      // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
      const appState = context.getAppState()
      // task筛选`findTeammateTaskByAgentId`，供工具调用后续处理使用。
      const task = findTeammateTaskByAgentId(agentId, appState.tasks)
      // 满足 `task?.abortController` 时，工具调用执行该分支。
      if (task?.abortController) {
        // 触发取消信号，通知工具调用中仍在等待的异步任务尽快停止。
        task.abortController.abort()
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SendMessageTool] Aborted controller for in-process teammate ${agentName}`,
        )
      } else {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SendMessageTool] Warning: Could not find task/abortController for ${agentName}`,
        )
      }
    }
  } else {
    // 满足 `agentId` 时，工具调用执行该分支。
    if (agentId) {
      // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
      const appState = context.getAppState()
      // task筛选`findTeammateTaskByAgentId`，供工具调用后续处理使用。
      const task = findTeammateTaskByAgentId(agentId, appState.tasks)
      // 满足 `task?.abortController` 时，工具调用执行该分支。
      if (task?.abortController) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SendMessageTool] Fallback: Found in-process task for ${agentName} via AppState, aborting`,
        )
        // 触发取消信号，通知工具调用中仍在等待的异步任务尽快停止。
        task.abortController.abort()

        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: true,
            message: `Shutdown approved (fallback path). Agent ${agentName} is now exiting.`,
            request_id: requestId,
          },
        }
      }
    }

    // setImmediate 写入新的状态值，使工具调用后续读取保持一致。
    setImmediate(async () => {
      // 等待 `gracefulShutdown(0, 'other')` 完成，再继续工具实现 Send Message Tool的异步流程。
      await gracefulShutdown(0, 'other')
    })
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      success: true,
      message: `Shutdown approved. Sent confirmation to team-lead. Agent ${agentName} is now exiting.`,
      request_id: requestId,
    },
  }
}

// handleShutdownRejection 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleShutdownRejection(
  requestId: string,
  reason: string,
): Promise<{ data: ResponseOutput }> {
  // teamName读取`getTeamName`，供工具调用后续处理使用。
  const teamName = getTeamName()
  // agentName读取`getAgentName`，供工具调用后续处理使用。
  const agentName = getAgentName() || 'teammate'

  // rejectedMessage 消息数据构建`createShutdownRejectedMessage`，供工具调用后续处理使用。
  const rejectedMessage = createShutdownRejectedMessage({
    requestId,
    from: agentName,
    reason,
  })

  // 等待 `writeToMailbox(` 完成，再继续工具实现 Send Message Tool的异步流程。
  await writeToMailbox(
    TEAM_LEAD_NAME,
    {
      from: agentName,
      text: jsonStringify(rejectedMessage),
      timestamp: new Date().toISOString(),
      color: getTeammateColor(),
    },
    teamName,
  )

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      success: true,
      message: `Shutdown rejected. Reason: "${reason}". Continuing to work.`,
      request_id: requestId,
    },
  }
}

// handlePlanApproval 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handlePlanApproval(
  recipientName: string,
  requestId: string,
  context: ToolUseContext,
): Promise<{ data: ResponseOutput }> {
  // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
  const appState = context.getAppState()
  // teamName保存`appState.teamContext?.teamName`，供工具实现 Send Message Tool后续判断或输出使用。
  const teamName = appState.teamContext?.teamName

  // 满足 `!isTeamLead(appState.teamContext)` 时，工具调用执行该分支。
  if (!isTeamLead(appState.teamContext)) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'Only the team lead can approve plans. Teammates cannot approve their own or other plans.',
    )
  }

  // leaderMode 命名 `appState.toolPermissionContext.mode`，让后续代码直接表达这个值的用途。
  const leaderMode = appState.toolPermissionContext.mode
  // modeToInherit标记工具实现 Send Message Tool是否启用对应路径。
  const modeToInherit = leaderMode === 'plan' ? 'default' : leaderMode

  // approvalResponse 响应数据集中保存工具实现 Send Message Tool要一起传递的字段。
  const approvalResponse = {
    type: 'plan_approval_response',
    requestId,
    approved: true,
    timestamp: new Date().toISOString(),
    permissionMode: modeToInherit,
  }

  // 等待 `writeToMailbox(` 完成，再继续工具实现 Send Message Tool的异步流程。
  await writeToMailbox(
    recipientName,
    {
      from: TEAM_LEAD_NAME,
      text: jsonStringify(approvalResponse),
      timestamp: new Date().toISOString(),
    },
    teamName,
  )

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      success: true,
      message: `Plan approved for ${recipientName}. They will receive the approval and can proceed with implementation.`,
      request_id: requestId,
    },
  }
}

// handlePlanRejection 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handlePlanRejection(
  recipientName: string,
  requestId: string,
  feedback: string,
  context: ToolUseContext,
): Promise<{ data: ResponseOutput }> {
  // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
  const appState = context.getAppState()
  // teamName保存`appState.teamContext?.teamName`，供工具实现 Send Message Tool后续判断或输出使用。
  const teamName = appState.teamContext?.teamName

  // 满足 `!isTeamLead(appState.teamContext)` 时，工具调用执行该分支。
  if (!isTeamLead(appState.teamContext)) {
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      'Only the team lead can reject plans. Teammates cannot reject their own or other plans.',
    )
  }

  // rejectionResponse 响应数据集中保存工具实现 Send Message Tool要一起传递的字段。
  const rejectionResponse = {
    type: 'plan_approval_response',
    requestId,
    approved: false,
    feedback,
    timestamp: new Date().toISOString(),
  }

  // 等待 `writeToMailbox(` 完成，再继续工具实现 Send Message Tool的异步流程。
  await writeToMailbox(
    recipientName,
    {
      from: TEAM_LEAD_NAME,
      text: jsonStringify(rejectionResponse),
      timestamp: new Date().toISOString(),
    },
    teamName,
  )

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    data: {
      success: true,
      message: `Plan rejected for ${recipientName} with feedback: "${feedback}"`,
      request_id: requestId,
    },
  }
}

// SendMessageTool 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const SendMessageTool: Tool<InputSchema, SendMessageToolOutput> =
  buildTool({
    name: SEND_MESSAGE_TOOL_NAME,
    searchHint: 'send messages to agent teammates (swarm protocol)',
    maxResultSizeChars: 100_000,

    // userFacingName 使用 无 完成工具调用里的对应操作。
    userFacingName() {
      // 返回 `'SendMessage'`，作为工具调用这次计算的结果。
      return 'SendMessage'
    },

    // 工具实现 Send Message Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
    get inputSchema(): InputSchema {
      // 返回 `inputSchema()`，作为工具调用这次计算的结果。
      return inputSchema()
    },
    shouldDefer: true,

    // isEnabled 用 无 判断工具调用是否满足条件。
    isEnabled() {
      // 返回 `isAgentSwarmsEnabled()`，作为工具调用这次计算的结果。
      return isAgentSwarmsEnabled()
    },

    // isReadOnly 用 input 判断工具调用是否满足条件。
    isReadOnly(input) {
      // 返回 `typeof input.message === 'string'`，作为工具调用这次计算的结果。
      return typeof input.message === 'string'
    },

    // backfillObservableInput 使用 input 完成工具调用里的对应操作。
    backfillObservableInput(input) {
      // 满足 `'type' in input` 时，工具调用执行该分支。
      if ('type' in input) return
      // `typeof input.to` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof input.to !== 'string') return

      // 当 `input.to` 匹配 `'*'` 时，工具调用执行对应分支。
      if (input.to === '*') {
        // type更新为 `'broadcast'`，确保工具调用后续读取最新状态。
        input.type = 'broadcast'
        // 当 `typeof input.message` 匹配 `'string'` 时，工具调用执行对应分支。
        if (typeof input.message === 'string') input.content = input.message
      // 工具实现 Send Message Tool在这里处理 `} else if (typeof input.message === 'string') {`，完成这一小步状态转换。
      } else if (typeof input.message === 'string') {
        // type更新为 `'message'`，确保工具调用后续读取最新状态。
        input.type = 'message'
        // recipient更新为 `input.to`，确保工具调用后续读取最新状态。
        input.recipient = input.to
        // 文本内容更新为 `input.message`，确保工具调用后续读取最新状态。
        input.content = input.message
      // 工具实现 Send Message Tool在这里处理 `} else if (typeof input.message === 'object' && input.message !== null)...`，完成这一小步状态转换。
      } else if (typeof input.message === 'object' && input.message !== null) {
        // 消息 命名 `input.message as {`，让后续代码直接表达这个值的用途。
        const msg = input.message as {
          type?: string
          request_id?: string
          approve?: boolean
          reason?: string
          feedback?: string
        }
        // type更新为 `msg.type`，确保工具调用后续读取最新状态。
        input.type = msg.type
        // recipient更新为 `input.to`，确保工具调用后续读取最新状态。
        input.recipient = input.to
        // `msg.request_id` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (msg.request_id !== undefined) input.request_id = msg.request_id
        // `msg.approve` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (msg.approve !== undefined) input.approve = msg.approve
        // 文本内容保存`msg.reason ?? msg.feedback`，供工具实现 Send Message Tool后续判断或输出使用。
        const content = msg.reason ?? msg.feedback
        // `content` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (content !== undefined) input.content = content
      }
    },

    // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
    toAutoClassifierInput(input) {
      // 当 `typeof input.message` 匹配 `'string'` 时，工具调用执行对应分支。
      if (typeof input.message === 'string') {
        // 返回 ``to ${input.to}: ${input.message}``，作为工具调用这次计算的结果。
        return `to ${input.to}: ${input.message}`
      }
      // 按照 input.message.type 的取值选择工具调用的具体处理分支。
      switch (input.message.type) {
        case 'shutdown_request':
          // 返回 ``shutdown_request to ${input.to}``，作为工具调用这次计算的结果。
          return `shutdown_request to ${input.to}`
        case 'shutdown_response':
          // 返回 ``shutdown_response ${input.message.approve ? 'approve' : 'reject'} ${in...`，作为工具调用这次计算的结果。
          return `shutdown_response ${input.message.approve ? 'approve' : 'reject'} ${input.message.request_id}`
        case 'plan_approval_response':
          // 返回 ``plan_approval ${input.message.approve ? 'approve' : 'reject'} to ${inp...`，作为工具调用这次计算的结果。
          return `plan_approval ${input.message.approve ? 'approve' : 'reject'} to ${input.to}`
      }
    },

    // checkPermissions 使用 input, _context 完成工具调用里的对应操作。
    async checkPermissions(input, _context) {
      // 当 `feature('UDS_INBOX') && parseAddress(input....` 匹配 `'bridge'` 时，工具调用执行对应分支。
      if (feature('UDS_INBOX') && parseAddress(input.to).scheme === 'bridge') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask' as const,
          message: `Send a message to Remote Control session ${input.to}? It arrives as a user prompt on the receiving Claude (possibly another machine) via Anthropic's servers.`,
          // safetyCheck (not mode) — permissions.ts guards this before both
          // bypassPermissions (step 1g) and auto-mode's allowlist/classifier.
          // Cross-machine prompt injection must stay bypass-immune.
          decisionReason: {
            type: 'safetyCheck',
            reason:
              'Cross-machine bridge message requires explicit user consent',
            classifierApprovable: false,
          },
        }
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { behavior: 'allow' as const, updatedInput: input }
    },

    // validateInput 使用 input, _context 完成工具调用里的对应操作。
    async validateInput(input, _context) {
      // input.to.trim()为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
      if (input.to.trim().length === 0) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: 'to must not be empty',
          errorCode: 9,
        }
      }
      // addr解析`parseAddress`，供工具调用后续处理使用。
      const addr = parseAddress(input.to)
      // 工具调用在这里按实际状态进入对应分支。
      if (
        (addr.scheme === 'bridge' || addr.scheme === 'uds') &&
        addr.target.trim().length === 0
      ) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: 'address target must not be empty',
          errorCode: 9,
        }
      }
      // 满足 `input.to.includes('@')` 时，工具调用执行该分支。
      if (input.to.includes('@')) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message:
            'to must be a bare teammate name or "*" — there is only one team per session',
          errorCode: 9,
        }
      }
      // 当 `feature('UDS_INBOX') && parseAddress(input....` 匹配 `'bridge'` 时，工具调用执行对应分支。
      if (feature('UDS_INBOX') && parseAddress(input.to).scheme === 'bridge') {
        // Structured-message rejection first — it's the permanent constraint.
        // Showing "not connected" first would make the user reconnect only to
        // hit this error on retry.
        // `typeof input.message` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
        if (typeof input.message !== 'string') {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            message:
              'structured messages cannot be sent cross-session — only plain text',
            errorCode: 9,
          }
        }
        // postInterClaudeMessage derives from= via getReplBridgeHandle() —
        // check handle directly for the init-timing window. Also check
        // isReplBridgeActive() to reject outbound-only (CCR mirror) mode
        // where the bridge is write-only and peer messaging is unsupported.
        // 只有 `!getReplBridgeHandle() || !isReplBridgeActive()` 满足时，工具调用才执行该分支。
        if (!getReplBridgeHandle() || !isReplBridgeActive()) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            message:
              'Remote Control is not connected — cannot send to a bridge: target. Reconnect with /remote-control first.',
            errorCode: 9,
          }
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { result: true }
      }
      // 工具调用在这里按实际状态进入对应分支。
      if (
        feature('UDS_INBOX') &&
        parseAddress(input.to).scheme === 'uds' &&
        typeof input.message === 'string'
      ) {
        // UDS cross-session send: summary isn't rendered (UI.tsx returns null
        // for string messages), so don't require it. Structured messages fall
        // through to the rejection below.
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { result: true }
      }
      // 当 `typeof input.message` 匹配 `'string'` 时，工具调用执行对应分支。
      if (typeof input.message === 'string') {
        // !input.summary || input.summary...为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
        if (!input.summary || input.summary.trim().length === 0) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            message: 'summary is required when message is a string',
            errorCode: 9,
          }
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return { result: true }
      }

      // 当 `input.to` 匹配 `'*'` 时，工具调用执行对应分支。
      if (input.to === '*') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: 'structured messages cannot be broadcast (to: "*")',
          errorCode: 9,
        }
      }
      // `feature('UDS_INBOX') && parseAddress(input....` 与 `'other'` 不一致时刷新派生状态，避免使用过期结果。
      if (feature('UDS_INBOX') && parseAddress(input.to).scheme !== 'other') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message:
            'structured messages cannot be sent cross-session — only plain text',
          errorCode: 9,
        }
      }

      // 工具调用在这里按实际状态进入对应分支。
      if (
        input.message.type === 'shutdown_response' &&
        input.to !== TEAM_LEAD_NAME
      ) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `shutdown_response must be sent to "${TEAM_LEAD_NAME}"`,
          errorCode: 9,
        }
      }

      // 工具调用在这里按实际状态进入对应分支。
      if (
        input.message.type === 'shutdown_response' &&
        !input.message.approve &&
        (!input.message.reason || input.message.reason.trim().length === 0)
      ) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: 'reason is required when rejecting a shutdown request',
          errorCode: 9,
        }
      }

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { result: true }
    },

    // description 使用 无 完成工具调用里的对应操作。
    async description() {
      // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
      return DESCRIPTION
    },

    // prompt 使用 无 完成工具调用里的对应操作。
    async prompt() {
      // 返回 `getPrompt()`，作为工具调用这次计算的结果。
      return getPrompt()
    },

    // mapToolResultToToolResultBlockParam 使用 data, toolUseID 完成工具调用里的对应操作。
    mapToolResultToToolResultBlockParam(data, toolUseID) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result' as const,
        content: [
          {
            type: 'text' as const,
            text: jsonStringify(data),
          },
        ],
      }
    },

    // call 使用 input, context, canUseTool, assistantMessage 完成工具调用里的对应操作。
    async call(input, context, canUseTool, assistantMessage) {
      // 当 `feature('UDS_INBOX') && typeof input.message` 匹配 `'string'` 时，工具调用执行对应分支。
      if (feature('UDS_INBOX') && typeof input.message === 'string') {
        // addr解析`parseAddress`，供工具调用后续处理使用。
        const addr = parseAddress(input.to)
        // 当 `addr.scheme` 匹配 `'bridge'` 时，工具调用执行对应分支。
        if (addr.scheme === 'bridge') {
          // Re-check handle — checkPermissions blocks on user approval (can be
          // minutes). validateInput's check is stale if the bridge dropped
          // during the prompt wait; without this, from="unknown" ships.
          // Also re-check isReplBridgeActive for outbound-only mode.
          // 只有 `!getReplBridgeHandle() || !isReplBridgeActive()` 满足时，工具调用才执行该分支。
          if (!getReplBridgeHandle() || !isReplBridgeActive()) {
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              data: {
                success: false,
                message: `Remote Control disconnected before send — cannot deliver to ${input.to}`,
              },
            }
          }
          /* eslint-disable @typescript-eslint/no-require-imports */
          // 工具实现 Send Message Tool先整理这一处局部数据，后续分支可以直接读取。
          const { postInterClaudeMessage } =
            require('../../bridge/peerSessions.js') as typeof import('../../bridge/peerSessions.js')
          /* eslint-enable @typescript-eslint/no-require-imports */
          // 结果保存`postInterClaudeMessage`，供工具调用后续处理使用。
          const result = await postInterClaudeMessage(
            addr.target,
            input.message,
          )
          // preview保存`truncate`，供工具调用后续处理使用。
          const preview = input.summary || truncate(input.message, 50)
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            data: {
              success: result.ok,
              message: result.ok
                ? `“${preview}” → ${input.to}`
                : `Failed to send to ${input.to}: ${result.error ?? 'unknown'}`,
            },
          }
        }
        // 当 `addr.scheme` 匹配 `'uds'` 时，工具调用执行对应分支。
        if (addr.scheme === 'uds') {
          /* eslint-disable @typescript-eslint/no-require-imports */
          // 工具实现 Send Message Tool先整理这一处局部数据，后续分支可以直接读取。
          const { sendToUdsSocket } =
            require('../../utils/udsClient.js') as typeof import('../../utils/udsClient.js')
          /* eslint-enable @typescript-eslint/no-require-imports */
          // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `sendToUdsSocket(addr.target, input.message)` 完成，再继续工具实现 Send Message Tool的异步流程。
            await sendToUdsSocket(addr.target, input.message)
            // preview保存`truncate`，供工具调用后续处理使用。
            const preview = input.summary || truncate(input.message, 50)
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              data: {
                success: true,
                message: `“${preview}” → ${input.to}`,
              },
            }
          } catch (e) {
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              data: {
                success: false,
                message: `Failed to send to ${input.to}: ${errorMessage(e)}`,
              },
            }
          }
        }
      }

      // Route to in-process subagent by name or raw agentId before falling
      // through to ambient-team resolution. Stopped agents are auto-resumed.
      // 只有 `typeof input.message === 'string' && input.to !==` 满足时，工具调用才执行该分支。
      if (typeof input.message === 'string' && input.to !== '*') {
        // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
        const appState = context.getAppState()
        // registered读取`agentNameRegistry.get`，供工具调用后续处理使用。
        const registered = appState.agentNameRegistry.get(input.to)
        // agentId保存`toAgentId`，供工具调用后续处理使用。
        const agentId = registered ?? toAgentId(input.to)
        // 满足 `agentId` 时，工具调用执行该分支。
        if (agentId) {
          // task读取 `appState.tasks[agentId]` 对应条目，后续围绕该成员继续处理。
          const task = appState.tasks[agentId]
          // 只有 `isLocalAgentTask(task) && !isMainSessionTask(task)` 满足时，工具调用才执行该分支。
          if (isLocalAgentTask(task) && !isMainSessionTask(task)) {
            // 当 `task.status` 匹配 `'running'` 时，工具调用执行对应分支。
            if (task.status === 'running') {
              // 调用 queuePendingMessage，触发工具调用此处需要的副作用。
              queuePendingMessage(
                agentId,
                input.message,
                context.setAppStateForTasks ?? context.setAppState,
              )
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                data: {
                  success: true,
                  message: `Message queued for delivery to ${input.to} at its next tool round.`,
                },
              }
            }
            // task exists but stopped — auto-resume
            // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
            try {
              // 结果保存`resumeAgentBackground`，供工具调用后续处理使用。
              const result = await resumeAgentBackground({
                agentId,
                prompt: input.message,
                toolUseContext: context,
                canUseTool,
                invokingRequestId: assistantMessage?.requestId,
              })
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                data: {
                  success: true,
                  message: `Agent "${input.to}" was stopped (${task.status}); resumed it in the background with your message. You'll be notified when it finishes. Output: ${result.outputFile}`,
                },
              }
            } catch (e) {
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                data: {
                  success: false,
                  message: `Agent "${input.to}" is stopped (${task.status}) and could not be resumed: ${errorMessage(e)}`,
                },
              }
            }
          } else {
            // task evicted from state — try resume from disk transcript.
            // agentId is either a registered name or a format-matching raw ID
            // (toAgentId validates the createAgentId format, so teammate names
            // never reach this block).
            // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
            try {
              // 结果保存`resumeAgentBackground`，供工具调用后续处理使用。
              const result = await resumeAgentBackground({
                agentId,
                prompt: input.message,
                toolUseContext: context,
                canUseTool,
                invokingRequestId: assistantMessage?.requestId,
              })
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                data: {
                  success: true,
                  message: `Agent "${input.to}" had no active task; resumed from transcript in the background with your message. You'll be notified when it finishes. Output: ${result.outputFile}`,
                },
              }
            } catch (e) {
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                data: {
                  success: false,
                  message: `Agent "${input.to}" is registered but has no transcript to resume. It may have been cleaned up. (${errorMessage(e)})`,
                },
              }
            }
          }
        }
      }

      // 当 `typeof input.message` 匹配 `'string'` 时，工具调用执行对应分支。
      if (typeof input.message === 'string') {
        // 当 `input.to` 匹配 `'*'` 时，工具调用执行对应分支。
        if (input.to === '*') {
          // 返回 `handleBroadcast(input.message, input.summary, context)`，作为工具调用这次计算的结果。
          return handleBroadcast(input.message, input.summary, context)
        }
        // 返回 `handleMessage(input.to, input.message, input.summary, context)`，作为工具调用这次计算的结果。
        return handleMessage(input.to, input.message, input.summary, context)
      }

      // 当 `input.to` 匹配 `'*'` 时，工具调用执行对应分支。
      if (input.to === '*') {
        // 抛出 new Error('structured messages cannot be broadcast')，阻止工具调用在无效状态下继续运行。
        throw new Error('structured messages cannot be broadcast')
      }

      // 按照 input.message.type 的取值选择工具调用的具体处理分支。
      switch (input.message.type) {
        case 'shutdown_request':
          // 返回 `handleShutdownRequest(input.to, input.message.reason, context)`，作为工具调用这次计算的结果。
          return handleShutdownRequest(input.to, input.message.reason, context)
        case 'shutdown_response':
          // 满足 `input.message.approve` 时，工具调用执行该分支。
          if (input.message.approve) {
            // 返回 `handleShutdownApproval(input.message.request_id, context)`，作为工具调用这次计算的结果。
            return handleShutdownApproval(input.message.request_id, context)
          }
          // 返回 `handleShutdownRejection(`，作为工具调用这次计算的结果。
          return handleShutdownRejection(
            input.message.request_id,
            input.message.reason!,
          )
        case 'plan_approval_response':
          // 满足 `input.message.approve` 时，工具调用执行该分支。
          if (input.message.approve) {
            // 返回 `handlePlanApproval(`，作为工具调用这次计算的结果。
            return handlePlanApproval(
              input.to,
              input.message.request_id,
              context,
            )
          }
          // 返回 `handlePlanRejection(`，作为工具调用这次计算的结果。
          return handlePlanRejection(
            input.to,
            input.message.request_id,
            input.message.feedback ?? 'Plan needs revision',
            context,
          )
      }
    },

    renderToolUseMessage,
    renderToolResultMessage,
  } satisfies ToolDef<InputSchema, SendMessageToolOutput>)
