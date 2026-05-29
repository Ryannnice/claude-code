// 类型依赖 { AgentColorName } 来自 ../../../tools/AgentTool/agentColorManager.js，用于校准共享工具的数据契约。
import type { AgentColorName } from '../../../tools/AgentTool/agentColorManager.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../../utils/debug.js 中维护。
import { logForDebugging } from '../../../utils/debug.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../../utils/execFileNoThrow.js'
// 引入 IT2_COMMAND、isInITerm2、isIt2CliAvailable，将 ./detection.js 中已经封装好的能力接到本文件流程里。
import { IT2_COMMAND, isInITerm2, isIt2CliAvailable } from './detection.js'
// 引入 registerITermBackend，将 ./registry.js 中已经封装好的能力接到本文件流程里。
import { registerITermBackend } from './registry.js'
// 类型依赖 { CreatePaneResult, PaneBackend, PaneId } 来自 ./types.js，用于校准共享工具的数据契约。
import type { CreatePaneResult, PaneBackend, PaneId } from './types.js'

// Track session IDs for teammates
// teammateSessionIds 会话数据 从空数组开始收集，后续循环会按处理顺序追加条目。
const teammateSessionIds: string[] = []

// Track whether the first pane has been used
// firstPaneUsed标记共享工具 ITerm Backend是否启用对应路径。
let firstPaneUsed = false

// Lock mechanism to prevent race conditions when spawning teammates in parallel
// paneCreationLock 命名 `Promise.resolve()`，让后续代码直接表达这个值的用途。
let paneCreationLock: Promise<void> = Promise.resolve()

/**
 * Acquires a lock for pane creation, ensuring sequential execution.
 * Returns a release function that must be called when done.
 */
// acquirePaneCreationLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function acquirePaneCreationLock(): Promise<() => void> {
  // 这个回调绑定到 let release: () => void，负责共享工具在该局部场景下的响应。
  let release: () => void
  // newLock封装成回调，供共享工具 ITerm Backend在事件触发或异步步骤中调用。
  const newLock = new Promise<void>(resolve => {
    // release更新为 `resolve`，确保共享工具后续读取最新状态。
    release = resolve
  })

  // previousLock保存`paneCreationLock`，供后续判断或组装使用。
  const previousLock = paneCreationLock
  // paneCreationLock更新为 `newLock`，确保共享工具后续读取最新状态。
  paneCreationLock = newLock

  // 返回 `previousLock.then(() => release!)`，作为共享工具这次计算的结果。
  return previousLock.then(() => release!)
}

/**
 * Runs an it2 CLI command and returns the result.
 */
// runIt2 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function runIt2(
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  // 返回 `execFileNoThrow(IT2_COMMAND, args)`，作为共享工具这次计算的结果。
  return execFileNoThrow(IT2_COMMAND, args)
}

/**
 * Parses the session ID from `it2 session split` output.
 * Format: "Created new pane: <session-id>"
 *
 * NOTE: This UUID is only valid when splitting from a specific session
 * using the -s flag. When splitting from the "active" session, the UUID
 * may not be accessible if the split happened in a different window.
 */
// parseSplitOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSplitOutput(output: string): string {
  // match匹配`output.match`，供共享工具后续处理使用。
  const match = output.match(/Created new pane:\s*(.+)/)
  // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
  if (match && match[1]) {
    // 返回 `match[1].trim()`，作为共享工具这次计算的结果。
    return match[1].trim()
  }
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Gets the leader's session ID from ITERM_SESSION_ID env var.
 * Format: "wXtYpZ:UUID" - we extract the UUID part after the colon.
 * Returns null if not in iTerm2 or env var not set.
 */
// getLeaderSessionId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLeaderSessionId(): string | null {
  // itermSessionId 会话数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const itermSessionId = process.env.ITERM_SESSION_ID
  // itermSessionId 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!itermSessionId) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // colonIndex 索引保存`itermSessionId.indexOf`，供共享工具后续处理使用。
  const colonIndex = itermSessionId.indexOf(':')
  // 满足 `colonIndex === -1` 时，共享工具执行该分支。
  if (colonIndex === -1) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 `itermSessionId.slice(colonIndex + 1)`，作为共享工具这次计算的结果。
  return itermSessionId.slice(colonIndex + 1)
}

/**
 * ITermBackend implements pane management using iTerm2's native split panes
 * via the it2 CLI tool.
 */
