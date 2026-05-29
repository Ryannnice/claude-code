// 引入 chokidar、FSWatcher，将 chokidar 中已经封装好的能力接到本文件流程里。
import chokidar, { type FSWatcher } from 'chokidar'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, join } from 'path'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  executeCwdChangedHooks,
  executeFileChangedHooks,
  type HookOutsideReplResult,
} from '../hooks.js'
// 引入 clearCwdEnvFiles，将 ../sessionEnvironment.js 中已经封装好的能力接到本文件流程里。
import { clearCwdEnvFiles } from '../sessionEnvironment.js'
// 引入 getHooksConfigFromSnapshot，将 ./hooksConfigSnapshot.js 中已经封装好的能力接到本文件流程里。
import { getHooksConfigFromSnapshot } from './hooksConfigSnapshot.js'

// watcher 命名 `null`，让后续代码直接表达这个值的用途。
let watcher: FSWatcher | null = null
// currentCwd 先占位，稍后的条件分支会根据实际输入补齐它。
let currentCwd: string
// dynamicWatchPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
let dynamicWatchPaths: string[] = []
// dynamicWatchPathsSorted 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
let dynamicWatchPathsSorted: string[] = []
// initialized标记共享工具React hook file Changed Watch...是否启用对应路径。
let initialized = false
// hasEnvHooks 集合标记共享工具React hook file Changed Watch...是否启用对应路径。
let hasEnvHooks = false
// 这个回调绑定到 let notifyCallback: ((text: string, isError: boolean) => void) | null = null，负责共享工具在该局部场景下的响应。
let notifyCallback: ((text: string, isError: boolean) => void) | null = null

// setEnvHookNotifier 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setEnvHookNotifier(
  // 这个回调绑定到 cb: ((text: string, isError: boolean) => void) | null,，负责共享工具在该局部场景下的响应。
  cb: ((text: string, isError: boolean) => void) | null,
): void {
  // notifyCallback更新为 `cb`，确保共享工具后续读取最新状态。
  notifyCallback = cb
}

// initializeFileChangedWatcher 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeFileChangedWatcher(cwd: string): void {
  // 满足 `initialized` 时，共享工具执行该分支。
  if (initialized) return
  // initialized更新为 `true`，确保共享工具后续读取最新状态。
  initialized = true
  // currentCwd更新为 `cwd`，确保共享工具后续读取最新状态。
  currentCwd = cwd

  // 配置读取`getHooksConfigFromSnapshot`，供共享工具后续处理使用。
  const config = getHooksConfigFromSnapshot()
  // React hook file Changed Watcher在这里处理 `hasEnvHooks =`，完成这一小步状态转换。
  hasEnvHooks =
    (config?.CwdChanged?.length ?? 0) > 0 ||
    (config?.FileChanged?.length ?? 0) > 0

  // 满足 `hasEnvHooks` 时，共享工具执行该分支。
  if (hasEnvHooks) {
    // 调用 registerCleanup，触发共享工具此处需要的副作用。
    registerCleanup(async () => dispose())
  }

  // 路径列表读取`resolveWatchPaths`，供共享工具后续处理使用。
  const paths = resolveWatchPaths(config)
  // 路径列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (paths.length === 0) return

  // 调用 startWatching，触发共享工具此处需要的副作用。
  startWatching(paths)
}

// resolveWatchPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveWatchPaths(
  config?: ReturnType<typeof getHooksConfigFromSnapshot>,
): string[] {
  // matchers 集合读取`getHooksConfigFromSnapshot`，供共享工具后续处理使用。
  const matchers = (config ?? getHooksConfigFromSnapshot())?.FileChanged ?? []

  // Matcher field: filenames to watch in cwd, pipe-separated (e.g. ".envrc|.env")
  // staticPaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const staticPaths: string[] = []
  // 按顺序遍历 `matchers` 中的m，逐个交给共享工具处理。
  for (const m of matchers) {
    // m.matcher缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!m.matcher) continue
    // 逐项读取 `m.matcher.split('|').map(s => s.trim())` 中的名称，按输入顺序推进共享工具。
    for (const name of m.matcher.split('|').map(s => s.trim())) {
      // 名称缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!name) continue
      // staticPaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
      staticPaths.push(isAbsolute(name) ? name : join(currentCwd, name))
    }
  }

  // Combine static matcher paths with dynamic paths from hook output
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...new Set([...staticPaths, ...dynamicWatchPaths])]
}

