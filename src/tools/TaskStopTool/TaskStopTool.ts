// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 类型依赖 { TaskStateBase } 来自 ../../Task.js，用于校准工具调用的数据契约。
import type { TaskStateBase } from '../../Task.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 引入 stopTask，将 ../../tasks/stopTask.js 中已经封装好的能力接到本文件流程里。
import { stopTask } from '../../tasks/stopTask.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 DESCRIPTION、TASK_STOP_TOOL_NAME，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, TASK_STOP_TOOL_NAME } from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    task_id: z
      .string()
      .optional()
      .describe('The ID of the background task to stop'),
    // shell_id is accepted for backward compatibility with the deprecated KillShell tool
    shell_id: z.string().optional().describe('Deprecated: use task_id instead'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    message: z.string().describe('Status message about the operation'),
    task_id: z.string().describe('The ID of the task that was stopped'),
    task_type: z.string().describe('The type of the task that was stopped'),
    // Optional: tool outputs are persisted to transcripts and replayed on --resume
    // without re-validation, so sessions from before this field was added lack it.
    command: z
      .string()
      .optional()
      .describe('The command or description of the stopped task'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// TaskStopTool构建`buildTool`，供工具调用后续处理使用。
export const TaskStopTool = buildTool({
  name: TASK_STOP_TOOL_NAME,
  searchHint: 'kill a running background task',
  // KillShell is the deprecated name - kept as alias for backward compatibility
  // with existing transcripts and SDK users
  aliases: ['KillShell'],
  maxResultSizeChars: 100_000,
  // 这个回调绑定到 userFacingName: () => (process.env.USER_TYPE === 'ant' ? '' : 'Stop Task'),，负责工具调用在该局部场景下的响应。
  userFacingName: () => (process.env.USER_TYPE === 'ant' ? '' : 'Stop Task'),
  // 工具实现 Task Stop Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Task Stop Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  shouldDefer: true,
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.task_id ?? input.shell_id ?? ''`，作为工具调用这次计算的结果。
    return input.task_id ?? input.shell_id ?? ''
  },
  // validateInput 使用 { task_id, shell_id }, { getAppState } 完成工具调用里的对应操作。
  async validateInput({ task_id, shell_id }, { getAppState }) {
    // Support both task_id and shell_id (deprecated KillShell compat)
    // 标识符保存`task_id ?? shell_id`，供后续判断或组装使用。
    const id = task_id ?? shell_id
    // 标识符缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!id) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: 'Missing required parameter: task_id',
        errorCode: 1,
      }
    }

    // appState 状态读取`getAppState`，供工具调用后续处理使用。
    const appState = getAppState()
    // task读取 `appState.tasks?.[id] as TaskStateBase | undefined` 对应条目，后续围绕该成员继续处理。
    const task = appState.tasks?.[id] as TaskStateBase | undefined

    // task缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!task) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `No task found with ID: ${id}`,
        errorCode: 1,
      }
    }

    // `task.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (task.status !== 'running') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Task ${id} is not running (status: ${task.status})`,
        errorCode: 3,
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 ``Stop a running background task by ID``，作为工具调用这次计算的结果。
    return `Stop a running background task by ID`
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: jsonStringify(output),
    }
  },
  renderToolUseMessage,
  renderToolResultMessage,
  // 工具实现 Task Stop Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    { task_id, shell_id },
    { getAppState, setAppState, abortController },
  ) {
    // Support both task_id and shell_id (deprecated KillShell compat)
    // 标识符保存`task_id ?? shell_id`，供后续判断或组装使用。
    const id = task_id ?? shell_id
    // 标识符缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!id) {
      // 抛出 new Error('Missing required parameter: task_id')，阻止工具调用在无效状态下继续运行。
      throw new Error('Missing required parameter: task_id')
    }

    // 结果保存`stopTask`，供工具调用后续处理使用。
    const result = await stopTask(id, {
      getAppState,
      setAppState,
    })

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        message: `Successfully stopped task: ${result.taskId} (${result.command})`,
        task_id: result.taskId,
        task_type: result.taskType,
        command: result.command,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
