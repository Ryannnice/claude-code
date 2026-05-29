/**
 * In-process teammate spawning
 *
 * Creates and registers an in-process teammate task. Unlike process-based
 * teammates (tmux/iTerm2), in-process teammates run in the same Node.js
 * process using AsyncLocalStorage for context isolation.
 *
 * The actual agent execution loop is handled by InProcessTeammateTask
 * component (Task #14). This module handles:
 * 1. Creating TeammateContext
 * 2. Creating linked AbortController
 * 3. Registering InProcessTeammateTaskState in AppState
 * 4. Returning spawn result for backend
 */

// 引入 sample，将 lodash-es/sample.js 中已经封装好的能力接到本文件流程里。
import sample from 'lodash-es/sample.js'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 引入 getSpinnerVerbs，将 ../../constants/spinnerVerbs.js 中已经封装好的能力接到本文件流程里。
import { getSpinnerVerbs } from '../../constants/spinnerVerbs.js'
// 引入 TURN_COMPLETION_VERBS，将 ../../constants/turnCompletionVerbs.js 中已经封装好的能力接到本文件流程里。
import { TURN_COMPLETION_VERBS } from '../../constants/turnCompletionVerbs.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../../state/AppState.js'
// 引入 createTaskStateBase、generateTaskId，将 ../../Task.js 中已经封装好的能力接到本文件流程里。
import { createTaskStateBase, generateTaskId } from '../../Task.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  InProcessTeammateTaskState,
  TeammateIdentity,
} from '../../tasks/InProcessTeammateTask/types.js'
// 引入 createAbortController，将 ../abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from '../abortController.js'
// 引入 formatAgentId，将 ../agentId.js 中已经封装好的能力接到本文件流程里。
import { formatAgentId } from '../agentId.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 emitTaskTerminatedSdk，将 ../sdkEventQueue.js 中已经封装好的能力接到本文件流程里。
import { emitTaskTerminatedSdk } from '../sdkEventQueue.js'
// 引入 evictTaskOutput，将 ../task/diskOutput.js 中已经封装好的能力接到本文件流程里。
import { evictTaskOutput } from '../task/diskOutput.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  evictTerminalTask,
  registerTask,
  STOPPED_DISPLAY_MS,
} from '../task/framework.js'
// 引入 createTeammateContext，将 ../teammateContext.js 中已经封装好的能力接到本文件流程里。
import { createTeammateContext } from '../teammateContext.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isPerfettoTracingEnabled,
  registerAgent as registerPerfettoAgent,
  unregisterAgent as unregisterPerfettoAgent,
} from '../telemetry/perfettoTracing.js'
// 引入 removeMemberByAgentId，将 ./teamHelpers.js 中已经封装好的能力接到本文件流程里。
import { removeMemberByAgentId } from './teamHelpers.js'

// SetAppStateFn 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppStateFn = (updater: (prev: AppState) => AppState) => void

/**
 * Minimal context required for spawning an in-process teammate.
 * This is a subset of ToolUseContext - only what spawnInProcessTeammate actually uses.
 */
// SpawnContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SpawnContext = {
  setAppState: SetAppStateFn
  toolUseId?: string
}

/**
 * Configuration for spawning an in-process teammate.
 */
// InProcessSpawnConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InProcessSpawnConfig = {
  /** Display name for the teammate, e.g., "researcher" */
  name: string
  /** Team this teammate belongs to */
  teamName: string
  /** Initial prompt/task for the teammate */
  prompt: string
  /** Optional UI color for the teammate */
  color?: string
  /** Whether teammate must enter plan mode before implementing */
  planModeRequired: boolean
  /** Optional model override for this teammate */
  model?: string
}

/**
 * Result from spawning an in-process teammate.
 */
// InProcessSpawnOutput 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InProcessSpawnOutput = {
  /** Whether spawn was successful */
  success: boolean
  /** Full agent ID (format: "name@team") */
  agentId: string
  /** Task ID for tracking in AppState */
  taskId?: string
  /** AbortController for this teammate (linked to parent) */
  abortController?: AbortController
  /** Teammate context for AsyncLocalStorage */
  teammateContext?: ReturnType<typeof createTeammateContext>
  /** Error message if spawn failed */
  error?: string
}

/**
 * Spawns an in-process teammate.
 *
 * Creates the teammate's context, registers the task in AppState, and returns
 * the spawn result. The actual agent execution is driven by the
 * InProcessTeammateTask component which uses runWithTeammateContext() to
 * execute the agent loop with proper identity isolation.
 *
 * @param config - Spawn configuration
 * @param context - Context with setAppState for registering task
 * @returns Spawn result with teammate info
 */
