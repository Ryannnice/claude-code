// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getMainLoopModelOverride,
  getSessionId,
  setMainLoopModelOverride,
  setMainThreadAgentType,
  setOriginalCwd,
  switchSession,
} from '../bootstrap/state.js'
// 引入 clearSystemPromptSections，将 ../constants/systemPromptSections.js 中已经封装好的能力接到本文件流程里。
import { clearSystemPromptSections } from '../constants/systemPromptSections.js'
// 引入 restoreCostStateForSession，将 ../cost-tracker.js 中已经封装好的能力接到本文件流程里。
import { restoreCostStateForSession } from '../cost-tracker.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 类型依赖 { AgentColorName } 来自 ../tools/AgentTool/agentColorManager.js，用于校准共享工具的数据契约。
import type { AgentColorName } from '../tools/AgentTool/agentColorManager.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AgentDefinition,
  type AgentDefinitionsResult,
  getActiveAgentsFromList,
  getAgentDefinitionsWithOverrides,
} from '../tools/AgentTool/loadAgentsDir.js'
// 接入 TODO_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TODO_WRITE_TOOL_NAME } from '../tools/TodoWriteTool/constants.js'
// 引入 asSessionId，将 ../types/ids.js 中已经封装好的能力接到本文件流程里。
import { asSessionId } from '../types/ids.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AttributionSnapshotMessage,
  ContextCollapseCommitEntry,
  ContextCollapseSnapshotEntry,
  PersistedWorktreeSession,
} from '../types/logs.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 renameRecordingForSession，将 ./asciicast.js 中已经封装好的能力接到本文件流程里。
import { renameRecordingForSession } from './asciicast.js'
// 引入 clearMemoryFileCaches，将 ./claudemd.js 中已经封装好的能力接到本文件流程里。
import { clearMemoryFileCaches } from './claudemd.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AttributionState,
  attributionRestoreStateFromLog,
  restoreAttributionStateFromSnapshots,
} from './commitAttribution.js'
// 引入 updateSessionName，将 ./concurrentSessions.js 中已经封装好的能力接到本文件流程里。
import { updateSessionName } from './concurrentSessions.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 类型依赖 { FileHistorySnapshot } 来自 ./fileHistory.js，用于校准共享工具的数据契约。
import type { FileHistorySnapshot } from './fileHistory.js'
// 引入 fileHistoryRestoreStateFromLog，将 ./fileHistory.js 中已经封装好的能力接到本文件流程里。
import { fileHistoryRestoreStateFromLog } from './fileHistory.js'
// 引入 createSystemMessage，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { createSystemMessage } from './messages.js'
// 引入 parseUserSpecifiedModel，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { parseUserSpecifiedModel } from './model/model.js'
// 引入 getPlansDirectory，将 ./plans.js 中已经封装好的能力接到本文件流程里。
import { getPlansDirectory } from './plans.js'
// 引入 setCwd，将 ./Shell.js 中已经封装好的能力接到本文件流程里。
import { setCwd } from './Shell.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  adoptResumedSessionFile,
  recordContentReplacement,
  resetSessionFilePointer,
  restoreSessionMetadata,
  saveMode,
  saveWorktreeState,
} from './sessionStorage.js'
// 引入 isTodoV2Enabled，将 ./tasks.js 中已经封装好的能力接到本文件流程里。
import { isTodoV2Enabled } from './tasks.js'
// 类型依赖 { TodoList } 来自 ./todo/types.js，用于校准共享工具的数据契约。
import type { TodoList } from './todo/types.js'
// 引入 TodoListSchema，将 ./todo/types.js 中已经封装好的能力接到本文件流程里。
import { TodoListSchema } from './todo/types.js'
// 类型依赖 { ContentReplacementRecord } 来自 ./toolResultStorage.js，用于校准共享工具的数据契约。
import type { ContentReplacementRecord } from './toolResultStorage.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCurrentWorktreeSession,
  restoreWorktreeSession,
} from './worktree.js'

// ResumeResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ResumeResult = {
  messages?: Message[]
  fileHistorySnapshots?: FileHistorySnapshot[]
  attributionSnapshots?: AttributionSnapshotMessage[]
  contextCollapseCommits?: ContextCollapseCommitEntry[]
  contextCollapseSnapshot?: ContextCollapseSnapshotEntry
}

/**
 * Scan the transcript for the last TodoWrite tool_use block and return its todos.
 * Used to hydrate AppState.todos on SDK --resume so the model's todo list
 * survives session restarts without file persistence.
 */
// extractTodosFromTranscript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractTodosFromTranscript(messages: Message[]): TodoList {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const msg = messages[i]
    // `msg?.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg?.type !== 'assistant') continue
    // toolUse筛选`content.find`，供共享工具后续处理使用。
    const toolUse = msg.message.content.find(
      // block更新为 `> block.type === 'tool_use' && block.name === TODO_WRITE_...`，确保共享工具后续读取最新状态。
      block => block.type === 'tool_use' && block.name === TODO_WRITE_TOOL_NAME,
    )
    // `!toolUse || toolUse.type` 与 `'tool_use'` 不一致时刷新派生状态，避免使用过期结果。
    if (!toolUse || toolUse.type !== 'tool_use') continue
    // 用户输入保存`toolUse.input`，供后续判断或组装使用。
    const input = toolUse.input
    // `input === null || typeof input` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
    if (input === null || typeof input !== 'object') return []
    // 解析结果保存`TodoListSchema`，供共享工具后续处理使用。
    const parsed = TodoListSchema().safeParse(
      (input as Record<string, unknown>).todos,
    )
    // 返回 `parsed.success ? parsed.data : []`，作为共享工具这次计算的结果。
    return parsed.success ? parsed.data : []
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Restore session state (file history, attribution, todos) from log on resume.
 * Used by both SDK (print.ts) and interactive (REPL.tsx, main.tsx) resume paths.
 */
// restoreSessionStateFromLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreSessionStateFromLog(
  result: ResumeResult,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
): void {
  // Restore file history state
  // 只有 `result.fileHistorySnapshots && result.fileHistory` 满足时，共享工具才执行该分支。
  if (result.fileHistorySnapshots && result.fileHistorySnapshots.length > 0) {
    // 调用 fileHistoryRestoreStateFromLog，触发共享工具此处需要的副作用。
    fileHistoryRestoreStateFromLog(result.fileHistorySnapshots, newState => {
      // setAppState 写入新的状态值，使共享工具后续读取保持一致。
      setAppState(prev => ({ ...prev, fileHistory: newState }))
    })
  }

  // Restore attribution state (ant-only feature)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('COMMIT_ATTRIBUTION') &&
    result.attributionSnapshots &&
    result.attributionSnapshots.length > 0
  ) {
    // 调用 attributionRestoreStateFromLog，触发共享工具此处需要的副作用。
    attributionRestoreStateFromLog(result.attributionSnapshots, newState => {
      // setAppState 写入新的状态值，使共享工具后续读取保持一致。
      setAppState(prev => ({ ...prev, attribution: newState }))
    })
  }

  // Restore context-collapse commit log + staged snapshot. Must run before
  // the first query() so projectView() can rebuild the collapsed view from
  // the resumed Message[]. Called unconditionally (even with
  // undefined/empty entries) because restoreFromEntries resets the store
  // first — without that, an in-session /resume into a session with no
  // commits would leave the prior session's stale commit log intact.
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，共享工具执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 共享工具 session Restore在这里处理 `;(`，完成这一小步状态转换。
    ;(
      require('../services/contextCollapse/persist.js') as typeof import('../services/contextCollapse/persist.js')
    ).restoreFromEntries(
      result.contextCollapseCommits ?? [],
      result.contextCollapseSnapshot,
    )
    /* eslint-enable @typescript-eslint/no-require-imports */
  }

  // Restore TodoWrite state from transcript (SDK/non-interactive only).
  // Interactive mode uses file-backed v2 tasks, so AppState.todos is unused there.
  // 只有 `!isTodoV2Enabled() && result.messages && result.messages.length > 0` 满足时，共享工具才执行该分支。
  if (!isTodoV2Enabled() && result.messages && result.messages.length > 0) {
    // todos 集合保存`extractTodosFromTranscript`，供共享工具后续处理使用。
    const todos = extractTodosFromTranscript(result.messages)
    // 满足 `todos.length > 0` 时，共享工具执行该分支。
    if (todos.length > 0) {
      // agentId读取`getSessionId`，供共享工具后续处理使用。
      const agentId = getSessionId()
      // setAppState 写入新的状态值，使共享工具后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        todos: { ...prev.todos, [agentId]: todos },
      }))
    }
  }
}

