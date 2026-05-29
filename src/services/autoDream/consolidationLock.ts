// Lock file whose mtime IS lastConsolidatedAt. Body is the holder's PID.
//
// Lives inside the memory dir (getAutoMemPath) so it keys on git-root
// like memory does, and so it's writable even when the memory path comes
// from an env/settings override whose parent may not be.

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, stat, unlink, utimes, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getOriginalCwd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../bootstrap/state.js'
// 引入 getAutoMemPath，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { getAutoMemPath } from '../../memdir/paths.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isProcessRunning 工具函数，把通用处理留在 ../../utils/genericProcessUtils.js 中维护。
import { isProcessRunning } from '../../utils/genericProcessUtils.js'
// 复用 listCandidates 工具函数，把通用处理留在 ../../utils/listSessionsImpl.js 中维护。
import { listCandidates } from '../../utils/listSessionsImpl.js'
// 复用 getProjectDir 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { getProjectDir } from '../../utils/sessionStorage.js'

// LOCK_FILE 文件数据保存`'.consolidate-lock'`，作为后续固定文本处理的输入。
const LOCK_FILE = '.consolidate-lock'

// Stale past this even if the PID is live (PID reuse guard).
// HOLDER_STALE_MS 集合保存`60 * 60 * 1000`，供服务层 consolidation Lock后续判断或输出使用。
const HOLDER_STALE_MS = 60 * 60 * 1000

// lockPath 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function lockPath(): string {
  // 返回 `join(getAutoMemPath(), LOCK_FILE)`，作为服务层 consolidation Lock这次计算的结果。
  return join(getAutoMemPath(), LOCK_FILE)
}

/**
 * mtime of the lock file = lastConsolidatedAt. 0 if absent.
 * Per-turn cost: one stat.
 */
// readLastConsolidatedAt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readLastConsolidatedAt(): Promise<number> {
  // 保护这一段可能失败的服务层 consolidation Lock操作，确保异常能进入相邻错误处理。
  try {
    // s 集合保存`stat`，供服务层 consolidation Lock后续处理使用。
    const s = await stat(lockPath())
    // 返回 `s.mtimeMs`，作为服务层 consolidation Lock这次计算的结果。
    return s.mtimeMs
  } catch {
    // 返回 `0`，作为服务层 consolidation Lock这次计算的结果。
    return 0
  }
}

/**
 * Acquire: write PID → mtime = now. Returns the pre-acquire mtime
 * (for rollback), or null if blocked / lost a race.
 *
 *   Success → do nothing. mtime stays at now.
 *   Failure → rollbackConsolidationLock(priorMtime) rewinds mtime.
 *   Crash   → mtime stuck, dead PID → next process reclaims.
 */
// tryAcquireConsolidationLock 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tryAcquireConsolidationLock(): Promise<number | null> {
  // 路径保存`lockPath`，供服务层 consolidation Lock后续处理使用。
  const path = lockPath()

  // mtimeMs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let mtimeMs: number | undefined
  // holderPid 先占位，稍后的条件分支会根据实际输入补齐它。
  let holderPid: number | undefined
  // 保护这一段可能失败的服务层 consolidation Lock操作，确保异常能进入相邻错误处理。
  try {
    // 并行获取 s、raw，缩短服务层 consolidation Lock等待多个独立异步任务的时间。
    const [s, raw] = await Promise.all([stat(path), readFile(path, 'utf8')])
    // mtimeMs 集合更新为 `s.mtimeMs`，确保服务层后续读取最新状态。
    mtimeMs = s.mtimeMs
    // 解析结果解析`parseInt`，供服务层 consolidation Lock后续处理使用。
    const parsed = parseInt(raw.trim(), 10)
    // holderPid更新为 `Number.isFinite(parsed) ? parsed : undefined`，确保服务层后续读取最新状态。
    holderPid = Number.isFinite(parsed) ? parsed : undefined
  } catch {
    // ENOENT — no prior lock.
  }

  // `mtimeMs` 与 `undefined && Date.now() - mtime...` 不一致时刷新派生状态，避免使用过期结果。
  if (mtimeMs !== undefined && Date.now() - mtimeMs < HOLDER_STALE_MS) {
    // `holderPid` 与 `undefined && isProcessRunning(h...` 不一致时刷新派生状态，避免使用过期结果。
    if (holderPid !== undefined && isProcessRunning(holderPid)) {
      // 记录服务层 consolidation Lock运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[autoDream] lock held by live PID ${holderPid} (mtime ${Math.round((Date.now() - mtimeMs) / 1000)}s ago)`,
      )
      // 返回 `null`，作为服务层 consolidation Lock这次计算的结果。
      return null
    }
    // Dead PID or unparseable body — reclaim.
  }

  // Memory dir may not exist yet.
  // 等待 `mkdir(getAutoMemPath(), { recursive: true })` 完成，再继续服务层 consolidation Lock的异步流程。
  await mkdir(getAutoMemPath(), { recursive: true })
  // 等待 `writeFile(path, String(process.pid))` 完成，再继续服务层 consolidation Lock的异步流程。
  await writeFile(path, String(process.pid))

  // Two reclaimers both write → last wins the PID. Loser bails on re-read.
  // verify 先占位，稍后的条件分支会根据实际输入补齐它。
  let verify: string
  // 保护这一段可能失败的服务层 consolidation Lock操作，确保异常能进入相邻错误处理。
  try {
    // verify更新为 `await readFile(path, 'utf8')`，确保服务层后续读取最新状态。
    verify = await readFile(path, 'utf8')
  } catch {
    // 返回 `null`，作为服务层 consolidation Lock这次计算的结果。
    return null
  }
  // `parseInt(verify.trim(), 10)` 与 `process.pid` 不一致时刷新派生状态，避免使用过期结果。
  if (parseInt(verify.trim(), 10) !== process.pid) return null

  // 返回 `mtimeMs ?? 0`，作为服务层 consolidation Lock这次计算的结果。
  return mtimeMs ?? 0
}

