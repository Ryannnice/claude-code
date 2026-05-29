// 类型依赖 { AgentColorName } 来自 ../../../tools/AgentTool/agentColorManager.js，用于校准共享工具的数据契约。
import type { AgentColorName } from '../../../tools/AgentTool/agentColorManager.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../../utils/debug.js 中维护。
import { logForDebugging } from '../../../utils/debug.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../../utils/execFileNoThrow.js'
// 复用 logError 工具函数，把通用处理留在 ../../../utils/log.js 中维护。
import { logError } from '../../../utils/log.js'
// 引入 count，将 ../../array.js 中已经封装好的能力接到本文件流程里。
import { count } from '../../array.js'
// 引入 sleep，将 ../../sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from '../../sleep.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSwarmSocketName,
  HIDDEN_SESSION_NAME,
  SWARM_SESSION_NAME,
  SWARM_VIEW_WINDOW_NAME,
  TMUX_COMMAND,
} from '../constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getLeaderPaneId,
  isInsideTmux as isInsideTmuxFromDetection,
  isTmuxAvailable,
} from './detection.js'
// 引入 registerTmuxBackend，将 ./registry.js 中已经封装好的能力接到本文件流程里。
import { registerTmuxBackend } from './registry.js'
// 类型依赖 { CreatePaneResult, PaneBackend, PaneId } 来自 ./types.js，用于校准共享工具的数据契约。
import type { CreatePaneResult, PaneBackend, PaneId } from './types.js'

// Track whether the first pane has been used for external swarm session
// firstPaneUsedForExternal标记共享工具 Tmux Backend是否启用对应路径。
let firstPaneUsedForExternal = false

// Cached leader window target (session:window format) to avoid repeated queries
// cachedLeaderWindowTarget 缓存初始化为空值，后续分支会在有数据时补齐。
let cachedLeaderWindowTarget: string | null = null

// Lock mechanism to prevent race conditions when spawning teammates in parallel
// paneCreationLock读取`Promise.resolve()`，供后续判断或组装使用。
let paneCreationLock: Promise<void> = Promise.resolve()

// Delay after pane creation to allow shell initialization (loading rc files, prompts, etc.)
// 200ms is enough for most shell configurations including slow ones like starship/oh-my-zsh
// PANE_SHELL_INIT_DELAY_MS 集合保存`200`，供后续判断或组装使用。
const PANE_SHELL_INIT_DELAY_MS = 200

// waitForPaneShellReady 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function waitForPaneShellReady(): Promise<void> {
  // 返回 `sleep(PANE_SHELL_INIT_DELAY_MS)`，作为共享工具这次计算的结果。
  return sleep(PANE_SHELL_INIT_DELAY_MS)
}

/**
 * Acquires a lock for pane creation, ensuring sequential execution.
 * Returns a release function that must be called when done.
 */
// acquirePaneCreationLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function acquirePaneCreationLock(): Promise<() => void> {
  // 这个回调绑定到 let release: () => void，负责共享工具在该局部场景下的响应。
  let release: () => void
  // newLock封装成回调，供共享工具 Tmux Backend在事件触发或异步步骤中调用。
  const newLock = new Promise<void>(resolve => {
    // release更新为 `resolve`，确保共享工具后续读取最新状态。
    release = resolve
  })

  // previousLock 命名 `paneCreationLock`，让后续代码直接表达这个值的用途。
  const previousLock = paneCreationLock
  // paneCreationLock更新为 `newLock`，确保共享工具后续读取最新状态。
  paneCreationLock = newLock

  // 返回 `previousLock.then(() => release!)`，作为共享工具这次计算的结果。
  return previousLock.then(() => release!)
}

/**
 * Gets the tmux color name for a given agent color.
 * These are tmux's built-in color names that work with pane-border-style.
 */
// getTmuxColorName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTmuxColorName(color: AgentColorName): string {
  // tmuxColors 集合 集中保存共享工具 Tmux Backend要一起传递的字段。
  const tmuxColors: Record<AgentColorName, string> = {
    red: 'red',
    blue: 'blue',
    green: 'green',
    yellow: 'yellow',
    purple: 'magenta',
    orange: 'colour208',
    pink: 'colour205',
    cyan: 'cyan',
  }
  // 返回 `tmuxColors[color]`，作为共享工具这次计算的结果。
  return tmuxColors[color]
}

/**
 * Runs a tmux command in the user's original tmux session (no socket override).
 * Use this for operations that interact with the user's tmux panes (split-pane with leader).
 */
// runTmuxInUserSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function runTmuxInUserSession(
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  // 返回 `execFileNoThrow(TMUX_COMMAND, args)`，作为共享工具这次计算的结果。
  return execFileNoThrow(TMUX_COMMAND, args)
}

/**
 * Runs a tmux command in the external swarm socket.
 * Use this for operations in the standalone swarm session (when user is not in tmux).
 */
// runTmuxInSwarm 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function runTmuxInSwarm(
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  // 返回 `execFileNoThrow(TMUX_COMMAND, ['-L', getSwarmSocketName(), ...args])`，作为共享工具这次计算的结果。
  return execFileNoThrow(TMUX_COMMAND, ['-L', getSwarmSocketName(), ...args])
}

/**
 * TmuxBackend implements PaneBackend using tmux for pane management.
 *
 * When running INSIDE tmux (leader is in tmux):
 * - Splits the current window to add teammates alongside the leader
 * - Leader stays on left (30%), teammates on right (70%)
 *
 * When running OUTSIDE tmux (leader is in regular terminal):
 * - Creates a claude-swarm session with a swarm-view window
 * - All teammates are equally distributed (no leader pane)
 */
// TmuxBackend 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class TmuxBackend implements PaneBackend {
  readonly type = 'tmux' as const
  readonly displayName = 'tmux'
  readonly supportsHideShow = true

  /**
   * Checks if tmux is installed and available.
   * Delegates to detection.ts for consistent detection logic.
   */
  // isAvailable 用 无 判断共享工具是否满足条件。
  async isAvailable(): Promise<boolean> {
    // 返回 `isTmuxAvailable()`，作为共享工具这次计算的结果。
    return isTmuxAvailable()
  }

  /**
   * Checks if we're currently running inside a tmux session.
   * Delegates to detection.ts for consistent detection logic.
   */
  // isRunningInside 用 无 判断共享工具是否满足条件。
  async isRunningInside(): Promise<boolean> {
    // 返回 `isInsideTmuxFromDetection()`，作为共享工具这次计算的结果。
    return isInsideTmuxFromDetection()
  }

  /**
   * Creates a new teammate pane in the swarm view.
   * Uses a lock to prevent race conditions when multiple teammates are spawned in parallel.
   */
  // 共享工具 Tmux Backend在这里处理 `async createTeammatePaneInSwarmView(`，完成这一小步状态转换。
  async createTeammatePaneInSwarmView(
    name: string,
    color: AgentColorName,
  ): Promise<CreatePaneResult> {
    // releaseLock保存`acquirePaneCreationLock`，供共享工具后续处理使用。
    const releaseLock = await acquirePaneCreationLock()

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // insideTmux保存`this.isRunningInside`，供共享工具后续处理使用。
      const insideTmux = await this.isRunningInside()

      // 满足 `insideTmux` 时，共享工具执行该分支。
      if (insideTmux) {
        // 等待并返回 `this.createTeammatePaneWithLeader(name, color)`，调用方直接接收异步结果。
        return await this.createTeammatePaneWithLeader(name, color)
      }

      // 等待并返回 `this.createTeammatePaneExternal(name, color)`，调用方直接接收异步结果。
      return await this.createTeammatePaneExternal(name, color)
    } finally {
      // 调用 releaseLock，触发共享工具此处需要的副作用。
      releaseLock()
    }
  }

  /**
   * Sends a command to a specific pane.
   */
  // 共享工具 Tmux Backend在这里处理 `async sendCommandToPane(`，完成这一小步状态转换。
  async sendCommandToPane(
    paneId: PaneId,
    command: string,
    useExternalSession = false,
  ): Promise<void> {
    // runTmux读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession
    // 结果保存`runTmux`，供共享工具后续处理使用。
    const result = await runTmux(['send-keys', '-t', paneId, command, 'Enter'])

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to send command to pane ${paneId}: ${result.stderr}`,
      )
    }
  }

  /**
   * Sets the border color for a specific pane.
   */
  // 共享工具 Tmux Backend在这里处理 `async setPaneBorderColor(`，完成这一小步状态转换。
  async setPaneBorderColor(
    paneId: PaneId,
    color: AgentColorName,
    useExternalSession = false,
  ): Promise<void> {
    // tmuxColor读取`getTmuxColorName`，供共享工具后续处理使用。
    const tmuxColor = getTmuxColorName(color)
    // runTmux读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession

    // Set pane-specific border style using pane options (requires tmux 3.2+)
    // 等待 `runTmux([` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux([
      'select-pane',
      '-t',
      paneId,
      '-P',
      `bg=default,fg=${tmuxColor}`,
    ])

    // 等待 `runTmux([` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux([
      'set-option',
      '-p',
      '-t',
      paneId,
      'pane-border-style',
      `fg=${tmuxColor}`,
    ])

    // 等待 `runTmux([` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux([
      'set-option',
      '-p',
      '-t',
      paneId,
      'pane-active-border-style',
      `fg=${tmuxColor}`,
    ])
  }

  /**
   * Sets the title for a pane (shown in pane border if pane-border-status is set).
   */
  // 共享工具 Tmux Backend在这里处理 `async setPaneTitle(`，完成这一小步状态转换。
  async setPaneTitle(
    paneId: PaneId,
    name: string,
    color: AgentColorName,
    useExternalSession = false,
  ): Promise<void> {
    // tmuxColor读取`getTmuxColorName`，供共享工具后续处理使用。
    const tmuxColor = getTmuxColorName(color)
    // runTmux读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession

    // Set the pane title
    // 等待 `runTmux(['select-pane', '-t', paneId, '-T', name])` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux(['select-pane', '-t', paneId, '-T', name])

    // Enable pane border status with colored format
    // 等待 `runTmux([` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux([
      'set-option',
      '-p',
      '-t',
      paneId,
      'pane-border-format',
      `#[fg=${tmuxColor},bold] #{pane_title} #[default]`,
    ])
  }

  /**
   * Enables pane border status for a window (shows pane titles).
   */
  // 共享工具 Tmux Backend在这里处理 `async enablePaneBorderStatus(`，完成这一小步状态转换。
  async enablePaneBorderStatus(
    windowTarget?: string,
    useExternalSession = false,
  ): Promise<void> {
    // target读取`this.getCurrentWindowTarget`，供共享工具后续处理使用。
    const target = windowTarget || (await this.getCurrentWindowTarget())
    // target缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!target) {
      // 共享工具 Tmux Backend在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // runTmux读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession
    // 等待 `runTmux([` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux([
      'set-option',
      '-w',
      '-t',
      target,
      'pane-border-status',
      'top',
    ])
  }

  /**
   * Rebalances panes to achieve the desired layout.
   */
  // 共享工具 Tmux Backend在这里处理 `async rebalancePanes(`，完成这一小步状态转换。
  async rebalancePanes(
    windowTarget: string,
    hasLeader: boolean,
  ): Promise<void> {
    // 满足 `hasLeader` 时，共享工具执行该分支。
    if (hasLeader) {
      // 等待 `this.rebalancePanesWithLeader(windowTarget)` 完成，再继续共享工具 Tmux Backend的异步流程。
      await this.rebalancePanesWithLeader(windowTarget)
    } else {
      // 等待 `this.rebalancePanesTiled(windowTarget)` 完成，再继续共享工具 Tmux Backend的异步流程。
      await this.rebalancePanesTiled(windowTarget)
    }
  }

  /**
   * Kills/closes a specific pane.
   */
  // killPane 使用 paneId: PaneId, useExternalSession = false 完成共享工具里的对应操作。
  async killPane(paneId: PaneId, useExternalSession = false): Promise<boolean> {
    // runTmux读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession
    // 结果保存`runTmux`，供共享工具后续处理使用。
    const result = await runTmux(['kill-pane', '-t', paneId])
    // 返回 `result.code === 0`，作为共享工具这次计算的结果。
    return result.code === 0
  }

  /**
   * Hides a pane by moving it to a detached hidden session.
   * Creates the hidden session if it doesn't exist, then uses break-pane to move the pane there.
   */
  // hidePane 使用 paneId: PaneId, useExternalSession = false 完成共享工具里的对应操作。
  async hidePane(paneId: PaneId, useExternalSession = false): Promise<boolean> {
    // runTmux读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession

    // Create hidden session if it doesn't exist (detached, not visible)
    // 等待 `runTmux(['new-session', '-d', '-s', HIDDEN_SESSION_NAME])` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux(['new-session', '-d', '-s', HIDDEN_SESSION_NAME])

    // Move the pane to the hidden session
    // 结果保存`runTmux`，供共享工具后续处理使用。
    const result = await runTmux([
      'break-pane',
      '-d',
      '-s',
      paneId,
      '-t',
      `${HIDDEN_SESSION_NAME}:`,
    ])

    // 满足 `result.code === 0` 时，共享工具执行该分支。
    if (result.code === 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[TmuxBackend] Hidden pane ${paneId}`)
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TmuxBackend] Failed to hide pane ${paneId}: ${result.stderr}`,
      )
    }

    // 返回 `result.code === 0`，作为共享工具这次计算的结果。
    return result.code === 0
  }

  /**
   * Shows a previously hidden pane by joining it back into the target window.
   * Uses `tmux join-pane` to move the pane back, then reapplies main-vertical layout
   * with leader at 30%.
   */
  // 共享工具 Tmux Backend在这里处理 `async showPane(`，完成这一小步状态转换。
  async showPane(
    paneId: PaneId,
    targetWindowOrPane: string,
    useExternalSession = false,
  ): Promise<boolean> {
    // runTmux读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const runTmux = useExternalSession ? runTmuxInSwarm : runTmuxInUserSession

    // join-pane -s: source pane to move
    // -t: target window/pane to join into
    // -h: join horizontally (side by side)
    // 结果保存`runTmux`，供共享工具后续处理使用。
    const result = await runTmux([
      'join-pane',
      '-h',
      '-s',
      paneId,
      '-t',
      targetWindowOrPane,
    ])

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TmuxBackend] Failed to show pane ${paneId}: ${result.stderr}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TmuxBackend] Showed pane ${paneId} in ${targetWindowOrPane}`,
    )

    // Reapply main-vertical layout with leader at 30%
    // 等待 `runTmux(['select-layout', '-t', targetWindowOrPane, 'main-vertical'])` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmux(['select-layout', '-t', targetWindowOrPane, 'main-vertical'])

    // Get the first pane (leader) and resize to 30%
    // panesResult保存`runTmux`，供共享工具后续处理使用。
    const panesResult = await runTmux([
      'list-panes',
      '-t',
      targetWindowOrPane,
      '-F',
      '#{pane_id}',
    ])

    // panes 集合格式化`stdout.trim`，供共享工具后续处理使用。
    const panes = panesResult.stdout.trim().split('\n').filter(Boolean)
    // 满足 `panes[0]` 时，共享工具执行该分支。
    if (panes[0]) {
      // 等待 `runTmux(['resize-pane', '-t', panes[0], '-x', '30%'])` 完成，再继续共享工具 Tmux Backend的异步流程。
      await runTmux(['resize-pane', '-t', panes[0], '-x', '30%'])
    }

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Private helper methods

  /**
   * Gets the leader's pane ID.
   * Uses the TMUX_PANE env var captured at module load to ensure we always
   * get the leader's original pane, even if the user has switched panes.
   */
  // 共享工具 Tmux Backend在这里处理 `private async getCurrentPaneId(): Promise<string | null> {`，完成这一小步状态转换。
  private async getCurrentPaneId(): Promise<string | null> {
    // Use the pane ID captured at startup (from TMUX_PANE env var)
    // leaderPane读取`getLeaderPaneId`，供共享工具后续处理使用。
    const leaderPane = getLeaderPaneId()
    // 满足 `leaderPane` 时，共享工具执行该分支。
    if (leaderPane) {
      // 返回 `leaderPane`，作为共享工具这次计算的结果。
      return leaderPane
    }

    // Fallback to dynamic query (shouldn't happen if we're inside tmux)
    // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
    const result = await execFileNoThrow(TMUX_COMMAND, [
      'display-message',
      '-p',
      '#{pane_id}',
    ])

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TmuxBackend] Failed to get current pane ID (exit ${result.code}): ${result.stderr}`,
      )
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 返回 `result.stdout.trim()`，作为共享工具这次计算的结果。
    return result.stdout.trim()
  }

  /**
   * Gets the leader's window target (session:window format).
   * Uses the leader's pane ID to query for its window, ensuring we get the
   * correct window even if the user has switched to a different window.
   * Caches the result since the leader's window won't change.
   */
  // 共享工具 Tmux Backend在这里处理 `private async getCurrentWindowTarget(): Promise<string | null> {`，完成这一小步状态转换。
  private async getCurrentWindowTarget(): Promise<string | null> {
    // Return cached value if available
    // 满足 `cachedLeaderWindowTarget` 时，共享工具执行该分支。
    if (cachedLeaderWindowTarget) {
      // 返回 `cachedLeaderWindowTarget`，作为共享工具这次计算的结果。
      return cachedLeaderWindowTarget
    }

    // Build the command - use -t to target the leader's pane specifically
    // leaderPane读取`getLeaderPaneId`，供共享工具后续处理使用。
    const leaderPane = getLeaderPaneId()
    // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
    const args = ['display-message']
    // 满足 `leaderPane` 时，共享工具执行该分支。
    if (leaderPane) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push('-t', leaderPane)
    }
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('-p', '#{session_name}:#{window_index}')

    // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
    const result = await execFileNoThrow(TMUX_COMMAND, args)

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TmuxBackend] Failed to get current window target (exit ${result.code}): ${result.stderr}`,
      )
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // cachedLeaderWindowTarget 缓存更新为 `result.stdout.trim()`，确保共享工具后续读取最新状态。
    cachedLeaderWindowTarget = result.stdout.trim()
    // 返回 `cachedLeaderWindowTarget`，作为共享工具这次计算的结果。
    return cachedLeaderWindowTarget
  }

  /**
   * Gets the number of panes in a window.
   */
  // 共享工具 Tmux Backend在这里处理 `private async getCurrentWindowPaneCount(`，完成这一小步状态转换。
  private async getCurrentWindowPaneCount(
    windowTarget?: string,
    useSwarmSocket = false,
  ): Promise<number | null> {
    // target读取`this.getCurrentWindowTarget`，供共享工具后续处理使用。
    const target = windowTarget || (await this.getCurrentWindowTarget())
    // target缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!target) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
    const args = ['list-panes', '-t', target, '-F', '#{pane_id}']
    // 结果读取 hook 状态，供共享工具 Tmux Backend本轮渲染使用。
    const result = useSwarmSocket
      ? await runTmuxInSwarm(args)
      : await runTmuxInUserSession(args)

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `[TmuxBackend] Failed to get pane count for ${target} (exit ${result.code}): ${result.stderr}`,
        ),
      )
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 返回 `count(result.stdout.trim().split('\n'), Boolean)`，作为共享工具这次计算的结果。
    return count(result.stdout.trim().split('\n'), Boolean)
  }

  /**
   * Checks if a tmux session exists in the swarm socket.
   */
  // 共享工具 Tmux Backend在这里处理 `private async hasSessionInSwarm(sessionName: string): Promise<boolean> {`，完成这一小步状态转换。
  private async hasSessionInSwarm(sessionName: string): Promise<boolean> {
    // 结果保存`runTmuxInSwarm`，供共享工具后续处理使用。
    const result = await runTmuxInSwarm(['has-session', '-t', sessionName])
    // 返回 `result.code === 0`，作为共享工具这次计算的结果。
    return result.code === 0
  }

  /**
   * Creates the swarm session with a single window for teammates when running outside tmux.
   */
  // 共享工具 Tmux Backend在这里处理 `private async createExternalSwarmSession(): Promise<{`，完成这一小步状态转换。
  private async createExternalSwarmSession(): Promise<{
    windowTarget: string
    paneId: string
  }> {
    // sessionExists 会话数据保存`this.hasSessionInSwarm`，供共享工具后续处理使用。
    const sessionExists = await this.hasSessionInSwarm(SWARM_SESSION_NAME)

    // sessionExists 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!sessionExists) {
      // 结果保存`runTmuxInSwarm`，供共享工具后续处理使用。
      const result = await runTmuxInSwarm([
        'new-session',
        '-d',
        '-s',
        SWARM_SESSION_NAME,
        '-n',
        SWARM_VIEW_WINDOW_NAME,
        '-P',
        '-F',
        '#{pane_id}',
      ])

      // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (result.code !== 0) {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Failed to create swarm session: ${result.stderr || 'Unknown error'}`,
        )
      }

      // paneId格式化`stdout.trim`，供共享工具后续处理使用。
      const paneId = result.stdout.trim()
      // windowTarget 命名 ``${SWARM_SESSION_NAME}:${SWARM_VIEW_WINDOW_NAME}``，让后续代码直接表达这个值的用途。
      const windowTarget = `${SWARM_SESSION_NAME}:${SWARM_VIEW_WINDOW_NAME}`

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TmuxBackend] Created external swarm session with window ${windowTarget}, pane ${paneId}`,
      )

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { windowTarget, paneId }
    }

    // Session exists, check if swarm-view window exists
    // listResult 集合保存`runTmuxInSwarm`，供共享工具后续处理使用。
    const listResult = await runTmuxInSwarm([
      'list-windows',
      '-t',
      SWARM_SESSION_NAME,
      '-F',
      '#{window_name}',
    ])

    // windows 集合格式化`stdout.trim`，供共享工具后续处理使用。
    const windows = listResult.stdout.trim().split('\n').filter(Boolean)
    // windowTarget 命名 ``${SWARM_SESSION_NAME}:${SWARM_VIEW_WINDOW_NAME}``，让后续代码直接表达这个值的用途。
    const windowTarget = `${SWARM_SESSION_NAME}:${SWARM_VIEW_WINDOW_NAME}`

    // 满足 `windows.includes(SWARM_VIEW_WINDOW_NAME)` 时，共享工具执行该分支。
    if (windows.includes(SWARM_VIEW_WINDOW_NAME)) {
      // paneResult保存`runTmuxInSwarm`，供共享工具后续处理使用。
      const paneResult = await runTmuxInSwarm([
        'list-panes',
        '-t',
        windowTarget,
        '-F',
        '#{pane_id}',
      ])

      // panes 集合格式化`stdout.trim`，供共享工具后续处理使用。
      const panes = paneResult.stdout.trim().split('\n').filter(Boolean)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { windowTarget, paneId: panes[0] || '' }
    }

    // Create the swarm-view window
    // createResult保存`runTmuxInSwarm`，供共享工具后续处理使用。
    const createResult = await runTmuxInSwarm([
      'new-window',
      '-t',
      SWARM_SESSION_NAME,
      '-n',
      SWARM_VIEW_WINDOW_NAME,
      '-P',
      '-F',
      '#{pane_id}',
    ])

    // `createResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (createResult.code !== 0) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to create swarm-view window: ${createResult.stderr || 'Unknown error'}`,
      )
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { windowTarget, paneId: createResult.stdout.trim() }
  }

  /**
   * Creates a teammate pane when running inside tmux (with leader).
   */
  // 共享工具 Tmux Backend在这里处理 `private async createTeammatePaneWithLeader(`，完成这一小步状态转换。
  private async createTeammatePaneWithLeader(
    teammateName: string,
    teammateColor: AgentColorName,
  ): Promise<CreatePaneResult> {
    // currentPaneId读取`this.getCurrentPaneId`，供共享工具后续处理使用。
    const currentPaneId = await this.getCurrentPaneId()
    // windowTarget读取`this.getCurrentWindowTarget`，供共享工具后续处理使用。
    const windowTarget = await this.getCurrentWindowTarget()

    // 只有 `!currentPaneId || !windowTarget` 满足时，共享工具才执行该分支。
    if (!currentPaneId || !windowTarget) {
      // 抛出 new Error('Could not determine current tmux pane/window')，阻止共享工具在无效状态下继续运行。
      throw new Error('Could not determine current tmux pane/window')
    }

    // paneCount 数量读取`this.getCurrentWindowPaneCount`，供共享工具后续处理使用。
    const paneCount = await this.getCurrentWindowPaneCount(windowTarget)
    // 满足 `paneCount === null` 时，共享工具执行该分支。
    if (paneCount === null) {
      // 抛出 new Error('Could not determine pane count for current window')，阻止共享工具在无效状态下继续运行。
      throw new Error('Could not determine pane count for current window')
    }
    // isFirstTeammate标记共享工具 Tmux Backend是否启用对应路径。
    const isFirstTeammate = paneCount === 1

    // splitResult 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let splitResult
    // 满足 `isFirstTeammate` 时，共享工具执行该分支。
    if (isFirstTeammate) {
      // First teammate: split horizontally from the leader pane
      // splitResult更新为 `await execFileNoThrow(TMUX_COMMAND, [`，确保共享工具后续读取最新状态。
      splitResult = await execFileNoThrow(TMUX_COMMAND, [
        'split-window',
        '-t',
        currentPaneId,
        '-h',
        '-l',
        '70%',
        '-P',
        '-F',
        '#{pane_id}',
      ])
    } else {
      // Additional teammates: split from an existing teammate pane
      // listResult 集合保存`execFileNoThrow`，供共享工具后续处理使用。
      const listResult = await execFileNoThrow(TMUX_COMMAND, [
        'list-panes',
        '-t',
        windowTarget,
        '-F',
        '#{pane_id}',
      ])

      // panes 集合格式化`stdout.trim`，供共享工具后续处理使用。
      const panes = listResult.stdout.trim().split('\n').filter(Boolean)
      // teammatePanes 集合格式化`panes.slice`，供共享工具后续处理使用。
      const teammatePanes = panes.slice(1)
      // teammateCount 数量保存 `teammatePanes.length` 的判断结果，供共享工具 Tmux Backend后续分支直接复用。
      const teammateCount = teammatePanes.length

      // splitVertically标记共享工具 Tmux Backend是否启用对应路径。
      const splitVertically = teammateCount % 2 === 1
      // targetPaneIndex 索引保存`Math.floor`，供共享工具后续处理使用。
      const targetPaneIndex = Math.floor((teammateCount - 1) / 2)
      // targetPane 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const targetPane =
        teammatePanes[targetPaneIndex] ||
        teammatePanes[teammatePanes.length - 1]

      // splitResult更新为 `await execFileNoThrow(TMUX_COMMAND, [`，确保共享工具后续读取最新状态。
      splitResult = await execFileNoThrow(TMUX_COMMAND, [
        'split-window',
        '-t',
        targetPane!,
        splitVertically ? '-v' : '-h',
        '-P',
        '-F',
        '#{pane_id}',
      ])
    }

    // `splitResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (splitResult.code !== 0) {
      // 抛出 new Error(`Failed to create teammate pane: ${splitResult.stderr}`)，阻止共享工具在无效状态下继续运行。
      throw new Error(`Failed to create teammate pane: ${splitResult.stderr}`)
    }

    // paneId格式化`stdout.trim`，供共享工具后续处理使用。
    const paneId = splitResult.stdout.trim()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TmuxBackend] Created teammate pane for ${teammateName}: ${paneId}`,
    )

    // 等待 `this.setPaneBorderColor(paneId, teammateColor)` 完成，再继续共享工具 Tmux Backend的异步流程。
    await this.setPaneBorderColor(paneId, teammateColor)
    // 等待 `this.setPaneTitle(paneId, teammateName, teammateColor)` 完成，再继续共享工具 Tmux Backend的异步流程。
    await this.setPaneTitle(paneId, teammateName, teammateColor)
    // 等待 `this.rebalancePanesWithLeader(windowTarget)` 完成，再继续共享工具 Tmux Backend的异步流程。
    await this.rebalancePanesWithLeader(windowTarget)

    // Wait for shell to initialize before returning, so commands can be sent immediately
    // 等待 `waitForPaneShellReady()` 完成，再继续共享工具 Tmux Backend的异步流程。
    await waitForPaneShellReady()

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { paneId, isFirstTeammate }
  }

  /**
   * Creates a teammate pane when running outside tmux (no leader in tmux).
   */
  // 共享工具 Tmux Backend在这里处理 `private async createTeammatePaneExternal(`，完成这一小步状态转换。
  private async createTeammatePaneExternal(
    teammateName: string,
    teammateColor: AgentColorName,
  ): Promise<CreatePaneResult> {
    // 共享工具 Tmux Backend先整理这一处局部数据，后续分支可以直接读取。
    const { windowTarget, paneId: firstPaneId } =
      await this.createExternalSwarmSession()

    // paneCount 数量读取`this.getCurrentWindowPaneCount`，供共享工具后续处理使用。
    const paneCount = await this.getCurrentWindowPaneCount(windowTarget, true)
    // 满足 `paneCount === null` 时，共享工具执行该分支。
    if (paneCount === null) {
      // 抛出 new Error('Could not determine pane count for swarm window')，阻止共享工具在无效状态下继续运行。
      throw new Error('Could not determine pane count for swarm window')
    }
    // isFirstTeammate标记共享工具 Tmux Backend是否启用对应路径。
    const isFirstTeammate = !firstPaneUsedForExternal && paneCount === 1

    // paneId 先占位，稍后的条件分支会根据实际输入补齐它。
    let paneId: string

    // 满足 `isFirstTeammate` 时，共享工具执行该分支。
    if (isFirstTeammate) {
      // paneId更新为 `firstPaneId`，确保共享工具后续读取最新状态。
      paneId = firstPaneId
      // firstPaneUsedForExternal更新为 `true`，确保共享工具后续读取最新状态。
      firstPaneUsedForExternal = true
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TmuxBackend] Using initial pane for first teammate ${teammateName}: ${paneId}`,
      )

      // 等待 `this.enablePaneBorderStatus(windowTarget, true)` 完成，再继续共享工具 Tmux Backend的异步流程。
      await this.enablePaneBorderStatus(windowTarget, true)
    } else {
      // listResult 集合保存`runTmuxInSwarm`，供共享工具后续处理使用。
      const listResult = await runTmuxInSwarm([
        'list-panes',
        '-t',
        windowTarget,
        '-F',
        '#{pane_id}',
      ])

      // panes 集合格式化`stdout.trim`，供共享工具后续处理使用。
      const panes = listResult.stdout.trim().split('\n').filter(Boolean)
      // teammateCount 数量 命名 `panes.length`，让后续代码直接表达这个值的用途。
      const teammateCount = panes.length

      // splitVertically标记共享工具 Tmux Backend是否启用对应路径。
      const splitVertically = teammateCount % 2 === 1
      // targetPaneIndex 索引保存`Math.floor`，供共享工具后续处理使用。
      const targetPaneIndex = Math.floor((teammateCount - 1) / 2)
      // targetPane标记共享工具 Tmux Backend是否启用对应路径。
      const targetPane = panes[targetPaneIndex] || panes[panes.length - 1]

      // splitResult保存`runTmuxInSwarm`，供共享工具后续处理使用。
      const splitResult = await runTmuxInSwarm([
        'split-window',
        '-t',
        targetPane!,
        splitVertically ? '-v' : '-h',
        '-P',
        '-F',
        '#{pane_id}',
      ])

      // `splitResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (splitResult.code !== 0) {
        // 抛出 new Error(`Failed to create teammate pane: ${splitResult.stderr}`)，阻止共享工具在无效状态下继续运行。
        throw new Error(`Failed to create teammate pane: ${splitResult.stderr}`)
      }

      // paneId更新为 `splitResult.stdout.trim()`，确保共享工具后续读取最新状态。
      paneId = splitResult.stdout.trim()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TmuxBackend] Created teammate pane for ${teammateName}: ${paneId}`,
      )
    }

    // 等待 `this.setPaneBorderColor(paneId, teammateColor, true)` 完成，再继续共享工具 Tmux Backend的异步流程。
    await this.setPaneBorderColor(paneId, teammateColor, true)
    // 等待 `this.setPaneTitle(paneId, teammateName, teammateColor, true)` 完成，再继续共享工具 Tmux Backend的异步流程。
    await this.setPaneTitle(paneId, teammateName, teammateColor, true)
    // 等待 `this.rebalancePanesTiled(windowTarget)` 完成，再继续共享工具 Tmux Backend的异步流程。
    await this.rebalancePanesTiled(windowTarget)

    // Wait for shell to initialize before returning, so commands can be sent immediately
    // 等待 `waitForPaneShellReady()` 完成，再继续共享工具 Tmux Backend的异步流程。
    await waitForPaneShellReady()

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { paneId, isFirstTeammate }
  }

  /**
   * Rebalances panes in a window with a leader.
   */
  // 共享工具 Tmux Backend在这里处理 `private async rebalancePanesWithLeader(windowTarget: string): Promise<v...`，完成这一小步状态转换。
  private async rebalancePanesWithLeader(windowTarget: string): Promise<void> {
    // listResult 集合保存`runTmuxInUserSession`，供共享工具后续处理使用。
    const listResult = await runTmuxInUserSession([
      'list-panes',
      '-t',
      windowTarget,
      '-F',
      '#{pane_id}',
    ])

    // panes 集合格式化`stdout.trim`，供共享工具后续处理使用。
    const panes = listResult.stdout.trim().split('\n').filter(Boolean)
    // 满足 `panes.length <= 2` 时，共享工具执行该分支。
    if (panes.length <= 2) {
      // 共享工具 Tmux Backend在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 等待 `runTmuxInUserSession([` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmuxInUserSession([
      'select-layout',
      '-t',
      windowTarget,
      'main-vertical',
    ])

    // leaderPane 命名 `panes[0]`，让后续代码直接表达这个值的用途。
    const leaderPane = panes[0]
    // 等待 `runTmuxInUserSession(['resize-pane', '-t', leaderPane!, '-x', '30%'])` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmuxInUserSession(['resize-pane', '-t', leaderPane!, '-x', '30%'])

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TmuxBackend] Rebalanced ${panes.length - 1} teammate panes with leader`,
    )
  }

  /**
   * Rebalances panes in a window without a leader (tiled layout).
   */
  // 共享工具 Tmux Backend在这里处理 `private async rebalancePanesTiled(windowTarget: string): Promise<void> {`，完成这一小步状态转换。
  private async rebalancePanesTiled(windowTarget: string): Promise<void> {
    // listResult 集合保存`runTmuxInSwarm`，供共享工具后续处理使用。
    const listResult = await runTmuxInSwarm([
      'list-panes',
      '-t',
      windowTarget,
      '-F',
      '#{pane_id}',
    ])

    // panes 集合格式化`stdout.trim`，供共享工具后续处理使用。
    const panes = listResult.stdout.trim().split('\n').filter(Boolean)
    // 满足 `panes.length <= 1` 时，共享工具执行该分支。
    if (panes.length <= 1) {
      // 共享工具 Tmux Backend在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 等待 `runTmuxInSwarm(['select-layout', '-t', windowTarget, 'tiled'])` 完成，再继续共享工具 Tmux Backend的异步流程。
    await runTmuxInSwarm(['select-layout', '-t', windowTarget, 'tiled'])

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TmuxBackend] Rebalanced ${panes.length} teammate panes with tiled layout`,
    )
  }
}

// Register the backend with the registry when this module is imported.
// This side effect is intentional - the registry needs backends to self-register to avoid circular dependencies.
// eslint-disable-next-line custom-rules/no-top-level-side-effects
// 调用 registerTmuxBackend，触发共享工具此处需要的副作用。
registerTmuxBackend(TmuxBackend)
