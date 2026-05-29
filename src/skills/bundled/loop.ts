// 整理这一组导入，让loop后续逻辑可以直接复用这些外部能力。
import {
  CRON_CREATE_TOOL_NAME,
  CRON_DELETE_TOOL_NAME,
  DEFAULT_MAX_AGE_DAYS,
  isKairosCronEnabled,
} from '../../tools/ScheduleCronTool/prompt.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// DEFAULT_INTERVAL 命名 `'10m'`，让后续代码直接表达这个值的用途。
const DEFAULT_INTERVAL = '10m'

// USAGE_MESSAGE 消息数据读取 ``Usage: /loop [interval] <prompt>` 对应条目，后续围绕该成员继续处理。
const USAGE_MESSAGE = `Usage: /loop [interval] <prompt>

Run a prompt or slash command on a recurring interval.

Intervals: Ns, Nm, Nh, Nd (e.g. 5m, 30m, 2h, 1d). Minimum granularity is 1 minute.
If no interval is specified, defaults to ${DEFAULT_INTERVAL}.

Examples:
  /loop 5m /babysit-prs
  /loop 30m check the deploy
  /loop 1h /standup 1
  /loop check the deploy          (defaults to ${DEFAULT_INTERVAL})
  /loop check the deploy every 20m`

// buildPrompt 封装loop的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildPrompt(args: string): string {
  // 返回 ``# /loop — schedule a recurring prompt`，作为loop这次计算的结果。
  return `# /loop — schedule a recurring prompt

Parse the input below into \`[interval] <prompt…>\` and schedule it with ${CRON_CREATE_TOOL_NAME}.

## Parsing (in priority order)

1. **Leading token**: if the first whitespace-delimited token matches \`^\\d+[smhd]$\` (e.g. \`5m\`, \`2h\`), that's the interval; the rest is the prompt.
2. **Trailing "every" clause**: otherwise, if the input ends with \`every <N><unit>\` or \`every <N> <unit-word>\` (e.g. \`every 20m\`, \`every 5 minutes\`, \`every 2 hours\`), extract that as the interval and strip it from the prompt. Only match when what follows "every" is a time expression — \`check every PR\` has no interval.
3. **Default**: otherwise, interval is \`${DEFAULT_INTERVAL}\` and the entire input is the prompt.

If the resulting prompt is empty, show usage \`/loop [interval] <prompt>\` and stop — do not call ${CRON_CREATE_TOOL_NAME}.

Examples:
- \`5m /babysit-prs\` → interval \`5m\`, prompt \`/babysit-prs\` (rule 1)
- \`check the deploy every 20m\` → interval \`20m\`, prompt \`check the deploy\` (rule 2)
- \`run tests every 5 minutes\` → interval \`5m\`, prompt \`run tests\` (rule 2)
- \`check the deploy\` → interval \`${DEFAULT_INTERVAL}\`, prompt \`check the deploy\` (rule 3)
- \`check every PR\` → interval \`${DEFAULT_INTERVAL}\`, prompt \`check every PR\` (rule 3 — "every" not followed by time)
- \`5m\` → empty prompt → show usage

## Interval → cron

Supported suffixes: \`s\` (seconds, rounded up to nearest minute, min 1), \`m\` (minutes), \`h\` (hours), \`d\` (days). Convert:

| Interval pattern      | Cron expression     | Notes                                    |
|-----------------------|---------------------|------------------------------------------|
| \`Nm\` where N ≤ 59   | \`*/N * * * *\`     | every N minutes                          |
| \`Nm\` where N ≥ 60   | \`0 */H * * *\`     | round to hours (H = N/60, must divide 24)|
| \`Nh\` where N ≤ 23   | \`0 */N * * *\`     | every N hours                            |
| \`Nd\`                | \`0 0 */N * *\`     | every N days at midnight local           |
| \`Ns\`                | treat as \`ceil(N/60)m\` | cron minimum granularity is 1 minute  |

**If the interval doesn't cleanly divide its unit** (e.g. \`7m\` → \`*/7 * * * *\` gives uneven gaps at :56→:00; \`90m\` → 1.5h which cron can't express), pick the nearest clean interval and tell the user what you rounded to before scheduling.

## Action

1. Call ${CRON_CREATE_TOOL_NAME} with:
   - \`cron\`: the expression from the table above
   - \`prompt\`: the parsed prompt from above, verbatim (slash commands are passed through unchanged)
   - \`recurring\`: \`true\`
2. Briefly confirm: what's scheduled, the cron expression, the human-readable cadence, that recurring tasks auto-expire after ${DEFAULT_MAX_AGE_DAYS} days, and that they can cancel sooner with ${CRON_DELETE_TOOL_NAME} (include the job ID).
3. **Then immediately execute the parsed prompt now** — don't wait for the first cron fire. If it's a slash command, invoke it via the Skill tool; otherwise act on it directly.

## Input

${args}`
}

// registerLoopSkill 封装loop的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerLoopSkill(): void {
  // 调用 registerBundledSkill，触发loop此处需要的副作用。
  registerBundledSkill({
    name: 'loop',
    description:
      'Run a prompt or slash command on a recurring interval (e.g. /loop 5m /foo, defaults to 10m)',
    whenToUse:
      'When the user wants to set up a recurring task, poll for status, or run something repeatedly on an interval (e.g. "check the deploy every 5 minutes", "keep running /babysit-prs"). Do NOT invoke for one-off tasks.',
    argumentHint: '[interval] <prompt>',
    userInvocable: true,
    isEnabled: isKairosCronEnabled,
    // getPromptForCommand 根据 args 读取或计算loop需要的结果。
    async getPromptForCommand(args) {
      // trimmed格式化`args.trim`，供loop后续处理使用。
      const trimmed = args.trim()
      // trimmed缺失时提前走兜底路径，避免loop继续依赖无效输入。
      if (!trimmed) {
        // 返回列表结果，保留loop已经排好的条目顺序。
        return [{ type: 'text', text: USAGE_MESSAGE }]
      }
      // 返回列表结果，保留loop已经排好的条目顺序。
      return [{ type: 'text', text: buildPrompt(trimmed) }]
    },
  })
}
