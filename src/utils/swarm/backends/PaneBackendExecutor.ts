// 引入 getSessionId，将 ../../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../../bootstrap/state.js'
// 类型依赖 { ToolUseContext } 来自 ../../../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../../../Tool.js'
// 复用 formatAgentId、parseAgentId 工具函数，把通用处理留在 ../../../utils/agentId.js 中维护。
import { formatAgentId, parseAgentId } from '../../../utils/agentId.js'
// 复用 quote 工具函数，把通用处理留在 ../../../utils/bash/shellQuote.js 中维护。
import { quote } from '../../../utils/bash/shellQuote.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../../../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../../../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../../utils/debug.js 中维护。
import { logForDebugging } from '../../../utils/debug.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../../utils/slowOperations.js'
// 复用 writeToMailbox 工具函数，把通用处理留在 ../../../utils/teammateMailbox.js 中维护。
import { writeToMailbox } from '../../../utils/teammateMailbox.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  buildInheritedCliFlags,
  buildInheritedEnvVars,
  getTeammateCommand,
} from '../spawnUtils.js'
// 引入 assignTeammateColor，将 ../teammateLayoutManager.js 中已经封装好的能力接到本文件流程里。
import { assignTeammateColor } from '../teammateLayoutManager.js'
// 引入 isInsideTmux，将 ./detection.js 中已经封装好的能力接到本文件流程里。
import { isInsideTmux } from './detection.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  BackendType,
  PaneBackend,
  TeammateExecutor,
  TeammateMessage,
  TeammateSpawnConfig,
  TeammateSpawnResult,
} from './types.js'

/**
 * PaneBackendExecutor adapts a PaneBackend to the TeammateExecutor interface.
 *
 * This allows pane-based backends (tmux, iTerm2) to be used through the same
 * TeammateExecutor abstraction as InProcessBackend, making getTeammateExecutor()
 * return a meaningful executor regardless of execution mode.
 *
 * The adapter handles:
 * - spawn(): Creates a pane and sends the Claude CLI command to it
 * - sendMessage(): Writes to the teammate's file-based mailbox
 * - terminate(): Sends a shutdown request via mailbox
 * - kill(): Kills the pane via the backend
 * - isActive(): Checks if the pane is still running
 */
