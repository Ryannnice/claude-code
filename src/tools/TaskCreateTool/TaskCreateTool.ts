// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  executeTaskCreatedHooks,
  getTaskCreatedHookMessage,
} from '../../utils/hooks.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  createTask,
  deleteTask,
  getTaskListId,
  isTodoV2Enabled,
} from '../../utils/tasks.js'
// 复用 getAgentName、getTeamName 工具函数，把通用处理留在 ../../utils/teammate.js 中维护。
import { getAgentName, getTeamName } from '../../utils/teammate.js'
// 引入 TASK_CREATE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TASK_CREATE_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、getPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, getPrompt } from './prompt.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    subject: z.string().describe('A brief title for the task'),
    description: z.string().describe('What needs to be done'),
    activeForm: z
      .string()
      .optional()
      .describe(
        'Present continuous form shown in spinner when in_progress (e.g., "Running tests")',
      ),
    metadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Arbitrary metadata to attach to the task'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    task: z.object({
      id: z.string(),
      subject: z.string(),
    }),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// TaskCreateTool构建`buildTool`，供工具调用后续处理使用。
export const TaskCreateTool = buildTool({
  name: TASK_CREATE_TOOL_NAME,
  searchHint: 'create a task in the task list',
  maxResultSizeChars: 100_000,
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
  // 工具实现 Task Create Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Task Create Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'TaskCreate'`，作为工具调用这次计算的结果。
    return 'TaskCreate'
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
    // 返回 `input.subject`，作为工具调用这次计算的结果。
    return input.subject
  },
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  },
  // call 使用 { subject, description, activeForm, metadata }, c… 完成工具调用里的对应操作。
  async call({ subject, description, activeForm, metadata }, context) {
    // taskId构建`createTask`，供工具调用后续处理使用。
    const taskId = await createTask(getTaskListId(), {
      subject,
      description,
      activeForm,
      status: 'pending',
      owner: undefined,
      blocks: [],
      blockedBy: [],
      metadata,
    })

    // blockingErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
    const blockingErrors: string[] = []
    // generator保存`executeTaskCreatedHooks`，供工具调用后续处理使用。
    const generator = executeTaskCreatedHooks(
      taskId,
      subject,
      description,
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
        blockingErrors.push(getTaskCreatedHookMessage(result.blockingError))
      }
    }

    // 满足 `blockingErrors.length > 0` 时，工具调用执行该分支。
    if (blockingErrors.length > 0) {
      // 等待 `deleteTask(getTaskListId(), taskId)` 完成，再继续工具实现 Task Create Tool的异步流程。
      await deleteTask(getTaskListId(), taskId)
      // 抛出 new Error(blockingErrors.join('\n'))，阻止工具调用在无效状态下继续运行。
      throw new Error(blockingErrors.join('\n'))
    }

    // Auto-expand task list when creating tasks
    // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
    context.setAppState(prev => {
      // 当 `prev.expandedView` 匹配 `'tasks'` 时，工具调用执行对应分支。
      if (prev.expandedView === 'tasks') return prev
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { ...prev, expandedView: 'tasks' as const }
    })

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        task: {
          id: taskId,
          subject,
        },
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 content, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    // 从 `content as Output` 解构 task，减少工具实现 Task Create Tool对同一对象的重复访问。
    const { task } = content as Output
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `Task #${task.id} created successfully: ${task.subject}`,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
