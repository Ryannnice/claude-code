// Non-React scheduler core for .claude/scheduled_tasks.json.
// Shared by REPL (via useScheduledTasks) and SDK/-p mode (print.ts).
//
// Lifecycle: poll getScheduledTasksEnabled() until true (flag flips when
// CronCreate runs or a skill on: trigger fires) → load tasks + watch the
// file + start a 1s check timer → on fire, call onFire(prompt). stop()
// tears everything down.

// 类型依赖 { FSWatcher } 来自 chokidar，用于校准共享工具的数据契约。
import type { FSWatcher } from 'chokidar'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getScheduledTasksEnabled,
  getSessionCronTasks,
  removeSessionCronTasks,
  setScheduledTasksEnabled,
} from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 引入 cronToHuman，将 ./cron.js 中已经封装好的能力接到本文件流程里。
import { cronToHuman } from './cron.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type CronJitterConfig,
  type CronTask,
  DEFAULT_CRON_JITTER_CONFIG,
  findMissedTasks,
  getCronFilePath,
  hasCronTasksSync,
  jitteredNextCronRunMs,
  markCronTasksFired,
  oneShotJitteredNextCronRunMs,
  readCronTasks,
  removeCronTasks,
} from './cronTasks.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  releaseSchedulerLock,
  tryAcquireSchedulerLock,
} from './cronTasksLock.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'

// CHECK_INTERVAL_MS 集合保存`1000`，供后续判断或组装使用。
const CHECK_INTERVAL_MS = 1000
// FILE_STABILITY_MS 文件数据保存`300`，供共享工具 cron Scheduler后续判断或输出使用。
const FILE_STABILITY_MS = 300
// How often a non-owning session re-probes the scheduler lock. Coarse
// because takeover only matters when the owning session has crashed.
// LOCK_PROBE_INTERVAL_MS 集合保存`5000`，供共享工具 cron Scheduler后续判断或输出使用。
const LOCK_PROBE_INTERVAL_MS = 5000
/**
 * True when a recurring task was created more than `maxAgeMs` ago and should
 * be deleted on its next fire. Permanent tasks never age. `maxAgeMs === 0`
 * means unlimited (never ages out). Sourced from
 * {@link CronJitterConfig.recurringMaxAgeMs} at call time.
 * Extracted for testability — the scheduler's check() is buried under
 * setInterval/chokidar/lock machinery.
 */
// isRecurringTaskAged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRecurringTaskAged(
  t: CronTask,
  nowMs: number,
  maxAgeMs: number,
): boolean {
  // 满足 `maxAgeMs === 0` 时，共享工具执行该分支。
  if (maxAgeMs === 0) return false
  // 返回 `Boolean(t.recurring && !t.permanent && nowMs - t.createdAt >= maxAgeMs)`，作为共享工具这次计算的结果。
  return Boolean(t.recurring && !t.permanent && nowMs - t.createdAt >= maxAgeMs)
}

// CronSchedulerOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CronSchedulerOptions = {
  /** Called when a task fires (regular or missed-on-startup). */
  // 这个回调绑定到 onFire: (prompt: string) => void，负责共享工具在该局部场景下的响应。
  onFire: (prompt: string) => void
  /** While true, firing is deferred to the next tick. */
  // 这个回调绑定到 isLoading: () => boolean，负责共享工具在该局部场景下的响应。
  isLoading: () => boolean
  /**
   * When true, bypasses the isLoading gate in check() and auto-enables the
   * scheduler without waiting for setScheduledTasksEnabled(). The
   * auto-enable is the load-bearing part — assistant mode has tasks in
   * scheduled_tasks.json at install time and shouldn't wait on a loader
   * skill to flip the flag. The isLoading bypass is minor post-#20425
   * (assistant mode now idles between turns like a normal REPL).
   */
  assistantMode?: boolean
  /**
   * When provided, receives the full CronTask on normal fires (and onFire is
   * NOT called for that fire). Lets daemon callers see the task id/cron/etc
   * instead of just the prompt string.
   */
  // 这个回调绑定到 onFireTask?: (task: CronTask) => void，负责共享工具在该局部场景下的响应。
  onFireTask?: (task: CronTask) => void
  /**
   * When provided, receives the missed one-shot tasks on initial load (and
   * onFire is NOT called with the pre-formatted notification). Daemon decides
   * how to surface them.
   */
  // 这个回调绑定到 onMissed?: (tasks: CronTask[]) => void，负责共享工具在该局部场景下的响应。
  onMissed?: (tasks: CronTask[]) => void
  /**
   * Directory containing .claude/scheduled_tasks.json. When provided, the
   * scheduler never touches bootstrap state: getProjectRoot/getSessionId are
   * not read, and the getScheduledTasksEnabled() poll is skipped (enable()
   * runs immediately on start). Required for Agent SDK daemon callers.
   */
  dir?: string
  /**
   * Owner key written into the lock file. Defaults to getSessionId().
   * Daemon callers must pass a stable per-process UUID since they have no
   * session. PID remains the liveness probe regardless.
   */
  lockIdentity?: string
  /**
   * Returns the cron jitter config to use for this tick. Called once per
   * check() cycle. REPL callers pass a GrowthBook-backed implementation
   * (see cronJitterConfig.ts) for live tuning — ops can widen the jitter
   * window mid-session during a :00 load spike without restarting clients.
   * Agent SDK daemon callers omit this and get DEFAULT_CRON_JITTER_CONFIG,
   * which is safe since daemons restart on config change anyway, and the
   * growthbook.ts → config.ts → commands.ts → REPL chain stays out of
   * sdk.mjs.
   */
  // 这个回调绑定到 getJitterConfig?: () => CronJitterConfig，负责共享工具在该局部场景下的响应。
  getJitterConfig?: () => CronJitterConfig
  /**
   * Killswitch: polled once per check() tick. When true, check() bails
   * before firing anything — existing crons stop dead mid-session. CLI
   * callers inject `() => !isKairosCronEnabled()` so flipping the
   * tengu_kairos_cron gate off stops already-running schedulers (not just
   * new ones). Daemon callers omit this, same rationale as getJitterConfig.
   */
  // 这个回调绑定到 isKilled?: () => boolean，负责共享工具在该局部场景下的响应。
  isKilled?: () => boolean
  /**
   * Per-task gate applied before any side effect. Tasks returning false are
   * invisible to this scheduler: never fired, never stamped with
   * `lastFiredAt`, never deleted, never surfaced as missed, absent from
   * `getNextFireTime()`. The daemon cron worker uses `t => t.permanent` so
   * non-permanent tasks in the same scheduled_tasks.json are untouched.
   */
  // 这个回调绑定到 filter?: (t: CronTask) => boolean，负责共享工具在该局部场景下的响应。
  filter?: (t: CronTask) => boolean
}

// CronScheduler 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CronScheduler = {
  // 这个回调绑定到 start: () => void，负责共享工具在该局部场景下的响应。
  start: () => void
  // 这个回调绑定到 stop: () => void，负责共享工具在该局部场景下的响应。
  stop: () => void
  /**
   * Epoch ms of the soonest scheduled fire across all loaded tasks, or null
   * if nothing is scheduled (no tasks, or all tasks already in-flight).
   * Daemon callers use this to decide whether to tear down an idle agent
   * subprocess or keep it warm for an imminent fire.
   */
  // 这个回调绑定到 getNextFireTime: () => number | null，负责共享工具在该局部场景下的响应。
  getNextFireTime: () => number | null
}

