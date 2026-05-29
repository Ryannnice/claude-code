// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getTask,
  getTaskListId,
  isTodoV2Enabled,
  TaskStatusSchema,
} from '../../utils/tasks.js'
// 引入 TASK_GET_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TASK_GET_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, PROMPT } from './prompt.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    taskId: z.string().describe('The ID of the task to retrieve'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    task: z
      .object({
        id: z.string(),
        subject: z.string(),
        description: z.string(),
        status: TaskStatusSchema(),
        blocks: z.array(z.string()),
        blockedBy: z.array(z.string()),
      })
      .nullable(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// TaskGetTool构建`buildTool`，供工具调用后续处理使用。
export const TaskGetTool = buildTool({
  name: TASK_GET_TOOL_NAME,
  searchHint: 'retrieve a task by ID',
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
  // 工具实现 Task Get Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Task Get Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'TaskGet'`，作为工具调用这次计算的结果。
    return 'TaskGet'
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
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.taskId`，作为工具调用这次计算的结果。
    return input.taskId
  },
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  },
  // call 使用 { taskId } 完成工具调用里的对应操作。
  async call({ taskId }) {
    // taskListId 集合读取`getTaskListId`，供工具调用后续处理使用。
    const taskListId = getTaskListId()

    // task读取`getTask`，供工具调用后续处理使用。
    const task = await getTask(taskListId, taskId)

    // task缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!task) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          task: null,
        },
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        task: {
          id: task.id,
          subject: task.subject,
          description: task.description,
          status: task.status,
          blocks: task.blocks,
          blockedBy: task.blockedBy,
        },
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 content, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    // 从 `content as Output` 解构 task，减少工具实现 Task Get Tool对同一对象的重复访问。
    const { task } = content as Output
    // task缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!task) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: 'Task not found',
      }
    }

    // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
    const lines = [
      `Task #${task.id}: ${task.subject}`,
      `Status: ${task.status}`,
      `Description: ${task.description}`,
    ]

    // 满足 `task.blockedBy.length > 0` 时，工具调用执行该分支。
    if (task.blockedBy.length > 0) {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(`Blocked by: ${task.blockedBy.map(id => `#${id}`).join(', ')}`)
    }
    // 满足 `task.blocks.length > 0` 时，工具调用执行该分支。
    if (task.blocks.length > 0) {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(`Blocks: ${task.blocks.map(id => `#${id}`).join(', ')}`)
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: lines.join('\n'),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
