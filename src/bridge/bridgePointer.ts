// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 isENOENT 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { isENOENT } from '../utils/errors.js'
// 复用 getWorktreePathsPortable 工具函数，把通用处理留在 ../utils/getWorktreePathsPortable.js 中维护。
import { getWorktreePathsPortable } from '../utils/getWorktreePathsPortable.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  getProjectsDir,
  sanitizePath,
} from '../utils/sessionStoragePortable.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'

/**
 * Upper bound on worktree fanout. git worktree list is naturally bounded
 * (50 is a LOT), but this caps the parallel stat() burst and guards against
 * pathological setups. Above this, --continue falls back to current-dir-only.
 */
// MAX_WORKTREE_FANOUT保存`50`，供远程桥接会话远程桥接 bridge Pointer后续判断或输出使用。
const MAX_WORKTREE_FANOUT = 50

/**
 * Crash-recovery pointer for Remote Control sessions.
 *
 * Written immediately after a bridge session is created, periodically
 * refreshed during the session, and cleared on clean shutdown. If the
 * process dies unclean (crash, kill -9, terminal closed), the pointer
 * persists. On next startup, `claude remote-control` detects it and offers
 * to resume via the --session-id flow from #20460.
 *
 * Staleness is checked against the file's mtime (not an embedded timestamp)
 * so that a periodic re-write with the same content serves as a refresh —
 * matches the backend's rolling BRIDGE_LAST_POLL_TTL (4h) semantics. A
 * bridge that's been polling for 5+ hours and then crashes still has a
 * fresh pointer as long as the refresh ran within the window.
 *
 * Scoped per working directory (alongside transcript JSONL files) so two
 * concurrent bridges in different repos don't clobber each other.
 */

// BRIDGE_POINTER_TTL_MS 集合保存`4 * 60 * 60 * 1000`，供远程桥接会话远程桥接 bridge Pointer后续判断或输出使用。
export const BRIDGE_POINTER_TTL_MS = 4 * 60 * 60 * 1000

// BridgePointerSchema保存`lazySchema`，供远程桥接会话后续处理使用。
const BridgePointerSchema = lazySchema(() =>
  z.object({
    sessionId: z.string(),
    environmentId: z.string(),
    source: z.enum(['standalone', 'repl']),
  }),
)

// BridgePointer 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type BridgePointer = z.infer<ReturnType<typeof BridgePointerSchema>>

// getBridgePointerPath 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBridgePointerPath(dir: string): string {
  // 返回 `join(getProjectsDir(), sanitizePath(dir), 'bridge-pointer.json')`，作为远程桥接会话这次计算的结果。
  return join(getProjectsDir(), sanitizePath(dir), 'bridge-pointer.json')
}

/**
 * Write the pointer. Also used to refresh mtime during long sessions —
 * calling with the same IDs is a cheap no-content-change write that bumps
 * the staleness clock. Best-effort — a crash-recovery file must never
 * itself cause a crash. Logs and swallows on error.
 */
