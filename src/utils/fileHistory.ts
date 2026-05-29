// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash, type UUID } from 'crypto'
// 引入 diffLines，将 diff 中已经封装好的能力接到本文件流程里。
import { diffLines } from 'diff'
// 类型依赖 { Stats } 来自 fs，用于校准共享工具的数据契约。
import type { Stats } from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  chmod,
  copyFile,
  link,
  mkdir,
  readFile,
  stat,
  unlink,
} from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, isAbsolute, join, relative } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  getOriginalCwd,
  getSessionId,
} from 'src/bootstrap/state.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 接入 notifyVscodeFileUpdated 服务层能力，把外部通信或共享状态交给 src/services/mcp/vscodeSdkMcp.js 处理。
import { notifyVscodeFileUpdated } from 'src/services/mcp/vscodeSdkMcp.js'
// 类型依赖 { LogOption } 来自 src/types/logs.js，用于校准共享工具的数据契约。
import type { LogOption } from 'src/types/logs.js'
// 引入 inspect，将 util 中已经封装好的能力接到本文件流程里。
import { inspect } from 'util'
// 引入 getGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 getErrnoCode、isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode, isENOENT } from './errors.js'
// 引入 pathExists，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { pathExists } from './file.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 recordFileHistorySnapshot，将 ./sessionStorage.js 中已经封装好的能力接到本文件流程里。
import { recordFileHistorySnapshot } from './sessionStorage.js'

// BackupFileName 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BackupFileName = string | null // The null value means the file does not exist in this version

// FileHistoryBackup 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileHistoryBackup = {
  backupFileName: BackupFileName
  version: number
  backupTime: Date
}

// FileHistorySnapshot 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileHistorySnapshot = {
  messageId: UUID // The associated message ID for this snapshot
  trackedFileBackups: Record<string, FileHistoryBackup> // Map of file paths to backup versions
  timestamp: Date
}

// FileHistoryState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileHistoryState = {
  snapshots: FileHistorySnapshot[]
  trackedFiles: Set<string>
  // Monotonically-increasing counter incremented on every snapshot, even when
  // old snapshots are evicted.  Used by useGitDiffStats as an activity signal
  // (snapshots.length plateaus once the cap is reached).
  snapshotSequence: number
}

// MAX_SNAPSHOTS 集合保存`100`，供共享工具 file History后续判断或输出使用。
const MAX_SNAPSHOTS = 100
// DiffStats 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DiffStats =
  | {
      filesChanged?: string[]
      insertions: number
      deletions: number
    }
  | undefined

// fileHistoryEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function fileHistoryEnabled(): boolean {
  // 满足 `getIsNonInteractiveSession()` 时，共享工具执行该分支。
  if (getIsNonInteractiveSession()) {
    // 返回 `fileHistoryEnabledSdk()`，作为共享工具这次计算的结果。
    return fileHistoryEnabledSdk()
  }
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getGlobalConfig().fileCheckpointingEnabled !== false &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING)
  )
}

// fileHistoryEnabledSdk 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fileHistoryEnabledSdk(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING) &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING)
  )
}

/**
 * Tracks a file edit (and add) by creating a backup of its current contents (if necessary).
 *
 * This must be called before the file is actually added or edited, so we can save
 * its contents before the edit.
 */
// fileHistoryTrackEdit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fileHistoryTrackEdit(
  // 共享工具 file History在这里处理 `updateFileHistoryState: (`，完成这一小步状态转换。
  updateFileHistoryState: (
    // 这个回调绑定到 updater: (prev: FileHistoryState) => FileHistoryState,，负责共享工具在该局部场景下的响应。
    updater: (prev: FileHistoryState) => FileHistoryState,
  ) => void,
  filePath: string,
  messageId: UUID,
): Promise<void> {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // trackingPath 路径数据保存`maybeShortenFilePath`，供共享工具后续处理使用。
  const trackingPath = maybeShortenFilePath(filePath)

  // Phase 1: check if backup is needed. Speculative writes would overwrite
  // the deterministic {hash}@v1 backup on every repeat call — a second
  // trackEdit after an edit would corrupt v1 with post-edit content.
  // captured 先占位，稍后的条件分支会根据实际输入补齐它。
  let captured: FileHistoryState | undefined
  // 调用 updateFileHistoryState，触发共享工具此处需要的副作用。
  updateFileHistoryState(state => {
    // captured更新为 `state`，确保共享工具后续读取最新状态。
    captured = state
    // 返回 `state`，作为共享工具这次计算的结果。
    return state
  })
  // captured缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!captured) return
  // mostRecent保存`snapshots.at`，供共享工具后续处理使用。
  const mostRecent = captured.snapshots.at(-1)
  // mostRecent缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!mostRecent) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error('FileHistory: Missing most recent snapshot'))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_history_track_edit_failed', {})
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `mostRecent.trackedFileBackups[trackingPath]` 时，共享工具执行该分支。
  if (mostRecent.trackedFileBackups[trackingPath]) {
    // Already tracked in the most recent snapshot; next makeSnapshot will
    // re-check mtime and re-backup if changed. Do not touch v1 backup.
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Phase 2: async backup.
  // backup 先占位，稍后的条件分支会根据实际输入补齐它。
  let backup: FileHistoryBackup
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // backup更新为 `await createBackup(filePath, 1)`，确保共享工具后续读取最新状态。
    backup = await createBackup(filePath, 1)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_history_track_edit_failed', {})
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // isAddingFile 文件数据标记共享工具 file History是否启用对应路径。
  const isAddingFile = backup.backupFileName === null

  // Phase 3: commit. Re-check tracked (another trackEdit may have raced).
  // 调用 updateFileHistoryState，触发共享工具此处需要的副作用。
  updateFileHistoryState((state: FileHistoryState) => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // mostRecentSnapshot保存`snapshots.at`，供共享工具后续处理使用。
      const mostRecentSnapshot = state.snapshots.at(-1)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        !mostRecentSnapshot ||
        mostRecentSnapshot.trackedFileBackups[trackingPath]
      ) {
        // 返回 `state`，作为共享工具这次计算的结果。
        return state
      }

      // This file has not already been tracked in the most recent snapshot, so we
      // need to retroactively track a backup there.
      // updatedTrackedFiles 文件数据保存`trackedFiles.has`，供共享工具后续处理使用。
      const updatedTrackedFiles = state.trackedFiles.has(trackingPath)
        ? state.trackedFiles
        : new Set(state.trackedFiles).add(trackingPath)

      // Shallow-spread is sufficient: backup values are never mutated after
      // insertion, so we only need fresh top-level + trackedFileBackups refs
      // for React change detection. A deep clone would copy every existing
      // backup's Date/string fields — O(n) cost to add one entry.
      // updatedMostRecentSnapshot集中保存共享工具 file History要一起传递的字段。
      const updatedMostRecentSnapshot = {
        ...mostRecentSnapshot,
        trackedFileBackups: {
          ...mostRecentSnapshot.trackedFileBackups,
          [trackingPath]: backup,
        },
      }

      // updatedState 状态集中保存共享工具 file History要一起传递的字段。
      const updatedState = {
        ...state,
        // 这个回调绑定到 snapshots: (() => {，负责共享工具在该局部场景下的响应。
        snapshots: (() => {
          // copy格式化`snapshots.slice`，供共享工具后续处理使用。
          const copy = state.snapshots.slice()
          // length - 1 数量更新为 `updatedMostRecentSnapshot`，确保共享工具 file History后续读取最新状态。
          copy[copy.length - 1] = updatedMostRecentSnapshot
          // 返回 `copy`，作为共享工具这次计算的结果。
          return copy
        })(),
        trackedFiles: updatedTrackedFiles,
      }
      // 调用 maybeDumpStateForDebug，触发共享工具此处需要的副作用。
      maybeDumpStateForDebug(updatedState)

      // Record a snapshot update since it has changed.
      // 显式忽略 `recordFileHistorySnapshot(` 的返回值，只保留它触发的副作用。
      void recordFileHistorySnapshot(
        messageId,
        updatedMostRecentSnapshot,
        true, // isSnapshotUpdate
      // 这个回调绑定到 ).catch(error => {，负责共享工具在该局部场景下的响应。
      ).catch(error => {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(new Error(`FileHistory: Failed to record snapshot: ${error}`))
      })

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_history_track_edit_success', {
        isNewFile: isAddingFile,
        version: backup.version,
      })
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`FileHistory: Tracked file modification for ${filePath}`)

      // 返回 `updatedState`，作为共享工具这次计算的结果。
      return updatedState
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_history_track_edit_failed', {})
      // 返回 `state`，作为共享工具这次计算的结果。
      return state
    }
  })
}

