// 引入 chokidar、FSWatcher，将 chokidar 中已经封装好的能力接到本文件流程里。
import chokidar, { type FSWatcher } from 'chokidar'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as platformPath from 'path'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ConfigChangeSource,
  executeConfigChangeHooks,
  hasBlockingResult,
} from '../hooks.js'
// 引入 createSignal，将 ../signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from '../signal.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 SETTING_SOURCES、SettingSource，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { SETTING_SOURCES, type SettingSource } from './constants.js'
// 引入 clearInternalWrites、consumeInternalWrite，将 ./internalWrites.js 中已经封装好的能力接到本文件流程里。
import { clearInternalWrites, consumeInternalWrite } from './internalWrites.js'
// 引入 getManagedSettingsDropInDir，将 ./managedPath.js 中已经封装好的能力接到本文件流程里。
import { getManagedSettingsDropInDir } from './managedPath.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getHkcuSettings,
  getMdmSettings,
  refreshMdmSettings,
  setMdmSettingsCache,
} from './mdm/settings.js'
// 引入 getSettingsFilePathForSource，将 ./settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsFilePathForSource } from './settings.js'
// 引入 resetSettingsCache，将 ./settingsCache.js 中已经封装好的能力接到本文件流程里。
import { resetSettingsCache } from './settingsCache.js'

/**
 * Time in milliseconds to wait for file writes to stabilize before processing.
 * This helps avoid processing partial writes or rapid successive changes.
 */
// FILE_STABILITY_THRESHOLD_MS 文件数据保存`1000`，供共享工具 change Detector后续判断或输出使用。
const FILE_STABILITY_THRESHOLD_MS = 1000

/**
 * Polling interval in milliseconds for checking file stability.
 * Used by chokidar's awaitWriteFinish option.
 * Must be lower than FILE_STABILITY_THRESHOLD_MS.
 */
// FILE_STABILITY_POLL_INTERVAL_MS 文件数据保存`500`，供后续判断或组装使用。
const FILE_STABILITY_POLL_INTERVAL_MS = 500

/**
 * Time window in milliseconds to consider a file change as internal.
 * If a file change occurs within this window after markInternalWrite() is called,
 * it's assumed to be from Claude Code itself and won't trigger a notification.
 */
// INTERNAL_WRITE_WINDOW_MS 集合 命名 `5000`，让后续代码直接表达这个值的用途。
const INTERNAL_WRITE_WINDOW_MS = 5000

/**
 * Poll interval for MDM settings (registry/plist) changes.
 * These can't be watched via filesystem events, so we poll periodically.
 */
// MDM_POLL_INTERVAL_MS 集合保存`30 * 60 * 1000 // 30 minutes`，供共享工具 change Detector后续判断或输出使用。
const MDM_POLL_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Grace period in milliseconds before processing a settings file deletion.
 * Handles the common delete-and-recreate pattern during auto-updates or when
 * another session starts up. If an `add` or `change` event fires within this
 * window (file was recreated), the deletion is cancelled and treated as a change.
 *
 * Must exceed chokidar's awaitWriteFinish delay (stabilityThreshold + pollInterval)
 * so the grace window outlasts the write stability check on the recreated file.
 */
// DELETION_GRACE_MS 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const DELETION_GRACE_MS =
  FILE_STABILITY_THRESHOLD_MS + FILE_STABILITY_POLL_INTERVAL_MS + 200

// watcher初始化为空值，后续分支会在有数据时补齐。
let watcher: FSWatcher | null = null
// mdmPollTimer 命名 `null`，让后续代码直接表达这个值的用途。
let mdmPollTimer: ReturnType<typeof setInterval> | null = null
// lastMdmSnapshot初始化为空值，后续分支会在有数据时补齐。
let lastMdmSnapshot: string | null = null
// initialized标记共享工具 change Detector是否启用对应路径。
let initialized = false
// disposed标记共享工具 change Detector是否启用对应路径。
let disposed = false
// pendingDeletions 集合 命名 `new Map<string, ReturnType<typeof setTimeout>>()`，让后续代码直接表达这个值的用途。
const pendingDeletions = new Map<string, ReturnType<typeof setTimeout>>()
// settingsChanged构建`createSignal<[source: SettingSource]>()` 整理出中间结果，供共享工具 change Detector后续步骤使用。
const settingsChanged = createSignal<[source: SettingSource]>()