// createCronScheduler 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCronScheduler(
  options: CronSchedulerOptions,
): CronScheduler {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onFire,
    isLoading,
    assistantMode = false,
    onFireTask,
    onMissed,
    dir,
    lockIdentity,
    getJitterConfig,
    isKilled,
    filter,
  } = options
  // lockOpts 集合标记共享工具 cron Scheduler是否启用对应路径。
  const lockOpts = dir || lockIdentity ? { dir, lockIdentity } : undefined

  // File-backed tasks only. Session tasks (durable: false) are NOT loaded
  // here — they can be added/removed mid-session with no file event, so
  // check() reads them fresh from bootstrap state on every tick instead.
  // tasks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let tasks: CronTask[] = []
  // Per-task next-fire times (epoch ms).
  // nextFireAt构建`new Map<string, number>()`，供后续判断或组装使用。
  const nextFireAt = new Map<string, number>()
  // Ids we've already enqueued a "missed task" prompt for — prevents
  // re-asking on every file change before the user answers.
  // missedAsked构建`new Set<string>()`，供后续判断或组装使用。
  const missedAsked = new Set<string>()
  // Tasks currently enqueued but not yet removed from the file. Prevents
  // double-fire if the interval ticks again before removeCronTasks lands.
  // inFlight构建`new Set<string>()`，供后续判断或组装使用。
  const inFlight = new Set<string>()

  // enablePoll保存`null`，作为后续空值处理的输入。
  let enablePoll: ReturnType<typeof setInterval> | null = null
  // checkTimer 命名 `null`，让后续代码直接表达这个值的用途。
  let checkTimer: ReturnType<typeof setInterval> | null = null
  // lockProbeTimer初始化为空值，后续分支会在有数据时补齐。
  let lockProbeTimer: ReturnType<typeof setInterval> | null = null
  // watcher 命名 `null`，让后续代码直接表达这个值的用途。
  let watcher: FSWatcher | null = null
  // stopped标记共享工具 cron Scheduler是否启用对应路径。
  let stopped = false
  // isOwner标记共享工具 cron Scheduler是否启用对应路径。
  let isOwner = false

  // load 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function load(initial: boolean) {
    // next读取`readCronTasks`，供共享工具后续处理使用。
    const next = await readCronTasks(dir)
    // 满足 `stopped` 时，共享工具执行该分支。
    if (stopped) return
    // tasks 集合更新为 `next`，确保共享工具后续读取最新状态。
    tasks = next

    // Only surface missed tasks on initial load. Chokidar-triggered
    // reloads leave overdue tasks to check() (which anchors from createdAt
    // and fires immediately). This avoids a misleading "missed while Claude
    // was not running" prompt for tasks that became overdue mid-session.
    //
    // Recurring tasks are NOT surfaced or deleted — check() handles them
    // correctly (fires on first tick, reschedules forward). Only one-shot
    // missed tasks need user input (run once now, or discard forever).
    // initial缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!initial) return

    // now记录时间`Date.now`，供共享工具后续处理使用。
    const now = Date.now()
    // missed筛选`findMissedTasks`，供共享工具后续处理使用。
    const missed = findMissedTasks(next, now).filter(
      // t更新为 `> !t.recurring && !missedAsked.has(t.id) && (!filter || f...`，确保共享工具后续读取最新状态。
      t => !t.recurring && !missedAsked.has(t.id) && (!filter || filter(t)),
    )
    // 满足 `missed.length > 0` 时，共享工具执行该分支。
    if (missed.length > 0) {
      // 按顺序遍历 `missed` 中的t，逐个交给共享工具处理。
      for (const t of missed) {
        // 调用 missedAsked.add，触发共享工具此处需要的副作用。
        missedAsked.add(t.id)
        // Prevent check() from re-firing the raw prompt while the async
        // removeCronTasks + chokidar reload chain is in progress.
        // nextFireAt.set 写入新的状态值，使共享工具后续读取保持一致。
        nextFireAt.set(t.id, Infinity)
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_scheduled_task_missed', {
        count: missed.length,
        taskIds: missed
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(t => t.id)
          .join(
            ',',
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 满足 `onMissed` 时，共享工具执行该分支。
      if (onMissed) {
        // 调用 onMissed，触发共享工具此处需要的副作用。
        onMissed(missed)
      } else {
        // 调用 onFire，触发共享工具此处需要的副作用。
        onFire(buildMissedTaskNotification(missed))
      }
      // 显式忽略 `removeCronTasks(` 的返回值，只保留它触发的副作用。
      void removeCronTasks(
        // 调用 missed.map，触发共享工具此处需要的副作用。
        missed.map(t => t.id),
        dir,
      // 这个回调绑定到 ).catch(e =>，负责共享工具在该局部场景下的响应。
      ).catch(e =>
        logForDebugging(`[ScheduledTasks] failed to remove missed tasks: ${e}`),
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ScheduledTasks] surfaced ${missed.length} missed one-shot task(s)`,
      )
    }
  }

  // check 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function check() {
    // 满足 `isKilled?.()` 时，共享工具执行该分支。
    if (isKilled?.()) return
    // 只有 `isLoading() && !assistantMode` 满足时，共享工具才执行该分支。
    if (isLoading() && !assistantMode) return
    // now记录时间`Date.now`，供共享工具后续处理使用。
    const now = Date.now()
    // seen构建`new Set<string>()` 整理出中间结果，供共享工具 cron Scheduler后续步骤使用。
    const seen = new Set<string>()
    // File-backed recurring tasks that fired this tick. Batched into one
    // markCronTasksFired call after the loop so N fires = one write. Session
    // tasks excluded — they die with the process, no point persisting.
    // firedFileRecurring 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const firedFileRecurring: string[] = []
    // Read once per tick. REPL callers pass getJitterConfig backed by
    // GrowthBook so a config push takes effect without restart. Daemon and
    // SDK callers omit it and get DEFAULT_CRON_JITTER_CONFIG (safe — jitter
    // is an ops lever for REPL fleet load-shedding, not a daemon concern).
    // jitterCfg 命名 `getJitterConfig?.() ?? DEFAULT_CRON_JITTER_CONFIG`，让后续代码直接表达这个值的用途。
    const jitterCfg = getJitterConfig?.() ?? DEFAULT_CRON_JITTER_CONFIG

    // Shared loop body. `isSession` routes the one-shot cleanup path:
    // session tasks are removed synchronously from memory, file tasks go
    // through the async removeCronTasks + chokidar reload.
    // process 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function process(t: CronTask, isSession: boolean) {
      // 只有 `filter && !filter(t)` 满足时，共享工具才执行该分支。
      if (filter && !filter(t)) return
      // 调用 seen.add，触发共享工具此处需要的副作用。
      seen.add(t.id)
      // 满足 `inFlight.has(t.id)` 时，共享工具执行该分支。
      if (inFlight.has(t.id)) return

      // next读取`nextFireAt.get`，供共享工具后续处理使用。
      let next = nextFireAt.get(t.id)
      // 满足 `next === undefined` 时，共享工具执行该分支。
      if (next === undefined) {
        // First sight — anchor from lastFiredAt (recurring) or createdAt.
        // Never-fired recurring tasks use createdAt: if isLoading delayed
        // this tick past the fire time, anchoring from `now` would compute
        // next-year for pinned crons (`30 14 27 2 *`). Fired-before tasks
        // use lastFiredAt: the reschedule below writes `now` back to disk,
        // so on next process spawn first-sight computes the SAME newNext we
        // set in-memory here. Without this, a daemon child despawning on
        // idle loses nextFireAt and the next spawn re-anchors from 10-day-
        // old createdAt → fires every task every cycle.
        // next更新为 `t.recurring`，确保共享工具后续读取最新状态。
        next = t.recurring
          ? (jitteredNextCronRunMs(
              t.cron,
              t.lastFiredAt ?? t.createdAt,
              t.id,
              jitterCfg,
            ) ?? Infinity)
          : (oneShotJitteredNextCronRunMs(
              t.cron,
              t.createdAt,
              t.id,
              jitterCfg,
            ) ?? Infinity)
        // nextFireAt.set 写入新的状态值，使共享工具后续读取保持一致。
        nextFireAt.set(t.id, next)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[ScheduledTasks] scheduled ${t.id} for ${next === Infinity ? 'never' : new Date(next).toISOString()}`,
        )
      }

      // 满足 `now < next` 时，共享工具执行该分支。
      if (now < next) return

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ScheduledTasks] firing ${t.id}${t.recurring ? ' (recurring)' : ''}`,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_scheduled_task_fire', {
        recurring: t.recurring ?? false,
        taskId:
          t.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 满足 `onFireTask` 时，共享工具执行该分支。
      if (onFireTask) {
        // 调用 onFireTask，触发共享工具此处需要的副作用。
        onFireTask(t)
      } else {
        // 调用 onFire，触发共享工具此处需要的副作用。
        onFire(t.prompt)
      }

      // Aged-out recurring tasks fall through to the one-shot delete paths
      // below (session tasks get synchronous removal; file tasks get the
      // async inFlight/chokidar path). Fires one last time, then is removed.
      // aged保存`isRecurringTaskAged`，供共享工具后续处理使用。
      const aged = isRecurringTaskAged(t, now, jitterCfg.recurringMaxAgeMs)
      // 满足 `aged` 时，共享工具执行该分支。
      if (aged) {
        // ageHours 集合保存`Math.floor`，供共享工具后续处理使用。
        const ageHours = Math.floor((now - t.createdAt) / 1000 / 60 / 60)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[ScheduledTasks] recurring task ${t.id} aged out (${ageHours}h since creation), deleting after final fire`,
        )
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_scheduled_task_expired', {
          taskId:
            t.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          ageHours,
        })
      }

      // 只有 `t.recurring && !aged` 满足时，共享工具才执行该分支。
      if (t.recurring && !aged) {
        // Recurring: reschedule from now (not from next) to avoid rapid
        // catch-up if the session was blocked. Jitter keeps us off the
        // exact :00 wall-clock boundary every cycle.
        // newNext 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const newNext =
          jitteredNextCronRunMs(t.cron, now, t.id, jitterCfg) ?? Infinity
        // nextFireAt.set 写入新的状态值，使共享工具后续读取保持一致。
        nextFireAt.set(t.id, newNext)
        // Persist lastFiredAt=now so next process spawn reconstructs this
        // same newNext on first-sight. Session tasks skip — process-local.
        // 满足 `!isSession) firedFileRecurring.push(t.id` 时，共享工具执行该分支。
        if (!isSession) firedFileRecurring.push(t.id)
      // 共享工具 cron Scheduler在这里处理 `} else if (isSession) {`，完成这一小步状态转换。
      } else if (isSession) {
        // One-shot (or aged-out recurring) session task: synchronous memory
        // removal. No inFlight window — the next tick will read a session
        // store without this id.
        // 调用 removeSessionCronTasks，触发共享工具此处需要的副作用。
        removeSessionCronTasks([t.id])
        // 调用 nextFireAt.delete，触发共享工具此处需要的副作用。
        nextFireAt.delete(t.id)
      } else {
        // One-shot (or aged-out recurring) file task: delete from disk.
        // inFlight guards against double-fire during the async
        // removeCronTasks + chokidar reload.
        // 调用 inFlight.add，触发共享工具此处需要的副作用。
        inFlight.add(t.id)
        // 显式忽略 `removeCronTasks([t.id], dir)` 的返回值，只保留它触发的副作用。
        void removeCronTasks([t.id], dir)
          // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
          .catch(e =>
            logForDebugging(
              `[ScheduledTasks] failed to remove task ${t.id}: ${e}`,
            ),
          )
          // 链式调用 finally，继续加工上一行在共享工具中产生的数据。
          .finally(() => inFlight.delete(t.id))
        // 调用 nextFireAt.delete，触发共享工具此处需要的副作用。
        nextFireAt.delete(t.id)
      }
    }

    // File-backed tasks: only when we own the scheduler lock. The lock
    // exists to stop two Claude sessions in the same cwd from double-firing
    // the same on-disk task.
    // 满足 `isOwner` 时，共享工具执行该分支。
    if (isOwner) {
      // 逐项读取 `tasks) process(t, false` 中的t，按输入顺序推进共享工具。
      for (const t of tasks) process(t, false)
      // Batched lastFiredAt write. inFlight guards against double-fire
      // during the chokidar-triggered reload (same pattern as removeCronTasks
      // below) — the reload re-seeds `tasks` with the just-written
      // lastFiredAt, and first-sight on that yields the same newNext we
      // already set in-memory, so it's idempotent even without inFlight.
      // Guarding anyway keeps the semantics obvious.
      // 满足 `firedFileRecurring.length > 0` 时，共享工具执行该分支。
      if (firedFileRecurring.length > 0) {
        // 逐项读取 `firedFileRecurring) inFlight.add(id` 中的标识符，按输入顺序推进共享工具。
        for (const id of firedFileRecurring) inFlight.add(id)
        // 显式忽略 `markCronTasksFired(firedFileRecurring, now, dir)` 的返回值，只保留它触发的副作用。
        void markCronTasksFired(firedFileRecurring, now, dir)
          // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
          .catch(e =>
            logForDebugging(
              `[ScheduledTasks] failed to persist lastFiredAt: ${e}`,
            ),
          )
          // 链式调用 finally，继续加工上一行在共享工具中产生的数据。
          .finally(() => {
            // 逐项读取 `firedFileRecurring) inFlight.delete(id` 中的标识符，按输入顺序推进共享工具。
            for (const id of firedFileRecurring) inFlight.delete(id)
          })
      }
    }
    // Session-only tasks: process-private, the lock does not apply — the
    // other session cannot see them and there is no double-fire risk. Read
    // fresh from bootstrap state every tick (no chokidar, no load()). This
    // is skipped on the daemon path (`dir !== undefined`) which never
    // touches bootstrap state.
    // 满足 `dir === undefined` 时，共享工具执行该分支。
    if (dir === undefined) {
      // 逐项读取 `getSessionCronTasks()) process(t, true` 中的t，按输入顺序推进共享工具。
      for (const t of getSessionCronTasks()) process(t, true)
    }

    // 满足 `seen.size === 0` 时，共享工具执行该分支。
    if (seen.size === 0) {
      // No live tasks this tick — clear the whole schedule so
      // getNextFireTime() returns null. The eviction loop below is
      // unreachable here (seen is empty), so stale entries would
      // otherwise survive indefinitely and keep the daemon agent warm.
      // 调用 nextFireAt.clear，触发共享工具此处需要的副作用。
      nextFireAt.clear()
      // 共享工具 cron Scheduler在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Evict schedule entries for tasks no longer present. When !isOwner,
    // file-task ids aren't in `seen` and get evicted — harmless: they
    // re-anchor from createdAt on the first owned tick.
    // 逐项读取 `nextFireAt.keys()` 中的标识符，按输入顺序推进共享工具。
    for (const id of nextFireAt.keys()) {
      // 满足 `!seen.has(id)) nextFireAt.delete(id` 时，共享工具执行该分支。
      if (!seen.has(id)) nextFireAt.delete(id)
    }
  }

  // enable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function enable() {
    // 满足 `stopped` 时，共享工具执行该分支。
    if (stopped) return
    // 满足 `enablePoll` 时，共享工具执行该分支。
    if (enablePoll) {
      // 调用 clearInterval，触发共享工具此处需要的副作用。
      clearInterval(enablePoll)
      // enablePoll更新为 `null`，确保共享工具后续读取最新状态。
      enablePoll = null
    }

    // 从 `await import('chokidar')` 解构 default，减少共享工具 cron Scheduler对同一对象的重复访问。
    const { default: chokidar } = await import('chokidar')
    // 满足 `stopped` 时，共享工具执行该分支。
    if (stopped) return

    // Acquire the per-project scheduler lock. Only the owning session runs
    // check(). Other sessions probe periodically to take over if the owner
    // dies. Prevents double-firing when multiple Claudes share a cwd.
    // isOwner更新为 `await tryAcquireSchedulerLock(lockOpts).catch(() => false)`，确保共享工具后续读取最新状态。
    isOwner = await tryAcquireSchedulerLock(lockOpts).catch(() => false)
    // 满足 `stopped` 时，共享工具执行该分支。
    if (stopped) {
      // 满足 `isOwner` 时，共享工具执行该分支。
      if (isOwner) {
        // isOwner更新为 `false`，确保共享工具后续读取最新状态。
        isOwner = false
        // 显式忽略 `releaseSchedulerLock(lockOpts)` 的返回值，只保留它触发的副作用。
        void releaseSchedulerLock(lockOpts)
      }
      // 共享工具 cron Scheduler在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // isOwner缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!isOwner) {
      // lockProbeTimer更新为 `setInterval(() => {`，确保共享工具后续读取最新状态。
      lockProbeTimer = setInterval(() => {
        // 显式忽略 `tryAcquireSchedulerLock(lockOpts)` 的返回值，只保留它触发的副作用。
        void tryAcquireSchedulerLock(lockOpts)
          // 链式调用 then，继续加工上一行在共享工具中产生的数据。
          .then(owned => {
            // 满足 `stopped` 时，共享工具执行该分支。
            if (stopped) {
              // 满足 `owned) void releaseSchedulerLock(lockOpts` 时，共享工具执行该分支。
              if (owned) void releaseSchedulerLock(lockOpts)
              // 共享工具 cron Scheduler在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // 满足 `owned` 时，共享工具执行该分支。
            if (owned) {
              // isOwner更新为 `true`，确保共享工具后续读取最新状态。
              isOwner = true
              // 满足 `lockProbeTimer` 时，共享工具执行该分支。
              if (lockProbeTimer) {
                // 调用 clearInterval，触发共享工具此处需要的副作用。
                clearInterval(lockProbeTimer)
                // lockProbeTimer更新为 `null`，确保共享工具后续读取最新状态。
                lockProbeTimer = null
              }
            }
          })
          // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
          .catch(e => logForDebugging(String(e), { level: 'error' }))
      }, LOCK_PROBE_INTERVAL_MS)
      // 调用 lockProbeTimer.unref?.()，完成这一处局部操作。
      lockProbeTimer.unref?.()
    }

    // 显式忽略 `load(true)` 的返回值，只保留它触发的副作用。
    void load(true)

    // 路径读取`getCronFilePath`，供共享工具后续处理使用。
    const path = getCronFilePath(dir)
    // watcher更新为 `chokidar.watch(path, {`，确保共享工具后续读取最新状态。
    watcher = chokidar.watch(path, {
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: FILE_STABILITY_MS },
      ignorePermissionErrors: true,
    })
    // 调用 watcher.on，触发共享工具此处需要的副作用。
    watcher.on('add', () => void load(false))
    // 调用 watcher.on，触发共享工具此处需要的副作用。
    watcher.on('change', () => void load(false))
    // 调用 watcher.on，触发共享工具此处需要的副作用。
    watcher.on('unlink', () => {
      // stopped缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!stopped) {
        // tasks 集合更新为 `[]`，确保共享工具后续读取最新状态。
        tasks = []
        // 调用 nextFireAt.clear，触发共享工具此处需要的副作用。
        nextFireAt.clear()
      }
    })

    // checkTimer更新为 `setInterval(check, CHECK_INTERVAL_MS)`，确保共享工具后续读取最新状态。
    checkTimer = setInterval(check, CHECK_INTERVAL_MS)
    // Don't keep the process alive for the scheduler alone — in -p text mode
    // the process should exit after the single turn even if a cron was created.
    // 调用 checkTimer.unref?.()，完成这一处局部操作。
    checkTimer.unref?.()
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // start 使用 无 完成共享工具里的对应操作。
    start() {
      // stopped更新为 `false`，确保共享工具后续读取最新状态。
      stopped = false
      // Daemon path (dir explicitly given): don't touch bootstrap state —
      // getScheduledTasksEnabled() would read a never-initialized flag. The
      // daemon is asking to schedule; just enable.
      // `dir` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (dir !== undefined) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[ScheduledTasks] scheduler start() — dir=${dir}, hasTasks=${hasCronTasksSync(dir)}`,
        )
        // 显式忽略 `enable()` 的返回值，只保留它触发的副作用。
        void enable()
        // 共享工具 cron Scheduler在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ScheduledTasks] scheduler start() — enabled=${getScheduledTasksEnabled()}, hasTasks=${hasCronTasksSync()}`,
      )
      // Auto-enable when scheduled_tasks.json has entries. CronCreateTool
      // also sets this when a task is created mid-session.
      // 共享工具在这里按实际状态进入对应分支。
      if (
        !getScheduledTasksEnabled() &&
        (assistantMode || hasCronTasksSync())
      ) {
        // setScheduledTasksEnabled 写入新的状态值，使共享工具后续读取保持一致。
        setScheduledTasksEnabled(true)
      }
      // 满足 `getScheduledTasksEnabled()` 时，共享工具执行该分支。
      if (getScheduledTasksEnabled()) {
        // 显式忽略 `enable()` 的返回值，只保留它触发的副作用。
        void enable()
        // 共享工具 cron Scheduler在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // enablePoll更新为 `setInterval(`，确保共享工具后续读取最新状态。
      enablePoll = setInterval(
        // en更新为 `> {`，确保共享工具后续读取最新状态。
        en => {
          // 满足 `getScheduledTasksEnabled()) void en(` 时，共享工具执行该分支。
          if (getScheduledTasksEnabled()) void en()
        },
        CHECK_INTERVAL_MS,
        enable,
      )
      // 调用 enablePoll.unref?.()，完成这一处局部操作。
      enablePoll.unref?.()
    },
    // stop 使用 无 完成共享工具里的对应操作。
    stop() {
      // stopped更新为 `true`，确保共享工具后续读取最新状态。
      stopped = true
      // 满足 `enablePoll` 时，共享工具执行该分支。
      if (enablePoll) {
        // 调用 clearInterval，触发共享工具此处需要的副作用。
        clearInterval(enablePoll)
        // enablePoll更新为 `null`，确保共享工具后续读取最新状态。
        enablePoll = null
      }
      // 满足 `checkTimer` 时，共享工具执行该分支。
      if (checkTimer) {
        // 调用 clearInterval，触发共享工具此处需要的副作用。
        clearInterval(checkTimer)
        // checkTimer更新为 `null`，确保共享工具后续读取最新状态。
        checkTimer = null
      }
      // 满足 `lockProbeTimer` 时，共享工具执行该分支。
      if (lockProbeTimer) {
        // 调用 clearInterval，触发共享工具此处需要的副作用。
        clearInterval(lockProbeTimer)
        // lockProbeTimer更新为 `null`，确保共享工具后续读取最新状态。
        lockProbeTimer = null
      }
      // 显式忽略 `watcher?.close()` 的返回值，只保留它触发的副作用。
      void watcher?.close()
      // watcher更新为 `null`，确保共享工具后续读取最新状态。
      watcher = null
      // 满足 `isOwner` 时，共享工具执行该分支。
      if (isOwner) {
        // isOwner更新为 `false`，确保共享工具后续读取最新状态。
        isOwner = false
        // 显式忽略 `releaseSchedulerLock(lockOpts)` 的返回值，只保留它触发的副作用。
        void releaseSchedulerLock(lockOpts)
      }
    },
    // getNextFireTime不依赖额外参数，直接计算共享工具需要的结果。
    getNextFireTime() {
      // nextFireAt uses Infinity for "never" (in-flight one-shots, bad cron
      // strings). Filter those out so callers can distinguish "soon" from
      // "nothing pending".
      // min保存`Infinity`，供后续判断或组装使用。
      let min = Infinity
      // 逐项读取 `nextFireAt.values()` 中的t，按输入顺序推进共享工具。
      for (const t of nextFireAt.values()) {
        // 满足 `t < min` 时，共享工具执行该分支。
        if (t < min) min = t
      }
      // 返回 `min === Infinity ? null : min`，作为共享工具这次计算的结果。
      return min === Infinity ? null : min
    },
  }
}

