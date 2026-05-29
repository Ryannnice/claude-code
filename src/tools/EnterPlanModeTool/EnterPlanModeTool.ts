// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getAllowedChannels,
  handlePlanModeTransition,
} from '../../bootstrap/state.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 applyPermissionUpdate 工具函数，把通用处理留在 ../../utils/permissions/PermissionUpdate.js 中维护。
import { applyPermissionUpdate } from '../../utils/permissions/PermissionUpdate.js'
// 复用 prepareContextForPlanMode 工具函数，把通用处理留在 ../../utils/permissions/permissionSetup.js 中维护。
import { prepareContextForPlanMode } from '../../utils/permissions/permissionSetup.js'
// 复用 isPlanModeInterviewPhaseEnabled 工具函数，把通用处理留在 ../../utils/planModeV2.js 中维护。
import { isPlanModeInterviewPhaseEnabled } from '../../utils/planModeV2.js'
// 引入 ENTER_PLAN_MODE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { ENTER_PLAN_MODE_TOOL_NAME } from './constants.js'
// 引入 getEnterPlanModeToolPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getEnterPlanModeToolPrompt } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseRejectedMessage,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    // No parameters needed
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    message: z.string().describe('Confirmation that plan mode was entered'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// EnterPlanModeTool构建`buildTool({`，供后续判断或组装使用。
export const EnterPlanModeTool: Tool<InputSchema, Output> = buildTool({
  name: ENTER_PLAN_MODE_TOOL_NAME,
  searchHint: 'switch to plan mode to design an approach before coding',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Requests permission to enter plan mode for complex tasks requiring exp...`，作为工具调用这次计算的结果。
    return 'Requests permission to enter plan mode for complex tasks requiring exploration and design'
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getEnterPlanModeToolPrompt()`，作为工具调用这次计算的结果。
    return getEnterPlanModeToolPrompt()
  },
  // 工具实现 Enter Plan Mode Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Enter Plan Mode Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
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
    // When --channels is active, ExitPlanMode is disabled (its approval
    // dialog needs the terminal). Disable entry too so plan mode isn't a
    // trap the model can enter but never leave.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      (feature('KAIROS') || feature('KAIROS_CHANNELS')) &&
      getAllowedChannels().length > 0
    ) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
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
  renderToolUseMessage,
  renderToolResultMessage,
  renderToolUseRejectedMessage,
  // call 使用 _input, context 完成工具调用里的对应操作。
  async call(_input, context) {
    // 满足 `context.agentId` 时，工具调用执行该分支。
    if (context.agentId) {
      // 抛出 new Error('EnterPlanMode tool cannot be used in agent contexts')，阻止工具调用在无效状态下继续运行。
      throw new Error('EnterPlanMode tool cannot be used in agent contexts')
    }

    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // 调用 handlePlanModeTransition，触发工具调用此处需要的副作用。
    handlePlanModeTransition(appState.toolPermissionContext.mode, 'plan')

    // Update the permission mode to 'plan'. prepareContextForPlanMode runs
    // the classifier activation side effects when the user's defaultMode is
    // 'auto' — see permissionSetup.ts for the full lifecycle.
    // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
    context.setAppState(prev => ({
      ...prev,
      toolPermissionContext: applyPermissionUpdate(
        prepareContextForPlanMode(prev.toolPermissionContext),
        { type: 'setMode', mode: 'plan', destination: 'session' },
      ),
    }))

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        message:
          'Entered plan mode. You should now focus on exploring the codebase and designing an implementation approach.',
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 { message }, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam({ message }, toolUseID) {
    // instructions 集合保存`isPlanModeInterviewPhaseEnabled`，供工具调用后续处理使用。
    const instructions = isPlanModeInterviewPhaseEnabled()
      ? `${message}

DO NOT write or edit any files except the plan file. Detailed workflow instructions will follow.`
      : `${message}

In plan mode, you should:
1. Thoroughly explore the codebase to understand existing patterns
2. Identify similar features and architectural approaches
3. Consider multiple approaches and their trade-offs
4. Use AskUserQuestion if you need to clarify the approach
5. Design a concrete implementation strategy
6. When ready, use ExitPlanMode to present your plan for approval

Remember: DO NOT write or edit any files yet. This is a read-only exploration and planning phase.`

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'tool_result',
      content: instructions,
      tool_use_id: toolUseID,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