// Test overrides for timing constants
// testOverrides 集合 先占位，稍后的条件分支会根据实际输入补齐它。
let testOverrides: {
  stabilityThreshold?: number
  pollInterval?: number
  mdmPollInterval?: number
  deletionGrace?: number
} | null = null

/**
 * Initialize file watching
 */
// initialize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initialize(): Promise<void> {
  // 满足 `getIsRemoteMode()` 时，共享工具执行该分支。
  if (getIsRemoteMode()) return
  // 只有 `initialized || disposed` 满足时，共享工具才执行该分支。
  if (initialized || disposed) return
  // initialized更新为 `true`，确保共享工具后续读取最新状态。
  initialized = true

  // Start MDM poll for registry/plist changes (independent of filesystem watching)
  // 调用 startMdmPoll，触发共享工具此处需要的副作用。
  startMdmPoll()

  // Register cleanup to properly dispose during graceful shutdown
  // 调用 registerCleanup，触发共享工具此处需要的副作用。
  registerCleanup(dispose)

  // 从 `await getWatchTargets()` 解构 dirs、settingsFiles、dropInDir，减少共享工具 change Detector对同一对象的重复访问。
  const { dirs, settingsFiles, dropInDir } = await getWatchTargets()
  // 满足 `disposed) return // dispose(` 时，共享工具执行该分支。
  if (disposed) return // dispose() ran during the await
  // dirs 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (dirs.length === 0) return

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Watching for changes in setting files ${[...settingsFiles].join(', ')}...${dropInDir ? ` and drop-in directory ${dropInDir}` : ''}`,
  )

  // watcher更新为 `chokidar.watch(dirs, {`，确保共享工具后续读取最新状态。
  watcher = chokidar.watch(dirs, {
    persistent: true,
    ignoreInitial: true,
    depth: 0, // Only watch immediate children, not subdirectories
    awaitWriteFinish: {
      stabilityThreshold:
        testOverrides?.stabilityThreshold ?? FILE_STABILITY_THRESHOLD_MS,
      pollInterval:
        testOverrides?.pollInterval ?? FILE_STABILITY_POLL_INTERVAL_MS,
    },
    // 这个回调绑定到 ignored: (path, stats) => {，负责共享工具在该局部场景下的响应。
    ignored: (path, stats) => {
      // Ignore special file types (sockets, FIFOs, devices) - they cannot be watched
      // and will error with EOPNOTSUPP on macOS.
      // 只有 `stats && !stats.isFile() && !stats.isDirectory()` 满足时，共享工具才执行该分支。
      if (stats && !stats.isFile() && !stats.isDirectory()) return true
      // Ignore .git directories
      // 满足 `path.split(platformPath.sep).some(dir => dir === '.git')` 时，共享工具执行该分支。
      if (path.split(platformPath.sep).some(dir => dir === '.git')) return true
      // Allow directories (chokidar needs them for directory-level watching)
      // and paths without stats (chokidar's initial check before stat)
      // 只有 `!stats || stats.isDirectory()` 满足时，共享工具才执行该分支。
      if (!stats || stats.isDirectory()) return false
      // Only watch known settings files, ignore everything else in the directory
      // Note: chokidar normalizes paths to forward slashes on Windows, so we
      // normalize back to native format for comparison
      // normalized保存`platformPath.normalize`，供共享工具后续处理使用。
      const normalized = platformPath.normalize(path)
      // 满足 `settingsFiles.has(normalized)` 时，共享工具执行该分支。
      if (settingsFiles.has(normalized)) return false
      // Also accept .json files inside the managed-settings.d/ drop-in directory
      // 共享工具在这里按实际状态进入对应分支。
      if (
        dropInDir &&
        normalized.startsWith(dropInDir + platformPath.sep) &&
        normalized.endsWith('.json')
      ) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    },
    // Additional options for stability
    ignorePermissionErrors: true,
    usePolling: false, // Use native file system events
    atomic: true, // Handle atomic writes better
  })

  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('change', handleChange)
  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('unlink', handleDelete)
  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('add', handleAdd)
}

/**
 * Clean up file watcher. Returns a promise that resolves when chokidar's
 * close() settles — callers that need the watcher fully stopped before
 * removing the watched directory (e.g. test teardown) must await this.
 * Fire-and-forget is still valid where timing doesn't matter.
 */
// dispose 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dispose(): Promise<void> {
  // disposed更新为 `true`，确保共享工具后续读取最新状态。
  disposed = true
  // 满足 `mdmPollTimer` 时，共享工具执行该分支。
  if (mdmPollTimer) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(mdmPollTimer)
    // mdmPollTimer更新为 `null`，确保共享工具后续读取最新状态。
    mdmPollTimer = null
  }
  // 逐项读取 `pendingDeletions.values()) clearTimeout(timer` 中的timer，按输入顺序推进共享工具。
  for (const timer of pendingDeletions.values()) clearTimeout(timer)
  // 调用 pendingDeletions.clear，触发共享工具此处需要的副作用。
  pendingDeletions.clear()
  // lastMdmSnapshot更新为 `null`，确保共享工具后续读取最新状态。
  lastMdmSnapshot = null
  // 调用 clearInternalWrites，触发共享工具此处需要的副作用。
  clearInternalWrites()
  // 调用 settingsChanged.clear，触发共享工具此处需要的副作用。
  settingsChanged.clear()
  // w保存`watcher`，供共享工具 change Detector后续判断或输出使用。
  const w = watcher
  // watcher更新为 `null`，确保共享工具后续读取最新状态。
  watcher = null
  // 返回 `w ? w.close() : Promise.resolve()`，作为共享工具这次计算的结果。
  return w ? w.close() : Promise.resolve()
}

/**
 * Subscribe to settings changes
 */
// subscribe保存`settingsChanged.subscribe`，供共享工具 change Detector后续判断或输出使用。
export const subscribe = settingsChanged.subscribe

/**
 * Collect settings file paths and their deduplicated parent directories to watch.
 * Returns all potential settings file paths for watched directories, not just those
 * that exist at init time, so that newly-created files are also detected.
 */
// getWatchTargets 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getWatchTargets(): Promise<{
  dirs: string[]
  settingsFiles: Set<string>
  dropInDir: string | null
}> {
  // Map from directory to all potential settings files in that directory
  // dirToSettingsFiles 文件数据构建`new Map<string, Set<string>>()`，供后续判断或组装使用。
  const dirToSettingsFiles = new Map<string, Set<string>>()
  // dirsWithExistingFiles 文件数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const dirsWithExistingFiles = new Set<string>()

  // 按顺序遍历 `SETTING_SOURCES` 中的source，逐个交给共享工具处理。
  for (const source of SETTING_SOURCES) {
    // Skip flagSettings - they're provided via CLI and won't change during the session.
    // Additionally, they may be temp files in $TMPDIR which can contain special files
    // (FIFOs, sockets) that cause the file watcher to hang or error.
    // See: https://github.com/anthropics/claude-code/issues/16469
    // 当 `source` 匹配 `'flagSettings'` 时，共享工具执行对应分支。
    if (source === 'flagSettings') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 路径读取`getSettingsFilePathForSource`，供共享工具后续处理使用。
    const path = getSettingsFilePathForSource(source)
    // 路径缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!path) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // dir保存`platformPath.dirname`，供共享工具后续处理使用。
    const dir = platformPath.dirname(path)

    // Track all potential settings files in each directory
    // 满足 `!dirToSettingsFiles.has(dir)` 时，共享工具执行该分支。
    if (!dirToSettingsFiles.has(dir)) {
      // dirToSettingsFiles.set 写入新的状态值，使共享工具后续读取保持一致。
      dirToSettingsFiles.set(dir, new Set())
    }
    // 调用 dirToSettingsFiles.get，触发共享工具此处需要的副作用。
    dirToSettingsFiles.get(dir)!.add(path)

    // Check if file exists - only watch directories that have at least one existing file
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合保存`stat`，供共享工具后续处理使用。
      const stats = await stat(path)
      // 满足 `stats.isFile()` 时，共享工具执行该分支。
      if (stats.isFile()) {
        // 调用 dirsWithExistingFiles.add，触发共享工具此处需要的副作用。
        dirsWithExistingFiles.add(dir)
      }
    } catch {
      // File doesn't exist, that's fine
    }
  }

  // For watched directories, include ALL potential settings file paths
  // This ensures files created after init are also detected
  // settingsFiles 文件数据构建`new Set<string>()` 整理出中间结果，供共享工具 change Detector后续步骤使用。
  const settingsFiles = new Set<string>()
  // 按顺序遍历 `dirsWithExistingFiles` 中的dir，逐个交给共享工具处理。
  for (const dir of dirsWithExistingFiles) {
    // filesInDir 文件数据读取`dirToSettingsFiles.get`，供共享工具后续处理使用。
    const filesInDir = dirToSettingsFiles.get(dir)
    // 满足 `filesInDir` 时，共享工具执行该分支。
    if (filesInDir) {
      // 按顺序遍历 `filesInDir` 中的file 文件数据，逐个交给共享工具处理。
      for (const file of filesInDir) {
        // 调用 settingsFiles.add，触发共享工具此处需要的副作用。
        settingsFiles.add(file)
      }
    }
  }

  // Also watch the managed-settings.d/ drop-in directory for policy fragments.
  // We add it as a separate watched directory so chokidar's depth:0 watches
  // its immediate children (the .json files). Any .json file inside it maps
  // to the 'policySettings' source.
  // dropInDir保存`null`，作为后续空值处理的输入。
  let dropInDir: string | null = null
  // managedDropIn读取`getManagedSettingsDropInDir`，供共享工具后续处理使用。
  const managedDropIn = getManagedSettingsDropInDir()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`stat`，供共享工具后续处理使用。
    const stats = await stat(managedDropIn)
    // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
    if (stats.isDirectory()) {
      // 调用 dirsWithExistingFiles.add，触发共享工具此处需要的副作用。
      dirsWithExistingFiles.add(managedDropIn)
      // dropInDir更新为 `managedDropIn`，确保共享工具后续读取最新状态。
      dropInDir = managedDropIn
    }
  } catch {
    // Drop-in directory doesn't exist, that's fine
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { dirs: [...dirsWithExistingFiles], settingsFiles, dropInDir }
}

// settingSourceToConfigChangeSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function settingSourceToConfigChangeSource(
  source: SettingSource,
): ConfigChangeSource {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'user_settings'`，作为共享工具这次计算的结果。
      return 'user_settings'
    case 'projectSettings':
      // 返回 `'project_settings'`，作为共享工具这次计算的结果。
      return 'project_settings'
    case 'localSettings':
      // 返回 `'local_settings'`，作为共享工具这次计算的结果。
      return 'local_settings'
    case 'flagSettings':
    case 'policySettings':
      // 返回 `'policy_settings'`，作为共享工具这次计算的结果。
      return 'policy_settings'
  }
}

