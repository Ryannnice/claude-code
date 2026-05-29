// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  executeTaskCompletedHooks,
  getTaskCompletedHookMessage,
} from '../../utils/hooks.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  blockTask,
  deleteTask,
  getTask,
  getTaskListId,
  isTodoV2Enabled,
  listTasks,
  type TaskStatus,
  TaskStatusSchema,
  updateTask,
} from '../../utils/tasks.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getAgentId,
  getAgentName,
  getTeammateColor,
  getTeamName,
} from '../../utils/teammate.js'
// 复用 writeToMailbox 工具函数，把通用处理留在 ../../utils/teammateMailbox.js 中维护。
import { writeToMailbox } from '../../utils/teammateMailbox.js'
// 引入 VERIFICATION_AGENT_TYPE，将 ../AgentTool/constants.js 中已经封装好的能力接到本文件流程里。
import { VERIFICATION_AGENT_TYPE } from '../AgentTool/constants.js'
// 引入 TASK_UPDATE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TASK_UPDATE_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, PROMPT } from './prompt.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => {
  // Extended status schema that includes 'deleted' as a special action
  // TaskUpdateStatusSchema保存`TaskStatusSchema`，供工具调用后续处理使用。
  const TaskUpdateStatusSchema = TaskStatusSchema().or(z.literal('deleted'))

  // 返回 `z.strictObject({`，作为工具调用这次计算的结果。
  return z.strictObject({
    taskId: z.string().describe('The ID of the task to update'),
    subject: z.string().optional().describe('New subject for the task'),
    description: z.string().optional().describe('New description for the task'),
    activeForm: z
      .string()
      .optional()
      .describe(
        'Present continuous form shown in spinner when in_progress (e.g., "Running tests")',
      ),
    status: TaskUpdateStatusSchema.optional().describe(
      'New status for the task',
    ),
    addBlocks: z
      .array(z.string())
      .optional()
      .describe('Task IDs that this task blocks'),
    addBlockedBy: z
      .array(z.string())
      .optional()
      .describe('Task IDs that block this task'),
    owner: z.string().optional().describe('New owner for the task'),
    metadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        'Metadata keys to merge into the task. Set a key to null to delete it.',
      ),
  })
})
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean(),
    taskId: z.string(),
    updatedFields: z.array(z.string()),
    error: z.string().optional(),
    statusChange: z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .optional(),
    verificationNudgeNeeded: z.boolean().optional(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// TaskUpdateTool构建`buildTool`，供工具调用后续处理使用。
export const TaskUpdateTool = buildTool({
  name: TASK_UPDATE_TOOL_NAME,
  searchHint: 'update a task',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `PROMPT`，作为工具调用这次计算的结果。
    return PROMPT
  },
  // 工具实现 Task Update Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Task Update Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'TaskUpdate'`，作为工具调用这次计算的结果。
    return 'TaskUpdate'
  },
  shouldDefer: true,
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isTodoV2Enabled()`，作为工具调用这次计算的结果。
    return isTodoV2Enabled()
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
    const parts = [input.taskId]
    // 满足 `input.status) parts.push(input.status` 时，工具调用执行该分支。
    if (input.status) parts.push(input.status)
    // 满足 `input.subject) parts.push(input.subject` 时，工具调用执行该分支。
    if (input.subject) parts.push(input.subject)
    // 返回 `parts.join(' ')`，作为工具调用这次计算的结果。
    return parts.join(' ')
  },
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  },
  async call(
    {
      taskId,
      subject,
      description,
      activeForm,
      status,
      owner,
      addBlocks,
      addBlockedBy,
      metadata,
    },
    context,
  ) {
    // taskListId 集合读取`getTaskListId`，供工具调用后续处理使用。
    const taskListId = getTaskListId()

    // Auto-expand task list when updating tasks
    // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
    context.setAppState(prev => {
      // 当 `prev.expandedView` 匹配 `'tasks'` 时，工具调用执行对应分支。
      if (prev.expandedView === 'tasks') return prev
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { ...prev, expandedView: 'tasks' as const }
    })

    // Check if task exists
    // existingTask读取`getTask`，供工具调用后续处理使用。
    const existingTask = await getTask(taskListId, taskId)
    // existingTask缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!existingTask) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          success: false,
          taskId,
          updatedFields: [],
          error: 'Task not found',
        },
      }
    }

    // updatedFields 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const updatedFields: string[] = []

    // Update basic fields if provided and different from current value
    // updates 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const updates: {
      subject?: string
      description?: string
      activeForm?: string
      status?: TaskStatus
      owner?: string
      metadata?: Record<string, unknown>
    } = {}
    // `subject` 与 `undefined && subject !== existi...` 不一致时刷新派生状态，避免使用过期结果。
    if (subject !== undefined && subject !== existingTask.subject) {
      // subject更新为 `subject`，确保工具调用后续读取最新状态。
      updates.subject = subject
      // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
      updatedFields.push('subject')
    }
    // `description` 与 `undefined && description !== ex...` 不一致时刷新派生状态，避免使用过期结果。
    if (description !== undefined && description !== existingTask.description) {
      // description更新为 `description`，确保工具调用后续读取最新状态。
      updates.description = description
      // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
      updatedFields.push('description')
    }
    // `activeForm` 与 `undefined && activeForm !== exi...` 不一致时刷新派生状态，避免使用过期结果。
    if (activeForm !== undefined && activeForm !== existingTask.activeForm) {
      // activeForm更新为 `activeForm`，确保工具调用后续读取最新状态。
      updates.activeForm = activeForm
      // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
      updatedFields.push('activeForm')
    }
    // `owner` 与 `undefined && owner !== existing...` 不一致时刷新派生状态，避免使用过期结果。
    if (owner !== undefined && owner !== existingTask.owner) {
      // owner更新为 `owner`，确保工具调用后续读取最新状态。
      updates.owner = owner
      // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
      updatedFields.push('owner')
    }
    // Auto-set owner when a teammate marks a task as in_progress without
    // explicitly providing an owner. This ensures the task list can match
    // todo items to teammates for showing activity status.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      isAgentSwarmsEnabled() &&
      status === 'in_progress' &&
      owner === undefined &&
      !existingTask.owner
    ) {
      // agentName读取`getAgentName`，供工具调用后续处理使用。
      const agentName = getAgentName()
      // 满足 `agentName` 时，工具调用执行该分支。
      if (agentName) {
        // owner更新为 `agentName`，确保工具调用后续读取最新状态。
        updates.owner = agentName
        // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
        updatedFields.push('owner')
      }
    }
    // `metadata` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (metadata !== undefined) {
      // merged集中保存工具实现 Task Update Tool要一起传递的字段。
      const merged = { ...(existingTask.metadata ?? {}) }
      // 循环处理 `const [key, value] of Object.entries(metadata)`，让工具调用把同类条目按顺序走完。
      for (const [key, value] of Object.entries(metadata)) {
        // 满足 `value === null` 时，工具调用执行该分支。
        if (value === null) {
          // 工具实现 Task Update Tool在这里处理 `delete merged[key]`，完成这一小步状态转换。
          delete merged[key]
        } else {
          // merged[key更新为 `value`，确保工具实现 Task Update Tool后续读取最新状态。
          merged[key] = value
        }
      }
      // metadata更新为 `merged`，确保工具调用后续读取最新状态。
      updates.metadata = merged
      // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
      updatedFields.push('metadata')
    }
    // `status` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (status !== undefined) {
      // Handle deletion - delete the task file and return early
      // 当 `status` 匹配 `'deleted'` 时，工具调用执行对应分支。
      if (status === 'deleted') {
        // deleted保存`deleteTask`，供工具调用后续处理使用。
        const deleted = await deleteTask(taskListId, taskId)
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: deleted,
            taskId,
            updatedFields: deleted ? ['deleted'] : [],
            error: deleted ? undefined : 'Failed to delete task',
            statusChange: deleted
              ? { from: existingTask.status, to: 'deleted' }
              : undefined,
          },
        }
      }

      // For regular status updates, validate and apply if different
      // `status` 与 `existingTask.status` 不一致时刷新派生状态，避免使用过期结果。
      if (status !== existingTask.status) {
        // Run TaskCompleted hooks when marking a task as completed
        // 当 `status` 匹配 `'completed'` 时，工具调用执行对应分支。
        if (status === 'completed') {
          // blockingErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
          const blockingErrors: string[] = []

          // generator保存`executeTaskCompletedHooks`，供工具调用后续处理使用。
          const generator = executeTaskCompletedHooks(
            taskId,
            existingTask.subject,
            existingTask.description,
            getAgentName(),
            getTeamName(),
            undefined,
            context?.abortController?.signal,
            undefined,
            context,
          )

          // 逐项读取 `generator` 中的结果，按输入顺序推进工具调用。
          for await (const result of generator) {
            // 满足 `result.blockingError` 时，工具调用执行该分支。
            if (result.blockingError) {
              // blockingErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
              blockingErrors.push(
                getTaskCompletedHookMessage(result.blockingError),
              )
            }
          }

          // 满足 `blockingErrors.length > 0` 时，工具调用执行该分支。
          if (blockingErrors.length > 0) {
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              data: {
                success: false,
                taskId,
                updatedFields: [],
                error: blockingErrors.join('\n'),
              },
            }
          }
        }

        // status 集合更新为 `status`，确保工具调用后续读取最新状态。
        updates.status = status
        // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
        updatedFields.push('status')
      }
    }

    // 满足 `Object.keys(updates).length > 0` 时，工具调用执行该分支。
    if (Object.keys(updates).length > 0) {
      // 等待 `updateTask(taskListId, taskId, updates)` 完成，再继续工具实现 Task Update Tool的异步流程。
      await updateTask(taskListId, taskId, updates)
    }

    // Notify new owner via mailbox when ownership changes
    // 只有 `updates.owner && isAgentSwarmsEnabled()` 满足时，工具调用才执行该分支。
    if (updates.owner && isAgentSwarmsEnabled()) {
      // senderName读取`getAgentName`，供工具调用后续处理使用。
      const senderName = getAgentName() || 'team-lead'
      // senderColor读取`getTeammateColor`，供工具调用后续处理使用。
      const senderColor = getTeammateColor()
      // assignmentMessage 消息数据保存`JSON.stringify`，供工具调用后续处理使用。
      const assignmentMessage = JSON.stringify({
        type: 'task_assignment',
        taskId,
        subject: existingTask.subject,
        description: existingTask.description,
        assignedBy: senderName,
        timestamp: new Date().toISOString(),
      })
      // 等待 `writeToMailbox(` 完成，再继续工具实现 Task Update Tool的异步流程。
      await writeToMailbox(
        updates.owner,
        {
          from: senderName,
          text: assignmentMessage,
          timestamp: new Date().toISOString(),
          color: senderColor,
        },
        taskListId,
      )
    }

    // Add blocks if provided and not already present
    // 只有 `addBlocks && addBlocks.length > 0` 满足时，工具调用才执行该分支。
    if (addBlocks && addBlocks.length > 0) {
      // newBlocks 集合筛选`addBlocks.filter`，供工具调用后续处理使用。
      const newBlocks = addBlocks.filter(
        // 标识符更新为 `> !existingTask.blocks.includes(id)`，确保工具调用后续读取最新状态。
        id => !existingTask.blocks.includes(id),
      )
      // 按顺序遍历 `newBlocks` 中的blockId，逐个交给工具调用处理。
      for (const blockId of newBlocks) {
        // 等待 `blockTask(taskListId, taskId, blockId)` 完成，再继续工具实现 Task Update Tool的异步流程。
        await blockTask(taskListId, taskId, blockId)
      }
      // 满足 `newBlocks.length > 0` 时，工具调用执行该分支。
      if (newBlocks.length > 0) {
        // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
        updatedFields.push('blocks')
      }
    }

    // Add blockedBy if provided and not already present (reverse: the blocker blocks this task)
    // 只有 `addBlockedBy && addBlockedBy.length > 0` 满足时，工具调用才执行该分支。
    if (addBlockedBy && addBlockedBy.length > 0) {
      // newBlockedBy筛选`addBlockedBy.filter`，供工具调用后续处理使用。
      const newBlockedBy = addBlockedBy.filter(
        // 标识符更新为 `> !existingTask.blockedBy.includes(id)`，确保工具调用后续读取最新状态。
        id => !existingTask.blockedBy.includes(id),
      )
      // 按顺序遍历 `newBlockedBy` 中的blockerId，逐个交给工具调用处理。
      for (const blockerId of newBlockedBy) {
        // 等待 `blockTask(taskListId, blockerId, taskId)` 完成，再继续工具实现 Task Update Tool的异步流程。
        await blockTask(taskListId, blockerId, taskId)
      }
      // 满足 `newBlockedBy.length > 0` 时，工具调用执行该分支。
      if (newBlockedBy.length > 0) {
        // updatedFields 集合追加新条目，保持收集顺序与输入顺序一致。
        updatedFields.push('blockedBy')
      }
    }

    // Structural verification nudge: if the main-thread agent just closed
    // out a 3+ task list and none of those tasks was a verification step,
    // append a reminder to the tool result. Fires at the loop-exit moment
    // where skips happen ("when the last task closed, the loop exited").
    // Mirrors the TodoWriteTool nudge for V1 sessions; this covers V2
    // (interactive CLI). TaskUpdateToolOutput is @internal so this field
    // does not touch the public SDK surface.
    // verificationNudgeNeeded标记工具实现 Task Update Tool是否启用对应路径。
    let verificationNudgeNeeded = false
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('VERIFICATION_AGENT') &&
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_hive_evidence', false) &&
      !context.agentId &&
      updates.status === 'completed'
    ) {
      // allTasks 集合保存`listTasks`，供工具调用后续处理使用。
      const allTasks = await listTasks(taskListId)
      // allDone筛选`allTasks.every`，供工具调用后续处理使用。
      const allDone = allTasks.every(t => t.status === 'completed')
      // 工具调用在这里按实际状态进入对应分支。
      if (
        allDone &&
        allTasks.length >= 3 &&
        // 这个回调绑定到 !allTasks.some(t => /verif/i.test(t.subject))，负责工具调用在该局部场景下的响应。
        !allTasks.some(t => /verif/i.test(t.subject))
      ) {
        // verificationNudgeNeeded更新为 `true`，确保工具调用后续读取最新状态。
        verificationNudgeNeeded = true
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        success: true,
        taskId,
        updatedFields,
        statusChange:
          updates.status !== undefined
            ? { from: existingTask.status, to: updates.status }
            : undefined,
        verificationNudgeNeeded,
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 content, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      success,
      taskId,
      updatedFields,
      error,
      statusChange,
      verificationNudgeNeeded,
    } = content as Output
    // success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!success) {
      // Return as non-error so it doesn't trigger sibling tool cancellation
      // in StreamingToolExecutor. "Task not found" is a benign condition
      // (e.g., task list already cleaned up) that the model can handle.
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: error || `Task #${taskId} not found`,
      }
    }

    // resultContent格式化`updatedFields.join`，供工具调用后续处理使用。
    let resultContent = `Updated task #${taskId} ${updatedFields.join(', ')}`

    // Add reminder for teammates when they complete a task (supports in-process teammates)
    // 工具调用在这里按实际状态进入对应分支。
    if (
      statusChange?.to === 'completed' &&
      getAgentId() &&
      isAgentSwarmsEnabled()
    ) {
      // 工具实现 Task Update Tool在这里处理 `resultContent +=`，完成这一小步状态转换。
      resultContent +=
        '\n\nTask completed. Call TaskList now to find your next available task or see if your work unblocked others.'
    }

    // 满足 `verificationNudgeNeeded` 时，工具调用执行该分支。
    if (verificationNudgeNeeded) {
      // 工具实现 Task Update Tool在这里处理 `resultContent += `\n\nNOTE: You just closed out 3+ tasks and none of th...`，完成这一小步状态转换。
      resultContent += `\n\nNOTE: You just closed out 3+ tasks and none of them was a verification step. Before writing your final summary, spawn the verification agent (subagent_type="${VERIFICATION_AGENT_TYPE}"). You cannot self-assign PARTIAL by listing caveats in your summary — only the verifier issues a verdict.`
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: resultContent,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
