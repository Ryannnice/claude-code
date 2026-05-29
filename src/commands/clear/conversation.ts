/**
 * Conversation clearing utility.
 * This module has heavier dependencies and should be lazy-loaded when possible.
 */
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID, type UUID } from 'crypto'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getLastMainRequestId,
  getOriginalCwd,
  getSessionId,
  regenerateSessionId,
} from '../../bootstrap/state.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准命令处理的数据契约。
import type { AppState } from '../../state/AppState.js'
// 引入 isInProcessTeammateTask，将 ../../tasks/InProcessTeammateTask/types.js 中已经封装好的能力接到本文件流程里。
import { isInProcessTeammateTask } from '../../tasks/InProcessTeammateTask/types.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  isLocalAgentTask,
  type LocalAgentTaskState,
} from '../../tasks/LocalAgentTask/LocalAgentTask.js'
// 引入 isLocalShellTask，将 ../../tasks/LocalShellTask/guards.js 中已经封装好的能力接到本文件流程里。
import { isLocalShellTask } from '../../tasks/LocalShellTask/guards.js'
// 引入 asAgentId，将 ../../types/ids.js 中已经封装好的能力接到本文件流程里。
import { asAgentId } from '../../types/ids.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准命令处理的数据契约。
import type { Message } from '../../types/message.js'
// 复用 createEmptyAttributionState 工具函数，把通用处理留在 ../../utils/commitAttribution.js 中维护。
import { createEmptyAttributionState } from '../../utils/commitAttribution.js'
// 类型依赖 { FileStateCache } 来自 ../../utils/fileStateCache.js，用于校准命令处理的数据契约。
import type { FileStateCache } from '../../utils/fileStateCache.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  executeSessionEndHooks,
  getSessionEndHookTimeoutMs,
} from '../../utils/hooks.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 clearAllPlanSlugs 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { clearAllPlanSlugs } from '../../utils/plans.js'
// 复用 setCwd 工具函数，把通用处理留在 ../../utils/Shell.js 中维护。
import { setCwd } from '../../utils/Shell.js'
// 复用 processSessionStartHooks 工具函数，把通用处理留在 ../../utils/sessionStart.js 中维护。
import { processSessionStartHooks } from '../../utils/sessionStart.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  clearSessionMetadata,
  getAgentTranscriptPath,
  resetSessionFilePointer,
  saveWorktreeState,
} from '../../utils/sessionStorage.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  evictTaskOutput,
  initTaskOutputAsSymlink,
} from '../../utils/task/diskOutput.js'
// 复用 getCurrentWorktreeSession 工具函数，把通用处理留在 ../../utils/worktree.js 中维护。
import { getCurrentWorktreeSession } from '../../utils/worktree.js'
// 引入 clearSessionCaches，将 ./caches.js 中已经封装好的能力接到本文件流程里。
import { clearSessionCaches } from './caches.js'

