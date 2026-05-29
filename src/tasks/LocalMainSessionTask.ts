/**
 * LocalMainSessionTask - Handles backgrounding the main session query.
 *
 * When user presses Ctrl+B twice during a query, the session is "backgrounded":
 * - The query continues running in the background
 * - The UI clears to a fresh prompt
 * - A notification is sent when the query completes
 *
 * This reuses the LocalAgentTask state structure since the behavior is similar.
 */

// 类型依赖 { UUID } 来自 crypto，用于校准Local Main Session Task的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 整理这一组导入，让Local Main Session Task后续逻辑可以直接复用这些外部能力。
import {
  OUTPUT_FILE_TAG,
  STATUS_TAG,
  SUMMARY_TAG,
  TASK_ID_TAG,
  TASK_NOTIFICATION_TAG,
  TOOL_USE_ID_TAG,
} from '../constants/xml.js'
// 引入 QueryParams、query，将 ../query.js 中已经封装好的能力接到本文件流程里。
import { type QueryParams, query } from '../query.js'
// 接入 roughTokenCountEstimation 服务层能力，把外部通信或共享状态交给 ../services/tokenEstimation.js 处理。
import { roughTokenCountEstimation } from '../services/tokenEstimation.js'
// 类型依赖 { SetAppState } 来自 ../Task.js，用于校准Local Main Session Task的数据契约。
import type { SetAppState } from '../Task.js'
// 引入 createTaskStateBase，将 ../Task.js 中已经封装好的能力接到本文件流程里。
import { createTaskStateBase } from '../Task.js'
// 整理这一组导入，让Local Main Session Task后续逻辑可以直接复用这些外部能力。
import type {
  AgentDefinition,
  CustomAgentDefinition,
} from '../tools/AgentTool/loadAgentsDir.js'
// 引入 asAgentId，将 ../types/ids.js 中已经封装好的能力接到本文件流程里。
import { asAgentId } from '../types/ids.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准Local Main Session Task的数据契约。
import type { Message } from '../types/message.js'
// 复用 createAbortController 工具函数，把通用处理留在 ../utils/abortController.js 中维护。
import { createAbortController } from '../utils/abortController.js'
// 整理这一组导入，让Local Main Session Task后续逻辑可以直接复用这些外部能力。
import {
  runWithAgentContext,
  type SubagentContext,
} from '../utils/agentContext.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 enqueuePendingNotification 工具函数，把通用处理留在 ../utils/messageQueueManager.js 中维护。
import { enqueuePendingNotification } from '../utils/messageQueueManager.js'
// 复用 emitTaskTerminatedSdk 工具函数，把通用处理留在 ../utils/sdkEventQueue.js 中维护。
import { emitTaskTerminatedSdk } from '../utils/sdkEventQueue.js'
// 整理这一组导入，让Local Main Session Task后续逻辑可以直接复用这些外部能力。
import {
  getAgentTranscriptPath,
  recordSidechainTranscript,
} from '../utils/sessionStorage.js'
// 整理这一组导入，让Local Main Session Task后续逻辑可以直接复用这些外部能力。
import {
  evictTaskOutput,
  getTaskOutputPath,
  initTaskOutputAsSymlink,
} from '../utils/task/diskOutput.js'
// 复用 registerTask、updateTaskState 工具函数，把通用处理留在 ../utils/task/framework.js 中维护。
import { registerTask, updateTaskState } from '../utils/task/framework.js'
// 类型依赖 { LocalAgentTaskState } 来自 ./LocalAgentTask/LocalAgentTask.js，用于校准Local Main Session Task的数据契约。
import type { LocalAgentTaskState } from './LocalAgentTask/LocalAgentTask.js'

// Main session tasks use LocalAgentTaskState with agentType='main-session'
// LocalMainSessionTaskState 固化Local Main Session Task里传递的数据形状，帮助调用方按同一结构读写字段。
export type LocalMainSessionTaskState = LocalAgentTaskState & {
  agentType: 'main-session'
}

/**
 * Default agent definition for main session tasks when no agent is specified.
 */
// DEFAULT_MAIN_SESSION_AGENT 会话数据 集中保存Local Main Session Task要一起传递的字段。
const DEFAULT_MAIN_SESSION_AGENT: CustomAgentDefinition = {
  agentType: 'main-session',
  whenToUse: 'Main session query',
  source: 'userSettings',
  // 这个回调绑定到 getSystemPrompt: () => '',，负责Local Main Session Task在该局部场景下的响应。
  getSystemPrompt: () => '',
}