// spawnInProcessTeammate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function spawnInProcessTeammate(
  config: InProcessSpawnConfig,
  context: SpawnContext,
): Promise<InProcessSpawnOutput> {
  // 从 `config` 解构 name、teamName、prompt、color，减少共享工具 spawn In Process对同一对象的重复访问。
  const { name, teamName, prompt, color, planModeRequired, model } = config
  // 从 `context` 解构 setAppState，减少共享工具 spawn In Process对同一对象的重复访问。
  const { setAppState } = context

  // Generate deterministic agent ID
  // agentId格式化`formatAgentId`，供共享工具后续处理使用。
  const agentId = formatAgentId(name, teamName)
  // taskId保存`generateTaskId`，供共享工具后续处理使用。
  const taskId = generateTaskId('in_process_teammate')

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[spawnInProcessTeammate] Spawning ${agentId} (taskId: ${taskId})`,
  )

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Create independent AbortController for this teammate
    // Teammates should not be aborted when the leader's query is interrupted
    // abortController构建`createAbortController`，供共享工具后续处理使用。
    const abortController = createAbortController()

    // Get parent session ID for transcript correlation
    // parentSessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
    const parentSessionId = getSessionId()

    // Create teammate identity (stored as plain data in AppState)
    // identity 集中保存共享工具 spawn In Process要一起传递的字段。
    const identity: TeammateIdentity = {
      agentId,
      agentName: name,
      teamName,
      color,
      planModeRequired,
      parentSessionId,
    }

    // Create teammate context for AsyncLocalStorage
    // This will be used by runWithTeammateContext() during agent execution
    // teammateContext构建`createTeammateContext`，供共享工具后续处理使用。
    const teammateContext = createTeammateContext({
      agentId,
      agentName: name,
      teamName,
      color,
      planModeRequired,
      parentSessionId,
      abortController,
    })

    // Register agent in Perfetto trace for hierarchy visualization
    // 满足 `isPerfettoTracingEnabled()` 时，共享工具执行该分支。
    if (isPerfettoTracingEnabled()) {
      // 调用 registerPerfettoAgent，触发共享工具此处需要的副作用。
      registerPerfettoAgent(agentId, name, parentSessionId)
    }

    // Create task state
    // description格式化`prompt.substring`，供共享工具后续处理使用。
    const description = `${name}: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`

    // taskState 状态 集中保存共享工具 spawn In Process要一起传递的字段。
    const taskState: InProcessTeammateTaskState = {
      ...createTaskStateBase(
        taskId,
        'in_process_teammate',
        description,
        context.toolUseId,
      ),
      type: 'in_process_teammate',
      status: 'running',
      identity,
      prompt,
      model,
      abortController,
      awaitingPlanApproval: false,
      spinnerVerb: sample(getSpinnerVerbs()),
      pastTenseVerb: sample(TURN_COMPLETION_VERBS),
      permissionMode: planModeRequired ? 'plan' : 'default',
      isIdle: false,
      shutdownRequested: false,
      lastReportedToolCount: 0,
      lastReportedTokenCount: 0,
      pendingUserMessages: [],
      messages: [], // Initialize to empty array so getDisplayedMessages works immediately
    }

    // Register cleanup handler for graceful shutdown
    // unregisterCleanup保存`registerCleanup`，供共享工具后续处理使用。
    const unregisterCleanup = registerCleanup(async () => {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[spawnInProcessTeammate] Cleanup called for ${agentId}`)
      // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
      abortController.abort()
      // Task state will be updated by the execution loop when it detects abort
    })
    // unregisterCleanup更新为 `unregisterCleanup`，确保共享工具后续读取最新状态。
    taskState.unregisterCleanup = unregisterCleanup

    // Register task in AppState
    // 调用 registerTask，触发共享工具此处需要的副作用。
    registerTask(taskState, setAppState)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[spawnInProcessTeammate] Registered ${agentId} in AppState`,
    )

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: true,
      agentId,
      taskId,
      abortController,
      teammateContext,
    }
  } catch (error) {
    // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during spawn'
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[spawnInProcessTeammate] Failed to spawn ${agentId}: ${errorMessage}`,
    )
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      agentId,
      error: errorMessage,
    }
  }
}

/**
 * Kills an in-process teammate by aborting its controller.
 *
 * Note: This is the implementation called by InProcessBackend.kill().
 *
 * @param taskId - Task ID of the teammate to kill
 * @param setAppState - AppState setter
 * @returns true if killed successfully
 */
