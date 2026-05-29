// 引入 chokidar、FSWatcher，将 chokidar 中已经封装好的能力接到本文件流程里。
import chokidar, { type FSWatcher } from 'chokidar'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as platformPath from 'path'
// 引入 getAdditionalDirectoriesForClaudeMd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAdditionalDirectoriesForClaudeMd } from '../../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  clearCommandMemoizationCaches,
  clearCommandsCache,
} from '../../commands.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  clearSkillCaches,
  getSkillsPath,
  onDynamicSkillsLoaded,
} from '../../skills/loadSkillsDir.js'
// 引入 resetSentSkillNames，将 ../attachments.js 中已经封装好的能力接到本文件流程里。
import { resetSentSkillNames } from '../attachments.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 executeConfigChangeHooks、hasBlockingResult，将 ../hooks.js 中已经封装好的能力接到本文件流程里。
import { executeConfigChangeHooks, hasBlockingResult } from '../hooks.js'
// 引入 createSignal，将 ../signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from '../signal.js'

/**
 * Time in milliseconds to wait for file writes to stabilize before processing.
 */
// FILE_STABILITY_THRESHOLD_MS 文件数据保存`1000`，供共享工具 skill Change Detector后续判断或输出使用。
const FILE_STABILITY_THRESHOLD_MS = 1000

/**
 * Polling interval in milliseconds for checking file stability.
 */
// FILE_STABILITY_POLL_INTERVAL_MS 文件数据 命名 `500`，让后续代码直接表达这个值的用途。
const FILE_STABILITY_POLL_INTERVAL_MS = 500

/**
 * Time in milliseconds to debounce rapid skill change events into a single
 * reload. Prevents cascading reloads when many skill files change at once
 * (e.g. during auto-update or when another session modifies skill directories).
 * Without this, each file change triggers a full clearSkillCaches() +
 * clearCommandsCache() + listener notification cycle, which can deadlock the
 * event loop when dozens of events fire in rapid succession.
 */
// RELOAD_DEBOUNCE_MS 集合保存`300`，供共享工具 skill Change Detector后续判断或输出使用。
const RELOAD_DEBOUNCE_MS = 300

/**
 * Polling interval for chokidar when usePolling is enabled.
 * Skill files change rarely (manual edits, git operations), so a 2s interval
 * trades negligible latency for far fewer stat() calls than the default 100ms.
 */
// POLLING_INTERVAL_MS 集合 命名 `2000`，让后续代码直接表达这个值的用途。
const POLLING_INTERVAL_MS = 2000

/**
 * Bun's native fs.watch() has a PathWatcherManager deadlock (oven-sh/bun#27469,
 * #26385): closing a watcher on the main thread while the File Watcher thread
 * is delivering events can hang both threads in __ulock_wait2 forever. Chokidar
 * with depth: 2 on large skill trees (hundreds of subdirs) triggers this
 * reliably when a git operation touches many directories at once — chokidar
 * internally closes/reopens per-directory FSWatchers as dirs are added/removed.
 *
 * Workaround: use stat() polling under Bun. No FSWatcher = no deadlock.
 * The fix is pending upstream; remove this once the Bun PR lands.
 */
// USE_POLLING标记共享工具 skill Change Detector是否启用对应路径。
const USE_POLLING = typeof Bun !== 'undefined'

// watcher初始化为空值，后续分支会在有数据时补齐。
let watcher: FSWatcher | null = null
// reloadTimer 命名 `null`，让后续代码直接表达这个值的用途。
let reloadTimer: ReturnType<typeof setTimeout> | null = null
// pendingChangedPaths 路径数据构建`new Set<string>()`，供后续判断或组装使用。
const pendingChangedPaths = new Set<string>()
// initialized标记共享工具 skill Change Detector是否启用对应路径。
let initialized = false
// disposed标记共享工具 skill Change Detector是否启用对应路径。
let disposed = false
// dynamicSkillsCallbackRegistered标记共享工具 skill Change Detector是否启用对应路径。
let dynamicSkillsCallbackRegistered = false
// 这个回调绑定到 let unregisterCleanup: (() => void) | null = null，负责共享工具在该局部场景下的响应。
let unregisterCleanup: (() => void) | null = null
// skillsChanged构建`createSignal`，供共享工具后续处理使用。
const skillsChanged = createSignal()

