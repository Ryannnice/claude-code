// 类型依赖 { ToolUseContext } 来自 ../../../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../../../Tool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  findTeammateTaskByAgentId,
  requestTeammateShutdown,
} from '../../../tasks/InProcessTeammateTask/InProcessTeammateTask.js'
// 复用 parseAgentId 工具函数，把通用处理留在 ../../../utils/agentId.js 中维护。
import { parseAgentId } from '../../../utils/agentId.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../../utils/debug.js 中维护。
import { logForDebugging } from '../../../utils/debug.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../../utils/slowOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createShutdownRequestMessage,
  writeToMailbox,
} from '../../../utils/teammateMailbox.js'
// 引入 startInProcessTeammate，将 ../inProcessRunner.js 中已经封装好的能力接到本文件流程里。
import { startInProcessTeammate } from '../inProcessRunner.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  killInProcessTeammate,
  spawnInProcessTeammate,
} from '../spawnInProcess.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  TeammateExecutor,
  TeammateMessage,
  TeammateSpawnConfig,
  TeammateSpawnResult,
} from './types.js'

/**
 * InProcessBackend implements TeammateExecutor for in-process teammates.
 *
 * Unlike pane-based backends (tmux/iTerm2), in-process teammates run in the
 * same Node.js process with isolated context via AsyncLocalStorage. They:
 * - Share resources (API client, MCP connections) with the leader
 * - Communicate via file-based mailbox (same as pane-based teammates)
 * - Are terminated via AbortController (not kill-pane)
 *
 * IMPORTANT: Before spawning, call setContext() to provide the ToolUseContext
 * needed for AppState access. This is intended for use via the TeammateExecutor
 * abstraction (getTeammateExecutor() in registry.ts).
 */
