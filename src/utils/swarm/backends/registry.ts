// 引入 getIsNonInteractiveSession，将 ../../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../../bootstrap/state.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../../utils/debug.js 中维护。
import { logForDebugging } from '../../../utils/debug.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../../../utils/platform.js 中维护。
import { getPlatform } from '../../../utils/platform.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isInITerm2,
  isInsideTmux,
  isInsideTmuxSync,
  isIt2CliAvailable,
  isTmuxAvailable,
} from './detection.js'
// 引入 createInProcessBackend，将 ./InProcessBackend.js 中已经封装好的能力接到本文件流程里。
import { createInProcessBackend } from './InProcessBackend.js'
// 引入 getPreferTmuxOverIterm2，将 ./it2Setup.js 中已经封装好的能力接到本文件流程里。
import { getPreferTmuxOverIterm2 } from './it2Setup.js'
// 引入 createPaneBackendExecutor，将 ./PaneBackendExecutor.js 中已经封装好的能力接到本文件流程里。
import { createPaneBackendExecutor } from './PaneBackendExecutor.js'
// 引入 getTeammateModeFromSnapshot，将 ./teammateModeSnapshot.js 中已经封装好的能力接到本文件流程里。
import { getTeammateModeFromSnapshot } from './teammateModeSnapshot.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  BackendDetectionResult,
  PaneBackend,
  PaneBackendType,
  TeammateExecutor,
} from './types.js'

/**
 * Cached backend detection result.
 * Once detected, the backend selection is fixed for the lifetime of the process.
 */
// cachedBackend 缓存初始化为空值，后续分支会在有数据时补齐。
let cachedBackend: PaneBackend | null = null

/**
 * Cached detection result with additional metadata.
 */
// cachedDetectionResult 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let cachedDetectionResult: BackendDetectionResult | null = null

/**
 * Flag to track if backends have been registered.
 */
// backendsRegistered标记共享工具 registry是否启用对应路径。
let backendsRegistered = false

/**
 * Cached in-process backend instance.
 */
// cachedInProcessBackend 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let cachedInProcessBackend: TeammateExecutor | null = null

/**
 * Cached pane backend executor instance.
 * Wraps the detected PaneBackend to provide TeammateExecutor interface.
 */
// cachedPaneBackendExecutor 缓存初始化为空值，后续分支会在有数据时补齐。
let cachedPaneBackendExecutor: TeammateExecutor | null = null

/**
 * Tracks whether spawn fell back to in-process mode because no pane backend
 * was available (e.g., iTerm2 without it2 or tmux installed). Once set,
 * isInProcessEnabled() returns true so UI (banner, teams menu) reflects reality.
 */
// inProcessFallbackActive标记共享工具 registry是否启用对应路径。
let inProcessFallbackActive = false

/**
 * Placeholder for TmuxBackend - will be replaced with actual implementation.
 * This allows the registry to compile before the backend implementations exist.
 */
// 这个回调绑定到 let TmuxBackendClass: (new () => PaneBackend) | null = null，负责共享工具在该局部场景下的响应。
let TmuxBackendClass: (new () => PaneBackend) | null = null

/**
 * Placeholder for ITermBackend - will be replaced with actual implementation.
 * This allows the registry to compile before the backend implementations exist.
 */
// 这个回调绑定到 let ITermBackendClass: (new () => PaneBackend) | null = null，负责共享工具在该局部场景下的响应。
let ITermBackendClass: (new () => PaneBackend) | null = null

/**
 * Ensures backend classes are dynamically imported so getBackendByType() can
 * construct them. Unlike detectAndGetBackend(), this never spawns subprocesses
 * and never throws — it's the lightweight option when you only need class
 * registration (e.g., killing a pane by its stored backendType).
 */
// ensureBackendsRegistered 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureBackendsRegistered(): Promise<void> {
  // 满足 `backendsRegistered` 时，共享工具执行该分支。
  if (backendsRegistered) return
  // 等待 `import('./TmuxBackend.js')` 完成，再继续共享工具 registry的异步流程。
  await import('./TmuxBackend.js')
  // 等待 `import('./ITermBackend.js')` 完成，再继续共享工具 registry的异步流程。
  await import('./ITermBackend.js')
  // backendsRegistered更新为 `true`，确保共享工具后续读取最新状态。
  backendsRegistered = true
}

/**
 * Registers the TmuxBackend class with the registry.
 * Called by TmuxBackend.ts to avoid circular dependencies.
 */
// registerTmuxBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerTmuxBackend(backendClass: new () => PaneBackend): void {
  // TmuxBackendClass 集合更新为 `backendClass`，确保共享工具后续读取最新状态。
  TmuxBackendClass = backendClass
}