// Test overrides for timing constants
// testOverrides 集合 先占位，稍后的条件分支会根据实际输入补齐它。
let testOverrides: {
  stabilityThreshold?: number
  pollInterval?: number
  reloadDebounce?: number
  /** Chokidar fs.stat polling interval when USE_POLLING is active. */
  chokidarInterval?: number
} | null = null

/**
 * Initialize file watching for skill directories
 */
// initialize 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initialize(): Promise<void> {
  // 只有 `initialized || disposed` 满足时，共享工具才执行该分支。
  if (initialized || disposed) return
  // initialized更新为 `true`，确保共享工具后续读取最新状态。
  initialized = true

  // Register callback for when dynamic skills are loaded (only once)
  // dynamicSkillsCallbackRegistered缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!dynamicSkillsCallbackRegistered) {
    // dynamicSkillsCallbackRegistered更新为 `true`，确保共享工具后续读取最新状态。
    dynamicSkillsCallbackRegistered = true
    // 调用 onDynamicSkillsLoaded，触发共享工具此处需要的副作用。
    onDynamicSkillsLoaded(() => {
      // Clear memoization caches so new skills are picked up
      // Note: we use clearCommandMemoizationCaches (not clearCommandsCache)
      // because clearCommandsCache would call clearSkillCaches which
      // wipes out the dynamic skills we just loaded
      // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
      clearCommandMemoizationCaches()
      // Notify listeners that skills changed
      // 调用 skillsChanged.emit，触发共享工具此处需要的副作用。
      skillsChanged.emit()
    })
  }

  // 路径列表读取`getWatchablePaths`，供共享工具后续处理使用。
  const paths = await getWatchablePaths()
  // 路径列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (paths.length === 0) return

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Watching for changes in skill/command directories: ${paths.join(', ')}...`,
  )

  // watcher更新为 `chokidar.watch(paths, {`，确保共享工具后续读取最新状态。
  watcher = chokidar.watch(paths, {
    persistent: true,
    ignoreInitial: true,
    depth: 2, // Skills use skill-name/SKILL.md format
    awaitWriteFinish: {
      stabilityThreshold:
        testOverrides?.stabilityThreshold ?? FILE_STABILITY_THRESHOLD_MS,
      pollInterval:
        testOverrides?.pollInterval ?? FILE_STABILITY_POLL_INTERVAL_MS,
    },
    // Ignore special file types (sockets, FIFOs, devices) - they cannot be watched
    // and will error with EOPNOTSUPP on macOS. Only allow regular files and directories.
    // 这个回调绑定到 ignored: (path, stats) => {，负责共享工具在该局部场景下的响应。
    ignored: (path, stats) => {
      // 只有 `stats && !stats.isFile() && !stats.isDirectory()` 满足时，共享工具才执行该分支。
      if (stats && !stats.isFile() && !stats.isDirectory()) return true
      // Ignore .git directories
      // 返回 `path.split(platformPath.sep).some(dir => dir === '.git')`，作为共享工具这次计算的结果。
      return path.split(platformPath.sep).some(dir => dir === '.git')
    },
    ignorePermissionErrors: true,
    usePolling: USE_POLLING,
    interval: testOverrides?.chokidarInterval ?? POLLING_INTERVAL_MS,
    atomic: true,
  })

  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('add', handleChange)
  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('change', handleChange)
  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('unlink', handleChange)

  // Register cleanup to properly dispose of the file watcher during graceful shutdown
  // unregisterCleanup更新为 `registerCleanup(async () => {`，确保共享工具后续读取最新状态。
  unregisterCleanup = registerCleanup(async () => {
    // 等待 `dispose()` 完成，再继续共享工具 skill Change Detector的异步流程。
    await dispose()
  })
}

/**
 * Clean up file watcher
 */
// dispose 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function dispose(): Promise<void> {
  // disposed更新为 `true`，确保共享工具后续读取最新状态。
  disposed = true
  // 满足 `unregisterCleanup` 时，共享工具执行该分支。
  if (unregisterCleanup) {
    // 调用 unregisterCleanup，触发共享工具此处需要的副作用。
    unregisterCleanup()
    // unregisterCleanup更新为 `null`，确保共享工具后续读取最新状态。
    unregisterCleanup = null
  }
  // closePromise 异步任务读取`Promise.resolve()`，供后续判断或组装使用。
  let closePromise: Promise<void> = Promise.resolve()
  // 满足 `watcher` 时，共享工具执行该分支。
  if (watcher) {
    // closePromise 异步任务更新为 `watcher.close()`，确保共享工具后续读取最新状态。
    closePromise = watcher.close()
    // watcher更新为 `null`，确保共享工具后续读取最新状态。
    watcher = null
  }
  // 满足 `reloadTimer` 时，共享工具执行该分支。
  if (reloadTimer) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(reloadTimer)
    // reloadTimer更新为 `null`，确保共享工具后续读取最新状态。
    reloadTimer = null
  }
  // 调用 pendingChangedPaths.clear，触发共享工具此处需要的副作用。
  pendingChangedPaths.clear()
  // 调用 skillsChanged.clear，触发共享工具此处需要的副作用。
  skillsChanged.clear()
  // 返回 `closePromise`，作为共享工具这次计算的结果。
  return closePromise
}

/**
 * Subscribe to skill changes
 */
// subscribe保存`skillsChanged.subscribe`，供共享工具 skill Change Detector后续判断或输出使用。
export const subscribe = skillsChanged.subscribe

// getWatchablePaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getWatchablePaths(): Promise<string[]> {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: string[] = []

  // User skills directory (~/.claude/skills)
  // userSkillsPath 路径数据读取`getSkillsPath`，供共享工具后续处理使用。
  const userSkillsPath = getSkillsPath('userSettings', 'skills')
  // 满足 `userSkillsPath` 时，共享工具执行该分支。
  if (userSkillsPath) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.stat(userSkillsPath)` 完成，再继续共享工具 skill Change Detector的异步流程。
      await fs.stat(userSkillsPath)
      // 路径列表追加新条目，保持收集顺序与输入顺序一致。
      paths.push(userSkillsPath)
    } catch {
      // Path doesn't exist, skip it
    }
  }

  // User commands directory (~/.claude/commands)
  // userCommandsPath 命令数据读取`getSkillsPath`，供共享工具后续处理使用。
  const userCommandsPath = getSkillsPath('userSettings', 'commands')
  // 满足 `userCommandsPath` 时，共享工具执行该分支。
  if (userCommandsPath) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.stat(userCommandsPath)` 完成，再继续共享工具 skill Change Detector的异步流程。
      await fs.stat(userCommandsPath)
      // 路径列表追加新条目，保持收集顺序与输入顺序一致。
      paths.push(userCommandsPath)
    } catch {
      // Path doesn't exist, skip it
    }
  }

  // Project skills directory (.claude/skills)
  // projectSkillsPath 路径数据读取`getSkillsPath`，供共享工具后续处理使用。
  const projectSkillsPath = getSkillsPath('projectSettings', 'skills')
  // 满足 `projectSkillsPath` 时，共享工具执行该分支。
  if (projectSkillsPath) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // For project settings, resolve to absolute path
      // absolutePath 路径数据读取`platformPath.resolve`，供共享工具后续处理使用。
      const absolutePath = platformPath.resolve(projectSkillsPath)
      // 等待 `fs.stat(absolutePath)` 完成，再继续共享工具 skill Change Detector的异步流程。
      await fs.stat(absolutePath)
      // 路径列表追加新条目，保持收集顺序与输入顺序一致。
      paths.push(absolutePath)
    } catch {
      // Path doesn't exist, skip it
    }
  }

  // Project commands directory (.claude/commands)
  // projectCommandsPath 命令数据读取`getSkillsPath`，供共享工具后续处理使用。
  const projectCommandsPath = getSkillsPath('projectSettings', 'commands')
  // 满足 `projectCommandsPath` 时，共享工具执行该分支。
  if (projectCommandsPath) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // For project settings, resolve to absolute path
      // absolutePath 路径数据读取`platformPath.resolve`，供共享工具后续处理使用。
      const absolutePath = platformPath.resolve(projectCommandsPath)
      // 等待 `fs.stat(absolutePath)` 完成，再继续共享工具 skill Change Detector的异步流程。
      await fs.stat(absolutePath)
      // 路径列表追加新条目，保持收集顺序与输入顺序一致。
      paths.push(absolutePath)
    } catch {
      // Path doesn't exist, skip it
    }
  }

  // Additional directories (--add-dir) skills
  // 逐项读取 `getAdditionalDirectoriesForClaudeMd()` 中的dir，按输入顺序推进共享工具。
  for (const dir of getAdditionalDirectoriesForClaudeMd()) {
    // additionalSkillsPath 路径数据格式化`platformPath.join`，供共享工具后续处理使用。
    const additionalSkillsPath = platformPath.join(dir, '.claude', 'skills')
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.stat(additionalSkillsPath)` 完成，再继续共享工具 skill Change Detector的异步流程。
      await fs.stat(additionalSkillsPath)
      // 路径列表追加新条目，保持收集顺序与输入顺序一致。
      paths.push(additionalSkillsPath)
    } catch {
      // Path doesn't exist, skip it
    }
  }

  // 返回 `paths`，作为共享工具这次计算的结果。
  return paths
}