// startWatching 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startWatching(paths: string[]): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`FileChanged: watching ${paths.length} paths`)
  // watcher更新为 `chokidar.watch(paths, {`，确保共享工具后续读取最新状态。
  watcher = chokidar.watch(paths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 200 },
    ignorePermissionErrors: true,
  })
  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('change', p => handleFileEvent(p, 'change'))
  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('add', p => handleFileEvent(p, 'add'))
  // 调用 watcher.on，触发共享工具此处需要的副作用。
  watcher.on('unlink', p => handleFileEvent(p, 'unlink'))
}

// handleFileEvent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleFileEvent(
  path: string,
  event: 'change' | 'add' | 'unlink',
): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`FileChanged: ${event} ${path}`)
  // 显式忽略 `executeFileChangedHooks(path, event)` 的返回值，只保留它触发的副作用。
  void executeFileChangedHooks(path, event)
    // 链式调用 then，继续加工上一行在共享工具中产生的数据。
    .then(({ results, watchPaths, systemMessages }) => {
      // 满足 `watchPaths.length > 0` 时，共享工具执行该分支。
      if (watchPaths.length > 0) {
        // 调用 updateWatchPaths，触发共享工具此处需要的副作用。
        updateWatchPaths(watchPaths)
      }
      // 按顺序遍历 `systemMessages` 中的消息，逐个交给共享工具处理。
      for (const msg of systemMessages) {
        // 调用 notifyCallback?.(msg, false)，完成这一处局部操作。
        notifyCallback?.(msg, false)
      }
      // 按顺序遍历 `results` 中的r，逐个交给共享工具处理。
      for (const r of results) {
        // 只有 `!r.succeeded && r.output` 满足时，共享工具才执行该分支。
        if (!r.succeeded && r.output) {
          // 调用 notifyCallback?.(r.output, true)，完成这一处局部操作。
          notifyCallback?.(r.output, true)
        }
      }
    })
    // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
    .catch(e => {
      // 消息保存`errorMessage`，供共享工具后续处理使用。
      const msg = errorMessage(e)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`FileChanged hook failed: ${msg}`, {
        level: 'error',
      })
      // 调用 notifyCallback?.(msg, true)，完成这一处局部操作。
      notifyCallback?.(msg, true)
    })
}

// updateWatchPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateWatchPaths(paths: string[]): void {
  // initialized缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!initialized) return
  // sorted格式化`paths.slice`，供共享工具后续处理使用。
  const sorted = paths.slice().sort()
  // 共享工具在这里按实际状态进入对应分支。
  if (
    sorted.length === dynamicWatchPathsSorted.length &&
    // 调用 sorted.every，触发共享工具此处需要的副作用。
    sorted.every((p, i) => p === dynamicWatchPathsSorted[i])
  ) {
    // React hook file Changed Watcher在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // dynamicWatchPaths 路径数据更新为 `paths`，确保共享工具后续读取最新状态。
  dynamicWatchPaths = paths
  // dynamicWatchPathsSorted 路径数据更新为 `sorted`，确保共享工具后续读取最新状态。
  dynamicWatchPathsSorted = sorted
  // 调用 restartWatching，触发共享工具此处需要的副作用。
  restartWatching()
}

// restartWatching 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function restartWatching(): void {
  // 满足 `watcher` 时，共享工具执行该分支。
  if (watcher) {
    // 显式忽略 `watcher.close()` 的返回值，只保留它触发的副作用。
    void watcher.close()
    // watcher更新为 `null`，确保共享工具后续读取最新状态。
    watcher = null
  }
  // 路径列表读取`resolveWatchPaths`，供共享工具后续处理使用。
  const paths = resolveWatchPaths()
  // 满足 `paths.length > 0` 时，共享工具执行该分支。
  if (paths.length > 0) {
    // 调用 startWatching，触发共享工具此处需要的副作用。
    startWatching(paths)
  }
}

// onCwdChangedForHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function onCwdChangedForHooks(
  oldCwd: string,
  newCwd: string,
): Promise<void> {
  // 满足 `oldCwd === newCwd` 时，共享工具执行该分支。
  if (oldCwd === newCwd) return

  // Re-evaluate from the current snapshot so mid-session hook changes are picked up
  // 配置读取`getHooksConfigFromSnapshot`，供共享工具后续处理使用。
  const config = getHooksConfigFromSnapshot()
  // currentHasEnvHooks 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const currentHasEnvHooks =
    (config?.CwdChanged?.length ?? 0) > 0 ||
    (config?.FileChanged?.length ?? 0) > 0
  // currentHasEnvHooks 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!currentHasEnvHooks) return
  // currentCwd更新为 `newCwd`，确保共享工具后续读取最新状态。
  currentCwd = newCwd

  // 等待 `clearCwdEnvFiles()` 完成，再继续React hook file Changed Watcher的异步流程。
  await clearCwdEnvFiles()
  // hookResult保存`executeCwdChangedHooks`，供共享工具后续处理使用。
  const hookResult = await executeCwdChangedHooks(oldCwd, newCwd).catch(e => {
    // 消息保存`errorMessage`，供共享工具后续处理使用。
    const msg = errorMessage(e)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`CwdChanged hook failed: ${msg}`, {
      level: 'error',
    })
    // 调用 notifyCallback?.(msg, true)，完成这一处局部操作。
    notifyCallback?.(msg, true)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      results: [] as HookOutsideReplResult[],
      watchPaths: [] as string[],
      systemMessages: [] as string[],
    }
  })
  // dynamicWatchPaths 路径数据更新为 `hookResult.watchPaths`，确保共享工具后续读取最新状态。
  dynamicWatchPaths = hookResult.watchPaths
  // dynamicWatchPathsSorted 路径数据更新为 `hookResult.watchPaths.slice().sort()`，确保共享工具后续读取最新状态。
  dynamicWatchPathsSorted = hookResult.watchPaths.slice().sort()
  // 按顺序遍历 `hookResult.systemMessages` 中的消息，逐个交给共享工具处理。
  for (const msg of hookResult.systemMessages) {
    // 调用 notifyCallback?.(msg, false)，完成这一处局部操作。
    notifyCallback?.(msg, false)
  }
  // 按顺序遍历 `hookResult.results` 中的r，逐个交给共享工具处理。
  for (const r of hookResult.results) {
    // 只有 `!r.succeeded && r.output` 满足时，共享工具才执行该分支。
    if (!r.succeeded && r.output) {
      // 调用 notifyCallback?.(r.output, true)，完成这一处局部操作。
      notifyCallback?.(r.output, true)
    }
  }

  // Re-resolve matcher paths against the new cwd
  // 满足 `initialized` 时，共享工具执行该分支。
  if (initialized) {
    // 调用 restartWatching，触发共享工具此处需要的副作用。
    restartWatching()
  }
}

// dispose 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function dispose(): void {
  // 满足 `watcher` 时，共享工具执行该分支。
  if (watcher) {
    // 显式忽略 `watcher.close()` 的返回值，只保留它触发的副作用。
    void watcher.close()
    // watcher更新为 `null`，确保共享工具后续读取最新状态。
    watcher = null
  }
  // dynamicWatchPaths 路径数据更新为 `[]`，确保共享工具后续读取最新状态。
  dynamicWatchPaths = []
  // dynamicWatchPathsSorted 路径数据更新为 `[]`，确保共享工具后续读取最新状态。
  dynamicWatchPathsSorted = []
  // initialized更新为 `false`，确保共享工具后续读取最新状态。
  initialized = false
  // hasEnvHooks 集合更新为 `false`，确保共享工具后续读取最新状态。
  hasEnvHooks = false
  // notifyCallback更新为 `null`，确保共享工具后续读取最新状态。
  notifyCallback = null
}

// resetFileChangedWatcherForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetFileChangedWatcherForTesting(): void {
  // 调用 dispose，触发共享工具此处需要的副作用。
  dispose()
}
