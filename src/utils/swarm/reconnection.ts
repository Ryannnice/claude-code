/**
 * Swarm Reconnection Module
 *
 * Handles initialization of swarm context for teammates.
 * - Fresh spawns: Initialize from CLI args (set in main.tsx via dynamicTeamContext)
 * - Resumed sessions: Initialize from teamName/agentName stored in the transcript
 */

// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../../state/AppState.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getDynamicTeamContext，将 ../teammate.js 中已经封装好的能力接到本文件流程里。
import { getDynamicTeamContext } from '../teammate.js'
// 引入 getTeamFilePath、readTeamFile，将 ./teamHelpers.js 中已经封装好的能力接到本文件流程里。
import { getTeamFilePath, readTeamFile } from './teamHelpers.js'

/**
 * Computes the initial teamContext for AppState.
 *
 * This is called synchronously in main.tsx to compute the teamContext
 * BEFORE the first render, eliminating the need for useEffect workarounds.
 *
 * @returns The teamContext object to include in initialState, or undefined if not a teammate
 */
// computeInitialTeamContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeInitialTeamContext():
  | AppState['teamContext']
  | undefined {
  // dynamicTeamContext is set in main.tsx from CLI args
  // 上下文读取`getDynamicTeamContext`，供共享工具后续处理使用。
  const context = getDynamicTeamContext()

  // 只有 `!context?.teamName || !context?.agentName` 满足时，共享工具才执行该分支。
  if (!context?.teamName || !context?.agentName) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[Reconnection] computeInitialTeamContext: No teammate context set (not a teammate)',
    )
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 从 `context` 解构 teamName、agentId、agentName，减少共享工具 reconnection对同一对象的重复访问。
  const { teamName, agentId, agentName } = context

  // Read team file to get lead agent ID
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `[computeInitialTeamContext] Could not read team file for ${teamName}`,
      ),
    )
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // teamFilePath 路径数据读取`getTeamFilePath`，供共享工具后续处理使用。
  const teamFilePath = getTeamFilePath(teamName)

  // isLeader标记共享工具 reconnection是否启用对应路径。
  const isLeader = !agentId

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[Reconnection] Computed initial team context for ${isLeader ? 'leader' : `teammate ${agentName}`} in team ${teamName}`,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    teamName,
    teamFilePath,
    leadAgentId: teamFile.leadAgentId,
    selfAgentId: agentId,
    selfAgentName: agentName,
    isLeader,
    teammates: {},
  }
}

/**
 * Initialize teammate context from a resumed session.
 *
 * This is called when resuming a session that has teamName/agentName stored
 * in the transcript. It sets up teamContext in AppState so that heartbeat
 * and other swarm features work correctly.
 */
// initializeTeammateContextFromSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeTeammateContextFromSession(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  teamName: string,
  agentName: string,
): void {
  // Read team file to get lead agent ID
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `[initializeTeammateContextFromSession] Could not read team file for ${teamName} (agent: ${agentName})`,
      ),
    )
    // 共享工具 reconnection在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Find the member in the team file to get their agentId
  // member筛选`members.find`，供共享工具后续处理使用。
  const member = teamFile.members.find(m => m.name === agentName)
  // member缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!member) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Reconnection] Member ${agentName} not found in team ${teamName} - may have been removed`,
    )
  }
  // agentId保存`member?.agentId`，供后续判断或组装使用。
  const agentId = member?.agentId

  // teamFilePath 路径数据读取`getTeamFilePath`，供共享工具后续处理使用。
  const teamFilePath = getTeamFilePath(teamName)

  // Set teamContext in AppState
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => ({
    ...prev,
    teamContext: {
      teamName,
      teamFilePath,
      leadAgentId: teamFile.leadAgentId,
      selfAgentId: agentId,
      selfAgentName: agentName,
      isLeader: false,
      teammates: {},
    },
  }))

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[Reconnection] Initialized agent context from session for ${agentName} in team ${teamName}`,
  )
}