/**
 * Registers the ITermBackend class with the registry.
 * Called by ITermBackend.ts to avoid circular dependencies.
 */
// registerITermBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerITermBackend(
  backendClass: new () => PaneBackend,
): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[registry] registerITermBackend called, class=${backendClass?.name || 'undefined'}`,
  )
  // ITermBackendClass 集合更新为 `backendClass`，确保共享工具后续读取最新状态。
  ITermBackendClass = backendClass
}

/**
 * Creates a TmuxBackend instance.
 * Throws if TmuxBackend hasn't been registered.
 */
// createTmuxBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createTmuxBackend(): PaneBackend {
  // TmuxBackendClass 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!TmuxBackendClass) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'TmuxBackend not registered. Import TmuxBackend.ts before using the registry.',
    )
  }
  // 返回 `new TmuxBackendClass()`，作为共享工具这次计算的结果。
  return new TmuxBackendClass()
}

/**
 * Creates an ITermBackend instance.
 * Throws if ITermBackend hasn't been registered.
 */
// createITermBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createITermBackend(): PaneBackend {
  // ITermBackendClass 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ITermBackendClass) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'ITermBackend not registered. Import ITermBackend.ts before using the registry.',
    )
  }
  // 返回 `new ITermBackendClass()`，作为共享工具这次计算的结果。
  return new ITermBackendClass()
}

/**
 * Detection priority flow:
 * 1. If inside tmux, always use tmux (even in iTerm2)
 * 2. If in iTerm2 with it2 available, use iTerm2 backend
 * 3. If in iTerm2 without it2, return result indicating setup needed
 * 4. If tmux available, use tmux (creates external session)
 * 5. Otherwise, throw error with instructions
 */
// detectAndGetBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectAndGetBackend(): Promise<BackendDetectionResult> {
  // Ensure backends are registered before detection
  // 等待 `ensureBackendsRegistered()` 完成，再继续共享工具 registry的异步流程。
  await ensureBackendsRegistered()

  // Return cached result if available
  // 满足 `cachedDetectionResult` 时，共享工具执行该分支。
  if (cachedDetectionResult) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[BackendRegistry] Using cached backend: ${cachedDetectionResult.backend.type}`,
    )
    // 返回 `cachedDetectionResult`，作为共享工具这次计算的结果。
    return cachedDetectionResult
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[BackendRegistry] Starting backend detection...')

  // Check all environment conditions upfront for logging
  // insideTmux保存`isInsideTmux`，供共享工具后续处理使用。
  const insideTmux = await isInsideTmux()
  // inITerm2保存`isInITerm2`，供共享工具后续处理使用。
  const inITerm2 = isInITerm2()

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[BackendRegistry] Environment: insideTmux=${insideTmux}, inITerm2=${inITerm2}`,
  )

  // Priority 1: If inside tmux, always use tmux
  // 满足 `insideTmux` 时，共享工具执行该分支。
  if (insideTmux) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[BackendRegistry] Selected: tmux (running inside tmux session)',
    )
    // backend构建`createTmuxBackend`，供共享工具后续处理使用。
    const backend = createTmuxBackend()
    // cachedBackend 缓存更新为 `backend`，确保共享工具后续读取最新状态。
    cachedBackend = backend
    // cachedDetectionResult 缓存更新为 `{`，确保共享工具后续读取最新状态。
    cachedDetectionResult = {
      backend,
      isNative: true,
      needsIt2Setup: false,
    }
    // 返回 `cachedDetectionResult`，作为共享工具这次计算的结果。
    return cachedDetectionResult
  }

  // Priority 2: If in iTerm2, try to use native panes
  // 满足 `inITerm2` 时，共享工具执行该分支。
  if (inITerm2) {
    // Check if user previously chose to prefer tmux over iTerm2
    // preferTmux读取`getPreferTmuxOverIterm2`，供共享工具后续处理使用。
    const preferTmux = getPreferTmuxOverIterm2()
    // 满足 `preferTmux` 时，共享工具执行该分支。
    if (preferTmux) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[BackendRegistry] User prefers tmux over iTerm2, skipping iTerm2 detection',
      )
    } else {
      // it2Available保存`isIt2CliAvailable`，供共享工具后续处理使用。
      const it2Available = await isIt2CliAvailable()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[BackendRegistry] iTerm2 detected, it2 CLI available: ${it2Available}`,
      )

      // 满足 `it2Available` 时，共享工具执行该分支。
      if (it2Available) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[BackendRegistry] Selected: iterm2 (native iTerm2 with it2 CLI)',
        )
        // backend构建`createITermBackend`，供共享工具后续处理使用。
        const backend = createITermBackend()
        // cachedBackend 缓存更新为 `backend`，确保共享工具后续读取最新状态。
        cachedBackend = backend
        // cachedDetectionResult 缓存更新为 `{`，确保共享工具后续读取最新状态。
        cachedDetectionResult = {
          backend,
          isNative: true,
          needsIt2Setup: false,
        }
        // 返回 `cachedDetectionResult`，作为共享工具这次计算的结果。
        return cachedDetectionResult
      }
    }

    // In iTerm2 but it2 not available - check if tmux can be used as fallback
    // tmuxAvailable保存`isTmuxAvailable`，供共享工具后续处理使用。
    const tmuxAvailable = await isTmuxAvailable()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[BackendRegistry] it2 not available, tmux available: ${tmuxAvailable}`,
    )

    // 满足 `tmuxAvailable` 时，共享工具执行该分支。
    if (tmuxAvailable) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[BackendRegistry] Selected: tmux (fallback in iTerm2, it2 setup recommended)',
      )
      // Return tmux as fallback. Only signal it2 setup if the user hasn't already
      // chosen to prefer tmux - otherwise they'd be re-prompted on every spawn.
      // backend构建`createTmuxBackend`，供共享工具后续处理使用。
      const backend = createTmuxBackend()
      // cachedBackend 缓存更新为 `backend`，确保共享工具后续读取最新状态。
      cachedBackend = backend
      // cachedDetectionResult 缓存更新为 `{`，确保共享工具后续读取最新状态。
      cachedDetectionResult = {
        backend,
        isNative: false,
        needsIt2Setup: !preferTmux,
      }
      // 返回 `cachedDetectionResult`，作为共享工具这次计算的结果。
      return cachedDetectionResult
    }

    // In iTerm2 with no it2 and no tmux - it2 setup is required
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[BackendRegistry] ERROR: iTerm2 detected but no it2 CLI and no tmux',
    )
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'iTerm2 detected but it2 CLI not installed. Install it2 with: pip install it2',
    )
  }

  // Priority 3: Fall back to tmux external session
  // tmuxAvailable保存`isTmuxAvailable`，供共享工具后续处理使用。
  const tmuxAvailable = await isTmuxAvailable()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[BackendRegistry] Not in tmux or iTerm2, tmux available: ${tmuxAvailable}`,
  )

  // 满足 `tmuxAvailable` 时，共享工具执行该分支。
  if (tmuxAvailable) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[BackendRegistry] Selected: tmux (external session mode)')
    // backend构建`createTmuxBackend`，供共享工具后续处理使用。
    const backend = createTmuxBackend()
    // cachedBackend 缓存更新为 `backend`，确保共享工具后续读取最新状态。
    cachedBackend = backend
    // cachedDetectionResult 缓存更新为 `{`，确保共享工具后续读取最新状态。
    cachedDetectionResult = {
      backend,
      isNative: false,
      needsIt2Setup: false,
    }
    // 返回 `cachedDetectionResult`，作为共享工具这次计算的结果。
    return cachedDetectionResult
  }

  // No backend available - tmux is not installed
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[BackendRegistry] ERROR: No pane backend available')
  // 抛出 new Error(getTmuxInstallInstructions())，阻止共享工具在无效状态下继续运行。
  throw new Error(getTmuxInstallInstructions())
}