/**
 * Compute restored attribution state from log snapshots.
 * Used for computing initial state before render (e.g., main.tsx --continue).
 * Returns undefined if attribution feature is disabled or no snapshots exist.
 */
// computeRestoredAttributionState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeRestoredAttributionState(
  result: ResumeResult,
): AttributionState | undefined {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('COMMIT_ATTRIBUTION') &&
    result.attributionSnapshots &&
    result.attributionSnapshots.length > 0
  ) {
    // 返回 `restoreAttributionStateFromSnapshots(result.attributionSnapshots)`，作为共享工具这次计算的结果。
    return restoreAttributionStateFromSnapshots(result.attributionSnapshots)
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Compute standalone agent context (name/color) for session resume.
 * Used for computing initial state before render (per CLAUDE.md guidelines).
 * Returns undefined if no name/color is set on the session.
 */
// computeStandaloneAgentContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeStandaloneAgentContext(
  agentName: string | undefined,
  agentColor: string | undefined,
): AppState['standaloneAgentContext'] | undefined {
  // 只有 `!agentName && !agentColor` 满足时，共享工具才执行该分支。
  if (!agentName && !agentColor) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    name: agentName ?? '',
    color: (agentColor === 'default' ? undefined : agentColor) as
      | AgentColorName
      | undefined,
  }
}

/**
 * Restore agent setting from a resumed session.
 *
 * When resuming a conversation that used a custom agent, this re-applies the
 * agent type and model override (unless the user specified --agent on the CLI).
 * Mutates bootstrap state via setMainThreadAgentType / setMainLoopModelOverride.
 *
 * Returns the restored agent definition and its agentType string, or undefined
 * if no agent was restored.
 */
// restoreAgentFromSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreAgentFromSession(
  agentSetting: string | undefined,
  currentAgentDefinition: AgentDefinition | undefined,
  agentDefinitions: AgentDefinitionsResult,
): {
  agentDefinition: AgentDefinition | undefined
  agentType: string | undefined
} {
  // If user already specified --agent on CLI, keep that definition
  // 满足 `currentAgentDefinition` 时，共享工具执行该分支。
  if (currentAgentDefinition) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { agentDefinition: currentAgentDefinition, agentType: undefined }
  }

  // If session had no agent, clear any stale bootstrap state
  // agentSetting缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!agentSetting) {
    // setMainThreadAgentType 写入新的状态值，使共享工具后续读取保持一致。
    setMainThreadAgentType(undefined)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { agentDefinition: undefined, agentType: undefined }
  }

  // resumedAgent筛选`activeAgents.find`，供共享工具后续处理使用。
  const resumedAgent = agentDefinitions.activeAgents.find(
    // agent更新为 `> agent.agentType === agentSetting`，确保共享工具后续读取最新状态。
    agent => agent.agentType === agentSetting,
  )
  // resumedAgent缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!resumedAgent) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Resumed session had agent "${agentSetting}" but it is no longer available. Using default behavior.`,
    )
    // setMainThreadAgentType 写入新的状态值，使共享工具后续读取保持一致。
    setMainThreadAgentType(undefined)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { agentDefinition: undefined, agentType: undefined }
  }

  // setMainThreadAgentType 写入新的状态值，使共享工具后续读取保持一致。
  setMainThreadAgentType(resumedAgent.agentType)

  // Apply agent's model if user didn't specify one
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !getMainLoopModelOverride() &&
    resumedAgent.model &&
    resumedAgent.model !== 'inherit'
  ) {
    // setMainLoopModelOverride 写入新的状态值，使共享工具后续读取保持一致。
    setMainLoopModelOverride(parseUserSpecifiedModel(resumedAgent.model))
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { agentDefinition: resumedAgent, agentType: resumedAgent.agentType }
}

