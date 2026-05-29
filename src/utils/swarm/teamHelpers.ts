// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getSessionCreatedTeams，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionCreatedTeams } from '../../bootstrap/state.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getTeamsDir，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getTeamsDir } from '../envUtils.js'
// 引入 errorMessage、getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode } from '../errors.js'
// 引入 execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 gitExe，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { gitExe } from '../git.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 类型依赖 { PermissionMode } 来自 ../permissions/PermissionMode.js，用于校准共享工具的数据契约。
import type { PermissionMode } from '../permissions/PermissionMode.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 getTasksDir、notifyTasksUpdated，将 ../tasks.js 中已经封装好的能力接到本文件流程里。
import { getTasksDir, notifyTasksUpdated } from '../tasks.js'
// 引入 getAgentName、getTeamName、isTeammate，将 ../teammate.js 中已经封装好的能力接到本文件流程里。
import { getAgentName, getTeamName, isTeammate } from '../teammate.js'
// 引入 BackendType、isPaneBackend，将 ./backends/types.js 中已经封装好的能力接到本文件流程里。
import { type BackendType, isPaneBackend } from './backends/types.js'
// 引入 TEAM_LEAD_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TEAM_LEAD_NAME } from './constants.js'

// inputSchema保存`lazySchema`，供共享工具后续处理使用。
export const inputSchema = lazySchema(() =>
  z.strictObject({
    operation: z
      .enum(['spawnTeam', 'cleanup'])
      .describe(
        'Operation: spawnTeam to create a team, cleanup to remove team and task directories.',
      ),
    agent_type: z
      .string()
      .optional()
      .describe(
        'Type/role of the team lead (e.g., "researcher", "test-runner"). ' +
          'Used for team file and inter-agent coordination.',
      ),
    team_name: z
      .string()
      .optional()
      .describe('Name for the new team to create (required for spawnTeam).'),
    description: z
      .string()
      .optional()
      .describe('Team description/purpose (only used with spawnTeam).'),
  }),
)

// Output types for different operations
// SpawnTeamOutput 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SpawnTeamOutput = {
  team_name: string
  team_file_path: string
  lead_agent_id: string
}

// CleanupOutput 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CleanupOutput = {
  success: boolean
  message: string
  team_name?: string
}

// TeamAllowedPath 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeamAllowedPath = {
  path: string // Directory path (absolute)
  toolName: string // The tool this applies to (e.g., "Edit", "Write")
  addedBy: string // Agent name who added this rule
  addedAt: number // Timestamp when added
}

// TeamFile 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeamFile = {
  name: string
  description?: string
  createdAt: number
  leadAgentId: string
  leadSessionId?: string // Actual session UUID of the leader (for discovery)
  hiddenPaneIds?: string[] // Pane IDs that are currently hidden from the UI
  teamAllowedPaths?: TeamAllowedPath[] // Paths all teammates can edit without asking
  members: Array<{
    agentId: string
    name: string
    agentType?: string
    model?: string
    prompt?: string
    color?: string
    planModeRequired?: boolean
    joinedAt: number
    tmuxPaneId: string
    cwd: string
    worktreePath?: string
    sessionId?: string
    subscriptions: string[]
    backendType?: BackendType
    isActive?: boolean // false when idle, undefined/true when active
    mode?: PermissionMode // Current permission mode for this teammate
  }>
}

// Input 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<ReturnType<typeof inputSchema>>
// Export SpawnTeamOutput as Output for backward compatibility
// Output 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = SpawnTeamOutput

/**
 * Sanitizes a name for use in tmux window names, worktree paths, and file paths.
 * Replaces all non-alphanumeric characters with hyphens and lowercases.
 */
// sanitizeName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizeName(name: string): string {
  // 返回 `name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()`，作为共享工具这次计算的结果。
  return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
}

/**
 * Sanitizes an agent name for use in deterministic agent IDs.
 * Replaces @ with - to prevent ambiguity in the agentName@teamName format.
 */
// sanitizeAgentName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizeAgentName(name: string): string {
  // 返回 `name.replace(/@/g, '-')`，作为共享工具这次计算的结果。
  return name.replace(/@/g, '-')
}

/**
 * Gets the path to a team's directory
 */
// getTeamDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeamDir(teamName: string): string {
  // 返回 `join(getTeamsDir(), sanitizeName(teamName))`，作为共享工具这次计算的结果。
  return join(getTeamsDir(), sanitizeName(teamName))
}