// handleChange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleChange(path: string): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Detected skill change: ${path}`)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_skill_file_changed', {
    source:
      'chokidar' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 调用 scheduleReload，触发共享工具此处需要的副作用。
  scheduleReload(path)
}

/**
 * Debounce rapid skill changes into a single reload. When many skill files
 * change at once (e.g. auto-update installs a new binary and a new session
 * touches skill directories), each file fires its own chokidar event. Without
 * debouncing, each event triggers clearSkillCaches() + clearCommandsCache() +
 * listener notification — 30 events means 30 full reload cycles, which can
 * deadlock the Bun event loop via rapid FSWatcher watch/unwatch churn.
 */
// scheduleReload 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scheduleReload(changedPath: string): void {
  // 调用 pendingChangedPaths.add，触发共享工具此处需要的副作用。
  pendingChangedPaths.add(changedPath)
  // 满足 `reloadTimer) clearTimeout(reloadTimer` 时，共享工具执行该分支。
  if (reloadTimer) clearTimeout(reloadTimer)
  // reloadTimer更新为 `setTimeout(async () => {`，确保共享工具后续读取最新状态。
  reloadTimer = setTimeout(async () => {
    // reloadTimer更新为 `null`，确保共享工具后续读取最新状态。
    reloadTimer = null
    // 路径列表 聚合成有序列表，保持后续遍历顺序稳定。
    const paths = [...pendingChangedPaths]
    // 调用 pendingChangedPaths.clear，触发共享工具此处需要的副作用。
    pendingChangedPaths.clear()
    // Fire ConfigChange hook once for the batch — the hook query is always
    // 'skills' so firing per-path (which can be hundreds during a git
    // operation) just spams the hook matcher with identical queries. Pass the
    // first path as a representative; hooks can inspect all paths via the
    // skills directory if they need the full set.
    // 结果列表保存`executeConfigChangeHooks`，供共享工具后续处理使用。
    const results = await executeConfigChangeHooks('skills', paths[0]!)
    // 满足 `hasBlockingResult(results)` 时，共享工具执行该分支。
    if (hasBlockingResult(results)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `ConfigChange hook blocked skill reload (${paths.length} paths)`,
      )
      // 共享工具 skill Change Detector在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearSkillCaches()
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearCommandsCache()
    // 调用 resetSentSkillNames，触发共享工具此处需要的副作用。
    resetSentSkillNames()
    // 调用 skillsChanged.emit，触发共享工具此处需要的副作用。
    skillsChanged.emit()
  }, testOverrides?.reloadDebounce ?? RELOAD_DEBOUNCE_MS)
}