/**
 * Returns platform-specific tmux installation instructions.
 */
// getTmuxInstallInstructions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTmuxInstallInstructions(): string {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // 按照 platform 的取值选择共享工具的具体处理分支。
  switch (platform) {
    case 'macos':
      // 返回 ``To use agent swarms, install tmux:`，作为共享工具这次计算的结果。
      return `To use agent swarms, install tmux:
  brew install tmux
Then start a tmux session with: tmux new-session -s claude`

    case 'linux':
    case 'wsl':
      // 返回 ``To use agent swarms, install tmux:`，作为共享工具这次计算的结果。
      return `To use agent swarms, install tmux:
  sudo apt install tmux    # Ubuntu/Debian
  sudo dnf install tmux    # Fedora/RHEL
Then start a tmux session with: tmux new-session -s claude`

    case 'windows':
      // 返回 ``To use agent swarms, you need tmux which requires WSL (Windows Subsyst...`，作为共享工具这次计算的结果。
      return `To use agent swarms, you need tmux which requires WSL (Windows Subsystem for Linux).
Install WSL first, then inside WSL run:
  sudo apt install tmux
Then start a tmux session with: tmux new-session -s claude`

    default:
      // 返回 ``To use agent swarms, install tmux using your system's package manager.`，作为共享工具这次计算的结果。
      return `To use agent swarms, install tmux using your system's package manager.
Then start a tmux session with: tmux new-session -s claude`
  }
}