/**
 * Refresh agent definitions after a coordinator/normal mode switch.
 *
 * When resuming a session that was in a different mode (coordinator vs normal),
 * the built-in agents need to be re-derived to match the new mode. CLI-provided
 * agents (from --agents flag) are merged back in.
 */
// refreshAgentDefinitionsForModeSwitch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshAgentDefinitionsForModeSwitch(
  modeWasSwitched: boolean,
  currentCwd: string,
  cliAgents: AgentDefinition[],
  currentAgentDefinitions: AgentDefinitionsResult,
): Promise<AgentDefinitionsResult> {
  // 只有 `!feature('COORDINATOR_MODE') || !modeWasSwitched` 满足时，共享工具才执行该分支。
  if (!feature('COORDINATOR_MODE') || !modeWasSwitched) {
    // 返回 `currentAgentDefinitions`，作为共享工具这次计算的结果。
    return currentAgentDefinitions
  }

  // Re-derive agent definitions after mode switch so built-in agents
  // reflect the new coordinator/normal mode
  // 调用 getAgentDefinitionsWithOverrides.cache.clear?.()，完成这一处局部操作。
  getAgentDefinitionsWithOverrides.cache.clear?.()
  // freshAgentDefs 集合读取`getAgentDefinitionsWithOverrides`，供共享工具后续处理使用。
  const freshAgentDefs = await getAgentDefinitionsWithOverrides(currentCwd)
  // freshAllAgents 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const freshAllAgents = [...freshAgentDefs.allAgents, ...cliAgents]
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...freshAgentDefs,
    allAgents: freshAllAgents,
    activeAgents: getActiveAgentsFromList(freshAllAgents),
  }
}

/**
 * Result of processing a resumed/continued conversation for rendering.
 */
// ProcessedResume 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProcessedResume = {
  messages: Message[]
  fileHistorySnapshots?: FileHistorySnapshot[]
  contentReplacements?: ContentReplacementRecord[]
  agentName: string | undefined
  agentColor: AgentColorName | undefined
  restoredAgentDef: AgentDefinition | undefined
  initialState: AppState
}

/**
 * Subset of the coordinator mode module API needed for session resume.
 */
// CoordinatorModeApi 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CoordinatorModeApi = {
  matchSessionMode(mode?: string): string | undefined
  isCoordinatorMode(): boolean
}

/**
 * The loaded conversation data (return type of loadConversationForResume).
 */
// ResumeLoadResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ResumeLoadResult = {
  messages: Message[]
  fileHistorySnapshots?: FileHistorySnapshot[]
  attributionSnapshots?: AttributionSnapshotMessage[]
  contentReplacements?: ContentReplacementRecord[]
  contextCollapseCommits?: ContextCollapseCommitEntry[]
  contextCollapseSnapshot?: ContextCollapseSnapshotEntry
  sessionId: UUID | undefined
  agentName?: string
  agentColor?: string
  agentSetting?: string
  customTitle?: string
  tag?: string
  mode?: 'coordinator' | 'normal'
  worktreeSession?: PersistedWorktreeSession | null
  prNumber?: number
  prUrl?: string
  prRepository?: string
}

/**
 * Restore the worktree working directory on resume. The transcript records
 * the last worktree enter/exit; if the session crashed while inside a
 * worktree (last entry = session object, not null), cd back into it.
 *
 * process.chdir is the TOCTOU-safe existence check — it throws ENOENT if
 * the /exit dialog removed the directory, or if the user deleted it
 * manually between sessions.
 *
 * When --worktree already created a fresh worktree, that takes precedence
 * over the resumed session's state. restoreSessionMetadata just overwrote
 * project.currentSessionWorktree with the stale transcript value, so
 * re-assert the fresh worktree here before adoptResumedSessionFile writes
 * it back to disk.
 */
