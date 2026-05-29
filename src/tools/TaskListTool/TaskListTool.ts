// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getTaskListId,
  isTodoV2Enabled,
  listTasks,
  TaskStatusSchema,
} from '../../utils/tasks.js'
// 引入 TASK_LIST_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TASK_LIST_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、getPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, getPrompt } from './prompt.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => z.strictObject({}))
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    tasks: z.array(
      z.object({
        id: z.string(),
        subject: z.string(),
        status: TaskStatusSchema(),
        owner: z.string().optional(),
        blockedBy: z.array(z.string()),
      }),
    ),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// TaskListTool 集合构建`buildTool`，供工具调用后续处理使用。
export const TaskListTool = buildTool({
  name: TASK_LIST_TOOL_NAME,
  searchHint: 'list all tasks',
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
  // 工具实现 Task List Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Task List Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'TaskList'`，作为工具调用这次计算的结果。
    return 'TaskList'
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
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  },
  // call 使用 无 完成工具调用里的对应操作。
  async call() {
    // taskListId 集合读取`getTaskListId`，供工具调用后续处理使用。
    const taskListId = getTaskListId()

    // allTasks 集合保存`listTasks`，供工具调用后续处理使用。
    const allTasks = (await listTasks(taskListId)).filter(
      t => !t.metadata?._internal,
    )

    // Build a set of resolved task IDs for filtering
    // resolvedTaskIds 集合保存`Set`，供工具调用后续处理使用。
    const resolvedTaskIds = new Set(
      // 调用 allTasks.filter，触发工具调用此处需要的副作用。
      allTasks.filter(t => t.status === 'completed').map(t => t.id),
    )

    // tasks 集合派生`allTasks.map`，供工具调用后续处理使用。
    const tasks = allTasks.map(task => ({
      id: task.id,
      subject: task.subject,
      status: task.status,
      owner: task.owner,
      // 这个回调绑定到 blockedBy: task.blockedBy.filter(id => !resolvedTaskIds.has(id)),，负责工具调用在该局部场景下的响应。
      blockedBy: task.blockedBy.filter(id => !resolvedTaskIds.has(id)),
    }))

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        tasks,
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 content, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    // 从 `content as Output` 解构 tasks，减少工具实现 Task List Tool对同一对象的重复访问。
    const { tasks } = content as Output
    // tasks 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (tasks.length === 0) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: 'No tasks found',
      }
    }

    // 文本行派生`tasks.map`，供工具调用后续处理使用。
    const lines = tasks.map(task => {
      // owner保存`task.owner ? ` (${task.owner})` : ''`，供后续判断或组装使用。
      const owner = task.owner ? ` (${task.owner})` : ''
      // blocked 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const blocked =
        task.blockedBy.length > 0
          // 这个回调绑定到 ? ` [blocked by ${task.blockedBy.map(id => `#${id}`).join(', ')}]`，负责工具调用在该局部场景下的响应。
          ? ` [blocked by ${task.blockedBy.map(id => `#${id}`).join(', ')}]`
          : ''
      // 返回 ``#${task.id} [${task.status}] ${task.subject}${owner}${blocked}``，作为工具调用这次计算的结果。
      return `#${task.id} [${task.status}] ${task.subject}${owner}${blocked}`
    })

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: lines.join('\n'),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