// handleChange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleChange(path: string): void {
  // source读取`getSourceForPath`，供共享工具后续处理使用。
  const source = getSourceForPath(path)
  // source缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!source) return

  // If a deletion was pending for this path (delete-and-recreate pattern),
  // cancel the deletion — we'll process this as a change instead.
  // pendingTimer读取`pendingDeletions.get`，供共享工具后续处理使用。
  const pendingTimer = pendingDeletions.get(path)
  // 满足 `pendingTimer` 时，共享工具执行该分支。
  if (pendingTimer) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(pendingTimer)
    // 调用 pendingDeletions.delete，触发共享工具此处需要的副作用。
    pendingDeletions.delete(path)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cancelled pending deletion of ${path} — file was recreated`,
    )
  }

  // Check if this was an internal write
  // 满足 `consumeInternalWrite(path, INTERNAL_WRITE_WINDOW_MS)` 时，共享工具执行该分支。
  if (consumeInternalWrite(path, INTERNAL_WRITE_WINDOW_MS)) {
    // 共享工具 change Detector在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Detected change to ${path}`)

  // Fire ConfigChange hook first — if blocked (exit code 2 or decision: 'block'),
  // skip applying the change to the session
  // 显式忽略 `executeConfigChangeHooks(` 的返回值，只保留它触发的副作用。
  void executeConfigChangeHooks(
    settingSourceToConfigChangeSource(source),
    path,
  // 这个回调绑定到 ).then(results => {，负责共享工具在该局部场景下的响应。
  ).then(results => {
    // 满足 `hasBlockingResult(results)` 时，共享工具执行该分支。
    if (hasBlockingResult(results)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`ConfigChange hook blocked change to ${path}`)
      // 共享工具 change Detector在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 fanOut，触发共享工具此处需要的副作用。
    fanOut(source)
  })
}