/**
 * Rewind mtime to pre-acquire after a failed fork. Clears the PID body —
 * otherwise our still-running process would look like it's holding.
 * priorMtime 0 → unlink (restore no-file).
 */
// rollbackConsolidationLock 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function rollbackConsolidationLock(
  priorMtime: number,
): Promise<void> {
  // 路径保存`lockPath`，供服务层 consolidation Lock后续处理使用。
  const path = lockPath()
  // 保护这一段可能失败的服务层 consolidation Lock操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `priorMtime === 0` 时，服务层 consolidation Lock执行该分支。
    if (priorMtime === 0) {
      // 等待 `unlink(path)` 完成，再继续服务层 consolidation Lock的异步流程。
      await unlink(path)
      // 服务层 consolidation Lock在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 等待 `writeFile(path, '')` 完成，再继续服务层 consolidation Lock的异步流程。
    await writeFile(path, '')
    // t保存`priorMtime / 1000 // utimes wants seconds`，供后续判断或组装使用。
    const t = priorMtime / 1000 // utimes wants seconds
    // 等待 `utimes(path, t, t)` 完成，再继续服务层 consolidation Lock的异步流程。
    await utimes(path, t, t)
  } catch (e: unknown) {
    // 记录服务层 consolidation Lock运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[autoDream] rollback failed: ${(e as Error).message} — next trigger delayed to minHours`,
    )
  }
}

/**
 * Session IDs with mtime after sinceMs. listCandidates handles UUID
 * validation (excludes agent-*.jsonl) and parallel stat.
 *
 * Uses mtime (sessions TOUCHED since), not birthtime (0 on ext4).
 * Caller excludes the current session. Scans per-cwd transcripts — it's
 * a skip-gate, so undercounting worktree sessions is safe.
 */
// listSessionsTouchedSince 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listSessionsTouchedSince(
  sinceMs: number,
): Promise<string[]> {
  // dir读取`getProjectDir`，供服务层 consolidation Lock后续处理使用。
  const dir = getProjectDir(getOriginalCwd())
  // candidates 集合保存`listCandidates`，供服务层 consolidation Lock后续处理使用。
  const candidates = await listCandidates(dir, true)
  // 返回 `candidates.filter(c => c.mtime > sinceMs).map(c => c.sessionId)`，作为服务层 consolidation Lock这次计算的结果。
  return candidates.filter(c => c.mtime > sinceMs).map(c => c.sessionId)
}

/**
 * Stamp from manual /dream. Optimistic — fires at prompt-build time,
 * no post-skill completion hook. Best-effort.
 */
// recordConsolidation 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function recordConsolidation(): Promise<void> {
  // 保护这一段可能失败的服务层 consolidation Lock操作，确保异常能进入相邻错误处理。
  try {
    // Memory dir may not exist yet (manual /dream before any auto-trigger).
    // 等待 `mkdir(getAutoMemPath(), { recursive: true })` 完成，再继续服务层 consolidation Lock的异步流程。
    await mkdir(getAutoMemPath(), { recursive: true })
    // 等待 `writeFile(lockPath(), String(process.pid))` 完成，再继续服务层 consolidation Lock的异步流程。
    await writeFile(lockPath(), String(process.pid))
  } catch (e: unknown) {
    // 记录服务层 consolidation Lock运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[autoDream] recordConsolidation write failed: ${(e as Error).message}`,
    )
  }
}
