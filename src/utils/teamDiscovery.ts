/**
 * Team Discovery - Utilities for discovering teams and teammate status
 *
 * Scans ~/.claude/teams/ to find teams where the current session is the leader.
 * Used by the Teams UI in the footer to show team status.
 */

// 引入 isPaneBackend、PaneBackendType，将 ./swarm/backends/types.js 中已经封装好的能力接到本文件流程里。
import { isPaneBackend, type PaneBackendType } from './swarm/backends/types.js'
// 引入 readTeamFile，将 ./swarm/teamHelpers.js 中已经封装好的能力接到本文件流程里。
import { readTeamFile } from './swarm/teamHelpers.js'

// TeamSummary 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeamSummary = {
  name: string
  memberCount: number
  runningCount: number
  idleCount: number
}

// TeammateStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateStatus = {
  name: string
  agentId: string
  agentType?: string
  model?: string
  prompt?: string
  status: 'running' | 'idle' | 'unknown'
  color?: string
  idleSince?: string // ISO timestamp from idle notification
  tmuxPaneId: string
  cwd: string
  worktreePath?: string
  isHidden?: boolean // Whether the pane is currently hidden from the swarm view
  backendType?: PaneBackendType // The backend type used for this teammate
  mode?: string // Current permission mode for this teammate
}

/**
 * Get detailed teammate statuses for a team
 * Reads isActive from config to determine status
 */
// getTeammateStatuses 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeammateStatuses(teamName: string): TeammateStatus[] {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // hiddenPaneIds 集合保存`Set`，供共享工具后续处理使用。
  const hiddenPaneIds = new Set(teamFile.hiddenPaneIds ?? [])
  // statuses 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const statuses: TeammateStatus[] = []

  // 按顺序遍历 `teamFile.members` 中的member，逐个交给共享工具处理。
  for (const member of teamFile.members) {
    // Exclude team-lead from the list
    // 当 `member.name` 匹配 `'team-lead'` 时，共享工具执行对应分支。
    if (member.name === 'team-lead') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Read isActive from config, defaulting to true (active) if undefined
    // isActive标记共享工具 team Discovery是否启用对应路径。
    const isActive = member.isActive !== false
    // status 集合 命名 `isActive ? 'running' : 'idle'`，让后续代码直接表达这个值的用途。
    const status: 'running' | 'idle' = isActive ? 'running' : 'idle'

    // statuses 集合追加新条目，保持收集顺序与输入顺序一致。
    statuses.push({
      name: member.name,
      agentId: member.agentId,
      agentType: member.agentType,
      model: member.model,
      prompt: member.prompt,
      status,
      color: member.color,
      tmuxPaneId: member.tmuxPaneId,
      cwd: member.cwd,
      worktreePath: member.worktreePath,
      isHidden: hiddenPaneIds.has(member.tmuxPaneId),
      backendType:
        member.backendType && isPaneBackend(member.backendType)
          ? member.backendType
          : undefined,
      mode: member.mode,
    })
  }

  // 返回 `statuses`，作为共享工具这次计算的结果。
  return statuses
}

// Note: For time formatting, use formatRelativeTimeAgo from '../utils/format.js'