/**
 * Generate a unique task ID for main session tasks.
 * Uses 's' prefix to distinguish from agent tasks ('a' prefix).
 */
// TASK_ID_ALPHABET保存`'0123456789abcdefghijklmnopqrstuvwxyz'`，作为后续固定文本处理的输入。
const TASK_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

// generateMainSessionTaskId 封装LocalMainSessionTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateMainSessionTaskId(): string {
  // bytes 集合保存`randomBytes`，供Local Main Session Task后续处理使用。
  const bytes = randomBytes(8)
  // 标识符固定为 `'s'`，作为Local Main Session Task后续展示或比较的基准。
  let id = 's'
  // 按索引扫描 `8`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < 8; i++) {
    // Local Main Session Task在这里处理 `id += TASK_ID_ALPHABET[bytes[i]! % TASK_ID_ALPHABET.length]`，完成这一小步状态转换。
    id += TASK_ID_ALPHABET[bytes[i]! % TASK_ID_ALPHABET.length]
  }
  // 返回 `id`，作为Local Main Session Task这次计算的结果。
  return id
}

/**
 * Register a backgrounded main session task.
 * Called when the user backgrounds the current session query.
 *
 * @param description - Description of the task
 * @param setAppState - State setter function
 * @param mainThreadAgentDefinition - Optional agent definition if running with --agent
 * @param existingAbortController - Optional abort controller to reuse (for backgrounding an active query)
 * @returns Object with task ID and abort signal for stopping the background query
 */
// registerMainSessionTask 封装LocalMainSessionTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerMainSessionTask(
  description: string,
  setAppState: SetAppState,
  mainThreadAgentDefinition?: AgentDefinition,
  existingAbortController?: AbortController,
): { taskId: string; abortSignal: AbortSignal } {
  // taskId保存`generateMainSessionTaskId`，供Local Main Session Task后续处理使用。
  const taskId = generateMainSessionTaskId()

  // Link output to an isolated per-task transcript file (same layout as
  // sub-agents). Do NOT use getTranscriptPath() — that's the main session's
  // file, and writing there from a background query after /clear would corrupt
  // the post-clear conversation. The isolated path lets this task survive
  // /clear: the symlink re-link in clearConversation handles session ID changes.
  // 显式忽略 `initTaskOutputAsSymlink(` 的返回值，只保留它触发的副作用。
  void initTaskOutputAsSymlink(
    taskId,
    getAgentTranscriptPath(asAgentId(taskId)),
  )

  // Use the existing abort controller if provided (important for backgrounding an active query)
  // This ensures that aborting the task will abort the actual query
  // abortController构建`createAbortController`，供Local Main Session Task后续处理使用。
  const abortController = existingAbortController ?? createAbortController()

  // unregisterCleanup保存`registerCleanup`，供Local Main Session Task后续处理使用。
  const unregisterCleanup = registerCleanup(async () => {
    // Clean up on process exit
    // setAppState 写入新的状态值，使Local Main Session Task后续读取保持一致。
    setAppState(prev => {
      // 从 `prev.tasks` 解构 [taskId]、其余 rest，减少Local Main Session Task对同一对象的重复访问。
      const { [taskId]: removed, ...rest } = prev.tasks
      // 返回结构化结果，集中表达Local Main Session Task已经整理出的状态。
      return { ...prev, tasks: rest }
    })
  })

  // Use provided agent definition or default
  // selectedAgent读取`mainThreadAgentDefinition ?? DEFAULT_MAIN_SESSION_AGENT` 整理出中间结果，供Local Main Session Task后续步骤使用。
  const selectedAgent = mainThreadAgentDefinition ?? DEFAULT_MAIN_SESSION_AGENT

  // Create task state - already backgrounded since this is called when user backgrounds
  // taskState 状态 集中保存Local Main Session Task要一起传递的字段。
  const taskState: LocalMainSessionTaskState = {
    ...createTaskStateBase(taskId, 'local_agent', description),
    type: 'local_agent',
    status: 'running',
    agentId: taskId,
    prompt: description,
    selectedAgent,
    agentType: 'main-session',
    abortController,
    unregisterCleanup,
    retrieved: false,
    lastReportedToolCount: 0,
    lastReportedTokenCount: 0,
    isBackgrounded: true, // Already backgrounded
    pendingMessages: [],
    retain: false,
    diskLoaded: false,
  }

  // 记录Local Main Session Task运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[LocalMainSessionTask] Registering task ${taskId} with description: ${description}`,
  )
  // 调用 registerTask，触发Local Main Session Task此处需要的副作用。
  registerTask(taskState, setAppState)

  // Verify task was registered by checking state
  // setAppState 写入新的状态值，使Local Main Session Task后续读取保持一致。
  setAppState(prev => {
    // hasTask标记Local Main Session Task是否启用对应路径。
    const hasTask = taskId in prev.tasks
    // 记录Local Main Session Task运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[LocalMainSessionTask] After registration, task ${taskId} exists in state: ${hasTask}`,
    )
    // 返回 `prev`，作为Local Main Session Task这次计算的结果。
    return prev
  })

  // 返回结构化结果，集中表达Local Main Session Task已经整理出的状态。
  return { taskId, abortSignal: abortController.signal }
}

