/**
 * Team Memory File Watcher
 *
 * Watches the team memory directory for changes and triggers
 * a debounced push to the server when files are modified.
 * Performs an initial pull on startup, then starts a directory-level
 * fs.watch so first-time writes to a fresh repo get picked up.
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { type FSWatcher, watch } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让服务层 watcher后续逻辑可以直接复用这些外部能力。
import {
  getTeamMemPath,
  isTeamMemoryEnabled,
} from '../../memdir/teamMemPaths.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 getGithubRepo 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { getGithubRepo } from '../../utils/git.js'
// 整理这一组导入，让服务层 watcher后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让服务层 watcher后续逻辑可以直接复用这些外部能力。
import {
  createSyncState,
  isTeamMemorySyncAvailable,
  pullTeamMemory,
  pushTeamMemory,
  type SyncState,
} from './index.js'
// 类型依赖 { TeamMemorySyncPushResult } 来自 ./types.js，用于校准服务层 watcher的数据契约。
import type { TeamMemorySyncPushResult } from './types.js'

// DEBOUNCE_MS 集合 命名 `2000 // Wait 2s after last change before pushing`，让后续代码直接表达这个值的用途。
const DEBOUNCE_MS = 2000 // Wait 2s after last change before pushing

// ─── Watcher state ──────────────────────────────────────────
// watcher 命名 `null`，让后续代码直接表达这个值的用途。
let watcher: FSWatcher | null = null
// debounceTimer初始化为空值，后续分支会在有数据时补齐。
let debounceTimer: ReturnType<typeof setTimeout> | null = null
// pushInProgress 集合标记服务层 watcher是否启用对应路径。
let pushInProgress = false
// hasPendingChanges 集合标记服务层 watcher是否启用对应路径。
let hasPendingChanges = false
// currentPushPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let currentPushPromise: Promise<void> | null = null
// watcherStarted标记服务层 watcher是否启用对应路径。
let watcherStarted = false

// Set after a push fails for a reason that can't self-heal on retry.
// Prevents watch events from other sessions' writes to the shared team
// dir driving an infinite retry loop (BQ Mar 14-16: one no_oauth device
// emitted 167K push events over 2.5 days). Cleared on unlink — file deletion
// is a recovery action for the too-many-entries case, and for no_oauth the
// suppression persisting until session restart is correct.
// pushSuppressedReason初始化为空值，后续分支会在有数据时补齐。
let pushSuppressedReason: string | null = null

/**
 * Permanent = retry without user action will fail the same way.
 * - no_oauth / no_repo: pre-request client checks, no status code
 * - 4xx except 409/429: client error (404 missing repo, 413 too many
 *   entries, 403 permission). 409 is a transient conflict — server state
 *   changed under us, a fresh push after next pull can succeed. 429 is a
 *   rate limit — watcher-driven backoff is fine.
 */