/**
 * Gets the path to a team's config.json file
 */
// getTeamFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeamFilePath(teamName: string): string {
  // 返回 `join(getTeamDir(teamName), 'config.json')`，作为共享工具这次计算的结果。
  return join(getTeamDir(teamName), 'config.json')
}

/**
 * Reads a team file by name (sync — for sync contexts like React render paths)
 * @internal Exported for team discovery UI
 */
// sync IO: called from sync context
// readTeamFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function readTeamFile(teamName: string): TeamFile | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFileSync`，供共享工具后续处理使用。
    const content = readFileSync(getTeamFilePath(teamName), 'utf-8')
    // 返回 `jsonParse(content) as TeamFile`，作为共享工具这次计算的结果。
    return jsonParse(content) as TeamFile
  } catch (e) {
    // 当 `getErrnoCode(e)` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (getErrnoCode(e) === 'ENOENT') return null
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Failed to read team file for ${teamName}: ${errorMessage(e)}`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Reads a team file by name (async — for tool handlers and other async contexts)
 */
// readTeamFileAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readTeamFileAsync(
  teamName: string,
): Promise<TeamFile | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(getTeamFilePath(teamName), 'utf-8')
    // 返回 `jsonParse(content) as TeamFile`，作为共享工具这次计算的结果。
    return jsonParse(content) as TeamFile
  } catch (e) {
    // 当 `getErrnoCode(e)` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (getErrnoCode(e) === 'ENOENT') return null
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Failed to read team file for ${teamName}: ${errorMessage(e)}`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Writes a team file (sync — for sync contexts)
 */
// sync IO: called from sync context
// writeTeamFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writeTeamFile(teamName: string, teamFile: TeamFile): void {
  // teamDir读取`getTeamDir`，供共享工具后续处理使用。
  const teamDir = getTeamDir(teamName)
  // 调用 mkdirSync，触发共享工具此处需要的副作用。
  mkdirSync(teamDir, { recursive: true })
  // 调用 writeFileSync，触发共享工具此处需要的副作用。
  writeFileSync(getTeamFilePath(teamName), jsonStringify(teamFile, null, 2))
}

/**
 * Writes a team file (async — for tool handlers)
 */
// writeTeamFileAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeTeamFileAsync(
  teamName: string,
  teamFile: TeamFile,
): Promise<void> {
  // teamDir读取`getTeamDir`，供共享工具后续处理使用。
  const teamDir = getTeamDir(teamName)
  // 等待 `mkdir(teamDir, { recursive: true })` 完成，再继续共享工具 team Helpers的异步流程。
  await mkdir(teamDir, { recursive: true })
  // 等待 `writeFile(getTeamFilePath(teamName), jsonStringify(teamFile, null, 2))` 完成，再继续共享工具 team Helpers的异步流程。
  await writeFile(getTeamFilePath(teamName), jsonStringify(teamFile, null, 2))
}

/**
 * Removes a teammate from the team file by agent ID or name.
 * Used by the leader when processing shutdown approvals.
 */
// removeTeammateFromTeamFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeTeammateFromTeamFile(
  teamName: string,
  identifier: { agentId?: string; name?: string },
): boolean {
  // identifierStr标记共享工具 team Helpers是否启用对应路径。
  const identifierStr = identifier.agentId || identifier.name
  // identifierStr缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!identifierStr) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[TeammateTool] removeTeammateFromTeamFile called with no identifier',
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Cannot remove teammate ${identifierStr}: failed to read team file for "${teamName}"`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // originalLength 数量 命名 `teamFile.members.length`，让后续代码直接表达这个值的用途。
  const originalLength = teamFile.members.length
  // members 集合更新为 `teamFile.members.filter(m => {`，确保共享工具后续读取最新状态。
  teamFile.members = teamFile.members.filter(m => {
    // 只有 `identifier.agentId && m.agentId === identifier.agentId` 满足时，共享工具才执行该分支。
    if (identifier.agentId && m.agentId === identifier.agentId) return false
    // 只有 `identifier.name && m.name === identifier.name` 满足时，共享工具才执行该分支。
    if (identifier.name && m.name === identifier.name) return false
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  })

  // 满足 `teamFile.members.length === originalLength` 时，共享工具执行该分支。
  if (teamFile.members.length === originalLength) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Teammate ${identifierStr} not found in team file for "${teamName}"`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 调用 writeTeamFile，触发共享工具此处需要的副作用。
  writeTeamFile(teamName, teamFile)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateTool] Removed teammate from team file: ${identifierStr}`,
  )
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Adds a pane ID to the hidden panes list in the team file.
 * @param teamName - The name of the team
 * @param paneId - The pane ID to hide
 * @returns true if the pane was added to hidden list, false if team doesn't exist
 */
// addHiddenPaneId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addHiddenPaneId(teamName: string, paneId: string): boolean {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // hiddenPaneIds 集合 命名 `teamFile.hiddenPaneIds ?? []`，让后续代码直接表达这个值的用途。
  const hiddenPaneIds = teamFile.hiddenPaneIds ?? []
  // 满足 `!hiddenPaneIds.includes(paneId)` 时，共享工具执行该分支。
  if (!hiddenPaneIds.includes(paneId)) {
    // hiddenPaneIds 集合追加新条目，保持收集顺序与输入顺序一致。
    hiddenPaneIds.push(paneId)
    // hiddenPaneIds 集合更新为 `hiddenPaneIds`，确保共享工具后续读取最新状态。
    teamFile.hiddenPaneIds = hiddenPaneIds
    // 调用 writeTeamFile，触发共享工具此处需要的副作用。
    writeTeamFile(teamName, teamFile)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Added ${paneId} to hidden panes for team ${teamName}`,
    )
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Removes a pane ID from the hidden panes list in the team file.
 * @param teamName - The name of the team
 * @param paneId - The pane ID to show (remove from hidden list)
 * @returns true if the pane was removed from hidden list, false if team doesn't exist
 */
// removeHiddenPaneId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeHiddenPaneId(teamName: string, paneId: string): boolean {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // hiddenPaneIds 集合 命名 `teamFile.hiddenPaneIds ?? []`，让后续代码直接表达这个值的用途。
  const hiddenPaneIds = teamFile.hiddenPaneIds ?? []
  // index 索引保存`hiddenPaneIds.indexOf`，供共享工具后续处理使用。
  const index = hiddenPaneIds.indexOf(paneId)
  // `index` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (index !== -1) {
    // 调用 hiddenPaneIds.splice，触发共享工具此处需要的副作用。
    hiddenPaneIds.splice(index, 1)
    // hiddenPaneIds 集合更新为 `hiddenPaneIds`，确保共享工具后续读取最新状态。
    teamFile.hiddenPaneIds = hiddenPaneIds
    // 调用 writeTeamFile，触发共享工具此处需要的副作用。
    writeTeamFile(teamName, teamFile)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Removed ${paneId} from hidden panes for team ${teamName}`,
    )
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Removes a teammate from the team config file by pane ID.
 * Also removes from hiddenPaneIds if present.
 * @param teamName - The name of the team
 * @param tmuxPaneId - The pane ID of the teammate to remove
 * @returns true if the member was removed, false if team or member doesn't exist
 */
// removeMemberFromTeam 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeMemberFromTeam(
  teamName: string,
  tmuxPaneId: string,
): boolean {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // memberIndex 索引筛选`members.findIndex`，供共享工具后续处理使用。
  const memberIndex = teamFile.members.findIndex(
    // m更新为 `> m.tmuxPaneId === tmuxPaneId`，确保共享工具后续读取最新状态。
    m => m.tmuxPaneId === tmuxPaneId,
  )
  // 满足 `memberIndex === -1` 时，共享工具执行该分支。
  if (memberIndex === -1) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Remove from members array
  // 调用 teamFile.members.splice，触发共享工具此处需要的副作用。
  teamFile.members.splice(memberIndex, 1)

  // Also remove from hiddenPaneIds if present
  // 满足 `teamFile.hiddenPaneIds` 时，共享工具执行该分支。
  if (teamFile.hiddenPaneIds) {
    // hiddenIndex 索引保存`hiddenPaneIds.indexOf`，供共享工具后续处理使用。
    const hiddenIndex = teamFile.hiddenPaneIds.indexOf(tmuxPaneId)
    // `hiddenIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (hiddenIndex !== -1) {
      // 调用 teamFile.hiddenPaneIds.splice，触发共享工具此处需要的副作用。
      teamFile.hiddenPaneIds.splice(hiddenIndex, 1)
    }
  }

  // 调用 writeTeamFile，触发共享工具此处需要的副作用。
  writeTeamFile(teamName, teamFile)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateTool] Removed member with pane ${tmuxPaneId} from team ${teamName}`,
  )
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Removes a teammate from a team's member list by agent ID.
 * Use this for in-process teammates which all share the same tmuxPaneId.
 * @param teamName - The name of the team
 * @param agentId - The agent ID of the teammate to remove (e.g., "researcher@my-team")
 * @returns true if the member was removed, false if team or member doesn't exist
 */
// removeMemberByAgentId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeMemberByAgentId(
  teamName: string,
  agentId: string,
): boolean {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // memberIndex 索引筛选`members.findIndex`，供共享工具后续处理使用。
  const memberIndex = teamFile.members.findIndex(m => m.agentId === agentId)
  // 满足 `memberIndex === -1` 时，共享工具执行该分支。
  if (memberIndex === -1) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Remove from members array
  // 调用 teamFile.members.splice，触发共享工具此处需要的副作用。
  teamFile.members.splice(memberIndex, 1)

  // 调用 writeTeamFile，触发共享工具此处需要的副作用。
  writeTeamFile(teamName, teamFile)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateTool] Removed member ${agentId} from team ${teamName}`,
  )
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Sets a team member's permission mode.
 * Called when the team leader changes a teammate's mode via the TeamsDialog.
 * @param teamName - The name of the team
 * @param memberName - The name of the member to update
 * @param mode - The new permission mode
 */
// setMemberMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMemberMode(
  teamName: string,
  memberName: string,
  mode: PermissionMode,
): boolean {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // member筛选`members.find`，供共享工具后续处理使用。
  const member = teamFile.members.find(m => m.name === memberName)
  // member缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!member) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Cannot set member mode: member ${memberName} not found in team ${teamName}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Only write if the value is actually changing
  // 满足 `member.mode === mode` 时，共享工具执行该分支。
  if (member.mode === mode) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Create updated members array immutably
  // updatedMembers 集合派生`members.map`，供共享工具后续处理使用。
  const updatedMembers = teamFile.members.map(m =>
    m.name === memberName ? { ...m, mode } : m,
  )
  // 调用 writeTeamFile，触发共享工具此处需要的副作用。
  writeTeamFile(teamName, { ...teamFile, members: updatedMembers })
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateTool] Set member ${memberName} in team ${teamName} to mode: ${mode}`,
  )
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Sync the current teammate's mode to config.json so team lead sees it.
 * No-op if not running as a teammate.
 * @param mode - The permission mode to sync
 * @param teamNameOverride - Optional team name override (uses env var if not provided)
 */
// syncTeammateMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function syncTeammateMode(
  mode: PermissionMode,
  teamNameOverride?: string,
): void {
  // 满足 `!isTeammate()` 时，共享工具执行该分支。
  if (!isTeammate()) return
  // teamName读取`getTeamName`，供共享工具后续处理使用。
  const teamName = teamNameOverride ?? getTeamName()
  // agentName读取`getAgentName`，供共享工具后续处理使用。
  const agentName = getAgentName()
  // 只有 `teamName && agentName` 满足时，共享工具才执行该分支。
  if (teamName && agentName) {
    // setMemberMode 写入新的状态值，使共享工具后续读取保持一致。
    setMemberMode(teamName, agentName, mode)
  }
}

/**
 * Sets multiple team members' permission modes in a single atomic operation.
 * Avoids race conditions when updating multiple teammates at once.
 * @param teamName - The name of the team
 * @param modeUpdates - Array of {memberName, mode} to update
 */
// setMultipleMemberModes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMultipleMemberModes(
  teamName: string,
  modeUpdates: Array<{ memberName: string; mode: PermissionMode }>,
): boolean {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Build a map of updates for efficient lookup
  // updateMap保存`Map`，供共享工具后续处理使用。
  const updateMap = new Map(modeUpdates.map(u => [u.memberName, u.mode]))

  // Create updated members array immutably
  // anyChanged标记共享工具 team Helpers是否启用对应路径。
  let anyChanged = false
  // updatedMembers 集合派生`members.map`，供共享工具后续处理使用。
  const updatedMembers = teamFile.members.map(member => {
    // newMode读取`updateMap.get`，供共享工具后续处理使用。
    const newMode = updateMap.get(member.name)
    // `newMode` 与 `undefined && member.mode !== ne...` 不一致时刷新派生状态，避免使用过期结果。
    if (newMode !== undefined && member.mode !== newMode) {
      // anyChanged更新为 `true`，确保共享工具后续读取最新状态。
      anyChanged = true
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { ...member, mode: newMode }
    }
    // 返回 `member`，作为共享工具这次计算的结果。
    return member
  })

  // 满足 `anyChanged` 时，共享工具执行该分支。
  if (anyChanged) {
    // 调用 writeTeamFile，触发共享工具此处需要的副作用。
    writeTeamFile(teamName, { ...teamFile, members: updatedMembers })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Set ${modeUpdates.length} member modes in team ${teamName}`,
    )
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Sets a team member's active status.
 * Called when a teammate becomes idle (isActive=false) or starts a new turn (isActive=true).
 * @param teamName - The name of the team
 * @param memberName - The name of the member to update
 * @param isActive - Whether the member is active (true) or idle (false)
 */
