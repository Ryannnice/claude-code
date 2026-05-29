// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 getFeatureValue_CACHED_WITH_REFRESH 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_WITH_REFRESH } from '../../services/analytics/growthbook.js'
// 复用 DEFAULT_CRON_JITTER_CONFIG 工具函数，把通用处理留在 ../../utils/cronTasks.js 中维护。
import { DEFAULT_CRON_JITTER_CONFIG } from '../../utils/cronTasks.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

// KAIROS_CRON_REFRESH_MS 集合保存`5 * 60 * 1000`，供工具实现 prompt后续判断或输出使用。
const KAIROS_CRON_REFRESH_MS = 5 * 60 * 1000

// DEFAULT_MAX_AGE_DAYS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
export const DEFAULT_MAX_AGE_DAYS =
  DEFAULT_CRON_JITTER_CONFIG.recurringMaxAgeMs / (24 * 60 * 60 * 1000)

/**
 * Unified gate for the cron scheduling system. Combines the build-time
 * `feature('AGENT_TRIGGERS')` flag (dead code elimination) with the runtime
 * `tengu_kairos_cron` GrowthBook gate on a 5-minute refresh window.
 *
 * AGENT_TRIGGERS is independently shippable from KAIROS — the cron module
 * graph (cronScheduler/cronTasks/cronTasksLock/cron.ts + the three tools +
 * /loop skill) has zero imports into src/assistant/ and no feature('KAIROS')
 * calls. The REPL.tsx kairosEnabled read is safe:
 * kairosEnabled is unconditionally in AppStateStore with default false, so
 * when KAIROS is off the scheduler just gets assistantMode: false.
 *
 * Called from Tool.isEnabled() (lazy, post-init) and inside useEffect /
 * imperative setup, never at module scope — so the disk cache has had a
 * chance to populate.
 *
 * The default is `true` — /loop is GA (announced in changelog). GrowthBook
 * is disabled for Bedrock/Vertex/Foundry and when DISABLE_TELEMETRY /
 * CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC are set; a `false` default would
 * break /loop for those users (GH #31759). The GB gate now serves purely as
 * a fleet-wide kill switch — flipping it to `false` stops already-running
 * schedulers on their next isKilled poll tick, not just new ones.
 *
 * `CLAUDE_CODE_DISABLE_CRON` is a local override that wins over GB.
 */
// isKairosCronEnabled 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isKairosCronEnabled(): boolean {
  // 返回 `feature('AGENT_TRIGGERS')`，作为工具调用这次计算的结果。
  return feature('AGENT_TRIGGERS')
    ? !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_CRON) &&
        getFeatureValue_CACHED_WITH_REFRESH(
          'tengu_kairos_cron',
          true,
          KAIROS_CRON_REFRESH_MS,
        )
    : false
}

/**
 * Kill switch for disk-persistent (durable) cron tasks. Narrower than
 * {@link isKairosCronEnabled} — flipping this off forces `durable: false` at
 * the call() site, leaving session-only cron (in-memory, GA) untouched.
 *
 * Defaults to `true` so Bedrock/Vertex/Foundry and DISABLE_TELEMETRY users get
 * durable cron. Does NOT consult CLAUDE_CODE_DISABLE_CRON (that kills the whole
 * scheduler via isKairosCronEnabled).
 */
// isDurableCronEnabled 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDurableCronEnabled(): boolean {
  // 返回 `getFeatureValue_CACHED_WITH_REFRESH(`，作为工具调用这次计算的结果。
  return getFeatureValue_CACHED_WITH_REFRESH(
    'tengu_kairos_cron_durable',
    true,
    KAIROS_CRON_REFRESH_MS,
  )
}

// CRON_CREATE_TOOL_NAME保存`'CronCreate'`，作为后续固定文本处理的输入。
export const CRON_CREATE_TOOL_NAME = 'CronCreate'
// CRON_DELETE_TOOL_NAME固定为 `'CronDelete'`，作为工具实现 prompt后续展示或比较的基准。
export const CRON_DELETE_TOOL_NAME = 'CronDelete'
// CRON_LIST_TOOL_NAME 集合保存`'CronList'`，作为后续固定文本处理的输入。
export const CRON_LIST_TOOL_NAME = 'CronList'

// buildCronCreateDescription 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildCronCreateDescription(durableEnabled: boolean): string {
  // 返回 `durableEnabled`，作为工具调用这次计算的结果。
  return durableEnabled
    ? 'Schedule a prompt to run at a future time — either recurring on a cron schedule, or once at a specific time. Pass durable: true to persist to .claude/scheduled_tasks.json; otherwise session-only.'
    : 'Schedule a prompt to run at a future time within this Claude session — either recurring on a cron schedule, or once at a specific time.'
}

// buildCronCreatePrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildCronCreatePrompt(durableEnabled: boolean): string {
  // durabilitySection保存`durableEnabled`，供后续判断或组装使用。
  const durabilitySection = durableEnabled
    ? `## Durability

By default (durable: false) the job lives only in this Claude session — nothing is written to disk, and the job is gone when Claude exits. Pass durable: true to write to .claude/scheduled_tasks.json so the job survives restarts. Only use durable: true when the user explicitly asks for the task to persist ("keep doing this every day", "set this up permanently"). Most "remind me in 5 minutes" / "check back in an hour" requests should stay session-only.`
    : `## Session-only

Jobs live only in this Claude session — nothing is written to disk, and the job is gone when Claude exits.`

  // durableRuntimeNote 命名 `durableEnabled`，让后续代码直接表达这个值的用途。
  const durableRuntimeNote = durableEnabled
    ? 'Durable jobs persist to .claude/scheduled_tasks.json and survive session restarts — on next launch they resume automatically. One-shot durable tasks that were missed while the REPL was closed are surfaced for catch-up. Session-only jobs die with the process. '
    : ''

  // 返回 ``Schedule a prompt to be enqueued at a future time. Use for both recurr...`，作为工具调用这次计算的结果。
  return `Schedule a prompt to be enqueued at a future time. Use for both recurring schedules and one-shot reminders.

Uses standard 5-field cron in the user's local timezone: minute hour day-of-month month day-of-week. "0 9 * * *" means 9am local — no timezone conversion needed.

## One-shot tasks (recurring: false)

For "remind me at X" or "at <time>, do Y" requests — fire once then auto-delete.
Pin minute/hour/day-of-month/month to specific values:
  "remind me at 2:30pm today to check the deploy" → cron: "30 14 <today_dom> <today_month> *", recurring: false
  "tomorrow morning, run the smoke test" → cron: "57 8 <tomorrow_dom> <tomorrow_month> *", recurring: false

## Recurring jobs (recurring: true, the default)

For "every N minutes" / "every hour" / "weekdays at 9am" requests:
  "*/5 * * * *" (every 5 min), "0 * * * *" (hourly), "0 9 * * 1-5" (weekdays at 9am local)

## Avoid the :00 and :30 minute marks when the task allows it

Every user who asks for "9am" gets \`0 9\`, and every user who asks for "hourly" gets \`0 *\` — which means requests from across the planet land on the API at the same instant. When the user's request is approximate, pick a minute that is NOT 0 or 30:
  "every morning around 9" → "57 8 * * *" or "3 9 * * *" (not "0 9 * * *")
  "hourly" → "7 * * * *" (not "0 * * * *")
  "in an hour or so, remind me to..." → pick whatever minute you land on, don't round

Only use minute 0 or 30 when the user names that exact time and clearly means it ("at 9:00 sharp", "at half past", coordinating with a meeting). When in doubt, nudge a few minutes early or late — the user will not notice, and the fleet will.

${durabilitySection}

## Runtime behavior

Jobs only fire while the REPL is idle (not mid-query). ${durableRuntimeNote}The scheduler adds a small deterministic jitter on top of whatever you pick: recurring tasks fire up to 10% of their period late (max 15 min); one-shot tasks landing on :00 or :30 fire up to 90 s early. Picking an off-minute is still the bigger lever.

Recurring tasks auto-expire after ${DEFAULT_MAX_AGE_DAYS} days — they fire one final time, then are deleted. This bounds session lifetime. Tell the user about the ${DEFAULT_MAX_AGE_DAYS}-day limit when scheduling recurring jobs.

Returns a job ID you can pass to ${CRON_DELETE_TOOL_NAME}.`
}

// CRON_DELETE_DESCRIPTION 命名 `'Cancel a scheduled cron job by ID'`，让后续代码直接表达这个值的用途。
export const CRON_DELETE_DESCRIPTION = 'Cancel a scheduled cron job by ID'
// buildCronDeletePrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildCronDeletePrompt(durableEnabled: boolean): string {
  // 返回 `durableEnabled`，作为工具调用这次计算的结果。
  return durableEnabled
    ? `Cancel a cron job previously scheduled with ${CRON_CREATE_TOOL_NAME}. Removes it from .claude/scheduled_tasks.json (durable jobs) or the in-memory session store (session-only jobs).`
    : `Cancel a cron job previously scheduled with ${CRON_CREATE_TOOL_NAME}. Removes it from the in-memory session store.`
}

// CRON_LIST_DESCRIPTION 集合保存`'List scheduled cron jobs'`，作为后续固定文本处理的输入。
export const CRON_LIST_DESCRIPTION = 'List scheduled cron jobs'
// buildCronListPrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildCronListPrompt(durableEnabled: boolean): string {
  // 返回 `durableEnabled`，作为工具调用这次计算的结果。
  return durableEnabled
    ? `List all cron jobs scheduled via ${CRON_CREATE_TOOL_NAME}, both durable (.claude/scheduled_tasks.json) and session-only.`
    : `List all cron jobs scheduled via ${CRON_CREATE_TOOL_NAME} in this session.`
}