/**
 * Build the missed-task notification text. Guidance precedes the task list
 * and the list is wrapped in a code fence so a multi-line imperative prompt
 * is not interpreted as immediate instructions to avoid self-inflicted
 * prompt injection. The full prompt body is preserved — this path DOES
 * need the model to execute the prompt after user
 * confirmation, and tasks are already deleted from JSON before the model
 * sees this notification.
 */
// buildMissedTaskNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildMissedTaskNotification(missed: CronTask[]): string {
  // plural 命名 `missed.length > 1`，让后续代码直接表达这个值的用途。
  const plural = missed.length > 1
  // header 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const header =
    `The following one-shot scheduled task${plural ? 's were' : ' was'} missed while Claude was not running. ` +
    `${plural ? 'They have' : 'It has'} already been removed from .claude/scheduled_tasks.json.\n\n` +
    `Do NOT execute ${plural ? 'these prompts' : 'this prompt'} yet. ` +
    `First use the AskUserQuestion tool to ask whether to run ${plural ? 'each one' : 'it'} now. ` +
    `Only execute if the user confirms.`

  // blocks 集合派生`missed.map`，供共享工具后续处理使用。
  const blocks = missed.map(t => {
    // meta保存`cronToHuman`，供共享工具后续处理使用。
    const meta = `[${cronToHuman(t.cron)}, created ${new Date(t.createdAt).toLocaleString()}]`
    // Use a fence one longer than any backtick run in the prompt so a
    // prompt containing ``` cannot close the fence early and un-wrap the
    // trailing text (CommonMark fence-matching rule).
    // longestRun匹配`prompt.match`，供共享工具后续处理使用。
    const longestRun = (t.prompt.match(/`+/g) ?? []).reduce(
      (max, run) => Math.max(max, run.length),
      0,
    )
    const fence = '`'.repeat(Math.max(3, longestRun + 1))
    // 返回 `${meta}\n${fence}\n${t.prompt}\n${fence}`，把共享工具这个分支的结果交还调用方。
    return `${meta}\n${fence}\n${t.prompt}\n${fence}`
  })

  // 返回 `${header}\n\n${blocks.join('\n\n')}`，把共享工具这个分支的结果交还调用方。
  return `${header}\n\n${blocks.join('\n\n')}`
}
