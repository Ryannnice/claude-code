// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 cronToHuman 工具函数，把通用处理留在 ../../utils/cron.js 中维护。
import { cronToHuman } from '../../utils/cron.js'
// 复用 listAllCronTasks 工具函数，把通用处理留在 ../../utils/cronTasks.js 中维护。
import { listAllCronTasks } from '../../utils/cronTasks.js'
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 getTeammateContext 工具函数，把通用处理留在 ../../utils/teammateContext.js 中维护。
import { getTeammateContext } from '../../utils/teammateContext.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildCronListPrompt,
  CRON_LIST_DESCRIPTION,
  CRON_LIST_TOOL_NAME,
  isDurableCronEnabled,
  isKairosCronEnabled,
} from './prompt.js'
// 引入 renderListResultMessage、renderListToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderListResultMessage, renderListToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => z.strictObject({}))
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    jobs: z.array(
      z.object({
        id: z.string(),
        cron: z.string(),
        humanSchedule: z.string(),
        prompt: z.string(),
        recurring: z.boolean().optional(),
        durable: z.boolean().optional(),
      }),
    ),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// ListOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type ListOutput = z.infer<OutputSchema>

// CronListTool 集合构建`buildTool`，供工具调用后续处理使用。
export const CronListTool = buildTool({
  name: CRON_LIST_TOOL_NAME,
  searchHint: 'list active cron jobs',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // 工具实现 Cron List Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Cron List Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isKairosCronEnabled()`，作为工具调用这次计算的结果。
    return isKairosCronEnabled()
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
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `CRON_LIST_DESCRIPTION`，作为工具调用这次计算的结果。
    return CRON_LIST_DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `buildCronListPrompt(isDurableCronEnabled())`，作为工具调用这次计算的结果。
    return buildCronListPrompt(isDurableCronEnabled())
  },
  // call 使用 无 完成工具调用里的对应操作。
  async call() {
    // allTasks 集合保存`listAllCronTasks`，供工具调用后续处理使用。
    const allTasks = await listAllCronTasks()
    // Teammates only see their own crons; team lead (no ctx) sees all.
    // ctx读取`getTeammateContext`，供工具调用后续处理使用。
    const ctx = getTeammateContext()
    // tasks 集合 命名 `ctx`，让后续代码直接表达这个值的用途。
    const tasks = ctx
      // 这个回调绑定到 ? allTasks.filter(t => t.agentId === ctx.agentId)，负责工具调用在该局部场景下的响应。
      ? allTasks.filter(t => t.agentId === ctx.agentId)
      : allTasks
    // jobs 集合派生`tasks.map`，供工具调用后续处理使用。
    const jobs = tasks.map(t => ({
      id: t.id,
      cron: t.cron,
      humanSchedule: cronToHuman(t.cron),
      prompt: t.prompt,
      ...(t.recurring ? { recurring: true } : {}),
      ...(t.durable === false ? { durable: false } : {}),
    }))
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { data: { jobs } }
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content:
        output.jobs.length > 0
          ? output.jobs
              .map(
                // j更新为 `>`，确保工具调用后续读取最新状态。
                j =>
                  `${j.id} — ${j.humanSchedule}${j.recurring ? ' (recurring)' : ' (one-shot)'}${j.durable === false ? ' [session-only]' : ''}: ${truncate(j.prompt, 80, true)}`,
              )
              .join('\n')
          : 'No scheduled jobs.',
    }
  },
  renderToolUseMessage: renderListToolUseMessage,
  renderToolResultMessage: renderListResultMessage,
} satisfies ToolDef<InputSchema, ListOutput>)
