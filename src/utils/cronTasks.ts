// Scheduled prompts, stored in <project>/.claude/scheduled_tasks.json.
//
// Tasks come in two flavors:
//   - One-shot (recurring: false/undefined) — fire once, then auto-delete.
//   - Recurring (recurring: true) — fire on schedule, reschedule from now,
//     persist until explicitly deleted via CronDelete or auto-expire after
//     a configurable limit (DEFAULT_CRON_JITTER_CONFIG.recurringMaxAgeMs).
//
// File format:
//   { "tasks": [{ id, cron, prompt, createdAt, recurring?, permanent? }] }

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { readFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  addSessionCronTask,
  getProjectRoot,
  getSessionCronTasks,
  removeSessionCronTasks,
} from '../bootstrap/state.js'
// 引入 computeNextCronRun、parseCronExpression，将 ./cron.js 中已经封装好的能力接到本文件流程里。
import { computeNextCronRun, parseCronExpression } from './cron.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isFsInaccessible } from './errors.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 safeParseJSON，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from './json.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// CronTask 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CronTask = {
  id: string
  /** 5-field cron string (local time) — validated on write, re-validated on read. */
  cron: string
  /** Prompt to enqueue when the task fires. */
  prompt: string
  /** Epoch ms when the task was created. Anchor for missed-task detection. */
  createdAt: number
  /**
   * Epoch ms of the most recent fire. Written back by the scheduler after
   * each recurring fire so next-fire computation survives process restarts.
   * The scheduler anchors first-sight from `lastFiredAt ?? createdAt` — a
   * never-fired task uses createdAt (correct for pinned crons like
   * `30 14 27 2 *` whose next-from-now is next year); a fired-before task
   * reconstructs the same `nextFireAt` the prior process had in memory.
   * Never set for one-shots (they're deleted on fire).
   */
  lastFiredAt?: number
  /** When true, the task reschedules after firing instead of being deleted. */
  recurring?: boolean
  /**
   * When true, the task is exempt from recurringMaxAgeMs auto-expiry.
   * System escape hatch for assistant mode's built-in tasks (catch-up/
   * morning-checkin/dream) — the installer's writeIfMissing() skips existing
   * files so re-install can't recreate them. Not settable via CronCreateTool;
   * only written directly to scheduled_tasks.json by src/assistant/install.ts.
   */
  permanent?: boolean
  /**
   * Runtime-only flag. false → session-scoped (never written to disk).
   * File-backed tasks leave this undefined; writeCronTasks strips it so
   * the on-disk shape stays { id, cron, prompt, createdAt, lastFiredAt?, recurring?, permanent? }.
   */
  durable?: boolean
  /**
   * Runtime-only. When set, the task was created by an in-process teammate.
   * The scheduler routes fires to that teammate's queue instead of the main
   * REPL's. Never written to disk (teammate crons are always session-only).
   */
  agentId?: string
}

// CronFile 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CronFile = { tasks: CronTask[] }

// CRON_FILE_REL 文件数据格式化`join`，供共享工具后续处理使用。
const CRON_FILE_REL = join('.claude', 'scheduled_tasks.json')

/**
 * Path to the cron file. `dir` defaults to getProjectRoot() — pass it
 * explicitly from contexts that don't run through main.tsx (e.g. the Agent
 * SDK daemon, which has no bootstrap state).
 */
// getCronFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCronFilePath(dir?: string): string {
  // 返回 `join(dir ?? getProjectRoot(), CRON_FILE_REL)`，作为共享工具这次计算的结果。
  return join(dir ?? getProjectRoot(), CRON_FILE_REL)
}

/**
 * Read and parse .claude/scheduled_tasks.json. Returns an empty task list if the file
 * is missing, empty, or malformed. Tasks with invalid cron strings are
 * silently dropped (logged at debug level) so a single bad entry never
 * blocks the whole file.
 */
// readCronTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readCronTasks(dir?: string): Promise<CronTask[]> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 原始文本 先占位，稍后的条件分支会根据实际输入补齐它。
  let raw: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 原始文本更新为 `await fs.readFile(getCronFilePath(dir), { encoding: 'utf-...`，确保共享工具后续读取最新状态。
    raw = await fs.readFile(getCronFilePath(dir), { encoding: 'utf-8' })
  } catch (e: unknown) {
    // 满足 `isFsInaccessible(e)` 时，共享工具执行该分支。
    if (isFsInaccessible(e)) return []
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 解析结果保存`safeParseJSON`，供共享工具后续处理使用。
  const parsed = safeParseJSON(raw, false)
  // `!parsed || typeof parsed` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!parsed || typeof parsed !== 'object') return []
  // file 文件数据解析`parsed as Partial<CronFile>`，供后续判断或组装使用。
  const file = parsed as Partial<CronFile>
  // 满足 `!Array.isArray(file.tasks)` 时，共享工具执行该分支。
  if (!Array.isArray(file.tasks)) return []

  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: CronTask[] = []
  // 按顺序遍历 `file.tasks` 中的t，逐个交给共享工具处理。
  for (const t of file.tasks) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !t ||
      typeof t.id !== 'string' ||
      typeof t.cron !== 'string' ||
      typeof t.prompt !== 'string' ||
      typeof t.createdAt !== 'number'
    ) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ScheduledTasks] skipping malformed task: ${jsonStringify(t)}`,
      )
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `!parseCronExpression(t.cron)` 时，共享工具执行该分支。
    if (!parseCronExpression(t.cron)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ScheduledTasks] skipping task ${t.id} with invalid cron '${t.cron}'`,
      )
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // out追加新条目，保持收集顺序与输入顺序一致。
    out.push({
      id: t.id,
      cron: t.cron,
      prompt: t.prompt,
      createdAt: t.createdAt,
      ...(typeof t.lastFiredAt === 'number'
        ? { lastFiredAt: t.lastFiredAt }
        : {}),
      ...(t.recurring ? { recurring: true } : {}),
      ...(t.permanent ? { permanent: true } : {}),
    })
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

/**
 * Sync check for whether the cron file has any valid tasks. Used by
 * cronScheduler.start() to decide whether to auto-enable. One file read.
 */
// hasCronTasksSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasCronTasksSync(dir?: string): boolean {
  // 原始文本 先占位，稍后的条件分支会根据实际输入补齐它。
  let raw: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs -- called once from cronScheduler.start()
    // 原始文本更新为 `readFileSync(getCronFilePath(dir), 'utf-8')`，确保共享工具后续读取最新状态。
    raw = readFileSync(getCronFilePath(dir), 'utf-8')
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 解析结果保存`safeParseJSON`，供共享工具后续处理使用。
  const parsed = safeParseJSON(raw, false)
  // `!parsed || typeof parsed` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!parsed || typeof parsed !== 'object') return false
  // tasks 集合解析`(parsed as Partial<CronFile>).tasks`，供后续判断或组装使用。
  const tasks = (parsed as Partial<CronFile>).tasks
  // 返回 `Array.isArray(tasks) && tasks.length > 0`，作为共享工具这次计算的结果。
  return Array.isArray(tasks) && tasks.length > 0
}

/**
 * Overwrite .claude/scheduled_tasks.json with the given tasks. Creates .claude/ if
 * missing. Empty task list writes an empty file (rather than deleting) so
 * the file watcher sees a change event on last-task-removed.
 */
// writeCronTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeCronTasks(
  tasks: CronTask[],
  dir?: string,
): Promise<void> {
  // root读取`getProjectRoot`，供共享工具后续处理使用。
  const root = dir ?? getProjectRoot()
  // 等待 `mkdir(join(root, '.claude'), { recursive: true })` 完成，再继续共享工具 cron Tasks的异步流程。
  await mkdir(join(root, '.claude'), { recursive: true })
  // Strip the runtime-only `durable` flag — everything on disk is durable
  // by definition, and keeping the flag out means readCronTasks() naturally
  // yields durable: undefined without having to set it explicitly.
  // 请求体 集中保存共享工具 cron Tasks要一起传递的字段。
  const body: CronFile = {
    // 这个回调绑定到 tasks: tasks.map(({ durable: _durable, ...rest }) => rest),，负责共享工具在该局部场景下的响应。
    tasks: tasks.map(({ durable: _durable, ...rest }) => rest),
  }
  // 等待 `writeFile(` 完成，再继续共享工具 cron Tasks的异步流程。
  await writeFile(
    getCronFilePath(root),
    jsonStringify(body, null, 2) + '\n',
    'utf-8',
  )
}

/**
 * Append a task. Returns the generated id. Caller is responsible for having
 * already validated the cron string (the tool does this via validateInput).
 *
 * When `durable` is false the task is held in process memory only
 * (bootstrap/state.ts) — it fires on schedule this session but is never
 * written to .claude/scheduled_tasks.json and dies with the process. The
 * scheduler merges session tasks into its tick loop directly, so no file
 * change event is needed.
 */
// addCronTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function addCronTask(
  cron: string,
  prompt: string,
  recurring: boolean,
  durable: boolean,
  agentId?: string,
): Promise<string> {
  // Short ID — 8 hex chars is plenty for MAX_JOBS=50, avoids slice/prefix
  // juggling between the tool layer (shows short IDs) and disk.
  // 标识符保存`randomUUID`，供共享工具后续处理使用。
  const id = randomUUID().slice(0, 8)
  // task集中保存共享工具 cron Tasks要一起传递的字段。
  const task = {
    id,
    cron,
    prompt,
    createdAt: Date.now(),
    ...(recurring ? { recurring: true } : {}),
  }
  // durable缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!durable) {
    // 调用 addSessionCronTask，触发共享工具此处需要的副作用。
    addSessionCronTask({ ...task, ...(agentId ? { agentId } : {}) })
    // 返回 `id`，作为共享工具这次计算的结果。
    return id
  }
  // tasks 集合读取`readCronTasks`，供共享工具后续处理使用。
  const tasks = await readCronTasks()
  // tasks 集合追加新条目，保持收集顺序与输入顺序一致。
  tasks.push(task)
  // 等待 `writeCronTasks(tasks)` 完成，再继续共享工具 cron Tasks的异步流程。
  await writeCronTasks(tasks)
  // 返回 `id`，作为共享工具这次计算的结果。
  return id
}

/**
 * Remove tasks by id. No-op if none match (e.g. another session raced us).
 * Used for both fire-once cleanup and explicit CronDelete.
 *
 * When called with `dir` undefined (REPL path), also sweeps the in-memory
 * session store — the caller doesn't know which store an id lives in.
 * Daemon callers pass `dir` explicitly; they have no session, and the
 * `dir !== undefined` guard keeps this function from touching bootstrap
 * state on that path (tests enforce this).
 */
// removeCronTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeCronTasks(
  ids: string[],
  dir?: string,
): Promise<void> {
  // ids 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (ids.length === 0) return
  // Sweep session store first. If every id was accounted for there, we're
  // done — skip the file read entirely. removeSessionCronTasks is a no-op
  // (returns 0) on miss, so pre-existing durable-delete paths fall through
  // without allocating.
  // 只有 `dir === undefined && removeSessionCronTasks(ids) === ids.length` 满足时，共享工具才执行该分支。
  if (dir === undefined && removeSessionCronTasks(ids) === ids.length) {
    // 共享工具 cron Tasks在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // idSet保存`Set`，供共享工具后续处理使用。
  const idSet = new Set(ids)
  // tasks 集合读取`readCronTasks`，供共享工具后续处理使用。
  const tasks = await readCronTasks(dir)
  // remaining筛选`tasks.filter`，供共享工具后续处理使用。
  const remaining = tasks.filter(t => !idSet.has(t.id))
  // 满足 `remaining.length === tasks.length` 时，共享工具执行该分支。
  if (remaining.length === tasks.length) return
  // 等待 `writeCronTasks(remaining, dir)` 完成，再继续共享工具 cron Tasks的异步流程。
  await writeCronTasks(remaining, dir)
}

/**
 * Stamp `lastFiredAt` on the given recurring tasks and write back. Batched
 * so N fires in one scheduler tick = one read-modify-write, not N. Only
 * touches file-backed tasks — session tasks die with the process, no point
 * persisting their fire time. No-op if none of the ids match (task was
 * deleted between fire and write — e.g. user ran CronDelete mid-tick).
 *
 * Scheduler lock means at most one process calls this; chokidar picks up
 * the write and triggers a reload which re-seeds `nextFireAt` from the
 * just-written `lastFiredAt` — idempotent (same computation, same answer).
 */
// markCronTasksFired 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markCronTasksFired(
  ids: string[],
  firedAt: number,
  dir?: string,
): Promise<void> {
  // ids 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (ids.length === 0) return
  // idSet保存`Set`，供共享工具后续处理使用。
  const idSet = new Set(ids)
  // tasks 集合读取`readCronTasks`，供共享工具后续处理使用。
  const tasks = await readCronTasks(dir)
  // changed标记共享工具 cron Tasks是否启用对应路径。
  let changed = false
  // 按顺序遍历 `tasks` 中的t，逐个交给共享工具处理。
  for (const t of tasks) {
    // 满足 `idSet.has(t.id)` 时，共享工具执行该分支。
    if (idSet.has(t.id)) {
      // lastFiredAt更新为 `firedAt`，确保共享工具后续读取最新状态。
      t.lastFiredAt = firedAt
      // changed更新为 `true`，确保共享工具后续读取最新状态。
      changed = true
    }
  }
  // changed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!changed) return
  // 等待 `writeCronTasks(tasks, dir)` 完成，再继续共享工具 cron Tasks的异步流程。
  await writeCronTasks(tasks, dir)
}

/**
 * File-backed tasks + session-only tasks, merged. Session tasks get
 * `durable: false` so callers can distinguish them. File tasks are
 * returned as-is (durable undefined → truthy).
 *
 * Only merges when `dir` is undefined — daemon callers (explicit `dir`)
 * have no session store to merge with.
 */
// listAllCronTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listAllCronTasks(dir?: string): Promise<CronTask[]> {
  // fileTasks 文件数据读取`readCronTasks`，供共享工具后续处理使用。
  const fileTasks = await readCronTasks(dir)
  // `dir` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (dir !== undefined) return fileTasks
  // sessionTasks 会话数据读取`getSessionCronTasks`，供共享工具后续处理使用。
  const sessionTasks = getSessionCronTasks().map(t => ({
    ...t,
    durable: false as const,
  }))
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...fileTasks, ...sessionTasks]
}

/**
 * Next fire time in epoch ms for a cron string, strictly after `fromMs`.
 * Returns null if invalid or no match in the next 366 days.
 */
// nextCronRunMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function nextCronRunMs(cron: string, fromMs: number): number | null {
  // fields 集合解析`parseCronExpression`，供共享工具后续处理使用。
  const fields = parseCronExpression(cron)
  // fields 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!fields) return null
  // next保存`computeNextCronRun`，供共享工具后续处理使用。
  const next = computeNextCronRun(fields, new Date(fromMs))
  // 返回 `next ? next.getTime() : null`，作为共享工具这次计算的结果。
  return next ? next.getTime() : null
}

/**
 * Cron scheduler tuning knobs. Sourced at runtime from the
 * `tengu_kairos_cron_config` GrowthBook JSON config (see cronJitterConfig.ts)
 * so ops can adjust behavior fleet-wide without shipping a client build.
 * Defaults here preserve the pre-config behavior exactly.
 */
// CronJitterConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CronJitterConfig = {
  /** Recurring-task forward delay as a fraction of the interval between fires. */
  recurringFrac: number
  /** Upper bound on recurring forward delay regardless of interval length. */
  recurringCapMs: number
  /** One-shot backward lead: maximum ms a task may fire early. */
  oneShotMaxMs: number
  /**
   * One-shot backward lead: minimum ms a task fires early when the minute-mod
   * gate matches. 0 = taskIds hashing near zero fire on the exact mark. Raise
   * this to guarantee nobody lands on the wall-clock boundary.
   */
  oneShotFloorMs: number
  /**
   * Jitter fires landing on minutes where `minute % N === 0`. 30 → :00/:30
   * (the human-rounding hotspots). 15 → :00/:15/:30/:45. 1 → every minute.
   */
  oneShotMinuteMod: number
  /**
   * Recurring tasks auto-expire this many ms after creation (unless marked
   * `permanent`). Cron is the primary driver of multi-day sessions (p99
   * uptime 61min → 53h post-#19931), and unbounded recurrence lets Tier-1
   * heap leaks compound indefinitely. The default (7 days) covers "check
   * my PRs every hour this week" workflows while capping worst-case
   * session lifetime. Permanent tasks (assistant mode's catch-up/
   * morning-checkin/dream) never age out — they can't be recreated if
   * deleted because install.ts's writeIfMissing() skips existing files.
   *
   * `0` = unlimited (tasks never auto-expire).
   */
  recurringMaxAgeMs: number
}

// DEFAULT_CRON_JITTER_CONFIG 配置 集中保存共享工具 cron Tasks要一起传递的字段。
export const DEFAULT_CRON_JITTER_CONFIG: CronJitterConfig = {
  recurringFrac: 0.1,
  recurringCapMs: 15 * 60 * 1000,
  oneShotMaxMs: 90 * 1000,
  oneShotFloorMs: 0,
  oneShotMinuteMod: 30,
  recurringMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
}

/**
 * taskId is an 8-hex-char UUID slice (see {@link addCronTask}) → parse as
 * u32 → [0, 1). Stable across restarts, uniformly distributed across the
 * fleet. Non-hex ids (hand-edited JSON) fall back to 0 = no jitter.
 */
// jitterFrac 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function jitterFrac(taskId: string): number {
  // frac解析`parseInt`，供共享工具后续处理使用。
  const frac = parseInt(taskId.slice(0, 8), 16) / 0x1_0000_0000
  // 返回 `Number.isFinite(frac) ? frac : 0`，作为共享工具这次计算的结果。
  return Number.isFinite(frac) ? frac : 0
}

/**
 * Same as {@link nextCronRunMs}, plus a deterministic per-task delay to
 * avoid a thundering herd when many sessions schedule the same cron string
 * (e.g. `0 * * * *` → everyone hits inference at :00).
 *
 * The delay is proportional to the current gap between fires
 * ({@link CronJitterConfig.recurringFrac}, capped at
 * {@link CronJitterConfig.recurringCapMs}) so at defaults an hourly task
 * spreads across [:00, :06) but a per-minute task only spreads by a few
 * seconds.
 *
 * Only used for recurring tasks. One-shot tasks use
 * {@link oneShotJitteredNextCronRunMs} (backward jitter, minute-gated).
 */
// jitteredNextCronRunMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function jitteredNextCronRunMs(
  cron: string,
  fromMs: number,
  taskId: string,
  cfg: CronJitterConfig = DEFAULT_CRON_JITTER_CONFIG,
): number | null {
  // 临时值 t1保存`nextCronRunMs`，供共享工具后续处理使用。
  const t1 = nextCronRunMs(cron, fromMs)
  // 满足 `t1 === null` 时，共享工具执行该分支。
  if (t1 === null) return null
  // 临时值 t2保存`nextCronRunMs`，供共享工具后续处理使用。
  const t2 = nextCronRunMs(cron, t1)
  // No second match in the next year (e.g. pinned date) → nothing to
  // proportion against, and near-certainly not a herd risk. Fire on t1.
  // 满足 `t2 === null` 时，共享工具执行该分支。
  if (t2 === null) return t1
  // jitter保存`Math.min`，供共享工具后续处理使用。
  const jitter = Math.min(
    jitterFrac(taskId) * cfg.recurringFrac * (t2 - t1),
    cfg.recurringCapMs,
  )
  // 返回 `t1 + jitter`，作为共享工具这次计算的结果。
  return t1 + jitter
}

