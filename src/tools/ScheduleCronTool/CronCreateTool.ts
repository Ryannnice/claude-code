// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 setScheduledTasksEnabled，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { setScheduledTasksEnabled } from '../../bootstrap/state.js'
// 类型依赖 { ValidationResult } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ValidationResult } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 cronToHuman、parseCronExpression 工具函数，把通用处理留在 ../../utils/cron.js 中维护。
import { cronToHuman, parseCronExpression } from '../../utils/cron.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  addCronTask,
  getCronFilePath,
  listAllCronTasks,
  nextCronRunMs,
} from '../../utils/cronTasks.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 semanticBoolean 工具函数，把通用处理留在 ../../utils/semanticBoolean.js 中维护。
import { semanticBoolean } from '../../utils/semanticBoolean.js'
// 复用 getTeammateContext 工具函数，把通用处理留在 ../../utils/teammateContext.js 中维护。
import { getTeammateContext } from '../../utils/teammateContext.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  buildCronCreateDescription,
  buildCronCreatePrompt,
  CRON_CREATE_TOOL_NAME,
  DEFAULT_MAX_AGE_DAYS,
  isDurableCronEnabled,
  isKairosCronEnabled,
} from './prompt.js'
// 引入 renderCreateResultMessage、renderCreateToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderCreateResultMessage, renderCreateToolUseMessage } from './UI.js'

// MAX_JOBS 集合 命名 `50`，让后续代码直接表达这个值的用途。
const MAX_JOBS = 50

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    cron: z
      .string()
      .describe(
        'Standard 5-field cron expression in local time: "M H DoM Mon DoW" (e.g. "*/5 * * * *" = every 5 minutes, "30 14 28 2 *" = Feb 28 at 2:30pm local once).',
      ),
    prompt: z.string().describe('The prompt to enqueue at each fire time.'),
    recurring: semanticBoolean(z.boolean().optional()).describe(
      `true (default) = fire on every cron match until deleted or auto-expired after ${DEFAULT_MAX_AGE_DAYS} days. false = fire once at the next match, then auto-delete. Use false for "remind me at X" one-shot requests with pinned minute/hour/dom/month.`,
    ),
    durable: semanticBoolean(z.boolean().optional()).describe(
      'true = persist to .claude/scheduled_tasks.json and survive restarts. false (default) = in-memory only, dies when this Claude session ends. Use true only when the user asks the task to survive across sessions.',
    ),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    id: z.string(),
    humanSchedule: z.string(),
    recurring: z.boolean(),
    durable: z.boolean().optional(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// CreateOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type CreateOutput = z.infer<OutputSchema>

// CronCreateTool构建`buildTool`，供工具调用后续处理使用。
export const CronCreateTool = buildTool({
  name: CRON_CREATE_TOOL_NAME,
  searchHint: 'schedule a recurring or one-shot prompt',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // 工具实现 Cron Create Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Cron Create Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
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
    // 返回 ``${input.cron}: ${input.prompt}``，作为工具调用这次计算的结果。
    return `${input.cron}: ${input.prompt}`
  },
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `buildCronCreateDescription(isDurableCronEnabled())`，作为工具调用这次计算的结果。
    return buildCronCreateDescription(isDurableCronEnabled())
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `buildCronCreatePrompt(isDurableCronEnabled())`，作为工具调用这次计算的结果。
    return buildCronCreatePrompt(isDurableCronEnabled())
  },
  // getPath不依赖额外参数，直接计算工具调用需要的结果。
  getPath() {
    // 返回 `getCronFilePath()`，作为工具调用这次计算的结果。
    return getCronFilePath()
  },
  // validateInput 使用 input 完成工具调用里的对应操作。
  async validateInput(input): Promise<ValidationResult> {
    // 满足 `!parseCronExpression(input.cron)` 时，工具调用执行该分支。
    if (!parseCronExpression(input.cron)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Invalid cron expression '${input.cron}'. Expected 5 fields: M H DoM Mon DoW.`,
        errorCode: 1,
      }
    }
    // 满足 `nextCronRunMs(input.cron, Date.now()) === null` 时，工具调用执行该分支。
    if (nextCronRunMs(input.cron, Date.now()) === null) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Cron expression '${input.cron}' does not match any calendar date in the next year.`,
        errorCode: 2,
      }
    }
    // tasks 集合保存`listAllCronTasks`，供工具调用后续处理使用。
    const tasks = await listAllCronTasks()
    // 满足 `tasks.length >= MAX_JOBS` 时，工具调用执行该分支。
    if (tasks.length >= MAX_JOBS) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Too many scheduled jobs (max ${MAX_JOBS}). Cancel one first.`,
        errorCode: 3,
      }
    }
    // Teammates don't persist across sessions, so a durable teammate cron
    // would orphan on restart (agentId would point to a nonexistent teammate).
    // 只有 `input.durable && getTeammateContext()` 满足时，工具调用才执行该分支。
    if (input.durable && getTeammateContext()) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message:
          'durable crons are not supported for teammates (teammates do not persist across sessions)',
        errorCode: 4,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  // call 使用 { cron, prompt, recurring = true, durable = false… 完成工具调用里的对应操作。
  async call({ cron, prompt, recurring = true, durable = false }) {
    // Kill switch forces session-only; schema stays stable so the model sees
    // no validation errors when the gate flips mid-session.
    // effectiveDurable保存`isDurableCronEnabled`，供工具调用后续处理使用。
    const effectiveDurable = durable && isDurableCronEnabled()
    // 标识符保存`addCronTask`，供工具调用后续处理使用。
    const id = await addCronTask(
      cron,
      prompt,
      recurring,
      effectiveDurable,
      getTeammateContext()?.agentId,
    )
    // Enable the scheduler so the task fires in this session. The
    // useScheduledTasks hook polls this flag and will start watching
    // on the next tick. For durable: false tasks the file never changes
    // — check() reads the session store directly — but the enable flag
    // is still what starts the tick loop.
    // setScheduledTasksEnabled 写入新的状态值，使工具调用后续读取保持一致。
    setScheduledTasksEnabled(true)
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        id,
        humanSchedule: cronToHuman(cron),
        recurring,
        durable: effectiveDurable,
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // where保存`output.durable`，供工具实现 Cron Create Tool后续判断或输出使用。
    const where = output.durable
      ? 'Persisted to .claude/scheduled_tasks.json'
      : 'Session-only (not written to disk, dies when Claude exits)'
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: output.recurring
        ? `Scheduled recurring job ${output.id} (${output.humanSchedule}). ${where}. Auto-expires after ${DEFAULT_MAX_AGE_DAYS} days. Use CronDelete to cancel sooner.`
        : `Scheduled one-shot task ${output.id} (${output.humanSchedule}). ${where}. It will fire once then auto-delete.`,
    }
  },
  renderToolUseMessage: renderCreateToolUseMessage,
  renderToolResultMessage: renderCreateResultMessage,
} satisfies ToolDef<InputSchema, CreateOutput>)