// restoreWorktreeForResume 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreWorktreeForResume(
  worktreeSession: PersistedWorktreeSession | null | undefined,
): void {
  // fresh读取`getCurrentWorktreeSession`，供共享工具后续处理使用。
  const fresh = getCurrentWorktreeSession()
  // 满足 `fresh` 时，共享工具执行该分支。
  if (fresh) {
    // 调用 saveWorktreeState，触发共享工具此处需要的副作用。
    saveWorktreeState(fresh)
    // 共享工具 session Restore在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // worktreeSession 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!worktreeSession) return

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 process.chdir，触发共享工具此处需要的副作用。
    process.chdir(worktreeSession.worktreePath)
  } catch {
    // Directory is gone. Override the stale cache so the next
    // reAppendSessionMetadata records "exited" instead of re-persisting
    // a path that no longer exists.
    // 调用 saveWorktreeState，触发共享工具此处需要的副作用。
    saveWorktreeState(null)
    // 共享工具 session Restore在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // setCwd 写入新的状态值，使共享工具后续读取保持一致。
  setCwd(worktreeSession.worktreePath)
  // setOriginalCwd 写入新的状态值，使共享工具后续读取保持一致。
  setOriginalCwd(getCwd())
  // projectRoot is intentionally NOT set here. The transcript doesn't record
  // whether the worktree was entered via --worktree (which sets projectRoot)
  // or EnterWorktreeTool (which doesn't). Leaving projectRoot stable matches
  // EnterWorktreeTool's behavior — skills/history stay anchored to the
  // original project.
  // 调用 restoreWorktreeSession，触发共享工具此处需要的副作用。
  restoreWorktreeSession(worktreeSession)
  // The /resume slash command calls this mid-session after caches have been
  // populated against the old cwd. Cheap no-ops for the CLI-flag path
  // (caches aren't populated yet there).
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearMemoryFileCaches()
  // 调用 clearSystemPromptSections，触发共享工具此处需要的副作用。
  clearSystemPromptSections()
  // 调用 getPlansDirectory.cache.clear?.()，完成这一处局部操作。
  getPlansDirectory.cache.clear?.()
}

/**
 * Undo restoreWorktreeForResume before a mid-session /resume switches to
 * another session. Without this, /resume from a worktree session to a
 * non-worktree session leaves the user in the old worktree directory with
 * currentWorktreeSession still pointing at the prior session. /resume to a
 * *different* worktree fails entirely — the getCurrentWorktreeSession()
 * guard above blocks the switch.
 *
 * Not needed by CLI --resume/--continue: those run once at startup where
 * getCurrentWorktreeSession() is only truthy if --worktree was used (fresh
 * worktree that should take precedence, handled by the re-assert above).
 */
// exitRestoredWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function exitRestoredWorktree(): void {
  // current读取`getCurrentWorktreeSession`，供共享工具后续处理使用。
  const current = getCurrentWorktreeSession()
  // current缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!current) return

  // 调用 restoreWorktreeSession，触发共享工具此处需要的副作用。
  restoreWorktreeSession(null)
  // Worktree state changed, so cached prompt sections that reference it are
  // stale whether or not chdir succeeds below.
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearMemoryFileCaches()
  // 调用 clearSystemPromptSections，触发共享工具此处需要的副作用。
  clearSystemPromptSections()
  // 调用 getPlansDirectory.cache.clear?.()，完成这一处局部操作。
  getPlansDirectory.cache.clear?.()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 process.chdir，触发共享工具此处需要的副作用。
    process.chdir(current.originalCwd)
  } catch {
    // Original dir is gone (rare). Stay put — restoreWorktreeForResume
    // will cd into the target worktree next if there is one.
    // 共享工具 session Restore在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // setCwd 写入新的状态值，使共享工具后续读取保持一致。
  setCwd(current.originalCwd)
  // setOriginalCwd 写入新的状态值，使共享工具后续读取保持一致。
  setOriginalCwd(getCwd())
}