// PaneBackendExecutor 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class PaneBackendExecutor implements TeammateExecutor {
  readonly type: BackendType

  private backend: PaneBackend
  private context: ToolUseContext | null = null

  /**
   * Track spawned teammates by agentId -> paneId mapping.
   * This allows us to find the pane for operations like kill/terminate.
   */
  private spawnedTeammates: Map<string, { paneId: string; insideTmux: boolean }>
  private cleanupRegistered = false

  // 构造函数接收 backend: PaneBackend，把外部输入整理成实例可复用的内部状态。
  constructor(backend: PaneBackend) {
    // 更新实例字段 backend 为 backend，同步共享工具的内部状态。
    this.backend = backend
    // 更新实例字段 type 为 backend.type，同步共享工具的内部状态。
    this.type = backend.type
    // 更新实例字段 spawnedTeammates 为 new Map()，同步共享工具的内部状态。
    this.spawnedTeammates = new Map()
  }

  /**
   * Sets the ToolUseContext for this executor.
   * Must be called before spawn() to provide access to AppState and permissions.
   */
  // setContext 根据 context: ToolUseContext 更新共享工具的状态。
  setContext(context: ToolUseContext): void {
    // 更新实例字段 context 为 context，同步共享工具的内部状态。
    this.context = context
  }

  /**
   * Checks if the underlying pane backend is available.
   */
  // isAvailable 用 无 判断共享工具是否满足条件。
  async isAvailable(): Promise<boolean> {
    // 返回 `this.backend.isAvailable()`，作为共享工具这次计算的结果。
    return this.backend.isAvailable()
  }

  /**
   * Spawns a teammate in a new pane.
   *
   * Creates a pane via the backend, builds the CLI command with teammate
   * identity flags, and sends it to the pane.
   */
  // spawn 使用 config: TeammateSpawnConfig 完成共享工具里的对应操作。
  async spawn(config: TeammateSpawnConfig): Promise<TeammateSpawnResult> {
    // agentId格式化`formatAgentId`，供共享工具后续处理使用。
    const agentId = formatAgentId(config.name, config.teamName)

    // this.context缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.context) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PaneBackendExecutor] spawn() called without context for ${config.name}`,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        agentId,
        error:
          'PaneBackendExecutor not initialized. Call setContext() before spawn().',
      }
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Assign a unique color to this teammate
      // teammateColor保存`assignTeammateColor`，供共享工具后续处理使用。
      const teammateColor = config.color ?? assignTeammateColor(agentId)

      // Create a pane in the swarm view
      // 共享工具 Pane Backend Executor先整理这一处局部数据，后续分支可以直接读取。
      const { paneId, isFirstTeammate } =
        await this.backend.createTeammatePaneInSwarmView(
          config.name,
          teammateColor,
        )

      // Check if we're inside tmux to determine how to send commands
      // insideTmux保存`isInsideTmux`，供共享工具后续处理使用。
      const insideTmux = await isInsideTmux()

      // Enable pane border status on first teammate when inside tmux
      // 只有 `isFirstTeammate && insideTmux` 满足时，共享工具才执行该分支。
      if (isFirstTeammate && insideTmux) {
        // 等待 `this.backend.enablePaneBorderStatus()` 完成，再继续共享工具 Pane Backend Executor的异步流程。
        await this.backend.enablePaneBorderStatus()
      }

      // Build the command to spawn Claude Code with teammate identity
      // binaryPath 路径数据读取`getTeammateCommand`，供共享工具后续处理使用。
      const binaryPath = getTeammateCommand()

      // Build teammate identity CLI args
      // teammateArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const teammateArgs = [
        `--agent-id ${quote([agentId])}`,
        `--agent-name ${quote([config.name])}`,
        `--team-name ${quote([config.teamName])}`,
        `--agent-color ${quote([teammateColor])}`,
        `--parent-session-id ${quote([config.parentSessionId || getSessionId()])}`,
        config.planModeRequired ? '--plan-mode-required' : '',
      ]
        .filter(Boolean)
        .join(' ')

      // Build CLI flags to propagate to teammate
      // appState 状态读取`context.getAppState`，供共享工具后续处理使用。
      const appState = this.context.getAppState()
      // inheritedFlags 集合构建`buildInheritedCliFlags`，供共享工具后续处理使用。
      let inheritedFlags = buildInheritedCliFlags({
        planModeRequired: config.planModeRequired,
        permissionMode: appState.toolPermissionContext.mode,
      })

      // If teammate has a custom model, add --model flag (or replace inherited one)
      // 满足 `config.model` 时，共享工具执行该分支。
      if (config.model) {
        // inheritedFlags 集合更新为 `inheritedFlags`，确保共享工具后续读取最新状态。
        inheritedFlags = inheritedFlags
          .split(' ')
          .filter(
            // 这个回调绑定到 (flag, i, arr) => flag !== '--model' && arr[i - 1] !== '--model',，负责共享工具在该局部场景下的响应。
            (flag, i, arr) => flag !== '--model' && arr[i - 1] !== '--model',
          )
          .join(' ')
        // inheritedFlags 集合更新为 `inheritedFlags`，确保共享工具后续读取最新状态。
        inheritedFlags = inheritedFlags
          ? `${inheritedFlags} --model ${quote([config.model])}`
          : `--model ${quote([config.model])}`
      }

      // flagsStr保存`inheritedFlags ? ` ${inheritedFlags}` : ''`，供共享工具 Pane Backend Executor后续判断或输出使用。
      const flagsStr = inheritedFlags ? ` ${inheritedFlags}` : ''
      // workingDir保存`config.cwd`，供共享工具 Pane Backend Executor后续判断或输出使用。
      const workingDir = config.cwd

      // Build environment variables to forward to teammate
      // envStr构建`buildInheritedEnvVars`，供共享工具后续处理使用。
      const envStr = buildInheritedEnvVars()

      // spawnCommand 命令数据保存`quote`，供共享工具后续处理使用。
      const spawnCommand = `cd ${quote([workingDir])} && env ${envStr} ${quote([binaryPath])} ${teammateArgs}${flagsStr}`

      // Send the command to the new pane
      // Use swarm socket when running outside tmux (external swarm session)
      // 等待 `this.backend.sendCommandToPane(paneId, spawnCommand, !insideTmux)` 完成，再继续共享工具 Pane Backend Executor的异步流程。
      await this.backend.sendCommandToPane(paneId, spawnCommand, !insideTmux)

      // Track the spawned teammate
      // this.spawnedTeammates.set 写入新的状态值，使共享工具后续读取保持一致。
      this.spawnedTeammates.set(agentId, { paneId, insideTmux })

      // Register cleanup to kill all panes on leader exit (e.g., SIGHUP)
      // this.cleanupRegistered缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!this.cleanupRegistered) {
        // 更新实例字段 cleanupRegistered 为 true，同步共享工具的内部状态。
        this.cleanupRegistered = true
        // 调用 registerCleanup，触发共享工具此处需要的副作用。
        registerCleanup(async () => {
          // 循环处理 `const [id, info] of this.spawnedTeammates`，让共享工具逐项把同类条目按顺序走完。
          for (const [id, info] of this.spawnedTeammates) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[PaneBackendExecutor] Cleanup: killing pane for ${id}`,
            )
            // 等待 `this.backend.killPane(info.paneId, !info.insideTmux)` 完成，再继续共享工具 Pane Backend Executor的异步流程。
            await this.backend.killPane(info.paneId, !info.insideTmux)
          }
          // 调用 this.spawnedTeammates.clear，触发共享工具此处需要的副作用。
          this.spawnedTeammates.clear()
        })
      }

      // Send initial instructions to teammate via mailbox
      // 等待 `writeToMailbox(` 完成，再继续共享工具 Pane Backend Executor的异步流程。
      await writeToMailbox(
        config.name,
        {
          from: 'team-lead',
          text: config.prompt,
          timestamp: new Date().toISOString(),
        },
        config.teamName,
      )

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PaneBackendExecutor] Spawned teammate ${agentId} in pane ${paneId}`,
      )

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: true,
        agentId,
        paneId,
      }
    } catch (error) {
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PaneBackendExecutor] Failed to spawn ${agentId}: ${errorMessage}`,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        agentId,
        error: errorMessage,
      }
    }
  }

  /**
   * Sends a message to a pane-based teammate via file-based mailbox.
   *
   * All teammates (pane and in-process) use the same mailbox mechanism.
   */
  // sendMessage 使用 agentId: string, message: TeammateMessage 完成共享工具里的对应操作。
  async sendMessage(agentId: string, message: TeammateMessage): Promise<void> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PaneBackendExecutor] sendMessage() to ${agentId}: ${message.text.substring(0, 50)}...`,
    )

    // 解析结果解析`parseAgentId`，供共享工具后续处理使用。
    const parsed = parseAgentId(agentId)
    // 解析结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!parsed) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Invalid agentId format: ${agentId}. Expected format: agentName@teamName`,
      )
    }

    // 从 `parsed` 解构 agentName、teamName，减少共享工具 Pane Backend Executor对同一对象的重复访问。
    const { agentName, teamName } = parsed

    // 等待 `writeToMailbox(` 完成，再继续共享工具 Pane Backend Executor的异步流程。
    await writeToMailbox(
      agentName,
      {
        text: message.text,
        from: message.from,
        color: message.color,
        timestamp: message.timestamp ?? new Date().toISOString(),
      },
      teamName,
    )

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PaneBackendExecutor] sendMessage() completed for ${agentId}`,
    )
  }

  /**
   * Gracefully terminates a pane-based teammate.
   *
   * For pane-based teammates, we send a shutdown request via mailbox and
   * let the teammate process handle exit gracefully.
   */
  // terminate 使用 agentId: string, reason?: string 完成共享工具里的对应操作。
  async terminate(agentId: string, reason?: string): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PaneBackendExecutor] terminate() called for ${agentId}: ${reason}`,
    )

    // 解析结果解析`parseAgentId`，供共享工具后续处理使用。
    const parsed = parseAgentId(agentId)
    // 解析结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!parsed) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PaneBackendExecutor] terminate() failed: invalid agentId format`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 从 `parsed` 解构 agentName、teamName，减少共享工具 Pane Backend Executor对同一对象的重复访问。
    const { agentName, teamName } = parsed

    // Send shutdown request via mailbox
    // shutdownRequest 请求数据集中保存共享工具 Pane Backend Executor要一起传递的字段。
    const shutdownRequest = {
      type: 'shutdown_request',
      requestId: `shutdown-${agentId}-${Date.now()}`,
      from: 'team-lead',
      reason,
    }

    // 等待 `writeToMailbox(` 完成，再继续共享工具 Pane Backend Executor的异步流程。
    await writeToMailbox(
      agentName,
      {
        from: 'team-lead',
        text: jsonStringify(shutdownRequest),
        timestamp: new Date().toISOString(),
      },
      teamName,
    )

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PaneBackendExecutor] terminate() sent shutdown request to ${agentId}`,
    )

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  /**
   * Force kills a pane-based teammate by killing its pane.
   */
  // kill 使用 agentId: string 完成共享工具里的对应操作。
  async kill(agentId: string): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[PaneBackendExecutor] kill() called for ${agentId}`)

    // teammateInfo读取`spawnedTeammates.get`，供共享工具后续处理使用。
    const teammateInfo = this.spawnedTeammates.get(agentId)
    // teammateInfo缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!teammateInfo) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PaneBackendExecutor] kill() failed: teammate ${agentId} not found in spawned map`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 从 `teammateInfo` 解构 paneId、insideTmux，减少共享工具 Pane Backend Executor对同一对象的重复访问。
    const { paneId, insideTmux } = teammateInfo

    // Kill the pane via the backend
    // Use external session socket when we spawned outside tmux
    // killed保存`backend.killPane`，供共享工具后续处理使用。
    const killed = await this.backend.killPane(paneId, !insideTmux)

    // 满足 `killed` 时，共享工具执行该分支。
    if (killed) {
      // 调用 this.spawnedTeammates.delete，触发共享工具此处需要的副作用。
      this.spawnedTeammates.delete(agentId)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[PaneBackendExecutor] kill() succeeded for ${agentId}`)
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[PaneBackendExecutor] kill() failed for ${agentId}`)
    }

    // 返回 `killed`，作为共享工具这次计算的结果。
    return killed
  }

  /**
   * Checks if a pane-based teammate is still active.
   *
   * For pane-based teammates, we check if the pane still exists.
   * This is a best-effort check - the pane may exist but the process inside
   * may have exited.
   */
  // isActive 用 agentId: string 判断共享工具是否满足条件。
  async isActive(agentId: string): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[PaneBackendExecutor] isActive() called for ${agentId}`)

    // teammateInfo读取`spawnedTeammates.get`，供共享工具后续处理使用。
    const teammateInfo = this.spawnedTeammates.get(agentId)
    // teammateInfo缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!teammateInfo) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PaneBackendExecutor] isActive(): teammate ${agentId} not found`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // For now, assume active if we have a record of it
    // A more robust check would query the backend for pane existence
    // but that would require adding a new method to PaneBackend
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
}

/**
 * Creates a PaneBackendExecutor wrapping the given PaneBackend.
 */
// createPaneBackendExecutor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPaneBackendExecutor(
  backend: PaneBackend,
): PaneBackendExecutor {
  // 返回 `new PaneBackendExecutor(backend)`，作为共享工具这次计算的结果。
  return new PaneBackendExecutor(backend)
}
