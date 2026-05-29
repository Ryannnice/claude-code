// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 isTodoV2Enabled 工具函数，把通用处理留在 ../../utils/tasks.js 中维护。
import { isTodoV2Enabled } from '../../utils/tasks.js'
// 复用 TodoListSchema 工具函数，把通用处理留在 ../../utils/todo/types.js 中维护。
import { TodoListSchema } from '../../utils/todo/types.js'
// 引入 VERIFICATION_AGENT_TYPE，将 ../AgentTool/constants.js 中已经封装好的能力接到本文件流程里。
import { VERIFICATION_AGENT_TYPE } from '../AgentTool/constants.js'
// 引入 TODO_WRITE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TODO_WRITE_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, PROMPT } from './prompt.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    todos: TodoListSchema().describe('The updated todo list'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    oldTodos: TodoListSchema().describe('The todo list before the update'),
    newTodos: TodoListSchema().describe('The todo list after the update'),
    verificationNudgeNeeded: z.boolean().optional(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// TodoWriteTool构建`buildTool`，供工具调用后续处理使用。
export const TodoWriteTool = buildTool({
  name: TODO_WRITE_TOOL_NAME,
  searchHint: 'manage the session task checklist',
  maxResultSizeChars: 100_000,
  strict: true,
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
  // 工具实现 Todo Write Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Todo Write Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },
  shouldDefer: true,
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `!isTodoV2Enabled()`，作为工具调用这次计算的结果。
    return !isTodoV2Enabled()
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 ``${input.todos.length} items``，作为工具调用这次计算的结果。
    return `${input.todos.length} items`
  },
  // checkPermissions 使用 input 完成工具调用里的对应操作。
  async checkPermissions(input) {
    // No permission checks required for todo operations
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'allow', updatedInput: input }
  },
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  },
  // call 使用 { todos }, context 完成工具调用里的对应操作。
  async call({ todos }, context) {
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // todoKey读取`getSessionId`，供工具调用后续处理使用。
    const todoKey = context.agentId ?? getSessionId()
    // oldTodos 集合 命名 `appState.todos[todoKey] ?? []`，让后续代码直接表达这个值的用途。
    const oldTodos = appState.todos[todoKey] ?? []
    // allDone筛选`todos.every`，供工具调用后续处理使用。
    const allDone = todos.every(_ => _.status === 'completed')
    // newTodos 集合保存`allDone ? [] : todos`，供工具实现 Todo Write Tool后续判断或输出使用。
    const newTodos = allDone ? [] : todos

    // Structural nudge: if the main-thread agent is closing out a 3+ item
    // list and none of those items was a verification step, append a reminder
    // to the tool result. Fires at the exact loop-exit moment where skips
    // happen ("when the last task closed, the loop exited").
    // verificationNudgeNeeded标记工具实现 Todo Write Tool是否启用对应路径。
    let verificationNudgeNeeded = false
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('VERIFICATION_AGENT') &&
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_hive_evidence', false) &&
      !context.agentId &&
      allDone &&
      todos.length >= 3 &&
      // 这个回调绑定到 !todos.some(t => /verif/i.test(t.content))，负责工具调用在该局部场景下的响应。
      !todos.some(t => /verif/i.test(t.content))
    ) {
      // verificationNudgeNeeded更新为 `true`，确保工具调用后续读取最新状态。
      verificationNudgeNeeded = true
    }

    // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
    context.setAppState(prev => ({
      ...prev,
      todos: {
        ...prev.todos,
        [todoKey]: newTodos,
      },
    }))

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        oldTodos,
        newTodos: todos,
        verificationNudgeNeeded,
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 { verificationNudgeNeeded }, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam({ verificationNudgeNeeded }, toolUseID) {
    // base保存``Todos have been modified successfully. Ensure that you c...`，作为后续固定文本处理的输入。
    const base = `Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable`
    // nudge保存`verificationNudgeNeeded`，供后续判断或组装使用。
    const nudge = verificationNudgeNeeded
      ? `\n\nNOTE: You just closed out 3+ tasks and none of them was a verification step. Before writing your final summary, spawn the verification agent (subagent_type="${VERIFICATION_AGENT_TYPE}"). You cannot self-assign PARTIAL by listing caveats in your summary \u2014 only the verifier issues a verdict.`
      : ''
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: base + nudge,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
