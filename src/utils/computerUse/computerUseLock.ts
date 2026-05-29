// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'

// LOCK_FILENAME 文件数据 命名 `'computer-use.lock'`，让后续代码直接表达这个值的用途。
const LOCK_FILENAME = 'computer-use.lock'

// Holds the unregister function for the shutdown cleanup handler.
// Set when the lock is acquired, cleared when released.
// 这个回调绑定到 let unregisterCleanup: (() => void) | undefined，负责共享工具在该局部场景下的响应。
let unregisterCleanup: (() => void) | undefined

// ComputerUseLock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ComputerUseLock = {
  readonly sessionId: string
  readonly pid: number
  readonly acquiredAt: number
}

// AcquireResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AcquireResult =
  | { readonly kind: 'acquired'; readonly fresh: boolean }
  | { readonly kind: 'blocked'; readonly by: string }

// CheckResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CheckResult =
  | { readonly kind: 'free' }
  | { readonly kind: 'held_by_self' }
  | { readonly kind: 'blocked'; readonly by: string }

// FRESH 集中保存共享工具 computer Use Lock要一起传递的字段。
const FRESH: AcquireResult = { kind: 'acquired', fresh: true }
// REENTRANT 集中保存共享工具 computer Use Lock要一起传递的字段。
const REENTRANT: AcquireResult = { kind: 'acquired', fresh: false }

// isComputerUseLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isComputerUseLock(value: unknown): value is ComputerUseLock {
  // `typeof value` 与 `'object' || value === null` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof value !== 'object' || value === null) return false
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    'sessionId' in value &&
    typeof value.sessionId === 'string' &&
    'pid' in value &&
    typeof value.pid === 'number'
  )
}

// getLockPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLockPath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), LOCK_FILENAME)`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), LOCK_FILENAME)
}

// readLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readLock(): Promise<ComputerUseLock | undefined> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 原始文本读取`readFile`，供共享工具后续处理使用。
    const raw = await readFile(getLockPath(), 'utf8')
    // 解析结果解析`jsonParse(raw)`，供后续判断或组装使用。
    const parsed: unknown = jsonParse(raw)
    // 返回 `isComputerUseLock(parsed) ? parsed : undefined`，作为共享工具这次计算的结果。
    return isComputerUseLock(parsed) ? parsed : undefined
  } catch {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}

/**
 * Check whether a process is still running (signal 0 probe).
 *
 * Note: there is a small window for PID reuse — if the owning process
 * exits and an unrelated process is assigned the same PID, the check
 * will return true. This is extremely unlikely in practice.
 */
// isProcessRunning 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isProcessRunning(pid: number): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 process.kill，触发共享工具此处需要的副作用。
    process.kill(pid, 0)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Attempt to create the lock file atomically with O_EXCL.
 * Returns true on success, false if the file already exists.
 * Throws for other errors.
 */
// tryCreateExclusive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryCreateExclusive(lock: ComputerUseLock): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(getLockPath(), jsonStringify(lock), { flag: 'wx' })` 完成，再继续共享工具 computer Use Lock的异步流程。
    await writeFile(getLockPath(), jsonStringify(lock), { flag: 'wx' })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (e: unknown) {
    // 当 `getErrnoCode(e)` 匹配 `'EEXIST'` 时，共享工具执行对应分支。
    if (getErrnoCode(e) === 'EEXIST') return false
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }
}

/**
 * Register a shutdown cleanup handler so the lock is released even if
 * turn-end cleanup is never reached (e.g. the user runs /exit while
 * a tool call is in progress).
 */
// registerLockCleanup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function registerLockCleanup(): void {
  // 调用 unregisterCleanup?.()，完成这一处局部操作。
  unregisterCleanup?.()
  // unregisterCleanup更新为 `registerCleanup(async () => {`，确保共享工具后续读取最新状态。
  unregisterCleanup = registerCleanup(async () => {
    // 等待 `releaseComputerUseLock()` 完成，再继续共享工具 computer Use Lock的异步流程。
    await releaseComputerUseLock()
  })
}

/**
 * Check lock state without acquiring. Used for `request_access` /
 * `list_granted_applications` — the package's `defersLockAcquire` contract:
 * these tools check but don't take the lock, so the enter-notification and
 * overlay don't fire while the model is only asking for permission.
 *
 * Does stale-PID recovery (unlinks) so a dead session's lock doesn't block
 * `request_access`. Does NOT create — that's `tryAcquireComputerUseLock`'s job.
 */
// checkComputerUseLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkComputerUseLock(): Promise<CheckResult> {
  // existing读取`readLock`，供共享工具后续处理使用。
  const existing = await readLock()
  // existing缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!existing) return { kind: 'free' }
  // 满足 `existing.sessionId === getSessionId()` 时，共享工具执行该分支。
  if (existing.sessionId === getSessionId()) return { kind: 'held_by_self' }
  // 满足 `isProcessRunning(existing.pid)` 时，共享工具执行该分支。
  if (isProcessRunning(existing.pid)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'blocked', by: existing.sessionId }
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Recovering stale computer-use lock from session ${existing.sessionId} (PID ${existing.pid})`,
  )
  // 这个回调绑定到 await unlink(getLockPath()).catch(() => {})，负责共享工具在该局部场景下的响应。
  await unlink(getLockPath()).catch(() => {})
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { kind: 'free' }
}

/**
 * Zero-syscall check: does THIS process believe it holds the lock?
 * True iff `tryAcquireComputerUseLock` succeeded and `releaseComputerUseLock`
 * hasn't run yet. Used to gate the per-turn release in `cleanup.ts` so
 * non-CU turns don't touch disk.
 */
// isLockHeldLocally 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLockHeldLocally(): boolean {
  // 返回 `unregisterCleanup !== undefined`，作为共享工具这次计算的结果。
  return unregisterCleanup !== undefined
}

/**
 * Try to acquire the computer-use lock for the current session.
 *
 * `{kind: 'acquired', fresh: true}` — first tool call of a CU turn. Callers fire
 * enter notifications on this. `{kind: 'acquired', fresh: false}` — re-entrant,
 * same session already holds it. `{kind: 'blocked', by}` — another live session
 * holds it.
 *
 * Uses O_EXCL (open 'wx') for atomic test-and-set — the OS guarantees at
 * most one process sees the create succeed. If the file already exists,
 * we check ownership and PID liveness; for a stale lock we unlink and
 * retry the exclusive create once. If two sessions race to recover the
 * same stale lock, only one create succeeds (the other reads the winner).
 */
// tryAcquireComputerUseLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tryAcquireComputerUseLock(): Promise<AcquireResult> {
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // lock 集中保存共享工具 computer Use Lock要一起传递的字段。
  const lock: ComputerUseLock = {
    sessionId,
    pid: process.pid,
    acquiredAt: Date.now(),
  }

  // 等待 `mkdir(getClaudeConfigHomeDir(), { recursive: true })` 完成，再继续共享工具 computer Use Lock的异步流程。
  await mkdir(getClaudeConfigHomeDir(), { recursive: true })

  // Fresh acquisition.
  // 满足 `await tryCreateExclusive(lock)` 时，共享工具执行该分支。
  if (await tryCreateExclusive(lock)) {
    // 调用 registerLockCleanup，触发共享工具此处需要的副作用。
    registerLockCleanup()
    // 返回 `FRESH`，作为共享工具这次计算的结果。
    return FRESH
  }

  // existing读取`readLock`，供共享工具后续处理使用。
  const existing = await readLock()

  // Corrupt/unparseable — treat as stale (can't extract a blocking ID).
  // existing缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!existing) {
    // 这个回调绑定到 await unlink(getLockPath()).catch(() => {})，负责共享工具在该局部场景下的响应。
    await unlink(getLockPath()).catch(() => {})
    // 满足 `await tryCreateExclusive(lock)` 时，共享工具执行该分支。
    if (await tryCreateExclusive(lock)) {
      // 调用 registerLockCleanup，触发共享工具此处需要的副作用。
      registerLockCleanup()
      // 返回 `FRESH`，作为共享工具这次计算的结果。
      return FRESH
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'blocked', by: (await readLock())?.sessionId ?? 'unknown' }
  }

  // Already held by this session.
  // 满足 `existing.sessionId === sessionId` 时，共享工具执行该分支。
  if (existing.sessionId === sessionId) return REENTRANT

  // Another live session holds it — blocked.
  // 满足 `isProcessRunning(existing.pid)` 时，共享工具执行该分支。
  if (isProcessRunning(existing.pid)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { kind: 'blocked', by: existing.sessionId }
  }

  // Stale lock — recover. Unlink then retry the exclusive create.
  // If another session is also recovering, one EEXISTs and reads the winner.
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Recovering stale computer-use lock from session ${existing.sessionId} (PID ${existing.pid})`,
  )
  // 这个回调绑定到 await unlink(getLockPath()).catch(() => {})，负责共享工具在该局部场景下的响应。
  await unlink(getLockPath()).catch(() => {})
  // 满足 `await tryCreateExclusive(lock)` 时，共享工具执行该分支。
  if (await tryCreateExclusive(lock)) {
    // 调用 registerLockCleanup，触发共享工具此处需要的副作用。
    registerLockCleanup()
    // 返回 `FRESH`，作为共享工具这次计算的结果。
    return FRESH
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { kind: 'blocked', by: (await readLock())?.sessionId ?? 'unknown' }
}

/**
 * Release the computer-use lock if the current session owns it. Returns
 * `true` if we actually unlinked the file (i.e., we held it) — callers fire
 * exit notifications on this. Idempotent: subsequent calls return `false`.
 */
// releaseComputerUseLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function releaseComputerUseLock(): Promise<boolean> {
  // 调用 unregisterCleanup?.()，完成这一处局部操作。
  unregisterCleanup?.()
  // unregisterCleanup更新为 `undefined`，确保共享工具后续读取最新状态。
  unregisterCleanup = undefined

  // existing读取`readLock`，供共享工具后续处理使用。
  const existing = await readLock()
  // `!existing || existing.sessionId` 与 `getSessionId()` 不一致时刷新派生状态，避免使用过期结果。
  if (!existing || existing.sessionId !== getSessionId()) return false
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(getLockPath())` 完成，再继续共享工具 computer Use Lock的异步流程。
    await unlink(getLockPath())
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Released computer-use lock')
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