/**
 * Reset internal state for testing purposes only.
 */
// resetForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resetForTesting(overrides?: {
  stabilityThreshold?: number
  pollInterval?: number
  reloadDebounce?: number
  chokidarInterval?: number
}): Promise<void> {
  // Clean up existing watcher if present to avoid resource leaks
  // 满足 `watcher` 时，共享工具执行该分支。
  if (watcher) {
    // 等待 `watcher.close()` 完成，再继续共享工具 skill Change Detector的异步流程。
    await watcher.close()
    // watcher更新为 `null`，确保共享工具后续读取最新状态。
    watcher = null
  }
  // 满足 `reloadTimer` 时，共享工具执行该分支。
  if (reloadTimer) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(reloadTimer)
    // reloadTimer更新为 `null`，确保共享工具后续读取最新状态。
    reloadTimer = null
  }
  // 调用 pendingChangedPaths.clear，触发共享工具此处需要的副作用。
  pendingChangedPaths.clear()
  // 调用 skillsChanged.clear，触发共享工具此处需要的副作用。
  skillsChanged.clear()
  // initialized更新为 `false`，确保共享工具后续读取最新状态。
  initialized = false
  // disposed更新为 `false`，确保共享工具后续读取最新状态。
  disposed = false
  // testOverrides 集合更新为 `overrides ?? null`，确保共享工具后续读取最新状态。
  testOverrides = overrides ?? null
}

// skillChangeDetector集中保存共享工具 skill Change Detector要一起传递的字段。
export const skillChangeDetector = {
  initialize,
  dispose,
  subscribe,
  resetForTesting,
}