// killInProcessTeammate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function killInProcessTeammate(
  taskId: string,
  setAppState: SetAppStateFn,
): boolean {
  // killed标记共享工具 spawn In Process是否启用对应路径。
  let killed = false
  // teamName初始化为空值，后续分支会在有数据时补齐。
  let teamName: string | null = null
  // agentId 命名 `null`，让后续代码直接表达这个值的用途。
  let agentId: string | null = null
  // toolUseId 先占位，稍后的条件分支会根据实际输入补齐它。
  let toolUseId: string | undefined
  // description 先占位，稍后的条件分支会根据实际输入补齐它。
  let description: string | undefined

  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState((prev: AppState) => {
    // task 命名 `prev.tasks[taskId]`，让后续代码直接表达这个值的用途。
    const task = prev.tasks[taskId]
    // `!task || task.type` 与 `'in_process_teammate'` 不一致时刷新派生状态，避免使用过期结果。
    if (!task || task.type !== 'in_process_teammate') {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }

    // teammateTask 命名 `task as InProcessTeammateTaskState`，让后续代码直接表达这个值的用途。
    const teammateTask = task as InProcessTeammateTaskState

    // `teammateTask.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (teammateTask.status !== 'running') {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }

    // Capture identity for cleanup after state update
    // teamName更新为 `teammateTask.identity.teamName`，确保共享工具后续读取最新状态。
    teamName = teammateTask.identity.teamName
    // agentId更新为 `teammateTask.identity.agentId`，确保共享工具后续读取最新状态。
    agentId = teammateTask.identity.agentId
    // toolUseId更新为 `teammateTask.toolUseId`，确保共享工具后续读取最新状态。
    toolUseId = teammateTask.toolUseId
    // description更新为 `teammateTask.description`，确保共享工具后续读取最新状态。
    description = teammateTask.description

    // Abort the controller to stop execution
    // 调用 teammateTask.abortController?.abort()，完成这一处局部操作。
    teammateTask.abortController?.abort()

    // Call cleanup handler
    // 调用 teammateTask.unregisterCleanup?.()，完成这一处局部操作。
    teammateTask.unregisterCleanup?.()

    // Update task state and remove from teamContext.teammates
    // killed更新为 `true`，确保共享工具后续读取最新状态。
    killed = true

    // Call pending idle callbacks to unblock any waiters (e.g., engine.waitForIdle)
    // 这个回调绑定到 teammateTask.onIdleCallbacks?.forEach(cb => cb())，负责共享工具在该局部场景下的响应。
    teammateTask.onIdleCallbacks?.forEach(cb => cb())

    // Remove from teamContext.teammates using the agentId
    // updatedTeamContext保存`prev.teamContext`，供共享工具 spawn In Process后续判断或输出使用。
    let updatedTeamContext = prev.teamContext
    // 只有 `prev.teamContext && prev.teamContext.teammates &&` 满足时，共享工具才执行该分支。
    if (prev.teamContext && prev.teamContext.teammates && agentId) {
      // 从 `prev.teamContext.teammates` 解构 [agentId]、其余 remainingTeammates，减少共享工具 spawn In Process对同一对象的重复访问。
      const { [agentId]: _, ...remainingTeammates } = prev.teamContext.teammates
      // updatedTeamContext更新为 `{`，确保共享工具后续读取最新状态。
      updatedTeamContext = {
        ...prev.teamContext,
        teammates: remainingTeammates,
      }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...prev,
      teamContext: updatedTeamContext,
      tasks: {
        ...prev.tasks,
        [taskId]: {
          ...teammateTask,
          status: 'killed' as const,
          notified: true,
          endTime: Date.now(),
          onIdleCallbacks: [], // Clear callbacks to prevent stale references
          messages: teammateTask.messages?.length
            ? [teammateTask.messages[teammateTask.messages.length - 1]!]
            : undefined,
          pendingUserMessages: [],
          inProgressToolUseIDs: undefined,
          abortController: undefined,
          unregisterCleanup: undefined,
          currentWorkAbortController: undefined,
        },
      },
    }
  })

  // Remove from team file (outside state updater to avoid file I/O in callback)
  // 只有 `teamName && agentId` 满足时，共享工具才执行该分支。
  if (teamName && agentId) {
    // 调用 removeMemberByAgentId，触发共享工具此处需要的副作用。
    removeMemberByAgentId(teamName, agentId)
  }

  // 满足 `killed` 时，共享工具执行该分支。
  if (killed) {
    // 显式忽略 `evictTaskOutput(taskId)` 的返回值，只保留它触发的副作用。
    void evictTaskOutput(taskId)
    // notified:true was pre-set so no XML notification fires; close the SDK
    // task_started bookend directly. The in-process runner's own
    // completion/failure emit guards on status==='running' so it won't
    // double-emit after seeing status:killed.
    // 调用 emitTaskTerminatedSdk，触发共享工具此处需要的副作用。
    emitTaskTerminatedSdk(taskId, 'stopped', {
      toolUseId,
      summary: description,
    })
    // setTimeout 写入新的状态值，使共享工具后续读取保持一致。
    setTimeout(
      evictTerminalTask.bind(null, taskId, setAppState),
      STOPPED_DISPLAY_MS,
    )
  }

  // Release perfetto agent registry entry
  // 满足 `agentId` 时，共享工具执行该分支。
  if (agentId) {
    // 调用 unregisterPerfettoAgent，触发共享工具此处需要的副作用。
    unregisterPerfettoAgent(agentId)
  }

  // 返回 `killed`，作为共享工具这次计算的结果。
  return killed
}