// clearConversation 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearConversation({
  setMessages,
  readFileState,
  discoveredSkillNames,
  loadedNestedMemoryPaths,
  getAppState,
  setAppState,
  setConversationId,
}: {
  // 这个回调绑定到 setMessages: (updater: (prev: Message[]) => Message[]) => void，负责命令处理在该局部场景下的响应。
  setMessages: (updater: (prev: Message[]) => Message[]) => void
  readFileState: FileStateCache
  discoveredSkillNames?: Set<string>
  loadedNestedMemoryPaths?: Set<string>
  getAppState?: () => AppState
  // 这个回调绑定到 setAppState?: (f: (prev: AppState) => AppState) => void，负责命令处理在该局部场景下的响应。
  setAppState?: (f: (prev: AppState) => AppState) => void
  // 这个回调绑定到 setConversationId?: (id: UUID) => void，负责命令处理在该局部场景下的响应。
  setConversationId?: (id: UUID) => void
}): Promise<void> {
  // Execute SessionEnd hooks before clearing (bounded by
  // CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS, default 1.5s)
  // sessionEndTimeoutMs 会话数据读取`getSessionEndHookTimeoutMs`，供命令处理后续处理使用。
  const sessionEndTimeoutMs = getSessionEndHookTimeoutMs()
  // 等待 `executeSessionEndHooks('clear', {` 完成，再继续斜杠命令 conversation的异步流程。
  await executeSessionEndHooks('clear', {
    getAppState,
    setAppState,
    signal: AbortSignal.timeout(sessionEndTimeoutMs),
    timeoutMs: sessionEndTimeoutMs,
  })

  // Signal to inference that this conversation's cache can be evicted.
  // lastRequestId 请求数据读取`getLastMainRequestId`，供命令处理后续处理使用。
  const lastRequestId = getLastMainRequestId()
  // 满足 `lastRequestId` 时，命令处理执行该分支。
  if (lastRequestId) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_cache_eviction_hint', {
      scope:
        'conversation_clear' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      last_request_id:
        lastRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // Compute preserved tasks up front so their per-agent state survives the
  // cache wipe below. A task is preserved unless it explicitly has
  // isBackgrounded === false. Main-session tasks (Ctrl+B) are preserved —
  // they write to an isolated per-task transcript and run under an agent
  // context, so they're safe across session ID regeneration. See
  // LocalMainSessionTask.ts startBackgroundSession.
  // preservedAgentIds 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const preservedAgentIds = new Set<string>()
  // preservedLocalAgents 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const preservedLocalAgents: LocalAgentTaskState[] = []
  // shouldKillTask封装成回调，供命令处理斜杠命令 conversation在事件触发或异步步骤中调用。
  const shouldKillTask = (task: AppState['tasks'][string]): boolean =>
    'isBackgrounded' in task && task.isBackgrounded === false
  // 满足 `getAppState` 时，命令处理执行该分支。
  if (getAppState) {
    // 逐项读取 `Object.values(getAppState().tasks)` 中的task，按输入顺序推进命令处理。
    for (const task of Object.values(getAppState().tasks)) {
      // 满足 `shouldKillTask(task)` 时，命令处理执行该分支。
      if (shouldKillTask(task)) continue
      // 满足 `isLocalAgentTask(task)` 时，命令处理执行该分支。
      if (isLocalAgentTask(task)) {
        // 调用 preservedAgentIds.add，触发命令处理此处需要的副作用。
        preservedAgentIds.add(task.agentId)
        // preservedLocalAgents 集合追加新条目，保持收集顺序与输入顺序一致。
        preservedLocalAgents.push(task)
      // 斜杠命令 conversation在这里处理 `} else if (isInProcessTeammateTask(task)) {`，完成这一小步状态转换。
      } else if (isInProcessTeammateTask(task)) {
        // 调用 preservedAgentIds.add，触发命令处理此处需要的副作用。
        preservedAgentIds.add(task.identity.agentId)
      }
    }
  }

  // setMessages 写入新的状态值，使命令处理后续读取保持一致。
  setMessages(() => [])

  // Clear context-blocked flag so proactive ticks resume after /clear
  // 只有 `feature('PROACTIVE') || feature('KAIROS')` 满足时，命令处理才执行该分支。
  if (feature('PROACTIVE') || feature('KAIROS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 从 `require('../../proactive/index.js')` 解构 setContextBlocked，减少斜杠命令 conversation对同一对象的重复访问。
    const { setContextBlocked } = require('../../proactive/index.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // setContextBlocked 写入新的状态值，使命令处理后续读取保持一致。
    setContextBlocked(false)
  }

  // Force logo re-render by updating conversationId
  // 满足 `setConversationId` 时，命令处理执行该分支。
  if (setConversationId) {
    // setConversationId 写入新的状态值，使命令处理后续读取保持一致。
    setConversationId(randomUUID())
  }

  // Clear all session-related caches. Per-agent state for preserved background
  // tasks (invoked skills, pending permission callbacks, dump state, cache-break
  // tracking) is retained so those agents keep functioning.
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearSessionCaches(preservedAgentIds)

  // setCwd 写入新的状态值，使命令处理后续读取保持一致。
  setCwd(getOriginalCwd())
  // 调用 readFileState.clear，触发命令处理此处需要的副作用。
  readFileState.clear()
  // 调用 discoveredSkillNames?.clear()，完成这一处局部操作。
  discoveredSkillNames?.clear()
  // 调用 loadedNestedMemoryPaths?.clear()，完成这一处局部操作。
  loadedNestedMemoryPaths?.clear()

  // Clean out necessary items from App State
  // 满足 `setAppState` 时，命令处理执行该分支。
  if (setAppState) {
    // setAppState 写入新的状态值，使命令处理后续读取保持一致。
    setAppState(prev => {
      // Partition tasks using the same predicate computed above:
      // kill+remove foreground tasks, preserve everything else.
      // nextTasks 集合 从空对象开始收集键值，后续按名称补齐内容。
      const nextTasks: AppState['tasks'] = {}
      // 循环处理 `const [taskId, task] of Object.entries(prev.tasks)`，让命令处理把同类条目按顺序走完。
      for (const [taskId, task] of Object.entries(prev.tasks)) {
        // 满足 `!shouldKillTask(task)` 时，命令处理执行该分支。
        if (!shouldKillTask(task)) {
          // nextTasks[taskId更新为 `task`，确保斜杠命令 conversation后续读取最新状态。
          nextTasks[taskId] = task
          // 跳过当前项，继续处理命令处理中的下一轮循环。
          continue
        }
        // Foreground task: kill it and drop from state
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // 当 `task.status` 匹配 `'running'` 时，命令处理执行对应分支。
          if (task.status === 'running') {
            // 满足 `isLocalShellTask(task)` 时，命令处理执行该分支。
            if (isLocalShellTask(task)) {
              // 调用 task.shellCommand?.kill()，完成这一处局部操作。
              task.shellCommand?.kill()
              // 调用 task.shellCommand?.cleanup()，完成这一处局部操作。
              task.shellCommand?.cleanup()
              // 满足 `task.cleanupTimeoutId` 时，命令处理执行该分支。
              if (task.cleanupTimeoutId) {
                // 调用 clearTimeout，触发命令处理此处需要的副作用。
                clearTimeout(task.cleanupTimeoutId)
              }
            }
            // 满足 `'abortController' in task` 时，命令处理执行该分支。
            if ('abortController' in task) {
              // 调用 task.abortController?.abort()，完成这一处局部操作。
              task.abortController?.abort()
            }
            // 满足 `'unregisterCleanup' in task` 时，命令处理执行该分支。
            if ('unregisterCleanup' in task) {
              // 调用 task.unregisterCleanup?.()，完成这一处局部操作。
              task.unregisterCleanup?.()
            }
          }
        } catch (error) {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logError(error)
        }
        // 显式忽略 `evictTaskOutput(taskId)` 的返回值，只保留它触发的副作用。
        void evictTaskOutput(taskId)
      }

      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        ...prev,
        tasks: nextTasks,
        attribution: createEmptyAttributionState(),
        // Clear standalone agent context (name/color set by /rename, /color)
        // so the new session doesn't display the old session's identity badge
        standaloneAgentContext: undefined,
        fileHistory: {
          snapshots: [],
          trackedFiles: new Set(),
          snapshotSequence: 0,
        },
        // Reset MCP state to default to trigger re-initialization.
        // Preserve pluginReconnectKey so /clear doesn't cause a no-op
        // (it's only bumped by /reload-plugins).
        mcp: {
          clients: [],
          tools: [],
          commands: [],
          resources: {},
          pluginReconnectKey: prev.mcp.pluginReconnectKey,
        },
      }
    })
  }

  // Clear plan slug cache so a new plan file is used after /clear
  // 调用 clearAllPlanSlugs，触发命令处理此处需要的副作用。
  clearAllPlanSlugs()

  // Clear cached session metadata (title, tag, agent name/color)
  // so the new session doesn't inherit the previous session's identity
  // 调用 clearSessionMetadata，触发命令处理此处需要的副作用。
  clearSessionMetadata()

  // Generate new session ID to provide fresh state
  // Set the old session as parent for analytics lineage tracking
  // 调用 regenerateSessionId，触发命令处理此处需要的副作用。
  regenerateSessionId({ setCurrentAsParent: true })
  // Update the environment variable so subprocesses use the new session ID
  // 只有 `process.env.USER_TYPE === 'ant' && process.env.CL` 满足时，命令处理才执行该分支。
  if (process.env.USER_TYPE === 'ant' && process.env.CLAUDE_CODE_SESSION_ID) {
    // CLAUDE_CODE_SESSION_ID 会话数据更新为 `getSessionId()`，确保斜杠命令后续读取最新状态。
    process.env.CLAUDE_CODE_SESSION_ID = getSessionId()
  }
  // 等待 `resetSessionFilePointer()` 完成，再继续斜杠命令 conversation的异步流程。
  await resetSessionFilePointer()

  // Preserved local_agent tasks had their TaskOutput symlink baked against the
  // old session ID at spawn time, but post-clear transcript writes land under
  // the new session directory (appendEntry re-reads getSessionId()). Re-point
  // the symlinks so TaskOutput reads the live file instead of a frozen pre-clear
  // snapshot. Only re-point running tasks — finished tasks will never write
  // again, so re-pointing would replace a valid symlink with a dangling one.
  // Main-session tasks use the same per-agent path (they write via
  // recordSidechainTranscript to getAgentTranscriptPath), so no special case.
  // 按顺序遍历 `preservedLocalAgents` 中的task，逐个交给命令处理处理。
  for (const task of preservedLocalAgents) {
    // `task.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (task.status !== 'running') continue
    // 显式忽略 `initTaskOutputAsSymlink(` 的返回值，只保留它触发的副作用。
    void initTaskOutputAsSymlink(
      task.id,
      getAgentTranscriptPath(asAgentId(task.agentId)),
    )
  }

  // Re-persist mode and worktree state after the clear so future --resume
  // knows what the new post-clear session was in. clearSessionMetadata
  // wiped both from the cache, but the process is still in the same mode
  // and (if applicable) the same worktree directory.
  // 满足 `feature('COORDINATOR_MODE')` 时，命令处理执行该分支。
  if (feature('COORDINATOR_MODE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 从 `require('../../utils/sessionStorage.js')` 解构 saveMode，减少斜杠命令 conversation对同一对象的重复访问。
    const { saveMode } = require('../../utils/sessionStorage.js')
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      isCoordinatorMode,
    } = require('../../coordinator/coordinatorMode.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // 调用 saveMode，触发命令处理此处需要的副作用。
    saveMode(isCoordinatorMode() ? 'coordinator' : 'normal')
  }
  // worktreeSession 会话数据读取`getCurrentWorktreeSession`，供命令处理后续处理使用。
  const worktreeSession = getCurrentWorktreeSession()
  // 满足 `worktreeSession` 时，命令处理执行该分支。
  if (worktreeSession) {
    // 调用 saveWorktreeState，触发命令处理此处需要的副作用。
    saveWorktreeState(worktreeSession)
  }

  // Execute SessionStart hooks after clearing
  // hookMessages 消息数据保存`processSessionStartHooks`，供命令处理后续处理使用。
  const hookMessages = await processSessionStartHooks('clear')

  // Update messages with hook results
  // 满足 `hookMessages.length > 0` 时，命令处理执行该分支。
  if (hookMessages.length > 0) {
    // setMessages 写入新的状态值，使命令处理后续读取保持一致。
    setMessages(() => hookMessages)
  }
}