/**
 * Complete the main session task and send notification.
 * Called when the backgrounded query finishes.
 */
// completeMainSessionTask 封装LocalMainSessionTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function completeMainSessionTask(
  taskId: string,
  success: boolean,
  setAppState: SetAppState,
): void {
  // wasBackgrounded标记Local Main Session Task是否启用对应路径。
  let wasBackgrounded = true
  // toolUseId 先占位，稍后的条件分支会根据实际输入补齐它。
  let toolUseId: string | undefined

  // 这个回调绑定到 updateTaskState<LocalMainSessionTaskState>(taskId, setAppState, task => {，负责Local Main Session Task在该局部场景下的响应。
  updateTaskState<LocalMainSessionTaskState>(taskId, setAppState, task => {
    // `task.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (task.status !== 'running') {
      // 返回 `task`，作为Local Main Session Task这次计算的结果。
      return task
    }

    // Track if task was backgrounded (for notification decision)
    // wasBackgrounded更新为 `task.isBackgrounded ?? true`，确保LocalMainSessionTask后续读取最新状态。
    wasBackgrounded = task.isBackgrounded ?? true
    // toolUseId更新为 `task.toolUseId`，确保LocalMainSessionTask后续读取最新状态。
    toolUseId = task.toolUseId

    // 调用 task.unregisterCleanup?.()，完成这一处局部操作。
    task.unregisterCleanup?.()

    // 返回结构化结果，集中表达Local Main Session Task已经整理出的状态。
    return {
      ...task,
      status: success ? 'completed' : 'failed',
      endTime: Date.now(),
      messages: task.messages?.length ? [task.messages.at(-1)!] : undefined,
    }
  })

  // 显式忽略 `evictTaskOutput(taskId)` 的返回值，只保留它触发的副作用。
  void evictTaskOutput(taskId)

  // Only send notification if task is still backgrounded (not foregrounded)
  // If foregrounded, user is watching it directly - no notification needed
  // 满足 `wasBackgrounded` 时，Local Main Session Task执行该分支。
  if (wasBackgrounded) {
    // 调用 enqueueMainSessionNotification，触发Local Main Session Task此处需要的副作用。
    enqueueMainSessionNotification(
      taskId,
      'Background session',
      success ? 'completed' : 'failed',
      setAppState,
      toolUseId,
    )
  } else {
    // Foregrounded: no XML notification (TUI user is watching), but SDK
    // consumers still need to see the task_started bookend close.
    // Set notified so evictTerminalTask/generateTaskAttachments eviction
    // guards pass; the backgrounded path sets this inside
    // enqueueMainSessionNotification's check-and-set.
    // 调用 updateTaskState，触发Local Main Session Task此处需要的副作用。
    updateTaskState(taskId, setAppState, task => ({ ...task, notified: true }))
    // 调用 emitTaskTerminatedSdk，触发Local Main Session Task此处需要的副作用。
    emitTaskTerminatedSdk(taskId, success ? 'completed' : 'failed', {
      toolUseId,
      summary: 'Background session',
    })
  }
}

/**
 * Enqueue a notification about the backgrounded session completing.
 */