// isPermanentFailure 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPermanentFailure(r: TeamMemorySyncPushResult): boolean {
  // 当 `r.errorType` 匹配 `'no_oauth' || r.errorType =...` 时，服务层 watcher执行对应分支。
  if (r.errorType === 'no_oauth' || r.errorType === 'no_repo') return true
  // 服务层 watcher在这里进入条件判断，后续代码按实际状态分流。
  if (
    r.httpStatus !== undefined &&
    r.httpStatus >= 400 &&
    r.httpStatus < 500 &&
    r.httpStatus !== 409 &&
    r.httpStatus !== 429
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// Sync state owned by the watcher — shared across all sync operations.
// syncState 状态保存`null`，作为后续空值处理的输入。
let syncState: SyncState | null = null

/**
 * Execute the push and track its lifecycle.
 * Push is read-only on disk (delta+probe, no merge writes), so no event
 * suppression is needed — edits arriving mid-push hit schedulePush() and
 * the debounce re-arms after this push completes.
 */
// executePush 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function executePush(): Promise<void> {
  // syncState 状态缺失时提前走兜底路径，避免服务层 watcher继续依赖无效输入。
  if (!syncState) {
    // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // pushInProgress 集合更新为 `true`，确保服务层后续读取最新状态。
  pushInProgress = true
  // 保护这一段可能失败的服务层 watcher操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`pushTeamMemory`，供服务层 watcher后续处理使用。
    const result = await pushTeamMemory(syncState)
    // 满足 `result.success` 时，服务层 watcher执行该分支。
    if (result.success) {
      // hasPendingChanges 集合更新为 `false`，确保服务层后续读取最新状态。
      hasPendingChanges = false
    }
    // 组合条件 `result.success && result.filesUploaded > 0` 成立时，服务层 watcher才启用这条专门路径。
    if (result.success && result.filesUploaded > 0) {
      // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `team-memory-watcher: pushed ${result.filesUploaded} files`,
        { level: 'info' },
      )
    // 服务层 watcher在这里处理 `} else if (!result.success) {`，完成这一小步状态转换。
    } else if (!result.success) {
      // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`team-memory-watcher: push failed: ${result.error}`, {
        level: 'warn',
      })
      // 组合条件 `isPermanentFailure(result) && pushSuppressedReason === null` 成立时，服务层 watcher才启用这条专门路径。
      if (isPermanentFailure(result) && pushSuppressedReason === null) {
        // 服务层 watcher在这里处理 `pushSuppressedReason =`，完成这一小步状态转换。
        pushSuppressedReason =
          result.httpStatus !== undefined
            ? `http_${result.httpStatus}`
            : (result.errorType ?? 'unknown')
        // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `team-memory-watcher: suppressing retry until next unlink or session restart (${pushSuppressedReason})`,
          { level: 'warn' },
        )
        // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_team_mem_push_suppressed', {
          reason:
            pushSuppressedReason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          ...(result.httpStatus && { status: result.httpStatus }),
        })
      }
    }
  } catch (e) {
    // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`team-memory-watcher: push error: ${errorMessage(e)}`, {
      level: 'warn',
    })
  } finally {
    // pushInProgress 集合更新为 `false`，确保服务层后续读取最新状态。
    pushInProgress = false
    // currentPushPromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
    currentPushPromise = null
  }
}

/**
 * Debounced push: waits for writes to settle, then pushes once.
 */
// schedulePush 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function schedulePush(): void {
  // `pushSuppressedReason` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (pushSuppressedReason !== null) return
  // hasPendingChanges 集合更新为 `true`，确保服务层后续读取最新状态。
  hasPendingChanges = true
  // 满足 `debounceTimer` 时，服务层 watcher执行该分支。
  if (debounceTimer) {
    // 调用 clearTimeout，触发服务层 watcher此处需要的副作用。
    clearTimeout(debounceTimer)
  }
  // debounceTimer更新为 `setTimeout(() => {`，确保服务层后续读取最新状态。
  debounceTimer = setTimeout(() => {
    // 满足 `pushInProgress` 时，服务层 watcher执行该分支。
    if (pushInProgress) {
      // 调用 schedulePush，触发服务层 watcher此处需要的副作用。
      schedulePush()
      // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // currentPushPromise 异步任务更新为 `executePush()`，确保服务层后续读取最新状态。
    currentPushPromise = executePush()
  }, DEBOUNCE_MS)
}

/**
 * Start watching the team memory directory for changes.
 *
 * Uses `fs.watch({recursive: true})` on the directory (not chokidar).
 * chokidar 4+ dropped fsevents, and Bun's `fs.watch` fallback uses kqueue,
 * which requires one open fd per watched file — with 500+ team memory files
 * that's 500+ permanently-held fds (confirmed via lsof + repro).
 *
 * `recursive: true` is required because team memory supports subdirs
 * (validateTeamMemKey, pushTeamMemory's walkDir). On macOS Bun uses
 * FSEvents for recursive — O(1) fds regardless of tree size (verified:
 * 2 fds for 60 files across 5 subdirs). On Linux inotify needs one watch
 * per directory — O(subdirs), still fine (team memory rarely nests).
 *
 * `fs.watch` on a directory doesn't distinguish add/change/unlink — all three
 * emit `rename`. To clear suppression on the too-many-entries recovery path
 * (user deletes files), we stat the filename on each event: ENOENT → treat as
 * unlink.  For `no_oauth` suppression this is correct: no_oauth users don't
 * delete team memory files to recover, they restart with auth.
 */