/**
 * Handle a file being re-added (e.g. after a delete-and-recreate). Cancels any
 * pending deletion grace timer and treats the event as a change.
 */
// handleAdd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleAdd(path: string): void {
  // source读取`getSourceForPath`，供共享工具后续处理使用。
  const source = getSourceForPath(path)
  // source缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!source) return

  // Cancel any pending deletion — the file is back
  // pendingTimer读取`pendingDeletions.get`，供共享工具后续处理使用。
  const pendingTimer = pendingDeletions.get(path)
  // 满足 `pendingTimer` 时，共享工具执行该分支。
  if (pendingTimer) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(pendingTimer)
    // 调用 pendingDeletions.delete，触发共享工具此处需要的副作用。
    pendingDeletions.delete(path)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Cancelled pending deletion of ${path} — file was re-added`)
  }

  // Treat as a change (re-read settings)
  // 调用 handleChange，触发共享工具此处需要的副作用。
  handleChange(path)
}

/**
 * Handle a file being deleted. Uses a grace period to absorb delete-and-recreate
 * patterns (e.g. auto-updater, another session starting up). If the file is
 * recreated within the grace period (detected via 'add' or 'change' event),
 * the deletion is cancelled and treated as a normal change instead.
 */
// handleDelete 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleDelete(path: string): void {
  // source读取`getSourceForPath`，供共享工具后续处理使用。
  const source = getSourceForPath(path)
  // source缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!source) return

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Detected deletion of ${path}`)

  // If there's already a pending deletion for this path, let it run
  // 满足 `pendingDeletions.has(path)` 时，共享工具执行该分支。
  if (pendingDeletions.has(path)) return

  // timer保存`setTimeout`，供共享工具后续处理使用。
  const timer = setTimeout(
    // 这个回调绑定到 (p, src) => {，负责共享工具在该局部场景下的响应。
    (p, src) => {
      // 调用 pendingDeletions.delete，触发共享工具此处需要的副作用。
      pendingDeletions.delete(p)

      // Fire ConfigChange hook first — if blocked, skip applying the deletion
      // 显式忽略 `executeConfigChangeHooks(` 的返回值，只保留它触发的副作用。
      void executeConfigChangeHooks(
        settingSourceToConfigChangeSource(src),
        p,
      // 这个回调绑定到 ).then(results => {，负责共享工具在该局部场景下的响应。
      ).then(results => {
        // 满足 `hasBlockingResult(results)` 时，共享工具执行该分支。
        if (hasBlockingResult(results)) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`ConfigChange hook blocked deletion of ${p}`)
          // 共享工具 change Detector在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 调用 fanOut，触发共享工具此处需要的副作用。
        fanOut(src)
      })
    },
    testOverrides?.deletionGrace ?? DELETION_GRACE_MS,
    path,
    source,
  )
  // pendingDeletions.set 写入新的状态值，使共享工具后续读取保持一致。
  pendingDeletions.set(path, timer)
}

// getSourceForPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSourceForPath(path: string): SettingSource | undefined {
  // Normalize path because chokidar uses forward slashes on Windows
  // normalizedPath 路径数据保存`platformPath.normalize`，供共享工具后续处理使用。
  const normalizedPath = platformPath.normalize(path)

  // Check if the path is inside the managed-settings.d/ drop-in directory
  // dropInDir读取`getManagedSettingsDropInDir`，供共享工具后续处理使用。
  const dropInDir = getManagedSettingsDropInDir()
  // 满足 `normalizedPath.startsWith(dropInDir + platformPath.sep)` 时，共享工具执行该分支。
  if (normalizedPath.startsWith(dropInDir + platformPath.sep)) {
    // 返回 `'policySettings'`，作为共享工具这次计算的结果。
    return 'policySettings'
  }

  // 返回 `SETTING_SOURCES.find(`，作为共享工具这次计算的结果。
  return SETTING_SOURCES.find(
    // source更新为 `> getSettingsFilePathForSource(source) === normalizedPath`，确保共享工具后续读取最新状态。
    source => getSettingsFilePathForSource(source) === normalizedPath,
  )
}

/**
 * Start polling for MDM settings changes (registry/plist).
 * Takes a snapshot of current MDM settings and compares on each tick.
 */
