// Scheduler lease lock for .claude/scheduled_tasks.json.
//
// When multiple Claude sessions run in the same project directory, only one
// should drive the cron scheduler. The first session to acquire this lock
// becomes the scheduler; others stay passive and periodically probe the lock.
// If the owner dies (PID no longer running), a passive session takes over.
//
// Pattern mirrors computerUseLock.ts: O_EXCL atomic create, PID liveness
// probe, stale-lock recovery, cleanup-on-exit.

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getProjectRoot、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot, getSessionId } from '../bootstrap/state.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from './errors.js'
// 引入 isProcessRunning，将 ./genericProcessUtils.js 中已经封装好的能力接到本文件流程里。
import { isProcessRunning } from './genericProcessUtils.js'
// 引入 safeParseJSON，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from './json.js'
// 引入 lazySchema，将 ./lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from './lazySchema.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'

// LOCK_FILE_REL 文件数据格式化`join`，供共享工具后续处理使用。
const LOCK_FILE_REL = join('.claude', 'scheduled_tasks.lock')

// schedulerLockSchema保存`lazySchema`，供共享工具后续处理使用。
const schedulerLockSchema = lazySchema(() =>
  z.object({
    sessionId: z.string(),
    pid: z.number(),
    acquiredAt: z.number(),
  }),
)
// SchedulerLock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SchedulerLock = z.infer<ReturnType<typeof schedulerLockSchema>>

/**
 * Options for out-of-REPL callers (Agent SDK daemon) that don't have
 * bootstrap state. When omitted, falls back to getProjectRoot() +
 * getSessionId() as before. lockIdentity should be stable for the lifetime
 * of one daemon process (e.g. a randomUUID() captured at startup).
 */
// SchedulerLockOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SchedulerLockOptions = {
  dir?: string
  lockIdentity?: string
}

// 这个回调绑定到 let unregisterCleanup: (() => void) | undefined，负责共享工具在该局部场景下的响应。
let unregisterCleanup: (() => void) | undefined
// Suppress repeat "held by X" log lines when polling a live owner.
// lastBlockedBy 先占位，稍后的条件分支会根据实际输入补齐它。
let lastBlockedBy: string | undefined

// getLockPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLockPath(dir?: string): string {
  // 返回 `join(dir ?? getProjectRoot(), LOCK_FILE_REL)`，作为共享工具这次计算的结果。
  return join(dir ?? getProjectRoot(), LOCK_FILE_REL)
}

// readLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readLock(dir?: string): Promise<SchedulerLock | undefined> {
  // 原始文本 先占位，稍后的条件分支会根据实际输入补齐它。
  let raw: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 原始文本更新为 `await readFile(getLockPath(dir), 'utf8')`，确保共享工具后续读取最新状态。
    raw = await readFile(getLockPath(dir), 'utf8')
  } catch {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 结果保存`schedulerLockSchema`，供共享工具后续处理使用。
  const result = schedulerLockSchema().safeParse(safeParseJSON(raw, false))
  // 返回 `result.success ? result.data : undefined`，作为共享工具这次计算的结果。
  return result.success ? result.data : undefined
}

// tryCreateExclusive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryCreateExclusive(
  lock: SchedulerLock,
  dir?: string,
): Promise<boolean> {
  // 路径读取`getLockPath`，供共享工具后续处理使用。
  const path = getLockPath(dir)
  // 请求体保存`jsonStringify`，供共享工具后续处理使用。
  const body = jsonStringify(lock)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(path, body, { flag: 'wx' })` 完成，再继续共享工具 cron Tasks Lock的异步流程。
    await writeFile(path, body, { flag: 'wx' })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'EEXIST'` 时，共享工具执行对应分支。
    if (code === 'EEXIST') return false
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // .claude/ doesn't exist yet — create it and retry once. In steady
      // state the dir already exists (scheduled_tasks.json lives there),
      // so this path is hit at most once.
      // 等待 `mkdir(dirname(path), { recursive: true })` 完成，再继续共享工具 cron Tasks Lock的异步流程。
      await mkdir(dirname(path), { recursive: true })
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `writeFile(path, body, { flag: 'wx' })` 完成，再继续共享工具 cron Tasks Lock的异步流程。
        await writeFile(path, body, { flag: 'wx' })
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      } catch (retryErr: unknown) {
        // 当 `getErrnoCode(retryErr)` 匹配 `'EEXIST'` 时，共享工具执行对应分支。
        if (getErrnoCode(retryErr) === 'EEXIST') return false
        // 抛出 retryErr，阻止共享工具在无效状态下继续运行。
        throw retryErr
      }
    }
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

// registerLockCleanup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function registerLockCleanup(opts?: SchedulerLockOptions): void {
  // 调用 unregisterCleanup?.()，完成这一处局部操作。
  unregisterCleanup?.()
  // unregisterCleanup更新为 `registerCleanup(async () => {`，确保共享工具后续读取最新状态。
  unregisterCleanup = registerCleanup(async () => {
    // 等待 `releaseSchedulerLock(opts)` 完成，再继续共享工具 cron Tasks Lock的异步流程。
    await releaseSchedulerLock(opts)
  })
}