/**
 * Gets a backend by explicit type selection.
 * Useful for testing or when the user has a preference.
 *
 * @param type - The backend type to get
 * @returns The requested backend instance
 * @throws If the requested backend type is not available
 */
// getBackendByType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBackendByType(type: PaneBackendType): PaneBackend {
  // 按照 type 的取值选择共享工具的具体处理分支。
  switch (type) {
    case 'tmux':
      // 返回 `createTmuxBackend()`，作为共享工具这次计算的结果。
      return createTmuxBackend()
    case 'iterm2':
      // 返回 `createITermBackend()`，作为共享工具这次计算的结果。
      return createITermBackend()
  }
}

/**
 * Gets the currently cached backend, if any.
 * Returns null if no backend has been detected yet.
 */
// getCachedBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedBackend(): PaneBackend | null {
  // 返回 `cachedBackend`，作为共享工具这次计算的结果。
  return cachedBackend
}

/**
 * Gets the cached backend detection result, if any.
 * Returns null if detection hasn't run yet.
 * Use `isNative` to check if teammates are visible in native panes.
 */
// getCachedDetectionResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedDetectionResult(): BackendDetectionResult | null {
  // 返回 `cachedDetectionResult`，作为共享工具这次计算的结果。
  return cachedDetectionResult
}

/**
 * Records that spawn fell back to in-process mode because no pane backend
 * was available. After this, isInProcessEnabled() returns true and subsequent
 * spawns short-circuit to in-process (the environment won't change mid-session).
 */
// markInProcessFallback 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markInProcessFallback(): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[BackendRegistry] Marking in-process fallback as active')
  // inProcessFallbackActive更新为 `true`，确保共享工具后续读取最新状态。
  inProcessFallbackActive = true
}

/**
 * Gets the teammate mode for this session.
 * Returns the session snapshot captured at startup, ignoring runtime config changes.
 */
// getTeammateMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTeammateMode(): 'auto' | 'tmux' | 'in-process' {
  // 返回 `getTeammateModeFromSnapshot()`，作为共享工具这次计算的结果。
  return getTeammateModeFromSnapshot()
}

/**
 * Checks if in-process teammate execution is enabled.
 *
 * Logic:
 * - If teammateMode is 'in-process', always enabled
 * - If teammateMode is 'tmux', always disabled (use pane backend)
 * - If teammateMode is 'auto' (default), check environment:
 *   - If inside tmux, use pane backend (return false)
 *   - If inside iTerm2, use pane backend (return false) - detectAndGetBackend()
 *     will pick ITermBackend if it2 is available, or fall back to tmux
 *   - Otherwise, use in-process (return true)
 */
// isInProcessEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInProcessEnabled(): boolean {
  // Force in-process mode for non-interactive sessions (-p mode)
  // since tmux-based teammates don't make sense without a terminal UI
  // 满足 `getIsNonInteractiveSession()` 时，共享工具执行该分支。
  if (getIsNonInteractiveSession()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[BackendRegistry] isInProcessEnabled: true (non-interactive session)',
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // mode读取`getTeammateMode`，供共享工具后续处理使用。
  const mode = getTeammateMode()

  // enabled 先占位，稍后的条件分支会根据实际输入补齐它。
  let enabled: boolean
  // 当 `mode` 匹配 `'in-process'` 时，共享工具执行对应分支。
  if (mode === 'in-process') {
    // enabled更新为 `true`，确保共享工具后续读取最新状态。
    enabled = true
  // 共享工具 registry在这里处理 `} else if (mode === 'tmux') {`，完成这一小步状态转换。
  } else if (mode === 'tmux') {
    // enabled更新为 `false`，确保共享工具后续读取最新状态。
    enabled = false
  } else {
    // 'auto' mode - if a prior spawn fell back to in-process because no pane
    // backend was available, stay in-process (scoped to auto mode only so a
    // mid-session Settings change to explicit 'tmux' still takes effect).
    // 满足 `inProcessFallbackActive` 时，共享工具执行该分支。
    if (inProcessFallbackActive) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[BackendRegistry] isInProcessEnabled: true (fallback after pane backend unavailable)',
      )
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Check if a pane backend environment is available
    // If inside tmux or iTerm2, use pane backend; otherwise use in-process
    // insideTmux保存`isInsideTmuxSync`，供共享工具后续处理使用。
    const insideTmux = isInsideTmuxSync()
    // inITerm2保存`isInITerm2`，供共享工具后续处理使用。
    const inITerm2 = isInITerm2()
    // enabled更新为 `!insideTmux && !inITerm2`，确保共享工具后续读取最新状态。
    enabled = !insideTmux && !inITerm2
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[BackendRegistry] isInProcessEnabled: ${enabled} (mode=${mode}, insideTmux=${isInsideTmuxSync()}, inITerm2=${isInITerm2()})`,
  )
  // 返回 `enabled`，作为共享工具这次计算的结果。
  return enabled
}

/**
 * Returns the resolved teammate executor mode for this session.
 * Unlike getTeammateModeFromSnapshot which may return 'auto', this returns
 * what 'auto' actually resolves to given the current environment.
 */
// getResolvedTeammateMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getResolvedTeammateMode(): 'in-process' | 'tmux' {
  // 返回 `isInProcessEnabled() ? 'in-process' : 'tmux'`，作为共享工具这次计算的结果。
  return isInProcessEnabled() ? 'in-process' : 'tmux'
}

/**
 * Gets the InProcessBackend instance.
 * Creates and caches the instance on first call.
 */
// getInProcessBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInProcessBackend(): TeammateExecutor {
  // cachedInProcessBackend 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cachedInProcessBackend) {
    // cachedInProcessBackend 缓存更新为 `createInProcessBackend()`，确保共享工具后续读取最新状态。
    cachedInProcessBackend = createInProcessBackend()
  }
  // 返回 `cachedInProcessBackend`，作为共享工具这次计算的结果。
  return cachedInProcessBackend
}

/**
 * Gets a TeammateExecutor for spawning teammates.
 *
 * Returns either:
 * - InProcessBackend when preferInProcess is true and in-process mode is enabled
 * - PaneBackendExecutor wrapping the detected pane backend otherwise
 *
 * This provides a unified TeammateExecutor interface regardless of execution mode,
 * allowing callers to spawn and manage teammates without knowing the backend details.
 *
 * @param preferInProcess - If true and in-process is enabled, returns InProcessBackend.
 *                          Otherwise returns PaneBackendExecutor.
 * @returns TeammateExecutor instance
 */
// getTeammateExecutor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTeammateExecutor(
  preferInProcess: boolean = false,
): Promise<TeammateExecutor> {
  // 只有 `preferInProcess && isInProcessEnabled()` 满足时，共享工具才执行该分支。
  if (preferInProcess && isInProcessEnabled()) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[BackendRegistry] Using in-process executor')
    // 返回 `getInProcessBackend()`，作为共享工具这次计算的结果。
    return getInProcessBackend()
  }

  // Return pane backend executor
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[BackendRegistry] Using pane backend executor')
  // 返回 `getPaneBackendExecutor()`，作为共享工具这次计算的结果。
  return getPaneBackendExecutor()
}

/**
 * Gets the PaneBackendExecutor instance.
 * Creates and caches the instance on first call, detecting the appropriate pane backend.
 */
// getPaneBackendExecutor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getPaneBackendExecutor(): Promise<TeammateExecutor> {
  // cachedPaneBackendExecutor 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cachedPaneBackendExecutor) {
    // detection读取`detectAndGetBackend`，供共享工具后续处理使用。
    const detection = await detectAndGetBackend()
    // cachedPaneBackendExecutor 缓存更新为 `createPaneBackendExecutor(detection.backend)`，确保共享工具后续读取最新状态。
    cachedPaneBackendExecutor = createPaneBackendExecutor(detection.backend)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[BackendRegistry] Created PaneBackendExecutor wrapping ${detection.backend.type}`,
    )
  }
  // 返回 `cachedPaneBackendExecutor`，作为共享工具这次计算的结果。
  return cachedPaneBackendExecutor
}

/**
 * Resets the backend detection cache.
 * Used for testing to allow re-detection.
 */
// resetBackendDetection 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetBackendDetection(): void {
  // cachedBackend 缓存更新为 `null`，确保共享工具后续读取最新状态。
  cachedBackend = null
  // cachedDetectionResult 缓存更新为 `null`，确保共享工具后续读取最新状态。
  cachedDetectionResult = null
  // cachedInProcessBackend 缓存更新为 `null`，确保共享工具后续读取最新状态。
  cachedInProcessBackend = null
  // cachedPaneBackendExecutor 缓存更新为 `null`，确保共享工具后续读取最新状态。
  cachedPaneBackendExecutor = null
  // backendsRegistered更新为 `false`，确保共享工具后续读取最新状态。
  backendsRegistered = false
  // inProcessFallbackActive更新为 `false`，确保共享工具后续读取最新状态。
  inProcessFallbackActive = false
}
