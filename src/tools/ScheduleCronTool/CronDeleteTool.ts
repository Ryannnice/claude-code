// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 类型依赖 { ValidationResult } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ValidationResult } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getCronFilePath,
  listAllCronTasks,
  removeCronTasks,
} from '../../utils/cronTasks.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 getTeammateContext 工具函数，把通用处理留在 ../../utils/teammateContext.js 中维护。
import { getTeammateContext } from '../../utils/teammateContext.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildCronDeletePrompt,
  CRON_DELETE_DESCRIPTION,
  CRON_DELETE_TOOL_NAME,
  isDurableCronEnabled,
  isKairosCronEnabled,
} from './prompt.js'
// 引入 renderDeleteResultMessage、renderDeleteToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderDeleteResultMessage, renderDeleteToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    id: z.string().describe('Job ID returned by CronCreate.'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    id: z.string(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// DeleteOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type DeleteOutput = z.infer<OutputSchema>

// CronDeleteTool构建`buildTool`，供工具调用后续处理使用。
export const CronDeleteTool = buildTool({
  name: CRON_DELETE_TOOL_NAME,
  searchHint: 'cancel a scheduled cron job',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // 工具实现 Cron Delete Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Cron Delete Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isKairosCronEnabled()`，作为工具调用这次计算的结果。
    return isKairosCronEnabled()
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.id`，作为工具调用这次计算的结果。
    return input.id
  },
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `CRON_DELETE_DESCRIPTION`，作为工具调用这次计算的结果。
    return CRON_DELETE_DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `buildCronDeletePrompt(isDurableCronEnabled())`，作为工具调用这次计算的结果。
    return buildCronDeletePrompt(isDurableCronEnabled())
  },
  // getPath不依赖额外参数，直接计算工具调用需要的结果。
  getPath() {
    // 返回 `getCronFilePath()`，作为工具调用这次计算的结果。
    return getCronFilePath()
  },
  // validateInput 使用 input 完成工具调用里的对应操作。
  async validateInput(input): Promise<ValidationResult> {
    // tasks 集合保存`listAllCronTasks`，供工具调用后续处理使用。
    const tasks = await listAllCronTasks()
    // task筛选`tasks.find`，供工具调用后续处理使用。
    const task = tasks.find(t => t.id === input.id)
    // task缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!task) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `No scheduled job with id '${input.id}'`,
        errorCode: 1,
      }
    }
    // Teammates may only delete their own crons.
    // ctx读取`getTeammateContext`，供工具调用后续处理使用。
    const ctx = getTeammateContext()
    // `ctx && task.agentId` 与 `ctx.agentId` 不一致时刷新派生状态，避免使用过期结果。
    if (ctx && task.agentId !== ctx.agentId) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Cannot delete cron job '${input.id}': owned by another agent`,
        errorCode: 2,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // call 使用 { id } 完成工具调用里的对应操作。
  async call({ id }) {
    // 等待 `removeCronTasks([id])` 完成，再继续工具实现 Cron Delete Tool的异步流程。
    await removeCronTasks([id])
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { data: { id } }
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `Cancelled job ${output.id}.`,
    }
  },
  renderToolUseMessage: renderDeleteToolUseMessage,
  renderToolResultMessage: renderDeleteResultMessage,
} satisfies ToolDef<InputSchema, DeleteOutput>)