// startFileWatcher 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function startFileWatcher(teamDir: string): Promise<void> {
  // 满足 `watcherStarted` 时，服务层 watcher执行该分支。
  if (watcherStarted) {
    // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // watcherStarted更新为 `true`，确保服务层后续读取最新状态。
  watcherStarted = true

  // 保护这一段可能失败的服务层 watcher操作，确保异常能进入相邻错误处理。
  try {
    // pullTeamMemory returns early without creating the dir for fresh repos
    // with no server content (index.ts isEmpty path). mkdir with
    // recursive:true is idempotent — no existence check needed.
    // 等待 `mkdir(teamDir, { recursive: true })` 完成，再继续服务层 watcher的异步流程。
    await mkdir(teamDir, { recursive: true })

    // watcher更新为 `watch(`，确保服务层后续读取最新状态。
    watcher = watch(
      teamDir,
      { persistent: true, recursive: true },
      // 这个回调绑定到 (_eventType, filename) => {，负责服务层 watcher在该局部场景下的响应。
      (_eventType, filename) => {
        // 满足 `filename === null` 时，服务层 watcher执行该分支。
        if (filename === null) {
          // 调用 schedulePush，触发服务层 watcher此处需要的副作用。
          schedulePush()
          // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // `pushSuppressedReason` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
        if (pushSuppressedReason !== null) {
          // Suppression is only cleared by unlink (recovery action for
          // too-many-entries). fs.watch doesn't distinguish unlink from
          // add/write — stat to disambiguate. ENOENT → file gone → clear.
          // 显式忽略 `stat(join(teamDir, filename)).catch(` 的返回值，只保留它触发的副作用。
          void stat(join(teamDir, filename)).catch(
            // 这个回调绑定到 (err: NodeJS.ErrnoException) => {，负责服务层 watcher在该局部场景下的响应。
            (err: NodeJS.ErrnoException) => {
              // `err.code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
              if (err.code !== 'ENOENT') return
              // `pushSuppressedReason` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
              if (pushSuppressedReason !== null) {
                // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `team-memory-watcher: unlink cleared suppression (was: ${pushSuppressedReason})`,
                  { level: 'info' },
                )
                // pushSuppressedReason更新为 `null`，确保服务层后续读取最新状态。
                pushSuppressedReason = null
              }
              // 调用 schedulePush，触发服务层 watcher此处需要的副作用。
              schedulePush()
            },
          )
          // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 调用 schedulePush，触发服务层 watcher此处需要的副作用。
        schedulePush()
      },
    )
    // 调用 watcher.on，触发服务层 watcher此处需要的副作用。
    watcher.on('error', err => {
      // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `team-memory-watcher: fs.watch error: ${errorMessage(err)}`,
        { level: 'warn' },
      )
    })
    // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`team-memory-watcher: watching ${teamDir}`, {
      level: 'debug',
    })
  } catch (err) {
    // fs.watch throws synchronously on ENOENT (race: dir deleted between
    // mkdir and watch) or EACCES. watcherStarted is already true above,
    // so notifyTeamMemoryWrite's explicit schedulePush path still works.
    // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-watcher: failed to watch ${teamDir}: ${errorMessage(err)}`,
      { level: 'warn' },
    )
  }

  // 调用 registerCleanup，触发服务层 watcher此处需要的副作用。
  registerCleanup(async () => stopTeamMemoryWatcher())
}

/**
 * Start the team memory sync system.
 *
 * Returns early (before creating any state) if:
 *   - TEAMMEM build flag is off
 *   - team memory is disabled (isTeamMemoryEnabled)
 *   - OAuth is not available (isTeamMemorySyncAvailable)
 *   - the current repo has no github.com remote
 *
 * The early github.com check prevents a noisy failure mode where the
 * watcher starts, it fires on local edits, and every push/pull
 * logs `errorType: no_repo` forever. Team memory is GitHub-scoped on
 * the server side, so non-github.com remotes can never sync anyway.
 *
 * Pulls from server, then starts the file watcher unconditionally.
 * The watcher must start even when the server has no content yet
 * (fresh EAP repo) — otherwise Claude's first team-memory write
 * depends entirely on PostToolUse hooks firing notifyTeamMemoryWrite,
 * which is a chicken-and-egg: Claude's write rate is low enough that
 * a fresh partner can sit in the bootstrap dead zone for days.
 */
