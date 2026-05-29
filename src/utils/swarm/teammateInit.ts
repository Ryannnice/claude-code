/**
 * Teammate Initialization Module
 *
 * Handles initialization for Claude Code instances running as teammates in a swarm.
 * Registers a Stop hook to notify the team leader when the teammate becomes idle.
 */

// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../../state/AppState.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 addFunctionHook，将 ../hooks/sessionHooks.js 中已经封装好的能力接到本文件流程里。
import { addFunctionHook } from '../hooks/sessionHooks.js'
// 引入 applyPermissionUpdate，将 ../permissions/PermissionUpdate.js 中已经封装好的能力接到本文件流程里。
import { applyPermissionUpdate } from '../permissions/PermissionUpdate.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 getTeammateColor，将 ../teammate.js 中已经封装好的能力接到本文件流程里。
import { getTeammateColor } from '../teammate.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createIdleNotification,
  getLastPeerDmSummary,
  writeToMailbox,
} from '../teammateMailbox.js'
// 引入 readTeamFile、setMemberActive，将 ./teamHelpers.js 中已经封装好的能力接到本文件流程里。
import { readTeamFile, setMemberActive } from './teamHelpers.js'

/**
 * Initializes hooks for a teammate running in a swarm.
 * Should be called early in session startup after AppState is available.
 *
 * Registers a Stop hook that sends an idle notification to the team leader
 * when this teammate's session stops.
 */
// initializeTeammateHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeTeammateHooks(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  teamInfo: { teamName: string; agentId: string; agentName: string },
): void {
  // 从 `teamInfo` 解构 teamName、agentId、agentName，减少共享工具 teammate Init对同一对象的重复访问。
  const { teamName, agentId, agentName } = teamInfo

  // Read team file to get leader ID
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateInit] Team file not found for team: ${teamName}`)
    // 共享工具 teammate Init在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // leadAgentId 命名 `teamFile.leadAgentId`，让后续代码直接表达这个值的用途。
  const leadAgentId = teamFile.leadAgentId

  // Apply team-wide allowed paths if any exist
  // 只有 `teamFile.teamAllowedPaths && teamFile.teamAllowed` 满足时，共享工具才执行该分支。
  if (teamFile.teamAllowedPaths && teamFile.teamAllowedPaths.length > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateInit] Found ${teamFile.teamAllowedPaths.length} team-wide allowed path(s)`,
    )

    // 按顺序遍历 `teamFile.teamAllowedPaths` 中的allowedPath 路径数据，逐个交给共享工具处理。
    for (const allowedPath of teamFile.teamAllowedPaths) {
      // For absolute paths (starting with /), prepend one / to create //path/** pattern
      // For relative paths, just use path/**
      // ruleContent保存`path.startsWith`，供共享工具后续处理使用。
      const ruleContent = allowedPath.path.startsWith('/')
        ? `/${allowedPath.path}/**`
        : `${allowedPath.path}/**`

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateInit] Applying team permission: ${allowedPath.toolName} allowed in ${allowedPath.path} (rule: ${ruleContent})`,
      )

      // setAppState 写入新的状态值，使共享工具后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        toolPermissionContext: applyPermissionUpdate(
          prev.toolPermissionContext,
          {
            type: 'addRules',
            rules: [
              {
                toolName: allowedPath.toolName,
                ruleContent,
              },
            ],
            behavior: 'allow',
            destination: 'session',
          },
        ),
      }))
    }
  }

  // Find the leader's name from the members array
  // leadMember筛选`members.find`，供共享工具后续处理使用。
  const leadMember = teamFile.members.find(m => m.agentId === leadAgentId)
  // leadAgentName标记共享工具 teammate Init是否启用对应路径。
  const leadAgentName = leadMember?.name || 'team-lead'

  // Don't register hook if this agent is the leader
  // 满足 `agentId === leadAgentId` 时，共享工具执行该分支。
  if (agentId === leadAgentId) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[TeammateInit] This agent is the team leader - skipping idle notification hook',
    )
    // 共享工具 teammate Init在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateInit] Registering Stop hook for teammate ${agentName} to notify leader ${leadAgentName}`,
  )

  // Register Stop hook to notify leader when this teammate stops
  // 调用 addFunctionHook，触发共享工具此处需要的副作用。
  addFunctionHook(
    setAppState,
    sessionId,
    'Stop',
    '', // No matcher - applies to all Stop events
    // 调用 async，触发共享工具此处需要的副作用。
    async (messages, _signal) => {
      // Mark this teammate as idle in the team config (fire and forget)
      // 显式忽略 `setMemberActive(teamName, agentName, false)` 的返回值，只保留它触发的副作用。
      void setMemberActive(teamName, agentName, false)

      // Send idle notification to the team leader using agent name (not UUID)
      // Must await to ensure the write completes before process shutdown
      // notification构建`createIdleNotification`，供共享工具后续处理使用。
      const notification = createIdleNotification(agentName, {
        idleReason: 'available',
        summary: getLastPeerDmSummary(messages),
      })
      // 等待 `writeToMailbox(leadAgentName, {` 完成，再继续共享工具 teammate Init的异步流程。
      await writeToMailbox(leadAgentName, {
        from: agentName,
        text: jsonStringify(notification),
        timestamp: new Date().toISOString(),
        color: getTeammateColor(),
      })
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateInit] Sent idle notification to leader ${leadAgentName}`,
      )
      // 返回 `true // Don't block the Stop`，作为共享工具这次计算的结果。
      return true // Don't block the Stop
    },
    'Failed to send idle notification to team leader',
    {
      timeout: 10000,
    },
  )
}