/**
 * Process a loaded conversation for resume/continue.
 *
 * Handles coordinator mode matching, session ID setup, agent restoration,
 * mode persistence, and initial state computation. Called by both --continue
 * and --resume paths in main.tsx.
 */
// processResumedConversation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function processResumedConversation(
  result: ResumeLoadResult,
  opts: {
    forkSession: boolean
    sessionIdOverride?: string
    transcriptPath?: string
    includeAttribution?: boolean
  },
  context: {
    modeApi: CoordinatorModeApi | null
    mainThreadAgentDefinition: AgentDefinition | undefined
    agentDefinitions: AgentDefinitionsResult
    currentCwd: string
    cliAgents: AgentDefinition[]
    initialState: AppState
  },
): Promise<ProcessedResume> {
  // Match coordinator/normal mode to the resumed session
  // modeWarning 警告信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let modeWarning: string | undefined
  // 满足 `feature('COORDINATOR_MODE')` 时，共享工具执行该分支。
  if (feature('COORDINATOR_MODE')) {
    // modeWarning 警告信息更新为 `context.modeApi?.matchSessionMode(result.mode)`，确保共享工具后续读取最新状态。
    modeWarning = context.modeApi?.matchSessionMode(result.mode)
    // 满足 `modeWarning` 时，共享工具执行该分支。
    if (modeWarning) {
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      result.messages.push(createSystemMessage(modeWarning, 'warning'))
    }
  }

  // Reuse the resumed session's ID unless --fork-session is specified
  // opts.forkSession 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!opts.forkSession) {
    // sid 命名 `opts.sessionIdOverride ?? result.sessionId`，让后续代码直接表达这个值的用途。
    const sid = opts.sessionIdOverride ?? result.sessionId
    // 满足 `sid` 时，共享工具执行该分支。
    if (sid) {
      // When resuming from a different project directory (git worktrees,
      // cross-project), transcriptPath points to the actual file; its dirname
      // is the project dir. Otherwise the session lives in the current project.
      // 调用 switchSession，触发共享工具此处需要的副作用。
      switchSession(
        asSessionId(sid),
        opts.transcriptPath ? dirname(opts.transcriptPath) : null,
      )
      // Rename asciicast recording to match the resumed session ID so
      // getSessionRecordingPaths() can discover it during /share
      // 等待 `renameRecordingForSession()` 完成，再继续共享工具 session Restore的异步流程。
      await renameRecordingForSession()
      // 等待 `resetSessionFilePointer()` 完成，再继续共享工具 session Restore的异步流程。
      await resetSessionFilePointer()
      // 调用 restoreCostStateForSession，触发共享工具此处需要的副作用。
      restoreCostStateForSession(sid)
    }
  // 共享工具 session Restore在这里处理 `} else if (result.contentReplacements?.length) {`，完成这一小步状态转换。
  } else if (result.contentReplacements?.length) {
    // --fork-session keeps the fresh startup session ID. useLogMessages will
    // copy source messages into the new JSONL via recordTranscript, but
    // content-replacement entries are a separate entry type only written by
    // recordContentReplacement (which query.ts calls for newlyReplaced, never
    // the pre-loaded records). Without this seed, `claude -r {newSessionId}`
    // finds source tool_use_ids in messages but no matching replacement records
    // → they're classified as FROZEN → full content sent (cache miss, permanent
    // overage). insertContentReplacement stamps sessionId = getSessionId() =
    // the fresh ID, so loadTranscriptFile's keyed lookup will match.
    // 等待 `recordContentReplacement(result.contentReplacements)` 完成，再继续共享工具 session Restore的异步流程。
    await recordContentReplacement(result.contentReplacements)
  }

  // Restore session metadata so /status shows the saved name and metadata
  // is re-appended on session exit. Fork doesn't take ownership of the
  // original session's worktree — a "Remove" on the fork's exit dialog
  // would delete a worktree the original session still references — so
  // strip worktreeSession from the fork path so the cache stays unset.
  // 调用 restoreSessionMetadata，触发共享工具此处需要的副作用。
  restoreSessionMetadata(
    opts.forkSession ? { ...result, worktreeSession: undefined } : result,
  )

  // opts.forkSession 会话数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!opts.forkSession) {
    // Cd back into the worktree the session was in when it last exited.
    // Done after restoreSessionMetadata (which caches the worktree state
    // from the transcript) so if the directory is gone we can override
    // the cache before adoptResumedSessionFile writes it.
    // 调用 restoreWorktreeForResume，触发共享工具此处需要的副作用。
    restoreWorktreeForResume(result.worktreeSession)

    // Point sessionFile at the resumed transcript and re-append metadata
    // now. resetSessionFilePointer above nulled it (so the old fresh-session
    // path doesn't leak), but that blocks reAppendSessionMetadata — which
    // bails on null — from running in the exit cleanup handler. For fork,
    // useLogMessages populates a *new* file via recordTranscript on REPL
    // mount; the normal lazy-materialize path is correct there.
    // 调用 adoptResumedSessionFile，触发共享工具此处需要的副作用。
    adoptResumedSessionFile()
  }

  // Restore context-collapse commit log + staged snapshot. The interactive
  // /resume path goes through restoreSessionStateFromLog (REPL.tsx); CLI
  // --continue/--resume goes through here instead. Called unconditionally
  // — see the restoreSessionStateFromLog callsite above for why.
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，共享工具执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 共享工具 session Restore在这里处理 `;(`，完成这一小步状态转换。
    ;(
      require('../services/contextCollapse/persist.js') as typeof import('../services/contextCollapse/persist.js')
    ).restoreFromEntries(
      result.contextCollapseCommits ?? [],
      result.contextCollapseSnapshot,
    )
    /* eslint-enable @typescript-eslint/no-require-imports */
  }

  // Restore agent setting from resumed session
  // 共享工具 session Restore先整理这一处局部数据，后续分支可以直接读取。
  const { agentDefinition: restoredAgent, agentType: resumedAgentType } =
    restoreAgentFromSession(
      result.agentSetting,
      context.mainThreadAgentDefinition,
      context.agentDefinitions,
    )

  // Persist the current mode so future resumes know what mode this session was in
  // 满足 `feature('COORDINATOR_MODE')` 时，共享工具执行该分支。
  if (feature('COORDINATOR_MODE')) {
    // 调用 saveMode，触发共享工具此处需要的副作用。
    saveMode(context.modeApi?.isCoordinatorMode() ? 'coordinator' : 'normal')
  }

  // Compute initial state before render (per CLAUDE.md guidelines)
  // restoredAttribution 命名 `opts.includeAttribution`，让后续代码直接表达这个值的用途。
  const restoredAttribution = opts.includeAttribution
    ? computeRestoredAttributionState(result)
    : undefined
  // standaloneAgentContext保存`computeStandaloneAgentContext`，供共享工具后续处理使用。
  const standaloneAgentContext = computeStandaloneAgentContext(
    result.agentName,
    result.agentColor,
  )
  // 显式忽略 `updateSessionName(result.agentName)` 的返回值，只保留它触发的副作用。
  void updateSessionName(result.agentName)
  // refreshedAgentDefs 集合保存`refreshAgentDefinitionsForModeSwitch`，供共享工具后续处理使用。
  const refreshedAgentDefs = await refreshAgentDefinitionsForModeSwitch(
    !!modeWarning,
    context.currentCwd,
    context.cliAgents,
    context.agentDefinitions,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    messages: result.messages,
    fileHistorySnapshots: result.fileHistorySnapshots,
    contentReplacements: result.contentReplacements,
    agentName: result.agentName,
    agentColor: (result.agentColor === 'default'
      ? undefined
      : result.agentColor) as AgentColorName | undefined,
    restoredAgentDef: restoredAgent,
    initialState: {
      ...context.initialState,
      ...(resumedAgentType && { agent: resumedAgentType }),
      ...(restoredAttribution && { attribution: restoredAttribution }),
      ...(standaloneAgentContext && { standaloneAgentContext }),
      agentDefinitions: refreshedAgentDefs,
    },
  }
}