// startMdmPoll 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startMdmPoll(): void {
  // Capture initial snapshot (includes both admin MDM and user-writable HKCU)
  // initial读取`getMdmSettings`，供共享工具后续处理使用。
  const initial = getMdmSettings()
  // initialHkcu读取`getHkcuSettings`，供共享工具后续处理使用。
  const initialHkcu = getHkcuSettings()
  // lastMdmSnapshot更新为 `jsonStringify({`，确保共享工具后续读取最新状态。
  lastMdmSnapshot = jsonStringify({
    mdm: initial.settings,
    hkcu: initialHkcu.settings,
  })

  // mdmPollTimer更新为 `setInterval(() => {`，确保共享工具后续读取最新状态。
  mdmPollTimer = setInterval(() => {
    // 满足 `disposed` 时，共享工具执行该分支。
    if (disposed) return

    // 调用 void，触发共享工具此处需要的副作用。
    void (async () => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 从 `await refreshMdmSettings()` 解构 mdm、hkcu，减少共享工具 change Detector对同一对象的重复访问。
        const { mdm: current, hkcu: currentHkcu } = await refreshMdmSettings()
        // 满足 `disposed` 时，共享工具执行该分支。
        if (disposed) return

        // currentSnapshot保存`jsonStringify`，供共享工具后续处理使用。
        const currentSnapshot = jsonStringify({
          mdm: current.settings,
          hkcu: currentHkcu.settings,
        })

        // `currentSnapshot` 与 `lastMdmSnapshot` 不一致时刷新派生状态，避免使用过期结果。
        if (currentSnapshot !== lastMdmSnapshot) {
          // lastMdmSnapshot更新为 `currentSnapshot`，确保共享工具后续读取最新状态。
          lastMdmSnapshot = currentSnapshot
          // Update the cache so sync readers pick up new values
          // setMdmSettingsCache 写入新的状态值，使共享工具后续读取保持一致。
          setMdmSettingsCache(current, currentHkcu)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging('Detected MDM settings change via poll')
          // 调用 fanOut，触发共享工具此处需要的副作用。
          fanOut('policySettings')
        }
      } catch (error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`MDM poll error: ${errorMessage(error)}`)
      }
    })()
  }, testOverrides?.mdmPollInterval ?? MDM_POLL_INTERVAL_MS)

  // Don't let the timer keep the process alive
  // 调用 mdmPollTimer.unref，触发共享工具此处需要的副作用。
  mdmPollTimer.unref()
}

