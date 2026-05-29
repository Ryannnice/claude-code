/**
 * Swarm Initialization Hook
 *
 * Initializes swarm features: teammate hooks and context.
 * Handles both fresh spawns and resumed teammate sessions.
 *
 * This hook is conditionally loaded to allow dead code elimination when swarms are disabled.
 */

// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准React hook 状态流的数据契约。
import type { AppState } from '../state/AppState.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../utils/agentSwarmsEnabled.js'
// 复用 initializeTeammateContextFromSession 工具函数，把通用处理留在 ../utils/swarm/reconnection.js 中维护。
import { initializeTeammateContextFromSession } from '../utils/swarm/reconnection.js'
// 复用 readTeamFile 工具函数，把通用处理留在 ../utils/swarm/teamHelpers.js 中维护。
import { readTeamFile } from '../utils/swarm/teamHelpers.js'
// 复用 initializeTeammateHooks 工具函数，把通用处理留在 ../utils/swarm/teammateInit.js 中维护。
import { initializeTeammateHooks } from '../utils/swarm/teammateInit.js'
// 复用 getDynamicTeamContext 工具函数，把通用处理留在 ../utils/teammate.js 中维护。
import { getDynamicTeamContext } from '../utils/teammate.js'

// SetAppState 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppState = (f: (prevState: AppState) => AppState) => void

/**
 * Hook that initializes swarm features when ENABLE_AGENT_SWARMS is true.
 *
 * Handles both:
 * - Resumed teammate sessions (from --resume or /resume) where teamName/agentName
 *   are stored in transcript messages
 * - Fresh spawns where context is read from environment variables
 */
// useSwarmInitialization 封装useSwarmInitialization的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSwarmInitialization(
  setAppState: SetAppState,
  initialMessages: Message[] | undefined,
  { enabled = true }: { enabled?: boolean } = {},
): void {
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return
    // 满足 `isAgentSwarmsEnabled()` 时，React hook执行该分支。
    if (isAgentSwarmsEnabled()) {
      // Check if this is a resumed agent session (from --resume or /resume)
      // Resumed sessions have teamName/agentName stored in transcript messages
      // firstMessage 消息数据读取 `initialMessages?.[0]` 对应条目，后续围绕该成员继续处理。
      const firstMessage = initialMessages?.[0]
      // teamName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const teamName =
        firstMessage && 'teamName' in firstMessage
          ? (firstMessage.teamName as string | undefined)
          : undefined
      // agentName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const agentName =
        firstMessage && 'agentName' in firstMessage
          ? (firstMessage.agentName as string | undefined)
          : undefined

      // 组合条件 `teamName && agentName` 成立时，React hook 状态流才启用这条专门路径。
      if (teamName && agentName) {
        // Resumed agent session - set up team context from stored info
        // 调用 initializeTeammateContextFromSession，触发React hook此处需要的副作用。
        initializeTeammateContextFromSession(setAppState, teamName, agentName)

        // Get agentId from team file for hook initialization
        // teamFile 文件数据读取`readTeamFile`，供React hook后续处理使用。
        const teamFile = readTeamFile(teamName)
        // member筛选`members.find`，供React hook后续处理使用。
        const member = teamFile?.members.find(
          // 这个回调绑定到 (m: { name: string }) => m.name === agentName,，负责React hook 状态流在该局部场景下的响应。
          (m: { name: string }) => m.name === agentName,
        )
        // 满足 `member` 时，React hook执行该分支。
        if (member) {
          // 调用 initializeTeammateHooks，触发React hook此处需要的副作用。
          initializeTeammateHooks(setAppState, getSessionId(), {
            teamName,
            agentId: member.agentId,
            agentName,
          })
        }
      } else {
        // Fresh spawn or standalone session
        // teamContext is already computed in main.tsx via computeInitialTeamContext()
        // and included in initialState, so we only need to initialize hooks here
        // context 命名 `getDynamicTeamContext?.()`，让后续代码直接表达这个值的用途。
        const context = getDynamicTeamContext?.()
        // 组合条件 `context?.teamName && context?.agentId && context?` 成立时，React hook 状态流才启用这条专门路径。
        if (context?.teamName && context?.agentId && context?.agentName) {
          // 调用 initializeTeammateHooks，触发React hook此处需要的副作用。
          initializeTeammateHooks(setAppState, getSessionId(), {
            teamName: context.teamName,
            agentId: context.agentId,
            agentName: context.agentName,
          })
        }
      }
    }
  }, [setAppState, initialMessages, enabled])
}