/**
 * Adds a snapshot in the file history and backs up any modified tracked files.
 */
// fileHistoryMakeSnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fileHistoryMakeSnapshot(
  // 共享工具 file History在这里处理 `updateFileHistoryState: (`，完成这一小步状态转换。
  updateFileHistoryState: (
    // 这个回调绑定到 updater: (prev: FileHistoryState) => FileHistoryState,，负责共享工具在该局部场景下的响应。
    updater: (prev: FileHistoryState) => FileHistoryState,
  ) => void,
  messageId: UUID,
): Promise<void> {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Phase 1: capture current state with a no-op updater so we know which
  // files to back up. Returning the same reference keeps this a true no-op
  // for any wrapper that honors same-ref returns (src/CLAUDE.md wrapper
  // rule). Wrappers that unconditionally spread will trigger one extra
  // re-render; acceptable for a once-per-turn call.
  // captured 先占位，稍后的条件分支会根据实际输入补齐它。
  let captured: FileHistoryState | undefined
  // 调用 updateFileHistoryState，触发共享工具此处需要的副作用。
  updateFileHistoryState(state => {
    // captured更新为 `state`，确保共享工具后续读取最新状态。
    captured = state
    // 返回 `state`，作为共享工具这次计算的结果。
    return state
  })
  // 满足 `!captured) return // updateFileHistoryState was a no-op stub (e.g. mcp.ts` 时，共享工具执行该分支。
  if (!captured) return // updateFileHistoryState was a no-op stub (e.g. mcp.ts)

  // Phase 2: do all IO async, outside the updater.
  // trackedFileBackups 文件数据 从空对象开始收集键值，后续按名称补齐内容。
  const trackedFileBackups: Record<string, FileHistoryBackup> = {}
  // mostRecentSnapshot保存`snapshots.at`，供共享工具后续处理使用。
  const mostRecentSnapshot = captured.snapshots.at(-1)
  // 满足 `mostRecentSnapshot` 时，共享工具执行该分支。
  if (mostRecentSnapshot) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`FileHistory: Making snapshot for message ${messageId}`)
    // 等待 `Promise.all(` 完成，再继续共享工具 file History的异步流程。
    await Promise.all(
      // 调用 Array.from，触发共享工具此处需要的副作用。
      Array.from(captured.trackedFiles, async trackingPath => {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 文件路径保存`maybeExpandFilePath`，供共享工具后续处理使用。
          const filePath = maybeExpandFilePath(trackingPath)
          // latestBackup 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const latestBackup =
            mostRecentSnapshot.trackedFileBackups[trackingPath]
          // nextVersion保存`latestBackup ? latestBackup.version + 1 : 1`，供后续判断或组装使用。
          const nextVersion = latestBackup ? latestBackup.version + 1 : 1

          // Stat the file once; ENOENT means the tracked file was deleted.
          // fileStats 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
          let fileStats: Stats | undefined
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // fileStats 文件数据更新为 `await stat(filePath)`，确保共享工具后续读取最新状态。
            fileStats = await stat(filePath)
          } catch (e: unknown) {
            // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
            if (!isENOENT(e)) throw e
          }

          // fileStats 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!fileStats) {
            // trackedFileBackups[trackingPath 路径数据更新为 `{`，确保共享工具 file History后续读取最新状态。
            trackedFileBackups[trackingPath] = {
              backupFileName: null, // Use null to denote missing tracked file
              version: nextVersion,
              backupTime: new Date(),
            }
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_file_history_backup_deleted_file', {
              version: nextVersion,
            })
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `FileHistory: Missing tracked file: ${trackingPath}`,
            )
            // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }

          // File exists - check if it needs to be backed up
          // 共享工具在这里按实际状态进入对应分支。
          if (
            latestBackup &&
            latestBackup.backupFileName !== null &&
            !(await checkOriginFileChanged(
              filePath,
              latestBackup.backupFileName,
              fileStats,
            ))
          ) {
            // File hasn't been modified since the latest version, reuse it
            // trackedFileBackups[trackingPath 路径数据更新为 `latestBackup`，确保共享工具 file History后续读取最新状态。
            trackedFileBackups[trackingPath] = latestBackup
            // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }

          // File is newer than the latest backup, create a new backup
          // trackedFileBackups[trackingPath 路径数据更新为 `await createBackup(`，确保共享工具 file History后续读取最新状态。
          trackedFileBackups[trackingPath] = await createBackup(
            filePath,
            nextVersion,
          )
        } catch (error) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(error)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_file_history_backup_file_failed', {})
        }
      }),
    )
  }

  // Phase 3: commit the new snapshot to state. Read state.trackedFiles FRESH
  // — if fileHistoryTrackEdit added a file during phase 2's async window, it
  // wrote the backup to state.snapshots[-1].trackedFileBackups. Inherit those
  // so the new snapshot covers every currently-tracked file.
  // 调用 updateFileHistoryState，触发共享工具此处需要的副作用。
  updateFileHistoryState((state: FileHistoryState) => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // lastSnapshot保存`snapshots.at`，供共享工具后续处理使用。
      const lastSnapshot = state.snapshots.at(-1)
      // 满足 `lastSnapshot` 时，共享工具执行该分支。
      if (lastSnapshot) {
        // 按顺序遍历 `state.trackedFiles` 中的trackingPath 路径数据，逐个交给共享工具处理。
        for (const trackingPath of state.trackedFiles) {
          // 满足 `trackingPath in trackedFileBackups` 时，共享工具执行该分支。
          if (trackingPath in trackedFileBackups) continue
          // inherited保存`lastSnapshot.trackedFileBackups[trackingPath]`，供共享工具 file History后续判断或输出使用。
          const inherited = lastSnapshot.trackedFileBackups[trackingPath]
          // 满足 `inherited` 时，共享工具执行该分支。
          if (inherited) trackedFileBackups[trackingPath] = inherited
        }
      }
      // now记录时间`Date`，供共享工具后续处理使用。
      const now = new Date()
      // newSnapshot 集中保存共享工具 file History要一起传递的字段。
      const newSnapshot: FileHistorySnapshot = {
        messageId,
        trackedFileBackups,
        timestamp: now,
      }

      // allSnapshots 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const allSnapshots = [...state.snapshots, newSnapshot]
      // updatedState 状态 集中保存共享工具 file History要一起传递的字段。
      const updatedState: FileHistoryState = {
        ...state,
        snapshots:
          allSnapshots.length > MAX_SNAPSHOTS
            ? allSnapshots.slice(-MAX_SNAPSHOTS)
            : allSnapshots,
        snapshotSequence: (state.snapshotSequence ?? 0) + 1,
      }
      // 调用 maybeDumpStateForDebug，触发共享工具此处需要的副作用。
      maybeDumpStateForDebug(updatedState)

      // 显式忽略 `notifyVscodeSnapshotFilesUpdated(state, updatedState).catch(log...` 的返回值，只保留它触发的副作用。
      void notifyVscodeSnapshotFilesUpdated(state, updatedState).catch(logError)

      // Record the file history snapshot to session storage for resume support
      // 显式忽略 `recordFileHistorySnapshot(` 的返回值，只保留它触发的副作用。
      void recordFileHistorySnapshot(
        messageId,
        newSnapshot,
        false, // isSnapshotUpdate
      // 这个回调绑定到 ).catch(error => {，负责共享工具在该局部场景下的响应。
      ).catch(error => {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(new Error(`FileHistory: Failed to record snapshot: ${error}`))
      })

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `FileHistory: Added snapshot for ${messageId}, tracking ${state.trackedFiles.size} files`,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_history_snapshot_success', {
        trackedFilesCount: state.trackedFiles.size,
        snapshotCount: updatedState.snapshots.length,
      })

      // 返回 `updatedState`，作为共享工具这次计算的结果。
      return updatedState
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_history_snapshot_failed', {})
      // 返回 `state`，作为共享工具这次计算的结果。
      return state
    }
  })
}