// ITermBackend 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ITermBackend implements PaneBackend {
  readonly type = 'iterm2' as const
  readonly displayName = 'iTerm2'
  readonly supportsHideShow = false

  /**
   * Checks if iTerm2 backend is available (in iTerm2 with it2 CLI installed).
   */
  // isAvailable 用 无 判断共享工具是否满足条件。
  async isAvailable(): Promise<boolean> {
    // inITerm2保存`isInITerm2`，供共享工具后续处理使用。
    const inITerm2 = isInITerm2()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[ITermBackend] isAvailable check: inITerm2=${inITerm2}`)
    // inITerm2缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!inITerm2) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[ITermBackend] isAvailable: false (not in iTerm2)')
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // it2Available保存`isIt2CliAvailable`，供共享工具后续处理使用。
    const it2Available = await isIt2CliAvailable()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[ITermBackend] isAvailable: ${it2Available} (it2 CLI ${it2Available ? 'found' : 'not found'})`,
    )
    // 返回 `it2Available`，作为共享工具这次计算的结果。
    return it2Available
  }

  /**
   * Checks if we're currently running inside iTerm2.
   */
  // isRunningInside 用 无 判断共享工具是否满足条件。
  async isRunningInside(): Promise<boolean> {
    // 结果保存`isInITerm2`，供共享工具后续处理使用。
    const result = isInITerm2()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[ITermBackend] isRunningInside: ${result}`)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  /**
   * Creates a new teammate pane in the swarm view.
   * Uses a lock to prevent race conditions when multiple teammates are spawned in parallel.
   */
  // 共享工具 ITerm Backend在这里处理 `async createTeammatePaneInSwarmView(`，完成这一小步状态转换。
  async createTeammatePaneInSwarmView(
    name: string,
    color: AgentColorName,
  ): Promise<CreatePaneResult> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[ITermBackend] createTeammatePaneInSwarmView called for ${name} with color ${color}`,
    )
    // releaseLock保存`acquirePaneCreationLock`，供共享工具后续处理使用。
    const releaseLock = await acquirePaneCreationLock()

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Layout: Leader on left, teammates stacked vertically on the right
      // - First teammate: vertical split (-v) from leader's session
      // - Subsequent teammates: horizontal split from last teammate's session
      //
      // We explicitly target the session to split from using -s flag to ensure
      // correct layout even if user clicks on different panes.
      //
      // At-fault recovery: If a targeted teammate session is dead (user closed
      // the pane via Cmd+W / X, or process crashed), prune it and retry with
      // the next-to-last. Cheaper than a proactive 'it2 session list' on every spawn.
      // Bounded at O(N+1) iterations: each continue shrinks teammateSessionIds by 1;
      // when empty → firstPaneUsed resets → next iteration has no target → throws.
      // eslint-disable-next-line no-constant-condition
      // while 使用 true 完成共享工具里的对应操作。
      while (true) {
        // isFirstTeammate标记共享工具 ITerm Backend是否启用对应路径。
        const isFirstTeammate = !firstPaneUsed
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[ITermBackend] Creating pane: isFirstTeammate=${isFirstTeammate}, existingPanes=${teammateSessionIds.length}`,
        )

        // splitArgs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
        let splitArgs: string[]
        // targetedTeammateId 先占位，稍后的条件分支会根据实际输入补齐它。
        let targetedTeammateId: string | undefined
        // 满足 `isFirstTeammate` 时，共享工具执行该分支。
        if (isFirstTeammate) {
          // Split from leader's session (extracted from ITERM_SESSION_ID env var)
          // leaderSessionId 会话数据读取`getLeaderSessionId`，供共享工具后续处理使用。
          const leaderSessionId = getLeaderSessionId()
          // 满足 `leaderSessionId` 时，共享工具执行该分支。
          if (leaderSessionId) {
            // splitArgs 集合更新为 `['session', 'split', '-v', '-s', leaderSessionId]`，确保共享工具后续读取最新状态。
            splitArgs = ['session', 'split', '-v', '-s', leaderSessionId]
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[ITermBackend] First split from leader session: ${leaderSessionId}`,
            )
          } else {
            // Fallback to active session if we can't get leader's ID
            // splitArgs 集合更新为 `['session', 'split', '-v']`，确保共享工具后续读取最新状态。
            splitArgs = ['session', 'split', '-v']
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              '[ITermBackend] First split from active session (no leader ID)',
            )
          }
        } else {
          // Split from the last teammate's session to stack vertically
          // targetedTeammateId更新为 `teammateSessionIds[teammateSessionIds.length - 1]`，确保共享工具后续读取最新状态。
          targetedTeammateId = teammateSessionIds[teammateSessionIds.length - 1]
          // 满足 `targetedTeammateId` 时，共享工具执行该分支。
          if (targetedTeammateId) {
            // splitArgs 集合更新为 `['session', 'split', '-s', targetedTeammateId]`，确保共享工具后续读取最新状态。
            splitArgs = ['session', 'split', '-s', targetedTeammateId]
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[ITermBackend] Subsequent split from teammate session: ${targetedTeammateId}`,
            )
          } else {
            // Fallback to active session
            // splitArgs 集合更新为 `['session', 'split']`，确保共享工具后续读取最新状态。
            splitArgs = ['session', 'split']
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              '[ITermBackend] Subsequent split from active session (no teammate ID)',
            )
          }
        }

        // splitResult保存`runIt2`，供共享工具后续处理使用。
        const splitResult = await runIt2(splitArgs)

        // `splitResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
        if (splitResult.code !== 0) {
          // If we targeted a teammate session, confirm it's actually dead before
          // pruning — 'session list' distinguishes dead-target from systemic
          // failure (Python API off, it2 removed, transient socket error).
          // Pruning on systemic failure would drain all live IDs → state corrupted.
          // 满足 `targetedTeammateId` 时，共享工具执行该分支。
          if (targetedTeammateId) {
            // listResult 集合保存`runIt2`，供共享工具后续处理使用。
            const listResult = await runIt2(['session', 'list'])
            // 共享工具在这里按实际状态进入对应分支。
            if (
              listResult.code === 0 &&
              !listResult.stdout.includes(targetedTeammateId)
            ) {
              // Confirmed dead — prune and retry with next-to-last (or leader).
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[ITermBackend] Split failed targeting dead session ${targetedTeammateId}, pruning and retrying: ${splitResult.stderr}`,
              )
              // idx保存`teammateSessionIds.indexOf`，供共享工具后续处理使用。
              const idx = teammateSessionIds.indexOf(targetedTeammateId)
              // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
              if (idx !== -1) {
                // 调用 teammateSessionIds.splice，触发共享工具此处需要的副作用。
                teammateSessionIds.splice(idx, 1)
              }
              // teammateSessionIds 会话数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
              if (teammateSessionIds.length === 0) {
                // firstPaneUsed更新为 `false`，确保共享工具后续读取最新状态。
                firstPaneUsed = false
              }
              // 跳过当前项，继续处理共享工具中的下一轮循环。
              continue
            }
            // Target is alive or we can't tell — don't corrupt state, surface the error.
          }
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            `Failed to create iTerm2 split pane: ${splitResult.stderr}`,
          )
        }

        // 满足 `isFirstTeammate` 时，共享工具执行该分支。
        if (isFirstTeammate) {
          // firstPaneUsed更新为 `true`，确保共享工具后续读取最新状态。
          firstPaneUsed = true
        }

        // Parse the session ID from split output
        // This works because we're splitting from a specific session (-s flag),
        // so the new pane is in the same window and the UUID is valid.
        // paneId解析`parseSplitOutput`，供共享工具后续处理使用。
        const paneId = parseSplitOutput(splitResult.stdout)

        // paneId缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!paneId) {
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            `Failed to parse session ID from split output: ${splitResult.stdout}`,
          )
        }
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[ITermBackend] Created teammate pane for ${name}: ${paneId}`,
        )

        // teammateSessionIds 会话数据追加新条目，保持收集顺序与输入顺序一致。
        teammateSessionIds.push(paneId)

        // Set pane color and title
        // Skip color and title for now - each it2 call is slow (Python process + API)
        // The pane is functional without these cosmetic features
        // TODO: Consider batching these or making them async/fire-and-forget

        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { paneId, isFirstTeammate }
      }
    } finally {
      // 调用 releaseLock，触发共享工具此处需要的副作用。
      releaseLock()
    }
  }

  /**
   * Sends a command to a specific pane.
   */
  // 共享工具 ITerm Backend在这里处理 `async sendCommandToPane(`，完成这一小步状态转换。
  async sendCommandToPane(
    paneId: PaneId,
    command: string,
    _useExternalSession?: boolean,
  ): Promise<void> {
    // Use it2 session run to execute command (adds newline automatically)
    // Always use -s flag to target specific session - this ensures the command
    // goes to the right pane even if user switches windows
    // 参数列表保存`paneId`，供后续判断或组装使用。
    const args = paneId
      ? ['session', 'run', '-s', paneId, command]
      : ['session', 'run', command]

    // 结果保存`runIt2`，供共享工具后续处理使用。
    const result = await runIt2(args)

    // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to send command to iTerm2 pane ${paneId}: ${result.stderr}`,
      )
    }
  }

  /**
   * No-op for iTerm2 - tab colors would require escape sequences but we skip
   * them for performance (each it2 call is slow).
   */
  // 共享工具 ITerm Backend在这里处理 `async setPaneBorderColor(`，完成这一小步状态转换。
  async setPaneBorderColor(
    _paneId: PaneId,
    _color: AgentColorName,
    _useExternalSession?: boolean,
  ): Promise<void> {
    // Skip for performance - each it2 call spawns a Python process
  }

  /**
   * No-op for iTerm2 - titles would require escape sequences but we skip
   * them for performance (each it2 call is slow).
   */
  // 共享工具 ITerm Backend在这里处理 `async setPaneTitle(`，完成这一小步状态转换。
  async setPaneTitle(
    _paneId: PaneId,
    _name: string,
    _color: AgentColorName,
    _useExternalSession?: boolean,
  ): Promise<void> {
    // Skip for performance - each it2 call spawns a Python process
  }

  /**
   * No-op for iTerm2 - pane titles are shown in tabs automatically.
   */
  // 共享工具 ITerm Backend在这里处理 `async enablePaneBorderStatus(`，完成这一小步状态转换。
  async enablePaneBorderStatus(
    _windowTarget?: string,
    _useExternalSession?: boolean,
  ): Promise<void> {
    // iTerm2 doesn't have the concept of pane border status like tmux
    // Titles are shown in tabs automatically
  }

  /**
   * No-op for iTerm2 - pane balancing is handled automatically.
   */
  // 共享工具 ITerm Backend在这里处理 `async rebalancePanes(`，完成这一小步状态转换。
  async rebalancePanes(
    _windowTarget: string,
    _hasLeader: boolean,
  ): Promise<void> {
    // iTerm2 handles pane balancing automatically
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[ITermBackend] Pane rebalancing not implemented for iTerm2',
    )
  }

  /**
   * Kills/closes a specific pane using the it2 CLI.
   * Also removes the pane from tracked session IDs so subsequent spawns
   * don't try to split from a dead session.
   */
  // 共享工具 ITerm Backend在这里处理 `async killPane(`，完成这一小步状态转换。
  async killPane(
    paneId: PaneId,
    _useExternalSession?: boolean,
  ): Promise<boolean> {
    // -f (force) is required: without it, iTerm2 respects the "Confirm before
    // closing" preference and either shows a dialog or refuses when the session
    // still has a running process (the shell always is). tmux kill-pane has no
    // such prompt, which is why this was only broken for iTerm2.
    // 结果保存`runIt2`，供共享工具后续处理使用。
    const result = await runIt2(['session', 'close', '-f', '-s', paneId])
    // Clean up module state regardless of close result — even if the pane is
    // already gone (e.g., user closed it manually), removing the stale ID is correct.
    // idx保存`teammateSessionIds.indexOf`，供共享工具后续处理使用。
    const idx = teammateSessionIds.indexOf(paneId)
    // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (idx !== -1) {
      // 调用 teammateSessionIds.splice，触发共享工具此处需要的副作用。
      teammateSessionIds.splice(idx, 1)
    }
    // teammateSessionIds 会话数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (teammateSessionIds.length === 0) {
      // firstPaneUsed更新为 `false`，确保共享工具后续读取最新状态。
      firstPaneUsed = false
    }
    // 返回 `result.code === 0`，作为共享工具这次计算的结果。
    return result.code === 0
  }

  /**
   * Stub for hiding a pane - not supported in iTerm2 backend.
   * iTerm2 doesn't have a direct equivalent to tmux's break-pane.
   */
  // 共享工具 ITerm Backend在这里处理 `async hidePane(`，完成这一小步状态转换。
  async hidePane(
    _paneId: PaneId,
    _useExternalSession?: boolean,
  ): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[ITermBackend] hidePane not supported in iTerm2')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  /**
   * Stub for showing a hidden pane - not supported in iTerm2 backend.
   * iTerm2 doesn't have a direct equivalent to tmux's join-pane.
   */
  // 共享工具 ITerm Backend在这里处理 `async showPane(`，完成这一小步状态转换。
  async showPane(
    _paneId: PaneId,
    _targetWindowOrPane: string,
    _useExternalSession?: boolean,
  ): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[ITermBackend] showPane not supported in iTerm2')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// Register the backend with the registry when this module is imported.
// This side effect is intentional - the registry needs backends to self-register to avoid circular dependencies.
// eslint-disable-next-line custom-rules/no-top-level-side-effects
// 调用 registerITermBackend，触发共享工具此处需要的副作用。
registerITermBackend(ITermBackend)