// InProcessBackend 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class InProcessBackend implements TeammateExecutor {
  readonly type = 'in-process' as const

  /**
   * Tool use context for AppState access.
   * Must be set via setContext() before spawn() is called.
   */
  private context: ToolUseContext | null = null

  /**
   * Sets the ToolUseContext for this backend.
   * Called by TeammateTool before spawning to provide AppState access.
   */
  // setContext 根据 context: ToolUseContext 更新共享工具的状态。
  setContext(context: ToolUseContext): void {
    // 更新实例字段 context 为 context，同步共享工具的内部状态。
    this.context = context
  }

  /**
   * In-process backend is always available (no external dependencies).
   */
  // isAvailable 用 无 判断共享工具是否满足条件。
  async isAvailable(): Promise<boolean> {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  /**
   * Spawns an in-process teammate.
   *
   * Uses spawnInProcessTeammate() to:
   * 1. Create TeammateContext via createTeammateContext()
   * 2. Create independent AbortController (not linked to parent)
   * 3. Register teammate in AppState.tasks
   * 4. Start agent execution via startInProcessTeammate()
   * 5. Return spawn result with agentId, taskId, abortController
   */
  // spawn 使用 config: TeammateSpawnConfig 完成共享工具里的对应操作。
  async spawn(config: TeammateSpawnConfig): Promise<TeammateSpawnResult> {
    // this.context缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.context) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] spawn() called without context for ${config.name}`,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        agentId: `${config.name}@${config.teamName}`,
        error:
          'InProcessBackend not initialized. Call setContext() before spawn().',
      }
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[InProcessBackend] spawn() called for ${config.name}`)

    // 结果保存`spawnInProcessTeammate`，供共享工具后续处理使用。
    const result = await spawnInProcessTeammate(
      {
        name: config.name,
        teamName: config.teamName,
        prompt: config.prompt,
        color: config.color,
        planModeRequired: config.planModeRequired ?? false,
      },
      this.context,
    )

    // If spawn succeeded, start the agent execution loop
    // 共享工具在这里按实际状态进入对应分支。
    if (
      result.success &&
      result.taskId &&
      result.teammateContext &&
      result.abortController
    ) {
      // Start the agent loop in the background (fire-and-forget)
      // The prompt is passed through the task state and config
      // 调用 startInProcessTeammate，触发共享工具此处需要的副作用。
      startInProcessTeammate({
        identity: {
          agentId: result.agentId,
          agentName: config.name,
          teamName: config.teamName,
          color: config.color,
          planModeRequired: config.planModeRequired ?? false,
          parentSessionId: result.teammateContext.parentSessionId,
        },
        taskId: result.taskId,
        prompt: config.prompt,
        teammateContext: result.teammateContext,
        // Strip messages: the teammate never reads toolUseContext.messages
        // (runAgent overrides it via createSubagentContext). Passing the
        // parent's conversation would pin it for the teammate's lifetime.
        toolUseContext: { ...this.context, messages: [] },
        abortController: result.abortController,
        model: config.model,
        systemPrompt: config.systemPrompt,
        systemPromptMode: config.systemPromptMode,
        allowedTools: config.permissions,
        allowPermissionPrompts: config.allowPermissionPrompts,
      })

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] Started agent execution for ${result.agentId}`,
      )
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: result.success,
      agentId: result.agentId,
      taskId: result.taskId,
      abortController: result.abortController,
      error: result.error,
    }
  }

  /**
   * Sends a message to an in-process teammate.
   *
   * All teammates use file-based mailboxes for simplicity.
   */
  // sendMessage 使用 agentId: string, message: TeammateMessage 完成共享工具里的对应操作。
  async sendMessage(agentId: string, message: TeammateMessage): Promise<void> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[InProcessBackend] sendMessage() to ${agentId}: ${message.text.substring(0, 50)}...`,
    )

    // Parse agentId to get agentName and teamName
    // agentId format: "agentName@teamName" (e.g., "researcher@my-team")
    // 解析结果解析`parseAgentId`，供共享工具后续处理使用。
    const parsed = parseAgentId(agentId)
    // 解析结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!parsed) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[InProcessBackend] Invalid agentId format: ${agentId}`)
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Invalid agentId format: ${agentId}. Expected format: agentName@teamName`,
      )
    }

    // 从 `parsed` 解构 agentName、teamName，减少共享工具 In Process Backend对同一对象的重复访问。
    const { agentName, teamName } = parsed

    // Write to file-based mailbox
    // 等待 `writeToMailbox(` 完成，再继续共享工具 In Process Backend的异步流程。
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
    logForDebugging(`[InProcessBackend] sendMessage() completed for ${agentId}`)
  }

  /**
   * Gracefully terminates an in-process teammate.
   *
   * Sends a shutdown request message to the teammate and sets the
   * shutdownRequested flag. The teammate processes the request and
   * either approves (exits) or rejects (continues working).
   *
   * Unlike pane-based teammates, in-process teammates handle their own
   * exit via the shutdown flow - no external killPane() is needed.
   */
  // terminate 使用 agentId: string, reason?: string 完成共享工具里的对应操作。
  async terminate(agentId: string, reason?: string): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[InProcessBackend] terminate() called for ${agentId}: ${reason}`,
    )

    // this.context缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.context) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] terminate() failed: no context set for ${agentId}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Get current AppState to find the task
    // 状态读取`context.getAppState`，供共享工具后续处理使用。
    const state = this.context.getAppState()
    // task筛选`findTeammateTaskByAgentId`，供共享工具后续处理使用。
    const task = findTeammateTaskByAgentId(agentId, state.tasks)

    // task缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] terminate() failed: task not found for ${agentId}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Don't send another shutdown request if one is already pending
    // 满足 `task.shutdownRequested` 时，共享工具执行该分支。
    if (task.shutdownRequested) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] terminate(): shutdown already requested for ${agentId}`,
      )
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Generate deterministic request ID
    // requestId 请求数据记录时间`Date.now`，供共享工具后续处理使用。
    const requestId = `shutdown-${agentId}-${Date.now()}`

    // Create shutdown request message
    // shutdownRequest 请求数据构建`createShutdownRequestMessage`，供共享工具后续处理使用。
    const shutdownRequest = createShutdownRequestMessage({
      requestId,
      from: 'team-lead', // Terminate is always called by the leader
      reason,
    })

    // Send to teammate's mailbox
    // teammateAgentName保存`task.identity.agentName`，供共享工具 In Process Backend后续判断或输出使用。
    const teammateAgentName = task.identity.agentName
    // 等待 `writeToMailbox(` 完成，再继续共享工具 In Process Backend的异步流程。
    await writeToMailbox(
      teammateAgentName,
      {
        from: 'team-lead',
        text: jsonStringify(shutdownRequest),
        timestamp: new Date().toISOString(),
      },
      task.identity.teamName,
    )

    // Mark the task as shutdown requested
    // 调用 requestTeammateShutdown，触发共享工具此处需要的副作用。
    requestTeammateShutdown(task.id, this.context.setAppState)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[InProcessBackend] terminate() sent shutdown request to ${agentId}`,
    )

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  /**
   * Force kills an in-process teammate immediately.
   *
   * Uses the teammate's AbortController to cancel all async operations
   * and updates the task state to 'killed'.
   */
  // kill 使用 agentId: string 完成共享工具里的对应操作。
  async kill(agentId: string): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[InProcessBackend] kill() called for ${agentId}`)

    // this.context缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.context) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] kill() failed: no context set for ${agentId}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Get current AppState to find the task
    // 状态读取`context.getAppState`，供共享工具后续处理使用。
    const state = this.context.getAppState()
    // task筛选`findTeammateTaskByAgentId`，供共享工具后续处理使用。
    const task = findTeammateTaskByAgentId(agentId, state.tasks)

    // task缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] kill() failed: task not found for ${agentId}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Kill the teammate via the existing helper function
    // killed保存`killInProcessTeammate`，供共享工具后续处理使用。
    const killed = killInProcessTeammate(task.id, this.context.setAppState)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[InProcessBackend] kill() ${killed ? 'succeeded' : 'failed'} for ${agentId}`,
    )

    // 返回 `killed`，作为共享工具这次计算的结果。
    return killed
  }

  /**
   * Checks if an in-process teammate is still active.
   *
   * Returns true if the teammate exists, has status 'running',
   * and its AbortController has not been aborted.
   */
  // isActive 用 agentId: string 判断共享工具是否满足条件。
  async isActive(agentId: string): Promise<boolean> {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[InProcessBackend] isActive() called for ${agentId}`)

    // this.context缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.context) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] isActive() failed: no context set for ${agentId}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Get current AppState to find the task
    // 状态读取`context.getAppState`，供共享工具后续处理使用。
    const state = this.context.getAppState()
    // task筛选`findTeammateTaskByAgentId`，供共享工具后续处理使用。
    const task = findTeammateTaskByAgentId(agentId, state.tasks)

    // task缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[InProcessBackend] isActive(): task not found for ${agentId}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Check if task is running and not aborted
    // isRunning标记共享工具 In Process Backend是否启用对应路径。
    const isRunning = task.status === 'running'
    // isAborted标记共享工具 In Process Backend是否启用对应路径。
    const isAborted = task.abortController?.signal.aborted ?? true

    // active标记共享工具 In Process Backend是否启用对应路径。
    const active = isRunning && !isAborted

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[InProcessBackend] isActive() for ${agentId}: ${active} (running=${isRunning}, aborted=${isAborted})`,
    )

    // 返回 `active`，作为共享工具这次计算的结果。
    return active
  }
}

/**
 * Factory function to create an InProcessBackend instance.
 * Used by the registry (Task #8) to get backend instances.
 */
// createInProcessBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createInProcessBackend(): InProcessBackend {
  // 返回 `new InProcessBackend()`，作为共享工具这次计算的结果。
  return new InProcessBackend()
}