/**
 * Rewinds the file system to a previous snapshot.
 */
// fileHistoryRewind 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fileHistoryRewind(
  // 共享工具 file History在这里处理 `updateFileHistoryState: (`，完成这一小步状态转换。
  updateFileHistoryState: (
    // 这个回调绑定到 updater: (prev: FileHistoryState) => FileHistoryState,，负责共享工具在该局部场景下的响应。
    updater: (prev: FileHistoryState) => FileHistoryState,
  ) => void,
  messageId: UUID,
): Promise<void> {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Rewind is a pure filesystem side-effect and does not mutate
  // FileHistoryState. Capture state with a no-op updater, then do IO async.
  // captured 先占位，稍后的条件分支会根据实际输入补齐它。
  let captured: FileHistoryState | undefined
  // 调用 updateFileHistoryState，触发共享工具此处需要的副作用。
  updateFileHistoryState(state => {
    // captured更新为 `state`，确保共享工具后续读取最新状态。
    captured = state
    // 返回 `state`，作为共享工具这次计算的结果。
    return state
  })
  // captured缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!captured) return

  // targetSnapshot筛选`snapshots.findLast`，供共享工具后续处理使用。
  const targetSnapshot = captured.snapshots.findLast(
    // snapshot更新为 `> snapshot.messageId === messageId`，确保共享工具后续读取最新状态。
    snapshot => snapshot.messageId === messageId,
  )
  // targetSnapshot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!targetSnapshot) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`FileHistory: Snapshot for ${messageId} not found`))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_history_rewind_failed', {
      trackedFilesCount: captured.trackedFiles.size,
      snapshotFound: false,
    })
    // 抛出 new Error('The selected snapshot was not found')，阻止共享工具在无效状态下继续运行。
    throw new Error('The selected snapshot was not found')
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `FileHistory: [Rewind] Rewinding to snapshot for ${messageId}`,
    )
    // filesChanged 文件数据保存`applySnapshot`，供共享工具后续处理使用。
    const filesChanged = await applySnapshot(captured, targetSnapshot)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`FileHistory: [Rewind] Finished rewinding to ${messageId}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_history_rewind_success', {
      trackedFilesCount: captured.trackedFiles.size,
      filesChangedCount: filesChanged.length,
    })
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_file_history_rewind_failed', {
      trackedFilesCount: captured.trackedFiles.size,
      snapshotFound: true,
    })
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

// fileHistoryCanRestore 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function fileHistoryCanRestore(
  state: FileHistoryState,
  messageId: UUID,
): boolean {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `state.snapshots.some(snapshot => snapshot.messageId === messageId)`，作为共享工具这次计算的结果。
  return state.snapshots.some(snapshot => snapshot.messageId === messageId)
}

/**
 * Computes diff stats for a file snapshot by counting the number of files that would be changed
 * if reverting to that snapshot.
 */
// fileHistoryGetDiffStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fileHistoryGetDiffStats(
  state: FileHistoryState,
  messageId: UUID,
): Promise<DiffStats> {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // targetSnapshot筛选`snapshots.findLast`，供共享工具后续处理使用。
  const targetSnapshot = state.snapshots.findLast(
    // snapshot更新为 `> snapshot.messageId === messageId`，确保共享工具后续读取最新状态。
    snapshot => snapshot.messageId === messageId,
  )

  // targetSnapshot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!targetSnapshot) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 Array.from，触发共享工具此处需要的副作用。
    Array.from(state.trackedFiles, async trackingPath => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 文件路径保存`maybeExpandFilePath`，供共享工具后续处理使用。
        const filePath = maybeExpandFilePath(trackingPath)
        // targetBackup 命名 `targetSnapshot.trackedFileBackups[trackingPath]`，让后续代码直接表达这个值的用途。
        const targetBackup = targetSnapshot.trackedFileBackups[trackingPath]

        // backupFileName 文件数据 命名 `targetBackup`，让后续代码直接表达这个值的用途。
        const backupFileName: BackupFileName | undefined = targetBackup
          ? targetBackup.backupFileName
          : getBackupFileNameFirstVersion(trackingPath, state)

        // 满足 `backupFileName === undefined` 时，共享工具执行该分支。
        if (backupFileName === undefined) {
          // Error resolving the backup, so don't touch the file
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error('FileHistory: Error finding the backup file to apply'),
          )
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_file_history_rewind_restore_file_failed', {
            dryRun: true,
          })
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // stats 集合保存`computeDiffStatsForFile`，供共享工具后续处理使用。
        const stats = await computeDiffStatsForFile(
          filePath,
          backupFileName === null ? undefined : backupFileName,
        )
        // 只有 `stats?.insertions || stats?.deletions` 满足时，共享工具才执行该分支。
        if (stats?.insertions || stats?.deletions) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { filePath, stats }
        }
        // 只有 `backupFileName === null && (await pathExists(filePath))` 满足时，共享工具才执行该分支。
        if (backupFileName === null && (await pathExists(filePath))) {
          // Zero-byte file created after snapshot: counts as changed even
          // though diffLines reports 0/0.
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { filePath, stats }
        }
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      } catch (error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_file_history_rewind_restore_file_failed', {
          dryRun: true,
        })
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )

  // filesChanged 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const filesChanged: string[] = []
  // insertions 集合保存`0`，供后续判断或组装使用。
  let insertions = 0
  // deletions 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let deletions = 0
  // 按顺序遍历 `results` 中的r，逐个交给共享工具处理。
  for (const r of results) {
    // r缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!r) continue
    // filesChanged 文件数据追加新条目，保持收集顺序与输入顺序一致。
    filesChanged.push(r.filePath)
    // 共享工具 file History在这里处理 `insertions += r.stats?.insertions || 0`，完成这一小步状态转换。
    insertions += r.stats?.insertions || 0
    // 共享工具 file History在这里处理 `deletions += r.stats?.deletions || 0`，完成这一小步状态转换。
    deletions += r.stats?.deletions || 0
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { filesChanged, insertions, deletions }
}

/**
 * Lightweight boolean-only check: would rewinding to this message change any
 * file on disk? Uses the same stat/content comparison as the non-dry-run path
 * of applySnapshot (checkOriginFileChanged) instead of computeDiffStatsForFile,
 * so it never calls diffLines. Early-exits on the first changed file. Use when
 * the caller only needs a yes/no answer; fileHistoryGetDiffStats remains for
 * callers that display insertions/deletions.
 */
// fileHistoryHasAnyChanges 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fileHistoryHasAnyChanges(
  state: FileHistoryState,
  messageId: UUID,
): Promise<boolean> {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // targetSnapshot筛选`snapshots.findLast`，供共享工具后续处理使用。
  const targetSnapshot = state.snapshots.findLast(
    // snapshot更新为 `> snapshot.messageId === messageId`，确保共享工具后续读取最新状态。
    snapshot => snapshot.messageId === messageId,
  )
  // targetSnapshot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!targetSnapshot) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 按顺序遍历 `state.trackedFiles` 中的trackingPath 路径数据，逐个交给共享工具处理。
  for (const trackingPath of state.trackedFiles) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文件路径保存`maybeExpandFilePath`，供共享工具后续处理使用。
      const filePath = maybeExpandFilePath(trackingPath)
      // targetBackup 命名 `targetSnapshot.trackedFileBackups[trackingPath]`，让后续代码直接表达这个值的用途。
      const targetBackup = targetSnapshot.trackedFileBackups[trackingPath]
      // backupFileName 文件数据 命名 `targetBackup`，让后续代码直接表达这个值的用途。
      const backupFileName: BackupFileName | undefined = targetBackup
        ? targetBackup.backupFileName
        : getBackupFileNameFirstVersion(trackingPath, state)

      // 满足 `backupFileName === undefined` 时，共享工具执行该分支。
      if (backupFileName === undefined) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 满足 `backupFileName === null` 时，共享工具执行该分支。
      if (backupFileName === null) {
        // Backup says file did not exist; probe via stat (operate-then-catch).
        // 满足 `await pathExists(filePath)` 时，共享工具执行该分支。
        if (await pathExists(filePath)) return true
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 满足 `await checkOriginFileChanged(filePath, backupFileName)` 时，共享工具执行该分支。
      if (await checkOriginFileChanged(filePath, backupFileName)) return true
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Applies the given file snapshot state to the tracked files (writes/deletes
 * on disk), returning the list of changed file paths. Async IO only.
 */
// applySnapshot 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function applySnapshot(
  state: FileHistoryState,
  targetSnapshot: FileHistorySnapshot,
): Promise<string[]> {
  // filesChanged 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const filesChanged: string[] = []
  // 按顺序遍历 `state.trackedFiles` 中的trackingPath 路径数据，逐个交给共享工具处理。
  for (const trackingPath of state.trackedFiles) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文件路径保存`maybeExpandFilePath`，供共享工具后续处理使用。
      const filePath = maybeExpandFilePath(trackingPath)
      // targetBackup 命名 `targetSnapshot.trackedFileBackups[trackingPath]`，让后续代码直接表达这个值的用途。
      const targetBackup = targetSnapshot.trackedFileBackups[trackingPath]

      // backupFileName 文件数据 命名 `targetBackup`，让后续代码直接表达这个值的用途。
      const backupFileName: BackupFileName | undefined = targetBackup
        ? targetBackup.backupFileName
        : getBackupFileNameFirstVersion(trackingPath, state)

      // 满足 `backupFileName === undefined` 时，共享工具执行该分支。
      if (backupFileName === undefined) {
        // Error resolving the backup, so don't touch the file
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error('FileHistory: Error finding the backup file to apply'),
        )
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_file_history_rewind_restore_file_failed', {
          dryRun: false,
        })
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 满足 `backupFileName === null` 时，共享工具执行该分支。
      if (backupFileName === null) {
        // File did not exist at the target version; delete it if present.
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `unlink(filePath)` 完成，再继续共享工具 file History的异步流程。
          await unlink(filePath)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`FileHistory: [Rewind] Deleted ${filePath}`)
          // filesChanged 文件数据追加新条目，保持收集顺序与输入顺序一致。
          filesChanged.push(filePath)
        } catch (e: unknown) {
          // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
          if (!isENOENT(e)) throw e
          // Already absent; nothing to do.
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // File should exist at a specific version. Restore only if it differs.
      // 满足 `await checkOriginFileChanged(filePath, backupFileName)` 时，共享工具执行该分支。
      if (await checkOriginFileChanged(filePath, backupFileName)) {
        // 等待 `restoreBackup(filePath, backupFileName)` 完成，再继续共享工具 file History的异步流程。
        await restoreBackup(filePath, backupFileName)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `FileHistory: [Rewind] Restored ${filePath} from ${backupFileName}`,
        )
        // filesChanged 文件数据追加新条目，保持收集顺序与输入顺序一致。
        filesChanged.push(filePath)
      }
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_history_rewind_restore_file_failed', {
        dryRun: false,
      })
    }
  }
  // 返回 `filesChanged`，作为共享工具这次计算的结果。
  return filesChanged
}

/**
 * Checks if the original file has been changed compared to the backup file.
 * Optionally reuses a pre-fetched stat for the original file (when the caller
 * already stat'd it to check existence, we avoid a second syscall).
 *
 * Exported for testing.
 */
// checkOriginFileChanged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkOriginFileChanged(
  originalFile: string,
  backupFileName: string,
  originalStatsHint?: Stats,
): Promise<boolean> {
  // backupPath 路径数据读取`resolveBackupPath`，供共享工具后续处理使用。
  const backupPath = resolveBackupPath(backupFileName)

  // originalStats 集合保存`originalStatsHint ?? null`，供后续判断或组装使用。
  let originalStats: Stats | null = originalStatsHint ?? null
  // originalStats 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!originalStats) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // originalStats 集合更新为 `await stat(originalFile)`，确保共享工具后续读取最新状态。
      originalStats = await stat(originalFile)
    } catch (e: unknown) {
      // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
      if (!isENOENT(e)) return true
    }
  }
  // backupStats 集合保存`null`，作为后续空值处理的输入。
  let backupStats: Stats | null = null
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // backupStats 集合更新为 `await stat(backupPath)`，确保共享工具后续读取最新状态。
    backupStats = await stat(backupPath)
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
    if (!isENOENT(e)) return true
  }

  // 返回 `compareStatsAndContent(originalStats, backupStats, async () => {`，作为共享工具这次计算的结果。
  return compareStatsAndContent(originalStats, backupStats, async () => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 并行获取 originalContent、backupContent，缩短共享工具 file History等待多个独立异步任务的时间。
      const [originalContent, backupContent] = await Promise.all([
        readFile(originalFile, 'utf-8'),
        readFile(backupPath, 'utf-8'),
      ])
      // 返回 `originalContent !== backupContent`，作为共享工具这次计算的结果。
      return originalContent !== backupContent
    } catch {
      // File deleted between stat and read -> treat as changed.
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  })
}

/**
 * Shared stat/content comparison logic for sync and async change checks.
 * Returns true if the file has changed relative to the backup.
 */
// compareStatsAndContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function compareStatsAndContent<T extends boolean | Promise<boolean>>(
  originalStats: Stats | null,
  backupStats: Stats | null,
  // 这个回调绑定到 compareContent: () => T,，负责共享工具在该局部场景下的响应。
  compareContent: () => T,
): T | boolean {
  // One exists, one missing -> changed
  // `(originalStats === null)` 与 `(backupStats === null)` 不一致时刷新派生状态，避免使用过期结果。
  if ((originalStats === null) !== (backupStats === null)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Both missing -> no change
  // 只有 `originalStats === null || backupStats === null` 满足时，共享工具才执行该分支。
  if (originalStats === null || backupStats === null) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check file stats like permission and file size
  // 共享工具在这里按实际状态进入对应分支。
  if (
    originalStats.mode !== backupStats.mode ||
    originalStats.size !== backupStats.size
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // This is an optimization that depends on the correct setting of the modified
  // time. If the original file's modified time was before the backup time, then
  // we can skip the file content comparison.
  // 满足 `originalStats.mtimeMs < backupStats.mtimeMs` 时，共享工具执行该分支。
  if (originalStats.mtimeMs < backupStats.mtimeMs) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Use the more expensive file content comparison. The callback handles its
  // own read errors — a try/catch here is dead for async callbacks anyway.
  // 返回 `compareContent()`，作为共享工具这次计算的结果。
  return compareContent()
}

/**
 * Computes the number of lines changed in the diff.
 */
// computeDiffStatsForFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function computeDiffStatsForFile(
  originalFile: string,
  backupFileName?: string,
): Promise<DiffStats> {
  // filesChanged 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const filesChanged: string[] = []
  // insertions 集合保存`0`，供后续判断或组装使用。
  let insertions = 0
  // deletions 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let deletions = 0
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // backupPath 路径数据保存`backupFileName`，供后续判断或组装使用。
    const backupPath = backupFileName
      ? resolveBackupPath(backupFileName)
      : undefined

    // 并行获取 originalContent、backupContent，缩短共享工具 file History等待多个独立异步任务的时间。
    const [originalContent, backupContent] = await Promise.all([
      readFileAsyncOrNull(originalFile),
      backupPath ? readFileAsyncOrNull(backupPath) : null,
    ])

    // 只有 `originalContent === null && backupContent === null` 满足时，共享工具才执行该分支。
    if (originalContent === null && backupContent === null) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        filesChanged,
        insertions,
        deletions,
      }
    }

    // filesChanged 文件数据追加新条目，保持收集顺序与输入顺序一致。
    filesChanged.push(originalFile)

    // Compute the diff
    // changes 集合保存`diffLines`，供共享工具后续处理使用。
    const changes = diffLines(originalContent ?? '', backupContent ?? '')
    // 调用 changes.forEach，触发共享工具此处需要的副作用。
    changes.forEach(c => {
      // 满足 `c.added` 时，共享工具执行该分支。
      if (c.added) {
        // 共享工具 file History在这里处理 `insertions += c.count || 0`，完成这一小步状态转换。
        insertions += c.count || 0
      }
      // 满足 `c.removed` 时，共享工具执行该分支。
      if (c.removed) {
        // 共享工具 file History在这里处理 `deletions += c.count || 0`，完成这一小步状态转换。
        deletions += c.count || 0
      }
    })
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`FileHistory: Error generating diffStats: ${error}`))
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    filesChanged,
    insertions,
    deletions,
  }
}

// getBackupFileName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBackupFileName(filePath: string, version: number): string {
  // fileNameHash 文件数据构建`createHash`，供共享工具后续处理使用。
  const fileNameHash = createHash('sha256')
    .update(filePath)
    .digest('hex')
    .slice(0, 16)
  // 返回 ``${fileNameHash}@v${version}``，作为共享工具这次计算的结果。
  return `${fileNameHash}@v${version}`
}

// resolveBackupPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveBackupPath(backupFileName: string, sessionId?: string): string {
  // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
  const configDir = getClaudeConfigHomeDir()
  // 返回 `join(`，作为共享工具这次计算的结果。
  return join(
    configDir,
    'file-history',
    sessionId || getSessionId(),
    backupFileName,
  )
}

/**
 * Creates a backup of the file at filePath. If the file does not exist
 * (ENOENT), records a null backup (file-did-not-exist marker). All IO is
 * async. Lazy mkdir: tries copyFile first, creates the directory on ENOENT.
 */
// createBackup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function createBackup(
  filePath: string | null,
  version: number,
): Promise<FileHistoryBackup> {
  // 满足 `filePath === null` 时，共享工具执行该分支。
  if (filePath === null) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { backupFileName: null, version, backupTime: new Date() }
  }

  // backupFileName 文件数据读取`getBackupFileName`，供共享工具后续处理使用。
  const backupFileName = getBackupFileName(filePath, version)
  // backupPath 路径数据读取`resolveBackupPath`，供共享工具后续处理使用。
  const backupPath = resolveBackupPath(backupFileName)

  // Stat first: if the source is missing, record a null backup and skip the
  // copy. Separates "source missing" from "backup dir missing" cleanly —
  // sharing a catch for both meant a file deleted between copyFile-success
  // and stat would leave an orphaned backup with a null state record.
  // srcStats 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let srcStats: Stats
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // srcStats 集合更新为 `await stat(filePath)`，确保共享工具后续读取最新状态。
    srcStats = await stat(filePath)
  } catch (e: unknown) {
    // 满足 `isENOENT(e)` 时，共享工具执行该分支。
    if (isENOENT(e)) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { backupFileName: null, version, backupTime: new Date() }
    }
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }

  // copyFile preserves content and avoids reading the whole file into the JS
  // heap (which the previous readFileSync+writeFileSync pipeline did, OOMing
  // on large tracked files). Lazy mkdir: 99% of calls hit the fast path
  // (directory already exists); on ENOENT, mkdir then retry.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `copyFile(filePath, backupPath)` 完成，再继续共享工具 file History的异步流程。
    await copyFile(filePath, backupPath)
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
    if (!isENOENT(e)) throw e
    // 等待 `mkdir(dirname(backupPath), { recursive: true })` 完成，再继续共享工具 file History的异步流程。
    await mkdir(dirname(backupPath), { recursive: true })
    // 等待 `copyFile(filePath, backupPath)` 完成，再继续共享工具 file History的异步流程。
    await copyFile(filePath, backupPath)
  }

  // Preserve file permissions on the backup.
  // 等待 `chmod(backupPath, srcStats.mode)` 完成，再继续共享工具 file History的异步流程。
  await chmod(backupPath, srcStats.mode)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_file_history_backup_file_created', {
    version: version,
    fileSize: srcStats.size,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    backupFileName,
    version,
    backupTime: new Date(),
  }
}

/**
 * Restores a file from its backup path with proper directory creation and permissions.
 * Lazy mkdir: tries copyFile first, creates the directory on ENOENT.
 */
// restoreBackup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function restoreBackup(
  filePath: string,
  backupFileName: string,
): Promise<void> {
  // backupPath 路径数据读取`resolveBackupPath`，供共享工具后续处理使用。
  const backupPath = resolveBackupPath(backupFileName)

  // Stat first: if the backup is missing, log and bail before attempting
  // the copy. Separates "backup missing" from "destination dir missing".
  // backupStats 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let backupStats: Stats
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // backupStats 集合更新为 `await stat(backupPath)`，确保共享工具后续读取最新状态。
    backupStats = await stat(backupPath)
  } catch (e: unknown) {
    // 满足 `isENOENT(e)` 时，共享工具执行该分支。
    if (isENOENT(e)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_history_rewind_restore_file_failed', {})
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(`FileHistory: [Rewind] Backup file not found: ${backupPath}`),
      )
      // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 抛出 e，阻止共享工具在无效状态下继续运行。
    throw e
  }

  // Lazy mkdir: 99% of calls hit the fast path (destination dir exists).
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `copyFile(backupPath, filePath)` 完成，再继续共享工具 file History的异步流程。
    await copyFile(backupPath, filePath)
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
    if (!isENOENT(e)) throw e
    // 等待 `mkdir(dirname(filePath), { recursive: true })` 完成，再继续共享工具 file History的异步流程。
    await mkdir(dirname(filePath), { recursive: true })
    // 等待 `copyFile(backupPath, filePath)` 完成，再继续共享工具 file History的异步流程。
    await copyFile(backupPath, filePath)
  }

  // Restore the file permissions
  // 等待 `chmod(filePath, backupStats.mode)` 完成，再继续共享工具 file History的异步流程。
  await chmod(filePath, backupStats.mode)
}

/**
 * Gets the first (earliest) backup version for a file, used when rewinding
 * to a target backup point where the file has not been tracked yet.
 *
 * @returns The backup file name for the first version, or null if the file
 * did not exist in the first version, or undefined if we cannot find a
 * first version at all
 */
// getBackupFileNameFirstVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBackupFileNameFirstVersion(
  trackingPath: string,
  state: FileHistoryState,
): BackupFileName | undefined {
  // 按顺序遍历 `state.snapshots` 中的snapshot，逐个交给共享工具处理。
  for (const snapshot of state.snapshots) {
    // backup 命名 `snapshot.trackedFileBackups[trackingPath]`，让后续代码直接表达这个值的用途。
    const backup = snapshot.trackedFileBackups[trackingPath]
    // `backup` 与 `undefined && backup.version ===...` 不一致时刷新派生状态，避免使用过期结果。
    if (backup !== undefined && backup.version === 1) {
      // This can be either a file name or null, with null meaning the file
      // did not exist in the first version.
      // 返回 `backup.backupFileName`，作为共享工具这次计算的结果。
      return backup.backupFileName
    }
  }

  // The undefined means there was an error resolving the first version.
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Use the relative path as the key to reduce session storage space for tracking.
 */
// maybeShortenFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maybeShortenFilePath(filePath: string): string {
  // 满足 `!isAbsolute(filePath)` 时，共享工具执行该分支。
  if (!isAbsolute(filePath)) {
    // 返回 `filePath`，作为共享工具这次计算的结果。
    return filePath
  }
  // cwd读取`getOriginalCwd`，供共享工具后续处理使用。
  const cwd = getOriginalCwd()
  // 满足 `filePath.startsWith(cwd)` 时，共享工具执行该分支。
  if (filePath.startsWith(cwd)) {
    // 返回 `relative(cwd, filePath)`，作为共享工具这次计算的结果。
    return relative(cwd, filePath)
  }
  // 返回 `filePath`，作为共享工具这次计算的结果。
  return filePath
}

// maybeExpandFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maybeExpandFilePath(filePath: string): string {
  // 满足 `isAbsolute(filePath)` 时，共享工具执行该分支。
  if (isAbsolute(filePath)) {
    // 返回 `filePath`，作为共享工具这次计算的结果。
    return filePath
  }
  // 返回 `join(getOriginalCwd(), filePath)`，作为共享工具这次计算的结果。
  return join(getOriginalCwd(), filePath)
}

/**
 * Restores file history snapshot state for a given log option.
 */
// fileHistoryRestoreStateFromLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function fileHistoryRestoreStateFromLog(
  fileHistorySnapshots: FileHistorySnapshot[],
  // 这个回调绑定到 onUpdateState: (newState: FileHistoryState) => void,，负责共享工具在该局部场景下的响应。
  onUpdateState: (newState: FileHistoryState) => void,
): void {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Make a copy of the snapshots as we migrate from absolute path to
  // shortened relative tracking path.
  // snapshots 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const snapshots: FileHistorySnapshot[] = []
  // Rebuild the tracked files from the snapshots
  // trackedFiles 文件数据构建`new Set<string>()`，供后续判断或组装使用。
  const trackedFiles = new Set<string>()
  // 按顺序遍历 `fileHistorySnapshots` 中的snapshot，逐个交给共享工具处理。
  for (const snapshot of fileHistorySnapshots) {
    // trackedFileBackups 文件数据 从空对象开始收集键值，后续按名称补齐内容。
    const trackedFileBackups: Record<string, FileHistoryBackup> = {}
    // 循环处理 `const [path, backup] of Object.entries(snapshot.trackedFileBackups)`，让共享工具把同类条目按顺序走完。
    for (const [path, backup] of Object.entries(snapshot.trackedFileBackups)) {
      // trackingPath 路径数据保存`maybeShortenFilePath`，供共享工具后续处理使用。
      const trackingPath = maybeShortenFilePath(path)
      // 调用 trackedFiles.add，触发共享工具此处需要的副作用。
      trackedFiles.add(trackingPath)
      // trackedFileBackups[trackingPath 路径数据更新为 `backup`，确保共享工具 file History后续读取最新状态。
      trackedFileBackups[trackingPath] = backup
    }
    // snapshots 集合追加新条目，保持收集顺序与输入顺序一致。
    snapshots.push({
      ...snapshot,
      trackedFileBackups: trackedFileBackups,
    })
  }
  // 调用 onUpdateState，触发共享工具此处需要的副作用。
  onUpdateState({
    snapshots: snapshots,
    trackedFiles: trackedFiles,
    snapshotSequence: snapshots.length,
  })
}

/**
 * Copy file history snapshots for a given log option.
 */
// copyFileHistoryForResume 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function copyFileHistoryForResume(log: LogOption): Promise<void> {
  // 满足 `!fileHistoryEnabled()` 时，共享工具执行该分支。
  if (!fileHistoryEnabled()) {
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // fileHistorySnapshots 文件数据保存`log.fileHistorySnapshots`，供后续判断或组装使用。
  const fileHistorySnapshots = log.fileHistorySnapshots
  // !fileHistorySnapshots || log.me... 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!fileHistorySnapshots || log.messages.length === 0) {
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // lastMessage 消息数据记录 `log.messages[log.messages.length - 1]` 是否成立，下一步按该结果分支。
  const lastMessage = log.messages[log.messages.length - 1]
  // previousSessionId 会话数据保存`lastMessage?.sessionId`，供共享工具 file History后续判断或输出使用。
  const previousSessionId = lastMessage?.sessionId
  // previousSessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!previousSessionId) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `FileHistory: Failed to copy backups on restore (no previous session id)`,
      ),
    )
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = getSessionId()
  // 满足 `previousSessionId === sessionId` 时，共享工具执行该分支。
  if (previousSessionId === sessionId) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `FileHistory: No need to copy file history for resuming with same session id: ${sessionId}`,
    )
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // All backups share the same directory: {configDir}/file-history/{sessionId}/
    // Create it once upfront instead of once per backup file
    // newBackupDir格式化`join`，供共享工具后续处理使用。
    const newBackupDir = join(
      getClaudeConfigHomeDir(),
      'file-history',
      sessionId,
    )
    // 等待 `mkdir(newBackupDir, { recursive: true })` 完成，再继续共享工具 file History的异步流程。
    await mkdir(newBackupDir, { recursive: true })

    // Migrate all backup files from the previous session to current session.
    // Process all snapshots in parallel; within each snapshot, links also run in parallel.
    // failedSnapshots 集合保存`0`，供后续判断或组装使用。
    let failedSnapshots = 0
    // 等待 `Promise.allSettled(` 完成，再继续共享工具 file History的异步流程。
    await Promise.allSettled(
      // 调用 fileHistorySnapshots.map，触发共享工具此处需要的副作用。
      fileHistorySnapshots.map(async snapshot => {
        // backupEntries 集合派生`Object.values`，供共享工具后续处理使用。
        const backupEntries = Object.values(snapshot.trackedFileBackups).filter(
          // 这个回调绑定到 (backup): backup is typeof backup & { backupFileName: string } =>，负责共享工具在该局部场景下的响应。
          (backup): backup is typeof backup & { backupFileName: string } =>
            backup.backupFileName !== null,
        )

        // 结果列表保存`Promise.allSettled`，供共享工具后续处理使用。
        const results = await Promise.allSettled(
          // 调用 backupEntries.map，触发共享工具此处需要的副作用。
          backupEntries.map(async ({ backupFileName }) => {
            // oldBackupPath 路径数据读取`resolveBackupPath`，供共享工具后续处理使用。
            const oldBackupPath = resolveBackupPath(
              backupFileName,
              previousSessionId,
            )
            // newBackupPath 路径数据格式化`join`，供共享工具后续处理使用。
            const newBackupPath = join(newBackupDir, backupFileName)

            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // 等待 `link(oldBackupPath, newBackupPath)` 完成，再继续共享工具 file History的异步流程。
              await link(oldBackupPath, newBackupPath)
            } catch (e: unknown) {
              // code读取`getErrnoCode`，供共享工具后续处理使用。
              const code = getErrnoCode(e)
              // 当 `code` 匹配 `'EEXIST'` 时，共享工具执行对应分支。
              if (code === 'EEXIST') {
                // Already migrated, skip
                // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }
              // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
              if (code === 'ENOENT') {
                // 记录共享工具运行诊断，方便排查异常路径或性能问题。
                logError(
                  new Error(
                    `FileHistory: Failed to copy backup ${backupFileName} on restore (backup file does not exist in ${previousSessionId})`,
                  ),
                )
                // 抛出 e，阻止共享工具在无效状态下继续运行。
                throw e
              }
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logError(
                new Error(
                  `FileHistory: Error hard linking backup file from previous session`,
                ),
              )
              // Fallback to copy if hard link fails
              // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
              try {
                // 等待 `copyFile(oldBackupPath, newBackupPath)` 完成，再继续共享工具 file History的异步流程。
                await copyFile(oldBackupPath, newBackupPath)
              } catch (copyErr) {
                // 记录共享工具运行诊断，方便排查异常路径或性能问题。
                logError(
                  new Error(
                    `FileHistory: Error copying over backup from previous session`,
                  ),
                )
                // 抛出 copyErr，阻止共享工具在无效状态下继续运行。
                throw copyErr
              }
            }

            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `FileHistory: Copied backup ${backupFileName} from session ${previousSessionId} to ${sessionId}`,
            )
          }),
        )

        // copyFailed筛选`results.some`，供共享工具后续处理使用。
        const copyFailed = results.some(r => r.status === 'rejected')

        // Record the snapshot only if we have successfully migrated the backup files
        // copyFailed缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!copyFailed) {
          // 显式忽略 `recordFileHistorySnapshot(` 的返回值，只保留它触发的副作用。
          void recordFileHistorySnapshot(
            snapshot.messageId,
            snapshot,
            false, // isSnapshotUpdate
          // 这个回调绑定到 ).catch(_ => {，负责共享工具在该局部场景下的响应。
          ).catch(_ => {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(`FileHistory: Failed to record copy backup snapshot`),
            )
          })
        } else {
          // 共享工具 file History在这里处理 `failedSnapshots++`，完成这一小步状态转换。
          failedSnapshots++
        }
      }),
    )

    // 满足 `failedSnapshots > 0` 时，共享工具执行该分支。
    if (failedSnapshots > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_file_history_resume_copy_failed', {
        numSnapshots: fileHistorySnapshots.length,
        failedSnapshots,
      })
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

/**
 * Notifies VSCode about files that have changed between snapshots.
 * Compares the previous snapshot with the new snapshot and sends file_updated
 * notifications for any files whose content has changed.
 * Fire-and-forget (void-dispatched from fileHistoryMakeSnapshot).
 */
// notifyVscodeSnapshotFilesUpdated 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function notifyVscodeSnapshotFilesUpdated(
  oldState: FileHistoryState,
  newState: FileHistoryState,
): Promise<void> {
  // oldSnapshot保存`snapshots.at`，供共享工具后续处理使用。
  const oldSnapshot = oldState.snapshots.at(-1)
  // newSnapshot保存`snapshots.at`，供共享工具后续处理使用。
  const newSnapshot = newState.snapshots.at(-1)

  // newSnapshot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!newSnapshot) {
    // 共享工具 file History在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 按顺序遍历 `newState.trackedFiles` 中的trackingPath 路径数据，逐个交给共享工具处理。
  for (const trackingPath of newState.trackedFiles) {
    // 文件路径保存`maybeExpandFilePath`，供共享工具后续处理使用。
    const filePath = maybeExpandFilePath(trackingPath)
    // oldBackup读取 `oldSnapshot?.trackedFileBackups[trackingPath]` 对应条目，后续围绕该成员继续处理。
    const oldBackup = oldSnapshot?.trackedFileBackups[trackingPath]
    // newBackup 命名 `newSnapshot.trackedFileBackups[trackingPath]`，让后续代码直接表达这个值的用途。
    const newBackup = newSnapshot.trackedFileBackups[trackingPath]

    // Skip if both backups reference the same version (no change)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      oldBackup?.backupFileName === newBackup?.backupFileName &&
      oldBackup?.version === newBackup?.version
    ) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Get old content from the previous backup
    // 原始内容初始化为空值，后续分支会在有数据时补齐。
    let oldContent: string | null = null
    // 满足 `oldBackup?.backupFileName` 时，共享工具执行该分支。
    if (oldBackup?.backupFileName) {
      // backupPath 路径数据读取`resolveBackupPath`，供共享工具后续处理使用。
      const backupPath = resolveBackupPath(oldBackup.backupFileName)
      // 原始内容更新为 `await readFileAsyncOrNull(backupPath)`，确保共享工具后续读取最新状态。
      oldContent = await readFileAsyncOrNull(backupPath)
    }

    // Get new content from the new backup or current file
    // 新内容 命名 `null`，让后续代码直接表达这个值的用途。
    let newContent: string | null = null
    // 满足 `newBackup?.backupFileName` 时，共享工具执行该分支。
    if (newBackup?.backupFileName) {
      // backupPath 路径数据读取`resolveBackupPath`，供共享工具后续处理使用。
      const backupPath = resolveBackupPath(newBackup.backupFileName)
      // 新内容更新为 `await readFileAsyncOrNull(backupPath)`，确保共享工具后续读取最新状态。
      newContent = await readFileAsyncOrNull(backupPath)
    }
    // If newBackup?.backupFileName === null, the file was deleted; newContent stays null.

    // Only notify if content actually changed
    // `oldContent` 与 `newContent` 不一致时刷新派生状态，避免使用过期结果。
    if (oldContent !== newContent) {
      // 调用 notifyVscodeFileUpdated，触发共享工具此处需要的副作用。
      notifyVscodeFileUpdated(filePath, oldContent, newContent)
    }
  }
}

/** Async read that swallows all errors and returns null (best-effort). */
// readFileAsyncOrNull 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readFileAsyncOrNull(path: string): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `readFile(path, 'utf-8')`，调用方直接接收异步结果。
    return await readFile(path, 'utf-8')
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// ENABLE_DUMP_STATE 状态标记共享工具 file History是否启用对应路径。
const ENABLE_DUMP_STATE = false
// maybeDumpStateForDebug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function maybeDumpStateForDebug(state: FileHistoryState): void {
  // 满足 `ENABLE_DUMP_STATE` 时，共享工具执行该分支。
  if (ENABLE_DUMP_STATE) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发共享工具此处需要的副作用。
    console.error(inspect(state, false, 5))
  }
}