// enqueueMainSessionNotification 封装LocalMainSessionTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function enqueueMainSessionNotification(
  taskId: string,
  description: string,
  status: 'completed' | 'failed',
  setAppState: SetAppState,
  toolUseId?: string,
): void {
  // Atomically check and set notified flag to prevent duplicate notifications.
  // shouldEnqueue标记Local Main Session Task是否启用对应路径。
  let shouldEnqueue = false
  // 调用 updateTaskState，触发Local Main Session Task此处需要的副作用。
  updateTaskState(taskId, setAppState, task => {
    // 满足 `task.notified` 时，Local Main Session Task执行该分支。
    if (task.notified) {
      // 返回 `task`，作为Local Main Session Task这次计算的结果。
      return task
    }
    // shouldEnqueue更新为 `true`，确保LocalMainSessionTask后续读取最新状态。
    shouldEnqueue = true
    // 返回结构化结果，集中表达Local Main Session Task已经整理出的状态。
    return { ...task, notified: true }
  })

  // shouldEnqueue缺失时提前走兜底路径，避免Local Main Session Task继续依赖无效输入。
  if (!shouldEnqueue) {
    // Local Main Session Task在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // summary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const summary =
    status === 'completed'
      ? `Background session "${description}" completed`
      : `Background session "${description}" failed`

  // toolUseIdLine保存`toolUseId`，供Local Main Session Task后续判断或输出使用。
  const toolUseIdLine = toolUseId
    ? `\n<${TOOL_USE_ID_TAG}>${toolUseId}</${TOOL_USE_ID_TAG}>`
    : ''

  // outputPath 路径数据读取`getTaskOutputPath`，供Local Main Session Task后续处理使用。
  const outputPath = getTaskOutputPath(taskId)
  // 消息固定为 ``<${TASK_NOTIFICATION_TAG}>`，作为Local Main Session Task后续展示或比较的基准。
  const message = `<${TASK_NOTIFICATION_TAG}>
<${TASK_ID_TAG}>${taskId}</${TASK_ID_TAG}>${toolUseIdLine}
<${OUTPUT_FILE_TAG}>${outputPath}</${OUTPUT_FILE_TAG}>
<${STATUS_TAG}>${status}</${STATUS_TAG}>
<${SUMMARY_TAG}>${summary}</${SUMMARY_TAG}>
</${TASK_NOTIFICATION_TAG}>`

  // 调用 enqueuePendingNotification，触发Local Main Session Task此处需要的副作用。
  enqueuePendingNotification({ value: message, mode: 'task-notification' })
}

/**
 * Foreground a main session task - mark it as foregrounded so its output
 * appears in the main view. The background query keeps running.
 * Returns the task's accumulated messages, or undefined if task not found.
 */
// foregroundMainSessionTask 封装LocalMainSessionTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function foregroundMainSessionTask(
  taskId: string,
  setAppState: SetAppState,
): Message[] | undefined {
  // taskMessages 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let taskMessages: Message[] | undefined

  // setAppState 写入新的状态值，使Local Main Session Task后续读取保持一致。
  setAppState(prev => {
    // task读取 `prev.tasks[taskId]` 对应条目，后续围绕该成员继续处理。
    const task = prev.tasks[taskId]
    // `!task || task.type` 与 `'local_agent'` 不一致时刷新派生状态，避免使用过期结果。
    if (!task || task.type !== 'local_agent') {
      // 返回 `prev`，作为Local Main Session Task这次计算的结果。
      return prev
    }

    // taskMessages 消息数据更新为 `(task as LocalMainSessionTaskState).messages`，确保LocalMainSessionTask后续读取最新状态。
    taskMessages = (task as LocalMainSessionTaskState).messages

    // Restore previous foregrounded task to background if it exists
    // prevId保存`prev.foregroundedTaskId`，供Local Main Session Task后续判断或输出使用。
    const prevId = prev.foregroundedTaskId
    // prevTask读取 `prevId ? prev.tasks[prevId] : undefined` 对应条目，后续围绕该成员继续处理。
    const prevTask = prevId ? prev.tasks[prevId] : undefined
    // restorePrev 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const restorePrev =
      prevId && prevId !== taskId && prevTask?.type === 'local_agent'

    // 返回结构化结果，集中表达Local Main Session Task已经整理出的状态。
    return {
      ...prev,
      foregroundedTaskId: taskId,
      tasks: {
        ...prev.tasks,
        ...(restorePrev && { [prevId]: { ...prevTask, isBackgrounded: true } }),
        [taskId]: { ...task, isBackgrounded: false },
      },
    }
  })

  // 返回 `taskMessages`，作为Local Main Session Task这次计算的结果。
  return taskMessages
}

/**
 * Check if a task is a main session task (vs a regular agent task).
 */
