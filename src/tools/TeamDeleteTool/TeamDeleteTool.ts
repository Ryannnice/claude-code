// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../../services/analytics/metadata.js，用于校准工具调用的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/metadata.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 TEAM_LEAD_NAME 工具函数，把通用处理留在 ../../utils/swarm/constants.js 中维护。
import { TEAM_LEAD_NAME } from '../../utils/swarm/constants.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  cleanupTeamDirectories,
  readTeamFile,
  unregisterTeamForSessionCleanup,
} from '../../utils/swarm/teamHelpers.js'
// 复用 clearTeammateColors 工具函数，把通用处理留在 ../../utils/swarm/teammateLayoutManager.js 中维护。
import { clearTeammateColors } from '../../utils/swarm/teammateLayoutManager.js'
// 复用 clearLeaderTeamName 工具函数，把通用处理留在 ../../utils/tasks.js 中维护。
import { clearLeaderTeamName } from '../../utils/tasks.js'
// 引入 TEAM_DELETE_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TEAM_DELETE_TOOL_NAME } from './constants.js'
// 引入 getPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getPrompt } from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => z.strictObject({}))
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = {
  success: boolean
  message: string
  team_name?: string
}

// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<InputSchema>

// TeamDeleteTool 命名 `buildTool({`，让后续代码直接表达这个值的用途。
export const TeamDeleteTool: Tool<InputSchema, Output> = buildTool({
  name: TEAM_DELETE_TOOL_NAME,
  searchHint: 'disband a swarm team and clean up',
  maxResultSizeChars: 100_000,
  shouldDefer: true,

  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  },

  // 工具实现 Team Delete Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },

  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `isAgentSwarmsEnabled()`，作为工具调用这次计算的结果。
    return isAgentSwarmsEnabled()
  },

  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Clean up team and task directories when the swarm is complete'`，作为工具调用这次计算的结果。
    return 'Clean up team and task directories when the swarm is complete'
  },

  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `getPrompt()`，作为工具调用这次计算的结果。
    return getPrompt()
  },

  // mapToolResultToToolResultBlockParam 使用 data, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: [
        {
          type: 'text' as const,
          text: jsonStringify(data),
        },
      ],
    }
  },

  // call 使用 _input, context 完成工具调用里的对应操作。
  async call(_input, context) {
    // 从 `context` 解构 setAppState、getAppState，减少工具实现 Team Delete Tool对同一对象的重复访问。
    const { setAppState, getAppState } = context
    // appState 状态读取`getAppState`，供工具调用后续处理使用。
    const appState = getAppState()
    // teamName 命名 `appState.teamContext?.teamName`，让后续代码直接表达这个值的用途。
    const teamName = appState.teamContext?.teamName

    // 满足 `teamName` 时，工具调用执行该分支。
    if (teamName) {
      // Read team config to check for active members
      // teamFile 文件数据读取`readTeamFile`，供工具调用后续处理使用。
      const teamFile = readTeamFile(teamName)
      // 满足 `teamFile` 时，工具调用执行该分支。
      if (teamFile) {
        // Filter out the team lead - only count non-lead members
        // nonLeadMembers 集合筛选`members.filter`，供工具调用后续处理使用。
        const nonLeadMembers = teamFile.members.filter(
          // m更新为 `> m.name !== TEAM_LEAD_NAME`，确保工具调用后续读取最新状态。
          m => m.name !== TEAM_LEAD_NAME,
        )

        // Separate truly active members from idle/dead ones
        // Members with isActive === false are idle (finished their turn or crashed)
        // activeMembers 集合筛选`nonLeadMembers.filter`，供工具调用后续处理使用。
        const activeMembers = nonLeadMembers.filter(m => m.isActive !== false)

        // 满足 `activeMembers.length > 0` 时，工具调用执行该分支。
        if (activeMembers.length > 0) {
          // memberNames 集合派生`activeMembers.map`，供工具调用后续处理使用。
          const memberNames = activeMembers.map(m => m.name).join(', ')
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            data: {
              success: false,
              message: `Cannot cleanup team with ${activeMembers.length} active member(s): ${memberNames}. Use requestShutdown to gracefully terminate teammates first.`,
              team_name: teamName,
            },
          }
        }
      }

      // 等待 `cleanupTeamDirectories(teamName)` 完成，再继续工具实现 Team Delete Tool的异步流程。
      await cleanupTeamDirectories(teamName)
      // Already cleaned — don't try again on gracefulShutdown.
      // 调用 unregisterTeamForSessionCleanup，触发工具调用此处需要的副作用。
      unregisterTeamForSessionCleanup(teamName)

      // Clear color assignments so new teams start fresh
      // 调用 clearTeammateColors，触发工具调用此处需要的副作用。
      clearTeammateColors()

      // Clear leader team name so getTaskListId() falls back to session ID
      // 调用 clearLeaderTeamName，触发工具调用此处需要的副作用。
      clearLeaderTeamName()

      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_team_deleted', {
        team_name:
          teamName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
    }

    // Clear team context and inbox from app state
    // setAppState 写入新的状态值，使工具调用后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      teamContext: undefined,
      inbox: {
        messages: [], // Clear any queued messages
      },
    }))

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        success: true,
        message: teamName
          ? `Cleaned up directories and worktrees for team "${teamName}"`
          : 'No team name found, nothing to clean up',
        team_name: teamName,
      },
    }
  },

  renderToolUseMessage,
  renderToolResultMessage,
} satisfies ToolDef<InputSchema, Output>)