/**
 * Reset the settings cache, then notify all listeners.
 *
 * The cache reset MUST happen here (single producer), not in each listener
 * (N consumers). Previously, listeners like useSettingsChange and
 * applySettingsChange reset defensively because some notification paths
 * (file-watch at :289/340, MDM poll at :385) did not reset before iterating
 * listeners. That defense caused N-way thrashing when N listeners were
 * subscribed: each listener cleared the cache, re-read from disk (populating
 * it), then the next listener cleared it again — N full disk reloads per
 * notification. Profile showed 5 loadSettingsFromDisk calls in 12ms when
 * remote managed settings resolved at startup.
 *
 * With the reset centralized here, one notification = one disk reload: the
 * first listener to call getSettingsWithErrors() pays the miss and
 * repopulates; all subsequent listeners hit the cache.
 */
// fanOut 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fanOut(source: SettingSource): void {
  // 调用 resetSettingsCache，触发共享工具此处需要的副作用。
  resetSettingsCache()
  // 调用 settingsChanged.emit，触发共享工具此处需要的副作用。
  settingsChanged.emit(source)
}

/**
 * Manually notify listeners of a settings change.
 * Used for programmatic settings changes (e.g., remote managed settings refresh)
 * that don't involve file system changes.
 */
// notifyChange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyChange(source: SettingSource): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Programmatic settings change notification for ${source}`)
  // 调用 fanOut，触发共享工具此处需要的副作用。
  fanOut(source)
}

/**
 * Reset internal state for testing purposes only.
 * This allows re-initialization after dispose().
 * Optionally accepts timing overrides for faster test execution.
 *
 * Closes the watcher and returns the close promise so preload's afterEach
 * can await it BEFORE nuking perTestSettingsDir. Without this, chokidar's
 * pending awaitWriteFinish poll fires on the deleted dir → ENOENT (#25253).
 */
// resetForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetForTesting(overrides?: {
  stabilityThreshold?: number
  pollInterval?: number
  mdmPollInterval?: number
  deletionGrace?: number
}): Promise<void> {
  // 满足 `mdmPollTimer` 时，共享工具执行该分支。
  if (mdmPollTimer) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(mdmPollTimer)
    // mdmPollTimer更新为 `null`，确保共享工具后续读取最新状态。
    mdmPollTimer = null
  }
  // 逐项读取 `pendingDeletions.values()) clearTimeout(timer` 中的timer，按输入顺序推进共享工具。
  for (const timer of pendingDeletions.values()) clearTimeout(timer)
  // 调用 pendingDeletions.clear，触发共享工具此处需要的副作用。
  pendingDeletions.clear()
  // lastMdmSnapshot更新为 `null`，确保共享工具后续读取最新状态。
  lastMdmSnapshot = null
  // initialized更新为 `false`，确保共享工具后续读取最新状态。
  initialized = false
  // disposed更新为 `false`，确保共享工具后续读取最新状态。
  disposed = false
  // testOverrides 集合更新为 `overrides ?? null`，确保共享工具后续读取最新状态。
  testOverrides = overrides ?? null
  // w保存`watcher`，供共享工具 change Detector后续判断或输出使用。
  const w = watcher
  // watcher更新为 `null`，确保共享工具后续读取最新状态。
  watcher = null
  // 返回 `w ? w.close() : Promise.resolve()`，作为共享工具这次计算的结果。
  return w ? w.close() : Promise.resolve()
}

// settingsChangeDetector集中保存共享工具 change Detector要一起传递的字段。
export const settingsChangeDetector = {
  initialize,
  dispose,
  subscribe,
  notifyChange,
  resetForTesting,
}