// writeBridgePointer 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeBridgePointer(
  dir: string,
  pointer: BridgePointer,
): Promise<void> {
  // 路径读取`getBridgePointerPath`，供远程桥接会话后续处理使用。
  const path = getBridgePointerPath(dir)
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dirname(path), { recursive: true })` 完成，再继续远程桥接 bridge Pointer的异步流程。
    await mkdir(dirname(path), { recursive: true })
    // 等待 `writeFile(path, jsonStringify(pointer), 'utf8')` 完成，再继续远程桥接 bridge Pointer的异步流程。
    await writeFile(path, jsonStringify(pointer), 'utf8')
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:pointer] wrote ${path}`)
  } catch (err: unknown) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:pointer] write failed: ${err}`, { level: 'warn' })
  }
}

/**
 * Read the pointer and its age (ms since last write). Operates directly
 * and handles errors — no existence check (CLAUDE.md TOCTOU rule). Returns
 * null on any failure: missing file, corrupted JSON, schema mismatch, or
 * stale (mtime > 4h ago). Stale/invalid pointers are deleted so they don't
 * keep re-prompting after the backend has already GC'd the env.
 */
// readBridgePointer 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readBridgePointer(
  dir: string,
): Promise<(BridgePointer & { ageMs: number }) | null> {
  // 路径读取`getBridgePointerPath`，供远程桥接会话后续处理使用。
  const path = getBridgePointerPath(dir)
  // 原始文本 先占位，稍后的条件分支会根据实际输入补齐它。
  let raw: string
  // mtimeMs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let mtimeMs: number
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // stat for mtime (staleness anchor), then read. Two syscalls, but both
    // are needed — mtime IS the data we return, not a TOCTOU guard.
    // mtimeMs 集合更新为 `(await stat(path)).mtimeMs`，确保Bridge 通信后续读取最新状态。
    mtimeMs = (await stat(path)).mtimeMs
    // 原始文本更新为 `await readFile(path, 'utf8')`，确保Bridge 通信后续读取最新状态。
    raw = await readFile(path, 'utf8')
  } catch {
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 解析结果保存`BridgePointerSchema`，供远程桥接会话后续处理使用。
  const parsed = BridgePointerSchema().safeParse(safeJsonParse(raw))
  // parsed.success 集合缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!parsed.success) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:pointer] invalid schema, clearing: ${path}`)
    // 等待 `clearBridgePointer(dir)` 完成，再继续远程桥接 bridge Pointer的异步流程。
    await clearBridgePointer(dir)
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // ageMs 集合保存`Math.max`，供远程桥接会话后续处理使用。
  const ageMs = Math.max(0, Date.now() - mtimeMs)
  // 满足 `ageMs > BRIDGE_POINTER_TTL_MS` 时，远程桥接会话执行该分支。
  if (ageMs > BRIDGE_POINTER_TTL_MS) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:pointer] stale (>4h mtime), clearing: ${path}`)
    // 等待 `clearBridgePointer(dir)` 完成，再继续远程桥接 bridge Pointer的异步流程。
    await clearBridgePointer(dir)
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return { ...parsed.data, ageMs }
}

/**
 * Worktree-aware read for `--continue`. The REPL bridge writes its pointer
 * to `getOriginalCwd()` which EnterWorktreeTool/activeWorktreeSession can
 * mutate to a worktree path — but `claude remote-control --continue` runs
 * with `resolve('.')` = shell CWD. This fans out across git worktree
 * siblings to find the freshest pointer, matching /resume's semantics.
 *
 * Fast path: checks `dir` first. Only shells out to `git worktree list` if
 * that misses — the common case (pointer in launch dir) is one stat, zero
 * exec. Fanout reads run in parallel; capped at MAX_WORKTREE_FANOUT.
 *
 * Returns the pointer AND the dir it was found in, so the caller can clear
 * the right file on resume failure.
 */
// readBridgePointerAcrossWorktrees 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readBridgePointerAcrossWorktrees(
  dir: string,
): Promise<{ pointer: BridgePointer & { ageMs: number }; dir: string } | null> {
  // Fast path: current dir. Covers standalone bridge (always matches) and
  // REPL bridge when no worktree mutation happened.
  // here读取`readBridgePointer`，供远程桥接会话后续处理使用。
  const here = await readBridgePointer(dir)
  // 满足 `here` 时，远程桥接会话执行该分支。
  if (here) {
    // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
    return { pointer: here, dir }
  }

  // Fanout: scan worktree siblings. getWorktreePathsPortable has a 5s
  // timeout and returns [] on any error (not a git repo, git not installed).
  // worktrees 集合读取`getWorktreePathsPortable`，供远程桥接会话后续处理使用。
  const worktrees = await getWorktreePathsPortable(dir)
  // 满足 `worktrees.length <= 1` 时，远程桥接会话执行该分支。
  if (worktrees.length <= 1) return null
  // 满足 `worktrees.length > MAX_WORKTREE_FANOUT` 时，远程桥接会话执行该分支。
  if (worktrees.length > MAX_WORKTREE_FANOUT) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:pointer] ${worktrees.length} worktrees exceeds fanout cap ${MAX_WORKTREE_FANOUT}, skipping`,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // Dedupe against `dir` so we don't re-stat it. sanitizePath normalizes
  // case/separators so worktree-list output matches our fast-path key even
  // on Windows where git may emit C:/ vs stored c:/.
  // dirKey保存`sanitizePath`，供远程桥接会话后续处理使用。
  const dirKey = sanitizePath(dir)
  // candidates 集合筛选`worktrees.filter`，供远程桥接会话后续处理使用。
  const candidates = worktrees.filter(wt => sanitizePath(wt) !== dirKey)

  // Parallel stat+read. Each readBridgePointer is a stat() that ENOENTs
  // for worktrees with no pointer (cheap) plus a ~100-byte read for the
  // rare ones that have one. Promise.all → latency ≈ slowest single stat.
  // 结果列表保存`Promise.all`，供远程桥接会话后续处理使用。
  const results = await Promise.all(
    // 调用 candidates.map，触发远程桥接会话此处需要的副作用。
    candidates.map(async wt => {
      // p读取`readBridgePointer`，供远程桥接会话后续处理使用。
      const p = await readBridgePointer(wt)
      // 返回 `p ? { pointer: p, dir: wt } : null`，作为远程桥接会话这次计算的结果。
      return p ? { pointer: p, dir: wt } : null
    }),
  )

  // Pick freshest (lowest ageMs). The pointer stores environmentId so
  // resume reconnects to the right env regardless of which worktree
  // --continue was invoked from.
  // freshest 先占位，稍后的条件分支会根据实际输入补齐它。
  let freshest: {
    pointer: BridgePointer & { ageMs: number }
    dir: string
  } | null = null
  // 按顺序遍历 `results` 中的r，逐个交给远程桥接会话处理。
  for (const r of results) {
    // 组合条件 `r && (!freshest || r.pointer.ageMs < freshest.pointer.ageMs)` 成立时，远程桥接会话才启用这条专门路径。
    if (r && (!freshest || r.pointer.ageMs < freshest.pointer.ageMs)) {
      // freshest更新为 `r`，确保Bridge 通信后续读取最新状态。
      freshest = r
    }
  }
  // 满足 `freshest` 时，远程桥接会话执行该分支。
  if (freshest) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:pointer] fanout found pointer in worktree ${freshest.dir} (ageMs=${freshest.pointer.ageMs})`,
    )
  }
  // 返回 `freshest`，作为远程桥接会话这次计算的结果。
  return freshest
}

/**
 * Delete the pointer. Idempotent — ENOENT is expected when the process
 * shut down clean previously.
 */
// clearBridgePointer 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearBridgePointer(dir: string): Promise<void> {
  // 路径读取`getBridgePointerPath`，供远程桥接会话后续处理使用。
  const path = getBridgePointerPath(dir)
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(path)` 完成，再继续远程桥接 bridge Pointer的异步流程。
    await unlink(path)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:pointer] cleared ${path}`)
  } catch (err: unknown) {
    // 满足 `!isENOENT(err)` 时，远程桥接会话执行该分支。
    if (!isENOENT(err)) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[bridge:pointer] clear failed: ${err}`, {
        level: 'warn',
      })
    }
  }
}

// safeJsonParse 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function safeJsonParse(raw: string): unknown {
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `jsonParse(raw)`，作为远程桥接会话这次计算的结果。
    return jsonParse(raw)
  } catch {
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
}