/**
 * Same as {@link nextCronRunMs}, minus a deterministic per-task lead time
 * when the fire time lands on a minute boundary matching
 * {@link CronJitterConfig.oneShotMinuteMod}.
 *
 * One-shot tasks are user-pinned ("remind me at 3pm") so delaying them
 * breaks the contract — but firing slightly early is invisible and spreads
 * the inference spike from everyone picking the same round wall-clock time.
 * At defaults (mod 30, max 90 s, floor 0) only :00 and :30 get jitter,
 * because humans round to the half-hour.
 *
 * During an incident, ops can push `tengu_kairos_cron_config` with e.g.
 * `{oneShotMinuteMod: 15, oneShotMaxMs: 300000, oneShotFloorMs: 30000}` to
 * spread :00/:15/:30/:45 fires across a [t-5min, t-30s] window — every task
 * gets at least 30 s of lead, so nobody lands on the exact mark.
 *
 * Checks the computed fire time rather than the cron string so
 * `0 15 * * *`, step expressions, and `0,30 9 * * *` all get jitter
 * when they land on a matching minute. Clamped to `fromMs` so a task created
 * inside its own jitter window doesn't fire before it was created.
 */
// oneShotJitteredNextCronRunMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function oneShotJitteredNextCronRunMs(
  cron: string,
  fromMs: number,
  taskId: string,
  cfg: CronJitterConfig = DEFAULT_CRON_JITTER_CONFIG,
): number | null {
  // 临时值 t1保存`nextCronRunMs`，供共享工具后续处理使用。
  const t1 = nextCronRunMs(cron, fromMs)
  // 满足 `t1 === null` 时，共享工具执行该分支。
  if (t1 === null) return null
  // Cron resolution is 1 minute → computed times always have :00 seconds,
  // so a minute-field check is sufficient to identify the hot marks.
  // getMinutes() (local), not getUTCMinutes(): cron is evaluated in local
  // time, and "user picked a round time" means round in *their* TZ. In
  // half-hour-offset zones (India UTC+5:30) local :00 is UTC :30 — the
  // UTC check would jitter the wrong marks.
  // `new Date(t1).getMinutes() % cfg.oneShotMinu...` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (new Date(t1).getMinutes() % cfg.oneShotMinuteMod !== 0) return t1
  // floor + frac * (max - floor) → uniform over [floor, max). With floor=0
  // this reduces to the original frac * max. With floor>0, even a taskId
  // hashing to 0 gets `floor` ms of lead — nobody fires on the exact mark.
  // lead 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lead =
    cfg.oneShotFloorMs +
    jitterFrac(taskId) * (cfg.oneShotMaxMs - cfg.oneShotFloorMs)
  // t1 > fromMs is guaranteed by nextCronRunMs (strictly after), so the
  // max() only bites when the task was created inside its own lead window.
  // 返回 `Math.max(t1 - lead, fromMs)`，作为共享工具这次计算的结果。
  return Math.max(t1 - lead, fromMs)
}

/**
 * A task is "missed" when its next scheduled run (computed from createdAt)
 * is in the past. Surfaced to the user at startup. Works for both one-shot
 * and recurring tasks — a recurring task whose window passed while Claude
 * was down is still "missed".
 */
// findMissedTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findMissedTasks(tasks: CronTask[], nowMs: number): CronTask[] {
  // 返回 `tasks.filter(t => {`，作为共享工具这次计算的结果。
  return tasks.filter(t => {
    // next保存`nextCronRunMs`，供共享工具后续处理使用。
    const next = nextCronRunMs(t.cron, t.createdAt)
    // 返回 `next !== null && next < nowMs`，作为共享工具这次计算的结果。
    return next !== null && next < nowMs
  })
}