// setMemberActive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setMemberActive(
  teamName: string,
  memberName: string,
  isActive: boolean,
): Promise<void> {
  // teamFile 文件数据读取`readTeamFileAsync`，供共享工具后续处理使用。
  const teamFile = await readTeamFileAsync(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Cannot set member active: team ${teamName} not found`,
    )
    // 共享工具 team Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // member筛选`members.find`，供共享工具后续处理使用。
  const member = teamFile.members.find(m => m.name === memberName)
  // member缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!member) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Cannot set member active: member ${memberName} not found in team ${teamName}`,
    )
    // 共享工具 team Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Only write if the value is actually changing
  // 满足 `member.isActive === isActive` 时，共享工具执行该分支。
  if (member.isActive === isActive) {
    // 共享工具 team Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // isActive更新为 `isActive`，确保共享工具后续读取最新状态。
  member.isActive = isActive
  // 等待 `writeTeamFileAsync(teamName, teamFile)` 完成，再继续共享工具 team Helpers的异步流程。
  await writeTeamFileAsync(teamName, teamFile)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateTool] Set member ${memberName} in team ${teamName} to ${isActive ? 'active' : 'idle'}`,
  )
}

/**
 * Destroys a git worktree at the given path.
 * First attempts to use `git worktree remove`, then falls back to rm -rf.
 * Safe to call on non-existent paths.
 */
// destroyWorktree 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function destroyWorktree(worktreePath: string): Promise<void> {
  // Read the .git file in the worktree to find the main repo
  // gitFilePath 路径数据格式化`join`，供共享工具后续处理使用。
  const gitFilePath = join(worktreePath, '.git')
  // mainRepoPath 路径数据 命名 `null`，让后续代码直接表达这个值的用途。
  let mainRepoPath: string | null = null

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // gitFileContent 文件数据读取`readFile`，供共享工具后续处理使用。
    const gitFileContent = (await readFile(gitFilePath, 'utf-8')).trim()
    // The .git file contains something like: gitdir: /path/to/repo/.git/worktrees/worktree-name
    // match匹配`gitFileContent.match`，供共享工具后续处理使用。
    const match = gitFileContent.match(/^gitdir:\s*(.+)$/)
    // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
    if (match && match[1]) {
      // Extract the main repo .git directory (go up from .git/worktrees/name to .git)
      // worktreeGitDir读取 `match[1]` 对应条目，后续围绕该成员继续处理。
      const worktreeGitDir = match[1]
      // Go up 2 levels from .git/worktrees/name to get to .git, then get parent for repo root
      // mainGitDir格式化`join`，供共享工具后续处理使用。
      const mainGitDir = join(worktreeGitDir, '..', '..')
      // mainRepoPath 路径数据更新为 `join(mainGitDir, '..')`，确保共享工具后续读取最新状态。
      mainRepoPath = join(mainGitDir, '..')
    }
  } catch {
    // Ignore errors reading .git file (path doesn't exist, not a file, etc.)
  }

  // Try to remove using git worktree remove command
  // 满足 `mainRepoPath` 时，共享工具执行该分支。
  if (mainRepoPath) {
    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      gitExe(),
      ['worktree', 'remove', '--force', worktreePath],
      { cwd: mainRepoPath },
    )

    // 满足 `result.code === 0` 时，共享工具执行该分支。
    if (result.code === 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateTool] Removed worktree via git: ${worktreePath}`,
      )
      // 共享工具 team Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check if the error is "not a working tree" (already removed)
    // 满足 `result.stderr?.includes('not a working tree')` 时，共享工具执行该分支。
    if (result.stderr?.includes('not a working tree')) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateTool] Worktree already removed: ${worktreePath}`,
      )
      // 共享工具 team Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] git worktree remove failed, falling back to rm: ${result.stderr}`,
    )
  }

  // Fallback: manually remove the directory
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rm(worktreePath, { recursive: true, force: true })` 完成，再继续共享工具 team Helpers的异步流程。
    await rm(worktreePath, { recursive: true, force: true })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Removed worktree directory manually: ${worktreePath}`,
    )
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Failed to remove worktree ${worktreePath}: ${errorMessage(error)}`,
    )
  }
}

/**
 * Mark a team as created this session so it gets cleaned up on exit.
 * Call this right after the initial writeTeamFile. TeamDelete should
 * call unregisterTeamForSessionCleanup to prevent double-cleanup.
 * Backing Set lives in bootstrap/state.ts so resetStateForTests()
 * clears it between tests (avoids the PR #17615 cross-shard leak class).
 */
// registerTeamForSessionCleanup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerTeamForSessionCleanup(teamName: string): void {
  // 调用 getSessionCreatedTeams，触发共享工具此处需要的副作用。
  getSessionCreatedTeams().add(teamName)
}

/**
 * Remove a team from session cleanup tracking (e.g., after explicit
 * TeamDelete — already cleaned, don't try again on shutdown).
 */
// unregisterTeamForSessionCleanup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unregisterTeamForSessionCleanup(teamName: string): void {
  // 调用 getSessionCreatedTeams，触发共享工具此处需要的副作用。
  getSessionCreatedTeams().delete(teamName)
}

/**
 * Clean up all teams created this session that weren't explicitly deleted.
 * Registered with gracefulShutdown from init.ts.
 */
// cleanupSessionTeams 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupSessionTeams(): Promise<void> {
  // sessionCreatedTeams 会话数据读取`getSessionCreatedTeams`，供共享工具后续处理使用。
  const sessionCreatedTeams = getSessionCreatedTeams()
  // 满足 `sessionCreatedTeams.size === 0` 时，共享工具执行该分支。
  if (sessionCreatedTeams.size === 0) return
  // teams 集合保存`Array.from`，供共享工具后续处理使用。
  const teams = Array.from(sessionCreatedTeams)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `cleanupSessionTeams: removing ${teams.length} orphan team dir(s): ${teams.join(', ')}`,
  )
  // Kill panes first — on SIGINT the teammate processes are still running;
  // deleting directories alone would orphan them in open tmux/iTerm2 panes.
  // (TeamDeleteTool's path doesn't need this — by then teammates have
  // gracefully exited and useInboxPoller has already closed their panes.)
  // 这个回调绑定到 await Promise.allSettled(teams.map(name => killOrphanedTeammatePanes(name)))，负责共享工具在该局部场景下的响应。
  await Promise.allSettled(teams.map(name => killOrphanedTeammatePanes(name)))
  // 这个回调绑定到 await Promise.allSettled(teams.map(name => cleanupTeamDirectories(name)))，负责共享工具在该局部场景下的响应。
  await Promise.allSettled(teams.map(name => cleanupTeamDirectories(name)))
  // 调用 sessionCreatedTeams.clear，触发共享工具此处需要的副作用。
  sessionCreatedTeams.clear()
}

/**
 * Best-effort kill of all pane-backed teammate panes for a team.
 * Called from cleanupSessionTeams on ungraceful leader exit (SIGINT/SIGTERM).
 * Dynamic imports avoid adding registry/detection to this module's static
 * dep graph — this only runs at shutdown, so the import cost is irrelevant.
 */
// killOrphanedTeammatePanes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function killOrphanedTeammatePanes(teamName: string): Promise<void> {
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) return

  // paneMembers 集合筛选`members.filter`，供共享工具后续处理使用。
  const paneMembers = teamFile.members.filter(
    // m更新为 `>`，确保共享工具后续读取最新状态。
    m =>
      m.name !== TEAM_LEAD_NAME &&
      m.tmuxPaneId &&
      m.backendType &&
      isPaneBackend(m.backendType),
  )
  // paneMembers 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (paneMembers.length === 0) return

  // 共享工具 team Helpers先整理这一处局部数据，后续分支可以直接读取。
  const [{ ensureBackendsRegistered, getBackendByType }, { isInsideTmux }] =
    await Promise.all([
      import('./backends/registry.js'),
      import('./backends/detection.js'),
    ])
  // 等待 `ensureBackendsRegistered()` 完成，再继续共享工具 team Helpers的异步流程。
  await ensureBackendsRegistered()
  // useExternalSession 会话数据保存`isInsideTmux`，供共享工具后续处理使用。
  const useExternalSession = !(await isInsideTmux())

  // 等待 `Promise.allSettled(` 完成，再继续共享工具 team Helpers的异步流程。
  await Promise.allSettled(
    // 调用 paneMembers.map，触发共享工具此处需要的副作用。
    paneMembers.map(async m => {
      // filter above guarantees these; narrow for the type system
      // 只有 `!m.tmuxPaneId || !m.backendType || !isPaneBackend(m.backendType)` 满足时，共享工具才执行该分支。
      if (!m.tmuxPaneId || !m.backendType || !isPaneBackend(m.backendType)) {
        // 共享工具 team Helpers在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // ok读取`getBackendByType`，供共享工具后续处理使用。
      const ok = await getBackendByType(m.backendType).killPane(
        m.tmuxPaneId,
        useExternalSession,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `cleanupSessionTeams: killPane ${m.name} (${m.backendType} ${m.tmuxPaneId}) → ${ok}`,
      )
    }),
  )
}

/**
 * Cleans up team and task directories for a given team name.
 * Also cleans up git worktrees created for teammates.
 * Called when a swarm session is terminated.
 */
// cleanupTeamDirectories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupTeamDirectories(teamName: string): Promise<void> {
  // sanitizedName保存`sanitizeName`，供共享工具后续处理使用。
  const sanitizedName = sanitizeName(teamName)

  // Read team file to get worktree paths BEFORE deleting the team directory
  // teamFile 文件数据读取`readTeamFile`，供共享工具后续处理使用。
  const teamFile = readTeamFile(teamName)
  // worktreePaths 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const worktreePaths: string[] = []
  // 满足 `teamFile` 时，共享工具执行该分支。
  if (teamFile) {
    // 按顺序遍历 `teamFile.members` 中的member，逐个交给共享工具处理。
    for (const member of teamFile.members) {
      // 满足 `member.worktreePath` 时，共享工具执行该分支。
      if (member.worktreePath) {
        // worktreePaths 路径数据追加新条目，保持收集顺序与输入顺序一致。
        worktreePaths.push(member.worktreePath)
      }
    }
  }

  // Clean up worktrees first
  // 按顺序遍历 `worktreePaths` 中的worktreePath 路径数据，逐个交给共享工具处理。
  for (const worktreePath of worktreePaths) {
    // 等待 `destroyWorktree(worktreePath)` 完成，再继续共享工具 team Helpers的异步流程。
    await destroyWorktree(worktreePath)
  }

  // Clean up team directory (~/.claude/teams/{team-name}/)
  // teamDir读取`getTeamDir`，供共享工具后续处理使用。
  const teamDir = getTeamDir(teamName)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rm(teamDir, { recursive: true, force: true })` 完成，再继续共享工具 team Helpers的异步流程。
    await rm(teamDir, { recursive: true, force: true })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateTool] Cleaned up team directory: ${teamDir}`)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Failed to clean up team directory ${teamDir}: ${errorMessage(error)}`,
    )
  }

  // Clean up tasks directory (~/.claude/tasks/{taskListId}/)
  // The leader and teammates all store tasks under the sanitized team name.
  // tasksDir读取`getTasksDir`，供共享工具后续处理使用。
  const tasksDir = getTasksDir(sanitizedName)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `rm(tasksDir, { recursive: true, force: true })` 完成，再继续共享工具 team Helpers的异步流程。
    await rm(tasksDir, { recursive: true, force: true })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateTool] Cleaned up tasks directory: ${tasksDir}`)
    // 调用 notifyTasksUpdated，触发共享工具此处需要的副作用。
    notifyTasksUpdated()
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateTool] Failed to clean up tasks directory ${tasksDir}: ${errorMessage(error)}`,
    )
  }
}