// startTeamMemoryWatcher 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function startTeamMemoryWatcher(): Promise<void> {
  // 满足 `!feature('TEAMMEM')` 时，服务层 watcher执行该分支。
  if (!feature('TEAMMEM')) {
    // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 组合条件 `!isTeamMemoryEnabled() || !isTeamMemorySyncAvailable()` 成立时，服务层 watcher才启用这条专门路径。
  if (!isTeamMemoryEnabled() || !isTeamMemorySyncAvailable()) {
    // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // repoSlug读取`getGithubRepo`，供服务层 watcher后续处理使用。
  const repoSlug = await getGithubRepo()
  // repoSlug缺失时提前走兜底路径，避免服务层 watcher继续依赖无效输入。
  if (!repoSlug) {
    // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'team-memory-watcher: no github.com remote, skipping sync',
      { level: 'debug' },
    )
    // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // syncState 状态更新为 `createSyncState()`，确保服务层后续读取最新状态。
  syncState = createSyncState()

  // Initial pull from server (runs before the watcher starts, so its disk
  // writes won't trigger schedulePush)
  // initialPullSuccess 集合标记服务层 watcher是否启用对应路径。
  let initialPullSuccess = false
  // initialFilesPulled 文件数据保存`0`，供服务层 watcher后续判断或输出使用。
  let initialFilesPulled = 0
  // serverHasContent标记服务层 watcher是否启用对应路径。
  let serverHasContent = false
  // 保护这一段可能失败的服务层 watcher操作，确保异常能进入相邻错误处理。
  try {
    // pullResult保存`pullTeamMemory`，供服务层 watcher后续处理使用。
    const pullResult = await pullTeamMemory(syncState)
    // initialPullSuccess 集合更新为 `pullResult.success`，确保服务层后续读取最新状态。
    initialPullSuccess = pullResult.success
    // serverHasContent更新为 `pullResult.entryCount > 0`，确保服务层后续读取最新状态。
    serverHasContent = pullResult.entryCount > 0
    // 组合条件 `pullResult.success && pullResult.filesWritten > 0` 成立时，服务层 watcher才启用这条专门路径。
    if (pullResult.success && pullResult.filesWritten > 0) {
      // initialFilesPulled 文件数据更新为 `pullResult.filesWritten`，确保服务层后续读取最新状态。
      initialFilesPulled = pullResult.filesWritten
      // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `team-memory-watcher: initial pull got ${pullResult.filesWritten} files`,
        { level: 'info' },
      )
    }
  } catch (e) {
    // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-watcher: initial pull failed: ${errorMessage(e)}`,
      { level: 'warn' },
    )
  }

  // Always start the watcher. Watching an empty dir is cheap,
  // and the alternative (lazy start on notifyTeamMemoryWrite) creates
  // a bootstrap dead zone for fresh repos.
  // 等待 `startFileWatcher(getTeamMemPath())` 完成，再继续服务层 watcher的异步流程。
  await startFileWatcher(getTeamMemPath())

  // 记录服务层 watcher运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_team_mem_sync_started', {
    initial_pull_success: initialPullSuccess,
    initial_files_pulled: initialFilesPulled,
    // Kept for dashboard continuity; now always true when this event fires.
    watcher_started: true,
    server_has_content: serverHasContent,
  })
}

/**
 * Call this when a team memory file is written (e.g. from PostToolUse hooks).
 * Schedules a push explicitly in case fs.watch misses the write —
 * a file written in the same tick the watcher starts may not fire an
 * event, and some platforms coalesce rapid successive writes.
 * If the watcher does fire, the debounce timer just resets.
 */
// notifyTeamMemoryWrite 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function notifyTeamMemoryWrite(): Promise<void> {
  // syncState 状态缺失时提前走兜底路径，避免服务层 watcher继续依赖无效输入。
  if (!syncState) {
    // 服务层 watcher在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 调用 schedulePush，触发服务层 watcher此处需要的副作用。
  schedulePush()
}