// isMainSessionTask 封装LocalMainSessionTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMainSessionTask(
  task: unknown,
): task is LocalMainSessionTaskState {
  // Local Main Session Task在这里进入条件判断，后续代码按实际状态分流。
  if (
    typeof task !== 'object' ||
    task === null ||
    !('type' in task) ||
    !('agentType' in task)
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `(`，作为Local Main Session Task这次计算的结果。
  return (
    task.type === 'local_agent' &&
    (task as LocalMainSessionTaskState).agentType === 'main-session'
  )
}

// Max recent activities to keep for display
// MAX_RECENT_ACTIVITIES 集合保存`5`，供Local Main Session Task后续判断或输出使用。
const MAX_RECENT_ACTIVITIES = 5

// ToolActivity 固化Local Main Session Task里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolActivity = {
  toolName: string
  input: Record<string, unknown>
}

/**
 * Start a fresh background session with the given messages.
 *
 * Spawns an independent query() call with the current messages and registers it
 * as a background task. The caller's foreground query continues running normally.
 */
// startBackgroundSession 封装LocalMainSessionTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startBackgroundSession({
  messages,
  queryParams,
  description,
  setAppState,
  agentDefinition,
}: {
  messages: Message[]
  queryParams: Omit<QueryParams, 'messages'>
  description: string
  setAppState: SetAppState
  agentDefinition?: AgentDefinition
}): string {
  // 从 `registerMainSessionTask(` 解构 taskId、abortSignal，减少Local Main Session Task对同一对象的重复访问。
  const { taskId, abortSignal } = registerMainSessionTask(
    description,
    setAppState,
    agentDefinition,
  )

  // Persist the pre-backgrounding conversation to the task's isolated
  // transcript so TaskOutput shows context immediately. Subsequent messages
  // are written incrementally below.
  // 这个回调绑定到 void recordSidechainTranscript(messages, taskId).catch(err =>，负责Local Main Session Task在该局部场景下的响应。
  void recordSidechainTranscript(messages, taskId).catch(err =>
    logForDebugging(`bg-session initial transcript write failed: ${err}`),
  )

  // Wrap in agent context so skill invocations scope to this task's agentId
  // (not null). This lets clearInvokedSkills(preservedAgentIds) selectively
  // preserve this task's skills across /clear. AsyncLocalStorage isolates
  // concurrent async chains — this wrapper doesn't affect the foreground.
  // agentContext 集中保存Local Main Session Task要一起传递的字段。
  const agentContext: SubagentContext = {
    agentId: taskId,
    agentType: 'subagent',
    subagentName: 'main-session',
    isBuiltIn: true,
  }

  // 这个回调绑定到 void runWithAgentContext(agentContext, async () => {，负责Local Main Session Task在该局部场景下的响应。
  void runWithAgentContext(agentContext, async () => {
    // 保护这一段可能失败的Local Main Session Task操作，确保异常能进入相邻错误处理。
    try {
      // bgMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
      const bgMessages: Message[] = [...messages]
      // recentActivities 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const recentActivities: ToolActivity[] = []
      // toolCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let toolCount = 0
      // tokenCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let tokenCount = 0
      // lastRecordedUuid保存`messages.at(-1)?.uuid ?? null`，供后续判断或组装使用。
      let lastRecordedUuid: UUID | null = messages.at(-1)?.uuid ?? null

      // 逐项读取 `query({` 中的event，按输入顺序推进Local Main Session Task。
      for await (const event of query({
        messages: bgMessages,
        ...queryParams,
      })) {
        // 满足 `abortSignal.aborted` 时，Local Main Session Task执行该分支。
        if (abortSignal.aborted) {
          // Aborted mid-stream — completeMainSessionTask won't be reached.
          // chat:killAgents path already marked notified + emitted; stopTask path did not.
          // alreadyNotified标记Local Main Session Task是否启用对应路径。
          let alreadyNotified = false
          // 调用 updateTaskState，触发Local Main Session Task此处需要的副作用。
          updateTaskState(taskId, setAppState, task => {
            // alreadyNotified更新为 `task.notified === true`，确保LocalMainSessionTask后续读取最新状态。
            alreadyNotified = task.notified === true
            // 返回 `alreadyNotified ? task : { ...task, notified: true }`，作为Local Main Session Task这次计算的结果。
            return alreadyNotified ? task : { ...task, notified: true }
          })
          // alreadyNotified缺失时提前走兜底路径，避免Local Main Session Task继续依赖无效输入。
          if (!alreadyNotified) {
            // 调用 emitTaskTerminatedSdk，触发Local Main Session Task此处需要的副作用。
            emitTaskTerminatedSdk(taskId, 'stopped', {
              summary: description,
            })
          }
          // Local Main Session Task在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Local Main Session Task在这里进入条件判断，后续代码按实际状态分流。
        if (
          event.type !== 'user' &&
          event.type !== 'assistant' &&
          event.type !== 'system'
        ) {
          // 跳过当前项，继续处理Local Main Session Task中的下一轮循环。
          continue
        }

        // bgMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        bgMessages.push(event)

        // Per-message write (matches runAgent.ts pattern) — gives live
        // TaskOutput progress and keeps the transcript file current even if
        // /clear re-links the symlink mid-run.
        // 显式忽略 `recordSidechainTranscript([event], taskId, lastRecordedUuid).ca...` 的返回值，只保留它触发的副作用。
        void recordSidechainTranscript([event], taskId, lastRecordedUuid).catch(
          // err更新为 `> logForDebugging(`bg-session transcript write failed: ${...`，确保LocalMainSessionTask后续读取最新状态。
          err => logForDebugging(`bg-session transcript write failed: ${err}`),
        )
        // lastRecordedUuid更新为 `event.uuid`，确保LocalMainSessionTask后续读取最新状态。
        lastRecordedUuid = event.uuid

        // 当 `event.type` 匹配 `'assistant'` 时，Local Main Session Task执行对应分支。
        if (event.type === 'assistant') {
          // 按顺序遍历 `event.message.content` 中的block，逐个交给Local Main Session Task处理。
          for (const block of event.message.content) {
            // 当 `block.type` 匹配 `'text'` 时，Local Main Session Task执行对应分支。
            if (block.type === 'text') {
              // Local Main Session Task在这里处理 `tokenCount += roughTokenCountEstimation(block.text)`，完成这一小步状态转换。
              tokenCount += roughTokenCountEstimation(block.text)
            // Local Main Session Task在这里处理 `} else if (block.type === 'tool_use') {`，完成这一小步状态转换。
            } else if (block.type === 'tool_use') {
              // Local Main Session Task在这里处理 `toolCount++`，完成这一小步状态转换。
              toolCount++
              // activity 集中保存Local Main Session Task要一起传递的字段。
              const activity: ToolActivity = {
                toolName: block.name,
                input: block.input as Record<string, unknown>,
              }
              // recentActivities 集合追加新条目，保持收集顺序与输入顺序一致。
              recentActivities.push(activity)
              // 满足 `recentActivities.length > MAX_RECENT_ACTIVITIES` 时，Local Main Session Task执行该分支。
              if (recentActivities.length > MAX_RECENT_ACTIVITIES) {
                // 调用 recentActivities.shift，触发Local Main Session Task此处需要的副作用。
                recentActivities.shift()
              }
            }
          }
        }

        // setAppState 写入新的状态值，使Local Main Session Task后续读取保持一致。
        setAppState(prev => {
          // task读取 `prev.tasks[taskId]` 对应条目，后续围绕该成员继续处理。
          const task = prev.tasks[taskId]
          // `!task || task.type` 与 `'local_agent'` 不一致时刷新派生状态，避免使用过期结果。
          if (!task || task.type !== 'local_agent') return prev
          // prevProgress 集合保存`task.progress`，供后续判断或组装使用。
          const prevProgress = task.progress
          // Local Main Session Task在这里进入条件判断，后续代码按实际状态分流。
          if (
            prevProgress?.tokenCount === tokenCount &&
            prevProgress.toolUseCount === toolCount &&
            task.messages === bgMessages
          ) {
            // 返回 `prev`，作为Local Main Session Task这次计算的结果。
            return prev
          }
          // 返回结构化结果，集中表达Local Main Session Task已经整理出的状态。
          return {
            ...prev,
            tasks: {
              ...prev.tasks,
              [taskId]: {
                ...task,
                progress: {
                  tokenCount,
                  toolUseCount: toolCount,
                  recentActivities:
                    prevProgress?.toolUseCount === toolCount
                      ? prevProgress.recentActivities
                      : [...recentActivities],
                },
                messages: bgMessages,
              },
            },
          }
        })
      }

      // 调用 completeMainSessionTask，触发Local Main Session Task此处需要的副作用。
      completeMainSessionTask(taskId, true, setAppState)
    } catch (error) {
      // 记录Local Main Session Task运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 调用 completeMainSessionTask，触发Local Main Session Task此处需要的副作用。
      completeMainSessionTask(taskId, false, setAppState)
    }
  })

  // 返回 `taskId`，作为Local Main Session Task这次计算的结果。
  return taskId
}