/**
 * Try to acquire the scheduler lock for the current session.
 * Returns true on success, false if another live session holds it.
 *
 * Uses O_EXCL ('wx') for atomic test-and-set. If the file exists:
 *   - Already ours → true (idempotent re-acquire)
 *   - Another live PID → false
 *   - Stale (PID dead / corrupt) → unlink and retry exclusive create once
 *
 * If two sessions race to recover a stale lock, only one create succeeds.
 */
// tryAcquireSchedulerLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tryAcquireSchedulerLock(
  opts?: SchedulerLockOptions,
): Promise<boolean> {
  // dir保存`opts?.dir`，供后续判断或组装使用。
  const dir = opts?.dir
  // "sessionId" in the lock file is really just a stable owner key. REPL
  // uses getSessionId(); daemon callers supply their own UUID. PID remains
  // the liveness signal regardless.
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = opts?.lockIdentity ?? getSessionId()
  // lock 集中保存共享工具 cron Tasks Lock要一起传递的字段。
  const lock: SchedulerLock = {
    sessionId,
    pid: process.pid,
    acquiredAt: Date.now(),
  }

  // 满足 `await tryCreateExclusive(lock, dir)` 时，共享工具执行该分支。
  if (await tryCreateExclusive(lock, dir)) {
    // lastBlockedBy更新为 `undefined`，确保共享工具后续读取最新状态。
    lastBlockedBy = undefined
    // 调用 registerLockCleanup，触发共享工具此处需要的副作用。
    registerLockCleanup(opts)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[ScheduledTasks] acquired scheduler lock (PID ${process.pid})`,
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // existing读取`readLock`，供共享工具后续处理使用。
  const existing = await readLock(dir)

  // Already ours (idempotent). After --resume the session ID is restored
  // but the process has a new PID — update the lock file so other sessions
  // see a live PID and don't steal it.
  // 满足 `existing?.sessionId === sessionId` 时，共享工具执行该分支。
  if (existing?.sessionId === sessionId) {
    // `existing.pid` 与 `process.pid` 不一致时刷新派生状态，避免使用过期结果。
    if (existing.pid !== process.pid) {
      // 等待 `writeFile(getLockPath(dir), jsonStringify(lock))` 完成，再继续共享工具 cron Tasks Lock的异步流程。
      await writeFile(getLockPath(dir), jsonStringify(lock))
      // 调用 registerLockCleanup，触发共享工具此处需要的副作用。
      registerLockCleanup(opts)
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Corrupt or unparseable — treat as stale.
  // Another live session — blocked.
  // 只有 `existing && isProcessRunning(existing.pid)` 满足时，共享工具才执行该分支。
  if (existing && isProcessRunning(existing.pid)) {
    // `lastBlockedBy` 与 `existing.sessionId` 不一致时刷新派生状态，避免使用过期结果。
    if (lastBlockedBy !== existing.sessionId) {
      // lastBlockedBy更新为 `existing.sessionId`，确保共享工具后续读取最新状态。
      lastBlockedBy = existing.sessionId
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[ScheduledTasks] scheduler lock held by session ${existing.sessionId} (PID ${existing.pid})`,
      )
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Stale — unlink and retry the exclusive create once.
  // 满足 `existing` 时，共享工具执行该分支。
  if (existing) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[ScheduledTasks] recovering stale scheduler lock from PID ${existing.pid}`,
    )
  }
  // 这个回调绑定到 await unlink(getLockPath(dir)).catch(() => {})，负责共享工具在该局部场景下的响应。
  await unlink(getLockPath(dir)).catch(() => {})
  // 满足 `await tryCreateExclusive(lock, dir)` 时，共享工具执行该分支。
  if (await tryCreateExclusive(lock, dir)) {
    // lastBlockedBy更新为 `undefined`，确保共享工具后续读取最新状态。
    lastBlockedBy = undefined
    // 调用 registerLockCleanup，触发共享工具此处需要的副作用。
    registerLockCleanup(opts)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Another session won the recovery race.
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Release the scheduler lock if the current session owns it.
 */
// releaseSchedulerLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function releaseSchedulerLock(
  opts?: SchedulerLockOptions,
): Promise<void> {
  // 调用 unregisterCleanup?.()，完成这一处局部操作。
  unregisterCleanup?.()
  // unregisterCleanup更新为 `undefined`，确保共享工具后续读取最新状态。
  unregisterCleanup = undefined
  // lastBlockedBy更新为 `undefined`，确保共享工具后续读取最新状态。
  lastBlockedBy = undefined

  // dir保存`opts?.dir`，供后续判断或组装使用。
  const dir = opts?.dir
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = opts?.lockIdentity ?? getSessionId()
  // existing读取`readLock`，供共享工具后续处理使用。
  const existing = await readLock(dir)
  // `!existing || existing.sessionId` 与 `sessionId` 不一致时刷新派生状态，避免使用过期结果。
  if (!existing || existing.sessionId !== sessionId) return
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(getLockPath(dir))` 完成，再继续共享工具 cron Tasks Lock的异步流程。
    await unlink(getLockPath(dir))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[ScheduledTasks] released scheduler lock')
  } catch {
    // Already gone.
  }
}