/**
 * Stop the file watcher and flush pending changes.
 * Note: runs within the 2s graceful shutdown budget, so the flush
 * is best-effort — if the HTTP PUT doesn't complete in time,
 * process.exit() will kill it.
 */
// stopTeamMemoryWatcher 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function stopTeamMemoryWatcher(): Promise<void> {
  // 满足 `debounceTimer` 时，服务层 watcher执行该分支。
  if (debounceTimer) {
    // 调用 clearTimeout，触发服务层 watcher此处需要的副作用。
    clearTimeout(debounceTimer)
    // debounceTimer更新为 `null`，确保服务层后续读取最新状态。
    debounceTimer = null
  }
  // 满足 `watcher` 时，服务层 watcher执行该分支。
  if (watcher) {
    // 调用 watcher.close，触发服务层 watcher此处需要的副作用。
    watcher.close()
    // watcher更新为 `null`，确保服务层后续读取最新状态。
    watcher = null
  }
  // Await any in-flight push
  // 满足 `currentPushPromise` 时，服务层 watcher执行该分支。
  if (currentPushPromise) {
    // 保护这一段可能失败的服务层 watcher操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `currentPushPromise` 完成，再继续服务层 watcher的异步流程。
      await currentPushPromise
    } catch {
      // Ignore errors during shutdown
    }
  }
  // Flush pending changes that were debounced but not yet pushed
  // 组合条件 `hasPendingChanges && syncState && pushSuppressedR` 成立时，服务层 watcher才启用这条专门路径。
  if (hasPendingChanges && syncState && pushSuppressedReason === null) {
    // 保护这一段可能失败的服务层 watcher操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `pushTeamMemory(syncState)` 完成，再继续服务层 watcher的异步流程。
      await pushTeamMemory(syncState)
    } catch {
      // Best-effort — shutdown may kill this
    }
  }
}

/**
 * Test-only: reset module state and optionally seed syncState.
 * The feature('TEAMMEM') gate at the top of startTeamMemoryWatcher() is
 * always false in bun test, so tests can't set syncState through the normal
 * path. This helper lets tests drive notifyTeamMemoryWrite() /
 * stopTeamMemoryWatcher() directly.
 *
 * `skipWatcher: true` marks the watcher as already-started without actually
 * starting it. Tests that only exercise the schedulePush/flush path don't
 * need a real watcher.
 */
// _resetWatcherStateForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetWatcherStateForTesting(opts?: {
  syncState?: SyncState
  skipWatcher?: boolean
  pushSuppressedReason?: string | null
}): void {
  // watcher更新为 `null`，确保服务层后续读取最新状态。
  watcher = null
  // debounceTimer更新为 `null`，确保服务层后续读取最新状态。
  debounceTimer = null
  // pushInProgress 集合更新为 `false`，确保服务层后续读取最新状态。
  pushInProgress = false
  // hasPendingChanges 集合更新为 `false`，确保服务层后续读取最新状态。
  hasPendingChanges = false
  // currentPushPromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
  currentPushPromise = null
  // watcherStarted更新为 `opts?.skipWatcher ?? false`，确保服务层后续读取最新状态。
  watcherStarted = opts?.skipWatcher ?? false
  // pushSuppressedReason更新为 `opts?.pushSuppressedReason ?? null`，确保服务层后续读取最新状态。
  pushSuppressedReason = opts?.pushSuppressedReason ?? null
  // syncState 状态更新为 `opts?.syncState ?? null`，确保服务层后续读取最新状态。
  syncState = opts?.syncState ?? null
}

/**
 * Test-only: start the real fs.watch on a specified directory.
 * Used by the fd-count regression test — startTeamMemoryWatcher() is gated
 * by feature('TEAMMEM') which is false under bun test.
 */
// _startFileWatcherForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _startFileWatcherForTesting(dir: string): Promise<void> {
  // 返回 `startFileWatcher(dir)`，作为服务层 watcher这次计算的结果。
  return startFileWatcher(dir)
}
